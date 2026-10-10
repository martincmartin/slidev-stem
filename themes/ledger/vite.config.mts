// Slidev reads this file for every talk that uses the theme. It is `.mts`
// because the theme's package.json does not set "type": "module".
//
// The theme's dependencies (the Fontsource fonts) are installed by `pnpm install`
// at the repo root, in stem/node_modules. That is outside a talk, so without
// this file the dev server and `slidev export` refuse the font files (403) and
// show fallback fonts. `slidev build` does not check, so a built deck has them.
//
// The other house themes (campfire, beacon, ...) are built on Ledger: they
// import its styles and re-export this file. Slidev serves only the active
// theme's directory, so this file also allows Ledger's own.
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const THEME = dirname(fileURLToPath(import.meta.url));
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

export default {
  server: {
    fs: { allow: [THEME, ...Object.keys(dependencies).map(installed)] },
  },
};
