# Theme colour selection — experiment archive

**Dates:** 2026-09-18 → 2026-09-19
**Outcome:** **Ledger** chosen, provisionally ("for now").
**Purpose of this archive:** so the work can be resumed when we have a fuller deck,
feedback from other people, or — the big one — an actual venue.

> **2026-09-21 — the framework moved.** Making a new slide no longer requires this
> file: the live palette, its gates and the tools that check them are in `docs/theme.md`
> and `tools/`. This archive stays frozen so its numbers keep reproducing. **One
> threshold is enforced differently there**: §3's table states `muted vs panel ≥ 4.6:1`
> and gives no derivation, and Ledger measures **4.578**, so the chosen theme fails its
> own written gate by 0.02. `tools/lib.py` enforces **4.5**, which is WCAG AA for
> normal text, and 17 px body is normal text. Either way the margin is thin, and
> `docs/theme.md` records that as the real finding: muted-on-panel is the weakest
> thing in the palette.

> **2026-09-23 — Ledger is now a theme.** Ledger is the house look for every STEM
> talk, so it moved into a shared Slidev theme, `stem/themes/ledger/`, and the live
> deck uses `theme: ledger` instead of `seriph`. The palette values did not change.
> This archive's deck still uses `seriph` and still builds. To compare other
> palettes on the live talk later, see `stem/tasks/2026-09-23-house-theme/PLAN.md`
> ("Part 2"): palettes become CSS classes applied to imported slides, not copies of
> the slide.

Everything here is a frozen snapshot. The live deck in the project root has been
reduced to Ledger alone; nothing in this directory is referenced by the live deck,
and deleting this directory would not break it.

---

## 1. The decision

**Ledger** — warm cream field, saturated blue accent, warm brown secondary.

```
background  #FAF7F0     ink     #2A2520     muted   #736A60
accent      #1F5FA8     second  #9A6238     panel   #F2EEE4   border #E0D9CA
```

Runner-up was **Beacon** (`#0F1C33` navy / `#FFC24E` gold / `#8FBEEA` sky), which won
on raw contrast and colour-blind separation but lost the torture test. Third was
**Coffee + Code**, which lost on every axis.

Ledger won for one reason, and it is worth remembering because it is the reason that
would flip if conditions change: **it is the only finalist that survives pasted
light-background content** — code blocks, matplotlib charts, screenshots, papers.
See §6, insight 7.

---

## 2. Resuming

```bash
# flip through all 23 candidate themes (slides 2–24)
npx slidev tasks/2026-09-18-theme-colors/deck/slides.md

# the torture test: 3 finalists x 5 slide archetypes
npx slidev tasks/2026-09-18-theme-colors/deck/torture.md

# re-run the measurements (no dependencies beyond the stdlib)
python3 tasks/2026-09-18-theme-colors/tools/lib.py
```

The tools were written against a scratch directory and have been rebased to run from
this archive; they read `deck/slides.md` and write to `tasks/2026-09-18-theme-colors/out/`.
Screenshot and simulation tools (`shoot.py`, `tshoot.py`, `sim.py`, `assets.py`) need
Playwright with Chromium — there is a `.venv` in the project root that has it.

`deck/slides.md` is the **source of truth for the palettes**. The tooling parses the
CSS variables back out of it rather than keeping a separate table, which is why the
palettes survived when the scratch directory was wiped mid-project.

---

## 3. What we were choosing for

The deck is intended as the house theme for a monthly STEM meetup — 15–20 minute
talks, weekday evening, back room of a bar/restaurant, many different presenters and
topics. That shaped the criteria more than the watches talk did.

1. **Warm and inviting** — "hey look at this cool thing I learned", not a work talk.
2. **Legible in an unknown and possibly changing venue.** We never learned the venue.
3. **Survives other people's content.** Many presenters, arbitrary pasted material.
4. **Topic-neutral.** The theme shouldn't fight a talk on CRISPR or Kubernetes.
5. **Accessible.** ~5–6% of a STEM-skewed audience has red-green colour deficiency.

### Thresholds we settled on

| Check                            | Threshold                                     | Why                                               |
| -------------------------------- | --------------------------------------------- | ------------------------------------------------- |
| ink vs background                | ≥ 12:1                                        | headroom to degrade from; all finalists hit 13–17 |
| accent vs panel                  | ≥ 4.5:1                                       | the 37px stat number                              |
| secondary vs panel               | ≥ 3.5:1                                       | 20px bold = "large text", 3:1 floor plus margin   |
| muted vs **panel**               | ≥ 4.6:1                                       | 17px body; panel not background — see insight 8   |
| accent vs **ink**                | ≥ ΔE76 35                                     | emphasis must read as emphasis — see insight 3    |
| accent vs secondary              | ≥ ΔE76 25 under deuteranopia _and_ protanopia | colour-blind separation                           |
| accent/secondary lightness ratio | ≥ 1.4 preferred                               | hue fails before lightness — see insight 5        |

---

## 4. The toolkit

`tools/lib.py` is the whole measurement layer, stdlib only:

- WCAG relative luminance and contrast, with an optional **additive ambient-flare**
  term (`contrast(a, b, flare=0.35)`) modelling a projector in a lit room.
- **Viénot–Brettel–Mollon (1999)** simulation of deuteranopia and protanopia, with
  CIE76 ΔE in Lab as the separation metric. Rough reading: ΔE > 20 unmistakable,
  10–20 clear, < 10 risky at a glance. We used 25 as the gate.
- `load_themes()` parses every palette out of `deck/slides.md`.

`tools/sim.py` applies flare and deuteranopia to the _rendered pixels_ in a browser,
so no image libraries are needed. **Caveat:** it uses a CSS white overlay, which
computes `(1-a)·img + a·white` — that scales the source down as well as adding light,
whereas real projector flare is purely additive. The sim therefore overstates the
damage. Use the arithmetic in `lib.py` for ranking and the sim only for a
qualitative look at what washout does.

---

## 5. What we tried and rejected

23 candidates survive in `deck/slides.md`. The ones deliberately killed:

| Rejected                                                                          | Why                                                                                                                  |
| --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| The original field `#1B44A6` and its 5 themes                                     | mid-lightness saturated blue caps white at 8.7:1 — see insight 1                                                     |
| Lime & Midnight, Lamplight, Orchard                                               | red-with-green reads as Christmas                                                                                    |
| Peach & Plum, Neon Paper                                                          | purple                                                                                                               |
| Original Campfire/Harbor rose secondaries, Blackboard Social pink, Plum & Apricot | pink                                                                                                                 |
| Slate (grey + navy)                                                               | drab by construction: lowest-chroma pairing available, and fixing it means abandoning the combo                      |
| Claret                                                                            | converged with Registry once both accents were fixed; Registry measured better and carries a 3-colour role structure |
| Golden Hour Lab                                                                   | broken as specified — amber accent is **1.99:1** on its own cream field. Kept in the deck as a cautionary example    |

Also explored and not pursued: an `Orchard` green+red pair, a `navy + coral + green`
combination, and warm-red secondaries for Atomic Cocktail — all failed colour-blind
separation (see insight 9).

### All 23 candidates

| #     | Theme                   | Background | Accent    | Second    | ink      | acc/panel | acc-vs-ink | CVD | light |
| ----- | ----------------------- | ---------- | --------- | --------- | -------- | --------- | ---------- | --- | ----- |
| 2     | Kraft & Ink             | `#EFE1CA`  | `#14596F` | `#C0451C` | 12.0     | 5.33      | 37         | 53  | 1.53  |
| 3     | Campfire                | `#241E1A`  | `#FFB340` | `#54BCD6` | 14.3     | 7.86      | 65         | 80  | 1.23  |
| 4     | Harbor                  | `#0E3B3E`  | `#FFC145` | `#6FBCE0` | 10.5     | 9.17      | 64         | 88  | 1.30  |
| 5     | Letterpress             | `#FCF8F3`  | `#BE3517` | `#175F6A` | 15.9     | 4.88      | 75         | 44  | 1.29  |
| 6     | Fen                     | `#F7F5EF`  | `#175B92` | `#6E8148` | 13.8     | 6.07      | 40         | 69  | 1.66  |
| **7** | **Ledger — chosen**     | `#FAF7F0`  | `#1F5FA8` | `#9A6238` | 14.2     | 5.56      | 55         | 75  | 1.28  |
| 8     | Ash & Claret            | `#F7F5F4`  | `#6E1F32` | `#757E86` | 14.8     | 9.37      | 37         | 31  | 2.67  |
| 9     | Fieldnotes              | `#F8F5EC`  | `#1B5D82` | `#6F7E42` | 13.3     | 6.01      | 38         | 60  | 1.61  |
| 10    | Registry                | `#F7F6F4`  | `#184984` | `#A84455` | 14.6     | 7.78      | 39         | 41  | 1.56  |
| 11    | Night Ledger            | `#1E2024`  | `#81B3E4` | `#B4834F` | 13.1     | 6.67      | 38         | 64  | 1.51  |
| 12    | Copper Circuit          | `#202522`  | `#E8864A` | `#52B7A8` | 13.6     | 4.99      | 60         | 38  | 1.10  |
| 13    | Golden Hour Lab         | `#FFF4DD`  | `#F29D38` | `#D85C5C` | 11.4     | **1.79**  | 90         | 40  | 1.72  |
| 14    | Marmalade               | `#2B2420`  | `#E8883C` | `#93D096` | 14.1     | 4.93      | 64         | 28  | 1.46  |
| 15    | After-Hours Observatory | `#17202A`  | `#FFB84D` | `#7FB3E8` | 14.5     | 8.22      | 58         | 90  | 1.28  |
| 16    | Neon Aperitif           | `#262629`  | `#FF7A59` | `#56D6E8` | 14.2     | 4.91      | 67         | 51  | 1.49  |
| 17    | Coffee + Code           | `#3B2D29`  | `#E9A23B` | `#83BE8A` | 12.2     | 5.10      | 61         | 33  | 1.00  |
| 18    | Retro Future Lounge     | `#1E2B32`  | `#FF8F4F` | `#3E9A9B` | 13.0     | 5.41      | 58         | 48  | 1.48  |
| 19    | Electric Terracotta     | `#F6E7D8`  | `#C95C3F` | `#5252A3` | 11.2     | 3.07      | 66         | 77  | 1.64  |
| 20    | Atomic Cocktail         | `#173B3A`  | `#F6B44C` | `#6FBCE0` | 10.8     | 5.67      | 50         | 80  | 1.16  |
| 21    | Blackboard Social       | `#26332D`  | `#F2A65A` | `#7AD0DE` | 11.6     | 5.50      | 50         | 57  | 1.15  |
| 22    | Beacon                  | `#0F1C33`  | `#FFC24E` | `#8FBEEA` | **17.0** | 8.73      | 68         | 88  | 1.22  |
| 23    | Conservatory            | `#14243F`  | `#FFC24E` | `#93D096` | 15.5     | 7.91      | 68         | 34  | 1.12  |
| 24    | Blueprint               | `#101E38`  | `#5FD0E8` | `#F5B23C` | 16.6     | 7.56      | 40         | 80  | 1.03  |

---

## 6. Insights we did not have at the start

This is the section worth re-reading before changing anything.

**1. The background caps everything, and lightness matters far more than hue.**
The field we started with, `#1B44A6`, has luminance 0.071. White on it tops out at
**8.7:1**. A true dark field (`#0F1C33`, luminance 0.012) reaches **17.0:1**; a true
light field reaches 13–16. The original blue cost roughly 40% of the available
contrast before a single other colour was chosen. **A mid-lightness saturated field is
the worst of both worlds** — it is neither a good dark nor a good light.

**2. "Navy" and "saturated blue" are not the same objection, and we conflated them for
several rounds.** The `#1B44A6` verdict does not transfer to navy. `#0F1C33` behaves
like espresso or charcoal, not like cobalt. After-Hours Observatory's `#17202A` was
already effectively a dark navy and had been the top-ranked theme for three rounds
without anyone noticing. If someone proposes "navy" again, the answer is yes — check
the luminance, not the hue name.

**3. Accent-vs-background is the wrong metric for emphasis. Accent-vs-ink is the right
one.** We ranked themes on accent-vs-background contrast for four rounds. Then the
takeaway line's accent span turned out not to read as different from the surrounding
ink. Measuring accent against _ink_ (ΔE76) found **seven themes** with the same defect,
all of them in the "muted" family. A dark accent beside dark ink does not read as
emphasis no matter how well it contrasts with the paper behind it.

**4. Light backgrounds compress the lightness range available to accents.** On a light
field both the accent and the secondary must be dark to have contrast, so they end up
at similar lightness and must separate by hue alone. Dark themes can pair a bright
accent with a mid secondary and get a real lightness gap for free. This shows up in
the lightness column: light themes cluster at 1.0–1.7, dark themes reach 1.5–1.7 easily.

**5. Hue desaturates before lightness collapses.** In a washed-out room, colours that
differ only in hue merge; colours that differ in lightness survive. This is why the
lightness-ratio column matters independently of the ΔE column, and why insight 4 is a
real cost of going light rather than a curiosity.

**6. Ambient flare is close to symmetric between light and dark themes.** Modelled as
additive flare at 0/15/35/60% of peak white, all themes converge to roughly 2.1–2.4:1
at 60%. **The folklore that light backgrounds are more robust in bad rooms is not
supported by the arithmetic.** The real case for light backgrounds is content
compatibility, not contrast.

**7. The pasted-content penalty is exactly symmetric — and frequency breaks the tie.**
A white-canvas paste seams at **17.0:1** against Beacon; a dark photograph seams at
**17.0:1** against Ledger. Identical. What decides it is that code blocks, matplotlib
charts, screenshots, papers and wiki diagrams are overwhelmingly light-background,
while only photographs favour dark — and a bright rectangle in a dim room is more
disruptive than a dark one in a lit room, because it is a light source aimed at the
audience. **This is the single reason Ledger won, and it is the reason that would flip
if the forum turned out to be photo-led rather than code-and-chart-led.**

**8. Shiki's code-block theme is deck-level, not slide-level.** Out of the box a code
block renders light regardless of the slide's palette. Seam against the field: Beacon
16.0:1, Coffee + Code 12.4:1, Ledger 1.0:1. On a dark theme every code slide inverts
into a glaring white rectangle covering most of the frame. It is fixable by configuring
the highlighter in headmatter, but that is a config dependency a guest presenter could
undo without noticing.

**9. A warm accent beside a green secondary is a colour-blind trap, and its severity
scales with the warm colour's saturation.** This bit us four separate times (Orchard,
Neon Aperitif, Marmalade, and a navy+coral+green trial). A _soft_ apricot cannot hold a
green at all — Marmalade needed its accent deepened from `#F3A261` to `#E8883C` before a
true green became reachable. A saturated caramel can (Coffee + Code survives at ΔE 33).
**Blue secondaries have no such constraint** — After-Hours reaches ΔE 90.

**10. Red-green deficiency shifts red toward grey**, which makes grey-plus-burgundy the
hardest of the requested combinations: the two colours actively converge for those
viewers. It only works with a large deliberate lightness gap.

**11. Eyeballing colour-blind risk is unreliable, in both directions.** Early hand
estimates called Sunset and Ivory & Brass dangerous (they measure 49 and 35 — fine) and
called Ice & Cyan and Lime & Midnight safe (they measure 20 and 21 — the two worst).
Run the simulation; do not guess.

**12. 14px was too small.** On the 980×552 canvas that is 2.5% of frame height against
a common back-row guideline of 1/30 (≈18px). Raised to **17px** in
`TimekeeperCard.vue`. This is independent of theme and applies to any future card.

**13. `v-click="false"` is a documented Slidev no-op** (`useClicks.ts:7`), which makes a
clean comparison toggle: the element stays visible _and_ the slide consumes no clicks.
`deck/slides.md` uses a `revealCards` headmatter flag on this mechanism.

**14. Keep the palettes in the deck, not in a side table.** The scratch directory was
wiped partway through. Because every palette lives in `slides.md` as CSS variables, the
tooling was rebuilt by parsing it back out and nothing was lost.

---

## 7. What would change the decision

In rough order of how much it would move things:

1. **The venue.** Still unknown, and still the largest unmeasured variable. A dim room
   with a good screen favours Beacon; a lit room, a poor surface or a big TV favours
   Ledger further.
2. **Content mix.** Ledger's win rests on code/charts/screenshots dominating. If the
   forum turns out photo-led, Beacon wins outright (insight 7).
3. **Blind preference from actual attendees.** Never done. Every judgment here is about
   legibility and robustness, which are measurable. Whether Ledger or Beacon _feels_
   more like "hey look at this cool thing I learned" was decided by one person's taste.
   Cheapest way to fix: show the three finalists anonymously to five or six regulars and
   ask which they would rather look at for twenty minutes in a bar.
4. **A house rule for pasted images.** A padded, rounded, slightly-tinted frame around
   dropped-in figures would blunt the seam problem for _whichever_ theme is chosen, and
   was never implemented.

---

## 8. Files

```
deck/
  slides.md                    23 candidate themes, slides 2–24
  torture.md                   3 finalists x 5 archetypes
  components/TimekeeperCard.vue   themed via --tk-* CSS variables, 17px muted text
  public/timekeepers/          base SVGs + one recoloured set per theme (t*/)
  public/torture/              chart.png, screenshot.png, photo.png (generated)
tools/
  lib.py        colour maths, CVD simulation, palette parsing   <- start here
  gen2.py       rebuild slides.md + recolour art from a theme list
  torture.py    build torture.md
  assets.py     regenerate the pasted-content test images
  shoot.py      screenshot themes -> contact sheets
  tshoot.py     screenshot torture deck -> per-archetype sheets
  sim.py        flare + deuteranopia on rendered pixels
evidence/
  themes-*.png     per-theme renders and contact sheets
  torture-*.png    per-archetype comparison sheets, plus sim-sheet.png
```

The `t*/` art folders are recoloured copies of the four base SVGs, which hard-code
three colours (`#e0b25a` accent, `#6f6a60` structure, `#f0e9dc` ink). `gen2.py`
regenerates them; do not hand-edit.
