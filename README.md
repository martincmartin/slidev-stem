# STEM talks

Slide decks for a monthly STEM meetup around Cambridge and Somerville, MA:
15–20 minute talks for curious non-specialists, in the back room of a bar. Each
deck is a [Slidev](https://sli.dev) project.

| Talk                                      | Directory              |
| ----------------------------------------- | ---------------------- |
| What Every Nerd Should Know About Watches | [`watches/`](watches/) |

## Run a talk

You need [pnpm](https://pnpm.io/installation) and
[uv](https://docs.astral.sh/uv/getting-started/installation/). pnpm downloads
the Node version that each talk pins, and uv downloads the Python version.

```bash
cd watches
pnpm install    # the root's packages (the theme's fonts), then the talk's
pnpm dev        # the deck, at http://localhost:3030
pnpm export     # a PDF of the deck
```

The Python tools need no setup step. `uv run` makes the venv first, and the
tools that render install their browser the first time they run.

## What is here

| Directory                                       | What                                                                      |
| ----------------------------------------------- | ------------------------------------------------------------------------- |
| `<talk>/`                                       | one talk, with its own package versions                                   |
| [`themes/house/`](themes/house/README.md)       | the house Slidev theme, which every talk uses                             |
| [`themes/palettes/`](themes/palettes/README.md) | the colour palettes; a talk loads one, as an addon                        |
| [`docs/`](docs/README.md)                       | the house style: palette, illustrations, legibility; how to work here     |
| [`tools/`](tools/README.md)                     | the checks for the house style, and `validate.py`, which runs all of them |
| `tasks/`, `<talk>/tasks/`                       | the options and evidence behind each decision                             |

How the talks, their versions and their checks work:
[`docs/talks.md`](docs/talks.md). The rules for working in this repo:
[`AGENTS.md`](AGENTS.md).
