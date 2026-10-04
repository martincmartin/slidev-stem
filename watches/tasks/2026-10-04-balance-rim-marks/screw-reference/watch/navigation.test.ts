import assert from "node:assert/strict";
import { test } from "node:test";
import { moveOf } from "./navigation.ts";

test("a step is one click, or the next or the previous slide", () => {
  assert.equal(
    moveOf({ slide: 2, clicks: 1 }, { slide: 2, clicks: 2 }),
    "forward",
  );
  assert.equal(
    moveOf({ slide: 2, clicks: 4 }, { slide: 3, clicks: 0 }),
    "forward",
  );
  assert.equal(
    moveOf({ slide: 3, clicks: 0 }, { slide: 2, clicks: 4 }),
    "back",
  );
  assert.equal(
    moveOf({ slide: 2, clicks: 2 }, { slide: 2, clicks: 1 }),
    "back",
  );
});

test("anything else is a jump, and so is the first place", () => {
  assert.equal(moveOf(undefined, { slide: 2, clicks: 0 }), "jump");
  assert.equal(
    moveOf({ slide: 1, clicks: 0 }, { slide: 4, clicks: 0 }),
    "jump",
  );
  assert.equal(
    moveOf({ slide: 2, clicks: 0 }, { slide: 2, clicks: 3 }),
    "jump",
  );
});
