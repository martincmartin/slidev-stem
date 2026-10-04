import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "./checked.ts";

test("at returns an item, and throws for any index that has none", () => {
  const items = [10, 20, 30];
  assert.equal(at(items, 0), 10);
  assert.equal(at(items, 2), 30);
  assert.equal(at(new Float32Array([1.5]), 0), 1.5);
  for (const index of [-1, 3, 1.5, Number.NaN, Infinity]) {
    assert.throws(() => at(items, index), RangeError, String(index));
  }
  // eslint-disable-next-line no-sparse-arrays -- the case under test
  const sparse = [1, , 3];
  assert.throws(() => at(sparse, 1), /empty slot/);
});
