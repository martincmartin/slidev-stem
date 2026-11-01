import assert from "node:assert/strict";
import { test } from "node:test";
import { CAPE_NOIR, JUAN_FERNANDEZ, project } from "./maps.ts";
import { makeGlobe } from "./model.ts";
import { anchorPoint, offGlobe, onLand, overSea, unproject } from "./labels.ts";
import type { Picture } from "./labels.ts";

const SLIDE: readonly [number, number] = [980, 552];
const GLOBE = makeGlobe(SLIDE);

function pictureNamed(name: string): Picture {
  const found = GLOBE.pictures.find((picture) => picture.view.name === name);
  if (!found) throw new Error(`no picture ${name}`);
  return found;
}
const AMERICA = pictureNamed("south america");
const NOIR = pictureNamed(CAPE_NOIR.name);
const SEARCH = pictureNamed(JUAN_FERNANDEZ.name);

const near = (
  first: readonly number[],
  second: readonly number[],
  within: number,
) =>
  first.every(
    (value, index) => Math.abs(value - (second[index] ?? NaN)) < within,
  );

test("each view is a picture, in the scene's order", () => {
  assert.deepEqual(
    GLOBE.pictures.map(({ view }) => view),
    GLOBE.views,
  );
});

test("a picture takes a place to its slide point and back", () => {
  for (const picture of GLOBE.pictures) {
    const middle = picture.place([490, 300]);
    assert.ok(middle, picture.view.name);
    const point = picture.point(middle);
    assert.ok(point && near(point, [490, 300], 1e-6), picture.view.name);
  }
  assert.ok(
    near(
      unproject(CAPE_NOIR, project(CAPE_NOIR, [-73, -54])),
      [-73, -54],
      1e-9,
    ),
  );
});

test("a point off the globe is no place, and the far side shows nowhere", () => {
  const camera = {
    name: "test",
    centre: [0, 0] as const,
    at: [0, 0] as const,
    kmPerPx: 10,
  };
  assert.equal(offGlobe(camera, [700, 0]), null);
  assert.ok(near(offGlobe(camera, [0, 0]) ?? [], [0, 0], 1e-9));
  assert.equal(AMERICA.point([120, 0]), null);
});

test("the land: Brazil and Chiloé are land, the oceans are not", () => {
  assert.equal(onLand(AMERICA.land, [-50, -10]), true);
  assert.equal(onLand(AMERICA.land, [-30, -30]), false);
  assert.equal(onLand(AMERICA.land, [-90, -30]), false);
  assert.equal(onLand(NOIR.land, [-73.9, -42.4]), true);
});

test("a label's box is over the sea only if no point of it is on the land", () => {
  const box = (left: number, top: number) => ({
    left,
    top,
    width: 120,
    height: 30,
  });
  // west of the Juan Fernández search, on the open sea; and on Chile
  assert.equal(overSea(SEARCH, box(340, 360)), true);
  assert.equal(overSea(SEARCH, box(800, 262)), false);
  // the corner of the South America slide is off the globe: the paper
  assert.equal(overSea(AMERICA, box(0, 0)), false);
});

test("a label is placed from a place, a dashed ship or a leg's end", () => {
  const ghost = NOIR.story?.marks.find(
    (mark) => mark.name === "estimated",
  )?.ghost;
  assert.deepEqual(anchorPoint(NOIR, { mark: "estimated" }), ghost);
  assert.deepEqual(
    anchorPoint(SEARCH, { leg: "east" }),
    SEARCH.story?.legs.find((leg) => leg.name === "east")?.route.at(-1),
  );
  assert.deepEqual(
    anchorPoint(NOIR, { on: [-73, -54] }),
    project(CAPE_NOIR, [-73, -54]),
  );
  assert.deepEqual(anchorPoint(NOIR, {}), [0, 0]);
  assert.throws(() => anchorPoint(NOIR, { leg: "east" }), /no leg "east"/);
  assert.throws(
    () => anchorPoint(AMERICA, { mark: "estimated" }),
    /no dashed ship/,
  );
  assert.throws(() => anchorPoint(NOIR, { mark: "x", leg: "y" }), /not two/);
});
