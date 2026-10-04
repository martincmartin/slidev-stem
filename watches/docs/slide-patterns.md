# Slide patterns

**Covers:** how a slide in this deck is built: the theme on a slide, the
timekeeper card, clicks, speaker notes, what fits, borrowed assets.
**Read before** you add or change a slide. For a slide that shows the watch or
the diving board, read [watch.md](watch.md) as well.
**Tasks:**
[`2026-09-23-followups`](../tasks/2026-09-23-followups/instructions.md) (where
the docs live; the click pattern).

`slides.md` is the working example: the "Before clocks" slide uses every
pattern here.

## The theme

The deck uses the house theme, named in the headmatter (now Ledger:
`theme: ledger`). The theme sets the `--palette-*` variables
([theme.md](../../docs/theme.md)), the slide background, the
text colour and the fonts, on every slide. A slide needs no class to get them. So
a slide's own `<style>` holds only its layout. The "Before clocks" slide in
`slides.md` is the example: `layout: full`, `class: tk-timekeepers`, and a
`<style>` block that lays out that class.

Five rules for a slide:

- **A slide names what it shows at each click, never how to get there.** Put
  it in the frontmatter (`watch…`, `board…`) or in `v-click`s. Going back then
  needs no code: the layers move from what is on the screen
  ([`navigation.md`](../../docs/navigation.md)). Do not write a script that
  asks which way the viewer went, and do not put a copy of a shared picture
  on each slide. `uv run ../tools/validate.py` walks the deck both ways and
  fails on a cut or on a click that looks different when reached another way.
- **Every slide's title is centred**, by `style.css` (a Slidev project file).
  The cover's is the one exception: it sits left of the watch
  (`.slidev-layout.cover-watch h1` in `slides.md`).
- **Use a markdown `#` heading for the title.** The theme styles `h1` as the
  slide title. Inside a flex layout, set `margin: 0` on it.
- **Never set a colour or a font on the slide.** Use `var(--palette-accent)` and the
  other variables for colour. In a component, use `@apply font-serif` or
  `@apply font-mono` for type. If a slide needs a colour that the palette does
  not have, see [theme.md](../../docs/theme.md#adding-a-colour).
  To change a role for one slide, give the slide a `class:` and set the role in
  a `.slidev-layout.<class>` rule (see
  [theme.md](../../docs/theme.md#one-slide-can-change-a-role)). `tools/palette.py` fails if a
  talk declares a `--palette-*` variable in a different rule, or if that
  slide's palette fails a gate.
- **`layout: full` plus a class, not a custom layout.** It keeps each slide's layout
  next to its content, which has been worth more than the duplication costs — the
  slide you are reading is the slide you are editing.

**The fonts are self-hosted.** The theme imports them from the `@fontsource/*`
packages in `themes/ledger/styles/fonts.css`, and `pnpm build` copies the font
files into `dist/`. The deck makes no outside requests, so it needs no network
at the venue. `fonts.css` imports only the weights the talks use. **If you use a
new weight, add its import to the theme in the same change.** If you do not, the
browser uses the nearest imported weight or fakes a bold, and gives no error.

## `TimekeeperCard.vue`

One card: a drawing, a date, a name, one big number, its unit, and the catch.
The props are typed at the top of the component, and the slide's `cards` array
is the example. Each prop has one job:

| prop      | job                                                                    |
| --------- | ---------------------------------------------------------------------- |
| `name`    | the card's title                                                       |
| `date`    | when, under the art                                                    |
| `img`     | the SVG, shown at the `width` and `height` it states                   |
| `stat`    | **the one number**, in the accent                                      |
| `unit`    | what the number means                                                  |
| `problem` | the catch, in `--palette-second`                                       |
| `unknown` | draws `stat` in muted instead of accent — for "we could not find data" |

The sizes are in the component's CSS, and the reasons for them are in
[legibility.md](../../docs/legibility.md#text-sizes).

It is purely presentational: the **slide** decides when a card appears and when it
dims (see [Clicks](#clicks)). The card only knows how to look.

**`unknown` is worth using honestly.** Two of the four cards say `?` because no
reliable accuracy figure was found for a candle clock or an hourglass. Drawing that
in muted rather than accent says "we looked and there isn't one" instead of
implying a measurement.

## Clicks

The cards appear one click at a time, and the takeaway line comes last. The
cards are an array in the slide's `<script setup>`, rendered with `v-for`. Each
card's `v-click` number comes from its position in the array, and the takeaway's
from the array's length. To add a card, add it to the array. Add a `[click]`
line to the speaker notes too.

**Dimming is CSS in the slide, not a prop.** While a card is being discussed,
the cards before it dim. When the takeaway appears, they come back. `v-click`
gives the element of the current click the class `slidev-vclick-current`, and
gives elements whose click has passed the class `slidev-vclick-prior`. One rule
in the slide's `<style>` uses them: it dims each `slidev-vclick-prior` card while
`.tk-grid` has a `slidev-vclick-current` card. The takeaway is outside
`.tk-grid`, so on its click no card in the grid is current and nothing is dimmed.

**Do not bind `:class` on the card's root element.** `v-click` adds its classes
to that element. When a `:class` binding changes, Vue rewrites the element's
classes and removes the `v-click` classes, and the dim rule stops working.

## The live watch and the diving board

A slide that shows the watch sets its view in the frontmatter.
Slide 2 uses the diving board to explain the spring, and slide 3 fades its rest shape out as the balance wheel fades in.
It is described in [watch.md](watch.md).

## Where things go on a slide

**The main focus of a slide is on its left.** Put the picture there, and the
callouts and text on the right. The watch's train is laid out left to right from
the hairspring to the fourth wheel for this reason: see
[watch.md](watch.md#the-layout-of-the-movement).

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
- **A plan may move the spoken line out of the notes.** The notes would become
  cues, and the full narration would go in a `<!-- narration -->` comment for
  readers. Nothing is built yet: see [export.md](../../docs/export.md).

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

In `watches/`: `pnpm format`, then `uv run ../tools/validate.py`. It runs every
check of the talk, and builds the deck ([`stem/docs/talks.md`](../../docs/talks.md)).

**A deck file must match a `.prettierrc` override** (`slides.md`,
`slides-*.md`, `pages/*.md`). If you add a deck file with another name, add it
to the `files` array in `stem/.prettierrc` in the same change: the Markdown
parser breaks a slide's frontmatter. `stem/AGENTS.md` has the details, and
`validate.py` fails if a file is missing from the override.
