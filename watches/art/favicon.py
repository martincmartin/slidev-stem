#!/usr/bin/env python3
"""The deck's favicon: the cover's skeleton watch, drawn pixel by pixel.

THIS SCRIPT IS THE SOURCE of watches/public/favicon.ico. To change the icon,
edit the pixel maps below and run it; do not edit the .ico.

    uv run art/favicon.py              # in watches/: writes public/favicon.ico
    uv run art/favicon.py out.ico      # writes there instead
    uv run art/favicon.py --check      # fail if public/favicon.ico differs
    uv run art/favicon.py --preview p.png   # also writes the maps at 12x

The .ico holds a 16 x 16 and a 32 x 32 image, and the browser picks one. The
headmatter of slides.md points Slidev at it (`favicon: /favicon.ico`).

The icon is not the cover SVG scaled down, and that is not an oversight: at 32
px a 3 px line becomes a fifth of a pixel, and every wheel smears into a grey
blur. Each map keeps only what reads at its size: the case, strap and crown;
the barrel, balance and third wheel with whole-pixel teeth at 32 px; one gear
at 16 px, with no hands. The colours are the cover's, from the reference palette.
"""

import argparse
import io
import pathlib
import sys

from PIL import IcoImagePlugin, Image
from reference_palette import reference_palette
from watch_design import TALK

PALETTE = reference_palette()
LINE = PALETTE["subject"]  # the wheels, the hands' pivot, the hour ticks
FRAME = PALETTE["muted"]  # the case, the strap, the crown; the hands
FRAME_WASH = PALETTE["muted-wash"]  # the case's and the strap's faces
SUBJECT_WASH = PALETTE["subject-wash"]  # the chapter ring; the balance wheel's face

FACE = PALETTE["background"]  # the dial shows the slide through it
LEGEND = {  # one character per pixel; "." is transparent
    "c": FRAME,  # case, strap and crown outlines
    "f": FRAME_WASH,  # case and strap fill
    "k": SUBJECT_WASH,  # chapter ring; the balance wheel's face
    "w": FACE,
    "b": LINE,  # wheels, the hands' pivot, the hour ticks
    "h": FRAME,  # hands
}

ICON_32 = [
    "..........cffffffffffc..........",
    "..........cffffffffffc..........",
    "..........cffffffffffc..........",
    "..........cccccccccccc..........",
    ".........ccffffbbffffcc.........",
    "........cfffkkkbbkkkfffc........",
    ".......cffkkwwwwwbbbkkffc.......",
    "......cffkwwwwwwbkkkbwkffc......",
    ".....cffkwwwwwwbkkkkkbwkffc.....",
    "....cffkwbwbwwwbkkbkkbwwkffc....",
    "....cfkwbbbbbwwbkkkkkbwwwkfc....",
    "...cffkbbwwwbbwwbkkkbwwwwkffc...",
    "...cfkwwbwbwbwwwwbbbwwwwwwkfc...",
    "...cfkwbbwwwbbwwwwwwhhhwwwkfccc.",
    "...cfkwwbbbbbwwwwhhhhhwwwwkfcfc.",
    "...cbbwwwbwbwwwbbhhbbwwwwwbbcfc.",
    "...cbbwwwwwwwwwbbwbbbbwbwwbbcfc.",
    "...cfkwwwwwwwwhhbbwwwwbbwwkfcfc.",
    "...cfkwwwwwwwwhhbwwwwwwbwwkfccc.",
    "...cfkwwwwwwwhhbbwwbbwwbbwkfc...",
    "...cffkwwwwwhhwbbwwbbwwbbkffc...",
    "....cfkwwwwwhhwwbwwwwwwbwkfc....",
    "....cffkwwwhhwwwbbwwwwbbkffc....",
    ".....cffkwwhhwwwbwbbbbwbffc.....",
    "......cffkwhwwwwwwwbbwkffc......",
    ".......cffkkwwwwwwwwkkffc.......",
    "........cfffkkkbbkkkfffc........",
    ".........ccffffbbffffcc.........",
    "..........cccccccccccc..........",
    "..........cffffffffffc..........",
    "..........cffffffffffc..........",
    "..........cffffffffffc..........",
]

ICON_16 = [
    ".....cffffc.....",
    "....cccccccc....",
    "..cckkkkkkkkcc..",
    "..ckwwwwwwwwkc..",
    ".ckwwwwbbwwwwkc.",
    ".ckwwbwbbwbwwkc.",
    ".ckwwwbwwbwwwkcc",
    ".ckwbbwwwwbbwkcc",
    ".ckwbbwwwwbbwkcc",
    ".ckwwwbwwbwwwkcc",
    ".ckwwbwbbwbwwkc.",
    ".ckwwwwbbwwwwkc.",
    "..ckwwwwwwwwkc..",
    "..cckkkkkkkkcc..",
    "....cccccccc....",
    ".....cffffc.....",
]


def image(pixel_map: list[str]) -> Image.Image:
    """The map as an RGBA image, one pixel per character."""
    size = len(pixel_map)
    if any(len(row) != size for row in pixel_map):
        raise SystemExit(f"the {size}-row map is not square")
    picture = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for y, row in enumerate(pixel_map):
        for x, character in enumerate(row):
            if character != ".":
                colour = LEGEND[character]
                red, green, blue = (int(colour[at : at + 2], 16) for at in (1, 3, 5))
                picture.putpixel((x, y), (red, green, blue, 255))
    return picture


def preview(icons: list[Image.Image], scale: int = 12) -> Image.Image:
    """The icons side by side, magnified so each pixel shows."""
    gap = scale * 2
    width = sum(icon.width * scale + gap for icon in icons) + gap
    height = max(icon.height for icon in icons) * scale + 2 * gap
    sheet = Image.new("RGBA", (width, height), "#FFFFFF")
    x = gap
    for icon in icons:
        big = icon.resize(
            (icon.width * scale, icon.height * scale), Image.Resampling.NEAREST
        )
        sheet.alpha_composite(big, (x, gap))
        x += big.width + gap
    return sheet


def icon_bytes() -> bytes:
    """The .ico file this script writes."""
    buffer = io.BytesIO()
    image(ICON_32).save(
        buffer, format="ICO", sizes=[(16, 16), (32, 32)], append_images=[image(ICON_16)]
    )
    return buffer.getvalue()


def icon_pixels(data: bytes) -> dict[tuple[int, int], bytes]:
    """Each size in the .ico `data`, and its RGBA pixels. Two files with the
    same pixels can differ in their bytes: zlib, under Pillow's PNG encoder,
    compresses differently on macOS and on Linux."""
    icon = IcoImagePlugin.IcoFile(io.BytesIO(data))
    return {
        size: icon.getimage(size).convert("RGBA").tobytes()
        for size in sorted(icon.sizes())
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Write the deck's favicon.")
    parser.add_argument(
        "out", nargs="?", type=pathlib.Path, default=TALK / "public" / "favicon.ico"
    )
    parser.add_argument("--preview", type=pathlib.Path)
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail if the file on disk has other sizes or pixels; write nothing",
    )
    arguments = parser.parse_args()
    if arguments.check:
        if not arguments.out.exists() or icon_pixels(
            arguments.out.read_bytes()
        ) != icon_pixels(icon_bytes()):
            print(
                f"{arguments.out} differs from what {pathlib.Path(__file__).name} writes",
                file=sys.stderr,
            )
            return 1
        return 0
    arguments.out.write_bytes(icon_bytes())
    print(f"wrote {arguments.out}")
    if arguments.preview:
        preview([image(ICON_32), image(ICON_16)]).save(arguments.preview)
        print(f"wrote {arguments.preview}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
