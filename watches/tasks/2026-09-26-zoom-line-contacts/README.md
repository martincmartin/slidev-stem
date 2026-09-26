# Do parts touch only through their ink? Result

2026-09-26, at Martin's request. Method and data model: [PLAN.md](PLAN.md).
Tool: [tools/contact_check.py](tools/contact_check.py). Raw results:
`evidence/contacts-chromium.json`, `evidence/contacts-firefox.json`,
`evidence/contact_check.log` (copied from `out/`, which is not committed).

**Status: finished, 2026-09-26.** Decision (Martin): line widths stay
constant on the screen during the zoom. The rule for the art is in
`docs/measurements.md`, "Line widths when the view zooms".

## Answer

**No contact in the hairspring view depends on the ink alone.** With
constant screen line widths, no gap opens there during the zoom. Keep the
zoom task's choice: line widths stay constant on the screen.

## What was measured

- The production drawing, `public/cover/skeleton-watch.svg`, in Chromium and
  Firefox (Playwright), at 520 times: one period (2 s) every 5 ms, then a
  minute every 0.5 s.
- For each pair of shapes that do not move together: the smallest distance
  $g$ between their centre lines. The pair is **at risk** when
  $(w_1 + w_2)/(2s) < g \le (w_1 + w_2)/2$, with $s = 250/56 \approx 4.464$:
  the ink touches at rest, and a gap opens in the zoomed view.
- A gap is **visible** only when no fill painted at or above the pair's upper
  shape covers its midpoint (`elementFromPoint`, fills only).

## Results

Both browsers gave the same six pairs of shapes, with the same numbers. None
is inside the hairspring view's frame.

| Where | Parts (centre of rotation) | Times at risk and visible | Largest zoomed gap |
| --- | --- | --- | --- |
| (697, 448) | the case and a hand (798, 276) | 15 of 520 | 11.5 px |
| (783, 292) | the wheel at (742.8, 265.3) and a hand | 14 | 9.5 px |
| (830, 273) | the wheel at (841.2, 350.8) and a hand | 520 | 8.3 px |
| (789, 275) | the wheel at (742.8, 265.3) and a hand | 48 | 5.9 px |
| (788, 280) | the same wheel's fill and a hand | 43 | 4.8 px |
| (795–798, 274–280) | a hand and a static shape | 520 | 0.2 px |

The hands turn about the watch's centre (798, 276). These places show only
in the cover view, which is not zoomed, so nothing opens there.

**Before the cover test**, the check also flagged pairs inside the hairspring
view, the largest between the pallet fork and the balance's roller: 6.8 px
at the tick. In each of them, a part painted above the pair covers the gap.
By eye, close-ups of the zoomed view at 0.42, 0.50 and 1.52 s show no gap
(`evidence/contact-*.png`: constant widths on the left, scaled widths on the
right).

## Why the escapement and the gears are safe

- The pallet fork is painted over the escape wheel, and each wheel's teeth
  are painted over the pinion they drive. Where they meet, the upper part's
  fill covers the lower part's outline. That does not depend on the line
  width.
- Gear teeth reach the other wheel's root circle on the centre lines
  (addendum = dedendum = 4 units), so those contacts hold at any width.

## Limits

- Sampling: outlines every 0.1 units, the hairspring every 0.3 units. A gap
  is exact to about half the spacing.
- The cover test uses fills at rest. A translucent fill (the case, at 18%
  opacity) counts as a cover, although it does not hide a gap. No at-risk gap
  in the view was near the case.
- Only the hairspring view was tested. A new zoomed view needs its own frame
  and scale: change `VIEW` and `SCALE` in the tool, or read `in_view` as
  "inside the hairspring view" only.
- The log prints each row's worst time as `np.float64(…)`. The tool now
  prints plain numbers; the run was not repeated for that.
