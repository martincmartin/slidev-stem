# The Gears slide: the transition

**Request (2026-10-07).** A new slide after the Escapement slide: title "Gears",
subtitle "Fast gear, meet slow gear." It explains gear ratios. This first step
is only the transition. The whole Escapement picture (the mechanism, its
callouts, the words at the strikes) fades out. Then the escape wheel's pinion
with its arbor, and the fourth wheel (its wheel, not its pinion) with its
arbor, fade in. No seconds hand. The audience has not seen these parts, so the
view does not have to show where they are in the watch: the camera can jump.
The pair takes most of the slide, with room for callouts.

## What is on the fourth wheel

In this model (as in an ETA 6497), the fourth wheel's arbor carries:

- the fourth wheel itself (16 teeth), which drives the escape wheel's pinion
  (8 leaves): a ratio of 2 to 1;
- its own pinion (4 leaves), which the third wheel drives;
- the seconds hand: the fourth wheel turns once a minute.

The new subject, `gears`, has the fourth wheel's body, hub and arbor, and the
escape wheel's pinion and arbor. It leaves out the fourth wheel's pinion, the
seconds hand and the escape wheel.

## How the stage gets from one picture to the other

The stage's rule now: between two subjects where neither holds the other, the
rest of the watch fades in around the old subject, the camera moves, and the
rest fades out around the new one. The request rules that out.

The watch already fades out and back in at two places. A swap fades the
difference between two subjects where one holds the other (back from the
Escapement slide). And `global-bottom.vue` hides the canvas for a slide
without the watch; out of sight, the stage jumps to its last target
(`goOutOfSight`), and the canvas fades in on the next slide with the watch.
Only the trigger is missing.

| Option                                                                                                               | For                                                                                          | Against                                                                                                                                                                       |
| -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Keep the rule (rest in, move, rest out)                                                                           | no code                                                                                      | shows the whole watch for about 4–5 s: the spatial story that the request does not want                                                                                      |
| **B. A cut step hides the canvas for a moment, and reuses the jump out of sight**                                   | reuses the canvas's fade and `goOutOfSight`; about 40 lines in `global-bottom.vue` and a key | the canvas's fade is 0.3 s, not the swap's 0.8 s                                                                                                                              |
| C. A cut in the stage's timeline: a picture-opacity channel in the renderer's mix shader, and a zero-length jump phase | 0.8 s fades, from any picture on the screen, even a swap cut short                           | built first, then dropped: about 315 lines in 12 files (renderer, timeline, stage, probe checks, tests) to do what the layer already does. The user asked why; there was no good answer |

**Chosen: B.** The slide asks for it with `watchCut: true`: the step between
this slide and the previous one, in either direction, is a cut. The key names
the boundary between two slides, not a direction, so the layer still does not
ask which way the viewer went (`docs/navigation.md`, rule 1). The new slide's
text waits for the canvas to hide (400 ms, `HIDE_MILLISECONDS`), then fades in
with the new picture.

## The view

The fourth wheel and the escape pinion are one above the other in the
movement's layout (the line between their arbors is about 26° from vertical).
A `View` has no rotation, so the pair stays upright: it is tall, and the
callouts go on its right, as the house rule wants ("the main focus is on the
left"). `fitView` fits the pair in `GEARS_FRAME`, the height under the
subtitle, with the pair's middle at the frame's middle. Tilt 20°, as on the Escapement slide, so that the arbors show as
posts, not as dots.

## Step 2 (2026-10-08): the gears turn, and the pair moves to the middle of the left

**Request.** Reopen this task: the slide is only started.

1. A general rule: if the model takes less than 60% of the slide's width, centre
   it in the leftmost 60% of the slide.
2. While only the two gears show, they turn continuously, as the escape wheel
   does on the Escapement slide when the pallet is not there. The pinion turns
   once in 8 s, so the fourth wheel turns once in 16 s. The user may change
   these speeds.
3. Use the escape wheel's free spin, and extract a common core as a refactor.

### What the free spin is now

The spin has two parts:

- **The train's clock** (`TrainClock` in `watch/model.ts`). It turns the whole
  train at a speed, and then stops it in step with the mechanism. It does not
  know which slide it is on. Every wheel turns with it, so the fourth wheel
  already turns at half the speed of the escape wheel (16 teeth to 8 leaves).
- **What shows during the spin** (`SPIN_PIECES` in `watch/state.ts`:
  the escape wheel and its arbor). This is a fact of the Escapement slide, in
  shared code. `stageState` changes the shown pieces when `spin` is set.

So the core is already general. Only the second part ties `watchSpin` to the
Escapement slide: `watchSpin: 0` on the Gears slide would show the escape
wheel, not the gears.

### Options for the common core

| Option | For | Against |
| --- | --- | --- |
| A. A new key for the Gears slide (for example `watchRun: 45`), that turns the train with no change to the shown pieces | no change to the Escapement slide | two keys for one clock; the code that turns them into a `TrainClock` speed is in two places |
| **B. Move what shows during the spin into the slide: `watchSpinShows: [escape wheel, escape arbor]` on the Escapement slide. Without it, the spin shows the slide's pieces. The Gears slide has `watchSpin: 0`** | one key and one clock for each spin; shared code has no fact about one slide (the rule "a slide names what it shows at each click"); `stageState` no longer knows about the spin; `SPIN_PIECES` goes | the Escapement slide gets one more line of frontmatter |
| C. A general key for the pieces at each click (`watchAt: {2: [...]}`), with the spin only a speed | the most general | no other slide needs it now; more parsing and checks |

**Chosen: B.** It is the smallest change that makes the spin a property of the
train, not of the Escapement slide. `WatchState` gets two lists of pieces:
`show`, the pieces shown at this click, and `fit`, the slide's pieces, which the
fitted view fits (so that the view does not change during a spin, as before).

### The speed

`watchSpinSpeed` is in degrees a second of the escape wheel. A turn in 8 s is
$360 / 8 = 45$ degrees a second; the fourth wheel turns at
$45 \times 8 / 16 = 22.5$ degrees a second, once in 16 s. The key stays in
degrees a second, so the Escapement slide (135) does not change. A key in
seconds a turn would read better for this request, but it would change the
Escapement slide's key for no gain in behaviour.

A spin must be faster than the mechanism (12 degrees a second, `spinBeats`):
a stop waits for the next tooth to reach the pallet, which never happens if the
wheel is slower than the mechanism. 45 is faster. The slowest Gears speed that
is allowed is a pinion turn in just under 30 s.

### The timing, entering and leaving the Gears slide

The spin starts `FADE_SECONDS` after the click (`TrainClock.show`). From the
Escapement slide, with `watchMoveWith: none`, the old picture fades out in
`FADE_SECONDS`, the camera jumps, and the gears fade in. So the gears start to
turn when they start to fade in, and reach full speed in `SPIN_UP_SECONDS`
(0.6 s), during the fade. No new code.

Back to the Escapement slide, the stop waits `FADE_SECONDS` (the gears fade
out), and then for the next tooth: at most $24 / 45 \approx 0.53$ s at 45
degrees a second. The escapement fades in from 0.8 s to 1.6 s, so the escape
wheel can turn through the stones for up to 0.53 s at the start of its fade
in. The Escapement slide's own stop, at click 3, spins through the whole fade
in of the pallet (0.8 s) and then to the next tooth, so this is not new, and
it is shorter.

A slide reached directly (a reload, or back from a slide without the watch)
spins at full speed at once (`TrainClock.show(…, instantly)`).

### The layout rule

`fittedView` fits the pieces in `FIT_WIDTH` by `FIT_HEIGHT` and puts them at
`FIT_LEFT`. Measured on 2026-10-08 (scale and width on the slide, px):

| Slide | Width | Height | 60% of 980 |
| --- | --- | --- | --- |
| Escapement | 689.7 | 420 | 588 |
| Gears | 325.7 | 420 | 588 |

So the rule moves the Gears pair only: its middle goes to $x = 294$, its left
edge from 16 to about 131. The Escapement slide does not move (its leaders
and labels stay valid).

| Option for the middle | For | Against |
| --- | --- | --- |
| Centre at $0.3 \times 980 = 294$ when the width is under 588, else left at `FIT_LEFT` | the request, word for word | from 556 to 588 px wide, the model's left edge is nearer the slide's edge than `FIT_LEFT` (at 588, it touches it); a jump of 16 px at 588 |
| **Centre at $\max(294,\ \mathtt{FIT\_LEFT} + w/2)$** | the same as the request for widths up to 556; continuous; never nearer the edge than `FIT_LEFT` | differs from the request between 556 and 588 px (it keeps the 16 px margin) |

**Chosen: the second.** For every width under 556 px it is the request, and
there is no width at which the model jumps.

## Step 3 (2026-10-08): at a click, the rest of the mechanism comes back

**Request.** At a click, add the rest of the Escapement slide's mechanism to
the gears: everything the talk has explained so far. Much of it is off the
slide on the left; that is all right.

So at click 1 the slide shows the Escapement slide's pieces (balance wheel,
balance staff, hairspring, collet, stud, roller, impulse jewel, pallet fork,
escape wheel, escape arbor) and the gears, in the gears' view. The pallet is
back, so the spin ends at that click (`watchSpinEnd: 1`): the train ticks with
the mechanism again, and the gears turn a tick at a time.

### What the frontmatter cannot say yet

A fitted view fits the slide's `watch`. The only change of pieces at a click
is `watchSpinShows`, which shows fewer pieces during a spin. Nothing adds
pieces at a click without a new view.

| Option | For | Against |
| --- | --- | --- |
| **A. `watchAdd: {1: [pieces]}`: from that click on, these pieces show too. The view still fits `watch`** | one key; reads as the request ("at click 1, add …"); the view does not move, so nothing new in the timeline; a map takes more clicks later | a second way to change pieces at a click, beside `watchSpinShows` |
| B. One general key, `watchShows: {click: [pieces]}`: from that click, show exactly these pieces. `watchSpinShows` goes | one mechanism for every change of pieces | the Escapement slide must list its 10 pieces twice (at click 2 the wheel, at click 3 all 10 again): one fact in two places |
| C. `watch` lists all 13 pieces; a new `watchFit` names the 4 that the view fits; `watchSpinShows` names the 4 shown at click 0 | no new form of key | the gears are listed three times |

**Chosen: A.** B and C repeat lists of pieces in the frontmatter, and a list
that is repeated drifts. A adds what is new where it is new. The two keys do
not conflict: at a click, the pieces shown are the spin's pieces (during a
spin) or the slide's, plus each `watchAdd` list whose click has come.

### Checks

- `watch/state.ts` checks the map: each key a click number, each value a
  list of pieces.
- A spin must not show the pallet fork: the escape wheel would turn through
  its stones. `watch/state.ts` cannot know that, because the clock does not
  know what shows. A deck test (`watch/deck.test.ts`) checks every click of
  every slide.

## Step 4 (2026-10-08): one way to add pieces without moving the camera

**Request.** Unify the two ways to add pieces without moving the camera: a
new slide (the Balance Wheel slide) and a click in a slide (`watchAdd`). Where
a click gives a new slide and where it changes a slide is an implementation
detail; the frontmatter should say both the same way.

**Why there were two.** The camera stayed for two different reasons. The
Balance Wheel slide names the same view as the Hairspring slide
(`watchView: hairspring`, a view defined in code, `views()` in
`watch/generate.ts`, because the diving board's art copies its numbers). On
the Gears slide, the fitted view fits `watch`, and `watchAdd` was left out of
the fit.

| Option | For | Against |
| --- | --- | --- |
| **1. What the camera frames (`watchView`: a view's name, or a list of pieces to fit) and what shows (`watch`), said the same way for a slide and for a click (`watchClicks: {1: {watch: …}}`)** | one rule: the camera stays when the frame stays; `watchAdd` and `watchSpinShows` go | lists repeat; YAML anchors and a nested list that is flattened remove the repeats, but a reader must know anchors |
| 2. `watchView` also takes a list of pieces, and `watchAdd` stays for clicks | smaller | two ways to add pieces stay |
| 3. Each such click is a new slide | no click keys | the title and the text fade out and in at each slide; callouts must be copied |

**Chosen: 1, with YAML anchors** (the user's choice, from these options).

- A click block holds `watch` and `watchView` only, for now. Each takes
  effect from its click on, and later blocks change it again. The other keys
  (`watchSpin`, `watchSettle`, …) stay click numbers on the slide; moving
  them into the blocks is a later step, if it reads better.
- With no `watchView`, the view fits what shows at that click. So a slide
  that adds pieces at a click and must not move names its frame.
- A list of pieces can hold lists, which are flattened, and a name that is
  there twice shows once. So `[*gears, pallet fork]` is the gears and the
  fork. YAML anchors hold within one slide's frontmatter only.

## Step 5 (2026-10-08): every change at a click in a click block

**Request.** Move `watchSpin` and `watchSettle` into the click blocks, so
that every change of the watch at a click is said as a slide says it.

**Before.** These keys gave click numbers, in pairs: `watchSettle: 4` and
`watchResume: 5`; `watchSpin: 2`, `watchSpinEnd: 3` and `watchSpinSpeed`;
`watchTickTock: 5` and `watchTickTockBurst: 6`. Each pair had its own checks
(the end after the start; the speed only with a spin).

**After.** Each pair becomes one value of the state, which a slide sets for
click 0 and a block changes from its click on:

| Key | Values | Was |
| --- | --- | --- |
| `watchAtRest` | `true`: the balance is at rest; `false` (default): it swings | `watchSettle`, `watchResume` |
| `watchSpin` | a speed, degrees a second of the escape wheel: the train spins freely; `false` (default): it follows the mechanism | `watchSpin`, `watchSpinEnd`, `watchSpinSpeed` (and its default, `SPIN_SPEED`) |
| `watchTickTock` | `plain` or `burst`: the words show at each strike; `false` (default): they do not | `watchTickTock`, `watchTickTockBurst` |
| `watchTilt` | degrees | slide only |

The values name a state, not a change: "at rest", not "settle". So the
checks of the pairs go (a resume needs no earlier settle: a block that says
`false` before any `true` says what is already so), and a spin has no default
speed: the slide says it. The layer still decides how to get there (the
settle waits for an extreme; the spin waits for the fade), as before.

`watchFlash` and `watchMoveWith` stay on the slide only: they are about the
step into the slide, not a state at a click. The diving board's keys
(`board`, `boardCurl`, `watch/board.ts`) are click numbers too; they are
another layer, and are left for now.

## Step 6 (2026-10-08): show that the teeth go by one for one

**Request.** Before the rest of the mechanism comes back, show that the
same number of teeth a second goes by on each gear: a tooth of one fits in a
gap of the other. So the turns go as the numbers of teeth (16 to 8), and,
with teeth of the same size, as the radii. Later request: the slide first
shows the gears plain, and the marks come at a click of their own, before the
click that brings the mechanism back.

The numbers: the fourth wheel has 16 teeth and the escape pinion 8 leaves
(`art/watch_design.py`). At 45 degrees a second of the pinion, one tooth
goes through the mesh each second.

### What to say

Teeth a second, not speed at the rim: the audience can count teeth, and with
teeth of the same size, the count is the size. Spoken: "Each tooth fits in a
gap on the other side, so they go by one for one. The big one has 16, the
little one 8: the little one turns twice for each turn of the big one."

### Options for the picture

1. One tooth marked on each gear.
2. A count of the teeth that go through the mesh, on each side.
3. A bike chain, spoken only.
4. The rims rolled out as two lines of the same length.

The user chose 1, and rejected 2, 3 and 4. The user then asked about two
marks on each gear (opposite on the pinion, 90 degrees apart on the wheel),
in one colour or two:

| Option | For | Against |
| --- | --- | --- |
| A. One mark on each gear | simplest | shows the result, not the reason; an event each 8 s |
| B. Two marks on each, one colour | an event each 4 s | the pinion looks the same after half a turn: it seems to turn in 4 s, a ratio of 4, which is wrong; no pairs |
| C. Two marks on each, a colour for each pair | 4 teeth between the marks on each gear: half the pinion, a quarter of the wheel; the pinion's turn reads as 8 s | four marks, two colours |
| D. Two marks on each, a colour for each gear | none | as B, and a colour more |
| Span: the 4 teeth between, one colour | the same length of rim coloured on each gear; half and a quarter; colour meshes with colour for 4 s | more colour on the picture |

### Which colours

Measured with `tools/lib.py` (`de76`, `cvd`: the worse of deuteranopia and
protanopia), in the four top-pick palettes of `stem/docs/theme.md`, as they
were on 2026-10-08. The scripts and their output are in `step6/`
(`marks_ledger.py`, `marks_palettes.py`). A mark is a solid tooth; it is seen
against its neighbours' faces (subject-wash), and its outline is subject.

| ΔE / CVD ΔE | Ledger | Campfire | After-Hours | Marmalade |
| --- | --- | --- | --- | --- |
| span: second vs the faces | 73 / 63 | 60 / 56 | 61 / 62 | 65 / 54 |
| C: subject + second, the pair | 89 / 77 | 69 / 54 | 73 / 68 | 43 / 13 |
| C: subject solid vs the faces | 68 / 68 | 70 / 67 | 71 / 68 | 65 / 63 |
| C: accent + second, the pair | 98 / 89 | 97 / 80 | 96 / 90 | 71 / 28 |
| accent vs subject | 20 / 21 | 31 / 28 | 25 / 23 | 48 / 41 |
| second-wash vs the faces | 18 / 16 | 10 / 7 | 19 / 18 | 7 / 2 |

- Ink is dark like the subject in Ledger, and pale like it in the dark
  palettes; muted means "context". Neither is a mark.
- The accent is not in the art (`theme.md`), and in the dark palettes it is
  close to the subject: an accent mark looks like a subject mark.
- A wash mark is too close to the faces in every palette.
- C with subject and second fails for colour-blind viewers in Marmalade (13).

Ranking: 1. the span in the second (it holds in every palette, and shows the
reason); 2. C, subject and second; 3. C, accent and second. **Chosen: the
span in the second.**

### How it is drawn

- **A thin solid on the gear's top face** (`GEAR_SPAN.thickness`, 0.05 px), in
  the gear's group and with its clip discs. The renderer's faces use the
  depth test with `LESS`, so a filled decal at the face's height would fight
  with the face. 0.05 px is far above the depth buffer's step and far below
  what shows as a gap. No change to the renderer.
- **The outline stays the subject's.** The first render had the outline in
  the second: a coloured tooth had no edge, and where it touched the coloured
  leaf that it drives, the two merged.
- **Which teeth** (`meshedSpan` in `watch/teeth.ts`): 4 teeth next to each
  other, in the middle of the mesh at the train's start, and the leaves that
  they drive (half a pitch ahead). The ratio is 2, so each tooth drives the
  same leaf at every turn. `watch/teeth.test.ts` turns the pair through the
  mesh and fails if a tooth of the span touches another leaf. It failed when
  the pairing was made half a pitch wrong on purpose.
- **Each tooth or leaf is its own closed outline**, closed along the root
  circle. One outline for the 4 teeth would run along the root circle twice
  in the gaps.
- The refactor of `wheelTeeth` and `pinionLeaves` to share a tooth's shape
  keeps their outlines byte-identical, and every other mesh and view of the
  scene is unchanged (hashes compared before and after).

### Clicks

| Click | Shows | The gears |
| --- | --- | --- |
| 0 | the gears | turn freely |
| 1 | and the spans | turn on, at the same speed |
| 2 | and the rest of the mechanism; the spans stay | tick with it |

The span's click changes only `watch`: the spin goes on with no pause
(`TrainClock.show` keeps a spin at the same speed; `watch/train.test.ts`).
The spans' place when the click comes depends on the train's position, so
the first time that colour meets colour is 0 to 16 s after the click.

`step6/clicks.png` shows the three clicks in Ledger, and
`step6/palettes.png` the span in each palette over 8 s (rows: Ledger,
Campfire, After-Hours, Marmalade).

### The flash's colours, as a trial

The user asked whether the span should be in the flash's colours: faces in
the second's wash, outline in the second. Rendered in Ledger, Campfire and
Marmalade, and in Marmalade as a deuteranope sees it
(`step6/solid-vs-flash.png`: solid on the left, flash's colours on the
right): the wash is close to the gear's faces (ΔE 18, 10, 19 and 7 in the
four palettes; CVD 16, 7, 18 and 2), so the teeth show mostly through their
2 to 2.5 px outline. In Campfire they are faint, and for a deuteranope in
Marmalade they nearly go. A flash works because it changes for a moment; a
mark must be found and followed while it turns. Recommended: solid.

The user then asked for both on the slide, to compare, and for two more
changes:

| Click | Shows | The gears |
| --- | --- | --- |
| 0 | the gears | turn freely |
| 1 | the span in the flash's colours (`… span wash`, a trial) | turn freely |
| 2 | the span, solid | turn freely |
| 3 | the gears and the rest of the mechanism; the span goes | tick with it |
| 4 | and the seconds hand | tick with it |

`tools/scenecheck.py` allows the second as a solid fill only, so full
validation fails on the trial's pieces until one style is kept. The user
also changed the spin to 90 degrees a second (the pinion once in 4 s).
`step6/clicks-trial.png` shows the five clicks.

Then, on the user's request: the trial covers the whole tooth (its walls
too), not only its top; the solid style stays a layer on the top. The whole
tooth is at the same place as the gear's faces, and two faces at one place
fight in the depth test (`LESS`). Options: a polygon offset for the mark's
faces (a flag on the mesh, `Mesh.overlay`); the outline pushed out a little
(the teeth then overlap the leaves they drive, and the tip walls still meet);
or drawing order with `LEQUAL` (it depends on two triangulations of one face
giving the same depth to the last bit). Chosen: the polygon offset, a small
change to the renderer, general, and with no change to the geometry. No
flicker in the renders (`step6/whole-tooth.png`).

Then, on the user's request, the solid style covers the whole tooth too
(every face in the second; the outline stays the subject's). Both styles are
overlays, so the thin layer and its thickness (`GEAR_SPAN.thickness`) are
gone. `step6/both-whole.png`: click 1 (the flash's colours) and click 2
(solid).

### The text

The user asked for text with the span, at a click or one line a click: from
the idea that the colour shows (the teeth move at the same speed, so the
bigger wheel turns more slowly) to the rule (the ratio of the speeds is
exactly that of the sizes).

A trap in the wording: the speeds go as the sizes upside down (pinion speed
/ wheel speed = wheel size / pinion size). "The ratio of the speeds is the
ratio of the sizes" reads backwards. "Twice … half" says the direction with
no word for "inverse".

Room: the right of the gears, about 350 px at 35 px type, so about 25
characters a line.

| Option | Lines | Words | Longest line (chars) | For | Against |
| --- | --- | --- | --- | --- | --- |
| A. Tooth for tooth | Tooth for tooth. / Bigger wheel, slower turn. / Twice the size, half the speed. Exactly. | 14 | 40 | short, a rhythm; one step a click; says the direction; ends on "exactly" | does not say why it is exact |
| B. Read the colours | Four teeth each. / Half the pinion. A quarter of the wheel. / So the pinion turns twice as fast. Exactly. | 19 | 43 | closest to the picture | only 16:8; no general rule |
| C. No slip | Teeth can't slip. / So both rims move together. / Half the size, twice the turns. Exactly. | 15 | 40 | why it is exact; sets up the seconds hand | slip is not in the picture; starts with a negative |
| D. Count them | One tooth here, one tooth there. / 8 teeth: the pinion turns once. / 16 teeth: the wheel turns once. / 16 to 8: two turns to one. Exactly. | 26 | 35 | concrete, exact | longest, 4 clicks; the span is 4 teeth, not 8 or 16 |
| E. Running track | Same pace. / Longer lap. / Twice the lap, half the laps. Exactly. | 11 | 38 | shortest, easy to remember | a metaphor that is not in the picture |
| F. Ask first | Which one turns faster? / Same teeth each second… / …so the one with fewer teeth. Exactly twice as fast. | 18 | 52 | involves the audience | the answer is on the screen already |
| G. One sentence | The teeth pass one for one, / so the big wheel turns slower, / by exactly the ratio of their sizes. | 19 | 36 | one thought, the general rule | part sentences on the screen; "ratio" abstract and in the trap |
| H. Rim speed | Same speed at the rim. / Bigger rim, slower turn. / speed × size: the same on both | 16 | 30 | the law itself | jargon; a product is hard to hear |

Ranking: A, B, C, D, E, F, G, H. **Chosen: A**, with C's "teeth cannot slip"
in the speaker notes as the reason for "exactly". The text is in the ink:
the second marks the span.

The user then asked for the reveal to be a trial too, one for each style: with
the flash's colours, one line a click; with the solid span, all the text
with the colour. Whichever style is kept keeps its reveal.

| Click | Shows | The gears |
| --- | --- | --- |
| 0 | the gears | turn freely |
| 1 | the span in the flash's colours (a trial) | turn freely |
| 2–4 | and the text, one line a click | turn freely |
| 5 | the span, solid, and all the text at once (a trial) | turn freely |
| 6 | the gears and the rest of the mechanism; the span and the text go | tick with it |
| 7 | and the seconds hand | tick with it |

The text is two blocks, one for each reveal, with the same words. At click
5 the first block fades out, and then the second fades in (the text-fade
rule), so the solid style's reveal shows as it would on its own. When one
style is kept, one block goes. `step6/text-clicks.png` shows the eight
clicks in Ledger.

Then the user changed the first two lines: the audience does not know
"pinion" from "wheel", and the lines now read the span: "Half of the small
gear", "Quarter of the big gear", then "Twice the size, half the speed.
Exactly." The same length of rim is half of one and a quarter of the other,
so "twice the size" follows from what the audience sees. (The one-for-one
idea is in the speaker notes.) The user also asked for the text to stay up
at click 5: there was no technical reason for the second block, only to show
the solid style's own reveal. One block now, lines at clicks 2 to 4, hidden
at click 6. The span's colour still fades out and in at click 5.
`step6/text-clicks-2.png` shows the eight clicks with these lines.

### The second hand's text (click 7)

The request: when the seconds hand fades in at click 7, text says that the big
gear turns once a minute, so the hand on it is a second hand. The hand is the
first part of the watch that a person reads. The first round of options said
so in words. The user decided that the brown hand shows it, so the text need
not say it. The user chose "second hand", the everyday word, not the
watchmaker's "seconds hand".

The room is the first text's place, which is empty from click 6: about 24
characters a line at 35 px. In this watch, the hand ticks once a second
(`design.json`: a 2 s period is two beats), and the fourth wheel turns once in
60 s. Most real watches tick 5 to 8 times a second, so "a tick a second" is
true of this watch only.

| Option | Lines                                                       | For                                                      | Against                                            |
| ------ | ----------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------- |
| A      | Once a minute. / A second hand!                             | short; the same beat as "Exactly."                       | the room stays empty; nothing ties it to the ticks |
| B      | The big gear turns / once a minute: / a second hand.        | uses "big gear" from the first text                      | at click 7 the escape wheel looks as big           |
| C      | One tick a second. / One turn a minute. / A second hand.    | from what the audience sees to what it cannot wait for   | three short sentences; the tick rate is this watch's |
| D      | Sixty ticks, / one turn: / a second hand.                   | short; counting                                          | the audience must find that a tick is a second     |
| E      | Once a minute. / Exactly. / A second hand.                  | a callback: the gear ratio makes the time exact          | the same beat twice in a minute                    |
| F      | The ticks set the pace, / the gears set the scale: / a second hand. | the whole system                                  | abstract; "scale" is vague; two lines nearly full  |
| G      | Once a minute, / one tick at a time. / A second hand.       | one spoken sentence                                      | does not say that a tick is a second               |
| H      | Every tick, one second. / Every turn, one minute.           | both rates, parallel                                     | no name; both lines nearly full                    |

My ranking was C, E, G, A, H, D, B, F. The user chose A, with "The second
hand!": "Once a minute. / The second hand!". The notes say the rest, and an IF
ASKED line gives the tick rate of real watches. The text waits for the hand
(`after-watch-fade`). The slide's fade rule is now in longhands
(`transition-property`, `transition-duration`): the shorthand set the delay to
0 and removed the wait. Measured in the built deck: the text is at opacity 0
300 ms after the click, and fades in from `--watch-fade` (0.8 s).
`step6/click7.png` shows click 7.

### `watch: all` and the span

The cover (`watch: all`) showed the span's colours. `all` was every mesh of the
scene, and the span's meshes are in the scene. Now a piece has `inAll`, and the
span's pieces have `inAll: false`: only a slide that names them shows them.
`watch/state.test.ts` checks that `all` leaves out exactly the span's pieces.

### Commit with both styles

The user cannot choose the style yet, and wants to commit with both. Full
validation must pass before a commit, and `scenecheck` rejected the flash
style. The options were: allow it in `scenecheck` for the trial; exempt only
the trial's meshes (tighter, but more code to add and delete later); or commit
with the check failing. The user chose the first. `scenecheck` now accepts a
mark in the flash's colours: a solid fill in the second's wash
(`MARK_WASH_ROLE`), and lines in the second on that mesh only. A line in the
second on any other mesh still fails. When the talk keeps one style, delete
the other there.
