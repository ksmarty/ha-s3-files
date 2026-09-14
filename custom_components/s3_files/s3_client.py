"""A thin async wrapper around boto3.

boto3 is synchronous, so every call is pushed onto Home Assistant's executor.
The client is created lazily inside that thread and reused.

Nothing here decides *whether* an action is allowed — that is the caller's job
(see ``permissions.py`` and ``services.py``). This module only enforces the
folder scope, because that guarantee should hold at the last possible moment.
"""

from __future__ import annotations

import logging
from collections.abc import Callable
from dataclasses import dataclass
from datetime import datetime
from typing import Any

from .errors import S3FilesError
from .paths import PathError, normalize_folder, normalize_prefix, resolve_key, to_relative

_LOGGER = logging.getLogger(__name__)

_CONNECT_TIMEOUT = 10
_READ_TIMEOUT = 30
_MAX_ATTEMPTS = 3

# ClientError codes that mean "the server rejected our credentials" rather
# than "the object is missing" or "you may not do that".
_AUTH_ERROR_CODES = frozenset(
    {"InvalidAccessKeyId", "SignatureDoesNotMatch", "InvalidToken", "ExpiredToken"}
)
_MISSING_CODES = frozenset({"NoSuchKey", "404", "NotFound"})
_DENIED_CODES = frozenset({"AccessDenied", "403", "AllAccessDisabled"})


@dataclass(frozen=True)
class S3Config:
    """Everything needed to reach a bucket, plus the folder scope."""

    endpoint_url: str
    access_key_id: str
    secret_access_key: str
    region: str
    bucket: str
    path_style: bool
    verify_ssl: bool
    root_prefix: str

    @classmethod
    def from_options(cls, options: dict[str, Any]) -> S3Config:
        from .const import (
            CONF_ACCESS_KEY_ID,
            CONF_BUCKET,
            CONF_ENDPOINT_URL,
            CONF_PATH_STYLE,
            CONF_REGION,
            CONF_ROOT_PREFIX,
            CONF_SECRET_ACCESS_KEY,
            CONF_VERIFY_SSL,
            DEFAULT_PATH_STYLE,
            DEFAULT_REGION,
            DEFAULT_VERIFY_SSL,
        )

        endpoint = str(options.get(CONF_ENDPOINT_URL) or "").strip().rstrip("/")
        if endpoint and "://" not in endpoint:
            # Accept "minio.local:9000" as well as "https://minio.local:9000".
            endpoint = f"https://{endpoint}"

        return cls(
            endpoint_url=endpoint,
            access_key_id=str(options.get(CONF_ACCESS_KEY_ID) or "").strip(),
            secret_access_key=str(options.get(CONF_SECRET_ACCESS_KEY) or ""),
            region=str(options.get(CONF_REGION) or DEFAULT_REGION).strip()
            or DEFAULT_REGION,
            bucket=str(options.get(CONF_BUCKET) or "").strip(),
            path_style=bool(options.get(CONF_PATH_STYLE, DEFAULT_PATH_STYLE)),
            verify_ssl=bool(options.get(CONF_VERIFY_SSL, DEFAULT_VERIFY_SSL)),
            root_prefix=normalize_prefixed(options.get(CONF_ROOT_PREFIX)),
        )

    def redacted(self) -> dict[str, Any]:
        """Connection details safe to log or hand to diagnostics."""
        return {
            "endpoint_url": self.endpoint_url or "(AWS default)",
            "access_key_id": _redact(self.access_key_id),
            "secret_access_key": "**REDACTED**" if self.secret_access_key else "",
            "region": self.region,
            "bucket": self.bucket,
            "path_style": self.path_style,
            "verify_ssl": self.verify_ssl,
            "root_prefix": self.root_prefix,
        }


def normalize_prefixed(value: Any) -> str:
    """Normalise the stored root prefix, tolerating a bad stored value."""
    try:
        return normalize_prefix(value)
    except PathError:
        # A prefix containing '..' should never have been stored; fall back to
        # the safest scope rather than crashing setup.
        _LOGGER.warning("Ignoring invalid root folder %r; using the bucket root", value)
        return ""


def _redact(value: str) -> str:
    """Show enough of an access key id to identify it, but not all of it."""
    if not value:
        return ""
    if len(value) <= 8:
        return "**REDACTED**"
    return f"{value[:4]}...{value[-2:]}"


def _translate(err: Exception, action: str) -> S3FilesError:
    """Turn a boto3 exception into something worth showing a user."""
    from botocore.exceptions import (
        ClientError,
        ConnectionError as BotocoreConnectionError,
        EndpointConnectionError,
        NoCredentialsError,
        SSLError,
    )

    if isinstance(err, ClientError):
        code = str(err.response.get("Error", {}).get("Code", ""))
        status = str(err.response.get("ResponseMetadata", {}).get("HTTPStatusCode", ""))
        if code in _AUTH_ERROR_CODES:
            return S3FilesError(
                "The S3 endpoint rejected the access key or secret. Check the "
                "credentials in the integration options.",
                code="auth",
            )
        if code in _DENIED_CODES or status == "403":
            return S3FilesError(
                f"The S3 credentials are not allowed to {action}. Check the "
                "permissions on the bucket.",
                code="denied",
            )
        if code == "NoSuchBucket":
            return S3FilesError(
                "That bucket does not exist on the S3 endpoint. Check the "
                "bucket name in the integration options.",
                code="no_bucket",
            )
        if code in _MISSING_CODES or status == "404":
            return S3FilesError(
                f"There is nothing to {action}: it was not found.",
                code="not_found",
            )
        message = err.response.get("Error", {}).get("Message") or code or str(err)
        return S3FilesError(f"Could not {action}: {message}")

    if isinstance(err, (NoCredentialsError,)):
        return S3FilesError("No S3 credentials are configured.", code="auth")

    if isinstance(err, (EndpointConnectionError, BotocoreConnectionError, SSLError)):
        return S3FilesError(
            f"Could not reach the S3 endpoint to {action}. Check the endpoint "
            "URL and that Home Assistant can reach it.",
            code="connect",
        )

    return S3FilesError(f"Could not {action}: {err}")


class S3FilesClient:
    """Bucket operations, scoped to the configured root folder."""

    def __init__(self, hass: Any, config: S3Config) -> None:
        self._hass = hass
        self._config = config
        self._client: Any = None

    @property
    def config(self) -> S3Config:
        return self._config

    # -- plumbing ----------------------------------------------------------

    def _build_client(self) -> Any:
        """Create the boto3 client. Runs inside the executor."""
        import boto3
        from botocore.config import Config

        addressing = "path" if self._config.path_style else "virtual"
        return boto3.client(
            "s3",
            endpoint_url=self._config.endpoint_url or None,
            aws_access_key_id=self._config.access_key_id or None,
            aws_secret_access_key=self._config.secret_access_key or None,
            region_name=self._config.region,
            verify=self._config.verify_ssl,
            config=Config(
                signature_version="s3v4",
                s3={"addressing_style": addressing},
                connect_timeout=_CONNECT_TIMEOUT,
                read_timeout=_READ_TIMEOUT,
                retries={"max_attempts": _MAX_ATTEMPTS, "mode": "standard"},
            ),
        )

    def _get_client(self) -> Any:
        if self._client is None:
            self._client = self._build_client()
        return self._client

    async def _run(self, action: str, func: Callable[[Any], Any]) -> Any:
        """Run a blocking boto3 call, translating failures."""

        def _call() -> Any:
            try:
                return func(self._get_client())
            except S3FilesError:
                raise
            except PathError as err:
                raise S3FilesError(str(err)) from err
            except Exception as err:  # noqa: BLE001 - everything is translated
                raise _translate(err, action) from err

        return await self._hass.async_add_executor_job(_call)

    def _key(
        self, path: str | None, *, folder: bool = False, allow_root: bool = False
    ) -> str:
        """Resolve a scope relative path, raising an S3FilesError."""
        try:
            return resolve_key(
                self._config.root_prefix, path, folder=folder, allow_root=allow_root
            )
        except PathError as err:
            raise S3FilesError(str(err)) from err

    def _relative(self, key: str) -> str:
        return to_relative(self._config.root_prefix, key)

    # -- operations --------------------------------------------------------

    async def async_check(self) -> dict[str, Any]:
        """Verify the credentials and bucket. Used when saving the options."""

        def _head(client: Any) -> Any:
            client.head_bucket(Bucket=self._config.bucket)
            return {"bucket": self._config.bucket}

        try:
            return await self._run("reach the bucket", _head)
        except S3FilesError as err:
            if err.code == "not_found":
                # A 404 from HeadBucket can only mean the bucket is missing:
                # there is no object involved in the call.
                raise S3FilesError(
                    f"There is no bucket called '{self._config.bucket}' on that "
                    "endpoint.",
                    code="no_bucket",
                ) from err
            raise

    async def async_list(
        self,
        path: str | None = None,
        *,
        recursive: bool = False,
        max_results: int = 100,
    ) -> list[dict[str, Any]]:
        """List files and folders under a path."""
        # allow_root: listing needs the bucket root to be addressable when no
        # root folder is configured.
        prefix = self._key(path, folder=True, allow_root=True)
        bucket = self._config.bucket

        def _list(client: Any) -> list[dict[str, Any]]:
            entries: list[dict[str, Any]] = []
            paginator = client.get_paginator("list_objects_v2")
            kwargs: dict[str, Any] = {"Bucket": bucket, "Prefix": prefix}
            if not recursive:
                kwargs["Delimiter"] = "/"

            for page in paginator.paginate(**kwargs):
                for item in page.get("CommonPrefixes", []):
                    entries.append(
                        {
                            "path": self._relative(item["Prefix"]).rstrip("/"),
                            "name": item["Prefix"].rstrip("/").rsplit("/", 1)[-1],
                            "is_folder": True,
                            "size": None,
                            "last_modified": None,
                        }
                    )
                for item in page.get("Contents", []):
                    if item["Key"] == prefix:
                        # The folder marker for the folder being listed.
                        continue
                    entries.append(
                        {
                            "path": self._relative(item["Key"]),
                            "name": item["Key"].rsplit("/", 1)[-1],
                            "is_folder": False,
                            "size": int(item.get("Size", 0)),
                            "last_modified": _iso(item.get("LastModified")),
                        }
                    )
                if len(entries) >= max_results:
                    break

            entries.sort(key=lambda entry: (not entry["is_folder"], entry["path"]))
            return entries[:max_results]

        return await self._run("list files", _list)

    async def async_read(self, path: str, *, max_bytes: int) -> dict[str, Any]:
        """Download a file, truncating at ``max_bytes``."""
        key = self._key(path)
        bucket = self._config.bucket

        def _read(client: Any) -> dict[str, Any]:
            response = client.get_object(Bucket=bucket, Key=key)
            body = response["Body"]
            try:
                data = body.read(max_bytes)
            finally:
                body.close()

            size = int(response.get("ContentLength", len(data)))
            return {
                "path": path,
                "data": data,
                "size": size,
                "truncated": size > len(data),
                "content_type": response.get("ContentType"),
                "last_modified": _iso(response.get("LastModified")),
            }

        return await self._run("read the file", _read)

    async def async_write(
        self,
        path: str,
        data: bytes,
        *,
        content_type: str | None,
        overwrite: bool,
    ) -> dict[str, Any]:
        """Upload a file, optionally refusing to replace an existing one."""
        key = self._key(path)
        bucket = self._config.bucket

        def _write(client: Any) -> dict[str, Any]:
            if not overwrite:
                try:
                    client.head_object(Bucket=bucket, Key=key)
                except Exception as err:  # noqa: BLE001
                    if not _is_missing(err):
                        raise
                else:
                    raise S3FilesError(
                        f"{path} already exists. Pass overwrite to replace it."
                    )

            kwargs: dict[str, Any] = {"Bucket": bucket, "Key": key, "Body": data}
            if content_type:
                kwargs["ContentType"] = content_type
            client.put_object(**kwargs)
            return {"path": path, "size": len(data), "created": True}

        return await self._run("write the file", _write)

    async def async_delete(self, path: str) -> dict[str, Any]:
        """Delete a file."""
        key = self._key(path)
        bucket = self._config.bucket

        def _delete(client: Any) -> dict[str, Any]:
            client.delete_object(Bucket=bucket, Key=key)
            return {"path": path, "deleted": True}

        return await self._run("delete the file", _delete)

    async def async_move(
        self, source: str, destination: str, *, overwrite: bool
    ) -> dict[str, Any]:
        """Copy a file and remove the original."""
        source_key = self._key(source)
        destination_key = self._key(destination)
        bucket = self._config.bucket

        def _move(client: Any) -> dict[str, Any]:
            if not overwrite:
                try:
                    client.head_object(Bucket=bucket, Key=destination_key)
                except Exception as err:  # noqa: BLE001
                    if not _is_missing(err):
                        raise
                else:
                    raise S3FilesError(
                        f"{destination} already exists. Pass overwrite to replace it."
                    )

            client.copy_object(
                Bucket=bucket,
                CopySource={"Bucket": bucket, "Key": source_key},
                Key=destination_key,
            )
            client.delete_object(Bucket=bucket, Key=source_key)
            return {"path": destination, "moved_from": source, "moved": True}

        return await self._run("move the file", _move)

    async def async_create_folder(self, path: str) -> dict[str, Any]:
        """Create a folder marker object.

        S3 has no real folders; a zero byte object whose key ends in ``/`` is
        what every console and client displays as one.
        """
        key = self._key(path, folder=True)
        if not key.endswith("/"):
            key = f"{key}/"
        bucket = self._config.bucket

        def _mkdir(client: Any) -> dict[str, Any]:
            client.put_object(Bucket=bucket, Key=key, Body=b"")
            return {"path": key.rstrip("/"), "created": True}

        return await self._run("create the folder", _mkdir)


def _is_missing(err: Exception) -> bool:
    """Whether a boto3 exception means 'no such object'."""
    from botocore.exceptions import ClientError

    if not isinstance(err, ClientError):
        return False
    code = str(err.response.get("Error", {}).get("Code", ""))
    status = str(err.response.get("ResponseMetadata", {}).get("HTTPStatusCode", ""))
    return code in _MISSING_CODES or status == "404"


def _iso(value: Any) -> str | None:
    """Render a datetime from boto3 as an ISO string."""
    if isinstance(value, datetime):
        return value.isoformat()
    return None


def scope_prefix(config: S3Config) -> str:
    """The listing prefix for the scope root (used by diagnostics/tests)."""
    return normalize_folder(config.root_prefix)
