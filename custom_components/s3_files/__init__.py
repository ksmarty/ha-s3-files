"""S3 Files integration.

Entry setup builds the hub (the client plus its permission set) and registers
only the services and intents the permissions allow. The entry reloads itself
when the options change, so what a disabled action leaves behind — a service,
an Assist intent, an LLM tool — is always in step with the settings.
"""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

from .const import DOMAIN
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
    return True


async def _async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload the entry after its options change."""
    await hass.config_entries.async_reload(entry.entry_id)
