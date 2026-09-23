# Water clock — the animation the back row cannot see

**Date:** 2026-09-21
**Status:** CLOSED. Eight options built and measured; **W1 shipped 2026-09-21.**

> **The decision, and it was not my recommendation.** I ranked W7 first because its
> opacity was derived rather than chosen. The user picked **W1**: _"the water surface
> is so dark on W7 it doesn't look like water, but rather blue ink or other
> not-mostly-transparent liquid."_ That is the right call, and the ranking had no way
> to reach it — both sit inside the same derived window (§2), and **the arithmetic
> brackets the choice without making it.** W7's surface disc is 6.45:1 and W1's is
> 5.36:1; the difference between "water" and "ink" lives in that gap. §6 and §7 are
> left as written, because a ranking edited after the verdict records nothing.

```bash
# flip through all eight on the real slide, then the two evidence sheets
npx slidev tasks/2026-09-20-animation-style/water-clock-fix/deck/slides.md

# the numbers (these run against the live framework in watches/tools/)
.venv/bin/python3 tools/barroom.py tasks/2026-09-20-animation-style/water-clock-fix/variants
.venv/bin/python3 tasks/2026-09-20-animation-style/water-clock-fix/tools/motion.py \
    tasks/2026-09-20-animation-style/water-clock-fix/variants/*/water-clock.svg
.venv/bin/python3 tasks/2026-09-20-animation-style/water-clock-fix/tools/sheet.py
```

---

## 1. The defect, and a correction to how it was first reported

The shipped water clock draws its entire eight-second level change in
`fill-opacity="0.18"` (the body) and `"0.32"` (the surface disc) — **1.37:1 and
1.80:1** on the card panel, against a 3:1 floor. The outline is solid and fine.

**I previously wrote that the card "does not appear to move at all" from the back
row. That was an overstatement, and measuring it directly is what showed it.** It
was inferred from the wash contrasts, not measured. What is actually true:

```
                       dPeak   dP99     CSS px^2 changing between the two level states
                                        >=1.2  >=1.5  >=2.0  >=3.0
  shipped water clock   2.34   2.13      1776   1148    179      0
  every fix below       7.6-9.6          ~1700-1900     ~600-1300  576-961
```

The level change is **present but weak**: it peaks at 2.34:1, and **not one pixel
of the card crosses the 3:1 floor** between the full and half-drained states, where
every fix puts 576–961 CSS px² over it. So the honest claim is "the motion is there
and three to four times weaker in contrast than it should be, with nothing above the
floor," not "it is invisible." `docs/illustrations.md` carries the overstated
version and should be corrected when a fix lands (§8).

**That correction needed a metric that did not exist.** `barroom.py` measures one
frame, so it is structurally blind to a drawing that measures acceptably and
animates in marks that do not. `tools/motion.py` here renders two animation times,
applies the same venue blur and flare, and compares per pixel.

> **One piece of experimental design worth keeping.** The card has two animations:
> the level (8 s) and the drip (1 s). Any pair of times **4 s apart** puts the drip
> at an identical phase in both frames while putting the level at opposite extremes,
> so the pairs (0,4) (1,5) (2,6) (3,7) isolate the level and report nothing about the
> drip. All numbers here are the mean over those four pairs.

**What I do not know:** the psychophysical detection threshold for slow, large-area
motion at 7 m. The 1.5:1 band is borrowed from `barroom.py`'s mark-detection
threshold so the two tools agree with each other; it is not a measured limit. That
does not affect the comparison — every variant is scored identically, so the
**order** is trustworthy even though the absolute cut is a convention.

---

## 2. Two constraints that bracket the answer before any drawing

Both fall out of arithmetic, and together they decide most of this.

**(a) There is no light "water" colour in this palette.** A mark has to reach 3:1
on the panel, and within the four drawing colours that means:

```
  #143C6B  needs alpha >= 0.55      #736A60  needs alpha >= 0.77
  #2A2520  needs alpha >= 0.50      #D3DCE3  never reaches 3:1 at any alpha
```

So anything that reads as a pale tint is below the floor **by construction**. The
shipped 0.18 was never going to work, whatever it was drawn in.

**(b) The water is the same hue as the vessel it sits in, so it also has an upper
bound.** The vessel outline is solid `#143C6B`. As the water darkens it converges on
that outline and the container/contents distinction — the entire subject of the card
— collapses. The theme's own accent-vs-second rule uses **≥ 1.4× lightness
separation** for exactly this failure, so borrowing it:

```
  alpha   colour    vs panel   vs outline
   0.18   #CACECE     1.37:1      7.01x   too light: below the floor
   0.55   #788CA1     2.99:1      3.21x   too light, just
   0.60   #6D839B     3.38:1      2.84x   OK
   0.65   #627A95     3.83:1      2.51x   OK
   0.85   #35577D     6.45:1      1.49x   OK, at the edge
   1.00   #143C6B     9.60:1      1.00x   IS the outline colour
```

> **The window is alpha 0.60 – 0.85.** Below it the water fails the room; above it
> the water and the vessel become one shape. The shipped drawing sits at 0.18, a
> long way under.

---

## 3. The eight options

Only the water changes in every one. Vessel outlines, spout, drip and graduations
are byte-identical to the shipped drawing, so this is a controlled comparison in the
sense §4 of the parent archive means it.

|        | option             | what it does                                                                                                                                   | Δ lines |
| ------ | ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| **W0** | baseline           | the shipped drawing, for reference                                                                                                             | —       |
| **W1** | opacity raise      | body 0.18→0.60, surface 0.32→0.78. Smallest edit that clears the floor                                                                         | 9       |
| **W2** | surface as a line  | body untouched; the surface disc becomes a solid 6-unit **stroked** ellipse, drawn like the vessel rims                                        | 5       |
| **W3** | level contours     | water as five solid 4-unit arcs per vessel, switching on/off across the cycle, plus a stroked surface. The Patent set's water, in this palette | 23      |
| **W4** | hatched body       | body becomes solid 4-unit lines on an 8-unit pitch (50% coverage); surface raised to 0.78                                                      | 12      |
| **W5** | both               | W1's body **and** W2's stroked surface                                                                                                         | 9       |
| **W6** | the set's own rule | body 0.85, surface solid — drawn exactly like the hourglass sand and the sundial shadow                                                        | 9       |
| **W7** | derived            | body 0.65, surface 0.85 — both inside the §2 window, with every separation ≥ 1.4×                                                              | 9       |

**Where W6 came from, because it is the most interesting option and not my idea.**
The other three cards already have a rule, and the water clock is the one card
breaking it:

```
  THE THING THAT MOVES              THE THING THAT CONTAINS IT
  hourglass  sand      0.85  6.45:1   sundial  dial plate  0.07  1.12:1
  sundial    shadow    1.00  9.60:1   sundial  plate wall  0.18  1.37:1
  candle     flame     1.00  9.60:1   candle   wax body    0.08  1.14:1
  water clock  water   0.18  1.37:1   <- draws its SUBJECT at container opacity
```

That is the defect stated in the set's own vocabulary, and it is a better
description of the bug than "the opacity is too low."

---

## 4. The measurements

At `TV 55in @7m`, the design venue. Higher is better in every column.

| option          | ink% | hold       | p90      | Fmax      | dPeak    | px² ≥3:1 | bytes |
| --------------- | ---- | ---------- | -------- | --------- | -------- | -------- | ----- |
| W0 baseline     | 21.6 | **2.66** ✗ | 7.71     | **0.000** | **2.34** | **0**    | 2559  |
| W1 opaque       | 26.6 | 5.39       | 8.13     | 0.201     | 7.59     | 658      | 3087  |
| W2 surface line | 17.5 | 5.05       | 8.44     | 0.183     | 8.46     | 680      | 3157  |
| W3 contours     | 20.1 | 5.26       | 8.94     | 0.195     | **9.37** | 874      | 4817  |
| W4 hatched      | 24.6 | 5.57       | 8.41     | 0.209     | 8.51     | **961**  | 3352  |
| W5 both         | 24.6 | 4.35       | 8.65     | 0.140     | 9.08     | 576      | 3145  |
| W6 house rule   | 26.7 | **7.43**   | **9.58** | **0.270** | **9.60** | 713      | 3141  |
| W7 derived      | 26.6 | 6.37       | 8.44     | 0.239     | 8.43     | 682      | 3440  |

For scale: the deck's four cards average `Fmax 0.086`, and the top-ranked drawing
set in the parent archive reaches 0.254. **Every option here would make the water
clock the most robust card in the deck**, which is a sign of how far under the
floor the shipped version sits rather than of how good these are.

### Four things the measurements said that I did not expect

**1. W2 scores well by deleting the water, and `hold` rewards it.** W2's `hold`
jumps to 5.05 and its `ink%` _drops_ to 17.5. The reason is that `barroom.py` counts
a pixel as "ink" at ≥1.5:1, and the untouched 0.18 body is 1.37:1 — **below the
detection threshold, so it stops being counted at all** and the median is taken over
the line work alone. The metric improved because the water stopped existing as far
as the metric was concerned. On the back-row sheet W2's bowls look empty. **`hold`
is not a safe objective to optimise directly**, which is the general lesson.

**2. Combining two fixes measured worse than either alone.** W5 = W1 + W2, and it
lands at `hold 4.35 / Fmax 0.140`, below both parents (5.39/0.201 and 5.05/0.183).
`hold` is a median over marked area, so the two fixes compete for the same pixels:
W1 wins by making a large area strongly contrasty, W2 by removing large weak areas
from the count, and doing both gives a large area at a _middling_ 3.38:1. Fixes that
each raise a median do not add.

**3. A hatch is a much weaker tint than the same fraction as a wash.** Alpha
composites in sRGB; blur averages in **linear** light. 50% coverage of solid ink
blurs toward 1.81:1 where a 0.5 alpha wash gives 2.65:1, and a fully-blurred hatch
needs **74% coverage** to hold 3:1. W4 still measures well (`Fmax 0.209`) only
because at this card size the 8-unit pitch is not fully blurred — 4.07 CSS px
against a 1.64 px blur — so the line cores survive as marks. **That is a size
coincidence, not a principle**: the same hatch on a smaller card would collapse.

**4. The best numbers are the worst drawing.** W6 wins every still-frame column —
`p90 9.58` is the physical maximum for this ink on this panel — and it is the option
I would ship last. Its surface disc is solid `#143C6B`, i.e. **exactly the vessel
outline colour**, 1.00× separation. On the sheet the bowl's lower contour disappears
into the water, the surface stops reading as a surface, and the grey graduation marks
sink. It is the clearest case I have hit of a metric maxing out precisely where the
drawing starts to fail, and it is why §2(b) exists.

---

## 5. What they look like

`evidence/variants-near.png` — all eight at 122 px at t = 0, 2, 4, 6 s.
`evidence/variants-backrow.png` — the same pixels at the design venue with 10%
ambient flare. **Read the far sheet first; the near one only shows what it costs.**

- **W0** the water is a pale grey presence; the level change is there if you know to
  look for it. Elegant up close, weakest thing on the slide from the back.
- **W1** clean. Medium blue body, distinctly darker surface band, vessel outline
  clearly separate. Reads as water immediately.
- **W2** the bowls look **empty** — a faint tint and a floating ring. The waterline
  moves but there is no water. Fails at conveying the subject while passing the gate.
- **W3** handsome and the most distinctive, but it reads as a different set: stacked
  level lines are the Engraved/Patent idiom. It also makes the level **step in five
  jumps** on a slide whose title is "time was a _flow_".
- **W4** strong and graphic, but the horizontal stripes read as a texture applied to
  water rather than as water, and it is the busiest option on a card 122 px wide.
- **W5** fine, but it is W1 with a redundant extra line and worse numbers.
- **W6** unmistakable from the back and visibly heavy up close; container and
  contents merge, which is the one distinction the card exists to show.
- **W7** the water is unmistakably water, the surface reads as a surface, and the
  vessel is still a line drawing. In situ it has the same visual weight as the
  hourglass's sand, so the four cards read as one set.

---

## 6. Ranking

Ranked on: **(a)** does the motion survive the room, **(b)** does the card still say
"water in a transparent vessel", **(c)** does it still belong to this drawing set,
**(d)** how much of the drawing had to change.

| rank  | option              | why here                                                                                                                                                                                                                                                                                                                                                                                                      |
| ----- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **W7 derived**      | Every number comfortably clear (`hold 6.37`, `Fmax 0.239`, `dPeak 8.43`, 682 px² over 3:1), and it is the only option whose opacity is **derived from two stated constraints rather than chosen by eye**. Body 0.65 is 3.83:1 on the panel and 2.51× from the outline; surface 0.85 is 6.45:1, 1.69× from the body and 1.49× from the outline. Nine changed lines, no new primitives, no new colours.         |
| **2** | **W1 opaque**       | Within noise of W7 on everything that matters and one notch lighter. The honest statement is that W1 and W7 are the same idea at two points inside the same window, and **if you prefer W1's lighter water, take it** — it is defensible on exactly the same grounds. It is second only because its 0.60/0.78 were picked before the window was derived and its surface separation is the slimmer of the two. |
| **3** | **W4 hatched**      | Best motion area of any option (961 px²) and strong numbers, but it survives on a size coincidence (finding 3), adds a primitive the set does not otherwise use, and is busy at card size. Worth keeping in mind for a **larger** drawing, where a hatch has room.                                                                                                                                            |
| **4** | **W6 house rule**   | Best measurements in the archive and the most interesting argument — it is the set's own rule, applied. Ranked here only because that rule collides with the fact that this card's container is the same hue as its contents, which the hourglass and sundial do not have to deal with. **W7 is W6 with that collision resolved**, which is the cleanest way to see the two.                                  |
| **5** | **W3 contours**     | Measures well and looks good, but it changes the idiom and turns a flow into five steps. It is a genuinely different drawing, not a fix — reach for it only if the whole set were moving toward a technical register.                                                                                                                                                                                         |
| **6** | **W5 both**         | Strictly dominated: worse numbers than W1 for more change, and the extra stroked surface is redundant once the body is opaque. Kept because "combine the two fixes" is the obvious thing to try and it is useful to have the evidence that it is wrong.                                                                                                                                                       |
| **7** | **W2 surface line** | Passes every gate and **fails the purpose**. It is the counterexample that shows `hold` can be gamed by removing content. Kept for that.                                                                                                                                                                                                                                                                      |
| **8** | **W0 baseline**     | The defect.                                                                                                                                                                                                                                                                                                                                                                                                   |

---

## 7. Recommendation — as written before the decision. W1 was chosen; see the top

**Take W7.** Body `fill-opacity` 0.18 → **0.65**, surface disc 0.32 → **0.85**, four
attribute values in one file, nothing else touched.

It is the only option where the number came from the constraints instead of from my
eye: **≥ 3:1 against the panel** sets the floor, **≥ 1.4× lightness against the
same-hue vessel outline** sets the ceiling, and 0.65/0.85 sits inside both with the
surface separated from the body by 1.69×. It fixes the actual defect (`dPeak` 2.34 →
8.43, and 0 → 682 CSS px² crossing 3:1), it makes the water clock consistent with how
every other card in the set draws its moving substance, and it costs nine lines and
no new colours, weights or primitives.

**If you want it lighter, take W1** — same idea, lower in the same window, and I
would not argue. **Do not take W6** despite its numbers, for the reason in finding 4.

**What I am not certain about.** Whether 0.65 or 0.60 or 0.70 is best is a matter of
taste inside a window the arithmetic can only bracket, not resolve — and the window
is 0.60–0.85, so anything in it is defensible. I also do not know whether the
slightly heavier water changes how the four cards balance as a group on the slide;
slide 9 of the judging deck is the place to judge that, and it is your call.

---

## 8. Accepting a fix — what has to change outside `tasks/`

Nothing here touches the live deck. To ship W7:

**Done on 2026-09-21, with W1:**

```bash
cp .../variants/w1-opaque/water-clock.svg public/timekeepers/line-weighted/water-clock.svg
# header comment then rewritten for a shipped drawing rather than for a variant
python3 tools/artcheck.py && .venv/bin/python3 tools/barroom.py && pnpm build
```

> **2026-09-23:** the live water clock is now `public/timekeepers/water-clock.svg`.
> The live art moved up one directory, out of `line-weighted/`.

> **The archive's own copy was deliberately NOT updated.**
> `tasks/2026-09-20-animation-style/deck/public/timekeepers/line-weighted/water-clock.svg`
> still holds the 0.18 / 0.32 drawing, because §8.3 of the parent archive reports
> set 2 at `hold 3.70 / Fmax 0.086` and those numbers have to keep reproducing. The
> live art and the archive art have now diverged, which is exactly what is supposed
> to happen the first time the framework improves on a frozen decision.

Then three documentation changes, all of which this work earned:

1. **`docs/illustrations.md`** — ✅ the defect box is now a worked example carrying
   the fix, the overstatement is corrected to the §1 numbers, and §3's
   substance-vs-container table is written up as the set's grammar.
2. **`docs/illustrations.md` + `docs/theme.md`** — ✅ §2(b) is a house rule in both:
   _same-hue marks need ≥ 1.4× lightness separation_, stated generally in theme.md
   and with the worked window in illustrations.md.
3. **`docs/legibility.md`** — ✅ findings 1–3 of §4 are a new section, "Three ways
   these metrics can mislead you"; the measurements table and the tool list are
   refreshed.

### The structure held up, with three exceptions worth recording

You asked whether this could be done without touching anything outside `tasks/`. It
could, and was — the live `tools/` were read-only inputs and `docs/` answered the
questions it was supposed to. Three things did not work:

- **A genuinely new criterion has no home in `tasks/`.** ✅ **Promoted.**
  `watches/tools/motion.py` is the live version, generalised: it derives the sampling
  times from each drawing's own `dur` values instead of hard-coding the water
  clock's, plans per file rather than pooling, and reports which sub-animations
  cancelled. The copy in `water-clock-fix/tools/motion.py` stays frozen so this
  task's numbers reproduce.
- **`tools/barroom.py` labelled rows by file stem**, so comparing eight variants of
  one subject printed "water-clock" eight times. ✅ **Fixed**: `label_for()` falls
  back to `parent/stem` when a stem repeats within a run.
- **`tools/artcheck.py` read static attributes only**, so W3's contour arcs — which
  start at `opacity="0"` and animate to 1 — were reported as washes. ✅ **Fixed**: it
  drops any attribute an `<animate>` or `<set>` child targets and leaves what moves
  to `motion.py`.

**What the structure got right, on the evidence of this task:** eight variants, a new
metric, a judging deck and the whole argument were built without editing a single
live file, and the live `tools/` and `docs/` answered everything they were supposed
to. All three gaps above were _additions the framework was missing_, not places where
the split got in the way.
