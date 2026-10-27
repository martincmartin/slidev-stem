// Is what the audience and the readers see spelled right, in US English?
//
//     pnpm spellcheck watches watches/slides.md     # at the root
//
// It checks the text of a talk's deck files that shows: the slides, the
// speaker notes, the narration (the article, with each figure's alt text),
// and the frontmatter's shown values (`SHOWN_KEYS`). It leaves out the rest:
// the frontmatter's other values (piece names, settings), `<style>` and
// `<script>`, code, HTML tags and their attributes, Vue expressions, the
// comments that are neither the narration nor the speaker note, and the
// narration's markers. The house rule is in ../AGENTS.md, "Writing a talk".
//
// Two checkers read that text, and each finds what the other cannot:
//
// * cspell (US English) reports a word that is in none of its dictionaries:
//   a typo. It accepts British spellings ("colour", "centre").
// * codespell reports a British spelling (its `en-GB_to_en-US` list) and a
//   common misspelling. It does not know a new typo.
//
// Not an oversight: aspell and Harper were tried on the same text
// (2026-10-27). aspell found as much, but it is a system program that no
// lockfile pins. Harper found as much, with about 100 false reports.
//
// A word that is right but unknown (a name, a term) goes in the talk's
// `spelling-words.txt`, one a line, which cspell reads. The reports give each
// file's path and line, and the column in it.
//
// It cannot see text that a component or the talk's code writes (a slider's
// label, a button's word), nor a shown value that spans lines in the
// frontmatter. Slidev's own parser, the talk's version, splits each file into
// slides, so the talk must be installed. It exits 1 on a finding, and 2 on a
// usage error.

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import {
  mkdir,
  mkdtempDisposable,
  readFile,
  writeFile,
} from "node:fs/promises";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parseArgs } from "node:util";

const STEM = fileURLToPath(new URL("..", import.meta.url));
/** The talk's words that cspell does not know, one a line. */
const WORDS_FILE = "spelling-words.txt";
/** The frontmatter keys whose values show: on a slide, or in the article. */
const SHOWN_KEYS = new Set(["title", "author", "eyebrow", "history"]);
/** codespell's dictionaries: its common misspellings, its rare ones, and
 *  British spellings. */
const CODESPELL_DICTIONARIES = "clear,rare,en-GB_to_en-US";

/** A slide's place in its file, in lines from 0, as Slidev's parser gives
 *  it: its frontmatter from `start`, its content from `contentStart`, and its
 *  end before `end`. */
export interface SlideLines {
  readonly start: number;
  readonly contentStart: number;
  readonly end: number;
}

/** `source` with only the text that shows left in place, at its line and
 *  column. Every other character but a newline becomes a space. */
export function visibleText(
  source: string,
  slides: readonly SlideLines[],
): string {
  // one entry for each UTF-16 code unit, as the offsets below count: no match
  // starts or ends inside a character
  const units = source.split("");
  const shown: string[] = units.map((unit) => (unit === "\n" ? "\n" : " "));
  // the offset of each line's start, and the source's end for a line past it
  const lineStarts = [0];
  for (const match of source.matchAll(/\n/g)) {
    lineStarts.push(match.index + 1);
  }
  const offset = (line: number): number => lineStarts[line] ?? source.length;

  function keep(from: number, to: number): void {
    for (let index = from; index < to; index++)
      shown[index] = units[index] ?? " ";
  }
  function blank(from: number, to: number): void {
    for (let index = from; index < to; index++) {
      if (shown[index] !== "\n") shown[index] = " ";
    }
  }
  /** Blank each match of `pattern` in [from, to), but keep its group 1. */
  function blankMatches(from: number, to: number, pattern: RegExp): void {
    for (const match of source.slice(from, to).matchAll(pattern)) {
      const start = from + match.index;
      blank(start, start + match[0].length);
      const kept = match[1];
      if (kept !== undefined) {
        const keptStart = start + match[0].indexOf(kept);
        keep(keptStart, keptStart + kept.length);
      }
    }
  }

  for (const slide of slides) {
    const start = offset(slide.start);
    const contentStart = offset(slide.contentStart);
    const end = offset(slide.end);
    // a shown key's value, in its quotes if it has them
    const frontmatter =
      /^([A-Za-z]+):[ \t]*(?:"([^"\n]*)"|'([^'\n]*)'|(.*))$/gm;
    for (const match of source
      .slice(start, contentStart)
      .matchAll(frontmatter)) {
      const value = match[2] ?? match[3] ?? match[4];
      if (match[1] === undefined || !SHOWN_KEYS.has(match[1]) || !value) {
        continue;
      }
      const valueStart =
        start + match.index + match[0].indexOf(value, match[1].length + 1);
      keep(valueStart, valueStart + value.length);
    }

    keep(contentStart, end);
    const comments = [
      ...source.slice(contentStart, end).matchAll(/<!--[\s\S]*?-->/g),
    ];
    const last = comments.at(-1);
    for (const comment of comments) {
      const from = contentStart + comment.index;
      const to = from + comment[0].length;
      const narration = /^<!--\s*narration\s*\n/.exec(comment[0]);
      // Slidev's speaker note: the slide's last comment, with only space after
      const isNote =
        comment === last &&
        narration === null &&
        source.slice(to, end).trim() === "";
      if (narration === null && !isNote) {
        blank(from, to);
        continue;
      }
      blank(from, from + (narration?.[0].length ?? "<!--".length));
      blank(to - "-->".length, to);
      blankMatches(from, to, /\[click(?::\d+)?\]|\[nofigure\]|\[!aside\]/g);
      // a figure's marker, but not its alt text
      blankMatches(from, to, /\[figure[^\]:]*(?::\s*([^\]]*?))?\s*\]/g);
    }
    blankMatches(contentStart, end, /<(style|script)\b[\s\S]*?<\/\1>/g);
    blankMatches(contentStart, end, /^```[\s\S]*?^```/gm);
    blankMatches(contentStart, end, /`[^`\n]*`/g);
    // a tag, and its attributes, also one with a ">" in a quoted value
    blankMatches(
      contentStart,
      end,
      /<\/?[A-Za-z](?:[^>"']|"[^"]*"|'[^']*')*>/g,
    );
    blankMatches(contentStart, end, /\{\{[\s\S]*?\}\}/g);
  }
  return shown.join("");
}

function isSlideLines(value: unknown): value is SlideLines {
  if (typeof value !== "object" || value === null) return false;
  const lines = value as Record<string, unknown>;
  return ["start", "contentStart", "end"].every(
    (key) => typeof lines[key] === "number",
  );
}

/** The part of Slidev's parser that this reads: its types are the talk's,
 *  and the house does not depend on Slidev. */
interface SlidevParser {
  parseSync(source: string, file: string): unknown;
}

function isParser(module: unknown): module is SlidevParser {
  return (
    typeof module === "object" &&
    module !== null &&
    "parseSync" in module &&
    typeof module.parseSync === "function"
  );
}

/** Each slide's lines in `source`, as the talk's own Slidev parser reads
 *  them. */
async function slidesOf(talk: string, source: string): Promise<SlideLines[]> {
  const require = createRequire(resolve(talk, "package.json"));
  const parser: unknown = await import(
    pathToFileURL(require.resolve("@slidev/parser/core")).href
  );
  if (!isParser(parser)) {
    throw new Error(`${talk}'s @slidev/parser has no parseSync`);
  }
  const parsed = parser.parseSync(source, "slides.md");
  const slides =
    typeof parsed === "object" && parsed !== null && "slides" in parsed
      ? parsed.slides
      : undefined;
  if (!Array.isArray(slides) || !slides.every(isSlideLines)) {
    throw new Error(`${talk}'s @slidev/parser gave no slides' lines`);
  }
  return slides;
}

/** Run a checker in `directory`, with its output on ours. Whether it
 *  passed. */
function passes(command: string, args: string[], directory: string): boolean {
  const result = spawnSync(command, args, { cwd: directory, stdio: "inherit" });
  if (result.error) throw result.error;
  return result.status === 0;
}

async function main(): Promise<number> {
  const { positionals } = parseArgs({ allowPositionals: true });
  const [talk, ...files] = positionals;
  if (talk === undefined || files.length === 0) {
    console.error("usage: spellcheck.ts <talk> <deck file>...");
    return 2;
  }
  const missing = [join(talk, "package.json"), ...files].filter(
    (path) => !existsSync(path),
  );
  if (missing.length > 0) {
    console.error(`no such file: ${missing.join(", ")}`);
    return 2;
  }
  // Each file's text goes to its path from stem/, under a directory of its
  // own, so that each checker reports the file's own path and line.
  const paths = files.map((file) => relative(STEM, resolve(file)));
  const outside = files.filter((_, index) => paths[index]?.startsWith(".."));
  if (outside.length > 0) {
    console.error(`not in ${STEM}: ${outside.join(", ")}`);
    return 2;
  }

  await using work = await mkdtempDisposable(join(tmpdir(), "spellcheck-"));
  for (const [index, file] of files.entries()) {
    const source = await readFile(file, "utf8");
    const out = join(work.path, paths[index] ?? file);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, visibleText(source, await slidesOf(talk, source)));
  }
  const words = resolve(talk, WORDS_FILE);
  const config = join(work.path, "cspell.json");
  await writeFile(
    config,
    JSON.stringify({
      version: "0.2",
      language: "en-US",
      ...(existsSync(words) && {
        dictionaryDefinitions: [{ name: "talk", path: words }],
        dictionaries: ["talk"],
      }),
    }),
  );

  const cspell = passes(
    join(STEM, "node_modules", ".bin", "cspell"),
    ["--config", config, "--no-progress", "--no-summary", ...paths],
    work.path,
  );
  const codespell = passes(
    "uv",
    [
      ...["run", "--quiet", "--locked", "--project", STEM],
      ...["codespell", "--builtin", CODESPELL_DICTIONARIES, ...paths],
    ],
    work.path,
  );
  if (!cspell || !codespell) return 1;
  console.log(`ok    ${paths.join(", ")}: no unknown or British spelling`);
  return 0;
}

if (import.meta.main) process.exitCode = await main();
