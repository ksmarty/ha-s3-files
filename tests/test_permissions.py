"""The permission set."""

from __future__ import annotations

import pytest

from custom_components.s3_files.const import (
    CONF_ALLOW_DELETE,
    CONF_ALLOW_LIST,
    CONF_ALLOW_MOVE,
    CONF_ALLOW_READ,
    CONF_ALLOW_WRITE,
    DEFAULT_PERMISSIONS,
    PERMISSIONS,
)
from custom_components.s3_files.errors import S3PermissionError
from custom_components.s3_files.permissions import PermissionSet


def test_defaults_match_the_declared_defaults():
    permissions = PermissionSet.from_options({})
    for name in PERMISSIONS:
        assert permissions.enabled(name) is DEFAULT_PERMISSIONS[name]


def test_read_only_default_cannot_write():
    """The shipped defaults must be safe: no delete, no move."""
    permissions = PermissionSet.from_options({})
    assert permissions.enabled(CONF_ALLOW_READ)
    assert permissions.enabled(CONF_ALLOW_LIST)
    assert not permissions.enabled(CONF_ALLOW_DELETE)
    assert not permissions.enabled(CONF_ALLOW_MOVE)


def test_options_override_the_defaults():
    permissions = PermissionSet.from_options(
        {
            CONF_ALLOW_DELETE: True,
            CONF_ALLOW_WRITE: False,
        }
    )
    assert permissions.enabled(CONF_ALLOW_DELETE)
    assert not permissions.enabled(CONF_ALLOW_WRITE)


def test_truthy_stored_values_are_coerced():
    assert PermissionSet.from_options({CONF_ALLOW_DELETE: 1}).enabled(CONF_ALLOW_DELETE)
    assert not PermissionSet.from_options({CONF_ALLOW_DELETE: 0}).enabled(
        CONF_ALLOW_DELETE
    )


def test_enabled_permissions_keeps_declaration_order():
    permissions = PermissionSet.from_options(
        {name: name in (CONF_ALLOW_LIST, CONF_ALLOW_WRITE) for name in PERMISSIONS}
    )
    assert permissions.enabled_permissions() == (CONF_ALLOW_LIST, CONF_ALLOW_WRITE)


def test_labels_are_plain_english():
    permissions = PermissionSet.from_options({})
    assert "read files" in permissions.labels()
    assert "delete files" in permissions.disabled_labels()
    assert set(permissions.labels()).isdisjoint(permissions.disabled_labels())


def test_require_passes_when_enabled():
    PermissionSet.from_options({CONF_ALLOW_READ: True}).require(CONF_ALLOW_READ)


def test_require_raises_a_speakable_error_when_disabled():
    permissions = PermissionSet.from_options({CONF_ALLOW_DELETE: False})
    with pytest.raises(S3PermissionError) as err:
        permissions.require(CONF_ALLOW_DELETE)
    message = str(err.value)
    assert "not allowed to delete files" in message
    assert "options" in message


def test_require_raises_for_an_unknown_permission():
    with pytest.raises(S3PermissionError):
        PermissionSet.from_options({}).require("allow_teleport")
