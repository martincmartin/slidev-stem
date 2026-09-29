import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import type { Mesh } from "../webgl/scene.ts";
import type { Wheel } from "./design.ts";
import { generate } from "./generate.ts";

const watch = generate();
const { design, scene } = watch;

function partMeshes(part: string): Mesh[] {
  return scene.meshes.filter((mesh) => mesh.part === part);
}

/** The barrel is not called a wheel. */
function partNameOf(wheel: Wheel): string {
  return wheel.name === "barrel" ? "barrel" : `${wheel.name} wheel`;
}

function heights(mesh: Mesh): [number, number] {
  const z = Array.from({ length: mesh.triangles.length / 3 }, (_, index) =>
    at(mesh.triangles, 3 * index + 2),
  );
  return [Math.min(...z), Math.max(...z)];
}

test("each wheel is one mesh distance from the pinion it drives", () => {
  for (const wheel of design.wheels) {
    if (wheel.driven === null) continue;
    assert.notEqual(wheel.driven.pinionRadius, null);
    const distance = Math.hypot(
      wheel.arbor[0] - wheel.driven.arbor[0],
      wheel.arbor[1] - wheel.driven.arbor[1],
    );
    assert.ok(
      Math.abs(
        distance - (wheel.pitchRadius + (wheel.driven.pinionRadius ?? 0)),
      ) < 1e-9,
      `${wheel.name} to ${wheel.driven.name}`,
    );
  }
});

test("each wheel has four corners for each tooth", () => {
  for (const wheel of design.wheels) {
    const body = at(partMeshes(partNameOf(wheel)), 0);
    // the outline's vertical lines are its corners: 4 a tooth, and none from
    // the other rings' walls, which are smooth or (the spokes) counted apart
    const outline = body.lines.filter(
      (line) => line.points.length === 2 && line.style.width === 2.5,
    );
    assert.equal(outline.length, 4 * wheel.teeth, wheel.name);
  }
});

test("a pinion is level with the wheel that drives it", () => {
  for (const wheel of design.wheels) {
    const driver = design.wheels.find((other) => other.driven === wheel);
    if (!driver) continue;
    const pinion = at(partMeshes(partNameOf(wheel)), 2);
    const driverBody = at(partMeshes(partNameOf(driver)), 0);
    assert.deepEqual(heights(pinion), heights(driverBody), wheel.name);
  }
});

test("the hands sit under the chapter ring's top and the ring is flush with the case", () => {
  const ring = at(partMeshes("chapter ring"), 0);
  const [, ringTop] = heights(ring);
  assert.equal(ringTop, watch.ringTop);
  const caseBand = at(partMeshes("case band"), 0);
  assert.equal(heights(caseBand)[1], ringTop);
  const [minuteBottom] = heights(at(partMeshes("minute hand"), 0));
  assert.equal(minuteBottom, ringTop);
});

test("the spring is a ribbon on the balance, and the stud is not in the drawing", () => {
  const spring = watch.spring;
  assert.equal(spring.dynamic, true);
  const stud = at(partMeshes("hairspring stud"), 0);
  assert.equal(stud.inDrawing, false);
  const [springBottom, springTop] = [
    watch.springHeights.bottom,
    watch.springHeights.top,
  ];
  const [studBottom, studTop] = heights(stud);
  assert.equal(studBottom, springBottom - 1);
  assert.equal(studTop, springTop + 1);
  const subject = at(scene.subjects, 0);
  assert.ok(subject.meshes.has(spring) && subject.meshes.has(stud));
});

test("every mesh is finite, and every hidden-inside disc is a disc", () => {
  for (const mesh of scene.meshes) {
    assert.ok(mesh.triangles.every(Number.isFinite), `${mesh.name} triangles`);
    for (const line of mesh.lines) {
      assert.ok(
        line.points.flat().every(Number.isFinite),
        `${mesh.name} lines`,
      );
      assert.ok(Number.isFinite(line.style.width) && line.style.width > 0);
    }
    for (const edge of mesh.silhouetteEdges) {
      assert.ok(
        [
          ...edge.start,
          ...edge.end,
          ...edge.normalBefore,
          ...edge.normalAfter,
        ].every(Number.isFinite),
        `${mesh.name} silhouette edges`,
      );
    }
    for (const disc of mesh.hiddenInside) {
      assert.ok(disc.radius > 0 && disc.centre.every(Number.isFinite));
    }
  }
});

test("the views: the cover is centred on the watch and the spring's view on the balance", () => {
  const [cover, hairspring, crown] = scene.views;
  assert.deepEqual(cover?.pivot.slice(0, 2), design.watchCentre);
  assert.ok(Math.abs((hairspring?.scale ?? 0) - 250 / 56) < 1e-12);
  assert.ok(Math.abs((crown?.scale ?? 0) - 2) < 1e-12);
});
