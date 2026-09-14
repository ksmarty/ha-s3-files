"""The sentence installer.

Custom sentences cannot be installed by HACS, so the integration copies them
into the config directory itself. The copy must not silently destroy local
edits — that is what the backup is for.
"""

from __future__ import annotations

from pathlib import Path

import pytest

pytest.importorskip("homeassistant")

from custom_components.s3_files import sentences  # noqa: E402

from conftest import FakeHass, run  # noqa: E402

PACKAGED = (
    Path(__file__).resolve().parents[1]
    / "custom_components"
    / "s3_files"
    / "custom_sentences"
    / "en"
    / "s3_files.yaml"
)


def test_the_packaged_templates_exist():
    assert PACKAGED.is_file(), "the integration has no templates to install"


def test_packaged_and_config_paths_agree():
    hass = FakeHass("/config")
    assert sentences.packaged_path("en") == PACKAGED
    assert sentences.config_path(hass, "en") == Path(
        "/config/custom_sentences/en/s3_files.yaml"
    )


def test_installing_copies_the_file(tmp_path):
    hass = FakeHass(str(tmp_path))

    result = run(sentences.async_install_sentences(hass, "en"))

    target = tmp_path / "custom_sentences" / "en" / "s3_files.yaml"
    assert target.is_file()
    assert target.read_text(encoding="utf-8") == PACKAGED.read_text(encoding="utf-8")
    assert result["updated"] is True
    assert result["backup"] is None
    assert result["path"] == str(target)


def test_installing_twice_reports_no_change(tmp_path):
    hass = FakeHass(str(tmp_path))
    run(sentences.async_install_sentences(hass, "en"))

    result = run(sentences.async_install_sentences(hass, "en"))
    assert result["updated"] is False
    assert result["backup"] is None


def test_local_edits_are_backed_up_not_destroyed(tmp_path):
    hass = FakeHass(str(tmp_path))
    target = tmp_path / "custom_sentences" / "en" / "s3_files.yaml"
    target.parent.mkdir(parents=True)
    target.write_text("language: en\n# my own edits\n", encoding="utf-8")

    result = run(sentences.async_install_sentences(hass, "en"))

    assert result["updated"] is True
    assert result["backup"] is not None
    assert Path(result["backup"]).read_text(encoding="utf-8") == (
        "language: en\n# my own edits\n"
    )
    # ...and the packaged version is now in place.
    assert target.read_text(encoding="utf-8") == PACKAGED.read_text(encoding="utf-8")


def test_an_unknown_language_is_refused(tmp_path):
    hass = FakeHass(str(tmp_path))
    from homeassistant.exceptions import HomeAssistantError

    with pytest.raises(HomeAssistantError) as err:
        run(sentences.async_install_sentences(hass, "zz"))
    assert "zz" in str(err.value)


def test_a_missing_conversation_reload_is_not_fatal(tmp_path):
    """Home Assistant without the conversation integration must still install."""
    hass = FakeHass(str(tmp_path))

    result = run(sentences.async_install_sentences(hass, "en"))
    assert result["updated"] is True
    assert result["reloaded"] is False


def test_the_conversation_agent_is_reloaded_when_available(tmp_path):
    """Otherwise the new sentences would not take effect until a restart."""
    from conftest import FakeServiceRegistry

    hass = FakeHass(str(tmp_path))
    hass.services = FakeServiceRegistry(("conversation.reload",))

    result = run(sentences.async_install_sentences(hass, "en"))

    assert result["reloaded"] is True
    assert hass.services.calls == [("conversation.reload", {"language": "en"})]


def test_the_installer_is_registered_as_a_service_and_never_gated():
    """It is a setup step, so no permission may hide it."""
    from custom_components.s3_files import services
    from custom_components.s3_files.const import SERVICE_INSTALL_SENTENCES

    assert SERVICE_INSTALL_SENTENCES not in services.SERVICE_DEFINITIONS
    assert SERVICE_INSTALL_SENTENCES in services.SERVICE_FIELDS
