// A slide's history line: when its subject became practical ("c. 1430").
// The speaker does not say it. The slide shows it in a corner (the talk's slide-top.vue), and the article under the slide's
// heading (docs/slide-patterns.md, "The history line").

/** The frontmatter key. */
export const HISTORY_KEY = "history";

/** The slide's history line, or `null` if it has none. Throws if the value is
 *  not a string with text: YAML reads `history: 1675` as a number, and the
 *  line would show nothing. */
export function historyOf(frontmatter: Record<string, unknown>): string | null {
  const value = frontmatter[HISTORY_KEY];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${HISTORY_KEY}: ${JSON.stringify(value)} is not a line of text; quote a bare year ("1675")`,
    );
  }
  return value.trim();
}
