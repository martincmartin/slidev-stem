# What Every Nerd Should Know About Watches

A [Slidev](https://github.com/slidevjs/slidev) deck for a monthly STEM meetup:
15–20 minutes, weekday evening, back room of a bar.

```bash
pnpm install      # pnpm, not npm — see AGENTS.md
pnpm dev          # http://localhost:3030
pnpm format       # prettier; run after editing any file
```

Edit [slides.md](slides.md).

## Making new slides

**Read [`docs/`](docs/README.md).** It is the whole framework — the palette, the
drawing style, the legibility thresholds and the slide patterns — and it is
self-contained: building new content should never require opening `tasks/`.

```bash
python3 tools/artcheck.py         # every illustration: structure, style, legibility
python3 tools/palette.py          # the palette still passes its own gates
```

[`tools/`](tools/README.md) holds the checks that settle "is this good enough?"
with arithmetic. They are stdlib-only unless they need to render.

## Where the decisions came from

Two questions were settled at length. Each left an archive under `tasks/` holding
the alternatives, the measurements and a renderable deck of its own. **Open these
to re-open a decision, not to make a slide.**

| archive                                                                  | question                            | answer                      |
| ------------------------------------------------------------------------ | ----------------------------------- | --------------------------- |
| [`tasks/2026-09-18-theme-colors/`](tasks/2026-09-18-theme-colors/)       | what colours does the deck use      | **Ledger**                  |
| [`tasks/2026-09-20-animation-style/`](tasks/2026-09-20-animation-style/) | what do the illustrations look like | **set 2, "Line, weighted"** |

```bash
npx slidev tasks/2026-09-18-theme-colors/deck/slides.md      # 23 candidate palettes
npx slidev tasks/2026-09-20-animation-style/deck/slides.md   # 16 drawing sets
```

[`docs/README.md`](docs/README.md) explains why `docs/` and `tasks/` are separate
and why their tools are deliberately duplicated rather than shared.
