"""Entry setup and teardown.

This is where the two halves of the design meet: the options decide what gets
registered, and a reload has to leave nothing behind. A stale intent or service
after a permission is switched off is the failure this file exists to catch.
"""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.s3_files import intents as intents_module  # noqa: E402
from custom_components.s3_files import async_setup_entry, async_unload_entry  # noqa: E402
from custom_components.s3_files.const import (  # noqa: E402
    CONF_ALLOW_DELETE,
    CONF_ALLOW_LIST,
    CONF_ALLOW_MKDIR,
    CONF_ALLOW_MOVE,
    CONF_ALLOW_READ,
    CONF_ALLOW_WRITE,
    DOMAIN,
    INTENT_CREATE_FOLDER,
    INTENT_CREATE_NOTE,
    INTENT_DELETE_FILE,
    INTENT_LIST_FILES,
    INTENT_MOVE_FILE,
    INTENT_READ_FILE,
    INTENT_WRITE_FILE,
    PERMISSIONS,
    SERVICE_LIST_FILES,
    SERVICE_READ_FILE,
    SERVICE_WRITE_FILE,
)
from custom_components.s3_files.hub import HUB_KEY, get_hub  # noqa: E402
from custom_components.s3_files.services import SERVICE_DEFINITIONS  # noqa: E402

from conftest import FakeHass, options, run  # noqa: E402


class FakeServices:
    def __init__(self) -> None:
        self.registered: dict[str, object] = {}

    def async_register(self, domain, name, handler, schema=None, **kwargs) -> None:
        self.registered[f"{domain}.{name}"] = handler

    def async_remove(self, domain, name) -> None:
        self.registered.pop(f"{domain}.{name}", None)

    def has_service(self, domain, name) -> bool:
        return f"{domain}.{name}" in self.registered


class SetupHass(FakeHass):
    def __init__(self, config_dir: str = "/tmp") -> None:
        super().__init__(config_dir)
        self.services = FakeServices()


class FakeEntry:
    def __init__(self, options: dict) -> None:
        self.options = options
        self.entry_id = "test-entry"
        self.title = "S3: bucket"
        self.version = 1
        self.unloaded: list = []
        self.update_listeners: list = []

    def async_on_unload(self, func) -> None:
        self.unloaded.append(func)

    def add_update_listener(self, listener):
        """Home Assistant returns an unsubscribe callback; so do we."""
        self.update_listeners.append(listener)

        def _unsub() -> None:
            self.update_listeners.remove(listener)

        return _unsub


def _make_hass(**overrides) -> tuple[SetupHass, FakeEntry]:
    hass = SetupHass()
    entry = FakeEntry(options(**overrides))
    return hass, entry


def _registered_intents(hass) -> set[str]:
    """The intent types Home Assistant would dispatch right now.

    `intent.async_get` yields handlers, not a keyed mapping.
    """
    from homeassistant.helpers import intent as intent_helper

    return {handler.intent_type for handler in intent_helper.async_get(hass)}


def test_setup_registers_the_enabled_services_and_intents():
    hass, entry = _make_hass(
        **{
            CONF_ALLOW_LIST: True,
            CONF_ALLOW_READ: True,
            CONF_ALLOW_WRITE: True,
            CONF_ALLOW_DELETE: False,
            CONF_ALLOW_MOVE: False,
            CONF_ALLOW_MKDIR: True,
        }
    )
    assert run(async_setup_entry(hass, entry)) is True

    assert set(hass.data[DOMAIN]["services"]) == {
        SERVICE_LIST_FILES,
        SERVICE_READ_FILE,
        SERVICE_WRITE_FILE,
        "create_folder",
        "install_sentences",
        "get_info",
    }
    assert set(hass.data[DOMAIN]["intents"]) == {
        INTENT_CREATE_NOTE,
        INTENT_WRITE_FILE,
        INTENT_LIST_FILES,
        INTENT_READ_FILE,
        INTENT_CREATE_FOLDER,
    }

    # The services really landed in the registry...
    assert f"{DOMAIN}.{SERVICE_LIST_FILES}" in hass.services.registered
    assert f"{DOMAIN}.delete_file" not in hass.services.registered
    # ...and the intents in Home Assistant's intent registry.
    registered = _registered_intents(hass)
    assert INTENT_WRITE_FILE in registered
    assert INTENT_DELETE_FILE not in registered


def test_setup_publishes_the_hub_and_options():
    hass, entry = _make_hass(root_prefix="notes")
    run(async_setup_entry(hass, entry))

    hub = get_hub(hass)
    assert hub.config.bucket == "ha-files"
    assert hub.root_prefix == "notes"
    assert hass.data[DOMAIN]["options"]["root_prefix"] == "notes"


def test_unload_removes_everything_it_registered():
    hass, entry = _make_hass(**{name: True for name in PERMISSIONS})
    run(async_setup_entry(hass, entry))
    assert hass.services.registered

    assert run(async_unload_entry(hass, entry)) is True

    assert hass.services.registered == {}, "a service survived the unload"

    remaining = _registered_intents(hass)
    for intent_type in (
        INTENT_CREATE_NOTE,
        INTENT_WRITE_FILE,
        INTENT_LIST_FILES,
        INTENT_READ_FILE,
        INTENT_MOVE_FILE,
        INTENT_DELETE_FILE,
    ):
        assert intent_type not in remaining, intent_type

    assert HUB_KEY not in hass.data[DOMAIN]


def test_a_reload_is_requested_when_the_options_change():
    """Otherwise a switched off action would stay registered forever."""
    hass, entry = _make_hass()
    run(async_setup_entry(hass, entry))

    assert entry.update_listeners, "no update listener was registered"
    assert entry.unloaded, "the listener was not tied to the entry's life"

    # The listener is what triggers the reload Home Assistant performs.
    import inspect

    from custom_components.s3_files import _async_reload_entry

    assert inspect.iscoroutinefunction(_async_reload_entry)
    assert entry.update_listeners[0] is _async_reload_entry


def test_reloading_after_a_permission_change_leaves_no_stale_intent():
    """The scenario: turn delete off, reload, confirm the tool is gone."""
    hass, entry = _make_hass(**{CONF_ALLOW_DELETE: True, CONF_ALLOW_LIST: True})
    run(async_setup_entry(hass, entry))

    assert INTENT_DELETE_FILE in _registered_intents(hass)

    run(async_unload_entry(hass, entry))
    entry.options = options(**{CONF_ALLOW_DELETE: False, CONF_ALLOW_LIST: True})
    run(async_setup_entry(hass, entry))

    assert INTENT_DELETE_FILE not in _registered_intents(hass)
    assert f"{DOMAIN}.delete_file" not in hass.services.registered


def test_every_service_definition_is_reachable_from_setup():
    """Guards against adding a service that nothing ever registers."""
    hass, entry = _make_hass(**{name: True for name in PERMISSIONS})
    run(async_setup_entry(hass, entry))

    registered = set(hass.data[DOMAIN]["services"])
    for name in SERVICE_DEFINITIONS:
        assert name in registered, name


def test_setup_with_everything_off_registers_no_bucket_actions():
    hass, entry = _make_hass(**{name: False for name in PERMISSIONS})
    run(async_setup_entry(hass, entry))

    assert hass.data[DOMAIN]["intents"] == []
    # Only the two setup/support services survive.
    assert set(hass.data[DOMAIN]["services"]) == {"install_sentences", "get_info"}
    assert intents_module.async_setup_intents(hass, get_hub(hass)) == []
