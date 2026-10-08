// Every slide's watch, as slides.md names it: each piece and view exists, at
// every click. A name that is wrong would otherwise throw only when the
// slide shows.

import assert from "node:assert/strict";
import { test } from "node:test";
import { deckSlides } from "./deck.ts";
import { generate } from "./generate.ts";
import { moveWithBefore, stageState, watchState } from "./state.ts";

const watch = generate();
const slides = await deckSlides();

test("every slide's pieces and view exist, at every click", () => {
  let shown = 0;
  for (const { title, frontmatter } of slides) {
    const clicks = Number(frontmatter["clicks"] ?? 0);
    for (let click = 0; click <= clicks; click++) {
      const state = watchState(frontmatter, click);
      if (!state) continue;
      shown++;
      const stage = stageState(watch, state, moveWithBefore(frontmatter));
      assert.ok(stage.shown.size > 0, `${title} @${String(click)}`);
    }
  }
  assert.ok(shown > 0, "no slide shows the watch");
});
