# What Every Nerd Should Know About Watches

A [Slidev](https://github.com/slidevjs/slidev) deck for a monthly STEM meetup:
15–20 minutes, weekday evening, back room of a bar.

```bash
pnpm install      # here; it installs the repo root's packages first. pnpm, not npm
pnpm dev          # http://localhost:3030
pnpm export       # a PDF of the deck
pnpm format       # prettier; run after editing any file
```

You need pnpm and uv; see [`../docs/talks.md`](../docs/talks.md), "Set up a
clone".

Edit [slides.md](slides.md). The look comes from the house theme, Ledger, in
[`../themes/ledger/`](../themes/ledger/), which every STEM talk shares.

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
# here, before a commit
uv run ../tools/validate.py                 # every check of this talk
```

[`../tools/`](../tools/README.md) holds the checks that settle "is this good
enough?" with arithmetic. They are stdlib-only unless they need to render. The ones that render install
Chromium the first time they run.

## Decisions

[`../docs/README.md`](../docs/README.md) lists the decisions behind the palette
and the illustrations, each with a link to the task directory that records why.
It also explains why `docs/` and `tasks/` are separate, and why their tools are
deliberately duplicated rather than shared.
