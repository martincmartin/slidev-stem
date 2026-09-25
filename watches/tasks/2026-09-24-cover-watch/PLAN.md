# Plan: a skeleton watch as the cover slide's background

**Request (user, 2026-09-24).** "Create a background SVG for the cover slide,
using the same colors as sundial.svg, of a skeleton watch in our current
illustration style, 'line weighted'."

**Paths.** `stem/…` is the repo root. `./` is this task directory.

## What is fixed

- **Colours.** `sundial.svg` uses all four art colours: `#143C6B`, `#736A60`,
  `#2A2520` and `#D3DCE3`. The drawing uses these four and no others. Each
  colour keeps the job that `stem/docs/illustrations.md` gives it.
- **Style.** The stroke ladder (2, 2.5, 3 and 4 CSS px), the 3:1 floor for
  marks that carry the drawing, and "static values match frame 0".
- **Size.** A background fills the slide, so the file states the canvas:
  `width="980" height="552" viewBox="0 0 980 552"`. One unit is one CSS px.
- **The cover layout.** The theme has no cover layout of its own. Slidev's
  built-in `cover.vue` is only `<div class="slidev-layout cover"><slot/></div>`,
  so it ignores the `background:` frontmatter. The slide must place the drawing
  itself.

## Data: the space the title needs

Measured in the dev server (Fraunces 600, 56 px, the theme's cover `h1`):

| title text, one line                         | width    |
| -------------------------------------------- | -------- |
| What Every Nerd Should Know About Watches    | 1261 px  |
| What Every Nerd                              | 464 px   |
| Should Know                                  | 363 px   |
| About Watches                                | 410 px   |

Today the title is two centred lines, 871 px wide, from x = 53 to x = 924.
It uses almost all of the 980 px canvas. The layout padding is 56 px.

## Decision 1: composition

| option                                                           | title contrast | watch at the back row (7 m)       | whole movement visible | change to the slide                  |
| ---------------------------------------------------------------- | -------------- | --------------------------------- | ---------------------- | ------------------------------------ |
| **B.** Watch centred behind the centred title, faded (watermark) | drops where lines cross it | gone: it must stay near 1.2:1 to keep the title clean | yes | none |
| **C.** Watch on the right; title left-aligned in three lines     | unchanged (no overlap) | line work at full strength, 9.6:1 | yes (the case edge and crown are cropped) | left-align the cover; three-line title |
| **G.** Watch rises from the bottom edge; title centred above it  | unchanged (no overlap) | full strength                     | no: about 45 % of the dial | move the title to the top |

- **B** breaks the house rule for the art. `illustrations.md` says that a wash
  cannot hold 3:1 and that "the drawing must read with every wash removed". A
  watermark is a wash and nothing else. It also puts line work behind every
  letter of the title.
- **G** keeps the centred cover, but it hides the lower half of the movement.
  The balance wheel and escapement usually sit there, and they are the
  subject of the talk (the escapement and the hairspring).
- **C** keeps every mark at its house strength and puts nothing behind the
  title. Its cost is a left-aligned cover and a three-line title. The widest
  line is 464 px, so the title ends at x = 520 and the watch can start at
  x = 548.

**Ranking.** 1. C, 2. G, 3. B. **Chosen: C.** Only C shows the whole
movement at full strength with a clean title.

The SVG is still a background: it fills the canvas, and the title sits on top
of it. The drawing leaves the left half empty.

## Decision 2: what moves

The style has "one loop per subject". The subject of the talk is the
escapement: it turns a continuous force into ticks.

| option                                                  | shows the talk's idea | cost                                     |
| ------------------------------------------------------- | --------------------- | ---------------------------------------- |
| **M0.** Static                                          | no                    | none                                     |
| **M1.** The escapement: balance, hairspring, pallet fork, escape wheel, fourth wheel | yes | five animations; they must stay in sync |
| **M2.** M1 and the whole train, the hands and the barrel | yes                   | the centre wheel turns once an hour, so its motion is invisible |

**Chosen: M1.** It is slow motion of a real watch, at one beat per second:

- the balance swings ±150° with a period of 2 s (a real one: 0.3–0.4 s);
- the hairspring winds and unwinds with it;
- at each pass of the balance through centre, the fork flips and the escape
  wheel advances half a tooth;
- the fourth wheel turns 6° per tick, one turn a minute, as a real seconds
  wheel does, and carries a seconds hand (user, 2026-09-24);
- the third wheel turns at 1/7.5 of the fourth wheel's rate (0.8° per tick) and
  the centre wheel at 1/8 of the third wheel's rate (0.1° per tick), the ratios of a
  real watch (user, 2026-09-24). So the centre wheel and the minute hand on
  its arbor turn once an hour, and the hour hand (12:1) once in 12 hours;
- only the barrel stays still.

These slow parts use one period of keyframes with `accumulate="sum"`, so each
repeat starts where the last one ended. A full-turn keyframe list would need
3600 ticks for the centre wheel. `accumulate` was tested in Chromium and
Firefox, and both gave the same angles (108° at 20.9 s for 10° per 2 s).

The escape wheel turns anticlockwise (its teeth lead that way), so the fourth
wheel, which meshes with its pinion, turns clockwise, as a seconds hand must.

The loop lengths are 2 s, 6 s (the escape wheel: 72°, one symmetry of 15 teeth
and 5 spokes) and 60 s (the fourth wheel and its seconds hand: one turn).

**`tools/motion.py` needs `--sep 1` for this drawing.** By default it samples
half the longest loop apart: 30 s, which is 15 whole balance periods, so the
balance, the fork and the escape wheel land at the same phase and cancel. At
1 s (half a period) they are at opposite ends of their motion.

## Decision 3: which colour does which job

From the jobs in `illustrations.md`:

| colour                 | job in the sundial        | job in the watch                                                   |
| ---------------------- | ------------------------- | ------------------------------------------------------------------ |
| `#143C6B`              | the dial, the gnomon edge | the movement: wheels, balance, hairspring, mainspring, fork, hands |
| `#736A60`              | the plate's wall          | the case, lugs, strap and crown; the faces of the three hands      |
| `#2A2520` at 0.5       | the hour ticks            | the minute ticks                                                   |
| `#D3DCE3`              | the gnomon's lit face     | lit metal faces: the chapter ring, the wheels, the balance, the fork |
| `#736A60` wash, 0.18   | the plate wall            | the case band, the lugs and the strap                              |

**User changes (2026-09-24).**

- No pure supports: the plate rim, bridges, balance cock, pallet bridge,
  jewels and screws were drawn and then removed. The case and the chapter
  ring stay. Each arbor shows a small pivot circle instead of a jewel.
- The hands are daggers with a `#736A60` face and a `#143C6B` outline. The
  user first asked for `--palette-second` (`#9A6238`), then chose the
  sundial's frame colour. It keeps the drawing to the four art colours, so
  `artcheck.py` passes.

In a skeleton watch the wheels overlap in plan view: each wheel's teeth reach
the pinion at the centre of the next. `illustrations.md` warns that a
translucent mark does not hide what is behind it, and the openings in a wheel
hide nothing either. So each lower wheel is clipped by the root circle of the
wheel above it (the inside edge of its teeth; the user asked for the gaps
between teeth to stay open, 2026-09-24) (the `skeleton-watch-under-*` clip paths). Without the clip,
the fourth wheel's teeth showed through and around the escape wheel, and the
escapement read as a tangle.

## How the drawing is made

A script writes the SVG. Gear teeth, spirals and the animation keyframes are
computed, so the drawing is generated, not hand-written.

**Moved (user, 2026-09-24):** the script was `./gen_watch.py`, writing into
`./out/`. It is now `stem/watches/art/skeleton-watch.py` and writes the deck's
SVG directly, because anyone who changes the drawing changes the script, not
the SVG. `./out/skeleton-watch.svg` is the last output of `gen_watch.py`
before the move.

## Checks

In `stem/`: `tools/artcheck.py`, `tools/contact.py`, `tools/barroom.py` and
`tools/motion.py` on the new file. Then a screenshot of the cover in the dev
server, and `pnpm build`.

## Measurements (2026-09-24, the shipped drawing)

In `stem/`, at `TV 55in @7m`:

```
python3 tools/artcheck.py      ok (notes: the 0.18 washes and the 0.5 minute ticks)
tools/barroom.py               ink 6.2%  hold 3.65  p90 7.00  Fmax 0.080
tools/motion.py --sep 1        dPeak 9.11  px2 >=3:1  2138
```

The watch clears the gate. Its `Fmax` is about the candle's (0.078), the
weakest timekeeper.

## Experiment: the meshes in view (user, 2026-09-24)

A wheel's teeth mesh with the next pinion about 10 px from that pinion's
arbor, inside the next wheel's hub. With the barrel at the back and the escape
wheel in front, each wheel's hub covered the mesh that drove it. The user
chose the reverse order: the escape wheel at the back and the barrel in front,
with the balance, the fork and the hands above the train.

- Each pinion is drawn, at the pitch of the wheel that drives it, so it can
  mesh. Teeth / leaves: barrel 36 / 6, centre 32 / 4 (8), third 30 / 4 (7.5),
  fourth 14 / 7 (2). The third and fourth pinions have 4 leaves, not a real
  watch's 6 or more, so that the centre and third wheels' teeth are coarse
  enough to read (user; with 6 leaves they had 48 and 45 teeth). At t = 0 each driving tooth sits in a pinion gap, and the
  steps keep them in mesh.
- The ratio of 2 keeps the fourth wheel's 6° tick, and it makes the escape
  pinion half the fourth wheel's radius. So the fourth wheel is smaller
  (r = 28), and the escape pinion fills the middle of the escape wheel.
- Every rotating part except the fourth wheel accumulates one period of
  keyframes. A 6 s escape loop (72°) repeated for the teeth and spokes, but
  not for the 7-leaf pinion, which jumped at each restart.
- The centre cap is now a 3.5 px pivot, and the hour and minute hands narrow
  to 3 px within 26 px of the arbor, so the barrel's mesh with the centre
  pinion shows. The seconds hand has a 2.5 px pivot and narrows to 2 px within 16 px of
  its arbor, for the same reason.

These are for the final drawing, with the meshes in view and the 6 px impulse
jewel. `stem/watches/docs/measurements.md` keeps the current numbers.

## The impulse jewel (user, 2026-09-24)

The jewel on the balance's roller was a 3 px dot, hard to see. It is now 6 px
in radius (the user's size, after 4.5 px was still too small), 15 px from the
arbor so it clears the 10 px collet. It is drawn over the hairspring, turning
with the balance, and the fork's slot is widened to hold it.

## A smaller escape pinion, a bigger fourth wheel (user, 2026-09-24)

The escape pinion (r = 14, 7 leaves) crowded the escape wheel, and the four
wheels were bunched. The pinion's radius is the fourth wheel's divided by
their ratio, and the escape wheel's step is fixed at 12°, so:

| option          | escape pinion | fourth wheel | fourth-wheel tick |
| --------------- | ------------- | ------------ | ----------------- |
| ratio 2 (was)   | r 14          | r 28         | 6°                |
| **ratio 4**     | r 9.3         | r 37         | 3°                |
| ratio 3         | r 9.3         | r 28         | 4°                |
| ratio 3         | r 12          | r 36         | 4°                |

**Chosen by the user: ratio 4.** Escape pinion 6 leaves; fourth wheel 24
teeth. The seconds hand turns once in 2 minutes (a 120 s loop).

The wheel angles came from a search that kept every wheel inside the chapter
ring and the balance at lower left, and maximised the gap between wheels that
do not mesh: at least 11.6 px. Third wheel at 60° from the centre wheel,
fourth at 65° from the third, escape at 100° from the fourth, balance 115 px
from the escape wheel at 195°.

After this change: `hold 3.66`, `p90 6.99`, `Fmax 0.082`; `motion.py --sep 1`
`dPeak 9.41`, 2736 px² over 3:1.

## Real-time hands: two beats a second (user, 2026-09-25)

With ratio 4, one beat a second gave the seconds hand 3° a second: half real
speed, and the minute and hour hands with it. Real time needs the fourth wheel
to turn 6° a second.

| option                         | how                                  | cost                                                   |
| ------------------------------ | ------------------------------------ | ------------------------------------------------------ |
| A. ratio 2                     | 12° / 2 a beat, a beat a second      | the escape pinion crowds the escape wheel again, or the fourth wheel shrinks |
| **B. two beats a second**      | 3° a beat, two beats a second        | the balance and fork move twice as fast                |
| C. a 10-tooth escape wheel     | 18° a beat, ratio 3                  | a smaller fourth wheel; unrealistic                    |
| D. hands driven on their own   | hands at real time, train as before  | the seconds hand turns faster than the wheel it sits on |

**Chosen by the user: B.** `PERIOD` is 1 s. The seconds hand turns once a
minute, the minute hand once an hour and the hour hand once in 12 hours.
The balance still beats three times slower than a real 3 Hz watch.
`motion.py` now needs `--sep 0.5` (half a period); the validator takes it from
`PERIOD`. Measured: `hold 3.66`, `p90 7.03`, `Fmax 0.082`; `dPeak 9.41`,
2736 px² over 3:1.

## Clearance as the viewer sees it; the fork's clearance (user, 2026-09-25)

The user moved the wheels (third 40°, fourth 95°, escape 160°, lever 205°),
and the validator failed. Part of that was the validator: it measured tip
circle to tip circle, so it reported the fourth and centre wheels 0.6 px apart
where the third wheel hides the overlap. It now measures between the visible
regions: each part's disc to its tips, minus the discs that the parts drawn
above it hide (`watches/art/watch_geometry.py`). By that measure the user's
layout had fourth-centre 6.3 px and escape-third 3.0 px.

The user also asked that the fork's arms stay clear of the fourth and centre
wheels. The validator now checks the fork's outline, at both ends of its swing,
against the visible barrel, centre, third and fourth wheels (`FORK_CLEARANCE`).

`watches/art/search-skeleton-watch-layout.py` searched the four angles (19,127
allowed layouts on a 10° grid, then refined round the best ten), maximising
the smaller of the tightest wheel gap and the tightest fork gap:

| third | fourth | escape | lever | tightest wheels   | fork       |
| ----- | ------ | ------ | ----- | ----------------- | ---------- |
| 40    | 95     | 160    | 205   | escape-third 3.0  | fourth 13.4 |
| **42.5** | **92.5** | **145** | **197.5** | fourth-centre 9.7 | fourth 10.5 |
| 60    | 110    | 162.5  | 215   | fourth-centre 9.6 | fourth 10.5 |

Every one of the best layouts has the fork 10.5 px from the fourth wheel: the
fourth wheel meshes with the escape pinion, beside the fork, so this looks
like a limit of the train's geometry. **Chosen: the first**, the closest to the
user's layout. `MIN_CLEARANCE` and `FORK_CLEARANCE` stay at 8 px. Measured:
`hold 3.67`, `Fmax 0.082`; `dPeak 9.44`.

## The chapter ring as a third gap (user, 2026-09-25)

In that layout the balance was 1.1 px from the chapter ring, so the two read
as joined. Each part's gap to the ring's inside edge is now a third measured
gap (`RING_CLEARANCE`, 8 px), and the search maximises the smallest of the
three. It also tries a shorter `BALANCE_DISTANCE` (105, 110, 115 px):

| third | fourth | escape | lever | balance | wheels             | fork       | ring          |
| ----- | ------ | ------ | ----- | ------- | ------------------ | ---------- | ------------- |
| 42.5  | 92.5   | 145    | 197.5 | 115     | fourth-centre 9.7  | fourth 10.5 | balance 1.1  |
| 40    | 90     | 142.5  | 197.5 | 105     | fourth-centre 9.6  | fourth 9.5 | balance 10.7  |
| 50    | 100    | 152.5  | 207.5 | 105     | fourth-centre 9.6  | fourth 9.5 | balance 10.7  |
| 60    | 110    | 162.5  | 217.5 | 105     | fourth-centre 9.6  | fourth 9.5 | balance 10.7  |

The best five are one chain turned in 10° steps, with the same gaps: adding
one angle to all four turns the chain about the centre, and the ring is a
circle (the user expected this). The barrel is fixed at 12 o'clock, so the
turn could matter near it, but it does not for these. **Chosen: the second
row**, the turn closest to the layout before. Measured: `hold 3.66`,
`Fmax 0.082`; `dPeak 9.11`.

The balance's gaps to the other wheels were already in the wheel gaps: the
balance is one of the six parts, and every pair that does not mesh is
measured.

**Revised (user, 2026-09-25): a balance distance of 105 px is too short**, so
the search ran again with `--balance-distance 110`:

| third | fourth | escape | lever | wheels            | fork       | ring          | smallest |
| ----- | ------ | ------ | ----- | ----------------- | ---------- | ------------- | -------- |
| 40    | 90     | 142.5  | 197.5 | fourth-centre 9.6 | fourth 9.5 | balance 8.0   | 8.0      |
| **47.5** | **97.5** | **152.5** | **207.5** | escape-third 8.8 | fourth 9.5 | balance 12.1 | **8.8** |
| 57.5  | 107.5  | 162.5  | 217.5 | escape-third 8.7  | fourth 9.5 | balance 12.1  | 8.7      |

**Chosen: the second row.** Measured: `hold 3.66`, `Fmax 0.082`;
`dPeak 9.29`.

## The fork's slot and a solid escape wheel (user, 2026-09-25)

- **The slot.** Each horn of the fork was about 0.5 px thick where the slot
  meets the lever: the horn's outer edge ran almost on top of the slot's
  edge. The outer edges moved out, so each horn is about 4 px thick all along.
  The slot is the same width (for the 6 px impulse jewel), and the fork's
  clearances did not change.
- **The escape wheel.** Its teeth looked unattached. The cause was a bug: the
  rim's inside edge came from the 27 px pitch radius, not the 23 px root
  circle of the club teeth, so the rim was 1 px wide. With a real 5 px rim, the
  large pinion covered most of the spokes and the centre was busy. A solid
  wheel, with only the pinion's outline inside, read better, and the user
  chose it (`ESCAPE_SOLID`; `wheel(..., solid=True)`).

Measured: `hold 3.65`, `Fmax 0.081`; `dPeak 9.01` (the solid wheel's openings
no longer change as it turns).

## Back to a beat a second, with ratio 2 (user, 2026-09-25)

With the escape wheel solid, a large escape pinion reads on its plain face,
so ratio 2 (option A of "Real-time hands") works after all. `PERIOD` is 2 s
again: a tick and a tock of one second each. The fourth wheel steps 6° a beat,
so the seconds hand keeps real time.

| escape pinion | fourth wheel | leaves / teeth | face left round the pinion |
| ------------- | ------------ | -------------- | -------------------------- |
| r 12          | r 24         | 6 / 12         | 7.5 px                     |
| r 14          | r 28         | 7 / 14         | 5.5 px                     |
| **r 16**      | **r 32**     | **8 / 16**     | **3.5 px**                 |

**Chosen: r 16 / r 32**, the fourth wheel closest to its size before (37 px).
The tooth pitch is unchanged, 12.6 px. The search, with the balance distance
held at 110 px, found more room than before:

| third | fourth | escape | lever | wheels            | fork        | ring          |
| ----- | ------ | ------ | ----- | ----------------- | ----------- | ------------- |
| 47.5  | 97.5   | 152.5  | 207.5 | escape-third 7.2  | fourth 15.2 | balance 10.8  |
| **50** | **102.5** | **147.5** | **212.5** | escape-third 11.6 | fourth 11.1 | balance 13.3 |

The first row is the layout before, with the new wheels. Measured:
`hold 3.64`, `Fmax 0.080`; `dPeak 9.18` (`--sep 1`).

The user chose this version over the committed pinions-hidden one, and the
temporary comparison slide was removed.
