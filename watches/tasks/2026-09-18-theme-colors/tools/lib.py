"""Colour math + theme extraction, rebuilt after the scratchpad was cleared.
slides.md is now the source of truth for the palettes."""
import pathlib as _pl
_HERE = _pl.Path(__file__).resolve().parent
_DECK = _HERE.parent / "deck"
_OUT  = _HERE.parent / "out"
_OUT.mkdir(exist_ok=True)
import re, pathlib

SLIDES = pathlib.Path(str(_DECK / "slides.md"))


def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * srgb_to_lin(r) + 0.7152 * srgb_to_lin(g) + 0.0722 * srgb_to_lin(b)


def contrast(a, b, flare=0.0):
    la, lb = luminance(a) + flare, luminance(b) + flare
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def lightness_ratio(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def mix(a, b, t):
    ha, hb = a.lstrip("#"), b.lstrip("#")
    out = [round(int(ha[i:i+2], 16) + (int(hb[i:i+2], 16) - int(ha[i:i+2], 16)) * t)
           for i in (0, 2, 4)]
    return "#{:02X}{:02X}{:02X}".format(*out)


# ---- colour-vision-deficiency simulation (Vienot, Brettel & Mollon 1999)
def _lin(h):
    h = h.lstrip("#")
    return [srgb_to_lin(int(h[i:i + 2], 16)) for i in (0, 2, 4)]


def simulate(h, kind):
    r, g, b = _lin(h)
    l = 17.8824 * r + 43.5161 * g + 4.11935 * b
    m = 3.45565 * r + 27.1554 * g + 3.86714 * b
    s = 0.0299566 * r + 0.184309 * g + 1.46709 * b
    if kind == "deuter":
        m = 0.494207 * l + 1.24827 * s
    elif kind == "protan":
        l = 2.02344 * m - 2.52581 * s
    out = (0.080944 * l - 0.130504 * m + 0.116721 * s,
           -0.0102485 * l + 0.0540194 * m - 0.113615 * s,
           -0.000365294 * l - 0.00412163 * m + 0.693513 * s)
    return [max(0.0, min(1.0, c)) for c in out]


def _lab(rgb):
    r, g, b = rgb
    x, y, z = (0.4124*r + 0.3576*g + 0.1805*b,
               0.2126*r + 0.7152*g + 0.0722*b,
               0.0193*r + 0.1192*g + 0.9505*b)
    f = lambda t: t ** (1/3) if t > 216/24389 else (841/108) * t + 4/29
    fx, fy, fz = f(x/0.95047), f(y/1.0), f(z/1.08883)
    return (116*fy - 16, 500*(fx - fy), 200*(fy - fz))


def de76(c1, c2, kind="normal"):
    a, b = _lab(simulate(c1, kind)), _lab(simulate(c2, kind))
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def cvd(a, b):
    return min(de76(a, b, k) for k in ("deuter", "protan"))


def load_themes():
    """Parse the per-slide style blocks out of slides.md."""
    text = SLIDES.read_text()
    blocks = re.split(r"\n---\nlayout: full\n", text)[1:]
    out = []
    for i, blk in enumerate(blocks, start=2):
        key = re.search(r"class: tk-slide (tk-t\d+)", blk).group(1)
        name = re.search(r'<div class="tk-swatch">\d+ &mdash; (.+?)</div>', blk).group(1)
        blurb = re.search(r"/\* ---- theme \d+: .+? - (.+?) ---- \*/", blk)
        g = lambda v: re.search(rf"--tk-{v}: (#[0-9A-Fa-f]{{6}}|rgba\([^)]*\));", blk).group(1)
        out.append(dict(
            slide=i, key=key[3:], name=name,
            blurb=blurb.group(1) if blurb else "",
            bg=re.search(r"\n  background: (#[0-9A-Fa-f]{6});", blk).group(1),
            ink=g("ink"), muted=g("muted"), accent=g("accent"),
            warn=g("warn"), panel=g("panel"), border=g("border"),
        ))
    return out


if __name__ == "__main__":
    ts = load_themes()
    print(f"{len(ts)} themes parsed from slides.md")
    for t in ts:
        print(f"  {t['slide']:>3} {t['name']:<24} bg {t['bg']}  acc {t['accent']}  2nd {t['warn']}")
