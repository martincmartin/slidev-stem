# Talks as projects: versions, upgrades and checks

**Covers:** each talk as its own project: the layout, setting up a clone, why
each talk keeps its own versions, how to change a house item, and how to
upgrade a talk's packages, and how to publish a talk on GitHub Pages.
**Read before** you set up a clone, upgrade, validate, tag, retire, build or
publish a talk, start a new talk, add a deck file, or change a house item.
**Tasks:**
[`tasks/2026-09-28-per-talk-dependencies/`](../tasks/2026-09-28-per-talk-dependencies/PLAN.md),
[`tasks/2026-09-28-validate/`](../tasks/2026-09-28-validate/PLAN.md),
[`tasks/2026-10-06-validation-speed/`](../tasks/2026-10-06-validation-speed/PLAN.md),
[`tasks/2026-10-07-validation-reuse/`](../tasks/2026-10-07-validation-reuse/PLAN.md),
[`tasks/2026-10-10-cloud-validation/`](../tasks/2026-10-10-cloud-validation/README.md).

Each talk is a separate project, with its own package versions. A talk that you
gave is tagged, and a talk that you retired is frozen. This page tells you why,
and how to work in that setup. The rules themselves are in
[`../AGENTS.md`](../AGENTS.md): "Given talks, retired talks and versions" and
"Working in this repo".

## The layout

| Project        | Holds                                                                | Its lockfiles and environments                                             |
| -------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `stem/`        | the house: `tools/`, `docs/`, the theme and the palettes (`themes/`) | `pnpm-lock.yaml`, `uv.lock`, `.venv`, `node_modules` (Prettier, the theme) |
| `stem/<talk>/` | one talk: `slides.md`, `components/`, `public/`, `art/`, `docs/`     | `pnpm-lock.yaml`, `uv.lock`, `.venv`, `node_modules`                       |

Each project pins its Node and pnpm versions (`devEngines` in `package.json`) and
its Python version (`.python-version`). pnpm downloads the pinned Node for the
talk's scripts. uv installs the pinned Python.

A talk that has TypeScript (`watches/` has) also has its own `tsconfig.json`
and `eslint.config.js`. Copy them from that talk when a new talk needs them,
with the packages in its `package.json` (`typescript` at `^6.0`: typescript-eslint
does not yet accept TypeScript 7).

## Start a new talk

A new talk needs its own `pnpm-workspace.yaml` (the `slidev-practices` skill,
"pnpm", says why; `tools/talkcheck.py`, run by the talk's `validate.py`, fails
without it). Copy these files from the newest talk: `pnpm-workspace.yaml`,
`pyproject.toml`, `.python-version`, `.prettierignore`, `tsconfig.json`,
`eslint.config.js`, and `package.json` with its `devEngines` and its
`preinstall` script. Then run `pnpm install` and `uv sync` in the new talk's
directory. A talk links the theme with `"slidev-theme-house":
"link:../themes/house"`, and each palette with `"slidev-addon-palette-<name>":
"link:../themes/palettes/<name>"`.

## Add a deck file

`.prettierrc` sends Slidev decks to `prettier-plugin-slidev` (the `parser:
"slidev"` override). All other Markdown goes to Prettier's normal Markdown
parser, which breaks a slide's frontmatter with no error (the `slidev-practices`
skill, "Prettier").

The override globs are `slides.md`, `slides-*.md` and `**/pages/*.md`, in any
talk. If a new deck file does not match them, add its name to the `files` array
in `.prettierrc` in the same change. If you format a deck without that entry,
Prettier corrupts it. `tools/talkcheck.py` fails if a Markdown file of a talk
that starts with frontmatter (other than the docs, the tasks and the READMEs)
does not get the Slidev parser.

## Set up a clone

You need [pnpm](https://pnpm.io/installation) and
[uv](https://docs.astral.sh/uv/getting-started/installation/). pnpm downloads
the pinned Node, and uv downloads the pinned Python. Then, in a talk's
directory:

```bash
pnpm install    # the root's packages (the theme's fonts, the tools), then the talk's
pnpm dev        # the deck, at http://localhost:3030
```

`pnpm install` in a talk runs `pnpm install --frozen-lockfile` at the root
first (the talk's `preinstall` script). The theme's fonts are the root's
packages, so a talk does not build without them. So are the packages of the
house tools in TypeScript (`../tools/README.md`). It also downloads Chromium for
`slidev export`, from the talk's `playwright-chromium` package, and the other
engines of a talk whose own checks use them (`playwright-firefox`,
`playwright-webkit`).

The Python needs no setup step. `uv run` makes the project's `.venv` first. The
Python tools that render install their required browser engines the first time
they run (`tools/browsers.py`). The house's TypeScript deck checks get theirs
from the root's `pnpm install`, as a talk's art checks do.

Playwright keeps its browsers in one cache for your user
(`~/Library/Caches/ms-playwright` on macOS). All checkouts and worktrees share
it, so a new one downloads no browser.

A coding agent also needs the user-level instructions and skills from
[agent-house](https://github.com/martincmartin/agent-house): run its
`install` once on each machine. The `AGENTS.md` files here send the agent to
its `slidev-practices` skill before it edits a deck.

### Cloud sessions

A Claude Code cloud session runs `.claude/hooks/session-start.sh` when it
starts. It installs what a laptop already has: pnpm 12 (it reads the lockfiles,
and then runs each project's pinned pnpm), a uv that knows the pinned Python,
each project in progress from its lockfiles, the three Playwright engines, and
the system libraries WebKit needs. It also starts an X server (Xvfb) and sets
`DISPLAY`. This is not an oversight: on Linux without a GPU, headless Firefox
has WebGL only with a display (it then draws in software, with Mesa). Without
one, Firefox draws no watch, and the privacy check fails in Firefox. A laptop
needs none of this.

The hook updates uv with `uv self update`, or else from PyPI: the image's uv
may not come from Astral's installer, and the network policy may block
`astral.sh`. If a step fails, the hook stops and says so in Claude's context,
so that Claude tells the user. Claude Code adds a session-start hook's stdout
to Claude's context only when the hook exits 0, and shows its stderr only to
the user, as a hook error notice.

The environment's network policy must allow `cdn.playwright.dev` and
`playwright.download.prss.microsoft.com`, where Playwright downloads its
browsers.

The user-level instructions and skills come from the environment's own setup
script, which installs
[agent-house](https://github.com/martincmartin/agent-house#claude-code-cloud-sessions).
An environment without it gives no error. So the hook checks for
`~/.claude/CLAUDE.md` first: without it, it tells Claude to warn the user
before anything else.

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
support only the talks in progress: a talk that you gave can still change, but
a retired talk (`retired/<talk>/<date>`) does not.

The house items (the theme, `tools/`, `docs/`, `.prettierrc`) have one live
copy, which all talks use. You make every change to them yourself, so you can
find the talks in progress that use an item before you change it. The tag
records the version that each given talk used.

## Change a house item

Before you change a house item, find the talks in progress that use it.

Sometimes a talk in progress must not get a breaking change, for example
because it is a week from its date. Then copy the item to a new directory with
a version number, for example `themes/house-2/`. Make the change in the copy,
and point only the other talk at it. When no talk in progress uses the old
copy, delete it. The tags keep it.

## Tag, rebuild or retire a talk

- **Tag a talk that you give.** Make an annotated tag,
  `given/<talk>/<YYYY-MM-DD>`, with the date of the talk. For example,
  `git tag -a given/watches/2026-10-15`. Put the event and the venue in the tag
  message. If you give a talk again, make one more tag with the new date. Always
  include the date: git cannot have a `given/watches` tag and a
  `given/watches/…` tag at the same time. Before you tag, check that the talk
  builds from its lockfiles, in the talk's directory:
  `pnpm install --frozen-lockfile && uv sync --locked && pnpm build`, and run
  `uv run ../tools/validate.py --print`. Before you tag, also do the milestone
  review of the `learn-from-corrections` skill.
- **Rebuild the version that you gave.** Make a worktree at its tag:
  `git worktree add ../watches-given given/watches/2026-10-15`. Then, in the
  worktree's talk directory, run `pnpm install --frozen-lockfile` and
  `uv sync --locked`.
- **Retire a talk.** Make an annotated tag, `retired/<talk>/<YYYY-MM-DD>`, on
  the last commit that changes the talk, with the date that you retire it.
  Before you retire it, check that it builds and validates, as before a talk is
  given.

## Publish a talk

The talks are on GitHub Pages, at
`https://martincmartin.github.io/slidev-stem/`. Each talk has its own
directory there: `<talk>/` for the slides, and `<talk>/article/` if it has an
article. The site's own pages are in `site/`: the root page `index.html`, and
`404.html`.

**Publish the version that you give.** Push its tag:

1. Look at the talk as Pages will show it. At the root, run
   `uv run tools/pages_preview.py <talk>`, and open the URL that it prints. It
   builds the talk as the workflow does. Click through the slides and open a
   link to one slide: `slidev dev` can show a slide right that a build shows
   wrong.
2. Tag the talk, as in "Tag, rebuild or retire a talk": the checks first, then
   `git tag -a given/<talk>/<YYYY-MM-DD>`.
3. Push `main`, then the tag: `git push origin main given/<talk>/<YYYY-MM-DD>`.
4. The workflow `.github/workflows/publish.yml` builds the talk at the tag
   and publishes it. Look at its run in the repository's Actions tab, then
   open the talk's page.

**Publish between talks.** For example, to publish a fix to the article,
look at the preview first (step 1), then run the workflow by hand: in the
Actions tab, choose "Publish a talk", then "Run workflow". Give the talk's
directory and a ref (`main`, a tag or a commit). With the GitHub CLI:
`gh workflow run publish.yml -f talk=<talk> -f ref=main`.

**The first time a talk is published,** add it to `site/index.html` on
`main`. A run copies that page from the default branch, not from the ref that
it builds.

How a run works, and why:

- **It builds one talk, from the files of its ref.** The house theme, the
  tools and the lockfiles come from the ref, not from `main`. It runs
  `pnpm build --base /<repo>/<talk>/`, then the talk's `prerender` script if
  it has one, and publishes the talk's `dist/`.
- **It changes only that talk's directory.** The site is the `gh-pages`
  branch. A retired talk keeps the build that it was last published with, so a
  change to `main` that breaks the talk does not break its page. A run refuses
  a retired talk, except from its `retired/` tag.
- **`gh-pages` holds one commit.** Each run force-pushes the whole site as a
  new commit, so the branch does not grow with each publish. Each published
  version can be built again from its ref.
- **The speaker notes are published,** in the presenter view of the slides.
  The article is the version for readers.
- **Links to one slide work,** for example `<talk>/5`. GitHub Pages serves the
  site's `404.html` for a path that has no file, and that page loads the
  talk's `index.html` in its place. GitHub Pages uses only the `404.html` at
  the site's root, not the one that `slidev build` writes in `dist/`. A run
  copies `site/404.html` from the default branch, as it does the root page.

The repository's Pages setting is "Deploy from a branch", with the `gh-pages`
branch and the `/ (root)` folder.

## Browser support

Talks support Chrome, Firefox, and Safari in regular and private or incognito
windows. They must work offline with default privacy protections enabled.

Full validation walks the built deck in Playwright Chromium, Firefox, and WebKit.
The three independent walks run together after other checks finish.
In these walks and in the print and privacy checks, Chromium draws WebGL on the GPU
(`gpu` in `tools/chromium-args.json`, which `tools/browser.ts` and
`tools/browsers.py` read, and its copy in the watches talk's
`art/browser.ts`), as Chrome does in a talk. The checks
compare states and positions, not pixels, so the renderer does not change their
results. This is not an oversight: headless Chromium otherwise draws WebGL in
software (SwiftShader), on the CPU, which made the print check about 3 times
slower (the dated note in the
[validation-speed task](../tasks/2026-10-06-validation-speed/README.md)).
Without a GPU (Linux without `/dev/dri`, such as a cloud container), Chromium
draws in software either way, and gets `noGpu`, ANGLE's SwiftShader
backend: the checks are the same, but slower. There it drew the watch about
4.8 times as fast as Chromium's default software path (8.2 against 1.7 frames
a second), and the print check took 94 s instead of 117 s (median of five runs
each, all passing; the
[cloud-validation task](../tasks/2026-10-10-cloud-validation/README.md)). With Chromium 141 the same flag made the print
check fail at the Hairspring slide's curl click three times out of three: the
live capture of that click depends on frame timing. If the print check fails
only without a GPU, suspect this first. The PNG stills (`art:stills`) stay in software, because the legibility
and motion checks measure their pixels.
Each walk uses a fresh non-persistent browser context, with no saved cookies,
storage, or permissions. These are
[incognito-like contexts](https://playwright.dev/python/docs/browser-contexts).
The walk also blocks 2D canvas pixel reads. The watches talk also checks that
its live watch mounts in each engine under that restriction. A talk must not need those reads to
resolve theme colours or start its live art.

Headless Chromium and WebKit refuse a screen wake lock. At a secure origin
(https or localhost), Slidev asks for one as it starts and does not catch a
refusal, so the page throws. So a check that drives a deck supplies
a stand-in `navigator.wakeLock` that grants it (`tools/browser.ts`, and the
watches talk's `art/browser.ts`). The house's deck checks serve a built deck at
an https origin, as GitHub Pages does, so they need it too. Every other page error still fails the
check. The stand-in is a standard web API, not a Slidev setting, so it works
with any Slidev version.

Playwright WebKit is an engine check. It is not the installed Safari browser,
and its contexts do not reproduce all Safari private-window protections.
For a Safari-specific failure or a change to privacy-sensitive APIs, also test
Safari directly in regular and private windows when it is available.
State which tests were run and identify any test that could not be run.
Do not disable privacy protection to make a test pass.

The renderer and print diagnostics accept `--browser webkit` where documented.
The supported names are `ENGINES` in `tools/browser.ts` (for the watches
talk's art checks, in `art/browser.ts`); commands are in
[the tools index](../tools/README.md).

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
Quick mode does not satisfy the full-validation requirement, with one exception.
If all changes since the last successful full run are to docs only (`docs/`,
`tasks/`, a README or an `AGENTS.md`), a successful quick run is enough. No build
and no check reads these files, except `doccheck` and Prettier, and quick mode
runs both.

Full validation runs every check and exits non-zero if any check fails:

- **The root run** checks `tools/` with ruff (format and lint), mypy (strict)
  and pyright, and the TypeScript in `tools/` with `tsc`, ESLint and its
  tests. It checks the shared files with Prettier, runs the tests in
  `tools/` (pytest), checks the docs with `doccheck`, and checks the palette's
  gates. It checks that no Vue component in `themes/` has a comment beside its
  one root element (`vuecheck`): a build then drops the class and `v-click`
  that a slide gives it, and `slidev dev` does not show this. `vuecheck` also
  checks each lint disable in a template, as a talk's `lint` does in a
  script (below).
- **A talk's run** checks the talk's Python with the same four tools, in the
  talk's own venv. It runs the talk's `typecheck`, `lint` and `test` scripts,
  if it has them. Its `lint` fails on a warning, and on a lint disable that is
  not as narrow as it can be: a block disable with no enable for its rules
  (even at the end of the file), a disable that names no rule or gives no
  reason, or one that suppresses nothing (`eslint.config.js`; `vuecheck` for
  a Vue template's comments; ruff's `PGH` and `RUF100` for Python). It checks
  the talk with Prettier, its docs with `doccheck`,
  and every SVG in its `public/` with `artcheck`, `barroom` and `motion`. It
  checks that the talk sets the palette only for a slide class (in any of its
  source files), and that each such palette passes the gates. It runs the
  talk's `art:privacy` startup check, if the talk has one. It runs the print
  check (`art:print`, below). It checks that files generated by the talk's
  scripts match what the scripts write (`art:generated`). It checks the two
  silent traps in `../AGENTS.md`, a missing `pnpm-workspace.yaml` and a deck
  file that `.prettierrc` misses (`talkcheck`), and the talk's Vue components
  with `vuecheck`, as the root run does. It builds the deck, and then
  walks every slide and click in Chromium, Firefox, and WebKit with
  `smokecheck.ts`, with every outside request blocked.

### The print check

The print check (`art:print`) checks the pages of an export: each printed page's
watch must be the live slide's at the same click. It is the slowest check, and
an export is the only thing it guards: the live talk does not use it. So full
validation runs it only when it can find something new:

- **With `--print`.** Run `uv run ../tools/validate.py --print` before you export
  a talk, before you tag it, and before you give it.
- **When the working tree changes a print input**: staged, unstaged or
  untracked, against `HEAD` (`git status`). A talk lists its print inputs in its
  `pyproject.toml` (`print-inputs` in `[tool.validate]`): the files with code
  that only printed pages run, the check itself, and the Slidev version.

Otherwise the summary says `skip  print`, and the run passes. A talk that lists
no print inputs runs the check every time. So does a run where git cannot say
what changed. This is not an oversight: on a laptop with a GPU the check takes
about 18 s, but on a machine without one about 195 s, three quarters of a full
run ([cloud-validation task](../tasks/2026-10-10-cloud-validation/README.md)).
The cost is a later warning: a change to shared code or to `slides.md` that
breaks only the printed pages fails at `--print`, not at the commit.

**Full validation reuses successful print and smoke navigation checks when their inputs are unchanged.**
The key is computed by `deck_key` in `tools/validate.py`.
It includes the built deck, checker code, and dependency pins.
The record is `<talk>/.validate/passes.json`; git ignores it.
Only successful checks are recorded. A new key replaces the previous record.
`--no-reuse` runs print and smoke navigation again.
It never invokes exhaustive navigation.

Docs and some source comments leave the built deck unchanged.
Comments in Vue files or `slides.md` can change it because the build retains source and speaker notes.
The [validation-reuse task](../tasks/2026-10-07-validation-reuse/README.md) records the key and build comparisons.

Full validation uses a fast forward smoke walk in each supported engine, with outside requests blocked.
It checks startup, page errors, navigation stalls, and the declared final position.
It does not compare settled states or sample animation continuity.

Exhaustive navigation is a diagnostic tool for an actual or suspected problem.
No validation mode runs it. Do not run it routinely, including before commits
or after ordinary navigation changes. See [navigation.md](navigation.md).

Full validation uses bounded parallel preparation. Smoke navigation runs after preparation.
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

   Keep the house's Python `playwright` (the root's `uv.lock`) and the
   talk's JS `playwright-chromium` (and its `playwright-firefox` and
   `playwright-webkit`) at the same version (`package.json`). Then `slidev export` and the tools that
   render use the same browser builds, and the cache holds one copy.

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
