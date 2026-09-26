#!/usr/bin/env python3
"""Check the spike deck (deck/) in Chromium and Firefox, at two window sizes.
Writes out/deck.json and screenshots in out/.

    ../../../../node_modules/.bin/slidev slides.md --port 3131   # in deck/
    ../../../../.venv/bin/python3 deck_check.py http://localhost:3131   # in spike/

For each browser and window:
1. slide 1: did the inline SVG load (the ?raw import from public/)? What
   colour is the layer, and is the slide's own layout see-through?
2. slide 2, after the zoom: the hairspring's width on screen, against 2 px
   times Slidev's slide scale;
3. slide 3: is the layer hidden, and the slide's layout opaque again?
"""

import json
import sys
from collections.abc import Callable

import numpy
from playwright.sync_api import Error, Page, sync_playwright
from spike_browser import OUT, browser_name, browsers
from spike_pixels import crossings, grab, save

WINDOWS = ((1280, 720), (1920, 1080))
SPRING_CENTRE = (705, 276)  # slide px, PLAN.md
STATE = """() => {
  const layer = document.querySelector(".watch-layer");
  const slide = [...document.querySelectorAll("#slideshow .slidev-layout")]
    .find(element => element.offsetParent !== null);
  const box = document.querySelector("#slide-content").getBoundingClientRect();
  return {
    svg_loaded: !!document.querySelector(".watch-holder svg .camera"),
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


def main() -> None:
    base = sys.argv[1]
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright:
        for browser in browsers(playwright):
            for width, height in WINDOWS:
                page = browser.new_page(viewport={"width": width, "height": height})
                errors: list[str] = []
                page.on("pageerror", collector(errors))
                page.goto(f"{base}/1")
                page.wait_for_selector(".watch-holder svg")
                page.wait_for_timeout(1500)
                tag = f"{browser.browser_type.name}-{width}"
                first = slide_state(page)
                save(grab(page, "body"), str(OUT / f"deck-{tag}-1.png"))
                page.keyboard.press("ArrowRight")
                page.wait_for_timeout(3500)
                second = slide_state(page)
                pixels = grab(page, "body")
                save(pixels, str(OUT / f"deck-{tag}-2.png"))
                scale = float(str(second["scale"]))
                row = round(float(str(second["top"])) + SPRING_CENTRE[1] * scale)
                start = round(float(str(second["left"])) + SPRING_CENTRE[0] * scale)
                widths = [crossing.width for crossing in crossings(pixels, row, start)]
                page.keyboard.press("ArrowRight")
                page.wait_for_timeout(1500)
                third = slide_state(page)
                save(grab(page, "body"), str(OUT / f"deck-{tag}-3.png"))
                results[f"{browser_name(browser)}, {width}x{height}"] = {
                    "slide 1": first,
                    "slide 2": second,
                    "spring_width_px": float(numpy.median(widths)),
                    "expected_px": 2 * scale,
                    "slide 3": third,
                    "page_errors": errors,
                }
                page.close()
    (OUT / "deck.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
