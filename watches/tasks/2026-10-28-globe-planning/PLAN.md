# A globe for Part 2: how hard is it?

**Status: planning, 2026-10-28.** Nothing outside this directory changed. The
request and the later messages are in [instructions.md](instructions.md). The
measurements come from [tools/measure.ts](tools/measure.ts), on Natural Earth
data, and their results are in [evidence/](evidence/). Section 10 gives the
commands.

**Revised the same day,** after the second message: the picture is a line
drawing, as in a textbook figure, and the water need not be filled. The first
version assumed a filled ocean under the land. That assumption made the land
fill the hard part. Section 4 now compares three designs, and the measurements
of the first version are the cost of a filled land (design B).

**Revised again the same day: the spike** (section 12). It draws design A,
and A with the water in a wash and the land in the paper's color, in the
house renderer, in three engines. It changed one finding: the land needs no
lift over the water (section 4, design B).

The first picture is a globe with the outlines of the continents, and
meridians every 15° on the water only. 15° of longitude is one hour of time,
which is the point of the longitude problem. Later pictures will reuse the
model: finer meridians, more detail in one region, and ship tracks (the
Scilly wreck of 1707, Anson's search for Juan Fernández in 1741).

## Summary

- **Difficulty: moderate, and less for a line drawing.** The renderer in
  `webgl/` can draw the globe with no change. A `Mesh` already takes any
  triangles, any polylines and silhouette edges (`webgl/scene.ts`). The new
  work is a globe model (about 200–300 lines of TypeScript with tests for the
  line drawing), a script that prepares the coastline data, and the slides'
  frontmatter. Section 9 lists the work.
- **Something must still hide the far side.** The renderer hides a line only
  behind a face. **Use a disc through the globe's center that faces the
  camera** (section 13), not a sphere of faces: with the orthographic camera
  it hides exactly the far hemisphere, its rim is the true limb, and it is
  360 triangles in place of 14,160. It needs its matrix from the camera at
  each frame, a small change to `webgl/stage.ts`. Its fill is the paper, or
  the water's color. The renderer
  accepts this today: a fill at opacity 0 is the paper, and it writes depth.
  The house check `scenecheck` refuses it, so that check needs a rule for a
  paper face (section 5).
- **With no land fill, there are no land triangles,** and no triangulation.
  The globe is the paper sphere, its outline, the coast lines and the
  meridians (design A). The hard part of the first version goes away.
- **Water in a wash (design B) costs a triangulation of the land:** earcut,
  its `refine`, and a cut along the sphere's own grid of meridians and
  parallels. Then each land piece is in front of the water's face of its
  cell, with no lift (section 4). At 1:50m this is 106,003 triangles in 44 ms
  (3° grid) or 165,060 in 66 ms (1.5°).
- **Land and water triangles that share edges (design C)** remove the overlap
  of land and ocean. But the outline still limits the size of the triangles,
  and the water must be triangulated too. It costs more than B and gains
  nothing over it.
- **Data: Natural Earth, public domain.** Use 1:50m for the whole globe and
  the Atlantic: at the whole-globe size, its median segment is 0.6 slide px.
  1:110m is coarser (5 px segments) and has no Scilly and no Juan Fernández.
  1:10m has both, but Scilly is only 2 outlines with 18 points (section 3).
- **Meridians on the water** are cheap: one pass over the coastline for each
  meridian. At 1:50m, the 24 meridians make 236 stretches on water (section
  6).
- **Desktop: fine, measured** (section 12). On this laptop, at full screen
  and 1:50m, a frame with `gl.finish()` takes 0.3 ms in Chromium and 4–5 ms
  in Firefox, and no engine drops a frame at 60 Hz. Even the whole 1:10m
  coast (440,000 segments) takes 0.3 ms in Chromium and 8 ms in Firefox.
  **A phone is not measured yet:** the spike's page shows its own frame
  times, so a phone on the same network can open it (section 12).
- **Recommendation:** the house renderer (option 1 of section 2), with the
  disc. Build A and B as one model with a switch, so that you can see both
  before you choose. The sea is the house role `water-wash`, the pool's own
  water, and the coast is `subject` or `ink` (sections 14 and 15). The
  frontmatter keys: K1, with the prefix `art` (section 11).

## 1. What the picture needs

- A line drawing of the globe, like a textbook figure: its outline (the
  limb), the coast lines, and meridians every 15° on the water. Hidden lines
  are removed: nothing on the far side shows.
- The water is not filled. The land may be blank, or filled with a flat wash.
  The house style draws structure, not surfaces, so a stipple (as in the
  textbook figure) is out ([`docs/illustrations.md`](../../../docs/illustrations.md),
  "A surface").
- "Water" is the oceans and the seas. The lakes are land in Natural Earth's
  land layer, so a meridian crosses Lake Superior (90° W) as land. The Black
  Sea and the Caspian Sea are water: 30° E is on water from 45.8° N to 41.2°
  N. No 15° meridian crosses the Caspian (it is between 46.7° E and 54.7° E),
  but a finer meridian does: 51° E is on water from 47.1° N to 36.8° N, with
  one gap. Check with the speaker that an inland sea is "water" for the talk.
- A camera that turns the globe and zooms to a region, with the same moves as
  the watch: a fly from the whole globe to the Atlantic is a move of the
  camera.
- Later: meridians every 1° or 0.5° in a region, finer coasts in a region, and
  ship tracks.

## 2. Ways to draw it

### 1. The globe in the house renderer (recommended)

The globe is more meshes in the one scene, drawn by `webgl/`.

- **The camera already turns a globe.** With the polar axis along the world's
  $z$, the camera's turn is the longitude, and its tilt is
  $90° - \text{latitude}$ of the point at the center (`CameraAngles`). North
  stays up on the slide. Southern points need a tilt above 90°; nothing in
  `webgl/` limits the tilt. The `together` move flies, zooms and turns at once
  (`mixCamera`).
- **Lines keep the house widths at every zoom**, and hidden lines and fades
  work as for the watch.
- **One live canvas and one rule for every change**
  ([`docs/webgl.md`](../../../docs/webgl.md), "Motion and slides"). The watch
  and the globe can be on the screen together.
- **Float32 is precise enough for the later zooms.** With the radius at 500
  world units, a step of the float is 0.4 m on the Earth. At a Scilly zoom of
  0.15 km per slide px, that is 0.003 px.
- Against: the frame cost on a phone is not measured (section 7).

### 2. SVG or Canvas 2D, with d3-geo

d3-geo projects the globe orthographically, clips to the visible hemisphere
and draws graticules. An SVG mask with the land would hide the meridians on
land.

- For: a known library; a still line drawing is easy, and the clip to the
  visible hemisphere does the hidden-line removal.
- Against: a second way to draw art, outside the live canvas and its moves. No
  3D camera moves with the watch. Each frame of a turning globe projects every
  point again in JS: about 60,000 points at 1:50m (section 3). It is a new
  dependency. The house rule keeps SVG for small, still or simply looping art
  ([`docs/webgl.md`](../../../docs/webgl.md), "When to use it").

### 3. A globe library (globe.gl with three.js, CesiumJS, MapLibre's globe)

- For: a globe on day one.
- Against: hundreds of kB to several MB of code. Their own line and lighting
  models do not follow the house style. MapLibre needs tiles, and the talk
  must work offline. The deck would have a second WebGL context and a second
  camera.

### 4. Pictures or video made ahead of time (Blender, or a d3 render)

- For: no work at load; any look.
- Against: no live zoom, no change of palette, no line widths at each zoom.
  Each new view or track is a new render. The house chose live art over
  generated pictures for the watch for these reasons
  ([`2026-09-28-webgl-planning`](../2026-09-28-webgl-planning/PLAN.md)).

### Ranking

1. **The house renderer**: it reuses the camera, the moves, the lines, the
   palettes and the checks, which took most of Part 1's work.
2. **SVG with d3-geo**: good for a still globe. It cannot join the watch's
   moves, and it pays for each turning frame in JS.
3. **A globe library**: the most code and the least house style.
4. **Pictures made ahead of time**: fails the later zooms and tracks.

## 3. The data

[Natural Earth](https://www.naturalearthdata.com/) is in the public domain, so
the README's licence rule allows it. Write its source and its licence in the
README of its directory. The measurements use its GeoJSON at commit
`ca96624` of `nvkelso/natural-earth-vector`
([evidence/natural-earth-commit.txt](evidence/natural-earth-commit.txt)).

The globe's radius is 500 world units: about 1,000 px high on the 1920 × 1080
slide. Then 1° is 8.73 slide px, and 1 slide px is 12.7 km.

**Correction, 2026-10-28: the talk's slide is 980 × 552 px**
(`watch/design.json`, `canvas`), not 1920 × 1080. Line widths are in these px.
The whole globe is then at scale 0.5 (500 px high), so each "px at the
whole-globe zoom" in sections 3–7 and 13 is half of what it says: 1° is 4.36
px, and 1 px is 25.5 km. The world-unit numbers (sags, $\tau$, lifts) do not
change. The spike's first pictures had the same error, so their lines were
half as thick as the watch's (section 12).

| Scale  | Coast segments | Median segment   | Longest | Coast as Float32, gzip | Land polygons |
| ------ | -------------: | ---------------- | ------: | ---------------------: | ------------: |
| 1:110m |          4,994 | 0.57° = 5.0 px   |   3.19° |                  37 kB |           127 |
| 1:50m  |         58,987 | 0.069° = 0.60 px |   1.23° |                 386 kB |         1,421 |
| 1:10m  |        406,824 | 0.014° = 0.12 px |   0.50° |               2,329 kB |         6,837 |

For comparison, the built deck's JavaScript is 322 kB before gzip.

The islands of the later stories (points in a box around each):

| Region                   | 1:110m | 1:50m          | 1:10m           |
| ------------------------ | ------ | -------------- | --------------- |
| Isles of Scilly          | none   | none           | 2 lines, 18 pts |
| Land's End to the Lizard | 2 pts  | 11 pts         | 83 pts          |
| Robinson Crusoe Island   | none   | 1 line, 13 pts | 1 line, 34 pts  |
| Alejandro Selkirk Island | none   | none           | 1 line, 12 pts  |

- **The whole globe and the Atlantic: 1:50m.** Its segments are at the limit
  of a pixel at the whole-globe size, and at 2–3 times that zoom.
- **Anson's search: 1:10m is enough.** A view from Juan Fernández to the
  Chilean coast is about 900 km wide: 0.9 km per slide px. The 1:10m median
  segment is 1.6 km, and Robinson Crusoe Island has 34 points.
- **The Scilly wreck needs another source.** At a zoom that shows the rocks
  (0.15 km per px), the 18 points of 1:10m are two blobs. The candidates are
  GSHHG at full resolution (LGPL) and OpenStreetMap's coastline (ODbL: a copy
  of its data must stay under ODbL). Both allow a public repository. Only a
  small region is needed: a few kB.
- **Ship only what each view needs.** The whole 1:10m coast is 2.3 MB after
  gzip. A script cuts a region out of it, or out of GSHHG, ahead of time.

## 4. Three designs, and the size of the triangles

### Why a triangle's size matters

A flat triangle with its corners on the sphere is a chord: its middle is
under the sphere. A chord of angle $\theta$ sags by

$$
s = R\left(1 - \cos\frac{\theta}{2}\right) \approx \frac{R\theta^2}{8}.
$$

At $R = 500$, a 20° edge sags 7.6 units, and the middle of a 20° triangle
about 10. Earcut makes long, thin triangles: at 1:50m the worst one's middle
sags 109 units (the table below).

The sag matters in two places:

- **Where two sets of faces overlap.** If the land is a second layer over a
  sphere, a land triangle that sags more than the sphere under it is covered.
  The first version of this plan assumed a filled ocean under the land, and
  so had this problem.
- **At the globe's outline,** in every design. The outline of the globe is
  the outline of its triangles. A triangle that sags $s$ pulls the outline in
  by $s$ px (at the whole-globe zoom; $s$ times the zoom in general). In the
  gap, the far side's lines show, and so do its faces: the renderer does not
  cull back faces. The limb's line covers a gap of up to half its width: 1 px
  for a 2 px line. So each triangle must sag less than about 1 px at the
  zooms that show the limb.

### Design A: a line drawing, with blank land (recommended)

- **A paper sphere hides the far side.** It is a sphere of facets on a grid
  of meridians and parallels, filled with the paper's color (section 5). A
  facet between two meridians and two parallels is flat, so the grid has no
  slivers. Its sag has a limit that the grid's step sets:

  | Step | Triangles | Limb edges | Worst sag | Limb's jump as it turns |
  | ---: | --------: | ---------: | --------: | ----------------------: |
  | 1.5° |    57,120 |     57,360 |     0.086 |                 0.04 px |
  |   3° |    14,160 |     14,280 |     0.342 |                 0.17 px |

  The jump is about $R\pi^2/2N^2$ for $N$ facets around. At 3°, the gap at
  the outline is 0.34 px at the whole-globe zoom, and 1 px at 3 times that
  zoom. Use 1.5° if the Atlantic view shows the limb at more than 3 times.
- **The coast lines and the meridians** are lines on the true sphere, at
  radius $R$. The facets are inside the sphere, so a line on the near side is
  always in front of them. A line on the far side is hidden. Near the limb, a
  far line is hidden once it is $\tau$ behind the near surface ($\tau = 0.25$,
  the renderer's `HIDDEN_LINE_TOLERANCE`). That is within $\tau/2R$ radians of
  the limb, under the limb's line.
- **No land triangles, and no triangulation.** The load is the parse of the
  data and the lines: a few ms.

### Design B: as A, with the water in a wash and the land in the paper

(The first version of this plan had the land in a wash over a paper sphere.
The geometry is the same either way: one fill over the other.)

- The sphere is filled with the water's wash. The land is a second layer of
  faces over it, in the paper's color, with the coast on its edges.
- **Cut the land along the sphere's own grid, and it needs no lift.** Each
  land piece is then inside one cell. Its corners are on the sphere inside
  that cell, and the sphere there is in front of the cell's flat face. So
  each piece is in front of the water's face, or on it at the cell's edges.
  There, the renderer's `overlay` (a polygon offset) makes the land win. The
  spike's test checks every piece (`spike/globe.test.ts`).
- **Not an oversight: no lift.** The first idea was to lift the land a little
  over the water. The spike showed that this is worse. The lift leaves a ring
  outside the water's limb, as wide as the lift, where nothing hides the far
  side. The far side's coast lines showed in it, up to 2.4° past the limb at a
  lift of 0.43, and they broke the limb's line.
- The cost is the triangulation. The measurements below give it. Each method works on Natural Earth's land in longitude and
  latitude, then puts it on the sphere. The test is the sag of each
  triangle's centroid, against $\tau$ (Node 26.12, Apple M3 Pro, one run
  each).

| Method                                   | Scale  | Triangles |   Time | Worst sag | Over $\tau$ |
| ---------------------------------------- | ------ | --------: | -----: | --------: | ----------: |
| Earcut, a point every 2° inside the land | 1:50m  |    61,338 | 114 ms |     108.7 |       5,404 |
| The same, then earcut's `refine`         | 1:50m  |    61,338 | 115 ms |      94.0 |       1,976 |
| Earcut, then cut along a 1.5° grid       | 1:50m  |   252,222 | 194 ms |     0.076 |           0 |
| Earcut, `refine`, then the 1.5° grid cut | 1:110m |    60,281 |  26 ms |     0.076 |           0 |
| Earcut, `refine`, then the 1.5° grid cut | 1:50m  |   165,060 |  66 ms |     0.076 |           0 |
| Earcut, `refine`, then the 1.5° grid cut | 1:10m  |   617,837 | 308 ms |     0.076 |           0 |

- **The points inside the land do not help.** Earcut does not make good
  triangles: a few still span tens of degrees (Antarctica's, for example).
  The points also make earcut's area wrong by 1–2% (`worstDeviation` in the
  evidence). Earcut's `refine` (Lawson flips toward a constrained Delaunay
  triangulation) removes most slivers, but not all.
- **The grid cut always works.** A triangle and a grid cell are both convex,
  so each piece is convex, and a fan triangulates it. Each piece is inside one
  cell, so its sag has a limit. Two triangles that share an edge cut it at the
  same points (`meet` takes the edge's two ends in one order), so there is no
  crack. Earcut's area is exact before the cut (deviation 0).
- **`refine` before the cut** gives 35% fewer triangles at 1:50m, and makes
  the cut 3 times faster.

The grid's step (earcut, `refine`, then the cut; the files
`evidence/measurements-step-*.json`):

| Step | 1:110m triangles, time | 1:50m triangles, time | Worst sag |
| ---: | ---------------------: | --------------------: | --------: |
|   1° |         102,352, 49 ms |         233,857, 95 ms |     0.034 |
| 1.5° |          60,281, 26 ms |         165,060, 66 ms |     0.076 |
|   3° |          27,812, 11 ms |         106,003, 44 ms |     0.305 |
|   5° |           17,455, 7 ms |          84,882, 39 ms |     0.846 |

With no lift, the sag is not a limit for B: any grid step keeps the land in
front of the water. The step only sets how close the limb is to a circle
(design A's table). Use the sphere's step: 3°.

The times are Node (V8, as in Chrome) on this laptop. The watch takes 10 ms
in Chromium and 20 ms in Firefox at load
([`docs/webgl.md`](../../../docs/webgl.md)). So B at 1:50m adds 45–70 ms in
Chrome and perhaps twice that in Firefox. A phone is slower by a factor that
this task did not measure.

### Design C: land and water triangles that share edges

The land and the water are one surface, in two inks: no triangle is over
another, so neither can cover the other.

- For: no overlap of land and water.
- Against: B has no overlap problem either, once the land is cut on the
  sphere's grid. The outline still limits the size of every triangle (above),
  so the land needs the same grid cut as B. And the water must be
  triangulated too. The water is the sphere less the land, and in longitude and latitude
  the land touches the edges of the map (Natural Earth cuts the land at 180°
  and along the South Pole). Earcut needs holes that do not touch the outer
  ring, so this needs more code than B.

### Ranking

1. **A**: the picture that was asked for, with no triangulation, and the
   least to draw in each frame.
2. **B**: if the water must read as water at a glance, as in the zoomed
   views (section 12). It adds one known step (the grid cut), measured
   above, and about 100,000 triangles at 1:50m.
3. **C**: the same grid cut as B, and more code.

A and B share every part but the fills, so one model can draw both, with a
switch (the spike does).

## 5. How the globe fits the renderer

(Section 13 replaces the paper sphere and its limb, below, with a disc that
faces the camera. The rest of this section holds.)

All parts are plain `Mesh`es. None needs a change to `webgl/`.

- **The paper sphere:** a mesh with a fill at opacity 0. The renderer mixes a
  fill below 1 with the paper, so opacity 0 is the paper, and the face still
  writes depth. A dim or a flash leaves it the paper. `checkScene` accepts it.
  The house check `tools/scenecheck.py` refuses it ("a face is solid"): add a
  rule there for a paper face, and say in
  [`docs/webgl.md`](../../../docs/webgl.md) what it is for. A holdout
  (`Mesh.holdout`) is not the tool: it must be flat, and a scene has at most
  32.
- **The limb:** the paper sphere's edges as `SilhouetteEdge`s. The renderer
  draws them only where the view turns the surface, as for a cylinder's
  walls. Use only the edges between meridians and parallels: a diagonal is
  never on the limb, because its two triangles are in one plane.
- **The coast lines:** from the land's rings, at radius $R$. Leave out the
  edges that Natural Earth adds at 180° and along the South Pole: they are
  cuts, not coasts. No coast segment needs a split: a segment longer than
  $2\arccos(1 - \tau/R) = 3.62°$ could sag below $\tau$, and the longest is
  3.19°, at 1:110m.
- **The meridians:** lines at radius $R$, with points every grid step.
- **The land (B only):** the triangles of section 4, at $R$, cut on the
  sphere's grid, with `overlay`.
- **The inks.** The palette has roles for a coast: `ground` (a line) and
  `ground wash` (a face), "where two materials meet", and `water`
  ([`docs/theme.md`](../../../docs/theme.md), "The roles"). The WebGL inks
  (`INKS` in `webgl/scene.ts`) do not have them yet. Adding them is a change
  to `webgl/scene.ts` and `watch/palette.ts`, or the globe uses the subject's
  and the muted roles.
- **The water's wash is a new role.** `theme.md` gives water no wash yet
  ("water is drawn as a substance"), and says to add a wash when a drawing
  first needs a face for that line color. The ocean is that face. The spike
  makes it as the ground's wash is made: `color-mix(in srgb, water 18%,
  paper)`. Adding `--palette-water-wash` to every palette is a change to a
  house item (`docs/talks.md`, "Change a house item"), with the palette
  gates of `theme.md`.
- **A line below opacity 1 shows a dot at each joint.** The renderer draws
  each segment with round ends, so two segments overlap at a joint, and at
  opacity 0.5 the overlap is darker. A meridian has a joint at each grid
  line. Draw it opaque, in a lighter color: the spike mixes the ink 50% with
  the paper.
- **Placement.** The globe's center is the views' pivot. The depth of the
  scene is ±2,000 world units (`DEPTH_RANGE`), and the globe is ±500.

## 6. The meridians on water

Walk each meridian from the North Pole, which is on water. Each crossing of a
land ring toggles between water and land (the function `waterStretches`). One
pass over the rings for each meridian: under 1 ms at 1:50m.

| Scale  | 15° meridians | Stretches on water |
| ------ | ------------: | -----------------: |
| 1:110m |            24 |                128 |
| 1:50m  |            24 |                236 |
| 1:10m  |            24 |                338 |

Finer scales have more stretches because they have more small islands. Each
island cuts the meridian, and its coast line covers the cut.

For later, finer meridians (every 1° or 0.5°) use the same function, and
need no grid line. A line's points are on the sphere, outside the facets.
Between two points, the line is a chord of its own: with points every 1.5°,
it sags at most 0.043. So it is at most that far under a facet, which is less
than $\tau$, and no facet on the near side hides it.

## 7. Desktop and mobile

**Measured since:** section 12. The estimate below came first.

Per frame, against the watch:

| What                                | Watch  | A, 1:50m, 3° | A, 1:110m, 3° | B, 1:50m, 3° |
| ----------------------------------- | -----: | -----------: | ------------: | -----------: |
| Line segments (coast and meridians) | 15,467 |      ~62,000 |        ~8,000 |      ~62,000 |
| Silhouette edges (the limb)         |      — |       14,280 |        14,280 |       14,280 |
| Triangles                           |      — |       14,160 |        14,160 |      120,163 |

The watch measured 0.7–0.9 ms of GPU a frame in Chromium on this laptop, and
2–3 ms in Firefox ([`../../docs/watch.md`](../../docs/watch.md), "Budgets, as
measured"). **The globe was not measured.** A linear guess from the line
count gives 3–4 ms in Chromium for A at 1:50m. The guess is weak: most
silhouette edges draw nothing, and the GPU time of a line depends on its
pixels more than on its count. A phone's GPU is slower by a factor that this
task did not measure.

The article is desktop first, and reading on a phone is a later goal
([`../../docs/article.md`](../../docs/article.md)). A figure there is a crop
of the slide, and a phone is about 400 CSS px wide. At that size, 1:110m's
segments are 1–2 CSS px. So a phone can use 1:110m with no loss that a
reader sees.

If the spike shows that a frame costs too much, three ways, from the least
work:

1. **Draw no frame when nothing moves.** `Stage` draws at each animation
   frame (`webgl/stage.ts`), also when the picture is still. A still globe
   then costs nothing, and a phone's battery lasts longer. This is a change
   to `webgl/`, and the watch gains too.
2. **Fewer coast points on a small screen**: 1:110m, or 1:50m simplified to
   0.5 px (not measured).
3. **A limb with no silhouette edges**: a circle in the plane that faces the
   camera. This needs a new kind of line in `webgl/`, or a group matrix that
   follows the camera.

Touch input (drag to turn the globe) is not in the renderer or in the
article. It would be new work, if you want it.

## 8. Later: finer lines, regions and tracks

- **Finer meridians in a region:** the same `waterStretches`, on a spacing
  that the slide gives (section 6).
- **Finer coasts in a region:** a separate model for the region, made ahead
  of time from 1:10m (Anson) or GSHHG or OpenStreetMap (Scilly). See "A
  region as a model of its own", below.
- **Ship tracks:** lines on the sphere, with points every grid step or
  closer. A track that draws itself over time is a dynamic mesh or a model's
  story (`Model` in `webgl/stage.ts`), as the watch's winding key is.
- **The equator and labels** (15° W, "one hour"), as in the textbook figure.
  The equator is a line at radius $R$ on a grid line. A label is HTML on the
  slide, at a projected point of the model, as the watch's callouts are.

### A region as a model of its own

The Scilly wreck and Anson's search can be models of their own, not regions
of the globe. The globe flies and zooms to the place, and then the picture
changes to the region's model. Three ways to change:

- **R1. The region's model on the sphere, at the same place.** Its coast and
  tracks use the same `toSphere`, so they lie where the globe's do. At the
  end of the camera's move, the one rule fades the globe's pieces out and
  the region's in, in the same place. Only the detail changes: the finer
  coast replaces the coarser one. Over the Scilly view (about 800 km), the
  sphere is within $R(1 - \cos 3.6°) \approx 1$ world unit of flat, so the
  region's model can be flat in its own code if that is simpler, placed on
  the sphere's tangent plane there.
- **R2. The region's model elsewhere in the scene, in a look of its own** (a
  flat chart, as a navigator of 1741 drew it, in Mercator). The camera
  zooms into the globe, everything fades out, the camera jumps to the chart,
  and the chart fades in. The one rule does this now: with nothing on the
  screen, the camera jumps (`docs/webgl.md`, "Motion and slides").
- **R3. The region in a scene and canvas of its own.** This is K2b of section
  11, with its costs.

R1 and R2 are both one scene and separate models: a model is code that makes
meshes, not a scene. R1 is the most continuous: the coast gains detail in
place. R2 suits a region whose picture is not a globe (a chart with a
compass rose and a track). They can mix: R1 for Scilly, R2 for Anson. R3
costs the most, and gives nothing that R1 and R2 do not. No decision is
needed now.

## 9. The work, and the decisions to make first

The work, for design A:

1. A script that reads Natural Earth's land (1:50m, and 1:110m if a phone
   needs it) and writes a compact file into the talk, with coordinates to 4
   decimals (11 m). Its README gives the source and the licence. The
   generated-file check (`art:generated`) covers it.
2. A globe model in TypeScript, at load: the disc and its rim (section 13),
   the coast lines, and the meridians on water. The stage gives the model the
   camera's angles at each frame, so that the disc faces the camera. Tests: the coast leaves out the
   cuts at 180° and at the South Pole; the meridians' stretches at known
   places (the Atlantic at 30° W).
3. A paper face: a rule in `tools/scenecheck.py`, and a line in
   [`docs/webgl.md`](../../../docs/webgl.md).
4. The rename of the stage's keys to `art…` (section 11), in its own commit
   before the globe.
5. Pieces and views for the slides, and the inks. The scene, stills and print
   checks (`scenecheck.py`, `barroom.py`, `art:print`) then cover the globe.
6. The browser checks of [`docs/talks.md`](../../../docs/talks.md), "Browser
   support", in three engines, and a frame measurement on a phone.

For design B, add the land: earcut, `refine` and the cut on the sphere's
grid, with tests (no crack, each piece in front of its cell's face, earcut's
area exact), the water's wash role, and the ground and water inks.

Decisions for you, before the build:

- **The sea's color** (section 14): how strong, and the coast's line color.
- **Water in a wash (B) or not (A)?** You want to see both: build one model
  with a switch. The land is in the paper's color in both (2026-10-28).
- **The frontmatter keys:** decided, K1 with `art` (section 11).
- **"Mobile"** is the article on a phone, not the deck. A reader does not turn
  the globe by touch (2026-10-28). So the phone needs the figures to draw
  fast enough, and nothing else.
- **The inks:** add `ground`, `ground wash` and `water` to the WebGL inks, or
  draw the globe in the subject's and the muted roles.

**Next step:** a frame measurement on a phone (section 12). Then the build.

## 10. Commands

From the talk's directory (`watches/`), so that `earcut` is the talk's copy
(3.2.4, ISC):

```bash
sh tasks/2026-10-28-globe-planning/tools/fetch.sh NE_DIR
node tasks/2026-10-28-globe-planning/tools/measure.ts NE_DIR tasks/2026-10-28-globe-planning/evidence/measurements.json
for step in 1 3 5; do
  node tasks/2026-10-28-globe-planning/tools/measure.ts --step $step NE_DIR \
    tasks/2026-10-28-globe-planning/evidence/measurements-step-$step.json
done
# the spike: its tests, its server, and its frame times
NE_DIR=NE_DIR node --test tasks/2026-10-28-globe-planning/spike/globe.test.ts
# the sea's color in each palette, at the repo root
PYTHONPATH=tools uv run python watches/tasks/2026-10-28-globe-planning/tools/palette_globe.py
NE_DIR=NE_DIR pnpm exec vite --config tasks/2026-10-28-globe-planning/spike/vite.config.ts --host
node tasks/2026-10-28-globe-planning/tools/frames.ts http://localhost:5199/ tasks/2026-10-28-globe-planning/evidence/frames
```

`frames.ts` writes a picture for each engine and setting; the task keeps
Chromium's only, at half size for the laptop's (section 12).

The Natural Earth files are 25 MB, so they are not in the repo. `fetch.sh`
gets them at the pinned commit. The times change from run to run. The counts,
sags and stretches do not.

## 11. The frontmatter keys

### What the keys are now

A slide says what the live art shows with keys that start with `watch`.
`watch/state.ts` reads them all (`watchState`), then splits them by the layer
that uses them:

- **The stage's keys** (`stageState`): what `webgl/` does for any model. The
  pieces (`watch`), the view, tilt and turn (`watchView`, `watchTilt`,
  `watchTurn`, `watchBand`, `watchRight`), the moves (`watchMove`,
  `watchMoveWith`, `watchMoveAlso`), the fades (`watchLater`, `watchCut`,
  `watchGoLater`, `watchLinger`, `watchHide`), `watchDim`, `watchFlash`,
  `watchFlashAfterMove`, and `watchClicks`. `slides.md` uses them 127 times.
- **The watch model's keys** (`modelState`): what only the watch does.
  `watchSpin`, `watchAtRest`, `watchLapse`, `watchMainspring`, `watchWind`,
  `watchUnwind`, `watchTickTock`, `watchTimeScale`. `slides.md` uses them 25
  times.

A `Stage` (`webgl/stage.ts`) has one scene, one camera, one timeline and one
`Model`. The deck has one stage on one canvas (`global-bottom.vue`), and the
article shares one renderer for its figures (`webgl/shared.ts`). The stills,
the print check (`data-watch` on the canvas) and the article (`watch/article.ts`)
all read the same parsed state.

### The real choice: one scene or two

The key names follow from a choice that is not about names: is the globe in
the same scene as the watch, or in a scene of its own?

- **One scene.** The globe's meshes join the watch's scene, as more pieces. One
  camera frames them. The `Model` becomes two models side by side: each gives
  the matrices of its own groups, and a small model joins them (new, but
  short).
- **Two scenes.** The globe has its own renderer, stage, timeline and canvas.

### The options

**K1. General names for the stage's keys; the model's keys keep the model's
name.** For example `art: [globe]`, `artView: atlantic`, `artTilt: 70`, and
still `watchSpin: 6`. The globe's own keys, when it has some (a ship's track,
a meridian spacing), are `globe…`. One scene.

- For: the name says which layer reads the key, as the code already does. One
  parser. A step from a watch slide to a globe slide follows the one rule:
  the camera moves while the watch fades out and the globe fades in.
- Against: a one-time rename of 127 uses in `slides.md`, the parser, and about
  20 files that name the keys (code, tests and docs). It is mechanical, and
  the deck's checks catch a key that is wrong: an unknown key throws when the
  deck loads.

**K2. The globe gets its own copy of the stage's keys** (`globe`,
`globeView`, `globeTilt`, ...), and the watch keeps its keys. Two forms:

- **K2a, one scene.** Both sets of keys go to the one camera. A slide that has
  both `watchView` and `globeView` asks for two views from one camera, so
  the parser must refuse it or choose one. The parser reads each stage key
  twice, under two prefixes. This is K1 with two names for each key.
- **K2b, two scenes.** The globe has its own stage and canvas. Its keys are
  then natural. But every part that assumes one stage needs a second copy:
  the canvas layer, the stills, the print check, the article's shared
  renderer. That is a second WebGL context in the deck, and more in the
  presenter view. A step from the watch to the globe is two separate fades,
  not one move.

**K3. Keep the names: `watch: [globe]`.** One scene, no rename. The same
machinery as K1, with names that mislead the next reader.

### Is it only a matter of names?

- **K1 against K3: yes.** They are the same machinery: one scene, one parser,
  the same abilities. Only the names differ, and K1's names say what reads
  each key.
- **K1 or K3 against K2b: no.** That is the choice between one scene and two,
  and it changes what the deck can do (below) and how much code there is.
- **K2a** gives nothing that K1 does not, and adds a rule for slides that
  name both.

### Watch and globe on one slide

There is no plan for this, but the options differ:

- **One scene (K1, K2a, K3):** a slide can show both in one picture. There is
  one camera, so both are seen from it: the watch tilts when the globe's view
  tilts. To turn the globe alone (for example, the Earth turns while a watch
  ticks next to it), the globe model must turn the globe with its group's
  matrix, not with the camera. K2a must also decide which view the camera
  takes.
- **Two scenes (K2b):** two pictures, one over the other or side by side,
  each with its own camera and moves. Neither hides the other's lines, and
  their moves are not one move.

Both scenes can show both things. One scene gives one 3D picture and a shared
camera. Two scenes give two pictures with separate cameras.

### Recommendation

**K1.** It is the one option that is both one scene and honest names. Its
cost is a one-time, mechanical rename. The rename is a change to the talk: do
it in the build, not in this spike.

**Decided, 2026-10-28: K1, with the prefix `art`** (`art`, `artView`,
`artTilt`, `artTurn`, `artFlash`, ...), the docs' word for the live drawings.
The watch model's keys stay `watch…`, and the globe's own keys will be
`globe…`. Slidev has no frontmatter key that starts with `art`.

## 12. The spike

[spike/](spike/) draws the globe with a copy of the renderer (`spike/webgl/`,
from `webgl/` at commit `adeefe8`, unchanged). `spike/globe.ts` is the model;
`spike/main.ts` is a page with controls (`occluder` chooses the sphere or the
disc of section 13) and its own frame times;
`spike/globe.test.ts` checks the model in Node. The palettes are copies of
Ledger and After-Hours (`spike/palettes/`).

**The spike maps the globe's roles onto the renderer's inks** in the palette
it gives the renderer, so the renderer needs no change: the coast is the
ground (in the `muted` ink), the water's wash is the `mutedWash` ink, the limb
is the subject, and the meridians are the ink mixed 50% with the paper. A
build adds the inks instead (section 5). The look (widths, colors) is a first
guess, not checked against `docs/legibility.md`.

### The page's settings

- `scale`: the Natural Earth data: 110m, 50m or 10m.
- `water`: `none` (the line drawing) or `wash` (the sea filled, the land over
  it in the paper).
- `view`: the whole globe, the Atlantic, the approach to the Channel, or the
  sea off Chile.
- `spin`: 1 turns the globe; 0 holds it still.
- `step`: the grid in degrees, 1.5 or 3. It sets the cells of the sphere (with
  `occluder=sphere`), the cut of the land (with water), and a point on each
  meridian at each grid line. A finer grid gives a rounder sphere and more
  triangles.
- `palette`: Ledger or After-Hours.
- `width`: the canvas's largest width in CSS px, to see a figure's size on a
  phone: full, 400 or 800.
- `finish`: 1 calls `gl.finish()` after each draw, so the "draw" time includes
  the GPU's work; 0 times only the JS that sends the work. It changes the
  measurement, not the picture.
- `occluder`: `sphere` or `disc` (section 13).

**The slide's size was wrong at first.** The spike used a 1920 × 1080 slide;
the talk's is 980 × 552. Line widths are in slide px, so the spike's 2 px
lines were half as thick as the watch's (the hairspring is 2 px, in the
subject's ink). Fixed: the spike's slide is 980 × 552, and its views' scales
are halved, so the globe keeps its place on the slide. The pictures and the
times below are from after the fix.

### The pictures

[evidence/frames/](evidence/frames/) holds Chromium's pictures of each setting
(laptop size at half scale, and phone size). For example:

- [the whole globe, line drawing](evidence/frames/chromium-laptop-50m-none.png)
  and [with water](evidence/frames/chromium-laptop-50m-wash.png);
- [the Atlantic in After-Hours, with water](evidence/frames/chromium-laptop-50m-wash-atlantic-after-hours.png);
- [Anson's search, line drawing](evidence/frames/chromium-laptop-10m-none-anson-0.png)
  and [with water](evidence/frames/chromium-laptop-10m-wash-anson-0.png): with
  no fill, the Chilean coast is hard to tell from the sea;
- [the approach to the Channel, with water](evidence/frames/chromium-laptop-10m-wash-scilly-0.png):
  Scilly is the two blobs of 1:10m (section 3).

Firefox and WebKit draw the same pictures: their crops of the limb, side by
side with Chromium's, showed no difference. Their pictures are not kept.

### The frame times

`tools/frames.ts` opens each setting in Playwright's Chromium, Firefox and
WebKit (headless, on this laptop's GPU: each reports Apple M3 Pro or "Apple
GPU"), lets the globe turn for 5 s, and reads the page's times. A draw is
`renderer.render` and `gl.finish()`: the JS and the GPU's work, as the
watch's budget was measured. Laptop size: 1512 × 950 CSS px at ratio 2
(3024 × 1701 device px). Phone size: 390 × 844 at ratio 3, on the laptop's
GPU, so it measures the pixels, not a phone. Medians, with the 95th
percentile after the slash (`evidence/frames/frames-*.json`):

| Setting (laptop size)        | Triangles | Segments | Chromium draw | Firefox draw | Build, Chromium |
| ---------------------------- | --------: | -------: | ------------: | -----------: | --------------: |
| 1:110m, line drawing, sphere |    14,160 |    6,080 |    0.2/0.4 ms |      3/5 ms  |           15 ms |
| 1:50m, line drawing, sphere  |    14,160 |   60,140 |    0.2/0.5 ms |      4/6 ms  |           36 ms |
| 1:50m, water, sphere         |   120,163 |   60,140 |    0.2/0.5 ms |      4/6 ms  |          109 ms |
| 1:10m, line drawing, sphere  |    14,160 |  439,847 |    0.2/0.5 ms |      6/8 ms  |          128 ms |
| 1:10m, water, Scilly view    |   530,619 |  439,847 |    0.2/0.5 ms |      4/7 ms  |          494 ms |
| 1:50m, line drawing, disc    |       360 |   60,500 |    0.2/0.5 ms |      4/6 ms  |           36 ms |
| 1:50m, water, disc           |   106,363 |   60,500 |    0.3/0.5 ms |      5/7 ms  |          101 ms |
| 1:10m, line drawing, disc    |       360 |  440,207 |    0.2/0.5 ms |     8/11 ms  |          118 ms |

- **No engine dropped a frame at 1:50m.** Chromium drew at 60 Hz (95th
  percentile between frames: 16.7–16.8 ms), Firefox at 120 Hz (8.5–9.2 ms),
  and WebKit at 60 Hz (17–18 ms; its timer has 1 ms steps). The speaker's
  laptop is 120 Hz (8.3 ms a frame), which Firefox's 4–6 ms at 1:50m fits.
  At 1:10m with the disc, Firefox's 95th percentile was 16.6 ms: it missed
  some 120 Hz frames. The whole 1:10m coast is not a planned view.
- **WebKit's draws are under its 1 ms timer step** (median 0, 95th
  percentile 1 ms). Firefox's timer also has 1 ms steps.
- **The phone-size page costs the same** as the laptop-size page, on the
  same GPU: the cost is in the segments, not in the pixels.
- **The build** (the model's meshes, at load) is 28 ms at 1:50m and 99 ms
  with water (the land's triangulation). The load of the GeoJSON is extra; a
  compact file made ahead of time would cut it.

### What the spike found

- **No lift for the land** (section 4, design B). The lift's ring broke the
  limb; the cut on the sphere's grid needs none.
- **A meridian below opacity 1 shows a dot at each joint** (section 5).
- **Where a coast runs along the limb, it covers the limb's line.** The
  coast's lines are drawn after the limb's. This is the true picture: the
  Arctic coast of Siberia, seen edge-on.
- **The water's wash helps the zoomed views** (the pictures above). At the
  whole globe, the meridians that stop at the coast already show the land.

### On a phone

Not measured yet. The page shows its own frame times under the picture, so a
phone can measure itself:

1. On the laptop, in the talk's directory, start the server (`--host` serves
   it to the local network):
   `NE_DIR=<the Natural Earth files> pnpm exec vite --config tasks/2026-10-28-globe-planning/spike/vite.config.ts --host`
2. On the phone, on the same Wi-Fi, open the "Network" address that Vite
   prints, for example `http://192.168.2.65:5199/?scale=50m&water=wash`.
3. Read the "draw + finish" and "between frames" lines after 10 s. Try
   `scale` 110m and 50m, and `water` none and wash.

## 13. A disc, not a sphere, hides the far side

The question (2026-10-28): why a sphere of faces, and not a disc through the
center, filled, that always faces the viewer?

**The sphere was chosen only because it is a fixed mesh,** so the renderer
needed no change. The disc is better in every way that the spike measured.

- **It hides exactly the far hemisphere.** The camera is orthographic, so
  the visible half of the globe is the half in front of the plane through
  the center, across the view. Every point on the near half is in front of
  the disc, and every point on the far half is behind it. A far line shows
  only within $\tau/R$ radians of the limb, as with the sphere.
- **Its rim is the true limb,** a circle of 360 sides: within
  $R(1 - \cos 0.5°) = 0.02$ px of a circle, and it does not jump as the
  globe turns. The sphere's limb is its facets' silhouette: within 0.34 px,
  and it jumps 0.17 px (3° grid).
- **It costs less:** 360 triangles and one closed line, in place of 14,160
  triangles and 14,280 silhouette edges. The build at 1:50m drops from 35 ms
  to 23 ms in Chromium. The draw time is the same (0.3 ms in Chromium, 4–5
  ms in Firefox): the coast's segments set it.
- **It can carry the sea's color** (design B): the near half of the globe
  projects onto the disc exactly. The land in front of it needs only to be in
  front of a plane, which every face on the near half is. The land is still
  cut on a grid, but only so that its faces stay near the sphere at the
  limb, not to match the sphere's cells.
- **It hides the far side of anything else in the scene correctly.** A point
  behind the disc and inside its outline is also behind the sphere's near
  surface. A tall mark on the far side that rises above the horizon is
  outside the disc's outline, so it shows, as it should.

What it needs:

- **Its matrix at each frame, from the camera.** The disc's group turns its
  $z$ axis to `Camera.toCamera` (`discMatrix` in `spike/globe.ts`; tested in
  `spike/globe.test.ts`). The spike's page computes it each frame. In the
  deck, the timeline mixes the camera during a move, and `Model.frame` does
  not get the camera now. So `webgl/stage.ts` must give the model the
  camera's angles at each frame. That is a small change to `webgl/`, and the
  stills and the article's figures go through the same path.
- **An orthographic camera.** With perspective, the visible cap is smaller
  than a hemisphere: the disc moves toward the camera by $R^2/d$, with
  radius $R\sqrt{1 - R^2/d^2}$, for a camera at distance $d$. That is still
  a disc, so a change to perspective would change the formula, not the
  idea.

The frame times are in `evidence/frames/` (the settings that end in `disc`),
and the pictures show the same globe as the sphere's.

## 14. The sea's color in each palette

The question (2026-10-28): could the sea be the pool's water color (the
Hairspring slide), with the coast in the line color of the pool's edge?

The pool draws its water as a substance: the `water` role at 0.6 over the
paper (`WATER_OPACITY` in `art/diving_board.py`), with its surface's edge in
`water` at 0.7, and the walls' lines in `ground`. In Ledger, `water` is the
subject's navy, the diving board's outline color too. So the proposal is: the
sea is `water` at 0.6, and the coast is a line in `water`.

`tools/palette_globe.py` measures it in each house palette
([evidence/palettes.json](evidence/palettes.json)). WCAG contrast, against
the 3:1 floor of `docs/legibility.md`:

| Palette             | Sea at 0.6: sea vs. land | Coast (water) vs. that sea | Sea at 18%: sea vs. land | Coast vs. that sea | Strongest sea that keeps the coast at 3:1 |
| ------------------- | -----------------------: | -------------------------: | -----------------------: | -----------------: | ----------------------------------------: |
| Ledger              |                     3.47 |                       3.00 |                     1.38 |               7.53 |                      0.59 (sea 3.38:1)    |
| After-Hours         |                     3.57 |                       2.09 |                     1.42 |               5.26 |                      0.42 (sea 2.44:1)    |
| Beacon              |                     3.97 |                       2.19 |                     1.45 |               5.97 |                      0.45 (sea 2.82:1)    |
| Campfire            |                     3.55 |                       2.11 |                     1.40 |               5.35 |                      0.43 (sea 2.46:1)    |
| Electric Terracotta |                     2.54 |                       2.20 |                     1.29 |               4.35 |                      0.41 (sea 1.84:1)    |
| Field Notes         |                     2.19 |                       1.85 |                     1.24 |               3.28 |                      0.25 (sea 1.35:1)    |
| Kraft Ink           |                     2.23 |                       1.83 |                     1.25 |               3.27 |                      0.24 (sea 1.35:1)    |

- **The pool's 0.6 works in Ledger only.** There, the sea stands out from the
  land (3.47:1) and the coast still holds 3:1 on the sea. In the other six,
  a coast in the water color is 1.8–2.2:1 on the sea. Along a long coast that
  does not matter much: the edge of the fill shows the coast. But a small
  island is mostly line: Scilly at 1:10m is a few px, so it would almost
  vanish into the sea. Those islands are the point of both stories.
- **The meridians need another color on a strong sea.** The spike's (the ink
  mixed half with the paper) are 1.1–1.4:1 on the 0.6 sea. The full ink is
  4.2–10:1, but heavy. Lines in the paper's color, as on a chart, are 2.2–4:1.
- **Why it varies:** the water color's own contrast with the paper. Where
  `water` is dark against the paper (Ledger, 10.4:1), it can fill and outline.
  In Field Notes and Kraft Ink it is 4.1:1, so any fill strong enough to see
  takes the outline's contrast away.
- **In the dark palettes, a strong sea is lighter than the land.** In
  After-Hours the sea at 0.6 is a mid blue around a near-black land, the
  brightest thing on the slide. That is a look to judge on the screen.

**So the house's way fits:** a sea role of its own, set in each palette, as
the washes are (`docs/theme.md`, "The pairs"). Its rule: as strong as it can
be while the coast (in `water`) holds 3:1 on it. That is the last column: from
0.59 of the water color in Ledger, which is the pool's look, to 0.24 in Kraft
Ink. Ledger's sea would then be the pool's water, and the other palettes as
close to it as their water color allows. The name could be
`--palette-water-wash`: the water's face, as `theme.md` asks for when a
drawing first needs one. Choose it on the screen, in a deck, against the
palettes' pictures; `tools/palette.py` would gate it.

### The pool's water as the sea (2026-10-28)

The pool's water can be the ocean: the `water` role at 0.6 over the paper,
as `art/diving_board.py` draws it. That is no new color. The land is the
paper.

**The pool's scene already has lines on the water**, and they give the
globe its lines:

- **The board's outline,** in `subject`, 3 px: where the board bends down
  over the pool, its outline lies on the water.
- **The water's edge** where it meets the walls, in `water` at 0.7, 2 px.
- The ripples, in the subject's wash, 2 px: decoration.

The globe needs two lines on the water: **the coast**, which must read on
the paper (the land) and on the sea, because a small island is almost all
line; and **the meridians**, on the sea only. The pool's lines, and `ink`,
on the 0.6 sea in each palette (WCAG contrast; the floor is 3:1):

| Palette             | Board outline (`subject`) on the sea | on the paper | Water's edge (`water` at 0.7) on the sea | `ink` on the sea |
| ------------------- | -----------------------------------: | -----------: | ---------------------------------------: | ---------------: |
| Ledger              |                                 3.00 |        10.39 |                                     2.16 |             4.1  |
| After-Hours         |                                 3.13 |        11.18 |                                     1.70 |             4.1  |
| Beacon              |                                 2.93 |        11.65 |                                     1.76 |             4.3  |
| Campfire            |                                 3.15 |        11.20 |                                     1.71 |             4.0  |
| Electric Terracotta |                                 4.18 |        10.63 |                                     1.72 |             5.3  |
| Field Notes         |                                 4.24 |         9.29 |                                     1.53 |             6.1  |
| Kraft Ink           |                                 3.82 |         8.53 |                                     1.53 |             6.2  |

- **The coast as the board's outline (`subject`, 3 px)** holds 3:1 in six
  palettes, at the floor in Ledger (3.00), and 0.07 under it in Beacon
  (2.93). So the globe can use only the pool's colors: the sea in `water` at
  0.6, the land in the paper, and the coast in `subject`. Beacon needs a
  small tune (its sea a little lighter), or `ink` there.
- **The water's edge (`water` at 0.7) is not a coast.** At 1.5–2.2:1 on the
  sea, it marks where two fills meet; it cannot draw an island of a few px.
- **The meridians:** `subject` at 2 px, thinner than the 3 px coast, keeps
  the pool's colors. The ripples' color (the subject's wash) is 1.6–2.7:1 on
  the sea: too faint for lines that the talk is about. `ink` (4.0–6.2:1, its
  job is graduations) is the choice if the meridians must differ in color
  from the coast.

With the coast in `subject` or `ink`, the sea can be the pool's water in
every palette: the per-palette tuning of section 14 is needed only if the
coast is in `water`. The sea is then 2.2–4.0:1 against the land. Check the
look in the spike before choosing.

Since section 15, "`water` at 0.6" is `water-wash`, and "`water` at 0.7" is
`water`, each at full strength, with the same values in each palette.

## 15. The water's two colors (2026-10-28)

Sections 5 and 14 went wrong three times on the water's colors, because the
color that a viewer sees as the water had no name in the house palettes. They
now have two roles, each a value in each palette: `water` (the edge, where
water meets another material) and `water-wash` (the water itself). The
problem, the options, the choice and the measurements are in the house task
`tasks/2026-10-28-water-colours/` (at the root of `stem/`).

**The spike, made to match the pool (2026-10-29).** The spike's copies of
Ledger and After-Hours are now the house palettes as of this change. On the
sea, the spike draws:

- the sea in `water-wash`, at full strength: the pool's water;
- the coast in `subject`, 3 px: the diving board's outline;
- the meridians in `ink`, 2 px. Before, they were `ink` at 0.5 over the
  paper, which is 1.14–1.43:1 on the water's wash. Full `ink` is
  4.03–6.20:1 in the seven palettes.

In Ledger, in headless Chromium, the sea is `#7087A0`, the coast `#143C6B`
and the meridians `#2A2520`.
