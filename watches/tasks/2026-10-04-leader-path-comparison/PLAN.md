# Whole-path leader and original-path comparison

Read [watch.md](../../docs/watch.md), [slide-patterns.md](../../docs/slide-patterns.md), and [measurements.md](../../docs/measurements.md).
Also read the house illustration, legibility, and talk validation rules.
The previous [derivation](../2026-10-03-rest-shape/optimal-leader-line-from-calculus-of-variations.md) defines the path objective.
The new work implements that objective and adds a comparison slide.

## Options and ranking

| Rank | Option                                               | Benefit                                                     | Cost                                                          |
| ---- | ---------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------- |
| 1    | Dynamic programming on sampled outline contacts      | Finds the global minimum of the sampled full-path objective | Requires contact sampling and convergence checks              |
| 2    | Refine a sampled path with a continuous local solver | Can reduce sampling artifacts                               | Adds solver behavior and local-minimum risk                   |
| 3    | Solve the Euler–Lagrange boundary-value equations    | Direct use of the continuous equations                      | Needs special handling for bend kinks and degenerate tangents |

The user selects option 1. Do not add a continuous solver.

## Implementation

1. Save the current source, drawing, docs, theme, and original leader as inputs.
2. Keep the full 3D ghost before the curl because its depth is visually useful.
   At the actual curl start, switch to one open path on the edge that becomes the viewer-facing upper ribbon edge.
   Two dashed edges clutter the shallow view during the curl and on the final spring.
   Sample that single edge with rays from the fixed elbow.
   Use the first intersection with the exact cubic edge.
   Restart at its closest contact to the elbow and include the straight leader direction.
   Permit the requested endpoint jump when the ghost changes.
3. Score full paths with time-integrated length, bend, and squared perpendicular velocity.
   Use $w=r\dot\phi$ and physical frame duration.
   Apply dynamic programming, then recover the chosen contact path.
4. Compare candidate densities and motion weights. Record costs, motion, and generation time.
5. Generate a second SVG from the original material-point leader path.
   Keep its initial far-side contact and original curl geometry, with the measured line width.
   The user chooses to preserve the original full ghost on this comparison slide.
6. Insert a copy of slide 2 immediately after it, using the comparison SVG.
   Give each drawing distinct SVG IDs so mounted slides cannot share masks or clips.
7. Update the current docs and save final sources, drawing files, and a built offline deck.

## Verification

- Check the dynamic-programming result against exhaustive enumeration on a small graph.
- Check parallel motion, transverse motion, time scaling, fixed initial contact, and outline contact.
- Verify that the comparison leader's sampled path matches the first saved version exactly.
- Verify that all moving-board, ghost, and pool geometry matches the input drawing.
- Measure line and reference contrast for both slides.
- Inspect both slides in Chromium and Firefox, with outside requests blocked.
- Check stationary ghosts, curls, crossfades, resume, reverse clicks, direct entry, and slide exit.
- Run `pnpm format` and `uv run ../tools/validate.py`. Do not commit.
