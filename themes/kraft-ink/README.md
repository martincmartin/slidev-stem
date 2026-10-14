# Kraft & Ink: a house Slidev theme

A light theme: manila paper, petrol-blue accent, tomato second, with Ledger's type (Fraunces titles,
IBM Plex text). It is Ledger with another palette: it loads Ledger's styles,
layouts, setup and Vite config from [`../ledger/`](../ledger/README.md), and sets only
the colour roles in `styles/kraft-ink.css`.

```yaml
# in a talk's slides.md headmatter
theme: kraft-ink
```

The talk's `package.json` links it, as it links Ledger:

```json
"dependencies": { "slidev-theme-kraft-ink": "link:../themes/kraft-ink" }
```

Its values and its gates are in [`docs/theme.md`](../../docs/theme.md), "The
house themes"; `uv run tools/palette.py` (in `stem/`) measures them.
