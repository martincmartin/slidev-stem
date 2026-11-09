import assert from "node:assert/strict";
import { test } from "node:test";
import { CAPE_NOIR, JUAN_FERNANDEZ, SCILLY } from "./maps.ts";
import { makeGlobe } from "./model.ts";
import { DAY_SECONDS } from "./stories.ts";
import type { Story } from "./stories.ts";
import {
  MARK_FADE_SECONDS,
  nextVoyage,
  along,
  dayDots,
  settled,
  voyageAt,
  voyageEndAt,
  voyageTarget,
} from "./voyage.ts";
import type {
  VoyageFrame,
  VoyageNames,
  VoyageStep,
  VoyageTarget,
} from "./voyage.ts";

const SLIDE: readonly [number, number] = [980, 552];
const { stories } = makeGlobe(SLIDE);

function storyOf(map: unknown): Story {
  const found = stories.find((story) => story.placed.map === map);
  if (!found) throw new Error("no story");
  return found;
}
const NOIR = storyOf(CAPE_NOIR);
const SEARCH = storyOf(JUAN_FERNANDEZ);
const WRECK = storyOf(SCILLY);

test("steps wait for the camera; jumps replace the voyage at once", () => {
  const from = target(SEARCH, { leg: "start", marks: [] });
  const to = target(SEARCH, { leg: "west", marks: [] });
  const previous = settled(from);
  const timing = { at: 500, cameraEnd: 1500, jump: false };
  const forward = nextVoyage(previous, to, timing);
  assert.equal(forward.from, from);
  assert.equal(forward.start, 1500);
  assert.deepEqual(frameAt(SEARCH, forward, 1000).tracks, [1, 1, null, null]);
  const back = nextVoyage(settled(to), from, timing);
  assert.equal(back.from, to);
  assert.equal(back.to, from);
  assert.equal(back.start, 1500);
  const jump = nextVoyage(forward, from, { ...timing, at: 800, jump: true });
  assert.equal(jump.from, from);
  assert.equal(jump.to, from);
  assert.equal(jump.start, 800);
  assert.equal(voyageEndAt(jump), 800);
  assert.deepEqual(nextVoyage(previous, null, { ...timing, jump: true }), {
    from: null,
    to: null,
    at: 500,
    start: 500,
  });
});

function target(story: Story, names: VoyageNames): VoyageTarget {
  const made = voyageTarget(stories, story.placed.view, names);
  if (!made) throw new Error("no target");
  return made;
}

function frameAt(story: Story, step: VoyageStep, now: number): VoyageFrame {
  const frame = voyageAt(story, step, now);
  if (!frame) throw new Error("no frame");
  return frame;
}

test("each story map has a story, and its marks have parts", () => {
  assert.equal(stories.length, 4);
  for (const story of stories) {
    for (const mark of story.marks) {
      assert.ok(
        mark.parts.length > 0 ||
          mark.ghost !== undefined ||
          mark.count !== undefined,
        mark.name,
      );
      for (const { d } of mark.parts) assert.match(d, /^M/, mark.name);
    }
  }
  // 6 deaths a day, 12 days to the anchorage: 72
  const count = SEARCH.marks.find((mark) => mark.name === "count")?.count;
  const all = target(SEARCH, { leg: "found", marks: [] });
  assert.equal(
    (count?.perDay ?? 0) * frameAt(SEARCH, settled(all), 0).days,
    72,
  );
  // the island and its neighbour show when the ship sights them
  const islands = SEARCH.marks.find((mark) => mark.name === "islands");
  assert.ok(islands?.parts[0]?.d.includes("Z"));
});

test("a target names legs and marks of its view's story, or throws", () => {
  const made = target(SEARCH, { leg: "east", marks: ["parallel"] });
  assert.equal(made.legs, 3);
  assert.deepEqual(
    [...made.marks].map((mark) => mark.name),
    ["parallel"],
  );
  assert.equal(
    voyageTarget(stories, SEARCH.placed.view, { leg: null, marks: [] }),
    null,
  );
  assert.throws(
    () => voyageTarget(stories, NOIR.placed.view, { leg: "east", marks: [] }),
    /no leg "east"/,
  );
  assert.throws(
    () =>
      voyageTarget(stories, NOIR.placed.view, { leg: null, marks: ["wind"] }),
    /no mark "wind"/,
  );
  const other = { ...SEARCH.placed.view, name: "elsewhere" };
  assert.throws(
    () => voyageTarget(stories, other, { leg: "east", marks: [] }),
    /has no story/,
  );
});

test("along a route, by length", () => {
  const route = [
    [0, 0],
    [10, 0],
    [10, 30],
  ] as const;
  assert.deepEqual(along(route, 0), [0, 0]);
  assert.deepEqual(along(route, 0.25), [10, 0]);
  assert.deepEqual(along(route, 0.5), [10, 10]);
  assert.deepEqual(along(route, 1), [10, 30]);
  assert.deepEqual(along([[3, 4]], 0.5), [3, 4]);
});

test("a leg's dots: where it starts, and the end of each day", () => {
  const [, , east, west] = SEARCH.legs;
  assert.ok(east && west);
  assert.equal(dayDots(east).length, 3);
  assert.equal(dayDots(west).length, 10);
  assert.deepEqual(dayDots(west).at(-1), west.route.at(-1));
  assert.deepEqual(dayDots(SEARCH.legs[0] ?? east), []);
});

test("a step forward sails the new legs, one after the other, from its start", () => {
  const from = target(SEARCH, { leg: "start", marks: [] });
  const to = target(SEARCH, { leg: "west", marks: [] });
  const step = { from, to, at: 0, start: 1000 };
  const east = 2 * DAY_SECONDS * 1000;
  const west = 9 * DAY_SECONDS * 1000;
  const at = (ms: number) => frameAt(SEARCH, step, ms);
  // while the camera moves, the old legs show whole and the ship waits
  const waiting = at(500);
  assert.deepEqual(waiting.tracks, [1, 1, null, null]);
  assert.deepEqual(waiting.dots, [0, 0, 0, 0]);
  assert.deepEqual(waiting.ship?.at, SEARCH.legs[2]?.route[0]);
  // half way through the east leg: its first dot, and the ship faces east
  const east50 = at(1000 + east / 2);
  assert.deepEqual(
    east50.tracks.map((share) => share && Math.round(share * 100)),
    [100, 100, 50, null],
  );
  assert.equal(east50.dots[2], 2);
  assert.equal(east50.ship?.heading, "east");
  // then the west leg, its ship facing west
  const west50 = at(1000 + east + west / 2);
  assert.equal(west50.tracks[2], 1);
  assert.equal(west50.ship?.heading, "west");
  assert.equal(west50.dots[3], 5);
  // at the end, the target, and a dot at the end of each day
  const end = at(1000 + east + west + 1);
  assert.deepEqual(end.tracks, [1, 1, 1, 1]);
  assert.equal(end.dots[3], 10);
  assert.equal(end.days, 11);
  assert.equal(east50.days, 1);
  assert.deepEqual(end.ship?.at, SEARCH.legs[3]?.route.at(-1));
  // no mark comes or goes: it ends when the ship arrives
  assert.equal(voyageEndAt(step), 1000 + east + west);
});

test("a step back sails the legs that go back, from the last", () => {
  const ahead = target(SEARCH, { leg: "found", marks: ["wind"] });
  const behind = target(SEARCH, { leg: "east", marks: ["wind"] });
  const step = { from: ahead, to: behind, at: 0, start: 1000 };
  const found = 0.8 * 1000;
  const west = 9 * DAY_SECONDS * 1000;
  // while the camera moves, the voyage shows whole
  assert.deepEqual(frameAt(SEARCH, step, 500).tracks, [1, 1, 1, 1, 1]);
  // the last leg first, back to its start
  const half = frameAt(SEARCH, step, 1000 + found / 2);
  assert.deepEqual(
    half.tracks.map((share) => share && Math.round(share * 100)),
    [100, 100, 100, 100, 50],
  );
  // then the west leg, back east: its ship faces west, and its dots go
  const westHalf = frameAt(SEARCH, step, 1000 + found + west / 2);
  assert.equal(westHalf.tracks[4], null);
  assert.equal(westHalf.dots[3], 5);
  assert.equal(westHalf.ship?.heading, "west");
  // at the end, the target: the ship where the east leg ends
  const end = frameAt(SEARCH, step, 1000 + found + west + 1);
  assert.deepEqual(end.tracks, [1, 1, 1, null, null]);
  assert.deepEqual(end.dots, [0, 0, 3, 0, 0]);
  assert.deepEqual(end.ship?.at, SEARCH.legs[2]?.route.at(-1));
  assert.equal(voyageEndAt(step), 1000 + found + west);
});

test("a jump and a still show the target at once", () => {
  const ahead = target(SEARCH, { leg: "found", marks: ["wind"] });
  const jump = { ...settled(ahead), at: 5000, start: 5000 };
  assert.deepEqual(frameAt(SEARCH, jump, 5000).tracks, [1, 1, 1, 1, 1]);
  const still = frameAt(SEARCH, settled(ahead), 0);
  assert.deepEqual(still.tracks, [1, 1, 1, 1, 1]);
  const [wind] = ahead.marks;
  assert.ok(wind);
  assert.equal(still.marks.get(wind), 1);
  // nothing changes, so nothing waits: a press after a jump is a step
  assert.equal(voyageEndAt(jump), 5000);
  assert.equal(voyageEndAt(settled(ahead)), 0);
});

test("a step that changes no voyage ends when it happens", () => {
  // a slide with no story map: Part 1's every step
  assert.equal(voyageEndAt({ from: null, to: null, at: 700, start: 900 }), 700);
  const same = target(SEARCH, { leg: "east", marks: ["wind"] });
  const again = target(SEARCH, { leg: "east", marks: ["wind"] });
  assert.equal(
    voyageEndAt({ from: same, to: again, at: 700, start: 900 }),
    700,
  );
});

test("marks that come fade in from the start, and marks that go fade out at once", () => {
  const ghost = NOIR.marks.find((mark) => mark.name === "estimated");
  const gap = NOIR.marks.find((mark) => mark.name === "gap");
  if (!ghost || !gap) throw new Error("no marks");
  const from = target(NOIR, { leg: "cliffs", marks: ["estimated"] });
  const to = target(NOIR, { leg: "cliffs", marks: ["gap"] });
  const fade = MARK_FADE_SECONDS * 1000;
  const step = { from, to, at: 0, start: 1000 };
  const early = frameAt(NOIR, step, fade / 2);
  assert.equal(early.marks.get(ghost), 0.5);
  assert.equal(early.marks.get(gap), 0);
  const late = frameAt(NOIR, step, 1000 + fade / 2);
  assert.equal(late.marks.get(ghost), 0);
  assert.equal(late.marks.get(gap), 0.5);
  // the ship of a leg with no route stays where it is
  assert.deepEqual(late.tracks, [1]);
  assert.notEqual(late.ship, null);
  // it ends when the new marks have faded in
  assert.equal(voyageEndAt(step), 1000 + fade);
  const going = { from, to: target(NOIR, { leg: "cliffs", marks: [] }) };
  assert.equal(voyageEndAt({ ...going, at: 0, start: 1000 }), fade);
});

test("a story map that no target names draws nothing", () => {
  const wreck = target(WRECK, { leg: "wreck", marks: [] });
  assert.equal(voyageAt(NOIR, settled(wreck), 0), null);
  assert.ok(voyageAt(WRECK, settled(wreck), 0));
});

test("a story map that the step leaves keeps its voyage whole, and its marks fade out", () => {
  const search = target(SEARCH, { leg: "west", marks: ["wind"] });
  const wreck = target(WRECK, { leg: "wreck", marks: [] });
  const fade = MARK_FADE_SECONDS * 1000;
  for (const to of [wreck, null]) {
    const step = { from: search, to, at: 0, start: 1000 };
    const leaving = frameAt(SEARCH, step, fade / 2);
    assert.deepEqual(leaving.tracks, [1, 1, 1, 1]);
    assert.deepEqual(leaving.ship?.at, SEARCH.legs[3]?.route.at(-1));
    const [wind] = search.marks;
    assert.ok(wind);
    assert.equal(leaving.marks.get(wind), 0.5);
    assert.equal(voyageEndAt(step), fade);
  }
});
