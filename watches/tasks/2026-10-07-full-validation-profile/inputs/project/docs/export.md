# Exporting a talk for people who did not see it

**Covers:** the forms of a talk for readers (a narrated mode, an article, a
PDF, live figures on one page), what exists today, the plan, and the traps
that you meet if you build or prepare for one. True for any talk.
**Read before** you export a talk (PDF, images, a web build for readers),
write or rewrite a slide's speaker notes, or plan a version of a talk for
readers.
**Tasks:**
[`tasks/2026-10-03-narrated-export/`](../tasks/2026-10-03-narrated-export/README.md)
(open, paused: start from its README, "Resume here").

**Status: planned, not built.** There is no house addon yet. The task has a
working prototype, and every number below is from it. Nobody has chosen the
form of the narration, so no talk has narration yet. Wait until the talk's
slides are stable before you build anything.

## Why

The best slides are pictures and a few words. They do not stand alone, and the
speaker notes are cues, not text. So slides plus notes are not worth sending to
a person who did not see the talk. The goal is a form of the talk that shows
the narration (the full spoken text) with the slides.

## What exists today

- Slidev's own exports: a PDF, PNG images, and `--format md`. They have no
  narration. Without `--with-clicks`, a slide is one page at its last click.
  With it, a slide is one page for each click, and in `--format md` a slide's
  images come first and then its whole note.
- **A click and a slide are the same to the audience**, so an export shows one
  page for each click. `pnpm export` in the watches talk uses `--with-clicks`.
- In the watches talk, a still of the watch follows the click of its page
  (`pnpm art:print` checks it), and so does the diving board's pose
  ([`watches/docs/watch.md`](../watches/docs/watch.md)).

## The plan (a proposal, not a rule)

**Narration goes in a comment**, `<!-- narration ... -->`, before the speaker
notes. It uses the same `[click]` markers as the notes. The notes then become
short cues, and the presenter view shows only the cues. Slidev does not have to
change: an addon does everything.

**Forms, in the order to build them.** The sizes are estimates in focused days
with an assistant, from a prototype of 447 lines.

| Order | Form                                                                        | Days      | Keeps the motion                |
| ----- | --------------------------------------------------------------------------- | --------- | ------------------------------- |
| 0     | write the narration, slide by slide                                         | 0.5       | —                               |
| 1     | the narrated mode: the live slide, with its narration beside it or below it | 1.5–2     | yes                             |
| 2     | the article: one long page, each slide at each click, the narration between | 1–1.5     | yes, with live figures (+1–1.5) |
| 3     | a PDF handout: the article, printed                                         | 0.25–0.75 | no (stills)                     |
| 4     | a static blog post (Markdown or HTML with images)                           | 1–2       | only with video clips           |

The code belongs in a house addon, `stem/addons/narration/`. Publish it on npm
only after two talks use it.

**Live figures on one page.** To put the live slides (the WebGL watch, the SVG
boards) in the article, use one shared renderer: one WebGL context draws every
figure, and each figure copies the picture into its own 2D canvas. Bartosz
Ciechanowski's "Mechanical Watch" page does the same. Measured with 12 figures
on a GPU: 7.5 MB of JavaScript memory, 1 context and 1.7 MB of GPU buffers. An
iframe for each figure used 56.5 MB, 12 contexts and 20.3 MB.

## Rules that hold now

- **A frozen talk stays frozen.** If the narrated version is to come from a
  talk's tag, the narration and the addon must be in the talk before you tag
  it ([`../AGENTS.md`](../AGENTS.md), "Given talks and versions"). A rule for
  narration-only changes after the tag does not exist yet.
- **The speaker note is the last HTML comment on a slide.** A narration
  comment must come before it.
- **Use no separate route for the narrated mode.** Slidev's `go()` always makes
  a play, presenter or export path, so a page at `/narrated/3` returns to `/4`
  at the first key press. Use a query flag (`?narration`): `go()` keeps it.
- **A relative addon path starts at the parent of the talk's directory.**
  `addons: [./addons/narration]` in `watches/slides.md` looks in `stem/`. Use
  `@/addons/narration` or a package name.
- **A browser keeps 16 WebGL contexts for a page** (Chrome and Safari; Firefox
  about 300). The 17th makes the oldest one blank. So never give each figure
  its own context: share one renderer.
- **A still follows the click of its page.** See
  [webgl.md](webgl.md), "Mistakes that were made once". The narrated forms
  use the same stills.
- **The addon uses some Slidev internals** (`PrintSlideClick`, `useFixedNav`,
  `createFixedClicks`). They changed 1–10 times in two years. Each talk pins
  its own Slidev, so an upgrade breaks nothing until a talk chooses it.

## Where the facts are

The options, the measurements, the prior art (Simon Willison's annotated
talks, reveal.js, Slidev's open issues) and the experiments are in
[`tasks/2026-10-03-narrated-export/PLAN.md`](../tasks/2026-10-03-narrated-export/PLAN.md).
