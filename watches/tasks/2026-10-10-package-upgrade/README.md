# Watches package upgrade

The chosen scope and version exceptions are in [PLAN.md](PLAN.md).
The current compatibility rules are in [docs/packages.md](../../docs/packages.md).

## Changes

Five direct JS dependencies changed: Node types, ESLint, globals,
typescript-eslint, and vue-tsc. Two direct Python dependencies changed: mypy
and ruff. Both lockfiles also update indirect dependencies.
Node, pnpm, and Python use newer stable releases.

TypeScript and Playwright retain their compatible versions.
The UnoCSS magic-string override restores builds after a confirmed regression.
`validation-failed.json` records that failure.

## Build comparison

The normalized comparison has 158 groups in each build. Ten groups differ.
Slide chunks (`md`) and slide CSS match after normalization.
Changes are in the shared runtime, syntax highlighter, and Slidev interface.
This comparison does not prove visual equivalence.

The house comparison tool rejects repeated chunk base names.
The task's comparison groups them and compares their contents as multisets.
To repeat it, extract the archives into two empty directories and run:

```bash
python3 compare_grouped_builds.py /tmp/before /tmp/after
```

`build-comparison.txt` holds the result. `packages.diff` holds the resolved
package changes. `inputs/` holds the original package configuration.

## Validation

`uv run ../tools/validate.py --json` passed all 23 checks in 248.62 seconds.
`validation.json` holds the complete result.
Print checked 47 positions, including 41 that show the watch.
The three smoke walks each checked 47 positions and made no outside requests.
Chromium, Firefox, and WebKit also passed the startup check with canvas reads blocked.
No direct Safari check was required for this package update.

Print used 222.40 seconds. Another checkout ran a CPU-intensive browser during
this check, so this run cannot establish a dependency-related timing regression.
Peer requirements passed. The Python lockfile and environment were consistent.
Only the documented TypeScript and JavaScript Playwright exceptions remain in
`pnpm outdated`.

No commit was made.
