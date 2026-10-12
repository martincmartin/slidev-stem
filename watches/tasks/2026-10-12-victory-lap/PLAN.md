# The victory lap

**Status:** built (2026-10-12): the Recap slide, after the Hour Hand
slide, with the cameras that the user chose. The user looks at it next. The
tool to choose the cameras is the explorer (`watch/explorer/`, `pnpm
explore`; [`docs/watch.md`](../../docs/watch.md), "The explorer"). It came
first, for this task.

## Decisions (2026-10-12)

The user's answers to the open questions:

1. The speed rule's reading is right: the larger speed-up of the two parts,
   so the slower part turns once in 30 s.
2. One click for each stop.
3. Stop 2: 75°, with the motion works shown. Adjust after a look.
4. Build the turn in the renderer.
5. The slide goes after the Hour Hand slide. Its title is "Recap", and
   the title does not show.

The user asked about the fourth wheel's stop: its ratio is 2:1 (16 teeth,
8 leaves), so it runs at 2×. The fourth wheel (the seconds hand) turns
once in 30 s, and the escape wheel once in 15 s. The table below says the
same: its last column is the faster part.

## Request (2026-10-12)

- A slide with no text: a tour of the whole train, with the watch on the
  whole slide. The left 60% rule and the picture band do not apply.
- **The time-lapse's speed at a touch** of a wheel and a pinion is the
  larger speed-up of the two parts. The motion works start at 1440×. This
  rule is "to try, for now".
- **The touches.** The minute wheel on the cannon pinion cannot be seen in
  practice, but the hour wheel on the minute pinion can. The barrel on the
  centre pinion can perhaps be seen from 3 o'clock. All the other touches
  are easy to see.
- **The camera tilts and zooms at the same time.**
- **The stops**, in order:
  1. Tilt to 30° and zoom in to the motion works.
  2. The barrel on the centre pinion, from 3 o'clock, at 75°. It may need
     to be a little steeper.
  3. Back up over the movement: the centre wheel on the third pinion, at
     45°.
  4. From here on, each stop that shows a touch keeps the next touch in
     view, in the background. The third wheel on the fourth pinion.
  5. The fourth wheel on the escape pinion.
  6. The escape wheel on the pallet stones.
  7. The impulse jewel on the fork.
  8. The balance wheel.
  9. The hairspring, where the Hairspring slide shows it.
  10. Zoom out to the cover.

The docs that I read first: [`docs/watch.md`](../../docs/watch.md) (the
motion works, how a slide shows the watch, the keys, fitted views),
[`stem/docs/webgl.md`](../../../docs/webgl.md) ("The house style in 3D",
"Motion and slides").

## The touches

`tools/touches.py` computes them from the design at the start of the task
(`tools/design-before.json`). Its output is in `out/touches.txt`. The
coordinates are px from the centre arbor: $x$ to the right, $y$ toward 6
o'clock.

| Touch                        | Where, from the centre arbor | Its tangent runs toward |
| ---------------------------- | ---------------------------- | ----------------------- |
| hour wheel / minute pinion   | 20.0 px, at 10.7 o'clock     | 7.7 and 1.7 o'clock     |
| barrel / centre pinion       | 12.3 px, at 6.7 o'clock      | 3.7 and 9.7 o'clock     |
| centre wheel / third pinion  | 50.0 px, at 2.4 o'clock      | 5.4 and 11.4 o'clock    |
| third wheel / fourth pinion  | 90.1 px, at 1.6 o'clock      | 3.6 and 9.6 o'clock     |
| fourth wheel / escape pinion | 109.0 px, at 1.0 o'clock     | 2.1 and 8.1 o'clock     |

- **"From 3 o'clock" is the right side for the barrel.** The barrel's
  touch is on its tangent toward 3.7 o'clock (about 3:40). A camera there
  looks along the line where the teeth meet. From the other end of the
  tangent (9.7 o'clock), the centre arbor and the motion works' pinions are
  in the way.
- **"The next touch in the background"** puts the camera on the side away
  from the next touch. From the centre wheel's touch, the camera is at 6.8
  o'clock, and from the third wheel's touch at 5.4 o'clock. Both are near
  the side that the camera tilts toward now (6 o'clock). After the fourth
  wheel's touch, the train goes toward 9 o'clock (the pallet, the jewel,
  the balance), so the camera must be near 3 o'clock.

## The speed rule

My reading of "the larger speed-up of the two parts": each part has a
speed-up that turns it once in 30 s, which is the escape wheel's own speed.
At a touch, the stop takes the larger speed-up of its two parts: the slower
part's. So at each stop, the slower part turns once in 30 s, and the faster
part turns faster by the touch's ratio. This gives the request's 1440× at
the motion works with no other number: the hour wheel turns once in 12 h,
and $12 \times 3600 / 30 = 1440$.

| Stop                         | Slower part's turn | Speed-up | Slower part's turn, shown | Faster part's turn, shown |
| ---------------------------- | -----------------: | -------: | ------------------------: | ------------------------: |
| hour wheel / minute pinion   |               12 h |    1440× |                      30 s |     7.5 s (minute pinion) |
| barrel / centre pinion       |                6 h |     720× |                      30 s |     5.0 s (centre pinion) |
| centre wheel / third pinion  |                1 h |     120× |                      30 s |     3.75 s (third pinion) |
| third wheel / fourth pinion  |              7.5 m |      15× |                      30 s |     4.0 s (fourth pinion) |
| fourth wheel / escape pinion |               60 s |       2× |                      30 s |     15.0 s (escape wheel) |
| the escapement and balance   |               30 s |       1× |                      30 s |        (the balance: 2 s) |

The other reading keeps the faster part's shown speed the same at each
stop. It needs a choice of that speed, and it runs the escapement at 4×.
The first reading needs no choice, and it shows the escapement at its own
speed. The user confirmed the first reading.

### How the mechanism runs at each speed

The model's time-lapse (`mechanismAt` in `watch/model.ts`) keeps the
balance at its own speed, and jumps the train ahead by whole periods of
the balance (2 s, 2 beats). At a low speed-up, the jumps are far apart:

| Speed-up | Jumps (2 beats each), at 60 frames a second | Balance period if it ran at the speed-up |
| -------: | ------------------------------------------- | ---------------------------------------- |
|    1440× | 0.1 frames apart: smooth                    | 0.1 frames: strobes                      |
|     720× | 0.2 frames apart: smooth                    | 0.2 frames: strobes                      |
|     120× | 1.0 frame apart: smooth                     | 1.0 frame: strobes                       |
|      15× | 8.6 frames apart: jerky                     | 8 frames: a fast, clear swing            |
|       2× | 120 frames apart: wrong                     | 60 frames: clear                         |

At 2×, the escape wheel would jump two beats every 2 s, and the fork would
not move with it. At that stop, the escapement is in the background.

| Option                                               | Pros                                                  | Cons                                                                |
| ---------------------------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------- |
| A. The jumps at every speed                          | no new code                                           | jerky at 15×; the escape wheel and the fork disagree at 2×          |
| B. The whole mechanism, balance too, at the speed-up | always true: what a camera would film                 | the balance strobes at 120× and above                               |
| **C. B up to 15×, A from 120×** _(recommended)_      | true where the balance can be seen; smooth everywhere | the balance's speed changes once, on the move from stop 3 to stop 4 |

With C, the balance can ease from its own speed to the speed-up during
that move: the train stays ahead by whole periods, and the jumps get
rarer as the two speeds meet. The implementation will test this.

## The camera

### It must turn about the watch's axis

The camera now tilts only toward 6 o'clock (`viewProjection` in
`webgl/renderer.ts`). Stop 2 (from 3:40) and stops 5 to 7 (from about 3
o'clock) need another side. `stem/docs/webgl.md` says that this is a choice
of look, not a limit, and lists what a change needs.

| Option                                                           | Pros                                                                                           | Cons                                                                                               |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| **A turn about the watch's axis, then the tilt** _(recommended)_ | the dial's axis stays up on the screen, as when you look at a watch on a table; one more angle | a change to the renderer, the timeline, the frontmatter (`watchTurn`), the checks and the explorer |
| A tilt about the slide's vertical axis                           | the same code as the tilt                                                                      | at 75° the watch stands on its edge on the screen; only 3 and 9 o'clock                            |
| No turn: every view from 6 o'clock                               | no change                                                                                      | stop 2 looks through the barrel's wall; at stops 5 to 7 the next touch is in front, not behind     |

### Steep tilts

At stop 2, the hour wheel is over the barrel's touch, and the chapter ring
is between it and the camera. A line of sight along the tangent rises
$s \cot t$ in a distance $s$, at tilt $t$. It runs 18.8 px under the hour
wheel (bottom at 20.38) and meets the chapter ring's inner edge at 191.6 px
(top at 27.88). The touch is 12.25 to 17.25 high.

|    Tilt | Height of the touch that shows |
| ------: | -----------------------------: |
|     70° |                            25% |
|     75° |                            62% |
|     78° |                            83% |
|     80° |                            96% |
| 81°–84° |                           100% |
|     86° |                            55% |

All of it shows from 80.6° to 85.3°. If stop 2 hides the motion works, all
of it shows at 75°, and only the ring sets the steepest tilt. The hands
(26.38 to 29.38) can also cross the line of sight, at some times. **The
user's choice:** a tilt of about 82° with all the parts, or 75° with the
motion works (and perhaps the hands) hidden.

The renderer's browser checks draw the holdout rule at tilts to 75°
(`webgl/probe/checks.ts`). A tilt past 75° needs those checks at that
tilt, and a look at the lines of faces that are almost edge-on.

### Moving, tilting, turning and zooming together

The timeline has one order now: zooming in, move and then tilt; otherwise,
the reverse (`webgl/timeline.ts`). The lap needs an option to do all of
them at the same time. Mix the camera in its own terms: the point at the
focus, the scale (as a logarithm), the tilt and the turn. The explorer's
camera already has these terms. A mix of a view's shift and pivot, as now,
swings the picture off its path when the camera turns.

### How a stop names its camera

| Option                                                                                               | Pros                                                                          | Cons                                                                   |
| ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Numbers from the explorer, as named views                                                            | simple                                                                        | a change of the design moves a touch, and the numbers do not follow it |
| **A view made from the touch: its place from the design, and a turn, tilt and zoom** _(recommended)_ | only the angles and the zoom are chosen by hand; the touch stays at the focus | a new kind of view                                                     |
| Fitted views of the touch's pieces                                                                   | exists                                                                        | fits boxes, not a touch; its band and left 60% rule do not apply here  |

## Clicks

Not decided. **One click for each stop** _(recommended)_: the speaker sets
the pace, and each stop is a page of the PDF, which `art:print` checks. One
click for the whole flight runs on a clock: the speaker cannot wait at a
stop, and the PDF has one page for ten pictures.

## Open questions

None now. The user's answers are in [Decisions](#decisions-2026-10-12).

## Steps

1. **Done.** The turn: `viewProjection`, the direction to the camera,
   `Frame`, the timeline's channel, the `watchTurn` key, the probe's checks
   (with tilts past 75°), and the explorer's keys. Update
   `stem/docs/webgl.md`. See [Step 1: the turn](#step-1-the-turn).
2. **Done.** The user chooses each stop's turn, tilt and zoom in the
   explorer: [The stops' cameras](#the-stops-cameras-2026-10-12).
3. **Done.** The views made from the touches (`watch/recap.ts`).
4. **Done.** The timeline's option to move all channels together
   (`watchMove: together`, `mixCamera`).
5. **Done.** The speed rule: `watchLapse`, and option C
   (`watch/lapse.ts`).
6. **Done.** The slide: its frontmatter, the speaker notes, the docs and the
   tests. See [Steps 2 to 6](#steps-2-to-6-the-slide).

## Step 1: the turn

- **The angles.** `CameraAngles` (`webgl/scene.ts`) holds the tilt and the
  turn; `Frame` and `StageState` have both. The world turns clockwise on
  the slide about the z axis through the view's pivot, then tilts as
  before. The direction to the camera is
  $(\sin t \sin u, \sin t \cos u, \cos t)$ for tilt $t$ and turn $u$.
- **Turn 0 draws what the tilt alone drew.** Each new term of the camera's
  matrix is an exact 0 at turn 0. `art/pixel_regression.py`: all 11 frames
  are byte-identical before and after.
- **The timeline's "tilt" channel is now "angles"**: the tilt and the turn
  change in one phase, eased the same. No tool reads the phase's name.
  `TILT_SECONDS` is now `ANGLES_SECONDS`.
- **`watchTurn`**, one of the keys that a click can change. A fitted view
  refuses a turn other than 0: `fittedView` fits the boxes of the pieces in
  the plan at turn 0. The recap's stops use views made from the touches
  (step 3), so they do not need a fitted view.
- **The holdout check now runs at tilts 0 to 85, and at three turns.** At
  80°, its old part under the holdout (30 × 30 × 4) was 0.35 px inside the
  holdout's edge on the screen, less than half a line: the check failed.
  Past 81° it shows past the edge, as a real part does. The check's part is
  now 20 × 20 × 0.5, in the middle, at a zoom of 2: 3.4 px inside at 85°,
  at any turn. With that part 0.6 above the holdout, the check fails, so it
  still finds a holdout that does not hide.
- **Tests:** `webgl/renderer.test.ts` (a turned camera shows the world
  turned; 3 o'clock at the bottom at turn 90; the direction to the camera
  is the depth), a timeline test (the tilt and the turn in one phase), and
  a state test (`watchTurn`, and its refusal with a fitted view).

## The stops' cameras (2026-10-12)

The user chose these in the explorer. They added a stop: the barrel and its
spring, not a touch. The speed-up of that stop is the barrel's: 6 h a turn,
720×. The hairspring's stop is the Hairspring slide's camera, and the last
stop is the cover's.

| Click | Stop                                     | Turn | Tilt | Zoom | Speed-up |
| ----: | ---------------------------------------- | ---: | ---: | ---: | -------: |
|     0 | hour wheel / minute pinion               |    0 |   30 |    8 |    1440× |
|     1 | the barrel and its spring                |    0 |   30 |  3.5 |     720× |
|     2 | barrel / centre pinion                   |   80 |   80 |   15 |     720× |
|     3 | centre wheel / third pinion              |  -10 |   45 |  8.5 |     120× |
|     4 | third wheel / fourth pinion              |   15 |   45 |   10 |      15× |
|     5 | fourth wheel / escape pinion             |   75 |   45 |   10 |       2× |
|     6 | escape wheel / pallet stones             |   90 |   45 |   10 |       1× |
|     7 | impulse jewel / fork                     |   90 |   45 |    9 |       1× |
|     8 | hairspring (the Hairspring slide's view) |    0 |   20 | 4.46 |       1× |
|     9 | the cover                                |    0 |    0 |    1 |       1× |

## Steps 2 to 6: the slide

- **Where a stop's touch shows: the middle of the slide.** The user gave
  the zoom and the angles, not the place; with no text, the middle is the
  default. To move a touch, give its view another place in
  `watch/recap.ts`.
- **A touch's height** is the middle of the body of the wheel whose teeth
  make it (`bodyLayer` in `generate()`): the barrel's touch at 14.75, as
  `out/touches.txt` has it. The pallet's point is on the escape wheel's
  pitch circle toward the fork's pivot; the jewel's is its centre with the
  balance at rest.
- **The slide's tilt and turn are in its frontmatter; the zoom is in the
  view.** This is as for the Hairspring slide (its zoom in `views()`, its
  tilt in the frontmatter).
- **The together move** mixes the scale evenly in its logarithm, and moves
  the pivot so that it crosses the screen at an even speed: in the world,
  it has gone $(1 - r^{-u}) / (1 - r^{-1})$ of its way at $u$, for a ratio
  of scales $r$. 2.5 s (`TOGETHER_SECONDS`). Measured in Chromium, from
  click 2 to click 3: at 0.4, 0.9, 1.4 and 2.0 s the tilt is 79, 70, 52 and
  45, the turn 78, 55, 8 and −10, and the zoom 14.8, 12.8, 9.5 and 8.5.
- **The time-lapse** (`LapseClock`): the balance's clock (`BalanceClock`)
  runs on the lapse clock's time, which runs at the balance's speed-up; the
  train is ahead of it by whole periods. Both are integrals from the clock's
  start, so a frame's shutter instant, before the last frame, is exact.
- **`all` in a list of pieces**, so the slide shows the whole watch and the
  motion works with no list of every piece. The deck's tests that ask
  whether a slide shows a piece read it too.
- **The last click shows `watch: all`**, what the cover shows: the motion
  works fade out, then the camera moves.
- **To look at:** the hour and minute hands are in front of several close
  stops (the barrel's touch, the centre wheel's). A stop can hide them
  (`watch: [all, ...]` without them has no syntax yet: name the pieces, or
  add one).

## The user's first look (2026-10-12)

- **The third wheel's stop needs more zoom: 10, not 9.** Changed in
  `watch/recap.ts`.
- **"The third wheel on the fourth pinion is choppy, a low frame rate."**
  At 15× the whole mechanism runs fast, so the train ticks at each beat: 15
  ticks a second, each shorter than a frame, so the fourth pinion stands
  still for 3 frames and then turns 6°. I made the train turn at its mean
  speed in a fast time-lapse. Then the user took the objection back: it is
  what the mechanism does. So the ticks stay. A test keeps them: at 15×, 30
  steps of 6° in 120 frames.
- **Not an oversight: the train does not turn at its mean speed from
  120×**, where it runs ahead of the balance by whole periods (a device,
  not the mechanism) and those come about once a frame. Each frame shows
  the mechanism at an instant spread over its shutter (`shutterInstant`),
  as the Mainspring slide's time-lapse does. That spread moves a slow part
  by up to a frame's turn, as much as the periods' unevenness, so a mean
  speed there gains nothing.
- **"The explorer should have the actual times."** Its speeds were a list
  of mine (1× to 3600×). Now it runs the deck's own model (`WatchModel`),
  and its menu lists the deck's speed-ups, each with the slides and clicks
  that use it, read from `slides.md` in the browser. A second menu shows
  any slide at any click as the deck does: camera, pieces and motion.
- **"Skip the balance wheel's stop; go straight to the hairspring on the
  left."** The jewel's stop goes to the Hairspring slide's view; the
  `recap balance` view is gone. 9 clicks.
- **"From the hairspring to the cover, reverse the cover-to-hairspring
  motion: tilt to zero, then zoom."** The last click moves in order
  (`watchMove: ordered`): zooming out, the camera changes its angles and
  then moves. Measured in Chromium: the tilt goes 20, 7.5, 0 at a zoom of
  4.46, then the zoom goes 4.46, 2.07, 1.
- **"At click 3 the pallet, in the upper left, moves too slowly. What did
  the 6-hours-in-6-seconds time-lapse do?"** Option C ran the balance at
  its own speed from 120×, with the train ahead by whole periods: a
  stroboscope, which `docs/watch.md` ("The Mainspring slide") rejects. So
  the pallet flipped once a second while the train ran at 120×. The
  Mainspring slide's time-lapse runs the whole mechanism fast, in step, and
  shows each frame at an instant spread over its shutter, so what moves
  faster than a frame blurs. The Recap now does the same at every
  speed-up: `LapseClock` gives the time ahead, in fractions of a beat, at
  the shutter's instant. This replaces option C, and it is simpler: no
  second clock for the balance. Measured: at 120× the fork is at -9, -5.4,
  -9, 9, -9, 9, 9, -9 ... degrees in successive frames; at 1×, -9 in each.
  At 15× the train still ticks; a frame's instant can fall inside a tick,
  which then shows over two frames.
- **When a time-lapse ends, its time ahead goes into the balance's clock**
  (`BalanceClock.advanceBy`), with no jump: a fractional lead would leave
  the balance on its free swing, and a later slide could not rest it. A
  test checks it: without the hand-over, the minute hand jumps 22°.
- **"Add a time scale in the bottom right: the speed-up and a times sign,
  perhaps in muted."** `components/TimeScale.vue`, on the Recap slide: for
  example "1440×", 22 px, muted, with the paper's outline, 28 px from the
  right and 20 px from the bottom. It reads `watchLapse` at the click, so
  the speed-ups stay in the frontmatter only. The new number fades in when
  the watch's change ends, as text that reads the picture does: during the
  2.5 s ease the speed-up is between the two numbers. A live number that
  counts with the ease was the other choice; the house rule is that text
  fades and does not cut, so the number does not count. Checked in
  Chromium, Firefox and WebKit: at each click that changes the speed-up,
  the old number fades out, and the new one is at opacity 0 at 0.3 s and 1
  at 3.5 s.
- **"The number in ink, and the words 'time scale' in muted, both with the
  paper's outline. Keep the number on the whole time, and cut to the new
  speed."** The words are 17 px over the number, 22 px, right-aligned. The
  number cuts at the click, to the click's speed-up: the mechanism eases to
  it over the 2.5 s of the camera's move (`LapseClock.show`, evenly in the
  logarithm, with `ease`). The other places for the cut were the end of the
  ease, or the middle, where the speed-up is the two numbers' geometric
  mean; a number that counts with the ease would cut at each frame.
- **"Drop the time scale at the balance and the cover. During a change,
  show the actual, interpolated speed-up, to the nearest whole number."**
  The number now follows the model's speed-up at each frame, so it has to
  be where the model is: in the watch's layer (`global-bottom.vue`), as
  the tick-tock words are, and no longer in the slide's body. A frontmatter
  key, `watchTimeScale`, shows it per click, as `watchTickTock` does; the
  hairspring's click sets it false. A printed page shows the click's
  number (`slide-bottom.vue`). Measured in Chromium, Firefox and WebKit,
  every 250 ms: into the slide, 1, 2, 7, 47, 257, 725, 1192, 1416, 1440;
  click 3, 715, 677, 584, 442, 277, 183, 142, 126, 120; click 6, 2 then 1;
  at click 8 it fades out.

## The code-quality review

The review is in [`review-2026-10-12.md`](review-2026-10-12.md). Each finding
was checked against the code before a change.

- **A rest asked for while the balance resumes in a time-lapse.** The
  review was right: the time ahead stayed, and the balance rested at 0.27°,
  with the train part of the way through a beat, for as long as the rest
  lasted. Only a free swing can take the time ahead, and a resume ends at
  an extreme of the balance's clock, which is not one of the mechanism's.
  Reaching it needs a rest within the resume's 0.78 s: a key held down from
  the Mainspring slide to the Recap and back. One click into the Recap and
  back does not, because the Hour Hand slide does not rest the balance.
  Options, from the review: (1) let the resume end in a free swing, hand
  over the time ahead, then settle; (2) start the time-lapse only after
  the resume; (3) round the time ahead to whole periods. Chosen: 1
  (`WatchModel.settle`). It has no jump, and the time-lapse starts as
  before. 3 jumps the mechanism by up to half a period. 2 changes the
  speed's ease. `untilRest` gives the wait, so the text waits for it. A
  test runs the review's case: no jump, and it rests at 0° when
  `untilRest` said.
- **The last Recap step moved in a different way going back.** The camera's
  move (`watchMove`) came from the click the step went to, so hairspring
  to cover moved in two steps (3.3 s) and cover to hairspring all at once
  (2.5 s). The same happened at the step from the Hour Hand slide into the
  Recap, which the review did not name. Chosen: the later click of a step
  says the move, in either direction (`stepMove`), as the later slide
  says `watchMoveWith`. No code asks which way the viewer went: the layer
  passes the step's kind (`moveOf`). Rejected: an `ordered` key on the
  hairspring's click too, which would change the step into it. A deck
  test checks that each step back moves the camera as the step forward,
  reversed; without the change, it fails at the Hour Hand slide and the
  Recap. Measured in the deck: hairspring to cover, angles then view; cover
  to hairspring, view then angles, 1.8 s and 1.5 s in Firefox and WebKit.
  In headless Chromium the phases measured shorter (1.0 to 1.5 s), because
  its animation frames come late, but the order is the same.
- **The explorer's poses lost their dim, and Restart and a reload lost
  their motion.** Both true. The page keeps the pose whose motion runs and
  the pose whose dim shows, and the address holds both by name. A change of
  speed ends the first, and a change of pieces ends the second. Checked in
  Chromium, Firefox and WebKit: the Escapement slide's click 3 rests after
  Restart and after a reload, and its click 2 does not rest. The Hour Hand
  slide's click 3 draws differently with and without its dim, and a reload
  keeps the dim.
- **Smaller items.** The time scale reports its number (`settled`), its
  opacity (`continuous`) and `busy` until the number is the click's
  (`slide-state.ts`). Checked in the three engines: at click 3, busy from
  715 down to 121, then 120 and not busy. The comment on
  `WatchModel.lapse` describes the current design. The address's scale
  must be in the zoom's range (`SCALE_RANGE`): `scale=Infinity` now gives
  the default view.

## The second code-quality review

The review is in [`review-2026-10-12-2.md`](review-2026-10-12-2.md). It found
the first review's findings fixed, and four small items, all true. Each was
checked against the code.

- **The explorer's address had hidden effects.** `loadAddress()` returned a
  camera, but also set the pieces, the speed, the poses and the guides. Now
  `watch/explorer/address.ts` encodes the page's state and decodes a hash
  into a value, with no page, and the explorer applies the value. A part
  that is wrong decodes to `null`, and the others still apply, as before.
  `address.test.ts` tests it. The review's other options, a function with
  its effects named, or a controller for the page, were less clear or more
  code. The review also found that the menu's placeholder chose the first
  pose (`Number("")` is 0): the placeholder is now disabled, and the code
  ignores it.
- **The speed-up and the running pose were two facts that had to agree.**
  Now one value says what runs (`ExplorerMotion`: free at a speed-up, or a
  pose), and the speed-up and the model's state come from it. One function
  sets it and the menus (`runMotion`). The dim stays separate: a change of
  the pieces ends it, and not the motion.
- **The deck tests read the pieces' names a second way** (`shows()`, with
  the rules for `all`). Now they ask the stage what it draws
  (`stageState`), for the piece objects.
- **"The first thirteen keys" in docs/watch.md** was out of date: there are
  fourteen. The docs now name the list (`CLICK_KEYS` in `watch/state.ts`),
  not a count.
- **The time-lapse table's accuracy.** The review measured the table's
  error against a fine reference: up to 0.661 s of mechanism time, at 1x to
  1440x in 2.5 s. In the unit that matters, the mechanism's motion in one
  frame at that moment, it is at most 0.16 of a frame (1440x to 720x: 0.02;
  120x to 15x: 0.05; 2x to 1x: 0.02), less than the spread of a frame's
  instant in its shutter. The 64 steps stay. The limit, a quarter of a
  frame, is in `lapse.ts`, and a test checks it; with 32 steps, the test
  fails.
- **The time-lapse clock's inputs.** `LapseClock` now throws on a time that
  is not finite, a speed-up under 1 or not finite, and a change's seconds
  under 0 or not finite. Its change is read-only, and its comment says that
  it holds only the current change.
