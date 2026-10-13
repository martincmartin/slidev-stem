# Dependency upgrade results

Read [PLAN.md](PLAN.md) for the options and compatibility checks.
This task covers the house project and Watches. Each keeps separate lockfiles.

## Result

Both projects use stable Python 3.15.0 and pnpm 12.11.2.
The house runtime moves to Node 26.11.1, which Watches already used.
All supported direct packages and indirect packages were refreshed.
The house themes' font packages are already current.

TypeScript stays at 6.0.3 because the current linter excludes TypeScript 7.
Both Playwright packages stay at 1.63.0 because Python has no matching 1.64 release.
These limits follow the existing package rules. No new compatibility policy was needed.

UnoCSS 66.11.0 includes the [upstream fix](https://github.com/unocss/unocss/pull/5375).
The magic-string override is removed. The new tree uses magic-string 1.4.3.
No implementation fixes were needed.

## Validation

- House: all 8 full checks passed in 27.41 seconds, including 210 pytest tests.
- Watches: all 23 full checks passed in 41.50 seconds. No checks were reused or skipped.
- Watches checks include print, rendered art, types, lint, generated files, and browser startup.
- Offline smoke walks passed in Chromium, Firefox, and WebKit, with canvas pixel reads blocked.
- All 162 normalized build groups match before and after the upgrade.

WebKit checks the Safari engine. Installed Safari was not tested.
The upgrade does not change privacy-sensitive project APIs.

## Reproduce the comparison

`inputs/` holds the original manifests, lockfiles, docs, and resolved JS lists.
The JSON validation reports retain each check's output and timing.
The Python change lists and flattened JS lists show resolved package changes.
The build archives and comparison tools are copies for this task.

Extract each build archive into its own directory. Then run:

```bash
uv run compare_grouped_builds.py /path/to/before /path/to/after
```

The script normalizes chunk hashes and Vue scope IDs.
It compares content multisets when several chunks share a base name.
