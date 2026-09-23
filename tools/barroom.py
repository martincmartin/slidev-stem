#!/usr/bin/env python3
"""What the back row of a lit room actually sees, measured rather than imagined.

    .venv/bin/python3 tools/barroom.py                        # every talk's art
    .venv/bin/python3 tools/barroom.py new.svg                # one new drawing
    .venv/bin/python3 tools/barroom.py a.svg b.svg --save /tmp/

Needs playwright (+ `playwright install chromium`), Pillow and numpy.

This is the criterion that settles "can we use this?" when taste and arithmetic
disagree, and it is the one tool here that answers a question nothing else can.
Run it on the first day of a new drawing, not the last: every failure it finds is
cheap while the art is still being drawn and expensive afterwards.

TWO THINGS STAND BETWEEN YOUR LAPTOP AND THE BACK ROW, and this applies both to
the real rendered pixels.

1. ACUITY. One arcminute is a good eye's resolution limit. The venue's screen
   width and back-row distance give CSS px per arcmin; blur by a Gaussian of that
   width (FWHM = 1 arcmin, so sigma = FWHM/2.355).
2. AMBIENT FLARE. Room light lands on the screen and ADDS to every pixel:
   lin' = lin + F.

BOTH IN LINEAR LIGHT, which matters twice. Blurring 8-bit sRGB -- what PIL does by
default, and what most "simulate distance" hacks do -- is the wrong average and
shifts edge luminance. And in linear light the two COMMUTE, so the order is not a
hidden assumption. Flare is deliberately NOT clipped at white: reflected ambient
adds to the emitted image, the screen's white really does rise above its nominal
white, and the eye adapts to that new maximum. Clipping invents a penalty for any
design with large bright areas -- that is, every light one, including this deck's.

WHAT IT REPORTS, for each drawing at the size its file states (its width and
height attributes: the size a slide shows it at):

    ink%   share of the drawing's box carrying a mark at all: its density
    hold   MEDIAN contrast of those marks against the field, after the blur.
           Deliberately edge-weighted: a thin line really is mostly antialiased
           edge, so half its pixels carry less than its nominal colour
    p90     the same at the 90th percentile: whether the strongest marks survive.
           Thin styles score far apart on these two and the gap IS the finding
    Fmax   the ambient flare at which the typical mark falls through 3:1. A
           property of the drawing in units of room light. 0.30 is the physical
           ceiling for any design whatsoever, so an Fmax of 0.09 means roughly
           "fine in a dim room, gone under the lights"

READING THE NUMBER. `hold >= 3.0` at the design venue is the gate -- below it the
drawing costs attention and returns nothing. Above the gate, more headroom stops
deciding anything and taste takes over. watches/docs/measurements.md has the
timekeepers' numbers, for comparison. Read docs/legibility.md before assuming a
new drawing is fine.
"""
import re, sys, math, pathlib, argparse

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import lib
import numpy as np
from PIL import Image

DSF = 2                    # device scale factor we render at
_LIN = np.array([lib.srgb_to_lin(v) for v in range(256)], dtype=np.float64)


def to_linear(img):
    return _LIN[np.asarray(img.convert("RGB"), dtype=np.uint8)]


def to_srgb(l):
    l = np.clip(l, 0.0, 1.0)
    s = np.where(l <= 0.0031308, 12.92 * l, 1.055 * l ** (1 / 2.4) - 0.055)
    return Image.fromarray(np.round(s * 255).astype(np.uint8), mode="RGB")


def gauss(l, sigma):
    """Separable Gaussian on a linear-light HxWx3 array, edges held (reflect)."""
    if sigma < 0.05:
        return l
    r = max(1, int(math.ceil(3 * sigma)))
    x = np.arange(-r, r + 1, dtype=np.float64)
    k = np.exp(-(x ** 2) / (2 * sigma ** 2))
    k /= k.sum()
    out = l
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


def luminance(l):
    return 0.2126 * l[..., 0] + 0.7152 * l[..., 1] + 0.0722 * l[..., 2]


def wcag(a, b):
    return (np.maximum(a, b) + 0.05) / (np.minimum(a, b) + 0.05)


def field_of(L):
    """The card's background luminance: modal value over a 256-bin histogram."""
    h, e = np.histogram(L, bins=256, range=(float(L.min()), float(L.max()) + 1e-9))
    i = int(h.argmax())
    return float((e[i] + e[i + 1]) / 2)


def prep(img, sigma):
    """-> (ink mask from the CLEAN art, blurred linear image). Blur is venue-only."""
    l = to_linear(img)
    Lc = luminance(l)
    return wcag(Lc, field_of(Lc)) >= 1.5, gauss(l, sigma)


def hold(ink, blurred, flare, pct=50):
    L = luminance(blurred + flare)     # NOT clipped -- see the module docstring
    return 0.0 if ink.sum() < 20 else float(np.percentile(wcag(L[ink], field_of(L)), pct))


def fmax(ink, blurred, floor=lib.CONTRAST_FLOOR):
    if hold(ink, blurred, 0.0) < floor:
        return 0.0
    lo, hi = 0.0, 0.30
    for _ in range(24):
        m = (lo + hi) / 2
        lo, hi = (m, hi) if hold(ink, blurred, m) >= floor else (lo, m)
    return lo


def label_for(f, others=()):
    """A row label that stays unique when comparing variants of one subject.

    Comparing eight versions of `water-clock.svg` used to print "water-clock"
    eight times, which made the table useless for exactly the job it was most
    needed for. Fall back to the containing directory when the stem repeats.
    """
    stems = [o.stem for o in others]
    if others and stems.count(f.stem) > 1:
        return f"{f.parent.name}/{f.stem}"[:21]
    return f.stem[:21]


def sizes(files):
    """Each drawing's (width, height) in CSS px, from its file. Exits if one is missing."""
    out = [lib.shown_size(f.read_text())[:2] for f in files]
    for f, (w, h) in zip(files, out):
        if not (w and h):
            sys.exit(f"{lib.rel(f)}: no width/height -- the size a slide shows it at. "
                     f"Run tools/artcheck.py")
    return out


def render(files, t=4.0):
    """Screenshot every drawing at the size its file states, on the panel, with its
    animation pinned to time t. -> (whole screenshot, one crop per file)."""
    from playwright.sync_api import sync_playwright
    wh = sizes(files)
    h = ['<!doctype html><meta charset=utf-8>',
         f'<style>body{{margin:0;background:{lib.ART_FIELD};padding:0}}',
         'div{display:flex;align-items:flex-start}svg{display:block;flex:none}</style><div>']
    for i, f in enumerate(files):
        src = f.read_text()
        for j in set(re.findall(r'id="([^"]+)"', src)):
            src = src.replace(f'id="{j}"', f'id="{j}-{i}"').replace(f"url(#{j})", f"url(#{j}-{i})")
        h.append(src)
    h.append('</div><script>document.querySelectorAll("svg").forEach(s=>{'
             f's.pauseAnimations();s.setCurrentTime({t});}});</script>')
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={"width": math.ceil(sum(w for w, _ in wh)),
                                  "height": math.ceil(max(h for _, h in wh))},
                        device_scale_factor=DSF)
        pg.set_content("".join(h), wait_until="load")
        pg.wait_for_timeout(600)
        shot = pg.screenshot(full_page=True)
        b.close()
    import io
    raw = Image.open(io.BytesIO(shot))
    crops, x = [], 0.0
    for w, h in wh:
        crops.append(raw.crop((round(x * DSF), 0, round((x + w) * DSF), round(h * DSF))))
        x += w
    return raw, crops


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("paths", nargs="*", help="SVG files or directories (default: every talk's art)")
    ap.add_argument("--save", default=None, metavar="DIR",
                    help="also write what each venue looks like, clean and at 10%% flare")
    a = ap.parse_args()

    files = lib.art_files(a.paths or None)
    if not files:
        sys.exit("no SVGs found")
    raw, cards = render(files)

    print(f"{'drawing':<22}{'ink%':>6}", end="")
    for v, *_ in lib.VENUES:
        print(f"{v:>26}", end="")
    print(f"\n{'':<22}{'':>6}", end="")
    for _ in lib.VENUES:
        print(f"{'hold':>9}{'p90':>8}{'Fmax':>9}", end="")
    print()

    worst = {}
    for f, card in zip(files, cards):
        ink0, _ = prep(card, 0.0)
        print(f"{label_for(f, files):<22}{100 * ink0.mean():>6.1f}", end="")
        for v, w, d in lib.VENUES:
            sigma = (1.0 / lib.arcmin_per_csspx(w, d)) / 2.355 * DSF
            ink, bl = prep(card, sigma)
            hs, ps, fs = hold(ink, bl, 0.0), hold(ink, bl, 0.0, 90), fmax(ink, bl)
            flag = "!" if v == lib.DESIGN_VENUE and hs < lib.CONTRAST_FLOOR else " "
            print(f"{hs:>9.2f}{ps:>8.2f}{fs:>8.3f}{flag}", end="")
            if v == lib.DESIGN_VENUE:
                worst[label_for(f, files)] = (hs, ps, fs)
        print()

    print(f"\ngate: hold >= {lib.CONTRAST_FLOOR:.1f} at {lib.DESIGN_VENUE}"
          f"   (marked ! if it fails)")
    failing = {n: (h, p90) for n, (h, p90, _) in worst.items() if h < lib.CONTRAST_FLOOR}
    if failing:
        for n, (h, p90) in failing.items():
            print(f"\nBELOW THE GATE: {n}  hold {h:.2f}, p90 {p90:.2f}")
            if p90 >= 2 * lib.CONTRAST_FLOOR:
                print(f"  BUT ITS STRONG MARKS ARE FINE (p90 {p90:.2f}). `hold` is a median "
                      f"over every\n  non-background pixel, so a large deliberate WASH -- a "
                      f"low-opacity fill -- drags it\n  down without anything being wrong. "
                      f"What this is really saying is that at the\n  back row the drawing "
                      f"reduces to its outline. Check that the outline alone still\n  reads, "
                      f"and run `python3 tools/artcheck.py` to see which fills are the washes.")
            else:
                print(f"  Its strong marks fail too (p90 {p90:.2f}), so this is a real "
                      f"legibility failure.\n  Read docs/legibility.md before redrawing: a "
                      f"drawing that fails on stroke WEIGHT is\n  one remap from fixed, and "
                      f"one that fails on PALETTE cannot be fixed with ink.")
    else:
        print("all clear the gate. Above it, headroom stops deciding and taste takes over.")
    print(f"\nRead `hold` with `p90`, never alone. Fmax is room light tolerated; 0.30 is "
          f"the\nceiling for any design. watches/docs/measurements.md has the timekeepers' numbers.")

    if a.save:
        out = pathlib.Path(a.save)
        out.mkdir(parents=True, exist_ok=True)
        for v, w, d in lib.VENUES:
            am = lib.arcmin_per_csspx(w, d)
            l = gauss(to_linear(raw), (1.0 / am) / 2.355 * DSF)
            tag = v.replace(" ", "").replace("@", "at")
            to_srgb(l).save(out / f"barroom-{tag}-clean.png")
            to_srgb(l + 0.10).save(out / f"barroom-{tag}-flare10.png")
        print(f"\nwrote {2 * len(lib.VENUES)} images to {out}")


if __name__ == "__main__":
    main()
