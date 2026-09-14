"""Errors raised by the S3 Files integration."""

from __future__ import annotations

from homeassistant.exceptions import HomeAssistantError


class S3FilesError(HomeAssistantError):
    """Any failure talking to the bucket that the user should see.

    `code` is a stable, machine readable tag ("auth", "no_bucket", "connect",
    ...) so callers such as the config flow can pick a translated message
    instead of pattern matching on prose.
    """

    def __init__(self, message: str, code: str = "unknown") -> None:
        super().__init__(message)
        self.code = code


class S3PermissionError(S3FilesError):
    """The requested action is not switched on in the integration options."""


class S3PathError(S3FilesError):
    """The path is malformed or outside the configured scope."""
