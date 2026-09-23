#!/usr/bin/env python3
"""Compare two screenshots of the same slide, and say WHERE they differ.

    python pixel_diff.py before-2-5.png after-2-5.png
    python pixel_diff.py before-2-5.png after-2-5.png --box art1 180 230 400 520 --box ...

Needs numpy and Pillow (watches/.venv has them). A pixel "differs" if any channel
moves by more than --tol (default 8). With --box NAME x0 y0 x1 y1 (screenshot
pixels), it counts differing pixels per box and reports how many fall outside
every box. Use this for animated art: the SVG animations run on a clock, so two
screenshots differ inside the drawings even when nothing changed. A refactor is
safe when every differing pixel is inside an art box.

The four art boxes of the watches timekeepers slide at 1960x1104 are the
defaults: sundial, water clock, candle, hourglass.
"""
import argparse
import numpy as np
from PIL import Image

DEFAULT_BOXES = [("sundial-art", 180, 230, 400, 520), ("water-clock-art", 1080, 230, 1260, 520),
                 ("candle-art", 180, 570, 400, 860), ("hourglass-art", 1080, 570, 1260, 860)]

ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
ap.add_argument("a"); ap.add_argument("b")
ap.add_argument("--tol", type=int, default=8)
ap.add_argument("--box", nargs=5, action="append", metavar=("NAME", "X0", "Y0", "X1", "Y1"))
a = ap.parse_args()
boxes = [(n, *map(int, r)) for n, *r in a.box] if a.box else DEFAULT_BOXES
A = np.asarray(Image.open(a.a).convert("RGB")).astype(int)
B = np.asarray(Image.open(a.b).convert("RGB")).astype(int)
d = np.abs(A - B).max(axis=2) > a.tol
inside = 0
for name, x0, y0, x1, y1 in boxes:
    k = int(d[y0:y1, x0:x1].sum()); inside += k
    print(f"{name:18} {k}")
print(f"{'total':18} {int(d.sum())}   outside every box: {int(d.sum()) - inside}")
