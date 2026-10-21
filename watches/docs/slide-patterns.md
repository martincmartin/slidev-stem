# Slide patterns

**Covers:** how a slide in this deck is built: the theme on a slide, the
history line, the timekeeper card, clicks, speaker notes, what fits, borrowed
assets.
**Read before** you add or change a slide. For a slide that shows the watch or
the diving board, read [watch.md](watch.md) as well.
**Tasks:**
[`2026-09-23-followups`](../tasks/2026-09-23-followups/instructions.md) (where
the docs live; the click pattern).

`slides.md` is the working example: the "Before clocks" slide uses every
pattern here.

## The theme and the palette

The deck uses the house theme (`theme: house`) and a palette, an addon named in
the headmatter (now Ledger: `palette-ledger`; any house palette works there:
[theme.md](../../docs/theme.md), "Palettes"). The palette sets the `--palette-*` variables,
and the theme the slide background, the text colour and the fonts, on every slide. A slide needs no class to get them. So
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
  project file). The cover and section titles sit left of the
  watch: their slides set `side: left`, which the house theme's `cover` and
  `section` layouts read for their alignment and width.
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
  slide once for each palette.
- **For content slides, use `layout: full` plus a class.** It keeps each slide's layout
  next to its content, which has been worth more than the duplication costs — the
  slide you are reading is the slide you are editing.

**The fonts are self-hosted.** The theme imports them from the `@fontsource/*`
packages in `themes/house/styles/fonts.css`, and `pnpm build` copies the font
files into `dist/`. The deck makes no outside requests, so it needs no network
at the venue. `fonts.css` imports only the weights the talks use. **If you use a
new weight, add its import to the theme in the same change:** a missing weight
gives no error (the `slidev-practices` skill, "Fonts").

## Section slides

Use `layout: section`, an `eyebrow` frontmatter label, and a Markdown title.
The theme sets the type and placement in `themes/house/styles/house.css` at the repo root.
For a section with the cover's picture, use `watch: all` and `watchView: cover`.
Mechanical Marvels uses this state, so the watch stays in place when the cover text changes.
Changed The World uses it too: the Recap slide's tour ends there.

## The history line

A slide can give a line of history in its frontmatter: when its subject became
practical. The speaker does not say it; it is there for the audience to read,
and to retell.

```yaml
history: "Minute hand: c. 1656"
```

- **Give the year it became practical, not the first known example.** A
  second hand on a clock that drifts by minutes a day is a show piece, not
  a second hand. So the minute hand's year is 1656: Huygens's pendulum
  clock kept time to the minute.
- **Write a year, not a century:** "c. 1430", not "15th century". Put "c."
  before every year, also an exact one: a bare "1675" could be a part
  number, a measurement or a time of day. Give no names: a name on some
  lines and not others reads as if the others had no maker. Where the slide
  is about how a part works rather than what it is, start with the part:
  "Minute hand: c. 1656" on the Gear Train slide, and "Hour hand: c. 1350"
  on the Hour Hand slide, which is about its gears.
- **Quote the value.** YAML reads a bare `1675` as a number, and a value with
  `: ` as a map. `historyOf` (`addons/narration/history.ts`) throws on a
  value that is not text, and `watch/article.test.ts` checks every slide,
  and that each year has its "c.".
- **On the slide**, `slide-top.vue` shows it in the lower left corner, in
  ink at the subtitle's 22 px ([legibility.md](../../docs/legibility.md)),
  with the paper's outline, as the time scale's number in the lower right.
  The speaker does not say it, so it must be easy to see: muted at 17 px was
  too easy to miss. The outline keeps it legible where the watch or the
  diving board runs under it.
- **In the article**, it is under the slide's heading, as a dateline, and a
  figure does not show it (`style.css`).

## `TimekeeperCard.vue`

One card: a drawing, a date, a name, one big number, its unit, and the catch.
The props are typed at the top of the component, and the slide's `cards` array
is the example. Each prop has one job:

| prop      | job                                                                                                                                                                                      |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `name`    | the card's title                                                                                                                                                                         |
| `date`    | when, under the art                                                                                                                                                                      |
| `img`     | the SVG's path under `public/`, with no leading slash (`timekeepers/candle.svg`): the card adds the deck's base. Inlined so the palette paints it, at the `width` and `height` it states |
| `stat`    | **the one number**, in the accent                                                                                                                                                        |
| `unit`    | what the number means                                                                                                                                                                    |
| `problem` | the catch, in `--palette-second`                                                                                                                                                         |
| `unknown` | draws `stat` in muted instead of accent — for "we could not find data"                                                                                                                   |

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
the cards before it dim. When the takeaway appears, they come back. One rule in
the slide's `<style>` uses `v-click`'s classes (the `slidev-practices` skill,
"Clicks, slides and going back"): it dims each `slidev-vclick-prior` card while
`.tk-grid` has a `slidev-vclick-current` card. The takeaway is outside
`.tk-grid`, so on its click no card in the grid is current and nothing is
dimmed.

**Do not bind `:class` on the card's root element:** it removes the `v-click`
classes, and the dim rule stops working (the `slidev-practices` skill).

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
- **Text that reads what the watch shows at its click** waits for all of
  it: give the `v-click` element the class `after-watch` (`style.css`). It
  fades in when the watch's change ends, with its flash
  (`--watch-end-delay`), so the text comes after all the motion on the left
  (the Gear Train slide). Going back, it fades out at once.
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
- **Not an oversight:** the Mechanical Marvels section's move to the Hairspring slide has its own transition,
  `watch-zoom`, because its title fades while the watch flashes
  ([watch.md](watch.md)).

For other ways that text can appear, move and stay on a screen, see
[text-display-deep-research-report.md](../../docs/text-display-deep-research-report.md).
It is background, not rules.

## Text dims

**Text that is no longer the focus dims: its colours mix halfway to the
paper.** The newest text is the one to read. The text before it stays, so
the audience can look back. The mechanism is in `style.css` ("TEXT DIMS"):

- **Give the element that dims the class `text-dims`.** Its ink is a mix
  with the paper by `--text-dim`, and `--text-dim` fades in `--text-fade`,
  with the element's opacity.
- **To dim it, set `--text-dim: var(--text-dimmed)`** in the slide's dim
  rule. `--text-dimmed` (`style.css`) is the one value for every slide.
- **A colour of its own inside the element** (an accent, a callout's word
  or leader) is a `color-mix()` with `--text-dim` too, so that it dims with
  its text. `WatchCallout.vue` does this for its colours.
- **Not an opacity.** An opacity fades the text's paper outline too, and
  the picture under the text shows through. A mix keeps the outline solid,
  as the watch's own dim does ([watch.md](watch.md#dimmed-pieces)).
  Over the paper, the two look the same.
- **`--text-dim` is registered (`@property`), so it can fade.** It is
  inherited: set it and fade it on one element only.

Not for the "Before clocks" cards: a card is a panel with art, not text over
a picture, so it dims with an opacity ([Clicks](#clicks)).

## A full turn's time

**From the Ticks and Turns slide to the Hour Hand slide, how long a hand takes
to make a full turn is the slide's one accent**
([theme.md](../../docs/theme.md#the-roles), "One accent per slide"): "once
a minute", "once an hour", "twice a day". The Ticks and Turns slide's table
gives all three. Each later slide colours the one that it builds, so the
eye links it back to the table.

- **Give the words the class `turn-time`** (`style.css`). Its colour is a
  mix with `--text-dim`, so it dims with its text
  ([Text dims](#text-dims)).
- **Only the time is in the accent**, not the rest of its sentence: "Turns
  _once a minute_."

## The live watch and the diving board

A slide that shows the watch names its pieces in the frontmatter, and needs no
code: the view fits them, and the watch moves from the last slide's picture by
one rule ([watch.md](watch.md#how-a-slide-shows-the-watch)).
The Hairspring slide uses the diving board to explain the spring, and the Balance Wheel slide fades its rest shape out as the balance wheel fades in.
The Balance Wheel title and any subtitle use the Gear Train outline style to stay legible over the watch.
On the Balance Wheel slide, each click adds text, and no text leaves: at the last click, all of the slide's text is on the slide. Click 1 adds "and steadily" after "slowly", in a space that is kept for it, so no word moves. Click 2 adds the accuracy of a calibrated watch (99.99%) below the explanation. Click 3 adds what that is in seconds a day, so the audience takes in the percentage first. When a paragraph shows, the paragraphs before it dim ([Text dims](#text-dims)), as the Escapement slide's earlier callouts do. All the text is in the sentence's type, single-spaced; only the stat is larger, in the accent.
The Escapement slide zooms out, and then the rest of the escapement fades in. Its
callouts point to parts of the watch, one at each click. At its first click
the wheel's callout appears and the escape wheel spins alone, and at the
second the pallet comes back and stops it.
The Ticks and Turns slide follows it: the seconds hand alone, on its arbor,
ticks once a second. Two lines work through why it turns once a minute,
and then a table states how often each hand turns
([watch.md](watch.md#the-ticks-and-turns-slide)).
The Gears slide follows it: the hand fades out, the
camera jumps, and the fourth wheel and the escape wheel's pinion fade in
(`watchMoveWith: none`), turning freely (`watchSpin`). At click 1,
four teeth on each gear flash, and then stay in the flash's colours (the
span). Clicks 2 to 4 add the text one line at a
time: a callout to the small gear, a callout to the big gear, and the rule
([watch.md](watch.md#the-gears-slide)). At click 5,
the rest of the Escapement slide's mechanism fades in around them, the span
and the callouts go, the rule stays, and the gears tick with it (`watchClicks`). The drive arrow
moves from the escape wheel to the fourth wheel: the push still comes from
something the audience cannot see. At click 6, the
seconds hand fades in, and then its text, under the rule. Each click
that adds text dims the text before it ([Text dims](#text-dims)).
The Gear Train slide follows it: the camera zooms out from the same picture,
to frame the train from the escape wheel to the centre wheel. Click 1 zooms
out to the case and shows one wheel that is 60 times slower, larger than the
watch: the wheel fades in, then the case, and then the wheel and its
pinion flash. Clicks
2 and 3 add the third wheel and then the centre wheel, each with the pinion
that it drives: each fades in, and then flashes. The drive arrow leaves the
fourth wheel after click 1's zoom, and comes back on each new wheel. Click 4 adds the minute
hand, the dial and the case. Click 5 fades out the right-side text and dims the watch.
Only the centre wheel, its arbor, pivot and drive arrow stay undimmed.
"Wheel driven by hidden mechanism" then fades in, with a leader to the centre wheel.
The Mainspring slide follows it: the Gear Train text and dimmed watch parts fade out.
The centre wheel, arbor, pivot and muted arrow remain for one second.
Then the mechanism fades out. The arrow remains alone for one second, then fades out (`watchLinger`).
The camera then jumps, and the bare mainspring and its arbor fade in, with
"Not back-and-forth / One slow unwind": the title names it, and the text
says that it is not the hairspring. At click 1 a stud holds its outer end,
the dashed rest shape fades in, and it flashes; a key winds it, and
"Winding causes tension" fades in. At click 2 the stud flashes and is gone,
and the spring uncoils to its rest shape. At click 3 the camera zooms out
to the whole movement, as tall as the slide, behind the title; the barrel
and the rest of the watch fade in, still, and the key winds the spring,
which starts the watch; "Unwinding drives barrel" fades in. At click 4, a
time-lapse, "6 hours in 6 seconds", lets
the spring down, and the watch stops. Each click that adds text dims the
text before it ([Text dims](#text-dims)). Going back cuts to the earlier click's state: no key
unwinds the spring.
The Recap slide comes after the Hour Hand slide. Its only text is the time
scale in the lower right corner, so the watch fills the slide, and the rule that the focus is on the left does not
apply. Each click moves, zooms, tilts and turns the camera at the same time
to the next touch of the train, at that touch's time-lapse speed. The next
slide, the Changed The World section, goes back to the cover's picture.
They are described in [watch.md](watch.md).

## Where things go on a slide

**The main focus of a slide is on its left.** Put the picture there, and the
callouts and text on the right. If the picture takes less than 60% of the
slide's width, centre it in the slide's left 60%. To set its gap to the text
instead, give its right edge (`watchRight`; the Gears slide). When the
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
- **The narration for readers is a comment of its own**, `<!-- narration -->`,
  before the notes: the notes stay the last comment, so the presenter view
  shows only them. The article (`/article`) shows the narration with live
  figures ([article.md](article.md)). The notes can then shrink to cues.

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
