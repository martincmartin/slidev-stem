#!/usr/bin/env python3
"""Every set at the size the deck renders them, one page.

    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/grid.py

This is the sheet to look at when reconsidering the aesthetics: 200 px flatters
everything, 122 px is the decision. Each row is pinned to the same animation
time so nothing is caught mid-blink.
"""
import pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from contact import instance, ITEMS
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parents[1] / "out"
# deck order, as the slides present them
SETS = [("1 Line", "t13"), ("2 Line, weighted", "line-weighted"),
        ("3 Engraved", "engraved"), ("4 Patent", "patent"),
        ("5 Patent, weighted", "patent-weighted"),
        ("6 Guide on paper", "guide-ledger"), ("7 Vector on paper", "vector-ledger"),
        ("8 Bold", "bold"), ("9 Linocut", "linocut"), ("10 Riso", "riso"),
        ("11 Pop Art", "popart"), ("12 Ciechanowski", "ciechanowski"),
        ("13 Shaded", "shaded"), ("14 Photoreal", "photoreal"),
        ("15 Guide", "guide"), ("16 Vector display", "vector")]
T = 4.0

h = ['<!doctype html><meta charset=utf-8><style>',
     'body{margin:0;background:#FAF7F0;font:12px "IBM Plex Sans",Arial,sans-serif;padding:14px}',
     '.row{display:flex;gap:12px;align-items:center;margin-bottom:6px}',
     '.n{width:118px;font:600 13px "IBM Plex Sans";color:#2A2520}',
     '.card{display:flex;padding:8px;background:#F2EEE4;border:1px solid #E0D9CA;border-radius:12px}',
     '.card svg{border-radius:6px;display:block}</style>',
     f'<div style="font:600 15px sans-serif;color:#736A60;margin-bottom:10px">'
     f'All {len(SETS)} sets at 122 px, t = {T}s</div>']
for label, d in SETS:
    h.append(f'<div class="row" data-t="{T}"><div class="n">{label}</div>')
    h += [f'<div class="card">{instance(d, n, f"{d}-{n}", 122, 97)}</div>' for n in ITEMS]
    h.append("</div>")
h.append('<script>document.querySelectorAll("[data-t]").forEach(c=>{'
         'const t=parseFloat(c.dataset.t);'
         'c.querySelectorAll("svg").forEach(s=>{s.pauseAnimations();s.setCurrentTime(t);});});</script>')
OUT.mkdir(exist_ok=True)
(OUT / "grid.html").write_text("\n".join(h))
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 700, "height": 800})
    pg.goto((OUT / "grid.html").as_uri())
    pg.wait_for_timeout(400)
    pg.screenshot(path=str(OUT / "grid-all-sets-122px.png"), full_page=True)
    b.close()
print(OUT / "grid-all-sets-122px.png")
