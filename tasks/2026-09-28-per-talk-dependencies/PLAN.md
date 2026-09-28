# Each talk keeps its own dependency versions

## The request (2026-09-28)

Move the Python setup from `pyproject.toml` and `requirements.txt` to uv. Each
talk keeps its own versions. For example, if `watches/` uses Pillow 10 and
`talk2/` later uses Pillow 12, `watches/` stays on Pillow 10. Do the same for JS
packages, and decide how to version what the talks share (the theme, the tools).

How the talks live:

- The usual cycle: write one talk, give it, tag it in git, never touch it again.
- Sometimes more than one talk is in progress at the same time.
- To look at an old talk, make a git worktree at its tag.

## The requirements

- **R1.** An upgrade for a new talk does not make you edit a given talk.
- **R2.** Two talks in progress can use different versions of a package.
- **R3.** A worktree at a given talk's tag builds that talk, years later.
- **R4.** No repo-wide command changes a given talk or fails because of one.

## The principle

**The git tag is the version of a given talk. `main` is for the talks in
progress.** `main` does not have to keep a given talk working. It only must not
touch it (R4), and the tag must hold everything needed to rebuild it (R3).

This principle answers most of the questions below. Isolation on `main` is
needed only for R2, the talks in progress. The tag does the freezing.

## What is there

From `measure.sh` (output in `evidence/measure.txt`). Copies of the config files
as of `HEAD` are in `inputs/`.

**Python.** There is one `stem/.venv`, one `requirements.txt` (exact `==` pins)
and one `pyproject.toml` (checker settings only). `watches/art/` and `tools/`
share the one env. `.python-version` says `3.14`, with no patch version.

**JS.** There is one pnpm workspace at `stem/`, with packages `*` and
`themes/*`, one `pnpm-lock.yaml` (6488 lines) and three importers: `.`,
`themes/ledger` and `watches`.

| Item | Per talk now? | Detail |
| --- | --- | --- |
| Direct dependency versions | Yes | The lockfile records them per importer. |
| `node_modules` | **No** | `shamefullyHoist: true` puts 442 entries (573 MB) in `stem/node_modules`. `watches/node_modules` has 5 entries (24 MB). The talk finds almost every package in the shared root. |
| Node version | **No** | Homebrew `node` v26.10.0. No pin: 0 `.nvmrc` files, 0 `devEngines` fields. |
| pnpm version | **No** | Homebrew `pnpm` 12.3.4. No pin. |
| Settings (`pnpm-workspace.yaml`) | **No** | `shamefullyHoist` and `allowBuilds` apply to all talks. |
| `pnpm install` | **No** | It installs every talk. |
| `pnpm format` | **No** | It formats every talk with the root's Prettier. |

**What a talk uses from outside its directory:**

- the theme, with `"slidev-theme-ledger": "workspace:*"` and `theme: ledger`;
- `stem/tools/`, from `watches/art/validate_skeleton_watch.py`, with
  `stem/.venv` hard-coded (`VENV = STEM / ".venv"`);
- `stem/.prettierrc`, which the talk's Prettier finds by searching up;
- `stem/pyproject.toml`, for the checker settings.

## Decision 1: third-party packages

| Option | R1 | R2 | R4 | Cost |
| --- | --- | --- | --- | --- |
| **A. Each talk is a separate uv project and a separate pnpm project** | yes | yes | yes | 2 lockfiles per talk |
| B. Shared workspaces; remove a talk from them when it is given | yes | **no** | yes | least config |
| C. Now: shared workspace, per-importer versions | partly | **no**: shared hoisted `node_modules` | **no** | none |

**Choice: A.** B fails R2. Two talks in progress would share one Python
resolution (uv workspaces allow only one) and one hoisted `node_modules`. If
`talk10` goes to Slidev 54 and `talk11` stays on 53, the shared root holds only
one version of each package that is not declared. C also fails R4, because
`pnpm install` and `pnpm format` run on every talk.

The cost of A is small. pnpm and uv hard-link packages from their caches, so a
second copy of a version uses almost no disk.

For a talk, A means:

- `watches/pyproject.toml`, `watches/uv.lock` and `watches/.venv`. The `dev`
  group pins its own ruff, mypy and pyright, so a newer ruff does not reformat
  the talk.
- `watches/pnpm-workspace.yaml`. Its presence makes the talk its own pnpm root.
  It holds `shamefullyHoist` and `allowBuilds`, so the hoisting stays inside
  `watches/node_modules`.
- `watches/pnpm-lock.yaml`.
- `stem/pnpm-workspace.yaml` changes to `packages: ["themes/*"]`. If it keeps
  `*`, the talk is a member again.
- `stem/pyproject.toml` becomes the uv project for `tools/` and `stem/tasks/`.
  It has no `[tool.uv.workspace]`.

Task scripts use the env of the project that holds them. A one-off script with
extra packages uses PEP 723 inline metadata and `uv lock --script`.

## Decision 2: runtimes

A lockfile does not help if the interpreter that reads it has changed (R3).

- **Python.** Run `uv python pin 3.14.N` (an exact patch version) in each
  project. Set `python-preference = "only-managed"`, so that a Homebrew upgrade
  cannot remove a venv's interpreter.
- **Node and pnpm.** pnpm 12 reads `devEngines.runtime` (Node) and
  `devEngines.packageManager` (pnpm) from `package.json`. It downloads the
  pinned Node on first use and records the pnpm version in the lockfile. Pin
  both in each talk's `package.json`. See the CHANGELOG of the installed pnpm.
  **To verify:** the exact field form, and that `pnpm dev` runs Slidev with the
  pinned Node, not the Homebrew one.

## Decision 3: what the talks share

The shared items are the theme, `tools/`, `docs/`, `.prettierrc` and the
checker settings. Each option below applies to each of them.

| Option | Work per shared change | Work per given talk | Given talk on `main` | Two talks in progress |
| --- | --- | --- | --- | --- |
| **S1. Live link; the tag is the version** | 0 | tag only | may drift; exact at the tag | both get the change |
| **S5. Versioned directory, only on a breaking change** | 1 copy per *breaking* change | tag only | exact if it points at a frozen copy | each picks a version |
| S2. Copy into the talk when you give it | 0 | copy, repoint, reinstall, rebuild | exact | both get the change |
| S3. Copy into the talk when you start it | apply by hand to each talk in progress | tag only | exact | copies drift apart |
| S4. Released versions (git tag + `path:` dependency, or a registry) | bump, tag, update each talk's pin | tag only | exact | each picks a version |

**Choice: S1 by default. Use S5 only when a breaking change must not reach a
talk that is in progress.**

- **S1 costs nothing and fully meets R1–R4.** Nothing requires a given talk to
  work on `main` (the principle), and the tag holds the theme and the tools as
  they were on the day.
- **S5 is for the rare case.** Example: you rework the theme's layouts for
  `talk11`, but `talk10` is a week from its date. Copy `themes/ledger/` to
  `themes/ledger-2/`, make the change there, and point only `talk11` at it. When
  `talk10` is given, delete `ledger`, or keep it if another talk in progress
  uses it.
- S2 buys only one thing: a given talk that still builds on `main`. That need is
  already met by a worktree, so the extra step at each talk is not worth it.
- S3 fails when the theme and a talk change together, which is how the theme
  was made. S4 makes each theme edit a release, which is too much work for one
  author.

Third-party packages (Decision 1) and house items get different answers for one
reason. You do not choose when a third-party package changes: `pnpm add` in one
talk could move it for all talks. You choose each change to a house item, and
you can search for its users before you make it.

**How S1 works in practice:**

- **Theme.** The talk depends on `link:../themes/ledger`, not `workspace:*`,
  because the talk is no longer a workspace member. The theme's own
  dependencies (`@fontsource/*`) are installed by the root workspace, into
  `themes/ledger/node_modules`, and are live together with the theme.
  **To verify:** Slidev resolves the fonts through the link.
- **Tools.** The talk runs `stem/tools/` with the root env
  (`uv run --project <stem>`), not with `stem/.venv` hard-coded. The interface
  between a talk and the tools is the tools' `--json` output. A change to that
  output is a breaking change in the sense of S5.
- **`docs/`.** A given talk does not read the docs, so they are always live.
- **`.prettierrc` and the checker settings.** These stay live. A given talk is
  not formatted or checked again (Decision 4).

## Decision 4: repo-wide commands

S1 is safe only if no repo-wide command runs on a given talk (R4).

- **Root `pnpm install`.** It installs the theme and the root Prettier only.
  Each talk installs in its own directory.
- **Root `pnpm format`.** It formats only the shared paths:
  `prettier --write docs themes tools "*.md" "*.json" "*.yaml"`. Each talk has
  its own `pnpm format` with its own Prettier (`watches/` has one already).
  Cost: a new shared top-level directory must be added to the script. That is
  rare.
- **Tools' default "every talk's art"** (`tools/lib.py`). Remove it. Each
  tool requires explicit paths (user's choice, 2026-09-28). Then the tools do not
  need to know which talks are given.
- **The check scripts.** `check_python.py` runs ruff, mypy and pyright with
  `uv run --project <nearest pyproject.toml of the files>`. Then the talk's
  scripts are checked against the talk's own package versions.

## Decision 5: giving a talk

1. Build the talk from a clean worktree at the commit you will tag:
   `pnpm install --frozen-lockfile && uv sync --locked && pnpm build`.
2. Make an annotated tag, `git tag -a given/<talk>/<YYYY-MM-DD>`, with the
   date of the talk. Put the event and the venue in the message. If you give the
   talk again, make one more tag with the new date. The date is in the name from
   the first time, because git cannot have `given/watches` and
   `given/watches/2026-10-15` at the same time (tested: "cannot lock ref").
   The venue is not in the name: the meetup is at similar venues each month, so
   a venue name does not make the tag unique.
3. Do nothing else. The talk stays on `main` as it is.

Deleting a given talk from `main` is possible, but it is not recommended. The
docs and tools cite `watches/` as their example, and you would lose easy reuse
of components.

## Steps

0. ~~Restore `requirements.txt` from `HEAD`.~~ The user did this
   (2026-09-28).
1. Record the baseline: `pnpm list --depth Infinity --json` for `watches`,
   `.venv/bin/pip freeze`, and a `pnpm build` of `watches` (`dist/`). Save them
   in `evidence/before/`.
2. Root Python: make `stem/pyproject.toml` a uv project. Put `tools/`'s packages
   in it and the checkers in a `dev` group, with the same versions as
   `requirements.txt`. Then run `uv lock`, `uv python pin` and delete
   `requirements.txt`.
3. Talk Python: make `watches/pyproject.toml`. It needs numpy, Pillow, scipy,
   scipy-stubs, the checkers and a copy of the checker settings.
4. `check_python.py` and `validate_skeleton_watch.py`: run through `uv run`,
   with no hard-coded `.venv`.
5. JS: `stem/pnpm-workspace.yaml` becomes `themes/*`. Add
   `watches/pnpm-workspace.yaml` and `watches/pnpm-lock.yaml`, seeded so that
   the resolved versions do not change. The theme becomes a `link:` dependency.
   Pin Node and pnpm in both `package.json` files.
6. Root `pnpm format` gets the shared paths only. Remove the tools' "every
   talk" default. Each tool requires paths.
7. Verify (next section).
8. When the user says the task is complete: in `stem/AGENTS.md`, remove the
   "until that task is complete" line under "Given talks and versions" and update
   "Working in this repo". Also update `tools/README.md` (the `.venv/bin/python3` commands),
   `docs/`, and the new-talk procedure.

## Verification

- The resolved versions are identical before and after, for both Python and JS.
- `watches/dist/` from `pnpm build` is identical before and after, except for
  content hashes, if any differ.
- `validate_skeleton_watch.py` passes.
- A root `pnpm format` changes no file under `watches/`.
- `talk2` test: make a throwaway talk, upgrade Pillow and `@slidev/cli` in it,
  and check that nothing under `watches/` changes (`git status`, both
  lockfiles). Then delete the throwaway talk.

## Decided by the user (2026-09-28)

- Tag name: `given/<talk>/<YYYY-MM-DD>` (Decision 5). The user proposed
  `given/watches-again` or the venue for a talk given twice. The date form was
  chosen because it works for any number of repeats and makes each tag unique.
- Tools require explicit paths (Decision 4).
- The conventions are documented in `stem/AGENTS.md`, "Given talks and
  versions", now, before the migration.

## Results (2026-09-28)

Steps 0–7 are done. The evidence is in `evidence/before/` and
`evidence/after/`. The scripts that made it are `measure.sh`,
`flatten_pnpm_list.py` and `compare_dist.py`.

| Check | Result |
| --- | --- |
| Python versions, root | 15 packages, identical to the old venv less the scipy packages (`uv-lock-stem.txt`) |
| Python versions, `watches` | 19 packages, identical to the old venv (`uv-lock-watches.txt`) |
| JS versions, `watches` | 691 of 694 lines identical. The 3 `@fontsource/*` fonts moved to the theme, at the same 5.3.0, and `node@26.10.0` (the pin) was added. |
| JS versions, theme | identical |
| `watches` build | 30 of 98 files differ in bytes, and 0 differ after `compare_dist.py` (`compare-dist.txt`). See below. |
| Validator | output identical (`validate.txt`) and the SVG unchanged |
| Tool outputs, every-talk default → explicit `watches` paths | all 15 captures byte-identical, images included (`tool-capture.txt`) |
| Root `pnpm format` | left a badly formatted file in `watches/` unchanged |
| Throwaway `talk2` (Pillow 12.2.0, Slidev 52.9.1) | installed next to `watches` (Pillow 12.3.0, Slidev 53.0.0). The 6 lockfiles and manifests were unchanged (sha256). |

**Why the build is not byte-identical.** Vue gives each component with scoped
CSS an id, `data-v-<hash>`, computed from the component's path relative to the
project. Slidev's own components moved from `../node_modules/.pnpm/…` to
`node_modules/.pnpm/…`, so 12 ids changed. The content hashes in 30 file names
and references changed with them. With the ids and hashes normalized, all 98
files are identical. A build made twice from the same install is
byte-identical, so the build is deterministic and this check is strict.

**Found during the work:**

- `pnpm add pnpm@<version>` adds pnpm as an ordinary dependency, not as a pin.
  `devEngines.packageManager` must be written by hand. `devEngines.runtime`
  works: in a scratch test, a script ran under the pinned Node 24.11.0 while the
  shell's `node` was Homebrew's 26.10.0.
- If a talk has no `pnpm-workspace.yaml` of its own, pnpm uses the root's
  workspace, installs nothing for the talk and reports "Done". This is now in
  `AGENTS.md`.
- The theme declares `engines.slidev: ">=53.0.0"`. `talk2` on Slidev 52.9.1
  failed to build for that reason, which is correct. With 53.0.0, it built, and
  its fonts came through the `link:`.
- uv's Python prints `RuntimeWarning: Unexpected value in sys.prefix` when it
  is started through a path with `..` (`../.venv/bin/python3`). Paths without
  `..` do not warn. The talk's scripts now say `uv run art/…`.
- Prettier reads `.prettierignore` only from the directory it runs in, so the
  talk has its own. Without it, the talk's `pnpm format` would format its
  `tasks/`.
- `palette.py` also had an "every talk" default: its check that no talk sets
  the palette. It now runs only for the talks named with `--talk`.

**Changed beyond the plan:**

- Small factual fixes in `tools/README.md`, `docs/legibility.md`,
  `docs/theme.md`, `themes/ledger/README.md` and the tools' docstrings. They
  named `requirements.txt`, `workspace:*` or the tools' old defaults.
- `watches/.vscode/settings.json` points Prettier at the talk's own
  `.prettierignore`.

**Still open:** step 8, when the user says the task is complete.

## Upgrade to the latest versions (2026-09-28)

After the migration commit, at the user's request, everything went to its
newest version. The evidence is in `evidence/upgrade/`.

| Item | Before | After |
| --- | --- | --- |
| Python | 3.14.7 | 3.14.7, the newest stable (3.15 is only at rc2) |
| Node | 26.10.0 | 26.10.0, the newest |
| pnpm | 12.3.4 | 12.6.0 |
| Python packages | | `nodeenv` 1.10.0 → 1.11.0 in both projects. `pyee` stays at 13.0.1: the newest playwright (1.63.0) requires `pyee<14`. |
| JS, direct | | Prettier 3.9.8 → 3.9.9 (root and `watches`). The others were already the newest. |
| JS, `watches`, all | 694 packages | Both lockfiles were resolved again from scratch. 44 packages changed version, none to a new major version (`packages-diff.txt`). |

Checks after the upgrade:

- `pnpm install --frozen-lockfile` and `uv sync --locked` pass in both
  projects.
- `pnpm build` passes. The `offline_check.py` report for slides 1:0, 2:0, 2:3,
  2:7 and 3:0 is identical: classes, colours, fonts, and 0 outside requests.
- The screenshots of slides 2:0, 2:3 and 2:7 are pixel-identical. Slides 1 and
  3 differ only in the box (1575, 210)–(1806, 441), where the balance wheel
  animates. Two runs on one build differ in the same box by a similar number
  of pixels (7301, against 6334 after the upgrade), so the difference is the
  animation phase (`slide3-before-after.png`).
- The validator's output is identical, and so are all 15 tool captures.
- `pnpm format:check` passes at the root and in `watches`.
