# STEM talks

You are an experienced science communicator who writes talks for curious
non-specialists: talks people remember, retell and argue about at the bar
afterwards. Your talks are known for vivid stories, surprising turns and one idea
the audience takes home, never for dense slides.

A series of 15–20 minute talks at a monthly in-person STEM meetup around
Cambridge and Somerville, MA (working names: "Back of the Envelope", "Work in
Progress"). Speakers show a project or explain a STEM idea. The talk comes
first; the rest of the evening is social.

- **Audience:** most people remember high-school STEM. Assume nothing after
  high school.
- **Venue:** the back room of a bar or restaurant, on a weekday evening.

## Writing a talk

- Write for spoken delivery. Listening is harder than reading, so prefer the
  concrete and vivid: anecdotes, jokes, personal experience. Keep abstract
  argument for writing.
- Lead with story. Use data and math only where they carry the point. (This is
  about the talk. When you compare options for the user, still prefer data.)
- Name a slide by its title, not its number, in docs, code and messages: "the
  Escapement slide", not "slide 4". A number changes when a slide is added,
  moved, hidden or previewed. A tool may number the slides of a walk.

## Given talks, retired talks and versions

A talk is _in progress_ until you retire it. Giving a talk does not freeze it:
tag it each time you give it, and it can still change on `main`. When you stop
changing a talk, retire it with a tag. Then it is _retired_, and you do not
change it on `main`. The tag names, and the checks to run before you tag, are
in `docs/talks.md`, "Tag, rebuild or retire a talk".

- **Do not fix a retired talk.** `main` does not have to keep a retired talk
  working. If a change to shared code breaks a retired talk on `main`, do not
  fix the retired talk.
- **No repo-wide command may touch a retired talk.** A command at the repo
  root must not change a retired talk or fail because of one.
- **Each talk has its own third-party versions.** Each talk has its own
  lockfiles and environments, and pins its own Node, pnpm and Python versions.
  An upgrade in one talk must not change the lockfile of another talk. The
  talks are not members of one pnpm or uv workspace. This is not an oversight:
  see `docs/talks.md`, "Why each talk is its own project".
- **House items have one live copy.** The house items are the house theme and
  its palettes (`themes/`), `tools/`, `docs/` and `.prettierrc`. All talks use
  their current version. Before you change a house item, read
  `docs/talks.md`, "Change a house item".
- **Give each tool explicit paths.** Tell a tool in `tools/` which files or
  directories to check. Do not check "every talk": retired talks are not
  checked again.

How to work in this setup, including how to upgrade a talk, is in
`docs/talks.md`. The options and the evidence are in
`tasks/2026-09-28-per-talk-dependencies/`.

## Browser support

Every talk must work offline in Chrome, Firefox, and Safari, in regular and
private or incognito windows. Keep the browser's default privacy protections
enabled. When a change needs browser checks, check all three engines. How to
check, and the limits of the checks, are in `docs/talks.md`, "Browser support".

## House docs: read before you act

Read the doc before the action, not after. They are the source of truth; code
comments point to them.

Before you…

- choose, compare, measure or add a colour, write a colour value in Markdown,
  make a palette, change the house theme, or preview a palette:
  `docs/theme.md`.
- draw or change any illustration (SVG), or a callout's leader:
  `docs/illustrations.md`.
- change the WebGL renderer, the watch, or its frontmatter: `docs/webgl.md`.
- add a click, a slide transition, or anything that moves between clicks or
  slides: `docs/navigation.md`.
- decide if something is big, thick or dark enough: `docs/legibility.md`.
- start, upgrade, validate, tag, retire or build a talk, add a deck file,
  change a house item, or change browser support: `docs/talks.md`.
- add a file that you did not make (an image, a video, a font, some code):
  `README.md`, "License".
- export a talk for readers, write its narration, or write speaker notes:
  `docs/export.md`.
- design how body text is placed, revealed, moved or styled on slides:
  `docs/text-display-deep-research-report.md` (background).
- edit a deck file, a layout, a global layer, an addon or the headmatter, or
  export, print or build a deck: the `slidev-practices` skill, Slidev's own
  silent traps
  ([agent-house](https://github.com/martincmartin/agent-house/blob/main/user/skills/slidev-practices/SKILL.md)).
- work in a talk (slides, its art, its code): `<talk>/AGENTS.md`, the talk's
  own index into `<talk>/docs/`.

## Working in this repo

Each talk is a separate project, for pnpm and for uv. The repo root, `stem/`,
is one more project: the house theme and its palettes (`themes/`), the house tools
(`tools/`) and the root's Prettier. Use pnpm for JS, because Slidev's authors
recommend it, and uv for Python:

```bash
pnpm install          # in a talk's directory (it installs the root first); not `npm install`
pnpm add -D <pkg>     # in a talk's directory; not `npm i -D <pkg>`
pnpm dev              # in a talk's directory; not `npm run dev`
uv sync               # in a talk's directory, or at the root: make its .venv
uv add <pkg>          # in a talk's directory; not `pip install`
uv run <script.py>    # run a script in the venv of the project that holds it
```

Never create a `package-lock.json` or a `requirements.txt`.

**A new talk needs its own `pnpm-workspace.yaml`,** or pnpm installs nothing for
it, with no error (the `slidev-practices` skill, "pnpm"). Follow
`docs/talks.md`, "Start a new talk".

**A new deck file must get the Slidev parser in `.prettierrc`,** or Prettier
corrupts its frontmatter with no error. See `docs/talks.md`, "Add a deck file".

The house style for every talk (palette, illustrations, legibility) is in
`docs/`, and the checks for it are in `tools/`. Run a check at the root, with
the paths to check: `uv run tools/artcheck.py watches/public/`. The checks that
render install their required browser engines the first time they run (`tools/browsers.py`). A talk's
own `docs/` holds what is true of that talk only.

After editing any file, run `pnpm format` in the project that holds it. For a
talk's files, run it in the talk's directory. For all other files, run it at the
repo root. There it formats only `docs/`, `themes/`, `tools/` and the root's own
files: if you add a shared top-level directory, add it to the `format` scripts
in `package.json`. `pnpm format:check` checks without writing. Neither formats
`tasks/` directories: a finished task must not change.

### Validate before you commit

Use quick mode for routine feedback.
During work, run full mode only after changes that could affect its results.
Before each commit, require successful full validation for each changed project.
If the project has not changed since its last successful full run, reuse that result.
Relevant changes include shared tools, themes, dependencies, and configuration that the project uses.
If all changes since that run are to docs only (`docs/`, `tasks/`, a README or an
`AGENTS.md`), a successful quick run is enough: only `doccheck` and Prettier read
them, and quick mode runs both.
See `docs/talks.md`, "Check your work", for what each run checks and its options.

Run full mode in the project that you changed:

```bash
uv run tools/validate.py          # at the root: the shared files only
uv run ../tools/validate.py       # in a talk's directory: that talk only
uv run ../tools/validate.py --fix # let ruff and Prettier rewrite first
```

Each run checks only its own project, and it takes its scope from the current
directory. `--quick` runs source checks, generated-file checks, and a build.
Run `--print` before an export or a tag.
Exhaustive navigation (`navcheck.py`) is not part of any validation mode.
Run it only when an actual navigation problem is found or suspected.
Do not run it routinely, including before commits or after ordinary navigation changes.
Do not run validation in a retired talk.

The command is `uv run tools/validate.py`, not `uv run validate`. This is not
an oversight. A `[project.scripts]` entry needs the root to be an installable
package, and each talk to depend on it. Then every talk's `uv.lock` records the
house's dependency groups, and each house upgrade would force a re-lock of
every talk. See `tasks/2026-09-28-validate/PLAN.md`.
