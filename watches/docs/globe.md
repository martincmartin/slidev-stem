# The globe and the story maps

**Covers:** Part 2's globe and its story maps: the land data, the globe's
meshes and levels, its views, the flight between them, how the globe
joins the watch's scene, and the marks of each story map and their keys
(`globeLeg`, `globeMarks`).
**Read before** you change `globe/`, `watch/art.ts`, `art/earth-data.ts`,
`art/fetch-earth.sh`, `components/StoryMaps.vue`, or the globe's
frontmatter. The rules for WebGL art
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
map's view (Cape Noir, Juan Fernández, Scilly) is the camera that fits the
map best ("The story maps"). South America and the Channel fit a list of
places into the band under the title.

## The story maps

`globe/maps.ts` holds Part 2's story maps: a flat map of each story's
place, drawn over the globe at rest. A map's parallels are straight, and
the globe's are not: on the globe, a parallel bows 23 px across the Juan
Fernández map, so a leg due west would curve. Each map has its own
projection: plate carrée, with longitude shortened by the cosine of its
centre's latitude, so that shapes near its centre are true. A map is
`StoryMap` data: its centre, the slide point where the centre shows, and
its px for a degree of latitude.

- **Its land** (`mapLand`) is made at load from the 1:10m level, as an SVG
  path in slide px, cut 20 px outside the slide so that the cut's edges do
  not show. A map can draw small islands apart, larger about their own
  centre, so that they show (`StoryMap.islands`: the Juan Fernández
  Islands, twice their size); a picture can show them later than the rest.
- **Its globe view** is the camera, north up, whose globe brings the coast
  nearest to the map's (`fitCamera`): by least squares over the place that
  the camera looks down at, where it shows, and the scale, on an even
  sample of at most 500 of the coast's points on the slide. The best place
  is not the map's centre: it is where the globe's bow is least over the
  coast that shows. Not an oversight: a camera that turns in the slide's
  plane, as the mockup's fit had, fits no better, and the house camera has
  no such turn. The gaps (median / 95th percentile / most, slide px): Juan
  Fernández 2.7 / 6.8 / 12.8, Cape Noir 2.6 / 7.3 / 14.0, Scilly
  0.4 / 0.8 / 0.9 (`globe/maps.test.ts` holds limits).

The fits take about 50 ms at load in Node, and the maps' land 10 ms.

**Over the globe.** `components/StoryMaps.vue` draws each map as an SVG
over the canvas: the slide's rectangle in the water's wash, and the land
in the paper with its coast in the subject, 3 px at every zoom
(`vector-effect: non-scaling-stroke`). The map's sea covers the globe. A
map rides the camera on its plane, which touches the globe at its view's
place (`PlacedMap.plane`, `mapOnSlide`), and shows only near its view: it
fades out as the camera zooms 1.25 times, or pans 80 px at the map's
scale, from it. So a flight hands over from the map to the globe in about
the first tenth of its progress, and back in the last, as the mockup did;
in between, the coast shows twice, a few px apart. Not an oversight: the
fade depends on the pose alone, not on a clock, so a still at rest shows
its map whole, and a slide shows a map by naming its view. The live layer
(`global-bottom.vue`) and an article's figure (`FigureLayer.vue`) move the
maps after each frame of their stage (`onFrame`); a printed page's still
(`slide-bottom.vue`) gives its pose.

## The marks

`globe/stories.ts` holds each story map's marks, in the map's slide px:
the places come from the sources, in degrees, and the map projects them
(`project`); a few are slide px off a place, so that a ship does not hide
what it is near. A story (`Story`) has:

- **Its voyage's legs** (`Leg`): a route that draws itself as a track
  over the leg's seconds, a dot where it starts and at the end of each
  day at sea (`DAY_SECONDS`, 0.7 s a day), and the way that the ship
  faces. The ship sails along the leg; a leg of one point is a place
  where the ship shows.
- **Its other marks** (`Mark`): the dashed ship where the crew thought
  they were (`estimated`), the dashed parallel, the bracket over the gap,
  the scale in statute miles, the wind (gusts that loop, masked to the
  sea), and the islands that show when they are sighted. Each mark fades
  in and out.

The colors are roles that every palette has (the production task,
section 7): ink for the track, the dots, the parallel, the bracket and
the scale; the subject for the ship, with its wash for the sails and the
second color for the pennant; the paper for the dashed ship and the
gusts.

A slide names each click's target in its frontmatter, with the click keys
of `docs/watch.md` ("The keys"):

```yaml
art: [globe]
artView: juan fernandez
globeLeg: south
globeMarks: [scale]
artClicks:
  1: { globeLeg: start, globeMarks: [scale, parallel] }
```

- `globeLeg`: the last leg that shows, with the ship at its end; the legs
  before it show too.
- `globeMarks`: the marks that show.

The names are those of the story whose map is the slide's view
(`voyageTarget`); a name that the story does not have throws.

**What a frame shows** is a pure function of the step and the frame's
clock (`voyageAt`, `globe/voyage.ts`). On a step forward within a story,
the new legs sail one after the other once the camera has come (the
stage's `viewEndAt`), and the new marks fade in then; the marks that go
fade out at once. A step back is the step forward reversed: the legs that
go sail back, from the last, and the ship with them
([`stem/docs/navigation.md`](../../docs/navigation.md), a story
animation). A jump and a still show the target at once, but for the
marks' fades. The live layer runs on the stage's clock, and an article's
figure on its own, which stands while the figure is paused; the figure is
busy until the voyage ends (`voyageEndAt`). A still shows its click's
target, and its wind stands, drawn.

`globe/voyage.test.ts` checks the names, the order of the legs, the dots,
the ship's place and heading, and the marks' fades.

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
