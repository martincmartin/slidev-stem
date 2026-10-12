# Ledger — the house Slidev theme

The look of every STEM talk in this repo: warm cream, deep blue, burnt orange,
with Fraunces titles and IBM Plex body text.

```yaml
# in a talk's slides.md headmatter
theme: ledger
```

and in the talk's `package.json`:

```json
"dependencies": { "slidev-theme-ledger": "link:../themes/ledger" }
```

## What it sets

| file                  | what                                                                                                                                                     |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `package.json`        | the font families for Slidev, with `provider: none` (no web-font service); light only                                                                    |
| `styles/fonts.css`    | the self-hosted font weights, from Fontsource                                                                                                            |
| `styles/ledger.css`   | the ten `--palette-*` variables, background and ink on every slide; `h1`; the subtitle (`h1 + p`); cover and section type; shared `cover-left` placement |
| `styles/palettes.css` | the palette classes (`class: palette-campfire`): other palettes for any slide, one for each house theme; `palette-preview`                               |
| `vite.config.mts`     | lets a talk's dev server and `slidev export` serve the fonts, which `pnpm install` at the repo root puts outside the talk                                |
| `styles/index.ts`     | Slidev's base layout styles, `fonts.css`, `ledger.css`, `palettes.css`                                                                                   |

Most layouts come from Slidev's core. The theme provides `layouts/section.vue`.
Use a Markdown title with `layout: section` and an optional `eyebrow: PART 1`.
The section applies `cover-left`, which also positions covers with
`class: cover-left`. This class holds the shared alignment and text width.
Type sizes and spacing are in `styles/ledger.css`; font weights are in `styles/fonts.css`.
The eyebrow uses `--palette-ink`. Illustrations remain the talk's responsibility.

## The themes built on Ledger

The other house themes (`campfire`, `after-hours`, `beacon`, `kraft-ink`,
`field-notes`, `electric-terracotta`, in `../`) are Ledger with another palette.
Each loads this theme's `styles/index.ts`, `setup/root.ts` and
`vite.config.mts`, and sets only its colour roles. So a change here reaches
every house theme: before you change this theme, find the talks in progress
that use any of them. How they are made, and how a talk changes its theme:
[`docs/theme.md`](../../docs/theme.md), "The house themes".

## Rules

- **The palette is set here and nowhere else.** How to make a theme, the
  roles, their gates and why Ledger meets them are in
  [`docs/theme.md`](../../docs/theme.md) at the repo root. A value is a hex
  colour, `var()` of another role, or `color-mix()` of those. `tools/lib.py` there reads the values from `styles/ledger.css`,
  and `uv run tools/palette.py` measures them against their gates. A talk may
  change a role only for a slide class (`.slidev-layout.<class>`); `palette.py
--talk <talk>` fails on any other rule.
- **No outside requests.** A talk must run on a laptop with no network. Fonts
  come from Fontsource packages. A font that is not on Fontsource and is not one
  of the 14 fonts every Mac and Windows laptop has: ask first.
- **Import only the font weights the talks use** (`styles/fonts.css`). A missing
  weight fails silently: the browser uses the nearest weight or fakes a bold.

Why Ledger is a theme, and the options considered:
`tasks/2026-09-23-house-theme/PLAN.md`.
