"""Render two diving-board SVGs at a few times, on Ledger's paper, in
Chromium, and report how many pixels differ, and by how much."""

import io
import pathlib
import sys

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

PAPER = "#FAF7F0"
TIMES = (0.0, 2.0, 5.3)


def frames(page, svg: str) -> list[np.ndarray]:
    page.set_content(
        f'<html><body style="margin:0;background:{PAPER}">{svg}</body></html>'
    )
    shots = []
    for time in TIMES:
        page.evaluate(
            "t => { const s = document.querySelector('svg'); s.pauseAnimations(); s.setCurrentTime(t); }",
            time,
        )
        png = page.locator("svg").screenshot()
        shots.append(np.asarray(Image.open(io.BytesIO(png)).convert("RGB"), dtype=int))
    return shots


before, after = (pathlib.Path(path).read_text() for path in sys.argv[1:3])
with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 1100, "height": 600})
    for time, old, new in zip(TIMES, frames(page, before), frames(page, after)):
        delta = np.abs(old - new).max(axis=2)
        print(
            f"t={time}: {int((delta > 0).sum())} px differ, "
            f"{int((delta > 2).sum())} by more than 2 levels, max {int(delta.max())}"
        )
        if delta.max() > 2:
            ys, xs = np.nonzero(delta > 2)
            print(f"   where: x {xs.min()}-{xs.max()}, y {ys.min()}-{ys.max()}")
    browser.close()
