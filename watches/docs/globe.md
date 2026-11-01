# The globe and the story maps

**Covers:** Part 2's globe and its story maps: the land data, the globe's
meshes and levels, its views, the flight between them, and how the globe
joins the watch's scene. The story maps and their marks are added here as
they are built.
**Read before** you change `globe/`, `watch/art.ts`, `art/earth-data.ts`,
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

## The globe

`globe/globe.ts` makes the globe's meshes at load, from the data:

- **The sea** is a disc through the globe's center, in the water's wash. Its
  group (`DISC_GROUP`) turns it to face the camera at each frame
  (`globeMatrices` in `globe/model.ts`, from the frame's pose). The camera is
  orthographic, so the disc hides exactly the far half of the globe, and
  its rim is the true limb. Its rim is the limb's line.
- **The land** is in the paper, over the sea. Each level's polygons are cut
  into triangles (`earcut` and its `refine`), then along a grid of 3°, so
  that each face stays near the sphere at the limb, and along the boxes'
  edges. The land needs no lift: every face on the near half is in front of
  the disc.
- **The coast** is each ring of the land, less the data's cuts at 180° and
  at the South Pole: the subject's line at 3 px, as a story map's.

No mark is in a new role: the sea is the water's wash, the land the paper,
the coast and the limb the subject ([`stem/docs/theme.md`](../../docs/theme.md),
"The roles").

**The levels.** Each of Natural Earth's scales is made for a number of km to
a slide px (`KM_PER_PX`). A view draws the level whose number is nearest its
own, on a log scale: each level is a mesh drawn in its own range of the
view's scale (`Mesh.scales`, `scaleRanges`). 1:10m has land only in its
boxes, so at its zooms the globe draws 1:10m in the boxes and 1:50m outside
them. 1:50m is two meshes for this: the part in the boxes, drawn at 1:50m's
zooms only, and the part outside them, drawn from 1:50m's zooms on. A level
change pops.

**The cost.** The globe is about 162,000 triangles, and Node makes it in
130–220 ms at each load of the deck or the article. The browsers' times are
not yet measured (the production task, phase 8).

**The far place.** The globe's center (`CENTRE`) is far from the watch, so
that neither is in the other's views. Its radius is 500 world units.

## The views

`globe/views.ts` gives the globe's views, which a slide names in `artView`.
Each looks straight down at a place, north up. Its pivot is the globe's
center, and it has the angles that face the place (`View.angles`): a slide
that names the view and sets no `artTilt` or `artTurn` gets them. A story
map's view (Cape Noir, Juan Fernández, Scilly) has the map's place, slide
point and scale, so the map fits the globe there. South America and the
Channel fit a list of places into the band under the title.

## The flight

`artMove: fly` flies the camera over the globe, between two of its views
(`webgl/flight.ts`, [`stem/docs/webgl.md`](../../docs/webgl.md), "Motion and
slides"): it zooms out as far as the pan needs, pans along the great circle,
and zooms in. A flight takes its own time, 1 s for each unit of its length,
within 1–3.5 s. A step can set its own time with `artMoveSeconds`: the
flight across the Atlantic takes 7 s, so that the audience can follow the
globe as it turns.

## The globe in the deck

The globe is in the watch's scene, seen by the one camera (the globe task,
section 11): `withGlobe` (`watch/art.ts`) adds its meshes, its group, its
views and its piece, `globe`. The deck's instance, `ART`
(`watch/instance.ts`), is that scene. `artModel` gives the stage and the
article's views a model that adds the disc's matrix to each frame
(`withPoseGroups`), and the stills add it too. A slide shows the globe as
it shows a part of the watch:

```yaml
art: [globe]
artView: cape noir
artMove: fly
```

`art: all` leaves the globe out. The globe's piece has no extent, so a
slide that shows it names its view.

`globe/globe.test.ts` checks that a view puts its place at its slide point
with north up, that the disc faces the camera and hides the far side, that
the coast leaves out the cuts, that each land face is in one cell and on
one side of each box's edge, and that at each scale the land is drawn once.
