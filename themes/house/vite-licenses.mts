// The build's list of third-party licences (`build.license`), made whole.
// Vite lists the packages whose code the JavaScript bundles, so it leaves
// out the fonts, which the CSS brings in (Fontsource, under the SIL Open
// Font License). It also lists the talk itself, as a package with no
// licence text. This plugin runs after Vite's, adds the package of each
// file that the build copies from node_modules, such as a font, in Vite's
// format, and drops the talk's own entry (docs/talks.md, "Publish a talk").
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import type { Plugin } from "vite";

interface PackageInfo {
  readonly name: string;
  readonly version: string;
  readonly license: string | null;
  readonly dir: string;
}

/** The package that holds `file`: the nearest package.json with a name. */
function packageOf(file: string): PackageInfo | null {
  for (let dir = dirname(file); dir !== dirname(dir); dir = dirname(dir)) {
    const manifest = join(dir, "package.json");
    if (!existsSync(manifest)) continue;
    const data: unknown = JSON.parse(readFileSync(manifest, "utf8"));
    if (typeof data !== "object" || data === null) continue;
    const { name, version, license } = data as Record<string, unknown>;
    if (typeof name !== "string") continue;
    return {
      name,
      version: typeof version === "string" ? version : "0.0.0",
      license: typeof license === "string" ? license : null,
      dir,
    };
  }
  return null;
}

/** An entry in Vite's format: a heading, then the package's licence file. */
function entry(info: PackageInfo): string {
  const heading = `## ${info.name} - ${info.version}${info.license ? ` (${info.license})` : ""}`;
  const file = readdirSync(info.dir).find((name) =>
    /^(licen[cs]e|copying)/i.test(name),
  );
  const text = file ? readFileSync(join(info.dir, file), "utf8").trim() : "";
  return text ? `\n${heading}\n\n${text}\n` : `\n${heading}\n`;
}

/** `fileName`: the list's name in the build, as `build.license` gives it. */
export function completeLicenses(fileName: string): Plugin {
  let root = "";
  return {
    name: "house:complete-licenses",
    configResolved(config) {
      root = config.root;
    },
    generateBundle: {
      // after Vite's own list
      order: "post",
      handler(_, bundle) {
        const list = bundle[fileName];
        if (list?.type !== "asset" || typeof list.source !== "string") return;
        let text = list.source;
        const own = packageOf(join(root, "package.json"));
        if (own) {
          const heading = `\n## ${own.name} - ${own.version}`;
          const start = text.indexOf(heading);
          if (start >= 0) {
            const next = text.indexOf("\n## ", start + heading.length);
            text = text.slice(0, start) + (next >= 0 ? text.slice(next) : "\n");
          }
        }
        const added = new Map<string, PackageInfo>();
        for (const output of Object.values(bundle)) {
          if (output.type !== "asset") continue;
          for (const original of output.originalFileNames) {
            if (!original.includes(`${sep}node_modules${sep}`)) continue;
            const info = packageOf(original);
            if (!info) continue;
            const key = `${info.name}@${info.version}`;
            if (!text.includes(`\n## ${info.name} - ${info.version}`)) {
              added.set(key, info);
            }
          }
        }
        for (const key of [...added.keys()].sort()) {
          const info = added.get(key);
          if (info) text += entry(info);
        }
        list.source = text;
      },
    },
  };
}
