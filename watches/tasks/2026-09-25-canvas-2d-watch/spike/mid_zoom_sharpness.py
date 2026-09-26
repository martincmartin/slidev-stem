#!/usr/bin/env python3
"""C12 and C22: is the drawing as sharp during a running zoom as at rest?
Headless, in Chromium and Firefox. The method of the zoom task's
measure_zoom.py (E5): a zoom of 400 s is moved to its middle (or its end) and
captured while it runs; the reference is the same camera at rest
(spike.jump). A ratio of sharpness near 1 means the frame was drawn at its
own scale; well below 1 means a stretched bitmap.

The CSS camera (mode=js-css, C22) is compared with the SVG's own camera at
rest: if the browser stretches a bitmap of the <svg>, a reference with the
same camera could be stretched too. At the end of the zoom, every part is
set back to full opacity first, as the canvas starts its fade there.
Writes ../out/mid-zoom.json and side-by-side PNGs in ../out/mid-zoom/.

    ../../../../.venv/bin/python3 mid_zoom_sharpness.py      # in spike/
"""

import json
from dataclasses import dataclass

import numpy
from playwright.sync_api import Browser, Page, sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site
from spike_pixels import Pixels, grab, save, sharpness

PICTURES = OUT / "mid-zoom"
BALANCE = (845.1, 162.7)  # the balance arbor on the canvas
# fadelater=1, as in every frame test: with a fade's CSS transition pending
# during the move, Chromium drew the SVG soft (C12's first run, in
# ../evidence/superseded/mid-zoom-c12.json).
BASE_QUERY = "ease=linear&fadelater=1&stroke=compensated&t=0.5"
SVG_CAMERA = "renderer=svg&mode=js"
# Start the zoom and move it `along` of the way (0.5: the middle).
RUN_TO = """along => {
  spike.zoom(true);
  spike.seek(along);
}"""
# The camera's scale now, as a fraction of the way from 1 to the view's.
ALONG = """() => {
  const S = Number(getComputedStyle(document.getElementById("stage")).getPropertyValue("--S"));
  return (Number(spike.matrix().slice(7).split(",")[0]) - 1) / (S - 1);
}"""


@dataclass(frozen=True)
class Variant:
    name: str
    query: str  # the renderer and the camera
    reference: str  # the query of the reference at rest

    def running(self, smil: str, host: float = 1) -> str:
        """The page's query for a zoom of 400 s."""
        return f"{BASE_QUERY}&host={host}&{self.query}&smil={smil}&dur=400"

    def at_rest(self, host: float = 1) -> str:
        """The reference's query."""
        return f"{BASE_QUERY}&host={host}&{self.reference}&smil=paused"


VARIANTS = (
    Variant("svg", SVG_CAMERA, SVG_CAMERA),
    Variant("canvas", "renderer=canvas", "renderer=canvas"),
    Variant("svg-css", "renderer=svg&mode=js-css", SVG_CAMERA),
    Variant(
        "svg-css-no-will-change", "renderer=svg&mode=js-css&willchange=0", SVG_CAMERA
    ),
)
# Where the zoom is captured, as the name used in the results -> how far along.
STOPS = {"": 0.5, ", at the end": 1.0}


def around(pixels: Pixels, matrix: str) -> Pixels:
    """300 x 300 px around the balance arbor, through the camera `matrix`."""
    scale, _, _, _, shift_x, shift_y = (
        float(number) for number in matrix[7:-1].split(",")
    )
    x, y = round(scale * BALANCE[0] + shift_x), round(scale * BALANCE[1] + shift_y)
    left = min(max(x - 150, 0), pixels.shape[1] - 300)
    top = min(max(y - 150, 0), pixels.shape[0] - 300)
    return pixels[top : top + 300, left : left + 300]


def run_to(page: Page, stop: float) -> float:
    """Start the zoom, move it to `stop`, and set every part to full opacity;
    return how far along the camera is."""
    page.evaluate(RUN_TO, stop)
    page.wait_for_timeout(100)
    page.evaluate("spike.fadeTo(1)")
    page.wait_for_timeout(400)
    return float(page.evaluate(ALONG))


def hold_at(page: Page, along: float) -> None:
    """Put the camera `along` of the way at once, and let it draw."""
    page.evaluate(f"spike.jump({along})")
    page.wait_for_timeout(300)


def tag_of(browser: Browser, variant: Variant, smil: str, stop: float) -> str:
    end = "-end" if stop == 1 else ""
    return f"{browser.browser_type.name}-{variant.name}-{smil}{end}"


def ratio(
    browser: Browser, base: str, variant: Variant, smil: str, stop: float
) -> float:
    with open_page(browser, base, variant.running(smil)) as page:
        page.set_default_timeout(20000)
        along = run_to(page, stop)
        running = around(grab(page), str(page.evaluate("spike.matrix()")))
    with open_page(browser, base, variant.at_rest()) as page:
        page.set_default_timeout(20000)
        hold_at(page, along)
        reference = around(grab(page), str(page.evaluate("spike.matrix()")))
    save(
        numpy.concatenate([running, reference], axis=1),
        str(PICTURES / f"{tag_of(browser, variant, smil, stop)}.png"),
    )
    return sharpness(running) / sharpness(reference)


def main() -> None:
    PICTURES.mkdir(exist_ok=True)
    results: dict[str, dict[str, float]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            results[browser_name(browser)] = {
                f"{variant.name}, mechanism {smil}{where}": ratio(
                    browser, base, variant, smil, stop
                )
                for variant in VARIANTS
                for where, stop in STOPS.items()
                for smil in ("paused", "running")
            }
    (OUT / "mid-zoom.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
