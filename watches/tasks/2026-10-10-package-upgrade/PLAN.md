# Update Watches packages

Read [the upgrade workflow](../../../../docs/talks.md) before repeating this task.
This task updates the Watches talk only. Shared packages keep their own lockfiles.
The branch matched local `main` before work started.

## Options, in rank order

1. Use the latest stable versions that meet the project contracts. This updates
   direct and indirect packages, and preserves compiler and browser compatibility.
   Choose this option.
2. Use every latest version, regardless of compatibility. TypeScript 7.0.2 is
   available, but typescript-eslint 8.71.1 requires TypeScript below 6.1.
   JavaScript Playwright 1.64.0 is available, but Python Playwright remains at
   1.63.0. This option breaks two documented contracts.
3. Update only within the old package ranges. This reduces change, but leaves
   some stable releases unused. It does not meet the requested scope.

## Selected versions

Keep TypeScript 6.0.3 and both Playwright packages at 1.63.0.
Update Node to 26.11.1, pnpm to 12.10.1, and Python to 3.14.8.
Python 3.15 is a release candidate, so exclude it.

Registry checks used `pnpm outdated`, `pnpm view`, `uv lock --upgrade --refresh`,
`uv python list`, and the PyPI JSON endpoint for Playwright.
The `inputs/` directory preserves the original manifests, lockfiles, and package
list. The original build passed before the update.

## Checks

Follow the documented upgrade workflow. Recreate the JS lockfile to resolve
indirect dependencies. Run full validation and compare the builds.
Record the results in `README.md`. Do not commit without user approval.

## Build failure and remedy

The first full run failed during CSS minification. All source checks passed.
UnoCSS 66.10.5 uses `code.update()` after it inserts CSS declarations.
magic-string 1.4.3 preserves those inserts, so the transformer duplicates them.
[Upstream issue 5373](https://github.com/unocss/unocss/issues/5373) reports the
same Slidev error. The installed transformer contains the reported call.

Ranked remedies:

1. Pin UnoCSS's magic-string range to 1.4.2. This restores the previous behavior
   with one dependency override. Choose this option and test a full build.
2. Patch UnoCSS's transformer. This keeps magic-string current, but adds a
   local source patch that needs maintenance.
3. Turn off CSS minification. This leaves invalid CSS in the build.
   Reject this option.

`validation-failed.json` preserves the failure and the passing source checks.

## Build comparison method

The house comparison tool stops when several hashed chunks share one base name.
Both builds contain multiple `md-*.js` chunks. Keep the original tool unchanged.
The task's `compare_grouped_builds.py` uses its normalization rules and compares
multisets of contents for each base name. This avoids ambiguous chunk pairing.
Both build archives are saved here, so the comparison can be repeated later.
