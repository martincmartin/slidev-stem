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
  on each slide. `uv run ../tools/validate.py` performs a fast forward smoke walk.
  Use exhaustive navigation only to investigate an actual or suspected problem.
- **Every slide's title and subtitle are centred**, by `style.css` (a Slidev
  project file). The cover's are the one exception: they sit left of the
  watch (`.slidev-layout.cover-watch h1` in `slides.md`).
- **Use a markdown `#` heading for the title.** The theme styles `h1` as the
  slide title. Inside a flex layout, set `margin: 0` on it. A paragraph right
  after the title is its subtitle: the theme styles `h1 + p`, as Slidev's
  default theme does. The cover's subtitle is the speaker's name.
- **Never set a colour or a font on the slide.** Use `var(--palette-accent)` and the
  other variables for colour. In a component, use `@apply font-serif` or
  `@apply font-mono` for type. If a slide needs a colour that the palette does
  not have, see [theme.md](../../docs/theme.md#adding-a-colour).
  To change a role for one slide, give the slide a `class:` and set the role in
  a `.slidev-layout.<class>` rule (see
  [theme.md](../../docs/theme.md#one-slide-can-change-a-role)). `tools/palette.py` fails if a
  talk declares a `--palette-*` variable in a different rule, or if that
  slide's palette fails a gate.
- **To see a slide in another palette, give it a palette class**
  (`class: palette-campfire`; [theme.md](../../docs/theme.md#palette-classes-a-slide-in-another-palette)).
  The watch and the diving board follow it. To compare palettes, import the
  slide once for each, as `slides.md` does with the Hairspring slide: it is
  in `pages/hairspring.md`, and its previews follow it.
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

## Text fades

**In this talk, text fades out and fades in. It does not cut.** New text fades
in only after the old text has faded out, so two texts are never on the screen
at the same place. Make an exception only for a good reason, and write the
reason next to it.

- **Between slides:** `transition: text-fade`, the default of every slide (in
  the headmatter of `slides.md`). The old slide's text fades out in
  `--text-fade`. The new slide's text waits for that, and for the camera
  (`--watch-text-delay`), and then fades in. Both are in `style.css`.
- **Text that names a part that fades in at the same click** waits for it:
  give the `v-click` element the class `after-watch-fade` (`style.css`). It
  fades in after the watch's fade (`--watch-fade`), so its leader never
  points at a part that is not there yet. Going back, it fades out at once.
- **Text that points at the balance at rest, at the click that settles it**,
  waits for the rest: give the `v-click` element the class
  `after-balance-rest` (`style.css`). It fades in when the balance is at rest
  (`--watch-rest-delay`), so its leader never points at a part that has not
  stopped there yet. If the callout hides its leader at a later click
  (`showLeader`), the leader comes back only at rest too. Going back, it
  fades out at once.
- **Text in the watch's layer** (the board's sentence) is not on a slide, so a
  slide transition does not fade it. It fades in `--text-fade`, and it fades
  in only after `--text-fade`
  ([watch.md](watch.md#the-diving-board)).
- **Not an oversight: the Escapement slide's "tick" and "tock" cut in**, because they
  are a sound. They fade out ([watch.md](watch.md#tick-and-tock)).
- **Not an oversight:** the cover's move to the Hairspring slide has its own transition,
  `watch-zoom`, because its title fades while the watch flashes
  ([watch.md](watch.md)).

For other ways that text can appear, move and stay on a screen, see
[text-display-deep-research-report.md](../../docs/text-display-deep-research-report.md).
It is background, not rules.

## The live watch and the diving board

A slide that shows the watch names its pieces in the frontmatter, and needs no
code: the view fits them, and the watch moves from the last slide's picture by
one rule ([watch.md](watch.md#how-a-slide-shows-the-watch)).
The Hairspring slide uses the diving board to explain the spring, and the Balance Wheel slide fades its rest shape out as the balance wheel fades in.
On the Balance Wheel slide, click 1 adds "and steadily". Click 2 replaces the explanation with the accuracy of a calibrated watch (99.99%), in the timekeeper card's type roles. Click 3 adds what that is in seconds a day, so the audience takes in the percentage first.
The outgoing text fades out before the incoming text fades in, in both directions.
The Escapement slide zooms out, and then the rest of the escapement fades in. Its
callouts point to parts of the watch, one at each click. At its second click
the escape wheel spins alone, and at the third the pallet comes back and
stops it.
The Gears slide follows it: the Escapement slide's picture fades out, the
camera jumps, and the fourth wheel and the escape wheel's pinion fade in
(`watchMoveWith: none`), turning freely (`watchSpin`). At its click, the
rest of the Escapement slide's mechanism fades in around them, and the gears
tick with it (`watchClicks`).
It is described in [watch.md](watch.md).

## Where things go on a slide

**The main focus of a slide is on its left.** Put the picture there, and the
callouts and text on the right. If the picture takes less than 60% of the
slide's width, centre it in the slide's left 60% (the Gears slide). When the
picture is wider (the Escapement slide), it starts at the left edge, and the
callouts go in the room on its right and in its gaps. The watch's fitted view
does this for you ([watch.md](watch.md#fitted-views)). The watch's train is laid out left to right from
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

In `watches/`, run `pnpm format` after edits. Use `uv run ../tools/validate.py --quick` for routine feedback.
Follow the [validation policy](../../AGENTS.md#validate-before-you-commit) to decide when to run full mode.
Before a commit, require a successful full run. If the talk and its relevant inputs are unchanged since that run, reuse it.
The [validation workflow](../../docs/talks.md#check-your-work) explains both modes.

**A deck file must match a `.prettierrc` override** (`slides.md`,
`slides-*.md`, `pages/*.md`). If you add a deck file with another name, add it
to the `files` array in `stem/.prettierrc` in the same change: the Markdown
parser breaks a slide's frontmatter. `stem/AGENTS.md` has the details, and
`validate.py` fails if a file is missing from the override.
