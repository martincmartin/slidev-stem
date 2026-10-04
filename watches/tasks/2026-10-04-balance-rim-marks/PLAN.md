# Plan: marks that show the balance's rim turn

Status: open. Nothing is built yet.

## The problem

The balance is one solid: a disc with three openings, so three arms, a hub and
a plain rim (`balanceSolids` in `watch/generate.ts`). Its comment says: "the
rim has no marks, so only the arms show that it turns". A plain annulus that
turns gives the same picture in each frame. The eye reads it as a fixed frame,
with the arms turning inside it.

The rim and arm joins were one outline each until
[`2026-09-29-geometry-problems`](../2026-09-29-geometry-problems/PLAN.md) §2
made them one piece. That change stays: this task adds marks to the rim. It
does not add lines back where the arms meet the rim.

Read before work starts: [`docs/watch.md`](../../docs/watch.md),
[`../docs/illustrations.md`](../../../docs/illustrations.md) ("Put the motion
in the marks that survive", "Some marks break the colour jobs"),
[`../docs/legibility.md`](../../../docs/legibility.md),
[`../docs/webgl.md`](../../../docs/webgl.md).

## Numbers that limit the marks

Values from `watch/design.json` and `watch/generate.ts` on 2026-10-04 (examples,
not copies to keep in sync):

| Quantity                                   | Value                                                         |
| ------------------------------------------ | ------------------------------------------------------------- |
| Balance radius $r$                         | 56 units                                                      |
| Rim width (`BALANCE_RIM`)                  | 8 units                                                       |
| Amplitude $A$, period $T$                  | 150°, 2 s                                                     |
| Peak angular speed $2\pi A / T$            | $\approx 471°/\text{s}$                                       |
| Scale: cover, slide 3                      | 1, $250/56 \approx 4.46$ (CSS px per unit)                    |
| Rim speed at the peak, cover               | $56 \cdot 471 \cdot \pi/180 \approx 460$ px/s, 7.7 px a frame |
| Rim speed at the peak, slide 3             | $\approx 2050$ px/s, 34 px a frame (60 fps)                   |
| Rim circumference, cover and slide 3       | 352 px, 1571 px                                               |

**Aliasing limit.** If the marks are closer than about two frames of travel,
the eye can match a mark to its neighbour, and the rim seems to slip or turn
backwards (the wagon-wheel effect). On slide 3, two frames are 68 px, so
$N \le 1571 / 68 \approx 23$ marks. Keep a margin: **at most 12 marks**. On the
cover the limit is the same ($352 / 15.4 \approx 23$), because the speed and
the circumference both scale with the view. A 120 Hz laptop halves
the travel a frame and relaxes the limit.

**Legibility floor.** A mark must be at least 1.64 CSS px across and 3:1
against what it sits on (`legibility.md`). On the cover a screw head of radius
4 units is 8 px across. It clears the floor by a factor of about 5.

## Options

| Rank | Option                                                                     | Cover (scale 1)                               | Slide 3 (×4.46, tilt 20°)  | Style and truth                                                             | Cost                                      |
| ---- | -------------------------------------------------------------------------- | --------------------------------------------- | -------------------------- | --------------------------------------------------------------------------- | ----------------------------------------- |
| 1    | **A. Bumps on the rim's outer edge** (timing screws, or Gyromax-type weights), 4–8 | the outline changes as it turns: survives a squint | clear, with depth from the tilt | real parts; structure, not texture; same inks as the rest                  | one more ring of geometry in `balanceSolids` |
| 2    | A + **B. marks on the rim's top face** (poising holes or short ticks)     | small dots, may not survive a squint          | clear                      | real (balances are drilled to poise them)                                   | small, after A                            |
| 3    | **E. A two-headed swing arrow on slide 3** (SVG callout), with A           | none                                          | clear: says "both ways"    | a direction mark: untested in the house style ("A path rather than an edge") | a slide-3 overlay and its fade            |
| 4    | **D. One rim segment or one screw in another colour**                      | clear                                         | clear                      | breaks the colour jobs; may read as the flash                               | small                                     |
| 5    | **C. Lines where the arms meet the rim, or wider arms**                    | no change to the rim                          | no change to the rim       | undoes geometry-problems §2                                                 | small, and it does not fix the problem    |
| 6    | **F. Motion trails or ghost copies**                                       | possible                                      | possible                   | not this style; new renderer work                                           | large                                     |

Why this order: only A fixes both views at once, and it changes the outline,
which is the strongest mark of this style. B and E can add to A. D, C and F
break a rule or do not fix the problem.

**Unknown: what the ETA 6497's balance looks like.** Versions differ, and I do
not know whether the version that the model mirrors has screws or a smooth rim.
Find reference photos before choosing between screws and smooth weights.
Either is true of some real balance.

## Steps

1. Find reference photos of the 6497 balance (and a screw balance, a Gyromax
   balance). Save the links and short notes in `evidence/references.md`.
2. Add the marks to `balanceSolids` behind a value object (count, kind,
   size), so that the variants come from one default.
3. Render each variant at both scales: 0 (now), 4, 6 and 8 screws; 4 and 6
   weights. For each, a still and a 1 s capture, at 60 fps, on the cover and
   on slide 3. Save the script in `tools/` and the frames in `evidence/`.
4. Measure the motion as `tools/motion.py` does for SVGs: the CSS px² in the
   rim's annulus (out to the bumps' tips) that change by at least 3:1 between
   frames 100 ms apart. Report it for each variant and view. The baseline (no
   marks) should be near 0 on the rim.
5. Measure the bumps against the floors: width in CSS px on the cover,
   contrast against the paper and against the parts under the balance.
6. Rank the variants by the numbers, with the frames. Ask the user to choose.
7. Build the choice. Update the comment in `balanceSolids`, `docs/watch.md`
   and `docs/measurements.md`. Update the test that counts the balance's
   outline if one does. Run `uv run ../tools/validate.py`.
