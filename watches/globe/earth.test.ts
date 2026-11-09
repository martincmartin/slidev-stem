// globe/earth.json: it parses, and each level has the land that the story
// needs: the islands at 1:10m, and only near its boxes; and the state lines
// of New England.

import assert from "node:assert/strict";
import { test } from "node:test";
import earthFile from "./earth.json" with { type: "json" };
import { parseEarth, SCALES } from "./earth.ts";
import type { LonLat, Polygon } from "./earth.ts";

const EARTH = parseEarth(earthFile);

/** Whether the point is on the polygon's land: in its outline, not in a
 *  hole (even-odd). */
function onLand(polygon: Polygon, [lon, lat]: LonLat): boolean {
  let crossings = 0;
  for (const ring of polygon) {
    ring.forEach(([lonA, latA], index) => {
      const [lonB, latB] = ring[(index + 1) % ring.length] ?? [lonA, latA];
      if (latA > lat !== latB > lat) {
        const crossing = lonA + ((lat - latA) / (latB - latA)) * (lonB - lonA);
        if (crossing > lon) crossings++;
      }
    });
  }
  return crossings % 2 === 1;
}

test("the levels are the scales, in order, and only 1:10m has boxes", () => {
  assert.deepEqual(
    EARTH.levels.map((level) => level.scale),
    [...SCALES],
  );
  assert.deepEqual(
    EARTH.levels.map((level) => level.boxes.length),
    [0, 0, 3],
  );
});

test("1:10m has the story's islands, and 1:110m does not", () => {
  const places: [string, LonLat][] = [
    ["Robinson Crusoe Island", [-78.83, -33.63]],
    ["Alejandro Selkirk Island", [-80.74, -33.73]],
    ["St Mary's, Isles of Scilly", [-6.3, 49.92]],
  ];
  const [coarse, , fine] = EARTH.levels;
  for (const [name, place] of places) {
    assert.ok(
      fine?.polygons.some((polygon) => onLand(polygon, place)),
      `${name} at 1:10m`,
    );
    assert.ok(
      !coarse?.polygons.some((polygon) => onLand(polygon, place)),
      `${name} at 1:110m`,
    );
  }
});

test("1:10m's land is within 2 degrees of its boxes", () => {
  const fine = EARTH.levels[2];
  assert.ok(fine);
  for (const polygon of fine.polygons) {
    const [lon, lat] = polygon[0]?.[0] ?? [0, 0];
    assert.ok(
      fine.boxes.some(
        (box) =>
          box.west - 2 <= lon &&
          lon <= box.east + 2 &&
          box.south - 2 <= lat &&
          lat <= box.north + 2,
      ),
      `a polygon at ${String([lon, lat])}`,
    );
  }
});

test("1:10m has Narragansett Bay, which 1:110m fills with land", () => {
  // the bay between Prudence Island and Warwick
  const bay: LonLat = [-71.38, 41.66];
  const [coarse, , fine] = EARTH.levels;
  assert.ok(!fine?.polygons.some((polygon) => onLand(polygon, bay)));
  assert.ok(coarse?.polygons.some((polygon) => onLand(polygon, bay)));
});

test("the borders are New England's state lines, near its box", () => {
  // where Massachusetts, Rhode Island and Connecticut meet
  const tripoint: LonLat = [-71.801, 42.011];
  assert.ok(
    EARTH.borders.some((line) =>
      line.some(
        ([lon, lat]) =>
          Math.abs(lon - tripoint[0]) < 0.002 &&
          Math.abs(lat - tripoint[1]) < 0.002,
      ),
    ),
    "the tripoint of Massachusetts, Rhode Island and Connecticut",
  );
  for (const line of EARTH.borders) {
    assert.ok(line.length >= 2);
    for (const [lon, lat] of line) {
      assert.ok(lon >= -77 && lon <= -66 && lat >= 37 && lat <= 47);
    }
  }
});

test("a file that is not the Earth throws, with the place", () => {
  assert.throws(() => parseEarth({}), /no levels/);
  assert.throws(
    () => parseEarth({ levels: [{ scale: "50m", boxes: [], polygons: [] }] }),
    /1 levels, not 3/,
  );
  const level = (scale: string, ring: unknown) => ({
    scale,
    boxes: [],
    polygons: [[ring]],
  });
  const good = [0, 0, 1, 0, 1, 1];
  assert.throws(
    () =>
      parseEarth({
        levels: [
          level("110m", good),
          level("50m", [0, 0, 1, 0]),
          level("10m", good),
        ],
      }),
    /levels\[1\]\.polygons\[0\]\[0\] is not a flat list/,
  );
  assert.throws(
    () =>
      parseEarth({
        levels: [
          level("110m", [0, 0, 1, 0, 200, 1]),
          level("50m", good),
          level("10m", good),
        ],
      }),
    /off the Earth/,
  );
  const levels = [level("110m", good), level("50m", good), level("10m", good)];
  assert.throws(() => parseEarth({ levels }), /no borders/);
  assert.throws(
    () => parseEarth({ levels, borders: [[0, 0]] }),
    /borders\[0\] is not a flat list of 2 or more points/,
  );
});
