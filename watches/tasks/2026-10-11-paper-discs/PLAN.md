# Paper discs instead of clip discs

**Status:** decided and built (2026-10-12). Paper discs replace the clip
discs: a holdout at each covering wheel's bottom, a gap of 1/16 px under it
(`STACK_GAP`), and the exact line test next to holdouts with tolerance 1/32
px (`HOLDOUT_TOLERANCE`). The user looked at the prototype in the deck
(`?paper`) and chose it. After the review, the exact test takes each
holdout's number and plane, not float depth slopes
([The review](#the-review-2026-10-12)). The rules are in `stem/docs/webgl.md`, "Holdouts",
and `watches/docs/watch.md`, "Paper discs".

The built values are binary fractions, near round 6's 0.05 and 0.025, so
that heights stay exact in a Float32Array. The prototype (the renderer's
options, `GenerateOptions.stackGap`, `watch/paper-discs.ts`, the `?paper`
switch) is not in the project. `prototype.patch` holds it: to run the tools
below again, check out commit `7dfecef` and `git apply` the patch.

## The question

A clip disc (`Disc`, `Mesh.hiddenInside`) hides a lower wheel inside the root
circle of the wheel above it, at every height. It makes the upper wheel look
filled in: through its spoke openings you see paper, not the wheel below
(decided 2026-09-29, `../2026-09-28-webgl-planning/PLAN.md`, section 13,
item 3). The disc is a vertical cylinder in the plan. The openings are higher
than the parts under them, so at a tilt $t$ the two slide apart by
$h \tan t$. At the motion works that is about 3 px at 20°, 8 px at 45° and
14 px at 60° (`docs/watch.md`, "The motion works"). A recap slide at a steep
tilt needs a fix.

The user's proposal: a paper-coloured disc on the bottom of each covering
wheel. The depth test then hides what is under it, at any tilt, about any
axis, with any projection.

## The data

### The heights (`tools/analysis/heights.ts`)

Each mesh's world heights at rest. The balance is the lowest part
($z$ −18 to −13). The hairspring is above it (−11 to −3), the roller above
that (−1 to 1), and the impulse jewel above the roller (1 to 4). No clip disc
belongs to the balance, and none is needed.

The covering parts and their discs (radius, the part's bottom): fourth wheel
28.0 at 3; third wheel 41.1 at 6; one-step wheel 349.1 at 6; centre wheel
46.9 at 9; barrel 70.0 at 12; minute wheel 12.6 at 17; one-step hour wheel
68.9 at 17; hour wheel 14.5 at 20.

### What a paper disc hides that a clip disc does not (`tools/analysis/under.ts`, `together.ts`)

A paper disc hides everything under it. A clip disc hides only the meshes
that list it. In the plan and below the disc, 13 (cover, mesh) pairs are new.
Only 4 of them are on one slide at one click together: on the Gear Train
slide at click 1, the one-step wheel's disc is over the lower walls of the
case band, the crown and two lugs. That click is at tilt 0, so those walls
do not show. The renders agree: Gear Train 1 differs by 473 visible px with
the holdout, all on lines.

### What a clip disc hides that a paper disc does not (`tools/analysis/above.ts`)

A clip disc also hides what rises above the covering part's bottom. Two
cases are shown in the deck:

- **The Hour Hand slide, clicks 1 and 2:** the barrel arbor and its square
  (up to $z$ 22.5) rise through the one-step hour wheel (17 to 20). This is a
  collision in the model. The clip disc hides it; a paper disc shows it
  ([figure](evidence/figures/holdout-hour-hand-1.png)).
- **The Hour Hand slide, clicks 5 and 6:** the centre arbor inside the hour
  wheel's pipe.

### The renders (`tools/render.py 1`, `evidence/summary-1.json`)

Each of the deck's 34 distinct watch states, and 5 of them at 45°, 60° and
75°: 49 frames at 1960 × 1104, in Chromium. Each variant is compared with
today's (clip discs, tolerance 0.25). "Visible" is a channel difference of
more than 32 of 255.

| Variant | Frames that differ | Visible px, all frames |
| --- | --- | --- |
| clip discs, tolerance 0.1 | 49 of 49 | 4,851 |
| clip discs, tolerance 0.05 | 49 | 14,873 |
| clip discs, tolerance 0.02 | 49 | 43,422 |
| clip discs, tolerance 0 | 49 | 88,614 |
| paper disc at the bottom, holdout, tolerance 0.25 | 33 | 125,953 |
| paper disc 0.3 above the bottom, tolerance 0.25 | 33 | 479,048 |
| paper disc 0.05 above the bottom, tolerance 0.02 | 49 | 522,446 |

**A smaller tolerance loses lines** (`tools/analysis/lostgained.py`): of the
visible changes at tolerance 0.1, 4,806 px are lighter (line lost) and 45
darker; at 0, 88,188 and 424. The tolerance is there for the 2 × 2
farthest-texel test: it compares the line's depth at its centre with depths
at texel centres, which differ by the face's depth slope. At tilt 20 and
the Hour Hand slide's zoom, that is about 0.07 slide px of depth a device px.

**The covering wheel's own bottom outline must stay.** At a tilt, the far
wall of each spoke opening shows, with its bottom outline. That outline is at
the same height as the top of the wheel below. So depth alone cannot hide
the wheel below and keep the outline:

- A raised disc hides the outline
  ([figure](evidence/figures/raised-gears-0.png)), and with tolerance 0.02 the
  dimmed wheels below show through as dots
  ([figure](evidence/figures/raised-hour-hand-3.png)).
- The holdout (a line is hidden at the disc's depth if its 2 × 2 texels are
  all the disc's) breaks the outline into dashes
  ([figure](evidence/figures/holdout-gears-0.png)), and speckles the
  mainspring, which stands on the barrel's disc
  ([figure](evidence/figures/holdout-cover.png)).

## The options

1. **Keep the clip discs.** No work. They fail at steep tilts at the motion
   works (8 px at 45°), and the motion works' rims stay 6 px wide to hide the
   slide at 20°.
2. **Paper discs, with a gap between stacked wheels.** Put each covering
   wheel a gap $g$ above the top of the wheel below. A real watch has this
   clearance. The paper disc is then a plain face at the covering wheel's
   bottom: its own bottom outline is level with the disc and shows, and the
   wheel below is $g$ behind it and is hidden. The gap must be more than the
   tolerance plus the slope error: about 0.3 px at today's tolerance. That is
   0.1 CSS px at tilt 20 and the cover's scale, and up to 2 CSS px at 60° and
   the hairspring's zoom (4.46). Work: `trainHeights` and the motion works'
   stacking in `watch/generate.ts`, then the deck's tests. Not measured yet.
3. **Paper discs, gap, and an exact face depth.** As 2, and the face pass
   also writes each pixel's depth slopes. The line test then finds the face's
   depth at the line's exact centre, not at texel centres. The tolerance
   then covers only rounding, so the gap can be about 0.01 px, which nobody
   can see. Work: as 2, and the renderer's face and line shaders. Not
   measured yet.
4. **Paper discs, holdout with a "below" rule.** A disc hides only a line of
   a mesh that is wholly below it (the mesh's top at most the disc's height).
   No gap. Work: the renderer passes each mesh's top height, and the face pass
   writes the disc's height. It is exact, but a special case in the renderer
   that every future reader must learn.

Each paper option must also fix the barrel arbor's collision with the
one-step hour wheel (for example, hide the arbor's square after the
Mainspring slide), and check the centre arbor in the hour wheel's pipe.

### Round 2: a gap between stacked wheels (`tools/render.py 2`, `evidence/summary-2.json`)

`GenerateOptions.stackGap` in `watch/generate.ts` puts each covering wheel
the gap above the top of the wheel under it: each level of the train, and
both levels of the motion works. The paper disc is a plain face at the
covering wheel's bottom. Every variant is framed with today's views. Each
paper variant is compared with the clip discs at the same gap, to see the
disc's own effect.

| Gap, slide px | Frames that differ (paper vs clip, same gap) | Visible px | Lighter |
| --- | --- | --- | --- |
| 0.15 | 30 of 49 | 221,481 | 19,723 |
| 0.3 | 24 | 81,654 | 21,739 |
| 0.5 | 17 | 38,753 | 24,618 |

- **0.3 is not enough at today's tolerance.** On the Mainspring slide at
  click 3 (tilt 20), the lower wheels' teeth show through the paper discs as
  dots ([figure](evidence/figures/paper-gap-0.3-mainspring-3.png)). The gap
  must be more than the tolerance (0.25) plus the slope error.
- **At 0.5, the deck's frames are clean except:**
  - the barrel arbor's collision on the Hour Hand slide, clicks 1 and 2
    (as in round 1);
  - the Gear Train slide, click 1: the crown loses its top and bottom
    outlines ([figure](evidence/figures/paper-gap-0.5-gear-train-1-crown.png):
    clip discs with the gap, paper discs with the gap, the difference). The
    one-step wheel (6.5 to 9.5) passes through the crown (−13 to 20.8), and
    the crown's outlines are at its mid-height, under the wheel's disc. It is
    a second collision in the model.
- **A bug in the prototype, fixed:** the hour wheel's pipe started at the
  first motion-works level, not at the hour wheel's bottom
  (`heights.set(motion.hourPipe, …)` in `assignHeights`). With a gap, the
  paper disc then lay level with the cannon pinion's top and stripes showed
  in the openings ([before](evidence/figures/gap-0.5-hour-hand-5-hour-wheel.png)).
  With the fix, the paper discs show the openings cleaner than today's clip
  discs, which leave a tick and a sliver there at tilt 20
  ([after](evidence/figures/gap-0.5-hour-hand-5-hour-wheel-fixed.png): today,
  clip discs with the gap, paper discs with the gap).
- **No dots at steep tilts:** at 45°, 60° and 75° with gap 0.5, the paper
  discs make no line pixels darker (lines gained) in the 15 steep frames but
  3. Only 5 states were drawn steep.
- **At 60° and 75°**, the barrel's disc is a floor: between the mainspring's
  coils it shows paper where the clip discs showed the coils' lower walls
  ([figure](evidence/figures/paper-gap-0.5-hour-hand-0-tilt-75.png)). A real
  barrel has a floor.
- **The gaps add up.** Six levels at 0.5 raise the hands and the arbors' ends
  by 3 slide px. At the Hour Hand slide's zoom and 60°, the minute hand is
  visibly higher on a longer arbor
  ([figure](evidence/figures/clip-gap-0.5-hour-hand-3-tilt-60.png): today,
  the gap, the difference). The pixel counts of the clip discs with a gap
  against today's (2.6 to 4.7 million) are this shift, not artifacts. On the
  screen, 3 slide px of height is up to 4.6 CSS px at tilt 20 (the
  Hairspring slide's scale, 4.46), and 4.1 px on the Hour Hand slide's zoom
  (`tools/analysis/rise.ts`).
  Not chosen: a thinner covered wheel instead of a rise. The user: at 20°,
  a wheel's thickness is already hard to see.

### The two collisions (2026-10-12)

**The crown, fixed in the prototype.** The Gear Train slide's one-step wheel
is meant to reach past the case: click 1 shows that it does not fit. A paper
disc out to its root circle hid the crown's outlines, which are at the
crown's mid-height, under the disc. Each paper disc now ends at the case's
inside (`bezelRadius`): `addPaperDiscs` clips the disc's polygon to it. The
case and the crown are outside every disc. With gap 0.5, the Gear Train
slide's six clicks are now the same with paper and with clip discs
(`evidence/summary-2-Gear_Train.json`).

**The barrel arbor: the user chose the third way below (2026-10-12).** The barrel arbor
(radius 15, up to 18.5) and its square (up to 22.5) rise through the
one-step hour wheel (17 to 20) at 8 o'clock. Every angle that covers only
the barrel meets the arbor (`tools/analysis/clear-arbor.ts`: clear only at
30° or less and at 180° or more). The two nearest clear angles:

| Angle | What it covers | Its hand | Figure |
| --- | --- | --- | --- |
| 9:30 (195°) | part of the barrel and the escape wheel, and most of the balance and the hairspring | reaches 91 px from the centre: clear | [middle](evidence/figures/one-step-hour-angles-150-195-30.png) |
| 4:00 (30°) | part of the barrel, the third and the fourth wheels | reaches 221 px; the chapter ring starts at 192, at the hand's height: a new collision | right |

(`tools/analysis/hand-reach.ts`. The figure shows the Hour Hand slide at
click 2: today at 8 o'clock, then 9:30 and 4:00 with paper discs and gap
0.5.) The motion-works task's scan gives 0 px² of balance at 9:30, but the
wheel's tip circle covers most of it: that scan's balance column is not a
measure of this.

Other ways that keep 8 o'clock:

- **Chosen:** the barrel arbor and its square leave at click 1, as the
  wheel comes in, and come back at click 3. Under the wheel's paper disc
  nothing changes but the moment that they go. Done in `slides.md` (the
  `&faintKept` and `&lit` lists) and `docs/watch.md`.
- The arbor ends level with the barrel's top, and the square comes and goes
  with the key on the Mainspring slide. This changes the Mainspring slide.

### Option 2: an exact line test next to paper discs (rounds 4 to 6, 2026-10-12)

The face pass also writes each pixel's depth slopes, `dFdx` and `dFdy` of
`gl_FragCoord.z`, to an RG32F target (`RendererOptions.exactLineDepth`; it
needs `EXT_color_buffer_float`). The line test can then carry a texel's face
on its plane to the line's exact centre, so no tolerance is needed for the
face's slope.

**First try: every face exact, with a small tolerance.** It lost lines
(`evidence/summary-4.json` is the final round 4). With tolerance 0.005,
38,691 px of lines were lost, against 71,596 without the slopes:

- lines on curved walls (pinion leaves, teeth): a neighbouring facet,
  carried on its plane, comes in front of the line
  ([figure](evidence/figures/exact-all-faces-gears-0.png));
- the span overlays, which a polygon offset puts in front of their teeth;
- decals: the chapter ring's ticks and the strap's stitching lie on another
  mesh's face ([figure](evidence/figures/exact-all-faces-cover-tilt-60-decals.png)).

**Kept: exact only next to a paper disc.** The paper discs are holdouts
(the R8 flag of round 1). If one of a line's 2 x 2 texels is a disc's, the
disc's depth at the line's centre decides: the line is hidden if it is
behind both the disc and every other texel's face, by more than the
tolerance. The other texels count at their raw depth: they hide nothing that
the disc does not, and they let a line show past the disc's edge. Where no
texel is a disc's, the test is today's, with 0.25. Without paper discs, the
pictures are the same as today's to the pixel (`exact-clip-0.25`, 0 px).

**The tolerance must be between the depth error and the gap.** At gap 0.02
in the cover at 45° (`tools/pair.py`, against clip discs at the same gap):

| Tolerance | Lighter px (lines lost) | Darker px (lines that leak) |
| --- | --- | --- |
| 0.25 or 0.05 | 0 | 2,392 |
| 0.015 | 7 | 155 |
| 0.005 | 1,442 | 48 |

At 0.005 the mainspring's coils break
([figure](evidence/figures/exact-paper-gap-0.02-tol-0.005-coils.png)): the
raw depth of the texels next to the disc is off by about 0.01 to 0.015 px.

**Gap 0.05 with tolerance 0.025** (`evidence/summary-6.json`, round 6; gaps
0.03, 0.05 and 0.1 with the tolerance at half the gap all give about
18,500 visible px). Against clip discs with the same gap, in all 49
frames: 17,542 px lighter, nearly all at 60° and 75° (the barrel's floor)
and the hour wheel's slivers that the paper discs remove; 842 px darker in
all, at most 33 in a frame at the deck's tilt 20 (specks on the barrel's
coils), and up to 84 at 45° and above
([figure](evidence/figures/exact-paper-gap-0.05-hour-hand-3-tilt-45.png)).
The six levels rise by 0.3 slide px: up to 0.46 CSS px on the screen at the
Hairspring slide's zoom and tilt 20.

**The renderers.** Rounds 1 to 6 drew in Chromium's software renderer
(SwiftShader), as `art:stills` and the print check do. Round 7 drew the same
comparison on the GPU (Metal, `PAPER_GPU=1`; `evidence/summary-7.json`):
the exact option alone, 0 px; paper discs at gap 0.05 against clip discs,
18,289 visible px (SwiftShader: 18,384), 846 darker (842).

**Browsers** (`tools/float-target.py`): on this Mac, `EXT_color_buffer_float`
and a complete RG32F target in Chromium (its default software renderer,
ANGLE's SwiftShader as in a cloud session, and Metal), Firefox and WebKit.
Not checked: Safari itself, and a cloud session's Firefox and WebKit, which
draw with Mesa on Linux (`docs/talks.md`, "Cloud sessions"). This Mac has no
Docker to try Mesa.

## The review (2026-10-12)

A code-quality review of the clean implementation is in
[review-2026-10-12.md](review-2026-10-12.md). It had three findings, and all
three are fixed.

### 1. Without float pictures, the lines under a disc showed

The clean implementation wrote each holdout's depth slopes to an RG32F
picture, which needs `EXT_color_buffer_float`. Without it, the renderer fell
back to the ordinary tolerance, 0.25, which is 4 times the gap. The review
measured 4,150 to 17,526 darker px a picture in three deck states, in each
engine, with the extension hidden. No engine that we tested lacks it; we do
not know how common such machines are.

The options, best first:

1. **Each holdout's number and plane (chosen).** The face pass writes the
   holdout's number to an R8 picture, which every WebGL2 can draw. For each
   picture, the CPU finds each holdout's depth plane in the window from
   three of its points; the line shader takes the depth at the line's centre
   from it. One path for every machine, and no extension. It is at least as
   exact: the depth comes from the plane, not from a stored depth plus a
   slope. It needs 1 byte a pixel, not 8: about 2.1 MiB a picture at
   1960 x 1104, not 16.5 MiB. Its costs: a limit on holdouts
   (`MAX_HOLDOUTS`, 32; the watch has 8), and holdouts must not be dynamic.
2. **The slopes, encoded in an RGBA8 picture.** More shader work than 1,
   and its rounding must be measured against the gap.
3. **Refuse to draw without the extension.** No watch is worse than lines
   that show through.
4. **A larger gap without the extension.** Two configurations of the
   geometry to validate.
5. **Keep the fallback, and check the extension in validation.** It finds
   a change in the three engines that we test, and helps no other machine.

**The result** (`tools/print-compare.py`, `evidence/print-compare.json`):
each printed page that shows the watch (39 positions) is the same to the
pixel as with the slopes, in Chromium (on the GPU), Firefox and WebKit.
The control (`evidence/print-compare-control.json`) is a build with the
holdout test turned off: 18 of the 39 pages differ in each engine, with
191,071 visible px in Chromium, 191,606 in Firefox and 173,270 in WebKit.

**A browser check** now draws the rule in a small scene
(`webgl/probe/checks.ts`, "a holdout hides a part two HOLDOUT_TOLERANCEs under
it"): a part a gap under a holdout is hidden, and a part on it is the same as
without the holdout, at tilts 0, 20, 45, 60 and 75. It passes in all three
engines (`tools/browser-checks.py`). With the holdout test turned off, it
fails in all three, with 1,428 channels at tilt 0.

### 2. The collision test had gaps

- **It skipped the watch's group.** It skipped the groups of the disc's
  piece, to skip the wheel's own parts, such as its arbor. But the disc is
  in the watch's group, so 25 meshes in that group were never checked. Now
  it skips the wheel's groups only. Then the test finds five parts that rise
  through a disc. The drive-arrow heads of the fourth, third and centre
  wheels rise 0.5 px (`DRIVE_ARROW.rise`), more than the gap to the next
  wheel's disc. The others are the mainspring stud, in the barrel's disc, and
  the barrel arbor, in the one-step hour wheel's disc. No click shows one of
  them with its disc, so the test passes.
- **It checked only the corners of each face.** A face that crosses a disc
  with no corner inside it was not seen. Now both tests clip each face to the
  disc's outline (`Outline` in `watch/at-rest.ts`). The clip found the case
  band in the one-step wheel's disc, on the Gear Train slide. The case's wall
  is flattened to 336 sides, up to `FLATNESS` (0.01 px) inside its circle.
  The disc was clipped to 128 sides on the circle, so its corners reached
  past the wall by up to 0.01 px. The disc now ends `FLATNESS` inside the
  bezel's radius.
- **Its one allowance named a mesh by its number** (`"centre wheel 4"`).
  Now it takes the meshes of the `centre arbor` piece. Without the
  allowance, the test fails at the Hour Hand slide's click 5, as before.
- **Not fixed: the watch is at rest.** A part that turns keeps its heights,
  but a part that is not round about its axis is checked only where it is
  at rest. The tests say so.

The deck test takes about 0.7 s, as before.

### 3. Round 5 compared with the wrong picture

`tools/render.py` gave round 5's variants no `reference`, so they were
compared with `clip-0.25`, at gap 0, or failed if no earlier round had drawn
it. They now name `clip-gap-0.02`. No number in this plan changes: no
summary of round 5 is in `evidence/`, and the table at gap 0.02 came from
`tools/pair.py`, which takes its reference explicitly.

### Not done: slopes only for a scene with holdouts

The review suggested allocating the slope pictures only when a scene has a
holdout. With 1, a numbers picture is 2.1 MiB, and the talk's one scene has
holdouts.

The tools of this section run on the commit that holds this change, not on
the prototype.

### The second review (2026-10-12)

A second review is in [review-2026-10-12-2.md](review-2026-10-12-2.md). It
had three findings, and all three are fixed. None changes a picture.

1. **`Outline` did not check that it is convex.** It checked only that the
   mean of its points is inside each edge. It took a notched outline, and
   then did not see a face in the notch. Now it refuses a point outside an
   edge by more than `OVER_MARGIN`, an edge with no length, and a point that
   is not finite. The deck's discs are convex, so no test result changes.
2. **`AtRest.points()` repeated `transformPoint()`.** It now calls it. The
   review compared the two on all 276,831 points of the watch: they are the
   same.
3. **Names.** The plane's `a` and `b` are `depthPerX` and `depthPerY`;
   `PaperDisc.wheel`, a group, is `wheelGroup`; and `under`, the wheel's
   lowest mesh (which is over the disc), is `wheelMesh`.

**Not done: a browser check with a holdout in a group that turns.** The
print comparison (above) has 8 holdouts, each with its own number and
height, in a group that is moved. It is the same to the pixel as the slope
pictures, which did not use the numbers. So a wrong number or a wrong
transform would show. No holdout of the deck turns, and `transformPoint`
moves every mesh.

## The prototype

- `webgl/renderer.ts`: `RendererOptions.hiddenLineTolerance`, `clipDiscs`
  and `exactLineDepth`, and `Mesh.holdout` (a second render target holds a
  flag for each pixel, a third the depth slopes). Defaults keep today's
  picture.
- `watch/paper-discs.ts`: `addPaperDiscs`, which adds the paper discs to a
  generated watch. The probe and the deck use it.
- `watch/instance.ts`: `?paper` in the deck's address, when the page loads,
  draws the deck with paper discs, gap 0.05, the exact line test and
  tolerance 0.025 next to the discs (`RENDERER_OPTIONS`, which the stage and
  the stills take). Checked in Chromium, Firefox and WebKit on the Hour Hand
  slide: no page errors.
- `tools/probe/`: draws a deck state in a variant.
- `watch/generate.ts`: `GenerateOptions.stackGap` (default 0, today's
  heights).
- `tools/render.py`: draws and compares (rounds 1 to 7). `tools/look.py`:
  crops a difference. `tools/zoom.py`: enlarges one area of several
  variants.
- `tools/analysis/`: the height, overlap and spring measurements.

To run it again, in `watches/`:

```bash
node tasks/2026-10-11-paper-discs/tools/states.ts > tasks/2026-10-11-paper-discs/out/states.json
uv run tasks/2026-10-11-paper-discs/tools/render.py 1
uv run tasks/2026-10-11-paper-discs/tools/render.py 2
uv run tasks/2026-10-11-paper-discs/tools/render.py 4   # and 5, 6
```
