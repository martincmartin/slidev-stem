#!/usr/bin/env python3
"""Show where a variant differs from the baseline in one frame: the baseline,
the variant and the difference (red), cropped to the changed area.

    uv run tasks/2026-10-11-paper-discs/tools/look.py VARIANT FRAME OUT.png [--pad N]
"""

import argparse
import pathlib

import numpy as np
from PIL import Image

OUT = pathlib.Path(__file__).resolve().parents[1] / "out"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("variant")
    parser.add_argument("frame")
    parser.add_argument("out")
    parser.add_argument("--baseline", default="clip-0.25")
    parser.add_argument("--pad", type=int, default=40)
    parser.add_argument("--box", type=int, nargs=4, help="left top right bottom, device px")
    arguments = parser.parse_args()
    name = arguments.frame.replace(" ", "_") + ".png"
    first = np.asarray(Image.open(OUT / arguments.baseline / name).convert("RGB"))
    second = np.asarray(Image.open(OUT / arguments.variant / name).convert("RGB"))
    changed = np.abs(first.astype(np.int16) - second.astype(np.int16)).max(axis=2) > 32
    if arguments.box:
        left, top, right, bottom = arguments.box
    else:
        rows, columns = np.nonzero(changed)
        if len(rows) == 0:
            print("no visible difference")
            return
        top, bottom = max(0, rows.min() - arguments.pad), min(first.shape[0], rows.max() + arguments.pad)
        left, right = max(0, columns.min() - arguments.pad), min(first.shape[1], columns.max() + arguments.pad)
    marked = first.copy()
    marked[changed] = [255, 0, 0]
    panels = [Image.fromarray(each[top:bottom, left:right]) for each in (first, second, marked)]
    width, height = panels[0].size
    sheet = Image.new("RGB", (3 * width + 20, height), "white")
    for index, panel in enumerate(panels):
        sheet.paste(panel, (index * (width + 10), 0))
    sheet.save(arguments.out)
    print(f"box {left} {top} {right} {bottom}")


if __name__ == "__main__":
    main()
