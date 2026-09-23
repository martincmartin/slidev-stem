#!/usr/bin/env python3
"""Load a BUILT Slidev deck with every outside request blocked, and report.

    pnpm exec slidev build --out /tmp/deck                 # in the talk's directory
    python offline_check.py /tmp/deck 1:0 2:0 2:5 3:0      # slide:clicks ...
    python offline_check.py /tmp/deck 2:5 --shots /tmp/png/after
    python offline_check.py /tmp/deck --clicks 2           # step through slide 2

Needs playwright (the talk's .venv has it: watches/.venv/bin/python3).

It serves the build straight from disk through Playwright's request routing, so
no local web server is needed (the sandbox may refuse to let one bind). Every
request to any other host is aborted and listed. The deck passes the offline
rule in ~/Develop/slidev/AGENTS.md only if that list is empty.

For each slide:clicks it prints the slide's classes, background, text colour,
body font, the h1's font/weight/size/colour, and the families of every loaded
web font. --shots PREFIX also saves PREFIX-<slide>-<clicks>.png (1960x1104).
--clicks N presses the right arrow from slide N and prints, per press, one
character per v-click element, judged by its opacity: '-' hidden, 'd' dimmed,
'V' visible.
"""
import argparse, asyncio, json, mimetypes, pathlib, urllib.parse
from playwright.async_api import async_playwright

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
# :class binding (TimekeeperCard's `dim`), Vue drops the classes the v-click
# directive added, although the element still shows and hides correctly.
MARK_JS = """() => document.querySelectorAll('.slidev-vclick-target').forEach(e => {
  if (e.closest('.slidev-page') && e.closest('.slidev-page').offsetParent !== null) e.dataset.vc = '1' })"""
CLICKS_JS = """() => [...document.querySelectorAll('[data-vc]')].map(e => {
  const o = parseFloat(getComputedStyle(e).opacity);
  return o < 0.05 ? '-' : (o < 0.9 ? 'd' : 'V') }).join('')"""


async def main(a):
    root = pathlib.Path(a.build)
    blocked = []

    async def route(r):
        u = urllib.parse.urlparse(r.request.url)
        if u.netloc != HOST:
            blocked.append(r.request.url)
            return await r.abort()
        f = root / u.path.lstrip("/")
        if not f.is_file():
            f = root / "index.html"          # Slidev uses history routing
        ct = "font/woff2" if f.suffix == ".woff2" else (mimetypes.guess_type(str(f))[0] or "application/octet-stream")
        await r.fulfill(body=f.read_bytes(), content_type=ct)

    async with async_playwright() as p:
        b = await p.chromium.launch()
        pg = await b.new_page(viewport={"width": 1960, "height": 1104}, color_scheme=a.color_scheme)
        await pg.route("**/*", route)
        for s in a.shots_at:
            n, c = s.split(":")
            await pg.goto(f"http://{HOST}/{n}?clicks={c}")
            await pg.wait_for_timeout(1800)
            await pg.evaluate("document.fonts.ready")
            print(s, json.dumps(await pg.evaluate(INFO_JS)))
            if a.shots:
                await pg.screenshot(path=f"{a.shots}-{n}-{c}.png")
        if a.clicks:
            await pg.goto(f"http://{HOST}/{a.clicks}")
            await pg.wait_for_timeout(1500)
            await pg.evaluate(MARK_JS)
            for i in range(a.presses):
                print(f"after {i} presses: {await pg.evaluate(CLICKS_JS):<12} url={pg.url.split(HOST)[1]}")
                await pg.keyboard.press("ArrowRight")
                await pg.wait_for_timeout(500)
        await b.close()
    print("outside requests:", len(blocked))
    for u in blocked:
        print("  ", u)
    return 1 if blocked else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("build", help="the directory `slidev build --out` wrote")
    ap.add_argument("shots_at", nargs="*", help="slide:clicks, e.g. 2:5")
    ap.add_argument("--shots", metavar="PREFIX", help="save screenshots as PREFIX-<slide>-<clicks>.png")
    ap.add_argument("--clicks", type=int, metavar="SLIDE", help="step through this slide's clicks")
    ap.add_argument("--presses", type=int, default=7)
    ap.add_argument("--color-scheme", default="light", choices=["light", "dark"],
                    help="emulate the OS setting; a light-only theme must stay light")
    raise SystemExit(asyncio.run(main(ap.parse_args())))
