#!/usr/bin/env python3
"""Put one frame of several variants side by side, cropped and scaled.

    uv run tasks/2026-10-11-paper-discs/tools/sheet.py FRAME OUT.png LEFT TOP RIGHT BOTTOM SCALE VARIANT...
"""

import pathlib
import sys

from PIL import Image

OUT = pathlib.Path(__file__).resolve().parents[1] / "out"


def main() -> None:
    frame, out = sys.argv[1], sys.argv[2]
    left, top, right, bottom = map(int, sys.argv[3:7])
    scale = float(sys.argv[7])
    size = (round((right - left) * scale), round((bottom - top) * scale))
    panels = [
        Image.open(OUT / variant / (frame.replace(" ", "_") + ".png")).convert("RGB").crop((left, top, right, bottom)).resize(size, Image.LANCZOS)
        for variant in sys.argv[8:]
    ]
    sheet = Image.new("RGB", (len(panels) * (size[0] + 10), size[1]), "white")
    for index, panel in enumerate(panels):
        sheet.paste(panel, (index * (size[0] + 10), 0))
    sheet.save(out)


if __name__ == "__main__":
    main()
