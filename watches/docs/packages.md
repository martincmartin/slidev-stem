# Package compatibility

**Covers:** dependency constraints for Watches.
**Read before** you update packages or remove a dependency override.
**Task:** [the package upgrade](../tasks/2026-10-10-package-upgrade/PLAN.md).

Follow [the house upgrade workflow](../../docs/talks.md).
Use stable releases that satisfy each package's peer requirements.
The runtime and package pins are in `package.json` and `.python-version`.
The Python requirements are in `pyproject.toml`.

Keep TypeScript within the range that `typescript-eslint` supports.
Keep `playwright-chromium`, `playwright-firefox` and `playwright-webkit` at
the release of the house tools' Python Playwright (`../uv.lock`). Then the art
checks, the exports and the house tools use the same browser builds. The three
JS packages must also share one `playwright-core`, or the art checks start two
copies of Playwright. The talk itself has no Python Playwright.

The resolved UnoCSS directive transformer includes the
[upstream fix](https://github.com/unocss/unocss/pull/5375) for duplicate CSS.
It can use the current magic-string release without an override.
The [house and Watches upgrade](../../tasks/2026-10-13-dependency-upgrade/PLAN.md)
records the compatibility checks and validation.
