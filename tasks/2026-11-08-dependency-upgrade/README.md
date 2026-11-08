# Dependency upgrade results, November 2026

Read [PLAN.md](PLAN.md) for the options and the registry results.

## Result

- Node 26.12.1 → 26.13.0, pnpm 12.15.0 → 12.18.0 and Python 3.15.1 → 3.15.2,
  in both projects.
- House JS: @types/node, @vue/compiler-core, @vue/compiler-sfc, cspell, eslint
  and typescript-eslint, to their latest patch or minor releases. 58 resolved
  packages changed (`root-js-changes.diff`).
- Watches JS: @slidev/cli and @slidev/parser 53.0.0 → 53.1.0, vue 3.5.45,
  vue-tsc 3.3.14, eslint 10.14.0, eslint-plugin-vue 10.12.0, globals, parse5,
  @types/node and typescript-eslint. 202 resolved packages changed
  (`watches-js-changes.diff`).
- Python: mypy 2.4.1, ruff 0.17.4, pytest 9.2.0 (house only) and their
  dependencies (`*-python-changes.diff`).
- Held back: TypeScript at 6.0.3 and the Playwright packages at 1.64.1, by the
  rules in `watches/docs/packages.md`. The house theme's font packages were
  already current.

No code changes were needed.

## Validation

- House: all 12 full checks passed in 11.76 s.
- Watches: all 25 full checks passed in 74.85 s. They include the print check,
  private browsing, the stills, and the navigation smoke walk in Chromium,
  Firefox and WebKit with 0 outside requests.
- The Watches build: 16 of 245 files differ (`build-comparison.txt`). Slidev
  53.1.0 and Vue 3.5.45 changed the client code, so a difference is expected.
  The build archives are not kept.

WebKit checks the Safari engine. Installed Safari was not tested.

## Reproduce

`inputs/` holds the manifests, lockfiles and `.python-version` files before the
upgrade. `flatten_pnpm_list.py` and `compare_dist.py` are copies of the house
tools that made the lists and the comparison.
