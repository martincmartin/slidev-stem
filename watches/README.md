# What Every Nerd Should Know About Watches

A [Slidev](https://github.com/slidevjs/slidev) deck for a monthly STEM meetup:
15–20 minutes, weekday evening, back room of a bar.

```bash
pnpm install      # run at the repo root (stem/); pnpm, not npm — see ../AGENTS.md
pnpm dev          # http://localhost:3030
pnpm format       # prettier; run after editing any file
```

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
python3 tools/artcheck.py         # every illustration: structure, style, legibility
python3 tools/palette.py          # the palette still passes its own gates
```

[`../tools/`](../tools/README.md) holds the checks that settle "is this good
enough?" with arithmetic. They are stdlib-only unless they need to render.

## Decisions

[`../docs/README.md`](../docs/README.md) lists the decisions behind the palette
and the illustrations, each with a link to the task directory that records why.
It also explains why `docs/` and `tasks/` are separate, and why their tools are
deliberately duplicated rather than shared.
