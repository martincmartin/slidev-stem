# The Radium Girls: four slides after Harrison

**Status: built, 2026-11-05; not committed.** The request is in
[instructions.md](instructions.md). The section goes after the Did H4 Win the
Prize? slide and before the Questions slide, in Part 2, "Changed The World".
It has no section slide: the Harrison story has none either.

## 1. The time budget

The narration has 3,444 words with no asides or figure lines: about 25
minutes at 140 words a minute (measured on 2026-11-05 from `slides.md`). The
spoken talk is shorter than the narration, but the 15–20 minute slot is
tight. So the section must be short: about 3½ minutes.

## 2. How many slides

| Option          | Slides | Time      | What is lost                                    |
| --------------- | -----: | --------- | ----------------------------------------------- |
| A               |      3 | ~2½ min   | the brush loop, or the exhumation               |
| **B (chosen)**  |  **4** | ~3½ min   | nothing that matters                            |
| C               |      5 | ~4½ min   | time: the legacy gets a slide of its own        |

Ranking: B, C, A. B keeps the three strongest beats (the glow, "lip, dip,
paint", the bones) and carries the two local hooks (Harvard, MIT) in its
clicks. C costs a minute that the talk does not have. A rushes from the deaths
to the court and squeezes the exhumation, the section's best turn. The user
chose B.

## 3. The slides

The bridge from Harrison: "Harrison got paid in the end, at 80. The next
people to change the watch never were."

1. **Reading a Watch in the Dark, World War I.** A dark slide: the live
   watch's case, dimmed into the night. A click: "Strike a match: draw a
   sniper's fire." A click: the paint on the hands and the hour marks glows:
   "Undark: radium paint", with "radium paint" in the accent. (The first
   version had a subtitle, a history line, an opening question and a
   punchline, "No match needed": see the README.)
2. **Lip, Dip, Paint.** The photo of the dial painters at work (USRC, about
   1922). "4,000 women painted dials". A click: "Shaped brush with lips",
   with "with lips" in the accent; the title names the routine. A click:
   "Radium goes into bone".
3. **Bones That Glow.** A slide of words, by year. 1922: Mollie Maggia dies;
   the record says syphilis. 1924: Harvard's Cecil Drinker finds radium; the
   company sends the state a copy that says "every girl is in perfect
   condition". 1927: her body is exhumed, and her bones expose photo film.
   The punchline: "Not syphilis. Radium."
4. **Too Weak to Raise a Hand.** The photo of Grace Fryer. She and four
   others sue (in 1927); at the first hearing, in January 1928, none can
   raise an arm to take the oath. 1938: Catherine Donohue
   testifies at home, dying, and the women win. 1941: from their bones, MIT
   sets the first safe limit for radium in the body. Then the user's sentence:
   corporate abuses like these led to modern labor laws, and to OSHA. Last:
   radium is phased out in the 1960s; today, tritium, or paint that stores
   light.

## 4. The glow on the live watch

The user chose the live watch over a 1921 Undark advertisement. Options for
how the watch glows:

- **(a) A `lume` piece, on a dark slide that sets one role to the paint's
  glow (chosen).** The theme recommends one dark slide at a turning point
  (`stem/docs/theme.md`, "Dark palettes"), and a slide may set a role
  (`stem/docs/theme.md`, "One slide can change a role"). The watch already
  follows a slide's palette class, in the live layer, the still and the
  article's figure (`slidePalette` in `watch/palette.ts`). No new key, no new
  role, no new layer.
- **(b) A new role, `--palette-lume`.** Every palette must then set it, and
  `tools/lib.py` must gate it, for one slide. The house keeps roles few.
- **(c) A new key that changes the palette at a click** (light, then dark).
  The layer, the still, the figure and `slideState` would all need to change
  the palette between clicks: a new kind of state in every part that reads a
  layer (`docs/watch.md`, "A new layer"). A slide that opens dark tells the
  same story.

**The lume is overlays, not new solids.** A solid in a hand's part would
stack on the hand and lift the minute hand and the pivot, which would move
them on every tilted slide. An overlay has the heights of the part that it
lies on (as the Gears slide's span does), so no other slide changes.

### Which role the glow is

1. **First try: the second.** The lume was a solid fill in the second, and
   the slide set `--palette-second`. `scenecheck` failed it: the second and
   its wash say "look here", so they are allowed on a mark's mesh only
   (`stem/docs/illustrations.md`, "Colour"). That rule has its reason, so it
   stays.
2. **Chosen: the subject.** On this slide the paint is the subject, and a
   substance may be a solid fill in a line colour. The slide sets
   `--palette-subject`, and the lume is `subjectFill`.

### What shows at night

1. **First try: the whole watch, dimmed (`art: all`, `artDim: [all]`), and
   the lume over it.** With the subject green, the dimmed train and the hour
   marks were green at click 0, so the watch seemed to glow before the paint
   came in. It also needed `artDim` to take `all`.
2. **Chosen: the case alone, dimmed, and then the lume alone.** The case is
   muted, not the subject, so only the paint is green. At night a radium
   dial shows only its paint: [dark-click-0.png](evidence/dark-click-0.png)
   and [dark-click-3.png](evidence/dark-click-3.png). No part that moves
   shows, so the slide rests the mechanism (`watchAtRest: true`), and the
   article's figures are still, with no pause button
   ([article-glow-figure.png](evidence/article-glow-figure.png)).

### The colour

The slide is in After-Hours (navy paper). `tools/palette.py --talk watches`
measured the subject at each candidate (2026-11-05). The tool resolved a
slide rule in the talk's palette (Ledger), not in the slide's palette class,
so it now measures a rule whose selector names a palette class in that
palette (`tools/lib.py`, `SlideOverride.palette_class`).

| Subject   | vs muted, ΔE (≥ 30) | vs ink, ΔE (≥ 30) | second vs it, CVD ΔE (≥ 25) |
| --------- | ------------------: | ----------------: | --------------------------: |
| `#78e6d0` |                  43 |                38 |                          36 |
| `#70e0d8` |                  40 |                38 |                          29 |
| `#7fe8c4` |                  45 |                39 |                          44 |
| `#8eeac0` |              **45** |            **37** |                      **48** |

All four pass. `#8eeac0`, a pale mint green, is the greenest, with the
largest margin on the closest gate. As the second (the first try), a green
failed "second vs subject" for colour-blind viewers (`#7fe8c4`: ΔE 23 against
After-Hours' pale amber subject), and a yellow green (`#b0f0a0`) failed it
worse (ΔE 8).

## 5. The facts, and their sources

- Radium dial practical: c. 1916. Ingersoll's Radiolite was advertised in May
  1916 (Wikipedia, "Radium dial", which cites the New York Tribune).
- USRC was founded in 1914 as the Radium Luminous Material Corporation, and
  renamed in 1921. Undark was its paint, radium with zinc sulfide, with a
  "faint blue-green light". Demand surged in World War I (Wikipedia,
  "United States Radium Corporation", "Undark").
- The match: a light at night drew a sniper's fire. Collector sources and a
  1918 war diary; no museum source was found.
- About 4,000 workers painted dials for US and Canadian companies; USRC hired
  about 70 women to handle radium (Wikipedia, "Radium Girls").
- "Lip, dip, paint": supervisors taught it. Radium is a bone seeker: the body
  takes it as calcium.
- Mollie Maggia died on September 12, 1922; her death was put down to
  syphilis. She was exhumed on October 15, 1927; her bones were radioactive
  and exposed film (Kate Moore, _The Radium Girls_; Popular Science). Wikipedia
  says the first painter died in 1923 with her jaw "fallen away"; this talk
  follows Moore. Check in Moore before the talk.
- Cecil and Katherine Drinker of the Harvard School of Public Health found
  radium dust everywhere in 1924. The company gave the state a changed report:
  "every girl is in perfect condition" (Harvard Chan School, "centennial
  radium forged report"). The Drinkers published in August 1925 (Journal of
  Industrial Hygiene 7(8)).
- January 1928: two of the five were bedridden, and none could raise an arm to
  take the oath. Settled in 1928: $10,000 each, $600 a year, and medical costs
  (Wikipedia, "Radium Girls").
- Catherine Donohue's case was heard at her home in 1938; the Illinois
  Industrial Commission ruled for the women. The US Supreme Court declined the
  appeal on October 23, 1939 (Wikipedia, "Radium Girls").
- Robley Evans, MIT: measured dial painters; in 1941 set the first tolerance
  for radium in the body, 0.1 µg (MIT News obituary, 1996; DOE roadmap). The
  plutonium limits were set from it; no source ties Evans to the Manhattan
  Project's plutonium work, so the talk does not say it.
- OSHA: the talk says what the user's notes say, "Corporate abuses like these
  led to modern labor laws and the creation of OSHA", not a direct line.
- Radium was phased out of dials in the 1960s ("until around 1968", Wikipedia,
  "Undark"); the last factory closed in 1978. Tritium paint followed, in Swiss
  watches until 1998; Super-LumiNova (1993), which is not radioactive, is the
  usual lume today. Tritium gas tubes are still made.

## 6. Photos

Both are public domain on Wikimedia Commons; each is in
`public/radium/README.md`, and the Questions slide credits them.

- The dial painters at USRC, about 1922 (Rutgers, via Argonne).
- Grace Fryer, 1925.
