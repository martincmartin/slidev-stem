# The Hour Hand slide: the motion works

**Request (2026-10-09).** A new slide for the gears that turn the hour hand:
the minute wheel and the hour wheel.

- It starts with the need: a ratio of 12:1. That needs no giant wheel, as
  60:1 did, only a wheel a little larger than the 8:1 stage's. But wherever
  the wheel goes, the hour hand is off centre. People accept an off-centre
  seconds hand, but not an off-centre hour hand. So the hour hand must be in
  the middle.
- Then the minute and hour wheels. On the ETA 6497, the minute pinion drives
  the hour wheel at 1:4, so the pinion on the centre arbor drives the minute
  wheel at 1:3. There, the minute wheel is at about our 8:30, over a small
  part of the balance and none of the barrel or the mainspring.
- No real cannon pinion, friction fit, setting wheel or way to set the time.
- The hour wheel goes on top of the centre wheel. The user's guess: the
  existing centre pinion drives the minute wheel.
- The minute wheel must not cut into the barrel if they are in one plane.
  Keep the barrel where it is; if the area round the minute hand is too
  busy, consider turning the barrel toward 6 or 5 o'clock.
- The minute and hour wheels must not show on the cover.
- "Give it a go and see what problems you run into."

The docs read first: [`docs/watch.md`](../../docs/watch.md) (the layout,
the teeth, the Gear Train and Mainspring slides, pieces, views, the one
rule), [`docs/slide-patterns.md`](../../docs/slide-patterns.md).

## Where the new slide goes

After the Mainspring slide. The Mainspring slide shows "all but the hour
hand", and the time-lapse turns the minute hand six times with no hour
hand. So the hour hand is the open question when this slide starts.

Title "Motion Works", the watchmaker's name, as the earlier titles are
the parts' names ("Escapement", "Gear Train", "Mainspring"). Subtitle "From
once an hour to twice a day", in parallel with the Gear Train slide's "From
once a minute to once an hour". Both are the user's to change.

## The gearing

The hour hand turns 12 times slower than the minute hand, and the same way,
about the same arbor. $12 = 3 \times 4$: a pinion on the centre arbor drives
the minute wheel at 1:3, and the minute wheel's pinion drives the hour wheel
at 1:4. The hour wheel turns on the centre arbor, so the two stages go out
from the centre and come back to it. Then the two centre distances must be
equal:

$$r_\text{centre pinion} + r_\text{minute wheel} = r_\text{minute pinion} + r_\text{hour wheel}$$

A gear's pitch radius is its tooth count times the size of its teeth
($r = kN$, with $k$ in px a tooth). Two gears that mesh have the same $k$.

| Option | First stage | Second stage | Minute wheel, tip | Hour wheel, tip | The one-step trial (12:1) |
| --- | --- | --- | --- | --- | --- |
| **E. The existing centre pinion** (6 leaves, $k = 2.06$, the barrel's teeth), made longer above the barrel | 6 : 18, centres 49.3 | 6 : 24 ($k = 1.64$) | 41.3 | 43.1 | 6 : 72, $r = 148$, centres 160: past the case (250) |
| **C. A new pinion on the centre arbor**, 4 leaves at the centre wheel's tooth size ($k = 1.5625$, as the 8:1 stage) | 4 : 12, centres 25 | 4 : 16 ($k = 1.25$) | 21.25 | 22.5 | 4 : 48, $r = 75$, centres 81: inside the ring (192) |

(Radii in design px. The cover shows the case at about 1 design px a slide
px.)

What each one covers. The motion works are above the train, so in the plan
they cover what they overlap. `tools/scan_minute_wheel.py` measures the
area of each part inside the two wheels' tip circles, for each angle of the
minute wheel's arbor ([`out/scan_minute_wheel.txt`](out/scan_minute_wheel.txt)).
At the best angle of each:

| Option | Best angle | Barrel | Third wheel | Balance | Total (px²) |
| --- | --- | ---: | ---: | ---: | ---: |
| E | 10:40 to 11:00 | 1,897 | 1,645–1,661 | 951–1,029 | about 4,500 |
| C | 10:20 to 11:00 | 394–405 | 333 | 0 | about 730 |

At these angles, the hour wheel's disc about the centre covers all the barrel
and the third wheel that the motion works cover. The minute wheel covers
only the centre wheel (and in E, about a tenth of the balance).

**Chosen: C.** Reasons, in order:

1. **The trial needs a small pinion anyway.** "A little larger than 8:1"
   is the 8:1 stage's own pinion (4 leaves) with $4 \times 12 = 48$ teeth: a
   wheel 1.5 times the centre wheel's size, as 12 is 1.5 times 8. With the
   existing 6-leaf pinion, the trial wheel is 72 teeth, twice the case's
   radius from rim to rim, and it goes past the case. That is the Gear
   Train slide's giant again, and the size, not the place, would be the
   problem the audience sees.
2. **One pinion for the whole story.** The same pinion drives the trial
   wheel, and then the minute wheel. The audience sees one change: the gear
   that it drives.
3. **About a sixth of the clutter.** C covers about 730 px² of the
   movement, E about 4,500. E's hour wheel (43 px) covers the centre wheel
   almost to its teeth, and the mesh of the barrel and the centre pinion (the
   Mainspring slide's flash).

Against C: it adds a pinion, where the user guessed that the existing one
would do. It is a rigid pinion on the centre arbor: a cannon pinion without
the friction fit. The code calls it `cannon pinion`, the watchmaker's name
for the part that has its place.

The second stage's teeth are finer than the first's (7.9 px pitch, not 9.8).
4 : 16 is the coarsest whole pair that fits the centres, but a 3-leaf
pinion.

## Where the minute wheel goes

C fits between the third wheel and the barrel at 10:20 to 11:00, where it
covers nothing that the hour wheel does not. At the user's 8:30 it covers
about 600 px² more of the barrel. Chosen: **10:40** (screen angle 230°).
So the barrel can stay where it is.

Not the user's 8:30: in this layout the barrel is at about 7 o'clock,
next to 8:30, and the balance at 11. The ETA's description (over a small part
of the balance, none of the barrel) fits 10:40 to 11:00 here.

## The heights

The motion works are on the dial side, above the train, under the hands:

1. The cannon pinion, on the centre arbor, and the minute wheel at its height,
   above all that the minute wheel overlaps (the centre wheel, the centre
   pinion, the barrel's height).
2. The minute pinion, on the minute wheel; the hour wheel at its height, on
   a pipe round the centre arbor.
3. The hour hand on the hour wheel's pipe; the minute hand above it.

So the hour wheel hides the cannon pinion and the inner half of the minute
wheel, from above. The slide shows the first stage before the hour wheel
comes, so the audience sees the first mesh first.

## Clip discs: none for the motion works

A first version hid the train's wheels inside the motion works' root circles,
as a train wheel hides the wheel below it (`clipDiscs`). At tilt 20 that cut
white slivers out of the centre wheel's rim and spokes beside the minute
wheel and the hour wheel ([`out/v1/click-4.png`](out/v1/click-4.png)): the
motion works are 5 to 8 px above the centre wheel, so a disc in the plan
does not line up with the wheel above it. The train's wheels are only 3 px
apart, so the train does not show this. Now the depth test alone hides what
the motion works cover, and the centre wheel's spokes show through their
openings ([`out/v2/click-4.png`](out/v2/click-4.png)).

## Off the cover

The cover shows `watch: all`. The new parts are pieces that `all` leaves
out (`inAll: false`), as the drive arrows and the marks are. Then the cover
does not change, and a later slide names them to show them.

## The slide

The Mainspring slide ends with the whole movement, run down. A first
version, to look at:

| Click | What shows | Text |
| --- | --- | --- |
| 0 | the centre wheel and its arbor, the minute hand, the dial and the case, at tilt 0, the case filling the picture band | (speaker: the hour hand must turn 12 times slower) |
| 1 | and the cannon pinion and the one-step wheel (48 teeth); they flash | "12:1 gear ratio" |
| 2 | and an hour hand on the one-step wheel's arbor | "Off centre!" |
| 3 | the one-step wheel and its hand go; the camera zooms in on the centre wheel, at tilt 20; the minute wheel fades in, and it and the cannon pinion flash | "Out: 3:1" |
| 4 | the minute pinion and the hour wheel fade in, and flash | "Back: 4:1" and "3 × 4 = 12" |
| 5 | the camera zooms out to the case; the dial, the minute hand and the hour hand, on the hour wheel | "Twice a day, in the middle. The hour hand!" |

## Problems found

- **In the motion works, the pinions drive the wheels.** Every mesh in the
  train is a wheel that drives a pinion, and the model's `Wheel.driven`, the
  tooth shapes' backlash and the mesh tests say so. Cycloidal teeth work in
  both directions (the pinion's radial flank and the wheel's epicycloid face
  come from the same rolling circle), so the shapes stay. Only which member
  turns back by half the backlash changes: the driven wheel, not the pinion.
- **A pinion that drives does not keep full contact.** The leaf's round end is
  not shaped to drive. Over one tooth, the contact gap reaches 0.33 px on the
  minute wheel (1 sample of 60), where the train's test allows 0.3 px. On
  the slide's zoom (about 3.8 screen px a px) that is about 1.3 screen px,
  under the 2.25 px of the two outlines' ink. The test allows 0.4 px where a
  pinion drives.
- **The hiding discs cut slivers at a tilt** (above, "Clip discs").
- **`timing.hourRatio` had no use left.** The hour hand's speed is now the
  hour wheel's step, from its teeth; the ratio was a second copy, so it is
  gone from the design file. The one-step hour wheel takes its 12 from the
  motion works' teeth (`hourRatio` in `watch/design.ts`).
- **The dial is higher on every slide.** The hands, the chapter ring and the
  case band go up by 7.5 px (heights 20 to 27.5; `tools/heights.ts`
  measured it with the code before and after), also where the motion works
  do not show: the model has one set of heights. At tilt 0 (the cover) this
  does not show. At tilt 20 the ring moves up the screen by about
  $7.5 \sin 20° \approx 2.6$ px times the zoom (the Gear Train slide's click
  4, the Mainspring slide's clicks 4 to 6). The minute arbor's cap above its
  pinion is 3 of the 7.5 px; without it the arbor would end flush.
- **The subtitle's paper outline shows as a box over the strap** at clicks 0
  to 2 and 5 ("From" crosses the strap). The Gear Train slide has the same
  outline over its ring. Not changed.
- **The one-step wheel turns the hour hand backwards.** A pinion and the
  wheel that it drives turn opposite ways. So the one-step hand is off
  centre and runs anticlockwise. Two stages turn it back. At the mechanism's
  speed an hour hand moves 0.5° a minute, so nobody sees it; the speaker
  notes can say it.

## Later steps (not in this version)

- "No matter where we put it": the one-step wheel could roll round the
  pinion, in mesh, with its hand's pivot on a circle round the centre.
  That needs an arbor that moves, which the model does not have.

## Step 2 (2026-10-09): tilt 20 at every click

**Request.** The whole slide, every click, at tilt 20. The user agrees that
neither pinion size does both jobs (the 6-leaf pinion makes the motion works
too large; a 4-leaf pinion for the barrel does not fit), so the centre arbor
carries two pinions.

**Where the new pinion is.** On top of the old one, on the same arbor, with
no gap (design units): the centre wheel 9 to 12, the old pinion 12 to 17
(level with the barrel, which drives it), the cannon pinion 17 to 20 (level
with the minute wheel, which it drives), the minute pinion and the hour
wheel 20 to 23, the hour hand 26 to 27.5. From above, the old pinion's
leaves (radius about 12) show round the new one's (about 6).

**Open.** The slide does not name `centre pinion`, so at clicks 3 and 4 the
cannon pinion stands on the arbor 5 units above the centre wheel, with bare
arbor under it.

Screenshots at tilt 20: [`out/v3/`](out/v3/).

## Step 3 (2026-10-09): the whole watch at every click (a trial)

**Request.** Show the whole model before the motion works (all but the hour
hand: the Mainspring slide's click 4 list) at every click of this slide, to
see how busy it is. Screenshots: [`out/v4-whole/`](out/v4-whole/).

What the screenshots show:

- **Clicks 0 and 5 (the case view) read well.** The motion works are small
  at the centre, and the hour hand ends in the middle.
- **Clicks 1 and 2: the one-step wheel lies over the escapement** (the
  balance, the fork, the fourth and third wheels), at 12 o'clock. Its outline
  is hard to pick out of the train, and so is its hand's pivot.
- **Clicks 3 and 4 (the zoom on the centre wheel): the train fills the
  slide.** The third wheel, the fourth wheel and the minute hand run behind
  the title, the subtitle and the text, and the barrel fills the lower left.
  The minute hand crosses the cannon pinion and the minute wheel. The text
  stays legible through its paper outline, but the motion works are one
  small part of a full picture.

## Step 4 (2026-10-09): hide what is under them; the trial at 8 o'clock

**Request.** At clicks 1 and 2, the one-step wheel's inside should hide the
gears below, as the train's wheels do. Put it where the train is quieter.
Keep the minute hand at every click. (The user agrees that click 3 is too
busy, and that the barrel without the old pinion would confuse.)

**Where.** [`out/scan_one_step_hour.txt`](out/scan_one_step_hour.txt) (`tools/scan_one_step_hour.py`):
12 o'clock covered about 18,500 px² of the escapement, the balance and the
third and fourth wheels. From 7:00 to 8:00 it covers only the barrel. At
7:00 it lies almost on the barrel, which is its size. **Chosen: 8:00**
(screen 150°): half the barrel, nothing else, and its hand's pivot clear of
the minute hand.

**Hiding.** Step 1's slivers came from a disc out to the root circle. Two
more tries, measured on click 4's crops:

| Disc ends at | Result |
| --- | --- |
| the root circle | slivers cut out of the centre wheel beside the rim ([`out/v1/click-4.png`](out/v1/click-4.png)) |
| the inside of the rim (the openings) | a crescent of the centre wheel in each opening ([`out/v5/click-4-compare.png`](out/v5/click-4-compare.png), right) |
| **half way across the rim, with rims of 6 px** | clean ([`out/v6/click-4-detail.png`](out/v6/click-4-detail.png)) |

At a tilt the disc slides against the wheel above by the height between
them times $\tan 20° \approx 0.36$: up to about 3 px (the hour wheel, 8 px
above the centre wheel). A disc half way across a rim covers the openings and
stays under the rim while the slide is under half the rim. The barrel arbor's
square had no discs, so it showed through the trial wheel; it now has the
barrel's ([`out/v6/click-2-detail.png`](out/v6/click-2-detail.png)).

## Step 5 (2026-10-09): one pinion in view; the hour wheel hides what is under it

**Request.** Through the hour wheel's openings the cannon pinion and the
minute wheel showed; they are under it, so hide them. Two pinions on the
centre arbor confuse: after the zoom, hide the barrel and the old pinion,
flash them first, and say why with a note such as "(mainspring hidden for
clarity)".

- **The hour wheel's disc** now hides the cannon pinion and the minute
  wheel's body too (`SolidList.add` takes discs for a part that is not a
  train wheel). The minute pinion is outside it, and still meshes in view.
- **The barrel goes on a click of its own.** A step flashes what is on the
  screen first, then fades, then moves the camera (`webgl/timeline.ts`). So
  "zoom, then flash and go" is two clicks: 3 zooms, 4 flashes and hides the
  barrel, the mainspring, the barrel arbor and the old centre pinion. The
  slide has 8 clicks (0 to 7). One click could flash them at the case view,
  then zoom with them on the screen and fade them after (`watchGoLater`):
  rejected for now, because the flash would come before the reason for it.
- **The note** is in the lower right, in the subtitle's size and colour
  (muted), from click 4 until the barrel comes back at click 7.

Screenshots: [`out/v7/`](out/v7/).

## Step 6 (2026-10-09): no zoom out at the start

**Request.** Click 0 keeps the Mainspring slide's last view, not the case
view: clicks 3 to 6 zoom in, and click 7 goes back to click 0's view.

The slide's view is now the Mainspring slide's click 5 view (the train, from
the barrel to the escape wheel, in the picture band), with no `watchRight`,
as there. So the step in from the Mainspring slide does not move the
camera, and the zoomed view is centred in the left 60% (it was at
`watchRight: 489`, a few px away). At this view the dial's ring and the
crown run behind the text column. Full validation of step 5 passed (23
checks, 268 s); this step changes only `slides.md` and the docs.
Screenshots: [`out/v8/`](out/v8/).

## Step 7 (2026-10-09): the cannon pinion goes with the one-step wheel

**Request.** When the one-step wheel goes (click 3), its pinion goes too;
it comes back with the minute wheel (click 5). So at click 4 the centre
arbor is bare, and the pinion and the wheel that it drives come in
together, as on the Gear Train slide. Screenshots: [`out/v9/`](out/v9/).

## Step 8 (2026-10-09): the slide is "Hour Hand"

**Request.** Rename the slide from "Motion Works" to "Hour Hand". The parts
keep their name, the motion works. Earlier steps say "the Motion Works
slide": it is this slide. The page class is now `hour-hand`, and its text
classes `hh-…`.

## Step 9 (2026-10-09): dim, not hide; the stages' recap

**Request.** Dim the rest of the movement while zoomed in, rather than hide
it: 0.35, as the "Before clocks" cards (a part of the picture is more like a
card than text). At the last click, dim the first three lines of text to
0.5, as the Gear Train slide does.

**How to dim a mesh.** The renderer has one fade: two whole pictures, mixed.

| Option | For | Against |
| --- | --- | --- |
| A. A second fade: a third picture, mixed at 0.35 | true group opacity: a bright part shows through a dimmed one above it | one more draw of the whole frame, and a fade during a dim needs four pictures; the renderer's fade code, its checks and the stage change |
| B. Each dimmed mesh drawn translucent | one draw | it shows its own hidden lines, and overlapping dimmed wheels darken: against the house rule that a fade shows none |
| **C. Mix a dimmed mesh's colours toward the paper** | no new picture, no shader change: the renderer already mixes each face colour over the paper on the CPU, and gives the line inks as a uniform for each draw | a dimmed part above a bright one still hides it |

**Chosen: C** (`Frame.dim`, `StageState.dim`, `watchDim`, `WATCH_DIM`). The
timeline eases it in `DIM_SECONDS`, in step 3 of the one rule: after the
camera moves and the old pieces fade out, before the new ones fade in. So a
zoom in shows the old picture bright, and then the dim. The barrel's own
click and its note ("(mainspring hidden for clarity)") went: nothing
vanishes now. The slide has 7 clicks (0 to 6).

**What C costs here.** At click 5 the pale barrel's teeth cover a few of the
bright centre wheel's teeth ([`out/v10/click-5.png`](out/v10/click-5.png)).
If that matters: draw dimmed meshes behind every bright one in depth (a
depth range for each in the face and line shaders). Not done.

Full validation: 23 checks passed (257.5 s), with a browser check of the dim
(`webgl/probe/checks.ts`). Screenshots: [`out/v10/`](out/v10/).

## Step 10 (2026-10-09): the cover's white circle

The cover showed a white circle over the centre pinion. The hour wheel
was in the hour hand's group, and a clip disc hides while any mesh of
its group is drawn. The cover draws the hand, but not the wheel, so the
wheel's disc cut the centre wheel, its pinion and the third wheel. Fix:
the hour wheel has a group of its own (`hourWheel`), with the hand's step.
A new test in `generate.test.ts` fails on the old grouping: on the cover,
each drawn disc group must hold a drawn mesh that covers the disc.

## Status

- [x] Task directory, the options and the scan.
- [x] The design: the motion works' numbers in `art/watch_design.py`; the
      validator checks their meshes and the ring.
- [x] The parts, the heights, the motion, the tests (`teeth.test.ts` meshes
      both stages and the one-step hour wheel's pinion is the cannon pinion).
- [x] The slide, `docs/watch.md`, screenshots of each click
      ([`out/v2/`](out/v2/), Chromium, `tools/shots.py`).
- [x] Full validation: all 23 checks passed (2026-10-09, 205.8 s).
- [ ] The user looks at the slide.
