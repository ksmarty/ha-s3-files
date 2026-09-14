"""Translations.

Home Assistant compiles every translation value with formatjs. A literal brace
that is not escaped raises MISSING_VALUE in the dialog, which is how the
sibling project shipped a broken label once — hence the brace check below.
"""

from __future__ import annotations

import json
from pathlib import Path

import pytest

from custom_components.s3_files.const import PERMISSIONS

INTEGRATION = Path(__file__).parent.parent / "custom_components" / "s3_files"
STRINGS = INTEGRATION / "strings.json"
EN = INTEGRATION / "translations" / "en.json"


@pytest.fixture(scope="module")
def strings() -> dict:
    return json.loads(STRINGS.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def english() -> dict:
    return json.loads(EN.read_text(encoding="utf-8"))


def test_both_files_are_valid_json():
    json.loads(STRINGS.read_text(encoding="utf-8"))
    json.loads(EN.read_text(encoding="utf-8"))


def test_english_matches_strings(strings, english):
    """The source strings and the shipped English file must not drift."""
    assert english == strings


def _walk(node, path=()):
    if isinstance(node, dict):
        for key, value in node.items():
            yield from _walk(value, (*path, str(key)))
    elif isinstance(node, list):
        for index, value in enumerate(node):
            yield from _walk(value, (*path, str(index)))
    elif isinstance(node, str):
        yield path, node


def test_no_unescaped_braces(strings):
    """Literal braces must be escaped as '{...}' or the frontend throws."""
    offenders = []
    for path, value in _walk(strings):
        for index, char in enumerate(value):
            if char in "{}" and (index == 0 or value[index - 1] != "'"):
                offenders.append(".".join(path))
                break
    assert offenders == [], (
        "these translation values contain an unescaped brace and will raise "
        f"MISSING_VALUE in the UI: {offenders}"
    )


def test_config_and_options_steps_are_described(strings):
    for section in ("config", "options"):
        step = strings[section]["step"]["user" if section == "config" else "init"]
        assert step["title"]
        assert step["description"]


def test_every_permission_has_a_label_and_an_explanation(strings):
    for section, step_name in (("config", "user"), ("options", "init")):
        step = strings[section]["step"][step_name]
        for permission in PERMISSIONS:
            assert permission in step["data"], f"{section}: {permission}"
            # The label alone was not enough for the sibling project: the
            # description is what tells the user what switching it on does.
            assert permission in step["data_description"], f"{section}: {permission}"


def test_every_form_field_has_a_translation():
    pytest.importorskip("homeassistant")
    from homeassistant.helpers import config_validation as cv
    import voluptuous_serialize

    from custom_components.s3_files.config_flow import _build_schema, _defaults

    fields = voluptuous_serialize.convert(
        _build_schema(_defaults()), custom_serializer=cv.custom_serializer
    )
    labels = json.loads(STRINGS.read_text(encoding="utf-8"))["config"]["step"]["user"]["data"]
    missing = [field["name"] for field in fields if field["name"] not in labels]
    assert missing == [], f"fields with no label in strings.json: {missing}"


def test_every_error_key_used_in_code_is_translated(strings):
    """A missing error key shows the user a raw key such as 'invalid_auth'."""
    import re

    source = (INTEGRATION / "config_flow.py").read_text(encoding="utf-8")
    keys = set(re.findall(r'"base":\s*"([a-z_]+)"', source))
    keys |= set(
        re.findall(
            r':\s*"(cannot_connect|invalid_auth|bucket_not_found|not_found|unknown)"',
            source,
        )
    )

    assert keys, "no error keys found — the extraction pattern has gone stale"
    assert keys <= set(strings["config"]["error"])


def test_the_error_keys_cover_both_flows(strings):
    assert set(strings["config"]["error"]) == set(strings["options"]["error"])
