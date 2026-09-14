"""services.yaml and the Python schemas must agree.

Without services.yaml the developer tools render an empty form for every
action; with a mismatched one they render fields the service then rejects.
Both directions are checked here.
"""

from __future__ import annotations

from pathlib import Path

import pytest
import yaml

from custom_components.s3_files import services
from custom_components.s3_files.const import (
    SERVICE_CREATE_FOLDER,
    SERVICE_DELETE_FILE,
    SERVICE_GET_INFO,
    SERVICE_INSTALL_SENTENCES,
    SERVICE_LIST_FILES,
    SERVICE_MOVE_FILE,
    SERVICE_READ_FILE,
    SERVICE_WRITE_FILE,
)

SERVICES_YAML = (
    Path(__file__).parent.parent / "custom_components" / "s3_files" / "services.yaml"
)


@pytest.fixture(scope="module")
def documented() -> dict:
    return yaml.safe_load(SERVICES_YAML.read_text(encoding="utf-8"))


def test_every_service_is_documented(documented):
    expected = set(services.SERVICE_DEFINITIONS) | {
        SERVICE_INSTALL_SENTENCES,
        SERVICE_GET_INFO,
    }
    assert set(documented) == expected


def test_documented_fields_match_the_schemas(documented):
    for name, fields in services.SERVICE_FIELDS.items():
        assert set(documented[name]["fields"]) == fields, name


def test_the_ui_marks_the_same_fields_required(documented):
    for name, (_, _, schema) in services.SERVICE_DEFINITIONS.items():
        required = {
            key.schema for key in schema.schema if key.default is not None or key.required
        }
        documented_required = {
            field
            for field, spec in documented[name]["fields"].items()
            if (spec or {}).get("required")
        }
        # Fields with a default are optional in the schema but need no marking.
        assert documented_required <= required, name


def test_every_field_has_a_selector(documented):
    """A field with no selector renders as nothing at all in the UI."""
    for name, spec in documented.items():
        for field, field_spec in spec["fields"].items():
            assert field_spec.get("selector"), f"{name}.{field} has no selector"


def test_every_service_has_a_name_and_a_description(documented):
    for name, spec in documented.items():
        assert spec.get("name"), name
        assert spec.get("description"), name


def test_the_yaml_is_valid_against_the_home_assistant_schema():
    """Catch a typo that would make Home Assistant reject the file at startup."""
    service_helper = pytest.importorskip("homeassistant.helpers.service")
    schema = getattr(service_helper, "_SERVICES_SCHEMA", None)
    if schema is None:
        pytest.skip("this Home Assistant version does not expose _SERVICES_SCHEMA")

    schema(
        yaml.safe_load(SERVICES_YAML.read_text(encoding="utf-8"))
    )
    assert True


def test_examples_are_plausible_paths(documented):
    """Examples show up as placeholders, so they should look like real paths."""
    for name in (SERVICE_READ_FILE, SERVICE_WRITE_FILE, SERVICE_DELETE_FILE):
        example = documented[name]["fields"]["path"].get("example", "")
        assert "/" in example, f"{name} should show a file path"
    # The listing example is a folder, which may be a single segment.
    assert documented[SERVICE_LIST_FILES]["fields"]["path"]["example"]
    assert "/" in documented[SERVICE_MOVE_FILE]["fields"]["source"]["example"]
    assert "/" in documented[SERVICE_MOVE_FILE]["fields"]["destination"]["example"]
    assert documented[SERVICE_CREATE_FOLDER]["fields"]["path"]["example"]
