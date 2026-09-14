"""Diagnostics for S3 Files.

The secret access key never leaves the config entry: it is replaced here, and
the access key id is shown only as a fingerprint so a user can tell which key
is in use without it ending up in a GitHub issue.
"""

from __future__ import annotations

from typing import Any

from homeassistant.core import HomeAssistant

from .const import DOMAIN
from .hub import HUB_KEY, build_hub, get_options


async def async_get_config_entry_diagnostics(
    hass: HomeAssistant, entry: Any
) -> dict[str, Any]:
    """Return diagnostics for a config entry."""
    options = get_options(hass)
    hub = hass.data.get(DOMAIN, {}).get(HUB_KEY)

    data = hass.data.get(DOMAIN, {})
    diagnostics: dict[str, Any] = {
        "entry": {
            "title": entry.title,
            "version": entry.version,
        },
        "connection": (hub.config.redacted() if hub else "(not set up)"),
        "permissions": {
            "enabled": list(hub.permissions.labels()) if hub else [],
            "disabled": list(hub.permissions.disabled_labels()) if hub else [],
        },
        "registered": {
            "services": sorted(data.get("services", [])),
            "intents": sorted(data.get("intents", [])),
        },
    }

    if not hub:
        # Fall back to the stored options, so a broken setup still reports
        # something useful (with the secret still redacted).
        diagnostics["connection"] = build_hub(hass, options).config.redacted()

    return diagnostics
