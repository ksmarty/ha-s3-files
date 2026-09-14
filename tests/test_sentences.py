"""The Assist sentence templates.

Loaded with the same matcher Home Assistant uses (hassil), so these tests say
what a user can actually say and what the slot ends up holding. A typo in a
slot name fails silently at runtime — the sentence simply never matches — which
is exactly the kind of bug that survives until someone complains.
"""

from __future__ import annotations

import re
from pathlib import Path

import pytest
import yaml

hassil = pytest.importorskip("hassil")

from hassil.intents import Intents  # noqa: E402
from hassil.recognize import recognize  # noqa: E402

from custom_components.s3_files.const import INTENT_PERMISSIONS  # noqa: E402
from custom_components.s3_files.intents import INTENT_CLASSES  # noqa: E402

SENTENCES = (
    Path(__file__).resolve().parents[1]
    / "custom_components"
    / "s3_files"
    / "custom_sentences"
    / "en"
    / "s3_files.yaml"
)


@pytest.fixture(scope="module")
def data() -> dict:
    return yaml.safe_load(SENTENCES.read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def intents(data) -> Intents:
    return Intents.from_dict(data)


def _match(intents: Intents, text: str):
    result = recognize(text, intents)
    if result is None:
        return None, {}
    return result.intent.name, {key: value.value for key, value in result.entities.items()}


# ---------------------------------------------------------------------------
# Structural checks.
# ---------------------------------------------------------------------------


def test_the_file_declares_its_language(data):
    assert data["language"] == "en"


def test_every_referenced_intent_exists(data):
    known = {cls.intent_type for cls in INTENT_CLASSES}
    assert set(data["intents"]) <= known, set(data["intents"]) - known


def test_every_referenced_slot_is_declared(data):
    declared = set(data.get("lists", {}))
    used: set[str] = set()
    for spec in data["intents"].values():
        for block in spec["data"]:
            for template in block["sentences"]:
                used |= set(re.findall(r"\{([a-z_]+)\}", template))
    assert used, "no slots found — the extraction pattern has gone stale"
    assert used <= declared, f"slots used but not declared: {used - declared}"


def test_free_text_slots_are_wildcards(data):
    for name in ("note", "path", "content", "source", "destination"):
        assert data["lists"][name].get("wildcard") is True, name


def test_every_sentence_covers_a_permissioned_intent(data):
    for intent_type in data["intents"]:
        assert intent_type in INTENT_PERMISSIONS, intent_type


# ---------------------------------------------------------------------------
# What a user actually says.
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("text", "note"),
    [
        # The phrasing the user asked for.
        ("take a note buy milk and bread", "buy milk and bread"),
        ("take a note that the bins go out tonight", "the bins go out tonight"),
        ("make a note call the plumber", "call the plumber"),
        ("save a note the door code is 1234", "the door code is 1234"),
        ("remember that the wifi password is hunter2", "the wifi password is hunter2"),
        ("note down pick up the parcel", "pick up the parcel"),
    ],
)
def test_phrases_that_create_a_note(intents, text, note):
    name, slots = _match(intents, text)
    assert name == "S3CreateNote", f"{text!r} matched {name}"
    assert slots.get("note") == note


def test_a_named_note_fills_both_slots(intents):
    name, slots = _match(intents, "take a note called shopping that buy milk")
    assert name == "S3CreateNote"
    assert slots.get("name") == "shopping"
    assert slots.get("note") == "buy milk"


@pytest.mark.parametrize(
    ("text", "path"),
    [
        ("list my files", None),
        ("list my files in notes", "notes"),
        ("list the files in notes/sub", "notes/sub"),
        ("what files are in archive", "archive"),
    ],
)
def test_phrases_that_list_files(intents, text, path):
    name, slots = _match(intents, text)
    assert name == "S3ListFiles", f"{text!r} matched {name}"
    assert slots.get("path") == path


@pytest.mark.parametrize(
    ("text", "path"),
    [
        ("read the file notes/ideas.md", "notes/ideas.md"),
        ("read file notes/ideas.md", "notes/ideas.md"),
        ("what is in the file notes/ideas.md", "notes/ideas.md"),
    ],
)
def test_phrases_that_read_a_file(intents, text, path):
    name, slots = _match(intents, text)
    assert name == "S3ReadFile", f"{text!r} matched {name}"
    assert slots.get("path") == path


@pytest.mark.parametrize(
    ("text", "path"),
    [
        ("delete the file notes/ideas.md", "notes/ideas.md"),
        ("remove the file notes/ideas.md", "notes/ideas.md"),
    ],
)
def test_phrases_that_delete_a_file(intents, text, path):
    name, slots = _match(intents, text)
    assert name == "S3DeleteFile", f"{text!r} matched {name}"
    assert slots.get("path") == path


@pytest.mark.parametrize(
    ("text", "source", "destination"),
    [
        ("move the file notes/a.md to archive/b.md", "notes/a.md", "archive/b.md"),
        ("rename notes/a.md to archive/b.md", "notes/a.md", "archive/b.md"),
    ],
)
def test_phrases_that_move_a_file(intents, text, source, destination):
    name, slots = _match(intents, text)
    assert name == "S3MoveFile", f"{text!r} matched {name}"
    assert slots.get("source") == source
    assert slots.get("destination") == destination


@pytest.mark.parametrize(
    ("text", "path"),
    [
        ("create a folder called archive", "archive"),
        ("create a folder archive", "archive"),
        ("make a folder called 2026", "2026"),
    ],
)
def test_phrases_that_create_a_folder(intents, text, path):
    name, slots = _match(intents, text)
    assert name == "S3CreateFolder", f"{text!r} matched {name}"
    assert slots.get("path") == path


def test_a_note_phrase_is_not_hijacked_by_another_intent(intents):
    """The note sentences must win for note-shaped input."""
    for text in (
        "take a note buy milk",
        "make a note that the bins go out",
        "remember that I parked in bay 12",
    ):
        name, _ = _match(intents, text)
        assert name == "S3CreateNote", f"{text!r} matched {name}"
