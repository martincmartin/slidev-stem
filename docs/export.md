# Exporting a talk for people who did not see it

**Covers:** the forms of a talk for readers (the article, a narrated mode, a
PDF, a blog post, a video), which exist, the rules that hold for any talk,
and the traps that you meet if you build one. True for any talk.
**Read before** you export a talk (PDF, images, a web page for readers), write
a talk's narration, write or rewrite a slide's speaker notes, or plan a
version of a talk for readers.
**Tasks:**
[`tasks/2026-10-03-narrated-export/`](../tasks/2026-10-03-narrated-export/README.md)
(the forms, the prototype and its measurements; the article's design in
`page-design.md`).

## Why

The best slides are pictures and a few words. They do not stand alone, and the
speaker notes are cues, not text. So slides plus notes are not worth sending to
a person who did not see the talk. A form for readers shows the narration (the
full text, written for readers) with the slides.

## What exists

- **The article** (the watches talk, 2026-10-13): one long page, `/article`,
  with the narration and the slides as live figures between the paragraphs,
  in the style of Bartosz Ciechanowski's "Mechanical Watch". A Slidev addon
  makes it, with a static page of the same text and stills for readers with
  no JavaScript, for search engines and for keeping as files. How it works
  and how to write for it: [`watches/docs/article.md`](../watches/docs/article.md).
- Slidev's own exports: a PDF, PNG images, and `--format md`. They have no
  narration. Without `--with-clicks`, a slide is one page at its last click.
  With it, a slide is one page for each click, and in `--format md` a slide's
  images come first and then its whole note.
- **A click and a slide are the same to the audience**, so an export shows one
  page for each click. `pnpm export` in the watches talk uses `--with-clicks`.
- In the watches talk, a still of the watch follows the click of its page
  (`pnpm art:print` checks it), and so does the diving board's pose
  ([`watches/docs/watch.md`](../watches/docs/watch.md)). Full validation runs
  that check only after a change to a print input, so run
  `uv run ../tools/validate.py --print` in the talk before you export it
  ([`talks.md`](talks.md#the-print-check)).

Not built: a narrated mode (the live slide, with its narration in a panel), a
PDF of the article, a blog post with stills and clips, and a video with a
voice that reads the narration. The task's `PLAN.md` has their sizes.

## Rules that hold now

- **The narration is a comment before the speaker notes**: `<!-- narration ...
-->`, with the notes' `[click]` markers. So the narration shows neither in the
  presenter view nor on the slide (the `slidev-practices` skill, "Speaker
  notes"). The notes become cues for the speaker.
- **A given talk can still change.** Its tag keeps the version that you gave;
  the narration and the page can improve after the talk
  ([`../AGENTS.md`](../AGENTS.md), "Given talks, retired talks and versions").
- **A figure does not flash: it marks.** A flash points at a part at the moment
  that the speaker names it. A reader's eyes are on the words, at a moment
  that nobody knows. So a figure draws the part in the flash's colours for as
  long as it shows, and the text names it in italics where it first comes.
  Not an oversight: coloured part names do not fit the house look (one accent
  on a slide; one "look here" colour in the art, [theme.md](theme.md)).
- **A figure has one fixed camera.** The zooms between slides do not carry to
  a page. A figure with steps moves its camera when the reader steps it.
- **A story animation is the reader's to play**, with a slider or a step, not a
  loop: a loop pulls the eye from the text.
- **A page with many live figures shares one renderer.** A browser keeps 16
  WebGL contexts for a page (Chrome and Safari; Firefox about 300). The 17th
  makes the oldest one blank. So never give each figure its own context.
- **Keep the hosting open**: relative paths or Slidev's `--base`, no server
  rewrite rules, no outside requests, and a still and alt text for each
  figure.
- **Use no separate route for a mode of the slides.** Use a query flag
  (`?narration`) instead (the `slidev-practices` skill, "Routes"). A page that
  is not a slide (the article) can have its own route.
- **A relative addon path starts at the parent of the talk's directory.**
  `addons: [./addons/narration]` in `watches/slides.md` looks in `stem/`. Use
  `@/addons/narration` or a package name.
- **A still follows the click of its page.** See
  [webgl.md](webgl.md), "Mistakes that were made once".
- **The addon uses some Slidev internals** (`PrintSlideClick`, `useFixedNav`,
  `createFixedClicks`). They changed 1–10 times in two years. Each talk pins
  its own Slidev, so an upgrade breaks nothing until a talk chooses it.

## Where the facts are

The options, the measurements, the prior art (Simon Willison's annotated
talks, reveal.js, Bartosz's page, Slidev's open issues) and the experiments are
in
[`tasks/2026-10-03-narrated-export/PLAN.md`](../tasks/2026-10-03-narrated-export/PLAN.md)
and its `page-design.md`.
