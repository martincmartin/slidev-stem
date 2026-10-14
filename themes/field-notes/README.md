# Field Notes: a house Slidev theme

A light theme: notebook cream paper, ink-blue accent, moss-green second, with Ledger's type (Fraunces titles,
IBM Plex text). It is Ledger with another palette: it loads Ledger's styles,
layouts, setup and Vite config from [`../ledger/`](../ledger/README.md), and sets only
the colour roles in `styles/field-notes.css`.

```yaml
# in a talk's slides.md headmatter
theme: field-notes
```

The talk's `package.json` links it, as it links Ledger:

```json
"dependencies": { "slidev-theme-field-notes": "link:../themes/field-notes" }
```

Its values and its gates are in [`docs/theme.md`](../../docs/theme.md), "The
house themes"; `uv run tools/palette.py` (in `stem/`) measures them.
