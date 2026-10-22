# House — the Slidev theme of the STEM talks

The structure of every STEM talk in this repo: its layouts, its type (Fraunces
titles, IBM Plex body text) and its setup. It holds no colours: a talk's
colours come from a palette, an addon in [`../palettes/`](../palettes/).

```yaml
# in a talk's slides.md headmatter
theme: house
colorSchema: light # the palette's paper: light or dark
addons:
  - palette-ledger
```

and in the talk's `package.json`:

```json
"dependencies": {
  "slidev-theme-house": "link:../themes/house",
  "slidev-addon-palette-ledger": "link:../themes/palettes/ledger"
}
```

How the theme and the palettes fit together, and how a talk changes its
palette: [`docs/theme.md`](../../docs/theme.md), "Palettes".

## What it sets

- `package.json`: the font families for Slidev, with `provider: none` (no
  web-font service)
- `styles/fonts.css`: the self-hosted font weights, from Fontsource
- `styles/house.css`: background and ink on every slide, from the palette's
  roles; `h1`; the subtitle (`h1 + p`); cover and section type; their placement
  (`side-center`, `side-left`); `palette-preview`; a click on the letterbox
  goes to the page under it
- `styles/index.ts`: Slidev's base layout styles, `fonts.css`, `house.css`, and
  every palette's rule, so that any slide can show any palette
- `layouts/`: `cover.vue`, `section.vue`
- `utils/side.ts`: the title layouts' `side`: its values, and the check
- `setup/root.ts`: the navigation probe that the smoke check reads, and a
  mouse click on the slide goes forward
  ([`docs/navigation.md`](../../docs/navigation.md))
- `vite.config.mts`: lets a talk's dev server and `slidev export` serve the
  fonts, which `pnpm install` at the repo root puts outside the talk, and the
  palettes

Most layouts come from Slidev's core. The theme provides two title layouts,
`cover` (in place of Slidev's) and `section`: a part's title, with an optional
`eyebrow: PART 1` above it. Both centre their text. With `side: left`, the
text sits on the left, at most 480 px wide, beside an illustration on the
right. `utils/side.ts` checks the value: with any other side the slide shows
nothing, and the browser's console says why.
Type sizes and spacing are in `styles/house.css`; font weights are in `styles/fonts.css`.
The eyebrow uses `--palette-ink`. Illustrations remain the talk's responsibility.

## Rules

- **No colour here.** The `--palette-*` roles are set only in the palettes
  (`../palettes/<name>/palette.css`); this theme only uses them.
  `tools/test_lib.py` fails if a file here sets one. How to make a palette,
  the roles and their gates are in [`docs/theme.md`](../../docs/theme.md) at
  the repo root.
- **A change here reaches every talk.** Before you change this theme, find the
  talks in progress.
- **No outside requests.** A talk must run on a laptop with no network. Fonts
  come from Fontsource packages. A font that is not on Fontsource and is not one
  of the 14 fonts every Mac and Windows laptop has: ask first.
- **Import only the font weights the talks use** (`styles/fonts.css`). A missing
  weight fails silently: the browser uses the nearest weight or fakes a bold.

Why the house look is a theme: `tasks/2026-09-23-house-theme/PLAN.md`. Why the
theme holds no colours, and each palette is an addon:
`tasks/2026-10-14-palette-addons/PLAN.md`.
