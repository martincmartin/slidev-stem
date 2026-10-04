# Whole-path leader and original-path comparison

Slide 2 uses a dynamic-programming path for the rest-shape leader.
Slide 3 is the requested comparison copy, with the original full ghost and fixed material-point leader.
The original leader's initial contact and all sampled curl paths match the first saved version exactly.
Its stroke uses the current measured width.

The optimized ghost keeps its full 3D outline before the curl.
That depth cue is visually useful for a straight board.
At the actual curl start, it becomes a single open path along the board's front edge.
The shallow view makes parallel thick dashed edges too cluttered during curling and on the final spiral.
The single edge preserves the rest reference without that clutter.
It becomes the spring ribbon's bottom edge.

Before the curl, slide 2 retains the short leader near the right tip.
At the outline switch, the endpoint moves to the single edge's closest point to the elbow.
That intentional jump is outside the optimized curl path.
Afterward, the endpoint stays on the single ghost edge while it curls.
The ghost and leader remain stationary during the crossfade and resumed spring motion.

The detailed plan and choices are in [PLAN.md](PLAN.md).
The requests and comparison choice are in [instructions.md](instructions.md).
The current operating rules are in [watch.md](../../docs/watch.md).
No commit was made.

## Path objective and solution

The static cost per second is $U(q)=\alpha\lVert q-e\rVert+\beta B(q)$.
For consecutive contacts $q_0,q_1$ and physical interval $\Delta t$, use

$$
\mathbf v=\frac{q_1-q_0}{\Delta t},\qquad
\mathbf m=\frac{q_0+q_1}{2}-e,\qquad
\hat{\mathbf u}=\frac{\mathbf m}{\lVert\mathbf m\rVert},
$$

$$
C(q_0,q_1)=\Delta t\left[
\frac{U(q_0)+U(q_1)}{2}
+\gamma(v_x\hat u_y-v_y\hat u_x)^2
\right].
$$

The static terms use trapezoidal quadrature. The velocity term uses the midpoint segment direction.
Moving along the leader contributes zero velocity cost.
Undefined segment directions have infinite cost and cannot be selected.

The candidate directions cover the entire curl and include the straight leader direction.
Each ray retains the closest refined intersection with the front edge.
The intersection is evaluated on a cubic curve, not on a polygon approximation.
Each pose also includes the minimum of its static cost on the edge.
The initial contact is fixed at the closest point to the elbow.
The final contact is free; there is no terminal penalty.

Dynamic programming retains the minimum accumulated cost at every candidate.
Backtracking gives the globally cheapest complete path on that sampled graph.
It cannot get trapped in a local minimum of the graph objective.
This is an approximation to the continuous variational problem, not a proof of its continuous global minimum.

## Sampling and weights

Measured on this machine with the saved generator and geometry:

| Angular directions | Path cost | Sampling time (s) | Solve time (s) | Transitions |
| --- | ---: | ---: | ---: | ---: |
| 64 | 583.673 | 0.564 | 0.005 | 71,259 |
| 128 | 582.891 | 0.757 | 0.012 | 269,861 |
| 256 | 580.749 | 1.137 | 0.037 | 1,045,989 |
| 512 | 579.590 | 1.913 | 0.115 | 4,127,362 |
| 1024 | 579.290 | 3.483 | 0.433 | 16,384,927 |

These runs use $\alpha=1$, $\beta=60$, and $\gamma=0.003$ in the saved `LeaderDesign`.
The selected sampling is 512 directions.
Doubling it reduces total cost by 0.052%, with a 0.945 px RMS change in contact position.
The largest position change is 3.148 px.
The coarser 256-direction path differs by 2.800 px RMS from the selected path.
These are convergence measurements for this geometry, not universal error bounds.

The velocity coefficient needs different units from the former displacement coefficient.
At 128 directions, the weight trials give:

| $\gamma$ | Mean final-segment length (px) | Mean bend (degrees) | Perpendicular speed RMS (px/s) | Largest endpoint step (px) |
| --- | ---: | ---: | ---: | ---: |
| 0.001 | 217.92 | 5.78 | 80.34 | 35.72 |
| 0.003 | 221.29 | 5.06 | 69.99 | 38.29 |
| 0.01 | 232.00 | 3.64 | 55.52 | 58.31 |
| 0.03 | 242.70 | 0.93 | 51.06 | 85.15 |

Select 0.003. It reduces perpendicular speed without the larger radial steps of the higher-weight trials.
The objective does not penalize radial speed or acceleration.
Thus, it does not guarantee constant total speed or continuous acceleration.
The original material-point path remains on slide 3 for visual comparison.

## Evidence

- `inputs/`: the prior source, drawing, docs, theme, derivation, and first leader SVG.
- `result/`: the final source, docs, deck source, and both generated drawings.
- `deck/`: the built offline deck, including its fonts.
- `evidence/path-comparison.json`: full trajectories, scores, and timings from `compare_paths.py`.
- `evidence/geometry-checks.json`: original-path equality, unchanged moving geometry, the single edge, and distinct SVG IDs.
- `evidence/browser-checks.json`: both slides in Chromium and Firefox, with outside requests blocked.
- `evidence/curl-contact-audit.json`: contact distances at quarter-frame intervals throughout each curl.
- `evidence/barroom-final.json`: isolated leaders, ghosts, labels, and both full drawings at the design venue.
- `evidence/motion.json`: full-drawing animation measurements.
- `evidence/validation.txt`: the canonical talk validation result.
- `evidence/*.png`: both versions during board motion, curling, spring motion, and slide exit.

Both slides pass the Chromium and Firefox lifecycle checks, with zero page errors and outside requests.
The phase switch, stationary ghosts, crossfade, resume, reverse clicks, direct entry, and rapid clicks pass.
The original comparison leader matches the archived first path byte for byte.
The moving board and pool paths remain unchanged.
The single ghost edge matches the front edge used by the board geometry.
Mounted SVGs have distinct IDs.

At `TV 55in @7m`, the optimized board reference holds 3.35:1 and the single spring reference holds 3.35:1.
The comparison references hold 3.51:1 and 3.47:1.
The isolated optimized leaders hold 3.58:1 and 3.23:1; the comparison leaders hold 3.73:1 and 3.71:1.
All clear the 3:1 gate. These measurements exclude the live subject.

## Run the saved checks

From `watches/`:

```bash
uv run tasks/2026-10-04-leader-path-comparison/compare_paths.py
uv run tasks/2026-10-04-leader-path-comparison/check_geometry.py
uv run tasks/2026-10-04-leader-path-comparison/check_rest_shape.py
uv run tasks/2026-10-04-leader-path-comparison/audit_curl.py
uv run tasks/2026-10-04-leader-path-comparison/measure_leader.py
uv run tasks/2026-10-04-leader-path-comparison/result/art/test_leader_path.py
uv run tasks/2026-10-04-leader-path-comparison/regenerate.py --out /tmp/leader-path.svg
uv run tasks/2026-10-04-leader-path-comparison/regenerate.py --original --out /tmp/original-leader.svg
```

The Python tools import the saved generator. The browser checks serve the saved deck.
The regeneration commands verify byte equality with each saved SVG before writing the requested file.
