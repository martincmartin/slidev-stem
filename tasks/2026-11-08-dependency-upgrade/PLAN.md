# Upgrade house and Watches dependencies, November 2026

Covers the house project (`stem/`) and Watches. Each project keeps its own
lockfiles. Read `../../docs/talks.md`, "Upgrade a talk's packages", and
`../../watches/docs/packages.md` before you repeat this work.

The checkout was clean and at `main` (58a4bac) before work started.

## Options, ranked

1. Upgrade every package and runtime to its latest stable release, except where
   a package rule forbids it. Re-resolve all indirect packages. Validate both
   projects in full mode. Chosen: it does what the user asked and obeys the
   rules in `watches/docs/packages.md`.
2. Accept every latest release, TypeScript 7.0.2 and Playwright 1.65.0 included.
   Rejected: typescript-eslint 8.72.1 requires TypeScript `>=4.8.4 <6.1.0`, and
   PyPI has no Playwright 1.65, so the JS and Python browser builds would differ.
3. Upgrade only the packages in `package.json` and `pyproject.toml`. Rejected:
   indirect packages keep their old versions.

## Registry results, 2026-11-08

- Node 26.13.0 is the current LTS release. pnpm 12.18.0 is `latest`.
  CPython 3.15.2 is the newest stable 3.15 build that uv can install.
- TypeScript 7.0.2 (2026-07-08) exports only `lib/version.cjs` and an
  `unstable/*` API. The classic compiler API is not in it.
  typescript-eslint 8.72.1, its canary 8.72.2-alpha.11 and its `rc-v8` tag all
  require TypeScript below 6.1. vue-tsc 3.3.14 uses `@volar/typescript`, which
  calls the classic API. Slidev 53.1.0 also depends on TypeScript (twoslash).
  Keep TypeScript 6.0.3.
- Playwright for JS: 1.65.0 on 2026-11-05. Playwright for Python: 1.64.1 is the
  newest. The Python release followed the JS release by 11 days (1.63.0), 6 days
  (1.64.0) and 8 days (1.64.1). Keep all four Playwright packages at 1.64.1.

## Finding: the documented re-resolve did not re-resolve

`rm pnpm-lock.yaml && pnpm install` (pnpm 12.18.0) printed "Lockfile is up to
date, resolution step is skipped". pnpm rebuilt `pnpm-lock.yaml` from its copy
in `node_modules/.pnpm/lock.yaml`. A resolve in an empty copy of the talk's
manifests chose `vue-eslint-parser` 10.4.2. The talk's lockfile kept 10.4.1.
After `rm pnpm-lock.yaml node_modules/.pnpm/lock.yaml && pnpm install`, the
talk's lockfile matched the fresh resolve exactly. At the root, the fresh
resolve already matched. `docs/talks.md` now deletes both files.
