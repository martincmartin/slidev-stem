#!/usr/bin/env python3
"""With stroke=compensated (each stroke-width divided by the scale), is the
hairspring still 2 px on screen during and after the zoom, in Chromium and
Firefox? Writes out/compensated.json.

    ../../../../.venv/bin/python3 check_compensated.py      # in spike/
"""

import json

import numpy
from measure_zoom import on_screen, run_to
from playwright.sync_api import sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site
from spike_pixels import crossings, grab

QUERY = "mode=js&ease=linear&stroke=compensated&only=hairspring&smil=paused&t=0.5"


def main() -> None:
    results: dict[str, list[dict[str, float]]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            rows = []
            for fraction in (0.25, 0.5, 0.75, 1.0):
                with open_page(browser, base, f"{QUERY}&dur=400") as page:
                    matrix = run_to(page, fraction)
                    pixels = grab(page)
                centre_x, centre_y = on_screen(matrix)
                found = crossings(pixels, centre_y, centre_x)
                rows.append(
                    {
                        "fraction": fraction,
                        "scale": float(matrix[7:].split(",")[0]),
                        "width": float(numpy.median([c.width for c in found])),
                        "extent": float(numpy.mean([c.extent for c in found])),
                    }
                )
            results[browser_name(browser)] = rows
    (OUT / "compensated.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
