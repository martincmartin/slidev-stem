# Selected leader and foreground ghost

2026-10-04: [Quarter bend weight](quarter-bend/README.md) reduces slide 2's bend coefficient to one quarter of its preceding value.
The snapshots below keep the prior settings.

Slide 2 keeps the selected leader weights and animation.
The original and strong-movement comparisons are removed from the working deck.
Slide 3 adds the requested zero-bend experiment, with all other settings copied from slide 2.
Their sources, drawings, and built decks remain in the preceding task snapshots.

The SVG now paints the live board before the rest outline and callout.
The dashed ghost therefore remains on top during the bend and curl.
The slide already paints above the WebGL watch layer.
The ghost keeps that position when the board crossfades to the hairspring.

The [plan](PLAN.md) gives the alternatives and the reason for this choice.
The [request](instructions.md) records the selected version.
The current rules are in [watch.md](../../../docs/watch.md).

## Evidence and saved checks

- `inputs/`: the three-variant deck and its sources before selection.
- `result/`: the final deck source, component, generator, SVG, and docs.
- `deck/`: the final built offline deck.
- `evidence/geometry-checks.json`: exact SVG equality after the intended paint-order change.
- `evidence/layering-checks.json`: rendered reference-pixel checks in Chromium and Firefox.
- `evidence/browser-checks.json`: the slide lifecycle checks in both browsers.
- `evidence/validation.txt`: canonical validation.

The geometry check proves that slide 2 keeps all SVG shapes, timing, leader paths, and styles.
The experiment changes only the leader path and SVG ID prefix.
Only the order of the two reference groups changes.
Both variants pass the Chromium and Firefox lifecycle checks, with no page errors or outside requests.
Pixel checks find zero covered solid reference pixels in every tested phase.
The old paint-order control covers more than 100 reference pixels, so the check can detect the reported bug.
All isolated leaders and reference drawings clear the design-venue contrast gate.

No commit was made.

From `watches/`:

```bash
uv run tasks/2026-10-04-leader-path-comparison/selection-and-layering/check_rest_shape.py
uv run tasks/2026-10-04-leader-path-comparison/selection-and-layering/check_layering.py
uv run tasks/2026-10-04-leader-path-comparison/selection-and-layering/check_geometry.py
uv run tasks/2026-10-04-leader-path-comparison/selection-and-layering/regenerate.py --out /tmp/selected-leader.svg
uv run tasks/2026-10-04-leader-path-comparison/selection-and-layering/regenerate.py --no-bend --out /tmp/zero-bend-leader.svg
```

These tools use the saved generator and built deck.
