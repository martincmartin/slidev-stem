#!/usr/bin/env python3
"""Two candidate ways to turn the drawings' 11 alpha values into 4 opacity
roles, and what each does to every mark on the Ledger panel.

  Q2: each role is one alpha, the same for every colour.
  Q3: each role is a contrast on the panel; the alpha is computed per colour.

The role of each mark is a first guess for discussion (the drip fill in
particular), not a decision. Q3's alpha is rounded up to 0.01, so the
target holds."""
import math
from colour import on_panel, alpha_for

LINE, FRAME, DETAIL = "#143C6B", "#736A60", "#2A2520"
MARKS = [  # mark, colour, alpha now, role
    ("sundial plate fill",     LINE,   0.07, "wash"),
    ("candle wax fill",        LINE,   0.08, "wash"),
    ("sundial wall fill",      FRAME,  0.18, "wash"),
    ("candle hour bands",      LINE,   0.55, "faint"),
    ("sundial inner ring",     LINE,   0.45, "faint"),
    ("sundial, water ticks",   DETAIL, 0.50, "faint"),
    ("candle drip fill",       LINE,   0.35, "substance"),
    ("water body",             LINE,   0.60, "substance"),
    ("water surface",          LINE,   0.78, "dense"),
    ("inner flame",            DETAIL, 0.70, "dense"),
    ("hourglass sand",         LINE,   0.85, "dense"),
]
Q2 = {"wash": 0.08, "faint": 0.50, "substance": 0.60, "dense": 0.85}   # alpha
# Q3's targets: "faint" is the 3:1 floor. The others are the contrast of one
# anchor mark (wash: the candle wax at 0.08; substance: the water at 0.60; dense:
# the sand at 0.85), rounded DOWN to 0.01, so each anchor keeps its alpha exactly.
Q3 = {"wash": 1.14, "faint": 3.00, "substance": 3.37, "dense": 6.44}   # contrast on the panel

print(f"{'mark':22} {'role':10} {'now':>12}   {'Q2 fixed alpha':>14}   {'Q3 contrast target':>18}")
changed = {"Q2": 0, "Q3": 0}
for name, colour, alpha, role in MARKS:
    q3 = math.ceil(alpha_for(colour, Q3[role]) * 100 - 1e-9) / 100   # round UP, so the target holds
    changed["Q2"] += Q2[role] != alpha
    changed["Q3"] += q3 != alpha
    print(f"{name:22} {role:10} {alpha:4.2f} {on_panel(colour, alpha):5.2f}:1   "
          f"{Q2[role]:4.2f} {on_panel(colour, Q2[role]):5.2f}:1     {q3:4.2f} {on_panel(colour, q3):5.2f}:1")
print(f"\nQ2 roles (alpha): {Q2}\nQ3 roles (contrast on the panel): {Q3}")
print(f"marks whose alpha changes: Q2 {changed['Q2']} of {len(MARKS)}, Q3 {changed['Q3']} of {len(MARKS)}")
