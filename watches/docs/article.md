# The article: the talk as a web page

**Covers:** the article at `/article`: the talk for people who did not see it,
as one long page of narration with live figures between the paragraphs, in
the style of Bartosz Ciechanowski's "Mechanical Watch". How to write the
narration and place the figures; what a figure shows, and why; the sliders
and the playing figure; how the code is split between the addon and the
talk; how to build the static page, and where it can go.
**Read before** you write or change a slide's narration, add a click to a
slide that has narration, change `addons/narration/`, the figure layer
(`components/FigureLayer.vue`, `webgl/shared.ts`, `watch/article.ts`), or
build the article.
**Tasks:**
[`tasks/2026-10-03-narrated-export/`](../../tasks/2026-10-03-narrated-export/README.md)
(the forms, the measurements, and the page's design in its `page-design.md`).

## What a reader gets

- The cover's title, the author, and "pause them all".
- A table of contents: each part (a section slide) and each slide's title.
- Under a slide's heading, its history line, if it has one
  ([slide-patterns.md](slide-patterns.md), "The history line").
- For each slide, its narration, its asides (in the right margin on a window
  at least 1,280 px wide, in the text on a narrower one) and its figures.
- **A figure is the slide itself, live**, at one click: the WebGL watch, the
  diving board, the labels. It runs while it is on or near the screen.
- Some figures have controls: steps (‹ ›), a slider, or a tour that plays by
  itself, with captions. A figure that moves by itself, or plays, has a
  pause button; a still one has none (`still` in
  `addons/narration/figure.ts`).

`pnpm dev` prints the article's URL last, after Slidev's own list and its
shortcuts (`addons/narration/vite.config.ts`). Slidev has no hook to add a
URL to its list.

The page puts the desktop first. A phone can read it, but its figures are
small: reading on a phone is a goal for later, not a constraint now.

## Write the narration

The narration is an HTML comment, `<!-- narration ... -->`, **before** the
slide's speaker notes. So the narration shows neither in the presenter view nor
on the slide (the `slidev-practices` skill, "Speaker notes"). The notes stay as
they are: the cues for the speaker. `watch/article.test.ts` fails if a slide's
last comment is its narration.

The narration is Markdown, written for readers: no stage directions ("the
camera zooms out"). `[click]` markers split it into parts, as in the notes.
A part goes with its click: it picks the figure that stands beside it. A
part need not exist for every click, and a part may hold several
paragraphs.

```md
<!-- narration
The balance swings back and forth, but the hands must turn one way only.
[nofigure]

[click]

[figure: The escape wheel alone, spinning freely.]

Start with the _escape wheel_. ...

> [!aside] Why a jewel?
> ...
-->

<!--
The speaker's cues, as before.
-->
```

| Marker               | Meaning                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------- |
| `[click]`            | the next click; `[click:2]` two clicks                                                                         |
| `[figure]`           | a figure of the part's click goes here; it replaces the part's default figure, or adds one                     |
| `[figure: alt text]` | the same, with alt text for the figure. Give every figure alt text: it is all a screen reader gets             |
| `[figure 3]`         | a figure of click 3, here; it replaces the default figure of click 3                                           |
| `[figure 2-3]`       | one figure with steps, from click 2 to click 3; it replaces the defaults in its range                          |
| `[figure 0-8 play]`  | a figure that plays its steps by itself; the text after it, and the parts said at its clicks, are its captions |
| `[nofigure]`         | no figure for the part's click, even by default                                                                |
| `> [!aside] Title`   | a quote block that starts so is an aside; put the `IF ASKED` material here                                     |

**Name a new term in italics where it first comes** (`_impulse jewel_`), as a
textbook does. The figure beside it marks the part (below). Not an
oversight: coloured part names, as on Bartosz's page, do not fit the house
look. The theme allows one accent on a slide, and the art has one "look
here" colour, so two parts in one figure could not have two colours
([`theme.md`](../../docs/theme.md)).

The markdown is rendered with `markdown-exit`, as Slidev renders notes, with
smart quotes. A table is Markdown. There is no math yet: write "seven and a
half times eight is sixty".

## Which clicks get a figure

**By default, the end of each build-up.** A slide's clicks make runs. A run
ends where the next click moves the camera, makes a piece go, or changes the
diving board's place. Within a run, a click only adds pieces, changes text,
or changes the motion (a rest, a spin, "tick" and "tock"). The last click of
each run gets a figure: it shows all that the run built. A slide with no
watch and no board is one run, so its figure shows all its text.
`defaultFigures` in `watch/article.ts`. A section slide gets no figure: it is
a heading. A slide's first default figure is dropped if it shows the same
picture as the figure before it, on the slide before.

A default figure goes at the start of the part said from its click, or at
the end of the part before it. The markers above override the default.

Why: this is the rule "when clicks only reveal text, show the last one",
for pieces too. In Part 1 it gives 30 figures. "A figure for each change of
the picture" gave 43 (the task's `page-design.md`, "Which clicks become
figures"). On 2026-10-13, the narration's 19 markers (13 figures and 6
`[nofigure]`) bring Part 1 to 20 figures; most of the figure markers only
move a figure to its sentence and give it alt text.

## What a figure shows

**A figure of a picture shows the picture and its labels, not the slide's
text.** The prose says what the slide's sentences said. The figure is
cropped to the picture's box (`pictureBox` in `watch/article.ts`: the shown
pieces' extents as the view shows them, and the diving board where it
shows), widened to hold its labels. A label is an element with the class
`in-figure` (`WatchCallout` has it); every other element of the slide is
hidden. A label is measured by what it draws: a callout's leader is an
`<svg>` of 1 px at the slide's corner, so the crop measures its shapes, not
the `<svg>`. The crop is 1.65 times larger on a phone than the whole slide
would be.

**The figures of one slide that share a camera share a crop** (`frameKey`
in `watch/article.ts`, `cropGroups` in `addons/narration/plan.ts`): the box
over all their pictures and all their labels. So a piece keeps its place
and size from one figure to the next, as on the slide, and the reader sees
that it is the same piece with new ones beside it. An earlier figure keeps
empty room for what comes later. A figure after the camera moves (the Gear
Train slide's big wheel) gets a crop of its own.

**Where the slide's top or bottom cuts the watch, the crop centres it.** A
watch that the slide's bottom cuts sits below the title's space, which the
figure does not show. So the crop cuts its other side too, until the pieces
that the view fits (`watchView`) are in its middle, but never into those
pieces. The Gear Train slide's case then shows as much strap above as below.
Not across: there, what the slide cuts is the case beside the train, and the
figure keeps it.

A slide with no watch and no board is its own figure: the whole slide, with
its text, at its last click.

**A figure does not flash, it marks.** A flash points at a part at the
moment the speaker names it, and a reader's eyes are on the words, not on
the figure, at a moment that nobody knows. So a figure draws the pieces that
its run flashed, up to its click, in the flash's colours, for as long as it
shows: a steady flash, a _mark_ in [`theme.md`](../../docs/theme.md)'s
words (`figureMarks`). Not when the mark would be everything that shows: then
it marks nothing.

**In a figure, nothing dims** (`style.css`): the reader's focus is the
paragraph beside the figure, not the newest label.

**A step in a figure moves as the talk does.** A figure with steps, or a
playing figure, steps forward and back with the talk's moves: the fades, the
camera, and the flash on a step forward (the reader asked for the step, and
is looking at the figure). A step to a click that is not a neighbour is a
jump.

### A slide's `article` settings

A slide can change a figure in its frontmatter, keyed by the figure's click.
`watch/article.ts` checks the keys, and `watch/article.test.ts` checks that
each piece exists.

```yaml
article:
  3:
    slider: curl # a slider that holds the board at a point of its curl
    mark: [impulse jewel] # the pieces marked, in place of the default
  5:
    mark: false # no mark
```

| Key      | Values                                                                                                                                                                                                                                                                                                |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mark`   | a list of pieces, or `false`                                                                                                                                                                                                                                                                          |
| `slider` | `curl`: the diving board's curl, to the hairspring at rest (the Hairspring slide); `twist`: the hairspring's wind from rest, and a swing from there when the reader lets go (the Hairspring slide); `wind`: the Mainspring slide's story, from the bare spring through the key's turns to the release |
| `view`   | the figure's camera, in place of the slide's, with the values of `watchView`: a named view, or the pieces that a fitted view fits                                                                                                                                                                     |

**Use `view` when the slide cuts the picture across, or cuts the fitted
pieces.** The crop stops at the slide's edge, so there the watch shows cut
and off centre in the figure. A view that puts the whole picture inside the
slide makes the crop centre it. The cover's slide puts the watch partly past the right edge, beside the
title. Its figure uses `view: centred cover`: the cover's view, moved so that
the watch is in the slide's middle, so it shows as much of the strap as the
talk does.

## The sliders and the playing figure

A story animation that the talk plays at a click is under the reader's
control in a figure. **A slider scrubs it**, as on Bartosz's pages: the
board holds the SVG's time that the slider gives (`DivingBoard.vue`'s
`scrub`), and the mainspring's clock holds a time on its line
(`MainspringClock.hold`, `WatchModel.scrub`).

**The twist is a slider that the reader lets go.** The Hairspring slide's
curl and its edit are one click in the talk, but two figures in the
article: the `curl` slider curls the board into the hairspring at rest, and
the next figure shows the edited sentence and gives the hairspring a twist.
The `twist` slider holds the balance at an angle, up to its amplitude
(`WatchModel.twist`). When the reader lets go of the thumb, the hairspring
swings from that angle, with no friction, and the thumb follows it back to
rest, in a quarter of its period: the reader can catch it and wind it
again. A slider's `release`
(`addons/narration/figure.ts`) tells the talk that the reader let go. A slider is a long track with
a large thumb in the accent, with what it does written above it. Not an
oversight: a story is not looped, as a GIF would be. A loop pulls the eye
from the text, as the old `<blink>` did. The narration invites the reader to
drag the slider instead.

**The Recap slide is a playing figure**: a short film, where the animation
is the point and the words are captions. It steps by itself while it is on
the screen: each step waits for the change at its click to end, then for
4.5 s (`DWELL_MS` in `ArticleFigure.vue`). After the last stop it starts
again. The flash after each move stays: the reader is watching the figure.

## How the code is split

| Where                                                           | What                                                                                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addons/narration/` (a Slidev addon; the headmatter's `addons`) | the narration's parser, the preparser, the page model, the `/article` route and its line in `pnpm dev`, the page and its figures, the prerender. It knows nothing of the watch |
| `addons/narration/figure.ts`                                    | what the addon and the talk say to each other: `FIGURE` (a figure's click, pause, controls, stillness) and `ARTICLE_HOOKS` (the talk's rules)                                  |
| `setup/main.ts`                                                 | gives the article the talk's rules (`ARTICLE_HOOKS`)                                                                                                                           |
| `watch/article.ts`                                              | the talk's rules: default figures, a picture's key and box, the camera's key, marks, the `article` settings                                                                    |
| `global-bottom.vue`, `components/FigureLayer.vue`               | in a figure, the layer is the figure's: the watch at the figure's click, the board, "tick" and "tock", the time scale                                                          |
| `webgl/shared.ts`, `watch/instance.ts`                          | one renderer, one WebGL context, for all the figures (`sharedStage`)                                                                                                           |

**One renderer for the page.** A browser keeps about 16 WebGL contexts on a
page. Each figure is a 2D canvas, with its own timeline and model, and the
one renderer draws each figure that is near the screen and copies the
picture (`webgl/shared.ts`). A figure draws what the talk's stage would
draw: both call `drawFrame` (`webgl/stage.ts`). Measured with 24 figures: one
context and 1.7 MB of GPU buffers, against 24 contexts, 8 of them lost, for
a context each (the task's `PLAN.md`, "Follow-up (2026-10-04)").

**The addon is in the talk for now.** It lives in `addons/narration/` so that
the talk's type check, lint and tests cover it, with the talk's stubs of
Slidev's types (`types/`). Move it to the house when a second talk uses it.

**The addon uses Slidev internals** (`types/slidev-internals.d.ts`):
`PrintSlideClick`, `useFixedNav`, `createFixedClicks`, `slideWidth`,
`slideHeight` and `configs`. An upgrade of Slidev can change them. After an
upgrade, open `/article` and look.

**The addon's route is `/article`, a route of the deck.** The slides keep
their own routes. A page at `/narrated/3` would not work (`docs/export.md`,
"Use no separate route").

## Build the static page

```bash
pnpm article   # slidev build, then pnpm prerender: node addons/narration/prerender.ts dist
```

`prerender.ts` serves the built deck, opens `/article` in Chromium, and takes
a still of each figure, as it shows when it has settled. It writes
`dist/article/index.html`: the deck's `index.html`, with the article's text
in it as HTML and each figure a still (`dist/article/figures/`, about 6 MB at
twice the pixel density). So:

- the page reads with no JavaScript, and a search engine sees its text;
- with JavaScript, the deck's code starts at `/article/`, and the live article
  takes the static one's place;
- `dist/` works on any static host, at `/article/`, with no rewrite rules. If
  the deck is not at the host's root, build it with Slidev's `--base`
  (`pnpm exec slidev build --base /talks/watches/`, then the prerender). The
  prerender reads the base from `index.html`. GitHub Pages builds it this
  way, with `pnpm build --base …` and `pnpm prerender`
  ([`docs/talks.md`](../../docs/talks.md), "Publish a talk").

A file that the talk's code fetches must be under the base:
`${import.meta.env.BASE_URL}diving-board.svg`, not `/diving-board.svg`.

Tested on 2026-10-13: the static page with and without JavaScript, at the
root and at `/talks/watches/`, and the live article in Chromium, Firefox and
WebKit (the task's `experiments/page/`).

## Not done yet

- Math in the narration (KaTeX).
- A print stylesheet or a PDF of the article.
- Part 2 has no narration: its slides show as figures with no text.
- A whole-slide figure repeats its slide's title under the page's heading.
- Labels do not grow on a phone; reading on a phone is a later goal.
- Seven default figures of Part 1 have no marker, so no alt text.
