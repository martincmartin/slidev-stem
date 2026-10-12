#!/usr/bin/env python3
"""Count, in one frame, the pixels that a variant makes visibly lighter and
darker than a reference.

    uv run tasks/2026-10-11-paper-discs/tools/pair.py FRAME REFERENCE VARIANT...
"""

import pathlib
import sys

import numpy as np
from PIL import Image

OUT = pathlib.Path(__file__).resolve().parents[1] / "out"
VISIBLE = 32


def main() -> None:
    name = sys.argv[1].replace(" ", "_") + ".png"
    first = np.asarray(Image.open(OUT / sys.argv[2] / name).convert("RGB"), dtype=np.int16)
    for variant in sys.argv[3:]:
        second = np.asarray(Image.open(OUT / variant / name).convert("RGB"), dtype=np.int16)
        visible = np.abs(first - second).max(axis=2) > VISIBLE
        lighter = visible & (second.sum(axis=2) > first.sum(axis=2))
        print(f"{variant:34} lighter {int(lighter.sum()):6}  darker {int((visible & ~lighter).sum()):6}")


if __name__ == "__main__":
    main()
