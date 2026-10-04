# Slide 2 rest shape

2026-10-04: [The path-comparison task](../2026-10-04-leader-path-comparison/README.md) adds whole-path optimization and a single curl edge.
It also restores this task's original full ghost and leader on the next slide for comparison.

2026-10-04: The user requests a whole-path derivation before any velocity-cost implementation.
See [the calculus-of-variations analysis](optimal-leader-line-from-calculus-of-variations.md).
The existing animation and snapshots are unchanged.

2026-10-03: The leader now uses weighted length, bend, and movement costs, with a short initial line and a measured stroke.
See [the correction](leader-correction/README.md). The snapshots below preserve the first implementation.

The dashed ghost shows the board's rest shape while the board bends and swings.
It curls into the spring's rest outline on the same clock as the board.
The `Rest Shape` callout uses IBM Plex Sans 600. Its leader follows the ghost.
The ghost stays fixed during the crossfade and the resumed hairspring motion.
It disappears when the audience leaves slide 2.

The existing click count, view, and animation durations are unchanged.
The original moving-board paths and pool group match the input SVG byte for byte.
The ghost's final paths match the moving board's final paths byte for byte.
No commit was made.

The alternatives and ranking are in [PLAN.md](PLAN.md).
The request is in [instructions.md](instructions.md).
The current operating rules are in [watch.md](../../docs/watch.md).

## Evidence

- `inputs/`: the source, theme, and docs used before this change.
- `result/`: the changed source, generated SVG, and docs after this change.
- `deck/`: the built deck and its fonts. The probe serves these files with all outside requests blocked.
- `evidence/browser-checks.json`: geometry, visibility, loaded font, and navigation assertions from Chromium and Firefox.
- `evidence/validation.txt`: the canonical talk checks.
- `evidence/barroom-final.json`: final still measurements. `evidence/motion.json`: motion measurements.
- `evidence/ghost-barroom-3px.json`: the initial ghost stroke comparison.
- `evidence/geometry-checks.json`: comparisons with the original board and the final spring outline.
- `evidence/*.png`: screenshots of the board, curl, spring, and slide exit.

In both browsers, the ghost stays fixed during the board's bend and swing.
The real hairspring's rendered pixels change after resume; its ghost and leader do not.
Reverse clicks, direct entry at click 4, rapid clicks, and slide exit pass.
The leader endpoint stays within 0.06 px of the ghost outline in the sampled states.
Both browsers report zero page errors and zero outside requests.
All 21 canonical talk checks pass.

At the design venue, the isolated ghost and callout hold 3.24:1 for the board and 3.38:1 for the spring.
The initial 3 px strokes held 3.08:1 and 3.01:1. The selected 4 px strokes give more margin.
The outline is unfilled and dashed, so the real subject remains distinct.
These measurements exclude the live subject. Shared parts of the two shapes can overlap in the full slide.

## Run the saved checks

From `watches/`:

```bash
uv run tasks/2026-10-03-rest-shape/check_rest_shape.py
uv run tasks/2026-10-03-rest-shape/regenerate.py --out /tmp/rest-shape.svg
```

The regeneration command imports the source saved in `result/` and reads the saved theme.
It checks that its output matches the saved SVG before it writes the requested file.
The browser probe uses the saved built deck, not the current project code.
