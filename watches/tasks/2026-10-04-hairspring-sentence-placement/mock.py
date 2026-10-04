"""Overlay candidate placements of the sentence on slide 2 and take screenshots."""
import asyncio, pathlib, sys
sys.path.insert(0, "/Users/martin/Develop/slidev/stem/tools")
from offline_check import serve_build, HOST
from playwright.async_api import async_playwright

S = pathlib.Path(sys.argv[1])

def word(plain, insert, struck):
    if not struck:
        return plain
    return (f'<span class="m-edit">{plain}<span class="m-ins">{insert}</span></span>')

def block(lines, struck, extra=""):
    words = {"BEND": "WIND", "STRAIGHT": "REST"}
    out = []
    for line in lines:
        for plain, insert in words.items():
            line = line.replace(plain, word(plain, insert, struck))
        out.append(f"<div>{line}</div>")
    return "".join(out)

STYLE = """
.m-text { position:absolute; font: 600 29px 'IBM Plex Sans'; color: rgb(42,37,32);
  line-height: 61px; z-index: 50; white-space: nowrap; }
.m-edit { position: relative; text-decoration: line-through; text-decoration-color: var(--palette-accent);
  text-decoration-thickness: 3px; }
.m-ins { position:absolute; left:50%; transform:translateX(-50%); top:-30px; color: var(--palette-accent);
  text-decoration:none; line-height: 29px; }
"""

THREE = ["BEND IT AWAY", "FROM STRAIGHT,", "IT PUSHES BACK"]
OPTIONS = {
    # merged: line 2 takes the place of the "Rest Shape" label, the leader is unchanged
    "A-merged": dict(lines=THREE, left=610, top=139, hide_label=True),
    "B-below-callout": dict(lines=THREE, left=610, top=300, hide_label=False),
    "C-bottom-line": dict(lines=["BEND IT AWAY FROM STRAIGHT, IT PUSHES BACK"], left=148, top=470, hide_label=False),
    "D-top-right-two-lines": dict(lines=["BEND IT AWAY FROM", "STRAIGHT, IT PUSHES BACK"], left=560, top=95, hide_label=False),
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
                html = block(option["lines"], struck)
                await page.evaluate("""([style, html, left, top, hide]) => {
                  const layout = [...document.querySelectorAll('.slidev-layout')]
                    .find(el => el.querySelector('h1')?.textContent.includes('Hairspring'));
                  const css = document.createElement('style'); css.textContent = style; document.head.append(css);
                  const div = document.createElement('div'); div.className = 'm-text';
                  div.style.left = left + 'px'; div.style.top = top + 'px'; div.innerHTML = html;
                  layout.append(div);
                  if (hide) document.querySelectorAll('[data-layer="rest-callout"] text').forEach(t => t.style.display = 'none');
                }""", [STYLE, html, option["left"], option["top"], option["hide_label"]])
                await page.wait_for_timeout(300)
                await page.screenshot(path=str(S / "mock" / f"{name}-{clicks}.png"))
        await browser.close()
if __name__ == "__main__":
    asyncio.run(main())
