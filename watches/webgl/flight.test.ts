import assert from "node:assert/strict";
import { test } from "node:test";
import { FLIGHT, ballPoint, flight, pacedShare } from "./flight.ts";
import { pivotOnSlide, slidePoint, towardCamera } from "./renderer.ts";
import type { CameraPose, Mesh, Vec3, View } from "./scene.ts";
import { TOGETHER_SECONDS, Timeline } from "./timeline.ts";
import type { StageState } from "./timeline.ts";

const SLIDE: readonly [number, number] = [980, 552];
const PIVOT: Vec3 = [800, 5000, 0];
const RADIUS = 500;

/** A pose that looks at (lon, lat) on the ball, which shows at `at`. */
function pose(
  lon: number,
  lat: number,
  scale: number,
  at: readonly [number, number] = [490, 300],
  ball: number | null = RADIUS,
): CameraPose {
  const view: View = {
    name: `${String(lon)}, ${String(lat)}`,
    scale,
    shift: [at[0] - scale * PIVOT[0], at[1] - scale * PIVOT[1]],
    pivot: PIVOT,
    ...(ball === null ? {} : { ball }),
  };
  return { view, tilt: 90 - lat, turn: 90 + lon };
}

const near = (actual: number, wanted: number, tolerance = 1e-9): boolean =>
  Math.abs(actual - wanted) <= tolerance;

const NOIR = pose(-76, -55, 8.6);
const ANSON = pose(-78.83, -33.64, 8.6, [230, 300]);
const CHANNEL = pose(-2.5, 49.7, 14);
const AMERICA = pose(-58, -21.8, 0.8);

test("a flight starts and ends at its poses", () => {
  for (const [from, to] of [
    [NOIR, ANSON],
    [ANSON, CHANNEL],
    [AMERICA, NOIR],
  ] as const) {
    const path = flight(from, to, SLIDE) ?? assert.fail();
    for (const [share, end] of [
      [0, from],
      [1, to],
    ] as const) {
      const camera = path.along(share);
      assert.ok(
        near(camera.view.scale, end.view.scale, 1e-6),
        `scale at ${String(share)}`,
      );
      const [x, y] = pivotOnSlide(camera.view);
      const [wantedX, wantedY] = pivotOnSlide(end.view);
      assert.ok(near(x, wantedX, 1e-6) && near(y, wantedY, 1e-6));
      assert.ok(near(camera.tilt, end.tilt, 1e-6), `tilt at ${String(share)}`);
      assert.ok(near(camera.turn, end.turn, 1e-6), `turn at ${String(share)}`);
    }
  }
});

test("a flight pans along the great circle, and zooms out as far as the pan needs", () => {
  const path = flight(ANSON, CHANNEL, SLIDE) ?? assert.fail();
  const [a, b] = [towardCamera(ANSON), towardCamera(CHANNEL)];
  const normal: Vec3 = [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  let least = Infinity;
  let previous = -Infinity;
  for (let step = 0; step <= 20; step++) {
    const camera = path.along(step / 20);
    const toward = towardCamera(camera);
    const off =
      toward[0] * normal[0] + toward[1] * normal[1] + toward[2] * normal[2];
    assert.ok(near(off, 0, 1e-9), `off the great circle at ${String(step)}`);
    // it goes on from a toward b
    const along = toward[0] * b[0] + toward[1] * b[1] + toward[2] * b[2];
    assert.ok(along >= previous - 1e-12);
    previous = along;
    least = Math.min(least, camera.view.scale);
  }
  // across the Atlantic, the globe is about the slide's width on the way
  assert.ok(least < ANSON.view.scale / 5, `scale ${String(least)}`);
  assert.ok(path.seconds > 4, `${String(path.seconds)} s`);
});

test("a flight's time is a ramp and its seen length at one speed", () => {
  const short = flight(NOIR, pose(-76, -55, 9), SLIDE) ?? assert.fail();
  const zoom = flight(AMERICA, NOIR, SLIDE) ?? assert.fail();
  const far = flight(ANSON, CHANNEL, SLIDE) ?? assert.fail();
  assert.ok(short.seconds > FLIGHT.ramp && short.seconds < zoom.seconds);
  assert.ok(zoom.seconds < far.seconds);
});

test("a paced flight ramps up and down, and goes at one speed between", () => {
  assert.equal(pacedShare(0, 5), 0);
  assert.equal(pacedShare(5, 5), 1);
  // a ramp of 1 s at 1/4 of the way a second: 1/8 of the way
  assert.ok(near(pacedShare(1, 5), 1 / 8, 1e-12));
  assert.ok(near(pacedShare(2.5, 5), 0.5, 1e-12));
  assert.ok(near(pacedShare(3, 5) - pacedShare(2, 5), 0.25, 1e-12));
  // a flight shorter than two ramps ramps up for half, and down for half
  assert.ok(near(pacedShare(0.5, 1), 0.5, 1e-12));
  // the eye sees one speed in the cruise: the ground at the slide's middle
  // and the zoom at its edge, in slide widths a second
  const path = flight(ANSON, CHANNEL, SLIDE) ?? assert.fail();
  const middle = [SLIDE[0] / 2, SLIDE[1] / 2] as const;
  const seen = (time: number): number => {
    const step = 0.01;
    const [pose, next] = [time, time + step].map((each) =>
      path.at(each / path.seconds, path.seconds),
    );
    if (!pose || !next) return NaN;
    const ground = ballPoint(pose, SLIDE, middle) ?? assert.fail();
    const [x, y] = slidePoint(next, SLIDE, ground);
    const zoom =
      (Math.abs(Math.log(next.view.scale / pose.view.scale)) * SLIDE[0]) / 2;
    return Math.hypot(x - middle[0], y - middle[1], zoom) / SLIDE[0] / step;
  };
  for (let time = 1.2; time < path.seconds - 1.2; time += 0.25) {
    assert.ok(
      Math.abs(seen(time) - FLIGHT.speed) < 0.05,
      `${String(time)} s: ${String(seen(time))}`,
    );
  }
});

test("a zoom with no pan keeps the camera's direction", () => {
  const path = flight(NOIR, pose(-76, -55, 1), SLIDE) ?? assert.fail();
  for (const share of [0.25, 0.5, 0.75]) {
    const camera = path.along(share);
    assert.ok(near(camera.tilt, NOIR.tilt, 1e-9));
    assert.ok(near(camera.turn, NOIR.turn, 1e-9));
    assert.ok(camera.view.scale < NOIR.view.scale && camera.view.scale > 1);
  }
});

test("a flight needs two views of one ball", () => {
  const noBall = pose(-78.83, -33.64, 8.6, [230, 300], null);
  assert.equal(flight(NOIR, noBall, SLIDE), null);
  assert.equal(
    flight(NOIR, pose(-78.83, -33.64, 8.6, [230, 300], 400), SLIDE),
    null,
  );
  const moved = {
    ...ANSON,
    view: { ...ANSON.view, pivot: [0, 0, 0] as const },
  };
  assert.equal(flight(NOIR, moved, SLIDE), null);
});

// ---- the timeline ----------------------------------------------------------

const SHOWN: ReadonlySet<Mesh> = new Set([
  { name: "globe" } as unknown as Mesh,
]);

function state(
  camera: CameraPose,
  options: Partial<StageState> = {},
): StageState {
  return {
    view: camera.view,
    tilt: camera.tilt,
    turn: camera.turn,
    shown: SHOWN,
    flash: null,
    later: new Set(),
    cut: new Set(),
    goLater: new Set(),
    moveWith: "common",
    ...options,
  };
}

test("with move: fly, the camera flies in the flight's time, or in moveSeconds", () => {
  const seconds = (flight(ANSON, CHANNEL, SLIDE) ?? assert.fail()).seconds;
  const timeline = new Timeline(SLIDE);
  timeline.show(state(ANSON), 0, true);
  timeline.show(state(CHANNEL, { move: "fly" }), 0);
  assert.equal(timeline.phaseAt(0), "flight");
  assert.equal(timeline.viewEndAt(0), seconds * 1000);
  const middle = timeline.valuesAt(seconds * 500);
  assert.ok(middle.view.scale < CHANNEL.view.scale / 10);
  const end = timeline.valuesAt(seconds * 1000);
  assert.equal(end.view, CHANNEL.view);
  timeline.show(state(ANSON, { move: "fly", moveSeconds: 7 }), seconds * 1000);
  assert.equal(timeline.viewEndAt(seconds * 1000), seconds * 1000 + 7000);
});

test("with move: fly between views that are not of one ball, the camera moves together", () => {
  const timeline = new Timeline(SLIDE);
  const off = pose(-78.83, -33.64, 8.6, [230, 300], null);
  timeline.show(state(NOIR), 0, true);
  timeline.show(state(off, { move: "fly" }), 0);
  assert.equal(timeline.phaseAt(0), "camera");
  assert.equal(timeline.viewEndAt(0), TOGETHER_SECONDS * 1000);
});
