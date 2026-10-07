# Ledger — the house Slidev theme

The look of every STEM talk in this repo: warm cream, deep blue, warm brown,
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

| file                | what                                                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `package.json`      | the font families for Slidev, with `provider: none` (no web-font service); light only                                     |
| `styles/fonts.css`  | the self-hosted font weights, from Fontsource                                                                             |
| `styles/ledger.css` | the ten `--palette-*` variables, background and ink on every slide; `h1`; the subtitle (`h1 + p`); `cover`                |
| `vite.config.mts`   | lets a talk's dev server and `slidev export` serve the fonts, which `pnpm install` at the repo root puts outside the talk |
| `styles/index.ts`   | Slidev's base layout styles, then the two files above                                                                     |

Layouts come from Slidev's core (`default`, `cover`, `full` and 18 others). The
theme adds none yet.

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
