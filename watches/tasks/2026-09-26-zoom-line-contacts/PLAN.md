# Do parts touch only through their ink?

## Question

Martin (2026-09-26): the parts seem to touch where they mesh, above all the
pallets and the escape wheel's teeth. If the lines stay the same width on the
screen during the zoom (the zoom task's choice), do contacts that the ink
makes at rest open into gaps?

Two stroked outlines $A$ and $B$ with widths $w_A$ and $w_B$, whose centre
lines are $g$ apart, show ink touching when

$$g \le \frac{w_A + w_B}{2}.$$

Zoomed by $s$ with constant screen widths, each width in drawing units is
$w / s$, so the ink still touches only when $g \le (w_A + w_B) / (2s)$. A
contact is **at risk** when

$$\frac{w_A + w_B}{2s} < g \le \frac{w_A + w_B}{2}.$$

Then the zoom shows a gap of $gs - (w_A + w_B)/2$ screen px. For the hairspring
view, $s = 250/56 \approx 4.464$.

## Options

1. **Measure the geometry in the browser (chosen).** Load the production SVG
   in Playwright. `getPointAtLength` samples each outline once, in its own
   coordinates; at each time, SMIL is paused there and `getCTM()` gives each
   outline's transform. Python finds the gaps with numpy.
   - Pro: it measures what is drawn, with the browser's own SMIL and path
     geometry. No path parser, no copy of the animation.
   - Con: the SVG does not name its parts. Moving groups are labelled by
     their centre of rotation, and the report maps them to names by hand.
2. **Rebuild the geometry in Python from the generator's functions.**
   - Pro: part names come free.
   - Con: it needs an SVG path flattener (arcs and quadratics), a copy of the
     SMIL keyframe evaluation, and imports across directories. No geometry
     library is installed (no scipy, shapely or svgpathtools).
3. **Compare pixels:** render the zoomed view with constant and with scaled
   widths, and look for background channels that open.
   - Pro: occlusion is included.
   - Con: every line changes width, so "a gap opened" is hard to separate
     from "a line got thinner". Kept for looking at the cases found.

## Data model (`tools/contact_check.py`)

- `Shape` (identity; fixed): the element's index in the SVG, its moving
  group's label, its stroke width (0 if none), and its outline sampled in
  local coordinates every `SPACING` units.
- Per time, a side table: each shape's outline in drawing coordinates (the
  local outline through the CTM; the hairspring is sampled again, as its path
  changes).
- `Placement` (identity; one per time and shape, in a side table made for
  each run): the shape's CTM and a k-d tree of its placed outline. While the
  shape does not move, the next time reuses the same object, and each pair
  keeps its last result with the two placements it was measured at.
- `Gap` (value): the two shapes, the time, $g$, where (the midpoint of the
  closest pair of points), and whether it is **visible**: the fill at that
  point, hit-tested with `elementFromPoint` on fills only, is painted below
  the pair's upper shape. A part drawn on top can cover a gap. `in_view` is
  computed: whether the midpoint is inside the hairspring view's frame.
- The report: per pair of shapes, the at-risk gaps over all times, the
  largest zoomed gap, and when and where it happens.

## Times

- One period (2 s: a tick and a tock) in steps of 5 ms: the fork, the escape
  wheel and the balance repeat each period.
- 60 s in steps of 0.5 s: the fourth, third and centre wheels turn slowly.

**Samples:** every 0.1 drawing units, except the hairspring, which changes
shape and is sampled again at each time: every 0.3 units, because
`getPointAtLength` on its long path is slow. The measured gap is exact to
about half the spacing.

Martin approved this data model on 2026-09-26, and the two speed-ups
(reused placements, the bounding-box test) and the cover test.

## Steps

1. Write `tools/contact_check.py`, and run it on
   `public/cover/skeleton-watch.svg` in Chromium and Firefox.
2. Look at the worst at-risk contacts in the zoomed view, with constant and
   with scaled widths.
3. Recommend: keep constant widths, change the geometry, or scale the lines.
