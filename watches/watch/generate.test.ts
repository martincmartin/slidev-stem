import assert from "node:assert/strict";
import { test } from "node:test";
import { at } from "../webgl/checked.ts";
import { transformPoint } from "../webgl/math.ts";
import type { Point2 } from "../webgl/mesh.ts";
import { HOLDOUT_TOLERANCE, viewProjection } from "../webgl/renderer.ts";
import type { Wheel } from "./design.ts";
import { AtRest, discOutline } from "./at-rest.ts";
import type { Mesh, Piece } from "../webgl/scene.ts";
import { INKS } from "../webgl/scene.ts";
import {
  ARBOR_RADIUS,
  driveArrowShape,
  fittedView,
  generate,
  JEWEL_FLAT_OFFSET,
  JEWEL_RADIUS,
  oneStepHourWheel,
  oneStepWheel,
  PICTURE_BAND,
} from "./generate.ts";

const watch = generate();
const { design, scene } = watch;

function piece(name: string): Piece {
  const found = scene.pieces.find((candidate) => candidate.name === name);
  if (!found) throw new Error(`no piece ${name}`);
  return found;
}

function partMeshes(part: string): Mesh[] {
  return scene.meshes.filter((mesh) => mesh.part === part);
}

/** The barrel is not called a wheel. */
function partNameOf(wheel: Wheel): string {
  return wheel.name === "barrel" ? "barrel" : `${wheel.name} wheel`;
}

/** A seam's line, where an arbor comes up through a face (`seamMesh`). */
function isSeam(mesh: Mesh): boolean {
  return mesh.name.endsWith(" seam (added)");
}

/** The meshes of a piece but its seam. */
function withoutSeam(name: string): Set<Mesh> {
  return new Set([...piece(name).meshes].filter((mesh) => !isSeam(mesh)));
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

test("each wheel's tips stay out of the arbor of the pinion that it meshes with", () => {
  // The hour wheel's tips reach 0.013 px into the minute arbor. Up to 0.05 px
  // does not show: at scale 15 (for example, the Recap slide's closest view)
  // it is 0.75 px, inside the arbor's outline, which reaches 1 px out
  const allowed = 0.05;
  const { minute, hour } = design.motionWorks;
  const meshes: [string, number, number][] = [
    ...[...design.wheels, oneStepWheel(design)].flatMap(
      (wheel): [string, number, number][] =>
        wheel.driven === null
          ? []
          : [[wheel.name, wheel.driven.pinionRadius ?? 0, wheel.depth]],
    ),
    ...[minute, hour, oneStepHourWheel(design)].map(
      (wheel): [string, number, number] => [
        wheel.name,
        wheel.driver.radius,
        wheel.depth,
      ],
    ),
  ];
  for (const [name, pinionRadius, depth] of meshes) {
    assert.ok(pinionRadius > 0, name);
    // a tip on the line of centres is this far from the pinion's centre
    const reach = pinionRadius - depth;
    assert.ok(
      reach > ARBOR_RADIUS - allowed,
      `the ${name} wheel's tips reach ${reach.toFixed(3)} px from the arbor's centre`,
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

test("a pinion stands on its wheel and reaches the top of the wheel that drives it", () => {
  // the driving wheel stands a gap above the pinion's wheel, which it covers
  for (const wheel of design.wheels) {
    const driver = design.wheels.find((other) => other.driven === wheel);
    if (!driver) continue;
    const [body, , pinion] = partMeshes(partNameOf(wheel));
    const driverBody = at(partMeshes(partNameOf(driver)), 0);
    assert.ok(body && pinion, wheel.name);
    const [driverBottom, driverTop] = heights(driverBody);
    assert.deepEqual(
      heights(pinion),
      [heights(body)[1], driverTop],
      wheel.name,
    );
    assert.ok(driverBottom > heights(body)[1], wheel.name);
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
  assert.ok(piece("hairspring").meshes.has(spring));
  assert.ok(piece("stud").meshes.has(stud));
});

test("every mesh is finite", () => {
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
  }
});

/** Each paper disc, with the piece that shows it: its wheel's. */
function paperDiscs(): { disc: Mesh; piece: Piece }[] {
  return scene.meshes
    .filter((mesh) => mesh.holdout)
    .map((disc) => {
      const pieces = scene.pieces.filter((each) => each.meshes.has(disc));
      assert.equal(pieces.length, 1, disc.name);
      return { disc, piece: at(pieces, 0) };
    });
}

test("each paper disc is flat, at its wheel's bottom, inside the case, and shows with its wheel", () => {
  const atRest = new AtRest(watch);
  const discs = paperDiscs();
  assert.ok(discs.length > 0, "no paper disc");
  const [centreX, centreY] = design.watchCentre;
  for (const { disc, piece: shownWith } of discs) {
    const [bottom, top] = atRest.heights(disc);
    assert.equal(bottom, top, `${disc.name} is not flat`);
    const wheel = [...shownWith.meshes].filter((mesh) => mesh !== disc);
    assert.ok(wheel.length > 0, disc.name);
    const wheelBottom = Math.min(
      ...wheel.map((mesh) => atRest.heights(mesh)[0]),
    );
    assert.ok(Math.abs(bottom - wheelBottom) < 1e-9, disc.name);
    for (const [x, y] of atRest.points(disc)) {
      assert.ok(
        // the mesh's points are 32-bit floats
        Math.hypot(x - centreX, y - centreY) <= design.case.bezelRadius + 1e-3,
        `${disc.name} reaches past the case`,
      );
    }
  }
});

test("the parts under a paper disc stand more than the line test's tolerance below it", () => {
  // The line test takes a holdout's depth exactly, with HOLDOUT_TOLERANCE: a
  // part closer under it would show its lines through the wheel's openings
  // (webgl/renderer.ts, "Holdouts").
  const atRest = new AtRest(watch);
  for (const { disc, piece: shownWith } of paperDiscs()) {
    const height = atRest.heights(disc)[0];
    const outline = discOutline(atRest, disc);
    for (const mesh of scene.meshes) {
      if (mesh.holdout || shownWith.meshes.has(mesh)) continue;
      const over = outline.heightsOver(atRest.points(mesh));
      if (!over) continue;
      const top = over[1];
      // a part that reaches above the disc is the deck test's
      if (top > height + 1e-9) continue;
      assert.ok(
        top < height - HOLDOUT_TOLERANCE,
        `${mesh.name} is ${String(height - top)} px under ${disc.name}`,
      );
    }
  }
});

test("the views: the cover is centred on the watch and the spring's view on the balance", () => {
  const [cover, hairspring, crown] = scene.views;
  assert.deepEqual(cover?.pivot.slice(0, 2), design.watchCentre);
  assert.ok(Math.abs((hairspring?.scale ?? 0) - 250 / 56) < 1e-12);
  assert.ok(Math.abs((crown?.scale ?? 0) - 2) < 1e-12);
});

test("every mesh is in exactly one piece", () => {
  const owners = new Map<Mesh, string[]>();
  for (const each of scene.pieces) {
    for (const mesh of each.meshes) {
      owners.set(mesh, [...(owners.get(mesh) ?? []), each.name]);
    }
  }
  for (const mesh of scene.meshes) {
    assert.equal(
      owners.get(mesh)?.length,
      1,
      `${mesh.name}: ${String(owners.get(mesh))}`,
    );
  }
});

test("each wheel of the train is three pieces: the wheel with its hub, the pinion and the arbor", () => {
  // (the Gears slide's spans are pieces of their own, after these)
  for (const wheel of ["escape", "fourth", "third", "centre"]) {
    // the wheel, its hub, its pinion and its arbor, in the drawing's order
    const [body, hub, pinion, arbor] = partMeshes(`${wheel} wheel`);
    assert.ok(body && hub && pinion && arbor);
    // and the wheel's paper disc, if it covers a wheel
    const wheelMeshes = [...piece(`${wheel} wheel`).meshes];
    assert.deepEqual(
      new Set(wheelMeshes.filter((mesh) => !mesh.holdout)),
      new Set([body, hub]),
    );
    assert.deepEqual(withoutSeam(`${wheel} pinion`), new Set([pinion]));
    assert.deepEqual(piece(`${wheel} arbor`).meshes, new Set([arbor]));
    // the arbor stands on the wheel: without the pinion it does not float
    assert.equal(heights(arbor)[0], heights(body)[1]);
    assert.ok(heights(arbor)[1] > heights(pinion)[1]);
  }
});

test("where an arbor comes up through a face, a line lies on the face's top, in its piece", () => {
  // docs/watch.md, "Where an arbor comes up through a face"
  const faces = [
    "escape pinion",
    "fourth pinion",
    "third pinion",
    "centre pinion",
    "cannon pinion",
    "minute pinion",
    "hour wheel",
    "one-step hour wheel",
    "collet",
  ];
  const seams = scene.meshes.filter(isSeam);
  assert.equal(seams.length, faces.length);
  for (const name of faces) {
    const own = [...piece(name).meshes].filter(isSeam);
    assert.equal(own.length, 1, name);
    const seam = at(own, 0);
    // a decal: lines only
    assert.equal(seam.triangles.length, 0, name);
    assert.equal(seam.fill, null, name);
    // on the top of a face of its piece, which turns with it
    const top = Math.max(
      ...seam.lines.flatMap((line) => line.points.map((point) => point[2])),
    );
    const face = [...withoutSeam(name)].find(
      (mesh) => mesh.group === seam.group && heights(mesh)[1] === top,
    );
    assert.ok(face, name);
    // each other line runs down a crease, from the face's bottom to its top
    const flat = seam.lines.filter((line) =>
      line.points.every((point) => point[2] === top),
    );
    assert.ok(flat.length > 0, name);
    for (const line of seam.lines) {
      if (flat.includes(line)) continue;
      assert.deepEqual(
        line.points.map((point) => point[2]),
        [heights(face)[0], top],
        name,
      );
    }
    // a 4-leaf pinion: an arc on each leaf, with a crease at each end
    if (flat.length > 1) {
      assert.equal(seam.lines.length, 3 * flat.length, name);
    }
  }
});

test("the Gears slide's spans are whole teeth of their gears, in the flash's colours, and turn with them", () => {
  const fourth = design.wheels.find((wheel) => wheel.name === "fourth");
  assert.ok(fourth);
  // faces in the second's wash, outline in the second
  const styles = [["span", INKS.secondWash, INKS.second]] as const;
  // the wheel's body, and the pinion on the escape wheel's arbor
  const gears = [
    ["fourth wheel", at(partMeshes("fourth wheel"), 0), fourth.outer],
    ["escape pinion", at(partMeshes("escape wheel"), 2), Infinity],
  ] as const;
  for (const [style, fill, outline] of styles)
    for (const [gearName, gear, outer] of gears) {
      const name = `${gearName} ${style}`;
      const meshes = [...piece(name).meshes];
      assert.equal(meshes.length, 1, name);
      const span = at(meshes, 0);
      assert.equal(span.group, gear.group, name);
      assert.equal(span.inDrawing, false, name);
      const [bottom, top] = heights(span);
      // the whole tooth, drawn over the gear's faces
      assert.equal(span.overlay, true, name);
      assert.deepEqual([bottom, top], heights(gear), name);
      assert.equal(span.fill?.ink, fill, name);
      for (const line of span.lines)
        assert.equal(line.style.ink, outline, name);
      const radii = Array.from(
        { length: span.triangles.length / 3 },
        (_, index) =>
          Math.hypot(
            at(span.triangles, 3 * index),
            at(span.triangles, 3 * index + 1),
          ),
      );
      const gearRadii = Array.from(
        { length: gear.triangles.length / 3 },
        (_, index) =>
          Math.hypot(
            at(gear.triangles, 3 * index),
            at(gear.triangles, 3 * index + 1),
          ),
      );
      assert.ok(
        Math.max(...radii) <= Math.min(outer, Math.max(...gearRadii)) + 1e-4,
        name,
      );
    }
});

test("the oscillator's pieces: the balance wheel holds its screws; the spring, collet and stud are one mesh each", () => {
  assert.deepEqual(
    piece("balance wheel").meshes,
    new Set(partMeshes("balance")),
  );
  const [spring, collet, staff] = partMeshes("hairspring");
  assert.ok(spring && collet && staff);
  assert.deepEqual(piece("hairspring").meshes, new Set([spring]));
  assert.deepEqual(withoutSeam("collet"), new Set([collet]));
  assert.deepEqual(piece("balance staff").meshes, new Set([staff]));
  assert.equal(piece("stud").meshes.size, 1);
  assert.deepEqual(
    piece("seconds hand").meshes,
    new Set(partMeshes("seconds hand")),
  );
});

test("a fitted view: the pieces fit the room under the subtitle, against its left edge", () => {
  const escapement = [
    "balance wheel",
    "balance staff",
    "hairspring",
    "collet",
    "stud",
    "roller",
    "impulse jewel",
    "pallet fork",
    "escape wheel",
    "escape arbor",
  ].map(piece);
  const view = fittedView(watch, escapement);
  const hairspring = scene.views.find(
    (candidate) => candidate.name === "hairspring",
  );
  assert.ok(hairspring);
  assert.ok(view.scale < hairspring.scale && view.scale > 1);
  // the escapement is taller than wide: its height fills the room
  const box = escapement
    .map((each) => watch.extents.get(each)?.box)
    .filter((each) => each !== undefined);
  const top = Math.min(...box.map((each) => each.top));
  const bottom = Math.max(...box.map((each) => each.bottom));
  const left = Math.min(...box.map((each) => each.left));
  assert.ok(
    Math.abs(
      view.scale * (bottom - top) - (PICTURE_BAND.bottom - PICTURE_BAND.top),
    ) < 1e-9,
  );
  assert.ok(Math.abs(view.scale * left + view.shift[0] - 16) < 1e-9);
});

test("a fitted view narrower than 60% of the slide is centred in the slide's left 60%", () => {
  const gears = [
    "fourth wheel",
    "fourth arbor",
    "escape pinion",
    "escape arbor",
  ].map(piece);
  const view = fittedView(watch, gears);
  const box = gears
    .map((each) => watch.extents.get(each)?.box)
    .filter((each) => each !== undefined);
  const left = view.scale * Math.min(...box.map((each) => each.left));
  const right = view.scale * Math.max(...box.map((each) => each.right));
  const width = watch.design.canvas.width;
  assert.ok(right - left < 0.6 * width - 2 * 16);
  assert.ok(Math.abs((left + right) / 2 + view.shift[0] - 0.3 * width) < 1e-9);
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
  assert.deepEqual(
    [forkBottom, forkTop],
    heights(at(partMeshes("escape wheel"), 0)),
  );
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

test("the impulse jewel is a D, its flat facing the fork, as wide as its circle", () => {
  const jewel = at(partMeshes("impulse jewel"), 0);
  const facing = (design.balance.pinDirection * Math.PI) / 180;
  const along: number[] = [];
  const across: number[] = [];
  // in the balance's own frame: its arbor is the origin
  for (let index = 0; index < jewel.triangles.length / 3; index++) {
    const x = at(jewel.triangles, 3 * index);
    const y = at(jewel.triangles, 3 * index + 1);
    along.push(x * Math.cos(facing) + y * Math.sin(facing));
    across.push(-x * Math.sin(facing) + y * Math.cos(facing));
  }
  const centre = design.balance.impulsePinRadius;
  const near = (value: number, expected: number): boolean =>
    Math.abs(value - expected) < 0.01;
  assert.ok(near(Math.max(...along), centre + JEWEL_FLAT_OFFSET));
  assert.ok(near(Math.min(...along), centre - JEWEL_RADIUS));
  assert.ok(near(Math.max(...across), JEWEL_RADIUS));
  assert.ok(near(Math.min(...across), -JEWEL_RADIUS));
});

test("the lowered spring stays at the Hairspring slide's target through its tilt", () => {
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
    [-12, -4, -8],
  );
});

test("at a tilt, a fitted view fills its band on the screen, as the camera shows each piece", () => {
  const movement = [
    "barrel",
    "centre wheel",
    "balance wheel",
    "hairspring",
  ].map(piece);
  const [, height] = scene.slide;
  const margin = height - PICTURE_BAND.bottom;
  for (const [band, top, bottom] of [
    ["picture", PICTURE_BAND.top, PICTURE_BAND.bottom],
    ["slide", margin, height - margin],
  ] as const) {
    const view = fittedView(watch, movement, null, band, 20);
    const camera = viewProjection(view, { tilt: 20, turn: 0 }, scene.slide);
    const ys = movement.flatMap((each) => {
      const extent = watch.extents.get(each) ?? assert.fail();
      return [extent.box.top, extent.box.bottom].flatMap((y) =>
        [extent.bottom, extent.top].map((z) => {
          const [, clip] = transformPoint(camera.matrix, [view.pivot[0], y, z]);
          return ((1 - clip) / 2) * height;
        }),
      );
    });
    assert.ok(Math.abs(Math.min(...ys) - top) < 1e-3, `${band} top`);
    assert.ok(Math.abs(Math.max(...ys) - bottom) < 1e-3, `${band} bottom`);
  }
});

test("each drive arrow is on its wheel, centred toward the wheel that drives it, and turns the way its wheel turns", () => {
  const [, centre, third, fourth, escape] = design.wheels as [
    Wheel,
    Wheel,
    Wheel,
    Wheel,
    Wheel,
  ];
  for (const wheel of [escape, fourth, third, centre]) {
    const driver = design.wheels.find((each) => each.driven === wheel);
    assert.ok(driver, wheel.name);
    const { shaft, head } = driveArrowShape(wheel, driver);
    const arbor = wheel.arbor;
    const out = (point: readonly number[]): [number, number] => [
      (point[0] ?? 0) - arbor[0],
      (point[1] ?? 0) - arbor[1],
    ];
    // inside the wheel's root circle, clear of its teeth
    for (const point of [...shaft, ...head]) {
      assert.ok(Math.hypot(...out(point)) < wheel.inner, wheel.name);
    }
    // y is down, as on the slide: a negative step turns anticlockwise, from
    // the tail to the tip
    const [tailX, tailY] = out(at(shaft, 0));
    const [tipX, tipY] = out(head[0]);
    assert.equal(Math.sign(tailX * tipY - tailY * tipX), Math.sign(wheel.step));
    // the middle of the arc faces the driver
    const middle = out(at(shaft, Math.floor(shaft.length / 2)));
    const toDriver = out(driver.arbor);
    assert.ok(middle[0] * toDriver[0] + middle[1] * toDriver[1] > 0);
    // the shaft ends inside the head, at its middle: the line's round end
    // does not show past the tip
    const [tip, left, right] = head;
    const end = at(shaft, shaft.length - 1);
    const base: Point2 = [(left[0] + right[0]) / 2, (left[1] + right[1]) / 2];
    const fromTip = Math.hypot(end[0] - tip[0], end[1] - tip[1]);
    const length = Math.hypot(base[0] - tip[0], base[1] - tip[1]);
    assert.ok(Math.abs(fromTip / length - 1 / 2) < 0.01, wheel.name);
  }
});
