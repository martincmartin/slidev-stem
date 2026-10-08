# The Gears slide

The plan and the options are in [PLAN.md](PLAN.md).

- 2026-10-07: replaced by
  [`2026-10-07-watch-primitives`](../2026-10-07-watch-primitives/README.md).
  The Gears slide is frontmatter only. The jump between it and the Escapement
  slide is `watchMoveWith: none` in the timeline's one rule, not the canvas
  hiding of option B, and its view is the fitted view, not `GEARS_FRAME`.
  `watchCut` and `cutBefore` are gone.
- 2026-10-08: reopened for step 2 ([PLAN.md](PLAN.md), "Step 2"). The gears
  turn freely (`watchSpin: 0`, `watchSpinSpeed: 45`). The free spin is now
  the train's, for any slide: the Escapement slide names what shows during
  its spin (`watchSpinShows`), and `SPIN_PIECES` is gone. A fitted picture
  narrower than 60% of the slide is centred in the slide's left 60%.
- 2026-10-08: step 3 ([PLAN.md](PLAN.md), "Step 3"). At click 1 the rest of
  the Escapement slide's mechanism fades in, in the gears' view (`watchAdd`),
  and the spin ends.
- 2026-10-08: step 4 ([PLAN.md](PLAN.md), "Step 4"). `watchAdd` and
  `watchSpinShows` are replaced by `watchClicks` blocks of `watch` and
  `watchView`, and `watchView` takes a list of pieces: one way to add or
  remove pieces without moving the camera, on a slide or at a click.
- 2026-10-08: step 5 ([PLAN.md](PLAN.md), "Step 5"). `watchSettle` and
  `watchResume`, `watchSpin`, `watchSpinEnd` and `watchSpinSpeed`, and
  `watchTickTock` and `watchTickTockBurst` are replaced by state values that
  a slide sets and a `watchClicks` block changes: `watchAtRest`, `watchSpin`
  (a speed, or `false`) and `watchTickTock` (`plain`, `burst` or `false`).
  `watchTilt` can be in a block too.
