"""Before and after, magnified, where the pool's edge pixels differ most."""

import io
import pathlib
import sys

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

PAPER = "#FAF7F0"


def shot(page, svg: str) -> Image.Image:
    page.set_content(f'<html><body style="margin:0;background:{PAPER}">{svg}</body></html>')
    page.evaluate("() => { const s = document.querySelector('svg'); s.pauseAnimations(); s.setCurrentTime(0); }")
    return Image.open(io.BytesIO(page.locator("svg").screenshot())).convert("RGB")


before, after = (pathlib.Path(path).read_text() for path in sys.argv[1:3])
with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(viewport={"width": 1100, "height": 600})
    old, new = shot(page, before), shot(page, after)
    browser.close()
delta = np.abs(np.asarray(old, dtype=int) - np.asarray(new, dtype=int)).max(axis=2)
ys, xs = np.nonzero(delta == delta.max())
x, y = int(xs[0]), int(ys[0])
box = (max(0, x - 40), max(0, y - 25), x + 40, y + 25)
sheet = Image.new("RGB", (80 * 8 * 2 + 10, 50 * 8), "white")
sheet.paste(old.crop(box).resize((640, 400), Image.NEAREST), (0, 0))
sheet.paste(new.crop(box).resize((640, 400), Image.NEAREST), (650, 0))
sheet.save(sys.argv[3])
print("centre", x, y, "rows of change by y:", np.bincount(np.nonzero(delta > 2)[0]).nonzero()[0][:5], "...")
print("pixels changed > 2 levels, by x band of 100:", np.bincount(np.nonzero(delta > 2)[1] // 100))
