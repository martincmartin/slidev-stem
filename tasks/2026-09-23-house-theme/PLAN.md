# House theme: Ledger as a shared Slidev theme — plan

**Date:** 2026-09-23 · **Status:** Part 1 done; waiting for the user to accept it

## The request

- Ledger is the look for every STEM talk.
- Make `stem/` the pnpm workspace root, so that talks can share the theme.
- Update packages to the latest versions, and remove old installs as needed.
- Later, before a second talk exists, compare other palettes (for example
  those in `watches/tasks/2026-09-18-theme-colors/`) on this talk. The
  comparison must work on a few slides, side by side, in a throwaway deck.

This task is **Part 1**: the workspace and the theme. **Part 2** is the palette
comparison tools (palette classes, a `palette:` headmatter key, a
whole-palette mode for `palette.py`, and a comparison deck). Part 2 starts when
the talk has one slide of each kind that a palette must handle: cards, dense
text, code, a chart and a photo.

## Facts that decide the design

Verified in the installed Slidev CLI 52.19.1 source:

1. `theme: ledger` resolves the packages `@slidev/theme-ledger`, then
   `slidev-theme-ledger`, from the deck's folder. So a workspace package named
   `slidev-theme-ledger` works for every talk with one headmatter line.
2. Slidev loads `styles/index.{ts,js,css}` from every root, and the theme is a
   root.
3. With `fonts.provider: none`, Slidev adds no web-font `<link>`. It still
   builds the fallback stacks.
4. The core `cover` layout has no default background. Seriph's `cover`
   requested a photo from Unsplash.
5. One deck has one theme. So palettes for side-by-side comparison must be CSS
   classes, not themes (Part 2).
6. A deck can import a slide with `src: ./slides.md#2` and override its
   `class:`. Tested with a build on 2026-09-23.

## Options considered

### Where the shared theme lives

| option                                                                      | for                                                                          | against                                                  |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| **A. `stem/` is the pnpm workspace root; the theme is a workspace package** | one lockfile and one install for all talks; `theme: ledger` works everywhere | moves the lockfile; install runs at `stem/`              |
| B. Theme inside `watches/`, moved later                                     | no change now                                                                | a second move when talk 2 starts                         |
| C. Theme with its own `node_modules`                                        | simple                                                                       | two talks can get different versions of the same package |

**Chosen: A.** The user asked for it, and it is the right shape for several
talks. Node resolves packages by walking up from the importing file, so a theme
outside `watches/` cannot use `watches/node_modules` (B and C work around this).

### What the theme is based on

| option                     | for                                                        | against                                                                                 |
| -------------------------- | ---------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| keep seriph plus overrides | no work                                                    | 3 defaults conflict with Ledger (fonts, h1 colour, cover photo); 2 of them fail offline |
| eject seriph and edit it   | layouts to start from                                      | 201 lines, and the conflicting defaults are the first thing to rewrite                  |
| another existing theme     | —                                                          | not evaluated; any theme brings defaults to override                                    |
| **from scratch**           | only what Ledger needs; Slidev core already has 21 layouts | write the heading and cover styles                                                      |

**Chosen: from scratch.**

### Where the palette is applied

| option                                       | for                                                | against                                                                |
| -------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| opt-in `.tk-slide` class (the current setup) | a slide can skip Ledger                            | a slide without the class has no palette; every slide must remember it |
| **every slide (`.slidev-layout`)**           | the house look is the default; nothing to remember | a slide that wants another look must override (Part 2 classes do this) |

**Chosen: every slide.** Ledger is the look for all talks.

### Seriph

The archive decks under `watches/tasks/` use `theme: seriph`, and they must keep
working. **Kept as a devDependency of `watches`, for the archives only.**

## Open questions (not decided in this task)

- The palette variables use the prefix `--tk-` ("timekeeper"), which is a
  slide-specific name in a house theme. Renaming touches the theme, the
  component, the tools and the docs. Deferred: ask the user.

## Steps

1. Workspace root: `stem/package.json`, `stem/pnpm-workspace.yaml`; remove
   `watches/pnpm-workspace.yaml` and `watches/pnpm-lock.yaml`.
2. `stem/themes/ledger/`: `package.json` with Slidev defaults (fonts,
   `colorSchema: light`), fonts from Fontsource, palette and heading styles.
3. `watches`: `theme: ledger`, latest packages, remove `styles/`, remove
   font and palette declarations from slides and components where the theme now
   supplies them.
4. `tools/lib.py`: read the palette from the theme.
5. Verify: build, offline render (no outside requests), click sequence, colours,
   fonts, pixel comparison of slide 2 before and after, archive decks still
   build, `palette.py`, `artcheck.py`, Prettier.
6. Update `watches/docs/`, READMEs and `AGENTS.md`.

## Results (2026-09-23)

Versions: Slidev CLI 52.19.1 → **53.0.0**, Vue 3.5.33 → 3.5.43, Prettier
3.9.8 (3.9.9 was 10 hours old and failed pnpm's minimum-release-age rule; the
exception pnpm added on its own was removed). pnpm 12.3.4.

| check                                       | before                           | after                                                     |
| ------------------------------------------- | -------------------------------- | --------------------------------------------------------- |
| outside requests, slides 1–3 offline        | 6 (5 Google Fonts, 1 Unsplash)   | **0**                                                     |
| slide 1 offline                             | white text on a grey placeholder | Ledger, ink on cream                                      |
| slide 3 heading                             | PT Serif 400, teal `#5d8392`     | Fraunces 600, ink                                         |
| slide 2, pixels changed (clicks 0 / 2 / 5)  | —                                | 0 / 94 / 97, all inside the animated drawings (timing)    |
| slide 2 click sequence                      | 5 clicks, dims as designed       | identical                                                 |
| laptop in dark mode                         | —                                | still light (`class="light"`)                             |
| `palette.py`, `artcheck.py`                 | pass                             | pass; drift and stray declarations still fail it (tested) |
| archive decks (4)                           | build                            | build with Slidev 53 and seriph                           |
| Prettier, from the root and from `watches/` | —                                | clean                                                     |

What moved:

- `stem/package.json`, `stem/pnpm-workspace.yaml`, `stem/pnpm-lock.yaml`,
  `stem/.prettierignore`: new. `watches/pnpm-workspace.yaml` and
  `watches/pnpm-lock.yaml`: removed.
- `stem/themes/ledger/`: new. Fonts, palette, `h1` and `cover` styles.
- `watches/styles/`: removed; its content is in the theme.
- `watches/slides.md`: `theme: ledger`; the timekeepers title is a markdown
  `h1`; no font or palette declarations.
- `TimekeeperCard.vue`: fonts from `@apply font-serif` / `font-mono`.
- `watches/tools/lib.py`: reads the palette from the theme.

Corrected on the way:

- The user had removed four lines from the `slides.md` headmatter comment (which
  drawing set, and how to open its archive) on purpose: `slides.md` does not
  describe rejected alternatives or how to revisit them; that belongs in the
  task archive. This task first misread the removal as a loss and restored the
  lines, then removed them again.

Not verified:

- The Netlify and Vercel configs build from `watches/`. With the lockfile now at
  the repo root, their install step may need the base directory set to the root.
  Not tested on either host.
