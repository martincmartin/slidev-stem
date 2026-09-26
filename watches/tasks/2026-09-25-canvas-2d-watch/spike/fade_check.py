#!/usr/bin/env python3
"""C14: how far is the canvas's fade from the SVG's? The SVG fades each
tagged part as one layer; the canvas multiplies each shape's alpha. In
Chromium and Firefox, with the mechanism paused, the fading parts are set to
the same opacity in both renderers (spike.fadeTo) and captured, at the cover
and at the end of the zoom. Opacities 1 and 0 are controls: there the two
must match as in C1. Writes ../out/fade.json and images in ../out/fade/.

    ../../../../.venv/bin/python3 fade_check.py      # in spike/
"""

import json
from dataclasses import asdict

import numpy
from pixel_check import compare
from playwright.sync_api import Browser, sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site
from spike_pixels import Pixels, grab, save

PICTURES = OUT / "fade"
QUERY = "mode=js&stroke=compensated&smil=paused&t=0.5"
OPACITIES = (1, 0.75, 0.5, 0.25, 0)
PLACES = (0, 1)  # along the zoom: the cover, the balance


def capture(
    browser: Browser, base: str, renderer: str, along: float, opacity: float
) -> Pixels:
    with open_page(browser, base, f"{QUERY}&renderer={renderer}") as page:
        page.set_default_timeout(20000)
        page.evaluate(f"spike.jump({along})")
        page.evaluate(f"spike.fadeTo({opacity})")
        page.wait_for_timeout(300)
        return grab(page)


def main() -> None:
    PICTURES.mkdir(exist_ok=True)
    results: dict[str, dict[str, dict[str, object]]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            rows: dict[str, dict[str, object]] = {}
            for along in PLACES:
                for opacity in OPACITIES:
                    svg = capture(browser, base, "svg", along, opacity)
                    canvas = capture(browser, base, "canvas", along, opacity)
                    difference, picture = compare(svg, canvas)
                    tag = f"{browser.browser_type.name}-at{along}-opacity{opacity}"
                    save(
                        numpy.concatenate([svg, canvas], axis=1),
                        str(PICTURES / f"{tag}.png"),
                    )
                    save(picture, str(PICTURES / f"{tag}-diff.png"))
                    rows[f"at {along}, opacity {opacity}"] = asdict(difference)
            results[browser_name(browser)] = rows
    (OUT / "fade.json").write_text(json.dumps(results, indent=2) + "\n")
    for name, table in results.items():
        print(name)
        for label, row in table.items():
            print(
                f"  {label:22} mean {row['mean']:6.3f}  >32 {row['over_32']:8.5f}"
                f"  max {row['largest']:3}  areas {row['areas']:5}"
            )


if __name__ == "__main__":
    main()
