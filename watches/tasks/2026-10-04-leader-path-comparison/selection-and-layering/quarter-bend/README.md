# Quarter bend weight on slide 2

Slide 2 uses bend weight $15$, one quarter of the preceding value $60$.
Its length and movement coefficients stay unchanged.
Slide 3 keeps the same zero-bend SVG byte for byte.
The initial short leader, ghost, subject geometry, paint order, and animation timing stay unchanged.

The request is in [instructions.md](instructions.md). The steps are in [PLAN.md](PLAN.md).
The current rules are in [watch.md](../../../../docs/watch.md).

`inputs/` holds the preceding source, drawings, and theme.
`result/` holds the selected source, drawings, deck source, component, and docs.
`deck/` holds the built offline deck.
`evidence/` holds geometry equality, both-browser checks, screenshots, contrast results, and canonical validation.

From `watches/`, run the saved regeneration tool:

```bash
uv run tasks/2026-10-04-leader-path-comparison/selection-and-layering/quarter-bend/regenerate.py --out /tmp/quarter-bend.svg
uv run tasks/2026-10-04-leader-path-comparison/selection-and-layering/quarter-bend/regenerate.py --no-bend --out /tmp/zero-bend.svg
```

Chromium and Firefox pass the animation lifecycle and foreground-reference pixel checks.
The isolated leaders and references pass the design-venue contrast gate.

No commit was made.

2026-10-04: Keep the bend-$15$ slide and remove the zero-bend comparison from production.
See the [final review](../../../2026-10-04-rest-shape-final-review/README.md).
