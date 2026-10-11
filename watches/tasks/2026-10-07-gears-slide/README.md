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
- 2026-10-08: step 6 ([PLAN.md](PLAN.md), "Step 6"). At a new click 1, four
  teeth of the fourth wheel and the four leaves that they drive fade in, in
  the second (`fourth wheel span`, `escape pinion span`); the mechanism comes
  back at click 2.
- 2026-10-08: step 6, the trial ([PLAN.md](PLAN.md), "The flash's colours,
  as a trial"). Click 1 shows the span in the flash's colours, click 2 solid;
  click 3 brings the mechanism back and the span goes; click 4 adds the
  seconds hand.
- 2026-10-08: step 6, the text ([PLAN.md](PLAN.md), "The text"): "Tooth
  for tooth." "Bigger wheel, slower turn." "Twice the size, half the speed.
  Exactly." One line a click (clicks 2 to 4) with the flash's colours; all
  at once with the solid span (click 5). The mechanism comes back at click
  6, and the seconds hand at click 7.
- 2026-10-08: the text is now "Half of the small gear", "Quarter of the big
  gear", "Twice the size, half the speed. Exactly.", one line a click
  (clicks 2 to 4), and it stays up at click 5 ([PLAN.md](PLAN.md), the end
  of "The text").
- 2026-10-08: the user changed the text to "A quarter of the big gear", and
  "Twice the size, half / the speed. Exactly." on two lines.
- 2026-10-08: click 7 has the text "Once a minute. The second hand!", and
  `watch: all` leaves out the span ([PLAN.md](PLAN.md), the last two
  sections).
- 2026-10-08: `scenecheck` allows the flash style for the trial
  (`MARK_WASH_ROLE`), so the talk commits with both styles ([PLAN.md](PLAN.md),
  "Commit with both styles").
- 2026-10-11: the user kept the flash's colours. The solid span and its click
  (click 5) are gone, `… span wash` is now `… span`, and `scenecheck` allows
  a mark only in the flash's colours (`MARK_FILL_ROLE`, `MARK_LINE_ROLE`).
