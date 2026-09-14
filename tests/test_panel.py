"""The sidebar panel.

Two halves: what the integration tells the panel (so it can hide what the
permissions forbid), and the wiring that publishes the built bundle and
registers the sidebar entry.
"""

from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

pytest.importorskip("homeassistant")

from custom_components.s3_files import _async_setup_panel, _panel_path  # noqa: E402
from custom_components.s3_files.const import (  # noqa: E402
    CONF_ALLOW_DELETE,
    CONF_ALLOW_LIST,
    CONF_SHOW_FILE_DETAILS,
    DOMAIN,
    PANEL_ELEMENT,
    PANEL_FILENAME,
    PANEL_URL_PATH,
    PERMISSIONS,
    SERVICE_GET_INFO,
)
from custom_components.s3_files.hub import build_hub  # noqa: E402
from custom_components.s3_files.services import async_get_info  # noqa: E402

from conftest import FakeHass, options, run  # noqa: E402

WWW = Path(__file__).resolve().parents[1] / "custom_components" / "s3_files" / "www"


class FakeHTTP:
    def __init__(self) -> None:
        self.static_paths: list = []

    async def async_register_static_paths(self, configs) -> None:
        self.static_paths.extend(configs)


class PanelHass(FakeHass):
    def __init__(self, config_dir: str = "/tmp") -> None:
        super().__init__(config_dir)
        self.http = FakeHTTP()


class Call:
    def __init__(self, **data) -> None:
        self.data = data


@pytest.fixture
def panel_calls(monkeypatch):
    """Record panel registration instead of touching the real frontend."""
    import homeassistant.components.frontend as frontend
    import homeassistant.components.panel_custom as panel_custom

    calls: dict[str, list] = {"registered": [], "removed": []}

    async def fake_register(hass, **kwargs):
        calls["registered"].append(kwargs)

    def fake_remove(hass, path, **kwargs):
        calls["removed"].append(path)

    monkeypatch.setattr(panel_custom, "async_register_panel", fake_register)
    monkeypatch.setattr(frontend, "async_remove_panel", fake_remove)
    return calls


def _with_bundle(tmp_path: Path) -> PanelHass:
    """A config dir that already has the built panel bundle installed."""
    hass = PanelHass(str(tmp_path))
    target = Path(_panel_path(hass))
    target.mkdir(parents=True, exist_ok=True)
    (target / PANEL_FILENAME).write_text("// bundle", encoding="utf-8")
    return hass


# ---------------------------------------------------------------------------
# What the panel is told.
# ---------------------------------------------------------------------------


def test_info_reports_the_scope_and_the_permissions():
    hub = build_hub(
        FakeHass(),
        options(root_prefix="Mini Notes", notes_folder="", allow_delete=False),
    )

    info = run(async_get_info(hub, Call()))

    assert info["bucket"] == "ha-files"
    assert info["scope"] == "Mini Notes"
    assert info["notes_folder"] == ""
    assert info["permissions"][CONF_ALLOW_LIST] is True
    assert info["permissions"][CONF_ALLOW_DELETE] is False


def test_info_covers_every_permission():
    """The panel keys off these flags, so a missing one would hide a control."""
    hub = build_hub(FakeHass(), options())
    info = run(async_get_info(hub, Call()))
    assert set(info["permissions"]) == set(PERMISSIONS)


def test_info_never_leaks_the_credentials():
    hub = build_hub(
        FakeHass(),
        options(secret_access_key="super-secret-value", access_key_id="AKIA1234567890"),
    )
    payload = json.dumps(run(async_get_info(hub, Call())))
    assert "super-secret-value" not in payload
    assert "AKIA1234567890" not in payload


def test_info_needs_no_permissions():
    """It must work with everything off, or the panel cannot explain itself."""
    hub = build_hub(FakeHass(), options(**{name: False for name in PERMISSIONS}))
    info = run(async_get_info(hub, Call()))
    assert not any(info["permissions"].values())


def test_info_tells_the_panel_to_show_file_details_by_default():
    hub = build_hub(FakeHass(), options())
    assert run(async_get_info(hub, Call()))["show_file_details"] is True


def test_info_can_tell_the_panel_to_hide_file_details():
    hub = build_hub(FakeHass(), options(**{CONF_SHOW_FILE_DETAILS: False}))
    assert run(async_get_info(hub, Call()))["show_file_details"] is False


def test_an_entry_without_the_setting_still_shows_file_details():
    """An entry saved before the toggle existed must not lose the detail."""
    hub = build_hub(FakeHass(), {})
    assert run(async_get_info(hub, Call()))["show_file_details"] is True


# ---------------------------------------------------------------------------
# Serving the bundle.
# ---------------------------------------------------------------------------


def test_the_built_bundle_is_committed():
    """Users install from the repo; the bundle has to be in it."""
    bundle = WWW / PANEL_FILENAME
    assert bundle.is_file(), f"{bundle} is missing — build the panel/"
    assert bundle.stat().st_size > 1000, "the bundle looks empty"


def test_a_missing_bundle_is_survivable(tmp_path, panel_calls):
    """No panel is better than a broken integration."""
    hass = PanelHass(str(tmp_path))

    run(_async_setup_panel(hass))

    assert hass.http.static_paths == []
    assert panel_calls["registered"] == []


def test_the_bundle_is_published_and_the_panel_registered(tmp_path, panel_calls):
    hass = _with_bundle(tmp_path)

    run(_async_setup_panel(hass))

    assert len(hass.http.static_paths) == 1
    static = hass.http.static_paths[0]
    assert static.url_path == f"/{DOMAIN}"
    # No caching, so a HACS update is picked up rather than a stale bundle.
    assert static.cache_headers is False

    assert len(panel_calls["registered"]) == 1
    registered = panel_calls["registered"][0]
    assert registered["frontend_url_path"] == PANEL_URL_PATH
    assert registered["webcomponent_name"] == PANEL_ELEMENT
    assert registered["module_url"].startswith(f"/{DOMAIN}/{PANEL_FILENAME}")
    # Cache busting, so a browser does not hold on to an old bundle.
    assert "?v=" in registered["module_url"]


def test_the_panel_is_registered_under_a_different_path_than_the_domain():
    """A sidebar path of s3_files would collide with the static file route."""
    assert PANEL_URL_PATH != DOMAIN
    assert "-" in PANEL_URL_PATH


def test_registering_twice_replaces_rather_than_duplicates(tmp_path, panel_calls):
    """The entry reloads when the options change, so this happens every edit."""
    hass = _with_bundle(tmp_path)

    run(_async_setup_panel(hass))
    run(_async_setup_panel(hass))

    assert panel_calls["removed"] == [PANEL_URL_PATH, PANEL_URL_PATH]
    assert len(panel_calls["registered"]) == 2


def test_unload_removes_the_panel(tmp_path, panel_calls):
    from custom_components.s3_files import async_setup_entry, async_unload_entry

    hass = _with_bundle(tmp_path)
    entry = type(
        "Entry",
        (),
        {
            "options": options(),
            "entry_id": "e",
            "async_on_unload": lambda self, func: None,
            "add_update_listener": lambda self, listener: (lambda: None),
        },
    )()

    run(async_setup_entry(hass, entry))
    run(async_unload_entry(hass, entry))

    assert panel_calls["removed"][-1] == PANEL_URL_PATH


def test_the_service_that_feeds_the_panel_is_always_registered():
    from custom_components.s3_files.services import SERVICE_DEFINITIONS

    assert SERVICE_GET_INFO not in SERVICE_DEFINITIONS
    assert os.sep in _panel_path(FakeHass("/config"))
