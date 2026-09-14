"""Service definitions for S3 Files.

A service is only registered when its permission is switched on, so the
service list itself reflects what the integration is allowed to do. Each
handler checks the permission again before acting: registration can be stale
(an automation that outlived an options change) but the check cannot.
"""

from __future__ import annotations

import base64
import logging
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import HomeAssistantError

from .const import (
    CONF_ALLOW_DELETE,
    CONF_ALLOW_LIST,
    CONF_ALLOW_MKDIR,
    CONF_ALLOW_MOVE,
    CONF_ALLOW_READ,
    CONF_ALLOW_WRITE,
    DEFAULT_CONTENT_TYPE,
    DOMAIN,
    ENCODING_BASE64,
    ENCODING_TEXT,
    ENCODINGS,
    MAX_MAX_READ_BYTES,
    PERMISSIONS,
    SERVICE_CREATE_FOLDER,
    SERVICE_DELETE_FILE,
    SERVICE_GET_INFO,
    SERVICE_INSTALL_SENTENCES,
    SERVICE_LIST_FILES,
    SERVICE_MOVE_FILE,
    SERVICE_READ_FILE,
    SERVICE_WRITE_FILE,
)
from . import sentences
from .errors import S3FilesError
from .hub import S3FilesHub, get_hub

_LOGGER = logging.getLogger(__name__)

FIELD_PATH = "path"
FIELD_SOURCE = "source"
FIELD_DESTINATION = "destination"
FIELD_CONTENT = "content"
FIELD_ENCODING = "encoding"
FIELD_CONTENT_TYPE = "content_type"
FIELD_OVERWRITE = "overwrite"
FIELD_RECURSIVE = "recursive"
FIELD_MAX_RESULTS = "max_results"
FIELD_MAX_BYTES = "max_bytes"

_POSITIVE_INT = vol.All(vol.Coerce(int), vol.Range(min=1))

SCHEMA_LIST_FILES = vol.Schema(
    {
        vol.Optional(FIELD_PATH): str,
        vol.Optional(FIELD_RECURSIVE, default=False): bool,
        vol.Optional(FIELD_MAX_RESULTS): _POSITIVE_INT,
    },
    extra=vol.PREVENT_EXTRA,
)

SCHEMA_READ_FILE = vol.Schema(
    {
        vol.Required(FIELD_PATH): str,
        vol.Optional(FIELD_ENCODING, default=ENCODING_TEXT): vol.In(ENCODINGS),
        vol.Optional(FIELD_MAX_BYTES): vol.All(
            vol.Coerce(int), vol.Range(min=1, max=MAX_MAX_READ_BYTES)
        ),
    },
    extra=vol.PREVENT_EXTRA,
)

SCHEMA_WRITE_FILE = vol.Schema(
    {
        vol.Required(FIELD_PATH): str,
        vol.Required(FIELD_CONTENT): str,
        vol.Optional(FIELD_ENCODING, default=ENCODING_TEXT): vol.In(ENCODINGS),
        vol.Optional(FIELD_CONTENT_TYPE): str,
        vol.Optional(FIELD_OVERWRITE, default=True): bool,
    },
    extra=vol.PREVENT_EXTRA,
)

SCHEMA_DELETE_FILE = vol.Schema(
    {vol.Required(FIELD_PATH): str}, extra=vol.PREVENT_EXTRA
)

SCHEMA_MOVE_FILE = vol.Schema(
    {
        vol.Required(FIELD_SOURCE): str,
        vol.Required(FIELD_DESTINATION): str,
        vol.Optional(FIELD_OVERWRITE, default=False): bool,
    },
    extra=vol.PREVENT_EXTRA,
)

SCHEMA_CREATE_FOLDER = vol.Schema(
    {vol.Required(FIELD_PATH): str}, extra=vol.PREVENT_EXTRA
)

SCHEMA_INSTALL_SENTENCES = vol.Schema(
    {vol.Optional("language"): str}, extra=vol.PREVENT_EXTRA
)

SCHEMA_GET_INFO = vol.Schema({}, extra=vol.PREVENT_EXTRA)


def _decode_content(content: str, encoding: str) -> bytes:
    """Turn service input into the bytes to upload."""
    if encoding == ENCODING_BASE64:
        try:
            return base64.b64decode(content, validate=True)
        except Exception as err:  # noqa: BLE001
            raise S3FilesError(
                "The content is not valid base64. Use encoding: text for plain "
                "text, or fix the base64 payload."
            ) from err
    return content.encode("utf-8")


def _encode_content(data: bytes, encoding: str) -> str:
    """Turn downloaded bytes into something a response can carry."""
    if encoding == ENCODING_BASE64:
        return base64.b64encode(data).decode("ascii")
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError as err:
        raise S3FilesError(
            "That file is not valid UTF-8, so it cannot be returned as text. "
            "Read it with encoding: base64 instead."
        ) from err


async def async_list_files(hub: S3FilesHub, call: ServiceCall) -> dict[str, Any]:
    """List the files and folders under a path."""
    hub.permissions.require(CONF_ALLOW_LIST)
    entries = await hub.client.async_list(
        call.data.get(FIELD_PATH),
        recursive=bool(call.data.get(FIELD_RECURSIVE, False)),
        max_results=int(call.data.get(FIELD_MAX_RESULTS, hub.max_results)),
    )
    return {
        "files": entries,
        "count": len(entries),
        "scope": hub.root_prefix,
        "bucket": hub.config.bucket,
    }


async def async_read_file(hub: S3FilesHub, call: ServiceCall) -> dict[str, Any]:
    """Read a file."""
    hub.permissions.require(CONF_ALLOW_READ)
    encoding = str(call.data.get(FIELD_ENCODING, ENCODING_TEXT))
    result = await hub.client.async_read(
        str(call.data[FIELD_PATH]),
        max_bytes=int(call.data.get(FIELD_MAX_BYTES, hub.max_read_bytes)),
    )
    return {
        "path": result["path"],
        "content": _encode_content(result["data"], encoding),
        "encoding": encoding,
        "size": result["size"],
        "truncated": result["truncated"],
        "content_type": result["content_type"],
        "last_modified": result["last_modified"],
    }


async def async_write_file(hub: S3FilesHub, call: ServiceCall) -> dict[str, Any]:
    """Create or replace a file."""
    hub.permissions.require(CONF_ALLOW_WRITE)
    encoding = str(call.data.get(FIELD_ENCODING, ENCODING_TEXT))
    data = _decode_content(str(call.data[FIELD_CONTENT]), encoding)
    result = await hub.client.async_write(
        str(call.data[FIELD_PATH]),
        data,
        content_type=call.data.get(FIELD_CONTENT_TYPE)
        or (DEFAULT_CONTENT_TYPE if encoding == ENCODING_TEXT else None),
        overwrite=bool(call.data.get(FIELD_OVERWRITE, True)),
    )
    return {**result, "scope": hub.root_prefix}


async def async_delete_file(hub: S3FilesHub, call: ServiceCall) -> dict[str, Any]:
    """Delete a file."""
    hub.permissions.require(CONF_ALLOW_DELETE)
    return await hub.client.async_delete(str(call.data[FIELD_PATH]))


async def async_move_file(hub: S3FilesHub, call: ServiceCall) -> dict[str, Any]:
    """Move or rename a file."""
    hub.permissions.require(CONF_ALLOW_MOVE)
    return await hub.client.async_move(
        str(call.data[FIELD_SOURCE]),
        str(call.data[FIELD_DESTINATION]),
        overwrite=bool(call.data.get(FIELD_OVERWRITE, False)),
    )


async def async_create_folder(hub: S3FilesHub, call: ServiceCall) -> dict[str, Any]:
    """Create a folder."""
    hub.permissions.require(CONF_ALLOW_MKDIR)
    return await hub.client.async_create_folder(str(call.data[FIELD_PATH]))


async def async_get_info(hub: S3FilesHub, call: ServiceCall) -> dict[str, Any]:
    """Describe the setup for the sidebar panel.

    Deliberately free of file contents and credentials: it says where the
    integration is scoped to and which actions are switched on, so the panel
    can hide what the integration would refuse anyway.
    """
    return {
        "bucket": hub.config.bucket,
        "scope": hub.root_prefix,
        "notes_folder": hub.notes_folder,
        "show_file_details": hub.show_file_details,
        "permissions": {
            name: hub.permissions.enabled(name) for name in PERMISSIONS
        },
    }


# name -> (permission that gates it, handler, schema)
SERVICE_DEFINITIONS: dict[str, tuple[str, Any, vol.Schema]] = {
    SERVICE_LIST_FILES: (CONF_ALLOW_LIST, async_list_files, SCHEMA_LIST_FILES),
    SERVICE_READ_FILE: (CONF_ALLOW_READ, async_read_file, SCHEMA_READ_FILE),
    SERVICE_WRITE_FILE: (CONF_ALLOW_WRITE, async_write_file, SCHEMA_WRITE_FILE),
    SERVICE_DELETE_FILE: (CONF_ALLOW_DELETE, async_delete_file, SCHEMA_DELETE_FILE),
    SERVICE_MOVE_FILE: (CONF_ALLOW_MOVE, async_move_file, SCHEMA_MOVE_FILE),
    SERVICE_CREATE_FOLDER: (CONF_ALLOW_MKDIR, async_create_folder, SCHEMA_CREATE_FOLDER),
}

# Every field the services declare, for the services.yaml parity test.
SERVICE_FIELDS = {
    SERVICE_LIST_FILES: {FIELD_PATH, FIELD_RECURSIVE, FIELD_MAX_RESULTS},
    SERVICE_READ_FILE: {FIELD_PATH, FIELD_ENCODING, FIELD_MAX_BYTES},
    SERVICE_WRITE_FILE: {
        FIELD_PATH,
        FIELD_CONTENT,
        FIELD_ENCODING,
        FIELD_CONTENT_TYPE,
        FIELD_OVERWRITE,
    },
    SERVICE_DELETE_FILE: {FIELD_PATH},
    SERVICE_MOVE_FILE: {FIELD_SOURCE, FIELD_DESTINATION, FIELD_OVERWRITE},
    SERVICE_CREATE_FOLDER: {FIELD_PATH},
    SERVICE_INSTALL_SENTENCES: {"language"},
    SERVICE_GET_INFO: set(),
}


async def async_install_sentences(hass: HomeAssistant, call: ServiceCall) -> dict[str, Any]:
    """Copy the packaged sentence templates into the config directory."""
    language = call.data.get("language") or sentences.DEFAULT_LANGUAGE
    return await sentences.async_install_sentences(hass, language)


async def async_setup_services(hass: HomeAssistant, hub: S3FilesHub) -> list[str]:
    """Register the services the current permissions allow."""

    async def _make(handler: Any) -> Any:
        async def _call(call: ServiceCall) -> dict[str, Any]:
            try:
                return await handler(get_hub(hass), call)
            except HomeAssistantError:
                raise
            except Exception as err:  # noqa: BLE001
                raise S3FilesError(str(err)) from err

        return _call

    registered: list[str] = []
    for name, (permission, handler, schema) in SERVICE_DEFINITIONS.items():
        if not hub.permissions.enabled(permission):
            _LOGGER.debug("Not registering s3_files.%s: %s is off", name, permission)
            continue
        hass.services.async_register(
            DOMAIN,
            name,
            await _make(handler),
            schema=schema,
            supports_response=SupportsResponse.OPTIONAL,
        )
        registered.append(name)

    # Always available: installing the sentence templates is a setup step, not
    # an action on the bucket, so no permission gates it.
    hass.services.async_register(
        DOMAIN,
        SERVICE_INSTALL_SENTENCES,
        async_install_sentences,
        schema=SCHEMA_INSTALL_SENTENCES,
        supports_response=SupportsResponse.OPTIONAL,
    )
    registered.append(SERVICE_INSTALL_SENTENCES)

    # Likewise ungated: this is what the sidebar panel asks for so it can hide
    # what the permissions forbid. It reveals no contents and no credentials.
    hass.services.async_register(
        DOMAIN,
        SERVICE_GET_INFO,
        await _make(async_get_info),
        schema=SCHEMA_GET_INFO,
        supports_response=SupportsResponse.OPTIONAL,
    )
    registered.append(SERVICE_GET_INFO)

    return registered


def async_remove_services(hass: HomeAssistant, names: list[str]) -> None:
    """Remove previously registered services."""
    for name in names:
        try:
            hass.services.async_remove(DOMAIN, name)
        except (ValueError, KeyError):
            pass
