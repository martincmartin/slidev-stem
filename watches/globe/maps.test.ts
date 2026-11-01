import assert from "node:assert/strict";
import { test } from "node:test";
import { planeOnSlide, slidePoint, towardCamera } from "../webgl/renderer.ts";
import type { CameraPose, Vec3 } from "../webgl/scene.ts";
import earthFile from "./earth.json" with { type: "json" };
import { parseEarth } from "./earth.ts";
import { CENTRE, RADIUS, toSphere } from "./globe.ts";
import {
  CAPE_NOIR,
  JUAN_FERNANDEZ,
  SCILLY,
  STORY_MAPS,
  fitCamera,
  mapLand,
  mapOnSlide,
  project,
} from "./maps.ts";
import type { StoryMap } from "./maps.ts";
import { flight } from "../webgl/flight.ts";
import { globeView } from "./globe.ts";
import { makeGlobe } from "./model.ts";

const SLIDE: readonly [number, number] = [980, 552];
const POLYGONS = parseEarth(earthFile).levels[2]?.polygons ?? [];
const RINGS = POLYGONS.flat();
const GLOBE = makeGlobe(SLIDE);

test("a map puts its centre at its slide point, north up and east right", () => {
  for (const map of STORY_MAPS) {
    assert.deepEqual(project(map, map.centre), [...map.at]);
    const [x, y] = project(map, [map.centre[0] + 1, map.centre[1] + 1]);
    assert.ok(x > map.at[0] && y < map.at[1], map.name);
    // a degree of latitude is pxPerDegree
    assert.equal(map.at[1] - y, map.pxPerDegree);
  }
});

test("the globe, through a map's view, draws the coast where the map does", () => {
  // the most, and the 95th percentile, of the gaps, in slide px: the fit in
  // the production task's progress (phase 5) found 12.8 and 6.8 for Juan
  // Fernández, 14.0 and 7.3 for Cape Noir, and 0.9 and 0.8 for Scilly
  const limits = new Map<StoryMap, { most: number; percentile: number }>([
    [CAPE_NOIR, { most: 15, percentile: 8 }],
    [JUAN_FERNANDEZ, { most: 14, percentile: 8 }],
    [SCILLY, { most: 1.5, percentile: 1 }],
  ]);
  for (const map of STORY_MAPS) {
    const { camera, gaps } = fitCamera(map, RINGS, SLIDE);
    const { most, percentile } = limits.get(map) ?? assert.fail();
    const at = (share: number): number =>
      gaps[Math.floor(share * (gaps.length - 1))] ?? Infinity;
    assert.ok(at(1) < most, `${map.name}: most ${String(at(1))}`);
    assert.ok(at(0.95) < percentile, `${map.name}: ${String(at(0.95))}`);
    // through the renderer's own projection, the same
    const view = globeView(camera);
    const pose = { view, ...(view.angles ?? assert.fail()) };
    let worst = 0;
    for (const ring of RINGS) {
      for (const place of ring) {
        const [mx, my] = project(map, place);
        if (mx < 0 || mx > SLIDE[0] || my < 0 || my > SLIDE[1]) continue;
        const [gx, gy] = slidePoint(pose, SLIDE, toSphere(place));
        worst = Math.max(worst, Math.hypot(gx - mx, gy - my));
      }
    }
    assert.ok(worst < most + 0.05, `${map.name}: ${String(worst)} px`);
  }
});

test("a map's land is cut near the slide, and its small islands are apart, larger", () => {
  for (const map of STORY_MAPS) {
    const { land } = mapLand(map, POLYGONS, SLIDE);
    const numbers = [...land.matchAll(/-?\d+\.\d/g)].map((found) =>
      Number(found[0]),
    );
    assert.ok(numbers.length > 100, map.name);
    assert.ok(Math.min(...numbers) >= -20 && Math.max(...numbers) <= 1000);
  }
  const { islands, land } = mapLand(JUAN_FERNANDEZ, POLYGONS, SLIDE);
  // Robinson Crusoe and Alejandro Selkirk, at twice their size: 1:10m has
  // no ring of its own for Santa Clara
  assert.equal(islands.split("Z").length - 1, 2);
  const xs = [...islands.matchAll(/M(-?\d+\.\d),/g)].map((found) =>
    Number(found[1]),
  );
  const crusoe = project(JUAN_FERNANDEZ, [-78.83, -33.63]);
  assert.ok(xs.some((x) => Math.abs(x - crusoe[0]) < 20));
  assert.equal(mapLand(CAPE_NOIR, POLYGONS, SLIDE).islands, "");
  assert.ok(land.length > 0);
  const placed = GLOBE.maps.find(({ map }) => map === JUAN_FERNANDEZ);
  assert.equal(placed?.land.islands, islands);
});

test("at its view, a map is on the slide as it is drawn, and whole", () => {
  for (const placed of GLOBE.maps) {
    const pose = {
      view: placed.view,
      ...(placed.view.angles ?? assert.fail()),
    };
    const { matrix, opacity } = mapOnSlide(placed, pose, SLIDE);
    // single precision in the camera's matrix
    const wanted = [1, 0, 0, 1, 0, 0];
    matrix.forEach((value, index) => {
      const tolerance = index < 4 ? 1e-4 : 0.05;
      assert.ok(
        Math.abs(value - (wanted[index] ?? NaN)) < tolerance,
        `${placed.map.name}: ${matrix.join(" ")}`,
      );
    });
    assert.equal(opacity, 1);
  }
});

test("a map rides the camera, and is gone a tenth of a flight from its view", () => {
  const viewNamed = (name: string) =>
    GLOBE.views.find((view) => view.name === name) ?? assert.fail(name);
  const poseOf = (name: string) => {
    const view = viewNamed(name);
    return { view, ...(view.angles ?? assert.fail()) };
  };
  for (const [from, to] of [
    ["south america", "cape noir"],
    ["cape noir", "juan fernandez"],
    ["juan fernandez", "channel"],
    ["channel", "scilly"],
  ] as const) {
    const path = flight(poseOf(from), poseOf(to), SLIDE) ?? assert.fail();
    for (const [name, share] of [
      [from, 0.12],
      [to, 0.88],
    ] as const) {
      const placed = GLOBE.maps.find((each) => each.view.name === name);
      if (!placed) continue;
      const pose = path.at(share);
      const { matrix, opacity } = mapOnSlide(placed, pose, SLIDE);
      assert.ok(
        opacity < 0.05,
        `${name} at ${String(share)}: ${String(opacity)}`,
      );
      // the map's centre goes where the globe draws its place, as near as
      // at rest, at the pose's zoom
      const rest = {
        view: placed.view,
        ...(placed.view.angles ?? assert.fail()),
      };
      const centre = toSphere(placed.map.centre);
      const [rx, ry] = slidePoint(rest, SLIDE, centre);
      const [x, y] = placed.map.at;
      const zoom = pose.view.scale / placed.view.scale;
      const [a, b, c, d, e, f] = matrix;
      const [gx, gy] = slidePoint(pose, SLIDE, centre);
      const gap = Math.hypot(a * x + c * y + e - gx, b * x + d * y + f - gy);
      assert.ok(
        gap < Math.hypot(rx - x, ry - y) * zoom + 2,
        `${name}: the map's centre is ${String(gap)} px from the globe's`,
      );
    }
  }
  // on the globe's first view, no map shows
  for (const placed of GLOBE.maps) {
    assert.equal(mapOnSlide(placed, poseOf("south america"), SLIDE).opacity, 0);
  }
});

/** The place that shows at the slide point `at` through `pose`, or null
 *  off the globe: the point of the globe's near side that the orthographic
 *  camera puts there. */
function placeOnSlide(
  pose: CameraPose,
  at: readonly [number, number],
): readonly [number, number] | null {
  const toward = towardCamera(pose);
  // two unit vectors across the camera's direction
  const helper: Vec3 = Math.abs(toward[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const unit = (v: Vec3): Vec3 => {
    const length = Math.hypot(...v);
    return [v[0] / length, v[1] / length, v[2] / length];
  };
  const u = unit(cross(toward, helper));
  const v = cross(toward, u);
  const [a, b, c, d, e, f] = planeOnSlide(pose, SLIDE, {
    origin: CENTRE,
    u,
    v,
  });
  const [x, y] = [at[0] - e, at[1] - f];
  const determinant = a * d - b * c;
  const [along, across] = [
    (d * x - c * y) / determinant,
    (a * y - b * x) / determinant,
  ];
  const flat = Math.hypot(along, across);
  if (flat > RADIUS) return null;
  const up = Math.sqrt(RADIUS * RADIUS - flat * flat);
  const world = [0, 1, 2].map(
    (axis) =>
      (u[axis] ?? 0) * along +
      (v[axis] ?? 0) * across +
      (toward[axis] ?? 0) * up,
  );
  const [wx, wy, wz] = [world[0] ?? 0, world[1] ?? 0, world[2] ?? 0];
  return [
    (Math.atan2(-wy, wx) * 180) / Math.PI,
    (Math.asin(wz / RADIUS) * 180) / Math.PI,
  ];
}

test("a flight shows the places between its views, not beyond them", () => {
  const poseOf = (name: string) => {
    const view =
      GLOBE.views.find((each) => each.name === name) ?? assert.fail(name);
    return { view, ...(view.angles ?? assert.fail()) };
  };
  const middle = [SLIDE[0] / 2, SLIDE[1] / 2] as const;
  for (const [from, to] of [
    ["south america", "cape noir"],
    ["cape noir", "juan fernandez"],
    ["juan fernandez", "channel"],
    ["channel", "scilly"],
  ] as const) {
    const path = flight(poseOf(from), poseOf(to), SLIDE) ?? assert.fail();
    const [start, end] = [path.at(0), path.at(1)].map(
      (pose) => placeOnSlide(pose, middle) ?? assert.fail(),
    );
    const [low, high] = [
      Math.min(start?.[1] ?? 0, end?.[1] ?? 0),
      Math.max(start?.[1] ?? 0, end?.[1] ?? 0),
    ];
    // the place at the slide's middle stays within the latitudes of the
    // ends, and a little more: a great circle bows toward the pole
    for (let step = 0; step <= 20; step++) {
      const place = placeOnSlide(path.at(step / 20), middle);
      assert.ok(place, `${from} to ${to} at ${String(step / 20)}`);
      assert.ok(
        place[1] > low - 2 && place[1] < high + 12,
        `${from} to ${to} at ${String(step / 20)}: ${place.join(", ")}`,
      );
    }
  }
});
