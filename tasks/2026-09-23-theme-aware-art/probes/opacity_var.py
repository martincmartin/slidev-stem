#!/usr/bin/env python3
"""Does var() work in fill-opacity and stroke-opacity attributes? #143C6B at
0.5 on white is about #8A9EB5; at 1.0 (the variable ignored) it is #143C6B."""
from common import run, shots, hexof


async def main(p, browser):
    ims, version = await shots(p, browser, "opacity_var.html", 300, n=1)
    for label, x0 in (("<img>, the file's :root block", 0), ("inline, the page's variable", 110)):
        print(f"{browser} {version}, {label:30}: fill-opacity {hexof(ims[0].getpixel((x0 + 50, 25)))}, "
              f"stroke-opacity {hexof(ims[0].getpixel((x0 + 50, 75)))}")

run(main)
