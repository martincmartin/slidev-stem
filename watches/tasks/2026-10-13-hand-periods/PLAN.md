# A slide that says how often each hand turns

**Status:** built (2026-10-13), as the Three Hands slide. The current rules
are in [`docs/watch.md`](../../docs/watch.md), "The Three Hands slide".

## Request (2026-10-13)

- Insert a quick new slide after the Escapement slide. It says that the
  second hand turns once a minute, the minute hand once an hour, and the
  hour hand once every 12 hours.
- People who saw the talk found this confusing until they thought it
  through.
- Explain one case only, and then state the others. When the audience has
  worked through one case, the others are obvious.
- Give 5 designs, with pros and cons, and rank them.

Docs read first: [`docs/slide-patterns.md`](../../docs/slide-patterns.md)
(the click pattern, text fades, text dims, where things go),
[`docs/watch.md`](../../docs/watch.md) ("The Gears slide", "The Gear Train
slide", "The Hour Hand slide", "The keys"),
[`stem/docs/navigation.md`](../../../docs/navigation.md) (the rules),
[`stem/docs/legibility.md`](../../../docs/legibility.md) (the floors, text
sizes), [`docs/rough-slides.md`](../../docs/rough-slides.md).

## What the audience knows at this point

| Slide           | What it gives the audience                                                                  |
| --------------- | ------------------------------------------------------------------------------------------- |
| cover           | the whole watch, from the dial side, with the three hands (`out/cover.png`)                 |
| Hairspring      | a spring that swings back and forth                                                         |
| Balance Wheel   | mass makes the swing slow and steady                                                        |
| Escapement      | the balance lets the wheel advance one step at each swing; "tick" and "tock" at each strike |
| **new slide**   | how often each hand turns                                                                   |
| Gears           | twice the size, half the speed; click 6: "One turn a minute / The second hand!"             |
| Gear Train      | subtitle "From once a minute to once an hour"; click 4: "The minute hand!"                  |
| Hour Hand       | subtitle "From once an hour to twice a day"; click 6: "The hour hand!"                      |

The three slides after the new slide each end on a hand, and their
subtitles assume that the audience knows each hand's period. That is
probably where the confusion starts: "the **second** hand turns once a
**minute**" puts two units in one phrase. A hand is named for what it
counts, not for how long one turn takes.

Facts from the model that the designs use:

- **The watch beats once a second** (`design.timing.period` = 2 s, a tick
  and a tock). So the seconds hand steps $360° / 60 = 6°$ once a second:
  60 steps a turn. The Gears slide's notes say so too ("This watch ticks
  once a second").
- **The seconds hand is a small seconds hand, off centre**, on the fourth
  wheel's arbor, 95 world px from the centre. It is 60 world px long. The
  minute hand is 206 and the hour hand 140 (`dialSolids` in
  `watch/generate.ts`).
- **The seconds hand has no marks of its own.** The chapter ring's 60 marks
  (12 hour marks and 48 minute ticks, no numerals) are round the centre,
  for the minute hand.
- **Size on the screen** (example values, `out/`): on the cover the scale
  is about 1, so the seconds hand is about 60 px long. One step moves its tip
  $2\pi \times 60 / 60 \approx 6.3$ px. On the Gears slide at click 6 the
  scale is about 4.2: the hand is about 250 px long, and a step moves its tip
  about 26 px. The resolution floor is 1.64 px
  ([legibility.md](../../../docs/legibility.md#the-two-floors)), so both
  steps can be seen, but 6 px is a small movement for a back row.
- **The big hands cross the seconds hand's circle.** Seen from the centre,
  that circle spans $2 \arcsin(60/95) \approx 78°$. So each big hand lies
  across it about 22% of the time, and at least one of them about 39% of the
  time (taken as independent). Where the hands are depends on how long the
  talk has run.

## Which case to explain

| Case        | Moves at 1×                     | Marks of its own on this watch | Familiar?                                     | Its slide                |
| ----------- | ------------------------------- | ------------------------------ | --------------------------------------------- | ------------------------ |
| second hand | a 6° step each second           | none (a small seconds hand)    | everyone has watched one go round             | Gears, the next slide    |
| minute hand | 0.1° a second: still to the eye | the chapter ring's 60          | read, but rarely watched                      | Gear Train               |
| hour hand   | 0.008° a second                 | the 12 hour marks              | yes, but 12, not 60: the odd one of the three | Hour Hand                |

**The second hand.** The audience can see it move, and it moves at the
Escapement slide's beat: one tick, one step, one second. Sixty of them make
one turn, and sixty seconds make a minute. The minute hand follows with the
same 60. The hour hand is the one that differs (12, not 60), so it must be
stated with its 12, not explained.

## The words, for every design

- **Use the word "counts"** in the spoken line: "It is named for what it
  counts, not for how long it takes to go round." This is the step that
  confused people.
- **The hour hand: "12 hours" on this slide**, not "twice a day". "12" shows
  the count (12 marks), as "60" does for the other two. The Hour Hand slide's
  "twice a day" then restates it.
- **Optional, with any design: ask the audience first.** "How long does the
  second hand take to go round?" The answer comes from them, so they do the
  thinking that the user's test audience had to do on their own. It costs
  about 5 to 10 s, and a quiet room can leave it hanging. It is a spoken line,
  so it can be tried in a rehearsal and dropped with no change to the slide.

Draft text in the slide's column (left 560 px, 35 px, 600, as on the Gears
slide; about 24 characters fit on a line):

```text
Second hand:
a tick a second            <- click 1
60 ticks a turn:
once a minute              <- click 2
Minute hand    1 hour      <- click 3
Hour hand     12 hours     <- click 4
```

Six lines and three gaps: $6 \times 43.75 + 3 \times 24.5 \approx 336$ px,
from 165 to about 501 px, inside the 552 px slide. Each click that adds text
dims the text before it ([Text dims](../../docs/slide-patterns.md#text-dims)).
A possible title and subtitle: "Three Hands", "Named for what they count".

## Designs

The canvas is 980 × 552 px. Each sketch is a rough layout, not to scale.

### 1. Sixty ticks: the live watch, dial side, real time

```text
┌────────────────────────────────────────────────┐
│                  Three Hands                   │
│            Named for what they count           │
│     .-''''''-.                                 │
│   /     ✶     \       Second hand:             │
│  |  ────●      |      a tick a second          │
│  |       \     |      60 ticks a turn:         │
│   \           /       once a minute            │
│     '-......-'        Minute hand    1 hour    │
│                       Hour hand     12 hours   │
└────────────────────────────────────────────────┘
```

The whole watch, as on the cover, in a fitted view of the case on the left,
tilt 0. The mechanism runs at real time. The text is on the right.

| Click | Watch                                                                                    | Text                                |
| ----- | ---------------------------------------------------------------------------------------- | ----------------------------------- |
| 0     | the escapement stays while the camera untilts and zooms out; then the rest fades in      | title, subtitle                     |
| 1     | the seconds hand flashes, then ticks on                                                  | "Second hand: a tick a second"      |
| 2     | —                                                                                        | "60 ticks a turn: once a minute"    |
| 3     | the minute hand flashes                                                                  | "Minute hand 1 hour"                |
| 4     | the hour hand flashes                                                                    | "Hour hand 12 hours"                |

The frontmatter uses keys that exist now:

```yaml
watch: all
watchView: [case band]
class: hands
watchClicks:
  1: { watchFlash: [seconds hand] }
  3: { watchFlash: [minute hand] }
  4: { watchFlash: [hour hand] }
clicks: 4
```

- **Pros**
  - No new code, art or key: only `slides.md` and the docs.
  - The step from the Escapement slide is the default one, as on the Gear
    Train slide's click 1: the escapement stays while the camera zooms out,
    so the audience sees where it sits in the watch. The step to the Gears
    slide is its jump (`watchMoveWith: none`), as now.
  - "A tick a second" joins the Escapement slide's tick to the hand.
  - The flash says which hand each line means. The deck uses flashes in the
    same way on the Gears and Gear Train slides.
  - It follows the slide patterns: the picture on the left, the text on the
    right, one line a click, and the older text dims.
- **Cons**
  - The seconds hand is small: in the case's fitted view (scale 0.80,
    `tools/views.ts`) it is about 48 px long, and a step moves its tip about
    5 px. The words carry the case, not the picture. See "Design 1, zoomed
    in" below for the fix.
  - The audience does not see a whole turn: it takes 60 s. They must accept
    "60 ticks a turn" from the words. This is a fact that they know, so it is
    not much to ask.
  - About 39% of the time, a big hand lies across the seconds hand's circle.
  - The Gears slide's comment says that the audience has not seen the gears'
    place in the watch. After this slide they have seen the whole watch,
    but nobody pointed at the fourth wheel, so the jump still works. The
    comment and `docs/watch.md` would need a new reason.
- **Time:** 4 clicks, about 30 to 35 s.
- **Cost, estimated:** 100 to 130 lines: the slide (frontmatter, text,
  style, notes), a section in `docs/watch.md`, a paragraph in
  `docs/slide-patterns.md`.

### 2. A track for the small seconds hand: close in, then zoom out

```text
 click 1–2                                   click 3–4
┌──────────────────────────┐          ┌──────────────────────────┐
│        Three Hands       │          │        Three Hands       │
│   ' ' ' ' '              │          │   .-''''-.               │
│ '     /     '  Second    │   --->   │  /   ●──  \   Minute  1 h│
│ '    ●      '  hand: ... │          │  \        /   Hour   12 h│
│   ' ' ' ' '              │          │   '-....-'               │
└──────────────────────────┘          └──────────────────────────┘
```

As design 1, but at clicks 1 and 2 the camera is close on the seconds hand,
and a new ring of 60 marks shows round it, as on a real small seconds dial.
The rest of the watch is dimmed (`watchDim`). At click 3 the dim ends, the
track goes, and the camera zooms out to the whole watch for the other two
hands.

- **Pros**
  - The explained case is seen, not only said: 60 marks, and one step a
    second from mark to mark. At a scale of about 3.5 to 4.2, a step moves the
    tip about 22 to 26 px, and the marks are about 26 px apart.
  - The track can also show on the Gears slide at click 6, which says "One
    turn a minute".
  - No big hand is in the way: the camera is in close, and the rest is
    dimmed.
- **Cons**
  - A new piece: a ring of 60 marks round the fourth arbor, at the dial's
    height, over the train. This watch has no dial, so the ring floats over
    the gears. The cover and the other slides must not show it (as the
    Gears slide's spans, which are not in `all`).
  - Two camera moves on a slide that should be quick.
  - On the step to the Gears slide, the jump goes from a close view of the
    same arbor that the Gears slide shows. Its reason ("the audience has not
    seen these pieces") is no longer true, and a jump between two views of one
    part could look like an error. The step may need a camera move instead.
- **Time:** 4 clicks, about 35 to 40 s.
- **Cost, estimated:** 200 to 250 lines: as design 1, plus the piece in
  `watch/generate.ts`, its tests, and a row in the pieces table.

### 3. A time-lapse that carries: one turn of the second hand, one mark of the minute hand

As design 1 at clicks 1 and 2, at real time. At click 3 the watch speeds up
to 60× (`watchLapse: 60`, with the time scale, `watchTimeScale: true`). The
seconds hand now turns once a second, and the minute hand moves on one mark
at each turn: about 22 px a second at its tip. The text says "Minute hand:
counts the turns". Click 4 states the hour hand.

- **Pros**
  - It shows the link between the hands: each turn of one is one mark of
    the next. This is the train that the next three slides build.
  - It uses keys that exist now.
- **Cons**
  - **It adds a new confusion:** at 60× "the second hand turns once a
    second". That is the clash of units that the slide is there to remove.
  - It spends the time-lapse before the Mainspring slide, whose "6 hours in
    6 seconds" is a reveal, and before the Recap slide, which uses it on
    every stop.
  - It goes past the request: the other cases are shown, not stated.
  - Not checked: a change of speed-up eases while the camera moves. How it
    eases at a click with no camera move needs a test.
- **Time:** 4 clicks, about 40 to 45 s.
- **Cost, estimated:** 120 to 160 lines, and a check of the ease.

### 4. A table of units, with no watch

```text
┌────────────────────────────────────────────────┐
│                  Three Hands                   │
│            Named for what they count           │
│                                                │
│   Second hand   60 seconds   once a minute     │
│   Minute hand   60 minutes   once an hour      │
│   Hour hand     12 hours     once in 12 hours  │
└────────────────────────────────────────────────┘
```

Text only. The first row is built in steps: the hand, "60 seconds", "once a
minute". Rows 2 and 3 come together at the last click.

- **Pros**
  - The simplest slide: HTML and CSS only.
  - The pattern is plain to see: each row is the row above, one unit up.
    The "60" and "12" are the ratios of the Gear Train and the Hour Hand
    slides, so it is also a map of the next three slides.
  - It is the shortest slide.
- **Cons**
  - No picture: it breaks "the main focus of a slide is on its left", and
    the audience must imagine the hands.
  - A table is for reading, not for listening (`stem/AGENTS.md`, "Writing a
    talk").
  - The watch fades out after the Escapement slide, and back in on the
    Gears slide: two fades in about 25 s, between two watch slides.
- **Time:** 3 clicks, about 20 to 25 s.
- **Cost, estimated:** 70 to 100 lines.

### 5. A drawn dial with a centre seconds hand

A new SVG: a large plain dial with 60 marks and a centre seconds hand that
steps once a second (a CSS animation). It is on the left, as large as the
picture band. The text and clicks are as in design 1. The speaker counts
the first few steps aloud.

- **Pros**
  - The clearest picture of the explained case: a centre hand that steps
    round 60 marks, as on most watches in the room. At a dial of about 400 px,
    a 180 px hand moves its tip about 19 px a step.
  - It does not depend on where the live watch's hands are.
- **Cons**
  - A second watch, unlike the live one: a centre seconds hand here, a
    small seconds hand on the Gears slide one slide later. The deck's story
    is one watch, built up part by part.
  - New art must pass `artcheck`, `barroom` and `motion`, and a step loop
    must follow the navigation rules (a steady loop).
  - The live watch must fade out and back in, as in design 4.
  - The most work.
- **Time:** 4 clicks, about 30 to 35 s.
- **Cost, estimated:** 250 to 350 lines, and some rounds of art review.

### Design 1, zoomed in on the seconds hand (follow-up, 2026-10-13)

The user asked: for design 1, zoom in on the fourth wheel, enough to see all
of the second hand at any of its 60 poses. Show only the fourth wheel
(without its pinion), or only the hand. The zoom is for clicks 1 and 2
("Second hand: a tick a second", "60 ticks a turn: once a minute").

**The view is `watchView: [seconds hand]`.** A turning piece's extent is its
whole circle ([Fitted views](../../docs/watch.md#fitted-views)), here 120 ×
120 world px. So the fitted view holds every pose of the hand, and no new
key is needed. From `tools/views.ts` (the deck's own `fittedView`; example
values):

| View                                  | Scale | Hand, px | Step at the tip, px | Hand's arbor on the slide, px | Circle's right edge, px |
| ------------------------------------- | ----: | -------: | ------------------: | ----------------------------- | ----------------------: |
| `[seconds hand]`, tilt 0              |  3.33 |      200 |                20.9 | 294, 338                      |                     494 |
| `[seconds hand]`, tilt 20             |  3.51 |      211 |                22.1 | 294, 338                      |                     505 |
| `[case band]`, tilt 0 (design 1)      |  0.80 |       48 |                 5.0 | 350, 286                      |                       — |
| the Gears slide's view, tilt 20       |  4.31 |      259 |                27.1 | 301, 383                      |                       — |

The text's column starts at 560 px, so the gap is 55 to 66 px. With
`watchRight: 489`, the Gears slide's value, the gap is the Gears slide's
70 px.

**What shows in the zoom.** Stills from the explorer, at the view above
(`tools/zoom-stills.ts`; the explorer's frame is the slide at 1.28 times):

1. **The fourth wheel, its arbor and the hand** (`out/zoom-fourth-wheel-and-hand-tilt-20.png`,
   and `…-hand.png` at tilt 0). Recommended, at tilt 20.
   - Clean: the brown hand over the blue wheel, and nothing else.
   - The wheel turns with the hand, one 6° step a second. It shows that
     the hand is on a gear. The Gears slide's first picture is this wheel
     and the small gear that drives it.
   - At tilt 20 the arbor shows as a post that holds the hand, as on the
     Gears slide (tilt 20). At tilt 0 the hand looks laid flat on the wheel.
   - The wheel is inside the hand's circle (its teeth reach 36 world px;
     the hand, 60), so the view is the same with or without it.
2. **The hand alone** (`out/zoom-hand-alone.png`).
   - The purest focus: only the thing that the words name.
   - But nothing shows what turns it, and there is nothing to measure a
     step against. A lone dagger in space may read as an arrow before it
     reads as a watch hand.
3. **The whole watch** (`out/zoom-seconds-all.png`), for comparison.
   - Busy: the escape wheel, the fork, the third and centre wheels, and the
     chapter ring's arc behind the text's column (the text would need the
     paper's outline, as on the Gear Train slide).
   - The minute and hour hands' arbor is just off the slide's bottom-left
     corner (62, 554 px). One of them sweeps into the picture 37 to 44% of
     the time, as a bar more than 450 px long.

**The steps in and out of the zoom.**

- **From the Escapement slide:** the zoom's pieces are not in the
  Escapement slide's picture. So by the default rule the escapement fades
  out, the camera jumps, and the wheel and the hand fade in, as the Gears
  slide does now.
- **The mechanism runs:** no `watchSpin` and no `watchAtRest`, so the
  wheel and the hand step once a second, although the balance is not
  shown. To check when it is built.

**Clicks 3 and 4: two ways.**

- **A. Zoom out at click 3** (what the user described). The camera zooms
  out to the whole watch (`watchView: [case band]`). The wheel and the hand
  stay while it moves (the default rule), and then the rest fades in. The
  minute hand flashes after the move (`watchFlashAfterMove: true`), and at
  click 4 the hour hand flashes. The step to the Gears slide is its jump,
  as now, so the Gears slide does not change. Recommended.
- **B. Stay in, and state the minute and hour hands in words only.** One
  camera move less, and a quicker slide; everyone knows what a minute hand
  is. But the step to the Gears slide is then a jump between two views of
  the same wheel: it fades out and fades back in, 30% larger and 45 px
  lower, which may look like a stutter. The fix is to take
  `watchMoveWith: none` off the Gears slide: the wheel and its arbor then
  stay while the camera zooms in, the hand goes first, and the small gear
  fades in. At click 6 the same hand comes back onto the same wheel. That
  changes an existing slide (its frontmatter, its comment and
  `docs/watch.md`, "The Gears slide"), and how the free spin starts when the
  wheel stays must be checked.

The frontmatter for A, with keys that exist now:

```yaml
watch: &zoom [fourth wheel, fourth arbor, seconds hand]
watchView: [seconds hand]
watchRight: 489
watchTilt: 20
class: hands
watchClicks:
  1: { watchFlash: [seconds hand] }
  3:
    watch: all
    watchView: [case band]
    watchTilt: 0
    watchFlash: [minute hand]
    watchFlashAfterMove: true
  4: { watchFlash: [hour hand] }
clicks: 4
```

Cost: as design 1 (100 to 130 lines). Time: about 35 s, with the zoom out.

### Design 1, the hand alone and a table (follow-up 2, 2026-10-13)

The user's next step:

- No zoom out to the minute and hour hands. The hand alone floats in space.
  It looks like any hand (all the deck's hands look alike), but it moves in
  6° ticks, once a second.
- After "Second hand: a tick a second" and "60 ticks a turn: once a
  minute", a table: two columns, "Hand" and "A full turn", a title row and
  three rows.
- The text can use more than the right 40%: one slowly turning hand does
  not need 60% of the slide.

```text
┌────────────────────────────────────────────────────────────┐
│                        Three Hands                         │
│                  Named for what they count                 │
│          /                                                 │
│         /           Second hand: a tick a second           │
│        /            60 ticks a turn: once a minute         │
│       ●                                                    │
│                     Hand      A full turn                  │
│                     Second    1 minute                     │
│                     Minute    1 hour                       │
│                     Hour      12 hours                     │
└────────────────────────────────────────────────────────────┘
  16 ── the hand's circle, 399 ── 415    482 ── the text ── 964
```

**The hand.** `watch: [seconds hand]`, `watchView: [seconds hand]`, tilt 0.
The fitted view fills the picture band's height (399 px) with the hand's
circle: scale 3.33, the hand 200 px long, and a step of 21 px at its tip
(`tools/views.ts`). A fitted view always fills the band, so the circle
cannot be smaller with the keys that exist now. To free room on the right,
move the circle to the left edge: `watchRight: 415` puts it from `FIT_LEFT`
(16 px) to 415 px.

**The text's room.** From 415 + 67 = 482 px to 964 px (the same 16 px
margin as on the left): 482 px. The widths, measured in the sentence's type
(35 px, 600; `tools/text-widths.ts`):

| Line                             | Width, px |
| -------------------------------- | --------: |
| "Second hand: a tick a second"   |       472 |
| "60 ticks a turn: once a minute" |       482 |
| "60 ticks: once a minute"        |       377 |
| "A full turn" (the widest cell)  |       162 |
| "Second" (the widest name)       |       121 |

- **Each paragraph fits on one line, just.** The longer line needs the full
  482 px, so the gap to the hand's circle is 67 px, not the Gears slide's
  70. The circle's edge is where the tip reaches at 3 o'clock only, so the
  hand comes that near the text once a minute. If that is too tight,
  "60 ticks: once a minute" (377 px) leaves 105 px.
- **The table is narrow:** 121 + a 48 px gap + 162 = 331 px.
- **The height fits:** from 165 px, two lines, two 24.5 px gaps and four
  rows of 43.75 px end at 477 px, 75 px above the slide's bottom. A row
  height of 1.4 (49 px) ends at 498 px.

**The clicks.**

| Click | Text                                             | The hand        |
| ----- | ------------------------------------------------ | --------------- |
| 0     | title and subtitle                               | ticks on, alone |
| 1     | "Second hand: a tick a second"                   |                 |
| 2     | "60 ticks a turn: once a minute"; line 1 dims    |                 |
| 3     | the table, all rows; lines 1 and 2 dim           |                 |

- **The whole table at one click** (recommended). Its first row restates
  what the audience has just worked out. The eye then runs down the second
  column: 1 minute, 1 hour, 12 hours. The speaker reads the two new rows.
  A row a click (clicks 3 to 5) follows the deck's "one line a click", but
  costs two more clicks on a slide that should be quick.
- **The title row** could be in the subtitle's type (22 px, muted), so that
  it reads as the labels of the columns, not as content.
- **"12" is the odd number out**, and the table shows it without a word:
  the right column's numbers are 1, 1, 12. Numbers, not "a minute", "an
  hour", so that this shows.

**The steps in and out.** The hand is in neither the Escapement slide's
picture nor the Gears slide's first picture. So both steps jump: the old
picture fades out, and the new one fades in. The Gears slide does not
change. At its click 6 the same hand comes back, on its wheel: "One turn a
minute / The second hand!"

The frontmatter, with keys that exist now:

```yaml
watch: [seconds hand]
watchView: [seconds hand]
# the hand's circle from FIT_LEFT (16 px) to 415 px: the text's column
# starts 67 px to its right, at 482 px
watchRight: 415
class: hands
clicks: 3
```

- **Pros:** the fewest moving parts: one piece, one camera, no zoom, no
  flash, no change to another slide. The step is 4 times design 1's first
  layout (21 px, not 5 px). The table states the other two hands in one
  look.
- **Cons:** the hand has nothing to show what it is, other than its shape
  and its tick. To check when it is built: the hand still ticks when the
  balance is not shown (it should: the mechanism runs unless a slide says
  `watchSpin` or `watchAtRest`).
- **Time:** 3 clicks, about 25 s.
- **Cost, estimated:** 80 to 110 lines: the slide, a section in
  `docs/watch.md`, a paragraph in `docs/slide-patterns.md`.

## Decision (2026-10-13)

The user chose design 1 in the shape of "the hand alone and a table", and
then:

- **The cap on the arbor**, so that the hand reads as pinned there, and less
  as an arrow. The hand's cap was already drawn (a disc of radius 2.5 world
  px, `dialSolids`). At tilt 0 the fourth arbor is hidden exactly under it
  (`out/zoom-hand-arbor-pivot.png` is the same as
  `out/zoom-hand-alone-pivot.png`). At tilt 20 the arbor shows as a post under
  the cap (`out/zoom-hand-arbor-tilt-20-pivot.png`); the hand alone at tilt 20
  shows none. So the slide is at tilt 20, with the arbor, as on the Gears
  slide.
- **The rows say "Second Hand", "Minute Hand", "Hour Hand"**: redundant, but
  better for people who skim.
- **The right column: "Once a minute" or "Every minute"?** Measured
  (`tools/text-widths.ts`): "Once a minute" 235 px, "Every minute" 215,
  "Once in 12 hours" 273, "Every 12 hours" 243, "Twice a day" 190, "Second
  Hand" 216. The room is about 483 px. Chosen: "Once a minute", "Once an
  hour", "Twice a day".
  - "Once" says one full turn, as the column's title and the line above
    ("once a minute") do, and as the Gears and Gear Train slides do. "Every
    minute" can read as "it moves every minute", which is true of the minute
    hand's ticks and so is ambiguous.
  - "Once in 12 hours" makes the table 521 px wide. "Twice a day" fits, and
    it is the Hour Hand slide's own word ("From once an hour to twice a
    day"). "Twice" is the odd one out, as "12" was.
- **At tilt 20 the circle is 421.6 px wide** (scale 3.51), not 399. So the
  text's left is 44 px from the circle's edge, not 67: the line and the
  table need the room. Only the tip reaches that edge, at 3 o'clock.
- **The accent (asked during the build): on the column titles, or on the
  answers?** The user asked about the accent for the column titles, as
  the slide had little colour. Compared (`out/variant-accent-titles.png`,
  `out/variant-accent-answers.png`): the theme gives the accent to "the one
  emphasised thing on a slide" (`stem/docs/theme.md`, "The roles"), and the
  muted role to labels. The titles in the accent draw the eye to "Hand" and
  "A full turn", which carry no news. Chosen: the answers, "how long a full
  turn takes", in the accent: the table's second column, and "once a minute"
  in the line above, which dims with its line. The titles stay muted.

## What was built

- The Three Hands slide in `slides.md`, between the Escapement and the Gears
  slides: `watch: [seconds hand, fourth arbor]`, `watchView: [seconds
  hand]`, `watchRight: 438`, `watchTilt: 20`, 3 clicks. No new key or code.
- The Gears slide's comment and first note now name the slide before it.
- `watch/train.test.ts`: the Gears slide's spin test starts from the Three
  Hands slide's last click, the slide before it.
- `docs/watch.md` ("The Three Hands slide", "The Gears slide") and
  `docs/slide-patterns.md`.
- Checked in a build (`tools/ticks.ts`): the hand ticks with the balance
  not shown; 5,027 px of the picture differ in two stills 1 s apart.

## The slides after it (2026-10-13)

The user asked: should the Gears slide say "Turns once a minute"? Any other
changes for that slide? The user's choices, from the options:

- **"Turns once a minute."** (329 px; "One turn a minute" was 293). It uses
  the table's "once", as the Gear Train slide's "Makes a full turn once an
  hour." does, with its full stop.
- **The camera keeps the gears' zoom at click 6.** Measured (example values,
  this task's scratch script, the same method as `tools/views.ts`): in the
  gears' view (scale 4.31), the hand's tip goes off the slide's bottom for
  25.5% of each minute, and comes within 6 px of the text's column for
  17.6%. A view that also fits the hand (scale 3.51) gives 0% and 0%. The
  user kept the zoom.
- **A full turn's time is the accent, from the Three Hands slide to the
  Hour Hand slide**: "once a minute" (Gears), "once an hour" (Gear Train),
  "Twice a day" (Hour Hand), as in the table. None of these slides used the
  accent before, so each still has one. One class, `turn-time` in
  `style.css`, for all four slides.
- **The speaker notes** of the Gears slide's click 6, and the openings of the
  Gear Train and Hour Hand slides, point back to the table.

## Ranking

| Rank | Design                      | Clicks | Time, s | Lines, est. | New ideas for the audience | Seconds hand's step on the screen | Follows the slide patterns     |
| ---: | --------------------------- | -----: | ------: | ----------: | -------------------------- | --------------------------------- | ------------------------------ |
|    1 | 1. Sixty ticks              |      4 |   30–35 |     100–130 | none                       | about 5 px (21 px zoomed in)      | yes                            |
|    2 | 2. A small seconds track    |      4 |   35–40 |     200–250 | none                       | about 22–26 px                    | yes                            |
|    3 | 4. A table of units         |      3 |   20–25 |      70–100 | none                       | no hand                           | no: no picture                 |
|    4 | 3. A time-lapse that carries |     4 |   40–45 |     120–160 | the time-lapse, early      | a spin                            | yes                            |
|    5 | 5. A drawn dial             |      4 |   30–35 |     250–350 | a second, different watch  | about 19 px                       | the picture yes; one watch, no |

**Why this order.**

1. **Sixty ticks** does what the request asks with the least: the words
   carry the case, the flashes say which hand, and the slide needs no new
   code. The confusion is in the words ("second" and "minute" in one
   phrase), so words that say "counts" are the fix. The picture only has to
   say which hand.
2. **A small seconds track** is the better picture of the case, about 4
   times as large, with marks to count. It costs about twice as much, it
   adds a piece that the watch does not have, and it makes the step to the
   Gears slide harder. Try it if a rehearsal shows that design 1's words
   are not enough.
3. **A table of units** is the cheapest and the clearest to read, but it is
   a slide to read, not to watch, and the watch blinks out between two watch
   slides.
4. **A time-lapse** shows the most, but it brings back the clash of units
   ("turns once a second") that the slide is for, and it spends the
   Mainspring slide's reveal.
5. **A drawn dial** costs the most, and it shows a second watch that is
   not the one the talk builds.

## Open questions for the user

- Which design? The words in "The words, for every design" are a draft.
- Ask the audience first, or not?
- (Answered in "The slides after it".) After this slide, the Gears slide's click 6 ("One turn a minute / The
  second hand!") says again what this slide said. It could stay as a payoff
  ("the gears make the hand that we need"), or change. That is a change to
  an existing slide, so it is not in this task's scope yet.

## Evidence

`out/` is not in git (`tasks/*/out/` in `.gitignore`). To make it again, run
from `watches/`:

```bash
node tasks/2026-10-13-hand-periods/tools/stills.ts [DIST] [OUT]
```

DIST is a `pnpm build` output (default `dist/`). The stills here come from a
build of 2026-10-12, before commit 905e039. These slides changed after it
only by the arbor seam lines. The tool finds each slide by its title.

- `out/cover.png`: the cover; the seconds hand is about 60 px long, at the
  top right of the movement.
- `out/escapement-click-4.png`: where the new slide starts from.
- `out/gears-click-0.png`, `out/gears-click-6.png`: where it goes to; at
  click 6 the seconds hand is about 250 px long.
- `out/gear-train-click-4.png`, `out/hour-hand-click-6.png`: the minute
  and hour hands' slides.

For "Design 1, zoomed in":

```bash
node tasks/2026-10-13-hand-periods/tools/views.ts [--json]
node tasks/2026-10-13-hand-periods/tools/zoom-stills.ts [OUT]
```

- `tools/views.ts`: each candidate view's scale, the seconds hand's size
  and step, where the arbors are, and how much of the time the big hands
  show on the slide.
- `tools/zoom-stills.ts` serves the explorer and opens it at the fitted view
  of the seconds hand. It makes `out/zoom-*.png`: the whole watch, the
  watch without the big hands, the fourth wheel and the hand (tilt 0 and
  20), and the hand alone. The explorer cannot dim without a deck pose, so
  no still shows a dim.

For "Design 1, the hand alone and a table":

```bash
node tasks/2026-10-13-hand-periods/tools/text-widths.ts [DIST] [--json]
```

- `tools/text-widths.ts` measures each candidate line in the sentence's
  type, on the Gears slide of a build.

For the build:

```bash
pnpm build --out tasks/2026-10-13-hand-periods/out/dist
node tasks/2026-10-13-hand-periods/tools/stills.ts tasks/2026-10-13-hand-periods/out/dist
node tasks/2026-10-13-hand-periods/tools/ticks.ts tasks/2026-10-13-hand-periods/out/dist
```

- `out/three-hands-click-0.png` to `-3.png`: the slide at each click.
- `out/variant-accent-titles.png`, `out/variant-accent-answers.png`: click 3
  with the accent on the column titles, and on the answers.
- `tools/ticks.ts`: two stills of the slide 1 s apart (`out/ticks-0.png`,
  `out/ticks-1.png`), and the number of pixels that differ.
