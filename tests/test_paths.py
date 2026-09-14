"""Scope and path handling — the guarantee that nothing escapes the folder.

Pure stdlib, so it runs without a Home Assistant runtime.
"""

from __future__ import annotations

from datetime import datetime

import pytest

from custom_components.s3_files.paths import (
    MAX_KEY_BYTES,
    PathError,
    describe_scope,
    is_within,
    normalize_folder,
    normalize_path,
    normalize_prefix,
    note_key,
    resolve_key,
    slugify,
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
        ("Take out the trash!", "take-out-the-trash"),
        ("  spaced  out  ", "spaced-out"),
        ("Ünïcödé", "unicode"),
        ("!!!", "note"),
        ("", "note"),
    ],
)
def test_slugify(text, expected):
    assert slugify(text) == expected


def test_slugify_truncates_long_titles():
    assert len(slugify("word " * 100)) <= 60


def test_note_key_is_timestamped_and_readable():
    when = datetime(2026, 9, 14, 14, 30, 5)
    assert note_key("notes", "Take out the trash", when) == (
        "notes/2026-09-14-143005-take-out-the-trash.md"
    )


def test_note_key_without_a_notes_folder():
    when = datetime(2026, 9, 14, 14, 30, 5)
    assert note_key("", "Ideas", when) == "2026-09-14-143005-ideas.md"


def test_note_key_ends_up_inside_the_scope():
    """The generated path must survive the same resolution as user input."""
    when = datetime(2026, 9, 14, 14, 30, 5)
    key = resolve_key("homeassistant", note_key("notes", "x", when))
    assert key.startswith("homeassistant/notes/")


def test_describe_scope():
    assert describe_scope("") == "the whole bucket"
    assert "notes/" in describe_scope("notes")
