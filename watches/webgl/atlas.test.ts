import assert from "node:assert/strict";
import { test } from "node:test";
import { pack } from "./atlas.ts";
import type { Sheet } from "./atlas.ts";

/** Each sheet's places as [index, x, y]. */
function places(sheets: Sheet[]): [number, number, number][][] {
  return sheets.map((sheet) =>
    sheet.places.map(({ index, at }) => [index, at[0], at[1]]),
  );
}

test("pictures that fit go in rows on one sheet", () => {
  const sheets = pack(
    [
      [600, 300],
      [300, 200],
      [500, 400],
    ],
    1000,
  );
  assert.deepEqual(places(sheets), [
    [
      [0, 0, 0],
      [1, 600, 0],
      [2, 0, 300],
    ],
  ]);
  assert.deepEqual(sheets[0]?.size, [900, 700]);
});

test("a picture that does not fit starts a new sheet", () => {
  const sheets = pack(
    [
      [800, 600],
      [800, 600],
    ],
    1000,
  );
  assert.deepEqual(places(sheets), [[[0, 0, 0]], [[1, 0, 0]]]);
  assert.deepEqual(
    sheets.map((sheet) => sheet.size),
    [
      [800, 600],
      [800, 600],
    ],
  );
});

test("a picture larger than the limit gets a sheet of its size", () => {
  const sheets = pack(
    [
      [200, 100],
      [1500, 300],
      [200, 100],
    ],
    1000,
  );
  assert.deepEqual(places(sheets), [
    [[1, 0, 0]],
    [
      [0, 0, 0],
      [2, 200, 0],
    ],
  ]);
  assert.deepEqual(sheets[0]?.size, [1500, 300]);
  assert.deepEqual(sheets[1]?.size, [400, 100]);
});

test("no pictures, no sheets", () => {
  assert.deepEqual(pack([], 1000), []);
});

test("pack refuses a picture that is not whole device px", () => {
  assert.throws(() => pack([[10.5, 10]], 1000), /10.5 x 10/);
});
