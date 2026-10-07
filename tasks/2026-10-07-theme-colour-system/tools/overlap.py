"""Which see-through fills in the talk's SVG art overlap another mark?

For each SVG, render it on its paper in Chromium. Then, one element at a time,
replace a fill drawn below full opacity with the solid colour that it gives
over the bare paper (`opacity x colour + (1 - opacity) x paper`), and count the
pixels that change. Zero changed pixels: the fill lies on bare paper only, and a
solid colour draws it the same. The control, `visiblePixels`: the pixels that
change when the mark is painted solid magenta; zero means the mark did not show
in this render, so its zero proves nothing. Animated files are sampled at
several times.

Run from stem/: uv run python tasks/2026-10-07-theme-colour-system/tools/overlap.py
Writes evidence/overlap.json next to this tool's directory.
"""

import asyncio
import json
import pathlib

from playwright.async_api import async_playwright

HERE = pathlib.Path(__file__).resolve().parent
# copies of the talk's SVGs at commit 1219a55, so the audit reproduces
TALK = HERE.parent / "inputs"
# The paper each file sits on: the cards are on the panel, the board on the background.
FILES = {
    "public/timekeepers/sundial.svg": "#F2EEE4",
    "public/timekeepers/water-clock.svg": "#F2EEE4",
    "public/timekeepers/candle.svg": "#F2EEE4",
    "public/timekeepers/hourglass.svg": "#F2EEE4",
    "public/diving-board.svg": "#FAF7F0",
}
TIMES = [0.0, 1.5, 3.0, 4.5, 6.0, 7.5]  # s, for animated files
SCALE = 2

SETUP = """(paper) => {
  document.body.style.margin = '0';
  document.body.style.background = paper;
  const svg = document.querySelector('svg');
  const marks = [...svg.querySelectorAll('path, rect, ellipse, circle, polygon, polyline')];
  return marks.map((mark, index) => {
    const style = getComputedStyle(mark);
    const opacity = parseFloat(style.fillOpacity);
    const translucent = style.fill !== 'none' && opacity < 1;
    if (translucent) mark.dataset.auditIndex = String(index);
    return translucent
      ? { index, tag: mark.tagName, fill: style.fill, fillOpacity: opacity,
          id: mark.id || null, cls: mark.getAttribute('class') }
      : null;
  }).filter(Boolean);
}"""

SOLID = """([index, paper]) => {
  const mark = document.querySelector(`[data-audit-index="${index}"]`);
  const style = getComputedStyle(mark);
  const opacity = parseFloat(style.fillOpacity);
  const own = style.fill.match(/\\d+(\\.\\d+)?/g).map(Number);
  const ground = paper.match(/[0-9a-f]{2}/gi).map((hex) => parseInt(hex, 16));
  const mixed = own.slice(0, 3).map((value, channel) =>
    Math.round(opacity * value + (1 - opacity) * ground[channel]));
  mark.style.fill = `rgb(${mixed.join(',')})`;
  mark.style.fillOpacity = '1';
}"""

MAGENTA = """(index) => {
  const mark = document.querySelector(`[data-audit-index="${index}"]`);
  mark.style.fill = 'rgb(255,0,255)';
  mark.style.fillOpacity = '1';
}"""

AT = """(seconds) => {
  const svg = document.querySelector('svg');
  if (svg.pauseAnimations) { svg.pauseAnimations(); svg.setCurrentTime(seconds); }
  for (const animation of document.getAnimations()) {
    animation.pause(); animation.currentTime = seconds * 1000;
  }
}"""


def changed(before: bytes, after: bytes) -> int:
    from io import BytesIO

    from PIL import Image, ImageChops

    first = Image.open(BytesIO(before)).convert("RGB")
    second = Image.open(BytesIO(after)).convert("RGB")
    difference = ImageChops.difference(first, second).convert("L")
    # more than 2 levels in any channel's sum: not rounding
    return sum(1 for value in difference.get_flattened_data() if value > 2)


async def main() -> None:
    results = []
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page(device_scale_factor=SCALE)
        for relative, paper in FILES.items():
            path = TALK / relative
            source = path.read_text()
            html = f"<!doctype html><html><body>{source}</body></html>"
            await page.set_content(html)
            marks = await page.evaluate(SETUP, paper)
            box = await page.locator("svg").first.bounding_box()
            await page.set_viewport_size(
                {"width": int(box["width"]) + 1, "height": int(box["height"]) + 1}
            )
            for mark in marks:
                worst = 0
                visible = 0
                for seconds in TIMES:
                    await page.set_content(html)
                    await page.evaluate(SETUP, paper)
                    await page.evaluate(AT, seconds)
                    before = await page.screenshot()
                    await page.evaluate(SOLID, [mark["index"], paper])
                    await page.evaluate(AT, seconds)
                    after = await page.screenshot()
                    worst = max(worst, changed(before, after))
                    await page.evaluate(MAGENTA, mark["index"])
                    await page.evaluate(AT, seconds)
                    painted = await page.screenshot()
                    visible = max(visible, changed(before, painted))
                results.append(
                    {"file": relative, "paper": paper, **mark,
                     "changedPixels": worst, "visiblePixels": visible,
                     "scale": SCALE}
                )
                print(f"{relative:38} {mark['fill']:22} {mark['fillOpacity']:.2f} "
                      f"{mark['cls'] or '':32} changed {worst:5} of {visible}")
        await browser.close()
    out = HERE.parent / "evidence" / "overlap.json"
    out.write_text(json.dumps(results, indent=2) + "\n")


asyncio.run(main())
