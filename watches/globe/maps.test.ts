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
  project,
} from "./maps.ts";
import type { StoryMap } from "./maps.ts";
import { storyLand } from "./model.ts";
import { globeView } from "./views.ts";

const SLIDE: readonly [number, number] = [980, 552];
const POLYGONS = parseEarth(earthFile).levels[2]?.polygons ?? [];
const RINGS = POLYGONS.flat();

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
  assert.equal(storyLand(SLIDE).get(JUAN_FERNANDEZ)?.islands, islands);
});
