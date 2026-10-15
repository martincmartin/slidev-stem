// A slide's history line, from its frontmatter.

import assert from "node:assert/strict";
import { test } from "node:test";
import { historyOf } from "./history.ts";

test("the history line is the frontmatter's text, or null", () => {
  assert.equal(historyOf({ history: " c. 1430 " }), "c. 1430");
  assert.equal(historyOf({}), null);
});

test("a history line that is not text is an error", () => {
  assert.throws(() => historyOf({ history: 1675 }), /quote a bare year/);
  assert.throws(() => historyOf({ history: "" }), /not a line of text/);
});
