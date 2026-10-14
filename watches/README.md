# What Every Nerd Should Know About Watches

A [Slidev](https://github.com/slidevjs/slidev) deck for a monthly STEM meetup:
15–20 minutes, weekday evening, back room of a bar.

```bash
pnpm install      # here; it installs the repo root's packages first. pnpm, not npm
pnpm dev          # http://localhost:3030
pnpm export       # a PDF of the deck: a page for each click (the watch is a still on each page)
pnpm format       # prettier; run after editing any file
pnpm typecheck    # vue-tsc, strict
pnpm lint         # ESLint, typescript-eslint strict
pnpm test         # node --test: the geometry and the balance's settle
pnpm art:scene    # the watch's scene as JSON, for tools/scenecheck.py
pnpm art:stills DIR   # PNG stills of the watch, for barroom.py and motion.py
pnpm art:print DECK   # DECK: a built deck; each printed page's watch against the live slide's
```

You need pnpm and uv; see [`../docs/talks.md`](../docs/talks.md), "Set up a
clone".

Edit [slides.md](slides.md). The watch under the cover and the Hairspring slide is drawn
live in WebGL: [`../docs/webgl.md`](../docs/webgl.md) says how it is built. The look comes from the house theme,
[`../themes/house/`](../themes/house/), which every STEM talk shares, and
its colours from a palette, now Ledger
([`../themes/palettes/ledger/`](../themes/palettes/ledger/)).

## Making new slides

**Read [`../docs/`](../docs/README.md)**, the house style for every STEM talk: the
palette, the drawing style and the legibility thresholds. This talk's own
[`docs/`](docs/README.md) has its slide patterns, its outline and the
measurements of its drawings. Building new content should never require opening
`tasks/`.

```bash
# in stem/
uv run tools/artcheck.py watches/public/    # every illustration: structure, style, legibility
uv run tools/palette.py                     # the palette still passes its own gates
# here; use quick mode for routine feedback
uv run ../tools/validate.py                 # full mode; see the validation policy below
uv run ../tools/validate.py --quick         # source, generated files, and build
uv run ../tools/validate.py --jobs 1        # full validation with serial preparation
uv run ../tools/validate.py --json          # results and elapsed times as JSON
```

The [validation policy](../AGENTS.md#validate-before-you-commit) applies to this talk.
During work, run full mode only after changes that could affect its results.
Before a commit, require a successful full run.
If the talk and its relevant inputs are unchanged since that run, reuse it.

[`../tools/`](../tools/README.md) holds the checks that settle "is this good
enough?" with arithmetic. They are stdlib-only unless they need to render. The ones that render install
Chromium the first time they run.

## Decisions

Each doc links the task directories that record why its rules are what they
are. This talk's tasks are in [`tasks/`](tasks/); the house's are in
[`../tasks/`](../tasks/).
