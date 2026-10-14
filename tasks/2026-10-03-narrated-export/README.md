# Narrated export: the files, and how to run the experiments

`PLAN.md` holds the options, the measurements and the ranking.
`page-design.md` holds the design of the Bartosz-style page (2026-10-13).
`instructions.md` holds the request (and the follow-ups of 2026-10-04 and
2026-10-13). The house doc that summarises the plan is
[`docs/export.md`](../../docs/export.md).

## Resume here

**Status (2026-10-13): the article is built, in the watches talk.** The user
chose the design (`page-design.md`, "Decisions (2026-10-13)"), and the
article, its static page and Part 1's draft narration are in the talk. Its
rules are in [`watches/docs/article.md`](../../watches/docs/article.md),
which also lists what is not done yet. Next: the user reworks the narration
over a few slides, and may change the marks (M1) and the italics (T1).

- 2026-10-13: moved to the project: the article (`watches/addons/narration/`
  and the talk's figure layer), the narration of Part 1, and the house rule
  that a talk freezes when it is retired, not when it is given (`AGENTS.md`).

The rest of this section is the state of 2026-10-04.

**Status (2026-10-04): paused, planning finished, prototype works.** The task
stays open. Start again when the talk's slides are stable. Nothing in the talk
or the house uses the prototype: it lives only in `experiments/`. Nothing in
this task is committed yet.

**What was decided.** Slidev does not have to change: an addon does all of it.
The narration goes in a `<!-- narration -->` comment before the speaker notes,
and the notes become cues. The build order is: write the narration, the
narrated mode, the article with live figures (one shared renderer), the PDF,
then a static blog post. The code goes in a house addon, `stem/addons/narration/`.
Why, with the numbers: `PLAN.md`, "The answer in short", "Ranking", and the end
of the follow-up.

**What is still open** (`PLAN.md`, "Decisions for you" and "What I do not know"):

1. The frozen-talk rule: how to change the narration after you tag a talk.
2. The form of the narration (the comment is a proposal).
3. Where to host the web forms (Netlify or GitHub Pages; both work).
4. Not tested: touch scrolling on iOS and Android, Firefox, Safari, the
   article with about 80 figures, search-engine indexing, a lost WebGL context
   with one shared context, a reader with no GPU (5–6 frames a second in
   software GL).

**Steps, in order.**

1. Read `PLAN.md`: "The answer in short", "Ranking", "When to start", and the
   follow-up's "What L4 still needs". Read the house docs that the build
   touches: `docs/export.md`, `docs/webgl.md`, `watches/docs/watch.md`.
2. Check what changed since commit `33a2920`: the Slidev version, the
   watch's files (`watch/instance.ts`, `global-bottom.vue`,
   `slide-bottom.vue`), and the number of slides and clicks. Slidev's
   internals that the addon uses are listed in `PLAN.md`, "What an addon can
   use in Slidev 53". The deck in `experiments/deck/` is a frozen copy; do
   not update it. Make a new copy for any new experiment.
3. Decide the three open items above.
4. Write the narration, slide by slide, and cut the notes to cues.
5. Move the addon from `experiments/deck/addons/narration/` to
   `stem/addons/narration/`. Its preparser imports `markdown-exit`, which Node
   cannot find from there (`PLAN.md`, "Where the code lives"): fix this first.
   Add tests for the preparser and for `webgl/shared.ts`, and add the
   addon's docs to `docs/export.md`.
6. Finish the narrated mode (about 1.5–2 days), then the article and its
   live figures (about 2–3 days), then the PDF. The watch's still and the
   diving board's print pose already follow the click (2026-10-04).
7. Add a dated line here that says what moved to the project.

**Traps** (also in `docs/export.md`): no separate route for the narrated mode
(use `?narration`); an addon path starts at the parent of the talk's directory
(use `@/addons/narration`); a browser keeps 16 WebGL contexts; the speaker
note is the last HTML comment on a slide.

**Experiment traps.** The old headless Chromium uses software GL, so use
`channel="chromium"` with `--enable-gpu --use-angle=metal --ignore-gpu-blocklist`
for any timing (`embed.py` has the flags). `embed.py` takes about 10 minutes.
A background wait loop that uses `pgrep -f` on its own script name never ends.
The measurements are from an Apple M3 Pro; run them again on another machine
before you trust a number.

## What is here

| Path                                 | What it holds                                                                                                                                                                                                                                                                                                            |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `experiments/deck/`                  | a copy of the watches talk at commit `33a2920` (slides, components, `watch/`, `webgl/`, `public/`), without its tests. Changes: the headmatter loads the addon; each slide has narration and short cues; the follow-up's shared renderer (`webgl/shared.ts`, and its use in `global-bottom.vue` and `watch/instance.ts`) |
| `experiments/deck/addons/narration/` | the prototype addon: `setup/preparser.ts`, `global-top.vue` (the narrated mode), `setup/routes.ts` and `views/ArticlePage.vue` (the article, and `/article-live` for the follow-up), `narration.ts`                                                                                                                      |
| `experiments/shoot.py`               | screenshots of the narrated mode and the article, the scroll test, the article's PDF                                                                                                                                                                                                                                     |
| `experiments/check_build.py`         | the narrated mode, the article and the presenter view in a static build                                                                                                                                                                                                                                                  |
| `experiments/clip.py`                | a video clip of slide 2's animation, encoded as MP4 and WebM                                                                                                                                                                                                                                                             |
| `experiments/layout.py`              | the narrated mode's two layouts on ten screen sizes (no browser)                                                                                                                                                                                                                                                         |
| `experiments/embed.py`               | the follow-up: live slides on one page (iframes, one document, one shared renderer), measured                                                                                                                                                                                                                            |
| `experiments/serve.py`               | the static host that `check_build.py` and `embed.py` use                                                                                                                                                                                                                                                                 |
| `experiments/page/`                  | 2026-10-13: the built article, checked: screenshots of its screens and figures (`shoot_article.py`), its sliders (`slider.py`), the three engines (`engines.py`), and a contact sheet of many screenshots (`contact_sheet.py`). Run them against `pnpm dev` |
| `experiments/bartosz.py`             | 2026-10-13: measures Bartosz's "Mechanical Watch" page from its HTML (words, figures, sliders, coloured names, words between figures). Its output is `evidence/bartosz.json`; the page itself is not kept here                                                                                                          |
| `evidence/`                          | the outputs that `PLAN.md` cites                                                                                                                                                                                                                                                                                         |
| `out/`                               | everything the scripts write (git-ignored; run them again to remake it)                                                                                                                                                                                                                                                  |

## Run the experiments

The deck uses the talk's packages through a symlink, which git ignores. Make it
once, in this directory:

```bash
ln -s ../../../../watches/node_modules experiments/deck/node_modules
```

The symlink works only while `watches/` has the packages of commit `33a2920`
(Slidev 53.0.0). For a later talk, make a worktree at that commit and run
`pnpm install --frozen-lockfile` in its `watches/`, then point the symlink there.

Run Slidev from the talk's directory, so that pnpm uses the talk's pinned Node.
`experiments/deck/vite.config.ts` keeps Vite's cache in this directory.

```bash
TASK=$PWD
cd ../../watches
pnpm exec slidev $TASK/experiments/deck/slides.md --port 3131 --open false   # dev server
pnpm exec slidev export $TASK/experiments/deck/slides.md --format md --with-clicks --output $TASK/out/e1-baseline/md-clicks/slides.md
pnpm exec slidev build $TASK/experiments/deck/slides.md --out $TASK/out/build
```

Then, in this directory, with the dev server running:

```bash
uv run --project ../.. experiments/shoot.py http://localhost:3131 out/shots
uv run --project ../.. experiments/clip.py http://localhost:3131 out/clip
uv run --project ../.. experiments/check_build.py out/build
uv run --project ../.. experiments/embed.py out/build > out/embed.json   # about 10 minutes
python3 experiments/layout.py
```

The narrated mode is at `http://localhost:3131/1?narration`, and the article at
`http://localhost:3131/article`. The article with live figures is at
`/article-live`, and with one shared renderer at `/article-live?shared`.
`check_build.py` and `embed.py` need the build, not the dev server.
