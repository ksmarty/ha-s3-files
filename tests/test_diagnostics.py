"""Diagnostics.

The secret access key must never appear in a diagnostics download — these files
get pasted into public GitHub issues.
"""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from custom_components.s3_files.const import (  # noqa: E402
    CONF_ACCESS_KEY_ID,
    CONF_SECRET_ACCESS_KEY,
    DOMAIN,
    PERMISSIONS,
)
from custom_components.s3_files.diagnostics import (  # noqa: E402
    async_get_config_entry_diagnostics,
)
from custom_components.s3_files.hub import HUB_KEY, build_hub  # noqa: E402

from conftest import FakeHass, options, run  # noqa: E402


class FakeEntry:
    options: dict = {}
    title = "S3: ha-files"
    version = 1


def _hass(**overrides) -> FakeHass:
    hass = FakeHass()
    opts = options(**overrides)
    hub = build_hub(hass, opts)
    hass.data[DOMAIN] = {
        HUB_KEY: hub,
        "options": opts,
        "services": ["list_files", "read_file"],
        "intents": ["S3ListFiles", "S3ReadFile"],
    }
    return hass


def test_the_secret_is_redacted():
    diagnostic = run(
        async_get_config_entry_diagnostics(
            _hass(**{CONF_SECRET_ACCESS_KEY: "super-secret-value"}), FakeEntry()
        )
    )
    assert "super-secret-value" not in str(diagnostic)
    assert diagnostic["connection"]["secret_access_key"] == "**REDACTED**"


def test_the_access_key_is_only_a_fingerprint():
    diagnostic = run(
        async_get_config_entry_diagnostics(
            _hass(**{CONF_ACCESS_KEY_ID: "AKIAIOSFODNN7EXAMPLE"}), FakeEntry()
        )
    )
    shown = diagnostic["connection"]["access_key_id"]
    assert shown != "AKIAIOSFODNN7EXAMPLE"
    assert shown.startswith("AKIA")
    assert "IOSFODNN7EXAMPLE" not in shown


def test_it_reports_the_scope_permissions_and_registrations():
    diagnostic = run(
        async_get_config_entry_diagnostics(
            _hass(root_prefix="notes", **{name: True for name in PERMISSIONS}),
            FakeEntry(),
        )
    )
    assert diagnostic["connection"]["root_prefix"] == "notes"
    assert diagnostic["connection"]["bucket"] == "ha-files"
    assert diagnostic["registered"]["services"] == ["list_files", "read_file"]
    assert diagnostic["registered"]["intents"] == ["S3ListFiles", "S3ReadFile"]


def test_disabled_permissions_are_listed_as_disabled():
    diagnostic = run(
        async_get_config_entry_diagnostics(
            _hass(allow_delete=False, allow_move=False), FakeEntry()
        )
    )
    assert "delete files" in diagnostic["permissions"]["disabled"]
    assert "delete files" not in diagnostic["permissions"]["enabled"]


def test_it_still_reports_when_the_integration_is_not_set_up():
    """A broken setup is exactly when someone downloads diagnostics."""
    hass = FakeHass()
    hass.data[DOMAIN] = {"options": options(root_prefix="notes")}

    diagnostic = run(async_get_config_entry_diagnostics(hass, FakeEntry()))

    assert diagnostic["connection"]["root_prefix"] == "notes"
    assert diagnostic["registered"] == {"services": [], "intents": []}
    # Still redacted on the fallback path.
    assert diagnostic["connection"]["secret_access_key"] == "**REDACTED**"
