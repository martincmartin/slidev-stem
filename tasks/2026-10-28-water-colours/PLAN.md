# The water's two colors

## The problem

A globe spike (the branch `globe-spike`,
`watches/tasks/2026-10-28-globe-planning/`) went wrong three times on the
water's colors:

- It drew the sea as a face: a wash at 18%, the muted wash's recipe. The user
  found it too pale.
- The user named two marks, the pool's edge and the board's outline. The
  analysis used only the first, as `water`.
- The analysis said that no line in the pool lies on the water. The board's
  outline does.

## The root cause: the color that a viewer sees as the water had no name

The pool's drawing made it from `water` at 0.6 (`WATER_OPACITY` in
`watches/art/diving_board.py`). The palette's `water` was a dark blue for
lines: 4.1–10.4:1 on the paper. So "the water color" meant the fill to the
user, and the nearest name, `--palette-water`, was another color. The theme's
table of pairs listed `water` as a line color with no wash yet, and said "add
a wash when a drawing first needs a face". With no name for the water, that
rule made the sea a face. In Ledger, `water` was `var(--palette-subject)`, so
the pool's edge and the board's outline looked like one line color. In the
other six palettes they differ.

## The options

1. Rename `water` to `water-wash`, and keep the opacities in the drawing. The
   pool's edge would then be drawn in a "wash".
2. Keep `water` for lines, and add a role for the fill, as a recipe: `water`
   at 0.6 over the paper.
3. Change the docs only.
4. Two roles, each a value in each palette: `water` (the edge) and
   `water-wash` (the water itself), both drawn at full strength.

**Chosen: 4, by the user.** Two names, each a value that a palette can tune
alone, not "a 0.6 that's sneaking in, trying to auto-generate one from the
other". Option 1 names a line as a wash; 2 keeps the hidden 0.6; 3 leaves the
confusion in the names. The name `water-wash` keeps the house pattern (a line
color and its wash). Its strength is not a face's (`evidence/water_split.txt`,
`evidence/water_gates.txt`):

| Measure (7 palettes)                     | The water's wash | A face's wash (the gates) |
| ---------------------------------------- | ---------------: | ------------------------: |
| on the background                        |        2.19–3.97 |                   ≤ 1.5:1 |
| on the panel                             |        1.96–3.27 |                  ≥ 1.12:1 |
| the water's edge on it                   |        1.53–2.16 |                     ≥ 3:1 |
| the sea at 18% (the spike), on the panel |        1.10–1.27 |                         — |

So `water-wash` is not in `WASH_PAIRS` (`tools/lib.py`), and it has its own
gate: at least 1.5:1 on the panel, stronger than any face. The spike's 18%
sea fails it. Both colors have the water hue gate.

## The values

They are what the pool drew before, as solid colors: the water's wash is the
old `water` at 0.6 over the background, and the water is the old `water` at
0.7 over that (`evidence/water_split.txt`). `tools/derive_palette.py` makes
both from one blue for a new palette.

In Chromium, the pool's water is the same, pixel for pixel. About 1,500–1,700
pixels of its edge line change by more than 2 of 255 levels, and at most by
20 (`evidence/pool_pixels.txt`, `evidence/pool-crop.png`): the half of the
line over the wall was a blend with the wall, and is now the line's own blue.

## A line on the water

The water's edge (1.5–2.2:1 on the water's wash) marks where two fills meet.
A line that must read on the water, such as the board's outline or a coast,
needs 3:1 on the water's wash (`evidence/water_gates.txt`):

| Palette             | `subject` | `ink` | `ink` at 0.5 over the paper |
| ------------------- | --------: | ----: | --------------------------: |
| Ledger              |      3.00 |  4.09 |                        1.14 |
| After-Hours         |      3.13 |  4.05 |                        1.29 |
| Beacon              |      2.93 |  4.28 |                        1.30 |
| Campfire            |      3.15 |  4.03 |                        1.29 |
| Electric Terracotta |      4.18 |  5.33 |                        1.21 |
| Field Notes         |      4.24 |  6.05 |                        1.34 |
| Kraft Ink           |      3.82 |  6.20 |                        1.43 |

- **So a line on the water is `subject` or `ink`, at full strength.** A line
  mixed toward the paper all but vanishes on the water: the spike's
  meridians, `ink` at 0.5, were 1.1–1.4:1.
- **Beacon's `subject` is 0.07 under the 3:1 floor**, before and after this
  change: the diving board's outline over the pool. No gate checks a line on
  the water yet. A gate "subject on water-wash ≥ 3:1" would need Beacon's
  water's wash moved a little toward the paper: a decision for later.

## The lesson for the agent

It is in agent-house's correction watchlist
(`user/skills/learn-from-corrections/watchlist.md`, 2026-10-28): match a
color that the user names by what they see to the marks in the drawing's
code, not to the role names in the docs.

## Run the tools

At the root of `stem/`, with the house as it was at `adeefe8`:

```bash
mkdir HOUSE && git archive adeefe8 tools themes | tar -x -C HOUSE
PYTHONPATH=HOUSE/tools uv run python tasks/2026-10-28-water-colours/tools/water_gates.py
PYTHONPATH=HOUSE/tools uv run python tasks/2026-10-28-water-colours/tools/water_split.py
cd tasks/2026-10-28-water-colours
uv run python tools/pool_pixels.py evidence/diving-board-before.svg evidence/diving-board-after.svg
uv run python tools/pool_crop.py evidence/diving-board-before.svg evidence/diving-board-after.svg evidence/pool-crop.png
```
