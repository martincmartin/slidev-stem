#!/usr/bin/env python3
"""Same-document sprite: one <symbol>, several <use>s. Does each use take its
own colour from an inherited variable, does the clip work, does it animate?
The third case puts the sprite inside display:none, as on a hidden slide."""
from common import run, shots, states, hexof

MOTION = [(25, y) for y in range(5, 70, 10)]
CASES = (("default colour", 0), ("--line on the <svg>", 110), ("sprite in display:none", 220))


async def main(p, browser):
    ims, version = await shots(p, browser, "sprite.html", 400)
    for label, x0 in CASES:
        clip = "works" if ims[0].getpixel((x0 + 75, 90)) == (255, 255, 255) else "FAILS"
        print(f"{browser} {version}, {label:22}: bar {hexof(ims[0].getpixel((x0 + 25, 90)))}, "
              f"clip {clip}, animation states in 3 s: {states(ims, x0, MOTION)}")

run(main)
