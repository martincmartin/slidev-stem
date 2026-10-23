import assert from "node:assert/strict";
import { test } from "node:test";
import { rapidWalk } from "./offline-check.ts";
import type { Walkable } from "./offline-check.ts";

/** A page whose URL goes through `urls`, one for each press, then stays. */
function page(urls: readonly string[]): Walkable {
  const left = [...urls];
  let url = "https://deck.test/1";
  return {
    url: () => url,
    waitForTimeout: () => Promise.resolve(),
    keyboard: {
      press: () => {
        url = left.shift() ?? url;
        return Promise.resolve();
      },
    },
  };
}

test("a walk that never moves fails", async () => {
  assert.deepEqual(await rapidWalk(page([])), {
    urls: ["https://deck.test/1"],
    failure: { kind: "did not move" },
  });
});

test("a walk that reaches the end passes", async () => {
  const walk = await rapidWalk(page(["https://deck.test/2"]));
  assert.equal(walk.urls.length, 2);
  assert.equal(walk.failure, null);
});

test("a walk that reaches its limit fails", async () => {
  const walk = await rapidWalk(
    page(["https://deck.test/2", "https://deck.test/3"]),
    3,
  );
  assert.equal(walk.urls.length, 3);
  assert.deepEqual(walk.failure, { kind: "did not end", steps: 3 });
});
