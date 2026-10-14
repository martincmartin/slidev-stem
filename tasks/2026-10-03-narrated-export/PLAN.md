# A narrated version of a talk, for people who did not see it

**Status (2026-10-13): reopened, and the article is built.** The goal is now
the Bartosz-style page (F5). Its design and the user's decisions are in
[page-design.md](page-design.md); the built article's rules are in
[`watches/docs/article.md`](../../watches/docs/article.md). This
file still holds the forms, the prototype and its measurements. To start
again, read [README.md](README.md), "Resume here". The house doc is
[`docs/export.md`](../../docs/export.md).

## The request (2026-10-03)

The slides are pictures with a little text. They support what the speaker
says, and they do not stand alone. The speaker notes are to become short cues,
not the spoken text. So the slides and the notes together are not worth
sending to anyone. The request: write the narration in `slides.md`, and make a
form of the talk that shows the narration with the slides. Find the forms, the
ways to make each one, and the size of each. Say if Slidev must change. Rank
the options, and say when to start. The full request is in `instructions.md`.

## The answer in short

- **Slidev does not have to change.** Slidev 53 lets an addon add a route, a
  layer over every slide, a nav-bar button and a step that reads `slides.md`.
  A prototype addon of 447 lines (with its CSS and comments) gives two forms:
  - **the narrated mode**: the live slide, with the narration in a panel
    beside it or below it. The reader uses the arrow keys, or scrolls the
    narration and the slide follows.
  - **the article**: one long page with each slide, at each click, as a still
    and its narration under it. The browser prints it as a PDF handout.

  Both work in the dev server and in a static build, on the real watches
  talk, with its WebGL watch.

- **The narration goes in a comment**, `<!-- narration ... -->`, before the
  speaker notes. It uses the same `[click]` markers as the notes. The
  presenter view shows only the notes, which are now the cues.
- **Sizes** (estimates, from the prototype; see "Sizes"): the narrated mode,
  2–2.5 days to finish. The article and the PDF, about 2–3 days more, which
  include 0.5–1 day of fixes in the watches talk. A static blog post (Markdown
  or HTML with images), 1–2 days more. A Bartosz-style page with live
  figures: about 1–1.5 days on top of the article (2026-10-04, the
  follow-up; the first estimate was 3–6 days or more).
- **Recommendation:** write the narration now, as you write each slide. Build
  the narrated mode first: it is the only form that keeps the talk's
  animations, and most of it already works. Then the article and the PDF. Put
  the code in a house addon, `stem/addons/narration/`. Publish it on npm only
  after two talks have used it.
- **One decision is yours** before the talk is given: a given talk is frozen on
  `main` (`../../docs/talks.md`). See "Decisions for you".

## What the docs say, and what is new

- `watches/docs/slide-patterns.md`, "Speaker notes": today the notes hold "the
  spoken line", with `[click]` markers and an `IF ASKED:` tail. The plan
  changes this: the spoken line moves to the narration, and the notes become
  cues. The `IF ASKED:` tail stays in the notes.
- `watches/docs/watch.md`: one live WebGL watch under every slide; in print
  mode a still on each page (`slide-bottom.vue`); "Print and export show no
  board still"; WebGL contexts: 1 for a slide, 2 for the presenter view, 1 for
  the export.
- `../../docs/talks.md` and `../../AGENTS.md`: each talk pins its own packages;
  a given talk is frozen; house items (the theme, `tools/`, `docs/`) have one
  live copy.
- `../../docs/legibility.md`: 17 px is the smallest text on a slide.
- `watches/tasks/2026-10-02-scrolling-triggered-text/` is about how text
  appears _on_ a slide during the talk. This task is about text _off_ the
  slide, for readers. They do not overlap, except that the stills of the
  article show on-slide text in its final state.

No doc covers a form of the talk for readers. Everything below is new.

## Prior art

### In Slidev

| What                                                             | State                                                                                                                                                           |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `slidev export --format md`: a PNG of each slide, then its notes | Exists. Added in 2022 for "speech transcripts as an article" (issue #530, PR #531: +45/−13, merged in 2 days)                                                   |
| `--format md --with-clicks`                                      | Exists. All the click images of a slide come first, then the whole note: no text between clicks                                                                 |
| `slidev export-notes`: the notes as a PDF                        | Exists. Notes only, no slides (issue #2604, open since 2026-05)                                                                                                 |
| `--format pptx`: notes as PowerPoint speaker notes               | Exists                                                                                                                                                          |
| A handout PDF: slide above, notes below                          | Not merged. PR #1421 (+656 lines) ran from 2024-03 to 2025-09; its author closed it for a new version, PR #2278 (+1,706 lines, 26 files), open since 2025-09-16 |
| A scrolling view                                                 | None found                                                                                                                                                      |

Upstream is active: about 40 PRs were merged from 2026-07-31 to 2026-10-02,
many from outside contributors, one of +5,051 lines (#2722, editable PPTX). 34
PRs and 184 issues are open. A PR that adds an addon to the gallery is about 11
lines (#2723).

### Outside Slidev

- **Simon Willison's "annotated presentations"**: each slide as an image with
  alt text, and the narration written under it. He writes it after the talk,
  in 2–3 hours, and adds links. He built a small tool for it.
  <https://simonwillison.net/2023/Aug/6/annotated-presentations/>
- **reveal.js "scroll view"** (since reveal.js 5.0): the deck becomes one
  scrolling page, and fragments (clicks) still step as you scroll. It turns on
  by itself on narrow screens. <https://revealjs.com/scroll-view/>
- **Bartosz Ciechanowski, "Mechanical Watch"**: measured from the page's HTML
  on 2026-10-03, about 8,200 words of prose, 84 interactive figures, and 31
  slider controls. It is written to be read, with figures made for the page.

## What an addon can use in Slidev 53

| Hook                                                                                | Public?       | Used for                                              |
| ----------------------------------------------------------------------------------- | ------------- | ----------------------------------------------------- |
| `setup/preparser.ts`, `transformSlide`, `transformNote`                             | yes           | read the narration comment into the slide's data      |
| `setup/routes.ts`                                                                   | yes           | add `/article`                                        |
| `global-top.vue`, `global-bottom.vue`                                               | yes           | the narration panel (teleported out of the slide)     |
| `custom-nav-controls.vue`                                                           | yes           | a "narration" button (not built in the prototype)     |
| a frontmatter key                                                                   | yes           | carries the narration to the client, in dev and build |
| `PrintSlideClick.vue`, `useFixedNav`, `createFixedClicks`, `constants.ts`, `env.ts` | no (internal) | draw a slide still, at one click, on the article page |
| the ids `#page-root`, `#slide-container`                                            | no            | shrink the live slide to make room for the panel      |

Slidev reads these hooks from the talk, the theme and each addon. In the two
years to 2026-10-01, the internal files changed upstream 1–10 times each
(`PrintSlide.vue` 1, `PrintSlideClick.vue` 2, `NoteDisplay.vue` 3,
`useClicks.ts` 5, `play.vue` 6, `useNav.ts` 8, the parser 10). So an upgrade
can break the addon, but rarely. Each talk pins its own Slidev, so an upgrade
breaks nothing until a talk chooses it.

Two traps found on the way:

- **A separate route for the narrated mode does not work.** Slidev's `go()`
  always builds a play, presenter or export path. A page at `/narrated/3` goes
  back to `/4` at the first key press. `go()` keeps the query string, so a
  `?narration` flag on the play route survives. The prototype uses the flag.
- **A relative addon path resolves against the parent of the deck's
  directory.** `addons: [./addons/narration]` in `watches/slides.md` would
  look in `stem/addons/narration`. Use `@/addons/narration` (the deck's own
  directory) or a package name.

## Where to write the narration

| Option                                                                              | Writing it                                                        | `[click]`     | Markdown, links, math          | Client gets it                  | A script gets it  | Risk                                                                                                         |
| ----------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------------- | ------------------------------ | ------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------ |
| **A1.** `<!-- narration ... -->` before the notes, read by a preparser (prototyped) | prose next to the slide, like notes today                         | same as notes | yes (the preparser renders it) | yes: preparser → frontmatter    | regex on the file | the notes must stay the _last_ comment; a check can enforce it                                               |
| A2. a `<Narration>` component in the slide body                                     | tags and blank lines around prose                                 | own syntax    | yes (Slidev compiles it)       | only while the slide is mounted | regex on tags     | text inside the slide; must teleport out; drawn in every view                                                |
| A3. a frontmatter key, `narration: \|`                                              | prose in YAML, at the _top_ of the slide, among the `watch*` keys | own syntax    | needs a renderer               | yes, directly                   | YAML parse        | indentation errors; awkward to edit                                                                          |
| A4. in the notes, with the cues marked; `transformNote` removes the narration       | one comment holds both                                            | shared        | yes                            | yes                             | regex             | Slidev's presenter can edit and save notes; it may save the trimmed note and lose the narration (not tested) |
| A5. a separate `narration.md`, keyed by slide                                       | far from the slide                                                | own syntax    | yes                            | needs a loader                  | easy              | keys drift when slides move                                                                                  |

**A1 is the choice.** It reads like the notes do today, the `[click]` markers
mean what they mean in the notes, and nothing in Slidev's own views shows it.
The preparser does not change the slide's content, so I expect Slidev's
editor to write the comment back unchanged (not tested). In the experiment,
`prettier-plugin-slidev` left the comments as written. A production build
drops HTML comments from the slide, so the narration reaches the client only
through the frontmatter (it is in two bundles of the build: the route data and
the slide's module).

The preparser renders each part to HTML with `markdown-exit`, the renderer
that Slidev uses for notes. It should also keep each part's Markdown, for the
blog export.

## The forms, and the ways to make each

"Parts" below are the pieces of a slide's narration between `[click]`
markers. The 3-slide sample has 12 parts. In 4 of them, motion is the point
(the hairspring's beat, the board's bounce, the curl, the swing again). A still
loses those 4 unless the part gets a video clip.

### F1. The narrated mode: the live slide and its narration (click or scroll)

What the reader gets: the talk as you give it, with every animation and
transition, and the narration of the whole talk in a panel. The current part is
marked. Two ways to read, in one component:

- **click through**: the arrow keys move the slide, and the panel scrolls to
  the part;
- **scroll**: the reader scrolls the panel, and when it stops (180 ms), the
  slide goes to the part on the reading line. This is "scrollytelling", as on
  news sites, and close to reveal.js's scroll view.

Ways to make it:

| Way                                                                                 | Size               | Notes                                                                                   |
| ----------------------------------------------------------------------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| **a.** a global layer, active only with `?narration` on the play route (prototyped) | 239 lines with CSS | Uses public hooks and two element ids. One URL serves the talk and the narrated version |
| b. replace the play route's component in `setup/routes.ts` with a wrapper           | about the same     | Cleaner layout (no CSS on Slidev's ids); depends on the route's name, `play`            |
| c. a new route `/narrated/:no`                                                      | —                  | Does not work without a change to Slidev's `go()` (see the traps above)                 |
| d. a narration panel in Slidev's play view, upstream                                | a core PR          | Needs the maintainers to want it                                                        |

Measured on the prototype (`evidence/shoot.json`, `evidence/check_build.json`):
the panel shows the 12 parts; 3 wheel steps over the panel move the slide from
the cover to slide 2, click 1; the static build works; the presenter view shows
only the cues. Screenshots: `evidence/wide-slide2-click1.png` (the board
bounces live, with the panel at the right) and
`evidence/laptop-slide2-click2.png` (the board curls, with the panel below).

The layout, from `experiments/layout.py` (`evidence/layout.md`):

| Screen               | Panel at the right: slide scale, line length | Panel below: slide scale, line length |
| -------------------- | -------------------------------------------- | ------------------------------------- |
| 1920×1080 monitor    | **1.39**, 58 characters                      | 1.29, 218 characters                  |
| 1512×982 MacBook Pro | 1.05, 49 characters                          | **1.17**, 170 characters              |
| 1180×820 iPad        | 0.82, 36 characters                          | **0.98**, 130 characters              |
| 390×844 phone        | 0.07                                         | **0.40**, 38 characters               |

So the prototype's rule is right: the panel goes at the right when the screen
is at least 8:5, and below otherwise. Two fixes are needed. Below the slide,
the text needs a maximum line length (about 70 characters; a comfortable line
is about 45–75). On a portrait phone, the panel must take all the height under
the slide: the prototype wastes 340 px (`evidence/phone-slide3-click2.png`).

On a portrait phone, any form shows the slide at about 0.40 of its size, so
the house's 17 px floor becomes about 7 px. Slides made for a projector are
hard to read on a phone. No form here fixes that.

What is left to do: the two layout fixes; a "narration" button in the nav bar;
no smooth scroll when the reader asks for reduced motion; test touch scrolling
on a real iPad and phone (not done); a check in the addon's tests; docs. A
scroll that stops makes one browser-history entry; `router.replace` would avoid
that.

### F2. The article: every click as a still, with the narration between

What the reader gets: one long page to skim. For each part, the slide at that
part's click, then the part. Bartosz's layout, but with stills. It loads with
no WebGL (the watch draws stills, as in an export).

Ways to make it:

| Way                                                                                           | Size           | Notes                                                                         |
| --------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------- |
| **a.** a route, `/article`, that draws each figure with Slidev's print component (prototyped) | 116 + 17 lines | Text stays text (selectable, searchable on the page). Works in a static build |
| b. a static page from PNGs (see F4)                                                           | a script       | Works anywhere; text in the figures is pixels                                 |

Measured (`evidence/shoot.json`): 12 figures, loaded in 1.2 s from the dev
server, 6,348 px tall at 1280 px wide, no WebGL canvas. Screenshots:
`evidence/article-part0.png`, `evidence/article-part1.png`.

Length: 12 figures for 3 slides. If the talk has 20 slides with 4 parts each
(I do not know the final count), the article has about 80 figures and about
42,000 px of page: as many figures as Bartosz's page, with about a third of
its words. So the article needs a choice per slide: a figure for each part,
or one figure for the slide. A frontmatter key can choose.

Also to do: show the slide's title once, not on each figure; link each
figure to the narrated mode at that click (`/3?narration&clicks=2`), so that a
reader can see the animation there.

### F3. A PDF handout

| Way                                                                                  | Size                      | Notes                                                                     |
| ------------------------------------------------------------------------------------ | ------------------------- | ------------------------------------------------------------------------- |
| **a.** print the article (F2a) with Playwright (prototyped)                          | 10 lines of CSS, a script | 8 Letter pages, 274 KB (`evidence/article.pdf`, `evidence/pdf-pages.png`) |
| b. one page for each part: the slide in the top 70%, the narration in the bottom 30% | +0.5 day of CSS on F2a    | The layout in the request. More pages: about one for each part            |
| c. upstream's handout export, if PR #2278 is merged                                  | 0                         | It prints the notes, not the narration                                    |

Three things that the experiment found:

- In print mode, Slidev sets `@page` to the slide's size. The article sets its
  own `@page` (Letter, 0.5 in margins) after Slidev's.
- Slidev's export prints with screen styles (`emulateMedia({ media: "screen" })`).
  With print styles (and `transform`), every figure on the first four pages
  printed blank.
- With `transform: scale`, Chromium printed 2 of the 12 figures blank (each
  was the last figure on its page). CSS `zoom` printed all 12.

### F4. A static blog post: Markdown or HTML, with images and clips

What the reader gets: Simon Willison's format, on any blog. It needs no
JavaScript and no host for the deck.

| Way                                                                                              | Size   | Notes                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **a.** a script: screenshots of the article's figures, and each part's Markdown                  | 1 day  | One rule chooses the figures for F2, F3 and F4                                                                                                                     |
| b. a script: `slidev export --format png --with-clicks`, and the narration read from `slides.md` | 1 day  | Must match images (`NNN-CC.png`) to parts itself                                                                                                                   |
| c. Slidev's `--format md`, with the narration in the notes                                       | 0      | The images of a slide all come first, then all its text; and the cues become narration again                                                                       |
| clips for the parts where motion is the point                                                    | +1 day | Playwright records the live slide, ffmpeg encodes it. 10 s of slide 2 at 980×552: 217 KB as MP4, 247 KB as WebM (`evidence/clip.json`, `evidence/clip-frames.png`) |

At about 220 KB for each 10 s clip, 15 clips cost about 3.3 MB.

### F5. A Bartosz-style page: live figures inside the article

**2026-10-04:** the follow-up at the end of this plan prototyped and measured
this. One shared renderer works on the real watch, and the size below is now
about 1–1.5 days on top of F2. The text below is the first estimate.

What the reader gets: the article of F2, but each figure plays when it scrolls
into view, and its clicks step as you scroll.

| Way                                                                              | Notes                                                                                                                                                                                                               |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| a. every figure a live slide, with its own nav                                   | The watch is one WebGL stage for the page (`global-bottom.vue`). 80 live figures need 80 stages, or one shared renderer that draws into each canvas in view. Chromium allows about 16 live WebGL contexts on a page |
| b. one live slide that moves to the figure in view; the other figures are stills | One stage, as now. The live slide must track the figure's position as the page scrolls                                                                                                                              |
| c. write a real article, with figures made for it                                | Bartosz's way: a new work, not an export                                                                                                                                                                            |

Size: 3–6 days or more for a or b, most of it in the watches talk's code, and
I am not sure of it. The talk's transitions (the 4.1 s zoom from the cover)
have no meaning on a page that scrolls. F1's scroll mode gives most of the
same reading with one live slide, as in the talk.

### F6. Other forms

| Form                                                                                                 | Size                                 | Notes                                                                       |
| ---------------------------------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------------------------------- |
| A video of the talk (Slidev can record the screen and a camera)                                      | 0 code                               | 15–20 minutes to watch, and no skimming or search. Good with any other form |
| A self-running talk: a recorded audio part for each narration part; the slide steps when a part ends | 2–3 days after F1, and the recording | Needs F1. A recording of each part, or a synthetic voice                    |
| Captions: only the current part, as a line under the slide                                           | small, after F1                      | CSS on F1's panel                                                           |
| PowerPoint with the narration as speaker notes                                                       | small                                | Low value                                                                   |

Reading is faster than listening. A 15–20 minute talk at 130–150 words a
minute (a common estimate; I did not measure your rate) is about 2,000–3,000
words. At a silent reading rate of about 238 words a minute (Brysbaert 2019,
for non-fiction):

$$
\frac{2{,}000 \text{ to } 3{,}000 \text{ words}}{238 \text{ words/min}} \approx 8 \text{ to } 13 \text{ min}.
$$

The 3-slide sample has 391 words of narration. Slide 2 has 171 words: about
73 s when spoken at 140 words a minute.

## The watches talk: what the still forms need

**Update 2026-10-04, outside this task:** the watch's half of this fix is
done in the talk. `slide-bottom.vue` now draws the still at the page's click
(`$clicks`), `pnpm export` makes a page for each click, and `pnpm art:print`
(`watches/art/print_check.py`, run by `validate.py`) compares each printed
page's state with the live slide's. The board has a print pose too
(`watch/board.ts`: bent at click 1, half way through the curl at click 2). The
text below is the state when the task found the fault.

The baseline export, on the unchanged talk (`evidence/baseline-export-*`):

- At click 1 of slide 2, the hairspring's still shows through the diving
  board. The watch should be hidden (`watchHide: 1`).
- At click 2, the board is straight. It should be curling or curled.

Cause: `slide-bottom.vue` draws the still at click 0 for every click
(`watchState($frontmatter, 0)`), and the board has no print pose
(`docs/watch.md` says so). The fix is in the talk: draw the still at the
figure's click, and give the board a pose for each click. Size: 0.5–1 day,
with a check against the live slide. F2, F3 and F4 need it. F1 does not: it
is the live slide.

## Where the code lives

| Place                                                                                           | For                                                                                  | Against                                                                                |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| the talk (`watches/`)                                                                           | quickest                                                                             | each talk copies it                                                                    |
| **a house addon, `stem/addons/narration/`**, linked like the theme (`link:../addons/narration`) | one live copy; a talk's tag records the version it used (as for the theme)           | a new house item, with its own `package.json`; the root workspace must list `addons/*` |
| the theme (`themes/ledger/`)                                                                    | no new item                                                                          | mixes two concerns; a new theme would lose it                                          |
| an npm package, `slidev-addon-narration`                                                        | each talk pins its own version, which fits the per-talk rule best; others can use it | a release for each change                                                              |

Recommendation: the house addon first, then npm when it is stable. The
preparser imports `markdown-exit`. From `stem/addons/narration/`, Node cannot
find a talk's copy, so the addon declares it as its own dependency. The
prototype is inside the deck's directory only so that it finds the talk's
copy.

## Contributing upstream

| Option                                                                                            | Size                                | Chance                                                                                                |
| ------------------------------------------------------------------------------------------------- | ----------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **U1.** publish the addon on npm, and add it to the addon gallery                                 | 1–2 days after it works for 2 talks | High: needs no one's approval. A gallery PR is about 11 lines (#2723, merged)                         |
| U2. a small PR: `--format md --with-clicks` puts each `[click]` part of the notes after its image | 0.5–1 day                           | Fair: it fixes #530's intent; #531, the same size, was merged in 2 days. It uses notes, not narration |
| U3. help PR #2278 (handout), by testing and review                                                | hours                               | Unknown: open 13 months                                                                               |
| U4. a narration or scroll mode in Slidev's core                                                   | weeks, with design talks            | Low: two handout PRs show that large export features wait months to years                             |

## What I do not know

- How the panel behaves with touch scrolling on iOS Safari and Android. The
  tests used desktop Chromium and a mouse wheel.
- How the forms work in Firefox and Safari. Not tested.
- How fast the article loads with about 80 figures. Measured: 12 figures in
  1.2 s.
- Whether search engines index narration that the page renders with
  JavaScript. F4's static HTML has no such risk.
- Whether Slidev's side editor or the presenter's note editor keeps the
  narration comment. I expect it does, because the preparser does not change
  the content. Not tested.
- Whether Slidev's maintainers want a narration feature in the core. I found
  no discussion of it.
- The talk's final number of slides and parts.
- How long the estimates really take. They come from the prototype's size.
  The uncertain parts are the mobile tests and the print layout.

## Sizes

Estimates of focused days, with an assistant. "Done" says what the prototype
already does.

| Item                                                                                  | Days               | Done                                  |
| ------------------------------------------------------------------------------------- | ------------------ | ------------------------------------- |
| A1: the narration comment, the preparser, its tests, a check that the notes come last | 0.5                | the preparser                         |
| F1: the narrated mode, finished                                                       | 1.5–2              | both layouts, click and scroll, build |
| The watches talk: stills at each click, the board's poses                             | 0.5–1              | —                                     |
| F2: the article, finished                                                             | 1–1.5              | figures, narration, build             |
| F3: the PDF handout                                                                   | 0.25–0.75          | Letter, all figures print             |
| F4: the static blog post, without clips / with clips                                  | 1 / 2              | the clip recording                    |
| F5: live figures in the article (2026-10-04; was 3–6+)                                | 1–1.5 on top of F2 | one shared renderer, measured         |
| U1: the addon on npm                                                                  | 1–2                | —                                     |

## Ranking

| Rank | Option                           | Days                        | Parts shown faithfully (of 12) | Needs                                              | Why here                                                                         |
| ---- | -------------------------------- | --------------------------- | ------------------------------ | -------------------------------------------------- | -------------------------------------------------------------------------------- |
| 0    | A1: write the narration          | 0.5                         | —                              | —                                                  | Every form needs it; the text is also your rehearsal script                      |
| 1    | F1: the narrated mode            | 1.5–2                       | 12                             | a static host (one build serves the talk and this) | The only form that keeps the motion, which carries slide 2. Most of it works now |
| 2    | F2 + F3: the article and its PDF | 2–3 (with the talk's fixes) | 8 (12 with links to F1)        | the talk's still fixes                             | Skimming, printing, sending as a file. Cheap once A1 exists                      |
| 3    | F4: a static blog post           | 1–2                         | 8, or 12 with clips            | F2's figure rule                                   | Do it when there is a blog to post to                                            |
| 4    | U1: publish the addon            | 1–2                         | —                              | 2 talks of use                                     | Contribution with no approval needed                                             |
| 5    | F6: a video of the talk          | 0                           | 12, at the talk's pace         | a recording                                        | Free, and fits with any form; but slow to consume                                |
| 6    | F5: live figures in the article  | 3–6+                        | 12                             | work in the watch's code                           | The most work and the least sure; F1's scroll mode gives most of it              |

Why F1 before F2: on 4 of the 12 sample parts, the motion is the point, and
only F1 shows it without extra work. F1 also needs no fix in the talk's
stills, and a reader of F2 can follow a link to F1 for the motion.

**2026-10-04:** the follow-up moves F5 into F2: the web article gets live
figures, with one shared renderer (all 12 parts shown faithfully, for about
1–1.5 days more), and the stills stay for the PDF. See "How this changes the
plan" at the end.

## When to start

- **Now:** write the narration for each slide as you write the slide, in A1's
  form, and cut the notes to cues. This needs no tools. The narration is the
  full script you would rehearse anyway.
- **When the slides are stable, before the talk is given:** build F1 as a house
  addon (2–2.5 days with A1). It is inactive without `?narration`, so it
  does not change the talk. The talk's `validate.py` walks every slide and
  click, so it would find a break. Do not add it in the last week before the
  talk: the house rule on changes near a talk's date applies in spirit.
- **After the talk:** F2 and F3, then F4 if you post to a blog. Publish the
  addon (U1) after a second talk uses it.

## Decisions for you

1. **The frozen talk.** After you give a talk, `main` does not change it. If
   the narrated version is to come from the tag, the narration and the addon
   must be in the talk before you tag it. If you want to write or correct the
   narration after the talk (for example, from the recording, as Simon
   Willison does), then you need a rule for that: perhaps narration-only
   changes after the tag, with a second tag such as
   `published/watches/<date>`. I do not know which you prefer.
2. **The form of the narration**: A1 (the comment before the notes), or
   another from the table.
3. **Where it is hosted**: a static build works on Netlify (`_redirects`) and
   GitHub Pages (`404.html`); Slidev writes both files. Not chosen yet.

**Answered 2026-10-13** ([page-design.md](page-design.md), "The three
decisions of PLAN.md, answered"): 1. a talk is tagged when given, and does
not freeze (the house rule's new text is proposed, not applied); 2. A1, on
the condition that the narration does not show in the speaker notes; 3. not
chosen: keep as many hosting options open as practical.

## The experiments

All on Slidev 53.0.0, on a copy of the watches talk at commit `33a2920`
(`experiments/deck/`). `README.md` says how to run them again.

| #   | What                                                            | Result                                                                                                                                                 |
| --- | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| E1  | Slidev's `--format md`, with and without `--with-clicks`        | 4.3 s and 3.9 s; 3 and 12 PNGs. With clicks, a slide's images come first, then its whole note. Slide 2's stills are wrong at clicks 1 and 2            |
| E2  | The prototype addon, in the dev server                          | The preparser put 5 parts in slide 2's frontmatter, and left only the cues as the note. Both layouts work with the live WebGL watch and the board      |
| E3  | The scroll test                                                 | 3 wheel steps over the panel took the slide from the cover to slide 2, click 1. Slidev has no wheel handler of its own, so nothing else moved it       |
| E4  | The article, and its PDF                                        | 12 figures, 1.2 s, no WebGL; 8 Letter pages, 274 KB (the last page is blank). Blank figures until two fixes: screen styles, and `zoom` for `transform` |
| E5  | A static build                                                  | 2.9 s, 3.3 MB. The narrated mode, the article and the presenter's cues all work behind a static server with a fallback to `index.html`                 |
| E6  | A clip of slide 2's animation                                   | 10.1 s at 980×552: 217 KB MP4, 247 KB WebM                                                                                                             |
| E7  | Prettier, with the house's `.prettierrc`                        | The narration comments are unchanged                                                                                                                   |
| E8  | The layouts on ten screens (`experiments/layout.py`)            | The table in F1                                                                                                                                        |
| E9  | Live slides on one page (`experiments/embed.py`), 2026-10-04    | The table in the follow-up. Also run in software WebGL: `evidence/embed-swiftshader.json`                                                              |
| E10 | Where a frame's time goes (`experiments/frame_cost.py`)         | Live slide 3.8 ms; one shared renderer, 2 figures on the screen, 5.9 ms; a context for each figure 11.3 ms                                             |
| E11 | Two live figures, drawn two ways (`experiments/look_shared.py`) | The same pictures, at the right clicks (`evidence/live-figures-shared-vs-own-context.png`)                                                             |

One console error shows in every run: "Failed to patch FloatingVue". It was
there before the addon (E1, on the copy without it), so the addon does not
cause it.

## Follow-up (2026-10-04): live slides inside the article

### The question

Put the slides themselves on the article page, live, not images or clips: the
WebGL watch, the SVG board and all. Where Simon Willison has an image, the page
has the slide. Share what can be shared: the watch goes over the network once,
and is in memory once, however many figures show it. The request is in
`instructions.md`, "Follow-up".

This section replaces the estimate of F5 above.

### What there is to share

| What                                       | Size (measured)                                            | Shared by                                                     |
| ------------------------------------------ | ---------------------------------------------------------- | ------------------------------------------------------------- |
| the watch's design                         | 3.7 KB (`watch/design.json`, inside the JS bundle)         | the HTTP cache: once for the page, in every approach          |
| the code (Slidev, Vue, the talk)           | 1,421 KB over the network for one slide                    | the HTTP cache on the wire; but each _document_ runs it again |
| the watch's geometry, made by `generate()` | 78 ms in Node; 0.76 MB of typed arrays and 99,000 numbers  | one copy for each document                                    |
| the geometry on the GPU                    | 1.7 MB of static buffers for each WebGL context            | one copy for each WebGL context                               |
| WebGL contexts                             | Chrome and Safari keep 16 on a page (Chrome on Android: 8) | none: the 17th makes the oldest one lost                      |
| the diving board                           | a 640 KB SVG file                                          | the file once (HTTP cache); its DOM once for each figure      |

So "sent once" is free in every approach on one site. "In memory once" needs
one document. "On the GPU once" needs one WebGL context.

The context limits: 16 in WebKit's source (`maxActiveContexts`, and 4 in
workers); 16 on desktop Chrome and 8 on Android; Firefox about 300. Sources:
WebKit's `WebGLRenderingContextBase.cpp`;
<https://deephaven.io/core/plotly/docs/limitations/>;
<https://bugzilla.mozilla.org/show_bug.cgi?id=1748592>.

### Prior art: Bartosz's page has one WebGL context

His `watch.js` (327 KB) makes one `GLDrawer` for the whole page: one WebGL
canvas, which holds the meshes' buffers. Each of the 84 figures is a 2D canvas.
To draw a figure, the drawer draws it on the shared canvas, and the figure
copies the result: `ctx.drawImage(gl.finish(), 0, 0, width, height)`. An
`IntersectionObserver` (with a 100 px margin) stops the figures that are off
the screen. Labels and arrows are 2D drawing on top.

### The approaches

| #   | Approach                                                                                                                                                                                                                                           | Shares                                                                               | Changes                                                             | Status                  |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------- |
| L1  | **An iframe for each figure**, in Slidev's embedded mode: `<iframe src="/2?embedded=true&clicks=1">`                                                                                                                                               | the network bytes only                                                               | none                                                                | measured                |
| L2  | **An iframe for each slide**, stepped by the page through Slidev's `postMessage` API (`{target: "slidev", type: "navigate", no, clicks}`), and loaded only near the screen: an `IntersectionObserver` sets and clears `src`, and a still stands in | the network bytes; memory and contexts bounded by the 2–4 frames near the screen     | 50–100 lines in the article page; none in the talk                  | not built               |
| L3  | **One document, a live slide for each figure**: the article without print mode                                                                                                                                                                     | the code, and the watch's geometry in JS                                             | none: the prototype's `/article-live`                               | measured                |
| L4  | **One document, one shared renderer** (Bartosz's way): one hidden WebGL renderer draws each figure that is near the screen, and the figure copies the picture                                                                                      | all of it: the code, the geometry in JS, the GPU buffers, one context                | 119 new lines (`webgl/shared.ts`), 34 in the talk, 6 in the article | prototyped and measured |
| L5  | **One roving live slide**: the play view itself moves into the figure nearest the middle of the screen; the other figures are stills                                                                                                               | all of it: it is the talk's one live view                                            | the article page, and the talk's still fixes                        | not built               |
| L6  | **Iframes that share one renderer**: through the parent page (same site), or through a worker that owns the one context (`OffscreenCanvas`) and sends each figure its frames                                                                       | the GPU copy, and through the parent the geometry; each slide keeps its own document | the most of all                                                     | not built               |
| L7  | **A web component** (`<watch-view view="hairspring">`): the talk's `watch/` and `webgl/`, built as a library, for a page that is not the deck                                                                                                      | as L4, on any page that may run scripts                                              | a separate library build                                            | not built               |

### The measurements

On the experiment deck's static build, in Chromium's new headless mode with
the GPU (Apple M3 Pro, Metal), 1280 × 900, after a garbage collection
(`experiments/embed.py`, `evidence/embed.json`). "Ready": until the count of
drawn slides holds for 1 s.

| Layout                              | Figures  | Ready  | JS heap  | WebGL contexts | GPU, static | Script per frame | Frames/s |
| ----------------------------------- | -------- | ------ | -------- | -------------- | ----------- | ---------------- | -------- |
| one slide, play mode¹               | 1        | 0.16 s | 6.7 MB   | 1              | 1.7 MB      | 0.28 ms          | 60       |
| L1: 12 iframes                      | 12       | 1.68 s | 56.5 MB  | 12             | 20.3 MB     | 11.0 ms          | 60       |
| L1: 24 iframes                      | 24       | 5.61 s | 106.4 MB | 24, **8 lost** | 40.6 MB     | 19.5 ms          | 48       |
| L1: 12 iframes, `loading="lazy"`    | 7 loaded | 1.02 s | 35.7 MB  | 7              | 11.8 MB     | 11.0 ms          | 60       |
| L3: 12 live figures                 | 12       | 0.40 s | 10.5 MB  | 12             | 20.3 MB     | 10.9 ms          | 60       |
| L3: 24 live figures                 | 24       | 0.66 s | 12.2 MB  | 24, **8 lost** | 40.6 MB     | 19.6 ms          | 50       |
| **L4: 12 figures, one renderer**    | 12       | 0.17 s | 7.5 MB   | **1**          | **1.7 MB**  | 6.4 ms           | 60       |
| **L4: 24 figures, one renderer**    | 24       | 0.17 s | 8.2 MB   | **1**          | **1.7 MB**  | 6.7 ms           | 60       |
| 12 stills, print mode (the article) | 12       | 0.17 s | 7.0 MB   | 1              | 1.7 MB      | 1.1 ms           | 60       |

¹ For comparison: slide 2 at click 1, where the board swings and the watch is
hidden. With the watch swinging, the live slide's frame callbacks cost 3.8 ms
(below).

Every layout moved 1.40–1.52 MB over the network: the HTTP cache shares the
bytes. The iframes made 399 and 854 requests (one document: 34–39), and the
cache or a revalidation answered most of them.

What the numbers say:

- **An iframe costs about 4.2 MB of JS heap**, its own context and its own
  1.7 MB on the GPU: $(56.5 - 6.7)/12 \approx 4.15$ MB, and the same for 24.
  Each iframe is a whole Slidev app. It runs `generate()` again, draws its
  neighbouring slides too (12 iframes drew 36 slides), and preloads every
  slide of the deck after 3 s. `loading="lazy"` saves little: Chrome loaded 7
  of the 12 frames at once, and it never unloads a frame.
- **One document cuts the heap by about 5×** (10.5 MB against 56.5 MB for 12
  figures), but not the GPU. Each figure keeps its own context and its own
  1.7 MB of buffers, and they all draw at every frame, even off the screen.
  Each figure's layer takes a context, with the watch or without it, so with
  more than 16 figures the page loses contexts (8 lost of 24).
- **One shared renderer keeps one of everything.** 24 figures cost the same as
  12, plus 0.7 MB of heap for their DOM. It draws only the figures near the
  screen: 2 here, for 5.9 ms of frame callbacks, so about 3 ms each. The watch
  on the live slide costs 3.8 ms. The copy (`drawImage`) costs 0.03 ms a
  figure. With a context for each figure, the same page costs 11.3 ms
  (`experiments/frame_cost.py`, `evidence/frame_cost.json`).
- **Live figures are drawn at their own click**, so they do not have the
  stills' errors on slide 2: at click 1 the board swings and the watch is
  hidden (`evidence/live-figures-shared-vs-own-context.png`: one renderer on
  the left, a context each on the right).
- **Without a GPU it is slow.** The old headless shell draws WebGL in software
  (SwiftShader). There, every live layout ran at 5–6 frames a second, and the
  stills at 60 (`evidence/embed-swiftshader.json`). A reader whose browser has
  no GPU gets that. I do not know how many readers that is.

### The SVG board

In one document the file comes once. But each figure that shows the board
parses its own 640 KB of path data, and runs its own SMIL clock: 2 of the 12
figures. One `<symbol>` with a `<use>` in each figure would share the parse,
but `<use>` copies share one clock, and the component sets each board's time
on its own. I did not measure the board's memory alone. With L4's rule (draw
only near the screen) applied to the board as well, 1–2 boards run at a time.

### What L4 still needs

- **Stepping through clicks.** The prototype draws each figure at one click.
  The article could drive a figure's clicks from the narration on the reading
  line, as the narrated mode does; the view's timeline then moves the camera
  as in the talk. Then one figure per slide may be enough.
- **A shared key.** The talk's layer knows that it draws a figure through an
  injection, `narration:figure`, that the addon provides. A real version
  exports the key from the addon.
- **Off the screen, a view stops.** When it comes back, its model jumps to
  the present time. For a swing that never damps, nobody can see it.
- **Context loss**: with one context, all figures go blank together until the
  browser restores it (the renderer restores itself; not tested).
- **Size:** about 1–1.5 days on top of F2: tests for `shared.ts` like those
  of `stage.ts`, the click stepping, and the docs (`watches/docs/watch.md`,
  `../../docs/webgl.md`).

### Embedding outside the deck

Only an iframe (L1, L2) puts a live slide into someone else's page with no
build for that page. Each iframe then pays the full cost above, and L2 keeps it
to the 2–4 frames near the screen. A web component (L7) costs one library
build. Many hosted blog platforms allow no scripts or no iframes. I have not
checked them one by one. The deck's own static site has no such limit.

### Ranking for this question

| Rank | Approach                                           | Sent once | In memory once     | On the GPU once           | Talk code       | Size                                      |
| ---- | -------------------------------------------------- | --------- | ------------------ | ------------------------- | --------------- | ----------------------------------------- |
| 1    | L4: one shared renderer, in the deck's article     | yes       | yes                | yes                       | 34 + 119 lines  | 1–1.5 days on top of F2                   |
| 2    | L2: an iframe for each slide, near the screen only | yes       | no (2–4 copies)    | no (2–4 contexts)         | none            | 0.5–1 day                                 |
| 3    | L3: a live slide for each figure                   | yes       | yes                | no; fails past 16 figures | none            | 0: the prototype                          |
| 4    | L5: one roving live slide                          | yes       | yes                | yes                       | the still fixes | 1–2 days; I do not know how smooth        |
| 5    | L1: an iframe for each figure                      | yes       | no (4.2 MB each)   | no; fails past 16         | none            | 0                                         |
| 6    | L6: iframes that share one renderer                | yes       | through the parent | yes                       | the most        | 2–4 days; I am not sure                   |
| 7    | L7: a web component                                | yes       | yes                | yes                       | a library build | 1–2 days; only for pages outside the deck |

**L4 first**: it is the only approach that meets all three goals. The
prototype runs on the real watch, and costs what the live slide costs for each
figure on the screen. Bartosz runs the same design with 84 figures. **L2 is
the fallback** when the slides must go into someone else's page. L3 is L4
without the sharing, and works for a short talk with up to 16 figures.

### How this changes the plan

- F5's size goes from "3–6 days or more, not sure" to about 1–1.5 days on top
  of F2.
- The web article (F2) should have live figures (L4). They need no fix to the
  talk's stills, and they show the motion: all 12 sample parts, not 8. The
  stills (print mode) stay for the PDF (F3).
- The order becomes: A1, F1, F2 with live figures, F3 (with the still fixes),
  F4.

## Follow-up (2026-10-13): the page is the goal

The user reopened the task to make the Bartosz-style page (F5) from the
talk. The design is in [page-design.md](page-design.md): what a reader needs,
what to keep, drop and replace (the flash and the zooms), the options to link
a word to a part, which clicks become figures, the page slide by slide for
Part 1, the author's interface, the hosting constraints, and the strategy.
In short: one steady focus in each figure in place of the flash; figures that
hold the picture and its labels; the end of each build-up as the default
figure; markers in the narration to override it; and the deck's own build
with a prerender (S1+P). The user agreed the same day, and the article was
built in the watches talk (`page-design.md`, "Decisions (2026-10-13)").
