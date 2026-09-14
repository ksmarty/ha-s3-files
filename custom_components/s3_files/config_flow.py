"""Config and options flow for S3 Files.

One config entry holds everything: the connection to the bucket, the folder the
integration is scoped to, and the permission set. The options flow edits the
same fields, so there is exactly one schema builder shared by both flows —
duplicating it is how the two drift apart.

Every validator here has to survive Home Assistant's schema serializer
(`voluptuous_serialize`), so it must be a voluptuous validator or a selector —
never a bare Python function.
"""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant import config_entries
from homeassistant.core import callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.selector import (
    BooleanSelector,
    NumberSelector,
    NumberSelectorConfig,
    NumberSelectorMode,
    TextSelector,
    TextSelectorConfig,
    TextSelectorType,
)

from .const import (
    CONF_ACCESS_KEY_ID,
    CONF_BUCKET,
    CONF_ENDPOINT_URL,
    CONF_MAX_READ_BYTES,
    CONF_MAX_RESULTS,
    CONF_NOTES_FOLDER,
    CONF_PATH_STYLE,
    CONF_REGION,
    CONF_ROOT_PREFIX,
    CONF_SECRET_ACCESS_KEY,
    CONF_SHOW_FILE_DETAILS,
    CONF_VERIFY_SSL,
    DEFAULT_MAX_READ_BYTES,
    DEFAULT_MAX_RESULTS,
    DEFAULT_NOTES_FOLDER,
    DEFAULT_PATH_STYLE,
    DEFAULT_PERMISSIONS,
    DEFAULT_REGION,
    DEFAULT_ROOT_PREFIX,
    DEFAULT_SHOW_FILE_DETAILS,
    DEFAULT_VERIFY_SSL,
    DOMAIN,
    MAX_MAX_READ_BYTES,
    MAX_MAX_RESULTS,
    PERMISSIONS,
)
from .errors import S3FilesError
from .paths import PathError, normalize_prefix
from .s3_client import S3Config, S3FilesClient

_LOGGER = logging.getLogger(__name__)

# boto3 error code -> translation key for the form.
_CONNECT_ERROR_KEYS = {
    "auth": "invalid_auth",
    "no_bucket": "bucket_not_found",
    "connect": "cannot_connect",
    "not_found": "bucket_not_found",
}


def _defaults() -> dict[str, Any]:
    """The options an entry starts with."""
    return {
        CONF_ENDPOINT_URL: "",
        CONF_ACCESS_KEY_ID: "",
        CONF_SECRET_ACCESS_KEY: "",
        CONF_REGION: DEFAULT_REGION,
        CONF_BUCKET: "",
        CONF_PATH_STYLE: DEFAULT_PATH_STYLE,
        CONF_VERIFY_SSL: DEFAULT_VERIFY_SSL,
        CONF_ROOT_PREFIX: DEFAULT_ROOT_PREFIX,
        CONF_NOTES_FOLDER: DEFAULT_NOTES_FOLDER,
        CONF_SHOW_FILE_DETAILS: DEFAULT_SHOW_FILE_DETAILS,
        CONF_MAX_RESULTS: DEFAULT_MAX_RESULTS,
        CONF_MAX_READ_BYTES: DEFAULT_MAX_READ_BYTES,
        **DEFAULT_PERMISSIONS,
    }


def _stored(options: dict[str, Any] | None) -> dict[str, Any]:
    """Merge stored options over the defaults, so new keys appear on upgrade."""
    merged = _defaults()
    for key, value in (options or {}).items():
        merged[key] = value
    return merged


def _text(default: Any) -> TextSelector:
    return TextSelector()


def _password() -> TextSelector:
    return TextSelector(TextSelectorConfig(type=TextSelectorType.PASSWORD))


def _number(default: int, upper: int) -> NumberSelector:
    return NumberSelector(
        NumberSelectorConfig(min=1, max=upper, mode=NumberSelectorMode.BOX)
    )


def _build_schema(options: dict[str, Any]) -> vol.Schema:
    """Build the single form used by both flows."""
    schema: dict[Any, Any] = {
        vol.Optional(
            CONF_BUCKET, default=str(options.get(CONF_BUCKET, ""))
        ): _text(""),
        vol.Optional(
            CONF_ENDPOINT_URL, default=str(options.get(CONF_ENDPOINT_URL, ""))
        ): _text(""),
        vol.Optional(
            CONF_REGION, default=str(options.get(CONF_REGION, DEFAULT_REGION))
        ): _text(""),
        vol.Optional(
            CONF_ACCESS_KEY_ID, default=str(options.get(CONF_ACCESS_KEY_ID, ""))
        ): TextSelector(),
        vol.Optional(
            CONF_SECRET_ACCESS_KEY,
            default=str(options.get(CONF_SECRET_ACCESS_KEY, "")),
        ): _password(),
        vol.Optional(
            CONF_PATH_STYLE, default=bool(options.get(CONF_PATH_STYLE, DEFAULT_PATH_STYLE))
        ): BooleanSelector(),
        vol.Optional(
            CONF_VERIFY_SSL, default=bool(options.get(CONF_VERIFY_SSL, DEFAULT_VERIFY_SSL))
        ): BooleanSelector(),
        vol.Optional(
            CONF_ROOT_PREFIX,
            default=str(options.get(CONF_ROOT_PREFIX, DEFAULT_ROOT_PREFIX)),
        ): _text(""),
        vol.Optional(
            CONF_NOTES_FOLDER,
            default=str(options.get(CONF_NOTES_FOLDER, DEFAULT_NOTES_FOLDER)),
        ): _text(""),
        vol.Optional(
            CONF_SHOW_FILE_DETAILS,
            default=bool(
                options.get(CONF_SHOW_FILE_DETAILS, DEFAULT_SHOW_FILE_DETAILS)
            ),
        ): BooleanSelector(),
        vol.Optional(
            CONF_MAX_RESULTS,
            default=int(options.get(CONF_MAX_RESULTS, DEFAULT_MAX_RESULTS)),
        ): _number(DEFAULT_MAX_RESULTS, MAX_MAX_RESULTS),
        vol.Optional(
            CONF_MAX_READ_BYTES,
            default=int(options.get(CONF_MAX_READ_BYTES, DEFAULT_MAX_READ_BYTES)),
        ): _number(DEFAULT_MAX_READ_BYTES, MAX_MAX_READ_BYTES),
    }
    for permission in PERMISSIONS:
        schema[
            vol.Optional(
                permission,
                default=bool(options.get(permission, DEFAULT_PERMISSIONS[permission])),
            )
        ] = BooleanSelector()
    return vol.Schema(schema)


def _clean(user_input: dict[str, Any], previous: dict[str, Any]) -> dict[str, Any]:
    """Normalise a submission into the options to store."""
    options = _stored(previous)
    options.update(user_input)

    # An empty secret means "leave it as it was": the field is a password box,
    # so a blank one is far more likely to be an untouched form than a request
    # to remove the credentials.
    if not str(options.get(CONF_SECRET_ACCESS_KEY) or "").strip():
        options[CONF_SECRET_ACCESS_KEY] = str(
            previous.get(CONF_SECRET_ACCESS_KEY, "")
        )

    options[CONF_BUCKET] = str(options.get(CONF_BUCKET) or "").strip()
    options[CONF_ENDPOINT_URL] = str(options.get(CONF_ENDPOINT_URL) or "").strip()
    options[CONF_REGION] = str(options.get(CONF_REGION) or DEFAULT_REGION).strip()
    options[CONF_ACCESS_KEY_ID] = str(options.get(CONF_ACCESS_KEY_ID) or "").strip()
    notes_folder = options.get(CONF_NOTES_FOLDER)
    if notes_folder is None:
        notes_folder = DEFAULT_NOTES_FOLDER
    # An empty notes folder is meaningful: save notes directly in the scoped
    # folder. Only a missing value falls back to the default.
    options[CONF_NOTES_FOLDER] = str(notes_folder).strip()
    return options


def _field_errors(options: dict[str, Any]) -> dict[str, str]:
    """Validate what can be checked without touching the network."""
    if not options.get(CONF_BUCKET):
        return {"base": "bucket_required"}

    try:
        normalize_prefix(options.get(CONF_ROOT_PREFIX))
    except PathError:
        return {"base": "invalid_root_prefix"}

    try:
        normalize_prefix(options.get(CONF_NOTES_FOLDER))
    except PathError:
        return {"base": "invalid_notes_folder"}

    access_key = str(options.get(CONF_ACCESS_KEY_ID) or "")
    secret = str(options.get(CONF_SECRET_ACCESS_KEY) or "")
    if bool(access_key) != bool(secret):
        # Half a credential pair is always a mistake: a key id needs its
        # secret. Leaving both blank is legitimate (an instance role can
        # supply them), which is why only the mismatch is refused.
        return {"base": "credentials_incomplete"}

    return {}


async def _async_check_connection(hass: Any, options: dict[str, Any]) -> str | None:
    """Try to reach the bucket. Returns a translation key on failure."""
    client = S3FilesClient(hass, S3Config.from_options(options))
    try:
        await client.async_check()
    except S3FilesError as err:
        if err.code == "denied":
            # A key scoped to a prefix only (common on Backblaze/Wasabi) can be
            # refused HeadBucket while object access works fine. Accept it.
            _LOGGER.warning(
                "The S3 credentials were refused HeadBucket (%s); continuing, "
                "because prefix-scoped keys can be valid without it",
                err,
            )
            return None
        return _CONNECT_ERROR_KEYS.get(err.code, "unknown")
    return None


async def _async_validate(hass: Any, options: dict[str, Any]) -> dict[str, str]:
    """Full validation for a submission."""
    errors = _field_errors(options)
    if errors:
        return errors

    error = await _async_check_connection(hass, options)
    if error:
        return {"base": error}
    return {}


class _SettingsForm:
    """Shared form handling for the config and options flows."""

    def _current(self) -> dict[str, Any]:
        raise NotImplementedError

    def _show(self, step_id: str, errors: dict[str, str]) -> FlowResult:
        options = _stored(self._current())
        return self.async_show_form(  # type: ignore[attr-defined]
            step_id=step_id,
            data_schema=_build_schema(options),
            errors=errors,
        )

    async def _submit(
        self, step_id: str, user_input: dict[str, Any] | None
    ) -> tuple[dict[str, Any] | None, dict[str, str]]:
        """Validate a submission; returns (options, errors)."""
        if user_input is None:
            return None, {}

        options = _clean(user_input, self._current())
        errors = await _async_validate(self.hass, options)  # type: ignore[attr-defined]
        if errors:
            return None, errors
        return options, {}


class S3FilesConfigFlow(config_entries.ConfigFlow, _SettingsForm, domain=DOMAIN):
    """Handle the single config entry for S3 Files."""

    VERSION = 1

    # Values typed into a form that failed validation, so the user does not
    # have to enter them again. Empty on a fresh flow.
    _pending: dict[str, Any] = {}

    def _current(self) -> dict[str, Any]:
        return self._pending

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Collect the connection, the folder scope and the permissions."""
        if self._async_current_entries():
            return self.async_abort(reason="already_configured")

        options, errors = await self._submit("user", user_input)
        if options is not None:
            return self.async_create_entry(
                title=f"S3: {options[CONF_BUCKET]}", data={}, options=options
            )
        if errors:
            # Show what was typed rather than silently resetting to defaults.
            self._pending = dict(user_input or {})

        return self._show("user", errors)

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Return the options flow for this entry.

        This has to be a plain synchronous callback. Home Assistant calls it
        directly and uses whatever it returns as the flow object, without
        awaiting it, so an `async def` here hands back a coroutine — and the
        next attribute access on it fails with a 500 the moment the user opens
        the settings.
        """
        return S3FilesOptionsFlow(config_entry)


class S3FilesOptionsFlow(config_entries.OptionsFlow, _SettingsForm):
    """Options flow: edit the connection, the scope and the permissions."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        self._config_entry = config_entry

    def _current(self) -> dict[str, Any]:
        return dict(self._config_entry.options or {})

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Edit the settings."""
        options, errors = await self._submit("init", user_input)
        if options is not None:
            return self.async_create_entry(title="", data=options)
        return self._show("init", errors)
