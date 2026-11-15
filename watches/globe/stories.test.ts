// The railroad's track (globe/stories.ts, `track`): a smooth curve through
// its places, two rails a gauge apart, and ties that the back row can tell
// apart on the inside of every bend (docs/globe.md, "The marks").

import assert from "node:assert/strict";
import { test } from "node:test";
import { NEW_ENGLAND } from "./maps.ts";
import { makeGlobe } from "./model.ts";
import { TRACK, smoothThrough } from "./stories.ts";
import type { Point } from "./stories.ts";

/** The finest mark that the back row resolves, in slide px: the design
 *  venue's, from `tools/lib.py` (stem/docs/legibility.md). */
const FINEST_MARK = 1.64;
/** The ties' stroke width, in StoryMaps.vue (`.tie`). */
const TIE_WIDTH = 3;

const distance = (from: Point, to: Point): number =>
  Math.hypot(to[0] - from[0], to[1] - from[1]);

/** The points of a path of `M` and `L` commands, one list for each `M`. */
function polylines(path: string): Point[][] {
  return path
    .split("M")
    .filter((part) => part !== "")
    .map((part) =>
      part.split("L").map((pair) => {
        const [x, y] = pair.split(",").map(Number);
        if (x === undefined || y === undefined) throw new Error(pair);
        return [x, y] as const;
      }),
    );
}

/** The railroad's track: its ties, and its rails, as polylines. */
function railroadTrack(): { ties: Point[][]; rails: Point[][] } {
  const story = makeGlobe([980, 552]).stories.find(
    ({ placed }) => placed.map === NEW_ENGLAND,
  );
  const parts = story?.marks.find(({ name }) => name === "route")?.parts;
  const path = (kind: string): string =>
    parts?.find((part) => part.kind === kind)?.d ?? assert.fail(kind);
  return { ties: polylines(path("tie")), rails: polylines(path("rail")) };
}

test("a smooth curve passes through each of its places", () => {
  const places: Point[] = [
    [0, 0],
    [10, 5],
    [20, 0],
    [40, 10],
  ];
  const curve = smoothThrough(places, 8);
  assert.equal(curve.length, 1 + 3 * 8);
  for (const place of places) {
    assert.ok(curve.some((point) => distance(point, place) < 1e-9));
  }
  assert.throws(() =>
    smoothThrough(
      [
        [0, 0],
        [0, 0],
      ],
      4,
    ),
  );
});

test("the railroad's rails are a gauge apart", () => {
  const { rails } = railroadTrack();
  const [left, right] = rails;
  assert.ok(left && right && rails.length === 2);
  assert.equal(left.length, right.length);
  for (const [index, point] of left.entries()) {
    const across = distance(point, right[index] ?? assert.fail());
    // the path rounds each number to 0.1 px
    assert.ok(Math.abs(across - TRACK.gauge) < 0.15, String(across));
  }
});

test("the railroad's ties stay apart on the inside of every bend", () => {
  const { ties } = railroadTrack();
  assert.ok(ties.length > 10);
  for (const [index, tie] of ties.entries()) {
    const [start, end] = tie;
    assert.ok(start && end && tie.length === 2);
    assert.ok(Math.abs(distance(start, end) - TRACK.tieLength) < 0.15);
    const before = ties[index - 1];
    if (!before) continue;
    // each end of a tie is on the same side of the track as the end before
    const gap = Math.min(
      distance(before[0] ?? assert.fail(), start),
      distance(before[1] ?? assert.fail(), end),
    );
    assert.ok(
      gap - TIE_WIDTH >= FINEST_MARK,
      `ties ${String(index - 1)} and ${String(index)}: ${String(gap)} px`,
    );
  }
});
