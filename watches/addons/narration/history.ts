// A slide's history line: when its subject became practical ("c. 1430"). The
// speaker does not say it. The slide shows it in a corner (the talk's
// slide-top.vue), and the article under the slide's heading
// (docs/slide-patterns.md, "The history line").

import { frontmatterText } from "./frontmatter.ts";

/** The frontmatter key. */
const HISTORY_KEY = "history";

/** The slide's history line, or `null` if it has none. Throws if the value is
 *  not a string with text: YAML reads `history: 1675` as a number, and the
 *  line would show nothing. */
export function historyOf(frontmatter: Record<string, unknown>): string | null {
  return frontmatterText(
    frontmatter,
    HISTORY_KEY,
    '; quote a bare year ("1675")',
  );
}
