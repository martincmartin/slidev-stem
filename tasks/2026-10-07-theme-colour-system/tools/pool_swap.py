"""Slide 2 at click 1, with a palette set for the whole page, so that it also
reaches the watch layer: pool_swap.py OUT CSS. Needs the dev server on 3040."""
import asyncio, sys
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as pw:
        b=await pw.chromium.launch(); p=await b.new_page(viewport={"width":980,"height":552}, device_scale_factor=1)
        await p.goto("http://localhost:3040/2?clicks=1"); await p.wait_for_timeout(5000)
        await p.add_style_tag(content=sys.argv[2]); await p.wait_for_timeout(300)
        await p.screenshot(path=sys.argv[1])
        await b.close()
asyncio.run(main())
