# Illustrations: "Line, weighted"

**Covers:** the drawing grammar of every STEM talk (size, colour, stroke
ladder, motion), how an SVG takes the theme's colours, the flash, washes, and
how to draw a new one.
**Read before** you draw or change an illustration. For art that turns in 3D,
zooms, or moves by rules, read [webgl.md](webgl.md) as well: the same grammar,
drawn live.
**Tasks:**
[`watches/tasks/2026-09-20-animation-style/`](../watches/tasks/2026-09-20-animation-style/README.md)
(the style: set 2 of 16 drawing sets; §13 works four new subjects through the
grammar),
[`tasks/2026-09-23-theme-aware-art/`](../tasks/2026-09-23-theme-aware-art/instructions.md)
(the art takes its colours from the theme),
[`watches/tasks/2026-09-23-followups/`](../watches/tasks/2026-09-23-followups/PLAN.md)
(each SVG states its display size),
[`watches/tasks/2026-09-30-flexing-ruler/`](../watches/tasks/2026-09-30-flexing-ruler/PLAN.md)
(an inlined SVG with theme colours, and a generator),
[`watches/tasks/2026-09-30-flash/`](../watches/tasks/2026-09-30-flash/PLAN.md)
(the flash: its colours and how WebGL draws it),
[`tasks/2026-10-07-theme-colour-system/`](../tasks/2026-10-07-theme-colour-system/PLAN.md)
(washes as named colours, material colours, leaders in the second).

The examples are the four timekeepers in
`watches/public/timekeepers/{sundial,water-clock,candle,hourglass}.svg`, and the
diving board, `watches/public/diving-board.svg`.

**The style is a grammar, not a look.** It is a stated size, the art's colour
roles, a stroke ladder and a habit about what moves. Follow those four and a
new drawing reads as another drawing by the same hand. That is the whole job
of the art.

**Why this style.** Sixteen drawing sets were built and measured at the back
row. This one is not the top of that ranking (a heavy linocut style kept more
contrast). It was chosen for what people liked: a sparse, blue-led line
drawing. This set is that drawing with its measured faults fixed, so that it
clears the back-row gate: a darker line, a real muted, and strokes on the
ladder. The ranking and the choice are in the animation-style task, §8.7 and
§14.

## The grammar

**Size.** Each file states the size a slide shows it at, in CSS px: its `width`
and `height`. Its `viewBox` is its own drawing units, with the same aspect
ratio. One unit is `width / viewBox width` CSS px, and the tools render and
measure the drawing at that size. The timekeepers are drawn in a 240 × 190 box
and shown at 122 × 97, so one unit is **0.508 CSS px**. For a new drawing, the
simplest choice is a `viewBox` of the same size as `width` and `height`: then
one unit is one CSS px. If a slide shows the drawing at another size, change
`width` and `height` to match and run the checks again. Everything below is in
CSS px as shown.

**Colour.** The art's colours, each with a job, and nothing else: the subject
(its lines) and the subject wash (its faces); muted (context: what holds or
acts on it) and the muted wash (the context's faces); ink (scales and fine
detail); and, where two materials meet, water, ground and the ground wash.
The jobs and the variables are in [theme.md](theme.md), "The roles" and "The
pairs". The values below are Ledger's, as examples. The second and its wash
say "look here": a flash, a keyword callout ("Flash" and "Leaders",
below), and a mark: a few teeth of a gear, solid in the second, with the
gear's own outline (`watches`, the Gears slide). While that slide compares
two styles (a trial), a mark may also be in the flash's colours: faces in the
second's wash, lines in the second. When the talk keeps one style, delete the
other from `scenecheck` (`MARK_WASH_ROLE`).

**Which colour, and at what opacity, is decided by the job, not by taste.**
The thing that moves is its line colour at 0.60–1.0; the thing that contains
it is a face, in its wash.

| the thing that MOVES |                 | the thing that CONTAINS it |                       |
| -------------------- | --------------- | -------------------------- | --------------------- |
| hourglass sand       | `0.85` → 6.45:1 | sundial dial plate         | subject wash → 1.20:1 |
| sundial shadow       | solid → 9.60:1  | sundial plate wall         | muted wash → 1.16:1   |
| candle flame         | solid → 9.60:1  | candle wax body            | subject wash → 1.20:1 |
| water clock water    | `0.60` → 3.38:1 | water clock vessel         | unfilled              |

(Contrasts are on Ledger's panel.)

**The art colours are the ones the art has used so far, not a ban.**
`artcheck` fails any other colour (except the papers, and a variation of a
wash: "Washes", below), so that a colour is added on purpose. If a drawing has
a good use for another theme colour, give it a job here and change `artcheck`
to allow it. Do not move a mark out of the art only to get past `artcheck`.

**The subject is drawn at 0.60–1.0; a face is its wash.** A subject drawn as
faint as a face disappears at the back row, and its animation with it. See
"Washes".

**Stroke ladder.** Four weights as shown, and only these four:

| CSS px | timekeeper units | typical use                                     |
| ------ | ---------------- | ----------------------------------------------- |
| 2      | 4 (2.03 px)      | interior detail: hour bands, graduations, ticks |
| 2.5    | 5 (2.54 px)      | (rare: the in-between)                          |
| 3      | 6 (3.05 px)      | the workhorse: primary contours                 |
| 4      | 8 (4.07 px)      | the heaviest outline, used sparingly            |

The hierarchy _is_ the style. A 2.25 or a 3.5 blurs the steps, and the drawing
stops reading as deliberate. `artcheck.py` enforces the ladder, within 5%. The
floor of 2 px comes from the back row ([legibility.md](legibility.md)).

**Leaders are 4 px, in every talk.** A leader is the line from a callout's
label to the part that it names. All leaders have one width, so that the
audience reads each one as the same kind of mark. The width is 4 px because a
2 px leader in muted failed the back row's blurred-contrast gate (the
[`leader-correction`](../watches/tasks/2026-10-03-rest-shape/leader-correction/PLAN.md)
task). A leader is in ink, the colour of its label, so the label and its
leader read as one note over the drawing. Not the subject colour: in the
drawing's colour, a leader reads as a part of the drawing. Two exceptions:

- **A keyword callout**: a label whose leader points at what one word names,
  not at the whole label ("Pallet" in "Pallet blocks wheel", not the
  blocking). The word and its leader are in the second, and the rest of the
  label is ink, so the audience sees which word the leader belongs to. The
  second also shows where the leader crosses the subject's lines: ink on
  Ledger's subject is only 1.36:1 and ΔE 37; the second is ΔE 69 from it. No
  new hue fits better (theme.md, "Adding a colour"). A flash and a keyword
  callout must not show at the same time. The Escapement slide of `watches` is the example
  (`keyword` on `WatchCallout.vue`).
- **A reference mark**: a leader may take the colour of a reference mark that
  it names (the Hairspring slide of `watches` points to a muted rest shape, in muted).

The widths are set in
`watches/art/diving_board.py` (`LeaderDesign`) and
`watches/components/WatchCallout.vue`; keep them equal.

**A leader is straight, or it bends once.** A bent leader leaves its word
level, runs a fixed distance (`LeaderDesign` from `start` to `elbow`, and
`ELBOW_RUN` in `WatchCallout.vue`; keep them equal), and then turns straight
to the part, at one round-joined corner. Bend a leader when a straight one
would cross another line of its label.

**A leader ends where only one part can be meant.** By default, it ends on
the paper, 10 px outside the outline of its part (slide px, as for the
width). There it crosses none of the part's own lines, and its end shows
clearly against the paper. For a part that moves, use its outline at each end
of its motion. Sometimes the paper near the part is next to another part, and
an end there could point at that part. Then end the leader inside its part, at
a point that only that part can mean, for example a small part with a solid
fill. The Escapement slide of `watches` has both kinds: the wheel's and the pallet's leaders
end outside, and the jewel's leader ends inside the jewel, because the fork
and the roller are all around it. A leader to a thin line, such as the Hairspring slide's
rest shape, may end on the line: the line is its own outline. The gap is `LEADER_GAP` in
`watches/watch/callouts.ts`; keep it equal to this rule.

**Motion.** One loop per subject, running forever, with a fixed duration per
subject, so two drawings side by side are never compared at different points
in their cycle:

```
sundial 11 s     water clock 8 s     hourglass 9 s     candle 12 s
```

Short overlaid loops are allowed for things that flicker rather than progress:
the candle's flame is 1.6 s, its two wax drips 3.1 s and 4.3 s, the water
clock's drip 1 s. The unequal, prime-ish durations are deliberate: the four
cards do not pulse in unison.

## Think in 3D, not in 2D

Most of our illustrations are 2D projections of 3D worlds. This is true even
of an SVG where the projection is not explicit: a flat diagram of a spring, a
board or a pool still shows objects that have a near side and a far side, an
up and a down. When you reason about one, for a change, a morph or an
animation, place each part in 3D first, then project it. If you reason only
about 2D shapes, the picture can break the 3D world. Two points of an
outline can swap which one is near, for example, and the audience sees an
Escher-style impossible change.

How to apply: for each edge or face, name its 3D place (near or far, top or
bottom, inside or outside) and keep that name through the whole change. An
object may turn edge-on and open again, but it must not turn inside out. Check
that the near edge at the start is still the near edge at the end.
Example: the diving board that curls into the hairspring
([`watches/docs/watch.md`](../watches/docs/watch.md)): the board's near edge
becomes the ribbon's top edge, the one nearer the viewer, not its lower one.

## The page's theme paints the drawing

Do not let an SVG keep its colours to itself. Put a `<style>` in the file that
gives each mark `var(--palette-<role>, <hex>)` through a class. Then a slide's
`class:` can change the theme ([theme.md](theme.md)), and the drawing takes
that slide's colours. Keep the hex as the mark's attribute too
(`fill="#D3DCE3"`): the tools read the attributes and render the file on its
own, where the `var()` fallback paints the same pixels.

- **Inline the SVG in the page.** An SVG in an `<img>` is a separate document,
  and no page CSS reaches it. `watches/components/DivingBoard.vue` inlines its
  file.
- **Namespace every class**, as for an `id`: a `<style>` in an inlined SVG
  applies to the whole page (`.diving-board-stroke-subject`).
- **Always give `var()` its fallback.** Without the theme, a `var()` with no
  fallback does not use the attribute: the mark takes its parent's colour.
- **Write the hex from the theme, not by hand.** `watches/art/diving_board.py`
  reads the values from the theme that the talk links (`watches/art/theme.py`
  works out its recipes), and its `--check` fails when the theme changes. It is
  the example.
- **A variation of a wash is `color-mix()` of the roles**, with the mixed hex
  as its fallback: `color-mix(in srgb, var(--palette-ground, #736A60) 15%,
var(--palette-ground-wash, #E2DED6))` (`Shade` in the diving board's
  script).

The four timekeepers do not do this yet: `TimekeeperCard.vue` shows them in an
`<img>`, so they keep Ledger's colours.

## Flash

**A flash says "look at this part".** The part is drawn in the flash colours
for 0.25 s, then in its own colours for 0.25 s, five times: 2.5 s. It ends in
its own colours.

- **Its colours.** Lines in `second`; faces in the second's wash. Each line
  colour of the part (the subject, muted, ink) goes to `second`, and each wash
  (the subject's, muted's) goes to the second's wash. A fill in the subject
  colour (the watch's impulse jewel) goes to `second`. So the part is the same
  drawing in a warm pair, with line on face as the subject is on its wash.
- **Why these.** The accent cannot flash a part: the subject is the accent's
  own hue, only ΔE 20 from it, and `second` is ΔE 69 away. The face is most
  of a part's area, so changing it carries most of the signal. The line on its
  wash stays at the 3:1 floor (a gate in [theme.md](theme.md)), so the
  structure stays readable. One colour for lines and fills merges a spring's
  coils into the wheel behind them, and pale lines on a dark fill read as a
  negative: both were drawn and rejected (the flash task).
- **When.** During a camera move to the part, so that the audience can follow
  the zoom, or when the part fades in, to point at what is new. Never while a
  keyword callout shows: its leader is in the second too. Only on the step
  forward into the slide or the click that names it: a slide or a click
  reached by a jump, or by a step back, shows its state with no flash
  ([navigation.md](navigation.md), "Attention cue").
- **Safety.** Two flashes a second is below the WCAG 2.3.1 limit of three.
- **In WebGL**: `FLASH_INKS` in `watches/webgl/scene.ts`, the stage's flash
  phase and its timing constants in `watches/webgl/timeline.ts`, and a slide's
  `watchFlash` ([webgl.md](webgl.md)).
- **In an inlined SVG**: a CSS animation on the part's group, five cycles of
  0.5 s with `steps`, that sets `stroke` to `var(--palette-second)` and
  `fill` to `var(--palette-second-wash)` for the first half of each
  cycle. An animation wins over the drawing's own class rules. No SVG flashes
  yet: the first one builds the helper.

## Drawing a new one

1. **Decide the size the slide shows it at, and put it in `width` and
   `height`.** Every stroke check depends on it.
2. **Sketch at the weights you will ship.** Not thinner "for now". The whole
   style is the weight hierarchy.
3. **Pick the structural line first (3 px, the subject), then decide what earns 4
   and what drops to 2.** Three levels are usually enough. If everything is 3,
   the drawing is flat; if everything is 4, it reads as clip art.
4. **Give the context to muted**, with its wash for faces: what the subject
   rests on, is held by, or is moved by. That separation is most of what makes
   these read as diagrams.
5. **Animate the thing the slide is about**, in marks that survive (below).
6. **Namespace every `id`.** A page can hold many copies of a drawing, and a
   shared id makes every copy but the first find the wrong clip or pattern.
   The animation looks frozen, and the cause is invisible. Prefix with the
   subject: `id="water-clock-upper-clip"`.
7. **Run the four checks** (commands in
   [`tools/README.md`](../tools/README.md)): `artcheck` first (it is instant),
   then look at `contact`'s sheet at several times, then `barroom`, then
   `motion` if it moves. `uv run ../tools/validate.py` in the talk runs
   `artcheck`, `barroom` and `motion` on every drawing.

## Washes

A **wash** is a solid colour near the paper, for a face: each line colour
that has faces has one ([theme.md](theme.md), "The pairs"). Faces are why these
drawings read as volumes rather than wireframes.

- **A face is its wash, or a variation of it:** the wash moved toward its line
  to shade a face, or toward the paper to light it. The diving board's ground
  and stand are an example (`Shade` in `watches/art/diving_board.py`).
- **A face is solid, not its line colour at a low opacity.** Not an oversight:
  no face in the art overlapped another mark, so a solid face draws the same
  pixels, and a named wash can be gated and flashed like any colour (the
  [task](../tasks/2026-10-07-theme-colour-system/PLAN.md), §3.7).
- **A substance is its line colour at 0.60–1.0, see-through:** water, sand,
  the candle's drips. A substance may lie over another on purpose, as the water
  clock's surface lies over its body.

A wash, and anything as faint, is invisible at the back row, whatever its width
or colour:

```
Ledger's subject on the panel, by opacity    needs 0.55 to hold 3:1
  0.07 -> 1.12:1     0.18 -> 1.37:1     0.32 -> 1.80:1     0.45 -> 2.37:1
Ledger's muted needs 0.77    ink needs 0.50    the subject wash is 1.20:1
```

**So the drawing must read with every wash and every faint mark removed.** Squint at it: if the
shape goes away, the wash was carrying structure that it cannot carry.

**Put the motion in the marks that survive.** Whatever the animation is _for_
must still be visible after the blur, and a faint mark is the first thing to go.
`tools/motion.py` is the check. It is the only one that can see this, because a
single frame cannot.

> **Worked example: the water clock.** Draw its eight-second level change in
> `fill-opacity="0.18"` bodies and `0.32` surface discs, and it passes
> `artcheck`, and `barroom` gives `hold 2.66 / p90 7.71`: the outline is fine.
> But the **animation** peaks at 2.34:1, with **zero** CSS px² crossing 3:1
> between states. The shipped art draws the two fills at 0.60 and 0.78 and
> nothing else differs: `dPeak` 7.59, and 658 px² over 3:1. The comparison of
> repairs is in `watches/tasks/2026-09-20-animation-style/water-clock-fix/`.

### Depth order does not hide a translucent substance

A substance at `0.85` does not hide what is painted under it. An hourglass
stream drawn from the neck to the floor, with the pile painted on top, is in
correct depth order, and the dashes still show through the sand.

> **To hide a mark, end it or clip it. Being behind something is not enough
> unless that something is solid.** The hourglass's stream ends at the pile's
> crest, and its `y2` follows the crest on the same 9 s clock.

The same applies to a construction line under a wash. Check it at a late frame
with `tools/contact.py`, where these show up.

### A substance in the same hue as its container needs a lightness gap

The water sits inside a vessel whose outline is the same subject colour. As the water
darkens, it converges on the outline, until container and contents read as one
shape. So the rule in [theme.md](theme.md) applies: **≥ 1.4× lightness
separation** from a same-hue mark that it sits inside or against, on top of the
3:1 floor. For Ledger's subject on the panel, the two bracket a window:

```
  alpha   colour     vs panel   vs the outline
   0.18   #CACECE      1.37:1       7.01x   below the floor
   0.55   #788CA1      2.99:1       3.21x   at the floor
   0.60   #6D839B      3.38:1       2.84x   OK                   <- shipped
   0.85   #35577D      6.45:1       1.49x   OK, at the edge
   1.00   #143C6B      9.60:1       1.00x   IS the outline colour
```

**The window is 0.60–0.85, and the water sits at its bottom on purpose.** At
0.85 it scores better on every still frame, but it reads as blue ink rather
than as water. The arithmetic brackets the choice; it does not make it.

## What the grammar has not settled

The four timekeepers are one kind of problem: **a container with a level that
moves one way.** The diving board added a second kind: a part that
vibrates (the subject), and an oblique scene round it (ground and water, as
context). Still
untested:

- **A path rather than an edge.** Every line is the boundary of a thing. A
  beam, a signal or a flow of control needs a mark that means direction.
- **A label.** At a card's 122 px, a glyph's stems fall under the resolution
  floor ([legibility.md](legibility.md)). A diagram that needs text is a
  full-slide drawing, not a card, and that changes the arithmetic.
- **A surface.** No foil, no crinkle, no material. This style draws structure.
  A subject whose character _is_ its texture will look poor in it.

**Some marks break the colour jobs, and no one has decided if they should.**
The watch's hands are filled muted with subject outlines, so they mix two pairs
([theme.md](theme.md)). The candle's drips are filled at 0.35, below
the subject's 0.60. Ink is at 0.5 to 1.0, not always 0.5. The list is in the
flash task ([`COLOUR-ROLES.md`](../watches/tasks/2026-09-30-flash/COLOUR-ROLES.md),
§5). Decide each one when you next change that drawing.

A subject that moves in a new way: run it through `tools/motion.py` early, not
at the end. When you extend the grammar, extend it here, and add the check to
`tools/artcheck.py`, so the next person inherits it.

## Where the art comes from

- The four timekeepers in `watches/public/timekeepers/` are **source files:
  edit them directly.** Do not regenerate them with the animation-style task's
  `reline.py`: it writes into the task's own copy of the art.
- `watches/public/diving-board.svg` is **generated**: edit
  `watches/art/diving_board.py` and run it.
- The watch is not an SVG. It is drawn live in WebGL ([webgl.md](webgl.md)),
  from `watches/watch/design.json`, which `watches/art/watch_design.py` writes.
