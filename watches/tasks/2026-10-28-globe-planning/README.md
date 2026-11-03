# A globe for Part 2

How hard it is to draw a globe in the talk's WebGL renderer: the coast lines,
and meridians every 15° on the water, as a line drawing, with the water in a
wash or not. A spike draws it and measures it.

- `instructions.md`: the request and the later messages.
- `PLAN.md`: the options, the measurements, the spike's results and the
  recommendation.
- `tools/fetch.sh`: downloads Natural Earth at the commit that the
  measurements used.
- `tools/measure.ts`: counts, segment lengths, islands, meridians on water,
  and four ways to triangulate the land on a sphere.
- `tools/frames.ts`: opens the spike in three engines and records its frame
  times and pictures.
- `tools/palette_globe.py`: the sea's and the coast's contrasts in each house
  palette.
- `spike/`: the globe in a copy of the renderer (`spike/webgl/`), a page with
  controls and frame times, the model's tests, and copies of two palettes.
- `evidence/`: the results of `measure.ts` at grid steps of 1.5°
  (`measurements.json`), 1°, 3° and 5°; the Natural Earth commit; and in
  `frames/`, the frame times and Chromium's pictures; `palettes.json`, the
  output of `palette_globe.py`.

Run each tool from the talk's directory (`PLAN.md`, section 10).

2026-10-28: the house palettes now have `water` (the edge) and `water-wash`
(the water itself) as two values (`PLAN.md`, section 15, and the house task
`tasks/2026-10-28-water-colours/`).
`tools/palette_globe.py` reads the house palettes, and it ran before that
change: run now, its `water` is the new edge color, not the old line color.
The spike keeps its own copies of two palettes, so it is not changed.

## Later changes

- 2026-11-03: the land is not an `overlay` (`PLAN.md`, sections 4 and 5). The
  plan needed it where the land met a sphere's faces. The talk's disc hides the
  far side instead, so the land is always in front of it. The offset grew with
  the slope, and hid bits of the coast as the globe turned
  (`watches/docs/globe.md`, "The globe").
