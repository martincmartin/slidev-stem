# Theme: colour roles and gates

**Covers:** the colour roles that every theme fills, the gates each role must
pass, how one slide changes a role, and how to add a colour. Then the current
theme, Ledger, as the example.
**Read before** you choose, compare, measure or add a colour, or make a new
theme.
**Tasks:**
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
(`second` in the art: the flash, and its pale fill).

The theme is not final. It will be chosen again when a deck is more complete,
and a dark theme may be tried. So the roles and the gates below are the rules.
Ledger's values are one theme that passes them.

## The roles

A theme sets ten variables on `.slidev-layout` in its CSS. For Ledger, that
file is `themes/ledger/styles/ledger.css`. It is the only place that sets them:
`tools/lib.py` reads them from there, and the WebGL art reads them from the
page ([webgl.md](webgl.md)).

| Variable                        | Job in text and layout                 | Job in the art                                                                                                        |
| ------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `--palette-background`          | the slide field                        | the paper of full-slide art and of the WebGL art                                                                      |
| `--palette-ink`                 | body text, headings                    | scales and fine detail: ticks, graduations; usually at 0.5 (WebGL ink `detail`)                                       |
| `--palette-muted`               | captions, units, dates, secondary text | context: what holds or acts on the subject (a stand, a case, a clamp); as a line, and a 0.18 wash (WebGL ink `frame`) |
| `--palette-accent`              | the one emphasised thing on a slide    | not used: see `art-line`                                                                                              |
| `--palette-second`              | the turn: the catch, the warning       | a flash's lines: a short "look here" ([illustrations.md](illustrations.md), "Flash"; WebGL ink `second`)              |
| `--palette-panel`               | a card's fill                          | the paper of a card's art                                                                                             |
| `--palette-border`              | a card's edge                          | not used                                                                                                              |
| `--palette-art-line`            | not used                               | the subject: its structure, and the thing that moves (WebGL ink `line`)                                               |
| `--palette-art-knockout`        | not used                               | a pale, opaque face that reads as lit, not as bare paper (WebGL ink `knockout`)                                       |
| `--palette-art-second-knockout` | not used                               | a flash's fill: a pale second, as art-knockout is a pale art-line (WebGL ink `secondKnockout`)                        |

How a drawing uses these (opacity, washes, strokes) is in
[illustrations.md](illustrations.md).

**Use the variables, not values.** Components read `var(--palette-ink)` and so
on, so everything on a slide follows the theme. An inlined SVG does the same
through its classes ([illustrations.md](illustrations.md)).

**One accent per slide.** The accent is not "the blue one". It is _the thing
you want them to look at_. A slide with four accented spans has none. The
card's one big number is the canonical use.

**`second` is for the turn, not for decoration.** On the cards it carries the
catch ("Freezes in winter"). Used as a second decorative accent, it is wasted.
In the art it has one more job: a short "look here", the flash. The accent
cannot do it there, because the art line is the accent's own hue: the subject
is already in it.

**The art line is the accent, darkened along its own hue.** The accent is
sized for a large numeral. A 2–4 px line spends the same contrast at a much
smaller size, so the line needs more. In Ledger, the accent is 5.56:1 on the
panel and the art line is 9.60:1. Do not "fix" the art line back to the accent.

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
`#rrggbb` value and a role that the theme sets. `uv run tools/palette.py --talk
<talk>` fails if the talk sets a `--palette-*` variable in any other rule, and
it measures each such slide's palette against the gates. Inlined drawings
follow the override.

## The gates

Every gate is measured against the surface the mark sits on. Text on a card
sits on the panel, not on the background. In Ledger the panel is the darker,
so the harder, of the two, and `tools/lib.py` measures the text gates against
it. **A new theme whose panel is not the harder surface needs its gates
measured against the background as well.**

| Check                   | Against             | Threshold | Why                                                       |
| ----------------------- | ------------------- | --------- | --------------------------------------------------------- |
| ink                     | panel               | ≥ 12:1    | headroom to degrade from                                  |
| accent                  | panel               | ≥ 4.5:1   | the 37 px stat number                                     |
| second                  | panel               | ≥ 3.5:1   | 20 px bold is large text: the 3:1 floor plus margin       |
| muted                   | panel               | ≥ 4.5:1   | 17 px body is normal text, so WCAG AA applies             |
| accent vs **ink**       | —                   | ≥ ΔE76 35 | emphasis must read as emphasis, not as darker ink         |
| accent vs second        | —                   | ≥ ΔE76 25 | under deuteranopia _and_ protanopia                       |
| accent/second lightness | —                   | ≥ 1.4×    | preferred: hue fails before lightness does                |
| second                  | art-second-knockout | ≥ 3:1     | a flash's line on its fill: the drawing's structure holds |

The thresholds are in `tools/lib.py` (`GATES`). `uv run tools/palette.py` (in
`stem/`) measures the theme against each one, and shows how much room light
each pair survives.

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

The usual right answer is to **reuse a role**. Ten roles are already more than
most slides need.

When a slide really needs one more, measure it before you commit:

```bash
uv run tools/palette.py "#C0451C"           # every surface, every neighbour
uv run tools/palette.py "#C0451C" accent    # ... and against one role's gates
```

It reports contrast against every surface, ΔE against every existing mark, the
colour-blind separation, and the room-light headroom. **Do not estimate
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
[`themes/ledger/README.md`](../themes/ledger/README.md).

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

## Dark themes

Four dark themes were built and measured on rendered pixels (the
animation-style task, §7 and §8.5). **Room light does not favour light
themes:** measured without clipping, the best dark candidate beat Ledger at
every level of flare. So "keep it light because the room may be bright" is
not a reason. The reason for Ledger is pasted content, above.

One dark slide is fine and is recommended: **a full-bleed dark slide at the
talk's turning point.** A dark _card_ inside a light slide reads as a
rendering error. A dark _slide_ reads as a dark slide.
