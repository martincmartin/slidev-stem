# How the pool ends on slide 2

The pool, its walls and the ground end at 60% of the slide's width, so the pool
seems to go on to the right. A pool that ended in a drawn wall would be about as
wide as the board, and read as a small pool. The first end was a straight
vertical crop, which looked jarring. This task compared other ways to end the
picture at the same place.

**Decision (2026-10-03): the fade.** The talk's `art/diving_board.py` draws
only the fade, and `docs/watch.md` describes it. This directory keeps every
option, so that the comparison can be shown and the task reopened.

## Show the comparison to someone

The deck has one slide for each edge, with the board swinging and no clicks. The
titles do not say which edge was chosen, so as not to lead the viewer.

- **The frozen copy (any computer with Python 3):**
  `python3 -m http.server 8000 -d tasks/2026-10-03-pool-edge/deck-static`, in
  `watches/`. Then open http://localhost:8000. It is a static build of
  `deck/`, made on 2026-10-03 with the talk's Slidev and theme of that day. It
  makes no outside requests (checked with `tools/offline_check.py --walk`).
- **The live deck (needs the talk's `pnpm install`):**
  `pnpm exec slidev tasks/2026-10-03-pool-edge/deck/slides.md`, in `watches/`.
  It uses the talk's current Slidev and theme, so a later theme change shows
  here too, and a later Slidev upgrade could break it. If it does, use the
  frozen copy.

## Reopen the task: try a new edge, or switch

Everything that the comparison needs is in this directory, not in the talk:

| Path                                | What it holds                                                                                                                |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `tools/diving_board.py`             | the talk's generator as it was on 2026-10-03, with every edge (`Edge`). It writes `deck/public/diving-board-<edge>.svg`       |
| `deck/slides.md`                    | the comparison deck: one slide per edge                                                                                       |
| `deck/components/DivingBoard.vue`   | the talk's component, with a `src` prop for the SVG to show                                                                   |
| `deck/public/`                      | the five SVGs, and the talk's favicon                                                                                         |
| `deck-static/`                      | the static build of `deck/`                                                                                                   |
| `evidence/measure_edges.py`         | the measurements below, from the SVGs in `deck/public/`                                                                       |
| `evidence/analyse_fade.py`          | the fade's curve, measured in screenshots (see "The fade's measurements")                                                     |

**To try a new edge**, in `watches/`:

1. Add it to `Edge` in `tools/diving_board.py`, and draw it in `drawn_edge` (a
   line) or in `set_markup` (a mask). Give it its own ids: the deck's
   neighbouring slides are in the page together, and a `url(#id)` finds the
   first id in the page.
2. `uv run tasks/2026-10-03-pool-edge/tools/diving_board.py` writes every edge;
   `--edge <name>` writes one; `--check` fails if a file differs.
3. Add a slide to `deck/slides.md`, and add the edge to `EDGES` in
   `evidence/measure_edges.py`. Run it.
4. Rebuild the frozen copy:
   `pnpm exec slidev build tasks/2026-10-03-pool-edge/deck/slides.md --out "$PWD/tasks/2026-10-03-pool-edge/deck-static"`
   (`--out` needs an absolute path; Slidev reads a relative one from the deck's
   directory).

**To switch the talk to another edge**, port that edge's code from
`tools/diving_board.py` to the talk's `art/diving_board.py`, run
`uv run art/diving_board.py`, update the diving board's section of
`docs/watch.md`, and add a dated line under "Later changes" below. The talk's
generator has no `--edge`, and its ids have no edge in them: the talk shows one
diving board.

## Options

| Edge        | What it is                                                                                                                                                                                                                                                                                                                                                                                       | Notes                                                             |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------- |
| `uncropped` | no edge: the pool and ground run on, off the slide's right edge                                                                                                                                                                                                                                                                                                                                  | the original; the pool looks as wide as the board is long         |
| `crop`      | a straight vertical cut                                                                                                                                                                                                                                                                                                                                                                          | the baseline; jarring                                             |
| `fade`      | an alpha mask: the blend is smootherstep(t) in sRGB over 85 px, ending at the 60% line (a linear ramp showed a Mach band at its start)                                                                                                                                                                                                                                                         | soft; no line. **Chosen**                                         |
| `cutaway`   | a thin, nearly straight line with one sharp zigzag, as a break line in a technical drawing                                                                                                                                                                                                                                                                                                       | the house style is a technical drawing: the line is a drawn mark  |
| `broken`    | a wavy broken-away line of Bézier lobes (alternate sides, all the same height, 10 × edge height ÷ slide height cycles (4.5 here), rounded to the nearest half, about a centre line with a slope of 0.08 (to the right going down) that ends one amplitude left of the 60% line at the bottom, where the fade is all paper, each swinging 0.4–1.6 × 9 px), from the drawing's bottom to the ground's back edge exactly: it crosses only the water, wall and ground, never the air | the algorithm is the user's (`broken_edge`); the line starts on the ground's top line |

Rejected by the user on 2026-10-03, and removed from the code: a linear ramp of the blend in sRGB, one in linear light (gamma 2.2; one mask opacity cannot be right for every colour under it), and one that copied the curve measured in a screenshot, all three because a linear start shows a sharp transition; a torn photograph (a ragged edge with the paper backing showing), a scalloped edge like an old photo frame, and a first broken-away edge made of summed sine waves that began above the ground.

## Measurements

`evidence/measure_edges.py` renders each SVG on the slide's paper (#FAF7F0)
with `rsvg-convert`, and measures the region round the 60% line, below the
ground's back edge. `evidence/edges.png` shows the four edges side by side.

| Edge    | Hardest step across the edge (median, max) | Water → paper, 10–90% | All paper, px from the 60% line | Visible contour (px ≥ 1.25:1) |
| ------- | ------------------------------------------ | --------------------- | ------------------------------- | ----------------------------- |
| crop    | 3.47:1, 8.51:1                             | 0 px                  | 0                               | 811                           |
| fade    | **1.04:1**, 2.14:1                         | 42 px                 | −5                              | **196**                       |
| broken  | 3.17:1, 4.68:1                             | 1 px                  | −24 to −5                       | 975                           |
| cutaway | 3.33:1, 4.96:1                             | 1 px                  | **−8 to +12**                   | 1318                          |

The pool's own lines and ripples give about 196 px of contour in every edge.
So the edge itself adds about 0 px (fade), 600 px (crop), 780 px (broken) and
1100 px (cutaway). The fade's 256 stops add 17 KB to the SVG (2.7%).

These numbers measure how much an edge pulls the eye. They do not measure how
good it looks.

## Ranking, and why the fade

1. **Fade.** The only edge with no hard step (1.04:1, against 3.2–3.5:1), and
   it adds almost no contour. The main focus of a slide is on its left
   (`docs/slide-patterns.md`), and the fade keeps the eye there. It is all
   paper 5 px inside the 60% line. Against it: it is the only gradient in the
   house art, which is otherwise flat fills and lines, so it is softer and
   more photographic than the rest of the drawing.
2. **Broken-away edge.** The best fit to the house grammar: one 2 px muted
   line, on the stroke ladder, that is the boundary of a thing. A freehand wavy
   line says "partial view" in a technical drawing (not checked against a
   standard). Against it: it adds about 780 px of contour at about 3.2:1,
   more than the crop.
3. **Cutaway break line.** The most contour (about 1100 px), and its zigzag's
   sharp corners are the strongest mark near the edge. It goes 8 px into the
   air above the ground and 12 px past the 60% line. The zigzag (long-break)
   convention means that a length was removed and the part goes on past the
   break, which is not quite what this picture says.
4. **Straight crop.** A 3.5:1 step in one pixel, in the middle of the paper.
   It looks like a mistake, or the edge of an inset photo. The user found it
   jarring.

The user chose the fade on 2026-10-03.

## The fade's measurements

`evidence/analyse_fade.py` measures the fade in screenshots and compares it with
the formulas (`evidence/fade-curves.png`). Two lessons:

- The first two fades had vertical bands (about 8 and 10 steps) not because the
  formula was wrong, but because the gradient's stop offsets were written with
  `number()`, which rounds to 0.1. A new render with 256 stops at exact offsets
  matches its formula to an RMS alpha error of 0.003 (smootherstep) and 0.003
  (linear light).
- The two formulas are far apart: at the middle of the fade the linear-light blend
  is 0.60 of the way to the paper, the sRGB one 0.50, and at 25% of the way
  along, 0.34 and 0.25 (smootherstep: 0.10).

## Later changes

None yet.
