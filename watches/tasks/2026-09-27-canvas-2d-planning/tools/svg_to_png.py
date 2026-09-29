#!/usr/bin/env python3
"""Render SVG files to PNG files beside them, with Playwright's Chromium.

    ../../../../.venv/bin/python3 svg_to_png.py ../evidence/depth/*.svg   # in tools/

Each PNG is drawn at twice the SVG's stated size.
"""

import argparse
import pathlib

from playwright.sync_api import sync_playwright


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("files", nargs="+", type=pathlib.Path)
    arguments = parser.parse_args()
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(device_scale_factor=2)
        for file in arguments.files:
            page.goto(file.resolve().as_uri())
            svg = page.locator("svg").first
            svg.screenshot(path=str(file.with_suffix(".png")))
            print(f"wrote {file.with_suffix('.png')}")
        page.close()
        browser.close()


if __name__ == "__main__":
    main()
