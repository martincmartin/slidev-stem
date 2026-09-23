#!/usr/bin/env python3
"""Look at an animated drawing properly: every frame that matters, side by side.

    .venv/bin/python3 tools/contact.py public/timekeepers/line-weighted
    .venv/bin/python3 tools/contact.py new.svg --times 0.2 4 8 11.8
    .venv/bin/python3 tools/contact.py new.svg --out /tmp/sheet.png

Needs playwright (+ `playwright install chromium`). Writes a PNG and prints its
path. Each drawing appears once large and once at every requested time in the
122 px card the deck actually renders.

WHY THIS EXISTS RATHER THAN JUST SCREENSHOTTING THE DECK. Two traps, both of
which cost real time:

 1. SMIL animation makes a live screenshot non-reproducible. Every drawing here
    is paused and pinned to an explicit time with setCurrentTime(), so two runs
    are comparable and so a defect that only exists at t = 8 s is visible at all.
    One real bug -- a leader line that pointed at a flame after the flame had
    burned down past it -- was invisible at t = 0 and obvious at t = 8, and no
    metric caught it, because a line pointing at nothing is exactly as much ink
    as one pointing at something.
 2. The same SVG appearing many times on one page shares its ids. Without
    namespacing every id per instance, all copies resolve clipPath and pattern
    references to the first one and the animation looks frozen in all but one.
    This file does the namespacing; a hand-rolled harness usually does not.

WHAT TO LOOK FOR. Whether the drawing still reads at 122 px -- that is the size
it ships at, and the large row is only there to show you what you are losing.
Whether anything animates off its own feature. Whether a texture has turned to
mud. For "can the back row see it", use `barroom.py`; this one is for your eyes.
"""
import re, sys, pathlib, argparse

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lib

DEFAULT_TIMES = [0.2, 3.0, 6.0, 9.0, 11.8]


def instance(path: pathlib.Path, tag: str, w: int, h: int) -> str:
    """One copy of a drawing, with every id namespaced so refs stay local to it."""
    src = path.read_text()
    for i in set(re.findall(r'id="([^"]+)"', src)):
        src = src.replace(f'id="{i}"', f'id="{i}-{tag}"').replace(f"url(#{i})", f"url(#{i}-{tag})")
    return re.sub(r'<svg width="\d+" height="\d+"', f'<svg width="{w}" height="{h}"', src, count=1)


def build_html(files, times):
    P = lib.LEDGER
    bw, bh = lib.ART_BOX
    big = (200, round(200 * bh / bw))
    h = ['<!doctype html><meta charset=utf-8><style>',
         f'body{{margin:0;background:{P["background"]};'
         'font:12px "IBM Plex Sans",Arial,sans-serif;padding:12px}',
         '.row{display:flex;gap:14px;align-items:center;margin-bottom:8px}',
         f'.t{{width:44px;font:600 14px monospace;color:{P["accent"]}}}',
         # the card chrome the deck actually puts around these drawings
         f'.card{{display:flex;padding:9px 11px;background:{P["panel"]};'
         f'border:1px solid {P["border"]};border-radius:12px}}',
         '.card svg{border-radius:6px;display:block}',
         f'h2{{font:600 14px "IBM Plex Sans";color:{P["muted"]};margin:12px 0 6px}}</style>',
         f'<h2>{len(files)} drawing(s) &mdash; {big[0]} px</h2><div class="row" data-t="4.0">']
    h += [f'<div class="card">{instance(f, "big-" + f.stem, *big)}</div>' for f in files]
    h.append(f'</div><h2>{lib.CARD_ART[0]} px &mdash; the size the deck really renders</h2>')
    for t in times:
        tag = str(t).replace(".", "p")
        h.append(f'<div class="row" data-t="{t}"><div class="t">{t}s</div>')
        h += [f'<div class="card">{instance(f, f"{f.stem}-{tag}", *lib.CARD_ART)}</div>'
              for f in files]
        h.append("</div>")
    h.append('<script>document.querySelectorAll("[data-t]").forEach(c=>{'
             'const t=parseFloat(c.dataset.t);'
             'c.querySelectorAll("svg").forEach(s=>{s.pauseAnimations();s.setCurrentTime(t);});});</script>')
    return "\n".join(h)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("paths", nargs="*", help="SVG files or directories (default: the deck's art)")
    ap.add_argument("--times", nargs="+", type=float, default=DEFAULT_TIMES,
                    help="animation times to pin, in seconds")
    ap.add_argument("--out", default=None, help="output PNG (default: out/contact.png)")
    a = ap.parse_args()

    files = lib.art_files(a.paths or None)
    if not files:
        sys.exit("no SVGs found")
    out = pathlib.Path(a.out) if a.out else lib.ROOT / "out/contact.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    page = out.with_suffix(".html")
    page.write_text(build_html(files, a.times))

    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": 260 + 150 * len(files), "height": 800})
        pg.goto(page.as_uri())
        pg.wait_for_timeout(300)
        pg.screenshot(path=str(out), full_page=True)
        b.close()
    print(f"{out}   ({len(files)} drawing(s) at {', '.join(str(t) for t in a.times)} s)")


if __name__ == "__main__":
    main()
