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
