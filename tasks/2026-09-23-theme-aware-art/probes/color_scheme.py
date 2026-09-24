#!/usr/bin/env python3
"""Does an <img> SVG's prefers-color-scheme follow the <img> element's
color-scheme, or the OS setting? scheme.svg is #143C6B, or #FFC24E when dark."""
from common import run, shots, hexof


async def main(p, browser):
    for os_scheme in ("light", "dark"):
        ims, version = await shots(p, browser, "scheme.html", 400, n=1, color_scheme=os_scheme)
        cols = [hexof(ims[0].getpixel((x, 50))) for x in (50, 160, 270)]
        print(f"{browser} {version}, OS {os_scheme:5}: plain img {cols[0]}, "
              f"img with color-scheme:dark {cols[1]}, img inside color-scheme:dark {cols[2]}")

run(main)
