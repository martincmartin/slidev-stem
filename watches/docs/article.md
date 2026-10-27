# The article: the talk as a web page

**Covers:** the article at `/article`: the talk for people who did not see it,
as one long page of narration with live figures between the paragraphs, in
the style of Bartosz Ciechanowski's "Mechanical Watch". How to write the
narration and place the figures; what a figure shows, and why; the sliders,
the button and the playing figure; how the code is split between the addon and the
talk; how to build the static page, and where it can go; how to export
its text.
**Read before** you write or change a slide's narration, add a click to a
slide that has narration, change `addons/narration/`, the figure layer
(`components/FigureLayer.vue`, `webgl/shared.ts`, `watch/article.ts`), or
build the article or export its text.
**Tasks:**
[`tasks/2026-10-03-narrated-export/`](../../tasks/2026-10-03-narrated-export/README.md)
(the forms, the measurements, and the page's design in its `page-design.md`),
[`tasks/2026-10-22-article-prerender-speed/`](../tasks/2026-10-22-article-prerender-speed/PLAN.md)
(why the prerender was slow),
[`tasks/2026-10-25-paused-figure-steps/`](../tasks/2026-10-25-paused-figure-steps/PLAN.md)
(steps in a paused figure, and the figure's own time),
[`tasks/2026-10-27-firefox-figure-copies/`](../tasks/2026-10-27-firefox-figure-copies/PLAN.md)
(the figures' sheets and crops: a blink and a slow spring in Firefox for
Android).

## What a reader gets

- The cover's title, the author, and "pause them all". Keep this one button
  even if a figure's own pause goes: WCAG 2.2.2 ("Pause, Stop, Hide") asks
  for a way to pause motion that starts by itself and lasts more than 5 s,
  and the prerender pauses the page with it.
- A table of contents: each part (a section slide) and each slide's title.
- Under a slide's heading, its history line, if it has one
  ([slide-patterns.md](slide-patterns.md), "The history line").
- For each slide, its narration, its asides (in the right margin on a window
  at least 1,280 px wide, in the text on a narrower one) and its figures.
- **A figure is the slide itself, live**, at one click: the WebGL watch, the
  diving board, the labels. It runs while it is on the screen. Near the
  screen, it gets one picture, so that it is not blank when it comes on.
- Some figures have controls: steps (‹ ›), a slider, a button, or a tour that
  plays by itself, with captions. A figure that moves by itself, or plays, has a
  pause button; a still one has none (`still` in
  `addons/narration/figure.ts`).
- **A copy of the page is its prose**: the headings, the narration, the
  asides and the captions. A figure's words (its labels, the diving board's
  sentence also where it has faded out, its controls) and the "Pause them
  all" button cannot be selected (`user-select: none` in
  `ArticleFigure.vue` and `ArticlePage.vue`). So a reader can paste the page
  into a spell checker, or quote it.

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
| `[figure: alt text]` | the same, with alt text for the figure                                                                         |
| `[figure 3]`         | a figure of click 3, here; it replaces the default figure of click 3                                           |
| `[figure 2-3]`       | one figure with steps, from click 2 to click 3; it replaces the defaults in its range                          |
| `[figure 0-8 play]`  | a figure that plays its steps by itself; the text after it, and the parts said at its clicks, are its captions |
| `[nofigure]`         | no figure for the part's click, even by default                                                                |
| `> [!aside] Title`   | a quote block that starts so is an aside; put the `IF ASKED` material here                                     |

**Every figure has alt text.** A screen reader gets only that, and so does
a chatbot that reads the article as text. It says what the picture shows
that the prose beside it does not: the most important thing that a reader
sees in it. It describes only the picture, not its controls: the page
shows them, a screen reader names them, and the text export lists them. A
default figure has no marker, so give it one where it shows:
`[figure: …]` at the start of its click's part, or `[figure 6: …]`, with its
click, for a click that has no part of its own. `watch/article.test.ts`
fails on a figure with no alt text.

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
is looking at the figure). A step starts from whatever shows, also in the
middle of a move. A step to a click that is not a neighbour moves too,
forward or back by the clicks' order, with the later click's camera move
(`moveTo` in `components/FigureLayer.vue`). Not as in the talk, where it is a
jump: there, a jump goes to another place in the talk, and here the reader
asks to see that click.

**A paused figure's time stands, but its controls still work.** A figure
runs on its own time (`addons/narration/clock.ts`), which stands while it is
paused. A step in a paused figure plays its move from the picture that
shows, then the figure stands again: its time runs to the end of the step's
change (`busyUntil`). A slider's change shows at once; a let-go of the
`twist` slider swings the hairspring back to rest, where it stands. **For a
reader who asks for reduced motion, a step in a paused figure is a jump**:
the new click at once, with no move and no flash. That reader starts with
every figure paused (`ArticlePage.vue`), and WCAG 2.3.3 ("Animation from
Interactions") asks that a reader can turn off the motion that a control
starts. The options are in
[the task](../tasks/2026-10-25-paused-figure-steps/PLAN.md).

### A slide's `article` settings

A slide can change a figure in its frontmatter, keyed by the figure's click.
`watch/article.ts` checks the keys, and `watch/article.test.ts` checks that
each piece exists.

```yaml
article:
  3:
    slider: curl # a slider that holds the board at a point of its curl
    mark: [impulse jewel] # the pieces marked, in place of the default
  4:
    button: release # a button that plays the step from click 3 to click 4
  5:
    mark: false # no mark
```

| Key      | Values                                                                                                                                                                                                                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mark`   | a list of pieces, or `false`                                                                                                                                                                                                                                                           |
| `slider` | `curl`: the diving board's curl, to the hairspring at rest (the Hairspring slide); `twist`: the hairspring's wind from rest, and a swing from there when the reader lets go (the Hairspring slide); `wind`: the Mainspring slide's story, from the bare spring through the key's turns |
| `button` | `release`: the figure shows the click before its own; the button plays the step to its own click (the Mainspring slide's release)                                                                                                                                                      |
| `view`   | the figure's camera, in place of the slide's, with the values of `watchView`: a named view, or the pieces that a fitted view fits                                                                                                                                                      |

**Use `view` when the slide cuts the picture across, or cuts the fitted
pieces.** The crop stops at the slide's edge, so there the watch shows cut
and off centre in the figure. A view that puts the whole picture inside the
slide makes the crop centre it. The cover's slide puts the watch partly past the right edge, beside the
title. Its figure uses `view: centred cover`: the cover's view, moved so that
the watch is in the slide's middle, so it shows as much of the strap as the
talk does.

## The sliders, the button and the playing figure

A story animation that the talk plays at a click is under the reader's
control in a figure. **A slider scrubs it**, as on Bartosz's pages: the
board holds the SVG's time that the slider gives (`DivingBoard.vue`'s
`scrub`), and the mainspring's clock holds a time on its line
(`MainspringClock.hold`, `WatchModel.scrub`).

**The `wind` slider winds at an even rate.** The key shows the whole time,
at both ends too, with no fade, and the spring's wind follows the slider,
with no rests and no ease at each third of a turn (`windSliderTime`). In
the talk,
the rests show a hand that stops turning the key. On the slider, the
reader's hand turns it, and a pause that the reader did not make looks like
a fault.

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

**The release is a button, not a slider.** The Mainspring slide's story has
two figures: the `wind` slider winds the spring, and the next figure shows it
wound, with a button. Press it, and the figure steps to its own click, as the
talk does: the stud flashes and goes, and the spring uncoils. The reader
watches a thing happen, so it plays at the talk's speed; a slider would let
the reader drag the uncoil instead of seeing the fling. A second press puts
the wound spring back at once, as a step back in the talk does. The button
is a `FigureButton` (`addons/narration/figure.ts`): it says what it does,
and what a second press does.

**The Recap slide is a playing figure**: a short film, where the animation
is the point and the words are captions. It steps by itself while it is on
the screen: each step waits for the change at its click to end, then for
4.5 s (`DWELL_MS` in `ArticleFigure.vue`). After the last stop it starts
again. The flash after each move stays: the reader is watching the figure.

## How the code is split

| Where                                                           | What                                                                                                                                                                           |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `addons/narration/` (a Slidev addon; the headmatter's `addons`) | the narration's parser, the preparser, the page model, the `/article` route and its line in `pnpm dev`, the page and its figures, the prerender. It knows nothing of the watch |
| `addons/narration/figure.ts`                                    | what the addon and the talk say to each other: `FIGURE` (a figure's click, its time, controls, stillness) and `ARTICLE_HOOKS` (the talk's rules)                               |
| `setup/main.ts`                                                 | gives the article the talk's rules (`ARTICLE_HOOKS`)                                                                                                                           |
| `watch/article.ts`                                              | the talk's rules: default figures, a picture's key and box, the camera's key, marks, the `article` settings, the controls' words                                               |
| `addons/narration/text.ts`                                      | the page plan as Markdown, for the text export                                                                                                                                 |
| `watch/article-text.ts`                                         | the text export (`pnpm article:text`), and the page that the talk's tests check, from `slides.md`                                                                              |
| `global-bottom.vue`, `components/FigureLayer.vue`               | in a figure, the layer is the figure's: the watch at the figure's click, the board, "tick" and "tock", the time scale                                                          |
| `webgl/shared.ts`, `watch/instance.ts`                          | one renderer, one WebGL context, for all the figures (`sharedStage`)                                                                                                           |

**One renderer for the page.** A browser keeps about 16 WebGL contexts on a
page. Each figure is a 2D canvas, with its own timeline and model, and the
one renderer draws the figures on one hidden canvas, and each figure copies
its picture (`webgl/shared.ts`). A figure draws what the talk's stage would
draw: both call `drawFrame` (`webgl/stage.ts`). Measured with 24 figures: one
context and 1.7 MB of GPU buffers, against 24 contexts, 8 of them lost, for
a context each (the task's `PLAN.md`, "Follow-up (2026-10-04)").

- **Only the figures on the screen** are drawn at each frame. A figure
  within 200 px of the screen is drawn once when it comes near.
- **All the pictures of a frame, then all the copies.** Each figure of a
  frame has its own place on the hidden canvas (a sheet, `webgl/atlas.ts`).
  Not an oversight: when the figures took turns on one picture, Firefox for
  Android copied, at times, the figure before, and parts of the Gear Train
  slide's figure blinked.
- **A figure draws its crop only** (`Frame.crop`), and its canvas covers just
  that part of the slide. A canvas over the whole slide was up to 2.8 times
  as large, and the Mainspring slide's spring ran at 2–3 frames a second in
  Firefox for Android, which copies each picture through the CPU.

The evidence is in
[`tasks/2026-10-27-firefox-figure-copies/`](../tasks/2026-10-27-firefox-figure-copies/PLAN.md).

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
a still of each figure, as it shows when it has settled. It takes each still,
and scrolls, with the page paused ("Pause them all"): with no GPU, a frame
takes up to 0.4 s, and a screenshot or a scroll waits for frames. This made
it 3.7× faster (64 s here); the settles are most of what is left
([the task](../tasks/2026-10-22-article-prerender-speed/PLAN.md)). It writes
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

**The static page keeps the palette's class on `<html>`.** The palette addon
puts its class there ([`themes/palettes/README.md`](../../themes/palettes/README.md)),
and the page adds `article-mode` to it (`staticPage` in
`addons/narration/static-page.ts`). A second `class` attribute would be lost:
the live article that takes the static one's place would then have no palette,
and every figure would be blank. The live article in `pnpm dev` has no
static page, so it does not show this: look at
`uv run tools/pages_preview.py watches --article` at the root.
`staticPage` fails if the page has an HTML parse error, as parse5 reports
it: the tokenizer's errors, such as a duplicate attribute, but not a
misnested tag.

Tested on 2026-10-13: the static page with and without JavaScript, at the
root and at `/talks/watches/`, and the live article in Chromium, Firefox and
WebKit (the task's `experiments/page/`). Tested on 2026-10-27: the live
article that starts from the static page, at `/slidev-stem/watches/article/`,
in Playwright Chromium, Firefox, Firefox with private browsing, and WebKit.

## Export the text

```bash
pnpm article:text > article.md   # the article as Markdown, in under a second
```

For a reader that takes text, such as a chatbot asked for feedback on the
wording and the structure. It holds what the page holds, in its order: the
headings, the history lines, the narration's Markdown as written, each aside
as a quote, and each figure in its place, as
`[Figure: <alt text> <its steps>. Controls: <its slider or button>.]`. A
playing figure's captions follow it. The controls are in the words that the
figure shows (`SLIDER_WORDS` and `BUTTON_WORDS` in `watch/article.ts`).

It reads `slides.md` as the tests do, with no build and no browser, and
plans the page with the page's own code (`slideInput` and `pagePlan` in
`addons/narration/plan.ts`), so it has the page's figures. A copy of the
page is not the same: it has no figures, because alt text is not copied, and
it loses the headings' levels, the italics and the asides' marks. A print of
the live page has blank figures (below).

## Not done yet

- Math in the narration (KaTeX).
- A print stylesheet or a PDF of the article. A print of the live page draws
  only the figures near the screen; the others are blank, with their labels
  (Chromium, 2026-10-27).
- Part 2 is only its heading: its one slide is hidden.
- A whole-slide figure repeats its slide's title under the page's heading.
- Labels do not grow on a phone; reading on a phone is a later goal.
