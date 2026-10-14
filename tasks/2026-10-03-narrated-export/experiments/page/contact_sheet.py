"""A contact sheet: many screenshots on one image, each with its file's name.

    uv run --project ../../../watches experiments/page/contact_sheet.py OUT.png IMAGE... [--columns N] [--width W]
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("out", type=Path)
    parser.add_argument("images", type=Path, nargs="+")
    parser.add_argument("--columns", type=int, default=3)
    parser.add_argument("--width", type=int, default=520)
    args = parser.parse_args()
    tiles = []
    for path in args.images:
        image = Image.open(path).convert("RGB")
        height = round(image.height * args.width / image.width)
        tiles.append((path.stem, image.resize((args.width, height))))
    label = 22
    rows = [tiles[index : index + args.columns] for index in range(0, len(tiles), args.columns)]
    row_heights = [max(tile.height for _, tile in row) + label for row in rows]
    sheet = Image.new("RGB", (args.columns * (args.width + 10), sum(row_heights)), "white")
    draw = ImageDraw.Draw(sheet)
    y = 0
    for row, row_height in zip(rows, row_heights, strict=True):
        for column, (name, tile) in enumerate(row):
            x = column * (args.width + 10)
            draw.text((x + 4, y + 4), name, fill="black")
            sheet.paste(tile, (x, y + label))
        y += row_height
    sheet.save(args.out)


if __name__ == "__main__":
    main()
