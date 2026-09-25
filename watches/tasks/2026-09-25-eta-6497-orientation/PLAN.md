# Orient the skeleton watch like an ETA 6497

The request (2026-09-25): turn the movement of `art/skeleton_watch.py` so it
looks more like an ETA 6497 caliber. That caliber has the mainspring barrel at
5 o'clock and the balance opposite it, at about 11 o'clock. An exact match is
not a goal: the simplified train explains a watch better.

Two steps:

1. Turn the whole movement by $+150°$ about the watch centre. The barrel moves
   from 12 o'clock to 5 o'clock.
2. Measure the layout's worst clearance, as the search scores it: the smallest
   of the tightest part gap, the tightest fork gap and the tightest ring gap.
   Then turn the third wheel anticlockwise (decrease `third_angle`) until it is
   that far from the barrel. The worst clearance must not get smaller.

## Step 1: what turns

Every angle in `Layout` is a screen angle, not an angle relative to the arbor
before it. So a rigid turn adds $150°$ to all five, `lever_angle` included.

The drawing has two more absolute angles:

- the escape wheel's tooth phase (6°): without the turn, its teeth move by
  $150 \bmod 24 = 6°$ against the pallets;
- the start of the mainspring spiral (150°).

Both get $+150°$. The rest (wheel tooth phases, the balance arms, the
hairspring stud, the fork) are computed from directions between arbors, so
they turn with the arbors. The case, strap, crown, chapter ring and hands do
not turn: they are not the movement.

`search_skeleton_watch_layout.py` gets the same turn: its coarse grid and its
allowed side for the balance, so it searches the same space, turned.

Check: the arbors turn by exactly $150°$, and every clearance stays the same,
within the sampling error of about half a pixel.

## Step 2: how far to turn the third wheel

Changing `third_angle` moves the third arbor round the centre arbor. The
fourth, escape, fork and balance arbors follow it without turning, because
their angles are screen angles. Other gaps can change too, so the scan checks
the whole score, not only the third-barrel gap.

`tools/third_wheel_scan.py` scans `third_angle` down from the turned value in
$0.1°$ steps, measured at the validator's 1 px sampling. It stops at the first
angle where the score falls under the score of the turned layout.

Results: see [README.md](README.md).
