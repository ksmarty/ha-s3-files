"""Intent handlers.

These exist for two audiences at once. Assist matches the sentence templates in
`custom_sentences/en/s3_files.yaml` against them, and conversational agents call
them as LLM tools (see `llm.py`, which turns the registered handlers into
tools). The `description` of each handler is the tool description the model
reads, so it has to say what the action does *and* that it only ever touches the
configured folder.

Only the intents whose permission is switched on are registered at all, which
is what keeps a disabled action out of the LLM's tool list.
"""

from __future__ import annotations

import logging
from collections.abc import Mapping
from datetime import datetime
from typing import Any

import voluptuous as vol

from homeassistant.core import HomeAssistant
from homeassistant.helpers import intent
from homeassistant.util import dt as dt_util

from .const import (
    CONF_ALLOW_DELETE,
    CONF_ALLOW_LIST,
    CONF_ALLOW_MKDIR,
    CONF_ALLOW_MOVE,
    CONF_ALLOW_READ,
    CONF_ALLOW_WRITE,
    DEFAULT_CONTENT_TYPE,
    INTENT_CREATE_FOLDER,
    INTENT_CREATE_NOTE,
    INTENT_DELETE_FILE,
    INTENT_LIST_FILES,
    INTENT_MOVE_FILE,
    INTENT_PERMISSIONS,
    INTENT_READ_FILE,
    INTENT_WRITE_FILE,
)
from .errors import S3FilesError
from .hub import S3FilesHub, get_hub
from .paths import describe_scope, note_key

_LOGGER = logging.getLogger(__name__)


def _slot_value(slots: Mapping[str, Any], name: str) -> Any:
    """Return a slot's value.

    Home Assistant wraps every slot as ``{"value": ..., "text": ...}``, so a
    handler must never assume a plain string.
    """
    slot = slots.get(name)
    if isinstance(slot, Mapping):
        slot = slot.get("value", slot.get("text"))
    return slot


def _slot_text(slots: Mapping[str, Any], name: str) -> str:
    """Return a slot's value as trimmed text ("" when absent)."""
    value = _slot_value(slots, name)
    return "" if value is None else str(value).strip()


def _parse_int(value: Any) -> int | None:
    """Parse a number out of a spoken or supplied slot."""
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return int(value)
    try:
        return int(str(value).strip())
    except ValueError:
        return None


class _S3Intent(intent.IntentHandler):
    """Base class with the shared hub lookup and error translation."""

    # Permission required for this intent to be registered.
    permission = ""

    def _hub(self, hass: HomeAssistant) -> S3FilesHub:
        """Return the hub, refusing if this action is no longer allowed.

        Registration already keeps a disabled action out of the intent and
        tool lists, but an entry reload is not instantaneous and an LLM tool
        object can outlive one, so the permission is checked again here.
        """
        hub = get_hub(hass)
        if self.permission:
            try:
                hub.permissions.require(self.permission)
            except S3FilesError as err:
                raise intent.IntentHandleError(str(err)) from err
        return hub

    def _run(self, hass: HomeAssistant, action: Any) -> Any:
        raise NotImplementedError

    async def _guard(self, coro: Any) -> Any:
        """Run a client call, turning its failure into something spoken."""
        try:
            return await coro
        except S3FilesError as err:
            raise intent.IntentHandleError(str(err)) from err

    def _response(
        self,
        intent_obj: intent.Intent,
        speech: str,
        **extra: Any,
    ) -> intent.IntentResponse:
        """Build a response carrying both speech and structured detail.

        `extra_data` rides along inside the speech payload, which is what a
        conversational agent receives back from a tool call — so the model gets
        the path, size or listing alongside the prose.
        """
        response = intent_obj.create_response()
        response.async_set_speech(speech, extra_data=extra or None)
        return response


class S3CreateNoteIntent(_S3Intent):
    """Write a note into the notes folder."""

    intent_type = INTENT_CREATE_NOTE
    permission = CONF_ALLOW_WRITE
    description = (
        "Save a short note the user dictated as a new markdown file in their "
        "S3 notes folder. Use this for 'take a note ...', 'make a note that "
        "...' and 'note that ...'. Do not use it to overwrite an existing "
        "file; use S3WriteFile for that."
    )

    @property
    def slot_schema(self) -> dict:
        return {
            vol.Required("note"): vol.Any(str, int, float),
            vol.Optional("name"): vol.Any(str, int, float),
        }

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        hub = self._hub(hass)
        slots = self.async_validate_slots(intent_obj.slots)

        note = _slot_text(slots, "note")
        if not note:
            raise intent.IntentHandleError("I did not catch what the note should say.")

        title = _slot_text(slots, "name") or note
        when: datetime = dt_util.now()
        path = note_key(hub.notes_folder, title, when)
        body = f"# {title.strip()}\n\n{note}\n"

        result = await self._guard(
            hub.client.async_write(
                path,
                body.encode("utf-8"),
                content_type=DEFAULT_CONTENT_TYPE,
                overwrite=False,
            )
        )
        return self._response(
            intent_obj,
            f"Noted as {result['path']}.",
            path=result["path"],
            size=result["size"],
            scope=describe_scope(hub.root_prefix),
        )


class S3WriteFileIntent(_S3Intent):
    """Create or replace a file."""

    intent_type = INTENT_WRITE_FILE
    permission = CONF_ALLOW_WRITE
    description = (
        "Create or overwrite a file in the user's S3 bucket with the given "
        "text content. 'path' is relative to the allowed folder, for example "
        "'notes/ideas.md'. Set overwrite to false to refuse replacing an "
        "existing file. To save a dictated note without choosing a filename, "
        "use S3CreateNote instead."
    )

    @property
    def slot_schema(self) -> dict:
        return {
            vol.Required("path"): vol.Any(str, int, float),
            vol.Required("content"): vol.Any(str, int, float),
            vol.Optional("overwrite"): vol.Any(bool, str),
        }

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        hub = self._hub(hass)
        slots = self.async_validate_slots(intent_obj.slots)

        path = _slot_text(slots, "path")
        content = _slot_text(slots, "content")
        if not path:
            raise intent.IntentHandleError("I need a file path to write to.")

        overwrite_slot = _slot_value(slots, "overwrite")
        overwrite = True
        if isinstance(overwrite_slot, bool):
            overwrite = overwrite_slot
        elif isinstance(overwrite_slot, str) and overwrite_slot.strip():
            overwrite = overwrite_slot.strip().lower() not in ("false", "no", "0")

        result = await self._guard(
            hub.client.async_write(
                path,
                content.encode("utf-8"),
                content_type=DEFAULT_CONTENT_TYPE,
                overwrite=overwrite,
            )
        )
        return self._response(
            intent_obj,
            f"Wrote {result['path']} ({result['size']} bytes).",
            path=result["path"],
            size=result["size"],
            scope=describe_scope(hub.root_prefix),
        )


class S3ListFilesIntent(_S3Intent):
    """List files and folders."""

    intent_type = INTENT_LIST_FILES
    permission = CONF_ALLOW_LIST
    description = (
        "List the files and folders in the user's S3 bucket — use this before "
        "reading or deleting something so the path is exact. 'path' is "
        "relative to the allowed folder; leave it out to list the top level. "
        "Paths are returned relative to that folder, so they can be passed "
        "straight back to the other S3 tools."
    )

    @property
    def slot_schema(self) -> dict:
        return {
            vol.Optional("path"): vol.Any(str, int, float),
            vol.Optional("recursive"): vol.Any(bool, str),
        }

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        hub = self._hub(hass)
        slots = self.async_validate_slots(intent_obj.slots)

        path = _slot_text(slots, "path")
        recursive_slot = _slot_value(slots, "recursive")
        recursive = False
        if isinstance(recursive_slot, bool):
            recursive = recursive_slot
        elif isinstance(recursive_slot, str) and recursive_slot.strip():
            recursive = recursive_slot.strip().lower() in ("true", "yes", "1")

        entries = await self._guard(
            hub.client.async_list(path, recursive=recursive, max_results=hub.max_results)
        )
        if not entries:
            where = f"{path}/" if path else describe_scope(hub.root_prefix)
            return self._response(
                intent_obj,
                f"There is nothing in {where}.",
                files=[],
                count=0,
            )

        listing = ", ".join(
            f"{entry['path']}/" if entry["is_folder"] else entry["path"]
            for entry in entries
        )
        where = f"{path}/" if path else "the top level"
        return self._response(
            intent_obj,
            f"{len(entries)} entries in {where}: {listing}",
            files=entries,
            count=len(entries),
            path=path,
        )


class S3ReadFileIntent(_S3Intent):
    """Read a file."""

    intent_type = INTENT_READ_FILE
    permission = CONF_ALLOW_READ
    description = (
        "Read the text content of a file in the user's S3 bucket. 'path' is "
        "relative to the allowed folder and must be a path returned by "
        "S3ListFiles. Use S3ListFiles first if the exact path is unknown."
    )

    @property
    def slot_schema(self) -> dict:
        return {
            vol.Required("path"): vol.Any(str, int, float),
            vol.Optional("max_bytes"): vol.Any(str, int, float),
        }

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        hub = self._hub(hass)
        slots = self.async_validate_slots(intent_obj.slots)

        path = _slot_text(slots, "path")
        if not path:
            raise intent.IntentHandleError("I need a file path to read.")

        max_bytes = _parse_int(_slot_value(slots, "max_bytes"))
        if max_bytes is None or max_bytes < 1:
            max_bytes = hub.max_read_bytes
        max_bytes = min(max_bytes, hub.max_read_bytes)

        result = await self._guard(
            hub.client.async_read(path, max_bytes=max_bytes)
        )
        try:
            content = result["data"].decode("utf-8")
        except UnicodeDecodeError:
            return self._response(
                intent_obj,
                f"{path} is not a text file, so I cannot read it out.",
                path=path,
                size=result["size"],
                truncated=result["truncated"],
                binary=True,
            )

        note = " (truncated)" if result["truncated"] else ""
        return self._response(
            intent_obj,
            f"{path}{note}: {content}",
            path=path,
            content=content,
            size=result["size"],
            truncated=result["truncated"],
        )


class S3MoveFileIntent(_S3Intent):
    """Move or rename a file."""

    intent_type = INTENT_MOVE_FILE
    permission = CONF_ALLOW_MOVE
    description = (
        "Move or rename a file in the user's S3 bucket. Both 'source' and "
        "'destination' are relative to the allowed folder. Set overwrite to "
        "true to replace an existing destination file."
    )

    @property
    def slot_schema(self) -> dict:
        return {
            vol.Required("source"): vol.Any(str, int, float),
            vol.Required("destination"): vol.Any(str, int, float),
            vol.Optional("overwrite"): vol.Any(bool, str),
        }

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        hub = self._hub(hass)
        slots = self.async_validate_slots(intent_obj.slots)

        source = _slot_text(slots, "source")
        destination = _slot_text(slots, "destination")
        if not source or not destination:
            raise intent.IntentHandleError(
                "I need both the file to move and where to move it."
            )

        overwrite_slot = _slot_value(slots, "overwrite")
        overwrite = isinstance(overwrite_slot, bool) and overwrite_slot

        result = await self._guard(
            hub.client.async_move(source, destination, overwrite=overwrite)
        )
        return self._response(
            intent_obj,
            f"Moved {source} to {result['path']}.",
            path=result["path"],
            moved_from=source,
        )


class S3CreateFolderIntent(_S3Intent):
    """Create a folder."""

    intent_type = INTENT_CREATE_FOLDER
    permission = CONF_ALLOW_MKDIR
    description = (
        "Create a folder in the user's S3 bucket. 'path' is relative to the "
        "allowed folder. S3 has no real folders, so this writes a folder "
        "marker that makes an empty folder visible to listings."
    )

    @property
    def slot_schema(self) -> dict:
        return {vol.Required("path"): vol.Any(str, int, float)}

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        hub = self._hub(hass)
        slots = self.async_validate_slots(intent_obj.slots)

        path = _slot_text(slots, "path")
        if not path:
            raise intent.IntentHandleError("I need a folder name to create.")

        result = await self._guard(hub.client.async_create_folder(path))
        return self._response(
            intent_obj,
            f"Created the folder {result['path']}.",
            path=result["path"],
        )


class S3DeleteFileIntent(_S3Intent):
    """Delete a file."""

    intent_type = INTENT_DELETE_FILE
    permission = CONF_ALLOW_DELETE
    description = (
        "Delete a file from the user's S3 bucket. 'path' is relative to the "
        "allowed folder and must be a path returned by S3ListFiles. This "
        "cannot be undone, so confirm with the user before calling it."
    )

    @property
    def slot_schema(self) -> dict:
        return {vol.Required("path"): vol.Any(str, int, float)}

    async def async_handle(self, intent_obj: intent.Intent) -> intent.IntentResponse:
        hass = intent_obj.hass
        hub = self._hub(hass)
        slots = self.async_validate_slots(intent_obj.slots)

        path = _slot_text(slots, "path")
        if not path:
            raise intent.IntentHandleError("I need a file path to delete.")

        result = await self._guard(hub.client.async_delete(path))
        return self._response(
            intent_obj,
            f"Deleted {result['path']}.",
            path=result["path"],
        )


INTENT_CLASSES = (
    S3CreateNoteIntent,
    S3WriteFileIntent,
    S3ListFilesIntent,
    S3ReadFileIntent,
    S3MoveFileIntent,
    S3CreateFolderIntent,
    S3DeleteFileIntent,
)


def async_setup_intents(hass: HomeAssistant, hub: S3FilesHub) -> list[str]:
    """Register the intents the current permissions allow.

    Returns the intent types registered, so they can be removed again when the
    entry reloads (Home Assistant logs a warning if one is registered twice).
    """
    registered: list[str] = []
    for intent_class in INTENT_CLASSES:
        permission = INTENT_PERMISSIONS.get(intent_class.intent_type, "")
        if permission and not hub.permissions.enabled(permission):
            _LOGGER.debug(
                "Not registering intent %s: %s is off",
                intent_class.intent_type,
                permission,
            )
            continue
        intent.async_register(hass, intent_class())
        registered.append(intent_class.intent_type)
    return registered


def async_remove_intents(hass: HomeAssistant, intent_types: list[str]) -> None:
    """Remove previously registered intents."""
    for intent_type in intent_types:
        intent.async_remove(hass, intent_type)
