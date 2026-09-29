#!/usr/bin/env python3
"""Load a BUILT Slidev deck with every outside request blocked, and report.

    pnpm exec slidev build --out /tmp/deck                 # in the talk's directory
    .venv/bin/python3 tools/offline_check.py /tmp/deck 1:0 2:0 2:5 3:0      # slide:clicks ...
    .venv/bin/python3 tools/offline_check.py /tmp/deck 2:5 --shots /tmp/png/after
    .venv/bin/python3 tools/offline_check.py /tmp/deck --clicks 2 --back    # step through slide 2
    .venv/bin/python3 tools/offline_check.py /tmp/deck --walk      # every slide and click

Needs playwright: run it with stem/.venv/bin/python3 (`uv sync` in stem/ makes it).

It serves the build straight from disk through Playwright's request routing, so
no local web server is needed (the sandbox may refuse to let one bind). Every
request to any other host is aborted and listed. The deck passes the offline
rule in ~/Develop/slidev/AGENTS.md only if that list is empty.

For each slide:clicks it prints the slide's classes, background, text colour,
body font, the h1's font/weight/size/colour, and the families of every loaded
web font. --shots PREFIX also saves PREFIX-<slide>-<clicks>.png (1960x1104).
--clicks N presses the right arrow from slide N and prints, per press, one
character per v-click element, judged by its opacity: '-' hidden, 'd' dimmed,
'V' visible. --back then presses the left arrow as many times. After each
string, 'classes k/n' says how many of the n v-click elements still have
Slidev's slidev-vclick-target class. --walk presses the right arrow from slide 1
until the URL stops changing, at the end of the deck. So every slide and every
click loads, and a request from any of them is caught. It prints how many steps
it took and where it stopped. tools/validate.py uses it.
"""

import argparse
import asyncio
import json
import mimetypes
import pathlib
import urllib.parse

import browsers
from playwright.async_api import Route, async_playwright

HOST = "deck.test"
INFO_JS = """() => {
  const e = [...document.querySelectorAll('.slidev-layout')].find(x => x.offsetParent !== null)
            || document.querySelector('.slidev-layout');
  const cs = x => x ? getComputedStyle(x) : null;
  const h = e && e.querySelector('h1');
  return {
    classes: e && e.className,
    background: e && cs(e).backgroundColor,
    color: e && cs(e).color,
    font: e && cs(e).fontFamily.split(',')[0],
    h1: h && [cs(h).fontFamily.split(',')[0], cs(h).fontWeight, cs(h).fontSize, cs(h).color].join(' '),
    webfonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family + ' ' + f.weight))],
  };
}"""
# Mark every v-click element once, at clicks=0, then judge each by its computed
# opacity. Do not judge by Slidev's classes: when a component re-renders its own
# :class binding, Vue can drop the classes the v-click directive added, although
# the element still shows and hides correctly. The opacity is multiplied down
# through single-child descendants, so a v-click wrapper around a dimmed
# component reads as dimmed.
MARK_JS = """() => document.querySelectorAll('.slidev-vclick-target').forEach(e => {
  if (e.closest('.slidev-page') && e.closest('.slidev-page').offsetParent !== null) e.dataset.vc = '1' })"""
CLICKS_JS = """() => [...document.querySelectorAll('[data-vc]')].map(e => {
  let o = 1;
  for (let x = e; x; x = x.children.length === 1 ? x.children[0] : null)
    o *= parseFloat(getComputedStyle(x).opacity);
  return o < 0.05 ? '-' : (o < 0.9 ? 'd' : 'V') }).join('')"""
CLASSES_JS = """() => { const m = [...document.querySelectorAll('[data-vc]')];
  return m.filter(e => e.classList.contains('slidev-vclick-target')).length + '/' + m.length }"""
# --walk stops here if the URL still changes: no talk has this many steps.
WALK_LIMIT = 1000


async def main(arguments: argparse.Namespace) -> int:
    root = pathlib.Path(arguments.build)
    blocked = []

    async def route(request_route: Route) -> None:
        url = urllib.parse.urlparse(request_route.request.url)
        if url.netloc != HOST:
            blocked.append(request_route.request.url)
            return await request_route.abort()
        file = root / url.path.lstrip("/")
        if not file.is_file():
            file = root / "index.html"  # Slidev uses history routing
        content_type = (
            "font/woff2"
            if file.suffix == ".woff2"
            else (mimetypes.guess_type(str(file))[0] or "application/octet-stream")
        )
        await request_route.fulfill(body=file.read_bytes(), content_type=content_type)
        return None

    async with async_playwright() as playwright:
        browsers.install(playwright.chromium)
        browser = await playwright.chromium.launch()
        page = await browser.new_page(
            viewport={"width": 1960, "height": 1104},
            color_scheme=arguments.color_scheme,
        )
        await page.route("**/*", route)
        for slide_and_clicks in arguments.shots_at:
            slide, clicks = slide_and_clicks.split(":")
            await page.goto(f"http://{HOST}/{slide}?clicks={clicks}")
            await page.wait_for_timeout(1800)
            await page.evaluate("document.fonts.ready")
            print(slide_and_clicks, json.dumps(await page.evaluate(INFO_JS)))
            if arguments.shots:
                await page.screenshot(path=f"{arguments.shots}-{slide}-{clicks}.png")
        if arguments.clicks:
            await page.goto(f"http://{HOST}/{arguments.clicks}")
            await page.wait_for_timeout(1500)
            await page.evaluate(MARK_JS)
            keys = ["ArrowRight"] * arguments.presses + (
                ["ArrowLeft"] * arguments.presses if arguments.back else []
            )
            for presses, key in enumerate(keys):
                state = (
                    f"{await page.evaluate(CLICKS_JS):<12} "
                    f"classes {await page.evaluate(CLASSES_JS)}"
                )
                print(
                    f"after {presses} presses: {state}  url={page.url.split(HOST)[1]}"
                )
                await page.keyboard.press(key)
                await page.wait_for_timeout(500)
        if arguments.walk:
            await page.goto(f"http://{HOST}/1")
            await page.wait_for_timeout(1500)
            steps = [page.url]
            while len(steps) < WALK_LIMIT:
                await page.keyboard.press("ArrowRight")
                await page.wait_for_timeout(500)
                if page.url == steps[-1]:
                    break
                steps.append(page.url)
            print(f"walked {len(steps)} steps, to {steps[-1].split(HOST)[1]}")
        await browser.close()
    print("outside requests:", len(blocked))
    for url_text in blocked:
        print("  ", url_text)
    return 1 if blocked else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("build", help="the directory `slidev build --out` wrote")
    parser.add_argument("shots_at", nargs="*", help="slide:clicks, e.g. 2:5")
    parser.add_argument(
        "--shots",
        metavar="PREFIX",
        help="save screenshots as PREFIX-<slide>-<clicks>.png",
    )
    parser.add_argument(
        "--clicks", type=int, metavar="SLIDE", help="step through this slide's clicks"
    )
    parser.add_argument("--presses", type=int, default=7)
    parser.add_argument(
        "--walk",
        action="store_true",
        help="press the right arrow from slide 1 to the end of the deck",
    )
    parser.add_argument(
        "--back", action="store_true", help="then press the left arrow as many times"
    )
    parser.add_argument(
        "--color-scheme",
        default="light",
        choices=["light", "dark"],
        help="emulate the OS setting; a light-only theme must stay light",
    )
    raise SystemExit(asyncio.run(main(parser.parse_args())))
