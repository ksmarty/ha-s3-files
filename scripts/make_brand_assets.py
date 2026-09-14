#!/usr/bin/env python3
"""Generate the placeholder brand assets for S3 Files.

These are deliberately simple placeholders — replace them with real artwork
before publishing to the HACS default repository. Run with the repo's venv:

    .venv/bin/python scripts/make_brand_assets.py

Writes icon.png / icon@2x.png / logo.png / logo@2x.png into both `brands/`
(what HACS reads) and `custom_components/s3_files/brand/` (what newer Home
Assistant versions read).
"""

from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
TARGET_DIRS = (ROOT / "brands", ROOT / "custom_components" / "s3_files" / "brand")

BACKGROUND = (63, 81, 181, 255)  # indigo
MARK = (255, 255, 255, 255)


def _bucket(size: int) -> Image.Image:
    """Draw a storage bucket centred on a solid background."""
    image = Image.new("RGBA", (size, size), BACKGROUND)
    draw = ImageDraw.Draw(image)

    width = size * 0.46
    top = size * 0.30
    bottom = size * 0.74
    left = (size - width) / 2
    right = left + width

    # Tapered body.
    taper = width * 0.14
    draw.polygon(
        [
            (left, top),
            (right, top),
            (right - taper, bottom),
            (left + taper, bottom),
        ],
        fill=MARK,
    )

    # Rim, drawn as a flattened ellipse to read as a 3D opening.
    rim_height = size * 0.055
    draw.ellipse(
        [left - size * 0.012, top - rim_height, right + size * 0.012, top + rim_height],
        fill=MARK,
    )
    draw.ellipse(
        [
            left - size * 0.012 + size * 0.022,
            top - rim_height + size * 0.014,
            right + size * 0.012 - size * 0.022,
            top + rim_height - size * 0.014,
        ],
        fill=BACKGROUND,
    )

    # Two bands, so the mark reads as a bucket rather than a cone.
    for offset in (0.34, 0.52):
        y = bottom - (bottom - top) * offset
        inset = taper * (1 - offset) + width * 0.06
        draw.line([(left + inset, y), (right - inset, y)], fill=BACKGROUND, width=max(2, int(size * 0.022)))

    return image


def _icon(size: int) -> Image.Image:
    return _bucket(size)


def _logo(width: int, height: int) -> Image.Image:
    """The mark on a transparent canvas, as HACS expects for a wide logo."""
    image = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    mark_size = int(height * 0.92)
    mark = _bucket(mark_size)
    image.paste(mark, ((width - mark_size) // 2, (height - mark_size) // 2), mark)
    return image


def main() -> None:
    assets = {
        "icon.png": _icon(256),
        "icon@2x.png": _icon(512),
        "logo.png": _logo(1280, 720),
        "logo@2x.png": _logo(2560, 1440),
    }
    for directory in TARGET_DIRS:
        directory.mkdir(parents=True, exist_ok=True)
        for name, image in assets.items():
            path = directory / name
            image.save(path, "PNG", optimize=True)
            print(f"wrote {path.relative_to(ROOT)} ({image.width}x{image.height})")


if __name__ == "__main__":
    main()
