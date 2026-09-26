#!/usr/bin/env python3
"""C22: the sharpness check of mid_zoom_sharpness.py, read from the screen
(macOS `screencapture`), so that it shows what the browser's compositor
shows: visible, full-screen windows at devicePixelRatio 2 and host=1.7, as
in C3. Playwright's Chromium and Firefox, each brought to the front with
`open -a`. The sharpness is over the whole stage, which the page locates on
the screen. Writes ../out/screen-sharpness.json and, for each measurement,
in ../out/screen-sharpness/: the capture above its reference (<tag>.png),
and 600 x 600 screen px at the stage's centre, the capture on the left
(<tag>-detail.png).

    ../../../../.venv/bin/python3 screen_sharpness.py      # in spike/

Needs the Screen Recording permission for the terminal. Do not use the
laptop while it runs: the captures are of the whole screen.
"""

import json
import subprocess
import tempfile
from pathlib import Path

import numpy
from cpu_check import app_of
from headed_check import NATIVE_ARGS, settle
from mid_zoom_sharpness import STOPS, VARIANTS, Variant, hold_at, run_to, tag_of
from PIL import Image
from playwright.sync_api import Browser, Page, sync_playwright
from spike_browser import OUT, serve_site
from spike_pixels import Pixels, save, sharpness

PICTURES = OUT / "screen-sharpness"
HOST = 1.7
BORDER = 8  # screen px left out at each side of the stage
DETAIL = 600  # screen px: the side of the close-up
# The stage on the screen, in CSS px: [left, top, width, height], and the
# pixel ratio. Firefox knows where its viewport is; for Chromium, the window
# less its toolbars, which are all at the top.
STAGE = """() => {
  const stage = document.getElementById("stage").getBoundingClientRect();
  const left = window.mozInnerScreenX ?? screenX + outerWidth - innerWidth;
  const top = window.mozInnerScreenY ?? screenY + outerHeight - innerHeight;
  return [left + stage.left, top + stage.top, stage.width, stage.height, devicePixelRatio];
}"""


def capture_screen() -> Pixels:
    with tempfile.TemporaryDirectory() as directory:
        path = Path(directory) / "screen.png"
        subprocess.run(["screencapture", "-x", str(path)], check=True)
        return numpy.asarray(Image.open(path).convert("RGB"), dtype=float)


def stage_box(page: Page) -> tuple[slice, slice]:
    """The stage on the screen, in screen px, less a border."""
    left, top, width, height, ratio = (float(number) for number in page.evaluate(STAGE))
    return (
        slice(round(top * ratio) + BORDER, round((top + height) * ratio) - BORDER),
        slice(round(left * ratio) + BORDER, round((left + width) * ratio) - BORDER),
    )


def detail(pixels: Pixels) -> Pixels:
    """DETAIL x DETAIL px at the centre of `pixels`."""
    top, left = (pixels.shape[0] - DETAIL) // 2, (pixels.shape[1] - DETAIL) // 2
    return pixels[top : top + DETAIL, left : left + DETAIL]


def load(page: Page, base: str, query: str) -> None:
    page.goto(f"{base}/zoom.html?{query}")
    page.evaluate("window.ready")
    page.wait_for_timeout(1000)


def ratio(
    browser: Browser, page: Page, base: str, variant: Variant, smil: str, stop: float
) -> float:
    load(page, base, variant.running(smil, HOST))
    along = run_to(page, stop)
    running = capture_screen()
    load(page, base, variant.at_rest(HOST))
    hold_at(page, along)
    reference = capture_screen()
    box = stage_box(page)
    running, reference = running[box], reference[box]
    tag = tag_of(browser, variant, smil, stop)
    save(numpy.concatenate([running, reference], axis=0), str(PICTURES / f"{tag}.png"))
    save(
        numpy.concatenate([detail(running), detail(reference)], axis=1),
        str(PICTURES / f"{tag}-detail.png"),
    )
    return sharpness(running) / sharpness(reference)


def main() -> None:
    PICTURES.mkdir(exist_ok=True)
    results: dict[str, dict[str, float]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for kind in (playwright.chromium, playwright.firefox):
            browser = kind.launch(headless=False, args=NATIVE_ARGS[kind.name])
            page = browser.new_page(no_viewport=True)
            page.set_default_timeout(20000)
            subprocess.run(
                ["open", "-a", str(app_of(kind.executable_path))], check=True
            )
            load(page, base, VARIANTS[0].at_rest(HOST))
            window = settle(page)
            name = f"{kind.name} {browser.version}, window {window}"
            results[name] = {
                f"{variant.name}, mechanism {smil}{where}": ratio(
                    browser, page, base, variant, smil, stop
                )
                for variant in VARIANTS
                for where, stop in STOPS.items()
                for smil in ("paused", "running")
            }
            print(name, json.dumps(results[name], indent=1))
            browser.close()
    (OUT / "screen-sharpness.json").write_text(json.dumps(results, indent=2) + "\n")


if __name__ == "__main__":
    main()
