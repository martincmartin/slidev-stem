# Electric Terracotta: a house Slidev theme

A light theme: peach paper, terracotta accent, indigo second, with Ledger's type (Fraunces titles,
IBM Plex text). It is Ledger with another palette: it loads Ledger's styles,
setup and Vite config from [`../ledger/`](../ledger/README.md), and sets only
the colour roles in `styles/electric-terracotta.css`.

```yaml
# in a talk's slides.md headmatter
theme: electric-terracotta
```

The talk's `package.json` links it, as it links Ledger:

```json
"dependencies": { "slidev-theme-electric-terracotta": "link:../themes/electric-terracotta" }
```

Its values and its gates are in [`docs/theme.md`](../../docs/theme.md), "The
house themes"; `uv run tools/palette.py` (in `stem/`) measures them.
