// A line of text from a slide's frontmatter that a reader sees: the history
// line (history.ts), or the slide's title in the article (plan.ts).

/** The text of the frontmatter's `key`, trimmed, or `null` if the slide does
 *  not set it. Throws if the value is not a string with text: YAML reads a
 *  bare `1675` as a number, and the page would show nothing. `hint` ends the
 *  error's message. */
export function frontmatterText(
  frontmatter: Record<string, unknown>,
  key: string,
  hint = "",
): string | null {
  const value = frontmatter[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${key}: ${JSON.stringify(value)} is not a line of text${hint}`,
    );
  }
  return value.trim();
}
