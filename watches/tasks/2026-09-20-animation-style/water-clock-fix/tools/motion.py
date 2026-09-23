#!/usr/bin/env python3
"""Does the ANIMATION survive the room, not just the drawing?

    .venv/bin/python3 tasks/2026-09-20-animation-style/water-clock-fix/tools/motion.py \
        tasks/2026-09-20-animation-style/water-clock-fix/variants/*/water-clock.svg

Needs playwright, Pillow, numpy. Reuses the venue model, the blur and the linear-
light handling from the live `tools/lib.py` and `tools/barroom.py` -- this adds one
metric and borrows everything else, so its numbers are commensurable with theirs.

WHY THIS EXISTS. `barroom.py` measures a single frame: how much of the drawing
survives the back row. It cannot see that a drawing which measures acceptably is
animating entirely in marks that do not. The water clock is exactly that case: its
outline scores p90 7.71 and its eight-second level change is drawn in 1.37:1 and
1.80:1 washes, so from the back row the card is legible and appears static. A
still-frame metric is structurally blind to this.

WHAT IT MEASURES. Render the same drawing at two animation times, apply the venue's
acuity blur and ambient flare in linear light exactly as barroom does, then compare
the two frames PER PIXEL:

    dPeak   the largest WCAG contrast between a pixel's two states
    dP99    the same at the 99th percentile, so one stray pixel cannot carry it
    area    CSS px^2 whose two states differ by at least 1.5:1 -- the same
            threshold barroom uses to decide "is this a mark at all"
    %card   that area as a share of the 122x97 card

THE DRIP IS CANCELLED BY CONSTRUCTION, which is the one piece of experimental
design here worth keeping. The water clock has two animations: the level (8 s) and
the drip (1 s). Sampling any pair of times 4 s apart puts the drip at an IDENTICAL
phase in both frames (4 is a whole number of drip periods) while putting the level
at opposite extremes. So the pairs (0,4) (1,5) (2,6) (3,7) isolate the level change
and report nothing about the drip. Results are averaged over all four.

WHAT THE THRESHOLD IS AND IS NOT. 1.5:1 is borrowed from barroom's mark detection
so the two tools agree on what counts as a visible difference. It is NOT a measured
psychophysical detection threshold for slow, large-area motion at 7 m -- I do not
know that number, and a moving edge is probably detectable somewhat below it. That
uncertainty does not affect the comparison between variants, which is what this is
for: every variant is scored the same way, so the ORDER is trustworthy even if the
absolute cut is not. Treat `area` as "how much of the card visibly changes", and
compare variants, not the number against a standard.
"""
import sys, pathlib, argparse
import numpy as np

HERE = pathlib.Path(__file__).resolve()
ROOT = HERE.parents[4]                       # .../watches
sys.path.insert(0, str(ROOT / "tools"))      # the LIVE framework, read-only
import lib, barroom

DRIP_CANCELLING_PAIRS = [(0.0, 4.0), (1.0, 5.0), (2.0, 6.0), (3.0, 7.0)]
DELTA_BANDS = [1.2, 1.5, 2.0, 3.0]   # report the whole distribution, not one cut


def frames(files, times):
    """-> {t: [card image per file]} at card size on the panel."""
    out = {}
    for t in times:
        _, cards = render_at(files, t)
        out[t] = cards
    return out


def render_at(files, t):
    """barroom.render(), but pinned to an arbitrary time instead of t=4."""
    import re, io
    from playwright.sync_api import sync_playwright
    from PIL import Image
    cw, ch = lib.CARD_ART
    h = ['<!doctype html><meta charset=utf-8>',
         f'<style>body{{margin:0;background:{lib.ART_FIELD};padding:0}}',
         'div{display:flex}svg{display:block}</style><div>']
    for i, f in enumerate(files):
        src = f.read_text()
        for j in set(re.findall(r'id="([^"]+)"', src)):
            src = src.replace(f'id="{j}"', f'id="{j}-{i}"').replace(f"url(#{j})", f"url(#{j}-{i})")
        h.append(re.sub(r'<svg width="\d+" height="\d+"', f'<svg width="{cw}" height="{ch}"', src, count=1))
    h.append('</div><script>document.querySelectorAll("svg").forEach(s=>{'
             f's.pauseAnimations();s.setCurrentTime({t});}});</script>')
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": cw * len(files), "height": ch},
                        device_scale_factor=barroom.DSF)
        pg.set_content("".join(h), wait_until="load")
        pg.wait_for_timeout(500)
        shot = pg.screenshot(full_page=True)
        b.close()
    raw = Image.open(io.BytesIO(shot))
    D = barroom.DSF
    return raw, [raw.crop((i * cw * D, 0, (i + 1) * cw * D, ch * D)) for i in range(len(files))]


def delta(a, b, sigma, flare):
    """Per-pixel WCAG contrast between the same pixel's two states."""
    La = barroom.luminance(barroom.gauss(barroom.to_linear(a), sigma) + flare)
    Lb = barroom.luminance(barroom.gauss(barroom.to_linear(b), sigma) + flare)
    return barroom.wcag(La, Lb)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--flare", type=float, default=0.0)
    ap.add_argument("--venue", default=lib.DESIGN_VENUE)
    a = ap.parse_args()

    files = lib.art_files(a.paths)
    times = sorted({t for pair in DRIP_CANCELLING_PAIRS for t in pair})
    fr = frames(files, times)

    w, d = next((w, d) for lbl, w, d in lib.VENUES if lbl == a.venue)
    sigma = (1.0 / lib.arcmin_per_csspx(w, d)) / 2.355 * barroom.DSF
    px_per_csspx = barroom.DSF ** 2

    print(f"MOTION at {a.venue}, flare {a.flare:.2f}   "
          f"(level animation only; the 1 s drip is phase-cancelled)\n")
    hdr = "".join(f"{'>= ' + format(b, '.1f'):>9}" for b in DELTA_BANDS)
    print(f"{'variant':<20}{'dPeak':>8}{'dP99':>8}  |  area CSS px^2 changing by{hdr}")
    rows = []
    for i, f in enumerate(files):
        name = f.parent.name if f.parent.name != "line-weighted" else "shipped"
        peaks, p99s = [], []
        bands = {b: [] for b in DELTA_BANDS}
        for t1, t2 in DRIP_CANCELLING_PAIRS:
            dd = delta(fr[t1][i], fr[t2][i], sigma, a.flare)
            peaks.append(float(dd.max()))
            p99s.append(float(np.percentile(dd, 99)))
            for b in DELTA_BANDS:
                bands[b].append(float((dd >= b).sum()) / px_per_csspx)
        pk, p99 = np.mean(peaks), np.mean(p99s)
        ar = {b: np.mean(v) for b, v in bands.items()}
        rows.append((name, pk, p99, ar))
        cells = "".join(f"{ar[b]:>9.0f}" for b in DELTA_BANDS)
        print(f"{name:<20}{pk:>8.2f}{p99:>8.2f}  |{' ' * 27}{cells}")

    print(f"\ncard is {lib.CARD_ART[0]}x{lib.CARD_ART[1]} = "
          f"{lib.CARD_ART[0]*lib.CARD_ART[1]} CSS px^2 in total.")
    print("dPeak/dP99 say how STRONGLY the moving region changes; the bands say how much\n"
          "of the card changes by at least that much. A drawing whose motion lives in a\n"
          "wash has area at 1.2 and nothing at 3.0 -- the level moves, but only just.")
    return rows


if __name__ == "__main__":
    main()
