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

test("the flashed subject includes the roller and oscillator, not the fork", () => {
  const subject = scene.subjects.find(
    (candidate) => candidate.name === "balance and hairspring",
  );
  assert.ok(subject);
  const parts = new Set([...subject.meshes].map((mesh) => mesh.part));
  assert.deepEqual(
    [...parts].sort(),
    [
      "balance",
      "hairspring",
      "hairspring stud",
      "impulse jewel",
      "roller",
    ].sort(),
  );
  for (const part of parts) {
    for (const mesh of partMeshes(part)) {
      assert.ok(subject.meshes.has(mesh), `${mesh.name} does not flash`);
    }
  }
  assert.ok(subject.meshes.has(watch.spring));
});

test("slide 3's subject is the balance wheel and the spring, not the roller or the jewel, and it holds slide 2's", () => {
  const find = (name: string) =>
    scene.subjects.find((candidate) => candidate.name === name);
  const wheel = find("balance wheel and hairspring");
  const spring = find("hairspring and stud");
  assert.ok(wheel && spring);
  const parts = new Set([...wheel.meshes].map((mesh) => mesh.part));
  assert.deepEqual(
    [...parts].sort(),
    ["balance", "hairspring", "hairspring stud"].sort(),
  );
  for (const mesh of spring.meshes) assert.ok(wheel.meshes.has(mesh));
  for (const mesh of partMeshes("balance")) assert.ok(wheel.meshes.has(mesh));
});

test("slide 3's flash is what it adds to slide 2: the wheel, its screws and the staff, not the spring", () => {
  const find = (name: string) =>
    scene.subjects.find((candidate) => candidate.name === name);
  const added = find("balance wheel");
  const wheel = find("balance wheel and hairspring");
  const spring = find("hairspring and stud");
  assert.ok(added && wheel && spring);
  assert.ok(added.meshes.size > 0);
  for (const mesh of wheel.meshes) {
    assert.equal(added.meshes.has(mesh), !spring.meshes.has(mesh));
  }
  for (const mesh of partMeshes("balance")) assert.ok(added.meshes.has(mesh));
});

test("four evenly spaced radial screws touch the balance rim and turn with it", () => {
  const [body, ...marks] = partMeshes("balance");
  const heads = marks.filter((mesh) => mesh.fill !== null);
  const slots = marks.filter((mesh) => mesh.fill === null);
  assert.equal(slots.length, 4);
  for (const slot of slots) assert.equal(slot.group, watch.groups.balance);
  assert.ok(body);
  assert.equal(heads.length, 4);
  const [rimBottom, rimTop] = heights(body);
  const centres = heads.map((head) => {
    assert.equal(head.group, watch.groups.balance);
    const [bottom, top] = heights(head);
    assert.ok(Math.abs((bottom + top) / 2 - (rimBottom + rimTop) / 2) < 1e-5);
    assert.ok(top > bottom);
    const coordinates = (axis: number): number[] =>
      Array.from({ length: head.triangles.length / 3 }, (_, index) =>
        at(head.triangles, 3 * index + axis),
      );
    const xValues = coordinates(0);
    const yValues = coordinates(1);
    const x = (Math.min(...xValues) + Math.max(...xValues)) / 2;
    const y = (Math.min(...yValues) + Math.max(...yValues)) / 2;
    const radialDistances = Array.from(
      { length: head.triangles.length / 3 },
      (_, index) =>
        Math.hypot(
          at(head.triangles, 3 * index),
          at(head.triangles, 3 * index + 1),
        ),
    );
    assert.ok(Math.min(...radialDistances) < design.balance.radius);
    assert.ok(Math.max(...radialDistances) > design.balance.radius);
    return [x, y] as const;
  });
  const radius = Math.hypot(...at(centres, 0));
  for (const [index, [x, y]] of centres.entries()) {
    assert.ok(Math.abs(Math.hypot(x, y) - radius) < 1e-5);
    const [nextX, nextY] = at(centres, (index + 1) % centres.length);
    assert.ok(Math.abs(x * nextX + y * nextY) < 1e-3);
  }
});

test("the lowered oscillator connects to the upper roller and jewel with clearance", () => {
  const [balanceBottom, balanceTop] = heights(at(partMeshes("balance"), 0));
  const [springBottom, springTop] = [
    watch.springHeights.bottom,
    watch.springHeights.top,
  ];
  const [rollerBottom, rollerTop] = heights(at(partMeshes("roller"), 0));
  const [jewelBottom, jewelTop] = heights(at(partMeshes("impulse jewel"), 0));
  const [forkBottom, forkTop] = heights(at(partMeshes("pallet fork"), 0));
  const staff = partMeshes("hairspring").find(
    (mesh) => mesh.name === "hairspring 3",
  );
  assert.ok(staff);
  assert.deepEqual(heights(staff), [balanceTop, rollerTop]);
  assert.equal(springBottom - balanceTop, 2);
  assert.equal(rollerBottom - springTop, 2);
  assert.equal(jewelBottom, rollerTop);
  assert.deepEqual([jewelBottom, jewelTop], [forkBottom, forkTop]);
  assert.ok(heights(at(partMeshes("case band"), 0))[0] <= balanceBottom - 2);
});

test("slide 2 keeps only the spring, collet and stud when the mechanism fades", () => {
  const subject = scene.subjects.find(
    (candidate) => candidate.name === "hairspring and stud",
  );
  assert.ok(subject);
  assert.equal(subject.meshes.size, 3);
  for (const part of ["roller", "impulse jewel", "balance", "pallet fork"]) {
    for (const mesh of partMeshes(part)) assert.ok(!subject.meshes.has(mesh));
  }
});

test("the lowered spring stays at slide 2's target through its tilt", () => {
  const view = scene.views.find((candidate) => candidate.name === "hairspring");
  assert.ok(view);
  const arborX = design.watchCentre[0] + design.balance.arbor[0];
  const arborY = design.watchCentre[1] + design.balance.arbor[1];
  assert.deepEqual(view.pivot, [
    arborX,
    arborY,
    (watch.springHeights.bottom + watch.springHeights.top) / 2,
  ]);
  assert.ok(Math.abs(view.scale * arborX + view.shift[0] - 275) < 1e-9);
  assert.ok(Math.abs(view.scale * arborY + view.shift[1] - 276) < 1e-9);
});

test("the spring's height and the hairspring view's pivot are what art/diving_board.py copies", () => {
  // The board curls into the spring, drawn with the spring's height at the
  // view's tilt: SPRING_Z and SPRING_PIVOT_Z in art/diving_board.py.
  const view = scene.views.find((candidate) => candidate.name === "hairspring");
  assert.deepEqual(
    [watch.springHeights.bottom, watch.springHeights.top, view?.pivot[2]],
    [-11, -3, -7],
  );
});
