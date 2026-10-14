# The page: a Bartosz-style web page made from the talk (F5)

**Status (2026-10-13): decided and built.** The user chose M1 and T1, P2,
R2 and S1+P, and a playing figure for the Recap slide; "Decisions
(2026-10-13)" at the end of this file has the choices and what was built.
The text before that section is the proposal as it was written. The request
is in [instructions.md](instructions.md), "Follow-up (2026-10-13)" and
"Decisions (2026-10-13, later the same day)". The current rules are in
[`watches/docs/article.md`](../../watches/docs/article.md).
The earlier plan, with the prototype and its measurements, is in
[PLAN.md](PLAN.md). This file replaces PLAN.md's view of F5 as one form among
six: the page is now the goal.

## The request, in short

Make one web page from the watches talk, as engaging as Bartosz
Ciechanowski's "Mechanical Watch": paragraphs, with live illustrations between
them. The page has narration that is not in the speaker notes and not on the
slides. The author controls which clicks become illustrations: good defaults,
and overrides ("not these two clicks", "this one too"). The flashes and the
zoom transitions do not work on a page. Go through the talk up to slide 12,
say what to keep, what to drop and what to put in its place, and find web
conventions that the deck does not have. Then say how to get from the deck to
the page.

Slide 12 is **Changed The World**, the section slide after the Recap slide.
Slidev drops the hidden first block before it numbers the slides
(`@slidev/parser`, `fs.mjs`), so the slides 1 to 12 are: the cover,
Mechanical Marvels, Hairspring, Balance Wheel, Escapement, Three Hands, Gears,
Gear Train, Mainspring, Hour Hand, Recap and Changed The World. This is Part
1 of the talk. The rest of this file calls them "Part 1".

## What the docs say, and what is new

- [PLAN.md](PLAN.md): the narration goes in a `<!-- narration -->` comment
  (A1); one shared WebGL renderer draws every live figure on a page (L4,
  measured: 24 figures cost one context and 1.7 MB of GPU buffers); a still
  of each click already follows the click (`slide-bottom.vue`).
- [`docs/navigation.md`](../../docs/navigation.md): the six kinds of
  animation (presentation, attention cue, text timing, story animation,
  steady loop, physical process). This file decides what the page does with
  each kind.
- [`docs/theme.md`](../../docs/theme.md): one accent per slide; `second` is
  for "the turn" in text and "look here" in the art (a flash, a keyword
  callout, a _mark_); a flash, a keyword callout and a mark must not show near
  each other.
- [`docs/illustrations.md`](../../docs/illustrations.md), "Flash": the
  flash's colours (lines in `second`, faces in the second's wash).
- [`watches/docs/watch.md`](../../watches/docs/watch.md): the watch's keys,
  among them `watchDim` and `watchHide`, which the page can use as they are.

New in this file: what a reader needs that a listener does not; the
treatment of each kind of animation; the options to link a word to a part
(the user does not want Bartosz's coloured words as the default); which
clicks become figures, with counts; the page, slide by slide, for Part 1;
the author's interface; the hosting constraints; and the strategy.

## The three decisions of PLAN.md, answered (2026-10-13)

1. **The frozen talk.** The user's answer: a talk is tagged when it is given,
   so that the version given can be examined. It does not freeze. The
   narration and anything else can improve after the talk. This changes the
   house rule in `../../AGENTS.md`, "Given talks and versions". The proposed
   text is in "Changes outside this task, when agreed" below. It is not
   applied yet.
2. **The form of the narration: A1**, on the condition that the narration
   does not show in the speaker notes. Slidev takes only a slide's _last_ HTML
   comment as its note. So the narration comment must come before the notes.
   The prototype showed this (PLAN.md, E2: "left only the cues as the note").
   A check must fail a slide whose last comment is the narration.
3. **Hosting: not chosen.** Keep as many options open as practical. See
   "Hosting: keep the options open".

## What a reader does that a listener does not

- **The reader sets the pace.** Silent reading is about 238 words a minute;
  speech is about 130–150. The reader skims, stops, goes back, and comes
  back the next day.
- **The reader's eyes are on the words.** While a listener looks at the
  slide, the speaker's voice carries the words. A reader can do one or the
  other. So a cue that plays at a moment (a flash, a camera move) is missed or
  pulls the eye away from the sentence. **Each figure must say the same
  thing whenever the reader looks at it.** This is the main rule of the page.
- **The reader may be on a phone.** A slide made for a projector is 980 px
  wide. On a 390 px phone, it shows at about 0.37 of its size.
- **The reader can act.** A reader can step, scrub, pause, replay and follow
  a link. A listener cannot. So a page can give the reader controls that a
  talk cannot.

**Bartosz's page, measured** (2026-10-13, `experiments/bartosz.py`,
`evidence/bartosz.json`): 8,175 words in 156 paragraphs; 93 figures (84
square); 31 sliders; 13 section headings; no captions (the sentence before a
figure introduces it); a "globally pause" link at the top; a median of 77.5
words between two figures (quartiles 44.5 and 120); 460 part names in bold, in
14 colours, in 125 of the 156 paragraphs. No script links a coloured word to
its figure: the colour does it alone. (PLAN.md counted 84 figures on
2026-10-03: the square ones.)

**Part 1 of the talk, measured:** the speaker notes hold about 2,100 words,
with the stage directions and without the `IF ASKED` parts. The narration is
not written yet; I use the notes as an estimate of its length. Part 1 has 42
clicks on 12 slides, 21 `watchFlash` keys, 32 `watchClicks` blocks, 30
`v-click`s and 6 callouts.

## Keep, drop, or replace: each kind of animation

| What the deck does                                                               | Kind (`navigation.md`)          | On the page                                                                                                                                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Flash** (21 in Part 1): "look at this part, now"                               | attention cue                   | **Drop the timed flash.** Replace it with a steady focus in the figure. The options are in the next section                                                                                         |
| **Camera move, zoom, tilt** between clicks and slides                            | presentation                    | **Drop between figures.** Each figure has one fixed camera. Inside a figure with steps, keep it: the reader asked for the step, so the move goes where the reader looks                             |
| **Slide transitions** (`watch-zoom`, `text-fade`)                                | presentation                    | **Drop.** A heading and white space separate two sections                                                                                                                                           |
| **Fades** of pieces in and out                                                   | presentation                    | **Drop between figures.** Keep inside a figure with steps                                                                                                                                           |
| **Text waits** for the camera or the balance (`after-watch`, `--watch-*-delay`)  | text timing                     | **Drop.** The page's text does not move                                                                                                                                                             |
| **Text reveals** (30 `v-click`s) and **text dims** (the newest is the focus)     | slide text                      | **Drop the reveal and the dim.** The slide's sentences move into the prose (see "What a figure holds")                                                                                              |
| **Story animations**: the board's bend and curl, the key that winds, the release | story animation                 | **Keep, under the reader's control:** it plays when the figure first comes into view, with a replay button. Better: a slider that scrubs the story (Bartosz's way). The clocks allow it (see below) |
| **Steady loops and the mechanism**: the board's bounce, the balance, the ticks   | steady loop, physical process   | **Keep.** They run while the figure is on the screen. One "pause all" control; paused at the start if the reader asks for reduced motion                                                            |
| **Time-lapse** and its time scale (Mainspring, Recap)                            | physical process                | **Keep**, with the time scale. A slider for the speed-up is an option                                                                                                                               |
| **"tick" and "tock"** at each strike                                             | part of the mechanism's picture | **Keep**                                                                                                                                                                                            |
| **Callouts with leaders** (6)                                                    | slide text, in the picture      | **Keep in the figure**, all at once. A reader can read three labels in any order                                                                                                                    |
| **Section slides** (Mechanical Marvels, Changed The World)                       | —                               | **A part heading** ("Part 1: Mechanical Marvels"). No figure: the picture is the cover's                                                                                                            |
| **The cover**                                                                    | —                               | **The page's title, byline, and a hero figure**: the whole watch, running. Add where and when the talk was given, with links to the slides, the given version and a video, if there is one          |
| **Slide title and subtitle**                                                     | —                               | **A section heading**, and the subtitle as its first line or dropped                                                                                                                                |
| **`IF ASKED:`** in the notes                                                     | —                               | **New: an aside** (a sidenote on a wide screen, a "more" box on a phone). The page can hold what the talk keeps back                                                                                |
| **Stage directions** in the notes ("The camera zooms out")                       | —                               | **Drop.** The narration is written for readers                                                                                                                                                      |

**The scrub is possible.** The diving board draws at a time on its own clock
(`components/DivingBoard.vue`: `board.setCurrentTime(time)`, `drawAt(timing,
time)`), and the Mainspring slide's story is timed by constants
(`watch/mainspring.ts`: three key turns of 0.5 s, an uncoil of 2 s). So a
slider can set the story's time. I have not built it.

## Linking a word to a part: the options

The flash points at a part at the moment the speaker names it. A page cannot
know that moment. Two halves replace it: something in the figure that shows
the part, and something in the text (or nothing) that ties the word to it.
The user does not want coloured words as the default: they do not fit the
house look (one accent per slide; `second` is the turn in text). So they are
one option here, not the plan.

### In the figure: what shows the part

| #   | Option                                                                                                                  | Fits the house rules                                                                                     | Cost                                                                                | Limits                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| M1  | **A steady mark**: the part in the flash's colours for the whole figure, not five times                                 | Yes: `theme.md` already names a "mark" as a job of `second` in the art (the Gears slide's span)          | Small: a key, or figure mode turns the click's `watchFlash` into a mark (0.5 day)   | One mark in a figure (or one group). Not near a keyword callout                                              |
| M2  | **Dim the rest** (`watchDim`, at 0.35)                                                                                  | Yes: the Gear Train and Hour Hand slides do it                                                           | None: the key exists                                                                | The context fades too; one focus at a time                                                                   |
| M3  | **Only the part**: the rest is not shown (`watch:`)                                                                     | Yes: the Three Hands slide, the escape wheel alone                                                       | None                                                                                | No context: needs a figure with the context before or after it                                               |
| M4  | **Labels with leaders** (`WatchCallout`)                                                                                | Yes: the talk's own labels                                                                               | None for the 6 that exist; a new label is a line in the slide                       | More than 3–4 labels crowd a figure. On a phone the labels shrink with the figure                            |
| M5  | **Reference numerals**, as in a patent drawing: a small muted numeral with a leader; the text says "the pallet fork (2)" | Yes: a technical-drawing convention, in the muted ink                                                    | A small component (about 0.5 day)                                                   | The reader must look up a number. Numerals clutter the prose                                                 |
| M6  | **A detail inset**: a circle that shows a small part magnified, beside the whole                                        | Yes: an engineering-drawing convention                                                                   | The shared renderer draws a second view in the figure (about 1 day; not measured)   | Takes room. Good for a small part (the impulse jewel), not for every figure                                  |

### In the text: what ties the word to the part

| #   | Option                                                                                                                                                               | Fits the house look                                                                                         | Print and stills | Touch                    | Cost                                             |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------ | ------------------------------------------------ |
| T0  | **Nothing: the figure is next to the sentence**, and shows one focus (M1–M3). The sentence before a figure introduces it, as on Bartosz's page                       | Yes                                                                                                         | Yes              | Yes                      | None                                             |
| T1  | **A new term in italics at its first use** (the textbook convention; the notes already do it: _hairspring_, _oscillating_)                                           | Yes: ink only                                                                                               | Yes              | Yes                      | None                                             |
| T2  | **A plain caption** under the figure, in the muted type: "Marked: the pallet fork."                                                                                 | Yes: muted is for captions                                                                                  | Yes              | Yes                      | Small                                            |
| T3  | **The flash on demand**: a part's name has a thin dotted underline in muted (as an abbreviation does). Point at it, focus it or tap it, and the part flashes in its figure | Yes at rest. The flash keeps its meaning: "look here", now when the reader asks                            | The underline only (print CSS can remove it) | A tap; hard to discover | 0.5–1 day, and a way to name the piece in the narration |
| T4  | **A key glyph**: a small square in the mark's colours before the name, as in a map's key                                                                            | Partly: `second` in the text, but small and only beside a mark                                              | Yes              | Yes                      | Small                                            |
| T5  | **Reference numerals** in the text, with M5                                                                                                                          | Yes                                                                                                         | Yes              | Yes                      | With M5                                          |
| T6  | **Coloured names** (Bartosz): each part's name in bold, in that part's colour                                                                                      | **No**: one accent per slide; the house art has one "look here" colour, so two parts in one figure cannot have two colours | Yes | Yes                | Small, but needs a colour for each part           |
| T7  | **The focus follows the paragraph on the reading line**: the figure stays on the screen (sticky) while its paragraphs scroll past, and the mark changes with the paragraph | Yes                                                                                                         | No (a still shows one state) | Yes          | Large: scrollytelling (see "Figures with steps") |

**Count.** In the 21 figures that I choose for Part 1 (the slide-by-slide
table below), 17 need one focus, and 4 need two or three named parts at once
(the escapement at rest; the gears' span; the two stages of the gear train;
the two stages of the motion works). The talk already has labels for 2 of
those 4 (the Escapement and Gears callouts). This count is my estimate from
my choice of figures.

**Recommendation:** **M1, M2 or M3 in the figure, with T0 and T1 in the
text**: a figure with one steady focus next to the sentence that names it,
and the new term in italics. They use only what the house already has, they
work in print and in stills, and they need no colour in the text. Use **M4**
(the talk's labels) where a figure must name 2–3 parts. Add **T3** later, as
an extra for readers with a pointer, if the page feels too quiet. Keep **T6**
only if a later design wants a colour per part. Then the theme would need a
new role, which `theme.md` does not allow lightly.

Choose M1 (mark) or M2 (dim) for each figure by what the reader must still
see: dim when the context helps (the centre wheel in the whole train), mark
when it does not.

## Figures

### What a figure holds

| #   | Option                                                                                                                       | Phone (358 px wide): scale | Desktop (700 px column): scale | Slide text (35 px) on a phone | For                                                                  | Against                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------ | ----------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| P1  | **The whole slide**, at the click, without its title                                                                         | 0.37                       | 0.71                           | 12.8 px                       | No new code; text and picture as the audience saw them               | The sentences repeat the prose; the picture is in 60% of a small figure         |
| P2  | **The picture and its labels**: the slide's sentences move into the prose; the figure is cropped to the picture's box        | 0.61                       | 1.19 (or 1.0, capped)          | — (not in the figure)         | 1.65× larger on a phone; no repeated text; closer to Bartosz's page  | Hides some slide text by a rule; the crop needs each picture's box              |

The phone scales use the left 60% of the slide (588 px), where a fitted view
puts the picture (`FIT_FOCUS`, `watch/generate.ts`). Some pictures use the
whole slide (the Recap slide; the Mainspring and Hour Hand slides in the
slide band): for them P2 crops to the whole slide.

**Recommendation: P2.** The legibility floor is 17 px on a slide
(`docs/legibility.md`). At 0.61 that is 10 px; at 0.37 it is 6 px. A slide's
labels stay small on a phone in either case. A later step could draw the
labels at the reader's text size over the figure. **A slide with no picture
layer** (no `watch:` and no board: the timekeepers' cards in Part 2) **is its
own figure**: the whole slide, at its last click (P1).

The slide's text in the prose: the stats ("99.99% accurate", "±9 sec a day")
are sentences; the Three Hands table is a table in the prose (Markdown); the
ratios ($7.5 \times 8 = 60$) are math (KaTeX is in Slidev). The author writes
them in the narration. Nothing copies them from the slide.

### Which clicks become figures

| Rule                                                                                                                                                                                                                          | Figures in Part 1 | Words a figure (2,100 / n) |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------------------------- |
| R1: each click that changes the picture (the watch, the board); a click that changes only text or only flashes adds none                                                                                                     | 43                | 49                         |
| **R2: the end of each build-up.** A slide's clicks make runs. A run ends when the camera moves or a piece goes. The last click of each run is a figure. Text-only clicks are in a run, as in the user's example | 29                | 72                         |
| R3: one figure for each slide                                                                                                                                                                                                 | 10                | 210                        |
| My choice for Part 1 (the table below), from R2 with overrides                                                                                                                                                                | 21                | 100                        |
| Bartosz's page (8,175 / 93)                                                                                                                                                                                                   | —                 | 88                         |

R2 generalises the user's example: "when clicks just successively reveal
text, you really only need the last one". It says the same of clicks that add
pieces. From R2 to my choice takes about 10 overrides in Part 1. From R1 it
takes about 22. The Recap slide alone is 9 figures under R1 and R2, and one
figure with steps in my choice. **Recommendation: R2 as the default.**

The counts come from reading the frontmatter of Part 1 by hand. A script
would count them exactly; it is one of the tests of the page model.

### Figures with steps

A figure can hold several clicks, with step controls (‹ ›, dots, and a short
name for each step), for a build-up whose order matters (the two stages of
the gear train) or for a tour (the Recap slide). A step is the reader's own,
so the step's camera move and fades play as in the talk (`navigation.md`,
rule 4: a step animates). This is the one place where a zoom still helps on
a page.

| Option                                                                                                  | For                                                                              | Against                                                                                   |
| ------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Separate figures** (the default)                                                                      | Each figure is steady: what the text beside it says                             | More figures                                                                              |
| **A figure with steps**, for build-ups and tours                                                       | One figure for a sequence; the camera moves only when the reader asks           | The text beside it says one step; the reader must step                                    |
| **Scrollytelling**: the figure stays on the screen while its paragraphs scroll past, and steps with them | The deck's structure as it is (a slide is a figure, a click a step); T7 for free | Not Bartosz's layout; the figure takes a third to half of a phone's screen; does not print |

**Recommendation:** separate figures, and steps for the Recap slide's tour
and, if the author chooses, a build-up. Scrollytelling is close to the
narrated mode (F1), which stays possible on the same page model.

## The page, slide by slide (Part 1)

Clicks are as in `slides.md` on 2026-10-13. "Figure at n" means the slide at
click n, in figure mode (P2). Figure counts: R2's, then mine.

| Slide (clicks)              | In the talk                                                                                                                                                                                                           | On the page                                                                                                                                                                                                                                                                                                                                                                                           | Dropped                                                           | Figures (R2 → mine) |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------------- |
| Cover (0)                   | The whole watch, running; the title                                                                                                                                                                                   | The page's title and byline; when and where the talk was given, with links; a short opening; **the hero figure**: the whole watch, running; "pause all" in the opening, as on Bartosz's page                                                                                                                                                                                                         | —                                                                 | 1 → 1               |
| Mechanical Marvels (0)      | Section; then the `watch-zoom`: the oscillator flashes, the camera zooms in                                                                                                                                         | **Heading** "Part 1: Mechanical Marvels". Option: a "where it is" figure, the whole watch with the oscillator marked (M1), in place of the flash and the zoom                                                                                                                                                                                                                                       | the transition; the flash                                         | 0 → 0 (or 1)        |
| Hairspring (3)              | 0: the hairspring swings; 1: the diving board bends and bounces, "Bend it away from straight, it pushes back"; 2: the board curls into the hairspring, "Bend" becomes "Wind"; 3: it swings again                   | **Figure at 0**: the hairspring, swinging. **Figure at 1**: the board, bouncing, with its sentence (a label of the drawing). **Figure at 3**: the curl, then the swing, with a replay button, or a **slider from board to spring** (the best slider in Part 1: the curl is the talk's key image). The question in the first comment is not for the page                                         | the board's fade over the watch                                   | 3 → 3               |
| Balance Wheel (3)           | The balance fades in and flashes; the text adds "and steadily", "99.99% accurate", "86,400 sec in a day, ±9 sec a day"                                                                                                | **Figure at 0**: the balance and the spring, swinging; the balance wheel marked (M1). The numbers go in the prose. **Aside**: "Why a wheel, not a disc?" (from `IF ASKED`)                                                                                                                                                                                                                       | the flash; the reveals and dims                                   | 1 → 1               |
| Escapement (4)              | The camera zooms out; the escapement fades in. 1: the escape wheel alone spins, with the drive arrow, "Wheel driven by hidden mechanism"; 2: the pallet stops it; 3: the balance rests, "Jewel strikes pallet"; 4: it swings, "tick", "tock" | **Figure at 1**: the escape wheel alone, spinning, with the arrow (M3). **Figure at 3**: at rest, **all three labels at once** (M4), the impulse jewel perhaps in a detail inset (M6). **Figure at 4**: running, with "tick" and "tock". The impulse back to the balance (a question in the notes) can be an aside                                                                            | the zoom; the callout dims; the order of the labels               | 2 → 3               |
| Three Hands (3)             | The seconds hand alone, ticking; two lines; the table                                                                                                                                                                 | **Figure at 0**: the hand, ticking, pinned on its arbor. **The table in the prose** (Markdown). **Aside**: "small seconds" (from `IF ASKED`)                                                                                                                                                                                                                                                      | the reveals and dims                                              | 1 → 1               |
| Gears (6)                   | The gears spin; 1: the span flashes, then stays; 2–3: "Half of the small gear", "A quarter of the big gear"; 4: "Twice the circumference, half the speed. Exactly."; 5: the escapement returns, the gears tick; 6: the seconds hand | **Figure at 4**: the gears spinning, with the span (already a mark) and both labels. "Twice the circumference, half the speed" in the prose. **Figure at 6**: the escapement and the seconds hand, ticking (5 and 6 are one figure). **Asides**: the beat rate of real watches; the pitch                                                                                                    | the span's flash; R2's figure at 0                                | 3 → 2               |
| Gear Train (5)              | 1: one wheel with 240 teeth, larger than the case (the camera zooms out); 2: the third wheel, 7.5:1; 3: the centre wheel, 8:1; 4: the minute hand, the case and the dial; 5: all but the centre wheel dims, "Wheel driven by hidden mechanism" | **Figure at 1**: the one-step wheel, with the case for its size: the point needs no zoom, only the frame. **Figure at 3**, or **a figure with steps 2–3**: the two stages, marked. $7.5 \times 8 = 60$ in the prose. **Figure at 4**: the minute hand. The question at 5 ("what drives this wheel?") ends the section in the prose                                                     | the zoom; the arrow's move; the dim at 5                          | 3 → 3               |
| Mainspring (4)              | 0: the bare spring; 1: the stud, the key winds it (a story); 2: the stud goes, the spring uncoils; 3: in the barrel, the whole movement, wound, it starts; 4: "6 hours in 6 seconds"                              | **Figure 0–2, one figure**: wind and release, with a **slider** (the key's turns, then the release) or replay. **Figure at 4**: the whole movement running, with a "6 hours in 6 seconds" button that runs the time-lapse                                                                                                                                                                           | the zoom out; the flashes of the barrel and the centre pinion     | 3 → 2               |
| Hour Hand (6)               | 1: one 12:1 wheel; 2: its hand, off centre; 3: the camera zooms in, the rest dims; 4: out, 3:1; 5: back, 4:1; 6: the camera zooms out, the hour hand in the middle                                                | **Figure at 2**: the one-step wheel and its hand, off centre. **Figure at 5**: the motion works, close, the rest dimmed (M2), both stages marked or labelled; $3 \times 4 = 12$ in the prose. **Figure at 6**: the whole watch with all three hands                                                                                                                                         | the zooms; the flashes                                            | 3 → 3               |
| Recap (8)                   | No text. Nine stops along the train; the camera moves, zooms, tilts and turns together; a time-lapse with its scale; a flash after each move                                                                       | **One figure with nine steps**, named ("Motion works", "Barrel", …, "Balance"): the camera moves when the reader steps, the touch is marked (M1) after the move, the time scale shows. Other options: drop it (a reader can scroll back), or one still of the whole movement with each touch labelled                                                                                          | the flashes                                                       | 9 → 1               |
| Changed The World (0)       | Section; the camera returns to the cover's picture                                                                                                                                                                   | **Heading** "Part 2: Changed the World"                                                                                                                                                                                                                                                                                                                                                            | the zoom out                                                      | 0 → 0               |
| **Total**                   |                                                                                                                                                                                                                       |                                                                                                                                                                                                                                                                                                                                                                                                       |                                                                   | **29 → 21**         |

### Web conventions that the deck does not have

- **A table of contents**, from the headings (10 sections in Part 1; Bartosz
  has 13 for the whole page). It shows on a wide screen in the margin.
- **An anchor for each section and each figure** (`#escapement`,
  `#escapement-3`), so that a reader can link to a figure.
- **Asides** for the `IF ASKED` material: sidenotes in the margin on a wide
  screen, a "more" box on a phone.
- **Controls on a figure**: pause and play; replay for a story; a slider
  where the reader can scrub a story or a speed-up; steps for a tour.
- **"Pause all"**, and paused at the start for a reader who asks for reduced
  motion. Figures off the screen stop (the shared renderer already draws only
  the figures near the screen).
- **Alt text for each figure**, for screen readers, and for the stills of the
  PDF and a blog post.
- **A still for each figure** (a poster), shown before the live figure is
  ready, with no JavaScript, with no GPU, and in print. In software WebGL the
  live figures ran at 5–6 frames a second (PLAN.md, the follow-up), so a slow
  figure falls back to its still.
- **Math and tables** in the prose (KaTeX and Markdown).
- **A link from each figure to the slides at that click**, where the slides
  are hosted with the page.
- **A share image** (Open Graph): the hero figure's still.

## What the page looks like

A wide screen (about 1,280 px). The prose column is about 700 px; a figure
is as wide as the column, or a little wider. The margin holds the table of
contents and the sidenotes.

```
 ┌───────────────────────────────────────────────────────────────────────────┐
 │  What Every Nerd Should Know About Mechanical Watches                     │
 │  Martin C. Martin · given at <event>, <date> · slides · video             │
 │                                                                           │
 │  A short opening. All the figures move; pause all.                        │
 │  ┌─────────────────────────────────────────────┐                          │
 │  │      the whole watch, running (hero)        │                          │
 │  └─────────────────────────────────────────────┘                          │
 │                                                                           │
 │  PART 1 · MECHANICAL MARVELS                         Contents             │
 │                                                      Hairspring           │
 │  Hairspring                                          Balance Wheel        │
 │  The _hairspring_ beats every two seconds. …         Escapement   ◂       │
 │  ┌─────────────────────────────────────────────┐     …                    │
 │  │      the hairspring, swinging               │                          │
 │  └─────────────────────────────────────────────┘                          │
 │  Think of a diving board. …                                               │
 │  ┌─────────────────────────────────────────────┐                          │
 │  │      the board bounces · "Bend it away …"   │                          │
 │  └─────────────────────────────────────────────┘                          │
 │  Now curl the board. Drag the slider: …                                   │
 │  ┌─────────────────────────────────────────────┐                          │
 │  │      board ⟶ spring                         │                          │
 │  │  board ●━━━━━━━━━━━━━━○ spring              │                          │
 │  └─────────────────────────────────────────────┘                          │
 │  …                                                                        │
 │  Escapement                                          ┊ Why a wheel and    │
 │  …the _impulse jewel_ strikes the _pallet fork_:     ┊ not a disc? …      │
 │  ┌─────────────────────────────────────────────┐                          │
 │  │  Wheel driven by…   Jewel strikes pallet    │                          │
 │  │   (the escapement at rest, labelled)        │                          │
 │  │  Pallet blocks wheel        ⏸  ↗ slides     │                          │
 │  └─────────────────────────────────────────────┘                          │
 └───────────────────────────────────────────────────────────────────────────┘
```

A phone (390 px): one column; figures full width (scale about 0.61 under
P2); the contents behind a button at the top; each aside a "more" box under
its paragraph.

The look is the house's: Ledger's paper, ink and fonts (Fraunces headings,
IBM Plex text), the figures on the same paper with no frame, and colour only
in the figures.

## The author's interface

All of it is in `slides.md`, next to the slide. The deck itself does not
change: nothing here shows in the slides or in the presenter view.

### The narration, and where the figures go

The narration is a comment before the speaker notes (A1). `[click]` markers
split it, as in the notes, so each part goes with its click. Two markers
override the default (R2):

| Marker              | Meaning                                                                                                                                       |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `[click]`           | the next click starts here, as in the notes. If R2 gives this click a figure, the figure goes here, before the part's text                   |
| `[figure]`          | a figure of the current click goes here. In a part that has a default figure, it moves that figure to this place                            |
| `[figure: alt text]` | the same, with the figure's alt text                                                                                                          |
| `[nofigure]`        | this part has no figure, even if R2 gives it one                                                                                              |
| `[figure 2-3]`      | one figure with steps, from click 2 to click 3                                                                                                |

An example: the start of the Escapement slide's narration, drafted from its
notes to show the markers. The words are only an example: the narration is
the author's to write.

```md
<!-- narration
The balance swings back and forth. The hands must turn one way only. The
_escapement_ turns the swing into steps.

[click]
[figure: The escape wheel alone, spinning freely, with an arrow for the push.]
Something that we cannot see yet pushes the _escape wheel_ round. Take
everything else away, and it spins freely.

[click]
The _pallet fork_ blocks it: a tooth lands on a pallet stone, and the wheel
stops.

[click]
[figure: The escapement at rest. The impulse jewel is in the fork's notch.]
On the balance is a small _impulse jewel_. …

> [!aside] Does the wheel push back?
> Yes. At each step, a little energy goes from the train into the balance. …

[click]
Let the balance swing again. …
-->

<!--
cues
-->
```

Here R2 gives figures at clicks 0 and 4. `[figure]` at click 1 and click 3
adds two. Click 0's default figure is not wanted, so its part would have a
`[nofigure]` (left out of the example). Click 4 keeps its default.

### What a figure shows

By default a figure shows the slide at its click, in figure mode:

- the picture (the watch, the board) and its labels (`WatchCallout`, the
  "tick" and "tock"); the slide's title and its other text are not shown
  (P2);
- the click's `watchFlash` pieces as a steady mark (M1), or no mark if the
  click has none;
- the mechanism running, as on the slide.

A slide changes this for one figure in a frontmatter block, `article`, keyed
by click. The watch's own keys stay as they are. For example:

```yaml
article:
  3:
    mark: [impulse jewel] # M1 on these pieces in place of the click's flash
  5:
    dim: false # do not dim the rest in this figure
```

The deck's test that checks each piece name (`watch/deck.test.ts`) checks
these too.

**Alternatives for the interface, and why not:** all of a figure's settings
in the marker (`[figure mark=pallet fork]`): piece names with spaces make it
hard to read, and the prose fills with settings. A list of exported clicks in
the frontmatter (`figures: [1, 3, 4]`): it says nothing about where a figure
goes in the prose. A separate file for the page: it drifts from the slides
(PLAN.md, A5).

### Asides, math, tables

- An aside: a quote block that starts `[!aside]` and a title, as in GitHub's
  alerts.
- Math: `$…$` and `$$…$$`, with KaTeX.
- A table: Markdown.

## Hosting: keep the options open

Where the page goes is not decided. These are the targets, and what each
needs:

| Target                                                                                   | Needs                                                                | Live figures |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------ |
| Any static host, at a domain's root or under a path (GitHub Pages, Netlify, Cloudflare Pages, S3, a home server) | relative paths; no server rewrites                                   | yes          |
| A blog platform that allows no scripts                                                   | HTML or Markdown with stills (and clips), PLAN.md F4                 | no           |
| A blog that allows an iframe                                                             | the page, or one figure, in an iframe (PLAN.md, L2)                  | yes          |
| A file to send                                                                           | the PDF (F3). One self-contained HTML file: not known to work (module scripts from `file://`) | — |
| No network                                                                               | no outside requests (a house rule for every talk already)            | yes          |

So the output keeps these properties:

1. **One page model**: a JSON file that a build step makes from `slides.md`:
   the sections, each part's Markdown and HTML, and each figure (slide,
   clicks, alt text, mark). Every form reads it: the live page, the static
   HTML or Markdown, the PDF, and the narrated mode (F1).
2. **Relative URLs only**, and **no server rewrites**: one HTML page, or
   Slidev's `routerMode: hash` (in Slidev 53's types, and as a build
   override). Whether a relative `--base` works in Slidev 53, I have not
   tested.
3. **No outside requests.**
4. **A still and alt text for each figure.**
5. **The prose is HTML in the file**, not only made by a script, so that it
   reads with no JavaScript and search engines see it. The live figures are
   added over the stills.

## How to get from the deck to the page: the strategy

| #   | Strategy                                                                                                                                                                                                                                  | For                                                                                                             | Against                                                                                                                                                   | Size (focused days; uncertain) |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| S1  | **A route in the deck's own build** (the prototype's `/article-live?shared`): each figure is the slide at a click in figure mode, drawn by one shared renderer                                                                           | Prototyped and measured; any slide works, with its labels and components; one build                            | Uses three Slidev internals; ships Slidev's app (1.4 MB for one slide, PLAN.md); the prose is made by a script; hash routing and anchors share the URL's hash (not tested) | 4–6                            |
| S1+P | **S1, then a prerender**: after the build, a browser opens the page, saves the prose as HTML and a still of each figure, and writes one static page; the deck's bundle then makes the figures live over the stills                     | All of S1, and all five hosting properties; the same step makes the stills for the PDF and a blog post         | One more build step; two ways a figure shows (still and live) to keep in step                                                                             | S1 + 1.5–2                     |
| S2  | **A separate page app in the talk**, without Slidev's runtime: it imports `watch/`, `webgl/` and the board, and draws each figure from `watchState(frontmatter, click)`; a script makes the prose from `slides.md`                       | The lightest page; no Slidev internals; static HTML from the start                                              | Works only for the watch and the board: other slides (Part 2's cards) need Slidev; the labels are slide markup, so they must be redone for the page         | 6–9                            |
| S3  | **Iframes**: a hand-made page, with an iframe of the slides for each figure                                                                                                                                                                 | No new code in the deck                                                                                         | 4.2 MB of memory and a WebGL context for each live frame; past 16, contexts are lost (PLAN.md, L1, L2)                                                    | 1–2, but it scales badly       |

The sizes include: the page model and its markers (about 1 day); the page's
layout, headings, contents, anchors, asides and controls (about 2 days);
figure mode with the crop, the marks and the `article` keys (about 1–1.5
days); steps (about 1 day); and, as options, the sliders (about 1–2 days)
and the flash on demand (about 0.5–1 day). Writing the narration is the
author's work, and not in the sizes. The estimates come from the prototype's
size; the parts that I am least sure of are the prerender and the sliders.

**Recommendation: S1+P.** Build S1 first: the prototype has most of it, and it
works for every slide. Add the prerender when the page is to be published: it
gives the static HTML, the stills and every hosting target. Keep S2 for later,
if the weight of Slidev's app on the page is a problem: the page model does
not change.

## Ranking of the main choices

| Choice                  | Recommendation                                       | Next best                                   | Why                                                                                                       |
| ----------------------- | ---------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Word to part            | M1–M3 with T0 and T1; M4 where 2–3 parts             | T3, the flash on demand, added later        | Only house devices; works in print and stills; 17 of my 21 figures need only one focus                   |
| What a figure holds     | P2: the picture and its labels                        | P1: the whole slide                         | 1.65× larger on a phone; no repeated text                                                                  |
| Which clicks            | R2: the end of each build-up                          | R1: each picture change                     | 29 figures by default, about 10 overrides to my 21 (R1: 43 and about 22)                                  |
| Sequences               | separate figures; steps for the Recap tour            | scrollytelling                              | Bartosz's layout; steady figures; works on phones and in print                                            |
| Interface               | markers in the narration; an `article` block for looks | all settings in markers                     | Placement belongs to the prose; looks belong with the slide's other keys                                  |
| Strategy                | S1+P                                                   | S2                                          | Reuses the prototype and every slide; the prerender opens every host                                       |

## Decisions for you

1. **Word to part**: which of M1–M6 and T0–T7. My recommendation is above.
2. **What a figure holds**: P1 or P2.
3. **The default for figures** (R1, R2 or R3), and the markers.
4. **The Recap slide on the page**: a figure with steps, one labelled still,
   or nothing.
5. **Sliders**: for the curl and the winding, in the first version or later.
6. **The strategy**: S1+P, or S2.
7. **The frozen-talk rule**: the text below.

## What I do not know

- How long Part 1's narration will be. The estimates use the notes' 2,100
  words.
- Whether search engines index prose that a script makes. S1+P avoids the
  question.
- Whether Slidev's hash routing breaks in-page anchors (`#escapement`). I
  expect it does, because both use the hash; the page would then scroll by
  script. Not tested.
- Whether a relative `--base` works with Slidev 53.
- Whether a self-contained HTML file runs from `file://`.
- How many readers have no GPU, or read on a phone.
- How legible the labels are at 0.61 on a real phone.
- Whether readers find a slider or step controls without a hint. Bartosz's
  sentences tell the reader ("you can use the slider").

## Changes outside this task, when agreed

None of these is applied. Each needs the user's agreement first.

**`../../AGENTS.md`, "Given talks and versions".** Today: "A talk is _in
progress_ until you give it. Then it is _given_. After that, do not change it
on `main`." Proposed:

> A talk is _in progress_ until you retire it. Tag it each time you give it:
> the tag is the version that you gave. A talk that you have given can still
> change on `main`: its narration, its page and its slides can improve. When
> you stop changing a talk, it is _retired_. After that, do not change it on
> `main`.

The rules that say "given" today would then say "retired": `main` does not
keep a retired talk working; no repo-wide command touches one; no tool checks
one again (`AGENTS.md`, "Give each tool explicit paths"; `tools/lib.py`'s
docstring); no validation runs in one. The tagging rule stays as it is. The
cost: shared changes (the theme, `tools/`) must keep a given talk working
until it retires.

**Also to change:** `docs/export.md` ("A frozen talk stays frozen", and its
status); `docs/talks.md` (its line on the talk that you gave); and
`watches/docs/slide-patterns.md`, "Speaker notes" (the narration comment
comes before the cues).

**What would move into the project:** the addon, in `stem/addons/narration/`
(PLAN.md, "Where the code lives"); figure mode and the `article` keys in the
watches talk, with its docs (`watches/docs/watch.md`); the page's rules in
`docs/export.md`.

## Decisions (2026-10-13)

The user's answers are in [instructions.md](instructions.md), "Decisions".

| Question                | Choice                                                                                                                         |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Word to part            | **M1 and T1**: a steady mark in the figure, the term in italics where it first comes. To be reviewed after a few slides     |
| What a figure holds     | **P2**: the picture and its labels                                                                                             |
| Which clicks            | **R2**: the end of each build-up                                                                                               |
| The phone               | a later goal; the desktop must not suffer for it                                                                               |
| Story animations        | a slider (the curl, the winding), made obvious, with text that invites the reader; no loop                                     |
| The Recap slide         | a figure that plays like a film, with the narration as captions                                                                |
| Asides                  | a sidenote or a footnote: built as a sidenote on a wide window, a box in the text on a narrow one                             |
| The frozen-talk rule    | applied: a talk is frozen when it is retired (`retired/<talk>/<date>`), not when it is given                                   |
| Hosting                 | live figures; the PDF later                                                                                                    |
| Strategy                | **S1+P**. A command that exports with no Slidev runtime (S2) may come later                                                    |

### Ideas recorded, not built

- **Camera controls on a figure** (the user's idea): from a slider that scrubs
  the camera's move between two clicks, to tilt and zoom about the figure's
  focus. Tilt and zoom are the cheapest: the explorer (`watch/explorer/`)
  already moves a camera about a target, and a fitted view's pivot is the
  focus. Full 3D controls are likely of little use to most readers.
- **A video** (YouTube, TikTok): the slides, stepped by a voice that reads the
  narration, one part for each click. YouTube takes the 16:9 slide; TikTok's
  9:16 wants the figure's crop (P2) with captions under it.
- **The PDF**: closer to the slides or the article's stills; later.

### What was built (all in the watches talk; see its `docs/article.md`)

- `addons/narration/`: the narration's parser and its markers
  (`narration.ts`), the preparser, the page model (`plan.ts`), the `/article`
  route, the page and its figures, and the prerender (`prerender.ts`,
  `pnpm article`). The addon stays in the talk until a second talk uses it:
  then the talk's type check, lint and tests cover it.
- The talk's side: `watch/article.ts` (R2, the boxes, the marks, the
  `article` settings), `setup/main.ts`, `components/FigureLayer.vue`,
  `webgl/shared.ts` (one renderer; the stage's frame is now `drawFrame`,
  shared), the board's and the mainspring's scrub, and `in-figure` on the
  callouts.
- Part 1's narration, drafted from the notes for the user to rework, with 19
  markers: 20 figures, two sliders, two figures with steps, and the Recap
  slide's tour.

Measured on 2026-10-13 (`experiments/page/`): the article loads with 21
figures (Part 2's first slide is the 21st) and no page errors in Chromium,
Firefox and WebKit; both sliders move their stories; the static page shows 21
stills with no JavaScript, and 21 live figures with it, at the host's root and
at `/talks/watches/`, with no rewrite rules; the stills are 5.9 MB at twice
the pixel density.

Changed from this proposal: the addon is in the talk, not the house; the
page has a contents list at the top, not in the margin (wide figures and a
margin column did not fit together); no math yet.
