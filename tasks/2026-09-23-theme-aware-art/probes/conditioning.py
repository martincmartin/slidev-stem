#!/usr/bin/env python3
"""Can one colour matrix map the Ledger art colours to another palette's?

A 3x3 matrix is fixed by where it sends three independent colours. This prints
how well-conditioned that problem is for the three Ledger line colours, and
where the fourth colour (the knockout) lands in their basis.
"""
import numpy as np

def srgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255

M = np.column_stack([srgb(h) for h in ("#143C6B", "#736A60", "#2A2520")])
print("Ledger art colours as matrix columns (sRGB 0-1):\n", M.round(3))
print("condition number:", round(np.linalg.cond(M), 1))
print("max |entry| of inverse:", round(abs(np.linalg.inv(M)).max(), 1))
print("knockout #D3DCE3 in that basis:", np.linalg.solve(M, srgb("#D3DCE3")).round(2))
