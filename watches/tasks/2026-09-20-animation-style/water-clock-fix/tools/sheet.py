#!/usr/bin/env python3
"""The comparison sheet: every variant, several animation times, near and far.

    .venv/bin/python3 .../water-clock-fix/tools/sheet.py

Writes evidence/variants-near.png (what the front row sees, 200 px and 122 px) and
evidence/variants-backrow.png (the 122 px row put through the venue blur and 10%
ambient flare, i.e. what the back of the bar gets). Same blur and linear-light
handling as the live tools/barroom.py, which it imports.

Read the far sheet first. The near one is only there to show what you are paying.
"""
import re, sys, pathlib, io
import numpy as np
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve()
WORK = HERE.parents[1]
ROOT = HERE.parents[4]
sys.path.insert(0, str(ROOT / "tools"))
import lib, barroom
from playwright.sync_api import sync_playwright

TIMES = [0.0, 2.0, 4.0, 6.0]
ORDER = ["w0-baseline", "w1-opaque", "w2-surface-line", "w3-contours",
         "w4-hatched", "w5-line-and-body", "w6-house-rule", "w7-mid-window"]
D = barroom.DSF


def instance(path, tag, w, h):
    src = path.read_text()
    for i in set(re.findall(r'id="([^"]+)"', src)):
        src = src.replace(f'id="{i}"', f'id="{i}-{tag}"').replace(f"url(#{i})", f"url(#{i}-{tag})")
    return re.sub(r'<svg width="\d+" height="\d+"', f'<svg width="{w}" height="{h}"', src, count=1)


def grid_png(files, size, times, pad=0):
    """One screenshot: rows = variants, cols = times, no chrome, for slicing."""
    cw, ch = size
    h = ['<!doctype html><meta charset=utf-8>',
         f'<style>body{{margin:0;background:{lib.ART_FIELD}}}',
         '.r{display:flex}svg{display:block}</style>']
    for v in files:
        h.append('<div class="r">')
        for t in times:
            h.append(f'<span data-t="{t}">{instance(v, f"{v.parent.name}-{t}", cw, ch)}</span>')
        h.append("</div>")
    h.append('<script>document.querySelectorAll("[data-t]").forEach(c=>{'
             'const t=parseFloat(c.dataset.t);'
             'c.querySelectorAll("svg").forEach(s=>{s.pauseAnimations();s.setCurrentTime(t);});});</script>')
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": cw * len(times), "height": ch * len(files)},
                        device_scale_factor=D)
        pg.set_content("".join(h), wait_until="load")
        pg.wait_for_timeout(700)
        shot = pg.screenshot(full_page=True)
        b.close()
    return Image.open(io.BytesIO(shot))


def label(img, rows, cols, cw, ch, title):
    """Paste the grid into a labelled canvas."""
    L, T = 150, 40
    out = Image.new("RGB", (L + cw * len(cols), T + ch * len(rows) + 24), (250, 247, 240))
    dr = ImageDraw.Draw(out)
    dr.text((10, 12), title, fill=(42, 37, 32))
    for j, c in enumerate(cols):
        dr.text((L + j * cw + 6, T - 14), f"t = {c} s", fill=(115, 106, 96))
    out.paste(img.resize((cw * len(cols), ch * len(rows)), Image.LANCZOS), (L, T))
    for i, r in enumerate(rows):
        dr.text((10, T + i * ch + ch // 2 - 4), r, fill=(20, 60, 107))
    return out


def main():
    files = [WORK / "variants" / v / "water-clock.svg" for v in ORDER]
    ev = WORK / "evidence"
    ev.mkdir(exist_ok=True)
    cw, ch = lib.CARD_ART

    # --- near: the 122 px card, unblurred ---------------------------------
    near = grid_png(files, (cw, ch), TIMES)
    label(near, ORDER, TIMES, cw * 2, ch * 2, "Water clock variants at 122 px (shown 2x) - what the front row sees"
          ).save(ev / "variants-near.png")

    # --- far: same pixels, venue blur + 10% flare -------------------------
    w, d = next((w, d) for lbl, w, d in lib.VENUES if lbl == lib.DESIGN_VENUE)
    sigma = (1.0 / lib.arcmin_per_csspx(w, d)) / 2.355 * D
    lin = barroom.gauss(barroom.to_linear(near), sigma) + 0.10
    far = barroom.to_srgb(lin)
    label(far, ORDER, TIMES, cw * 2, ch * 2,
          f"The same, at {lib.DESIGN_VENUE} with 10% ambient flare - what the back of the bar gets"
          ).save(ev / "variants-backrow.png")
    print(ev / "variants-near.png")
    print(ev / "variants-backrow.png")


if __name__ == "__main__":
    main()
