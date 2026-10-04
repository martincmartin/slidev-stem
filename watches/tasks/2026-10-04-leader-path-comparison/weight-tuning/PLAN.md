# Leader weight tuning

Read [watch.md](../../../docs/watch.md) and [measurements.md](../../../docs/measurements.md).
Keep the squared perpendicular-velocity objective, the viewer-facing ghost edge, and the short pre-curl leader.
Keep the original comparison slide.

## Options

1. Reduce the length coefficient and increase the movement coefficient moderately.
   This permits longer lines and reduces sideways motion. Radial movement still has no penalty.
2. Use much stronger movement weighting.
   This can reduce sideways motion further, but can increase rapid movement along the line.
3. Restore the original fixed contact.
   The user prefers its motion, but currently requests coefficient changes to the optimized path.

Compare the first two options on the full curl. Select a practical compromise from the measured paths.
Report perpendicular speed, total travel, and the largest frame step. Rank the tested settings after measurement.

## Execution

- Save the current generator, drawings, docs, theme, and probe tools.
- Compare candidate weights at the current angular sampling density.
- Change the two selected coefficients and regenerate the drawings.
- Check rendered curls in Chromium and Firefox, with outside requests blocked.
- Measure leader contrast and update the current docs.
- Run formatting and canonical validation. Do not commit.

## Selected setting

Select length weight $0.75$ and movement weight $0.006$. Keep the bend weight.
The movement weight doubles. The length weight decreases by 25%.
Perpendicular speed RMS decreases by 21%, from 48.97 to 38.77 px/s.
Total endpoint travel increases by 1.8%. The largest frame step increases from 33.88 to 42.39 px.
These differences follow from the requested perpendicular-only penalty.

Rank the settings in this order:

1. $(0.75,0.006)$: useful sideways-motion reduction with limited extra travel.
2. $(0.8,0.0045)$: smaller reduction, with less extra travel.
3. $(0.5,0.01)$: larger sideways-motion reduction, but much larger radial steps.
4. The strongest tested settings: little further sideways improvement and large radial steps.

The first number is the length weight. The second number is the movement weight.

## Stronger-weight comparison

The user also requests a separate slide for the larger radial-step solution.
Insert it after the original comparison slide. It becomes slide 4.
Use length weight $0.25$ and movement weight $0.03$.
Keep slide 2's single visible ghost edge and short pre-curl leader on this copy.
Keep distinct SVG IDs and the existing four-click animation sequence.
Verify all three variants in both browsers and measure their leaders.
