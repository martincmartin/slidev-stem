#!/usr/bin/env python3
"""Inline SVG: what happens to drawing B when an earlier drawing A has the same
clipPath id? B clips to its right half; A to its left half. Correct: B shows
only its right half."""
from common import run, shots, hexof

CASES = ["B alone, unique id (control)", "A visible first, same id", "A in display:none first, same id",
         "unique clip id, clipPath in display:none"]


def half(im, x0):
    left, right = im.getpixel((x0 + 25, 50)) != (255, 255, 255), im.getpixel((x0 + 75, 50)) != (255, 255, 255)
    return {(False, True): "right half (correct)", (True, False): "LEFT half (A's clip)",
            (True, True): "both halves (no clip)", (False, False): "nothing"}[(left, right)]


async def main(p, browser):
    ims, version = await shots(p, browser, "dupids.html", 500, n=1)
    for i, case in enumerate(CASES):
        print(f"{browser} {version}, {case:34}: B shows {half(ims[0], i * 110)}")

run(main)
