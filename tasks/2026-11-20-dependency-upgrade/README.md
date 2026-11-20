# Dependency upgrade results, 20 November 2026

Read [PLAN.md](PLAN.md) for the options and the registry results.

## Result

- Node 26.13.0 → 26.13.1 and pnpm 12.18.0 → 12.21.0, in both projects.
  Python stays at 3.15.2.
- Playwright: Python 1.64.1 → 1.65.2 (house), JS 1.64.1 → 1.65.1 (both
  projects). They share driver 1.65.1, and so the same browser builds.
- House JS: cspell 10.5.2, eslint 10.15.0, prettier 3.10.1 and
  typescript-eslint 8.73.0, with their indirect packages
  (`root-js-changes.diff`).
- Watches JS: eslint 10.15.0, eslint-plugin-vue 10.12.1, parse5 8.1.1, prettier
  3.10.1 and typescript-eslint 8.73.0, and indirect packages that include
  rolldown 1.2.19 and UnoCSS 66.13.0 (`watches-js-changes.diff`).
- Python, both projects: numpy 2.5.5, ruff 0.17.6 and librt 0.17.0
  (`*-python-changes.diff`).
- Held back: TypeScript at 6.0.3, by the rule in `watches/docs/packages.md`.
  Vue 3.5.46 was less than a day old, and pnpm skipped it (PLAN.md).

`docs/talks.md` and `watches/docs/packages.md` now pair Playwright by its
driver, not by its release number, and give the commands that compare them.

No code changes were needed.

## Validation

Recorded in the commit message. The full runs are after the rebase onto
90a7309.

The Watches build: 1 of 250 files differs (`build-comparison.txt`):
`assets/modules/vue.js`. Vue is still 3.5.45. Rolldown 1.2.19 gives the
minified variables other names, and the file is 205 bytes larger. The build
archives are not kept.

WebKit checks the Safari engine. Installed Safari was not tested.

## Reproduce

`inputs/` holds the manifests, lockfiles and `.python-version` files of both
projects before the upgrade. `flatten_pnpm_list.py` and `compare_dist.py` are
copies of the house tools that made the lists and the comparison.
