#!/usr/bin/env python3
"""Measure how much each pool edge draws the eye, on the slide's paper.

    uv run tasks/2026-10-03-pool-edge/evidence/measure_edges.py   # in watches/

Renders each deck/public/diving-board-<edge>.svg with rsvg-convert (at t = 0;
the pool does not move) into out/, and prints, for the region round the 60%
line below the ground's back edge:

- the hardest step across the edge: the largest contrast ratio between two
  neighbouring pixels in a row (the median and the maximum over the rows);
- the width of the change from water to paper, 10% to 90% of the way;
- where a row is all paper, in px from the 60% line (negative: to its left);
- the visible contour: pixels with a step of at least 1.25:1 to a neighbour.
  The pool's own lines and ripples give about 200 px of it in every edge.

It also writes out/edges.png: the four edges side by side, at 2x.
"""

import pathlib
import subprocess

import numpy as np
from PIL import Image

TASK = pathlib.Path(__file__).resolve().parents[1]
PUBLIC = TASK / "deck" / "public"
OUT = TASK / "out"
EDGES = ["crop", "fade", "broken", "cutaway"]
PAPER = "#faf7f0"  # Ledger's --palette-background, on 2026-10-03
CROP_X = 588  # px in the render: the drawing's x 638; its viewBox starts at 50
GROUND_TOP = 215  # px: the ground's back edge, y 214.5
WATER_ROWS = range(300, 450, 5)
CONTOUR_STEP = 1.25


def luminance(rgb: np.ndarray) -> np.ndarray:
    linear = np.where(rgb <= 0.04045, rgb / 12.92, ((rgb + 0.055) / 1.055) ** 2.4)
    return linear @ np.array([0.2126, 0.7152, 0.0722])


def contrast(first: np.ndarray, second: np.ndarray) -> np.ndarray:
    return (np.maximum(first, second) + 0.05) / (np.minimum(first, second) + 0.05)


def render(edge: str) -> pathlib.Path:
    png = OUT / f"{edge}.png"
    subprocess.run(
        [
            "rsvg-convert",
            "-b",
            PAPER,
            "-w",
            "980",
            "-h",
            "452",
            str(PUBLIC / f"diving-board-{edge}.svg"),
            "-o",
            str(png),
        ],
        check=True,
    )
    return png


def measure(png: pathlib.Path) -> str:
    rgb = np.asarray(Image.open(png).convert("RGB"), float) / 255
    lum = luminance(rgb)
    paper = luminance(np.array([int(PAPER[index : index + 2], 16) for index in (1, 3, 5)]) / 255)
    band = lum[:, CROP_X - 140 : CROP_X + 20]
    steps = contrast(band[:, 1:], band[:, :-1])
    hardest = [steps[row].max() for row in range(GROUND_TOP + 2, 450)]
    widths, all_paper = [], []
    for row in WATER_ROWS:
        line = lum[row, CROP_X - 200 : CROP_X + 30]
        toward_paper = (line - line[0]) / (paper - line[0])
        widths.append(np.argmax(toward_paper > 0.9) - np.argmax(toward_paper > 0.1))
        all_paper.append(int(np.argmax(toward_paper > 0.99)) - 200)
    region = lum[GROUND_TOP - 20 : 452, CROP_X - 60 : CROP_X + 30]
    across = contrast(region[:, 1:], region[:, :-1])[:-1, :]
    down = contrast(region[1:, :], region[:-1, :])[:, :-1]
    contour = int(((across >= CONTOUR_STEP) | (down >= CONTOUR_STEP)).sum())
    return (
        f"hardest step median {np.median(hardest):5.2f}:1 max {max(hardest):5.2f}:1 | "
        f"10-90% width {np.median(widths):5.1f} px | "
        f"all paper at {min(all_paper):+4d}..{max(all_paper):+4d} px | "
        f"contour {contour} px"
    )


def main() -> None:
    OUT.mkdir(exist_ok=True)
    pngs = [render(edge) for edge in EDGES]
    for edge, png in zip(EDGES, pngs, strict=True):
        print(f"{edge:8s} {measure(png)}")
    crops = [Image.open(png).crop((430, 192, 690, 452)) for png in pngs]
    sheet = Image.new("RGB", (260 * len(crops), 260))
    for index, crop in enumerate(crops):
        sheet.paste(crop, (260 * index, 0))
    sheet.resize((sheet.width * 2, sheet.height * 2), Image.Resampling.NEAREST).save(
        OUT / "edges.png"
    )


if __name__ == "__main__":
    main()
