// The build's list of third-party licences, made whole. Vite lists the
// packages whose code the JavaScript bundles (`build.license`, as JSON), so
// it leaves out the fonts, which the CSS brings in (Fontsource, under the SIL
// Open Font License). It also lists the talk itself, as a package with no
// licence text. This plugin runs after Vite's: it drops the talk's own entry,
// adds the package of each file that the build copies from node_modules, such
// as a font, and writes the list in Vite's Markdown format, in place of the
// JSON (docs/talks.md, "Publish a talk").
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, sep } from "node:path";
import type { Plugin } from "vite";

/** A package's entry, as Vite's JSON list gives it. */
interface LicenseEntry {
  readonly name: string;
  readonly version: string;
  readonly identifier?: string;
  readonly text?: string;
}

function isLicenseEntry(value: unknown): value is LicenseEntry {
  if (typeof value !== "object" || value === null) return false;
  const { name, version, identifier, text } = value as Record<string, unknown>;
  return (
    typeof name === "string" &&
    typeof version === "string" &&
    (identifier === undefined || typeof identifier === "string") &&
    (text === undefined || typeof text === "string")
  );
}

/** The entry of the package that holds `file`: the nearest package.json
 *  with a name, and its licence file, as Vite finds them. */
function entryOf(file: string): LicenseEntry | null {
  for (let dir = dirname(file); dir !== dirname(dir); dir = dirname(dir)) {
    const manifest = join(dir, "package.json");
    if (!existsSync(manifest)) continue;
    const data: unknown = JSON.parse(readFileSync(manifest, "utf8"));
    if (typeof data !== "object" || data === null) continue;
    const { name, version, license } = data as Record<string, unknown>;
    if (typeof name !== "string") continue;
    const licenseFile = readdirSync(dir).find((each) =>
      /^(licen[cs]e|copying)/i.test(each),
    );
    const text = licenseFile
      ? readFileSync(join(dir, licenseFile), "utf8").trim()
      : "";
    return {
      name,
      version: typeof version === "string" ? version : "0.0.0",
      ...(typeof license === "string" ? { identifier: license.trim() } : {}),
      ...(text ? { text } : {}),
    };
  }
  return null;
}

/** The list in Vite's Markdown format. */
function markdown(entries: readonly LicenseEntry[]): string {
  let text =
    "# Licenses\n\nThe app bundles dependencies which contain the following licenses:\n";
  for (const entry of entries) {
    const identifier = entry.identifier ? ` (${entry.identifier})` : "";
    text += `\n## ${entry.name} - ${entry.version}${identifier}\n`;
    if (entry.text) text += `\n${entry.text}\n`;
  }
  return text;
}

/** `jsonName`: Vite's list in the build (`build.license.fileName`, which
 *  must end in `.json`); `fileName`: the list that this writes. */
export function completeLicenses(jsonName: string, fileName: string): Plugin {
  if (!jsonName.endsWith(".json")) {
    throw new Error(`completeLicenses: ${jsonName} is not a .json name`);
  }
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
        const list = bundle[jsonName];
        if (list?.type !== "asset" || typeof list.source !== "string") return;
        const parsed: unknown = JSON.parse(list.source);
        if (!Array.isArray(parsed) || !parsed.every(isLicenseEntry)) {
          throw new Error(`${jsonName}: not a list of Vite's licence entries`);
        }
        const own = entryOf(join(root, "package.json"));
        const key = (entry: LicenseEntry): string =>
          `${entry.name}@${entry.version}`;
        const listed = parsed.filter(
          (entry) => !own || key(entry) !== key(own),
        );
        const seen = new Set(parsed.map(key));
        const added = new Map<string, LicenseEntry>();
        for (const output of Object.values(bundle)) {
          if (output.type !== "asset") continue;
          for (const original of output.originalFileNames) {
            if (!original.includes(`${sep}node_modules${sep}`)) continue;
            const entry = entryOf(original);
            if (entry && !seen.has(key(entry))) added.set(key(entry), entry);
          }
        }
        const extra = [...added.keys()]
          .sort()
          .flatMap((each) => added.get(each) ?? []);
        delete bundle[jsonName];
        this.emitFile({
          type: "asset",
          fileName,
          source: markdown([...listed, ...extra]),
        });
      },
    },
  };
}
