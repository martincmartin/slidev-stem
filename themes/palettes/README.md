# Palettes — the colours of the house theme

Each directory here is one colour palette for the house theme
([`../house/`](../house/README.md)), as a Slidev addon,
`slidev-addon-palette-<name>`. A talk loads one of them:

```yaml
# in a talk's slides.md headmatter
theme: house
colorSchema: dark # the palette's paper: light or dark
addons:
  - palette-campfire
```

| file           | what                                                                                                                      |
| -------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `palette.css`  | one rule that sets every `--palette-*` role, and why each value is what it is. The house theme loads every palette's rule |
| `index.html`   | `<html class="palette-<name>">`: makes the palette the talk's                                                             |
| `package.json` | the addon's package                                                                                                       |

The palettes, their gates, how to add one, and why Ledger is the reference
palette: [`docs/theme.md`](../../docs/theme.md), "Palettes". `uv run
tools/palette.py` (in `stem/`) measures every palette against every gate.
