# Package compatibility

**Covers:** dependency constraints for Watches.
**Read before** you update packages or remove a dependency override.
**Task:** [the package upgrade](../tasks/2026-10-10-package-upgrade/PLAN.md).

Follow [the house upgrade workflow](../../docs/talks.md).
Use stable releases that satisfy each package's peer requirements.
The runtime and package pins are in `package.json` and `.python-version`.
The Python requirements are in `pyproject.toml`.

Keep TypeScript within the range that `typescript-eslint` supports.
Keep Python Playwright and `playwright-chromium` at the same release.
This lets the checks and exports use the same Chromium build.

`pnpm-workspace.yaml` pins UnoCSS's magic-string dependency.
The current UnoCSS directive transformer duplicates CSS with the newer release.
This breaks Slidev builds, as described in
[UnoCSS issue 5373](https://github.com/unocss/unocss/issues/5373).
Before you remove the pin, confirm an upstream fix and run full validation.
