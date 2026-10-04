# Instructions

From the user, 2026-10-04:

> For the balance wheel, it's not 100% obvious to the viewer that the annulus
> is rotating. What are some ways to make it clear? Keep in mind, we want to
> keep it consistent with the rest of the watch, so think in terms of e.g. the
> title slide that shows the whole thing, as well as slide 3 that focuses on
> it.

Then: "Please open a task for the balance rim marks, and include an
instructions.md and PLAN.md."

Clarification from the user, 2026-10-04:

> It doesn't matter what the ETA 6497's balance looks like. The goal of being
> similar to it is just for the gross layout, e.g. mainspring near the bottom,
> balance assembly near the top. The details of screws vs smooth weights should
> have no bearing on our decision.

Choose rim marks by visible motion, legibility, and drawing style. Use the
ETA 6497 reference only for the gross layout.

Selection from the user, 2026-10-04:

> Let's go with four radial weights.

This initial selection was superseded by the correction below.

## Scope

- Make the balance's rim visibly turn, on the cover (the whole watch, scale 1)
  and on slide 3 (the hairspring view, scale $250/56 \approx 4.46$, tilt 20°).
- Change the 3D model (`watch/generate.ts`), not one slide's overlay, so that
  every view of the balance agrees.
- Keep the house style: line art, the colour jobs of `../../../docs/theme.md`,
  the floors of `../../../docs/legibility.md`.
- Do not commit without the user's approval.

## Corrected selection, 2026-10-04

> Actually, I want the four screws, not the four weights

Install four radial screw heads with outward face slots.
Keep the established camera target, zoom, and timing.
