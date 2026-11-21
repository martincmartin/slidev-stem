// Slidev reads this file for every talk that uses the theme. It is `.mts`
// because the theme's package.json does not set "type": "module".
//
// The theme's dependencies (the Fontsource fonts) are installed by `pnpm install`
// at the repo root, in stem/node_modules. That is outside a talk, so without
// this file the dev server and `slidev export` refuse the font files (403) and
// show fallback fonts. `slidev build` does not check, so a built deck has them.
//
// The theme also loads every palette's rule, from ../palettes/. Slidev serves
// only the roots (this theme, the addons, the talk), and a talk loads one
// palette addon, so this file also allows the other palettes' directory.
//
// A build is minified, with source maps beside it: a reader who opens the
// browser's developer tools sees each file of the talk as written, with its
// comments; other readers download only the minified code
// (docs/talks.md, "Publish a talk"). The build also lists the third-party
// packages that it bundles, and their licences, in `licenses.txt`: the
// minifier removes their licence comments.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THEME = dirname(fileURLToPath(import.meta.url));
const PALETTES = join(THEME, "..", "palettes");
const { dependencies } = JSON.parse(
  readFileSync(join(THEME, "package.json"), "utf8"),
);

function installed(name: string): string {
  const link = join(THEME, "node_modules", name);
  if (!existsSync(link)) {
    throw new Error(
      `The theme needs ${name}: run \`pnpm install\` in the repo root (stem/).`,
    );
  }
  return realpathSync(link);
}

/** Slidev 53 writes the headmatter's `author` (and `info`, `keywords`) in
 *  a `<meta>` tag as a JSON string, in quotes, inside the attribute's own:
 *  `content="&quot;Ada&quot;"`. This takes the inner quotes off. */
const metaQuotes = {
  name: "house:meta-quotes",
  transformIndexHtml: {
    order: "post" as const,
    handler: (html: string): string =>
      html.replace(
        /(<meta name="(?:author|description|keywords)" content=")&quot;(.*?)&quot;"/g,
        '$1$2"',
      ),
  },
};

export default {
  plugins: [metaQuotes],
  build: {
    sourcemap: true,
    license: { fileName: "licenses.txt" },
  },
  server: {
    fs: {
      allow: [THEME, PALETTES, ...Object.keys(dependencies).map(installed)],
    },
  },
};
