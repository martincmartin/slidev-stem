#!/usr/bin/env python3
"""A control for measure_zoom.py: with nothing moving, does the camera set as
the SVG transform attribute paint the same as the camera set as the CSS
transform property (the reference there)? Writes out/check_reference.json.

    ../../../../.venv/bin/python3 check_reference.py      # in spike/
"""

import json

from measure_zoom import around, on_screen
from playwright.sync_api import sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site
from spike_pixels import grab, sharpness

MATRIX = (2.12, -991.0, -145.2)  # scale and shift, about the middle of the zoom


def main() -> None:
    scale, shift_x, shift_y = MATRIX
    css = f"matrix({scale}, 0, 0, {scale}, {shift_x}, {shift_y})"
    attribute = f"translate({shift_x} {shift_y}) scale({scale})"
    results: dict[str, float] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            shots = []
            for script in (
                f"spike.camera().style.transform = '{css}'",
                f"spike.camera().setAttribute('transform', '{attribute}')",
            ):
                with open_page(browser, base, "mode=js&smil=paused&t=0.5") as page:
                    page.evaluate(script)
                    page.wait_for_timeout(300)
                    shots.append(around(grab(page), on_screen(css)))
            results[browser_name(browser)] = sharpness(shots[1]) / sharpness(shots[0])
    (OUT / "check_reference.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
