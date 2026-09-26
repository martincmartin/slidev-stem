#!/usr/bin/env python3
"""C8: the canvas watch in the spike deck (deck/), headless, in Chromium and
Firefox, at two window sizes. A copy of the zoom task's deck_check.py (E9),
changed for the canvas. Writes ../out/deck.json and screenshots in ../out/deck/.

    ../../../../node_modules/.bin/slidev slides.md --port 3132   # in deck/
    ../../../../.venv/bin/python3 deck_check.py http://localhost:3132   # in spike/

For each browser and window:
1. slide 1: is the watch drawn? What colour is the layer, and is the slide's
   own layout see-through?
2. slide 2, after the zoom and the fade: the hairspring's width on screen,
   against 2 px times Slidev's slide scale; is everything else gone?
3. slide 3: is the layer hidden, and the slide's layout opaque again?
4. back to slide 2: still the hairspring view.
At each step, the stage's clock start: one value means the clock never
restarted.
"""

import json
import sys
from collections.abc import Callable

import numpy
from playwright.sync_api import Error, Page, sync_playwright
from spike_browser import OUT, browser_name, browsers
from spike_pixels import crossings, grab, ink, save

PICTURES = OUT / "deck"
WINDOWS = ((1280, 720), (1920, 1080))
SPRING_CENTRE = (705, 276)  # slide px: the view's target
STATE = """() => {
  const layer = document.querySelector(".watch-layer");
  const slide = [...document.querySelectorAll("#slideshow .slidev-layout")]
    .find(element => element.offsetParent !== null);
  const box = document.querySelector("#slide-content").getBoundingClientRect();
  const stage = window.watchStage;
  return {
    view: stage?.view.name ?? null,
    running: stage?.running ?? null,
    clock_start: stage?.clockStart ?? null,
    canvas: stage ? [stage.canvas.width, stage.canvas.height] : null,
    layer_background: getComputedStyle(layer).backgroundColor,
    layer_visibility: getComputedStyle(layer).visibility,
    slide_background: slide ? getComputedStyle(slide).backgroundColor : null,
    scale: box.width / 980, left: box.left, top: box.top,
  };
}"""


def slide_state(page: Page) -> dict[str, object]:
    return dict(page.evaluate(STATE))


def collector(sink: list[str]) -> Callable[[Error], None]:
    """A page-error handler that appends each error to `sink`."""

    def collect(error: Error) -> None:
        sink.append(str(error))

    return collect


def step(page: Page, key: str | None, tag: str, wait: int) -> dict[str, object]:
    if key:
        page.keyboard.press(key)
    page.wait_for_timeout(wait)
    save(grab(page, "body"), str(PICTURES / f"{tag}.png"))
    return slide_state(page)


def spring_check(page: Page, state: dict[str, object]) -> dict[str, float]:
    """The hairspring's line width along the row through its centre, and the
    ink left in the slide's right half outside the spring's circle."""
    pixels = grab(page, "body")
    scale = float(str(state["scale"]))
    left, top = float(str(state["left"])), float(str(state["top"]))
    row = round(top + SPRING_CENTRE[1] * scale)
    start = round(left + SPRING_CENTRE[0] * scale)
    widths = [crossing.width for crossing in crossings(pixels, row, start)]
    coverage = ink(pixels)
    ys, xs = numpy.mgrid[: coverage.shape[0], : coverage.shape[1]]
    outside = numpy.hypot(xs - start, ys - row) > 200 * scale  # the spring: r < 170
    right = (xs > left + 490 * scale) & (xs < left + 978 * scale)
    return {
        "spring_width_px": float(numpy.median(widths)),
        "expected_px": 2 * scale,
        "ink_outside_spring": float(coverage[outside & right].sum()),
    }


def main() -> None:
    base = sys.argv[1]
    PICTURES.mkdir(exist_ok=True)
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright:
        for browser in browsers(playwright):
            for width, height in WINDOWS:
                page = browser.new_page(viewport={"width": width, "height": height})
                errors: list[str] = []
                page.on("pageerror", collector(errors))
                page.goto(f"{base}/1")
                page.wait_for_function("window.watchStage?.running")
                tag = f"{browser.browser_type.name}-{width}"
                first = step(page, None, f"{tag}-1", 1500)
                second = step(page, "ArrowRight", f"{tag}-2", 3500)
                spring = spring_check(page, second)
                third = step(page, "ArrowRight", f"{tag}-3", 1500)
                back = step(page, "ArrowLeft", f"{tag}-2-again", 1500)
                results[f"{browser_name(browser)}, {width}x{height}"] = {
                    "slide 1": first,
                    "slide 2": second,
                    **spring,
                    "slide 3": third,
                    "slide 2 again": back,
                    "page_errors": errors,
                }
                page.close()
    (OUT / "deck.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
