# SVG or Canvas 2D for the watch?

2026-09-26. Decision review of both task histories, the current generator,
the two spikes, and their saved evidence. This review adds no new browser
benchmarks. I recalculated the main frame-gap ranges from the saved JSON and
inspected the canvas player, stage, and fade comparison image.

**My recommendation: use Canvas 2D for the live watch if smooth motion in
both Firefox and Chrome remains a requirement. Keep the Python generator and
its SVG output, and use SVG stills for previews and export. Start with ordinary
clipping.** Canvas has earned this recommendation through the measurements;
it has not earned a claim to be universally faster or easier to maintain.

**After considering the cost of maintaining both, I would keep SVG as a
supported live alternative too, with canvas selected by default.** Share the
presentation logic and select one renderer at page load. The additional work
is modest if SVG must remain correct without a promise of matching canvas's
performance. The estimate and maintenance boundaries are below.

SVG is the better choice for minimizing code ownership. Firefox 157 makes
staying with it reasonable if the remaining hitches are acceptable on the
presentation setup. If that is your preference, one short check of the best
SVG version in the actual deck, with presenter view and projector, is worth
doing before committing to the canvas port. I would not spend another open-ended
investigation trying camera variations: the tested variations have not solved
the remaining Firefox problem.

The enduring tradeoff is this: **with SVG, the browser owns the animation and
rendering semantics; with canvas, we own more of those semantics in exchange
for better measured frame pacing.** Firefox updates can change the performance
balance. They do not remove the maintenance difference.

**What the evidence actually establishes.** The strongest comparison is the
standalone page with the same art, compensated strokes, a 1.8 s camera move,
and a 0.8 s fade begun after the move. These are installed browsers with fresh
profiles, on one M3 Pro MacBook Pro, at DPR 2 and 120 Hz. Each run has three
zooms in and three out; the Firefox 157 SVG range combines C21 and C22.

| Browser and renderer | Gaps over 25 ms per transition | Largest gap | Evidence |
| --- | --- | --- | --- |
| Firefox 156, SVG | 12–14 | 66.7 ms | [C6 SVG data](evidence/real-firefox-svg.json) |
| Firefox 156, canvas with clips | 0 | 17.4 ms | [C6 canvas data](evidence/real-firefox-canvas.json) |
| Firefox 157, SVG | 1–7 | 82.9 ms | [C21](evidence/real-firefox-beta-svg-c21.json), [C22](evidence/real-firefox-beta-svg-c22.json) |
| Firefox 157, canvas with clips | 0 | 16.7 ms | [C21 canvas data](evidence/real-firefox-beta-canvas-c21.json) |
| Firefox 157, canvas with erase | 0 | 16.7 ms | [C21 erase data](evidence/real-firefox-beta-canvas-erase-c21.json) |
| Chrome 153, SVG, C22 control | 0 | 24.6 ms | [C22 Chrome data](evidence/real-chrome-svg-c22.json) |

These gaps are intervals between animation callbacks, not direct measurements
of every frame delivered to the display. The 25 ms threshold is useful for
detecting large hitches; it is not a definition of perfect smoothness. At
120 Hz, Firefox 157's ordinary canvas still had 2–8 intervals over 12.5 ms per
transition, versus 0–2 with erase and 26–40 with SVG. A long interval may miss
several refreshes, so a count of long intervals is not a count of all missed
display frames.

Firefox 157 is a substantial improvement. Its remaining 42–83 ms worst gaps
can still be visible, even on a 60 Hz display. Conversely, a 16.7 ms canvas
interval on this 120 Hz screen does not prove what happens on a different
60 Hz projector. The projector changes resolution, scheduling, and possibly
the graphics path.

There is broader support for canvas: the deck tests passed in installed
Firefox 156 and Chrome, and the quiet ten-minute run found no slow canvas
frames in Firefox. However, **Firefox 157 was measured only on the test page**;
the presenter test used two iframes on one screen; Windows and an actual
projector were not tested. Ten minutes of stable Chromium JS heap does not
establish the absence of native graphics-memory leaks. These limits qualify
the result without erasing its clear advantage. See
[C8–C13, C18 and the limitations](INVESTIGATION.md).

Several earlier claims need to be narrowed when making this decision:

- **The Firefox 156 regression is not a sufficient explanation.** Mozilla's
  [bug 2073778](https://bugzilla.mozilla.org/show_bug.cgi?id=2073778) concerns
  stroke-bounds work during SVG pan/zoom and records a fix for 157/158. But
  C20 found no improvement for this watch when the implicated preference was
  disabled, and Firefox 155 also stuttered. C21 establishes that the tested
  157 build is better; it does not isolate which change helped.
- **Chrome's normal SVG camera is sharp.** C22 corrected C12's blur result:
  a pending fade transition contaminated the earlier comparison. The CSS
  camera with `will-change: transform` did blur badly in Chromium, but that
  is a particular configuration, not a general property of SVG. Firefox's
  screen-capture softness was measured in Playwright's Firefox 155, not 157.
- **Canvas is still browser rendering.** The reports infer SVG rasterization
  and caching behavior from timing; they did not profile Firefox internally.
  Nor did the canvas-acceleration preference experiment identify its actual
  backend. “Canvas has no browser quirks” and “GPU drawing guarantees smooth
  motion” overstate what was learned.
- **Both approaches can pause, seek, render a still, and stop work while
  hidden.** The canvas spike implements some of these more conveniently.
  SVG's clock APIs and generated stills provide routes to the same outcomes;
  they are not exclusive canvas capabilities.

**The long-term comparison.** This is a small drawing—37 paths, 18 circles,
one rectangle, and twelve animation elements—not a case where thousands of
DOM nodes alone decide the answer.

| Concern | Inline SVG with SMIL | Canvas 2D reading the generated SVG |
| --- | --- | --- |
| Ownership | Browser implements paths, clips, animation interpolation, and group compositing. We maintain camera and slide integration. | Browser implements drawing primitives. We additionally maintain SVG interpretation, animation sampling, and compositing choices. |
| Another gear or another camera view | Usually a generator/data change. | Also usually a generator/data change, provided it uses the supported drawing and animation subset. |
| New visual features | CSS, text, gradients, masks, and other supported SVG features fit the existing document model. | Each new feature must be supported explicitly or kept in an HTML/SVG overlay. |
| Live performance | Improved in Firefox 157; still has measured hitches. Browser updates may help or regress it. | Best measured result across the tested versions. More explicit control over when and what is drawn; still depends on browser and hardware. |
| Sharpness | Geometry stays vector; browser compositing choices can affect moving output. | Rebuilds the frame from paths at the current camera scale. Sharp when the backing store matches the displayed device pixels. |
| Partial fades | Correct group opacity is built in. | Spike changes the appearance. Matching SVG needs extra compositing work. |
| Debugging | Inspect individual groups, styles, clips, and animations in browser tools. | Inspect the draw tree and state in JS; the displayed canvas is one bitmap. Pixel comparisons become more valuable. |
| Reuse and export | A standalone SVG is useful outside this deck and preserves vector geometry. | Live output needs the player. SVG output can remain available from the same generator. |
| Interaction and labels | Elements are available for events, focus, and descriptions. | Per-part picking and semantics need application code or overlays. For the present keyboard-driven talk, this is a small cost. |
| 3D hairspring | Requires a new representation of depth. | Also requires a new representation of depth. Canvas 2D does not make this a 3D scene. |

**Why SVG deserves serious consideration.** Its greatest benefit arrives
months later, when you return to change the story. Adding a view, adjusting
gear teeth, or reusing an illustration in another talk can remain work on the
generator and a standard image format. The existing art, legibility, and
motion checks already understand that output. Browser developers maintain
the interpretation of SVG and SMIL.

With SVG, highlighting a part, adding a label, or changing a fade does not
usually expand a renderer you must maintain. Its semantics are particularly
useful here because the illustration uses translucent washes, knockout fills,
overlapping strokes, and clipping. Those details distinguish a readable
mechanism from a tangle of lines; the
[house illustration rules](../../../docs/illustrations.md) make that explicit.

The cost is performance uncertainty at the exact moment the audience's eye
follows the zoom. Keeping the browser's responsibilities does not mean keeping
zero application code: SVG still needs the persistent stage, camera, fade
sequencing, stroke compensation, and Slidev integration. The best existing
SVG test page is the baseline to retain. The original SVG spike deck still
uses an older camera/stroke setup, so it is not a fair substitute for that
baseline in a final audition.

**What canvas makes easier, and what it makes ours.** A canvas frame is an
explicit function of mechanism time, camera, and visibility. That is a useful
structure for synchronizing the spring, balance, fork, and hands. It also
makes deterministic captures and future slow motion straightforward. Static
paths are cached as `Path2D`; the player reconstructs the morphing spring for
the requested time. This is path rendering at each scale, so a 4.46× zoom does
not inherently mean enlarging an old bitmap.

The current [player](spike/site/watch_player.js) is 433 lines, and the
[stage](spike/site/watch_stage.js) is 166, before Vue integration and checks.
These are modest enough to own for a talk. They implement a specific SVG/SMIL
subset, however, rather than a general SVG renderer: explicit hex paints,
simple transforms, rotating keyframes, and a limited path-morph grammar.
Static path parsing is broader because it delegates to `Path2D`.

The claimed “throw on any unsupported feature” boundary is also incomplete.
By code inspection, `Reader.children()` accepts a `<style>` element without
interpreting or validating its rules. Adding `path { stroke: ... }` there
could change the browser SVG while the canvas silently keeps the old paint.
Some animation placements are skipped, too: a group-level `<animate>` is
ignored by the child walker. This is not a demonstrated fault in today's
generated watch. It is a reason to tighten the input contract before treating
the parser as protection against future drawing changes.

Canvas therefore needs a small, maintained fidelity check alongside the
existing SVG checks. C1 is a strong starting point: it tests several times,
including accumulation and the 60 s loop, camera positions, and pixel ratios.
It does not prove every intermediate fade or every future feature. Add
targeted cases when those features arrive rather than expanding the player
into a general-purpose SVG implementation.

**The fade is a real semantic difference.** SVG applies a group's opacity
after composing its children. The canvas spike applies alpha to each fill
and stroke. At half opacity, two overlapping opaque paint operations can
produce 75% coverage where an isolated group would produce 50%. This explains
the hidden contours that reappear in the saved
[mid-fade comparison](evidence/fade/chromium-at1-opacity0.5.png), with SVG on
the left. The low average pixel difference includes a lot of unchanged
background; it should not be treated as proof that the effect is invisible.
The distinction follows the [SVG compositing model](https://www.w3.org/TR/SVG2/render.html#ObjectAndGroupOpacityProperties).

For exact parity, render each independently faded SVG group into a transparent
scratch surface, then composite it at that group's opacity in the original
paint order. A scratch surface can be reused sequentially; one permanent
canvas per part is not inherently necessary. Bounds and nested groups need
care, and this work must be measured during the fade.

The proposal to use just two layers, before and after the hairspring, preserves
its stacking position but generally changes how the fading parts overlap
with one another. The README acknowledges this; I7 in the investigation
overstates it as a match. Choose an intentionally different fade if it looks
good, or implement the actual grouping. Do not assume the exact version has
already passed the performance test.

**Keep clipping as the default.** The erase optimization removes all pixels
already on the destination inside a wheel's hole. Ordinary clipping only
limits the current group's drawing. If a newly added wheel, annotation, or
background feature lies in that hole, erase can remove it too. It also
discards the clip's outer rectangle, so equivalence depends on that rectangle
not cutting off any intended drawing. Nested clips need particular care.

Today's pixel comparisons support today's geometry. They do not establish
the required invariant for arbitrary future layouts and visibility sets.
The performance gain is mostly fewer single-refresh misses at 120 Hz;
ordinary clips already passed the main test in installed Firefox 156/157.
That makes clips the better maintenance default for a talk expected to gain
more wheels. Keep erase only as an optional, guarded optimization if a real
presentation setup needs it. A guard must cover the entire affected geometry,
including strokes and every relevant view; sampled pixels alone are not a
geometric proof. See [C16–C17](INVESTIGATION.md).

There is a separate occlusion problem shared by both renderers: hiding the
upper wheel does not automatically remove the hole clipped out of the wheel
beneath it. Later views need a policy for those hidden surfaces. The
[zoom plan](../2026-09-25-zoom-to-hairspring/PLAN.md) already identifies this.
Choosing canvas does not solve it.

**Resolution and resource costs remain relevant.** Canvas needs correct sizing
on fullscreen changes and when moving between screens with different pixel
ratios. The spike's `fit()` checks displayed size each frame and resizes only
when needed. Resizing resets the bitmap and drawing state, which the renderer
must reconstruct. At the measured 3456 × 1950 deck size, one four-byte RGBA
surface is about 25.7 MiB, before browser overhead; another scratch surface
roughly adds that much storage if full-sized. This is an estimate, not a
measured memory allocation. The backing store need not grow by 4.46² for
the zoom: the camera changes which paths land in the fixed viewport.

The CPU results do not justify choosing canvas to save battery. In C19's fair
test-page comparison, it used about 0.20 core less in Firefox and 0.12 core
more in Chromium. GPU work and power were not measured. Canvas also still
shares the main thread with Slidev in this implementation. A worker with
`OffscreenCanvas` is a possible later response to measured main-thread
contention, with added data-transfer and lifecycle work; it is not required
by the present evidence. Canvas sizing, bitmap reset, fallback content, and
worker rendering are defined in the [HTML canvas standard](https://html.spec.whatwg.org/multipage/canvas.html).

**Keep the parts of the architecture that work with either renderer.** The
persistent global watch layer, named slide views, and one mechanism timeline
are the important decisions for a talk with many zooms. Both renderers fit
them. Slidev's internal context import, transparent slide marker, presenter
previews, and export behavior need maintenance whichever drawing API wins.

Use SVG stills for the overview, presenter's next pane, and exported pages.
That preserves the existing checking pipeline and gives vector output a
chance to survive PDF export; inspect the resulting PDF before promising it
is entirely vector. The canvas spike's `/export` screenshots establish that
the views appear, but its loop continues running and it does not yet pin a
common mechanism time. Neither spike supplies the missing next-pane and
overview stills. Deterministic export needs explicit view and time selection.

Keep slide text, labels, and controls in HTML or SVG overlays. Canvas pixels
do not provide per-part accessible semantics; SVG elements make those easier
to attach, though SVG is not automatically accessible either. A static mode
and a description of the important mechanism belong in either design.

The planned 30–45° hairspring tilt should not decide this choice. Both can
show a flattened projection; neither produces ribbon thickness, perspective,
or self-occlusion merely by tilting the existing line. A separately generated
3D view or clip can meet the stopped 2D spring at a chosen phase. The user
already identified stopping there as potentially useful pedagogy. Preserve
geometry and time as explicit inputs so this handoff stays possible.

**Maintaining both live renderers.** Keeping the generated SVG already forms
part of the canvas design: the player reads it, and the art checks use it.
Keeping SVG available as an alternative renderer for the whole deck adds a
separate, manageable obligation.

| Commitment | Additional work beyond adopting canvas |
| --- | --- |
| Retain generated, animated SVG artwork | Almost none; it is already the canvas player's input and the art checks' subject. |
| Support SVG as an alternative live renderer | A small adapter, shared-stage refactoring, and additional integration checks. |
| Guarantee equally smooth performance in both renderers across supported browsers | Potentially substantial and unpredictable; this includes the unresolved SVG performance work. |

For the middle option, **budget roughly 1–2 additional engineering days during
production integration**, including validation. This is a planning estimate
from the current code, not a measured implementation time. It assumes the
existing drawing features and accepts the documented performance differences;
it does not include making SVG equally smooth or adding new rendering features.

The generator, geometry, keyframes, named views, camera movement, fade
sequencing, navigation, labels, and preview/export policy should be shared.
The main refactor is to separate those presentation responsibilities from
canvas sizing and drawing in `WatchStage`. The comparison page already
contains much of the SVG-specific camera and stroke code.

The canvas adapter draws the calculated state. The SVG adapter updates its
camera transform, compensated stroke widths, and group opacity, while native
SMIL animates the mechanism. Coordinate its clock when starting, resuming,
pausing, or seeking; SVG provides the necessary
[clock APIs](https://www.w3.org/TR/SVG11/struct.html#InterfaceSVGSVGElement).
The shared controller should define the intended mechanism time, without
requiring both renderers to use the same internal animation implementation.

Choose the renderer at page load and keep only that renderer active. Switching
in the middle of a zoom would add synchronization work with little benefit
for this talk. A page-load option is enough for comparison, fallback, and
trying a newer browser's SVG renderer.

| Future change | Additional maintenance from keeping live SVG |
| --- | --- |
| Add a gear using existing primitives | Little: generate it once and check both outputs. |
| Add a view or adjust timing | Little, provided view data and sequencing stay shared. |
| Add gradients, masks, or another animation type | Potentially significant, chiefly because the canvas player must implement the new feature. Keeping generated SVG as the reference already creates much of this obligation. |
| Upgrade browsers or Slidev | Exercise both renderers in the deck, including navigation, presenter view, and export. |
| Require identical intermediate fades | Resolve the canvas group-opacity difference; that cost remains whether SVG is a live option or only a reference. |

The recurring expense is mainly verification. Canvas fidelity already needs
SVG comparisons; the added checks cover the live SVG adapter and its deck
integration. Keep SVG functionally correct, document intentional visual
differences, and record performance separately. A known Firefox hitch need
not block a canvas release merely because SVG remains selectable.

This gives us a maintained reference and fallback, and a practical route back
to SVG if browser improvements remove the reason for owning the canvas player.
It stays inexpensive only while the two renderers share the presentation
logic; two independent copies of the deck and transition code would drift.

**How I would keep the canvas commitment small.**

1. Keep Python as the authority for geometry and keyframes, with SVG output
   retained. Initially read the generated SVG with a documented, enforced
   subset. Export camera and kept-part data explicitly instead of parsing
   CSS text with `viewsFrom()`.
2. Keep renderer code separate from slide sequencing. More gears using the
   same primitives should need no renderer changes. Provide canvas and SVG
   adapters, with canvas as the default and selection at page load. A later JSON export from
   the same Python model is reasonable if the SVG adapter becomes awkward:
   two generated outputs do not have to mean two sources of truth.
3. Use ordinary clipping. Judge the fade in motion, then either document
   the accepted per-shape appearance or implement and measure group opacity.
4. Finish the common integration: named parts beyond `rest`/`hairspring`,
   still previews, deterministic export, rapid forward/back navigation,
   hiding and resuming, resizing, and a deliberate pause/seek clock. The
   current elapsed-time clock is useful, but it is not yet a pause controller.
5. Retain a small SVG-versus-canvas comparison page for art changes and
   browser upgrades. Test repeat boundaries, kept-part combinations, partial
   fades, and a few zoom positions in both browsers. Also check unsupported
   inputs fail clearly. There is no need to carry every experimental option
   into the production deck.
6. Before presenting, exercise the completed deck in Firefox 157 and Chrome
   with the actual presenter/projector arrangement. Include a cold start,
   repeated zooms, and a longer dwell. A recent Windows laptop remains a
   meaningful untested part of the repository's portability requirement.

If SVG passes that same practical audition and you find its remaining motion
acceptable, I would choose SVG to avoid owning the player. If smoothness in
both browsers is non-negotiable, the evidence currently favors canvas with
the bounded responsibilities above. A future Firefox fix could make SVG
equally smooth; retaining the SVG and separating views from rendering keeps
that decision reversible.

Reviewed sources: the zoom task's [request](../2026-09-25-zoom-to-hairspring/instructions.md),
[plan](../2026-09-25-zoom-to-hairspring/PLAN.md),
[investigation](../2026-09-25-zoom-to-hairspring/INVESTIGATION.md),
[rendering options](../2026-09-25-zoom-to-hairspring/RENDERING-OPTIONS.md), and
[spike summary](../2026-09-25-zoom-to-hairspring/spike/README.md); this task's
[context](CONTEXT.md), [plan](PLAN.md), [README](README.md), and
[investigation](INVESTIGATION.md), including C20–C22 and the corrections.
Implementation observations come from the linked player and stage, the spike
Vue layers, and [the current generator](../../art/skeleton_watch.py).
