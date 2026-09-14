#!/usr/bin/env python3
"""Generate the brand assets for S3 Files from the source artwork.

Home Assistant reads brand images from `custom_components/s3_files/brand/` and
HACS reads them from `brands/`; both are written here from one source so they
cannot drift. Run with the repo's venv:

    .venv/bin/python scripts/make_brand_assets.py

The source (`assets/brand-source.jpeg`) is a full-bleed square badge with no
transparency, so the icons are used as-is rather than trimmed — trimming would
remove the blue background that is part of the artwork. The wide logo
letterboxes the badge on transparency instead of cropping it, keeping the mark
intact.
"""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "brand-source.jpeg"
TARGET_DIRS = (ROOT / "brands", ROOT / "custom_components" / "s3_files" / "brand")

ICON_SIZES = (256, 512)
LOGO_SIZES = ((1280, 720), (2560, 1440))
# The badge keeps a little breathing room inside the wide canvas.
LOGO_FILL = 0.92


def _load() -> Image.Image:
    if not SOURCE.is_file():
        raise SystemExit(f"error: no source artwork at {SOURCE}")
    return Image.open(SOURCE).convert("RGBA")


def _icon(source: Image.Image, size: int) -> Image.Image:
    return source.resize((size, size), Image.LANCZOS)


def _logo(source: Image.Image, width: int, height: int) -> Image.Image:
    canvas = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mark_size = int(height * LOGO_FILL)
    mark = source.resize((mark_size, mark_size), Image.LANCZOS)
    canvas.paste(mark, ((width - mark_size) // 2, (height - mark_size) // 2), mark)
    return canvas


def main() -> None:
    source = _load()

    assets: dict[str, Image.Image] = {}
    for size in ICON_SIZES:
        name = "icon.png" if size == ICON_SIZES[0] else f"icon@{size // ICON_SIZES[0]}x.png"
        assets[name] = _icon(source, size)
    for width, height in LOGO_SIZES:
        name = "logo.png" if width == LOGO_SIZES[0][0] else "logo@2x.png"
        assets[name] = _logo(source, width, height)

    for directory in TARGET_DIRS:
        directory.mkdir(parents=True, exist_ok=True)
        for name, image in assets.items():
            path = directory / name
            image.save(path, "PNG", optimize=True)
            print(f"wrote {path.relative_to(ROOT)} ({image.width}x{image.height})")


if __name__ == "__main__":
    sys.exit(main())