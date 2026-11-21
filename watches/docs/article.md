# The article: the talk as a web page

**Covers:** the article at `/article/1`, `/article/2` and so on: the talk for
people who did not see it, as a page for each part, of narration with live
figures between the paragraphs, in the style of Bartosz Ciechanowski's
"Mechanical Watch". The pages, the keys that place a slide on them, and
what each page loads; how
to write the narration and place the figures; asides; pull quotes; a slide's title
for the article; what a figure shows, and why; the sliders,
the button, the playing figure, and Part 2's story figures; how a page is
checked on a phone; how the code is split between the addon and the
talk; how a reader turns a figure of the watch; how to build the static
page, and where it can go; how to export its text, and count its words.
**Read before** you write or change a slide's narration, add a click to a
slide that has narration, add a part or a slide for every page, give a
slide a title for the article, change
`addons/narration/`, the figure layer
(`components/FigureLayer.vue`, `webgl/shared.ts`, `watch/article.ts`) or
the phone check (`art/phone-check.ts`, `art/phone.ts`), or
build the article, export its text or count its words.
**Tasks:**
[`tasks/2026-10-03-narrated-export/`](../../tasks/2026-10-03-narrated-export/README.md)
(the forms, the measurements, and the page's design in its `page-design.md`),
[`tasks/2026-10-22-article-prerender-speed/`](../tasks/2026-10-22-article-prerender-speed/PLAN.md)
(why the prerender was slow),
[`tasks/2026-10-25-paused-figure-steps/`](../tasks/2026-10-25-paused-figure-steps/PLAN.md)
(steps in a paused figure, and the figure's own time),
[`tasks/2026-10-27-firefox-figure-copies/`](../tasks/2026-10-27-firefox-figure-copies/PLAN.md)
(the figures' sheets and crops: a blink and a slow spring in Firefox for
Android),
[`tasks/2026-11-20-article-parts/`](../tasks/2026-11-20-article-parts/PLAN.md)
(a page for each part, and what each page loads),
[`tasks/2026-11-20-article-turning/`](../tasks/2026-11-20-article-turning/PLAN.md)
(turning a figure: the rotation, the limit, the traps).

## The pages

**Each part of the talk is a page**, at `article/<part>/`: a section slide
starts a part, and its page holds the slides up to the next section
(`articlePages` in `addons/narration/plan.ts`). The slides before the first
section, the cover, are on page 1. `/article` goes to `/article/1`: the
router redirects it, and the prerender writes a static page that does. Why:
one page for the whole talk was too long, and each page loads only what its
figures need (the task's `PLAN.md`).

- **A page's title is its part's**: the section slide's title in the
  article (its `articleTitle`, or its own), as the page's `<h1>`.
  The browser's tab and a link's preview (`og:title`) use this title by default.
  Set `articleDocumentTitle` on the section to give them a different title.
  Above the `<h1>`, small, is the
  talk's title, the cover's, with the section's eyebrow ("PART 1"): the
  series that the page is in. Under it is the section's `articleSubtitle`,
  if it has one. The section has no heading of its own on its page.
  Why: a reader follows a link for the part, so its title identifies the page.
  A page with no section has the cover's title.
- **A page after the first** starts with the cover's title, as the series,
  and not the cover's narration or figure. Its section slide gets no figure by default,
  as on any page: its narration's `[figure: …]` gives it one. The Part 2 and
  Part 3 sections show the watch so, centred (`article: 0: view: centred
cover`).
- **A slide with `articleHidden: true`** is in the talk, but on no page: the
  Questions slide. The article has no list of credits: each photo's credit
  is under its figure ("A photo's credit", below), so each page has the
  credits of its own photos.
- **A section's `articleDescription`** is its page's description: what a
  link's preview (Slack, Mastodon, a chat) and a search engine show under
  the title. One or two sentences, in quotes; the spell check reads it.
  The preview's image is the page's first figure's still ("Build the static
  page", below).
- **A section with `articleLinked: false`** has its page, but no other page
  links to it: a part that is not done yet. Parts 2 and 3, now. Remove the key to
  launch the part.
- **Each page links to the next part, and then to every part,** at its end. The links load the page anew, so it starts with only its
  own figures. A page that links to no other part has no list of parts.
- **Last, small: "Source code" and "Third-party licenses".** The first goes
  to the headmatter's `articleSource`, the talk's directory on GitHub; the
  second to the build's `licenses.txt` (`../docs/talks.md`, "Publish a
  talk"). A reader of Hacker News looks for the code; the browser's
  developer tools show it too, from the source maps.

## What a reader gets

- The cover's title, the author, and "Pause all figures". It does not call
  the figures slides: a reader may not know the talk. Keep this one button
  even if a figure's own pause goes: WCAG 2.2.2 ("Pause, Stop, Hide") asks
  for a way to pause motion that starts by itself and lasts more than 5 s,
  and the prerender pauses the page with it.
- A table of contents: the page's part (its section slide) and each slide's
  title, or its title for the article ("A title for the article", below).
- Under a slide's heading, its history line, if it has one
  ([slide-patterns.md](slide-patterns.md), "The history line").
- For each slide, its narration, its asides (each beside its paragraph, in
  the right margin, on a window at least 1,280 px wide, and after it on a
  narrower one: "An aside", below), its pull quotes and its figures.
- **A figure is the slide itself, live**, at one click: the WebGL watch, the
  diving board, the labels. It runs while it is on the screen. Near the
  screen, it gets one picture, so that it is not blank when it comes on.
- Some figures have controls: steps (‹ ›), a slider, a button, or a tour that
  plays by itself, with captions. A figure that moves by itself, or plays, has a
  pause button; a still one has none (`still` in
  `addons/narration/figure.ts`).
- A figure of the watch turns when the reader drags it ("Turning a
  figure", below).
- At the end, a link to the next part and links to every part ("The pages",
  above).
- **A copy of the page is its prose**: the headings, the narration, the
  asides, the pull quotes and the captions. A figure's words (its labels, the diving board's
  sentence also where it has faded out, its controls) and the "Pause them
  all" button cannot be selected (`user-select: none` in
  `ArticleFigure.vue` and `ArticlePage.vue`). So a reader can paste the page
  into a spell checker, or quote it.

`pnpm dev` prints the article's URL last, after Slidev's own list and its
shortcuts (`addons/narration/vite.config.ts`). Slidev has no hook to add a
URL to its list.

The page works on a desktop and on a phone ("On a phone", below).

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
| `> [!aside] Title`   | a quote block that starts so is an aside, for the paragraph after it; put the `IF ASKED` material here         |
| `> [!credit]`        | a quote block that starts so is a photo's credit: small, under the figure before it                            |
| `> [!quote classes]` | a quote block that starts so is a pull quote, a line for each line; the classes are the talk's, and optional   |

**Every figure has alt text.** A screen reader gets only that, and so does
a chatbot that reads the article as text. It says what the picture shows
that the prose beside it does not: the most important thing that a reader
sees in it. It describes only the picture, not its controls: the page
shows them, a screen reader names them, and the text export lists them. A
default figure has no marker, so give it one where it shows:
`[figure: …]` at the start of its click's part, or `[figure 6: …]`, with its
click, for a click that has no part of its own. `watch/article.test.ts`
fails on a figure with no alt text.

**The page for a screen reader** (`views/ArticlePage.vue`,
`components/ArticleFigure.vue`):

- A slide's heading is an `<h2>` under the page's `<h1>`, or an `<h3>`
  under a part's `<h2>` on a page with more than one part: the levels go
  down one at a time.
- A caption is read out when the reader steps to it, but not while a
  figure plays by itself (`aria-live` off), as for a carousel that rotates.
- A slider is named by its label, and says its value as "40%, from Bare to
  Wound" (`aria-valuetext`); its end words are hidden from it.
- A play or pause button says what a press does ("Play", "Pause"), and has
  no `aria-pressed`. Not an oversight: with both, a screen reader says
  "Play, pressed", and the reader cannot tell whether the figure plays.

**Name a new term in italics where it first comes** (`_impulse jewel_`), as a
textbook does. The figure beside it marks the part (below). Not an
oversight: coloured part names, as on Bartosz's page, do not fit the house
look. The theme allows one accent on a slide, and the art has one "look
here" colour, so two parts in one figure could not have two colours
([`theme.md`](../../docs/theme.md)).

The markdown is rendered with `markdown-exit`, as Slidev renders notes, with
smart quotes. A table is Markdown. There is no math yet: write "seven and a
half times eight is sixty".

### An aside

**An aside goes with one paragraph: the next one in its slide.** So write
it just before that paragraph. An aside at the end of a slide goes with the
slide's last paragraph. A window at least 1,280 px wide shows the aside
beside its paragraph, in the right margin. A narrower window and the text
export show it after the paragraph. A paragraph here is one block of
Markdown: a paragraph, a table or a list (`paragraphs` in
`addons/narration/narration.ts`). The page model gives each paragraph its
asides (`withAsides` in `addons/narration/plan.ts`), so the page and the
text export agree. An aside in a slide with no paragraph is an error.

**In the page, the aside comes before its paragraph.** Not an oversight: on
a wide window the aside floats into the margin, and a float can only go
down the page. So to float beside its paragraph, it must come first. On a
narrow window, CSS shows the paragraph first (`order`, in
`views/ArticlePage.vue`). But a screen reader, the Tab key and a copy of the
page follow the page's order, so they get the aside first.

### A pull quote

**Words that are the picture are a pull quote, not a figure.** A quote block
that starts `> [!quote]` is one: each line after it is a line of the quote,
in large type, centered (`components/ArticleQuote.vue`). The names after the
marker are the talk's CSS classes for it: `> [!quote script-1714]` gives the
Isaac Newton slide's quote the slide's script (`style.css`, "THE 1714
SCRIPT"). A quote with no class is in the text's font, at twice its size.
Give the click whose figure the quote replaces a `[nofigure]`. A pull quote
is prose: a reader can select and copy it, and a screen reader reads its
words, with no alt text.

**A pull quote is as wide as a figure, wider than the text.** Not an
oversight. A column of text is narrow so that the eye, back at the left,
finds the next line and does not land on the wrong one. A pull quote's type
is large and its lines far apart, so even a line as wide as a figure has few
words (Newton's longest has 53 characters), and the next line is easy to
find.

**Each line stays one line.** A line of the quote is a line of the
original, and a break in it would read as one. So where the widest line
does not fit, the quote's type shrinks until it does (`fit`). Without
JavaScript, a line that does not fit wraps.

**Italics in a pull quote are its accent.** Write the words that the quote
is for in italics (`> _such a Watch hath not yet been made._`), and the page
shows them in the accent, not slanted: the slide's punchline, marked as the
slide marks it. A script is already slanted, so a slant would only fake a
second style of it. All the lines show at once, so the accent, not a dim,
marks the punchline.

### A photo's credit

**A photo that the talk did not make has its credit under its figure:** a
`> [!credit]` block right after the figure's marker, or first in the part
whose default figure it is. The page shows it small and centred under the
figure; the text export, as a line that starts "**Credit:**". Write who
made the photo, when, and its licence, with a link to its source: the
source and the licence are also in the README of the photo's directory
([`../../README.md`](../../README.md), "License").

### A title for the article

**A slide can have a title in the article that is not its title on the
screen**: `articleTitle` in its frontmatter. The page uses it for the
slide's heading, its line in the table of contents and its heading's
fragment, and the text export uses it too (`slideInput` in
`addons/narration/plan.ts`). Use it where the slide's title is for the room,
not for a reader. For a section, it sets the page title ("The pages", above).
Quote the value, as for the history line: a value that is not text is
an error (`frontmatterText` in `addons/narration/frontmatter.ts`), and the
spell check reads it (`SHOWN_KEYS` in `../../tools/spellcheck.ts`).

## Which clicks get a figure

**By default, the end of each build-up.** A slide's clicks make runs. A run
ends where the next click moves the camera, makes a piece go, or changes the
diving board's place. Within a run, a click only adds pieces, changes text,
or changes the motion (a rest, a spin, "tick" and "tock"). The last click of
each run gets a figure: it shows all that the run built. A slide with no
watch and no board is one run, so its figure shows all its text but its title.
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

**A figure of a slide with no picture is the whole slide, with its text but
not its title or subtitle** (`pictureBox` gives `null`; `ArticleFigure.vue`).
The article's heading just above the figure says the title, so the figure
would only repeat it, and the subtitle belongs to the title. They take no
room, and the rest of the layout fills the figure: the Longitude Prize
slide's two cards are in its middle.

**A slide with no watch can mark its picture `in-figure`**, where the words
beside the picture only repeat the prose. Its figure is then of that
picture: cropped to the `in-figure` elements, as measured on the page, with
the slide's text hidden (`ArticleFigure.vue`). The John Harrison slide marks
its painting so, and the Waltham Watch Company, Lip, Dip, Paint and Radium Girls
slides their photos.

**The figures of one slide that share a camera share a crop** (`frameKey`
in `watch/article.ts`, `cropGroups` in `addons/narration/plan.ts`): the box
over all their pictures and all their labels. The diving board's picture
counts as part of the camera: the Hairspring slide's hairspring, its board
over the pool and its curl are three pictures, so only the curl's figure
keeps the room that the curl rises into. The board over the pool is
cropped at the top of its swing, and the watch that it covers is not part
of its picture. After the curl, the board's picture has gone, and its
sentence is a label that the figure measures (it is `in-figure` while the
board shows). In a figure of one step, a part of a label that does not
show (opacity 0: the words that the edit writes in, before it) takes no
room. So a piece keeps its place
and size from one figure to the next, as on the slide, and the reader sees
that it is the same piece with new ones beside it. An earlier figure keeps
empty room for what comes later. A figure after the camera moves (the Gear
Train slide's big wheel) gets a crop of its own.

**Where the slide's top or bottom cuts the watch, the crop centres it.** A
watch that the slide's bottom cuts sits below the title's space, which the
figure does not show. So the crop cuts its other side too, until the pieces
that the view fits (`artView`) are in its middle, but never into those
pieces. The Gear Train slide's case then shows as much strap above as below.
Not across: there, what the slide cuts is the case beside the train, and the
figure keeps it.

**A figure of the globe is cropped to its disc** (`ballBox`): the ball of
a view of a ball (`View.ball`), not a box around it, whose corners would
show it wider. A story map fills the slide, so its figure is the whole
slide, with its labels but not its title or its punchline's screen. A
label with the class `figure-only` shows in a figure but not in the talk
(`style.css`, "FIGURE ONLY"): on the hidden slide of Cape Noir, "400
miles" names the gap in the figure, where the speaker's punchline does
not. Its voyage and its marks are those of the figure's click
([globe.md](globe.md), "The marks"). The wind's gusts loop while the
figure plays (the production task's
[`PLAN.md`](../tasks/2026-10-31-part-2-production/PLAN.md), section 7,
"Decisions"). Paused, also from the start for a reader who asks for reduced motion, they
stand, drawn, as in a still. A figure of the globe with no wind has no
pause button: nothing in it moves by itself.

A slide with no watch and no board, and nothing `in-figure`, is its own
figure: the whole slide, with its text, at its last click.

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
change (`busyUntil`). The figure draws that exact endpoint before it stops,
so a count includes its last day. Manual pauses keep their last picture.
`pnpm art:privacy DECK` checks a paused voyage step in all three engines,
with canvas pixel reads blocked. A slider's change shows at once; a let-go of the
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

| Key       | Values                                                                                                                                                                                                                                                                                 |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mark`    | a list of pieces, or `false`                                                                                                                                                                                                                                                           |
| `slider`  | `curl`: the diving board's curl, to the hairspring at rest (the Hairspring slide); `twist`: the hairspring's wind from rest, and a swing from there when the reader lets go (the Hairspring slide); `wind`: the Mainspring slide's story, from the bare spring through the key's turns |
| `button`  | the figure shows the click before its own; the button plays the step to its own click. Its words: `release`, the Mainspring slide's release; `run down`, its time-lapse                                                                                                                |
| `speedUp` | a button that runs the whole mechanism this much faster, in step (`watchLapse`'s scale): `120` runs an hour in 30 s. An even whole number above 1                                                                                                                                      |
| `view`    | the figure's camera, in place of the slide's, with the values of `artView`: a named view, or the pieces that a fitted view fits                                                                                                                                                        |

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
and what a second press does. The Mainspring slide's last figure plays its
time-lapse with a button too (`run down`): "Speed up: 6 hours in 6
seconds", as the speed-up buttons below say their speed. It is not a
`speedUp`: the time-lapse lets the spring down and stops the watch, so it
plays once, as the talk's step does, and a second press winds the spring
again ("Start again").

**A speed-up is a button** (`speedUp`), for a part too slow to see move:
at real speed, the center wheel's rim moves about 0.17 px a second, and
the hour hand's about 0.015. The Gear Train slide's figures of the center
wheel and the minute hand run an hour in 30 s (120×); the Hour Hand
slide's run 12 hours in 30 s (1440×). That is the Recap slide's rule: the
slowest part that the figure is about turns once in 30 s. The whole
mechanism runs at the speed-up, in step, as at the Recap's stops (what
moves faster than a frame blurs), and it eases up and back down. The
figure starts at real speed, so the reader sees the true tick first. The
button says the speed in words, as the talk's "6 hours in 6 seconds"
does: "Speed up: an hour in 30 seconds", then "Back to real time"
(`speedUpWords`). Not the Recap's "120×" in the slide's corner: these
figures are cropped to the watch, and the corner is outside the crop. The
whole-watch figures (the cover and its kin) have no speed-up: they are
scenery, and a button under each would be clutter.

**The Recap slide is a playing figure**: a short film, where the animation
is the point and the words are captions. It steps by itself while it is on
the screen: each step waits for the change at its click to end, then for
4.5 s (`DWELL_MS` in `ArticleFigure.vue`). After the last stop it starts
again. The flash after each move stays: the reader is watching the figure.
A reader who turns it holds the tour ("Turning a figure", below).

## Turning a figure

**A reader drags a figure of the watch to turn it**, as on Bartosz
Ciechanowski's pages: a drag sideways swings the watch to show its side,
and a drag up or down tips it. A drag across the whole figure turns it
180° (`DRAG_DEGREES` in `ArticleFigure.vue`). The turn is an orbit after
the step's own camera (`../../docs/webgl.md`, "The camera is
orthographic"), so 12 o'clock stays near the top.

- **Which figures turn:** those that show the watch. Not the globe or a
  story map, not while the diving board's picture covers the watch (a flat
  drawing). So the Hairspring slide's first figure turns, and so does its last (the
  twist), where the board's rest shape and sentence fade out with the
  labels.
- **The limit:** 89° from face-on, in any direction (`ORBIT_LIMIT` in
  `webgl/orbit.ts`). It counts the step's own tilt: a figure at a tilt of
  20° turns farther one way than the other. A drag past the limit slides
  along it. Not an oversight that it is not 90°: at 89° the watch looks as
  it does edge-on, and edge-on the dial's faces lie along the line of sight,
  where their depths tie.
- **The wheel always scrolls the page.** The figure does not listen to it:
  a reader who scrolls past a figure must not zoom into a gear.
- **On a touch screen, only a sideways drag turns the figure**
  (`touch-action: pan-y`): the browser takes a vertical swipe and scrolls
  the page, also on a figure. A touch turns nothing until it has moved
  10 px (`TOUCH_SLOP`), and then only if it moved more sideways than up or
  down: the browser sends a few moves before it starts to scroll. A
  sideways drag tips the watch a little too, by its vertical part.
- **"Reset view"** shows over the figure's upper right corner once the
  figure is turned (not the lower right: the Recap's time scale is there).
  It eases the picture back in 0.6 s (`RESET_MS` in `FigureLayer.vue`), on
  the page's clock, so also in a paused figure; for a reader who asks for
  reduced motion, at once. When a step ends the turn (in the Recap), the
  turn eases back with the camera's move to the step, on its clock and its
  curve: one motion from the turned picture to the step's view. A drag
  turns nothing until the picture is back: when the camera arrives. It
  does not wait for the rest of the step (a fade, a flash), which does not
  move the view.
- **A step keeps the turn**, as do a slider and the Mainspring slide's
  button. They change what the watch does, not where the reader looks
  from, and the turn follows the step's own camera, so a step that moves
  the camera still moves it. A step to a picture that cannot turn ends the
  turn.
- **The Recap's playing figure turns too.** A turn holds its tour at the
  step: the watch runs, but the tour does not go on. A press of a step's
  button or of "Reset view" ends the turn: the picture eases back with
  the camera's move to the step, as one motion, a drag turns nothing until
  the camera arrives, and then the tour goes on, with its dwell after the
  step's change.
- **The labels fade out while the figure is turned**: their leaders are
  drawn for the step's view, and would point at nothing. So does what the
  diving board draws over the watch. What rides the camera turns with the
  watch: the drive arrow, and "tick" and "tock", which come out where the
  turned watch shows its pallet stones. A new layer over the watch must do
  one or the other.

The article owns the drag, the button and the fade (`ArticleFigure.vue`);
the talk's layer owns the turn and its limit (`FigureTurner` in
`addons/narration/figure.ts`, and `FigureLayer.vue`). A still in the static
page does not turn.

## Part 2's story figures

The Cape Noir and Scilly stories each have a globe figure and a final map.
The final map uses the punchline click. It shows the map and its marks,
with the punchline in the prose only.

The Juan Fernández story opens on a slide of South America, with text and
no figure. Then the Hunt for Juan Fernández slide has two figures with steps
(`slides.md`, the narration's figure markers): the sail north to the island's
latitude, and the search, from there to the anchorage. Readers step the ship
forward or back. The death count follows the day dots. The punchline's click
has no figure: if the article needs the punchline, a pull quote says it, not a
figure. The static article shows the search's first step only ("Build the
static page"), so the prose tells how the search ends.
`watch/article.test.ts` checks that a reader can step to each leg of each
shown voyage, and that no voyage plays by itself.
The narration explains that the daily count illustrates the reported rate;
it is not a record of each day's deaths.

The gusts loop while that figure runs. A pause stops them. The page's
pause control still lets readers step the voyage; reduced motion makes
those steps show their targets at once.

## What a page loads

A page loads only what its figures need. The numbers before and after are in
[the task](../tasks/2026-11-20-article-parts/PLAN.md), section 7.

- **The art.** The app's setup (`setup/main.ts`) makes the page's art before
  the app mounts, so the static page shows until the live one can take its
  place. An article page makes the globe only if one of its slides shows it
  ([globe.md](globe.md), "The globe in the deck"): Part 2. So the talk's
  rules (`ARTICLE_HOOKS`) must run only for the page's own slides: the page
  finds them from the frontmatter alone (`pagedSlide`, `articlePages`), and
  a slide of another page may name a piece that the page's art does not
  have.
- **The diving board.** A figure mounts the board only if its slide has a
  `board` key, and the page fetches `diving-board.svg` once
  (`boardMarkup` in `components/DivingBoard.vue`): 751 KB, and an element
  for each of its parts in the page.
- **The stills.** The static page's stills load lazily (`loading="lazy"`):
  a reader with JavaScript gets the live figures, so a still loads only near
  the screen, before they take its place.
- **The photos.** A page loads only the photos that it shows.
  `preloadImages: false` in the headmatter turns off Slidev's preload of
  every slide's images, which it puts in `index.html`, and so in each
  page's head. With it on, Parts 1 and 3 loaded Part 2's five photos, about
  0.9 MB.
- **The watch** is whole on every page: the cover's figure, the World War I
  slide's case. Its unused marks (the one-step wheel, 36,713 triangles) cost
  about 2 MB of GPU buffers. Not an oversight: a renderer that uploads a
  mesh at its first draw would upload the one-step wheel in the middle of
  the live talk (the task, section 3).

## On a phone

**The page works on a phone.** A figure is the column's width, and its
labels do not grow: about 10 CSS px on a 393 px screen, small but sharp on
a phone's 3× screen.

**Full validation checks it** (`pnpm art:phone DECK`, `art/phone-check.ts`).
It loads each page as an iPhone in WebKit and as an Android phone in
Chromium, and at the Android phone's size in Firefox. It fails on a page
error, an error that the page logs, a request outside the deck, a page that
scrolls sideways, an element past the screen's edge (a figure's slide runs
past its crop by design: the check skips a figure's contents), and a touch
target that fails WCAG 2.5.8 (`art/phone.ts`): a step dot is a 25 px
button, with a smaller dot drawn in it. `--shots DIR` writes the top of each page
and each figure as a PNG, for a person to look at: the check cannot tell
whether a figure reads well.

**Emulation is not a phone.** Its GPU, memory and touch scrolling are the
computer's, and its browsers are the newest. Before a launch, look at the
pages on a real phone. The Android emulator runs a real Chrome for Android,
of the version that its system image has (Chrome 130 in
`Pixel_7a_API_35`): it found that Chrome before about version 142 drew no
figure (`../docs/watch.md`, "Theme colours in older browsers"). How to run
it: `../../docs/talks.md`, "Browser support".

## How the code is split

| Where                                                           | What                                                                                                                                                                                                      |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `addons/narration/` (a Slidev addon; the headmatter's `addons`) | the narration's parser, the preparser, the page model, the `/article/<part>` routes and their line in `pnpm dev`, the page, its figures and its pull quotes, the prerender. It knows nothing of the watch |
| `addons/narration/figure.ts`                                    | what the addon and the talk say to each other: `FIGURE` (a figure's click, its time, controls, stillness) and `ARTICLE_HOOKS` (the talk's rules)                                                          |
| `setup/main.ts`                                                 | makes the page's art before the app mounts, with the globe only where the page shows it ("What a page loads"), and gives the article the talk's rules (`ARTICLE_HOOKS`)                                   |
| `watch/article.ts`                                              | the talk's rules: default figures, a picture's key and box, the camera's key, marks, the `article` settings, the controls' words                                                                          |
| `addons/narration/text.ts`                                      | the page plan as Markdown, for the text export                                                                                                                                                            |
| `watch/article-text.ts`                                         | the text export (`pnpm article:text`) and the word count (`--count`), and the page that the talk's tests check, from `slides.md`                                                                          |
| `global-bottom.vue`, `components/FigureLayer.vue`               | in a figure, the layer is the figure's: the watch at the figure's click, the board, "tick" and "tock", the time scale                                                                                     |
| `webgl/shared.ts`, `watch/instance.ts`                          | one renderer, one WebGL context, for all the figures (`sharedStage`)                                                                                                                                      |

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
`slideHeight` and `configs`; and the talk's `setup/main.ts` uses `slides`
(`logic/slides.ts`), to find a page's slides before the app mounts. The
page sets its `<title>` through Slidev's head manager, unhead, which it
injects by unhead's key (`"usehead"`): unhead writes the title, and
overwrites one set on `document`. An
upgrade of Slidev can change them. After an upgrade, open `/article/1` and
`/article/2` and look.

**The addon's routes are `/article/<part>`, routes of the deck.** The slides keep
their own routes. A page at `/narrated/3` would not work (`docs/export.md`,
"Use no separate route").

## Build the static page

```bash
pnpm article   # slidev build, then pnpm prerender: node addons/narration/prerender.ts dist
```

`prerender.ts` serves the built deck, opens each page (`/article/1`,
`/article/2`, ...) in Chromium, and takes a still of each figure, as it
shows when it has settled. The page says how many parts there are
(`data-article-pages`). It takes each still,
and scrolls, with the page paused ("Pause all figures"): with no GPU, a frame
takes up to 0.4 s, and a screenshot or a scroll waits for frames. This made
it 3.7× faster (64 s here); the settles are most of what is left
([the task](../tasks/2026-10-22-article-prerender-speed/PLAN.md)). It writes
`dist/article/<part>/index.html`: the deck's `index.html`, with the page's
text in it as HTML and each figure a still (`dist/article/<part>/figures/`,
about 6 MB in all at twice the pixel density). `dist/article/index.html`
sends a reader to `1/` (`redirectPage` in
`addons/narration/static-page.ts`): a static host has no redirect rules.
**Each page's head is its own:** its title, its description, and the Open
Graph tags of a link's preview, in place of the deck's (`metaTags`). With
`--origin URL` (the site's origin), it also has its own address and its
first figure's still as the preview's image: they need absolute URLs, so a
build without an origin leaves them out. The publish workflow and
`tools/pages_preview.py` pass one. The page gives the prerender its title
and description as data on `<main>`. A figure with steps is a still of its first step:
the live figure shows that step too when it takes the still's place, so the
page does not jump. So:

- the page reads with no JavaScript, and a search engine sees its text;
- with JavaScript, the deck's code starts at `/article/<part>/`, and the live
  article takes the static one's place;
- `dist/` works on any static host, at `/article/<part>/`, with no rewrite
  rules. If
  the deck is not at the host's root, build it with Slidev's `--base`
  (`pnpm exec slidev build --base /talks/watches/`, then the prerender). The
  prerender reads the base from `index.html`. GitHub Pages builds it this
  way, with `pnpm build --base …` and `pnpm prerender --origin …`
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
pnpm article:text > article.md            # the whole article, as one page, in under a second
pnpm article:text --part 2 > part-2.md    # one page, as the reader gets it
pnpm article:text --count                 # each part's words, and the time to read and to say them
```

For a reader that takes text, such as a chatbot asked for feedback on the
wording and the structure. It holds what the page holds, in its order: the
headings, the history lines, the narration's Markdown as written, each aside
as a quote after its paragraph, each pull quote as a quote with a line break at each line, and
each figure in its place, as
`[Figure: <alt text> <its steps>. Controls: <its slider or button>.]`. A
playing figure's captions follow it. The controls are in the words that the
figure shows (`SLIDER_WORDS` and `BUTTON_WORDS` in `watch/article.ts`).

It reads `slides.md` as the tests do, with no build and no browser, and
plans the page with the page's own code (`slideInput`, `articlePages` and
`pagePlan` in `addons/narration/plan.ts`), so it has the page's figures.
The whole article is one page with every part, and the slides for every
page once, at their place in the talk. A copy of the
page is not the same: it has no figures, because alt text is not copied, and
it loses the headings' levels, the italics and the asides' marks. A print of
the live page has blank figures (below).

**The word count** (`--count`) gives each part's words and the time to read
them, without and with the asides: a reader who skips the asides reads the
first; and the time to say them in the talk. It counts what a reader reads: the titles, headings, history lines,
prose, pull quotes and a playing figure's captions (`pageWords` in
`addons/narration/text.ts`). It leaves out the figures' alt text, which
only a screen reader reads, their controls' words and the photo credits.
The time is at 238 words a minute (`READING_WORDS_PER_MINUTE`): the mean
of adults' silent reading of English non-fiction (Brysbaert, 2019). It
leaves out the time that a reader spends on the figures. The speaking time
is an estimate of the talk's: the words without the asides, which the talk
does not say, at 130 to 160 words a minute (`SPEAKING_WORDS_PER_MINUTE`),
the usual range of a speaker who explains from slides. The narration is
close to what the talk says, not the same: it has the article's own lines
("Drag the slider"), and the talk has pauses for its animations. A
rehearsal with a clock gives the real time.

## Not done yet

- Math in the narration (KaTeX).
- A print stylesheet or a PDF of the article. A print of the live page draws
  only the figures near the screen; the others are blank, with their labels
  (Chromium, 2026-10-27).
- Labels that grow on a phone.
- A figure that comes into view on a slow GPU (the Android emulator in
  software) shows a black box until the shared renderer draws it.
