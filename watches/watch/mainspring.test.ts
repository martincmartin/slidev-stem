// The Mainspring slide's story, driven with made-up times: the poses at each
// stage, the key's turns, the order of a step forward and back, and the
// time-lapse, which only goes forward.

import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import { FADE_SECONDS } from "../webgl/timeline.ts";
import type { Wheel } from "./design.ts";
import { generate } from "./generate.ts";
import {
  KEY_REST_SECONDS,
  KEY_SECONDS,
  KEY_TURN_DEGREES,
  KEY_TURN_SECONDS,
  LAPSE_SECONDS,
  LAPSE_WAIT_SECONDS,
  MainspringClock,
  MAINSPRING_STAGES,
  UNCOIL_SECONDS,
  WOUND,
  lapseProgress,
  linePose,
  stagePose,
  storyRuns,
} from "./mainspring.ts";
import { mainspringPoints } from "./model.ts";

const watch = generate();
const BEATS = 21600;

/** Degrees, from 0 up to 360. */
function turned(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

test("each stage's pose: the arbor where it started, the spring wound only where something holds its end", () => {
  const poses = MAINSPRING_STAGES.map((stage) => stagePose(stage));
  assert.deepEqual(
    poses.map((pose) => turned(pose.arbor)),
    [0, 0, 0, 0, 0],
  );
  assert.deepEqual(
    poses.map((pose) => pose.wind),
    [0, WOUND, 0, WOUND, 0],
  );
  assert.ok(poses.every((pose) => pose.key === 0));
  assert.equal(WOUND, 360);
});

test("the key fades in, turns a third of a turn three times with a pause after each, and fades out", () => {
  const start = stagePose("free").arbor;
  const into = (seconds: number) => linePose(seconds);
  assert.equal(into(0).key, 0);
  assert.equal(into(FADE_SECONDS / 2).arbor, start); // fading in, still
  assert.equal(into(FADE_SECONDS).key, 1);
  const cycle = KEY_TURN_SECONDS + KEY_REST_SECONDS;
  for (let turn = 1; turn <= 3; turn++) {
    const turnEnd = FADE_SECONDS + (turn - 1) * cycle + KEY_TURN_SECONDS;
    // anticlockwise, the way the barrel lets the spring down
    assert.equal(into(turnEnd).arbor, start - turn * KEY_TURN_DEGREES);
    assert.equal(
      into(turnEnd + KEY_REST_SECONDS * 0.9).arbor,
      start - turn * KEY_TURN_DEGREES,
    );
  }
  assert.ok(into(KEY_SECONDS - FADE_SECONDS / 2).key < 1);
  assert.equal(KEY_SECONDS, 2 * FADE_SECONDS + 3 * cycle);
  // the stud holds the outer end: the spring winds as the arbor turns
  assert.equal(into(KEY_SECONDS).wind, WOUND);
});

test("the mainspring keeps its length wound, with its coils drawn in to the arbor", () => {
  const shape = watch.mainspringShape;
  const length = (points: [number, number][]) =>
    points
      .slice(1)
      .reduce(
        (sum, point, index) =>
          sum +
          Math.hypot(
            point[0] - at(points, index)[0],
            point[1] - at(points, index)[1],
          ),
        0,
      );
  const meanRadius = (points: [number, number][]) =>
    points.reduce((sum, [x, y]) => sum + Math.hypot(x, y), 0) / points.length;
  const rest = mainspringPoints(shape, 0, 0);
  const wound = mainspringPoints(shape, -WOUND, WOUND);
  assert.ok(Math.abs(length(wound) - length(rest)) < 0.01 * length(rest));
  assert.ok(meanRadius(wound) < 0.9 * meanRadius(rest));
  // the outer end is where it was; the inner end is on the arbor
  const end = (points: [number, number][]) => at(points, points.length - 1);
  assert.ok(
    Math.hypot(end(wound)[0] - end(rest)[0], end(wound)[1] - end(rest)[1]) <
      1e-9,
  );
  assert.ok(Math.abs(Math.hypot(...at(rest, 0)) - shape.radii[0]) < 1e-9);
});

test("a step forward plays when the stage's change ends; a step back cuts to its stage at once", () => {
  const clock = new MainspringClock(BEATS);
  clock.show("free", 0, true);
  // forward: the stud fades in first, then the key winds
  clock.show("wound", 1000, false, 1000 + FADE_SECONDS * 1000);
  assert.deepEqual(clock.pose(1500), stagePose("free"));
  assert.ok(clock.moving(1500));
  const ends = 1000 + (FADE_SECONDS + KEY_SECONDS) * 1000;
  assert.ok(Math.abs(clock.endAt(1000) - ends) < 1e-6);
  const done = clock.endAt(1000);
  assert.deepEqual(clock.pose(done), stagePose("wound"));
  assert.equal(clock.moving(done), false);
  // back: no key unwinds it; the spring is as it was before the key
  const back = 20_000;
  clock.show("free", back, false, back);
  assert.deepEqual(clock.pose(back), stagePose("free"));
  assert.equal(clock.moving(back), false);
});

test("a step back during a play cuts to its stage", () => {
  const clock = new MainspringClock(BEATS);
  clock.show("wound", 0, true);
  clock.show("released", 0, false, 0);
  const middle = (UNCOIL_SECONDS / 2) * 1000;
  const half = clock.pose(middle).wind;
  assert.ok(half > 0 && half < WOUND);
  clock.show("wound", middle, false, middle);
  assert.deepEqual(clock.pose(middle), stagePose("wound"));
});

test("the time-lapse turns the train one turn of the barrel, lets the spring down, and stops the watch", () => {
  const [barrel] = watch.design.wheels as [Wheel];
  assert.ok(Math.abs(Math.abs(barrel.step) * BEATS - WOUND) < 1e-9);
  const clock = new MainspringClock(BEATS);
  clock.show("barrel", 0, true);
  assert.equal(clock.runs(0), true);
  clock.show("run down", 0, false, 0);
  const starts = LAPSE_WAIT_SECONDS * 1000;
  const ends = starts + LAPSE_SECONDS * 1000;
  assert.equal(clock.trainBeats(starts), 0);
  assert.ok(clock.trainBeats(starts + 3000) > 0);
  assert.ok(clock.pose(starts + 3000).wind < WOUND);
  assert.equal(clock.runs(ends - 1), true);
  assert.equal(clock.trainBeats(ends), BEATS);
  assert.deepEqual(clock.pose(ends), stagePose("run down"));
  assert.equal(clock.runs(ends), false);
  assert.equal(lapseProgress(0), 0);
  assert.equal(lapseProgress(LAPSE_SECONDS), 1);
});

test("back from the time-lapse cuts to the spring wound: the train never goes back, and stops at a tooth", () => {
  const clock = new MainspringClock(BEATS);
  clock.show("barrel", 0, true);
  clock.show("run down", 0, false, 0);
  // a click back while it runs: the train stops at its next tooth
  const back = 2000;
  const before = clock.trainBeats(back);
  assert.ok(before > 0 && before < BEATS);
  clock.show("barrel", back, false, back);
  const after = clock.trainBeats(back);
  assert.ok(after >= before && after < before + 2);
  assert.equal(after % 2, 0);
  assert.deepEqual(clock.pose(back), stagePose("barrel"));
  assert.equal(clock.runs(back), true);
  assert.equal(clock.trainBeats(back + 10_000), after);
  // and after a whole time-lapse
  const again = back + 10_000;
  clock.show("run down", again, false, again);
  const ends = again + (LAPSE_WAIT_SECONDS + LAPSE_SECONDS) * 1000;
  assert.equal(clock.trainBeats(ends), after + BEATS);
  assert.equal(clock.runs(ends), false);
  clock.show("barrel", ends + 100, false, ends + 100);
  assert.deepEqual(clock.pose(ends + 100), stagePose("barrel"));
  assert.equal(clock.runs(ends + 100), true);
});

test("a jump, or a step from a slide without the story, is at its stage at once", () => {
  const clock = new MainspringClock(BEATS);
  clock.show(null, 0, false);
  clock.show("wound", 10, false, 10);
  assert.deepEqual(clock.pose(10), stagePose("wound"));
  assert.equal(clock.moving(10), false);
  clock.show("run down", 20, true);
  assert.deepEqual(clock.pose(20), stagePose("run down"));
  assert.equal(clock.trainBeats(20), 0);
  assert.equal(clock.runs(20), false);
  clock.show(null, 30, true);
  assert.equal(clock.runs(30), null);
  assert.throws(() => new MainspringClock(21601), /whole number of teeth/);
});

test("the watch runs from the barrel on, not before", () => {
  assert.deepEqual(
    MAINSPRING_STAGES.filter((stage) => storyRuns(stage)),
    ["barrel", "run down"],
  );
});
