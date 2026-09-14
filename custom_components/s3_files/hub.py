"""The runtime object shared by services, intents and LLM tools."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .const import (
    CONF_MAX_READ_BYTES,
    CONF_MAX_RESULTS,
    CONF_NOTES_FOLDER,
    CONF_ROOT_PREFIX,
    CONF_SHOW_FILE_DETAILS,
    DEFAULT_MAX_READ_BYTES,
    DEFAULT_MAX_RESULTS,
    DEFAULT_NOTES_FOLDER,
    DEFAULT_SHOW_FILE_DETAILS,
    DOMAIN,
    MAX_MAX_READ_BYTES,
    MAX_MAX_RESULTS,
)
from .errors import S3FilesError
from .paths import normalize_prefix
from .permissions import PermissionSet
from .s3_client import S3Config, S3FilesClient

DATA_KEY = DOMAIN
HUB_KEY = "hub"


@dataclass
class S3FilesHub:
    """The configured client plus the rules it must respect."""

    client: S3FilesClient
    permissions: PermissionSet
    options: dict[str, Any]

    @property
    def config(self) -> S3Config:
        return self.client.config

    @property
    def root_prefix(self) -> str:
        return self.config.root_prefix

    @property
    def notes_folder(self) -> str:
        return normalize_prefix(self.options.get(CONF_NOTES_FOLDER, DEFAULT_NOTES_FOLDER))

    @property
    def show_file_details(self) -> bool:
        """Whether the sidebar panel shows extensions, sizes and dates.

        A presentation choice, so an entry saved before this existed still
        shows them rather than silently losing the detail.
        """
        return bool(
            self.options.get(CONF_SHOW_FILE_DETAILS, DEFAULT_SHOW_FILE_DETAILS)
        )

    @property
    def max_read_bytes(self) -> int:
        return _clamp(
            self.options.get(CONF_MAX_READ_BYTES, DEFAULT_MAX_READ_BYTES),
            DEFAULT_MAX_READ_BYTES,
            MAX_MAX_READ_BYTES,
        )

    @property
    def max_results(self) -> int:
        return _clamp(
            self.options.get(CONF_MAX_RESULTS, DEFAULT_MAX_RESULTS),
            DEFAULT_MAX_RESULTS,
            MAX_MAX_RESULTS,
        )


def _clamp(value: Any, default: int, upper: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    if number < 1:
        return default
    return min(number, upper)


def build_hub(hass: Any, options: dict[str, Any]) -> S3FilesHub:
    """Create the hub for a set of options."""
    config = S3Config.from_options(options)
    return S3FilesHub(
        client=S3FilesClient(hass, config),
        permissions=PermissionSet.from_options(options),
        options=dict(options),
    )


def get_hub(hass: Any) -> S3FilesHub:
    """Return the configured hub, or explain that there is none."""
    hub = hass.data.get(DATA_KEY, {}).get(HUB_KEY)
    if hub is None:
        raise S3FilesError(
            "S3 Files is not set up yet. Add the integration in Settings > "
            "Devices & Services first."
        )
    return hub


def get_options(hass: Any) -> dict[str, Any]:
    """Return the options the running hub was built from."""
    return dict(hass.data.get(DATA_KEY, {}).get("options") or {})


__all__ = [
    "CONF_MAX_READ_BYTES",
    "CONF_MAX_RESULTS",
    "DATA_KEY",
    "HUB_KEY",
    "CONF_ROOT_PREFIX",
    "S3FilesHub",
    "build_hub",
    "get_hub",
    "get_options",
]
