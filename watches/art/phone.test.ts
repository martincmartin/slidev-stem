import assert from "node:assert/strict";
import { test } from "node:test";
import { phoneProblems, smallTargets } from "./phone.ts";
import type { Box, PhonePage, Target } from "./phone.ts";

function box(left: number, top: number, width: number, height: number): Box {
  return { left, top, right: left + width, bottom: top + height };
}

function target(name: string, place: Box): Target {
  return { name, box: place };
}

const PAGE: PhonePage = {
  width: 390,
  scrollWidth: 390,
  placed: [],
  targets: [],
};

test("a page that fits has no problem", () => {
  assert.deepEqual(
    phoneProblems({
      ...PAGE,
      placed: [{ name: "p", box: box(16, 0, 358, 40) }],
      targets: [target("button", box(16, 100, 44, 44))],
    }),
    [],
  );
});

test("a page wider than the window, or a block past its edge, is a problem", () => {
  const problems = phoneProblems({
    ...PAGE,
    scrollWidth: 420,
    placed: [
      { name: "table", box: box(16, 0, 400, 40) },
      { name: "empty", box: box(-50, 0, 0, 0) },
    ],
  });
  assert.equal(problems.length, 2);
  assert.match(problems[0] ?? "", /scrolls sideways/);
  assert.match(problems[1] ?? "", /table runs past/);
});

test("a small target passes with room around it, and fails without", () => {
  const alone = target("alone", box(100, 100, 12, 12));
  const near = [
    target("dot 1", box(100, 300, 12, 12)),
    target("dot 2", box(120, 300, 12, 12)),
  ];
  assert.deepEqual(smallTargets([alone, ...near]), near);
  // 24 px apart, centre to centre: their circles only touch
  const spaced = [
    target("dot 1", box(100, 300, 12, 12)),
    target("dot 2", box(124, 300, 12, 12)),
  ];
  assert.deepEqual(smallTargets(spaced), []);
});

test("a small target next to a big one fails if its circle meets it", () => {
  const button = target("button", box(0, 0, 44, 44));
  const dot = target("dot", box(46, 16, 12, 12));
  assert.deepEqual(smallTargets([button, dot]), [dot]);
  const far = target("dot", box(60, 16, 12, 12));
  assert.deepEqual(smallTargets([button, far]), []);
});
