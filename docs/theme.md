# Theme: making a theme, its colour roles and gates

**Covers:** how to make a theme, step by step; the colour roles that every
theme fills; the line colours and their washes; the gates each role must pass;
how one slide changes a role; and how to add a colour. Then the current theme,
Ledger, as the example.
**Read before** you choose, compare, measure or add a colour, or make a new
theme.
**Tasks:**
[`tasks/2026-10-07-theme-colour-system/`](../tasks/2026-10-07-theme-colour-system/PLAN.md)
(this method, the washes, the material colours, the art's gates),
[`watches/tasks/2026-09-18-theme-colors/`](../watches/tasks/2026-09-18-theme-colors/)
(the palette: 23 candidates, the gates),
[`watches/tasks/2026-09-20-animation-style/`](../watches/tasks/2026-09-20-animation-style/README.md)
§7, §8.5 (dark themes, measured),
[`tasks/2026-09-23-house-theme/`](../tasks/2026-09-23-house-theme/PLAN.md)
(the palette as a Slidev theme),
[`tasks/2026-09-23-theme-aware-art/`](../tasks/2026-09-23-theme-aware-art/instructions.md)
(the art takes its colours from the theme),
[`watches/tasks/2026-09-30-flexing-ruler/`](../watches/tasks/2026-09-30-flexing-ruler/PLAN.md)
(a slide class sets the palette),
[`watches/tasks/2026-09-30-flash/`](../watches/tasks/2026-09-30-flash/PLAN.md)
(`second` in the art: the flash, and its face).

The theme is not final. It will be chosen again when a deck is more complete,
and a dark theme may be tried. So the method, the roles and the gates below are
the rules. Ledger's values are one theme that passes them.

**Write each general rule so that it holds in light and dark themes.** Say
"toward the paper" and "away from the paper" (toward the ink), not "lighter"
or "darker": on dark paper they change places.

## Making a theme

A theme has few free choices. You choose four things. The other colours follow
from them by a step, and a check confirms each one (see "The gates"). `uv run
tools/palette.py` (in `stem/`) runs the checks.

**Measure colour in CIE L\*C\*h, not in HSL.** L\* is lightness, from 0
(black) to 100 (white). C\* is chroma: how much colour a viewer sees. Below
about 5 reads as grey; above about 20 reads as a colour. HSL saturation does
not show this: near black or white, a "fully saturated" colour shows almost no
colour. <span style="display:inline-block;width:1.5em;height:1.5em;background:#0A0000;border:1px solid #888;vertical-align:middle">&nbsp;</span>
`#0A0000`, a "fully saturated" red, looks black: it is ΔE 2.8 from black.

**The four choices:** light or dark, the paper, the theme's hue (the accent and
the subject share it), and the second.

1. **Light or dark.** The content that presenters paste decides it (see "The
   current theme: Ledger"). Contrast does not decide it: room light affects
   light and dark themes about equally (see "Dark themes").
2. **The paper** (`--palette-background`). Choose a lightness near an extreme,
   with little colour. The 23 candidate themes were L\* 90–98 or 10–22, and
   most had C\* below 10. Do not use a mid lightness: it limits the contrast of
   every other colour.
3. **The ink** (`--palette-ink`) follows. It has the opposite lightness and
   little colour. Check it on the background and on the panel. The check is
   harder than it looks: 12 of the 23 candidates failed it.
4. **The panel and the border** follow. Each is the paper, moved a little
   toward the ink.
5. **Muted** (`--palette-muted`) follows. Move the ink toward the paper until
   muted passes its check on the panel, and no further. Its hue follows the
   ink's. It has the smallest margin in the palette.
6. **The theme's hue:** the first choice of colour. The accent and the subject
   share it. The subject is the drawings' "look at this" colour, as the accent
   is the text's. They differ only in how far each is from the paper. Check the
   hue at both distances before you set either. At each distance a hue can
   keep only so much colour, and which distance limits it more depends on the
   hue. For example, the most chroma (C\*) that a hue can keep at the accent's
   4.5:1 and at Ledger's subject (9.6:1), on Ledger's panel and on a dark panel:

   | Hue    | Light paper: accent, subject | Dark paper: accent, subject |
   | ------ | ---------------------------- | --------------------------- |
   | red    | 83, 55                       | 73, 21                      |
   | orange | 64, 41                       | 79, 27                      |
   | yellow | 52, 34                       | 65, 86                      |
   | green  | 52, 34                       | 64, 85                      |
   | teal   | 33, 22                       | 40, 54                      |
   | cyan   | 28, 18                       | 34, 45                      |
   | blue   | 44, 29                       | 55, 22                      |
   | violet | 99, 78                       | 71, 25                      |
   | purple | 91, 61                       | 109, 34                     |

   On light paper the subject is the harder limit for every hue. On dark
   paper it is the harder limit for red, orange, blue, violet and purple, and
   the accent is the harder limit for yellow, green, teal and cyan. A hue with
   little chroma at the subject's distance gives a subject line that looks
   like muted or ink. Colours also change their names as they move away from
   the paper: on light paper, a yellow becomes olive and an orange becomes
   brown.

7. **The accent** (`--palette-accent`) follows: the hue, at the distance from
   the paper that large text needs. Check it on the panel, and its difference
   from the ink. On light paper the accent is near the ink's lightness, so it
   needs enough chroma to differ from the ink. The house prefers colours that
   are not too saturated, but there is a minimum too.
8. **The subject** (`--palette-subject`) follows: the hue, moved away from the
   paper until the drawings pass the back-row check
   ([legibility.md](legibility.md)). Ledger's is 9.6:1 on the panel, as an
   example. Check its difference from muted and from ink, so that the subject
   looks like neither its context nor a scale.
9. **The second** (`--palette-second`): the second choice of hue. Check it on
   the panel, and its colour-blind difference from the accent and from the
   subject. These are the house's colour-blindness checks, and they limit the
   second's hue: a warm accent beside a green second fails (see "Adding a
   colour"). A blue second has no such limit. A lightness gap from the accent
   is preferred; light themes cannot reach it.
10. **The washes** follow, one for each line colour that has faces (see "The
    pairs"). Usual recipes:
    - `--palette-subject-wash`: the paper, tinted toward the subject's hue at
      low chroma, near the border's lightness: about 1.2:1 on the panel.
    - `--palette-second-wash`: the second over the paper, at the blend that
      gives the subject wash's contrast.
    - `--palette-muted-wash`: muted over the paper at about 0.18.

    Where a wash is a plain mix, write the recipe as its value, with
    `color-mix()` (see "The roles"). Set a value of your own only to tune it.
    Check each line on its wash, and that each wash reads as a face but stays
    near the paper. On dark paper, the muted recipe can be too faint on the
    panel; then tune it.

11. **The material colours** follow (`--palette-water`, `--palette-ground`, and
    their washes). Each is `var()` of a role whose hue suits the material, or a
    value of its own. Check that each material's hue is in its range: water a
    blue, ground an earth colour or a grey.
12. **Check the drawings.** In each talk, the full validation runs `artcheck`,
    `barroom` and `motion` on the art with the new colours.

## The roles

A theme sets these variables on `.slidev-layout` in its CSS. For Ledger, that
file is `themes/ledger/styles/ledger.css`. It is the only place that sets them:
`tools/lib.py` reads them from there, and the WebGL art reads them from the
page ([webgl.md](webgl.md)). A value is a `#rrggbb` colour, `var()` of another
role, or `color-mix(in srgb, …)` of those: a recipe. A recipe follows its
roles, so a slide class that changes a role also changes what is made from it.

| Variable                 | Job in text and layout                 | Job in the art                                                                                                                              |
| ------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `--palette-background`   | the slide field                        | the paper of full-slide art and of the WebGL art                                                                                            |
| `--palette-ink`          | body text, headings                    | scales and fine detail: ticks, graduations; usually at 0.5 (WebGL ink `ink`)                                                                |
| `--palette-muted`        | captions, units, dates, secondary text | context: what holds or acts on the subject (a stand, a case, a clamp), as a line (WebGL ink `muted`)                                        |
| `--palette-accent`       | the one emphasised thing on a slide    | not used: see `--palette-subject`                                                                                                           |
| `--palette-second`       | the turn: the catch, the warning       | "look here": a flash's lines, and a keyword callout's word and leader ([illustrations.md](illustrations.md), "Leaders"; WebGL ink `second`) |
| `--palette-panel`        | a card's fill                          | the paper of a card's art                                                                                                                   |
| `--palette-border`       | a card's edge                          | not used                                                                                                                                    |
| `--palette-subject`      | not used                               | the subject: its structure, and the thing that moves (WebGL ink `subject`)                                                                  |
| `--palette-subject-wash` | not used                               | the subject's faces (WebGL ink `subjectWash`)                                                                                               |
| `--palette-muted-wash`   | not used                               | the faces of the context (WebGL ink `mutedWash`)                                                                                            |
| `--palette-second-wash`  | not used                               | a flash's faces (WebGL ink `secondWash`)                                                                                                    |
| `--palette-water`        | not used                               | water, where it meets another material                                                                                                      |
| `--palette-ground`       | not used                               | ground and stone, where they meet another material                                                                                          |
| `--palette-ground-wash`  | not used                               | the faces of ground and stone                                                                                                               |

How a drawing uses these (faces, substances, strokes) is in
[illustrations.md](illustrations.md).

**Use the variables, not values.** Components read `var(--palette-ink)` and so
on, so everything on a slide follows the theme. An inlined SVG does the same
through its classes ([illustrations.md](illustrations.md)).

**One accent per slide.** The accent is not "the blue one". It is _the thing
you want them to look at_. A slide with four accented spans has none. The
card's one big number is the canonical use.

**`second` is for the turn, not for decoration.** On the cards it carries the
catch ("Freezes in winter"). Used as a second decorative accent, it is wasted.
In the art its job is "look here": a flash, and a keyword callout's word and
leader. The accent cannot do it there, because the subject is the accent's own
hue. A flash and a keyword callout must not show at the same time: a flashed
part would merge with a leader.

## The pairs: line colours and their washes

Each line colour that has faces has a **wash**: a solid colour near the paper,
for those faces. A face is drawn in its wash, or in a variation of it, never in
its line colour at a low opacity. The line colour itself, at 0.6 or more, is
for a substance (water, sand) or a small dark part
([illustrations.md](illustrations.md), "Washes").

| Line colour | Its wash     | Faces in it                         |
| ----------- | ------------ | ----------------------------------- |
| subject     | subject-wash | the subject's parts                 |
| muted       | muted-wash   | what holds the subject: a case      |
| second      | second-wash  | a flashed part                      |
| ground      | ground-wash  | the ground, a stand, a pool's walls |
| water       | (none yet)   | water is drawn as a substance       |

Ink and the accent have no wash: ink draws lines and small solids only, and
the accent is not in the art. Add a wash when a drawing first needs a face for
that line colour. `WASH_PAIRS` in `tools/lib.py` lists the pairs.

**A material colour** (water, ground) is a role only where two materials sit
side by side and their colours tell them apart: the pool on slide 2 of
`watches`. Water that is the subject of its drawing (a water clock) is drawn in
the subject colour. Without material roles, a theme whose subject is brown and
whose muted is blue would draw the pool's water like mud.

## One slide can change a role

Slidev puts a slide's `class:` on the slide's `.slidev-layout` element. A rule
with the selector `.slidev-layout.<class>` changes roles for those slides
only:

```css
.slidev-layout.warm {
  --palette-accent: #9a3a10;
}
```

Put the rule in the talk's `styles/`, or in a `<style>` on the slide. Use a
`#rrggbb` value and a role that the theme sets. A recipe of the theme that uses
the role follows it: a slide that changes `--palette-muted` also changes
`--palette-muted-wash`. `uv run tools/palette.py --talk <talk>` fails if the
talk sets a `--palette-*` variable in any other rule, in any of its source
files (it skips only `docs/`, `tasks/`, `public/`, the READMEs and the
dependencies), and it measures each such slide's palette against the gates.
Drawings inlined in the slide follow the override. A layer for the whole talk
does not: it is outside the slide's element (in `watches`, the WebGL watch and
the diving board, in `global-bottom.vue`), and the WebGL watch reads the
palette once, when the page loads.

## The gates

Every gate is measured against the surface the mark sits on. Text on a card
sits on the panel, not on the background. In Ledger the panel is the darker,
so the harder, of the two, and `tools/lib.py` measures the text gates against
it. **A new theme whose panel is not the harder surface needs its gates
measured against the background as well.** A wash has its least contrast on
the panel and its most on the background, in light and dark themes, so its
lower bound is checked on the panel and its upper bound on the background.

The thresholds are in `tools/lib.py` (`GATES` and `HUE_GATES`); this table
gives them with their reasons. `uv run tools/palette.py` measures the theme
against each one, and shows how much room light each pair survives.

| Check                          | Threshold                                     | Why                                                                       |
| ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------------- |
| ink on background and on panel | ≥ 12:1                                        | headroom to degrade from                                                  |
| accent on panel                | ≥ 4.5:1                                       | the 37 px stat number                                                     |
| second on panel                | ≥ 3.5:1                                       | 20 px bold is large text: the 3:1 floor plus margin                       |
| muted on panel                 | ≥ 4.5:1                                       | 17 px body is normal text, so WCAG AA applies                             |
| accent vs **ink**              | ≥ ΔE76 35                                     | emphasis must read as emphasis, not as darker ink                         |
| accent vs second               | ≥ ΔE76 25 under deuteranopia _and_ protanopia | colour-blind separation                                                   |
| accent/second lightness        | ≥ 1.4×, preferred                             | hue fails before lightness does                                           |
| subject vs muted               | ≥ ΔE76 30                                     | the subject must not look like its context                                |
| subject vs ink                 | ≥ ΔE76 30                                     | the subject must not look like a scale or a leader                        |
| second vs subject              | ≥ ΔE76 25, colour-blind                       | a flash and a keyword callout must show for every viewer                  |
| each line on its wash          | ≥ 3:1                                         | a drawn mark's floor: the face must not hide its outline                  |
| each wash on panel             | ≥ 1.12:1                                      | a face, not bare paper: the faintest face that the art used and that read |
| each wash on background        | ≤ 1.5:1                                       | a face stays near the paper, so it does not compete with the lines        |
| water's hue                    | h 190–300, C\* ≥ 15                           | water reads as water: cyan to blue-violet                                 |
| ground's hue                   | h 20–110, or C\* < 10                         | ground reads as earth, or as stone                                        |

Of the 23 candidate themes, 5 pass every gate and 10 pass the gates for text
alone. The art's gates fail most often in dark themes with a warm accent: the
accent, moved away from dark paper, becomes a cream near the white ink. The
data is in the task
([`2026-10-07-theme-colour-system`](../tasks/2026-10-07-theme-colour-system/PLAN.md),
§4.8). The derived subject in that data used Ledger's 9.6:1; a dark theme may
need less, which nobody has measured.

## Two marks of the same hue need a lightness gap

Hue separation fails before lightness separation does. Two marks of the same
hue that differ only in saturation or opacity merge as a room gets brighter.

> **≥ 1.4× lightness separation** between same-hue marks that sit inside,
> against or next to each other.

The water in the water clock is the same hue as the vessel that holds it, so
it is bracketed from both sides ([illustrations.md](illustrations.md),
"Washes"). The same rule applies to a chart with two shades of one colour, or
to a highlighted part in a tint of its parent. `uv run tools/palette.py
"#6D839B"` reports the lightness ratio against every role.

## Adding a colour

The usual right answer is to **reuse a role**. The roles above are already
more than most slides need. A search of every colour for one more hue beside
Ledger's subject, accent and second found none that red-green colour-blind
viewers could tell from all of them by more than about ΔE 23 (the
[task](../tasks/2026-10-07-theme-colour-system/PLAN.md), §4.10).

When a slide really needs one more, measure it before you commit:

```bash
uv run tools/palette.py "#C0451C"           # every surface, every neighbour
uv run tools/palette.py "#C0451C" accent    # ... and against one role's gates
```

It reports contrast against every surface, ΔE against every existing mark, the
colour-blind separation, and the room-light headroom. As a replacement for a
role, it makes the recipes from that role again. **Do not estimate
colour-blind risk by eye.** Hand estimates in the palette task were wrong in
both directions.

Three traps:

- **A warm accent beside a green is a colour-blind trap**, and it gets worse as
  the warm colour gets more saturated. Blue secondaries have no such limit.
- **Red-green deficiency shifts red toward grey**, so grey with burgundy is the
  hardest common pair. It works only with a large lightness gap.
- **A mid-lightness, saturated field is neither a good light nor a good dark.**
  One early field capped white text at 8.7:1: 40% of the contrast was gone
  before any other colour was chosen.

## The current theme: Ledger

Warm cream, deep blue, warm brown, with Fraunces titles and IBM Plex text. The
values are in `themes/ledger/styles/ledger.css`; `uv run tools/palette.py`
prints them with each gate. The theme package and its rules are in
[`themes/ledger/README.md`](../themes/ledger/README.md). As examples, its
values on 2026-10-07:

| Role         | Value                                                                                                                                              | Looks like            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| background   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FAF7F0;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FAF7F0` | a warm off-white      |
| panel        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#F2EEE4;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#F2EEE4` | a light cream         |
| border       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E0D9CA;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E0D9CA` | a light beige         |
| ink          | <span style="display:inline-block;width:1.5em;height:1.5em;background:#2A2520;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#2A2520` | a near-black brown    |
| muted        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#736A60;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#736A60` | a warm grey-brown     |
| accent       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#1F5FA8;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#1F5FA8` | a mid blue            |
| second       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#9A6238;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#9A6238` | a caramel brown       |
| subject      | <span style="display:inline-block;width:1.5em;height:1.5em;background:#143C6B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#143C6B` | a dark navy blue      |
| subject-wash | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D3DCE3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D3DCE3` | a very pale blue-grey |
| muted-wash   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E2DED6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E2DED6` | a pale warm grey      |
| second-wash  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E6D8CA;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E6D8CA` | a pale beige          |

Water is the subject colour, ground is muted, and the ground's wash is muted's.

**How Ledger made its art colours.** The subject is the accent moved away from
the paper (darker) along its hue: 5.56:1 on the panel to 9.60:1. Do not "fix"
the subject back to the accent: a 2–4 px line needs more contrast than a 37 px
numeral. The subject wash has the border's lightness and a chroma of about 5;
it is greyer than any mix of the subject, so it is a value, not a recipe. The
muted and second washes are their recipes: muted at 18% and second at 20.8%
over the background (the subject wash's contrast).

**Why Ledger, in one line: pasted content is mostly light.** Code blocks,
charts, screenshots, papers and wiki diagrams almost all have a light
background. A light deck takes them in; a dark deck turns each one into a
bright rectangle aimed at the audience. If the talks turn out to be led by
photos instead, a dark theme could win.

**Its thin margins:**

- **muted on the panel is 4.58:1 against a gate of 4.5.** It is the thinnest
  value in the palette and the first text colour to fail as the room gets
  brighter. Never make muted text smaller than 17 px, and never put muted text
  on the border (3.78:1). If a caption must be smaller, make it ink.
- **accent/second lightness is 1.28×, not 1.4×.** On a light field, both must
  be dark to have contrast, so they separate by hue (ΔE 75, also for
  colour-blind viewers). Hue is what fades first in a bright room.

**Consequences of a light theme:**

- Shiki's code theme is set for the deck, not per slide. A code block renders
  light on every slide. On Ledger that seam is invisible. A guest presenter
  could undo this without noticing if the deck went dark.
- A house frame for pasted images (padded, rounded, a little tinted) would
  soften the seam for any theme. It is not built yet.

The survey of every colour in the watches talk's art, and how each one was
used before the washes had names, is in the flash task
([`COLOUR-ROLES.md`](../watches/tasks/2026-09-30-flash/COLOUR-ROLES.md)).

## Dark themes

Four dark themes were built and measured on rendered pixels (the
animation-style task, §7 and §8.5). **Room light does not favour light
themes:** measured without clipping, the best dark candidate beat Ledger at
every level of flare. So "keep it light because the room may be bright" is
not a reason. The reason for Ledger is pasted content, above.

One dark slide is fine and is recommended: **a full-bleed dark slide at the
talk's turning point.** A dark _card_ inside a light slide reads as a
rendering error. A dark _slide_ reads as a dark slide.
