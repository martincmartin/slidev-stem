# watches — agent instructions

These are in addition to the presentation guidance in `../AGENTS.md`.

## Use pnpm, not npm or yarn

pnpm is the package manager for this project, because it is what Slidev's
authors recommend. Use it for everything:

```bash
pnpm install          # not `npm install`
pnpm add -D <pkg>     # not `npm i -D <pkg>`
pnpm dev              # not `npm run dev`
```

`pnpm-lock.yaml` is the lockfile of record. Never create or commit a
`package-lock.json`.

## Format after editing any file

After editing **any** file, run Prettier before you finish:

```bash
pnpm format           # prettier --write .
```

`pnpm format:check` (`prettier --check .`) verifies formatting without
writing, which is the one to run in CI or when you only want to know whether
something is out of shape.

### Why this matters more than usual here

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
