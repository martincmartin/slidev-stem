# The water's two colors

The house palettes had one water role, `water`, a line color. The pool on the
Hairspring slide drew its water as `water` at 0.6, so the color that a viewer
sees as the water had no name. This task splits it into two roles, `water`
(the edge) and `water-wash` (the water itself), each a value in each palette.

- `instructions.md`: the request.
- `PLAN.md`: the problem, its root cause, the options, the choice and the
  measurements.
- `tools/`: the measurements. `water_gates.py` and `water_split.py` read the
  house palettes through `tools/lib.py`; run them against the house at commit
  `adeefe8`, the last one before this change (`PLAN.md`, "Run the tools").
  `pool_pixels.py` and `pool_crop.py` compare two diving-board SVGs in
  Chromium.
- `evidence/`: the tools' output (`*.txt`), the diving board before and after
  (`diving-board-before.svg`, `diving-board-after.svg`), and a magnified crop
  of the most changed edge pixels (`pool-crop.png`: before, then after).
