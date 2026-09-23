# Ledger — the house Slidev theme

The look of every STEM talk in this repo: warm cream, deep blue, warm brown,
with Fraunces titles and IBM Plex body text.

```yaml
# in a talk's slides.md headmatter
theme: ledger
```

and in the talk's `package.json`:

```json
"dependencies": { "slidev-theme-ledger": "workspace:*" }
```

## What it sets

| file                | what                                                                                        |
| ------------------- | ------------------------------------------------------------------------------------------- |
| `package.json`      | the font families for Slidev, with `provider: none` (no web-font service); light only       |
| `styles/fonts.css`  | the self-hosted font weights, from Fontsource                                               |
| `styles/ledger.css` | the seven `--palette-*` palette variables, background and ink on every slide; `h1`; `cover` |
| `styles/index.ts`   | Slidev's base layout styles, then the two files above                                       |

Layouts come from Slidev's core (`default`, `cover`, `full` and 18 others). The
theme adds none yet.

## Rules

- **The palette is set here and nowhere else.** The values and the reasoning
  behind them are in `watches/docs/theme.md`; `watches/tools/lib.py` holds the
  same values, and `python3 watches/tools/palette.py` fails if the two differ.
  Moving the gates and docs up to the repo level is future work.
- **No outside requests.** A talk must run on a laptop with no network. Fonts
  come from Fontsource packages. A font that is not on Fontsource and is not one
  of the 14 fonts every Mac and Windows laptop has: ask first.
- **Import only the font weights the talks use** (`styles/fonts.css`). A missing
  weight fails silently: the browser uses the nearest weight or fakes a bold.

Why Ledger is a theme, and the options considered:
`tasks/2026-09-23-house-theme/PLAN.md`.
