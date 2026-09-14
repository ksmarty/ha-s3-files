"""The permission set.

One switch per capability, stored in the config entry options. The set decides
two things:

* which services and intents get registered at all (a switched off action is
  absent, not merely refused — that is what keeps it out of the LLM's tool
  list);
* what a call is allowed to do at run time, so a stale automation or a
  hand written service call cannot slip past a permission it no longer has.
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from .const import (
    CONF_ALLOW_DELETE,
    CONF_ALLOW_LIST,
    CONF_ALLOW_MKDIR,
    CONF_ALLOW_MOVE,
    CONF_ALLOW_READ,
    CONF_ALLOW_WRITE,
    DEFAULT_PERMISSIONS,
    PERMISSION_LABELS,
    PERMISSIONS,
)
from .errors import S3PermissionError


@dataclass(frozen=True)
class PermissionSet:
    """Which actions the integration is allowed to perform."""

    allow_list: bool = DEFAULT_PERMISSIONS[CONF_ALLOW_LIST]
    allow_read: bool = DEFAULT_PERMISSIONS[CONF_ALLOW_READ]
    allow_write: bool = DEFAULT_PERMISSIONS[CONF_ALLOW_WRITE]
    allow_delete: bool = DEFAULT_PERMISSIONS[CONF_ALLOW_DELETE]
    allow_move: bool = DEFAULT_PERMISSIONS[CONF_ALLOW_MOVE]
    allow_mkdir: bool = DEFAULT_PERMISSIONS[CONF_ALLOW_MKDIR]

    @classmethod
    def from_options(cls, options: dict[str, Any] | None) -> PermissionSet:
        options = options or {}
        return cls(
            **{
                name: bool(options.get(name, DEFAULT_PERMISSIONS[name]))
                for name in PERMISSIONS
            }
        )

    def enabled(self, permission: str) -> bool:
        # Unknown names are treated as disabled rather than raising, so a
        # typo can never be mistaken for an allow.
        return bool(getattr(self, permission, False))

    def enabled_permissions(self) -> tuple[str, ...]:
        """The switched on permissions, in declaration order."""
        return tuple(name for name in PERMISSIONS if self.enabled(name))

    def labels(self) -> list[str]:
        """Plain English descriptions of what is switched on."""
        return [PERMISSION_LABELS[name] for name in self.enabled_permissions()]

    def disabled_labels(self) -> list[str]:
        """Plain English descriptions of what is switched off."""
        return [
            PERMISSION_LABELS[name]
            for name in PERMISSIONS
            if not self.enabled(name)
        ]

    def require(self, permission: str) -> None:
        """Raise unless the permission is switched on."""
        if not self.enabled(permission):
            label = PERMISSION_LABELS.get(permission, permission)
            raise S3PermissionError(
                f"This integration is not allowed to {label}. Turn it on in the "
                "S3 Files options if that was not intended."
            )
