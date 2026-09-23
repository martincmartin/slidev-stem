#!/usr/bin/env python3
"""Contact sheet for one drawing set, sampled at fixed animation times.

    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/contact.py vector
    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/contact.py guide 0.2 4 8 11.8

Why this exists rather than screenshotting the deck: SMIL animation makes a live
screenshot non-reproducible, so every drawing is paused and pinned to an explicit
time with setCurrentTime(). Two traps this file already handles --

 1. The page INLINES the SVG source. Re-run this after every SVG edit; screenshotting
    a stale harness silently shows you the old art. (Cost us two wasted cycles.)
 2. The same SVG appears many times on the page, so every id is suffixed per
    instance. Without that, all copies resolve clipPath/pattern refs to the first
    one and the animation appears frozen or wrong in every copy but one.
"""
import re, sys, pathlib
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
# The art these tools read. Until 2026-09-21 this was the project root's
# public/timekeepers/, which held all sixteen sets because the live deck showed all
# sixteen. The live deck now ships one set, so the sets live in this archive's own
# deck/ and the tools read them from there -- which is also what makes the archive
# runnable after the live deck has moved on. See README S14.
ART = pathlib.Path(__file__).resolve().parents[1] / "deck/public/timekeepers"

OUT = pathlib.Path(__file__).resolve().parents[1] / "out"
ITEMS = ["sundial", "water-clock", "candle", "hourglass"]
DEFAULT_TIMES = [0.2, 3.0, 6.0, 9.0, 11.8]


def instance(set_dir: str, name: str, tag: str, w: int, h: int) -> str:
    """One copy of a drawing, with every id namespaced so refs stay local to it."""
    src = (ART / set_dir / f"{name}.svg").read_text()
    for i in set(re.findall(r'id="([^"]+)"', src)):
        src = src.replace(f'id="{i}"', f'id="{i}-{tag}"').replace(f"url(#{i})", f"url(#{i}-{tag})")
    return re.sub(r'<svg width="240" height="190"', f'<svg width="{w}" height="{h}"', src, count=1)


def build_html(set_dir: str, times) -> str:
    h = ['<!doctype html><meta charset=utf-8><style>',
         'body{margin:0;background:#FAF7F0;font:12px "IBM Plex Sans",Arial,sans-serif;padding:12px}',
         '.row{display:flex;gap:14px;align-items:center;margin-bottom:8px}',
         '.t{width:40px;font:600 14px monospace;color:#1F5FA8}',
         # the card chrome the deck actually puts around these drawings
         '.card{display:flex;padding:9px 11px;background:#F2EEE4;border:1px solid #E0D9CA;border-radius:12px}',
         '.card svg{border-radius:6px;display:block}',
         'h2{font:600 14px "IBM Plex Sans";color:#736A60;margin:12px 0 6px}</style>',
         f'<h2>{set_dir} — 200 px</h2><div class="row" data-t="4.0">']
    h += [f'<div class="card">{instance(set_dir, n, "big-" + n, 200, 158)}</div>' for n in ITEMS]
    h.append('</div><h2>122 px — the size the deck really renders</h2>')
    for t in times:
        h.append(f'<div class="row" data-t="{t}"><div class="t">{t}s</div>')
        tag = str(t).replace(".", "p")
        h += [f'<div class="card">{instance(set_dir, n, f"{n}-{tag}", 122, 97)}</div>' for n in ITEMS]
        h.append("</div>")
    h.append('<script>document.querySelectorAll("[data-t]").forEach(c=>{'
             'const t=parseFloat(c.dataset.t);'
             'c.querySelectorAll("svg").forEach(s=>{s.pauseAnimations();s.setCurrentTime(t);});});</script>')
    return "\n".join(h)


def main():
    set_dir = sys.argv[1] if len(sys.argv) > 1 else "vector"
    times = [float(x) for x in sys.argv[2:]] or DEFAULT_TIMES
    OUT.mkdir(exist_ok=True)
    page_path = OUT / f"contact-{set_dir}.html"
    page_path.write_text(build_html(set_dir, times))
    shot = OUT / f"contact-{set_dir}.png"
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 900, "height": 800})
        pg.goto(page_path.as_uri())
        pg.wait_for_timeout(300)
        pg.screenshot(path=str(shot), full_page=True)
        b.close()
    print(f"{shot}  (times: {', '.join(str(t) for t in times)})")


if __name__ == "__main__":
    main()
