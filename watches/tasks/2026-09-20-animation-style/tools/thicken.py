#!/usr/bin/env python3
"""Is a failing set failing because it is THIN, or because of what it is?

Scale every stroke-width in a set by k, re-render, re-measure at the hardest
venue. If a set climbs, its problem is a number. If it does not, its problem is
the style and no amount of ink will fix it.
"""
import re, sys, pathlib, math
import numpy as np
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[3] / "tasks/2026-09-18-theme-colors/tools"))
import barroom as B
from contact import ITEMS
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parents[3]
# The art these tools read. Until 2026-09-21 this was the project root's
# public/timekeepers/, which held all sixteen sets because the live deck showed all
# sixteen. The live deck now ships one set, so the sets live in this archive's own
# deck/ and the tools read them from there -- which is also what makes the archive
# runnable after the live deck has moved on. See README S14.
ART = pathlib.Path(__file__).resolve().parents[1] / "deck/public/timekeepers"

CAND = ["t13", "engraved", "patent", "ciechanowski", "vector-ledger", "linocut", "bold"]
KS = [1.0, 1.5, 2.0, 3.0]
W, H, DSF = B.CARD_W, B.CARD_H, B.DSF


def thick(set_dir, name, tag, k):
    src = (ART / set_dir / f"{name}.svg").read_text()
    for i in set(re.findall(r'id="([^"]+)"', src)):
        src = src.replace(f'id="{i}"', f'id="{i}-{tag}"').replace(f"url(#{i})", f"url(#{i}-{tag})")
    src = re.sub(r'stroke-width="([0-9.]+)"',
                 lambda m: f'stroke-width="{float(m.group(1)) * k:.3f}"', src)
    return re.sub(r'<svg width="240" height="190"', f'<svg width="{W}" height="{H}"', src, count=1)


rows = [(d, k) for d in CAND for k in KS]
h = ['<!doctype html><meta charset=utf-8>',
     f'<style>body{{margin:0;background:{B.PANEL}}}div{{display:flex}}svg{{display:block}}</style>']
for d, k in rows:
    h.append('<div data-t="4.0">')
    h += [thick(d, n, f"{d}-{n}-{k}", k) for n in ITEMS]
    h.append("</div>")
h.append('<script>document.querySelectorAll("[data-t]").forEach(c=>{const t=parseFloat(c.dataset.t);'
         'c.querySelectorAll("svg").forEach(s=>{s.pauseAnimations();s.setCurrentTime(t);});});</script>')

with sync_playwright() as pw:
    b = pw.chromium.launch()
    pg = b.new_page(viewport={"width": W * 4, "height": H * len(rows)}, device_scale_factor=DSF)
    pg.set_content("".join(h), wait_until="load")
    pg.wait_for_timeout(700)
    pg.screenshot(path=str(B.OUT / "_thicken.png"), full_page=True)
    b.close()

raw = Image.open(str(B.OUT / "_thicken.png"))
am = B.arcmin_per_csspx(1.22, 7.0)
sigma = (1.0 / am) / 2.355 * DSF
print(f"venue: 55in TV at 7 m -- thinnest resolvable mark {1.0/am:.2f} CSS px\n")
print(f"{'set':<15}", end="")
for k in KS:
    print(f"{'x' + str(k):>22}", end="")
print(f"\n{'':<15}", end="")
for _ in KS:
    print(f"{'hold':>7}{'p90':>7}{'Fmax':>8}", end="")
print()
for i, (d, k) in enumerate(rows):
    if k == KS[0]:
        print(f"{d:<15}", end="")
    hs, ps, fs = [], [], []
    for c in range(4):
        crop = raw.crop((c * W * DSF, i * H * DSF, (c + 1) * W * DSF, (i + 1) * H * DSF))
        ink, bl = B.prep(crop, sigma)
        hs.append(B.hold(ink, bl, 0.0)); ps.append(B.hold(ink, bl, 0.0, 90)); fs.append(B.fmax(ink, bl))
    print(f"{sum(hs)/4:>7.2f}{sum(ps)/4:>7.2f}{sum(fs)/4:>8.3f}", end="")
    if k == KS[-1]:
        print()
