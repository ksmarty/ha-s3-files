"""LLM tools.

A conversational agent never sees the sentence templates — it calls tools, and
recent Home Assistant builds only learn about an integration's intents through
its `llm.py` platform. These tests pin which tools the model receives, that a
disabled action is absent from that list, and that calling one really writes a
file.

`homeassistant.components.llm` (which provides `LLMTools`) is stubbed, because
it only exists on newer releases and can pull in optional dependencies older
ones do not install.
"""

from __future__ import annotations

import asyncio
import inspect
import os
import sys
import types

import pytest

pytest.importorskip("homeassistant")
pytest.importorskip("boto3")
moto = pytest.importorskip("moto")

from moto import mock_aws  # noqa: E402

_llm = pytest.importorskip("homeassistant.helpers.llm")
if not hasattr(_llm, "IntentTool") or not hasattr(_llm, "NamespacedTool"):
    pytest.skip(
        "no LLM tool helpers in this Home Assistant version", allow_module_level=True
    )

from custom_components.s3_files import intents as intents_module  # noqa: E402
from custom_components.s3_files import llm as llm_module  # noqa: E402
from custom_components.s3_files.const import (  # noqa: E402
    CONF_ALLOW_DELETE,
    CONF_ALLOW_LIST,
    CONF_ALLOW_MKDIR,
    CONF_ALLOW_MOVE,
    CONF_ALLOW_READ,
    CONF_ALLOW_WRITE,
    DOMAIN,
    PERMISSIONS,
)
from custom_components.s3_files.hub import HUB_KEY, build_hub  # noqa: E402

from conftest import options  # noqa: E402

BUCKET = "ha-files"


class _LLMTools:
    """Stand-in for homeassistant.components.llm.LLMTools."""

    def __init__(self, tools, prompt=None) -> None:
        self.tools = tools
        self.prompt = prompt


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
    async def _inner():
        from homeassistant.core import HomeAssistant
        from homeassistant.helpers import frame

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
            result = body(hass, hub)
            if inspect.isawaitable(result):
                result = await result
            return result
        finally:
            intents_module.async_remove_intents(hass, registered)
            await hass.async_stop()

    return asyncio.run(_inner())


def _context():
    return _llm.LLMContext(
        platform="conversation",
        context=None,
        language="en",
        assistant="conversation",
        device_id=None,
    )


@pytest.fixture
def stub_llm(monkeypatch):
    module = types.ModuleType("homeassistant.components.llm")
    module.LLMTools = _LLMTools  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "homeassistant.components.llm", module)


def test_tools_are_namespaced_and_described(tmp_path, stub_llm):
    def body(hass, hub):
        tools = llm_module.async_get_tools(hass, _context(), "assist")
        return tools, {tool.name: tool for tool in tools.tools}

    tools, by_name = _run(tmp_path, {name: True for name in PERMISSIONS}, body)

    assert set(by_name) == {
        "s3_files__S3CreateNote",
        "s3_files__S3WriteFile",
        "s3_files__S3ListFiles",
        "s3_files__S3ReadFile",
        "s3_files__S3MoveFile",
        "s3_files__S3CreateFolder",
        "s3_files__S3DeleteFile",
    }
    for name, tool in by_name.items():
        assert tool.description, f"{name} has no description for the model"


def test_a_disabled_action_is_not_offered_to_the_model(tmp_path, stub_llm):
    """The requirement: only enabled actions are exposed."""

    def body(hass, hub):
        tools = llm_module.async_get_tools(hass, _context(), "assist")
        return {tool.name for tool in tools.tools}

    names = _run(
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
    assert "s3_files__S3DeleteFile" not in names
    assert "s3_files__S3MoveFile" not in names
    assert "s3_files__S3CreateFolder" not in names
    assert "s3_files__S3WriteFile" in names


def test_read_only_exposes_no_writing_tools(tmp_path, stub_llm):
    def body(hass, hub):
        tools = llm_module.async_get_tools(hass, _context(), "assist")
        return {tool.name for tool in tools.tools}

    names = _run(
        tmp_path,
        {name: name in (CONF_ALLOW_LIST, CONF_ALLOW_READ) for name in PERMISSIONS},
        body,
    )
    assert names == {"s3_files__S3ListFiles", "s3_files__S3ReadFile"}


def test_no_tools_when_nothing_is_enabled(tmp_path, stub_llm):
    def body(hass, hub):
        return llm_module.async_get_tools(hass, _context(), "assist")

    assert _run(tmp_path, {name: False for name in PERMISSIONS}, body) is None


def test_the_prompt_explains_the_scope_and_what_is_off(tmp_path, stub_llm):
    def body(hass, hub):
        return llm_module.async_get_tools(hass, _context(), "assist").prompt

    prompt = _run(
        tmp_path,
        {"root_prefix": "homeassistant/notes", CONF_ALLOW_DELETE: False},
        body,
    )
    # The model must know the folder it is confined to...
    assert "homeassistant/notes" in prompt
    # ...that paths are relative to it...
    assert "relative" in prompt.lower()
    # ...and what it must not promise the user.
    assert "delete files" in prompt
    assert "Not allowed" in prompt


def test_the_prompt_points_at_the_notes_folder(tmp_path, stub_llm):
    def body(hass, hub):
        return llm_module.async_get_tools(hass, _context(), "assist").prompt

    prompt = _run(tmp_path, {"notes_folder": "journal", CONF_ALLOW_WRITE: True}, body)
    assert "journal" in prompt
    assert "S3CreateNote" in prompt


def test_the_prompt_does_not_advertise_note_taking_when_writing_is_off(
    tmp_path, stub_llm
):
    def body(hass, hub):
        return llm_module.async_get_tools(hass, _context(), "assist").prompt

    prompt = _run(tmp_path, {CONF_ALLOW_WRITE: False, CONF_ALLOW_LIST: True}, body)
    assert "S3CreateNote" not in prompt


def test_no_tools_before_the_integration_is_set_up(tmp_path, stub_llm):
    """An unconfigured integration must not offer tools."""

    async def _inner():
        from homeassistant.core import HomeAssistant

        config_dir = str(tmp_path)
        os.makedirs(os.path.join(config_dir, ".storage"), exist_ok=True)
        hass = HomeAssistant(config_dir)
        hass.config.config_dir = config_dir
        try:
            return llm_module.async_get_tools(hass, _context(), "assist")
        finally:
            await hass.async_stop()

    assert asyncio.run(_inner()) is None


@mock_aws
def test_calling_a_tool_really_writes_the_file(tmp_path, stub_llm):
    _make_bucket()

    async def body(hass, hub):
        tools = llm_module.async_get_tools(hass, _context(), "assist")
        by_name = {tool.name: tool for tool in tools.tools}
        write = by_name["s3_files__S3WriteFile"]
        await write.async_call(
            hass,
            _llm.ToolInput(
                tool_name=write.name,
                tool_args={
                    "path": "notes/ideas.md",
                    "content": "Buy milk",
                    "overwrite": True,
                },
            ),
            _context(),
        )
        read = by_name["s3_files__S3ReadFile"]
        return await read.async_call(
            hass,
            _llm.ToolInput(
                tool_name=read.name, tool_args={"path": "notes/ideas.md"}
            ),
            _context(),
        )

    result = _run(
        tmp_path,
        {CONF_ALLOW_WRITE: True, CONF_ALLOW_READ: True},
        body,
    )
    # The tool result carries speech, which is where a model reads the content.
    assert "Buy milk" in str(result["speech"])


@mock_aws
def test_the_note_tool_creates_a_note_without_a_filename(tmp_path, stub_llm):
    _make_bucket()

    async def body(hass, hub):
        tools = llm_module.async_get_tools(hass, _context(), "assist")
        by_name = {tool.name: tool for tool in tools.tools}
        create = by_name["s3_files__S3CreateNote"]
        return await create.async_call(
            hass,
            _llm.ToolInput(
                tool_name=create.name,
                tool_args={"note": "the wifi password is hunter2"},
            ),
            _context(),
        )

    result = _run(tmp_path, {CONF_ALLOW_WRITE: True}, body)
    # The tool result tells the user (and the model) where the note landed.
    assert "Noted as" in str(result["speech"])

    import boto3

    keys = [
        item["Key"]
        for item in boto3.client("s3", region_name="us-east-1").list_objects_v2(
            Bucket=BUCKET
        )["Contents"]
    ]
    assert len(keys) == 1
    assert keys[0].startswith("notes/")
    assert keys[0].endswith("-the-wifi-password-is-hunter2.md")


@mock_aws
def test_a_failure_surfaces_as_an_intent_error_with_a_readable_message(
    tmp_path, stub_llm
):
    """A refusal has to come back as words, not a stack trace.

    Home Assistant converts `IntentHandleError` into an `IntentError`: the
    conversation agent speaks it, and an LLM agent relays the message to the
    model, which can then explain the problem instead of looping.
    """
    _make_bucket()

    async def body(hass, hub):
        tools = llm_module.async_get_tools(hass, _context(), "assist")
        by_name = {tool.name: tool for tool in tools.tools}
        write = by_name["s3_files__S3WriteFile"]
        args = {"path": "a.md", "content": "one", "overwrite": False}
        await write.async_call(
            hass, _llm.ToolInput(tool_name=write.name, tool_args=args), _context()
        )
        try:
            await write.async_call(
                hass, _llm.ToolInput(tool_name=write.name, tool_args=args), _context()
            )
        except _llm.intent.IntentError as err:
            return str(err)
        raise AssertionError("the second write should not have succeeded")

    message = _run(tmp_path, {CONF_ALLOW_WRITE: True}, body)
    assert "already exists" in message
    assert "overwrite" in message.lower()


@mock_aws
def test_a_path_outside_the_scope_is_refused_with_words(tmp_path, stub_llm):
    _make_bucket()

    async def body(hass, hub):
        tools = llm_module.async_get_tools(hass, _context(), "assist")
        by_name = {tool.name: tool for tool in tools.tools}
        write = by_name["s3_files__S3WriteFile"]
        try:
            await write.async_call(
                hass,
                _llm.ToolInput(
                    tool_name=write.name,
                    tool_args={"path": "../escape.md", "content": "x"},
                ),
                _context(),
            )
        except _llm.intent.IntentError as err:
            return str(err)
        raise AssertionError("a path outside the scope must not be written")

    message = _run(
        tmp_path, {CONF_ALLOW_WRITE: True, "root_prefix": "notes"}, body
    )
    assert "outside the folder" in message
