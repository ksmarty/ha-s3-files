"""Path handling for S3 Files.

Everything the integration touches is expressed as a **scope relative** path
("notes/today.md"), never as a raw bucket key. Two reasons:

* the configured root folder is what the user scoped the integration to, so a
  path that cannot be expressed relative to it must simply be refused;
* listings return scope relative paths too, so a path the user (or an LLM)
  copied out of ``list_files`` can be fed straight back into ``read_file``
  without the root folder being applied twice.

This module is deliberately stdlib-only so it can be unit tested without a
Home Assistant runtime.
"""

from __future__ import annotations

import re
import unicodedata
from datetime import datetime

# S3 keys are limited to 1024 bytes of UTF-8.
MAX_KEY_BYTES = 1024
# Guard against absurd folder names from a model.
MAX_SLUG_LENGTH = 60


class PathError(ValueError):
    """Raised when a path is malformed or points outside the configured scope."""


_SLUG_STRIP = re.compile(r"[^a-z0-9]+")


def _reject_unsafe(path: str) -> None:
    """Reject characters that have no business in a key."""
    if "\x00" in path:
        raise PathError("The path contains a null byte.")
    for char in path:
        if unicodedata.category(char) == "Cc":
            raise PathError("The path contains a control character.")


def normalize_path(path: str | None) -> str:
    """Return a validated, scope relative path.

    Accepts the shapes a person or a model actually produces: leading and
    trailing slashes, backslashes, doubled separators and ``.`` segments are
    all normalised away. ``..`` is resolved as well, but only *within* the
    path — climbing above the top is refused, because that is exactly how a
    path would escape the configured folder.

    An empty string is valid and means "the root folder itself".
    """
    if path is None:
        return ""
    if not isinstance(path, str):
        raise PathError("The path must be text.")

    _reject_unsafe(path)

    text = path.replace("\\", "/").strip()
    if text in ("", "/"):
        return ""

    segments: list[str] = []
    for segment in text.split("/"):
        if segment in ("", "."):
            continue
        if segment == "..":
            if not segments:
                raise PathError(
                    "The path points outside the folder this integration is "
                    "allowed to use."
                )
            segments.pop()
            continue
        segments.append(segment)

    return "/".join(segments)


def normalize_folder(path: str | None) -> str:
    """Like :func:`normalize_path`, but always ends in ``/`` (or is empty)."""
    normalized = normalize_path(path)
    return f"{normalized}/" if normalized else ""


def normalize_prefix(prefix: str | None) -> str:
    """Normalise the configured root folder into a key prefix."""
    if not prefix or not str(prefix).strip():
        return ""

    text = str(prefix).strip()
    _reject_unsafe(text)

    segments: list[str] = []
    for segment in text.replace("\\", "/").split("/"):
        if segment in ("", "."):
            continue
        if segment == "..":
            raise PathError(
                "The root folder must not contain '..' segments."
            )
        segments.append(segment)

    return "/".join(segments)


def _scope(root_prefix: str | None) -> str:
    """Normalise a scope root.

    Callers may hold the root with a trailing slash (a hand written value, a
    test), and comparing "notes/" against a key built from "notes" would make
    a legitimate key look like an escape.
    """
    return normalize_prefix(root_prefix)


def resolve_key(
    root_prefix: str,
    path: str | None,
    *,
    folder: bool = False,
    allow_root: bool = False,
) -> str:
    """Return the full bucket key for a scope relative path.

    ``folder=True`` yields a key ending in ``/``, which is how S3 represents a
    folder marker.

    ``allow_root=True`` permits an empty key, which only a listing of a bucket
    with no configured root folder can legitimately produce. Every file
    operation leaves it off, so an empty path is still refused there.
    """
    root = _scope(root_prefix)
    relative = normalize_folder(path) if folder else normalize_path(path)

    key = f"{root}/{relative}" if root else relative
    # normalize_path drops any trailing slash left by the concatenation, so the
    # empty-relative-path case ("notes/") comes back as "notes".
    key = normalize_path(key)
    if folder and key:
        key = f"{key}/"

    if not key:
        if allow_root:
            return ""
        raise PathError("That path is empty.")

    if len(key.encode("utf-8")) > MAX_KEY_BYTES:
        raise PathError(
            f"The path is longer than the {MAX_KEY_BYTES} byte limit S3 allows."
        )

    if not is_within(key, root):
        # Cannot happen while keys are built by concatenation, but the whole
        # point of the scope is that this holds no matter how it is built.
        raise PathError(
            "The path points outside the folder this integration is allowed to "
            "use."
        )

    return key


def to_relative(root_prefix: str, key: str) -> str:
    """Turn a full bucket key back into a scope relative path."""
    root = _scope(root_prefix)
    if not root:
        return key
    if key == root:
        return ""
    prefix = f"{root}/"
    if key.startswith(prefix):
        return key[len(prefix) :]
    return key


def is_within(key: str, root_prefix: str) -> bool:
    """Whether a full key sits inside the configured root folder.

    Compared segment by segment, so a sibling folder that merely shares a
    prefix (``notes-backup/`` next to ``notes/``) is correctly recognised as
    being outside.
    """
    root = _scope(root_prefix)
    if not root:
        return True
    if key == root:
        return True
    return key.startswith(f"{root}/")


def split_parent(path: str) -> tuple[str, str]:
    """Split a scope relative path into ``(parent, name)``."""
    normalized = normalize_path(path)
    if not normalized:
        return "", ""
    parent, _, name = normalized.rpartition("/")
    return parent, name


def slugify(text: str, *, fallback: str = "note") -> str:
    """Turn arbitrary text into a safe, readable filename component."""
    ascii_text = (
        unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    )
    slug = _SLUG_STRIP.sub("-", ascii_text.lower()).strip("-")
    slug = slug[:MAX_SLUG_LENGTH].strip("-")
    return slug or fallback


def note_key(notes_folder: str, title: str, when: datetime) -> str:
    """Build the scope relative path for a new note.

    Timestamped so two notes taken in the same minute cannot collide, and
    sortable in a plain ``list_files``.
    """
    folder = normalize_prefix(notes_folder)
    slug = slugify(title)
    stamp = when.strftime("%Y-%m-%d-%H%M%S")
    name = f"{stamp}-{slug}.md"
    return f"{folder}/{name}" if folder else name


def describe_scope(root_prefix: str) -> str:
    """Human readable description of the configured scope, for prompts/errors."""
    if not root_prefix:
        return "the whole bucket"
    return f"the bucket folder '{root_prefix}/'"
