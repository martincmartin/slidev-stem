import assert from "node:assert/strict";
import { test } from "node:test";
import type { Renderer } from "../webgl/renderer.ts";
import type { Group, Mesh, MeshGeometry } from "../webgl/scene.ts";
import { at } from "../webgl/checked.ts";
import { slideFrontmatter } from "./deck.ts";
import { generate } from "./generate.ts";
import { runningSpringPose, WOUND } from "./mainspring.ts";
import { Motion, WatchModel } from "./model.ts";
import { modelState, watchState } from "./state.ts";

const watch = generate();
const barrel =
  watch.groups.wheels.get(at(watch.design.wheels, 0)) ?? assert.fail();
const recap = await slideFrontmatter("Recap");

test("the running spring lets down one turn, with a fixed arbor and no key", () => {
  const start = -173;
  for (const travel of [0, 90, 180, 360, 720]) {
    const pose = runningSpringPose(start, start - travel);
    assert.equal(pose.arbor, start - WOUND);
    assert.equal(pose.wind, Math.max(0, WOUND - travel));
    assert.equal(pose.key, 0);
  }
});

test("Recap winds on entry and at the barrel stop only", () => {
  for (let click = 0; click <= Number(recap["clicks"]); click++) {
    const state = watchState(recap, click) ?? assert.fail();
    assert.equal(state.unwind, true);
    assert.equal(state.wind, click <= 1);
    assert.equal(modelState(state).wind, click <= 1);
    assert.equal(state.settled, false);
  }
  for (const other of [
    { watchMainspring: "barrel" },
    { watchAtRest: true },
    { watchSpin: 135 },
  ]) {
    assert.throws(
      () => watchState({ watch: "all", watchUnwind: true, ...other }, 0),
      /^Error: watchUnwind/,
    );
  }
  assert.throws(
    () => watchState({ watch: "all", watchWind: true }, 0),
    /^Error: watchWind/,
  );
  for (const key of ["watchUnwind", "watchWind"]) {
    assert.throws(
      () => watchState({ watch: "all", [key]: "yes" }, 0),
      new RegExp(`^Error: ${key}`),
    );
  }
});

/** Radii of the spring's vertices: independent of its arbor's phase. */
function radii(geometry: MeshGeometry): number[] {
  const result: number[] = [];
  for (let index = 0; index < geometry.triangles.length; index += 3) {
    result.push(
      Math.hypot(
        at(geometry.triangles, index),
        at(geometry.triangles, index + 1),
      ),
    );
  }
  return result;
}

test("a long Recap pause empties the spring; winding leaves the train moving and later stops keep the wind", () => {
  const model = new WatchModel(watch, 0);
  const motion = new Motion(watch);
  let drawn: MeshGeometry | undefined;
  const renderer = {
    updateMesh: (mesh: Mesh, geometry: MeshGeometry) => {
      if (mesh === watch.mainspring) drawn = geometry;
    },
  } as unknown as Renderer;
  const show = (click: number, now: number, instantly = false): void => {
    model.show(
      modelState(watchState(recap, click) ?? assert.fail()),
      now,
      instantly,
    );
  };
  const frame = (now: number): Map<Group, Float32Array> => {
    model.frame(now, renderer);
    // A second frame at the same instant has no shutter interval.
    return model.frame(now, renderer);
  };
  const expectWind = (wind: number): void => {
    const expected = radii(
      motion.mainspringGeometry({ arbor: 0, wind, key: 0 }),
    );
    const actual = radii(drawn ?? assert.fail());
    assert.equal(actual.length, expected.length);
    for (const [index, radius] of actual.entries()) {
      assert.ok(Math.abs(radius - at(expected, index)) < 1e-4);
    }
  };
  show(0, 0, true);
  frame(0);
  expectWind(WOUND);
  frame(20000);
  expectWind(0);
  const before = frame(20123);
  show(1, 20123);
  const rewound = frame(20123);
  expectWind(WOUND);
  for (const group of [barrel, watch.groups.minute, watch.groups.balance]) {
    assert.deepEqual(rewound.get(group), before.get(group), group.name);
  }
  frame(21123);
  const partial = radii(drawn ?? assert.fail());
  // The camera is still moving; the spring is already unwinding.
  const full = radii(
    motion.mainspringGeometry({ arbor: 0, wind: WOUND, key: 0 }),
  );
  assert.ok(
    Math.max(
      ...partial.map((radius, index) => Math.abs(radius - at(full, index))),
    ) > 0.005,
  );
  const atNext = frame(24123);
  const beforeNext = radii(drawn ?? assert.fail());
  show(2, 24123);
  assert.deepEqual(frame(24123), atNext);
  assert.deepEqual(radii(drawn ?? assert.fail()), beforeNext);
  frame(60000);
  expectWind(0);
  const empty = frame(60123);
  const later = frame(60640);
  expectWind(0);
  assert.notDeepEqual(empty.get(barrel), later.get(barrel));
  assert.notDeepEqual(
    empty.get(watch.groups.balance),
    later.get(watch.groups.balance),
  );
  assert.equal(model.untilRest(60640), null);
  show(1, 60640);
  frame(60640);
  expectWind(WOUND);
  show(4, 60640, true);
  frame(60640);
  expectWind(WOUND);
  model.show(
    { settled: false, spin: null, mainspring: null, lapse: 1 },
    61000,
    true,
  );
  frame(61000);
  expectWind(0);
});
