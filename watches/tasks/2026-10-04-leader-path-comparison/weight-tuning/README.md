# Leader weight tuning

2026-10-04: [Selection and layering](../selection-and-layering/README.md) retains slide 2, removes the comparisons, and paints the ghost above the subject.
The snapshots below preserve the comparison versions.

The movement coefficient doubles. The length coefficient decreases by 25%.
The bend coefficient and the perpendicular-velocity definition stay unchanged.
The short pre-curl leader, viewer-facing ghost edge, and original comparison slide stay unchanged.
Slide 4 adds the stronger-weight comparison requested during tuning.
It uses length weight $0.25$ and movement weight $0.03$, with slide 2's single ghost edge.
Its perpendicular speed is 25.96 px/s RMS. Its largest endpoint step is 122.10 px.
All three slides have the same four-click sequence.

Read [PLAN.md](PLAN.md) for the options and ranking.
The request is in [instructions.md](instructions.md).
The current behavior is in [watch.md](../../../docs/watch.md).

## Measurements

The generator uses the same curl duration and angular sampling density as the input.
Values below describe the endpoint during the curl. They exclude the initial phase switch.
Costs from different weights are not directly comparable.

| Length weight | Movement weight | Mean length (px) | Perpendicular speed RMS (px/s) | Largest step (px) | Total travel (px) |
| ------------- | --------------- | ---------------: | -----------------------------: | ----------------: | ----------------: |
| 1             | 0.003           |           211.80 |                          48.97 |             33.88 |            493.18 |
| 0.9           | 0.004           |           213.95 |                          45.14 |             37.30 |            495.24 |
| 0.8           | 0.0045          |           215.99 |                          42.14 |             39.13 |            496.10 |
| 0.75          | 0.006           |           218.49 |                          38.77 |             42.39 |            501.87 |
| 0.5           | 0.01            |           228.02 |                          32.20 |             57.79 |            534.76 |
| 0.5           | 0.03            |           239.56 |                          27.61 |             89.65 |            575.19 |
| 0.25          | 0.03            |           251.11 |                          25.96 |            122.10 |            622.45 |
| 0.25          | 0.1             |           258.30 |                          25.38 |            155.25 |            653.48 |

Select $(0.75,0.006)$.
Perpendicular speed falls from 48.97 to 38.77 px/s, a 21% reduction.
Total travel rises from 493.18 to 501.87 px, a 1.8% increase.
The largest step rises from 33.88 to 42.39 px.
The stronger settings reduce sideways speed further but permit much larger radial steps.

The requested movement term measures $|\mathbf v\times\hat{\mathbf u}|^2$.
It has no penalty for endpoint motion along the leader.
Thus, greater movement weighting does not guarantee less total endpoint travel.

## Saved work and checks

- `inputs/`: the preceding generator, drawings, docs, component, deck source, and theme.
- `result/`: the selected generator, three drawings, docs, component, and deck source.
- `deck/`: the built offline deck.
- `evidence/weight-comparison.json`: weights, complete paths, metrics, and timings.
- `evidence/geometry-checks.json`: unchanged subject geometry, the ghost edge, and original leader equality.
- `evidence/browser-checks.json`: Chromium and Firefox lifecycle checks.
- `evidence/curl-contact-audit.json`: leader contact between stored curl frames in both browsers.
- `evidence/barroom.json`: isolated reference and leader contrast measurements.
- `evidence/validation.txt`: canonical talk validation.

All three variants pass the Chromium and Firefox lifecycle checks, with no page errors or outside requests.
The tuned and original leaders stay within 0.60 px of their ghosts between stored frames.
The stronger comparison reaches 1.06 px centreline error during interpolation.
That error stays below half the 4 px stroke width, so the painted leader still touches the ghost.
Every stored contact lies on the cubic edge.
All isolated leaders and references pass the design-venue contrast gate.
The initial short leaders and the original comparison SVG match their inputs.

No commit was made.

From `watches/`, run these saved checks:

```bash
uv run tasks/2026-10-04-leader-path-comparison/weight-tuning/compare_weights.py
uv run tasks/2026-10-04-leader-path-comparison/weight-tuning/check_geometry.py
uv run tasks/2026-10-04-leader-path-comparison/weight-tuning/check_rest_shape.py
uv run tasks/2026-10-04-leader-path-comparison/weight-tuning/audit_curl.py
uv run tasks/2026-10-04-leader-path-comparison/weight-tuning/regenerate.py --out /tmp/tuned-leader.svg
```

The tools import the saved generator. The browser checks serve the saved deck.
The regeneration command checks byte equality with the saved drawing.
