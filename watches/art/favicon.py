#!/usr/bin/env python3
"""The deck's favicon: the cover's skeleton watch, drawn pixel by pixel.

THIS SCRIPT IS THE SOURCE of watches/public/favicon.ico. To change the icon,
edit the pixel maps below and run it; do not edit the .ico.

    uv run art/favicon.py              # in watches/: writes public/favicon.ico
    uv run art/favicon.py out.ico      # writes there instead
    uv run art/favicon.py --preview p.png   # also writes the maps at 12x

The .ico holds a 16 x 16 and a 32 x 32 image, and the browser picks one. The
headmatter of slides.md points Slidev at it (`favicon: /favicon.ico`).

The icon is not the cover SVG scaled down, and that is not an oversight: at 32
px a 3 px line becomes a fifth of a pixel, and every wheel smears into a grey
blur. Each map keeps only what reads at its size: the case, strap and crown;
the barrel, balance and third wheel with whole-pixel teeth at 32 px; one gear
at 16 px, with no hands. The colours are the cover's, from the talk's theme.
"""

import argparse
import pathlib

from PIL import Image
from skeleton_watch import FRAME, KNOCKOUT, LINE, PALETTE, TALK

CASE_OPACITY = 0.18  # the cover's case and strap: FRAME at this opacity


def blend(colour: str, background: str, alpha: float) -> str:
    """`colour` at opacity `alpha` over `background`, as SVG paints it."""
    channels = [
        round(int(back, 16) + alpha * (int(front, 16) - int(back, 16)))
        for front, back in zip(
            (colour[1:3], colour[3:5], colour[5:7]),
            (background[1:3], background[3:5], background[5:7]),
            strict=True,
        )
    ]
    return "#" + "".join(f"{channel:02X}" for channel in channels)


FACE = PALETTE["background"]  # the dial shows the slide through it
LEGEND = {  # one character per pixel; "." is transparent
    "c": FRAME,  # case, strap and crown outlines
    "f": blend(FRAME, FACE, CASE_OPACITY),  # case and strap fill
    "k": KNOCKOUT,  # chapter ring; the balance wheel's face
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Write the deck's favicon.")
    parser.add_argument(
        "out", nargs="?", type=pathlib.Path, default=TALK / "public" / "favicon.ico"
    )
    parser.add_argument("--preview", type=pathlib.Path)
    arguments = parser.parse_args()
    small, large = image(ICON_16), image(ICON_32)
    large.save(arguments.out, sizes=[(16, 16), (32, 32)], append_images=[small])
    print(f"wrote {arguments.out}")
    if arguments.preview:
        preview([large, small]).save(arguments.preview)
        print(f"wrote {arguments.preview}")


if __name__ == "__main__":
    main()
