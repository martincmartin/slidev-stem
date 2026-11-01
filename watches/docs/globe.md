# The globe and the story maps

**Covers:** Part 2's globe and its story maps: the land data, where it
comes from, and how it is made. The globe's model, its views, the story
maps and their marks are added here as they are built.
**Read before** you change `globe/`, `art/earth-data.ts`,
`art/fetch-earth.sh`, or the globe's frontmatter. The rules for WebGL art
in any talk are in [`stem/docs/webgl.md`](../../docs/webgl.md).
**Tasks:**
[`2026-10-31-part-2-production`](../tasks/2026-10-31-part-2-production/PLAN.md)
(the plan: WebGL for the globe, SVG for the story maps, HTML for the
words),
[`2026-10-30-part-2-visual-language`](../tasks/2026-10-30-part-2-visual-language/PLAN.md)
(the mockup, and the design of the slides),
[`2026-10-28-globe-planning`](../tasks/2026-10-28-globe-planning/PLAN.md)
(the globe in the house renderer, and the disc that hides the far side).

## The data

`globe/earth.json` is Natural Earth's land, in the public domain, at
three scales, one level each (`globe/earth.ts` reads and checks it):

- **1:110m and 1:50m: the whole Earth,** to 0.01° (1.1 km).
- **1:10m: only near the stories,** in boxes (`FINE` in
  `art/earth-data.ts`): one for Cape Noir and Juan Fernández, one for the
  English Channel and the Isles of Scilly. Each is cut 2° outside its box,
  so the cut's edges are not on the box; the globe cuts again at the box.
  It is to 0.001°, and a point within 0.5 km of the last is dropped. The
  whole Earth at 1:10m would be 10 MB.

A level is a list of polygons, each an outline and its holes, each ring a
flat list of longitudes and latitudes. There is no separate coast: the
globe takes the coast from the rings, less the data's cuts at 180° and at
the South Pole. The file is about 1.3 MB, 0.4 MB compressed.

To make it again (in `watches/`):

```bash
sh art/fetch-earth.sh NE_DIR          # downloads, at the commit in the file
node art/earth-data.ts NE_DIR         # writes globe/earth.json
node art/earth-data.ts NE_DIR --check # fails if the file is not what NE_DIR makes
```

Validation does not run `--check`: it needs the downloads.
`globe/earth.test.ts` checks the file itself: it parses, the levels are in
order, 1:10m has the Juan Fernández Islands and the Isles of Scilly, and
its land is near its boxes.
