# Weighted rest-shape leader

2026-10-04: [The path-comparison task](../../2026-10-04-leader-path-comparison/README.md) replaces the local movement score with whole-path optimization.
These snapshots and measurements preserve the earlier correction.

The straight board's leader now ends at its right tip and is about 79 px long.
During the curl, the endpoint minimizes a weighted score for length, bend, and movement from the preceding frame.
The selected endpoint finishes on the spring's right side. The final leader is horizontal.
The callout and reference stay fixed during board and spring oscillation.

The choices and comparison are in [PLAN.md](PLAN.md).
The user requests are in [instructions.md](instructions.md).
The production weights and width are in `LeaderDesign` in [the saved generator](result/art/diving_board.py).

The original curl is preserved in [the input SVG](inputs/public/diving-board.svg).
It is also in the parent task's unchanged source and built deck.
If the user prefers that curl, restore its leader paths and keep the short pre-curl leader and passing stroke width.

## Evidence and tools

- `inputs/` and `result/`: source and drawing snapshots before and after the correction.
- `deck/`: the saved deck, including its fonts.
- `evidence/browser-checks.json`: Chromium and Firefox geometry, font, visibility, and navigation assertions.
- `evidence/weighted-comparison.json`: weight comparisons from `compare_leaders.py`.
- `evidence/leader-widths.json`: contrast of the leader alone, from the SVGs made by `measure_leader.py`.
- `evidence/barroom-final.json` and `motion.json`: final drawing and reference measurements.
- `evidence/validation.txt`: canonical talk validation.
- `evidence/*.png`: the straight board, curl, spring, and slide exit.

The width comparison excludes the label and ghost. It uses the actual slide background.
The separate reference screenshots include the ghost, leader, and label.
The browser checks block every outside request.

Chromium and Firefox pass, with zero page errors and outside requests.
All 21 canonical talk checks pass. No commit was made.
The leader endpoint stays within 0.46 px of the ghost outline in the sampled browser states.
The isolated leader holds 3.61:1 beside the board and 3.23:1 beside the spring at the design venue.
Its 90th-percentile contrast is 4.85:1 in both states.

Preview the [short initial leader](evidence/board-chromium.png) and [final spring leader](evidence/spring-rest-chromium.png).

From `watches/`, run the saved checks and source tools:

```bash
uv run tasks/2026-10-03-rest-shape/leader-correction/check_rest_shape.py
uv run tasks/2026-10-03-rest-shape/leader-correction/compare_leaders.py
uv run tasks/2026-10-03-rest-shape/leader-correction/measure_leader.py
```

The browser check serves the saved deck. The other tools import the saved source.
