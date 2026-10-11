# Theme: making a theme, its colour roles and gates

**Covers:** how to make a theme, step by step; the colour roles that every
theme fills; the line colours and their washes; the gates each role must pass;
how one slide changes a role; palette classes, which show a slide in another
palette; and how to add a colour. Then the current theme, Ledger, as the
example; the house themes built on it, which a talk chooses with its
`theme:` line; and the top picks: every house theme, side by side.
**Read before** you choose, compare, measure or add a colour, make a new
theme, or show a slide in another palette.
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
(`second` in the art: the flash, and its face),
[`tasks/2026-10-07-palette-preview/`](../tasks/2026-10-07-palette-preview/PLAN.md)
(palette classes; the watch takes the slide's palette).

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
   is preferred. On light paper both must be dark, so the gap is hard to reach.
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
file is `themes/ledger/styles/ledger.css`; a theme built on Ledger sets the
roles that it changes in `themes/<name>/styles/<name>.css` (see "The house
themes"). These are the only places that set them: `tools/lib.py` reads them
from there, and the WebGL art reads them from the page ([webgl.md](webgl.md)). A value is a `#rrggbb` colour, `var()` of another
role, or `color-mix(in srgb, …)` of those: a recipe. A recipe follows its
roles, so a slide class that changes a role also changes what is made from it.

| Variable                 | Job in text and layout                 | Job in the art                                                                                                                                              |
| ------------------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--palette-background`   | the slide field                        | the paper of full-slide art and of the WebGL art                                                                                                            |
| `--palette-ink`          | body text, headings                    | scales and fine detail: ticks, graduations; usually at 0.5 (WebGL ink `ink`)                                                                                |
| `--palette-muted`        | captions, units, dates, secondary text | context: what holds or acts on the subject (a stand, a case, a clamp), as a line (WebGL ink `muted`)                                                        |
| `--palette-accent`       | the one emphasised thing on a slide    | not used: see `--palette-subject`                                                                                                                           |
| `--palette-second`       | the turn: the catch, the warning       | "look here": a flash's lines, a keyword callout's word and leader, and a mark's lines ([illustrations.md](illustrations.md), "Leaders"; WebGL ink `second`) |
| `--palette-panel`        | a card's fill                          | the paper of a card's art                                                                                                                                   |
| `--palette-border`       | a card's edge                          | not used                                                                                                                                                    |
| `--palette-subject`      | not used                               | the subject: its structure, and the thing that moves (WebGL ink `subject`)                                                                                  |
| `--palette-subject-wash` | not used                               | the subject's faces (WebGL ink `subjectWash`)                                                                                                               |
| `--palette-muted-wash`   | not used                               | the faces of the context (WebGL ink `mutedWash`)                                                                                                            |
| `--palette-second-wash`  | not used                               | a flash's faces, and a mark's faces (WebGL ink `secondWash`)                                                                                                |
| `--palette-water`        | not used                               | water, where it meets another material                                                                                                                      |
| `--palette-ground`       | not used                               | ground and stone, where they meet another material                                                                                                          |
| `--palette-ground-wash`  | not used                               | the faces of ground and stone                                                                                                                               |

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
In the art its job is "look here": a flash, a keyword callout's word and
leader, and a mark on part of a part (the teeth on the Gears slide of
`watches`). The accent cannot do it there, because the subject is the accent's
own hue. A flash, a keyword callout and a mark must not show near each other
at the same time: a flashed part or a mark would merge with a leader.

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
side by side and their colours tell them apart: the pool on the Hairspring slide of
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
Drawings inlined in the slide follow the override.

**A layer outside the slide must take the slide's palette itself.** It is not
inside the slide's `.slidev-layout`, so the rule does not reach it. In
`watches`, the watch and the diving board are such layers (`global-bottom.vue`,
`slide-bottom.vue`). `slidePalette()` in `watches/watch/palette.ts` reads the
`--palette-*` values from a hidden element with the slide's classes. The layer
sets them on itself, and gives the WebGL renderer the colours. So any class
that changes a role reaches the watch, not only a palette class.

## Palette classes: a slide in another palette

A palette class shows a slide in another whole palette: add it to the slide's
`class:`.

```yaml
class: palette-campfire # with a layout class: `class: balance-wheel palette-campfire`
```

The house palette classes are in `themes/ledger/styles/palettes.css`, for
every talk, light or dark. Each is a rule `.slidev-layout.palette-<name>` that
sets the roles it changes. A role that it does not set keeps the theme's
recipe, made from the class's roles. Values may be recipes, as in the theme.

**Each palette class must pass every gate, as the theme must.** `uv run
tools/palette.py` checks each class's gates, and fails if one misses a gate
or sets a role that the theme does not set. So any palette class can become
the talk's theme. Each house theme other than Ledger has a palette class of
its own name (`palette-campfire` for `theme: campfire`), with the same roles
and values, so any slide of any talk can preview it (`tools/test_lib.py`
checks that they match).

**To preview a slide in several palettes,** import the slide once for each
palette, and change only its class. A slide that is imported must be in its
own file under `pages/`:

```md
---
src: ./pages/hairspring.md
class: palette-campfire palette-preview
---
```

`palette-preview` puts the palette's name (the class's `--preview-name`) in
the slide's lower right corner, at 12 px in muted: the presenter can find it,
and the audience is not meant to notice it. It is below the 17 px floor of
[legibility.md](legibility.md) on purpose. Leave it out on a slide that uses a
palette for real.

**To add a palette class,** choose its text roles by "Making a theme". Then
`uv run tools/derive_palette.py <name> "<Display Name>" --background … --second …`
derives the art roles by the same steps and prints the rule, with its
`--preview-name`. Paste the rule into `palettes.css`, and run `uv run
tools/palette.py` for its gates. On dark paper the subject is a pale version
of the accent, which is seldom a water colour, so the tool gives water the
second or a blue of its own. A misspelt class matches no rule, and the slide
shows the theme's palette with no error.

**Known limit:** at a move between two slides with different palettes, the
watch's layer changes colour at once, while the old slide's text fades out.

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

Warm cream, deep blue, burnt orange, with Fraunces titles and IBM Plex text. The
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
| second       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#B5601E;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#B5601E` | a burnt orange        |
| subject      | <span style="display:inline-block;width:1.5em;height:1.5em;background:#143C6B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#143C6B` | a dark navy blue      |
| subject-wash | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D3DCE3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D3DCE3` | a very pale blue-grey |
| muted-wash   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E2DED6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E2DED6` | a pale warm grey      |
| second-wash  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#ECD8C4;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#ECD8C4` | a pale apricot        |

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

**Its thinnest margin:**

- **muted on the panel is 4.58:1 against a gate of 4.5.** It is the thinnest
  value in the palette and the first text colour to fail as the room gets
  brighter. Never make muted text smaller than 17 px, and never put muted text
  on the border (3.78:1). If a caption must be smaller, make it ink.

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

## The house themes

**To change a talk's theme, change the `theme:` line of its headmatter**, for
example `theme: ledger` to `theme: campfire`. Every slide takes the new theme:
the text, the cards, the inlined drawings, and the watch (which reads the
palette from the page). The house themes are Ledger and the six built on it,
in `themes/`:

| `theme:`              | Name                    | Paper | Changed from its candidate, to pass the gates                                |
| --------------------- | ----------------------- | ----- | ---------------------------------------------------------------------------- |
| `ledger`              | Ledger                  | light | (none)                                                                       |
| `campfire`            | Campfire                | dark  | (none)                                                                       |
| `after-hours`         | After-Hours Observatory | dark  | (none)                                                                       |
| `beacon`              | Beacon                  | dark  | the muted wash: muted at 22%, not 18%                                        |
| `kraft-ink`           | Kraft & Ink             | light | the ink, muted and the second, each a little darker; the subject; the washes |
| `field-notes`         | Field Notes             | light | the subject: 8.5:1 on the panel, not 9.6                                     |
| `electric-terracotta` | Electric Terracotta     | light | the accent, darker (a rust), and the ink                                     |

Each candidate's text roles are from
[`watches/tasks/2026-09-18-theme-colors/`](../watches/tasks/2026-09-18-theme-colors/README.md);
`tools/derive_palette.py` derived the art roles. Each change is the least that
passes its gate, and its file says why, gate by gate.

**A theme built on Ledger** is a small package, `themes/<name>/`: its
`styles/index.ts` loads Ledger's styles and then `styles/<name>.css`, which
sets the roles that the theme changes on `.slidev-layout`. A role that it does
not set keeps Ledger's recipe, made from the theme's roles, as for a palette
class. Its `setup/root.ts` and `vite.config.mts` are Ledger's, re-exported,
and its `package.json` sets Slidev's `colorSchema` (`dark` for dark paper, so that Slidev's own controls match). `uv run tools/palette.py`
measures every house theme against every gate, and fails if one misses.

**The talk links each theme it may use** in its `package.json`
(`"slidev-theme-campfire": "link:../themes/campfire"`), so changing the
`theme:` line needs no install. A new talk copies these links from the newest
talk.

**The art's files keep Ledger's colours as their fallbacks.** An inlined SVG
paints each mark with `var(--palette-<role>, <Ledger's hex>)`
([illustrations.md](illustrations.md)), so on a slide it takes the theme's
colours, and the house tools, which read and render the file on its own,
measure it in Ledger. The gates hold each house theme to the same pairs. So a
talk's scripts that write art (`watches/art/theme.py`) read Ledger, whichever
theme the talk names, and changing the theme changes no file but
`slides.md`. Two things stay Ledger's in every theme: the favicon, and an SVG
shown in an `<img>`, which no page CSS reaches.

**Light or dark is still the first choice** (step 1 of "Making a theme"):
Ledger is the house theme because pasted content is mostly light. In a dark
theme a pasted screenshot or chart is a bright rectangle.

## Top picks

The shortlist for when the theme is chosen again: every house theme (see
"The house themes"). Each is also a palette class (see "Palette classes"), so
any slide can show it, and each passes every gate. `uv run tools/palette.py`
measures each one.

The values are in `themes/ledger/styles/ledger.css` and in each theme's
`themes/<name>/styles/<name>.css`; as examples, their values on 2026-10-10.
A role that is a recipe is shown as the colour that it gives, and the
brackets say where it comes from. Water and ground are the pool on the Hairspring slide of
`watches`. On dark paper the subject is a pale accent, which is not a water
colour, so water is the second where the second is a blue, and a blue of its
own where it is not (`tools/derive_palette.py`).

| Role         | Ledger                                                                                                                                                                                | Campfire                                                                                                                                                                               | After-Hours Observatory                                                                                                                                                               | Beacon                                                                                                                                                                                | Kraft & Ink                                                                                                                                                                       |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| background   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FAF7F0;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FAF7F0`, a warm off-white                  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#241E1A;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#241E1A`, a near-black espresso brown        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#17202A;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#17202A`, a near-black navy                 | <span style="display:inline-block;width:1.5em;height:1.5em;background:#0F1C33;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#0F1C33`, a near-black navy                 | <span style="display:inline-block;width:1.5em;height:1.5em;background:#EFE1CA;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#EFE1CA`, a manila                      |
| panel        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#F2EEE4;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#F2EEE4`, a light cream                     | <span style="display:inline-block;width:1.5em;height:1.5em;background:#332A24;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#332A24`, a dark brown                       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#242C35;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#242C35`, a dark slate blue                 | <span style="display:inline-block;width:1.5em;height:1.5em;background:#202C41;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#202C41`, a dark navy                       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E5D3B6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E5D3B6`, a kraft tan                   |
| border       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E0D9CA;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E0D9CA`, a light beige                     | <span style="display:inline-block;width:1.5em;height:1.5em;background:#4A3D34;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#4A3D34`, a mid-dark brown                   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#3F454B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#3F454B`, a dark grey                       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#3A4558;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#3A4558`, a dark slate                      | <span style="display:inline-block;width:1.5em;height:1.5em;background:#CDB48C;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#CDB48C`, a mid kraft brown             |
| ink          | <span style="display:inline-block;width:1.5em;height:1.5em;background:#2A2520;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#2A2520`, a near-black brown                | <span style="display:inline-block;width:1.5em;height:1.5em;background:#F6EEE3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#F6EEE3`, a warm off-white                   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#F6F0DF;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#F6F0DF`, a warm off-white                  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FFFFFF;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FFFFFF`, white                             | <span style="display:inline-block;width:1.5em;height:1.5em;background:#1F1608;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#1F1608`, a near-black brown            |
| muted        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#736A60;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#736A60`, a warm grey-brown                 | <span style="display:inline-block;width:1.5em;height:1.5em;background:#B5A594;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#B5A594`, a warm grey-beige                  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#94948F;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#94948F`, a neutral grey                    | <span style="display:inline-block;width:1.5em;height:1.5em;background:#9197A1;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#9197A1`, a cool grey                       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#695944;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#695944`, a dark brown-grey             |
| accent       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#1F5FA8;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#1F5FA8`, a mid blue                        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FFB340;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FFB340`, an amber                           | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FFB84D;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FFB84D`, an amber                          | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FFC24E;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FFC24E`, a gold                            | <span style="display:inline-block;width:1.5em;height:1.5em;background:#14596F;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#14596F`, a petrol blue                 |
| second       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#B5601E;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#B5601E`, a burnt orange                    | <span style="display:inline-block;width:1.5em;height:1.5em;background:#54BCD6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#54BCD6`, a sky cyan                         | <span style="display:inline-block;width:1.5em;height:1.5em;background:#7FB3E8;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#7FB3E8`, a sky blue                        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#8FBEEA;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#8FBEEA`, a sky blue                        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#BD431A;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#BD431A`, a tomato red                  |
| subject      | <span style="display:inline-block;width:1.5em;height:1.5em;background:#143C6B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#143C6B`, a dark navy blue                  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FFCC8F;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FFCC8F`, a pale amber                       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FFCC8C;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FFCC8C`, a pale amber                      | <span style="display:inline-block;width:1.5em;height:1.5em;background:#FFCE7E;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#FFCE7E`, a pale gold                       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#024254;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#024254`, a dark petrol                 |
| subject-wash | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D3DCE3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D3DCE3`, a very pale blue-grey             | <span style="display:inline-block;width:1.5em;height:1.5em;background:#3D3731;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#3D3731`, a dark warm grey                   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#3D3730;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#3D3730`, a dark warm grey                  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#3D3731;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#3D3731`, a dark warm grey                  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#BAC5CB;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#BAC5CB`, a pale blue-grey              |
| muted-wash   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E2DED6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E2DED6`, a pale warm grey (muted at 18%)   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#3E3630;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#3E3630`, a dark brown-grey (muted at 18%)   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#2E353C;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#2E353C`, a dark blue-grey (muted at 18%)   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#2C374B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#2C374B`, a dark blue-grey (muted at 22%)   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D4C6AF;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D4C6AF`, a pale kraft (muted at 20%)   |
| second-wash  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#ECD8C4;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#ECD8C4`, a pale apricot (second at 20.8%)  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#2D3A3C;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#2D3A3C`, a dark slate teal                  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#29394B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#29394B`, a dark slate blue                 | <span style="display:inline-block;width:1.5em;height:1.5em;background:#263853;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#263853`, a dark slate blue                 | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E3BCA0;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E3BCA0`, a pale terracotta             |
| water        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#143C6B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#143C6B`, a dark navy blue (the subject)    | <span style="display:inline-block;width:1.5em;height:1.5em;background:#54BCD6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#54BCD6`, a sky cyan (the second)            | <span style="display:inline-block;width:1.5em;height:1.5em;background:#7FB3E8;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#7FB3E8`, a sky blue (the second)           | <span style="display:inline-block;width:1.5em;height:1.5em;background:#8FBEEA;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#8FBEEA`, a sky blue (the second)           | <span style="display:inline-block;width:1.5em;height:1.5em;background:#20739B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#20739B`, a mid blue                    |
| ground       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#736A60;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#736A60`, a warm grey-brown (muted)         | <span style="display:inline-block;width:1.5em;height:1.5em;background:#B5A594;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#B5A594`, a warm grey-beige (muted)          | <span style="display:inline-block;width:1.5em;height:1.5em;background:#94948F;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#94948F`, a neutral grey (muted)            | <span style="display:inline-block;width:1.5em;height:1.5em;background:#9197A1;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#9197A1`, a cool grey (muted)               | <span style="display:inline-block;width:1.5em;height:1.5em;background:#695944;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#695944`, a dark brown-grey (muted)     |
| ground-wash  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E2DED6;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E2DED6`, a pale warm grey (the muted wash) | <span style="display:inline-block;width:1.5em;height:1.5em;background:#3E3630;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#3E3630`, a dark brown-grey (the muted wash) | <span style="display:inline-block;width:1.5em;height:1.5em;background:#2E353C;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#2E353C`, a dark blue-grey (the muted wash) | <span style="display:inline-block;width:1.5em;height:1.5em;background:#2C374B;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#2C374B`, a dark blue-grey (the muted wash) | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D4C6AF;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D4C6AF`, a pale kraft (the muted wash) |

| Role         | Field Notes                                                                                                                                                                           | Electric Terracotta                                                                                                                                                                    |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| background   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#F8F5EC;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#F8F5EC`, a warm off-white                  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#F6E7D8;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#F6E7D8`, a pale peach                       |
| panel        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#F0EBDE;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#F0EBDE`, a light cream                     | <span style="display:inline-block;width:1.5em;height:1.5em;background:#EADCCE;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#EADCCE`, a light peach-beige                |
| border       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#DED7C4;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#DED7C4`, a light beige                     | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D2C6BB;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D2C6BB`, a light taupe                      |
| ink          | <span style="display:inline-block;width:1.5em;height:1.5em;background:#2A2A22;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#2A2A22`, a near-black olive                | <span style="display:inline-block;width:1.5em;height:1.5em;background:#211E27;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#211E27`, a near-black violet-grey           |
| muted        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#74644C;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#74644C`, a warm brown-grey                 | <span style="display:inline-block;width:1.5em;height:1.5em;background:#655F62;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#655F62`, a warm grey                        |
| accent       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#1B5D82;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#1B5D82`, an ink blue                       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#A74026;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#A74026`, a rust terracotta                  |
| second       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#6F7E42;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#6F7E42`, a moss green                      | <span style="display:inline-block;width:1.5em;height:1.5em;background:#5252A3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#5252A3`, an indigo                          |
| subject      | <span style="display:inline-block;width:1.5em;height:1.5em;background:#014667;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#014667`, a dark ink blue                   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#631400;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#631400`, a dark oxblood                     |
| subject-wash | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D1D8E1;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D1D8E1`, a very pale blue-grey             | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D6C9C5;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D6C9C5`, a pale rose-grey                   |
| muted-wash   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E0DBCF;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E0DBCF`, a pale warm grey (muted at 18%)   | <span style="display:inline-block;width:1.5em;height:1.5em;background:#DCCFC3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#DCCFC3`, a pale warm beige (muted at 18%)   |
| second-wash  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D8D9C4;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D8D9C4`, a pale sage                       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#D4C9CD;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#D4C9CD`, a pale mauve-grey                  |
| water        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#337FA8;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#337FA8`, a mid blue                        | <span style="display:inline-block;width:1.5em;height:1.5em;background:#5252A3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#5252A3`, an indigo (the second)             |
| ground       | <span style="display:inline-block;width:1.5em;height:1.5em;background:#74644C;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#74644C`, a warm brown-grey (muted)         | <span style="display:inline-block;width:1.5em;height:1.5em;background:#655F62;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#655F62`, a warm grey (muted)                |
| ground-wash  | <span style="display:inline-block;width:1.5em;height:1.5em;background:#E0DBCF;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#E0DBCF`, a pale warm grey (the muted wash) | <span style="display:inline-block;width:1.5em;height:1.5em;background:#DCCFC3;border:1px solid #888;vertical-align:middle">&nbsp;</span> `#DCCFC3`, a pale warm beige (the muted wash) |
