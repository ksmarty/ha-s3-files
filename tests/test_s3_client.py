"""The boto3 wrapper, exercised against a mocked S3.

`moto` intercepts botocore at the HTTP layer, so these tests drive the real
boto3 code path — request building, pagination, error shapes — without a live
endpoint. That is the closest we can get to a real bucket in CI.
"""

from __future__ import annotations

import os

import pytest

pytest.importorskip("boto3")
moto = pytest.importorskip("moto")

from moto import mock_aws  # noqa: E402

from custom_components.s3_files.errors import S3FilesError  # noqa: E402
from custom_components.s3_files.s3_client import (  # noqa: E402
    S3Config,
    S3FilesClient,
)

from conftest import FakeHass, options, run  # noqa: E402

BUCKET = "ha-files"


def _client(hass: FakeHass, **overrides: object) -> S3FilesClient:
    return S3FilesClient(hass, S3Config.from_options(options(**overrides)))


def _make_bucket() -> None:
    import boto3

    boto3.client(
        "s3",
        region_name="us-east-1",
        aws_access_key_id="test-key",
        aws_secret_access_key="test-secret",
    ).create_bucket(Bucket=BUCKET)


@pytest.fixture(autouse=True)
def aws_env(monkeypatch):
    """Give botocore credentials and keep moto from needing a region."""
    monkeypatch.setenv("AWS_ACCESS_KEY_ID", "test-key")
    monkeypatch.setenv("AWS_SECRET_ACCESS_KEY", "test-secret")
    monkeypatch.setenv("AWS_DEFAULT_REGION", "us-east-1")
    os.environ.setdefault("AWS_EC2_METADATA_DISABLED", "true")


@mock_aws
def test_write_then_read_round_trips_content():
    _make_bucket()
    hass = FakeHass()
    client = _client(hass)

    run(client.async_write("notes/a.md", b"# hello", content_type="text/markdown", overwrite=False))
    result = run(client.async_read("notes/a.md", max_bytes=1024))

    assert result["data"] == b"# hello"
    assert result["size"] == 7
    assert result["truncated"] is False
    assert result["content_type"] == "text/markdown"


@mock_aws
def test_write_refuses_to_clobber_without_overwrite():
    _make_bucket()
    client = _client(FakeHass())
    run(client.async_write("a.txt", b"one", content_type=None, overwrite=False))

    with pytest.raises(S3FilesError) as err:
        run(client.async_write("a.txt", b"two", content_type=None, overwrite=False))
    assert "overwrite" in str(err.value).lower()

    # ...and replaces it when asked to.
    run(client.async_write("a.txt", b"two", content_type=None, overwrite=True))
    assert run(client.async_read("a.txt", max_bytes=64))["data"] == b"two"


@mock_aws
def test_read_truncates_at_max_bytes():
    _make_bucket()
    client = _client(FakeHass())
    run(client.async_write("big.txt", b"x" * 5000, content_type=None, overwrite=False))

    result = run(client.async_read("big.txt", max_bytes=100))
    assert len(result["data"]) == 100
    assert result["size"] == 5000
    assert result["truncated"] is True


@mock_aws
def test_read_reports_a_missing_file_clearly():
    _make_bucket()
    client = _client(FakeHass())

    with pytest.raises(S3FilesError) as err:
        run(client.async_read("nope.txt", max_bytes=64))
    assert err.value.code == "not_found"


@mock_aws
def test_list_separates_folders_from_files_and_is_shallow_by_default():
    _make_bucket()
    client = _client(FakeHass())
    run(client.async_write("top.txt", b"1", content_type=None, overwrite=False))
    run(client.async_write("notes/deep.md", b"2", content_type=None, overwrite=False))
    run(client.async_write("other/deep.md", b"3", content_type=None, overwrite=False))

    entries = run(client.async_list(None))
    by_path = {entry["path"]: entry for entry in entries}

    assert set(by_path) == {"top.txt", "notes", "other"}
    assert by_path["notes"]["is_folder"] is True
    assert by_path["top.txt"]["is_folder"] is False
    assert by_path["top.txt"]["size"] == 1

    # Folders sort before files, so a listing reads like a file browser.
    assert [entry["path"] for entry in entries][:2] == ["notes", "other"]


@mock_aws
def test_list_recursive_descends_into_folders():
    _make_bucket()
    client = _client(FakeHass())
    run(client.async_write("notes/deep.md", b"2", content_type=None, overwrite=False))

    entries = run(client.async_list("notes", recursive=True))
    assert [entry["path"] for entry in entries] == ["notes/deep.md"]

    shallow = run(client.async_list("notes"))
    # The folder marker for the folder being listed is not itself an entry.
    assert [entry["path"] for entry in shallow] == ["notes/deep.md"]


@mock_aws
def test_list_paths_can_be_fed_straight_back_in():
    """Listings return scope relative paths, so round-tripping must work."""
    _make_bucket()
    client = _client(FakeHass(), root_prefix="homeassistant/notes")
    run(
        client.async_write(
            "sub/deep.md", b"hi", content_type=None, overwrite=False
        )
    )

    entries = run(client.async_list(None, recursive=True))
    assert [entry["path"] for entry in entries] == ["sub/deep.md"]

    read = run(client.async_read(entries[0]["path"], max_bytes=64))
    assert read["data"] == b"hi"


@mock_aws
def test_scope_keeps_everything_under_the_root_prefix():
    _make_bucket()
    hass = FakeHass()
    client = _client(hass, root_prefix="homeassistant/notes")
    run(client.async_write("a.md", b"hi", content_type=None, overwrite=False))

    import boto3

    keys = [
        item["Key"]
        for item in boto3.client("s3", region_name="us-east-1").list_objects_v2(
            Bucket=BUCKET
        )["Contents"]
    ]
    assert keys == ["homeassistant/notes/a.md"]


@mock_aws
def test_scope_refuses_paths_that_climb_out():
    _make_bucket()
    client = _client(FakeHass(), root_prefix="homeassistant/notes")

    for bad in ("../secret.txt", "a/../../secret.txt", "..", "a/../.."):
        with pytest.raises(S3FilesError) as err:
            run(client.async_write(bad, b"x", content_type=None, overwrite=False))
        assert "outside the folder" in str(err.value)

    for bad in ("../secret.txt", "a/../../b.txt"):
        with pytest.raises(S3FilesError):
            run(client.async_read(bad, max_bytes=16))
        with pytest.raises(S3FilesError):
            run(client.async_list(bad))


@mock_aws
def test_scope_ignores_a_sibling_folder_with_the_same_name_prefix():
    """`notes-backup/` must not be visible through a `notes` scope."""
    _make_bucket()
    import boto3

    s3 = boto3.client("s3", region_name="us-east-1")
    s3.put_object(Bucket=BUCKET, Key="notes-backup/old.md", Body=b"x")
    s3.put_object(Bucket=BUCKET, Key="notes/keep.md", Body=b"x")

    client = _client(FakeHass(), root_prefix="notes")
    entries = run(client.async_list(None, recursive=True))
    assert [entry["path"] for entry in entries] == ["keep.md"]


@mock_aws
def test_delete_removes_the_object():
    _make_bucket()
    client = _client(FakeHass())
    run(client.async_write("gone.txt", b"x", content_type=None, overwrite=False))

    run(client.async_delete("gone.txt"))
    with pytest.raises(S3FilesError):
        run(client.async_read("gone.txt", max_bytes=16))


@mock_aws
def test_move_copies_then_removes_the_original():
    _make_bucket()
    client = _client(FakeHass())
    run(client.async_write("a.txt", b"payload", content_type=None, overwrite=False))

    result = run(client.async_move("a.txt", "b.txt", overwrite=False))
    assert result["path"] == "b.txt"
    assert result["moved_from"] == "a.txt"
    assert run(client.async_read("b.txt", max_bytes=64))["data"] == b"payload"
    with pytest.raises(S3FilesError):
        run(client.async_read("a.txt", max_bytes=16))


@mock_aws
def test_move_refuses_an_existing_destination_without_overwrite():
    _make_bucket()
    client = _client(FakeHass())
    run(client.async_write("a.txt", b"one", content_type=None, overwrite=False))
    run(client.async_write("b.txt", b"two", content_type=None, overwrite=False))

    with pytest.raises(S3FilesError) as err:
        run(client.async_move("a.txt", "b.txt", overwrite=False))
    assert "overwrite" in str(err.value).lower()

    # Neither file was touched by the failed move.
    assert run(client.async_read("a.txt", max_bytes=16))["data"] == b"one"
    assert run(client.async_read("b.txt", max_bytes=16))["data"] == b"two"

    run(client.async_move("a.txt", "b.txt", overwrite=True))
    assert run(client.async_read("b.txt", max_bytes=16))["data"] == b"one"


@mock_aws
def test_create_folder_leaves_a_marker_that_listings_show():
    _make_bucket()
    client = _client(FakeHass())

    result = run(client.async_create_folder("archive"))
    assert result["path"] == "archive"

    entries = run(client.async_list(None))
    assert [(entry["path"], entry["is_folder"]) for entry in entries] == [
        ("archive", True)
    ]


@mock_aws
def test_check_reports_a_missing_bucket():
    client = _client(FakeHass(), bucket="does-not-exist")

    with pytest.raises(S3FilesError) as err:
        run(client.async_check())
    assert err.value.code == "no_bucket"


@mock_aws
def test_check_passes_for_an_existing_bucket():
    _make_bucket()
    assert run(_client(FakeHass()).async_check()) == {"bucket": BUCKET}
