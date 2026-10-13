"""A contact sheet of the close-ups that arbors.py makes.

    uv run python tasks/2026-10-13-arbor-seams/tools/sheet.py DIR SUFFIX BOX

SUFFIX is the view (for example t40-s8); BOX is the crop, left,top,right,bottom
in screenshot px.
"""

import pathlib
import sys

from PIL import Image, ImageDraw

folder = pathlib.Path(sys.argv[1])
suffix = sys.argv[2]
box = tuple(int(each) for each in sys.argv[3].split(","))
names = [
    "escape",
    "fourth",
    "third",
    "centre",
    "cannon",
    "minute",
    "hour-pipe",
    "one-step-hour",
    "collet",
]
tiles = [
    Image.open(folder / f"{name}-{suffix}.png").crop(box) for name in names
]
width, height = tiles[0].size
sheet = Image.new("RGB", (width * 3, height * 3), "white")
for index, (name, tile) in enumerate(zip(names, tiles)):
    origin = ((index % 3) * width, (index // 3) * height)
    sheet.paste(tile, origin)
    ImageDraw.Draw(sheet).text((origin[0] + 8, origin[1] + 8), name, fill="red")
sheet.save(folder / f"sheet-{suffix}.png")
