# Turning a figure of the watch

A reader of the article drags a figure of the watch to turn it, as on
Bartosz Ciechanowski's pages. The request is in `instructions.md`.

## 1. What is there

- **The renderer draws any tilt and turn.** The camera is orthographic: it
  turns the world about the watch's axis, then tilts it about the slide's
  horizontal axis, through the view's pivot (`viewProjection`,
  `webgl/renderer.ts`). The slides use 0° and 20°; the Recap tilts and
  turns the camera as it moves. The explorer (`pnpm explore`) moves the
  camera with the mouse.
- **The layers over the canvas ride the pose** that `drawFrame` gives them
  (`slidePoint`, `planeOnSlide`): the drive arrow, the story maps' marks.
- **The callouts do not.** Their leaders' ends are computed for the slide's
  view (`escapementMarks`), and the slide places their labels.
- **A figure's frame is the addon's** (`ArticleFigure.vue`); the canvas is
  the talk's (`FigureLayer.vue`), under the slide's own content, which
  covers it. So a drag on the picture reaches the frame, not the canvas.

## 2. Edge-on

Measured in the explorer at turn 0° and 90° (two edges), at the whole watch
and zoomed on the movement, at tilts 0°, 60°, 85°, 89°, 89.9° and 90°
(`evidence/sheet-edge-crop.png`, the whole watch, and `evidence/sheet-edge-zoomcrop.png`, the movement; `evidence/explore_edge.py` took them from the explorer). At 85° the watch reads well. At 89°, 89.9° and 90° the
pictures are the same: the case band from the side, with the dial's lines
on its top edge as a dotted blue streak (a line keeps its width, so the
lines of a face seen edge-on lie on one another). Nothing shows through
what should hide it, and nothing fights. Chosen limit: **89° from
face-on**, which looks as 90° does, and keeps clear of faces exactly
edge-on, where depths tie.

## 3. Options for the rotation

- **R1. Change the tilt and the turn.** A drag sideways turns the watch
  about its own axis: at tilt 0 the picture spins flat, with no depth. A
  tilt toward the left or right edge comes out turned 90° on the screen.
- **R2. A second rotation in the view's own axes, after the camera's**
  ("orbit": a yaw about the screen's vertical axis, then a pitch about its
  horizontal axis, through the pivot). A drag sideways swings the watch to
  show its side; up and down tips it toward or away. Any direction, and 12
  o'clock stays near the top. The camera's matrix gains one 3 × 3 rotation
  about the pivot; with no orbit it is the matrix of today, unchanged.
- **R3. A free trackball (a quaternion).** Any rotation, but it rolls the
  picture, and the limit "not from behind" is harder to state.

Chosen: R2. It shows depth on a sideways drag, which a phone's thumb makes
(touch option A), and it keeps the picture upright.

## 4. Decisions

- **Which figures turn:** those that draw the watch: not the globe or a
  story map, not while the diving board's picture covers the watch (a flat
  drawing). At first not the Recap's playing figure either, as its
  camera moves by itself; then the user asked for it: a turn holds the
  tour, and a press of a step's button eases the turn back while the
  camera moves to the step, with no drag until it is there, and the tour
  goes on.
- **The limit:** the dial's normal stays within 89° of the direction to
  the reader. It is the angle of the result, the figure's own tilt and the
  reader's turn together: a figure at tilt 20° turns up to 109° one way and
  69° the other.
- **The traps:** no wheel listener at all (the page scrolls); on touch,
  `touch-action: pan-y`, so a vertical swipe scrolls the page even on a
  figure, and only a sideways drag turns it; the limit; and "Reset view"
  under the figure once it is turned.
- **The callouts** fade out while a figure is turned: their leaders would
  point at nothing. Reset brings them back.
- **A step keeps the turn** (the user, after a first version that reset
  it at each step and at the Mainspring slide's button: "Those
  interactions aren't changing the view, so there's no need for them to
  reset it"). The orbit is after the step's camera, so a step that moves
  the camera still moves it. Only "Reset view", or a step to a picture
  that cannot turn, ends the turn.
- **The addon owns the gesture** (the frame, the button, the fade); the
  talk owns the rotation (`FigureContext.turner`, `addons/narration/figure.ts`).

## 5. Steps

1. The orbit's math, with tests (`webgl/orbit.ts`), and the camera
   (`viewProjection`, `drawFrame`, `SharedView`).
2. The gesture and the button in the addon; the turner in the talk.
3. Checks: the tests, the phone check, a drag in three engines, a look at
   each turnable figure, and the Android emulator.
4. The docs.

## 6. Results

- **The rotation.** With no orbit, the camera's matrix is the one of
  before, to the bit (`webgl/renderer.test.ts`). With one, each point goes
  where the definition puts it, at three tilts, three turns and four
  orbits.
- **A drag** (`evidence/turn-check.mjs`, against `pnpm dev` on port 4321;
  copy it into the talk's directory to run it, as it needs the talk's
  Playwright). With a mouse, in Chromium, Firefox and WebKit, on the
  cover's whole watch and on the Escapement slide's first figure: a drag
  turns the figure, fades the labels to opacity 0 and shows "Reset view";
  the button puts both back. The wheel over a figure scrolls the page by
  300 px and turns nothing. No page errors.
- **Touch** (Chromium, as a Pixel 7, through CDP's touch events, so that
  `touch-action` applies): a vertical swipe on a figure scrolls the page
  and turns nothing; a sideways swipe turns it
  (`evidence/turn-touch.png`). The first version turned the figure a
  little on a vertical swipe too: the browser sends a few moves before it
  starts to scroll. A touch now waits for 10 px, and turns only if it went
  more sideways than up or down.
- **The figures**: at first, no figure of the Hairspring slide turned:
  the rule left out each slide with a diving board. The user found that
  the first figure, the WebGL hairspring with no board, did not turn. Now
  only a figure where the board's picture covers the watch does not turn
  (its second and third); where the watch shows, what the board draws
  over it fades out while the watch is turned. The others of Part 1
  turn. At the limit, a figure at the slide's
  tilt shows its edge at a slant (`evidence/turn-escapement.png`, and the
  limit shots in section 2).
- **Tick and tock** first came out where the slide's own view shows the
  stones, away from the turned watch (the user saw it). `stoneStrikes`
  now takes the figure's orbit, and the words come out at the turned
  stones (`evidence/turn-tick-tock.png`, `evidence/tick-check.mjs`; a
  test in `watch/callouts.test.ts`).
- **"Reset view"** first sat in the controls' row, hidden until a turn.
  It kept its room, so the pause button sat off center. It is now over
  the picture's lower right corner, where the labels were. It is now in
  the upper right corner: in the Recap, it covered the time scale
  (`evidence/recap.png`). The labels there hide too while the figure is
  turned.
- **A step keeps the turn** (`evidence/keep-check.mjs`): on Part 1's three
  turnable figures with steps or a button (the Gear Train slide's, the
  Mainspring slide's button and its next step), a drag, then the next step
  or the button: each stays turned, and the step plays
  (`evidence/turn-kept.png`).
- **The Recap** (`evidence/recap-check.mjs`): a drag held the tour at its
  step for 15 s, longer than a step's change and dwell. "Next step" ended
  the turn: a drag turned nothing until the step's camera move had ended,
  and then the tour went on by itself, step after step
  (`evidence/recap.png`: turned and held; on the way back; back, with the
  time scale, which the first place of "Reset view" covered).
- **One motion in the Recap.** At first the turn eased back in 0.6 s of
  its own, and then the camera's longer move went on alone: the user saw
  two motions, a reset and then the move. Now a turn that a step ends
  eases back over the camera's move, on its clock and with its curve
  (`ease` in `webgl/timeline.ts`). The timeline cannot start its move from
  the turned picture: the camera's tilt and turn are two angles, and a
  turned camera needs three.
  A strip of the move (`evidence/recap-strip.png`, from
  `evidence/recap-strip.mjs`, with Playwright's clock stepped 200 ms a
  frame, as a screenshot of WebGL takes over a second headless): turned at
  1440×, then a jump of two steps; the time scale eases from 1438× to
  720×, and the turned picture swings into the step's view in one move.
  The first frame differs more than the rest: installing the clock moved
  the page's time on by 1 s, and the gears turned at 1440×.
- **The strap** was 1,100 px from the watch's centre, to stay off the slide
  up to a tilt of about 75°. Turned, it looked like a plank: with no light
  or perspective, nothing shows its angle (the user). It is now 450
  (`STRAP_LENGTH` in `watch/generate.ts`). A measure over each click of
  the talk, each article figure, and the camera's way between clicks while
  the strap shows (`evidence/strap-measure.ts`) found that 423 is the
  least that keeps both ends off the slide: the Gear Train slide's first
  click and the trenches slide. `watch/strap.test.ts` checks it; it fails
  at 400. Turned, the cover's figure now shows short strap ends
  (`evidence/strap.png`).
- **No wait after the camera arrives.** A drag first turned nothing until
  the whole step's change had ended (`busyUntil`): in the Recap, seconds
  after the camera arrived, while the hands faded. The user: fades do not
  change the view. Now a drag waits only for the picture to be back,
  which is when the camera's move ends.
