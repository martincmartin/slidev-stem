"""Colour arithmetic for the opacity scripts: a frozen copy of the formulas in
stem/tools/lib.py (2026-09-24), so these results reproduce after lib.py changes.
"""
PANEL = "#F2EEE4"          # Ledger --palette-panel: the art sits on the card panel


def _lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * _lin(r) + 0.7152 * _lin(g) + 0.0722 * _lin(b)


def contrast(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def blend(fg, bg, alpha):
    """fg drawn at alpha over bg, composited in 8-bit sRGB as the browser does."""
    f, b = fg.lstrip("#"), bg.lstrip("#")
    return "#" + "".join(
        f"{round(int(f[i:i+2], 16) * alpha + int(b[i:i+2], 16) * (1 - alpha)):02X}" for i in (0, 2, 4))


def on_panel(colour, alpha, panel=PANEL):
    return contrast(blend(colour, panel, alpha), panel)


def alpha_for(colour, target, panel=PANEL):
    """The least alpha at which colour on panel reaches `target` contrast (1.0 if never)."""
    if on_panel(colour, 1.0, panel) < target:
        return 1.0
    lo, hi = 0.0, 1.0
    for _ in range(40):
        mid = (lo + hi) / 2
        lo, hi = (mid, hi) if on_panel(colour, mid, panel) < target else (lo, mid)
    return hi
