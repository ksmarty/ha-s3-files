"""Shared test helpers.

The integration modules deliberately take a `hass` object rather than importing
Home Assistant internals, so most tests can run against a stub. Anything that
needs a real Home Assistant runtime uses `pytest.importorskip` in the test
module itself.
"""

from __future__ import annotations

import asyncio
from typing import Any


class FakeConfig:
    """The slice of hass.config the tests need."""

    def __init__(self, config_dir: str) -> None:
        self.config_dir = config_dir

    def path(self, *parts: str) -> str:
        import os

        return os.path.join(self.config_dir, *parts)


class FakeServiceRegistry:
    """A service registry that records calls.

    A real Home Assistant always has one; by default no services are available,
    which is the state before any integration has registered theirs.
    """

    def __init__(self, available: tuple[str, ...] = ()) -> None:
        self.available = set(available)
        self.calls: list[tuple[str, object]] = []

    def has_service(self, domain: str, name: str) -> bool:
        return f"{domain}.{name}" in self.available

    async def async_call(self, domain, name, data=None, blocking=False):
        self.calls.append((f"{domain}.{name}", data))
        return None


class FakeHass:
    """Just enough of HomeAssistant for the client and service tests."""

    def __init__(self, config_dir: str = "/tmp") -> None:
        self.data: dict[str, Any] = {}
        self.config_dir = config_dir
        self.config = FakeConfig(config_dir)
        self.services = FakeServiceRegistry()

    async def async_add_executor_job(self, func: Any, *args: Any) -> Any:
        """Run a blocking call the way Home Assistant would."""
        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, func, *args)


def run(coro: Any) -> Any:
    """Run a coroutine in a fresh event loop (no pytest-asyncio needed)."""
    return asyncio.run(coro)


def options(**overrides: Any) -> dict[str, Any]:
    """Build an options dict, defaulting to a reachable test bucket."""
    from custom_components.s3_files.const import (
        CONF_ACCESS_KEY_ID,
        CONF_BUCKET,
        CONF_ENDPOINT_URL,
        CONF_REGION,
        CONF_SECRET_ACCESS_KEY,
    )

    base: dict[str, Any] = {
        CONF_ENDPOINT_URL: "",
        CONF_ACCESS_KEY_ID: "test-key",
        CONF_SECRET_ACCESS_KEY: "test-secret",
        CONF_REGION: "us-east-1",
        CONF_BUCKET: "ha-files",
    }
    base.update(overrides)
    return base
