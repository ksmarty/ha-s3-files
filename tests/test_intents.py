"""Intents: registration gating and what they actually do.

These run against a real Home Assistant runtime (the intent helpers need one)
with moto standing in for S3.
"""

from __future__ import annotations

import asyncio
import inspect
import os

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("boto3")
moto = pytest.importorskip("moto")

from moto import mock_aws  # noqa: E402

from custom_components.s3_files import intents as intents_module  # noqa: E402
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
)
from custom_components.s3_files.hub import HUB_KEY, build_hub  # noqa: E402

from conftest import options  # noqa: E402

BUCKET = "ha-files"

INTENT_CLASSES = intents_module.INTENT_CLASSES
_BY_TYPE = {cls.intent_type: cls for cls in INTENT_CLASSES}


@pytest.fixture(autouse=True)
def aws_env(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-key")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test-secret")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")


def _make_bucket() -> None:
    import boto3

    boto3.client("s3", region_name="us-east-1").create_bucket(Bucket=BUCKET)


def _run(tmp_path, overrides, body):
    """Set up a Home Assistant runtime, a hub, and the intents."""

    async def _inner():
        from homeassistant.core import HomeAssistant
        from homeassistant.helpers import frame, intent as intent_helper

        config_dir = str(tmp_path)
        os.makedirs(os.path.join(config_dir, ".storage"), exist_ok=True)

        hass = HomeAssistant(config_dir)
        hass.config.config_dir = config_dir
        if hasattr(frame, "async_setup"):
            frame.async_setup(hass)

        hub = build_hub(hass, options(**overrides))
        hass.data[DOMAIN] = {HUB_KEY: hub}
        registered = intents_module.async_setup_intents(hass, hub)

        try:
            result = body(hass, hub, registered, intent_helper)
            if inspect.isawaitable(result):
                result = await result
            return result
        finally:
            intents_module.async_remove_intents(hass, registered)
            await hass.async_stop()

    return asyncio.run(_inner())


async def _handle(hass, intent_type, slots):
    """Fire an intent the way Assist or an LLM tool would."""
    from homeassistant.helpers import intent as intent_helper

    return await intent_helper.async_handle(
        hass,
        "conftest",
        intent_type,
        {key: {"value": value} for key, value in slots.items()},
    )


def _speech(response) -> str:
    return response.speech["plain"]["speech"]


def _extra(response):
    return response.speech["plain"].get("extra_data")


# ---------------------------------------------------------------------------
# Registration gating — the whole point of "only expose enabled actions".
# ---------------------------------------------------------------------------


def test_only_enabled_intents_are_registered(tmp_path):
    def body(hass, hub, registered, intent_helper):
        return registered

    registered = _run(
        tmp_path,
        {
            CONF_ALLOW_LIST: True,
            CONF_ALLOW_READ: True,
            CONF_ALLOW_WRITE: True,
            CONF_ALLOW_DELETE: False,
            CONF_ALLOW_MOVE: False,
            CONF_ALLOW_MKDIR: False,
        },
        body,
    )
    assert set(registered) == {INTENT_CREATE_NOTE, INTENT_WRITE_FILE, INTENT_LIST_FILES, INTENT_READ_FILE}
    assert INTENT_DELETE_FILE not in registered
    assert INTENT_MOVE_FILE not in registered


def test_all_intents_are_registered_when_all_permissions_are_on(tmp_path):
    def body(hass, hub, registered, intent_helper):
        return registered

    registered = _run(tmp_path, {name: True for name in PERMISSIONS}, body)
    assert set(registered) == {cls.intent_type for cls in INTENT_CLASSES}


def test_no_intents_are_registered_when_everything_is_off(tmp_path):
    def body(hass, hub, registered, intent_helper):
        return registered

    assert _run(tmp_path, {name: False for name in PERMISSIONS}, body) == []


def test_a_disabled_intent_cannot_be_called_even_if_reached(tmp_path):
    """An LLM tool object can outlive a reload, so the check is repeated."""

    async def body(hass, hub, registered, intent_helper):
        from homeassistant.helpers import intent as intent_helper_mod

        handler = _BY_TYPE[INTENT_WRITE_FILE]()
        with pytest.raises(intent_helper_mod.IntentHandleError) as err:
            await handler.async_handle(
                _intent_object(hass, INTENT_WRITE_FILE, {"path": "a.md", "content": "x"})
            )
        return str(err.value)

    message = _run(
        tmp_path,
        {CONF_ALLOW_WRITE: False, CONF_ALLOW_LIST: True},
        body,
    )
    # A refusal has to be speakable: the user hears this text.
    assert "not allowed to create and overwrite files" in message
    assert "options" in message


def _intent_object(hass, intent_type, slots):
    from homeassistant.helpers import intent as intent_helper

    return intent_helper.Intent(
        hass=hass,
        platform="conftest",
        intent_type=intent_type,
        slots={key: {"value": value} for key, value in slots.items()},
        text_input=None,
        language="en",
        context=None,
    )


# ---------------------------------------------------------------------------
# Behaviour.
# ---------------------------------------------------------------------------


@mock_aws
def test_taking_a_note_creates_a_markdown_file(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        response = await _handle(
            hass, INTENT_CREATE_NOTE, {"note": "Buy milk and bread"}
        )
        return _speech(response), _extra(response), hub

    speech, extra, hub = _run(tmp_path, {CONF_ALLOW_WRITE: True}, body)

    assert "Noted as" in speech
    path = extra["path"]
    # No notes folder is configured, so the note goes directly in the scope.
    assert "/" not in path, path
    # A readable name taken from the note: the words the user said, no dashes
    # and no timestamp.
    assert path == "Buy milk and bread.md"

    import boto3

    stored = boto3.client("s3", region_name="us-east-1").get_object(
        Bucket=BUCKET, Key=path
    )["Body"].read()
    # No explicit name was given, so the file is just the note text — the
    # filename already carries the title.
    assert stored == b"Buy milk and bread\n"


@mock_aws
def test_a_named_note_uses_the_name(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        response = await _handle(
            hass,
            INTENT_CREATE_NOTE,
            {"note": "the door code is 1234", "name": "Front door"},
        )
        return _extra(response)["path"]

    path = _run(tmp_path, {CONF_ALLOW_WRITE: True}, body)
    assert path == "Front door.md"


@mock_aws
def test_a_named_note_gets_a_heading(tmp_path):
    """With a name, the heading is that name so the note reads properly."""
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        response = await _handle(
            hass,
            INTENT_CREATE_NOTE,
            {"note": "the door code is 1234", "name": "Front door"},
        )
        return _extra(response)["path"]

    path = _run(tmp_path, {CONF_ALLOW_WRITE: True}, body)

    import boto3

    stored = boto3.client("s3", region_name="us-east-1").get_object(
        Bucket=BUCKET, Key=path
    )["Body"].read()
    assert stored == b"# Front door\n\nthe door code is 1234\n"


@mock_aws
def test_the_same_note_twice_does_not_overwrite_the_first(tmp_path):
    """Losing a note because you dictated the same words is not acceptable."""
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        first = await _handle(hass, INTENT_CREATE_NOTE, {"note": "buy milk"})
        second = await _handle(hass, INTENT_CREATE_NOTE, {"note": "buy milk"})
        third = await _handle(hass, INTENT_CREATE_NOTE, {"note": "buy milk"})
        return [
            _extra(first)["path"],
            _extra(second)["path"],
            _extra(third)["path"],
        ]

    paths = _run(tmp_path, {CONF_ALLOW_WRITE: True}, body)
    assert paths == ["Buy milk.md", "Buy milk (2).md", "Buy milk (3).md"]

    import boto3

    keys = sorted(
        item["Key"]
        for item in boto3.client("s3", region_name="us-east-1").list_objects_v2(
            Bucket=BUCKET
        )["Contents"]
    )
    assert keys == ["Buy milk (2).md", "Buy milk (3).md", "Buy milk.md"]


@mock_aws
def test_a_second_note_keeps_the_extension_when_renamed(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        await _handle(hass, INTENT_CREATE_NOTE, {"note": "buy milk"})
        second = await _handle(hass, INTENT_CREATE_NOTE, {"note": "buy milk"})
        return _extra(second)["path"]

    path = _run(tmp_path, {CONF_ALLOW_WRITE: True}, body)
    assert path == "Buy milk (2).md"
    assert not path.endswith(".md.md")


@mock_aws
def test_listing_reports_paths_and_count(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        await _handle(hass, INTENT_WRITE_FILE, {"path": "notes/a.md", "content": "hi"})
        await _handle(hass, INTENT_WRITE_FILE, {"path": "notes/b.md", "content": "ho"})
        response = await _handle(hass, INTENT_LIST_FILES, {"path": "notes"})
        return _speech(response), _extra(response)

    speech, extra = _run(
        tmp_path, {CONF_ALLOW_WRITE: True, CONF_ALLOW_LIST: True}, body
    )
    assert extra["count"] == 2
    assert {entry["path"] for entry in extra["files"]} == {"notes/a.md", "notes/b.md"}
    assert "notes/a.md" in speech


@mock_aws
def test_listing_an_empty_folder_says_so(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        response = await _handle(hass, INTENT_LIST_FILES, {})
        return _speech(response), _extra(response)

    speech, extra = _run(tmp_path, {CONF_ALLOW_LIST: True}, body)
    assert "nothing" in speech
    assert extra["count"] == 0


@mock_aws
def test_reading_returns_the_content_both_ways(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        await _handle(hass, INTENT_WRITE_FILE, {"path": "a.txt", "content": "payload"})
        response = await _handle(hass, INTENT_READ_FILE, {"path": "a.txt"})
        return _speech(response), _extra(response)

    speech, extra = _run(
        tmp_path, {CONF_ALLOW_WRITE: True, CONF_ALLOW_READ: True}, body
    )
    assert "payload" in speech
    assert extra["content"] == "payload"


@mock_aws
def test_reading_a_missing_file_speaks_a_clear_error(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        from homeassistant.helpers import intent as intent_helper_mod

        with pytest.raises(intent_helper_mod.IntentHandleError) as err:
            await _handle(hass, INTENT_READ_FILE, {"path": "nope.txt"})
        return str(err.value)

    message = _run(tmp_path, {CONF_ALLOW_READ: True}, body)
    assert "not found" in message.lower() or "nothing to read" in message.lower()


@mock_aws
def test_moving_and_deleting(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        await _handle(hass, INTENT_WRITE_FILE, {"path": "a.txt", "content": "x"})
        moved = await _handle(
            hass, INTENT_MOVE_FILE, {"source": "a.txt", "destination": "b.txt"}
        )
        deleted = await _handle(hass, INTENT_DELETE_FILE, {"path": "b.txt"})
        listed = await _handle(hass, INTENT_LIST_FILES, {})
        return _speech(moved), _speech(deleted), _extra(listed)

    moved, deleted, listed = _run(
        tmp_path,
        {
            CONF_ALLOW_WRITE: True,
            CONF_ALLOW_MOVE: True,
            CONF_ALLOW_DELETE: True,
            CONF_ALLOW_LIST: True,
        },
        body,
    )
    assert "Moved a.txt to b.txt" in moved
    assert "Deleted b.txt" in deleted
    assert listed["count"] == 0


@mock_aws
def test_creating_a_folder(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        await _handle(hass, INTENT_CREATE_FOLDER, {"path": "archive"})
        listed = await _handle(hass, INTENT_LIST_FILES, {})
        return _extra(listed)

    listed = _run(
        tmp_path, {CONF_ALLOW_MKDIR: True, CONF_ALLOW_LIST: True}, body
    )
    assert [(entry["path"], entry["is_folder"]) for entry in listed["files"]] == [
        ("archive", True)
    ]


@mock_aws
def test_notes_land_inside_the_configured_scope(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        response = await _handle(hass, INTENT_CREATE_NOTE, {"note": "scoped"})
        return _extra(response)["path"]

    path = _run(
        tmp_path,
        {CONF_ALLOW_WRITE: True, "root_prefix": "homeassistant", "notes_folder": "journal"},
        body,
    )
    assert path.startswith("journal/")

    import boto3

    keys = [
        item["Key"]
        for item in boto3.client("s3", region_name="us-east-1").list_objects_v2(
            Bucket=BUCKET
        )["Contents"]
    ]
    assert keys == [f"homeassistant/{path}"]


def test_every_intent_declares_a_description_and_a_permission():
    """The description is the tool description an LLM reads — it must exist."""
    for cls in INTENT_CLASSES:
        assert cls.description, cls.__name__
        assert len(cls.description) > 40, cls.__name__
        assert cls.permission in PERMISSIONS, cls.__name__


@mock_aws
def test_notes_land_directly_in_the_scoped_folder_when_no_subfolder_is_set(tmp_path):
    """Scoping to a folder should put notes in that folder, not one below it.

    This is the reported case: the integration is scoped to "Mini Notes" and
    the notes belong directly in it. The scope contains a space, which must
    survive path handling like any other character.
    """
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        response = await _handle(hass, INTENT_CREATE_NOTE, {"note": "buy milk"})
        return _extra(response)["path"]

    path = _run(
        tmp_path,
        {CONF_ALLOW_WRITE: True, "root_prefix": "Mini Notes", "notes_folder": ""},
        body,
    )

    assert "/" not in path, f"the note was nested instead of placed directly: {path}"
    assert path == "Buy milk.md"

    import boto3

    keys = [
        item["Key"]
        for item in boto3.client("s3", region_name="us-east-1").list_objects_v2(
            Bucket=BUCKET
        )["Contents"]
    ]
    assert keys == [f"Mini Notes/{path}"]


@mock_aws
def test_a_named_notes_subfolder_still_nests(tmp_path):
    _make_bucket()

    async def body(hass, hub, registered, intent_helper):
        response = await _handle(hass, INTENT_CREATE_NOTE, {"note": "buy milk"})
        return _extra(response)["path"]

    path = _run(
        tmp_path,
        {CONF_ALLOW_WRITE: True, "root_prefix": "Mini Notes", "notes_folder": "Journal"},
        body,
    )
    assert path.startswith("Journal/")
