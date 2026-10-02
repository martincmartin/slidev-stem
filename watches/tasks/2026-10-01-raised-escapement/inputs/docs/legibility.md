# Legibility: how "is this big enough?" gets settled

**Covers:** the design venue, the resolution and contrast floors, room light,
how to read the metrics of `barroom.py` and `motion.py`, text sizes, and how
the metrics can mislead.
**Read before** you decide whether something is big, thick or dark enough, or
read a back-row measurement.
**Tasks:**
[`watches/tasks/2026-09-20-animation-style/`](../watches/tasks/2026-09-20-animation-style/README.md)
(§3 the constraint, §8.1–8.2 the method and the venues, §9),
[`watches/tasks/2026-09-23-followups/`](../watches/tasks/2026-09-23-followups/PLAN.md)
(each SVG states its display size).

Every threshold in these docs comes from one question: **can the back row of a bar
read this?** This file is the arithmetic that answers it. The tools that check
new work against it are in [`../tools/README.md`](../tools/README.md).

The short version: **design for a 55-inch TV seen from 7 metres.** Marks thinner
than **1.64 CSS px** are below the eye's resolution limit there, and marks under
**3:1** contrast are below the floor at which they are worth drawing at all.

## The canvas, and the size a drawing is shown at

Slidev's canvas is **980 × 552 CSS px**. The floors below come from the canvas
and the venue alone, in CSS px, and hold for every slide.

A drawing is different: its lines are drawn in its own units (its `viewBox`), and
how thick they are on the slide depends on how large the slide shows it. So **each
SVG states the size a slide shows it at**, in its `width` and `height`, and the
tools read it from there. One unit is `width / viewBox width` CSS px.

The timekeepers in `watches` are drawn in a 240 × 190 box and shown at
**122 × 97** (12.4% of the frame width), so one unit is 0.508 CSS px: a 2-unit line
is one CSS pixel, and a 16-unit numeral is 8 CSS px tall. The same file shown at
61 px wide would halve every line.

## The venue, which nobody has seen

Guesses, because the real one was never learned — which is the point. Design for
the row you cannot rule out.

```
                screen   back row   mm/CSSpx   arcmin/CSSpx   thinnest resolvable mark
laptop           0.31 m     0.55 m      0.32       1.98              0.51 CSS px
TV 55in @5m      1.22 m     5.00 m      1.24       0.86              1.17 CSS px
TV 55in @7m      1.22 m     7.00 m      1.24       0.61              1.64 CSS px   <- design here
projector @6m    2.00 m     6.00 m      2.04       1.17              0.86 CSS px
```

**A 55-inch TV is the hostile case, not the projector**, and a back room in a bar
is far likelier to have a telly than a projector. One arcminute is a good eye's
resolution limit; at 7 m on a 55-inch screen one CSS px falls below it.

These four rows are the `Venue`s in `VENUES` in `tools/lib.py`, and
`DESIGN_VENUE` names the one to design for. The stroke floor is computed from it.
**The day the venue is known, add it as a `Venue`, make it `DESIGN_VENUE`, and
re-run `tools/barroom.py` — that is the entire cost of re-deciding anything
here.**

## The two floors

**1.64 CSS px — the resolution floor.** Thinner than this and the eye cannot
resolve the mark at all, whatever its contrast. This is why the stroke ladder
starts at 2 CSS px.

**3:1 — the contrast floor.** WCAG's threshold for non-text graphics. Below it a
mark costs attention and returns nothing, which is worse than not drawing it.

Both floors apply to the mark as it is actually painted, which means **opacity
counts**. A 3 px line at `stroke-opacity="0.3"` clears the first floor and fails
the second. See the wash table in [illustrations.md](illustrations.md).

## Ambient flare, and the ceiling it puts on everyone

Room light lands on the screen and **adds** to every pixel: `lin' = lin + F`. Two
consequences, and the second is the one worth internalising.

**Do the arithmetic in linear light.** Blurring 8-bit sRGB — what image libraries
do by default, and what most "simulate distance" hacks do — is the wrong average
and shifts edge luminance. In linear light, blur and flare commute, so the order
is not a hidden assumption.

**Flare caps what _any_ design can reach.** Because contrast is a ratio, a perfect
black-and-white image tops out at `1.05 / (F + 0.05)`:

```
F = 0.05 -> 10.5:1        F = 0.20 -> 4.2:1
F = 0.10 ->  7.0:1        F = 0.29 -> 3.0:1  <- the floor is now unreachable
F = 0.15 ->  5.3:1        F = 0.35 -> 2.6:1     BY ANY DESIGN WHATSOEVER
```

So "how does this do at 35% flare" is not a design question; it is a question about
a room in which nobody can present anything. **The useful number runs the other
way:**

> **Fmax — the ambient flare at which this mark falls through 3:1, with the
> venue's acuity blur already applied.** A property of the design, in units of how
> much room light it can take. 0.30 is the physical ceiling.

Fmax is the number to shop venues with, and the one to quote when someone asks
whether a choice is safe.

## Reading the metrics

`tools/barroom.py` reports `hold`, `p90` and `Fmax` for each drawing at each venue.
The current numbers for the watches timekeepers are in
`watches/docs/measurements.md`, as an example of a set that clears the gate.

**Read `hold` with `p90`, never alone.**

- **`hold`** is the _median_ contrast of every drawn mark after the blur: how much
  of the drawing survives. It is deliberately edge-weighted, because a thin line
  really is mostly antialiased edge.
- **`p90`** is the same at the 90th percentile: whether _anything_ survives.
- The gap between them is the finding. `hold 2.66 / p90 7.71` does not mean a
  drawing is invisible; it means **its outline is fine and its washes are gone**,
  so at the back row the drawing reduces to line work.

**Measure per drawing, not per set.** An average over a set can clear the gate
while one member fails it.

**Treat a difference under about 0.15 in `hold` as noise.** Where a drawing's
edges fall on the pixel grid changes the anti-aliasing, and so the numbers. The
same candle drawn 0.2 px lower measured `hold 3.51` and `Fmax 0.066`, against
`3.63` and `0.078` (2026-09-23). At the venue, Slidev scales the whole canvas to
the screen, so that sub-pixel position is effectively arbitrary.

### And measure the animation, not just the drawing

`barroom.py` reads one frame, so it cannot see a drawing that is legible and moves
invisibly. `tools/motion.py` renders two animation times through the same blur and
flare and compares them per pixel:

```
dPeak      the largest contrast between a pixel's two states
px2 >=3:1  how much of the drawing changes by at least the non-text floor
```

**The signature to recognise is area at 1.2:1 and nothing at 3:1** — a wide, weak
change, which means the thing that moves is drawn in marks the room cannot resolve.
A drawing can measure `p90 7.71` as a still frame and still animate at
`dPeak 2.34`, with **zero** px² over 3:1. Only `motion.py` can see that.

**Picking the two times is the trick.** Sample half the longest animation apart, so
the animation you care about is at opposite extremes. When that separation is a
whole number of a _shorter_ animation's periods, the short one lands at an identical
phase in both frames and cancels exactly — the water clock's 1 s drip cancels at a
4 s separation, leaving only the 8 s level. `motion.py` computes this per file and
says which sub-animations cancelled and which are still in the numbers.

## Text sizes

From the same arithmetic, applied to type. A common back-row guideline is 1/30 of
frame height, which on a 552 px canvas is ≈ 18 px.

| element                       | size  | note                                                   |
| ----------------------------- | ----- | ------------------------------------------------------ |
| slide title                   | 37 px | serif, 600                                             |
| card stat (the one number)    | 37 px | mono, 600, accent                                      |
| card name                     | 29 px | serif, 600                                             |
| card problem line             | 20 px | 600 — counts as "large text" for contrast purposes     |
| card unit, date, body         | 17 px | **the floor.** Below this, contrast gates get stricter |
| credits and similar reference | 14 px | reference only; never content                          |

**17 px is a floor with a history**: the cards were built at 14 px, which is 2.5% of
frame height against that ≈18 px guideline, and it was raised. Do not go back.

**Text inside a small illustration does not work.** On the timekeeper card (a
240-unit box shown 122 px wide) a 16-unit glyph is 8.1 CSS px with stems around
0.9 px — well under the 1.64 px floor, so it reads as a mark and not as a digit. This was measured, not assumed: a drawing set that added
reference numerals measured _worse_ on every score, because the numerals and their
leader lines were drawn at the very bottom of the weight hierarchy. **A diagram that
needs labels is not a card. It is a full-slide drawing**: it is shown larger, so
its file states a larger size, and every number on this page changes with it.

## When to check

The commands are in [`../tools/README.md`](../tools/README.md). **If the
drawing animates, `motion.py` is not optional**: it is the only check that can
tell you the animation is invisible.

**Run `barroom.py` on the first day of a new drawing, not the last.** Every failure
it finds is cheap to fix while the art is still being drawn and expensive
afterwards.

## Three ways these metrics can mislead you

All three were found by using them, and all three cost a wrong conclusion first.

**1. `hold` can be raised by deleting content, so never optimise it directly.** It
is a median over pixels counted as "ink" at ≥ 1.5:1. A wash at 1.37:1 falls _below_
that cut, so it is not counted at all — meaning a repair that makes a wash fainter
_raises_ `hold` while removing the thing from the drawing. One of the rejected water
clock repairs scored `hold 5.05` by leaving the water at 0.18 and thinning it out of
the count; on the back-row sheet its bowls look empty. **`hold` is a diagnostic, not
an objective.**

**2. Fixes that each raise a median do not compose.** Two repairs that individually
took `hold` to 5.39 and 5.05 measured **4.35 together** — worse than either. A median
over marked area is not additive: one repair wins by making a large area strongly
contrasty, the other by removing weak area from the count, and doing both leaves a
large area at a middling value. Measure the combination; do not assume it.

**3. A hatch is a much weaker tint than the same fraction as opacity.** Alpha
composites in sRGB; blur averages in **linear** light. 50% coverage of solid ink
blurs toward **1.81:1** where `fill-opacity="0.5"` of the same ink gives **2.65:1**,
and a _fully_ blurred hatch needs **74% coverage** to hold 3:1. A hatch only beats
that when its pitch is coarse enough to stay partly resolved at the viewing distance
— which is a property of the size the drawing is shown at, not of the technique.
Re-check it if that size changes.

## Two things to know before you conclude a drawing has failed

**Weight failures and palette failures look identical on screen and are not the
same problem.** Before redesigning anything that fails, scale its stroke widths and
re-measure:

- If scaling fixes it, the idea was fine and it was drawn too thin. **Do not ship
  the multiplier** — uniform scaling preserves a ratio that was never the point and
  lands the heaviest line somewhere absurd. Remap the span instead, so its bottom
  clears 1.64 px and its top stays light.
- If scaling barely moves it, the problem is the palette, and no amount of ink will
  fix it. That is a redraw or a different idea.

**A texture has a coverage floor, not just a pitch floor.** A hatch fine enough to
read as tone needs enough ink within the pitch to tint _with_. "Disappears into
grey" is a texture working; "disappears into nothing" is a texture failing, and the
difference is one number.
