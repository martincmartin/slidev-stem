"""Shared by the probes: serve this directory to a browser and sample pixels.

Every probe runs in each browser in BROWSERS. Pages are served through
Playwright's request routing, from this directory, at http://probe.test/.
"""
import mimetypes, pathlib, urllib.parse
from playwright.async_api import async_playwright
from PIL import Image

HERE = pathlib.Path(__file__).parent
BROWSERS = ("chromium", "firefox")


async def _route(r):
    f = HERE / urllib.parse.urlparse(r.request.url).path.lstrip("/")
    await r.fulfill(body=f.read_bytes(), content_type=mimetypes.guess_type(str(f))[0] or "text/html")


def hexof(rgb):
    return "#%02X%02X%02X" % rgb


async def shots(p, browser, page, width, n=12, step_ms=250, color_scheme="light"):
    """Load `page` in `browser`; return n screenshots (PIL RGB), step_ms apart."""
    b = await getattr(p, browser).launch()
    pg = await b.new_page(viewport={"width": width, "height": 120}, color_scheme=color_scheme)
    await pg.route("**/*", _route)
    await pg.goto(f"http://probe.test/{page}")
    await pg.wait_for_timeout(800)          # let script-inserted content arrive
    out = []
    for _ in range(n):
        path = HERE / "_shot.png"
        await pg.screenshot(path=str(path))
        out.append(Image.open(path).convert("RGB"))
        await pg.wait_for_timeout(step_ms)
    (HERE / "_shot.png").unlink()
    version = b.version
    await b.close()
    return out, version


def states(images, x0, pts):
    """Distinct pixel states of one 100x100 cell (at x0) across the images."""
    return len({tuple(im.getpixel((x0 + x, y)) for x, y in pts) for im in images})


def run(main):
    import asyncio

    async def wrapper():
        async with async_playwright() as p:
            for browser in BROWSERS:
                await main(p, browser)

    asyncio.run(wrapper())
