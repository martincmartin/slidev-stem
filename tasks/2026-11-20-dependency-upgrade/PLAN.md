# Upgrade house and Watches dependencies, 20 November 2026

Covers the house project (`stem/`) and Watches. Each project keeps its own
lockfiles. Before you repeat this work, read `../../docs/talks.md`, "Upgrade a
talk's packages", and `../../watches/docs/packages.md`.

Work started at `main` (7208174), and was rebased onto 90a7309 before
validation. The working tree had the user's unfinished edits to
`watches/slides.md`. The before and after builds both contain them.

## Options, ranked

1. Upgrade every package and runtime to its latest stable release, except where
   a package rule forbids it. Pair the Playwright packages by their driver, not
   by their release number. Re-resolve all indirect packages. Validate both
   projects in full mode. Chosen: it does what the user asked, and it keeps the
   JS and Python browser builds the same.
2. Pair Playwright by release number, as `docs/talks.md` said before this task.
   No release number is on both registries with the same driver (see below).
   1.65.1 is on both, but Python 1.65.1 contains the 1.65.0 driver, with
   Chromium build 1254, and JS 1.65.1 uses Chromium build 1255. Rejected: the
   rule's purpose is the same browser builds, and this option breaks it.
3. Accept every latest release, TypeScript 7.0.2 included. Rejected:
   typescript-eslint 8.73.0 requires TypeScript `>=4.8.4 <6.1.0`.

## Registry results, 2026-11-20

- Node 26.13.1 (2026-11-10) is the current LTS release. pnpm 12.21.0 is
  `latest` (12.22.0 is `next`). CPython 3.15.2 is still the newest 3.15 build
  that uv can install.
- TypeScript: 7.0.2 is `latest`, and 6.0.3 is the newest 6.0 release.
  typescript-eslint 8.73.0 and `@typescript-eslint/typescript-estree` 8.73.0
  require TypeScript below 6.1. Keep TypeScript 6.0.3.
- Playwright for JS: 1.65.0 (2026-11-05) and 1.65.1 (2026-11-13). Playwright
  for Python: 1.65.0 (2026-11-09), 1.65.1 (2026-11-11) and 1.65.2
  (2026-11-14). The bundled drivers and browser builds, from the macOS arm64
  wheels and the npm `playwright-core` tarballs:
  - Python 1.65.1: driver 1.65.0, Chromium 1254, Firefox 1572, WebKit 2388.
  - Python 1.65.2: driver 1.65.1, Chromium 1255, Firefox 1572, WebKit 2388.
  - JS 1.65.0: Chromium 1254, Firefox 1572, WebKit 2388.
  - JS 1.65.1: Chromium 1255, Firefox 1572, WebKit 2388.

  Choose Python 1.65.2 and JS 1.65.1: both are the newest, and they use the
  same driver. Python 1.65.2 no longer depends on `pyee`.
- Vue 3.5.46 was published at 08:21 UTC on 2026-11-20. pnpm 12 did not choose
  it: it skips releases that are younger than its minimum release age. Vue
  stays at 3.5.45. The next upgrade gets 3.5.46.

## Finding: an indirect beta package

The re-resolved Watches tree lists `@emnapi/core` and `@emnapi/runtime`
2.0.0-beta.2. They come from `@napi-rs/wasm-runtime` 1.2.6, through
rolldown's optional `@rolldown/binding-wasm32-wasi`. pnpm does not install that
binding on macOS arm64 (`node_modules/.pnpm` holds no `binding-wasm` package),
so the beta packages are in the list, but not installed. Rolldown chooses
them, not this project. No action.
