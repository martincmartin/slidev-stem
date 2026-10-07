"""Where the sundial's plate wash (art-line at 0.07) overlaps another mark: the
pixels that change when it is drawn solid, in red over the drawing.

Run from stem/: uv run python tasks/2026-10-07-theme-colour-system/tools/sundial_plate.py
Writes evidence/sundial-plate-overlap.png.
"""

import asyncio
import pathlib
from io import BytesIO

from PIL import Image, ImageChops
from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent
SVG = HERE.parent / "inputs" / "public" / "timekeepers" / "sundial.svg"
PAPER = "#F2EEE4"


async def main() -> None:
    html = f"<!doctype html><body style='margin:0;background:{PAPER}'>{SVG.read_text()}</body>"
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page(device_scale_factor=4, viewport={"width": 240, "height": 200})
        await page.set_content(html)
        before = await page.screenshot()
        await page.evaluate("""(paper) => {
          // the plate, solid: 0.07 of its colour over the bare panel
          const plate = document.querySelector('svg ellipse');
          const style = getComputedStyle(plate);
          const opacity = parseFloat(style.fillOpacity);
          const own = style.fill.match(/\\d+/g).map(Number);
          const ground = paper.match(/[0-9a-f]{2}/gi).map((hex) => parseInt(hex, 16));
          const mixed = own.slice(0, 3).map((value, channel) =>
            Math.round(opacity * value + (1 - opacity) * ground[channel]));
          plate.style.fill = `rgb(${mixed.join(',')})`;
          plate.style.fillOpacity = '1';
        }""", PAPER)
        after = await page.screenshot()
        await browser.close()
    first = Image.open(BytesIO(before)).convert("RGB")
    second = Image.open(BytesIO(after)).convert("RGB")
    mask = ImageChops.difference(first, second).convert("L").point(lambda value: 255 if value > 2 else 0)
    shown = first.copy()
    shown.paste((220, 0, 0), mask=mask)
    width, height = first.size
    shown.crop((0, 0, min(width, 488), min(height, 388))).save(
        HERE.parent / "evidence" / "sundial-plate-overlap.png"
    )


asyncio.run(main())
