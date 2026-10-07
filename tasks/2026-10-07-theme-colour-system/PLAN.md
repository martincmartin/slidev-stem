# The theme's colours as one system: pairs, washes, and how to make a theme

**Date:** 2026-10-07
**Status:** done 2026-10-07; not committed. The result is in §9.
**Scope:** the house theme (`themes/ledger/`), `tools/`, `docs/`, and the
`watches` talk's art (`public/`, `art/`, `watch/`, `webgl/`). `watches` is the
only talk, and no talk has been given (no `given/*` tag).

## 1. The question

The theme names some of its pale face colours (`--palette-art-knockout`,
`--palette-art-second-knockout`) and makes others from a line colour at an
opacity (a "wash" of muted). The names do not show which pale colour belongs
to which line colour, and "knockout" is print jargon. What is the rule for
when a face colour gets a name, and what are the names?

Under that question is a larger one: which colours does a new theme choose,
and which follow from those choices? The house has gates for each colour, but
no doc says in what order to choose them, or why the gates leave so few free
choices (§3.10, §5).

## 2. Decisions already made (2026-10-07, with the user)

1. **Each line colour that is used with a face gets a named pale partner.**
   Variations in one drawing (a lit face and a shaded face) come from that
   partner, not from the line. Reason: today the choice between a variable and
   an opacity follows history, not a rule (§3.1). The same job then gets two
   systems: a flashed watch part gets a tuned, gated face, and a flashed case
   gets $0.18 \times$ `second`, which no gate checks.
2. **The pale partner's suffix is `-wash`.** The line colour has no suffix:
   `--palette-muted` and `--palette-muted-wash`. Reasons and the other words
   are in §4.1.
3. **`--palette-art-line` becomes `--palette-subject`.** `--palette-art` is
   too generic: the art uses more than one pair. The options are in §4.2.
4. **Not every colour has a pair.** Background, panel, border, accent and ink
   have no face partner.
5. **`theme.md` says how each wash is usually made from its line**, as
   guidance for a new theme (§5, step 10). Where the guidance is a plain mix,
   the recipe can also be the wash's default in CSS (§4.7).
6. **`theme.md` starts with "Making a theme"**: the order in which to choose
   a theme's colours, which colours are choices and which follow, and the
   check for each step. It writes down the method of the existing tasks and
   tools. The proposed text is §5.

## 3. Findings

### 3.1 The WebGL watch has no limit that needs named faces

The renderer mixes every fill with the paper when it builds a mesh
(`fillColour` in `watches/webgl/renderer.ts`):

$$\text{fill} = \alpha \cdot \text{colour} + (1 - \alpha) \cdot \text{paper}$$

So every face in the watch is a solid colour: the parts' art-knockout, and the
case's "0.18 wash of muted" (Ledger: <span style="display:inline-block;width:1.5em;height:1.5em;background:#E2DED6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E2DED6`, a pale warm grey). The difference between a
named face and a wash is only how the value is given.

### 3.2 The line-and-face pairs in use

| Where | Line | Face | The face is given as |
| --- | --- | --- | --- |
| watch: wheels, balance, fork, stud, spring | art-line | art-knockout | a variable |
| watch: case, lugs, strap, crown | muted | muted at 0.18 | an opacity |
| watch: hands | art-line | muted, solid | another line colour (an exception, illustrations.md) |
| flash, on a watch part | second | art-second-knockout | a variable |
| flash, on the case | second | second at 0.18 | an opacity (no gate) |
| diving board: stand, ground, pool walls | muted | muted at 0.14, 0.19, 0.24, 0.30 | opacities: one per face, for light |
| diving board: water | art-line | art-line at 0.60 | an opacity |
| sundial: wall; plate | muted; art-line | muted at 0.18; art-line at 0.07 | opacities |
| candle: wax body | art-line | art-line at 0.08 | an opacity |

The full survey of each colour's uses is in
[`watches/tasks/2026-09-30-flash/COLOUR-ROLES.md`](../../watches/tasks/2026-09-30-flash/COLOUR-ROLES.md).

### 3.3 Faces against fills that carry the subject

The fills fall in two groups by opacity:

- **Faces, at 0.07–0.30:** close to the paper (1.1–1.4:1). The back row does
  not see them (illustrations.md, "Washes"), so they never carry structure.
- **Substances and small dark parts, at 0.35–1.0:** sand 0.85, water 0.60 and
  0.78, the candle's drips 0.35, the inner flame (ink) 0.70, the jewel and the
  seconds hand (solid art-line). These carry the subject or its motion, and
  they must pass the back-row gate. They are the line colour drawn as a fill.

The decision in §2.1 is about faces. §4.4 proposes that substances stay the
line colour at an opacity.

### 3.4 A wash of muted works in every candidate theme

A 0.18 wash of muted, in each of the 23 themes of
`watches/tasks/2026-09-18-theme-colors`
([evidence/washes.txt](evidence/washes.txt)):

| Themes | On the background | On the panel |
| --- | --- | --- |
| 9 light | 1.25–1.29:1 | 1.24–1.27:1 |
| 14 dark | 1.32–1.44:1 | 1.32–1.47:1 |
| Ledger's art-knockout (for comparison) | 1.30:1 | 1.20:1 |

It is steady because each theme sets muted by a contrast gate, so a fixed
share of muted gives a nearly fixed contrast. These are luminance numbers, not
renders: nobody has looked at a muted wash in a dark theme.

In a dark theme the face is **darker** than its line (the line is light). So a
name that means "toward white" (pale, light, tint) is wrong there (§4.1).

### 3.5 Which named faces are plain washes of their line

The blend of each line into the background that would give each face, by
channel ([evidence/washes.txt](evidence/washes.txt)):

| Face | Line | R | G | B | A plain wash? |
| --- | --- | --- | --- | --- | --- |
| art-knockout <span style="display:inline-block;width:1.5em;height:1.5em;background:#D3DCE3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D3DCE3` (a very pale blue-grey) | art-line <span style="display:inline-block;width:1.5em;height:1.5em;background:#143C6B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#143C6B` (dark navy blue) | 0.170 | 0.144 | 0.098 | no: greyer than any wash of art-line |
| art-second-knockout <span style="display:inline-block;width:1.5em;height:1.5em;background:#E6D8CA;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E6D8CA` (a pale beige) | second <span style="display:inline-block;width:1.5em;height:1.5em;background:#9A6238;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#9A6238` (a mid caramel brown) | 0.208 | 0.208 | 0.207 | yes: second at 0.208 |

`ledger.css` already says that the second's face is "second over the
background at the opacity that gives the knockout's contrast". Nothing says
how art-knockout was made. `COLOUR-ROLES.md` §2 found its lightness equal to
the border's (L\* 87.3 against 86.9), with chroma 4.8.

### 3.6 Each line on its own face

| Line on face | Contrast | Existing gate |
| --- | --- | --- |
| art-line on art-knockout | 8.00:1 | none |
| second on art-second-knockout | 3.60:1 | ≥ 3:1 |
| muted on a 0.18 wash of muted | 3.95:1 | none |

([evidence/line-on-wash.txt](evidence/line-on-wash.txt).)

### 3.7 No wash overlaps another mark

[tools/overlap.py](tools/overlap.py) renders each SVG in Chromium. For each
fill drawn below full opacity, it draws that fill solid (the colour it gives
over bare paper) and counts the pixels that change, at six times for the
animated files. A control paints the mark solid magenta, to prove that the
mark shows. Output: [evidence/overlap.json](evidence/overlap.json). Pixels are
device pixels at scale 2.

| File | Fill | Opacity | Changed | Visible | Reading |
| --- | --- | --- | --- | --- | --- |
| sundial | muted (wall) | 0.18 | 0 | 282 | on bare paper |
| sundial | art-line (plate) | 0.07 | 221 | 8176 | a hairline at the outline's edge ([evidence/sundial-plate-overlap.png](evidence/sundial-plate-overlap.png)) |
| candle | art-line (wax) | 0.08 | 0 | 4295 | on bare paper |
| diving board | muted (7 faces) | 0.14–0.30 | 0 | 3772–93984 | on bare paper |
| diving board | art-line (water) | 0.60 | 0 | 335250 | on bare paper |
| water clock | art-line (bodies) | 0.60 | 0 | 3554, 4011 | on bare paper |
| water clock | art-line (surfaces) | 0.78 | 1361, 1300 | 2348, 2365 | over the body: stacked on purpose |
| candle | art-line (drips) | 0.35 | 35, 28 | 35, 28 | over the wax |
| candle | ink (inner flame) | 0.70 | 105 | 106 | over the outer flame |
| hourglass | art-line (sand) | 0.85 | 0, 4 | 3022, 1817 | on bare paper |

So a solid wash draws every face as it is today, except a hairline on the
sundial. Only substances stack, and they stack on purpose.

### 3.8 One solid colour on two papers

The cards sit on the panel and the full-slide art on the background. A solid
wash is one colour on both, so its contrast differs a little. For example,
Ledger's muted wash made on the background (<span style="display:inline-block;width:1.5em;height:1.5em;background:#E2DED6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E2DED6`, a pale warm grey) is 1.25:1 there and
1.16:1 on the panel. Art-knockout already works this way (1.30:1 and 1.20:1).

### 3.9 Material colours: water and ground

The diving board's pool draws water in art-line and the ground and stand in
muted. `watches/docs/watch.md` says that they differ on purpose: "a blue ground
beside white water read as a pool of the wrong colours". The pool reads only
because Ledger's subject colour is a water blue and its neutral is an earth
brown. In a theme with these hues swapped, the water would look like mud and
the ground like water. No gate would catch it, because both colours would
still do their jobs. (The user's observation, 2026-10-07.)

### 3.10 What the 23 candidate themes say about making a theme

[tools/theme_survey.py](tools/theme_survey.py) measures each role of the 23
themes of `watches/tasks/2026-09-18-theme-colors` in CIE L\*C\*h, and runs the
house gates on each ([evidence/theme-survey.txt](evidence/theme-survey.txt)).
L\* is lightness (0 black, 100 white). C\* is chroma: how much colour shows.
Below about 5 reads as grey; above about 20 reads as a colour.

- **Paper:** L\* 90–98 (light) or 10–22 (dark) in all 23. 16 have C\* ≤ 9.
  7 have visibly tinted paper, C\* 12–20: three navies, two teals, kraft and
  "golden hour". A navy works because it is dark (theme task, insight 2).
- **Chroma, not saturation.** Near black and white, C\* goes to 0 whatever
  the HSL saturation is: <span style="display:inline-block;width:1.5em;height:1.5em;background:#0A0000;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#0A0000` (a "fully saturated" red that looks black) is ΔE 2.8 from
  black.
- **Ink:** L\* 11–22 or 91–100, C\* 0–16: the opposite extreme, near grey.
- **The ink gate is tighter than "very light against very dark":** 12 of the
  23 miss ≥ 12:1, by 0.1 to 2.8.
- **Muted is derived, not chosen.** C\* 1–16, with the ink's hue. The theme
  task's generator (`gen2.py`) makes it as ink mixed toward the paper until it
  passes on the panel.
- **The accent needs a minimum chroma.** On light paper the accent must be
  dark (≥ 4.5:1), so it is near the ink in lightness, and the ΔE ≥ 35 from the
  ink must come from colour. Seven candidates failed with dark, greyish
  accents (theme task, insight 3). Ledger's accent is C\* 45.
- **The subject line limits the accent's hue.** The most chroma an sRGB colour
  of each hue can keep at 9.6:1 (Ledger's subject line) on Ledger's panel:
  teal, cyan and sky 18–22, blue 29, orange 41, red 55, purple 61. On a dark
  panel (Beacon's), at 9.6:1: blue 22, red 21, violet 25, yellow and green
  85–96. A hue with little chroma left gives a subject line that is nearly
  grey, close to muted and ink. The 9.6:1 is Ledger's value; the rule is "until
  the back-row check passes", which may need less.
- **Neither the accent nor the subject is the stricter one for every hue.**
  At the accent's 4.5:1, every hue keeps more chroma than at 9.6:1 on light
  paper. On dark paper, yellow, green, teal and cyan keep *more* chroma at
  9.6:1 than at 4.5:1 (for example yellow 86 against 65), so there the accent
  is the stricter one. So the two share a hue, and neither is made from the
  other (§5, step 6).
- **Colour blindness is gated in one place only:** accent against second, CVD
  ΔE ≥ 25. It limits the second's hue once the accent is chosen. A warm accent
  beside a green second is the known trap (theme task, insight 9).
- **The art's own pairs have no gate.** In Ledger:

  | Pair | ΔE | CVD ΔE | Contrast |
  | --- | --- | --- | --- |
  | subject vs muted (the subject against its context) | 43 | 43 | 2.10 |
  | subject vs ink | 37 | 38 | 1.36 |
  | second vs subject (a flash must show) | 69 | 64 | 2.21 |

  The house gates were written for text and cards, before the drawings.
- **10 of the 23 pass every current gate.**

## 4. Options and recommendations

### 4.1 The pale partner's word (decided: `-wash`)

The word must be clear to a non-designer, true in light and dark themes (§3.4),
and say what the colour is, not where it goes. A jewel and an arrowhead are
filled with their line colour, so a word for "the colour of a fill" is wrong.
Counts are uses in the repo outside `tasks/` and SVGs.

| Word | For | Against |
| --- | --- | --- |
| **wash** (chosen) | "A wash of colour": thin, close to the paper, in any theme. The repo's "Washes" rule (it never carries structure) is true of these faces. | Today it means an opacity, in 260 uses. Each use must be reworded or checked. |
| faint | Clear; true in dark themes. | Clashes with the existing "faint" role for lines (43 uses). Hints at "hard to see". |
| soft | True in dark themes; 4 uses. | Vague (blurred edges?); "a soft colour" sounds like muted. |
| tint | The print word for a pale version of a colour. | Means "toward white": wrong in dark themes. |
| pale, light | The clearest. | Wrong in dark themes. |
| face | How the docs describe it ("a lit face"). | 235 uses for 3D faces and tooth faces; "watch face". |
| fill | The obvious word. | Clashes with SVG and CSS `fill`; dark colours fill too. |
| knockout | Today's word. | Print jargon. It confused the user. |

### 4.2 The new name for `--palette-art-line` (decided: `--palette-subject`)

It names the colour of the thing that the slide is about: its structure and
what moves. Counts are uses of the word in `docs/`, `tools/`, `themes/` and
the talk's code and docs.

| Name | For | Against |
| --- | --- | --- |
| **`--palette-subject`** (chosen) | The docs' own word for this job ("the subject", theme.md and illustrations.md). The watch's `Subject` (the parts a slide is about) has the same meaning. | 298 uses of "subject". The colour and the watch's `Subject` are two things with one meaning, which a reader must keep apart. |
| `--palette-structure` | Says what it draws. 16 uses. | Moving substances (water, sand) are not structure. |
| `--palette-figure` | Figure and ground: what stands out. 6 uses. | Non-designers read "figure" as "a diagram". |
| `--palette-line` | Short. | The same objection as "fill": muted is a line too, and the jewel is filled with it. |
| `--palette-accent-deep` | Says how it is made. | Says nothing of the job. In a dark theme it is lighter, not deeper. |

### 4.3 Which colours get a wash (decided: these three)

| Line | Wash | Ledger's value | Now |
| --- | --- | --- | --- |
| subject (art-line) | `--palette-subject-wash` | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D3DCE3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D3DCE3`, a very pale blue-grey | `--palette-art-knockout` |
| second | `--palette-second-wash` | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E6D8CA;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E6D8CA`, a pale beige | `--palette-art-second-knockout` |
| muted | `--palette-muted-wash` | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E2DED6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E2DED6`, a pale warm grey (new) | muted at 0.18 |
| ink, accent | none | | ink is drawn in lines and small solids only; the accent is not in the art |

**Decided (2026-10-07):** these three. A wash is added when a drawing first
needs a face for that line. The material colours of §4.7 follow the same rule:
ground has faces (the stand, the ground, the pool walls), so it gets a wash;
water has none yet (§4.4: the pool's water is a substance).

### 4.4 Faces against substances (decided: A)

- **A (chosen, 2026-10-07).** Faces (0.07–0.30 today) use the line's wash or a
  variation of it. Substances and small dark parts (0.35–1.0) stay the line
  colour at an opacity, see-through, because they stack on purpose (§3.7) and
  must pass the back-row gate.
- **B.** Every fill derives from the wash, substances too. Water at 0.60 would
  become a mix of the wash toward the line. Against: substances are far from
  the wash (water is 3.38:1 on the panel; the wash is 1.20:1), and the stacking
  in the water clock and the candle would need a new mechanism.

### 4.5 How a variation is written (decided: A)

A variation is a face colour for one drawing, made from a wash: for example
the stand's shaded face.

- **A (chosen, 2026-10-07).** CSS `color-mix()` from the variables, for example
  `color-mix(in srgb, var(--palette-muted-wash), var(--palette-muted) 8%)`.
  A variation then follows a slide's theme class, as the plain colours do. The
  SVG keeps a hex fallback as an attribute (illustrations.md, "The page's theme
  paints the drawing"). The WebGL watch does the same mix when it builds a
  mesh, as it mixes with the paper today. Chromium has had `color-mix()` since
  version 111 (2023).
- **B.** The art script writes the computed hex. Against: a theme class on a
  slide would not reach it.
- **C.** An opacity over the wash. Against: it is see-through again, and on two
  papers it gives two colours.

### 4.6 See-through against solid faces

**Recommendation: solid.** No face overlaps another mark (§3.7), so a solid
face draws the same pixels, except one hairline on the sundial. The WebGL
watch is solid already (§3.1).

### 4.7 Material colours (water, ground) (decided: A)

- **A (chosen, 2026-10-07).** Add material roles where a material's colour is how
  the audience knows it: `--palette-water` and `--palette-ground`. Ground has
  faces (the stand, the ground, the pool walls), so it also gets
  `--palette-ground-wash`, and the board's four lit and shaded faces become
  variations of it (§4.5). Water has no face yet: the pool's water is a
  substance (§4.4), so it gets a wash only when a drawing first needs one
  (§4.3). In Ledger they are aliases, so nothing changes on the screen and
  each value is still stored once: `--palette-water: var(--palette-subject)`,
  `--palette-ground: var(--palette-muted)`. A theme can set them on their own.
  A gate in `tools/palette.py` checks each material's hue: water in a blue to
  blue-green range, ground in a warm, low-chroma range. The ranges need data
  from the 23 themes before they are fixed.
- **B.** Material roles with their own values in every theme. Against: in
  Ledger they would copy existing values (one fact in two places).
- **C.** No material roles, but a gate that the subject is cool and muted is
  warm. Against: it forbids a warm-accent theme to protect one drawing.
- **D.** The diving board's script picks the bluest and the warmest theme
  colours. Against: hidden logic that a reader cannot find from the theme.

**Defaults as recipes (decided, 2026-10-07).** A colour that follows from
another gets its recipe as its default, in CSS. A theme sets a value only to
tune it:

```css
--palette-ground: var(--palette-muted);
--palette-ground-wash: color-mix(in srgb, var(--palette-ground) 18%, var(--palette-background));
--palette-muted-wash: color-mix(in srgb, var(--palette-muted) 18%, var(--palette-background));
--palette-second-wash: color-mix(in srgb, var(--palette-second) 20.8%, var(--palette-background));
```

Two of today's faces are such recipes already (§3.5): the second's face is
second at 0.208, and the case's face is muted at 0.18. `--palette-subject-wash`
is tuned in Ledger (greyer than any wash of its line, §3.5), so it stays a
value.

- For: a theme decides fewer colours. A theme that changes a line colour (for
  example `--palette-ground`) takes its wash with it, where an alias of
  `--palette-muted-wash` would not. Each recipe is written once.
- Against: `tools/lib.py` reads the theme's values as hex (`css_palette`), so
  it must evaluate `var()` and `color-mix()` itself, mixing in sRGB as the
  browser does. The WebGL palette (`watches/watch/palette.ts`) reads computed
  colours from the page; Chromium may give a `color-mix()` result as
  `color(srgb …)`, not `rgb(…)`, which it must then parse. Neither cost is
  measured.
- The recipe mixes over the background. On a card's panel the result is a
  little lighter in contrast (§3.8), as art-knockout is today.

**Test it with a slide class.** A slide's `class:` can change any role
(theme.md, "One slide can change a role"), and `tools/palette.py` runs the
gates on each such class. So a temporary class on slide 2 that swaps Ledger's
hues (the subject brown, muted blue) shows the problem of §3.9: water like
mud. With the material roles, the same class must keep the pool right, or the
hue gate must fail it. Keep the screenshots in this task's `evidence/`, and
remove the class before the commit.

**Which materials get a role (decided, 2026-10-07):** only where two
materials sit side by side and their colours tell them apart. That is the
pool today. The water clock's water and the hourglass's sand are the subject
of their cards and move, so they keep the subject colour. Blue sand is
accepted as style.

**Why the pool's water need not be the subject colour.** On slide 2 the
subject is the diving board; the pool is its context. So a water role of its
own is more correct for it than the subject colour, not less. In Ledger it is
the same colour (an alias), so nothing on the screen changes.

### 4.8 The new gates (decided, 2026-10-07: the user left the choice to me)

[tools/gate_data.py](tools/gate_data.py) derives the subject and the three
washes of each candidate theme that passes today's gates (10 of 23), by the
steps of §5, and measures each new pair
([evidence/gate-data.txt](evidence/gate-data.txt)). Its derived Ledger subject
(<span style="display:inline-block;width:1.5em;height:1.5em;background:#023C72;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#023C72`, a dark navy blue) is close to the real one (<span style="display:inline-block;width:1.5em;height:1.5em;background:#143C6B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#143C6B`, also a dark
navy blue); Ledger's real values are in the "Ledger" column below.

Each threshold follows from what the gate protects, and the data shows where
it bites:

| Gate | Threshold | Why this number | 10 themes | Ledger | Fails |
| --- | --- | --- | --- | --- | --- |
| subject vs muted | ΔE ≥ 30 | a little below the accent's 35 from ink: a line is not text, but the subject must still not look like its context | 32–58 | 43 | none |
| subject vs ink | ΔE ≥ 30 | the same: the subject must not look like a scale or a leader | 28–52 | 37 | Fieldnotes (28): its teal keeps C\* 23 at the subject's darkness, as §3.10 predicts |
| second vs subject | CVD ΔE ≥ 25 | the same number as the existing accent-vs-second gate: a flash must show for red-green colour-blind viewers too | 8–81 | 64 | Conservatory (8): a gold subject and a green second, the warm-beside-green trap |
| each line on its wash | ≥ 3:1 | the existing gate for the second's face (WCAG's floor for a drawn mark), made general | subject 7.95–8.06, second 2.95–6.18, muted 3.88–4.94 | 8.00, 3.60, 3.95 | Ash & Claret's second (2.95), which the existing gate also fails |
| each wash on the panel | ≥ 1.12:1 | the faintest face the art uses today and reads: the sundial plate (art-line at 0.07, 1.12:1 on the panel) | subject 1.19–1.21, second 1.18–1.21, muted 1.09–1.19 | 1.20, 1.21, 1.16 | the muted-wash recipe on three dark themes (Beacon 1.09, Blueprint 1.09, Conservatory 1.11) |
| each wash on the background | ≤ 1.5:1 | a face must stay near the paper, so it does not compete with the lines; all 23 themes' muted recipe is 1.25–1.44 | — | 1.30, 1.29, 1.25 | none |

**Every gate on every candidate** (part 2 of
[evidence/gate-data.txt](evidence/gate-data.txt), each miss with its margin):
5 of the 23 pass all gates, old and new: Campfire, Letterpress, Ledger,
Registry and After-Hours Observatory. Today's gates alone pass 10. Most new
misses are "subject vs ink" in dark themes with a warm accent (Marmalade 16,
Coffee + Code 5, Blackboard Social 5): the accent moved away from dark paper
to 9.6:1 becomes a pale cream, close to the white ink.

**The panel and the background.** In both light and dark themes the panel is
nearer the ink than the background is, and a wash is nearer the ink than
either. So a wash has its least contrast on the panel and its most on the
background. The lower bound is checked on the panel and the upper bound on the
background.

**A failing recipe is not a failing theme.** The muted-wash recipe (0.18) is
too faint on the panel in three dark themes. That is what the gate is for: the
theme then sets its own `--palette-muted-wash` (§4.7, "Defaults as recipes").

**The material hue gates** (initial ranges, from colour names, not from data;
no candidate theme has material colours):

- **water:** hue h 190–300 (cyan to blue-violet), and C\* ≥ 15, so that it
  reads as a colour. Ledger's water (the subject, <span style="display:inline-block;width:1.5em;height:1.5em;background:#143C6B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#143C6B`, a dark navy blue):
  h 278, C\* 32.
- **ground:** hue h 20–110 (red-brown to olive), or C\* < 10 (near grey, as
  stone or concrete). Ledger's ground (muted, <span style="display:inline-block;width:1.5em;height:1.5em;background:#736A60;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#736A60`, a warm grey-brown):
  h 76, C\* 7.
- Ledger with its hues swapped (water brown, h 61) fails the water gate, as
  §4.7's slide-class test expects.

### 4.10 Keyword callouts (decided, 2026-10-07: `second`)

Today a callout's leader is ink, and so is its whole label. On slide 4 the
audience cannot see that a leader belongs to one word, and the leader is lost
where it crosses the subject's outlines: ink on the subject is 1.36:1 and
ΔE 37 (§3.10).

**Decision:** in a keyword callout, the word and its leader are `second`, and
the rest of the label stays ink. A keyword callout is a label whose leader
points at what one word names, not at the whole label: "Pallet" in "Pallet
blocks wheel", not the blocking. This is not the default for a callout: a
leader is still in ink, the colour of its label, as slide 2's sentence shows
(the user's correction, 2026-10-07). `WatchCallout.vue` takes `keyword`, and
slide 4 sets it.

- **No room for a new hue.** [tools/leader_room.py](tools/leader_room.py)
  searches every sRGB colour with ≥ 4.5:1 on Ledger's background, at least C\*
  30 and 45° of hue from the subject, the accent and the second. Its best
  worst-case CVD ΔE from ink, subject, accent, second and muted is about 22–23,
  and most such colours are dark olives and aubergines, near the ink again
  ([evidence/leader-room.txt](evidence/leader-room.txt)). The second does as
  well: CVD ΔE 38 from ink, 64 from the subject, 75 from the accent, 22 from
  muted; 4.70:1 on the background. It needs no new theme decision, and the new
  "second vs subject" gate (§4.8) protects the pair in every theme.
- **It fits the second's job.** In the art, the second means "look here" (the
  flash). A leader and its word say "look here: this word is that part". The
  second's role in the art becomes "pointing: the flash and the callouts".
- **A flash and a callout must not show at the same time:** both are second,
  and a flashed part would merge with a leader. Today no slide does this.
- **Slide 2's leader stays muted.** It points at the muted rest shape, which is
  the documented exception "a leader may take the colour of a reference mark
  that it names" (illustrations.md).
- **Measure it.** A 4 px muted leader (4.96:1) held 3.58:1 at the back row; the
  second (4.70:1) is expected to pass, but `barroom` must measure it
  (`watches/docs/measurements.md`, "Slide 4 leaders alone").

### 4.9 Out of scope

- The WebGL code calls every art colour an "ink" (`INKS`). This already
  clashes with `--palette-ink`. The rename keeps the dark colours without a
  suffix, so it adds no new clash. A rename of the WebGL word is separate.
- The hands' mixed pair (art-line outline, muted fill) stays an exception, as
  illustrations.md records it.

## 5. Proposed text: "Making a theme", at the start of theme.md

This is the method of the existing tasks and tools, in the order a theme
author uses it. The text below goes into `docs/theme.md` in STE, with the
numbers as examples. Each threshold stays in `tools/lib.py` (`GATES`), and the
doc names the file (one fact in one place). The checks that are new in this
task are in §4.8.

> ### Making a theme
>
> A theme has few free choices. You choose four things. The other colours
> follow from them by a step, and a check confirms each one.
> `uv run tools/palette.py` runs the checks; the thresholds are in
> `tools/lib.py` (`GATES`).
>
> **Measure colour in CIE L\*C\*h, not in HSL.** L\* is lightness, from 0
> (black) to 100 (white). C\* is chroma: how much colour a viewer sees. Below
> about 5 reads as grey; above about 20 reads as a colour. HSL saturation does
> not show this: near black or white, a "fully saturated" colour shows almost
> no colour (<span style="display:inline-block;width:1.5em;height:1.5em;background:#0A0000;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#0A0000`, a "fully saturated" red, looks black: it is ΔE 2.8
> from black).
>
> **The four choices:** light or dark, the paper, the theme's hue (the accent
> and the subject share it), and the second.
>
> 1. **Light or dark.** The content that presenters paste decides it (see
>    "The current theme"). It does not decide contrast: room light affects
>    light and dark themes about equally (theme task, insight 6).
> 2. **The paper** (`--palette-background`). Choose a lightness near an
>    extreme, with little colour. The 23 candidates were L\* 90–98 or 10–22,
>    and most had C\* below 10. Do not use a mid lightness: it limits every
>    other colour's contrast.
> 3. **The ink** (`--palette-ink`) follows. It has the opposite lightness and
>    little colour. Check: 12:1 on the background and on the panel. This is
>    harder than it looks: 12 of the 23 candidates failed it.
> 4. **The panel and the border** follow. Each is the paper moved a little
>    toward the ink. The panel is the harder surface for text, so the text
>    checks use it.
> 5. **Muted** (`--palette-muted`) follows. Move the ink toward the paper until
>    muted passes 4.5:1 on the panel, and no further. Its hue follows the ink.
>    It has the thinnest margin of the palette.
> 6. **The theme's hue**: the first choice of colour. The accent and the
>    subject share it. The subject is the drawings' "look at this" colour, as
>    the accent is the text's. They differ only in how far each is from the
>    paper. Check the hue at both distances before you set either: at each
>    one, a hue can keep only so much colour, and which distance limits it
>    more depends on the hue. The most chroma (C\*) a hue can keep, at the
>    accent's 4.5:1 and at the subject's 9.6:1 (Ledger's), on Ledger's panel
>    and on a dark panel (Beacon's), are examples:
>
>    | Hue | Light paper: accent, subject | Dark paper: accent, subject |
>    | --- | --- | --- |
>    | red | 83, 55 | 73, 21 |
>    | orange | 64, 41 | 79, 27 |
>    | yellow | 52, 34 | 65, 86 |
>    | green | 52, 34 | 64, 85 |
>    | teal | 33, 22 | 40, 54 |
>    | cyan | 28, 18 | 34, 45 |
>    | blue | 44, 29 | 55, 22 |
>    | violet | 99, 78 | 71, 25 |
>    | purple | 91, 61 | 109, 34 |
>
>    On light paper the subject is the harder limit for every hue. On dark
>    paper it is the harder limit for red, orange, blue, violet and purple, and
>    the accent is the harder limit for yellow, green, teal and cyan. A hue
>    with little chroma at the subject's distance gives a subject line that
>    looks like muted or ink. Colours also change their names when they move
>    away from the paper: on light paper, a yellow becomes olive and an orange
>    becomes brown.
> 7. **The accent** (`--palette-accent`) follows: the hue, at the distance
>    from the paper that large text needs. Checks: 4.5:1 on the panel, and ΔE
>    35 from the ink. On light paper the accent is near the ink's lightness, so
>    it needs enough chroma to differ from the ink. The house prefers colours
>    that are not too saturated, but there is a minimum too.
> 8. **The subject** (`--palette-subject`) follows: the hue, moved away from
>    the paper (darker on light paper, lighter on dark paper) until the
>    drawings pass the back-row check ([legibility.md](legibility.md)).
>    Ledger's is 9.6:1 on the panel. Checks: ΔE from muted and from ink, so
>    that the subject looks like neither its context nor a scale.
> 9. **The second** (`--palette-second`): the second choice of hue. Checks:
>    3.5:1 on the panel, and CVD ΔE 25 from the accent (red-green colour
>    blindness). This is the house's only colour-blindness check, and it limits
>    the second's hue: a warm accent beside a green second fails (theme task,
>    insight 9). A blue second has no such limit. A lightness ratio of 1.4×
>    from the accent is preferred; light themes cannot reach it. Check: CVD ΔE
>    from the subject too, so that a flash shows for every viewer.
> 10. **The washes** follow, one for each line colour that has faces:
>    - `--palette-subject-wash`: the paper, tinted toward the subject's hue at
>      low chroma (Ledger: about 5), near the border's lightness: about 1.2:1
>      on the panel.
>    - `--palette-second-wash`: the second over the paper, at the blend that
>      gives the subject-wash's contrast (Ledger: 0.21).
>    - `--palette-muted-wash`: muted over the paper at about 0.18. In all 23
>      candidates this gives 1.25–1.44:1 on the background.
>
>    Each recipe is the wash's default in the theme's CSS (§4.7, "Defaults as
>    recipes"): set a value only to tune one. Checks: each line 3:1 on its
>    wash; each wash far enough from the panel to read as a face, and near
>    enough to the background not to compete with the lines. On dark paper,
>    the muted recipe can be too faint on the panel; then tune it.
> 11. **The material colours** follow (`--palette-water`, `--palette-ground`).
>     Each is an alias of a role whose hue suits the material, or a value of
>     its own. Check: each material's hue is in its range (water a blue,
>     ground an earth colour or a grey).
> 12. **Check the drawings.** In each talk, the full validation runs
>     `artcheck`, `barroom` and `motion` on the art with the new colours.

**The new gates** for `tools/lib.py` are in §4.8, with their thresholds and
the data behind them. The text of "Making a theme" names each check at its
step; the thresholds stay in `tools/lib.py`.

## 6. The rename

| Now | New |
| --- | --- |
| `--palette-art-line` | `--palette-subject` |
| `--palette-art-knockout` | `--palette-subject-wash` |
| `--palette-art-second-knockout` | `--palette-second-wash` |
| (muted at 0.18) | `--palette-muted-wash` |
| (none) | `--palette-water`, `--palette-ground`, `--palette-ground-wash` (if §4.7 A) |
| WebGL inks `line`, `knockout`, `secondKnockout`, `frame`, `detail` | names that follow the variables: `subject`, `subjectWash`, `secondWash`, `muted`, `ink` |

Live files (outside `tasks/`) that use the old names, with lines that match:

- `knockout`: `watches/watch/generate.ts` 26, `watches/webgl/scene.test.ts` 7,
  `docs/theme.md` 7, `watches/art/diving_board.py` 6, `docs/illustrations.md`
  6, `watches/webgl/scene.ts` 5, `themes/ledger/styles/ledger.css` 5,
  `watches/webgl/probe/checks.ts` 4, `watches/watch/palette.test.ts` 4,
  `watches/public/diving-board.svg` 4, `tools/lib.py` 3,
  `watches/webgl/probe/probe.ts` 2, `watches/watch/palette.ts` 2,
  `watches/art/favicon.py` 2, `docs/webgl.md` 2.
- `art-line`: `docs/illustrations.md` 9, `docs/theme.md` 7,
  `watches/public/diving-board.svg` 5, and 1 each in `watches/watch/palette.ts`,
  `watches/watch/palette.test.ts`, `watches/art/favicon.py`,
  `watches/art/diving_board.py`, `tools/test_scenecheck.py`, `tools/lib.py`,
  `tools/deck_check.py`, `themes/ledger/styles/ledger.css`.
- `wash` (each use is read and reworded or kept): `watches/art/diving_board.py`
  11, `docs/illustrations.md` 9, `watches/watch/generate.ts` 8,
  `tools/scenecheck.py` 5, `docs/theme.md` 5, `tools/artcheck.py` 4,
  `docs/legibility.md` 4, `tools/lib.py` 3, `tools/motion.py` 2,
  `tools/barroom.py` 2, and 1 each in
  `watches/public/timekeepers/water-clock.svg`, `watches/docs/watch.md`,
  `watches/docs/measurements.md`, `tools/README.md`, `docs/webgl.md`,
  `docs/README.md`.

## 7. Steps

Each step ends with `pnpm format` and quick validation in each changed
project. Full validation runs before the commit.

1. Theme: rename and add the variables in `ledger.css`; `tools/lib.py` (the
   roles, `ART_INK`, the new gates of §4.8); `tools/palette.py`; `artcheck`'s
   allowed colours.
2. WebGL: `watch/palette.ts`, `webgl/scene.ts` (the inks and `FLASH_INKS`:
   each line to `second`, each wash to `second-wash`), `watch/generate.ts`
   (the case's face becomes `muted-wash`), the probes, the tests.
3. SVG: `art/diving_board.py` (classes and `color-mix()` variations; water and
   ground roles if accepted), regenerate `public/diving-board.svg`; the
   timekeepers' plate and wax faces to `subject-wash` variations. Check that
   the board's pixels change only where intended.
4. Docs: `theme.md` ("Making a theme" first, from §5; then the roles, the
   pairs and the gates), `illustrations.md`
   ("Washes" and "Colour"), `webgl.md`, `legibility.md`, the talk's
   `watch.md` and `measurements.md`.
   **Wording rule:** a general rule must hold in light and dark themes. Write
   "toward the paper" and "away from the paper" (or "toward the ink"), not
   "darker", "lighter" or "pale". For example, the subject is the accent moved
   away from the paper along its hue; a wash is its line moved toward the
   paper; muted is the ink moved toward the paper. Words that hold only for
   Ledger stay where they describe Ledger. Today theme.md breaks the rule at
   lines 44–45, 67, 79–80 and 87.
   **Describe each colour:** wherever a doc gives a colour's value, it also
   shows a swatch (an inline `<span>` with the colour as its background and a
   thin grey border, so that a pale colour shows) and says in words what the
   colour looks like, for a reader who cannot picture a hex code. GitHub
   drops the swatch, so the words must stand alone. For example: <span style="display:inline-block;width:1.5em;height:1.5em;background:#FAF7F0;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FAF7F0`, a warm off-white; <span style="display:inline-block;width:1.5em;height:1.5em;background:#143C6B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#143C6B`, a dark
   navy blue. This applies to Ledger's palette in theme.md and to every
   example value.
5. Measure: `barroom` and `motion` on the changed art (full validation runs
   them).
6. Test the material roles with a temporary slide class that swaps Ledger's
   hues (§4.7, "Test it with a slide class").
7. Keyword callouts (§4.10): `WatchCallout.vue` takes `keyword`, which draws
   the word and its leader in the second; illustrations.md ("Leaders") gives
   the exception; measure the slide 4 leaders at the back row again.

## 8. Uncertainties

- The derived subject uses Ledger's 9.6:1 in every theme. The rule is "until
  the back-row check passes", and a dark theme may need less. If it does, the
  subject stays farther from the ink, and fewer dark warm themes fail
  "subject vs ink" (§4.8). Only a back-row measurement of a dark theme's art
  can tell.

- The 23-theme numbers are luminance only. No one has looked at a muted wash
  in a dark theme.
- **Decided (2026-10-07):** the sundial plate (art-line at 0.07, 1.12:1 on the
  panel) and the candle wax (0.08, 1.14:1) change to the subject wash (1.20:1).
  They become a little darker, to match every other subject face.
- The hue ranges for water and ground (§4.7) are not measured yet.

## 9. Result (2026-10-07)

All the steps of §7 are done. Full validation passes in `stem/` and in
`watches/`.

- **Theme.** `ledger.css` sets `--palette-subject`, the three washes, water,
  ground and the ground's wash. The muted and second washes, the material
  colours and the ground's wash are recipes (`color-mix()` and `var()`). Every
  resolved colour is the same as before.
- **House tools.** `tools/lib.py` reads recipes (`css_recipes`, `resolve`), so
  a slide class that changes a role changes its recipes too. `GATES` is one
  list of every gate (contrast, ΔE, colour-blind ΔE, with a minimum or a
  maximum, required or preferred), with the new gates of §4.8, and
  `HUE_GATES` checks the materials. `WASH_PAIRS` holds the pairs.
  `palette.py` prints every gate from the list. `artcheck` also allows the
  papers and a variation of a wash (`wash_variation`). `scenecheck` wants a
  face solid in its wash, and a fill in a line colour at 0.60–1.0.
- **WebGL.** The inks are `subject`, `subjectWash`, `muted`, `mutedWash`,
  `ink`, `second` and `secondWash`; the flash maps each line to `second` and
  each wash to `secondWash`. The case's face is `mutedWash`, solid.
  `watch/palette.ts` has the browser paint each value on a one-pixel canvas
  and reads back its `#rrggbb`, so a recipe works.
- **SVG.** `watches/art/theme.py` works out the theme's recipes for the
  scripts that write files. The diving board draws its ground, stand and
  walls in the ground's wash and three `Shade`s of it, its water in the water
  colour, and its rest shape and leader in muted. Its pixels change by 1–2
  levels, and by up to 11 on one hairline where two faces meet. The stand's
  front is now the wash itself (it was muted at 0.19, two levels darker). The
  favicon is byte-identical. The sundial's plate and wall and the candle's wax
  are solid washes.
- **Keyword callouts.** `WatchCallout.vue` takes `keyword`; slide 4's three
  callouts set it. The leaders hold 3.60:1 at the back row (6.90 in ink),
  Fmax 0.081 ([evidence/leaders-second.png](evidence/leaders-second.png),
  [evidence/leaders-second.json](evidence/leaders-second.json)).
- **Docs.** `theme.md` starts with "Making a theme", and gives the roles, the
  pairs, the gates and Ledger's values with a swatch and a description each.
  `illustrations.md`, `webgl.md`, the talk's `watch.md` and
  `measurements.md`, the theme's README, `docs/README.md` and `AGENTS.md` follow.
  The flash task's README has a dated line.

**Found on the way:**

- **A slide class does not reach a layer for the whole talk.** The test of
  §4.7 put a class on slide 2, and nothing changed: the diving board and the
  WebGL watch are in `global-bottom.vue`, outside the slide's element, and the
  watch reads the palette once. `theme.md` now says so. The test was run with
  a style for the whole page instead ([tools/pool_swap.py](tools/pool_swap.py)):
  with Ledger's hues swapped, the pool's water turns to mud; with its own water
  and ground colours, the pool stays right
  ([evidence/pool-swapped-hues.png](evidence/pool-swapped-hues.png)).
  `palette.py --talk` with the class did fail it: water's hue 66°, subject vs
  ink ΔE 27, second vs subject CVD ΔE 19. Ground passed as a near grey
  (chroma 9.9, under 10): a blue-grey reads as stone, at the edge.
- **Keyword callouts are an exception, not the default** (the user's
  correction, §4.10).

## Tools and evidence

- [tools/washes.py](tools/washes.py): §3.4 and §3.5. It reads the frozen deck
  of `watches/tasks/2026-09-18-theme-colors` with that task's own tools, and
  holds a copy of Ledger's values from 2026-10-07.
- [tools/overlap.py](tools/overlap.py): §3.7. It reads this task's copies of
  the talk's SVGs at commit `1219a55`, in `inputs/public/`.
- [tools/sundial_plate.py](tools/sundial_plate.py): the sundial hairline image.
- [tools/gate_data.py](tools/gate_data.py): §4.8. It reads the same frozen
  deck, with the house colour maths, and derives each theme's subject and
  washes by the steps of §5.
- [tools/theme_survey.py](tools/theme_survey.py): §3.10. It reads the same
  frozen deck, with the house colour maths from `tools/lib.py` and a copy of
  the house gates of 2026-10-07.
- [tools/leader_room.py](tools/leader_room.py): §4.10.
- [tools/pool_swap.py](tools/pool_swap.py): §9, the swapped hues on slide 2
  (needs the talk's dev server on port 3040).
- `evidence/`: `washes.txt`, `overlap.json`, `line-on-wash.txt`,
  `sundial-plate-overlap.png`, `theme-survey.txt`, `gate-data.txt`,
  `leader-room.txt`, `leaders-second.png`, `leaders-second.json`,
  `pool-swapped-hues.png`.
