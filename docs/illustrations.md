# Illustrations — "Line, weighted"

Deep blue line work on the card panel, for every STEM talk. The examples are the
four timekeepers in `watches`:
`watches/public/timekeepers/{sundial,water-clock,candle,hourglass}.svg`.

**The style is a grammar, not a look.** All of it is a stated size, a palette, a
stroke ladder and a habit about what moves. Follow those four and a new drawing
will read as another drawing by the same hand — which is the entire job the art
does.

```bash
# in stem/
.venv/bin/python3 tools/artcheck.py path/to/new.svg    # box, palette, ladder, floor, opacity
.venv/bin/python3 tools/contact.py path/to/new.svg   # look at it, pinned per frame
.venv/bin/python3 tools/barroom.py path/to/new.svg   # can the back row see it
.venv/bin/python3 tools/motion.py path/to/new.svg    # can it see the thing that MOVES
```

## The grammar

**Size.** Each file states the size a slide shows it at, in CSS px: its `width`
and `height`. Its `viewBox` is its own drawing units, with the same aspect ratio.
One unit is `width / viewBox width` CSS px, and the tools render and measure the
drawing at that size. The timekeepers are drawn in a 240 × 190 box and shown at
122 × 97 (`width="122" height="97" viewBox="0 0 240 190"`), so one unit is
**0.508 CSS px**. For a new drawing, the simplest choice is a `viewBox` of the same
size as `width` and `height`: then one unit is one CSS px.

If a slide shows the drawing at another size, change `width` and `height` to match
and run the checks again. Everything below is in CSS px as shown.

**Palette.** Four colours, each with a job. Nothing else. The theme sets them
(`themes/ledger/styles/ledger.css`), and `tools/lib.py` reads them from there:
`--palette-art-line`, `--palette-muted`, `--palette-ink` and
`--palette-art-knockout`, in the order of this table.

| colour    | job                                                                  | on panel |
| --------- | -------------------------------------------------------------------- | -------- |
| `#143C6B` | primary line work: the subject's own structure. Also as a faint fill | 9.60:1   |
| `#736A60` | secondary structure: the stand, the frame, the thing holding it up   | 4.58:1   |
| `#2A2520` | tertiary detail: tick marks, smoke. Usually at 0.5 stroke-opacity    | 13.10:1  |
| `#D3DCE3` | knockout: a pale face that must read as lit, not as bare paper       | 1.20:1   |

**Which colour, and at what opacity, is decided by the job — not by taste.** The
set has a rule:

| the thing that MOVES |                 | the thing that CONTAINS it |                 |
| -------------------- | --------------- | -------------------------- | --------------- |
| hourglass sand       | `0.85` → 6.45:1 | sundial dial plate         | `0.07` → 1.12:1 |
| sundial shadow       | solid → 9.60:1  | sundial plate wall         | `0.18` → 1.37:1 |
| candle flame         | solid → 9.60:1  | candle wax body            | `0.08` → 1.14:1 |
| water clock water    | `0.60` → 3.38:1 | water clock vessel         | unfilled        |

**The subject of the card is drawn at 0.60–1.0; the thing holding it is drawn at
0.07–0.18.** A subject drawn at container opacity disappears at the back row, and
its animation with it. See the water clock example under "Washes" below.

`#143C6B` is **not** the theme's accent `#1F5FA8`. It is the accent deepened along
its own hue, because the accent is specified for a 37 px numeral and a 3 px line
spends that gate at a size it was never sized for: `#1F5FA8` is 5.56:1 on the panel
and `#143C6B` is 9.60:1, a 1.7× recovery for a colour nobody reads as different.
**An accent is not a line colour.** Do not "fix" this back to the theme accent.

**Stroke ladder.** Four weights as shown, and only these four:

| CSS px | timekeeper units | typical use                                     |
| ------ | ---------------- | ----------------------------------------------- |
| 2      | 4 (2.03 px)      | interior detail: hour bands, graduations, ticks |
| 2.5    | 5 (2.54 px)      | (rare — the in-between)                         |
| 3      | 6 (3.05 px)      | the workhorse: primary contours                 |
| 4      | 8 (4.07 px)      | the heaviest outline, used sparingly            |

The hierarchy _is_ the style. Inventing a 2.25 or a 3.5 blurs the steps and the
drawing stops reading as deliberate. `artcheck.py` enforces the ladder, within 5%.

**Motion.** One loop per subject, running forever, with a fixed duration per
subject so two drawings side by side are never compared at different points in
their cycle:

```
sundial 11 s     water clock 8 s     hourglass 9 s     candle 12 s
```

Short overlaid loops are allowed for the things that flicker rather than progress —
the candle's flame is 1.6 s, its two wax drips 3.1 s and 4.3 s, the water clock's drip 1 s.
Prime-ish, unequal durations are deliberate: they stop the four cards from pulsing
in unison.

## Drawing a new one

1. **Decide the size the slide shows it at, and put it in `width` and `height`.**
   Every stroke check depends on it.
2. **Sketch at the weights you will ship.** Not thinner "for now" — the entire
   point of the style is the weight hierarchy, and a whole drawing set once spent
   an exercise ranked last because nobody checked its weights against the room
   until the end. The fix was one number.
3. **Pick the structural line first (3 px, `#143C6B`), then decide what earns
   4 and what drops to 2.** Three levels is usually enough. If everything is 3, the
   drawing is flat; if everything is 4, it reads as clip art.
4. **Give the secondary structure to `#736A60`.** The thing the subject rests on,
   or is held by, is not the subject. That separation is most of what makes these
   read as diagrams rather than icons.
5. **Animate the thing the slide is about**, and see the warning below about what
   survives.
6. **Namespace every `id`.** Contact sheets and comparison slides put many copies
   of a drawing on one page, and shared ids make every copy but the first resolve
   its clips and patterns to the wrong node — the animation looks frozen and the
   cause is invisible. Prefix with the subject: `id="water-clock-upper-clip"`.
7. **Run the three tools.** `artcheck` first (it is instant), then look at
   `contact.py`'s sheet at several times, then `barroom.py`.

## Washes

A faint fill — `fill-opacity="0.18"` — is a **wash**. It is a legitimate device:
it says "water" without shouting, and it is why these drawings read as volumes
rather than wireframes. But a wash is arithmetically invisible at the back row, and
it does not matter how wide or what colour it is:

```
#143C6B on the panel, by opacity        needs 0.55 to hold 3:1
  0.07 -> 1.12:1     0.18 -> 1.37:1     0.32 -> 1.80:1     0.45 -> 2.37:1
#736A60 needs 0.77     #2A2520 needs 0.50     #D3DCE3 never reaches 3:1
```

**So: the drawing must read with every wash removed.** Squint at it; if the shape
goes away, the wash was carrying structure it cannot carry.

**The general rule: put the motion in the marks that survive.** Whatever the
animation is _for_ is the thing that must still be visible after the blur, and a
wash is the first thing to go. `tools/motion.py` is the check — it is the only one
that can see this, because a single frame cannot.

> **Worked example: the water clock.** Draw its eight-second level change in
> `fill-opacity="0.18"` bodies and `0.32` surface discs (1.37:1 and 1.80:1), and it
> passes `artcheck`, and `barroom` gives `hold 2.66 / p90 7.71`: the outline is fine.
> But the **animation** peaks at 2.34:1, with **zero** CSS px² crossing 3:1 between
> states. The shipped art draws the two fills at 0.60 and 0.78 and nothing else
> differs: `dPeak` 7.59, and 658 px² over 3:1. Four other repairs measure better and
> look worse; the comparison is in
> `watches/tasks/2026-09-20-animation-style/water-clock-fix/`.

### Depth order does not hide anything, because the substance is translucent

Drawing the moving substance at `0.85` rather than solid has a consequence that is
easy to miss: **painting something underneath it does not hide it.** An hourglass
stream drawn from the neck to the floor of the lower bulb, with the settled pile
painted on top of it, is in correct depth order — and the dashes still show
straight through the sand they have supposedly landed in.

> **If a mark needs to be hidden, it has to end, or be clipped. Being behind
> something is not enough unless that something is solid.** The hourglass's stream
> now ends at the pile's crest and its `y2` tracks the crest on the same 9 s clock.

The same applies to anything tucked behind a wash: a construction line under the
sundial's plate, an inner contour under the candle's wax. Check it at a late
animation frame with `tools/contact.py`, where these only ever show up.

### A substance in the same hue as its container needs a lightness gap too

The water sits inside a vessel whose outline is solid `#143C6B`. As the water
darkens it converges on that outline until container and contents read as one shape
— which is the one distinction the card exists to show. So a second constraint
applies, on top of the 3:1 floor:

> **≥ 1.4× lightness separation from any same-hue mark it sits inside or against**,
> borrowed from the theme's own accent-vs-second rule, which exists for exactly this
> failure ([theme.md](theme.md)).

For `#143C6B` on the panel the two constraints bracket a window:

```
  alpha   colour     vs panel   vs the outline
   0.18   #CACECE      1.37:1       7.01x   below the floor
   0.55   #788CA1      2.99:1       3.21x   at the floor
   0.60   #6D839B      3.38:1       2.84x   OK                   <- shipped
   0.85   #35577D      6.45:1       1.49x   OK, at the edge
   1.00   #143C6B      9.60:1       1.00x   IS the outline colour
```

**The window is 0.60–0.85, and the shipped value sits deliberately at its bottom.**
0.85 measures better on every still-frame score — it was built, as `w6-house-rule` —
and it reads as blue ink rather than as a mostly-transparent liquid. Water is
supposed to look like water; the arithmetic brackets the choice and does not make
it.

## Things that are true of these four and will not be true of the next one

The four existing subjects are all the same shape of problem — **a container with a
level that moves one way.** Sand falls, water drains, wax burns down, a shadow
sweeps. That gave the style a free answer to "how do I draw a substance" and "what
moves", and it means neither question has actually been tested on anything else.

The next drawing will probably break new ground, so expect to extend the grammar
rather than just apply it:

- **Nothing here animates in a way that had to be invented.** All four animations
  are "a level moves one way", and all four now put that level in marks above the
  floor. A subject that moves differently should be run through `tools/motion.py`
  early, not at the end.
- **Nothing here moves across the frame.** Every animation is "something inside this
  outline changes". A subject that travels needs a convention this style does not
  have yet.
- **Nothing here is a path rather than an edge.** Every line is the boundary of a
  thing. A beam, a signal or a flow of control needs a mark that means direction.
- **Nothing here carries a label.** At the card's 122 px a glyph's stems land well under the
  resolution floor — see [legibility.md](legibility.md). A diagram that needs text
  is not a card; it is a full-slide drawing, and that changes the arithmetic.
- **Nothing here has a surface.** No foil, no crinkle, no material. This style
  draws structure, and a subject whose character _is_ its texture will look
  impoverished in it.

When you extend the grammar, extend it here — add the convention to this file and
the check to `tools/artcheck.py` — so the next person inherits it.
`watches/tasks/2026-09-20-animation-style/README.md` §13 works four candidate subjects
through this in detail, and is the one place in `tasks/` worth reading while
building rather than while re-deciding.

## Regenerating, and where the art came from

The four SVGs in `watches/public/timekeepers/` are **source files:
edit them directly.** Do not regenerate them with `reline.py` from the animation-style
archive: it writes into the archive's own copy of the art, not into the live deck.

The cover's skeleton watch, `watches/public/cover/skeleton-watch.svg`, is the
exception. Its gear teeth, spirals and keyframes are computed, so its source is
the script `watches/art/skeleton_watch.py`: edit that, not the SVG, then run
`watches/art/validate_skeleton_watch.py`, which regenerates the SVG and checks it.
