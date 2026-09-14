"""Config and options flow.

The expensive bug in the sibling project was a schema Home Assistant could not
serialize, which surfaced to the user as a 500 when opening the dialog. These
tests run the real serializer over the real form, so that cannot come back.
"""

from __future__ import annotations

import pytest

pytest.importorskip("homeassistant")

from homeassistant.helpers import config_validation as cv  # noqa: E402
import voluptuous_serialize  # noqa: E402

from custom_components.s3_files import config_flow  # noqa: E402
from custom_components.s3_files.const import (  # noqa: E402
    CONF_ACCESS_KEY_ID,
    CONF_ALLOW_DELETE,
    CONF_BUCKET,
    CONF_MAX_READ_BYTES,
    CONF_NOTES_FOLDER,
    CONF_REGION,
    CONF_ROOT_PREFIX,
    CONF_SECRET_ACCESS_KEY,
    DEFAULT_MAX_READ_BYTES,
    DEFAULT_NOTES_FOLDER,
    DEFAULT_PERMISSIONS,
    DEFAULT_REGION,
    PERMISSIONS,
)


def _serialize(schema):
    return voluptuous_serialize.convert(schema, custom_serializer=cv.custom_serializer)


def test_the_form_serializes_for_the_frontend():
    """A schema the frontend cannot render breaks the flow with a 500."""
    fields = _serialize(config_flow._build_schema(config_flow._defaults()))

    assert fields, "the form has no fields"
    without_selector = [field["name"] for field in fields if not field.get("selector")]
    assert without_selector == [], (
        "these fields would render as raw text boxes or break serialization: "
        f"{without_selector}"
    )


def test_every_permission_is_in_the_form():
    fields = _serialize(config_flow._build_schema(config_flow._defaults()))
    names = {field["name"] for field in fields}
    assert set(PERMISSIONS) <= names


def test_the_form_covers_the_settings_a_user_needs():
    fields = _serialize(config_flow._build_schema(config_flow._defaults()))
    names = {field["name"] for field in fields}
    for expected in (
        CONF_BUCKET,
        CONF_ACCESS_KEY_ID,
        CONF_SECRET_ACCESS_KEY,
        CONF_ROOT_PREFIX,
        CONF_NOTES_FOLDER,
    ):
        assert expected in names


def test_the_secret_is_a_password_field():
    fields = {
        field["name"]: field
        for field in _serialize(config_flow._build_schema(config_flow._defaults()))
    }
    assert fields[CONF_SECRET_ACCESS_KEY]["selector"]["text"]["type"] == "password"


def test_defaults_are_prefilled():
    fields = {
        field["name"]: field
        for field in _serialize(config_flow._build_schema(config_flow._defaults()))
    }
    assert fields[CONF_REGION]["default"] == DEFAULT_REGION
    assert fields[CONF_NOTES_FOLDER]["default"] == DEFAULT_NOTES_FOLDER
    assert fields[CONF_MAX_READ_BYTES]["default"] == DEFAULT_MAX_READ_BYTES
    for permission, default in DEFAULT_PERMISSIONS.items():
        assert fields[permission]["default"] is default


def test_stored_options_survive_a_round_trip_through_the_form():
    stored = {
        CONF_BUCKET: "my-bucket",
        CONF_ROOT_PREFIX: "photos",
        CONF_ALLOW_DELETE: True,
    }
    fields = {
        field["name"]: field
        for field in _serialize(config_flow._build_schema(config_flow._stored(stored)))
    }
    assert fields[CONF_BUCKET]["default"] == "my-bucket"
    assert fields[CONF_ROOT_PREFIX]["default"] == "photos"
    assert fields[CONF_ALLOW_DELETE]["default"] is True


def test_new_keys_appear_for_an_older_entry():
    """An entry saved before a field existed must still open."""
    merged = config_flow._stored({CONF_BUCKET: "old"})
    assert merged[CONF_NOTES_FOLDER] == DEFAULT_NOTES_FOLDER
    assert merged[CONF_BUCKET] == "old"


# ---------------------------------------------------------------------------
# Validation and cleaning.
# ---------------------------------------------------------------------------


def test_clean_normalises_whitespace():
    options = config_flow._clean(
        {
            CONF_BUCKET: "  spaced  ",
            CONF_ACCESS_KEY_ID: " key ",
            CONF_NOTES_FOLDER: "  journal ",
        },
        {},
    )
    assert options[CONF_BUCKET] == "spaced"
    assert options[CONF_ACCESS_KEY_ID] == "key"
    assert options[CONF_NOTES_FOLDER] == "journal"


def test_a_blank_secret_keeps_the_stored_one():
    """The secret is a password box: blank means untouched, not cleared."""
    options = config_flow._clean(
        {CONF_SECRET_ACCESS_KEY: ""},
        {CONF_SECRET_ACCESS_KEY: "stored-secret"},
    )
    assert options[CONF_SECRET_ACCESS_KEY] == "stored-secret"


def test_a_typed_secret_replaces_the_stored_one():
    options = config_flow._clean(
        {CONF_SECRET_ACCESS_KEY: "new-secret"},
        {CONF_SECRET_ACCESS_KEY: "stored-secret"},
    )
    assert options[CONF_SECRET_ACCESS_KEY] == "new-secret"


def test_a_missing_bucket_is_refused():
    errors = config_flow._field_errors({CONF_BUCKET: ""})
    assert errors == {"base": "bucket_required"}


def test_a_root_folder_that_climbs_out_is_refused():
    errors = config_flow._field_errors(
        {CONF_BUCKET: "b", CONF_ROOT_PREFIX: "notes/../../etc"}
    )
    assert errors == {"base": "invalid_root_prefix"}


def test_a_bad_notes_folder_is_refused():
    errors = config_flow._field_errors(
        {CONF_BUCKET: "b", CONF_NOTES_FOLDER: "../escape"}
    )
    assert errors == {"base": "invalid_notes_folder"}


def test_half_a_credential_pair_is_refused():
    errors = config_flow._field_errors(
        {CONF_BUCKET: "b", CONF_ACCESS_KEY_ID: "key", CONF_SECRET_ACCESS_KEY: ""}
    )
    assert errors == {"base": "credentials_incomplete"}


def test_no_credentials_at_all_is_allowed_for_instance_roles():
    assert config_flow._field_errors(
        {CONF_BUCKET: "b", CONF_ACCESS_KEY_ID: "", CONF_SECRET_ACCESS_KEY: ""}
    ) == {}


def test_complete_credentials_pass():
    assert config_flow._field_errors(
        {CONF_BUCKET: "b", CONF_ACCESS_KEY_ID: "key", CONF_SECRET_ACCESS_KEY: "s"}
    ) == {}


# ---------------------------------------------------------------------------
# The two flows must stay in step.
# ---------------------------------------------------------------------------


def test_both_flows_share_one_schema_builder():
    """A second, hand-maintained copy of the form is how the flows drift."""
    assert issubclass(config_flow.S3FilesOptionsFlow, config_flow._SettingsForm)
    assert issubclass(config_flow.S3FilesConfigFlow, config_flow._SettingsForm)
    assert config_flow.S3FilesOptionsFlow._show is config_flow._SettingsForm._show
    assert config_flow.S3FilesOptionsFlow._submit is config_flow._SettingsForm._submit


def test_the_options_flow_reports_stored_options():
    entry = type("Entry", (), {"options": {CONF_BUCKET: "b", CONF_ALLOW_DELETE: True}})()
    flow = config_flow.S3FilesOptionsFlow(entry)
    current = flow._current()
    assert current[CONF_BUCKET] == "b"
    assert current[CONF_ALLOW_DELETE] is True


def test_the_config_flow_aborts_when_already_configured():
    """One bucket per install, as designed."""
    source = __import__("inspect").getsource(
        config_flow.S3FilesConfigFlow.async_step_user
    )
    assert "already_configured" in source
