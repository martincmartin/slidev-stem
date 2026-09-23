#!/usr/bin/env python3
"""What the back row of a lit room actually sees, measured rather than imagined.

    .venv/bin/python3 tasks/2026-09-20-animation-style/tools/barroom.py

Needs playwright, Pillow and numpy.

Two independent things stand between the laptop a style was designed on and the
back row of an unknown venue. This applies both to the real rendered pixels, scores
what is left, and writes the pictures so eye and arithmetic can disagree out loud.

1. ACUITY. One arcminute is a good eye's resolution limit. Turn the back row's
   distance and the screen's real width into CSS px per arcmin, then blur by a
   Gaussian of that width (FWHM = 1 arcmin, so sigma = FWHM/2.355).

2. AMBIENT FLARE. Room light lands on the screen and ADDS to every pixel:
   lin' = lin + F, in LINEAR light. The theme-colours archive's sim.py used a CSS
   white overlay, which computes (1-a)*img + a*white -- that scales the image down
   as well as adding light, so it overstates the damage, and that archive tells you
   to trust its arithmetic over its pictures. This does the real thing, so these
   pictures are evidence.

BOTH ARE DONE IN LINEAR LIGHT, which matters twice over. Blurring 8-bit sRGB (what
PIL does by default, and what most "simulate distance" hacks do) is simply the
wrong average and shifts edge luminance. And in linear light blur and flare COMMUTE
-- blur(x + F) = blur(x) + F for a normalised kernel -- so the order here is not a
hidden assumption.

THE FLARE CEILING. Because contrast is a ratio, additive flare caps the best case
any content can reach: a perfect black-and-white image tops out at (1.05)/(F+0.05).

    F = 0.05 -> 10.5:1     F = 0.20 -> 4.2:1
    F = 0.10 ->  7.0:1     F = 0.29 -> 3.0:1   <- the 3:1 floor becomes unreachable
    F = 0.15 ->  5.3:1     F = 0.35 -> 2.6:1      FOR ANY DESIGN WHATSOEVER

So "how does this style do at 35% flare" is not a design question, it is a question
about a room nobody can present in. The useful number is the other way round:

    Fmax = the flare at which this style's typical mark falls THROUGH 3:1,
           with the venue's acuity blur already applied.

That is a property of the drawing, in units of how much room light it can take.

SCORES, all on the 122 px render the deck actually shows:
    ink%   share of the card carrying a mark at all -- the density of the style
    hold   MEDIAN WCAG contrast of those marks vs the field, after blurring:
           how much of the drawing survives
    p90    the same at the 90th percentile: how strong its strongest marks still
           are, i.e. whether ANYTHING survives. Thin-line styles score far apart on
           these two, and the gap is the point -- see hold() for why
    Fmax   flare tolerance, as above; 0.30 is the physical maximum

VENUES are guesses, because the real one was never learned. That is exactly the
point: design for the row you cannot rule out. Edit VENUES and re-run.
"""
import math, pathlib, sys
import numpy as np
from PIL import Image
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from contact import instance, ITEMS
from playwright.sync_api import sync_playwright

OUT = pathlib.Path(__file__).resolve().parents[1] / "out"
ROOT = pathlib.Path(__file__).resolve().parents[3]
# The art these tools read. Until 2026-09-21 this was the project root's
# public/timekeepers/, which held all sixteen sets because the live deck showed all
# sixteen. The live deck now ships one set, so the sets live in this archive's own
# deck/ and the tools read them from there -- which is also what makes the archive
# runnable after the live deck has moved on. See README S14.
ART = pathlib.Path(__file__).resolve().parents[1] / "deck/public/timekeepers"

sys.path.insert(0, str(ROOT / "tasks/2026-09-18-theme-colors/tools"))
import lib

DSF = 2            # device scale factor we render at
DECK_W = 980       # the Slidev canvas, in CSS px
CARD_W, CARD_H = 122, 97
T = 4.0
PANEL = "#F2EEE4"  # the Ledger card the light sets sit on
FLOOR = 3.0        # WCAG non-text contrast floor

# label, screen width (m), back row (m)
VENUES = [
    ("laptop",       0.31, 0.55),   # where every one of these calls actually got made
    ("TV 55in @5m",  1.22, 5.00),   # a bar back room with a big telly
    ("TV 55in @7m",  1.22, 7.00),   # ... and the table by the door
    ("proj 2m @6m",  2.00, 6.00),   # a real projector, if the venue has one
]

SETS = [("1 Line", "t13"), ("2 Line, weighted", "line-weighted"),
        ("3 Engraved", "engraved"), ("4 Patent", "patent"),
        ("5 Patent, weighted", "patent-weighted"),
        ("6 Guide on paper", "guide-ledger"), ("7 Vector on paper", "vector-ledger"),
        ("8 Bold", "bold"), ("9 Linocut", "linocut"), ("10 Riso", "riso"),
        ("11 Pop Art", "popart"), ("12 Ciechanowski", "ciechanowski"),
        ("13 Shaded", "shaded"), ("14 Photoreal", "photoreal"),
        ("15 Guide", "guide"), ("16 Vector display", "vector")]

_LIN = np.array([lib.srgb_to_lin(v) for v in range(256)], dtype=np.float64)


def arcmin_per_csspx(screen_w_m, dist_m):
    mm = screen_w_m * 1000 / DECK_W
    return math.degrees(math.atan(mm / (dist_m * 1000))) * 60


def to_linear(img):
    return _LIN[np.asarray(img.convert("RGB"), dtype=np.uint8)]


def to_srgb(lin):
    lin = np.clip(lin, 0.0, 1.0)
    s = np.where(lin <= 0.0031308, 12.92 * lin, 1.055 * lin ** (1 / 2.4) - 0.055)
    return Image.fromarray(np.round(s * 255).astype(np.uint8), mode="RGB")


def gauss(lin, sigma):
    """Separable Gaussian on a linear-light HxWx3 array, edges held (reflect)."""
    if sigma < 0.05:
        return lin
    r = max(1, int(math.ceil(3 * sigma)))
    x = np.arange(-r, r + 1, dtype=np.float64)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2))
    k /= k.sum()
    out = lin
    for axis in (0, 1):
        pad = [(0, 0)] * 3
        pad[axis] = (r, r)
        p = np.pad(out, pad, mode="reflect")
        acc = np.zeros_like(out)
        for i, w in enumerate(k):
            sl = [slice(None)] * 3
            sl[axis] = slice(i, i + out.shape[axis])
            acc += w * p[tuple(sl)]
        out = acc
    return out


def luminance(lin):
    return 0.2126 * lin[..., 0] + 0.7152 * lin[..., 1] + 0.0722 * lin[..., 2]


def wcag(a, b):
    hi, lo = np.maximum(a, b), np.minimum(a, b)
    return (hi + 0.05) / (lo + 0.05)


def field_of(L):
    """The card's background luminance: modal value over a 256-bin histogram."""
    h, e = np.histogram(L, bins=256, range=(float(L.min()), float(L.max()) + 1e-9))
    i = int(h.argmax())
    return float((e[i] + e[i + 1]) / 2)


def prep(img, sigma):
    """-> (ink mask from the clean art, blurred linear image). Blur is venue-only."""
    lin = to_linear(img)
    Lc = luminance(lin)
    ink = wcag(Lc, field_of(Lc)) >= 1.5
    return ink, gauss(lin, sigma)


def hold(ink, blurred, flare, pct=50):
    """Contrast of the drawn marks vs the field, at the given percentile.

    pct=50 (median) is the TYPICAL mark, and it is deliberately edge-weighted: a
    1.5 CSS px line is mostly antialiased edge, so half its pixels really do carry
    less than its nominal colour. That is a fair charge against thin-line styles,
    but on its own it reads as a death sentence for work the eye still resolves
    fine -- so pct=90, the CORE of the heaviest marks, is reported beside it.
    Median says how much of the drawing survives; p90 says whether anything does.
    """
    # NOT clipped at white. Reflected ambient adds to the emitted image, so the
    # screen's white really does rise above its own nominal white: on a projector
    # the wall shows (image + ambient) and the eye adapts to that new maximum.
    # Clipping here would invent a penalty for any style with large bright areas,
    # which is every light one. lib.contrast() in the theme archive agrees.
    # Clipping happens only in to_srgb(), where a PNG leaves no choice.
    L = luminance(blurred + flare)
    if ink.sum() < 20:
        return 0.0
    return float(np.percentile(wcag(L[ink], field_of(L)), pct))


def fmax(ink, blurred):
    """Flare at which the typical mark drops through 3:1. 0.29 is the hard ceiling."""
    if hold(ink, blurred, 0.0) < FLOOR:
        return 0.0
    lo, hi = 0.0, 0.30
    for _ in range(24):
        m = (lo + hi) / 2
        if hold(ink, blurred, m) >= FLOOR:
            lo = m
        else:
            hi = m
    return lo


def strokes(set_dir):
    """Stroke widths the set actually uses, in CSS px on a 122 px card."""
    import re, collections
    k = CARD_W / 240.0
    w = collections.Counter()
    for n in ITEMS:
        src = (ART / set_dir / f"{n}.svg").read_text()
        for m in re.finditer(r'stroke-width="([0-9.]+)"', src):
            w[round(float(m.group(1)) * k, 2)] += 1
    return (min(w), max(w, key=w.get)) if w else (0.0, 0.0)


def main():
    OUT.mkdir(exist_ok=True)
    h = ['<!doctype html><meta charset=utf-8>',
         f'<style>body{{margin:0;background:{PANEL};padding:0}}',
         'div{display:flex}svg{display:block}</style>']
    for _, d in SETS:
        h.append(f'<div data-t="{T}">')
        h += [instance(d, n, f"{d}-{n}", CARD_W, CARD_H) for n in ITEMS]
        h.append("</div>")
    h.append('<script>document.querySelectorAll("[data-t]").forEach(c=>{'
             'const t=parseFloat(c.dataset.t);'
             'c.querySelectorAll("svg").forEach(s=>{s.pauseAnimations();s.setCurrentTime(t);});});</script>')

    with sync_playwright() as pw:
        b = pw.chromium.launch()
        pg = b.new_page(viewport={"width": CARD_W * 4, "height": CARD_H * len(SETS)},
                        device_scale_factor=DSF)
        pg.set_content("".join(h), wait_until="load")
        pg.wait_for_timeout(600)
        pg.screenshot(path=str(OUT / "_barroom-raw.png"), full_page=True)
        b.close()

    raw = Image.open(OUT / "_barroom-raw.png")
    card = {(d, n): raw.crop((c * CARD_W * DSF, r * CARD_H * DSF,
                              (c + 1) * CARD_W * DSF, (r + 1) * CARD_H * DSF))
            for r, (_, d) in enumerate(SETS) for c, n in enumerate(ITEMS)}

    print(f"{'set':<18}{'stroke CSS px':>13} {'ink%':>6}", end="")
    for v, *_ in VENUES:
        print(f"{v:>26}", end="")
    print(f"\n{'':<18}{'min / modal':>13} {'':>6}", end="")
    for _ in VENUES:
        print(f"{'hold':>9}{'p90':>8}{'Fmax':>9}", end="")
    print()

    for label, d in SETS:
        lo, mo = strokes(d)
        inks = [prep(card[(d, n)], 0.0)[0] for n in ITEMS]
        print(f"{label:<18}{lo:>5.2f} /{mo:>6.2f} "
              f"{100 * sum(i.mean() for i in inks) / 4:>6.1f}", end="")
        for v, w, dist in VENUES:
            sigma = (1.0 / arcmin_per_csspx(w, dist)) / 2.355 * DSF
            hs, ps, fs = [], [], []
            for n in ITEMS:
                ink, bl = prep(card[(d, n)], sigma)
                hs.append(hold(ink, bl, 0.0))
                ps.append(hold(ink, bl, 0.0, 90))
                fs.append(fmax(ink, bl))
            print(f"{sum(hs)/4:>9.2f}{sum(ps)/4:>8.2f}{sum(fs)/4:>9.3f}", end="")
        print()

    print()
    for v, w, dist in VENUES:
        am = arcmin_per_csspx(w, dist)
        print(f"{v:<13} {w} m wide, back row {dist} m: {w*1000/DECK_W:.2f} mm/CSSpx, "
              f"{am:.2f} arcmin/CSSpx, thinnest resolvable mark {1.0/am:.2f} CSS px, "
              f"blur sigma {(1.0/am)/2.355:.2f} CSS px")
        lin = gauss(to_linear(raw), (1.0 / am) / 2.355 * DSF)
        to_srgb(lin).save(OUT / f"barroom-{v.replace(' ', '').replace('@','at')}-clean.png")
        to_srgb(lin + 0.10).save(OUT / f"barroom-{v.replace(' ', '').replace('@','at')}-flare10.png")
    print(f"\nhold = median contrast of the drawn marks after the venue's blur, no flare."
          f"\nFmax = flare it still holds {FLOOR:.0f}:1 at; {1.05/FLOOR - 0.05:.2f} is the "
          f"physical ceiling for any design.")


if __name__ == "__main__":
    main()
