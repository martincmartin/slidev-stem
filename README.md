# STEM talks

Slide decks for a monthly STEM meetup around Cambridge and Somerville, MA:
15–20 minute talks for curious non-specialists, in the back room of a bar. Each
deck is a [Slidev](https://sli.dev) project.

- What Everyone Should Know About Watches: [`watches/`](watches/)

## Set up, and run a talk

If you have git, pnpm 12 or later and uv, this shows the deck and its article:

```bash
git clone https://github.com/martincmartin/slidev-stem.git
cd slidev-stem
pnpm install
cd watches
pnpm install
pnpm dev        # the deck at http://localhost:3030, the article at /article
```

For what to install first, and for Linux's system libraries, read
[`docs/talks.md`, "Set up a clone"](docs/talks.md#set-up-a-clone). In a talk's
directory, `pnpm export` makes a PDF of the deck.

## Private files

You do not need them. A few things show only in the room, such as lines from songs
in copyright. They are in a separate private repo, beside the checkout. Without it, a
deck builds with no error and shows a public alternative:
[`docs/talks.md`, "Private files"](docs/talks.md#private-files).

## The house style

Each talk uses the house theme and one of its palettes (now Ledger: a light
field, a deep blue accent, a burnt orange second), and its illustrations
follow one grammar, "Line, weighted": four stroke weights, the palette's art
colours, and files that state the size a slide shows them at. Art that turns
in 3D or moves by rules is drawn live in WebGL, in the same grammar. Every
threshold comes from one question, _can the back row of a bar read this_, and
`tools/` answers it with arithmetic.

## What is here

- `<talk>/`: one talk, with its own package versions
- [`themes/house/`](themes/house/README.md): the house Slidev theme, which every
  talk uses
- [`themes/palettes/`](themes/palettes/README.md): the colour palettes; a talk
  loads one, as an addon
- [`docs/`](docs/README.md): the house style: palette, illustrations,
  legibility; how to work here
- [`tools/`](tools/README.md): the checks for the house style, and
  `validate.py`, which runs all of them
- `tasks/`, `<talk>/tasks/`: the options and evidence behind each decision

How the talks, their versions and their checks work:
[`docs/talks.md`](docs/talks.md). The rules for working in this repo:
[`AGENTS.md`](AGENTS.md).

## License

- **Code** is under the [MIT License](LICENSE). Code is each script,
  component, style sheet and configuration file.
- **All other files** are under [CC BY 4.0](LICENSE-content): the slides, their
  narration and notes, the art and the docs. To credit them, write "Martin C.
  Martin" and link to this repository.
- **A file that you did not make keeps its own licence.** Add it only if its
  licence lets anyone download it from a public repository. Write its source and
  its licence in the README of its directory. A paid stock-photo licence usually
  does not let you do this.
- **Lines from songs in copyright** are not in this repository. A talk shows them from a
  private file (`watches/docs/slide-patterns.md`, "Words that run on their own").
- **The built decks in `tasks/`** contain third-party code and fonts under their
  own licences: for example Vue and Slidev (MIT), and the house fonts Fraunces
  and IBM Plex (SIL Open Font License).
