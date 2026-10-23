// Does a Vue component keep the class and v-click that a slide gives it, and
// is each lint disable in its template narrow?
//
//     pnpm vuecheck watches                  # at the root
//     pnpm vuecheck themes path/to/One.vue
//
// **The root.** A comment beside the one root element of a component's
// template (before it or after it) makes a second root in a production build.
// Vue then drops the `class`, `v-click` and other attributes that a slide
// gives the component, with no error. `slidev dev` hides this: its Vue treats
// the comment as no root. So the slide is right in dev and wrong in every
// build (the `slidev-practices` skill, "Clicks, slides and going back"). Put
// the comment inside the root element.
//
// A template with more than one root (an element or text) is not checked: Vue
// gives a slide's attributes to none of its roots, with or without a comment.
// A `v-else` or `v-else-if` element is the same root as the element before
// it.
//
// **Lint disables in a template.** ESLint's comment rules read only script
// comments, so this does what they do for the template's
// `<!-- eslint-... -->`: each disable names its rules and gives a reason after
// `--`, and a block disable (`eslint-disable`) has a later `eslint-enable` for
// each of its rules, even at the end of the template. ESLint itself reports a
// disable that suppresses nothing (`vue/comment-directive`). See
// docs/talks.md, "Check your work".
//
// Vue's own parser (@vue/compiler-sfc, the root's version) reads the
// component, as a build does. A component that it cannot parse fails, as the
// build does. It checks each `.vue` file in the paths, apart from
// `node_modules/`, `dist/`, `tasks/`, hidden directories and hidden files. It
// exits 1 on a failure, and 2 on a usage error.

import { existsSync } from "node:fs";
import { glob, readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { NodeTypes } from "@vue/compiler-core";
import type { TemplateChildNode } from "@vue/compiler-core";
import { parse } from "@vue/compiler-sfc";

const SKIPPED_DIRECTORIES = new Set(["node_modules", "dist", "tasks"]);
const ELSE_BRANCHES = new Set(["else", "else-if"]);
// `eslint-disable`, `eslint-disable-next-line`, `eslint-enable`, ...: the
// kind, then the rules, then " -- " and the reason.
const DIRECTIVE = /^eslint-(disable|enable)(-next-line|-line)?(?:\s+(.*))?$/s;

/** What is wrong with a component. `describe` gives it as text. */
type Problem =
  | {
      readonly kind: "unparsed";
      readonly line: number | undefined;
      readonly message: string;
    }
  | { readonly kind: "root comment"; readonly comment: string }
  | { readonly kind: "no rule"; readonly directive: string }
  | { readonly kind: "no reason"; readonly directive: string }
  | {
      readonly kind: "no enable";
      readonly directive: string;
      readonly rule: string;
    };

/** The `.vue` files in `paths`, apart from the skipped directories. A path
 *  that is a file is read whatever its name. */
export async function vueFiles(paths: readonly string[]): Promise<string[]> {
  const found = new Set<string>();
  for (const path of paths) {
    if ((await stat(path)).isFile()) {
      found.add(path);
      continue;
    }
    // `exclude` gets each entry's name, and does not go into an excluded
    // directory
    const files = glob("**/*.vue", {
      cwd: path,
      exclude: (name) => SKIPPED_DIRECTORIES.has(name) || name.startsWith("."),
    });
    for await (const file of files) found.add(join(path, file));
  }
  return [...found].sort();
}

/** The comments in `nodes` and in all the elements in them, in order. */
function* comments(nodes: readonly TemplateChildNode[]): Generator<string> {
  for (const node of nodes) {
    if (node.type === NodeTypes.COMMENT) yield node.content.trim();
    else if (node.type === NodeTypes.ELEMENT) yield* comments(node.children);
  }
}

/** Whether `node`, at the top of a template, is a root of its own: not a
 *  comment, and not the `v-else` branch of the element before it. */
function isRoot(node: TemplateChildNode): boolean {
  if (node.type === NodeTypes.COMMENT) return false;
  return !(
    node.type === NodeTypes.ELEMENT &&
    node.props.some(
      (prop) =>
        prop.type === NodeTypes.DIRECTIVE && ELSE_BRANCHES.has(prop.name),
    )
  );
}

/** What is wrong with the lint disables in a template's comments, given in
 *  order. */
export function directiveProblems(
  templateComments: Iterable<string>,
): Problem[] {
  const found: Problem[] = [];
  const open = new Map<string, string>(); // a block disable's rule: its comment
  for (const directive of templateComments) {
    const match = DIRECTIVE.exec(directive);
    if (!match) continue;
    const [, kind, scope, rest = ""] = match;
    const dashes = rest.indexOf("--");
    const names = dashes < 0 ? rest : rest.slice(0, dashes);
    const reason = dashes < 0 ? "" : rest.slice(dashes + 2);
    const rules = names
      .split(",")
      .map((rule) => rule.trim())
      .filter((rule) => rule !== "");
    if (kind === "enable") {
      if (rules.length === 0) open.clear();
      for (const rule of rules) open.delete(rule);
      continue;
    }
    if (rules.length === 0) found.push({ kind: "no rule", directive });
    if (reason.trim() === "") found.push({ kind: "no reason", directive });
    if (scope === undefined) {
      for (const rule of rules) open.set(rule, directive);
    }
  }
  for (const [rule, directive] of open) {
    found.push({ kind: "no enable", directive, rule });
  }
  return found;
}

/** What is wrong with the component `file`, whose source is `text`. */
export function problems(file: string, text: string): Problem[] {
  const { descriptor, errors } = parse(text, {
    filename: file,
    // Vue's production build (NODE_ENV=production) drops them by default
    templateParseOptions: { comments: true },
  });
  if (errors.length > 0) {
    return errors.map((error) => ({
      kind: "unparsed",
      line: "loc" in error ? error.loc.start.line : undefined,
      message: error.message,
    }));
  }
  const nodes = descriptor.template?.ast?.children ?? [];
  const found = directiveProblems(comments(nodes));
  const besideRoot = nodes.find((node) => node.type === NodeTypes.COMMENT);
  if (nodes.filter(isRoot).length === 1 && besideRoot) {
    found.unshift({ kind: "root comment", comment: besideRoot.content.trim() });
  }
  return found;
}

/** `problem`, in the component `file`, as a line of text. */
function describe(file: string, problem: Problem): string {
  switch (problem.kind) {
    case "unparsed": {
      const where =
        problem.line === undefined ? file : `${file}:${String(problem.line)}`;
      return `${where}: Vue cannot parse it: ${problem.message}`;
    }
    case "root comment":
      return (
        `${file}: a comment beside the root element of its template ` +
        `(${JSON.stringify(problem.comment)}): a build drops the class and ` +
        "v-click that a slide gives the component; put the comment inside " +
        "the root element"
      );
    case "no rule":
      return `${file}: <!-- ${problem.directive} --> names no rule: name each rule`;
    case "no reason":
      return `${file}: <!-- ${problem.directive} --> gives no reason after ' -- '`;
    case "no enable":
      return (
        `${file}: <!-- ${problem.directive} --> has no later eslint-enable ` +
        `for ${problem.rule}: enable it where the exception ends, even at ` +
        "the end of the template"
      );
  }
}

if (import.meta.main) {
  const usage = "usage: pnpm vuecheck PATH...  (directories or .vue files)";
  let paths: string[] = [];
  try {
    paths = parseArgs({ allowPositionals: true }).positionals;
  } catch (error) {
    console.error(`${String(error)}\n${usage}`);
    process.exit(2);
  }
  if (paths.length === 0) {
    console.error(usage);
    process.exit(2);
  }
  const missing = paths.filter((path) => !existsSync(path));
  if (missing.length > 0) {
    console.error(`${missing.join(", ")}: no such path`);
    process.exit(2);
  }
  const files = await vueFiles(paths);
  let failed = false;
  for (const file of files) {
    for (const problem of problems(file, await readFile(file, "utf8"))) {
      console.log(`FAIL  ${describe(file, problem)}`);
      failed = true;
    }
  }
  if (failed) {
    process.exitCode = 1;
  } else {
    console.log(
      `ok    ${String(files.length)} component(s): no comment beside a ` +
        "single root; each lint disable is narrow, named and explained",
    );
  }
}
