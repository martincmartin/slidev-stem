#!/usr/bin/env python3
"""Is the drawing painted as vectors during the zoom, or is a bitmap
stretched? In Chromium and Firefox. Writes out/zoom.json and PNGs in out/.

    ../../../../.venv/bin/python3 measure_zoom.py      # in spike/

The zoom runs for 400 s, is moved to a point in it, and is captured while it
runs. Two measures:

1. Sharpness, at the middle of the zoom: the capture against the same
   transform set with no transition (spike_pixels.sharpness). A ratio near 1
   means vectors; well below 1 means a stretched bitmap.
2. The hairspring's width and extent (spike_pixels.Crossing), with the rest
   hidden, at a quarter, a half and three quarters of the zoom. With
   non-scaling-stroke the width must be 2 px at every scale: a bitmap
   stretched from a smaller scale makes it wider. Blur keeps the width and
   adds to the extent. The reference is the same transform at rest.

The camera modes are those of site/zoom.html: a CSS transition of `transform`
(svg, linear), a CSS transition of a registered number (svg, exp), and a JS
loop that writes the transform attribute (js, exp).
"""

import json

import numpy
from playwright.sync_api import Browser, Page, sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site
from spike_pixels import Pixels, crossings, grab, save, sharpness

BALANCE = (845.1, 162.7)  # the balance arbor on the canvas
MODES = (("svg", "linear"), ("svg", "exp"), ("js", "exp"))
DURATION_MS = 400_000


def run_to(page: Page, fraction: float) -> str:
    """Start the zoom, move it to `fraction`, let it run; return its matrix."""
    page.evaluate("spike.zoom(true)")
    page.evaluate(
        f"""() => {{
        document.getAnimations()
          .filter(a => ["transform", "--z"].includes(a.transitionProperty))
          .forEach(a => {{ a.currentTime = {fraction * DURATION_MS}; }});
        spike.seek({fraction});
        }}"""
    )
    page.wait_for_timeout(500)
    return str(page.evaluate("spike.matrix()"))


def on_screen(matrix: str) -> tuple[int, int]:
    """Where the balance arbor is, through the camera `matrix`."""
    scale, _, _, _, shift_x, shift_y = (float(n) for n in matrix[7:-1].split(","))
    return round(scale * BALANCE[0] + shift_x), round(scale * BALANCE[1] + shift_y)


def around(pixels: Pixels, centre: tuple[int, int]) -> Pixels:
    left = min(max(centre[0] - 150, 0), pixels.shape[1] - 300)
    top = min(max(centre[1] - 150, 0), pixels.shape[0] - 300)
    return pixels[top : top + 300, left : left + 300]


def mid_sharpness(
    browser: Browser, base: str, mode: str, ease: str, smil: str
) -> float:
    query = f"mode={mode}&ease={ease}&smil={smil}&t=0.5&dur=400"
    with open_page(browser, base, query) as page:
        matrix = run_to(page, 0.5)
        running = around(grab(page), on_screen(matrix))
    with open_page(browser, base, f"mode={mode}&smil=paused&t=0.5&dur=0") as page:
        page.evaluate(
            f"() => {{ const c = spike.camera(); c.style.transition = 'none';"
            f" c.style.transform = '{matrix}'; }}"
        )
        reference = around(grab(page), on_screen(matrix))
    tag = f"{browser.browser_type.name}-{mode}-{ease}-{smil}"
    save(numpy.concatenate([running, reference], axis=1), str(OUT / f"mid-{tag}.png"))
    return sharpness(running) / sharpness(reference)


def spring_lines(
    browser: Browser, base: str, mode: str, ease: str, fraction: float
) -> dict[str, float]:
    query = f"mode={mode}&ease={ease}&only=hairspring&smil=paused&t=0.5&dur=400"
    with open_page(browser, base, query) as page:
        matrix = run_to(page, fraction)
        pixels = grab(page)
    at_rest = "only=hairspring&smil=paused&t=0.5&dur=0&fade=0"
    with open_page(browser, base, at_rest) as page:
        page.evaluate(
            f"() => {{ const c = spike.camera(); c.style.transition = 'none';"
            f" c.style.transform = '{matrix}'; }}"
        )
        reference = grab(page)
    centre_x, centre_y = on_screen(matrix)
    moving = crossings(pixels, centre_y, centre_x)
    still = crossings(reference, centre_y, centre_x)
    return {
        "scale": float(matrix[7:].split(",")[0]),
        "width": float(numpy.median([crossing.width for crossing in moving])),
        "extent": float(numpy.mean([crossing.extent for crossing in moving])),
        "extent_at_rest": float(numpy.mean([crossing.extent for crossing in still])),
    }


def main() -> None:
    OUT.mkdir(exist_ok=True)
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            results[browser_name(browser)] = {
                f"{mode}, {ease}": {
                    "sharpness_ratio": {
                        smil: mid_sharpness(browser, base, mode, ease, smil)
                        for smil in ("paused", "running")
                    },
                    "spring_lines_px": [
                        spring_lines(browser, base, mode, ease, fraction)
                        for fraction in (0.25, 0.5, 0.75)
                    ],
                }
                for mode, ease in MODES
            }
    (OUT / "zoom.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
