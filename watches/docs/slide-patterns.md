# Slide patterns

How a slide in this deck is actually built: the theme, the components, the
click conventions and the speaker notes. `slides.md` is the working example —
the "Before clocks" slide uses every pattern here.

## The theme

Every slide is Ledger, because the deck uses the house theme:

```yaml
theme: ledger # stem/themes/ledger/, shared by all the STEM talks
```

The theme sets the seven `--palette-*` palette variables, the slide background, the
text colour and the fonts, on every slide. A slide needs no class to get them. So
a slide's own `<style>` holds only its layout:

```md
---
layout: full
class: tk-timekeepers
---

# Before clocks, time was a flow

...

<style>
.tk-timekeepers {
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-timekeepers h1 {
  margin: 0; /* the flex gap spaces it */
}
</style>
```

Three notes on that block:

- **Use a markdown `#` heading for the title.** The theme styles `h1` as the
  slide title: Fraunces 600, 37 px, ink.
- **Never set a colour or a font on the slide.** Use `var(--palette-accent)` and the
  other variables for colour. In a component, use `@apply font-serif` or
  `@apply font-mono` for type. If a slide needs a colour that the palette does
  not have, see [theme.md](../../docs/theme.md#adding-a-colour).
  `tools/palette.py` fails if a slide, page or component declares a
  `--palette-*` variable.
- **`layout: full` plus a class, not a custom layout.** It keeps each slide's layout
  next to its content, which has been worth more than the duplication costs — the
  slide you are reading is the slide you are editing.

Typefaces: **Fraunces** (serif, 600) for titles and card names, **IBM Plex Sans**
(400, 500, 600) for body, **IBM Plex Mono** (600) for numbers and code. Each has
a real fallback stack.

**The fonts are self-hosted.** The theme imports them from the `@fontsource/*`
packages in `themes/ledger/styles/fonts.css`, and `pnpm build` copies the font
files into `dist/`. The deck makes no outside requests, so it needs no network
at the venue. Only the weights listed above are imported. **If you use a new
weight, add its import to the theme in the same change.** If you do not, the
browser uses the nearest imported weight or fakes a bold, and gives no error.

## `TimekeeperCard.vue`

One card: a drawing, a date, a name, one big number, its unit, and the catch.

```md
<TimekeeperCard
  name="Water clock" date="c. 1400 BCE"
  img="/timekeepers/line-weighted/water-clock.svg"
  stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
/>
```

| prop      | meaning                                                                |
| --------- | ---------------------------------------------------------------------- |
| `name`    | 29 px serif, ink                                                       |
| `date`    | 17 px muted, under the art                                             |
| `img`     | the SVG, shown at the `width` and `height` it states (122 × 97 here)   |
| `stat`    | **the one number**: 37 px mono, accent                                 |
| `unit`    | 17 px muted, what the number means                                     |
| `problem` | 20 px bold, `--palette-second`: the catch                              |
| `unknown` | draws `stat` in muted instead of accent — for "we could not find data" |

It is purely presentational: the **slide** decides when a card appears and when it
dims (see [Clicks](#clicks)). The card only knows how to look.

**`unknown` is worth using honestly.** Two of the four cards say `?` because no
reliable accuracy figure was found for a candle clock or an hourglass. Drawing that
in muted rather than accent says "we looked and there isn't one" instead of
implying a measurement.

## Clicks

The cards appear one click at a time, and the takeaway line comes last. The
cards are an array in the slide's `<script setup>`, so the click numbers come
from their position:

```md
<div class="tk-grid">
  <TimekeeperCard v-for="(card, i) in cards" :key="card.name" v-bind="card" v-click="i + 1" />
</div>

<div v-click="cards.length + 1" class="tk-takeaway">
```

To add a card, add it to the array. Add a `[click]` line to the speaker notes
too.

**Dimming is CSS in the slide, not a prop.** While a card is being discussed,
the cards before it fade to 35%. When the takeaway appears, they come back.
`v-click` gives the element of the current click the class
`slidev-vclick-current`, and gives elements whose click has passed the class
`slidev-vclick-prior`. One rule uses them:

```css
.tk-grid:has(> .slidev-vclick-current) > .slidev-vclick-prior {
  opacity: 0.35;
}
```

The takeaway is outside `.tk-grid`, so on its click no card in the grid is
current and nothing is dimmed. The dim fades in 0.35 s; the reveal keeps
Slidev's 0.1 s.

**Do not bind `:class` on the card's root element.** `v-click` adds its classes
to that element. When a `:class` binding changes, Vue rewrites the element's
classes and removes the `v-click` classes, and the dim rule stops working.

## Speaker notes

The last HTML comment on a slide becomes the presenter note. The convention in this
deck:

```md
<!--
The spoken line for the opening.

[click] What to say when the first card lands.

[click] ...

IF ASKED: the tangent you do not say unless someone asks. Rome's first public
sundial was war loot from Sicily; Pliny says Romans followed its wrong hours for
99 years.
-->
```

- **`[click]` markers line up with the reveal**, so the notes and the slide advance
  together.
- **`IF ASKED:` at the end** holds the material that is too good to delete and too
  long to say. A 15–20 minute talk in a bar has no room for it, and the questions
  afterwards do.

## Slide sizes and what fits

The canvas is 980 × 552 CSS px. Type sizes are in
[legibility.md](../../docs/legibility.md#text-sizes); the short version is that **17 px is the
floor for anything anyone has to read** and four cards in a 2 × 2 grid is what fits
with a title and a takeaway line.

If a slide is overflowing, the answer is a second slide. This deck is 15–20 minutes
of a monthly meetup, not a document.

## Borrowed assets

**Anything not drawn for this deck needs a credits slide**, with the title linked to
its source, the author, the licence linked to its terms, what was changed, and where
it is used. A talk is a public performance, and the licences we borrow under ask for
credit on every copy performed, not just every copy distributed.

The deck currently borrows **nothing** — the credits slide was removed on 2026-09-21
along with the one asset it credited. If you add a borrowed image, bring the slide
back; `tasks/2026-09-20-animation-style/source-video/README.md` has the format and
the history.

## Before you ship

```bash
# in stem/
pnpm format                       # prettier -- required, see stem/AGENTS.md
python3 tools/palette.py          # the palette still passes its own gates
python3 tools/artcheck.py         # every SVG: structure, grammar, legibility
# in watches/
pnpm build                        # it actually builds
```

`stem/.prettierrc` sends deck files to `prettier-plugin-slidev` and all other
Markdown to the normal Markdown parser. **This split is necessary**: the Markdown
parser breaks a slide's frontmatter. If you add a deck whose filename is not
`slides.md`, `slides-*.md` or `pages/*.md`, add it to the `files` array in
`stem/.prettierrc` **in the same change**. `stem/AGENTS.md` has the details.
