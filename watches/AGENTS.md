# watches — agent instructions

These are in addition to `../AGENTS.md`, which covers the series, pnpm and
formatting.

## `.prettierrc` must list every deck file

`.prettierrc` routes Slidev decks through `prettier-plugin-slidev` (the
`parser: "slidev"` override) and leaves ordinary Markdown on Prettier's normal
Markdown parser. That split is load-bearing: Prettier's Markdown parser reads a
deck's per-slide frontmatter as a thematic break followed by a paragraph, so it
inserts a blank line after the `---` and strips the indentation off nested YAML
keys — silently breaking the slide.

So if you add a new deck whose filename does not already match the override
globs (`slides.md`, `slides-*.md`, `torture.md`, `pages/*.md`), add its
filename to the `files` array in `.prettierrc` in the same change. Formatting a
deck without that entry corrupts it.
