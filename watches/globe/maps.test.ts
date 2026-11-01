import assert from "node:assert/strict";
import { test } from "node:test";
import { slidePoint } from "../webgl/renderer.ts";
import earthFile from "./earth.json" with { type: "json" };
import { parseEarth } from "./earth.ts";
import { toSphere } from "./globe.ts";
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
    const path = flight(poseOf(from), poseOf(to), SLIDE[0]) ?? assert.fail();
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
