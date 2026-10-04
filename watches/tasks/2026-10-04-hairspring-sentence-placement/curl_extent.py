"""Step slide 2 from click 1 to 2 and record the board's extent during the curl."""
import asyncio, pathlib, sys, json
sys.path.insert(0, "/Users/martin/Develop/slidev/stem/tools")
from offline_check import serve_build, HOST
from playwright.async_api import async_playwright
from PIL import Image
import numpy as np

S = pathlib.Path(sys.argv[1])
SENTENCES = ["BEND IT AWAY FROM STRAIGHT, IT PUSHES BACK", "BEND IT AWAY", "FROM STRAIGHT,",
             "IT PUSHES BACK", "BEND IT AWAY FROM", "STRAIGHT, IT PUSHES BACK", "WIND", "REST", "BEND", "STRAIGHT",
             "Bend it away from straight, it pushes back", "Rest Shape"]

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page(viewport={"width": 1960, "height": 1104})
        await serve_build(page, S / "deck", [])
        await page.goto(f"http://{HOST}/2?clicks=1")
        await page.wait_for_selector(".slidev-layout", state="visible")
        await page.evaluate("document.fonts.ready")
        widths = {}
        for size in (24, 29, 33, 37):
            widths[size] = await page.evaluate("""([texts, size]) => {
              const c = document.createElement('canvas').getContext('2d');
              c.font = `600 ${size}px "IBM Plex Sans"`;
              return Object.fromEntries(texts.map(t => [t, Math.round(c.measureText(t).width)]));
            }""", [SENTENCES, size])
        print(json.dumps(widths, indent=1))
        await page.wait_for_timeout(5000)
        await page.keyboard.press("ArrowRight")
        boxes = []
        for index in range(45):
            path = S / "curl" / f"f{index:02d}.png"
            await page.screenshot(path=str(path))
            image = np.asarray(Image.open(path).convert("RGB")).astype(int)
            # the board's ink: art line #143C6B or the knockout #D3DCE3
            line = (abs(image - [20, 60, 107]).sum(axis=2) < 60)
            ys, xs = np.nonzero(line)
            if len(xs):
                boxes.append((index * 100, xs.min() // 2, xs.max() // 2, ys.min() // 2, ys.max() // 2))
            await page.wait_for_timeout(100 - 0)
        for box in boxes: print(box)
        print("min top", min(b[3] for b in boxes), "max right", max(b[2] for b in boxes))
        await browser.close()
asyncio.run(main())
