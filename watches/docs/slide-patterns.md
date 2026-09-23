# Slide patterns

How a slide in this deck is actually built: the theme block, the components, the
click conventions and the speaker notes. `slides.md` is the working example —
the "Before clocks" slide uses every pattern here.

## The theme block

Slidev's `seriph` theme is the base. A content slide opts into Ledger with the
`tk-slide` class. That class is defined once, in
[`styles/index.css`](../styles/index.css). It sets the seven `--tk-*` palette
variables, the slide background and the text colour, so it themes the slide and
every component on it. The slide's own `<style>` holds only its layout:

```md
---
layout: full
class: tk-slide tk-timekeepers
---

<div class="tk-title">Before clocks, time was a flow</div>

...

<style>
.tk-slide.tk-timekeepers {
  font-family: "IBM Plex Sans", Arial, sans-serif;
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: relative;
}
.tk-title {
  font-family: "Fraunces", Georgia, serif;
  font-weight: 600;
  font-size: 37px;
  line-height: 1.1;
}
</style>
```

Two notes on that block:

- **Never set a colour on the slide.** Use `var(--tk-accent)` and the other
  variables. If a slide needs a colour that the palette does not have, see
  [theme.md](theme.md#adding-a-colour). Until 2026-09-23 each slide declared the
  palette itself, and the second role was named `--tk-warn`. Now the palette is in
  one place, and the names match `LEDGER` in `tools/lib.py`.
- **`layout: full` plus a class, not a custom layout.** It keeps each slide's layout
  next to its content, which has been worth more than the duplication costs — the
  slide you are reading is the slide you are editing.

Typefaces: **Fraunces** (serif, 600) for titles and card names, **IBM Plex Sans**
(400, 500, 600) for body, **IBM Plex Mono** (600) for numbers. Each has a real
fallback stack.

**The fonts are self-hosted**, from the `@fontsource/*` packages, and
[`styles/index.css`](../styles/index.css) imports them. `pnpm build` copies the
font files into `dist/`, so the deck needs no network at the venue. Only the
weights listed above are imported. **If you use a new weight, add its import in
the same change.** If you do not, the browser uses the nearest imported weight
or fakes a bold, and gives no error. Until 2026-09-23 no font was loaded, and
every card stat rendered in Courier New.

## `TimekeeperCard.vue`

One card: a drawing, a date, a name, one big number, its unit, and the catch.

```md
<TimekeeperCard
  name="Water clock" date="c. 1400 BCE"
  img="/timekeepers/line-weighted/water-clock.svg"
  stat="~15 min" unit="per day, the best ones" problem="Freezes in winter"
/>
```

| prop      | meaning                                                                 |
| --------- | ----------------------------------------------------------------------- |
| `name`    | 29 px serif, ink                                                        |
| `date`    | 17 px muted, under the art                                              |
| `img`     | the SVG, rendered at 122 × 97 — or the poster frame when `video` is set |
| `video`   | optional looping clip; fills and crops rather than letterboxing         |
| `stat`    | **the one number**: 37 px mono, accent                                  |
| `unit`    | 17 px muted, what the number means                                      |
| `problem` | 20 px bold, `--tk-second`: the catch                                    |
| `unknown` | draws `stat` in muted instead of accent — for "we could not find data"  |
| `dim`     | fades the card to 35% while another is being discussed                  |

It is purely presentational: the **slide** decides when a card appears and when it
dims. The card only knows how to look.

**`unknown` is worth using honestly.** Two of the four cards say `?` because no
reliable accuracy figure was found for a candle clock or an hourglass. Drawing that
in muted rather than accent says "we looked and there isn't one" instead of
implying a measurement.

## Clicks

The cards appear one click at a time, and the takeaway line comes last:

```md
<TimekeeperCard
v-click="1" :dim="$clicks > 1 && $clicks < 5"
...
/>
...
<div v-click="5" class="tk-takeaway">
```

The `dim` expression means "dim me while a _later_ card is being discussed, then
un-dim for the takeaway", which is why it has an upper bound. Update the bound when
you add cards.

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
[legibility.md](legibility.md#text-sizes); the short version is that **17 px is the
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
pnpm format                       # prettier -- required, see AGENTS.md
python3 tools/palette.py          # the palette still passes its own gates
python3 tools/artcheck.py         # every SVG: structure, grammar, legibility
pnpm build                        # it actually builds
```

`.prettierrc` routes deck files through `prettier-plugin-slidev` and everything else
through the normal Markdown parser. **That split is load-bearing**: the Markdown
parser reads per-slide frontmatter as a thematic break plus a paragraph, inserts a
blank line after the `---` and strips indentation off nested YAML — silently breaking
the slide. If you add a deck whose filename is not `slides.md`, `slides-*.md`,
`torture.md` or `pages/*.md`, add it to the `files` array in `.prettierrc` **in the
same change**.
