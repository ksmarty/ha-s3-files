"""LLM tools for S3 Files.

A conversational agent does not match sentence templates — it calls tools, and
recent Home Assistant releases collect those from each integration's `llm.py`
platform rather than auto-exposing every registered intent. Without this module
an LLM agent answers "I can't access files".

The tool list is exactly the set of intents whose permission is switched on:
`async_setup_intents` never registers a disabled action, so it cannot appear
here either.

Older Home Assistant builds expose all intents to the LLM themselves and have
no `LLMTools`; there this module returns nothing and behaviour is unchanged.
"""

from __future__ import annotations

import logging
from typing import Any

from homeassistant.core import HomeAssistant, callback

from .const import DOMAIN, INTENT_ORDER, INTENT_PERMISSIONS
from .hub import HUB_KEY
from .paths import describe_scope

_LOGGER = logging.getLogger(__name__)


def _build_prompt(hub: Any) -> str:
    """Describe the tools, the folder scope and what is switched off.

    The disabled list matters: it stops the model promising the user something
    the integration will refuse.
    """
    permissions = hub.permissions
    parts = [
        "The user can store files in an S3 bucket through the s3_files tools.",
        f"Every path you pass or receive is relative to "
        f"{describe_scope(hub.root_prefix)} and nothing outside it is "
        "reachable; paths are case sensitive and folders are written as "
        "'folder/file.md'.",
        "Call s3_files__S3ListFiles first when you do not know the exact path, "
        "and reuse the paths it returns verbatim.",
    ]

    if permissions.enabled("allow_write"):
        where = (
            f"inside '{hub.notes_folder}/'"
            if hub.notes_folder
            else "at the top level of the folder you are scoped to"
        )
        parts.append(
            "Use s3_files__S3CreateNote when the user dictates a note — it "
            f"writes a timestamped markdown file {where} without needing a "
            "filename."
        )
        if permissions.enabled("allow_read"):
            parts.append(
                "Prefer reading a file before overwriting it, so you do not "
                "destroy content the user wanted."
            )

    enabled = permissions.labels()
    disabled = permissions.disabled_labels()
    parts.append(f"Allowed actions: {', '.join(enabled)}.")
    if disabled:
        parts.append(
            f"Not allowed (do not offer these): {', '.join(disabled)}."
        )

    return " ".join(parts)


@callback
def async_get_tools(hass: HomeAssistant, llm_context: object, api_id: str) -> object:
    """Return the S3 file intents as LLM tools."""
    try:
        from homeassistant.components.llm import LLMTools
        from homeassistant.helpers import intent
        from homeassistant.helpers.llm import IntentTool, NamespacedTool
    except ImportError:
        # Older Home Assistant: intents are already exposed to LLMs directly.
        return None

    hub = hass.data.get(DOMAIN, {}).get(HUB_KEY)
    if hub is None:
        _LOGGER.debug("S3 Files is not configured; exposing no LLM tools")
        return None

    handlers = [
        handler
        for handler in intent.async_get(hass)
        if handler.intent_type in INTENT_ORDER
        and hub.permissions.enabled(INTENT_PERMISSIONS[handler.intent_type])
    ]
    if not handlers:
        _LOGGER.debug("No S3 file intent handlers are registered for LLM tools")
        return None

    tools = [
        # Namespaced like core integrations (intent__HassTurnOn).
        # NamespacedTool keeps the plain intent type for the actual call, so
        # the tool is s3_files__S3WriteFile while the intent stays S3WriteFile.
        NamespacedTool(DOMAIN, IntentTool(handler.intent_type, handler))
        for handler in sorted(
            handlers, key=lambda h: INTENT_ORDER.index(h.intent_type)
        )
    ]
    _LOGGER.debug("Exposing %d S3 file tools to the LLM API '%s'", len(tools), api_id)

    return LLMTools(tools=tools, prompt=_build_prompt(hub))
