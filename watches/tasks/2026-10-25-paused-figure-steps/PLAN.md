# Plan: steps in a paused figure

Status: option 1 built, 2026-10-25, with every step a move (below). Not
committed.

## The bug

A paused figure was not drawn at all (`SharedView.paused`,
`webgl/shared.ts`). A step changed the caption, but the picture kept the
last frame. For a reader who asks for reduced motion, every figure starts
paused, so no step button worked. The `wind` and `twist` sliders failed in
the same way under "Pause them all", in Firefox and WebKit.

Measured with `tools/paused-step.ts` and `tools/paused-slider.ts`, on a
deck built before and after each fix, in Chromium, Firefox and WebKit.
Before: a step in the paused Gear Train and Mainspring figures did not change
the picture, in all three engines.

## First fix: a jump

A paused view is drawn once after its state or model changes
(`SharedView.redraw`), and a step in a paused figure is a jump. After it, a
step changed the picture of all three stepped figures in all three engines,
and the picture then stood still; each slider changed its picture.

The user then asked for the move itself: the pan, the zoom and the time
scale, from whatever shows.

## Options

The timeline and the model have no clock of their own: each call takes
`now`. A new state already starts from the state at `now` (the header of
`webgl/timeline.ts`), and a change of time scale eases in the model. So the
choreography exists. What is missing: in a paused figure, the state at
`now` is not what shows. A paused view only stops drawing. Its time goes on,
so the balance, the train and the time scale move on in model time, and a
pause in the middle of a move leaves the timeline past the picture.

1. **A clock for each figure that stands still while it is paused.** A step
   in a paused figure runs the clock until the step's change ends
   (`busyUntil`, with the board's end), then it stands again. The move
   starts from the picture on the screen, also after a pause in the middle
   of a move. And Play goes on from the paused moment, not from the present.
   Cost: about 150 to 250 lines in about 8 files; the components that the
   live talk shares (`DivingBoard`, `TickTock`, `TimeScale`) get a clock
   with the page's as the default.
2. **Draw a paused view in real time until the step ends.** About 15 lines.
   The camera is right after a pause at rest, but the moving parts jump to
   the present at the first frame, and a pause in a move jumps too. Most
   visible on the Recap figure, where the train spins at high time scales.
3. **The jump (the first fix).** No motion, and no more code. Right for
   reduced motion; a reader who paused only to read does not see the move.

Ranked: 1 (no visible fault, and the hard part exists), 3 (right, at no
cost, if a pause must mean no motion), 2 (cheap, but a jump at the start of
each move is a fault that a reader sees). With each option, a reader who
asks for reduced motion keeps the jump: WCAG 2.3.3, "Animation from
Interactions".

## Design of option 1

- `FigureClock` (`addons/narration/clock.ts`): the figure's time, from the
  page's. Paused, its time is `min(page - lag, end)`: a pause sets `end` to
  the time now, and a run to a later time moves `end`. Play sets `end` to
  infinity. Pure, so a `node:test` test drives it with made-up times.
- `ArticleFigure.vue` owns the clock. It gives the layer `now` (the
  figure's time) and `moving` (whether that time runs), runs the clock to
  `busyUntil` when a paused figure's change sets it, and gives `jumps` (a
  paused figure for a reader who asks for reduced motion).
- The layer reads `figure.now()` wherever it read `performance.now()`, and
  the frame's time. `SharedView` takes a `now` function. `DivingBoard`,
  `TickTock` and `TimeScale` take an optional `clock`; without one (the
  live talk) they read the page's clock as before.
- `busyUntil` is in the figure's time. The layer sets it to the later of
  the view's end and the board's (`BoardClock.endAt`, which the board
  emits).

## Step to a click that is not a neighbour (the user, 2026-10-25)

> Currently, we get smooth transition between adjacent buttons, but a jump
> between distant ones. I want smooth between any start state and any
> button press.

A figure took `moveOf` from the talk (`watch/navigation.ts`): a change of
more than one click is a jump. In the talk that is right: a jump goes to
another place. In a figure, the reader presses a dot to see that click. So a
figure's change is a step forward or back by the clicks' order (`moveTo` in
`components/FigureLayer.vue`), with the later click's camera move
(`stepMove`), as a step back already has. The timeline and the board go from
any state to any target, so nothing else changed. `moveOf` is the talk's
and stays.

## Results (2026-10-25)

On a deck built with all the changes, in Chromium, Firefox and WebKit, with
the scripts in `tools/`:

- `paused-move.ts`: in the paused Gear Train, Mainspring and Recap figures,
  a step changes the picture, moves (the shot 100 ms after the press differs
  from the last), and stands after 4.8 to 7.5 s. With reduced motion, it
  changes the picture and does not move: it stands in 0.5 to 0.8 s, the
  time of two shots. A pause in the middle of a Recap move stands for 1.5 s
  and more, and the next step moves from there.
- `paused-twist.ts`: in the paused Hairspring twist figure, a hold changes
  the picture; a let-go changes it again (back to rest), and it then stands,
  with the thumb at 0. `paused-slider.ts` reads "false" for that figure now:
  Playwright's `fill` sends `change` too, so it lets go, and the hairspring
  is back at rest when the shot is taken. The other two sliders change the
  picture.
- `distant-step.ts`: only the Recap figure has more than two steps. From
  its first stop to its last, and back, the picture moves, paused and
  playing. A filmstrip of the paused move (first stop to last) shows the
  hands fade out, the camera travel to the balance, and the figure stand.

## The prerender's time (2026-10-25)

`node addons/narration/prerender.ts` on a build, here (Apple silicon, the
prerender's Chromium with its default arguments), one run each:

- before any change: 78.5, 78.1, 77.7 s;
- option 1, with a view drawn once when it pauses: 86.4, 84.5 s;
- option 1, without that frame: 77.8, 78.7 s.

The prerender pauses all the figures before each still, and the screenshot
waits for that frame in each figure near the screen. So a paused view keeps
its last frame, which may be up to a frame (about 16 ms) before the time
where it stood; nothing that shows moves that little.
