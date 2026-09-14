"""The manifest and HACS metadata.

These are the files Home Assistant and HACS read before any of our code runs,
so a mistake here is invisible in the test suite but breaks installation.
"""

from __future__ import annotations

import json
import re
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
INTEGRATION = ROOT / "custom_components" / "s3_files"


@pytest.fixture(scope="module")
def manifest() -> dict:
    return json.loads((INTEGRATION / "manifest.json").read_text(encoding="utf-8"))


@pytest.fixture(scope="module")
def hacs() -> dict:
    return json.loads((ROOT / "hacs.json").read_text(encoding="utf-8"))


def test_the_domain_matches_the_folder(manifest):
    """Home Assistant requires the domain to equal the directory name."""
    assert manifest["domain"] == INTEGRATION.name


def test_the_hacs_entry_point_exists(manifest):
    assert (INTEGRATION / "__init__.py").is_file()
    assert (INTEGRATION / "config_flow.py").is_file()
    assert manifest["config_flow"] is True


def test_the_required_manifest_keys_are_present(manifest):
    for key in (
        "domain",
        "name",
        "version",
        "codeowners",
        "documentation",
        "issue_tracker",
        "integration_type",
        "iot_class",
    ):
        assert manifest.get(key), f"manifest is missing {key}"


def test_the_version_is_a_release_version(manifest):
    assert re.fullmatch(r"\d+\.\d+\.\d+", manifest["version"]), manifest["version"]


def test_codeowners_look_like_handles(manifest):
    for owner in manifest["codeowners"]:
        assert owner.startswith("@"), owner


def test_requirements_are_a_list_of_versioned_specs(manifest):
    requirements = manifest["requirements"]
    assert isinstance(requirements, list)
    for requirement in requirements:
        assert re.search(r"[<>=!~]", requirement), (
            f"{requirement} has no version specifier; Home Assistant requires one"
        )


def test_boto3_is_pinned_to_a_range_not_an_exact_version(manifest):
    """A range, deliberately.

    Home Assistant installs each integration's requirements into the one
    environment they all share, so two custom integrations pinning different
    exact versions of boto3 leave whichever installed last winning and the
    other broken. A range lets pip find a version that satisfies both. The
    upper bound still stops a future major from being pulled in untested.

    Home Assistant itself does not ship boto3, so there is nothing to conflict
    with but other custom integrations.
    """
    requirement = next(
        (r for r in manifest["requirements"] if r.startswith("boto3")), None
    )
    assert requirement, "boto3 is the integration's only runtime dependency"

    assert "==" not in requirement, (
        "an exact pin reintroduces the conflict this range avoids"
    )
    assert ">" in requirement, f"{requirement} needs a lower bound"
    assert "<" in requirement, f"{requirement} needs an upper bound"


def test_hacs_metadata_is_complete(hacs):
    assert hacs["name"]
    assert re.fullmatch(r"\d+\.\d+\.\d+", hacs["homeassistant"]), (
        "the minimum Home Assistant version must be a full version"
    )


def test_brand_assets_exist_where_both_readers_look():
    """HACS reads brands/, newer Home Assistant reads the integration's brand/."""
    for directory in (ROOT / "brands", INTEGRATION / "brand"):
        for name in ("icon.png", "icon@2x.png", "logo.png", "logo@2x.png"):
            path = directory / name
            assert path.is_file(), f"missing {path.relative_to(ROOT)}"
            assert path.stat().st_size > 0, f"{path.name} is empty"


def test_the_brand_assets_in_both_locations_agree():
    """They are generated together, so a mismatch means one was hand-edited."""
    for name in ("icon.png", "icon@2x.png", "logo.png", "logo@2x.png"):
        assert (ROOT / "brands" / name).read_bytes() == (
            INTEGRATION / "brand" / name
        ).read_bytes(), f"{name} differs between brands/ and the integration"


def test_the_source_artwork_is_kept():
    """Without it the assets cannot be regenerated."""
    assert (ROOT / "assets" / "brand-source.jpeg").is_file()
