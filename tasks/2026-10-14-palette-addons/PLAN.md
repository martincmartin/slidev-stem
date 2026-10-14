# Palettes as addons, on a neutral house theme — plan

**Date:** 2026-10-14 · **Status:** done, not committed. The request is in
`instructions.md`; the results are at the end.

## The problem

On 2026-10-14, Ledger was a Slidev theme that held both the house's structure
(the `section` layout, the type, the fonts, the setup, the Vite config, the
palette classes) and one palette. Six more themes, one for each other palette,
re-exported Ledger's files and set their own colours. So every theme pointed at
Ledger because Ledger came first, not because it is the base. If the house
chose another palette, the structure would stay inside a theme named for the
palette it no longer uses.

Two more problems were found on the way:

- **Layouts did not reach the other themes.** Slidev takes layouts only from
  the active theme, and uses its own `section` with no error when a theme has
  none. Commit `6c16c13` added a one-line stub for each theme. Each new layout
  would need six more.
- **Palette classes were right only in a Ledger talk.** Each class set the
  roles in which it differs from Ledger. In a Beacon talk, `class:
  palette-campfire` kept Beacon's muted-wash recipe (22%), not Campfire's
  (18%), and every role that the class did not set came from Beacon.

## Facts that decide the design (Slidev 53.0.0, read in `@slidev/cli`)

1. A talk has one theme. The roots are the theme, then the addons, then the
   talk (`roots = uniq([...themeRoots, ...addonRoots, userRoot])`).
2. Layouts, `styles/index.ts`, `setup/*` and `vite.config.*` are read from
   every root. A later root's layout of the same name wins. Styles load in
   root order: the theme's, then the addons', then the talk's.
3. An addon cannot set Slidev's defaults (`colorSchema`, `fonts`): only the
   theme's `package.json` (`getThemeMeta`) and the headmatter can.
4. Each root's `index.html` is merged into the page by unhead
   (`setupIndexHtml`). **Measured** (`experiments/probe.py`, output
   `evidence/probe.json`): an addon whose `index.html` is
   `<html class="palette-probe">` puts that class on `<html>` in the built
   page, with JavaScript off. With JavaScript on, Slidev adds `dark` beside it
   and keeps it. A custom property that the class sets reaches every slide's
   `.slidev-layout`, and a slide's own class overrides it. The same in
   Chromium, Firefox and WebKit.

## Options

| option | the switch | structure | duplicated | needs a check |
| --- | --- | --- | --- | --- |
| A. `house` theme; each palette a theme that re-exports it | `theme: campfire` | each palette theme holds about 4 stubs, and more for each new layout | stubs; each palette's values twice (theme and class); fonts 7 times | stubs present; theme = class |
| B. `house` addon; each palette a theme with only colours | `theme: campfire` | no stubs; the house's recipes need `:where()`, because the theme's CSS loads first | each palette's values twice; fonts 7 times | the talk loads `house`; theme = class |
| **P. `house` theme; each palette an addon** (chosen by the user) | `addons: [palette-campfire]` and `colorSchema: dark` | no stubs; all structure in one theme | nothing, with the class on `<html>` (below) | one palette, and `colorSchema` matches its paper |
| C. `house` theme; the palette from a headmatter key, applied by a setup script | `themeConfig: { palette: campfire }` and `colorSchema` | no palette packages | nothing | the key names a palette |

C needs JavaScript to apply the palette, so the static article
(`watches/docs/article.md`, read with no JavaScript) would show no palette.
Slidev's `htmlAttrs` headmatter is also applied by script (`setup/root.ts`,
`useHead`).

### How P keeps one copy of each palette

Each palette is one CSS rule, `.palette-<name> { … }`, that sets every role.
The house theme loads every palette's rule, so any slide can preview any
palette with `class: palette-<name>`, as before. The palette's addon makes it
the talk's palette by putting the same class on `<html>` (its `index.html`);
the roles inherit to every slide. A slide's class sets the roles on the slide
itself, which wins over inherited values. So the values are written once, and
no test has to keep two copies equal.

**Each palette sets every role**, recipes included (a recipe is a value too:
`color-mix(…)` of the palette's roles). A class that left a role unset would
inherit it from the talk's palette: the bug above. `tools/test_lib.py` checks
that each palette sets exactly the house's roles.

### What stays tied to Ledger, by choice

The art's fallback colours, and the house tools, measure in one reference
palette, so a change of palette changes no file but `slides.md`. That palette
is Ledger, named once (`REFERENCE_PALETTE` in `tools/lib.py`). It is a choice,
not the structure: no file of another palette or of the theme refers to
Ledger.

## Layout

```
themes/
  house/                  slidev-theme-house: layouts, type, fonts, setup, Vite config
  palettes/<name>/        slidev-addon-palette-<name>:
    palette.css             .palette-<name> { every role }
    index.html              <html class="palette-<name>">
    package.json
```

A talk names its palette in its headmatter, with `colorSchema`:

```yaml
theme: house
colorSchema: light
addons:
  - palette-ledger
```

## Verification

- **No pixel changes** in Ledger: export every slide and click as PNG before
  and after (`slidev export --format png --with-clicks`), and compare
  (`experiments/compare.py`). Two exports of the same deck differ only on the
  Timekeepers slide (page 13, clicks 2–6), whose SVG animations run on their
  own clock (`evidence/noise.json`). The other 55 pages must be identical.
- Each of the seven palettes: build the talk with it, and check that the
  section layout is the house's.
- The talk's full validation, and the root's.

## Results (2026-10-14)

**What moved.**

- `themes/ledger/` became `themes/house/` (`slidev-theme-house`): the layouts,
  the fonts, the type (`styles/house.css`, the old `ledger.css` without its
  palette), the setup and the Vite config. Its `styles/index.ts` loads every
  palette's rule with `import.meta.glob`. Its `package.json` no longer sets
  `colorSchema`: the talk does.
- The seven palettes are `themes/palettes/<name>/`: `palette.css`,
  `index.html`, `package.json`. Each rule sets all 14 roles.
  `experiments/make_palettes.py` wrote six of them from the old themes' files
  and Ledger's recipes, so each shows what its theme showed; Ledger's was
  written by hand, to keep its comments. The six theme directories, their
  stubs, and `palettes.css` are gone.
- The `watches` talk: `theme: house`, `colorSchema: light`, and
  `palette-ledger` in `addons:`; its `package.json` links the house theme and
  all seven palettes. `art/theme.py` is now `art/reference_palette.py`. The
  explorer page imports Ledger's rule and puts its class on `<html>`.
- `tools/lib.py`: `ROLES`, `REFERENCE_PALETTE` (Ledger), `palette_recipes`
  (every role, no other), `talk_palette` (one palette addon),
  `talk_color_schema` and `paper_schema`. `palette.py --talk` now fails if a
  talk loads no palette or two, or if its `colorSchema` does not suit the
  paper. `derive_palette.py` writes the full rule, with the usual recipes.

**Checks.**

| check | result |
| --- | --- |
| PNG export of every page and click, before and after (`evidence/after.json`) | 55 of 60 pages identical. The other 5 are the Timekeepers slide, clicks 2–6, which also differ between two exports of the same deck (`evidence/noise.json`): its SVG animations run on their own clock. Both exports log the same two `TimeoutError`s and one FloatingVue error, before and after |
| the talk built with each of the seven palettes, read in Chromium (`experiments/check_palettes.py`, `evidence/palettes.json`) | each: `<html>` has the palette's class and `light` or `dark`; the slides' `--palette-background` is the palette's; the Section slide shows the house's eyebrow |
| the mechanism in Chromium, Firefox and WebKit (`experiments/probe.py`, `evidence/probe.json`) | the class is on `<html>` with JavaScript off and on; the roles reach every slide; a slide's class wins |
| `uv run tools/palette.py` | every palette passes every gate, with the same values as before |
| the art scripts' `--check` (`art:generated`) | unchanged files: the reference palette gives the same colours |
| the root's full validation | 8 of 8 |
| the talk's full validation | 23 of 23, with the print check and the smoke walk in three engines |
| the explorer page, built | Ledger's rule, and the class on `<html>` |

**Not checked:** the dev server with a palette other than Ledger (the builds
were checked); a dark palette's Slidev controls by eye.
