# Publish a talk when a push to main changes its pages — plan

**Date:** 2026-10-27 · **Status:** done, not committed. The request is in
`instructions.md`.

## The problem

The publish workflow (`.github/workflows/publish.yml`) ran on a
`given/<talk>/<date>` tag, or by hand. Between talks, nobody ran it: on
2026-10-27, the watches talk on Pages was built from `07ea5bf`, 44 commits
behind `main`. The article on Pages was also broken (the prerender gave
`<html>` two `class` attributes), and nobody saw it there for 13 days.

## Data

- From `07ea5bf` to `b35e83c` (2026-10-22 to 2026-10-27): 44 commits. 22 of
  them change a file that can change the talk's pages, with the filter below.
  A run starts for each push, not each commit.
- A publish run took 2 min (`39872603834`: 25 s to install, 79 s to build
  and prerender) to 12 min (the first runs, before the prerender was made
  faster). The repository is public, so its Actions minutes are free.

## Options

1. **Publish on each push to `main` that can change a talk's pages.** A
   script compares each talk's files with the commit that its pages were
   built from, and publishes the talks whose pages can change.
   - For: Pages follows `main` within minutes. The comparison is with the
     published build, not with the push, so a run that GitHub cancels (a
     newer push replaces a pending run) loses nothing: the next run sees the
     same changes.
   - Against: a script must say which files can change the pages. A wrong
     "yes" costs a 2-minute run; a wrong "no" leaves Pages stale, so the
     filter lists what cannot change the pages, and publishes for anything
     else.
2. **The same, with a `paths:` filter in the workflow.** No script.
   - Against: GitHub's filter sees only the push's files, not each talk's
     retired state, so it cannot treat a retired talk apart. A cancelled run
     loses its changes.
3. **A daily scheduled run.** Simple, but Pages is up to a day old, and it
   still needs option 1's script to skip a talk that did not change.
4. **Build on each push, and publish only if `dist/` changed.** Exact, but
   every push pays for a build of every talk, and the article's stills are
   screenshots of WebGL, which are not always byte-identical.
5. **Keep tags and manual runs.** The problem stays.

**Chosen: option 1.** It is the only one that keeps Pages current, skips
retired talks for house changes, and survives a cancelled run.

## The rules

A push to `main` publishes a talk if:

- **The talk is in progress, and a file that can change its pages changed
  since its pages were built.** That is a file of the talk, or a house file
  outside the talks (the theme and palettes in `themes/`, the site's root
  pages in `site/`, and any new top-level file). Not docs, tasks, tests,
  Python, the talk's `art/` (its scripts write files that the deck reads, and
  those are committed apart), or Markdown other than the deck files. A talk
  whose build is not recorded (no `build.json`) is published.
- **The talk is retired, and the push changes a file of the talk that can
  change its pages.** A house change does not publish a retired talk: it may
  no longer build with the new house. A change to the talk itself means that
  someone changed it although it is frozen, so the run tries a build. If the
  build fails, the talk keeps its old pages. A retired talk is compared with
  the push, not with its build: a build that fails is not tried again at
  each later push.

A run builds each talk in a shell of its own: a talk that fails does not stop
the others. It pushes the talks that built, then fails if one did not.

Each talk's directory on `gh-pages` gets a `build.json`: the ref and the
commit that it was built from. The next run compares with that commit.

The script runs with the runner's `python3` (3.12), not with uv: it uses only
the standard library, and Ruff checks it as Python 3.12
(`per-file-target-version` in `pyproject.toml`).

## Results

- `tools/publish_plan.py` and `tools/test_publish_plan.py`.
- `.github/workflows/publish.yml`: the push trigger, the plan, the loop over
  talks, `build.json`.
- `docs/talks.md`, "Publish a talk".
- Not tested on GitHub Actions before the commit: the first push to `main`
  is the test. The script was run here against the real `gh-pages` branch.
