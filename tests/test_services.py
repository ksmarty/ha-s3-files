"""Services: what gets registered, and what a call is allowed to do.

Two layers are covered here, because both matter:

* registration — a disabled action must not exist as a service at all;
* enforcement — a call that somehow arrives anyway (a stale automation, a
  hand written YAML action) must still be refused.
"""

from __future__ import annotations

import base64
import os

import pytest

pytest.importorskip("boto3")
moto = pytest.importorskip("moto")

from moto import mock_aws  # noqa: E402

from custom_components.s3_files import services  # noqa: E402
from custom_components.s3_files.const import (  # noqa: E402
    CONF_ALLOW_DELETE,
    CONF_ALLOW_LIST,
    CONF_ALLOW_MKDIR,
    CONF_ALLOW_MOVE,
    CONF_ALLOW_READ,
    CONF_ALLOW_WRITE,
    DOMAIN,
    PERMISSIONS,
    SERVICE_CREATE_FOLDER,
    SERVICE_DELETE_FILE,
    SERVICE_GET_INFO,
    SERVICE_INSTALL_SENTENCES,
    SERVICE_LIST_FILES,
    SERVICE_MOVE_FILE,
    SERVICE_READ_FILE,
    SERVICE_WRITE_FILE,
)
from custom_components.s3_files.errors import S3FilesError, S3PermissionError  # noqa: E402
from custom_components.s3_files.hub import build_hub  # noqa: E402

from conftest import FakeHass, options, run  # noqa: E402

BUCKET = "ha-files"


class FakeServices:
    """Records what a service registry would have been asked to do."""

    def __init__(self) -> None:
        self.registered: dict[str, object] = {}

    def async_register(self, domain, name, handler, schema=None, **kwargs) -> None:
        self.registered[f"{domain}.{name}"] = schema

    def async_remove(self, domain, name) -> None:
        self.registered.pop(f"{domain}.{name}", None)


class ServiceHass(FakeHass):
    def __init__(self) -> None:
        super().__init__()
        self.services = FakeServices()


class Call:
    """Stands in for a ServiceCall."""

    def __init__(self, **data) -> None:
        self.data = data


@pytest.fixture(autouse=True)
def aws_env(monkeypatch):
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-key")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test-secret")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")


def _make_bucket() -> None:
    import boto3

    boto3.client("s3", region_name="us-east-1").create_bucket(Bucket=BUCKET)


def _hub(hass: FakeHass, **overrides):
    return build_hub(hass, options(**overrides))


@mock_aws
def test_write_then_read_text():
    _make_bucket()
    hub = _hub(FakeHass())

    written = run(
        services.async_write_file(
            hub, Call(path="notes/a.md", content="# hi", overwrite=False)
        )
    )
    assert written["path"] == "notes/a.md"
    assert written["size"] == 4

    read = run(services.async_read_file(hub, Call(path="notes/a.md")))
    assert read["content"] == "# hi"
    assert read["encoding"] == "text"
    assert read["truncated"] is False


@mock_aws
def test_base64_round_trips_binary_content():
    _make_bucket()
    hub = _hub(FakeHass())
    payload = bytes(range(256))
    encoded = base64.b64encode(payload).decode("ascii")

    run(
        services.async_write_file(
            hub,
            Call(path="blob.bin", content=encoded, encoding="base64", overwrite=False),
        )
    )
    read = run(services.async_read_file(hub, Call(path="blob.bin", encoding="base64")))
    assert base64.b64decode(read["content"]) == payload


@mock_aws
def test_invalid_base64_is_reported_clearly():
    _make_bucket()
    hub = _hub(FakeHass())
    with pytest.raises(S3FilesError) as err:
        run(
            services.async_write_file(
                hub, Call(path="x.bin", content="not base64!!", encoding="base64")
            )
        )
    assert "base64" in str(err.value)


@mock_aws
def test_reading_binary_as_text_suggests_base64():
    _make_bucket()
    hub = _hub(FakeHass())
    run(
        services.async_write_file(
            hub,
            Call(
                path="blob.bin",
                content=base64.b64encode(b"\xff\xfe\x00").decode(),
                encoding="base64",
            ),
        )
    )
    with pytest.raises(S3FilesError) as err:
        run(services.async_read_file(hub, Call(path="blob.bin")))
    assert "base64" in str(err.value)


@mock_aws
def test_list_files_reports_the_scope_and_bucket():
    _make_bucket()
    hub = _hub(FakeHass(), root_prefix="notes")
    run(services.async_write_file(hub, Call(path="a.md", content="x")))

    result = run(services.async_list_files(hub, Call()))
    assert result["count"] == 1
    assert result["files"][0]["path"] == "a.md"
    assert result["bucket"] == BUCKET
    assert result["scope"] == "notes"


@mock_aws
def test_write_refuses_to_clobber_unless_asked():
    _make_bucket()
    hub = _hub(FakeHass())
    run(services.async_write_file(hub, Call(path="a.md", content="one")))

    with pytest.raises(S3FilesError) as err:
        run(services.async_write_file(hub, Call(path="a.md", content="two", overwrite=False)))
    assert "already exists" in str(err.value)

    run(services.async_write_file(hub, Call(path="a.md", content="two", overwrite=True)))
    assert run(services.async_read_file(hub, Call(path="a.md")))["content"] == "two"


@mock_aws
def test_delete_and_move():
    _make_bucket()
    hub = _hub(FakeHass(), **{CONF_ALLOW_DELETE: True, CONF_ALLOW_MOVE: True})
    run(services.async_write_file(hub, Call(path="a.md", content="x")))

    moved = run(
        services.async_move_file(hub, Call(source="a.md", destination="b.md"))
    )
    assert moved["path"] == "b.md"

    run(services.async_delete_file(hub, Call(path="b.md")))
    assert run(services.async_list_files(hub, Call()))["count"] == 0


@mock_aws
def test_create_folder():
    _make_bucket()
    hub = _hub(FakeHass())
    run(services.async_create_folder(hub, Call(path="archive")))

    result = run(services.async_list_files(hub, Call()))
    assert result["files"][0]["is_folder"] is True


# ---------------------------------------------------------------------------
# Enforcement: even a direct call must respect the permission set.
# ---------------------------------------------------------------------------


@mock_aws
@pytest.mark.parametrize(
    ("permission", "handler", "call"),
    [
        (CONF_ALLOW_LIST, services.async_list_files, Call()),
        (CONF_ALLOW_READ, services.async_read_file, Call(path="a.md")),
        (CONF_ALLOW_WRITE, services.async_write_file, Call(path="a.md", content="x")),
        (CONF_ALLOW_DELETE, services.async_delete_file, Call(path="a.md")),
        (
            CONF_ALLOW_MOVE,
            services.async_move_file,
            Call(source="a.md", destination="b.md"),
        ),
        (CONF_ALLOW_MKDIR, services.async_create_folder, Call(path="archive")),
    ],
)
def test_a_disabled_permission_is_refused_at_call_time(permission, handler, call):
    _make_bucket()
    hub = _hub(FakeHass(), **{permission: False})

    with pytest.raises(S3PermissionError):
        run(handler(hub, call))


@mock_aws
def test_a_disabled_permission_is_named_in_the_error():
    _make_bucket()
    hub = _hub(FakeHass(), **{CONF_ALLOW_DELETE: False})
    with pytest.raises(S3PermissionError) as err:
        run(services.async_delete_file(hub, Call(path="a.md")))
    assert "delete files" in str(err.value)


# ---------------------------------------------------------------------------
# Registration gating.
# ---------------------------------------------------------------------------


def _registered_for(hass: ServiceHass, **overrides) -> set[str]:
    hub = _hub(hass, **overrides)
    names = run(services.async_setup_services(hass, hub))
    return set(names)


def test_only_enabled_services_are_registered():
    hass = ServiceHass()
    registered = _registered_for(
        hass,
        **{
            CONF_ALLOW_LIST: True,
            CONF_ALLOW_READ: True,
            CONF_ALLOW_WRITE: True,
            CONF_ALLOW_DELETE: False,
            CONF_ALLOW_MOVE: False,
            CONF_ALLOW_MKDIR: True,
        },
    )
    assert registered == {
        SERVICE_LIST_FILES,
        SERVICE_READ_FILE,
        SERVICE_WRITE_FILE,
        SERVICE_CREATE_FOLDER,
        # Not permission gated: both are setup/support rather than actions on
        # the bucket. get_info is what the sidebar panel asks for.
        SERVICE_INSTALL_SENTENCES,
        SERVICE_GET_INFO,
    }
    assert SERVICE_DELETE_FILE not in registered
    assert SERVICE_MOVE_FILE not in registered


def test_everything_off_still_leaves_the_support_services():
    """Nothing on the bucket works, but the setup helpers remain."""
    hass = ServiceHass()
    registered = _registered_for(hass, **{name: False for name in PERMISSIONS})
    assert registered == {SERVICE_INSTALL_SENTENCES, SERVICE_GET_INFO}


def test_the_registry_only_receives_enabled_services():
    hass = ServiceHass()
    _registered_for(hass, **{name: True for name in PERMISSIONS})
    assert set(hass.services.registered) == {
        f"{DOMAIN}.{SERVICE_LIST_FILES}",
        f"{DOMAIN}.{SERVICE_READ_FILE}",
        f"{DOMAIN}.{SERVICE_WRITE_FILE}",
        f"{DOMAIN}.{SERVICE_DELETE_FILE}",
        f"{DOMAIN}.{SERVICE_MOVE_FILE}",
        f"{DOMAIN}.{SERVICE_CREATE_FOLDER}",
        f"{DOMAIN}.{SERVICE_INSTALL_SENTENCES}",
        f"{DOMAIN}.{SERVICE_GET_INFO}",
    }


def test_services_can_be_removed_again():
    hass = ServiceHass()
    names = list(_registered_for(hass, **{name: True for name in PERMISSIONS}))
    services.async_remove_services(hass, names)
    assert hass.services.registered == {}


def test_service_definitions_all_have_a_permission_and_a_schema():
    for name, (permission, handler, schema) in services.SERVICE_DEFINITIONS.items():
        assert permission in PERMISSIONS, name
        assert callable(handler), name
        assert hasattr(schema, "schema"), name
