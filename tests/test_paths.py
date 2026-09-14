"""Scope and path handling — the guarantee that nothing escapes the folder.

Pure stdlib, so it runs without a Home Assistant runtime.
"""

from __future__ import annotations

import re

import pytest

from custom_components.s3_files.paths import (
    MAX_KEY_BYTES,
    PathError,
    describe_scope,
    is_within,
    normalize_folder,
    normalize_path,
    normalize_prefix,
    note_filename,
    note_key,
    resolve_key,
    split_parent,
    to_relative,
)


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("notes/today.md", "notes/today.md"),
        ("/notes/today.md", "notes/today.md"),
        ("notes//today.md", "notes/today.md"),
        ("notes/today.md/", "notes/today.md"),
        ("./notes/./today.md", "notes/today.md"),
        ("notes\\today.md", "notes/today.md"),
        ("  notes/today.md  ", "notes/today.md"),
        ("", ""),
        (None, ""),
        ("/", ""),
        # '..' is resolved inside the path, which is allowed...
        ("notes/a/../today.md", "notes/today.md"),
    ],
)
def test_normalize_path(raw, expected):
    assert normalize_path(raw) == expected


@pytest.mark.parametrize(
    "raw",
    ["../secret", "a/../../secret", "..", "a/../..", "../"],
)
def test_normalize_path_refuses_to_climb_above_the_root(raw):
    with pytest.raises(PathError) as err:
        normalize_path(raw)
    assert "outside the folder" in str(err.value)


@pytest.mark.parametrize("raw", ["bad\x00name", "bad\x01name"])
def test_normalize_path_refuses_control_characters(raw):
    with pytest.raises(PathError):
        normalize_path(raw)


def test_normalize_folder_keeps_the_trailing_slash():
    assert normalize_folder("notes/sub/") == "notes/sub/"
    assert normalize_folder("") == ""
    assert normalize_folder("notes") == "notes/"


def test_normalize_prefix_rejects_parent_segments():
    with pytest.raises(PathError):
        normalize_prefix("notes/../etc")
    assert normalize_prefix("/notes/sub/") == "notes/sub"
    assert normalize_prefix(None) == ""
    assert normalize_prefix("   ") == ""


def test_resolve_key_joins_the_scope():
    assert resolve_key("notes", "today.md") == "notes/today.md"
    assert resolve_key("notes/", "today.md") == "notes/today.md"
    assert resolve_key("", "today.md") == "today.md"
    assert resolve_key("notes", "") == "notes"


def test_resolve_key_marks_folders():
    assert resolve_key("notes", "sub", folder=True) == "notes/sub/"
    assert resolve_key("notes", "sub/", folder=True) == "notes/sub/"


def test_resolve_key_refuses_an_empty_path_by_default():
    with pytest.raises(PathError) as err:
        resolve_key("", "")
    assert "empty" in str(err.value)


def test_resolve_key_can_address_the_bucket_root_for_listings():
    assert resolve_key("", "", allow_root=True) == ""
    # A configured scope always has a key, so allow_root changes nothing.
    assert resolve_key("notes", "", allow_root=True) == "notes"


def test_resolve_key_refuses_escapes_through_the_scope():
    with pytest.raises(PathError):
        resolve_key("notes", "../outside.md")
    with pytest.raises(PathError):
        resolve_key("notes/sub", "../../outside.md")


def test_resolve_key_refuses_overlong_keys():
    with pytest.raises(PathError) as err:
        resolve_key("", "a" * (MAX_KEY_BYTES + 1))
    assert "limit" in str(err.value)


@pytest.mark.parametrize(
    ("key", "root", "expected"),
    [
        ("notes/a.md", "notes", True),
        ("notes", "notes", True),
        ("notes/", "notes", True),
        # A sibling that merely shares the name prefix is NOT inside.
        ("notes-backup/a.md", "notes", False),
        ("other/a.md", "notes", False),
        ("anything", "", True),
        ("notes/a.md", "", True),
    ],
)
def test_is_within(key, root, expected):
    assert is_within(key, root) is expected


def test_to_relative_round_trips_with_resolve_key():
    for path in ("a.md", "sub/a.md", "sub/deep/a.md"):
        key = resolve_key("notes", path)
        assert to_relative("notes", key) == path
    assert to_relative("", "a.md") == "a.md"


def test_to_relative_leaves_foreign_keys_alone():
    assert to_relative("notes", "elsewhere/a.md") == "elsewhere/a.md"


def test_split_parent():
    assert split_parent("notes/a.md") == ("notes", "a.md")
    assert split_parent("a.md") == ("", "a.md")
    assert split_parent("") == ("", "")


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        # The words the user said, kept readable: no dashes, no timestamp.
        ("buy milk and bread", "Buy milk and bread"),
        ("Call the plumber", "Call the plumber"),
        ("  spaced   out  ", "Spaced out"),
        ("Take out the trash!", "Take out the trash"),
        ("Ünïcödé note", "Ünïcödé note"),
        # Nothing usable left -> a sane fallback rather than a blank name.
        ("", "Note"),
        ("   ", "Note"),
        ("!!!", "Note"),
        ("///", "Note"),
        ("..", "Note"),
    ],
)
def test_note_filename(text, expected):
    assert note_filename(text) == expected


def test_note_filename_has_no_dashes_joining_the_words():
    name = note_filename("take out the trash")
    assert name == "Take out the trash"
    assert "-" not in name


def test_note_filename_carries_no_date():
    """The timestamp used to prefix every note; it made names unreadable."""
    name = note_filename("buy milk")
    assert name == "Buy milk"
    assert not re.search(r"\d{4}[-_]\d{2}[-_]\d{2}", name)


def test_note_filename_cuts_to_the_first_sentence():
    assert (
        note_filename("I parked in bay 12. The ticket is in the glovebox.")
        == "I parked in bay 12"
    )


def test_note_filename_does_not_split_an_abbreviation():
    """A dot inside a word is not the end of a sentence."""
    assert note_filename("See e.g. the manual") == "See e.g. the manual"


def test_note_filename_truncates_long_notes_on_a_word_boundary():
    text = (
        "Remember to buy milk and bread and eggs and cheese and butter and jam "
        "and tea and coffee and rice"
    )
    name = note_filename(text)

    assert len(name) <= 60
    assert len(name) < len(text), "a long note should have been shortened"
    # A whole prefix, so the name never ends mid-word.
    assert text.startswith(name)
    assert not name.endswith(" ")


def test_note_filename_removes_path_separators():
    """A separator in a name would silently become a folder."""
    name = note_filename("holiday/plans 2026")
    assert "/" not in name
    assert name == "Holiday plans 2026"


def test_note_filename_strips_characters_that_break_clients():
    name = note_filename('report: "final" <v2>?')
    for bad in '<>:"/\\|?*':
        assert bad not in name


def test_note_key_uses_the_filename():
    assert note_key("notes", "buy milk") == "notes/Buy milk.md"
    assert note_key("", "Ideas") == "Ideas.md"


def test_note_key_without_a_notes_folder():
    assert note_key("", "Ideas") == "Ideas.md"


def test_note_key_ends_up_inside_the_scope():
    """The generated path must survive the same resolution as user input."""
    key = resolve_key("homeassistant", note_key("notes", "buy milk"))
    assert key == "homeassistant/notes/Buy milk.md"


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        # An assistant may pass the whole utterance as the note text; the
        # command words are not part of the note.
        ("take a note that the boiler is booked", "The boiler is booked"),
        ("Take a note buy milk", "Buy milk"),
        ("make a note that call mum", "Call mum"),
        ("save a note the door code is 1234", "The door code is 1234"),
        ("note down pick up the parcel", "Pick up the parcel"),
        ("note that the bins go out tonight", "The bins go out tonight"),
        ("remember that I parked in bay 12", "I parked in bay 12"),
        ("please take a note that the tap drips", "The tap drips"),
    ],
)
def test_note_filename_drops_a_leading_command(text, expected):
    assert note_filename(text) == expected


def test_note_filename_keeps_a_command_phrase_that_is_the_content():
    """Only a leading trigger is removed; the words are otherwise kept."""
    assert note_filename("Take the bins out") == "Take the bins out"
    assert note_filename("Note the door code") == "Note the door code"


def test_describe_scope():
    assert describe_scope("") == "the whole bucket"
    assert "notes/" in describe_scope("notes")
