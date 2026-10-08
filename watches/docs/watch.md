# The live watch and the diving board

**Covers:** this talk's live art: the skeleton watch in WebGL (its files, its
design, how a slide shows it: pieces, views and moves, the frontmatter keys, line widths when zooming, its
measured budgets) and the diving board on the Hairspring slide.
**Read before** you change `watch/`, `art/`, the watch's frontmatter,
`global-bottom.vue`, `slide-bottom.vue`, the diving board, or the slides that show
them. The rules for WebGL art in any talk are in
[`stem/docs/webgl.md`](../../docs/webgl.md); read it first for `webgl/`.
**Tasks:**
[`2026-10-07-watch-primitives`](../tasks/2026-10-07-watch-primitives/PLAN.md) (named pieces, fitted views, one rule for every move),
[`2026-10-07-gears-slide`](../tasks/2026-10-07-gears-slide/PLAN.md) (the Gears slide; the free spin for any slide; a narrow picture centred in the left 60%),
[`2026-10-07-tick-tock-words`](../tasks/2026-10-07-tick-tock-words/PLAN.md) (the words at each strike),
[`2026-10-06-validation-speed`](../../tasks/2026-10-06-validation-speed/PLAN.md) (print readiness and validation scheduling),
[`2026-10-04-balance-rim-marks`](../tasks/2026-10-04-balance-rim-marks/README.md) (radial screws that show the rim's swing),
[`2026-10-04-rest-shape-final-review`](../tasks/2026-10-04-rest-shape-final-review/README.md) (final selection, cleanup, and review),
[`selection-and-layering`](../tasks/2026-10-04-leader-path-comparison/selection-and-layering/README.md) (the selected leader and reference paint order),
[`2026-09-24-cover-watch`](../tasks/2026-09-24-cover-watch/PLAN.md) (a skeleton
watch on the cover),
[`2026-09-25-eta-6497-orientation`](../tasks/2026-09-25-eta-6497-orientation/PLAN.md)
(the layout of the movement),
[`2026-09-25-zoom-to-hairspring`](../tasks/2026-09-25-zoom-to-hairspring/PLAN.md)
(the opening: zoom, fade, tilt),
[`2026-09-26-zoom-line-contacts`](../tasks/2026-09-26-zoom-line-contacts/README.md)
(parts touch in the model, not through ink),
[`2026-09-28-webgl-planning`](../tasks/2026-09-28-webgl-planning/PLAN.md),
[`2026-09-29-webgl-watch`](../tasks/2026-09-29-webgl-watch/PLAN.md) (the build,
the budgets),
[`2026-09-29-geometry-problems`](../tasks/2026-09-29-geometry-problems/instructions.md)
(pallet stones, the balance's rim),
[`2026-09-30-flexing-ruler`](../tasks/2026-09-30-flexing-ruler/PLAN.md) (the
ruler that the diving board replaced),
[`2026-09-30-flash`](../tasks/2026-09-30-flash/PLAN.md) (the balance flash),
[`2026-10-01-raised-escapement`](../tasks/2026-10-01-raised-escapement/README.md)
(the lower oscillator and upper roller),
[`2026-10-03-pool-edge`](../tasks/2026-10-03-pool-edge/PLAN.md) (the pool-edge comparison), and
[`2026-10-03-rest-shape`](../tasks/2026-10-03-rest-shape/PLAN.md) (the rest outline and its callout), and
[`leader-correction`](../tasks/2026-10-03-rest-shape/leader-correction/PLAN.md) (the leader's contrast), and
[`2026-10-04-leader-path-comparison`](../tasks/2026-10-04-leader-path-comparison/PLAN.md) (whole-path routing, the single curl edge, and the original-path comparison).

## The files

| Path                                                     | What it holds                                                                                                                                                          |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `webgl/scene.ts`                                         | the types of a scene: `INKS`, meshes, lines, silhouette edges, clip discs, groups, views, pieces, the palette; `checkScene`, `checkPalette`                            |
| `webgl/renderer.ts`, `mesh.ts`, `stage.ts`, `stills.ts`  | the renderer; extrusions, ribbons and their triangles (earcut); the stage (renderer, model and frame loop); the stills                                                 |
| `webgl/timeline.ts`                                      | the choreography, with no DOM: the one rule for every move (fades, camera, tilt), and the flash; the durations                                                         |
| `webgl/math.ts`, `checked.ts`                            | matrices; `at` and `check`, for what is a bug if it is false                                                                                                           |
| `webgl/probe/`                                           | a page with one canvas and `window.watchProbe.render(options)`, for the pixel and fade checks; `checks.ts`: `window.webglChecks()`, the renderer's browser checks      |
| `watch/design.json`                                      | written by `art/watch_design.py`; never edit by hand. `art/watch_design.py --check` compares what the file means, not its bytes (`pnpm format` rewrites its spacing)   |
| `watch/design.ts`, `path.ts`, `shapes.ts`, `generate.ts` | read and check the design; outlines; the meshes, heights, pieces and their extents, the named views, `fittedView`                                                      |
| `watch/teeth.ts`, `teeth.test.ts`                        | the train's teeth: cycloidal wheel teeth and the pinion leaves they drive, also a few at a time (a span); tests that each pair meshes without overlap                  |
| `watch/palette.ts`                                       | which theme variable colours each ink; `slidePalette()` reads them from the page, as a slide's classes change them, and the browser works out a recipe (`color-mix()`) |
| `art/theme.py`                                           | the theme's palette for the scripts that write files (`diving_board.py`, `favicon.py`): it works out each recipe as the browser does                                   |
| `watch/model.ts`, `state.ts`, `stills.ts`, `instance.ts` | the mechanism, the balance's settle and the train's free spin; frontmatter to state; the watch's stills; the shared instance                                           |
| `watch/deck.ts`, `deck.test.ts`                          | slides.md as Slidev reads it, for the tests; the check that every slide's pieces and view exist                                                                        |
| `global-bottom.vue`, `slide-bottom.vue`                  | the live canvas and the live diving board, and the kind of each move; the still and the posed board on each printed page                                               |
| `watch/board.ts`, `components/DivingBoard.vue`           | the board's frontmatter to its target, and its clock (`BoardClock`); the component that inlines the SVG and sets its time                                              |
| `watch/navigation.ts`, `slide-state.ts`                  | a step forward, a step back or a jump; `window.slideState()` for `tools/navcheck.py` ([`navigation.md`](../../docs/navigation.md))                                     |
| `watch/callouts.ts`, `components/WatchCallout.vue`       | where the Escapement slide's leaders end, on the slide (`escapementMarks`); a callout: a label, and a leader from one of its words                                     |
| `components/TickTock.vue`                                | the words "tick" and "tock" at each strike of the jewel, in the watch's layer; where they start (`jewelStrikes` in `watch/callouts.ts`)                                |
| `types/`                                                 | two small `.d.ts` files, mapped by `tsconfig.json` `paths` to `@slidev/client`. `vue-tsc` would otherwise check Slidev's own source, which fails our strict settings.  |

## Changing the design

Edit `art/watch_design.py`, then run `uv run art/validate_watch_design.py`. It
checks the Python and the layout (meshing, clearances), and writes
`watch/design.json`. To move the wheels, run `art/search_watch_layout.py`
first. `uv run ../tools/validate.py` does not run it: run it yourself after
each change to the design.

## The layout of the movement

**The main focus of a slide is on its left.** The audience looks left first, so
a slide's picture goes on the left and its callouts and text go on the right.
The Hairspring slide follows it: the hairspring is at slide x 275 (`HAIRSPRING_TARGET` in
`watch/generate.ts`), and the diving board is shifted left with it.

Therefore the train runs from the hairspring to the fourth wheel from left to
right, so that the image stays on the left of each slide and the callouts on
the right. The centre wheel is at the watch's centre. The third wheel, fourth
wheel, escape wheel, fork and balance are the mirror image of an ETA 6497's
layout about the vertical line through the centre, then turned about the centre
until the balance is at 11 o'clock. The barrel is at `BARREL_ANGLE`, as near
5 o'clock as the third wheel allows: the third-barrel gap must stay 12 +/- 1 px.
The hands still turn clockwise: the layout moves the arbors, not the turning
directions. `art/watch_design.py` holds the numbers, and `LAYOUT` the angles.

The cover has the watch case on the right and the title on the left, as it did
before: the layout changed only what is inside the case.

Use the ETA reference for the gross layout.
Choose individual part details for clear motion and fit with the drawing style.

## The teeth

Every wheel that drives a pinion has watchmaker's cycloidal teeth.
The face is an epicycloid drawn by a circle with half the pinion's pitch radius.
The flank is radial. A tooth is half the pitch wide.
`watch/teeth.ts` makes the outlines.

The tip and root circles are `outer` and `inner` in `watch/design.ts`.
The layout's clearance checks use these circles, so the teeth must not extend beyond them.
A pinion leaf has radial flanks and a round end.
Its width on the pitch circle is `TOOTH_FORM.leafWidth` modules.

`ToothForm.faceSegments` must be a positive integer.
`leafWidth` must be finite and positive; `contactSlack` must be finite and nonnegative.
The tooth functions reject invalid settings before they make an outline.

Each pinion turns back against its motion by half the backlash, less `TOOTH_FORM.contactSlack`.
This puts its leaves against the driving flanks.
The wheel always drives, so only that side must keep contact.
`watch/teeth.test.ts` turns each pair through one tooth.
It fails on overlap or a driving-side gap wider than the ink can cover.
It also checks that each pinion leaf has four corners.
Each round end uses one semicircular arc to prevent a false corner at its tip.

`wheelToothShapes` and `pinionLeafShapes` draw some of the teeth or leaves,
each a closed outline of its own, closed along the root circle.
`meshedSpan` finds teeth next to each other in the middle of the mesh at the
train's start, and the leaves that they drive. The ratio is whole, so a tooth
drives the same leaf at every turn. `watch/teeth.test.ts` turns the pair
through the mesh, and fails if a tooth of the span touches a leaf that is not
its own.

The escape wheel's club teeth are separate: they act on the pallet stones.
`escapeOutline` in `watch/shapes.ts` makes them.

**Not an oversight:** the pinion has no cycloidal face, and wheel tips stop at the tip circle.
Engineering cycloids on both gears looked less like a watch; full pointed tips changed the layout's circles.

## Oscillator geometry and framing

The balance wheel sits below the hairspring. The roller sits above the spring.
The jewel rises from the roller to meet the pallet fork at escape-wheel height.
The jewel is a D, as in a Swiss lever: a circle with a flat that faces the fork.
It is as wide as its circle, so it fits the fork's notch as a round jewel would.
`JEWEL_RADIUS` and `JEWEL_FLAT_OFFSET` in `watch/generate.ts` hold its size.
The staff connects the balance hub, collet, and roller. The spring's outer end attaches to the fixed stud.
The case extends below the balance. The train and fork keep their meshing heights.
`watch/generate.ts` computes these heights from the fork and the parts' thicknesses.

The hairspring view keeps its on-slide target and zoom when the oscillator height changes.
Its camera pivot uses the spring's midpoint in height. Thus the spring stays at its target as the view tilts.
`watch/generate.ts` holds the target and zoom.

On the Hairspring slide, the roller flashes with the oscillator before the zoom.
Then it fades with the balance, jewel, staff, fork, and other mechanism parts.
Only the hairspring, collet, and stud remain visible, so the roller does not cover the coils.
The slide's `watch` and `watchFlash` lists control this.

## The Balance Wheel slide

The Balance Wheel slide has the same view, tilt and swinging hairspring as the end of the Hairspring slide.
It adds the balance wheel and its staff to the Hairspring slide's pieces. Entering it, they
fade in (not the roller or the jewel) while the rest
shape of the Hairspring slide (the dashed line, the callout and its leader) fades out.
The Balance Wheel slide has no code for this. It has no `board` key, so the live board's
target there is "off", and the board's layer fades its rest shape out in
`FADE_SECONDS`, as long as the watch's fade (`--watch-fade`, set by
`global-bottom.vue`). Going back from 3 to 2 fades it in again while the wheel
fades out, and from 4 to 3 nothing changes
([`navigation.md`](../../docs/navigation.md)). A printed page of the Balance Wheel slide has
no board.

## The Escapement slide

The Escapement slide shows the whole path from the escape wheel to the
balance, except the escape wheel's pinion, at `watchTilt: 20`, in a fitted
view ([Fitted views](#fitted-views)). Entering it, the camera zooms out with
only the Balance Wheel slide's picture on the screen: the pieces that both
slides show. Then the roller, the impulse jewel, the pallet fork and the
escape wheel fade in. Going back, they fade out, and then the camera zooms in.

- **The view fits the pieces.** The balance nearly fills the height under the
  subtitle, against the left edge. The callouts use the room on the right
  and in the gaps. If the pieces change, the view follows them, and so do
  the leaders; the labels do not: check them.
- **The escape wheel's arbor stands on the wheel.** Each wheel's arbor runs up
  from the top of its wheel, through its pinion, to `ARBOR_CAP` above the
  pinion. With the pinion left out, the arbor still touches the wheel.
- **No flash yet.**

### The callouts

Three callouts appear, one at each click: "Wheel driven by hidden gear",
"Pallet blocks wheel" and "Jewel strikes pallet". Each is a
`components/WatchCallout.vue` in `slides.md`: a label in ink, 28 px, weight
600, and a leader. The first callout also draws the drive arrow.

- **These are keyword callouts** (`keyword`): each leader points at what one
  word names ("Pallet"), not at the whole label ("Pallet blocks wheel"). So
  the word and its leader are in the second, 4 px, and the rest of the label
  is ink ([`illustrations.md`](../../docs/illustrations.md), "Leaders"). The
  leaders pass the back-row gate
  ([measurements.md](measurements.md#escapement-leaders-alone)). The Hairspring slide's
  leader is a reference mark's: muted, as the dashed rest shape is.
- **The newest callout is the focus; the ones before it dim** (to
  `--esc-dim` in the slide's style: less than the "Before clocks" cards, so
  that a dimmed callout stays easy to read). From click 3 the wheel's callout, with its
  leader and the drive arrow, dims; at click 4 the pallet's dims too. At
  click 5 the balance swings again, the jewel's leader fades out, and the
  other two come back in `--text-fade`. Each dim waits for the callout that
  takes the focus (`--watch-fade` at click 3, `--watch-rest-delay` at click
  4), so the focus never moves to empty space. A class on a wrapper names
  the focus at each click (`esc-focus-pallet`, `esc-focus-jewel`); the CSS
  is in the slide. The dim is on the callout's parts, not its root, which
  carries the `v-click` classes.
- **The drive arrow is muted, 4 px:** muted is the art's colour for what
  acts on the subject, and the arrow shows the force on the escape wheel.

- **The slide places each label; the watch places each leader's end.**
  `escapementMarks` in `watch/callouts.ts` computes the ends from the design
  and the slide's view and tilt, with the renderer's own camera
  (`viewProjection`). If the design or the view changes, the leaders follow.
  The labels do not: check them after such a change.
- **A leader starts at its word.** The slide marks the word with
  `<span class="callout-word">`. The component measures where the browser
  puts it, and the leader leaves the word's box on the side that faces its
  end.
- **The first leader bends** (`bent`): "Wheel" has the label's second line
  under it, which a straight leader to the wheel crossed. A bent leader leaves
  the word level, on the side that faces its end, and turns after
  `ELBOW_RUN`, as the Hairspring slide's leader does.
- **The drive arrow** is an arc on the escape wheel's face, at its pinion's
  radius, where the fourth wheel's teeth push. It is centred on the line to
  the (hidden) fourth wheel and points the way the escape wheel turns.
- **Not an oversight: the leaders do not follow the moving parts.** They end
  at fixed poses. The jewel's leader ends inside the jewel with the balance
  at rest, in the fork's mouth, where the jewel strikes. It ends at the D's
  deepest point: the centre of the largest circle inside it. A leader that
  followed the jewel would sweep across the balance.
- **The balance rests for the jewel's callout** (`watchAtRest: true` at
  click 4, `false` at click 5). A swinging jewel is at its leader's end for only about
  0.2 s of each swing. The callout appears only when the balance is at rest
  (the class `after-balance-rest`), so its leader never points at an empty
  notch. The settle waits for the end of a swing, so this is 0.8 to 1.8 s
  after the click. At click 5 the balance swings again, and the viewer knows
  which part to follow. The leader fades out (`showLeader`), because the
  jewel leaves its end; the label stays. Going back to click 4, the leader
  comes back when the balance is at rest again.
- **Each leader ends where only one part can be meant**
  ([`illustrations.md`](../../docs/illustrations.md), "Leaders"). The
  wheel's and the pallet's leaders end on the paper, `LEADER_GAP` px outside
  their parts (`watch/callouts.ts`; the callout's `stop` and `clear`). Each
  aims at a point of its part and stops short of the first outline that it
  meets: the escape wheel's tip circle, or the fork at either bank. The
  jewel's leader ends inside the jewel: outside it are only the fork and the
  roller.
- **The pallet's leader aims between corners A and B of the fork's lower
  arm** (`palletAim`). B is the corner before the fork's lowest one, where
  the back of the arm turns up. A is the first sharp inward corner after
  it, where the lower stone meets the arm. The aim is halfway between A at
  its leftmost and B at its rightmost over the fork's swing, so the leader
  comes up to the bottom of the arm, not to a stone or the pivot.

### Tick and tock

From click 5 (`watchTickTock: plain`), each time the jewel strikes the fork, a
word appears beside the horn that it strikes: "tick" at the upper horn,
"tock" at the lower one. The jewel enters the notch past one horn and
strikes the other, ahead of it (`jewelStrikes` in `watch/callouts.ts`). It appears at once, and fades out in 0.8 s as it drifts 40 px
away: the sound goes out from the strike. `components/TickTock.vue` holds
the type, the times and the distances.

- **Not an oversight: the words cut in.** All other text fades in
  ([slide-patterns.md](slide-patterns.md#text-fades)). These are a sound.
- **A strike is the start of a tick window**, when the jewel reaches the
  fork (`strikesBetween` in `watch/model.ts`). There is one a second, so
  each word is gone before the next appears.
- **The words follow the model's clock, not a timer.** At each animation
  frame, the component asks the model for the strikes since the last frame
  (`WatchModel.strikes`), with the moment of each. A timer would drift
  from the jewel.
- **They drift as mirror images**: away from the fork's axis, leaning
  22.5° away from the fork (`STRIKE_LEAN` in `watch/callouts.ts`), so NNW
  and SSW on the Escapement slide. The two strikes are mirror images about the axis,
  so the two words read as one sound from the notch. If the design or the
  view changes, the strikes and the ways follow.
- **They live in the watch's layer**, because they need the model's clock.
  A word that has started ends its fade after a click back or a change of
  slide: the sound has been made. No new word starts then.
- **They are lowercase, bold, with no quotes**: a sound, not a label or a
  quotation. Ink, with an outline in the paper's colour, so they read over
  the drawing.
- **Click 6 is a trial**, to compare by going back and forward
  (`watchTickTock: burst`): the same words, times and drift, as 1960s
  _Batman_ bursts in the theme's colours. Each is a spiked burst, outlined
  in ink: the accent behind "TICK!" and the second behind "TOCK!", so the
  two sounds differ in colour too. The words are capitals in the paper's
  colour, outlined in ink, with an ink shadow. "TICK!" tilts one way and
  "TOCK!" the other. A burst is larger than a word, so it starts farther from the
  horn. It uses the theme's sans at 600: a heavier weight would need a new
  import in the theme.
- **`slideState`** reports how the words show (`tick-tock`, settled: off,
  plain or burst). A word's opacity is the phase of the mechanism, so it
  is not continuous.
- **A printed page shows no words**: a still has no strikes.

### The escape wheel spins alone

Click 1 shows the force's callout. At click 2 the pallet fork and the
balance fade out, and the escape wheel spins on its own: the force turns it,
and nothing holds it back. At click 3 they fade back in, and the pallet stops
the wheel. At click 2 the slide shows only the escape wheel and its arbor
(`watchClicks`): a spinning wheel would pass through the pallet. The camera
frames all the slide's pieces at every click (`watchView`), so it does not
move ([What the camera frames](#what-the-camera-frames-and-what-shows)). How
the spin starts and stops is in [The free spin](#the-free-spin).

- **One thing at a time.** At click 3 the mechanism fades in first; the
  pallet's callout fades in only when it is all there, so that its leader
  never points at empty space. The callout has the class `after-watch-fade`
  (`style.css`, and [slide-patterns.md](slide-patterns.md#text-fades)).

## The Gears slide

The pair meshes without overlap throughout its motion ([The teeth](#the-teeth)).

The Gears slide shows the fourth wheel (its wheel, hub and arbor) and the
escape wheel's pinion with its arbor: 16 teeth drive 8 leaves. It leaves out
the fourth wheel's own pinion (which the third wheel drives), and the seconds
hand (on the fourth wheel's arbor) until its last click. It has no code: its
frontmatter names the pieces, the tilt (20), `watchMoveWith: none` and the
spin.

| Click | What shows                                                                           | The gears    |
| ----- | ------------------------------------------------------------------------------------ | ------------ |
| 0     | the two gears                                                                        | turn freely  |
| 1     | and the span, in the flash's colours (a trial): four teeth and the leaves they drive | turn freely  |
| 2–4   | and the text, one line a click                                                       | turn freely  |
| 5     | the span, solid (a trial); the text stays                                            | turn freely  |
| 6     | the gears and the rest of the Escapement slide's mechanism; the span and text go     | tick with it |
| 7     | and the seconds hand, and then its text                                              | tick with it |

- **The step from the Escapement slide, and back, jumps the camera.** The
  audience has not seen these pieces, so their place in the watch does not
  matter. With `watchMoveWith: none`, nothing is on the screen while the
  camera moves, so it jumps: the Escapement slide's picture fades out, and
  the gears fade in ([The one rule](#the-one-rule)). The new slide's text
  waits for the old picture to go.
- **The view fits the pair.** The pinion is above the fourth wheel in the
  movement's layout, and a view does not turn, so the pair is tall: its
  height sets the zoom. It is narrower than 60% of the slide, and its
  right edge is set (`watchRight`, [Fitted views](#fitted-views)): the
  fourth wheel's teeth reach to 70 px left of the text. The value is the
  text's left (`.gears-sentence`, in `slides.md`), less the gap and half
  the teeth's 2.5 px outline. If you move one, move the other.
- **The gears turn freely, from the start** (`watchSpin` on the slide; [The
  free spin](#the-free-spin)). Nothing holds them back, so they turn
  smoothly, not a tick at a time. Its value is the speed, in degrees a second
  of the escape wheel: the slide's comment says how many seconds a turn of the
  pinion and of the fourth wheel take. The pinion turns twice for each turn
  of the fourth wheel. From the Escapement slide, the spin starts when the old
  picture has faded out, so the gears start to turn as they fade in.
- The tilt shows the arbors as posts.
- **At clicks 1 to 5, the span shows: the same four teeth on each gear, in
  the second.** The gears turn on, at the same speed. The teeth have the same pitch, so the four teeth are the
  same length of rim on each gear: half the pinion, but a quarter of the
  wheel. The span's teeth drive its leaves (`meshedSpan`), so once in each
  turn of the wheel, colour meshes with colour for a quarter of that turn.
  Between, the pinion's coloured half meets plain teeth. Where the spans are
  in the mesh when the click comes depends on the train's position, so the
  first pass can take up to one turn of the wheel.
  - **Two styles, to compare (a trial; keep one).** Click 1 shows the flash's
    colours (`fourth wheel span wash`, `escape pinion span wash`): faces in
    the second's wash, outline in the second. Click 5 shows the span solid
    in the second, with the gear's own outline (`fourth wheel span`,
    `escape pinion span`). Measured, the wash is close to the gear's faces
    in every palette (at most 19 ΔE), so the flash style shows mostly
    through its thin outline. `tools/scenecheck.py` allows both styles while
    the trial is open (`MARK_WASH_ROLE`); delete the rejected one there too.
  - **A span is the whole tooth**: top, bottom and sides, as high as its
    gear and at the same place as its faces, in its group, hidden where the
    gear is. It is an overlay (`Mesh.overlay`), so its faces show over the
    gear's.
  - **The solid style's outline stays the subject's.** In the second, a
    tooth and the leaf that it drives merged where they touch.
  - **One colour, the second**: its art job is "look here". In each of the
    four top-pick palettes it was at least 54 CVD ΔE from the gear's faces
    (measured on 2026-10-08).
    The span needs only to differ from the plain teeth, so it does not need
    a second colour. Not an oversight: two marks on each gear in two colours
    were measured, and are weaker in Marmalade. See the task.
  - **No keyword callout on the gears while the span shows**: its word and
    leader are in the second too, and would merge with the span.
- **The text reads the span** (in `slides.md`, on the right of the gears),
  one line a click (clicks 2 to 4): "Half of the small gear", "A quarter
  of the big gear", "Twice the size, half the speed. Exactly." The same length
  of rim is half of one gear and a quarter of the other, so the big gear is
  twice the size; the rule follows. "Twice … half" says the direction of
  the ratio (the speeds go as the sizes, upside down), and "exactly" holds
  because teeth cannot slip. The words say "small gear" and "big gear", not
  "pinion" and "wheel": the audience does not know those words. The text is
  in the ink, not the second: the second marks the span. It stays up while
  the span changes style at click 5.
- **At click 6, the rest of the Escapement slide's mechanism fades in**
  (`watchClicks`): everything that the talk has explained so far. The camera
  frames the gears at every click (`watchView`), so it does not move: the
  escape wheel and the fork's right end show, and the rest is off the slide
  on the left. The span and the text go. The pallet is back, so the spin ends at the same click
  (`watchSpin: false`): the gears stop at the next tooth, and then tick with
  the escape wheel.
- **At click 7, the seconds hand fades in**, on the fourth wheel's arbor. The
  fourth wheel turns once a minute as the mechanism ticks, so the hand keeps
  real time. Then its text fades in, in the place of the first text: "Once
  a minute. The second hand!" It waits for the hand (`after-watch-fade`).
  The words say "second hand", the everyday word, not the watchmaker's
  "seconds hand". The text does not say that the hand is the first part of
  the watch that we read: the hand shows it.

## Balance rim motion

Four radial screws make the rim's swing visible on the cover and the Balance Wheel slide.
Their heads point outward from the rim and turn with the balance group.
Each head has a slot on its outward face.
The rim, arms, and hub retain their continuous outline.

`BALANCE_SCREWS` in `watch/generate.ts` holds the count, dimensions, and angular phase.
`balanceScrewMeshes` centres them on the rim's assigned height.
The screws use the subject's outline and pale face colours.
Their line widths stay fixed on the screen as the view zooms.

The screws belong to the `balance wheel` piece, so they flash and fade with it.
On the Hairspring slide, they fade with the balance, so only the spring, collet, and stud remain.
On the Balance Wheel slide, they fade in with the wheel.
The camera target, zoom, and mechanism timing remain unchanged.

## How a slide shows the watch

A slide names what it shows, and the layer moves the watch there from what is
on the screen ([`navigation.md`](../../docs/navigation.md)). A new slide needs
no code: its frontmatter names the pieces, and the view and the move follow
from them. The Hairspring slide is the example:

```yaml
watch: [hairspring, collet, stud] # the pieces shown; the rest fades out
watchView: hairspring # a named view, to match the diving board
watchFlash: # flashes before the camera moves
  [
    balance wheel,
    balance staff,
    hairspring,
    collet,
    stud,
    roller,
    impulse jewel,
  ]
watchMoveWith: all # the whole watch is on the screen while the camera zooms in
watchTilt: 20 # degrees: shows that the spring is a ribbon
watchClicks: # what changes at a click, from that click on
  2:
    watchAtRest: true # the balance comes to rest while the diving board covers it
  3:
    watchAtRest: false # it starts to swing again
clicks: 3
```

### Pieces

Each mesh of the watch belongs to one piece, with a name that a slide uses
(`Scene.pieces`; each solid names its piece where `watch/generate.ts` draws
it). `watch: all` shows every piece but the marks that only a slide that names
them shows: the Gears slide's spans (`inAll: false`, `webgl/scene.ts`).

| Pieces                                                                     | What they are                                                   |
| -------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `escape wheel`, `fourth wheel`, `third wheel`, `centre wheel`              | a train wheel with its hub                                      |
| `escape pinion`, `fourth pinion`, … ; `escape arbor`, `fourth arbor`, …    | its pinion; its arbor, which stands on the wheel                |
| `barrel`, `mainspring`, `barrel arbor`                                     | the barrel                                                      |
| `balance wheel`, `balance staff`, `hairspring`, `collet`, `stud`           | the balance wheel with its screws, and the spring               |
| `roller`, `impulse jewel`, `pallet fork`                                   | the rest of the escapement                                      |
| `fourth wheel span`, `escape pinion span`; `… span wash`                   | the Gears slide's span, solid; in the flash's colours (a trial) |
| `seconds hand`, `minute hand`, `hour hand`, `centre pivot`, `chapter ring` | the dial side                                                   |
| `case band`, `strap`, `lug`, `crown`                                       | the case                                                        |

A new part of the model names its piece when it is drawn (`solids.add`), and
a slide can show it at once. `watch/deck.test.ts` fails if a slide names a
piece or a view that does not exist.

### A slide and a click say it the same way

A slide gives the watch's state at click 0. A click changes it from that click
on, with the same keys, in a block under `watchClicks`; a later block changes
it again. A block holds only the keys that say a state (the first seven in
[The keys](#the-keys)); `watchFlash` and `watchMoveWith` are about the step
into the slide, so they are on the slide only. A value says what is so, not
what to do: `watchAtRest: true`, not "settle". So a block can repeat what is
already so, and the layer decides how to get there (the settle waits for the
end of a swing; a spin waits for the fade).

### What the camera frames, and what shows

Two keys say what shows:

- **`watch`: what shows.**
- **`watchView`: what the camera frames.** It is a named view, or a list of
  pieces that the view fits ([Fitted views](#fitted-views)). Without it, the
  view fits what shows.

**To add pieces without moving the camera, show more pieces and keep the
frame**, at a click or on a new slide. On the Gears slide, each click shows more or other pieces
and the slide's `watchView` stays the gears. The Balance Wheel slide shows
more than the Hairspring slide, and both name the view `hairspring`. To show
fewer without moving the camera, do the same: the Escapement slide frames all
its pieces while click 2 shows the escape wheel alone.

A list repeats less with YAML anchors and aliases: `watch: &gears [...]`
names the list, and `*gears` uses it again. A list of pieces can hold lists,
which are flattened, and a piece that is there twice shows once. So
`[*gears, pallet fork]` is the gears and the fork. An anchor holds only
within one slide's frontmatter.

```yaml
watch: &gears [fourth wheel, fourth arbor, escape pinion, escape arbor]
watchView: *gears # the camera frames the gears at every click
watchClicks:
  1:
    watch: [*gears, pallet fork, escape wheel] # more shows; the camera stays
```

### Fitted views

When `watchView` is a list of pieces, or there is none, the view fits those
pieces, or what shows (`fittedView` in `watch/generate.ts`): as large as they fit in `FIT_WIDTH` by `FIT_HEIGHT`,
with their middle halfway between the subtitle's baseline and the slide's
bottom. The main focus is on the left, and the callouts use the room on the
right.

**A picture that takes less than 60% of the slide's width is centred in the
slide's left 60%** (`FIT_FOCUS`). A wider picture starts at `FIT_LEFT`. The
middle is at whichever is further right, so a picture never comes nearer the
left edge than `FIT_LEFT`, and no width makes it jump. (From 556 to 588 px
wide, that keeps it 16 px from the edge, a little right of the centre.) The view tilts about the pieces' middle, so the middle
stays there at any tilt. The baseline (`SUBTITLE_BASELINE`) is measured in
the browser: the theme's title and subtitle sizes set it, so measure it again
if they change. A piece's extent is where it reaches at any time: a turning
part's whole circle, and the spring's reach over a swing.

**A slide can set the picture's right edge instead** (`watchRight`, in px of
the slide), when its gap to the text matters more than the rule: the Gears
slide. The edge is the extent, at the middle of the outline, so the ink
reaches half the outline's width further. The key is part of what the camera
frames, so a click that changes it moves the camera. It needs a fitted view:
with a named view, it stops the deck at load.

The fit uses the pieces' plan, seen from above, and not their height. At a
tilt, a part's height adds to its height on the slide. For a slide that shows
a wheel, the plan sets the zoom, and this does not matter. A tall, thin piece
alone (an arbor, the balance staff) can run off the slide at a tilt: give it a
named view or `watchTilt: 0`. Not an oversight: fitting the tilted extent was
judged not worth its code (the [review](../tasks/2026-10-07-watch-primitives/review.md), F1).

The named views (`cover`, `hairspring`, `crown`; `views()` in
`watch/generate.ts`) are for pictures that must match other art: the cover's
title, and the diving board, whose numbers are copied from the hairspring
view (`art/diving_board.py`).

### The one rule

Every change of the watch, between clicks or slides, follows one rule
(`webgl/timeline.ts`). From the shown pieces A to the shown pieces B, with D
the pieces on the screen while the camera moves:

1. A becomes D: what is not in D fades out, then what D adds fades in (0.8 s
   each).
2. The camera moves (1.8 s) and tilts (1.5 s): zooming in, it moves and then
   tilts; otherwise it untilts and then moves. If D is empty, nothing is on
   the screen, so the camera jumps.
3. D becomes B, as in 1.

D is the pieces that A and B both show (the default), all the pieces of
either (`watchMoveWith: all`: the opening, which zooms in with the whole
watch on the screen), or none (`watchMoveWith: none`: the Gears slide).
`watchMoveWith` is on the later of two slides and applies to the step between
them in either direction. Without a camera move, A becomes B directly. So the
Balance Wheel slide's balance fades in alone; on the way to the Escapement
slide, the camera zooms out with the Balance Wheel slide's picture, and then
the escapement fades in; going back runs it in reverse.

A fade fades its pieces as one picture over the pieces that stay
(`Frame.fade` in `webgl/scene.ts`). A change during a fade (a fast click)
first finishes it: in, if the new state shows every fading piece, else out.
A camera move goes on from where it is. The navigation check waits for each
step to end, so it does not cut a fade short: `webgl/timeline.test.ts` tests
this.

**Flashing and zooming must not happen together: the combined motion is too
visually busy and confusing.** A flash of pieces that are on the screen plays
first, and the change starts when it ends (the Hairspring slide). A flash of
pieces that fade in plays when they are in (the Balance Wheel slide).
`webgl/timeline.ts` holds the flash count and all durations.

### The free spin

A slide can turn the train freely: smoothly and fast, not a tick at a time
(`watchSpin`: a speed, or `false`). The
Escapement slide spins the escape wheel alone; the Gears slide spins the
fourth wheel and the escape pinion.

- **The train has a position of its own, in beats** (`TrainClock` in
  `watch/model.ts`). `Motion` turns every wheel and hand by its own degrees a
  beat times that position. So a spin turns every wheel at its own speed, in
  mesh, as the teeth say. Normally the position follows the mechanism's
  ticks, a whole number of teeth ahead: a tooth of the escape wheel is two
  beats. So after a spin, the stones meet the teeth as they did before it,
  and every wheel stays in mesh, on that slide and every other.
- **The clock does not know what shows.** The slide makes sure that nothing
  that would hold the escape wheel back is on the screen while it spins:
  `watch` leaves the pallet out at each click of the spin.
  `watch/deck.test.ts` fails if a slide spins the train while the pallet fork
  shows.
- **A spin starts when the old picture has faded out** (`FADE_SECONDS` after
  the click), and speeds up in `SPIN_UP_SECONDS`. While the pallet fades, the
  wheel does not move, so it never turns through the stones.
  `watch/train.test.ts` fails if the fade's length changes, on the
  Escapement slide and on the step into the Gears slide.
- **A stop keeps the wheel spinning for `FADE_SECONDS`, while the pallet
  fades back in, and then until the next tooth reaches the pallet.** It stops
  there, a whole number of teeth ahead of the mechanism, and ticks with it
  from then on. The stop takes at most the fade, the time of one tooth and
  one tick. So a spin must be faster than the mechanism (`spinBeats`): a
  slower wheel's next tooth would never reach the pallet.
- **The train only goes forward**, as the mechanism's time does: a fast
  click back during a stop spins on; a stop before the spin has started
  leaves the wheel where it was. A jump shows a spin at full speed, or the
  train in step with the mechanism (`watch/train.test.ts`).
- **Not an oversight: one model, not a second wheel.** A second wheel that
  always spins would need every view to hide it, and a cross-fade between two
  wheels at one place, which the timeline does not have and which flickers in
  the depth test.

### The keys

| Key                                 | Meaning                                                                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `watch: [hairspring, collet, stud]` | the pieces shown, or `all` (but the marks: [Pieces](#pieces)); no key hides the watch. A list may hold lists (YAML aliases)                                                                                                  |
| `watchView: hairspring`             | what the camera frames: a named view (`cover`, `hairspring`, `crown`), or a list of pieces to fit; none: the [fitted view](#fitted-views) of what shows                                                                      |
| `watchRight: 489`                   | px of the slide: where a [fitted view](#fitted-views) puts its pieces' right edge; none: centred in the left 60%, or at `FIT_LEFT`. Only with a fitted view                                                                  |
| `watchTilt: 20`                     | degrees, towards the viewer's side (default 0)                                                                                                                                                                               |
| `watchAtRest: true`                 | the balance is at rest, and the mechanism with it; `false` (default): it swings. To rest, it waits for its next extreme                                                                                                      |
| `watchSpin: 135`                    | the train spins freely, at this speed in degrees a second of the escape wheel, faster than the mechanism's 12 ([The free spin](#the-free-spin)); `false` (default): it follows the mechanism, and a spin stops at the pallet |
| `watchTickTock: plain`              | the words "tick" and "tock" show at each strike of the jewel ([Tick and tock](#tick-and-tock)); `burst`: as comic bursts, a trial; `false` (default): they do not                                                            |
| `watchFlash: [balance wheel]`       | on the slide only: pieces that flash, on the step forward into the slide only ([`stem/docs/illustrations.md`](../../docs/illustrations.md), "Flash")                                                                         |
| `watchMoveWith: all`                | on the slide only: what is on the screen while the camera moves, on the step between this slide and the previous one: `common` (default), `all` or `none`                                                                    |
| `watchClicks: {1: {watch: […]}}`    | on the slide only: for a click, the values of the first seven keys from that click on ([A slide and a click](#a-slide-and-a-click-say-it-the-same-way))                                                                      |

`watch/state.ts` checks each key, and a key of the wrong kind stops the deck
at load with the key's name.

- **A step animates, a jump does not** (`watch/navigation.ts`,
  [`navigation.md`](../../docs/navigation.md)). A step is one click, or the
  next or the previous slide. A jump (a reload, a link, the overview) shows
  the slide's state at once.
- **The flash plays only on the step forward into its slide.** It points to
  where the camera goes. Going back to the cover zooms out with no flash, and
  so does going back from the Balance Wheel slide to the Hairspring slide.
- **The settle:** the balance waits for its next extreme (at most half a
  period, 1 s), then moves to rest in 0.78 s, with no jump in angle, speed or
  acceleration where it starts. The rest of the mechanism stops with it.
- **The mechanism's time only goes forward.** A resume swings on to the
  opposite extreme.
- **Keep text out of the watch's way.** On the Hairspring slide the hairspring is about 105
  to 445 px across, on the left. Callouts go on the right.
- **The cover's title fades as the watch flashes**: the `watch-zoom`
  transition, between the cover and the Hairspring slide only. The new slide's text comes
  in after the camera's move, in either direction: `global-bottom.vue` sets
  `--watch-text-delay` from the stage (`viewEndAt` in `webgl/timeline.ts`).
  Forward, the text waits for the flash and camera move. Back to the cover,
  it waits for the fade, tilt, and camera move.
- **A click's text can wait for the balance to rest.** `global-bottom.vue`
  sets `--watch-rest-delay` from the model (`untilRest` in `watch/model.ts`)
  at each change of state: the time until the balance is at rest, or 0 if it
  is not going to rest.
- **The first block of `slides.md` is a hidden slide with no content.** Slidev
  takes the headmatter from the first slide's frontmatter, and its
  `transition` is both the default of every slide and that slide's own. The
  default is `text-fade` and the cover's is `watch-zoom`, so the headmatter has
  its own block, with `hide: true`. Do not merge it with the cover's block.
- **A click that changes the watch needs a `[click]` line** in the speaker
  notes, as for any click.
- **The watch's layer paints the paper behind a `watch:` slide**, because that
  slide is see-through. When the watch hides (no `watch:`, or the diving board
  covers it), only the canvas fades; the layer stays. Fading the whole layer
  left the page's white behind the Hairspring slide while the watch was hidden.
- **The slide's text paints over the watch** because the slide's layout is
  positioned. A slide with its own layout must keep that.

## Line widths when the view zooms

When the camera zooms into the watch (to the hairspring, $s = 250/56 \approx
4.46$), each line keeps its width on the screen. So parts must not meet only
through their ink. Where two parts touch, one is painted over the other (the
pallet fork over the escape wheel, each wheel's teeth over the pinion it
drives), or their outlines meet on their centre lines (tooth tips on the root
circle). Keep it so when you change `art/watch_design.py` or `watch/`.

Not an oversight: the lines do not scale with the zoom. At 4.46× they would be
9–18 px, and no contact in the hairspring view needed it. To check the art
again, run the contact check in the zoom-line-contacts task.

## Budgets, as measured

On the speaker's laptop (120 Hz), 2026-09-29, on the real talk
(the webgl-watch task, `evidence/`):

| What                                                    | Chromium   | Firefox                                 |
| ------------------------------------------------------- | ---------- | --------------------------------------- |
| JS per frame, the whole watch at the laptop's full size | 1.0–1.2 ms | about 1 ms                              |
| GPU per frame (with `gl.finish()`)                      | 0.7–0.9 ms | 2–3 ms                                  |
| A fade frame (two pictures and a mix)                   | the same   | the same                                |
| Frames over 25 ms on the watch slides, after load       | 0          | 0                                       |
| Frames over 12.5 ms in the opening (the 120 Hz gate)    | 0          | 2 in a laptop run, 0 in a projector run |
| WebGL contexts: a slide, the presenter view, the export | 1, 2, 1    | 1, 2, 1                                 |

This timing sample predates the lower oscillator adopted on 2026-10-01.
The current art's back-row measurements are in [measurements.md](measurements.md).

## The diving board

The Hairspring slide ends with the diving board: `components/DivingBoard.vue`, which inlines
`public/diving-board.svg`. There is one live board for the whole talk, in the
watch's layer (`global-bottom.vue`), above the canvas. The Hairspring slide's frontmatter
names its targets, as it names the watch's (below), and the layer moves the
board from what is on the screen to each target, in either direction
([`navigation.md`](../../docs/navigation.md)). `art/diving_board.py` writes the SVG: edit the
script, not the SVG. It is a straight diving board over the edge of a pool,
which stands for the hairspring without its coils: the talk says why a spring
swings, and the spiral would distract. Ground on the left, pool on the right.
The board is over the pool for two thirds of its length.
The ground, the stand and the pool's walls are faces in the ground's wash
(warm): lit faces are the wash moved toward the paper, and shaded ones (the
walls, the stand's side) toward the ground's line. The water is a substance:
the water colour (blue) at 0.6, with light ripples. Water and ground are
material roles of the theme, so a theme cannot swap their colours by
accident ([theme.md](../../docs/theme.md), "The pairs"). The pool has no near wall, and the ground has no front: both go on in
front, as if they ran far past the bottom of the slide, and the drawing is
cropped there (it is 452 px tall, so its bottom is the slide's). The drawing is the
slide's whole width (980 px, its viewBox starting at x 50, so the drawing's x 0
is the slide's x -50). The ground and the stand run off the slide's left edge.

**The pool and the ground end at a sharp vertical cut.**
`pool_right` in `art/diving_board.py` sets the endpoint.
A rectangular SVG clip cuts the pool, ground, and stand at that endpoint.
It adds no wall or outline. The straight edge keeps the drawing separate from the text.
The [pool-edge task](../tasks/2026-10-03-pool-edge/PLAN.md) holds the earlier comparisons and measurements.

The board ends on the
hairspring's rest shape, at the hairspring's place on the left (`SLIDE_ORIGIN`
and `SPRING_CENTRE` in the script). Nothing is hidden by paper (it is not an
art colour): the ground is clipped round the stand's outline. The component sets `overflow: visible` on the SVG: the curling board rises above
the drawing's top edge, into the slide title's space, and must not be cropped
there. Ground and water
are not the same colour on purpose: a blue ground beside white water read as a
pool of the wrong colours.

```yaml
board: 1 # the board and the rest shape fade in; the board bends, holds, lets go and swings at 1 Hz
boardCurl: 2 # the pool and the stand fade, the board winds into the spiral, then fades out
```

`watch/board.ts` checks the keys (`boardState`), as `watch/state.ts` checks the
watch's: each is a click number, in this order.

| Click | The slide                                                                                                                                                  |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | `board: 1` fades the board in over the watch, and it bends, holds, lets go, swings                                                                         |
| 2     | `boardCurl: 2` fades the pool and the stand, and the board winds into the spiral. Then the board fades out, the watch fades in, and the sentence is edited |
| 3     | `watchAtRest: false`: the balance starts to swing again                                                                                                    |

**The board covers the watch while its picture shows.** The picture (the
board, the pool and the stand) shows from the board's click until the board's
clock passes the end of the curl (`pictureShown` in `watch/board.ts`). The
board's component emits `cover`, and the layer under it hides the watch:
`global-bottom.vue` fades the canvas out and stops the stage, and
`slide-bottom.vue` hides the still.

**A hidden watch goes to its target at once.** When the canvas has faded out
(its 0.3 s fade, with a margin: 400 ms), the stage jumps to the last state that
it was given, and stops. If the watch's state changes while the canvas fades
out or is hidden, the stage first makes that jump, and then moves to the new
state as usual. So the watch comes back in the state of its click, however
fast the clicks came: a camera move from the cover that the board covers at
click 1 ends under the board, and the Balance Wheel slide's fade starts from the Hairspring slide's view.
A move that nobody sees has no reason to go on. So the hand-off needs no click and no key: it
happens when the curl ends, which only the board's clock knows (the curl waits
for the next bottom of the swing). Going back, the clock crosses the same time
in the reverse order: the edit is undone, the board fades in over the
hairspring, and the board uncurls. The hand-off runs with the edit: it fades two
pictures of the same shape, so it moves nothing. Why:
[`2026-10-04-board-handoff`](../tasks/2026-10-04-board-handoff/PLAN.md).

The callout appears with the board at click 1: a leader and the sentence
"Bend it away / from straight, / it pushes back", in ink. After the curl, on
the board's clock, the sentence is edited in the accent, in reading order:
"Bend" is struck out and "Wind" written above it, then "straight" and "rest".
It then reads "Wind it away from rest": the label names the rest shape that the
dashed outline has become. Each step is a quarter of `Timeline.edit` in
`art/diving_board.py` (`editStep` in `watch/board.ts`).

- **The sentence is HTML in `components/DivingBoard.vue`, not text in the
  SVG.** All else being equal, use the simplest tool for the job, and HTML is
  simpler than SVG for text: the browser lays it out, so a strike is its
  word's width, with no font metrics in the generator. It fades with the
  leader (`data-layer="rest-callout"`), as text does: in `--text-fade`, and
  it fades in only after `--text-fade`, when the text that it replaces is gone
  ([slide-patterns.md](slide-patterns.md#text-fades)). So the Balance Wheel slide's sentence,
  in the same place, never shows on top of it.
- **The leader points to the line "from straight,".** Its baseline starts at
  `LeaderDesign.label`, which the SVG's root gives the page (`data-label-x`,
  `data-label-y`). The leader joins "straight" to the straight outline, and,
  after the edit, "rest" to the spiral.
- **Not an oversight: the lines are 2.1 em apart from the start.** That is
  room for a written-in word, so the edit moves no line. Lines that spread
  apart during the curl were judged too much motion.
- **The edit waits for the curl to end**, so that one thing moves at a time,
  and the leader never joins "straight" to the spiral for long.
- 35 px, sentence case, weight 600, left of the column right of the picture.
  The options for its place, case and timing are in
  [`2026-10-04-hairspring-sentence-placement`](../tasks/2026-10-04-hairspring-sentence-placement/PLAN.md).

Dashed, unfilled outlines show the board at zero deflection.
They stay fixed during the bend, hold, and swing.
The full 3D outline helps the audience see the straight board's depth.
At the actual curl start, the ghost becomes one open line along the edge that becomes the viewer-facing ribbon edge.
Parallel thick dashed edges clutter the shallow view during the curl and on the final spring.
The single line retains the rest shape with less clutter. This is a deliberate choice, not a missing edge.
It curls on the board's clock into the spring ribbon's upper edge, closest to the viewer.

Before the curl, the leader ends near the straight board's right tip.
At the switch to one edge, optimization starts at that edge's closest point to the elbow.
The generator then selects a path across the entire curl with dynamic programming.
It integrates leader length, bend angle, and squared endpoint velocity perpendicular to the final segment.
Each step uses the physical frame duration and the midpoint segment direction.
Contacts lie on the exact cubic edge, sampled by rays from the elbow.
The selected path is globally minimal on that sampled contact graph.
The weights favor lower perpendicular speed and allow longer lines.
Motion along the leader has no movement penalty.
Stronger movement weighting can therefore increase rapid movement along the line.
The [weight-tuning task](../tasks/2026-10-04-leader-path-comparison/weight-tuning/README.md) compares this tradeoff.
`LeaderDesign` in `art/diving_board.py` holds the weights, angular sampling, and stroke width.
The [quarter-bend task](../tasks/2026-10-04-leader-path-comparison/selection-and-layering/quarter-bend/README.md) records the selected bend coefficient.
The sentence stays on the right.

When the curl ends, the rest shape stays while the moving board fades out.
The ghost does not change during the crossfade because the two rest outlines match.
The real spring swings against this fixed reference at click 3.
The component stops its frame loop when the clock holds still.
A jump to click 2 or 3 (a reload, a link) shows the completed rest spring at once.
The ghost fades out when the audience leaves the Hairspring slide, with the balance's fade on the Balance Wheel slide.
The generator writes its paths, leader, and curl duration; do not edit the SVG by hand.

The SVG draws the rest outline and callout after the board.
The dashed reference therefore stays above the board during bending and curling.
The board's layer is above the canvas, so the reference also stays above the live hairspring.
The slide's text paints above both: the curling board rises behind the title.
The Hairspring slide is see-through at every click, also while the watch hides, because it has a board (`slide-bottom.vue`'s marker).
The crossfade changes the pieces below the reference; its stacking order stays fixed.
The component selects visible layers with `data-layer` attributes.
`uv run art/diving_board.py` writes the SVG; its `--check` verifies it.
Run `uv run art/test_leader_path.py` for the mathematical path checks.
`pnpm test` runs these checks with the TypeScript tests.
The canonical validator runs both through this script.

A click back from 2 uncurls the board: the curl plays backwards, as long as it
took, to the bottom of the swing, and the swing goes on. The pool and the stand
fade in at once. A click back from 1 fades the board out in its pose; the next
click 1 bends it from 0 again. `BoardClock` in `watch/board.ts` holds these
moves, and `watch/board.test.ts` tests them.
The balance settles at click 2 (`watchAtRest: true`), while the board covers the
watch. The watch is out of sight, so the stage puts the balance at rest at
once (below), and the hairspring is at rest when it appears. At click 3 the clock's `resume` starts it: the cubic from rest to the
opposite extreme, which is the settle mirrored, so there is no jump in angle,
speed or acceleration where it meets the free swing. A click back from 3 to 2
settles it again. The board's end and the hairspring at rest are the same
shape: laid over each other (a screenshot of the Hairspring slide at click 2 after the
curl, and the board's last frame) they agree to about a pixel, except for the
real spring's stud and collet.
The swing never damps, on purpose.

- **The component runs the clock, not the SVG.** A self-playing `<img>` cannot
  start on a click or play backwards on a click back.
- **Not an oversight: one board in the watch's layer, not one on each slide.**
  A copy on each slide cannot move between slides: Slidev mounts a slide before
  it shows it, and each copy starts a change from its own last state. The Balance Wheel slide
  had its own copy, and its rest shape showed at once and then faded, going
  back from the Escapement slide
  ([`2026-10-04-backward-navigation`](../tasks/2026-10-04-backward-navigation/PLAN.md)).
- **The curl waits for the bottom of the swing**, where the board is still, so
  it has no jump in position or speed (up to one period, 1 s, after the click).
  The pool and the stand fade at once, through a class on the SVG root and a
  CSS transition in the file. While it waits, the component keeps the SVG's
  time inside the swing's one cycle, so the jump to the curl is between two
  equal poses. The times are the root's `data-` attributes (`swing-start`,
  `swing-period`, `curl-start`, `curl-duration`, `edit-duration`). The edit
  comes after the curl: a click back undoes it first, then uncurls.
- **The end of the curl is the hairspring at rest** (swing 0, the middle of its
  swing), at the hairspring's place and size on the Hairspring slide, with the view's tilt.
  Its numbers are copied from `watch/model.ts` and `watch/generate.ts` into
  `art/diving_board.py`: change them there when the spring or its view changes.
  The spring is a ribbon (a wall 8 units high), and the tilt shows it as two
  copies of its curve, one a little above the other, joined by a vertical line
  at each end. The board's near edge becomes the ribbon's top edge, the one
  nearer the viewer, and its far edge (the plank's width, going back) becomes
  the bottom edge (the ribbon's height, going down). The plank turns edge-on to
  the view and opens again: no edge changes sides. The thickness under the
  near edge shrinks to nothing. The ribbon's height and the pivot are copied
  from `springHeights` and the hairspring view (`RIBBON_BOTTOM` and
  `RIBBON_TOP` in the script: 6.1 px below the spring's centre line and 6.1 px
  above it; `watch/generate.test.ts` fails if the heights or the pivot change). The curl mixes each segment's angle and length between
  the bent board and the spiral, not each point's position: the free end turns
  round and round, like a stiff strip winding up, with no kink and no crossing.
  (A mix of positions folded and crossed.) Every edge is a cubic curve through
  sample points, not a line of segments, so no corner shows: the curl has 40
  points, within 0.06 px of the spring (`smooth_data` in `art/diving_board.py`). The segments grow, late, because the
  spiral is five times longer than the board.
- **Not an oversight: the SVG is sampled** (30 frames a
  second of a path), from the first vibration mode of a fixed-end beam at
  constant length. The rest outline adds samples for the curl only.
- **`art/diving_board.py --check`** fails if the SVG on disk differs. `pnpm
art:generated` runs it with the `--check` of `watch_design.py` and
  `favicon.py`, and `validate.py` runs that script: a change to the theme or to
  a generator fails until the file is written again.
- **The SVG takes its colours from the theme** through namespaced classes
  ([`stem/docs/illustrations.md`](../../docs/illustrations.md), "The page's
  theme paints the drawing").
- **The watch's still follows the click of its page.** `slide-bottom.vue` reads
  the slide's `$clicks`, not the global nav (a printed page has a nav of its
  own), and the PDF has a page for each click (`pnpm export`).
  `pnpm art:print DECK` compares each page's state with the live slide's. It
  runs in Chromium; `--browser firefox` and `--browser webkit` (Playwright's
  WebKit, not Safari itself) pass too, as of 2026-10-04.
  Why: [`tasks/2026-10-03-narrated-export/`](../../tasks/2026-10-03-narrated-export/PLAN.md),
  "The watches talk: what the still forms need".
- **The board is posed in print.** A page that does not run the clock (print,
  export, the overview) sets the SVG's time to the pose of its click
  (`boardPoseTime` in `watch/board.ts`; the posed board is `slide-bottom.vue`'s): bent, at the bottom of the swing, at click 1, and half
  way through the curl at click 2 (`CURL_SHOWN`), with the sentence not yet
  edited, and the board covers the still. Half way, not the end: the end is
  the hairspring at rest, the same picture as click 3's. At click 3, after the
  curl's click (`curlsHere`), the pose is the end of the edit: the curled
  outline, the edited sentence, and the still. Print mode never
  runs the clock, so the pose does not drift. `art:print` checks the board too:
  its classes against the live slide's, and its clock against the pose.
  The check waits for loaded and posed layers, and for decoded still images.
  It captures the live curl click before the story ends, then checks the later completed pose.
  Page readiness does not depend on agreement between live and printed states.
  The
  component's `data-waitfor` makes `slidev export` wait until the SVG is posed.

## Theme colours in private browsing

`watch/palette.ts` resolves each theme colour through computed CSS style.
It uses relative CSS colour syntax to obtain sRGB channels, then converts them
to the renderer's byte values. It rejects invalid and transparent colours.

Do not use canvas pixel reads for this conversion. Safari's fingerprinting
protection can change their colour and alpha values. This can stop the deck
before it draws the first slide. Full validation blocks these reads in each
supported browser engine. `pnpm art:privacy DECK` checks that the live watch
still starts in each engine. See [browser support](../../docs/talks.md#browser-support)
for the requirements and test limits.

## The browser-tab icon

`art/favicon.py` owns the icon. Edit its pixel maps and run the script.
It draws each pixel instead of scaling down the cover.
Its `--check` fails if the file on disk differs.
