#!/usr/bin/env python3
"""The zoomed view at rest, in Chromium and Firefox. Writes out/static.json.

    ../../../../.venv/bin/python3 measure_static.py      # in spike/

1. Stroke width: with non-scaling-stroke, is the hairspring 2 px in slide px
   (2 x the host scale on screen) or in screen px (2 px at any host scale)?
   And does non-scaling-stroke work when the camera is an HTML wrapper?
2. Rounding: how much do one and two decimals differ at 4.46 times?
"""

import json

import numpy
from playwright.sync_api import Browser, sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site
from spike_pixels import crossings, grab, ink, save

TIMES = (0.1, 0.35, 0.6, 0.85, 1.3)  # s, on the mechanism's clock


def stroke_width(
    browser: Browser, base: str, mode: str, host: float, stroke: str
) -> float:
    """The median width of the hairspring's coils on the ray from its centre."""
    query = f"mode={mode}&host={host}&stroke={stroke}&dur=0&fade=0"
    with open_page(browser, base, query) as page:
        page.evaluate("spike.zoom(true)")
        page.wait_for_timeout(300)
        pixels = grab(page, "#host")
    found = crossings(pixels, round(276 * host), round(705 * host))
    return float(numpy.median([crossing.width for crossing in found]))


def rounding(browser: Browser, base: str, time: float) -> dict[str, float]:
    shots = []
    for svg in ("watch-1dp.svg", "watch-2dp.svg"):
        query = f"svg={svg}&smil=paused&t={time}&dur=0&fade=0"
        with open_page(browser, base, query) as page:
            page.evaluate("spike.zoom(true)")
            page.wait_for_timeout(300)
            shots.append(grab(page))
    difference = numpy.abs(shots[0] - shots[1]).max(axis=2)
    if time == TIMES[0]:
        tag = browser.browser_type.name
        save(numpy.concatenate(shots, axis=1), str(OUT / f"rounding-{tag}.png"))
    return {
        "max_diff": float(difference.max()),
        "pixels_over_32": int((difference > 32).sum()),
        "ink_pixels": int((ink(shots[1]) > 0.05).sum()),
    }


def main() -> None:
    OUT.mkdir(exist_ok=True)
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            results[browser_name(browser)] = {
                "stroke_width_px": {
                    f"{mode}, host {host}, {stroke}": stroke_width(
                        browser, base, mode, host, stroke
                    )
                    for mode in ("svg", "html")
                    for host in (1.0, 1.5)
                    for stroke in ("fixed", "scaled")
                },
                "rounding": {
                    f"t={time}": rounding(browser, base, time) for time in TIMES
                },
            }
    (OUT / "static.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
