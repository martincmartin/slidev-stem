# Talks as projects: versions, upgrades and checks

**Covers:** each talk as its own project: the layout, setting up a clone, why
each talk keeps its own versions, and how to upgrade a talk's packages.
**Read before** you set up a clone, upgrade, validate, tag or build a talk, or
start a new talk.
**Tasks:**
[`tasks/2026-09-28-per-talk-dependencies/`](../tasks/2026-09-28-per-talk-dependencies/PLAN.md),
[`tasks/2026-09-28-validate/`](../tasks/2026-09-28-validate/PLAN.md),
[`tasks/2026-10-06-validation-speed/`](../tasks/2026-10-06-validation-speed/PLAN.md).

Each talk is a separate project, with its own package versions. A talk that you
gave is frozen. This page tells you why, and how to work in that setup. The rules
themselves are in [`../AGENTS.md`](../AGENTS.md): "Given talks and versions" and
"Working in this repo".

## The layout

| Project        | Holds                                                            | Its lockfiles and environments                                             |
| -------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `stem/`        | the house: `tools/`, `docs/`, the theme (`themes/ledger/`)       | `pnpm-lock.yaml`, `uv.lock`, `.venv`, `node_modules` (Prettier, the theme) |
| `stem/<talk>/` | one talk: `slides.md`, `components/`, `public/`, `art/`, `docs/` | `pnpm-lock.yaml`, `uv.lock`, `.venv`, `node_modules`                       |

Each project pins its Node and pnpm versions (`devEngines` in `package.json`) and
its Python version (`.python-version`). pnpm downloads the pinned Node for the
talk's scripts. uv installs the pinned Python.

A talk that has TypeScript (`watches/` has) also has its own `tsconfig.json`
and `eslint.config.js`. Copy them from that talk when a new talk needs them,
with the packages in its `package.json` (`typescript` at `^6.0`: typescript-eslint
does not yet accept TypeScript 7).

## Set up a clone

You need [pnpm](https://pnpm.io/installation) and
[uv](https://docs.astral.sh/uv/getting-started/installation/). pnpm downloads
the pinned Node, and uv downloads the pinned Python. Then, in a talk's
directory:

```bash
pnpm install    # the root's packages (the theme's fonts), then the talk's
pnpm dev        # the deck, at http://localhost:3030
```

`pnpm install` in a talk runs `pnpm install --frozen-lockfile` at the root
first (the talk's `preinstall` script). The theme's fonts are the root's
packages, so a talk does not build without them. It also downloads Chromium for
`slidev export`, from the talk's `playwright-chromium` package.

The Python needs no setup step. `uv run` makes the project's `.venv` first. The
tools that render install Chromium the first time they run
(`tools/browsers.py`).

Playwright keeps its browsers in one cache for your user
(`~/Library/Caches/ms-playwright` on macOS). All checkouts and worktrees share
it, so a new one downloads no browser.

## Why each talk is its own project

The usual life of a talk is: write it, give it, tag it, and never touch it
again. An upgrade for the next talk must not make you edit a talk that you
gave.

A shared workspace cannot do that:

- A uv workspace has one resolution for all its members. If one talk needs
  Pillow 12, all talks get Pillow 12.
- The pnpm workspace had one hoisted `node_modules` (`shamefullyHoist`, which
  Slidev needs). Before the split, the root held 442 packages, and `watches/`
  held 5 of its own. Two talks on different Slidev versions would get whichever
  version of each shared package the root happened to hold.

So each talk has its own lockfiles, and the git tag of a given talk
(`given/<talk>/<date>`) holds everything needed to rebuild it. `main` has to
support only the talks in progress.

The house items (the theme, `tools/`, `docs/`, `.prettierrc`) have one live
copy, which all talks use. You make every change to them yourself, so you can
find the talks in progress that use an item before you change it. The tag
records the version that each given talk used.

## Check your work

The validation policy is in [`../AGENTS.md`](../AGENTS.md#validate-before-you-commit).
Full mode remains the default. Each tool and command is in
[`../tools/README.md`](../tools/README.md).

For routine edits, use `uv run ../tools/validate.py --quick` in the talk.
This runs source checks, generated-file checks, and the build.
It omits browser checks, rendered legibility, motion, print, and navigation.
During work, run full mode only after changes that could affect its results.
Before each commit, require a successful full run for each changed project.
If the project has not changed since its last successful full run, reuse that result.
This includes changes to shared tools, themes, dependencies, and configuration used by the project.
Quick mode does not satisfy the full-validation requirement.

Full validation retains settled navigation and the rapid offline walk.
They use one browser with their original viewports and timing.
The rapid walk can expose failures caused by interrupted animations.

Full validation uses bounded parallel preparation. Navigation runs alone,
so other browser checks cannot affect its frame samples.
Use `--jobs 1` for serial preparation. `--fix` always uses one worker.
Every check prints its elapsed time. `--json` gives machine-readable results.
Timing measurements and their limits are in the validation-speed task.

## Upgrade a talk's packages

Upgrade only a talk in progress. In the talk's directory:

1. **Record the state before.** Build the deck, and list the resolved JS
   packages:

   ```bash
   pnpm build --out /tmp/deck-before
   pnpm list --depth Infinity --json > /tmp/before.json
   ```

2. **Upgrade.**

   ```bash
   uv lock --upgrade && uv sync        # Python packages
   pnpm update --latest                # the JS packages in package.json
   rm pnpm-lock.yaml && pnpm install   # and every package below them
   ```

   Keep the Python `playwright` and the JS `playwright-chromium` at the same
   version (`uv.lock` and `package.json`). Then `slidev export` and the tools
   that render use the same Chromium build, and the cache holds one copy.

   To move Node or pnpm, change the versions in `devEngines` in
   `package.json`. To move Python, run `uv python pin <version>`. Use stable
   releases only.

3. **Check.** Run `uv run ../tools/validate.py`. Then see what changed:

   ```bash
   pnpm list --depth Infinity --json > /tmp/after.json
   uv run --project .. ../tools/flatten_pnpm_list.py /tmp/before.json > /tmp/before.txt
   uv run --project .. ../tools/flatten_pnpm_list.py /tmp/after.json > /tmp/after.txt
   diff /tmp/before.txt /tmp/after.txt
   pnpm build --out /tmp/deck-after
   uv run --project .. ../tools/compare_dist.py /tmp/deck-before /tmp/deck-after
   ```

   `compare_dist.py` ignores Vue's scoped-CSS ids and the content hashes in
   file names. Both change when the path of `node_modules` changes, so a build
   that differs only in them is the same deck.

Some advisories from `pnpm audit` cannot be fixed by an upgrade. On 2026-09-28,
all 8 of them were in packages that Slidev's own dependencies pin or limit:
`lodash-es` (from `chevrotain`, through `mermaid`), `dompurify` (from
`monaco-editor`) and `image-size` (from `pptxgenjs`). A pnpm `overrides` entry
can force a newer version. Do this only if you then test the part of Slidev
that uses the package.
