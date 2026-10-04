"""Second round: crop the pool and put one line at the bottom (F, G); or move the
callout down and put the three lines above it (H). Same overlay method as mock.py."""
import asyncio, pathlib, sys
sys.path.insert(0, "/Users/martin/Develop/slidev/stem/tools")
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from offline_check import serve_build, HOST
from playwright.async_api import async_playwright
from mock import STYLE, THREE, block

S = pathlib.Path(sys.argv[1])
OUT = pathlib.Path(__file__).parent / "mockups"
PAPER = "rgb(250,247,240)"
MUTED = "rgb(115,106,96)"

def crop(top, fade):
    """Paper over the pool below `top`, blended over `fade` px (0: a hard edge)."""
    return (f'<div style="position:absolute;left:0;right:0;top:{top - fade}px;bottom:0;z-index:40;'
            f'background:linear-gradient(to bottom, rgba(250,247,240,0) 0, {PAPER} {fade}px)"></div>')

def moved_callout(baseline, target):
    """The label at a new baseline, and a straight stand-in for the optimised leader."""
    x, y = target
    return (f'<div style="position:absolute;left:610px;top:{baseline - 23}px;z-index:50;'
            f'font:600 29px \'IBM Plex Sans\';line-height:29px;color:{MUTED}">Rest Shape</div>'
            f'<svg viewBox="0 0 980 552" style="position:absolute;inset:0;z-index:45;overflow:visible">'
            f'<polyline points="{x},{y} 550,{baseline - 10} 590,{baseline - 10}" fill="none" '
            f'stroke="{MUTED}" stroke-width="3" stroke-linejoin="round"/></svg>')

ONE = ["BEND IT AWAY FROM STRAIGHT, IT PUSHES BACK"]
OPTIONS = {
    # crop with a fade below the stand (bottom 418), one line centred under the picture
    "F-crop-fade-bottom": dict(lines=ONE, left=148, top=462, extra=lambda clicks: crop(430, 30)),
    "G-crop-hard-bottom": dict(lines=ONE, left=148, top=462, extra=lambda clicks: crop(430, 0)),
    # three lines top right, callout moved down to baseline 350
    "H-callout-down": dict(lines=THREE, left=610, top=112, hide_callout=True,
                           extra=lambda clicks: moved_callout(350, (493, 283) if clicks == 1 else (421, 300))),
}

async def main():
    async with async_playwright() as playwright:
        browser = await playwright.chromium.launch()
        page = await browser.new_page(viewport={"width": 1960, "height": 1104})
        await serve_build(page, S / "deck", [])
        for name, option in OPTIONS.items():
            for clicks, struck, wait in ((1, False, 5200), (3, True, 2500)):
                await page.goto(f"http://{HOST}/2?clicks={clicks}")
                await page.wait_for_selector(".slidev-layout", state="visible")
                await page.evaluate("document.fonts.ready")
                await page.wait_for_timeout(wait)
                await page.evaluate("""([style, html, extra, left, top, hide]) => {
                  const layout = [...document.querySelectorAll('.slidev-layout')]
                    .find(el => el.querySelector('h1')?.textContent.includes('Hairspring'));
                  const css = document.createElement('style'); css.textContent = style; document.head.append(css);
                  layout.insertAdjacentHTML('beforeend', extra);
                  const div = document.createElement('div'); div.className = 'm-text';
                  div.style.left = left + 'px'; div.style.top = top + 'px'; div.innerHTML = html;
                  layout.append(div);
                  if (hide) document.querySelectorAll('[data-layer="rest-callout"]').forEach(g => g.style.display = 'none');
                }""", [STYLE, block(option["lines"], struck), option["extra"](clicks),
                       option["left"], option["top"], option.get("hide_callout", False)])
                await page.wait_for_timeout(300)
                await page.screenshot(path=str(OUT / f"{name}-{clicks}.png"))
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
