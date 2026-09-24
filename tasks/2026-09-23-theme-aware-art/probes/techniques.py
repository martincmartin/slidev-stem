#!/usr/bin/env python3
"""Nine ways to colour an animated, clipped drawing. For each: the colour of a
static mark, whether the clip works, and whether the animation runs.

The test drawing (art-var.svg, art-use.svg) has a rect clipped to its left half
that moves down over 2 s, and a static bar at the bottom. plain.svg is one rect
whose width animates. Expected colour: #143C6B (the file's own), #C0451C (the
page's variable), #FFC24E (the :target palette) or #FF0000 (the colour matrix).
"""
from common import run, shots, states, hexof

NAMES = ["img, internal var", "inline, var in attribute", "external <use>", "img #target",
         "img + feColorMatrix", "mask-image", "img, no #target", "img data: URL + block",
         "inline, inserted later"]
CLIPPED = {0, 2, 7, 8}                   # cells whose drawing clips the right half
MOTION = [(25, y) for y in range(5, 70, 10)] + [(x, 20) for x in range(15, 100, 10)]


async def main(p, browser):
    ims, version = await shots(p, browser, "techniques.html", 1000)
    print(f"\n{browser} {version}")
    print(f"  {'technique':26} {'bar colour':10} {'clip':8} animation states in 3 s")
    for i, name in enumerate(NAMES):
        x0 = i * 110
        clip = "-"
        if i in CLIPPED:
            clip = "works" if ims[0].getpixel((x0 + 75, 90)) == (255, 255, 255) else "FAILS"
        print(f"  {name:26} {hexof(ims[0].getpixel((x0 + 25, 90))):10} {clip:8} {states(ims, x0, MOTION)}")

run(main)
