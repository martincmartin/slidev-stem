#!/usr/bin/env python3
"""Can CSS alone choose which pre-built copy of a drawing a slide shows?
A palette class sets --timekeeper-plain: url(...); an <img> uses it through
`content`, a <div> through `background`. Expected: palette-b's copy is #C0451C,
palette-a's is #143C6B, and the width animation runs."""
from common import run, shots, states, hexof

CASES = (("img, content: var(...), palette-b", 0), ("div, background: var(...), palette-b", 110),
         ("img, content: var(...), palette-a", 220))
MOTION = [(x, 50) for x in range(5, 100, 10)]


async def main(p, browser):
    ims, version = await shots(p, browser, "css_select.html", 400)
    for label, x0 in CASES:
        print(f"{browser} {version}, {label:38}: colour {hexof(ims[0].getpixel((x0 + 5, 50)))}, "
              f"animation states in 3 s: {states(ims, x0, MOTION)}")

run(main)
