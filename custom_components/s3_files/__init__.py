"""S3 Files integration.

Entry setup builds the hub (the client plus its permission set) and registers
only the services and intents the permissions allow. The entry reloads itself
when the options change, so what a disabled action leaves behind — a service,
an Assist intent, an LLM tool — is always in step with the settings.

It also serves the sidebar panel: the built bundle is published over HTTP and
registered with `panel_custom`, so there is nothing for the user to add by hand.
"""

from __future__ import annotations

import logging
import os
from typing import TYPE_CHECKING, Any

from .const import DOMAIN, PANEL_ELEMENT, PANEL_FILENAME, PANEL_ICON, PANEL_TITLE, PANEL_URL_PATH
from .hub import HUB_KEY, build_hub

if TYPE_CHECKING:
    from homeassistant.config_entries import ConfigEntry
    from homeassistant.core import HomeAssistant

_LOGGER = logging.getLogger(__name__)

OPTIONS_KEY = "options"
SERVICES_KEY = "services"
INTENTS_KEY = "intents"


async def async_setup(hass: HomeAssistant, config: dict[str, Any]) -> bool:
    """Prepare the shared data store.

    Intents cannot be registered here: whether an intent exists at all depends
    on the permissions, which only the config entry knows.
    """
    hass.data.setdefault(DOMAIN, {})
    return True


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up the config entry."""
    from . import intents as intents_module
    from .services import async_setup_services

    data = hass.data.setdefault(DOMAIN, {})
    options = dict(entry.options or {})
    hub = build_hub(hass, options)

    data[HUB_KEY] = hub
    data[OPTIONS_KEY] = options

    data[SERVICES_KEY] = await async_setup_services(hass, hub)
    data[INTENTS_KEY] = intents_module.async_setup_intents(hass, hub)

    await _async_setup_panel(hass)

    # Options changed -> rebuild everything, so the service and intent lists
    # follow the permissions.
    entry.async_on_unload(entry.add_update_listener(_async_reload_entry))

    _LOGGER.debug(
        "S3 Files ready: bucket %s, scope %s, services %s, intents %s",
        hub.config.bucket,
        hub.root_prefix or "(whole bucket)",
        ",".join(data[SERVICES_KEY]) or "none",
        ",".join(data[INTENTS_KEY]) or "none",
    )
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Tear the config entry down."""
    from . import intents as intents_module
    from .services import async_remove_services

    data = hass.data.get(DOMAIN, {})
    async_remove_services(hass, data.pop(SERVICES_KEY, []))
    intents_module.async_remove_intents(hass, data.pop(INTENTS_KEY, []))
    data.pop(HUB_KEY, None)
    data.pop(OPTIONS_KEY, None)

    try:
        from homeassistant.components.frontend import async_remove_panel

        async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)
    except Exception:  # noqa: BLE001 - best effort on unload
        _LOGGER.debug("Could not remove the S3 Files panel")

    return True


async def _async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload the entry after its options change."""
    await hass.config_entries.async_reload(entry.entry_id)


def _panel_path(hass: HomeAssistant) -> str:
    """Where the built panel bundle lives."""
    return os.path.join(hass.config.path("custom_components"), DOMAIN, "www")


async def _async_setup_panel(hass: HomeAssistant) -> None:
    """Publish the panel bundle and register the sidebar entry.

    Never raises: a missing or unservable bundle should cost the user the panel,
    not the whole integration.
    """
    www_path = _panel_path(hass)
    if not os.path.isfile(os.path.join(www_path, PANEL_FILENAME)):
        _LOGGER.warning(
            "Panel bundle %s is missing; the sidebar panel will not be "
            "available. Rebuild it with the panel/ frontend toolchain",
            PANEL_FILENAME,
        )
        return

    http = getattr(hass, "http", None)
    if http is None:
        _LOGGER.warning("HTTP is not set up; the S3 Files panel cannot be served")
        return

    try:
        from homeassistant.components.http import StaticPathConfig

        await http.async_register_static_paths(
            # (url_path, path, cache_headers) — no caching, so a HACS update is
            # picked up rather than a stale bundle being served. Registering the
            # same path again on a reload is harmless: it is added as a route
            # pointing at the same folder.
            [StaticPathConfig(f"/{DOMAIN}", www_path, False)]
        )
    except Exception as err:  # noqa: BLE001 - never block entry setup
        _LOGGER.error("Could not serve the S3 Files panel files: %s", err)

    await _async_register_panel(hass, f"/{DOMAIN}/{PANEL_FILENAME}?v={_version(hass)}")


async def _async_register_panel(hass: HomeAssistant, panel_url: str) -> None:
    """Add the S3 Files sidebar entry."""
    try:
        from homeassistant.components import panel_custom
        from homeassistant.components.frontend import async_remove_panel

        # Re-registering on a reload would otherwise leave the old entry behind.
        async_remove_panel(hass, PANEL_URL_PATH, warn_if_unknown=False)

        await panel_custom.async_register_panel(
            hass,
            frontend_url_path=PANEL_URL_PATH,
            webcomponent_name=PANEL_ELEMENT,
            sidebar_title=PANEL_TITLE,
            sidebar_icon=PANEL_ICON,
            module_url=panel_url,
            embed_iframe=False,
            require_admin=False,
        )
        _LOGGER.debug("Registered the S3 Files panel at /%s", PANEL_URL_PATH)
    except Exception as err:  # noqa: BLE001 - the rest of the integration works
        _LOGGER.error("Could not register the S3 Files panel: %s", err)


def _version(hass: HomeAssistant) -> str:
    """Version stamp for the panel bundle (cache busting)."""
    try:
        from homeassistant.loader import async_get_loaded_integration

        return async_get_loaded_integration(hass, DOMAIN).version or "0"
    except Exception:  # noqa: BLE001 - fall back to an uncached URL
        return "0"
