#!/usr/bin/env python3
"""Does the ANIMATION survive the room, not just the drawing?

    .venv/bin/python3 tools/motion.py                       # the deck's art
    .venv/bin/python3 tools/motion.py new.svg               # one new drawing
    .venv/bin/python3 tools/motion.py new.svg --sep 3.0     # pick the pairing yourself

Needs playwright, Pillow and numpy. Reuses `lib.py` for the venue model and
`barroom.py` for the blur, flare and linear-light handling, so its numbers are
commensurable with barroom's.

WHY THIS EXISTS. `barroom.py` measures a single frame: how much of the drawing
survives the back row. It is structurally blind to a drawing that measures fine and
animates entirely in marks that do not -- which is not hypothetical. The water clock
shipped that way: outline `p90 7.71`, and a level change whose peak contrast was
2.34:1 with NOT ONE PIXEL of the card crossing the 3:1 floor between its two states.
A still-frame metric cannot see that, and neither could anyone on a laptop.

WHAT IT MEASURES. Render at two animation times, apply the venue's acuity blur and
ambient flare in linear light, and compare the two frames per pixel:

    dPeak   the largest WCAG contrast between a pixel's two states
    dP99    the same at the 99th percentile, so one stray pixel cannot carry it
    bands   CSS px^2 whose two states differ by at least 1.2 / 1.5 / 2.0 / 3.0 : 1

READ IT AS: dPeak and dP99 say how strongly the moving region changes; the bands say
how much of the card changes by at least that much. **A drawing whose motion lives in
a wash has area in the 1.2 band and nothing in the 3.0 band** -- the level moves, but
only just. That signature is the thing to look for.

CHOOSING THE TIMES, which is the whole trick. A drawing usually has one long
animation you care about and several short ones you do not (a flicker, a drip, a
dashed stream). Sampling pairs separated by HALF the longest duration puts the long
animation at opposite extremes; and when that separation is a whole number of a short
animation's periods, the short one lands at an IDENTICAL phase in both frames and
cancels exactly. This file computes the separation from the SVG's own `dur` values,
says which shorter animations cancel and which do not, and averages over four
offset pairs so one unlucky phase cannot decide the answer.

WHAT THE THRESHOLDS ARE NOT. 1.5:1 is borrowed from barroom's mark-detection cut so
the two tools agree on what counts as a visible difference. It is NOT a measured
psychophysical detection threshold for slow, large-area motion at 7 m -- that number
is not known here, and a moving edge is probably detectable somewhat below it. The
comparison between drawings is unaffected: everything is scored identically, so the
ORDER is trustworthy even where the absolute cut is a convention.
"""
import re, sys, pathlib, argparse
import numpy as np

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lib, barroom

BANDS = [1.2, 1.5, 2.0, 3.0]
N_PAIRS = 4


def durations(src):
    return sorted({float(d) for d in re.findall(r'dur="([0-9.]+)s"', src)})


def plan(f, sep=None):
    """-> (separation, [(t1,t2) x N_PAIRS], notes) from ONE drawing's own durations.

    Per file, not pooled: the four timekeepers run at 11 / 8 / 12 / 9 s, and a
    separation that cancels one drawing's flicker says nothing about another's.
    """
    durs = durations(f.read_text())
    notes = []
    if not durs:
        return None, [], ["no <animate dur> found: nothing to measure"]
    longest = max(durs)
    if sep is None:
        sep = longest / 2
        notes.append(f"longest animation {longest:g}s -> sampling {sep:g}s apart "
                     f"(opposite extremes of it)")
    else:
        notes.append(f"separation {sep:g}s given on the command line")
    for d in durs:
        if d == longest:
            continue
        k = sep / d
        if abs(k - round(k)) < 1e-6:
            notes.append(f"  {d:g}s animation cancels exactly ({k:.0f} whole periods), "
                         f"so it is excluded")
        else:
            notes.append(f"  {d:g}s animation does NOT cancel ({k:.2f} periods) "
                         f"and is included in this row's numbers")
    step = longest / (2 * N_PAIRS) if longest else 1.0
    return sep, [(i * step, i * step + sep) for i in range(N_PAIRS)], notes


def render_at(files, t):
    """barroom's harness, pinned to an arbitrary time."""
    import io
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
    return [raw.crop((i * cw * D, 0, (i + 1) * cw * D, ch * D)) for i in range(len(files))]


def delta(a, b, sigma, flare):
    La = barroom.luminance(barroom.gauss(barroom.to_linear(a), sigma) + flare)
    Lb = barroom.luminance(barroom.gauss(barroom.to_linear(b), sigma) + flare)
    return barroom.wcag(La, Lb)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("paths", nargs="*", help="SVG files or directories (default: the deck's art)")
    ap.add_argument("--sep", type=float, default=None,
                    help="seconds between the two sampled frames (default: half the longest dur)")
    ap.add_argument("--flare", type=float, default=0.0)
    ap.add_argument("--venue", default=lib.DESIGN_VENUE)
    a = ap.parse_args()

    files = lib.art_files(a.paths or None)
    if not files:
        sys.exit("no SVGs found")
    plans = {f: plan(f, a.sep) for f in files}
    if not any(pl[1] for pl in plans.values()):
        sys.exit("no <animate dur> found in any file: nothing to measure")

    # Render each needed time once for every file, then let each file use its own.
    all_times = sorted({t for _, pairs, _ in plans.values() for p in pairs for t in p})
    frames = {t: render_at(files, t) for t in all_times}
    w, d = next((w, d) for lbl, w, d in lib.VENUES if lbl == a.venue)
    sigma = (1.0 / lib.arcmin_per_csspx(w, d)) / 2.355 * barroom.DSF
    per_csspx = barroom.DSF ** 2

    print(f"MOTION at {a.venue}, flare {a.flare:.2f}\n")
    hdr = "".join(f"{'>=' + format(b, '.1f'):>9}" for b in BANDS)
    print(f"{'drawing':<22}{'dPeak':>8}{'dP99':>8}   area CSS px^2 changing by{hdr}")
    weak, footnotes = [], []
    for i, f in enumerate(files):
        sep, pairs, notes = plans[f]
        if not pairs:
            print(f"{barroom.label_for(f, files):<22}{'  (no animation)':>8}")
            continue
        footnotes.append((barroom.label_for(f, files), pairs, notes))
        peaks, p99s = [], []
        bands = {b: [] for b in BANDS}
        for t1, t2 in pairs:
            dd = delta(frames[t1][i], frames[t2][i], sigma, a.flare)
            peaks.append(float(dd.max()))
            p99s.append(float(np.percentile(dd, 99)))
            for b in BANDS:
                bands[b].append(float((dd >= b).sum()) / per_csspx)
        pk, p99 = np.mean(peaks), np.mean(p99s)
        ar = {b: np.mean(v) for b, v in bands.items()}
        cells = "".join(f"{ar[b]:>9.0f}" for b in BANDS)
        flag = " !" if ar[lib.CONTRAST_FLOOR] < 1 and ar[1.2] > 50 else ""
        print(f"{barroom.label_for(f):<22}{pk:>8.2f}{p99:>8.2f}{'':>26}{cells}{flag}")
        if flag:
            weak.append(barroom.label_for(f))

    print(f"\ncard is {lib.CARD_ART[0]}x{lib.CARD_ART[1]} = "
          f"{lib.CARD_ART[0]*lib.CARD_ART[1]} CSS px^2 in total.\n")
    for name, pairs, notes in footnotes:
        print(f"{name}: " + ", ".join(f"({t1:g},{t2:g})" for t1, t2 in pairs))
        for n in notes:
            print(f"    {n}")
    if weak:
        print(f"\nMOTION IN A WASH: {', '.join(weak)}")
        print("  These change over a wide area and nowhere by 3:1. The animation is\n"
              "  drawn in marks the back row cannot resolve -- see docs/legibility.md,\n"
              "  'put the motion in the marks that survive'.")
    else:
        print("no drawing animates only in marks below the floor.")


if __name__ == "__main__":
    main()
