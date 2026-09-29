#!/usr/bin/env python3
"""Crop the probe's pictures into the figures of PLAN.md.

    uv run python figures.py        # in tools/, after webgl_probe.py

Reads ../out/pictures/ (from webgl_probe.py) and writes ../evidence/figures/.
Each figure is a row or grid of tiles cut from full-slide pictures (device
px, ratio 2), with a label above each tile.
"""

import pathlib
from dataclasses import dataclass

from PIL import Image, ImageDraw

TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parents[1]
PICTURES = TASK / "out" / "pictures"
FIGURES = TASK / "evidence" / "figures"
LABEL_HEIGHT = 28
INK = (42, 37, 32)


@dataclass(frozen=True)
class Tile:
    label: str
    file: str


@dataclass(frozen=True)
class Figure:
    name: str
    box: tuple[int, int, int, int]  # left, top, right, bottom, device px
    columns: int
    tiles: tuple[Tile, ...]
    enlarge: int = 1


def methods(still: str) -> tuple[Tile, ...]:
    """The reference, then each method's wrong pixels (red) for one still."""
    return (
        Tile("reference (slab order, SVG)", f"{still}-reference.png"),
        Tile("centre line, 2 x 2", f"chromium-{still}-centre-line-2x2-wrong.png"),
        Tile("slope-scaled offset", f"chromium-{still}-slope-scaled-offset-wrong.png"),
        Tile("bias 0.25 px", f"chromium-{still}-bias-0_25-px-wrong.png"),
        Tile("bias 1 px", f"chromium-{still}-bias-1-px-wrong.png"),
        Tile("bias 4 px", f"chromium-{still}-bias-4-px-wrong.png"),
    )


COVER = (1080, 0, 1960, 1104)  # the watch, the lugs and the strap
MOVEMENT = (1130, 190, 1960, 900)
BALANCE = (560, 300, 1960, 1104)  # the hairspring view, around the balance
STILL = "time-0.37-lines-own"
PROPOSED = "centre-line-2x2"


def show(label: str, name: str) -> Tile:
    return Tile(label, f"show-{name}-{STILL}.png")


FIGURE_LIST = (
    Figure(
        "cover-3d",
        COVER,
        3,
        (
            show("30°", "cover-tilt-30"),
            show("60°", "cover-tilt-60"),
            show("85°", "cover-tilt-85"),
        ),
    ),
    Figure(
        "parity-tilt-0",
        COVER,
        3,
        (
            Tile(
                "WebGL, 0°, with the clips",
                f"chromium-parity-cover-tilt-0-{STILL}-clips-{PROPOSED}.png",
            ),
            Tile(
                "the real 2D drawing",
                f"parity-cover-tilt-0-{STILL}-clips-reference.png",
            ),
            Tile(
                "wrong pixels",
                f"chromium-parity-cover-tilt-0-{STILL}-clips-{PROPOSED}-wrong.png",
            ),
        ),
    ),
    Figure(
        "clips-tilt-60",
        MOVEMENT,
        2,
        (
            show("60°, no clips", "cover-tilt-60"),
            Tile(
                "60°, the 2D clip paths as discs",
                f"show-cover-tilt-60-{STILL}-clips.png",
            ),
        ),
    ),
    Figure(
        "hairspring-and-crown",
        (390, 60, 1570, 1044),
        3,
        (
            Tile("hairspring view, 45°", f"show-hairspring-tilt-45-{STILL}.png"),
            Tile("crown, 0°", f"show-crown-tilt-0-{STILL}.png"),
            Tile("crown, 45°", f"show-crown-tilt-45-{STILL}.png"),
        ),
    ),
    Figure(
        "methods-cover-tilt-45", MOVEMENT, 3, methods(f"slab-cover-tilt-45-{STILL}")
    ),
    Figure(
        "methods-hairspring-tilt-60",
        BALANCE,
        3,
        methods(f"slab-hairspring-tilt-60-{STILL}"),
    ),
    Figure(
        "concave-edge-tilt-75",
        (1080, 250, 1960, 900),
        2,
        (
            Tile(
                "centre line 2 x 2: wrong",
                f"chromium-slab-cover-tilt-75-{STILL}-{PROPOSED}-wrong.png",
            ),
            Tile(
                "slope-scaled offset: wrong",
                f"chromium-slab-cover-tilt-75-{STILL}-slope-scaled-offset-wrong.png",
            ),
        ),
    ),
    Figure(
        "centre-line-sliver-tilt-5",
        (1560, 560, 1860, 860),
        4,
        (
            Tile(
                "centre line 3 x 3: wrong",
                f"chromium-slab-cover-tilt-5-{STILL}-centre-line-wrong.png",
            ),
            Tile(
                "centre line 2 x 2: wrong",
                f"chromium-slab-cover-tilt-5-{STILL}-{PROPOSED}-wrong.png",
            ),
            Tile(
                "WebGL, centre line 2 x 2",
                f"chromium-slab-cover-tilt-5-{STILL}-{PROPOSED}.png",
            ),
            Tile("reference", f"slab-cover-tilt-5-{STILL}-reference.png"),
        ),
        enlarge=2,
    ),
)


def make(figure: Figure) -> Image.Image:
    left, top, right, bottom = figure.box
    width = (right - left) * figure.enlarge
    height = (bottom - top) * figure.enlarge
    rows = -(-len(figure.tiles) // figure.columns)
    sheet = Image.new(
        "RGB", (width * figure.columns, (height + LABEL_HEIGHT) * rows), "white"
    )
    draw = ImageDraw.Draw(sheet)
    for index, tile in enumerate(figure.tiles):
        picture = Image.open(PICTURES / tile.file).convert("RGB").crop(figure.box)
        if figure.enlarge != 1:
            picture = picture.resize((width, height), Image.Resampling.NEAREST)
        x = (index % figure.columns) * width
        y = (index // figure.columns) * (height + LABEL_HEIGHT)
        draw.text((x + 8, y + 6), tile.label, fill=INK, font_size=18)
        sheet.paste(picture, (x, y + LABEL_HEIGHT))
    return sheet


def main() -> None:
    FIGURES.mkdir(parents=True, exist_ok=True)
    for figure in FIGURE_LIST:
        path = FIGURES / f"{figure.name}.png"
        make(figure).save(path, optimize=True)
        print(f"wrote {path} ({path.stat().st_size // 1024} KiB)")


if __name__ == "__main__":
    main()
