# Upgrade house and Watches dependencies

Covers both independent projects. Read `../../docs/talks.md` and
`../../watches/docs/packages.md` before repeating this work.
The checkout was clean and matched local main before work started.

## Options, ranked

1. Update all stable packages and runtimes that satisfy the project contracts.
   Resolve indirect dependencies again. Test both projects. Choose this option.
   It meets the requested scope and preserves supported compiler and browser versions.
2. Accept every latest release without compatibility checks. This can break peer
   requirements and separate the two Playwright browser versions. Reject this option.
3. Update only direct patch releases. This reduces change but leaves indirect
   dependencies and runtime upgrades unchecked. It does not meet the requested scope.

## Evidence and checks

Keep input manifests and lockfiles in `inputs/`. Record registry results,
compatibility limits, and full validation results here. Compare the Watches
build before and after the upgrade. Do not commit without explicit approval.

## Current registry results

Node 26.11.1, pnpm 12.11.2, and Python 3.15.0 are stable releases.
Python 3.15 has macOS ARM wheels for NumPy, Pillow, SciPy, and mypy.
Keep TypeScript 6.0.3: typescript-eslint 8.71.2 requires TypeScript below 6.1.
Keep both Playwright packages at 1.63.0: PyPI has not released 1.64.0.
UnoCSS 66.11.0 includes the overwrite fix from upstream pull request 5375.
The refreshed tree builds with current magic-string and no override.
