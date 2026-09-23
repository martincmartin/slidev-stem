# Drawing-set style exploration — archive

**Dates:** 2026-09-19 → 2026-09-21
**Outcome: set 2, "Line, weighted."** The live deck renders that set and nothing
else; all sixteen live on here. See **§14** for the decision and what it costs,
**§13** for how to carry these sets to a different talk.

Sixteen style sets were built, none eliminated, all sixteen shown with sixteen
comparison slides so a live audience could pick. **Ranked in §8** once the back row
was measured rather than assumed, and re-ranked on 2026-09-21 when set 5 lost its
reference numerals (§8.9): **9 Linocut** leads the ranking, **5 Patent weighted** was
the recommendation, **15 Guide** once, full-bleed. **Set 2 ranks 6th and was chosen
anyway** — §14, and §12.5 for why that was always allowed.

Sets **2** and **5** were added after the ranking, and they are the most useful
thing in this archive. Each is an unchanged idea whose _execution_ was repaired —
set 2 after someone outside the project picked set 1 on looks alone (§8.7), set 5
because set 4 finished last while having the best subject fit in the deck (§8.8).
Set 5 went from 16th to 1st without anyone redrawing anything, and then to 2nd when
the user removed its numerals and the tiebreak that had won it 1st (§8.9). Their originals stay
in the deck as controls, so the repairs can be judged by eye and not on the
arithmetic's word.
**Purpose of this archive:** so the aesthetic reasoning can be re-opened — for this
talk after audience feedback, or (more usefully) for a different talk that needs
its own illustration language.

> **2026-09-21 — the framework moved, and one number here turned out to be hiding
> something.** Making a new drawing no longer requires this file: the Line-weighted
> grammar, the legibility floors and the tools that check them are in
> `docs/illustrations.md`, `docs/legibility.md` and `tools/`. This archive stays
> frozen so its numbers keep reproducing.
>
> **What the live tools found that this one did not.** §8.3 reports set 2 as
> `hold 3.70` at the hostile venue, which is the **mean over the four drawings** —
> and measured per drawing they are `candle 3.63 / hourglass 4.33 / sundial 4.18 /
water-clock 2.66`. The water clock alone is below the 3:1 gate. Its `p90` of 7.71
> says the outline is fine; what fails is that its entire 8-second animation is drawn
> in `fill-opacity="0.18"` and `"0.32"` washes, which read 1.37:1 and 1.80:1 on the
> panel, so **from the back row that card does not appear to move.** `barroom.py`
> here averages over a set because it was built to rank sets; the live copy reports
> per drawing for exactly this reason. **An average over a set can hide a failing
> member, and did.** The defect is recorded, unfixed, in `docs/illustrations.md`.
>
> **2026-09-23:** the water clock defect was fixed on 2026-09-21. The live art now
> draws the two fills at 0.60 and 0.78 (`water-clock-fix/` has the comparison).
> The live docs and tools have also moved up to the repo root: `stem/docs/` and
> `stem/tools/`.

**This archive is now a frozen snapshot, and self-contained.** As of 2026-09-21 the
live deck renders one set, so `deck/` carries its own copy of the whole experiment —
slides, components and all 24 art directories — and renders standalone:

```bash
npx slidev tasks/2026-09-20-animation-style/deck/slides.md
```

Nothing in `deck/` is referenced by the live talk and nothing in it reaches back into
the project root, so **it keeps working however far the deck in `slidev/stem/watches/`
moves on** — which is the whole point of it existing. It is the live deck of
2026-09-21 minus the title slide, the escapement stub and the credits, plus a
one-slide index. Deleting this directory loses the art as well as the reasoning.

---

## 1. What was being decided

Four drawings — sundial, water clock, candle, hourglass — that appear on one slide
of the watches talk as small cards, animated, illustrating "before clocks, time was
a flow". The question was never "which is prettiest" but **which survives being
122 px wide on a projector in a bar**.

Fourteen sets were built rather than one, because the honest answer is that nobody in
this project has seen the deck in the actual venue, and a comparison the audience
can vote on beats a choice made from a laptop screen. §8 later answers the question
anyway, by simulating the venue instead of visiting it — but a vote still beats it,
and the one outside vote that did arrive is what produced set 2 (§8.7).

---

## 2. Resuming

```bash
# the deck: the sixteen set slides, then the sixteen comparison slides, then the
# dark-deck analysis and the four theme probes, then credits. Numbers shift whenever
# a set is added -- count them, do not trust a number written here.
pnpm dev

# the archive deck: all sixteen sets, the real slide, sixteen blind copies, the probes
npx slidev tasks/2026-09-20-animation-style/deck/slides.md

# what each set IS, as a recipe for drawing something else (S13) -> evidence/set-grammars.txt
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/spec.py

# contact sheet for one set, at chosen animation times
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/contact.py vector 0.2 4 8

# all sixteen at the size that decides everything  -> evidence/grid-all-sets-122px.png
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/grid.py

# structural checks across every set (stdlib only, no browser)
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/check.py

# regenerate set 16 (the only generated set)
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/mkvector.py

# recolour the two dark-field sets into candidate themes, for the probe slides (S7)
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/retint.py

# derive set 2 from set 1: deeper blue, real muted, double strokes (S8.7)
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/reline.py

# derive set 5 from set 4: remapped weights, real textures, NO numerals (S8.8, S8.9)
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/repatent.py

# what the back row of the venue actually sees, scored (S8) -> out/barroom-*.png
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/barroom.py

# is a failing set too thin, or the wrong idea? scale its strokes and re-measure (S8.4)
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/thicken.py
```

`.venv` needs `playwright` (+ `playwright install chromium`), `Pillow` and `numpy`.
`check.py` and `spec.py` need none of them.

**`out/` is scratch and is not committed; `evidence/` is.** Tools write to `out/`,
and the renders an argument here actually cites were copied across to `evidence/`, so
the reasoning stays checkable by someone with no working `.venv`. If a path in this
README says `out/`, re-run the tool above it.

**Every tool reads `deck/public/timekeepers/`**, this archive's own copy of the art —
not the project root's `public/`, which since 2026-09-21 holds only the one set the
live deck ships. So the tools keep working however far the live deck moves on, and
the generators (`reline.py`, `repatent.py`, `retint.py`, `mkvector.py`) now write
into the archive. **`reline.py` is the exception that matters**: it generates set 2,
which the live deck actually ships, so after running it copy the result across:

```bash
cp tasks/2026-09-20-animation-style/deck/public/timekeepers/line-weighted/*.svg \
   public/timekeepers/line-weighted/
```

> **2026-09-23:** the live art moved up one directory, from
> `public/timekeepers/line-weighted/` to `public/timekeepers/`, because the live
> deck ships only one set.

**Start by looking at `evidence/grid-all-sets-122px.png`.** It is all sixteen sets
at the size the deck really renders them, every animation pinned to t = 4 s. Most
of the arguments below are visible in that one image. Then look at
`evidence/barroom-backrow-flare10.png`, which is the same sheet as the back row of
a bar sees it — that one settles most of the arguments.

---

## 3. The constraint that decides everything

Slidev's canvas is **980 × 552 CSS px**. `TimekeeperCard.vue` renders the art at
**122 × 97 CSS px**. Every SVG is authored in a **240 × 190 viewBox**, so:

```
scale = 122 / 240 = 0.508     1 viewBox unit = 0.508 CSS px
```

The legibility floor, derived (derived, then checked in §8 — see §12.1):

```
1080p projector filling a ~2 m wide screen  -> 2000/1920 = 1.04 mm per projector pixel
                                            -> subtends 1 arcmin at 3.6 m
Slidev's 980 CSS px across that same 2 m    -> 1 CSS px = 2.04 mm
2.04 mm at a 6 m back row                   -> 1.17 arcmin
human acuity limit                          ~ 1 arcmin
```

So **one CSS px is roughly the acuity limit at the back row**. A feature needs
about **2 CSS px at full contrast** to be reliably seen, which in the authoring
viewBox is:

> **stroke-width ≥ 4 units. Anything thinner is decoration for the front three rows.**

Halve the effective width again for anything drawn at partial opacity. This single
number killed more ideas than taste did.

---

## 4. The controlled variable: shared geometry

**All sixteen sets use the same geometry, with one documented exception.** Only the
style varies. This is what makes the comparison slides worth showing to an audience
— if the sets also differed in layout, the vote would measure the wrong thing.

> **The exception: the water clock's spout.** Sets 1–5 and 8–14 start it at (126,79),
> which is _inside_ the bowl — the bowl's surface at that height is at x = 134.3.
> Those twelve bury the stub under a heavy outline so it never shows. Sets 15 and 16 —
> and so their recolours, sets 6 and 7 — have no heavy outline and a glow that
> advertised it, so they start the spout at (134.3, 85.2), solved from the wall
> ellipse rather than eyeballed. **The visible exit point (150,97) and the drip at
> x = 150 are identical in all sixteen**, so the comparison is unaffected — only
> the hidden inner stub differs.

If you add a seventeenth set (in `deck/public/timekeepers/<name>/`), copy these
exactly:

```
WATER CLOCK
  upper rim     ellipse cx=120 cy=22  rx=62 ry=18
  upper wall    M58 22 L80 74 A40 12 0 0 0 160 74 L182 22
  upper clip    M54 0 L186 0 L160 74 A40 12 0 0 1 80 74 Z
  spout         -> (150,97)                   [inner end differs, see box above]
  lower rim     ellipse cx=120 cy=120 rx=52 ry=17
  lower wall    M68 120 L76 170 A44 13 0 0 0 164 170 L172 120
  lower clip    M64 100 L176 100 L164 170 A44 13 0 0 1 76 170 Z
  upper surface cy 40->70, rx 54.4->41.7, ry 15.8->12.1     dur 8s
  lower surface cy 164->128, rx 45.0->50.7, ry 14.7->16.6   dur 8s
  graduations   M109 151.6 A49.5 16.2 0 0 0 131 151.6
                M109 163.6 A47.4 15.5 0 0 0 131 163.6
  drip          cx=150, cy 102->130, dur 1s

SUNDIAL
  plate         ellipse cx=120 cy=138 rx=96 ry=36  (+10 unit side wall)
  gnomon        M120 138 L120 56 L174 138 Z        [opaque in every set]
  shadow        base pinned to the gnomon footprint (120,138)-(174,138);
                apex sweeps (199.8,151.5) (186.2,159.1) (167.3,165.0) (144.7,168.7)
                (120,170) (95.3,168.7) (72.7,165.0) (53.8,159.1) (40.2,151.5)   dur 11s

CANDLE
  shaft         x96 y52 w48 h122;  burn clip y 62->152, height 112->22, dur 12s
                group translate 0 -> 0 90            [the two MUST match, see check.py]

HOURGLASS
  bulbs         M86 18 C86 62 113 80 115 95 C113 110 86 128 86 172   (and mirror at 154)
  upper sand    y 20->94, dur 9s
  stream        x ~116-124, y 96->172, must never appear on top of the pile
  pile          3-key animated path, crest tops 170 / 158 / 148, dur 9s
```

The stream rule has **two legitimate implementations**, and a seventeenth set may
use either. Ten sets paint the stream _before_ the pile, so the pile occludes it.
Engraved and Patent paint it _after_ and clip it to above the pile top (an
`…-above` clip whose height animates 170 → 136), because their sand is a stipple
under a paper-coloured knockout mask — painting the stream first would bury it
under that mask. Getting this backwards is invisible at a glance and was a real
bug in both directions at different points.

Durations are fixed per subject (sundial 11 s, water 8 s, candle 12 s, hourglass
9 s) so two sets side by side are never compared at different points in their cycle.

---

## 5. The sixteen sets, and what each was testing

| #   | Set              | Axis it explores                                      | Size    |
| --- | ---------------- | ----------------------------------------------------- | ------- |
| 1   | Line             | baseline: cheapest possible contour drawing           | 9.1 KB  |
| 2   | Line, weighted   | set 1 with its three measured deficits fixed (§8.7)   | 9.1 KB  |
| 3   | Engraved         | tone via hatching; water as stacked half-ellipses     | 14.1 KB |
| 4   | Patent           | technical-drawing clarity at the weights first chosen | 12.6 KB |
| 5   | Patent, weighted | set 4 with its weights and textures repaired (§8.8)   | 13.2 KB |
| 6   | Guide on paper   | set 15's grammar, re-ranked for a light field (§7)    | 12.8 KB |
| 7   | Vector on paper  | set 16's, likewise — blue plotter line work on cream  | 15.5 KB |
| 8   | Bold             | maximum legibility, minimum nuance                    | 7.8 KB  |
| 9   | Linocut          | relief-print marks, CNC-precise not hand-cut          | 12.2 KB |
| 10  | Riso             | two-ink screenprint, multiply blend, halftone         | 13.9 KB |
| 11  | Pop Art          | Ben Day dots, heavy outlines, deck palette            | 12.9 KB |
| 12  | Ciechanowski     | built from his actual WebGL shader                    | 10.8 KB |
| 13  | Shaded           | gradient shading, soft volume                         | 12.9 KB |
| 14  | Photoreal        | feTurbulence material texture                         | 24.3 KB |
| 15  | Guide            | 1981 BBC _Hitchhiker's_ backlit cel graphics          | 13.0 KB |
| 16  | Vector display   | 1977 _Star Wars_ computer displays                    | 15.7 KB |

Sets 6 and 7 sit with the other light line-drawing sets rather than beside the dark
originals they derive from, because that is the company they keep on the slide.

**Sets 4 and 5 are after the _clarity_ of a technical drawing, not after being
recognisable as a patent drawing.** What they borrow is the line-weight hierarchy,
the 45° section hatch and the stipple — the devices a patent plate or an
engineering elevation uses to separate outline from interior from detail in a small
monochrome picture. **Reference numerals, leader lines and dot terminators are
deliberately absent. Set 5 drew them for one day and the user removed them on
2026-09-21; they are not to be added back without the user's explicit direction**
(§8.9). Every comment in `deck/public/timekeepers/patent*/` and in `tools/repatent.py`
says so too, because the USPTO numbering convention is exactly the kind of detail a
later editor restores as a "fix".

Set 12 is worth a note: it is generated from the one lit shader on ciechanow.ski,
`c.rgb *= (0.75 + 0.25 * max(0.0, n_dir.z))` — a flat colour per part scaled only
by how much the surface faces you, nothing below 75 % of base, no lights, shadows,
textures or outlines. That 25 % range is the entire look. If the talk ever adopts
his interactive diagrams for the escapement, this set keeps the illustrations
consistent with them.

Set 16 is the only **generated** set (`tools/mkvector.py`). Edit the generator, not
the SVGs.

---

## 6. Aesthetic trade-offs

These are the decisions worth re-opening. Each records the constraint, the call,
and **what would flip it**.

### T1 — Does a set serve the deck, or does the deck host the set?

The most important one for a future talk. **§7 closes the measurement half of it**; the judgement half is still open.

The deck's field is warm cream (`#FAF7F0`, cards `#F2EEE4`). Ten sets sit on it.
**Two do not:** Guide (`#000000`) and Vector display (`#070A0E`) sit at 18.1:1 and
17.1:1 against the card panel, so they punch holes in the slide. See the last two
rows of the grid image.

We were inconsistent on purpose, and it is worth knowing why:

- **Pop Art was repaletted** from period primaries to the deck's colours on
  request. Its palette was incidental to the style — Ben Day dots and heavy
  outlines survive recolouring. Cost: it loses the period punch. Gain: it sits
  on the slide.
- **Guide and Vector kept their fields**, because for both, the dark field _is_
  the style. Backlit cel animation and a vector CRT are both light-emitting-on-
  black; recolour them onto cream and you have a drawing that merely alludes to
  the source. So the hole was accepted as the price of the style existing at all.

**What would flip it:** if more than one or two dark cards end up on a slide, the
slide becomes a checkerboard and the whole deck should probably go dark instead —
at which point sets 1, 4 and 10 (very light; see the grid) become unusable and the
ranking inverts. The theme-colours archive next door notes Ledger was chosen partly
because it survives _pasted light content_; a dark deck would reopen that too.

### T2 — Reference fidelity vs. 122 px

Three sets copy a specific source. In each case something had to give.

- **Guide bloom.** Real backlit cel glow is optical. The faithful tool is
  `feGaussianBlur`, but a filter on animated content re-renders every frame, and
  set 14 had already established the rule that filters stay off animated elements.
  Used instead: a wide faint stroke under a narrow bright one. Cost: the bloom is
  tighter and more geometric than the original's.
- **Vector hairlines.** The 1977 displays are hairlines; hairlines die at 122 px.
  Primary strokes are 3.6 units (1.83 CSS px) and construction lines 2.2 (1.12) —
  **the only set deliberately under the §3 floor.** The alternative was 4-unit
  strokes, which would have produced a different style that merely referenced the
  same source. The slide's note states the number so the audience's reaction can
  be read against it.
- **Vector see-through.** The originals are true see-through wireframe. At card
  size that reads as a wire cage, not an object. Changed to **near-half arcs
  only**, with these kept as full ellipses because the viewer really would see the
  whole thing: both water surfaces (you look down into an open bowl), both vessel
  rims (an opening, not a hidden back), the sundial's dial rings (markings on an
  opaque face), and the drips (solid marks). Recorded because it is a _deliberate
  infidelity_, not an oversight.
- **Vector corner marks, removed on request.** Each drawing carried four L-shaped
  brackets inset 6 units from the field edge, in the construction colour. The
  intent was CRT frame furniture. What they actually read as at card size is
  **printer's crop marks**: 1.22 CSS px arms 3 CSS px in from an edge that already
  has the card's own 1 px rounded border a few pixels further out, so two pieces of
  chrome compete in the same 5 px band and the outer one wins. The light recolours
  made it worse — with the field rect deleted (T1), the brackets frame nothing.
  Cost of removal: the drawings lose their one cue that they are a _display_ rather
  than a diagram, which now rests entirely on the dark field and the radial scale.
  On the light recolours that cue is gone altogether. 0.8 KB across the four files.
- **Linocut precision.** Asked for CNC-straight lines and regular curves, no
  hand-cut wobble. Removes the medium's human signal; reads cleaner small. The
  same call was then applied to Guide and Vector without being asked, on the
  grounds that the deck should be internally consistent about it.

### T3 — Texture density

A pattern's pitch in viewBox units × 0.508 gives its pitch in CSS px on the card.

```
pitch 8 units -> 4.07 CSS px   reads as distinct stripes
pitch 5 units -> 2.54 CSS px   reads as near-solid tone
below ~2 CSS px                reads as flat tint, and can shimmer
```

Set 14 is the cautionary case: `feTurbulence` supplies genuine stone mottle, clay
grain, walnut figure and sand grit — the one thing flat vector work cannot fake —
for 2.7× the bytes of set 1, and **most of it is invisible at 122 px**. Texture
is a front-three-rows luxury. It is still in the deck because on a large screen it
is clearly the best-looking set, and that may be the right trade in a small room.

### T4 — One substance, one treatment

Originating instruction, about Riso: _"the falling sand is 100 % solid, while the
draining and accumulating sand are stippled. Pick one and use it for all three."_

Generalised into a rule and applied everywhere after: **every instance of one
substance in one drawing gets the same treatment.** In set 15 that meant hatching
all three sand masses rather than a solid stream against textured piles; in set 16,
near-half arcs everywhere rather than mixing.

**Cost, recorded honestly:** the physically better answer is sometimes
inconsistent. A dense falling stream really _is_ denser than a loose pile, and
drawing it that way is more truthful. Legibility-consistency won, because the
viewer has about two seconds and needs "that's the same sand" more than they need
"that sand is denser".

### T5 — How to draw a shadow on a dark field

This bit repeatedly, and produced the most transferable finding.

On a dark field, **"shadow = darker" has a low ceiling.** Measured, for a black
shadow on candidate dial faces:

```
face #08243F  ->  1.33:1      face #15476F  ->  2.16:1
face #0F3559  ->  1.67:1      face #1A5488  ->  2.67:1   (and the dial rings start to wash out)
```

2.67:1 is the _best case_, and it costs the dial's own contrast. Three ways out
were used:

1. **A distinct hue.** Solid grey on Pop Art, Riso and the first Guide attempt
   (3.4:1 against the face, 5.7:1 against the field). Reads as a shadow even
   though it is _lighter_ than the surface, which is physically backwards.
2. **Occlusion of a dense texture.** The final Guide dial is a mesh; the shadow is
   a black wedge that erases the mesh where it falls. The erasure is the cue.
3. **A translucent wash.** Set 16's shadow is red at 20 % opacity, tinting the mesh
   rather than hiding it.

> **Principle: occlusion of texture is a stronger shadow cue than luminance
> difference. If the shadow needs to read, give the surface underneath it a
> texture to be occluded.**

Colour choice followed the source's own semantics rather than realism. In the
Guide's nav screens yellow is the readout, so the sundial's shadow is yellow — on a
sundial the shadow _is_ the reading. In _Star Wars_ red is the active/target
element, so the shadow, the candle's hour rings and the flame are all red.

### T6 — Wireframe volumes need a wash

Pure line work had no presence at 122 px: the water-clock bowls read as empty
baskets. Every volume in set 16 therefore carries a **12 % wash** of the line
colour, and the water's top surface carries **42 %** — a surface seen face-on
catches more light than the body beneath it, and at 18 % it read as a dark lid on
a bright body. This is the one place set 16's style was bent, and it uses the same
device the sundial shadow already needed in T5.

### T7 — 2D vs 3D water clock

An earlier pass tried a genuinely 3D water clock with the bowls offset. Measured
cost: **19 % and 13 % of vessel width** lost to the offset. Settled on a hybrid —
bowls stacked and centred as in the 2D version, with elliptical rims and a side
spout for the 3D read. That geometry is now shared by all sixteen sets (§4).

---

## 7. Follow-up: the dark-deck probe (2026-09-20)

T1 above was left open. This section closes the measurement half of it; the
judgement half is still the user's.

**The question.** Sets 15 and 16 are the only two whose field is not the deck's.
Which of the 23 candidates in the theme-colours archive could host them?

**The move that matters.** Not tinting the black rectangle a nicer colour — _deleting_
it. If the drawing's field is the card's own panel, there is no rectangle: the art
sits on the card like every other set.

```
seam (set field vs card panel)      Ledger today   18.13 : 1     a hole
                                    recoloured      1.00 : 1     no edge at all
```

**Method.** Every candidate was measured as a _host_, which is a different question
from the one the theme archive asked. Its gates are about 37 px numerals and 17 px
body text; these sets are thin strokes, so the binding constraint is **the weakest of
the four line roles against the card panel**. Two filters:

1. Panel luminance < 0.1 — 14 of 23 qualify.
2. The theme archive's own ink-vs-background gate, ≥ 12:1. This eliminates **Harbor**
   (10.5), **Atomic Cocktail** (10.8) and **Blackboard Social** (11.6). Harbor is worth
   naming because it tops every host metric — weakest role 7.0:1, CVD ΔE 88, best flare
   survival — and is disqualified only by a gate set for a different purpose. If the
   deck ever went dark, Harbor deserves a re-look rather than a glance at the table.

**Shortlist** (slides 29–33 in the deck). Four candidates, **ordered by background
colour** rather than by rank: the order is the permutation minimising total adjacent
CIE76 ΔE between backgrounds, brute-forced over all of them — a cool-navy → warm-brown
gradient.

| Theme                   | background      | ink/bg | weakest line | flare@35% | CVD ΔE | watch out for                       |
| ----------------------- | --------------- | ------ | ------------ | --------- | ------ | ----------------------------------- |
| Beacon                  | `#0F1C33`       | 17.0   | 4.8          | 1.66      | 88     | —                                   |
| After-Hours Observatory | `#17202A` ΔE 10 | 14.5   | 4.6          | 1.64      | **90** | —                                   |
| Campfire                | `#241E1A` ΔE 12 | 14.3   | **5.9**      | **1.86**  | 80     | —                                   |
| Marmalade               | `#2B2420` ΔE 3  | 14.1   | 4.7          | 1.70      | **28** | green second; CVD near the 25 floor |

**Campfire** leads the constraint that actually binds — its `muted` role is 5.9:1 where
the others sit at 4.6–4.8 — and survives ambient flare best. **Beacon** has the most
headroom overall and was the theme round's runner-up on its own merits.
**After-Hours Observatory** has the cleanest colour-blind separation.

**Marmalade** is the one to watch: a warm accent beside a green second at ΔE 28, barely
over the archive's 25 gate, and archive insight 9 names Marmalade specifically as one of
the four times that pairing bit the earlier investigation. Because water maps to the
cool colour, it also gives Guide **green water**, which reads more like tea. Not a
defect — a consequence of the rule, and visible on its probe slide so it can be judged
rather than argued about.

**Also built, then dropped** at the user's request: **Blueprint** (16.6 ink/bg, weakest
4.7, CVD 80 — closest to the source material, but accent and second at a 1.03 lightness
ratio), **Night Ledger** (13.1, 4.4, 64 — its warm role is a muted tan that becomes
Guide's primary structure under the warm-led rule, leaving Guide visibly dimmer than
Vector) and **Coffee + Code** (12.2, 4.7, 33 — accent and second at a lightness ratio of
exactly 1.00, separating by hue alone, which archive insight 5 says is what fails first
in a washed-out room). `tools/retint.py` still knows all three keys, so e.g.
`retint.py nightledger` brings one back.

Dropping Night Ledger widens the middle step of the gradient from 5 + 7 ΔE to a single
12 ΔE jump, which is the largest gap in the remaining order — worth knowing if the
point of the ordering is a smooth walk between backgrounds.

**Recolouring rule** (`tools/retint.py`). Every output colour is one of the theme's own
six role colours or a mix of two, so the theme's measured contrast and colour-blind
separation carry over untouched. Roles are assigned so the two sets stay
distinguishable on _any_ theme:

```
Guide  is WARM-led    structure = the warmer of accent/second, liquid = the cooler
Vector is COOL-led    structure = the cooler, whatever-moves = the warmer
```

That is stated in terms of warmth rather than "accent" and "second" because the
candidates disagree about which role is warm — Blueprint's accent is cyan, everyone
else's is amber or gold. Keying off warmth means water is always cool and flame always
warm, whichever way a theme happens to be defined.

**The light branch is not the dark map with hues swapped.** Prominence inverts. On
black the brightest mark dominates; on cream the darkest does. So the roles are
re-ranked, not recoloured:

```
                       dark field            light field (Ledger)
structure              warm / cool           ink        (Guide) / accent (Vector)
liquid body            cool                  accent blue, hatched
liquid surface         ink  (lighter)        ink        (darker than the body)
substance / scale      ink                   second, a brown hatch
hot core, sand crest   mix(ink, warm)        PANEL — unmarked paper
sundial shadow         cool                  muted, a solid mid grey
```

The hot core is the clearest case: the most prominent thing on black becomes _the
absence of ink_ on cream, which is how engraving and linocut have always drawn a
highlight, and what the deck's own light sets already do.

Two values had to be lifted out before substitution, because a colour token cannot
tell a role apart from an identical one:

- Guide's **sundial shadow** is `fill="#000000"`, the same token as the field. On a
  dark theme mapping both to the panel is right — the shadow is a hole in the lit mesh.
  On paper it has to be a solid mid grey instead, matching Pop Art and Riso.
- Guide's **molten wax** (candle topper and drips) is a _solid fill_ of the structure
  token. A bright fill reads as lit wax on black; the same token as ink on cream reads
  as a burnt black cap. Wax is warm on paper.

Both are asserted in `retint.py`, so the build fails loudly if the source SVG changes
under them.

**One thing the light field is better at.** Under 35% additive ambient flare Ledger's
weakest role holds 2.25:1 where every dark candidate falls to 1.64–1.86. Archive
insight 6 found flare roughly symmetric at 60%; at 35% the light field is ahead.

**One measured correction.** Guide's sundial shadow first mapped to `muted`, the
obvious "shadow" choice. On Beacon that is 4.8:1 against a dial mesh at 8.7:1, and it
all but vanished at 122 px. Mapping it to the cool colour instead restores it to 7.2:1
and mirrors Vector, whose shadow is warm against a cool structure. Each set's shadow is
now the opposite temperature to its own line work, which is both legible and consistent
with §6 T5 — the shadow reads by occluding the mesh, not by being dark.

**The cost, which was already measured and has not changed.** Ledger won the theme
round for one reason: code, charts and screenshots are overwhelmingly light-background,
and a bright rectangle in a dim room is worse than a dark one in a lit room (archive
insight 7). Shiki also renders code light unless the headmatter overrides it (insight
8). Going dark to host two illustration sets reopens both.

**A prediction I made here, and then falsified by building it.** I argued that these
two sets exist only because of the emissive dark field, that inverting them onto a light
field would collapse them into Patent, and that the choice was therefore "dark deck, or
drop them both — nothing in between is worth building".

Half of that is right and half is wrong. What a light field genuinely costs is the
**emissive quality**: recoloured into Ledger both sets read as printed diagrams rather
than lit screens, and Vector's structure-over-construction hierarchy compresses from
1.88x to 1.21x because a light field has little room below the ink (archive insight 4).
What it does **not** cost is identity. Neither collapses into Patent. Vector keeps blue
thin-line work, stacked contours and its radial scale; Guide keeps stripe hatching and
opaque interiors. Both are plainly distinct from Patent and from each other — see sets 6 and 7 in the deck.

So there are three live options, not two: keep Ledger and recolour both sets into it,
go dark and have them native, or drop them. The first was the one I wrongly ruled out.

---

## 8. The ranking (2026-09-20, re-ranked 2026-09-21 in §8.9)

**The question asked:** out of all sixteen sets and the theme candidates, which
leaves an audience happiest and likeliest to come back next month? That is not
"which is prettiest", and it is not a single judgement. It is a gate and then a
tiebreak:

- **Gate — can the back row actually see it?** A drawing nobody can parse is worth
  less than no drawing at all: it costs attention and returns nothing.
- **Tiebreak — does it look like a person made this?** Above the gate the art's
  whole job is to signal that someone prepared the evening. That is what brings
  people back. Nobody comes to a meetup for the illustrations, and nobody returns
  to one that felt phoned in.

§3 derived a legibility floor from arithmetic and §12.1 flagged that nobody had
ever checked it against a rendered pixel. `tools/barroom.py` now does.

### 8.1 The method

Two independent things stand between the laptop these were designed on and the
back row of a room nobody has seen. `barroom.py` applies both to the real 122 px
renders, in linear light, and scores what is left.

**Acuity.** One arcminute is a good eye's limit. The venue's screen width and back
row give CSS px per arcmin; blur by a Gaussian of that width.

**Ambient flare.** Room light lands on the screen and _adds_: `lin' = lin + F`.

Doing both in linear light matters twice. Blurring 8-bit sRGB — what PIL does by
default, and what most "simulate distance" hacks do — is the wrong average and
shifts edge luminance. And in linear light the two **commute**, so the order is
not a hidden assumption. Flare is also deliberately **not clipped at white**:
reflected ambient adds to the emitted image, the screen's white really does rise
above its nominal white, and the eye adapts to that new maximum. Clipping invents
a penalty for any style with large bright areas — that is, every light one. (The
theme archive's `lib.contrast()` does not clip either, so the two agree. Its
`sim.py` used a CSS white overlay and overstates damage; that file says to trust
its arithmetic over its pictures. This one's pictures are usable.)

**The flare ceiling, which reframes the whole question.** Because contrast is a
ratio, additive flare caps what _any_ content can reach — a perfect black-and-white
image tops out at `1.05/(F+0.05)`:

```
F = 0.05 -> 10.5:1        F = 0.20 -> 4.2:1
F = 0.10 ->  7.0:1        F = 0.29 -> 3.0:1  <- the 3:1 floor is now unreachable
F = 0.15 ->  5.3:1        F = 0.35 -> 2.6:1     BY ANY DESIGN WHATSOEVER
```

So "how does this style do at 35 % flare" is not a design question; it is a
question about a room in which nobody can present anything. The useful number runs
the other way:

> **Fmax — the ambient flare at which this style's typical mark falls through 3:1,
> with the venue's acuity blur already applied.** A property of the drawing, in
> units of how much room light it can take. 0.30 is the physical ceiling.

Reported beside it: **ink%**, the share of the card carrying any mark (the density
of the style); **hold**, the median contrast of those marks (how much of the
drawing survives); and **p90**, the same at the 90th percentile (how strong its
strongest marks still are — whether _anything_ survives). Median is deliberately
edge-weighted: a 1.5 CSS px line really is mostly antialiased edge. On its own that
reads as a death sentence for work the eye resolves fine, so p90 sits next to it.

### 8.2 Venues

Guesses, because the venue was never learned — which is the point. Design for the
row you cannot rule out.

```
                screen   back row   mm/CSSpx   arcmin/CSSpx   thinnest resolvable mark
laptop           0.31 m     0.55 m      0.32       1.98              0.51 CSS px
TV 55in @5m      1.22 m     5.00 m      1.24       0.86              1.17 CSS px
TV 55in @7m      1.22 m     7.00 m      1.24       0.61              1.64 CSS px
projector @6m    2.00 m     6.00 m      2.04       1.17              0.86 CSS px
```

**A 55-inch TV is the hostile case, not the projector** — and a back room in a bar
is far likelier to have a telly than a projector. At 7 m a 55-inch screen puts one
CSS px below the acuity limit, so **the §3 floor of 2 CSS px is not conservative
there; it is barely adequate.** Set 16 is drawn at 1.12.

### 8.3 The ranking

Measured at `TV 55in @7m`, the hostile case. Ranks **12–16** all have `hold` below
3:1 — they fail the gate as shipped, and the order within them is least-worst, not
good. Ranks 1–7 clear it comfortably, so tone decided those. Sets 1 and 4 are the
unmodified originals of sets 2 and 5, kept in the deck so the repairs can be judged
by eye rather than taken on the arithmetic's word.

**Re-ranked 2026-09-21** after set 5's numerals came out. Only two rows moved, and
they swapped: set 5's numbers _improved_ and its argument for first place was the
thing removed. §8.9 is the whole story; §8.3 carries the result.

| #      | Set                | ink% | hold     | p90       | Fmax      | why it lands here                                                                         |
| ------ | ------------------ | ---- | -------- | --------- | --------- | ----------------------------------------------------------------------------------------- |
| **1**  | 9 Linocut          | 22.5 | 5.56     | **12.95** | 0.207     | top-tier legible _and_ has a hand in it. Rank 1 again, on the tiebreak set 5 gave up      |
| **2**  | 5 Patent, weighted | 19.0 | 6.03     | 11.90     | 0.223     | out-measures Linocut now; lost the argument that beat it. See §8.9                        |
| **3**  | 8 Bold             | 22.9 | **8.54** | 12.90     | **0.254** | the most robust thing here, and the cheapest. Docked only for having no voice             |
| **4**  | 15 Guide           | 18.5 | 7.40     | 11.43     | 0.113     | the one set anyone will describe afterwards — but see §8.6                                |
| **5**  | 11 Pop Art         | 27.0 | 4.86     | 9.30      | 0.169     | densest set, strong numbers, genuinely fun. Borrowed energy: dots aren't horology         |
| **6**  | 2 Line, weighted   | 16.8 | 3.70     | 7.84      | 0.086     | ties Riso and Shaded, beats both on p90 — and it is the shape people actually chose       |
| **7**  | 10 Riso            | 23.0 | 3.68     | 6.89      | 0.089     | the warmest thing here and it clears the gate — on the thinnest headroom of the survivors |
| **8**  | 16 Vector display  | 17.5 | 5.74     | 8.92      | 0.074     | handsome and distinct, but drawn _below_ the acuity floor, and shares Guide's seam        |
| **9**  | 13 Shaded          | 23.2 | 3.77     | 6.57      | 0.089     | clears every gate, says nothing. The definition of inoffensive                            |
| **10** | 14 Photoreal       | 24.7 | 3.43     | 7.62      | 0.078     | clears the gate, pays 2.7x the bytes for texture the room deletes (T3)                    |
| **11** | 6 Guide on paper   | 17.7 | 3.11     | 6.38      | 0.021     | survives, but it is Guide with the reason removed                                         |
| **12** | 3 Engraved         | 10.6 | 2.17     | 3.19      | 0.000     | fails — and §8.8 is the recipe for fixing it, now demonstrated on its neighbour           |
| **13** | 4 Patent           | 8.6  | 2.14     | **2.97**  | 0.000     | the original, kept for comparison: still the worst measurement in the deck                |
| **14** | 1 Line             | 11.7 | 2.27     | 4.17      | 0.000     | the version a real person chose, and the version the room cannot see. §8.7                |
| **15** | 7 Vector on paper  | 15.9 | 2.51     | 3.70      | 0.000     | thinnest strokes, no headroom, and the recolour that lost the most in translation         |
| **16** | 12 Ciechanowski    | 22.3 | 2.65     | 3.31      | 0.009     | the only set that **cannot** be rescued — see §8.4                                        |

**The two most useful lines in that table are 2 and 13, and they are the same
drawing.** Set 4 had the best subject fit in the whole deck — fine, even technical
line work, for a talk about the insides of machines — and it was the only set whose
_strongest_ marks fell below 3:1 at the back row. That is what fine, even line work
does at 122 px across a room. Set 5 is that same drawing with the weights remapped
and the textures given enough ink to read as grey, and it goes from last to second
(§8.8). **The bottom of this table was never a ranking of ideas. It was a ranking of
how much ink each idea happened to be drawn with**, and that is a property of a
number in a file, not of a style.

**What the numbers do not say** is anything about tone, so tone did all the work
between ranks 1 and 5, where every set clears the gate comfortably. Sets 5 and 9 are
as close to a tie as this instrument resolves — set 5 leads on `hold` (6.03 vs 5.56)
and on flare headroom (0.223 vs 0.207), Linocut leads on `p90` (12.95 vs 11.90) —
and Bold out-measures both (0.254). **None of those gaps corresponds to a room
anyone would book**: the 0.016 of flare between set 5 and Linocut separates two
venues that are both already brighter than anywhere a talk gets given. So tone
decides, and tone is why they swapped in §8.9. Between Bold and Linocut the gap is
that Bold reads as clip art and Linocut reads as a print someone pulled. Between
Linocut and set 5 the gap is narrower than it was: Linocut's warmth is borrowed from
a technique that has nothing to do with horology, and set 5's clarity is bought by
having no warmth at all. If the venue turns out to be a lit room with a projector,
take Bold and lose nothing that matters.

### 8.4 Fixable, or not: the thickening test

Rather than assume that the thin-line failures fail _because_ they are thin, scale
every `stroke-width` in a set by k and re-measure. Fmax at `TV 55in @7m`:

```
                 x1.0    x1.5    x2.0    x3.0
3 Engraved      0.000   0.006   0.102   0.257      <- worst to best-equal
4 Patent        0.000   0.000   0.075   0.241      <- worst to second
7 Vector on pap 0.000   0.041   0.120   0.182         helps, but p90 plateaus at 5.7
1 Line          0.000   0.000   0.000   0.041         barely moves
12 Ciechanowski 0.009   0.010   0.012   0.019         does not move at all
9 Linocut       0.207   0.221   0.233   0.242         already near the ceiling
8 Bold          0.254   0.277   0.275   0.277         already at the ceiling
```

**Two different failures wear the same face.** Engraved and Patent fail on _weight_
alone: triple their strokes and they land in the top two, ahead of Linocut. Line and
Ciechanowski fail on _palette and density_, and no amount of ink fixes that — Line's
mid-blue on cream cannot reach the 13:1 ink ceiling no matter how wide it gets, and
Ciechanowski's marks are soft grey-on-grey volume, not strokes at all. Its softness
_is_ the style; the lever does not connect.

That reframes the bottom of the table. **Engraved and Patent are not bad sets, they
are under-inked ones**, and they are the cheapest wins available in this whole
archive. Nobody had done it, because the brief was to compare styles as designed,
not to tune them.

**A correction to the advice above, from actually doing it (§8.8): do not scale,
remap.** Uniform `x3` measures best of anything tried and is visibly wrong — it
lands Patent's heaviest line at 3.81 CSS px, heavier than Bold's modal stroke, so
the drawing stops reading as fine technical line work; and it _still_ leaves the
thinnest line at 1.46, under the 1.64 floor. Scaling preserves a ratio that was
never the point. Remapping the span so its bottom clears the floor and its top stays
light — `[0.96, 2.5] -> [3.4, 7.0]` units for Patent — gets 0.223 against `x3`'s
0.241, for a drawing that still looks like itself. **The thickening test is the right
diagnostic and the wrong prescription.** Use it to find out _whether_ weight is the
problem; do not ship its multiplier.

### 8.5 Theme

The theme question is smaller than it looks, because the interesting finding is a
negative one, and the archive next door got there first.

**Ambient flare does not punish dark themes.** Measured on the decisive ink/background
pairs, unclipped, the dark theme is _ahead_ of the light one at every flare level:

```
                 F=0.00  F=0.05  F=0.10  F=0.15  F=0.20  F=0.29
Ledger (light)    14.18    8.65    6.39    5.16    4.39    3.54
Beacon (dark)     17.01    9.85    7.11    5.67    4.78    3.81
After-Hours       14.45    8.54    6.24    5.02    4.25    3.43
ceiling           21.00   10.50    7.00    5.25    4.20    3.09
```

That is theme-colours insight 6 ("the folklore that light backgrounds are more
robust in bad rooms is not supported by the arithmetic"), now confirmed a second
way — on rendered pixels, with a physically additive unclipped model, rather than
on role colours. **So do not keep Ledger because you fear a lit room.** Keep it for
the reason that archive actually gives: a house theme for many presenters has to
survive other people's pasted light content, and code blocks, charts, screenshots
and papers are overwhelmingly light-background (its insight 7).

Ranked as hosts for this deck: **Ledger**, then **Beacon** (the best dark candidate
— ink 17.0:1, CVD ΔE 88), then **After-Hours Observatory** (ΔE 90, marginally
warmer, slightly less ink), then **Campfire** (warmest, but an accent/second
lightness ratio of 1.23), then **Marmalade** (ΔE 28 against a gate of 25 — too
close to the accessibility line to pick on taste).

Ledger stays, and it stays for the series, not for this talk.

### 8.6 The recommendation

**Set 5, Patent weighted, for the deck. Set 15, Guide, once, full-bleed.**

**The recommendation is no longer the top of the ranking, and that is deliberate.**
§8.3 scores one slide: four cards, seen once, by a room. This recommendation has to
pick the language for _every_ drawing in the talk, including the escapement
diagrams that do not exist yet. Those are different questions and after 2026-09-21
they have different answers. If the escapement is going to be illustrated some other
way — photographs, or an interactive in Ciechanowski's manner — then this section
collapses back into §8.3 and the answer is Linocut.

Set 5 for three reasons, in the order they should be trusted:

1. **It survives the room with the second-most headroom in the deck.**
   `hold 6.03 / p90 11.90 / Fmax 0.223` at the hostile venue; only Bold measures
   better, and Bold has no voice. This one is measured and is not a matter of taste.
2. **It is the only style above the gate that extends to a mechanism.** The talk's
   subject is the escapement. A drawing language whose whole content is a weight
   hierarchy plus a section hatch is the language engineering drawings use for
   mechanisms, and adding a new subject to it means choosing among three stroke
   weights. Linocut's carved marks fight a gear train, and adding a subject to it
   means inventing marks. **This is a projection, not a measurement** — no
   escapement has been drawn in either — but it is the projection this deck's next
   slide will test.
3. **Its register is the talk's register.** "Back of the envelope" is a clarity
   brief. Set 5 looks like someone drafted it; that is a quieter claim than
   Linocut's, and it is the true one.

**What set 5 no longer has**, and it is worth being blunt because it was the whole
argument a day ago: it is not a patent drawing, it is not the joke telling itself,
and it has no reference numerals for the speaker to point at. Those went on
2026-09-21 by the user's explicit direction (§8.9) and are not coming back without
the user's explicit direction. The remaining case is the three reasons above, and
reason 2 is the load-bearing one.

**Linocut is the one to take if you do not want the technical register**, and it is
the one §8.3 now ranks first. Measurements within noise (`5.56 / 12.95 / 0.207`),
and it looks pulled off a press rather than exported from a tool. (Linocut proper is
a 20th-century technique, so it is an evocation of the printed illustration, not a
period reference. It reads as "from a book", which suits a history-of-technology
talk.) Its warmth is borrowed and set 5's clarity is not — but a room full of people
holding a beer is more reliably charmed by warmth than by draughtsmanship, which is
exactly why it is first in §8.3 and second here.

Guide once, because it is the only set in the deck anyone will describe to someone
else afterwards, and it measures third — `Fmax 0.113`, ahead of Riso, Shaded,
Photoreal, both paper recolours and its own recolour by 5x. **The seam is the only
thing wrong with it, and full-bleed makes the seam go away**: T1's whole problem is
a dark card punched into a light slide, and a slide with no card has nothing to
punch. Under room light the objection gets worse, not better — flare lifts the black
field to grey, so a dark _card_ stops reading as a lit screen and starts reading as
a rendering error, while a dark _slide_ just reads as a dark slide.
`evidence/barroom-backrow-flare10.png` shows exactly that in rows 15 and 16 (it
was regenerated on 2026-09-21 with sixteen rows; the note used to say 13 and 14,
from the fourteen-set sheet).

So: one deliberate beat on the dark field, at the narrative pivot, and set 5
everywhere else. That gets the memorable thing without paying the checkerboard price
T1 warned about — and it is the option T1 did not consider, because T1 framed the
choice as all-cards-or-nothing.

**If the venue turns out to be a lit room and a projector**, swap in Bold and lose
only charm. **If someone has an hour**, do to Engraved what §8.8 did to Patent: it is
the last set in the deck that fails on weight alone, it has real craft and the right
period, and the recipe is now written down and demonstrated.

**And if the sparse blue line drawing is simply the one people like** — which is the
only outside evidence this archive has, and it arrived after the ranking was written
— then set 2 is the version of it that survives the room (§8.7). It gives up about
half of Linocut's flare headroom and keeps the thing that was liked. Nothing above
decides that; a room full of people looking at the comparison slides would.

---

### 8.7 Set 1, and the only independent aesthetic evidence in this archive

Everything ranked above the gate in §8.3 was ranked on one person's taste — mine.
Then someone outside the project looked at the grid on a laptop, knowing none of
this, and picked **set 1, Line**, as the nicest looking. §8.3 ranks it 14th of 16.

Both are correct, and the second does not overrule the first. `barroom.py` measures
whether a drawing can be _seen_; it has nothing to say about whether anyone wants to
look at it, and that is the actual question this archive claims to be answering.
A judgement made at 0.55 m is a judgement about the drawing; the venue is a separate
tax on it. So set 1 stays in the deck exactly as chosen, and **set 2 is the same
drawing with its measured deficits fixed and nothing else touched** — so the two can
be compared by eye, which is the only way this gets settled.

**Set 1 has three independent deficits, any one of which would sink it.**

1. **It draws its primary line work in the theme's accent.** `#1F5FA8` is 5.56:1 on
   the card panel; Bold and Linocut draw structure in ink at 13.10:1. Set 1 starts
   **2.36x down before anything degrades**. The accent's gate in the theme archive
   is 4.5:1 and was written for a **37 px stat numeral**; set 1 spends it on a
   1.52 px line. Nothing was violated — a role was used at a size it was not sized for.
2. **Its secondary detail is an invented grey**, `#928E88`, which appears in no
   theme palette and clears no gate in either archive: 2.81:1 on the card panel,
   and **2.34:1 where it matters most** — the sundial's tick marks sit on the dial
   _face_, not on the panel. That is below the 3:1 floor on a laptop, at full
   contrast, before any room is involved.
3. **Its modal stroke is 1.52 CSS px**, under the 1.64 px an eye resolves at
   `TV 55in @7m`. The typical line is below the resolution limit of the venue.

**The obvious fix is wrong, and the picture is what showed it.** Promoting the grey
to ink measures well (`hold` 2.27 -> 2.82, `Fmax` 0.000 -> 0.030) and looks bad: the
grey carries the hourglass frame and the candle plate, so inking it makes the
_secondary_ structure the heaviest mark on the card and inverts the hierarchy.
Inking everything (`hold` 3.41, `Fmax` 0.052) scores better still and stops being
Line at all — its water goes grey. Both are in `evidence/line-rescue-options.png`;
neither is defensible with the sheet in front of you.

**What set 2 does instead** — deepen the blue along its own hue, so the drawing stays
blue-led, which is the thing being preserved:

```
#1F5FA8 -> #143C6B   accent blue -> deeper, same hue    5.56 -> 9.60:1 on the panel
#928E88 -> #736A60   invented grey -> Ledger's muted    2.81 -> 4.58:1  (2.34 -> 3.82 on the dial face)
stroke-width x2      modal 1.52 -> 3.05 CSS px          clears the 1.64 floor

                                   hold    p90    Fmax      (TV 55in @7m)
  set 1, as chosen                 2.27   4.17   0.000
  grey -> ink (hierarchy inverts)  2.82   7.87   0.030
  everything -> ink (not Line)     3.41   9.97   0.052
  SET 2                            3.70   7.84   0.086
```

That is rank 13 to rank 5, with the identity intact — level with Riso and Shaded on
`Fmax`, ahead of both on `p90`. It is placed 5th rather than 6th on the one tiebreak
that is not my opinion: of the sixteen, its design is the only one with an outside
vote behind it.

**It does not reach Linocut (0.207), and no version of it could.** That is finding 4
of §8.4 arriving from the other direction: a sparse, blue-led line drawing cannot
reach the ink ceiling, because the ceiling belongs to the palette and not to the
pen. Set 2 is set 1 spending its palette properly; it is not a different idea.

**Three things here generalise**, and all three are about roles rather than drawings:

- **An accent is not a line colour.** Theme roles are specified at a size. Using one
  two-thirds smaller than the size it was gated at silently forfeits the gate.
- **An invented colour escapes every check you own.** `#928E88` passes no gate in
  either archive because it was never put to one. Both archives measure _palettes_;
  neither measures what a drawing actually uses. `barroom.py` is the first thing
  here that catches that, and it catches it only because it reads pixels.
- **Measure against the surface a mark sits on, not the slide.** The ticks' real
  problem was 2.34:1 against the dial face; against the card panel they look like a
  passable 2.81:1. Every gate in both archives is stated against the panel.

---

### 8.8 Set 4, and the difference between a bad idea and a thin line

Set 4 finished last in §8.3 and had the best subject fit in the deck. Set 5 is the
same drawing with every deficit repaired; it finishes second. Nothing about the idea
changed. Set 4 stays in the deck, unmodified, as the control.

> **Read this section with §8.9.** It is written as of 2026-09-20, when set 5 also
> carried reference numerals and leader lines. Those came out on 2026-09-21 and are
> not to be restored without the user's explicit direction. The weight remap and the
> textures below are untouched by that; the numerals are.

**Its palette was never the problem** — and that is what separates it from set 1.
Set 4 is one ink, `#2A2520`, on paper `#FAF7F0`: 13.10:1, the same ink Bold and
Linocut win with. There was no headroom to recover, because none had been given
away. Three other things were wrong.

**1. Nothing in the set reached the venue's resolution limit.** Not the thin lines —
_nothing_:

```
0.96u = 0.49 CSS px   x1          the gnomon's shading lines
1.00u = 0.51          x3          the section-hatch primitive
1.28u = 0.65          x2          interior contours
1.30u = 0.66          x2          water level bands
1.50u = 0.76          x2   1.52u = 0.77  x4
1.80u = 0.91          x2   1.92u = 0.98  x5
2.48u = 1.26          x10  2.50u = 1.27  x5   <- the HEAVIEST line in the set
                                               the floor at 55in @ 7 m is 1.64
```

**2. The textures dissolved to nothing rather than to grey.** The 45° section hatch
is a 1-unit line on a 6-unit pitch: 0.51 px of ink every 3.05 px. T3's rule is that
anything under ~2 CSS px reads as flat tint — but that assumes there is ink to tint
_with_. §5 says Engraved survives distance because its hatching "disappears into
grey, not into nothing". Set 4's disappears into nothing. Same technique, opposite
outcome, and the difference is one number.

**3. The set's stated premise was never drawn — and the premise turned out to be
wrong.** §5 then described set 4 as testing _"annotation as a visual language"_, and
its sundial carried the comment _"Reference numerals are even, as USPTO drawings
number them"_ above a file containing no numerals, no leaders and no labels, as did
the other three. So set 5 drew them. **That was the one change of the five here that
the user then rejected** (§8.9): what these sets are for is the _clarity_ of a
technical drawing, not resemblance to a patent, and a comment that had never been
checked against anyone's intent was taken as a specification. **Nothing in this
archive would have caught either fault**: `check.py` validates structure,
`barroom.py` reads pixels, and neither knows what a set is _for_. A stale comment is
not a brief, and the archive had no way to tell the difference.

**What set 5 does:**

```
weights   [0.96, 2.5] -> [3.4, 7.0] units = [1.73, 3.56] CSS px   (see S8.4: remap, don't scale)
          hierarchy 2.60x -> 2.06x; every line now above the floor, top still under Bold's 4.07
hatch     1u -> 2.2u line on the same 6u pitch: 0.51 -> 1.12 CSS px, 17% -> 37% coverage
stipple   r 1.1 -> 1.7u, so the hourglass sand reads as a tone instead of a rumour
numerals  2/4/6 per drawing, 16u = 8.1 CSS px, with leaders and dot terminators
          -- DRAWN 2026-09-20, REMOVED 2026-09-21 BY THE USER (S8.9). Not to be
          restored without the user's explicit direction.

                          thin/thick px   hold   p90    Fmax     (55in @ 7 m)
  set 4, as drawn           0.49 / 1.27   2.14   2.98   0.000
  uniform x2                0.98 / 2.54   3.59   7.72   0.073
  uniform x3 (too heavy)    1.46 / 3.81   6.54  12.33   0.240
  remap to 3.4-6.0u         1.73 / 3.05   4.78  10.29   0.164
  set 5 as first shipped    1.73 / 3.56   5.62  11.85   0.208   with numerals
  SET 5 AS IT STANDS        1.73 / 3.56   6.03  11.90   0.223   without
```

Last to second, on a drawing nobody redrew. Strengthening the textures measured
almost nothing on its own (0.223 either way in the round that tested it) and is in
anyway, because T3 is about what a texture _reads as_, not what it measures: a hatch
that survives as grey is doing its job and one that vanishes is not.

**The numerals were never readable from the back row, and were never meant to be.**
At 16 units they are 8.1 CSS px on a 122 px card — about 5 arcmin at 7 m, a few
times the acuity limit, so they read as marks and not as digits. The case made for
them on 2026-09-20 was that they made the drawing legible _as a patent drawing_ at
the front of the room, that the set had claimed them, and that they gave the speaker
something to point at. **The first of those is the thing the user did not want**
(§8.9), which took the other two with it.

**One defect the contact sheet caught and the metrics could not.** It no longer
applies to any shipped file, and it is the most reusable thing in this section, so
it stays. The candle's flame sits in a group that translates 0 -> 90 units over 12 s
as the wax burns down. Numeral 2's leader pointed at where the flame started, so by
t = 8 s it pointed at bare paper. Every number in the table above was unchanged by
this, because a leader pointing at nothing is exactly as much ink as one pointing at
something. It was fixed by animating the leader's `y2` and its dot's `cy` by the
same 90 units. **A leader has to point at its feature for the whole animation, not
just at t = 0** — worth knowing before anyone annotates a moving drawing again, and
only visible by looking at a late frame, which is what `contact.py`'s extra time
columns are for.

**What generalises:**

- **Distinguish a bad idea from a thin line.** Set 4 spent this whole exercise
  ranked last on a property that was one remap away from first, while its actual
  idea — the thing being evaluated — was the best in the deck. Any ranking of
  _styles_ that is really measuring _execution_ will do this, and the tell is that
  the fix is a number rather than a redraw.
- **A texture has a coverage floor, not just a pitch floor.** T3 gave pitch
  thresholds. Set 4 satisfied them and still vanished, because a pitch says nothing
  about how much ink lands within it. Carry both.
- **A set can fail at being itself, and no tool here notices.** Set 4 was described
  as the annotation set and had no annotation for the whole exercise. Structural
  validators check what is there; only re-reading the brief catches what is not.
- **But check that the brief is a brief.** The comment that sent set 5 after
  numerals was a comment, written by whoever drew set 4, describing a convention
  rather than recording a decision. Acting on it produced the one change here the
  user reversed. Where a source comment is the only evidence of intent, it is a
  hypothesis; §8.9 is what confirming it would have cost, which was one question.

---

### 8.9 The numerals come out, and what that does to the ranking (2026-09-21)

**The decision, first, because it is the part that must survive this file being
skimmed:**

> **Sets 4 and 5 are after the _clarity_ of a technical drawing. They are not after
> being recognisable as a patent drawing. Reference numerals, their leader lines and
> their dot terminators were removed from set 5 on 2026-09-21 at the user's explicit
> direction. DO NOT ADD THEM BACK without the user's explicit direction** — not as a
> restoration, not as a speaker affordance, and not because a comment somewhere
> describes the USPTO's even-numbering convention.

Set 5 was renamed **Patent, weighted** in the same change: `patent-annotated` ->
`patent-weighted`, in the deck, in `tools/repatent.py`, in `barroom.py` and
`grid.py`, and here. The name now says what the set actually is — set 4 with its
weights repaired — rather than what it briefly drew. `repatent.py` asserts that no
`<text>` element reaches the output, so restoring them means deliberately editing
past a guard rather than doing it by accident.

**The arithmetic agreed with the aesthetics, which is not how this usually goes.**
Re-measured at `TV 55in @7m`:

```
                     ink%   hold    p90    Fmax
  with numerals      20.2   5.62   11.85   0.208
  without (now)      19.0   6.03   11.90   0.223
  change             -1.2   +7.3%  +0.4%   +7.2%
```

Removing them **improved every score.** The reason is in §8.8's own weights table
and nobody noticed it at the time: a leader line was 3.4u = **1.73 CSS px**, the
thinnest weight in the whole set, sitting right on the 1.64 px floor, and a 16u
Helvetica digit has stems around 0.9 px, well under it. A twentieth of the card's
ink was being spent below the venue's resolution limit, which is exactly the
condition §8.8 was written to fix, reintroduced by the same change that fixed it.
**The set that had just been repaired for drawing under the floor annotated itself
under the floor.** The `p90` barely moved (+0.4%), which confirms the numerals were
never among the strong marks — they were extra median, not extra signal.

A stale number is worth recording too: `repatent.py`'s docstring had carried
`6.03 / 11.90 / 0.223` as "THIS SET" since before the numerals were added, and never
got updated when they were. That row is now correct again, by accident.

**The re-rank.** Only ranks 1 and 2 move, and they swap:

| rank     | before              | after                  |
| -------- | ------------------- | ---------------------- |
| **1**    | 5 Patent, annotated | **9 Linocut**          |
| **2**    | 9 Linocut           | **5 Patent, weighted** |
| 3 ... 16 | unchanged           | unchanged              |

Set 5 measures _better_ than before and ranks _lower_, which looks perverse until
you read §8.3's tiebreak. Above the gate the measurements stopped deciding anything
— all three of these sets clear it by 2x or more — and the tiebreak was explicitly
"what the style _says_". What set 5 said, in §8.6's words, was that _"it is the only
style here whose idiom is the subject"_ and that its numerals were _"the only
interaction affordance in the deck"_. Both of those were the numerals. Remove them
and §8.3's own recorded reason for Linocut's second place — _"was rank 1 until set 5
existed"_ — simply reverts.

**Three candidate rankings were considered, and here is why this one:**

1. **Leave set 5 first, on the improved measurements.** Rejected: it contradicts the
   archive's stated method. §8.3 says the gate is pass/fail and tone breaks ties
   above it; 0.223 vs 0.207 of flare headroom is 0.016, and both correspond to rooms
   brighter than anywhere a talk gets given. Ranking on that gap would be ranking on
   noise because the noise happened to point the way I already wanted.
2. **Leave set 5 first, on a new criterion — that its language extends to the
   escapement diagrams the talk still needs.** Rejected _as a ranking_, because it is
   a real argument about the wrong question: §8.3 scores what one room sees on one
   slide. It is a decisive argument about the _deck_, so it moved to §8.6, which is
   where the deck gets chosen. That is why the recommendation and rank 1 now differ.
3. **Swap them.** Taken. It follows the archive's own recorded reasoning rather than
   new reasoning invented to protect an answer, and the entry it reverts to
   (_"rank 1 until set 5 existed"_) was written before any of this was at stake.

**What did not move, and why the bottom of the table is unaffected.** Nothing else
in the deck changed, so every other row is the same measurement as 2026-09-20 — the
re-run reproduced all fifteen to the hundredth, which is also a check on
`barroom.py` being deterministic. Set 4 stays 13th: its comments were rewritten in
this change but not one of its lines moved.

**What generalises:**

- **A repair can reintroduce the defect it repaired, in a different costume.** The
  weights were remapped to clear 1.64 px, and then annotation was added at 1.73 px
  and 0.9 px in the same change. The floor is a property of the venue, not of the
  layer you happen to be drawing.
- **When you remove a feature, re-check the ranking that the feature won.** The
  measurements went up, so nothing flagged that the _argument_ had gone down. An
  archive that records _why_ a thing ranked where it did — as §8.3's last column
  does — is what makes that catchable at all.
- **A ranking and a recommendation can honestly disagree.** They answer different
  questions: one room on one slide, versus a whole talk's drawing language. Where
  they diverge, say so in both places and say which question each is answering.

---

## 9. Verification discipline

Every change was checked by building, rendering at a pinned animation time,
reading the screenshot, and asserting structure programmatically. This caught real
defects repeatedly — and once caught a _false_ diagnosis of mine, where a pixel
scanline showed the "clipped drop shadow" I had claimed was actually a smooth
falloff from the flame's glow.

**Never judge an animation from a live screenshot.** Pause and pin the clock:

```js
svg.pauseAnimations();
svg.setCurrentTime(t);
```

Two traps that cost real time, both handled in `tools/contact.py`:

1. **The harness page inlines the SVG source.** Re-running the screenshot without
   regenerating the page silently shows you the _old_ art. This happened twice,
   and both times the "fix didn't work" conclusion was wrong.
2. **Duplicated SVGs share ids.** Put the same drawing on a page eight times and
   every copy resolves `url(#clip)` to the first one. Suffix every id per instance.

A third, when measuring the live deck rather than a harness: **Slidev renders
adjacent slides**, so a DOM query for `.tk-card` returns the neighbouring slide's
cards too. Scope queries to the slide's own class. An unscoped count once made a
working click-reveal look broken.

`tools/check.py` asserts the failures that actually occurred: malformed colour
tokens, duplicate ids, dangling `url(#…)` refs, non-well-formed XML, the hourglass
stream appearing over the pile, and the candle's burn clip travel diverging from
its group translate. All are invisible in a thumbnail and obvious in a diff.

**It reports what it could not check.** The sets represent the sand pile in
genuinely different ways — animated `d`, static path, or a path living inside a
clipPath — so the draw-order test cannot resolve markers in Bold or Vector display
and says so rather than printing a pass it did not make. Both were verified by hand
(stream at byte 854 vs pile 959; 3196 vs 3273). An earlier version of this file
silently skipped _five_ sets while reporting "all clean", which is worse than
useless; if you extend it, keep the skip list loud.

---

## 10. What is reusable for another talk

**§13 is the practical version of this section** — written afterwards, for someone
carrying the sets to a train, an interferometer, a lunar module or a block diagram.
This one lists the parts; §13 says what breaks.

- **The §3 legibility maths.** Nothing in it is about watches. Re-derive with the
  real screen width and back-row distance and you get that talk's floor.
- **The shared-geometry discipline (§4).** To compare styles fairly, fix the
  geometry and vary only the style. Obvious in hindsight; easy to forget.
- **`components/StyleSet.vue`** is generic — props are `n`, `title`, `dir`,
  `weight`, `note`. Point it at any folder of four SVGs. It deliberately shows
  each drawing twice, large and at real size, because the two rows disagree and
  the small row is the one that decides.
- **The comparison-slide pattern.** Recreate one real slide N times with only the
  art swapped, no set name or size anywhere, a number in the corner for reference,
  and let people argue. The numbering exists so an audience can say "7" instead of
  "the brown dotty one".
- **`tools/contact.py` and `tools/grid.py`** work on any folder under
  `deck/public/timekeepers/` with the four standard filenames.
- **`tools/spec.py`** prints any set's portable grammar — field, inks with their
  contrast against that set's own field, the weight hierarchy in CSS px against the
  venue's floor, the texture primitives and the animated attributes. It is how you
  draw a locomotive in "Riso" without reverse-engineering four SVGs (§13.1).
- **`tools/barroom.py` is the most portable thing here**, and the only one that
  answers a question nothing else in either archive could. Point it at any set of
  card-sized art, give it a screen width and a back-row distance, and it returns
  what survives. It has no watches in it and barely any assumptions: the venue
  table is four numbers at the top. **Run it on the first day of the next project,
  not the last** — every failure it found is cheap to fix while the art is still
  being drawn and expensive afterwards.
- **The Fmax framing (§8.1).** Reporting "contrast at 35 % flare" ranks designs by
  how they do in a room nobody can present in. Reporting the flare at which a design
  falls through 3:1 gives a number with units you can shop for. Steal the framing
  even if you throw the tool away.
- **The thickening test (`tools/thicken.py`, §8.4).** Before redesigning something
  that fails, scale the one obvious parameter and re-measure. It separates "drawn too
  thin" from "wrong idea" in about five minutes, and the two look identical on screen.
  Use its answer, not its multiplier — §8.4 and §8.8 on why remapping a weight span
  beats scaling it.
- **`tools/reline.py` and `tools/repatent.py` are worked examples of repairing a
  style without redesigning it** (§8.7, §8.8), and between them they cover every
  lever that turned out to matter: which palette role a mark is drawn in, whether a
  weight span clears the venue's floor, and whether a texture has ink as well as
  pitch. Both keep their original in the deck as a control, which is what makes the
  claim checkable. **Both also record a decision the user made about the set**, in
  the tool rather than in the generated files, which is the only place such a note
  survives a regeneration — `repatent.py` on the numerals (§8.9) is the example, and
  it backs the note with an assertion so the guard is not just prose.

---

## 11. Palettes worth keeping

The eight other sets use the deck's Ledger palette (recorded in the theme-colours
archive). These two invented their own and are the hardest to reconstruct, because
each value was picked off a reference frame and then contrast-checked against its
own field rather than against cream.

```
Set 15 "Guide" — 1981 BBC Hitchhiker's, on #000000
  #54E88A  spring green   structure, primary line      13.3:1   (Ford's suit, nav text)
  #3FE04A  vivid green    emphasis marks               12.0:1
  #4D9FE8  blue           water, grid/reference          7.4:1
  #8FC9F5  pale blue      water surface, drip           11.8:1
  #F5D44D  yellow         the readout: sand, hour bands, sundial shadow   14.4:1
  #E8452A  red-orange     the one hot thing, the flame   5.3:1
  #FFF8E0  cream          hot cores, level lines        19.8:1

  Semantics, taken from the source rather than from realism: yellow is the readout
  on the Guide's nav screens, so the sundial's shadow is yellow -- on a sundial the
  shadow IS the reading.

Set 16 "Vector display" — 1977 Star Wars, on #070A0E
  #A8C4D8  steel blue     structure, primary line       10.9:1
  #6E8FA6  dim steel      construction lines             5.8:1
  #E2EDF5  near-white     the current reading           16.7:1
  #C8412F  red            whatever moves: shadow, hour rings, flame   4.0:1

  A fifth value, #8E2E22 dim red, was designed and dropped: 2.4:1 on the field is
  below anything usable. Red is structurally weak on a dark field -- budget for it.
```

Both fields are near-black by necessity (§6 T1) and neither is pure black by
accident: `#070A0E` carries a faint blue cast so it reads as a screen rather than
a hole, which matters slightly less than hoped at 122 px.

---

## 12. Open questions

1. **Nobody has still seen any of this in the actual room.** §8 replaced the
   assumed 2 m screen with a simulation over four venues, which is a real
   improvement over a guess and is still not a visit. Two things it cannot model:
   the screen's own black level and gamma, and whether the audience is looking at
   the screen at all. **If the venue ever becomes known, edit `VENUES` at the top
   of `barroom.py` and re-run — that is the whole cost of re-deciding.**
2. **Riso hourglass sand** (unanswered from the session): the sand fills are solid
   but still _read_ as stippled, because the brown 30 % screen tints the whole bulb
   and the blue sand multiplies over it. Knocking the screen out beneath the sand
   needs three more animated masks and would remove the two-ink overlap that gives
   the set its character. Not done, deliberately.
3. **T1, the dark-field question — now answered, as a recommendation.** §7 measured
   it, §8.6 decides it: not "dark deck or drop them" but **light deck, one full-bleed
   dark slide**, which is the option T1 never considered because it framed everything
   as cards. The judgement left is the one the theme archive names as its own hinge —
   whether this forum's content is code-and-chart-led. If it is photo-led, Beacon
   wins outright and §8.6 should be reopened.
4. **The "sets 1, 3 and 8 are too light" guess was half right, and worth recording
   as a calibration.** (Those were the old numbers; in today's they are 1, 4 and 9.)
   §8 measured it: **1** Line and **4** Patent do fail the back row — Patent hardest
   of all sixteen — but **10** Riso passes comfortably (`hold 3.68`, `Fmax 0.089`).
   Three sets fail that the guess never named: **3** Engraved, **7** Vector on paper
   and **12** Ciechanowski. Eyeballing a grid at laptop distance found two of the
   five real failures and invented one. That is roughly the accuracy to expect from
   looking, and the reason `barroom.py` exists.
5. **Sixteen is too many to show an audience.** Expect to cut to four or five
   before the talk. §8 ranks them, which is most of the cutting, but a ranking is
   not a vote — and the comparison slides exist precisely so the audience can
   overrule §8. If they do, that result is worth more than anything in this file.
6. **The §8.4 lever has now been pulled once, on Patent (§8.8), and the worry was
   half right.** Tripling the weights _is_ ugly — the drawing stops reading as fine
   technical line work — but remapping the span instead keeps the look and gets
   within 0.02 of the same number. **Engraved is the remaining candidate** and
   nobody has tried it; it is the last set failing on weight alone, and §8.8 is the
   recipe. Unknown for it specifically: its hatching is the whole style, so it needs
   the coverage fix more than the weight fix, and those may not want the same
   numbers.
7. **§8.6's reason 2 is a projection and nothing has tested it.** The recommendation
   now rests on set 5's language extending to an escapement diagram, and no
   escapement has been drawn in any of the sixteen sets. **The cheapest possible
   test is one drawing**: an escapement in set 5's grammar and the same escapement
   in Linocut's, both at 122 px, both through `barroom.py`. If Linocut carries a
   gear train as well as set 5 does, §8.6 loses its load-bearing argument and the
   recommendation should follow §8.3 to Linocut. Whoever draws the escapement slide
   will answer this for free.

---

## 13. Carrying these sets to a different subject

This section exists because §5 describes each set in a sentence and §4 pins the
geometry of _these four drawings_, and neither tells you how to draw something that
is not a sundial. Everything below is written for the next talk: a train for special
relativity, a Mach–Zehnder interferometer, the Apollo LEM, an LLM block diagram.

### 13.1 A "set" is a grammar, not a filter

You cannot apply these sets to existing art. Each one is a small grammar, and the
whole of it is:

```
field        one background colour (or none -- eleven sets sit on the card panel)
ink          2 to 7 colours, each with a fixed job
weights      2 to 5 stroke widths in a fixed hierarchy
texture      0 to 2 primitives: a hatch, a dot screen, a gradient ramp, a filter
motion       which attributes animate, and over how long
```

That is four numbers and a habit, and all of it ports. **`tools/spec.py` prints it
for every set**, and `evidence/set-grammars.txt` is the output, so the recipe
survives even if nobody can run Python:

```bash
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/spec.py            # all 24 dirs
.venv/bin/python3 tasks/2026-09-20-animation-style/tools/spec.py riso bold  # just these
```

**The one thing it cannot print is the semantics** — _which_ ink does _which_ job.
Guide draws the sundial's shadow in yellow because yellow is the readout colour on
the Guide's own screens and on a sundial the shadow _is_ the reading; that is a
sentence, not a number, and §11 records it by hand for the two sets that have one.
A new subject has to decide its own, and that decision is most of the work.

### 13.2 The procedure, in the order that avoids rework

1. **Fix the geometry before drawing any style.** §4 is the control variable: every
   set draws the same shapes at the same coordinates, so a comparison measures style
   and nothing else. Draw the new subject once in the plainest grammar available
   (set 2's, four weights and two colours), then **write its coordinates down the way
   §4 does** and treat that block as the spec. Doing this second costs a redraw of
   every set.
2. **Do the §3 arithmetic on day one, not the last day.** Screen width, back-row
   distance, render size → the stroke-weight floor. Set 4 spent this entire exercise
   ranked last because nobody did it until the end (§8.8), and the fix was one
   number. `tools/barroom.py` wants four numbers at the top of the file and nothing
   about watches.
3. **Apply each grammar from `spec.py`'s output.** Field, inks, weights, textures,
   durations.
4. **Write the invariants down as assertions.** `check.py` catches the failures that
   are invisible in a thumbnail and obvious in a diff: duplicate ids, dangling
   `url(#…)` refs, malformed colour tokens, non-parsing XML. Those four are
   subject-independent — keep them verbatim. Its other two checks (the hourglass
   stream painted before the pile, the candle's clip travel matching its group
   translate) are worth **imitating, not copying**: every subject has two or three
   relationships between separately-animated elements that will silently drift, and
   the time to name them is while you still remember what they are.
5. **Look before you measure, and measure before you rank.** `contact.py` pins the
   animation to explicit times, because a live screenshot of an SMIL animation is
   not reproducible and will show you a stale harness (its docstring cost two
   cycles). `barroom.py` then scores what the back row sees.

### 13.3 What transfers, and what has to be re-derived

| transfers unchanged                                            | must be re-derived per subject                            |
| -------------------------------------------------------------- | --------------------------------------------------------- |
| The §3 legibility arithmetic, with new venue numbers           | §4's coordinate block — it is entirely about timekeepers  |
| `barroom.py`, `contact.py`, `grid.py`, `spec.py`, `thicken.py` | the durations (11 s / 8 s / 12 s / 9 s here)              |
| `check.py`'s four structural checks                            | `check.py`'s two relationship checks                      |
| The Fmax framing (§8.1) and the gate/tiebreak method (§8)      | **the §8.3 ranking itself — see 13.5**                    |
| The comparison-slide pattern and its numbering                 | `StyleSet.vue`'s `ITEMS` list (four hard-coded filenames) |
| `StyleSet.vue` and `TimekeeperCard.vue` otherwise              | the card size, if the subject needs more room — see 13.4  |
| Each set's grammar (`evidence/set-grammars.txt`)               | each set's semantics: which ink does which job            |

### 13.4 The subject-shape problem, which is the real limit of this archive

**All four subjects here are the same shape of thing: a container with a level that
moves one way.** Sand falls, water drains, wax burns down, a shadow sweeps. That gave
every one of the sixteen sets a free answer to the only two hard questions — _how do
you draw a substance_ and _what moves_ — and it means **the comparison never tested
anything else.** Nothing here animates travel across the frame, a reversible
oscillation, a discrete state change, or a diagram whose content is topology. Four
plausible next subjects, and what each one breaks:

**A train, for special relativity.** A rigid body with no substance, and the motion
is travel plus a second frame of reference on screen at once. Nothing in these
sixteen sets moves a whole subject across a frame; the vocabulary is entirely
"something inside this outline changes". The sets whose grammar is mostly _how to
render a substance_ (10 Riso's two-ink screens, 13 Shaded, 14 Photoreal) arrive with
their best trick inapplicable, while outline-led grammars (2, 4, 5, 8, 9) port almost
unchanged. Also new: the shading sets have to decide whether the light moves with the
train or with the observer, which is a physics question the drawing cannot dodge.

**A Mach–Zehnder interferometer.** Mostly empty space with a beam path crossing it.
These sets have no mark that means "this line is a path, not an edge" — every line
here is the boundary of a thing. **This is the one subject where the dark sets should
win outright**: 15 Guide and 16 Vector display already speak in glowing lines on
black, which is both what a beam in a darkened lab looks like and what the ranking
docked them for (T1's seam — irrelevant if the whole deck goes dark for the optics
slides). And the thing to animate is phase: periodic and reversible, where every
animation in this archive is monotonic and restarts with a jump.

**The Apollo LEM.** High part count, irregular, and famously wrapped in crinkled
foil — its surface _is_ its character. This is the subject where 14 Photoreal stops
being 2.7× the bytes for texture the room deletes (T3) and starts being the point,
and where pure outline sets give up the most. It is also the first subject with a
real case for exploded views and part labels — **which is exactly what §8.9 removed
from set 5.** That removal was a decision about _this_ talk's drawings; a LEM talk
wanting numerals is a different subject making its own call, not a reversal. Ask
before assuming either way.

**An LLM block diagram.** There is no drawing at all: the content is boxes, arrows
and mandatory small text, and the art is typography and topology. Almost every
grammar here collapses to its outline weight plus its palette, because the texture
primitives have nothing to texture. **And the text is disqualifying at this size.**
§8.9 measured it on real pixels: a 16 unit glyph is 8.1 CSS px on a 122 px card, with
stems around 0.9 px against a floor of 1.64 — a block diagram on a card cannot be
read from the back row, by anyone, in any style. So a block diagram is not a card.
It is a full-slide drawing, which changes the render size, which changes every number
in §8. **The 122 px card is an input to this method, not a constant of it.**

### 13.5 The ranking does not transfer. The method does.

§8.3 ranks how each grammar handles _a container with a moving level, at 122 px, on
cream_. Change any of those three and the table is void — but the failures split into
two kinds, and that distinction does transfer:

- **Weight failures are one number from fixed, on any subject.** 3 Engraved and
  4 Patent failed because their strokes were drawn below the venue's resolution
  floor. §8.4's thickening test diagnoses this in five minutes and §8.8 is the
  worked repair (remap the span, do not scale it). A new subject inherits the
  diagnosis, not the failure.
- **Palette failures are not fixable at all.** 1 Line draws its structure in an
  accent at 5.56:1 and 12 Ciechanowski's marks are soft grey-on-grey volume rather
  than strokes. No amount of ink reaches the contrast ceiling, because the ceiling
  belongs to the palette (§8.4 finding 4, §8.7). **These two will rank near the
  bottom on every subject**, and that is the only part of §8.3 worth carrying over
  without re-measuring.

Also subject-dependent in a way that is easy to miss: **`ink%` is as much a property
of the subject as of the style.** An hourglass fills its box; an interferometer is
mostly empty. Comparing ink% across subjects means nothing.

### 13.6 Choose the next four subjects better than these four were chosen

The four here were chosen because they are the four pre-clock timekeepers the slide
needed — which is the right reason, and it produced four subjects that stress
exactly one axis between them (13.4). If a future talk gets to _choose_ its
comparison subjects, spread them: **one dense and one sparse** (so `ink%` is not a
constant), **one that moves and one that does not** (so the motion vocabulary is
tested), **one with mandatory text and one without** (so the §3 floor is tested where
it actually bites), and **one irregular** (so surface-led grammars get a fair
hearing). Four drawings is the budget that worked — sixteen sets × four subjects was
about two days — and four well-spread subjects would have caught the limits in 13.4
during the work rather than after it.

---

## 14. What was chosen, and what it costs (2026-09-21)

**Set 2, "Line, weighted."** The live deck now renders it for all four cards and
nothing else; every other set lives here.

**§8.3 ranks it 6th, and that is not an inconsistency.** §8 says so twice, before any
of this was at stake: §12.5 — _"a ranking is not a vote, and the comparison slides
exist precisely so the audience can overrule §8. If they do, that result is worth more
than anything in this file"_ — and §8.6's closing paragraph, which named this exact
outcome, that **if the sparse blue line drawing is simply the one people like, set 2
is the version of it that survives the room**. The one piece of evidence in this
archive that did not come out of my own head is that somebody outside the project
looked at the grid and picked that drawing (§8.7). Five ranks of my taste is a fair
price for the only outside vote there is.

**What it costs, in one number: `Fmax 0.086`.** That is the ambient flare set 2 holds
3:1 at, against **0.207 for Linocut, 0.223 for set 5 and 0.254 for Bold** — so the
chosen set tolerates about **a third of the room light** the top of the table does.
It clears the gate at the hostile venue (`hold 3.70` against a floor of 3.00, 23%
of headroom) and it is the first of the survivors to fall as a room gets brighter.

```
                    hold    p90    Fmax     at TV 55in @ 7 m
  2 Line, weighted  3.70   7.84   0.086     <- shipped
  9 Linocut         5.56  12.95   0.207
  5 Patent, weighted 6.03 11.90   0.223
  8 Bold            8.54  12.90   0.254
```

**This is a known, priced risk and not an oversight.** Three things about it:

1. **The remedy is already built and already rejected.** §8.7 tried inking the
   secondary (hierarchy inverts) and inking everything (`Fmax` 0.052, and it stops
   being Line). Set 2 is the version that keeps the identity, and §8.7's last finding
   is that **no version of a sparse blue-led line drawing reaches Linocut**, because
   the ceiling belongs to the palette and not the pen. There is no third option that
   is still this drawing.
2. **If the venue turns out bright, the fallback is decided.** §8.6: take 8 Bold and
   lose only charm. Both are in the archive deck; swapping is four `img` paths and a
   directory copy.
3. **The number to watch is the room, not the deck.** `Fmax 0.086` is ~9 % flare.
   Ask for the lights over the screen to be off, and the risk mostly goes away —
   which is a thing you can ask a bar for, and cheaper than redrawing sixteen sets.

**What else went with the decision**, so nobody has to reconstruct why the live deck
is missing things this archive talks about:

- **The sundial time-lapse is gone**, and the credits slide with it. A photograph
  next to three line drawings is the one card that does not belong to the set — which
  is also why the sixteen comparison slides drew the sundial rather than playing the
  clip. It was the deck's only borrowed asset, so removing it removed the only thing
  the credits slide had to credit. `source-video/README.md` keeps the provenance and
  the licence terms, and says what has to come back if the clip ever does.
- **The dark-theme work stays here.** §8.6 recommended one full-bleed dark slide
  (set 15 Guide) at the narrative pivot. The live deck has no narrative pivot yet —
  it has a title, an escapement stub and this slide — so there is nothing to pivot on.
  **That recommendation is not withdrawn, it is waiting**; §7 and the four probe
  slides are intact in `deck/slides.md`.
- **Sets 4 and 5 keep their no-numerals note** (§8.9) even though neither ships. The
  note is about what the sets are _for_, and it has to outlive the decision that made
  them irrelevant to this talk.
