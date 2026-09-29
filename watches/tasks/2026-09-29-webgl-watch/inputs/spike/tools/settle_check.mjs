// The balance's settle and resume (webgl/stage.js, Balance), sampled:
//
//     node settle_check.mjs          # in tools/; writes ../evidence/settle_check.json
//
// For settle requests at several phases of the swing, it records the wait
// until the balance starts to settle (it must start at the next extreme), and
// the largest jump in angle, speed and acceleration, by finite differences at
// STEP ms: over the whole run, and in a WINDOW around the extreme and around
// the stop. A curve with no jump has jumps of the order of its change in one
// step; a corner shows as a jump in speed, a kink in speed as a jump in
// acceleration. A jump at one instant falls across two steps, so about half
// of it shows. Then the same for a resume, from rest and during a settle,
// from 50 ms before it. The free swing is the control: its numbers are what
// "no jump" looks like at this step. It also records the mechanism time
// (which drives the train): it must never go back.
import { writeFileSync } from "node:fs";
import { Balance } from "./webgl/stage.js";

const SWING = { amplitude: 150, period: 2 };
const STEP = 0.1; // ms
const WINDOW = 20; // ms each side of the extreme and of the stop
const EVIDENCE = new URL("../evidence/settle_check.json", import.meta.url);

// The largest change in angle, speed and acceleration between samples.
function jumps(angles) {
  const seconds = STEP / 1000;
  const speeds = angles.slice(1).map((angle, index) => (angle - angles[index]) / seconds);
  const accelerations = speeds.slice(1).map((speed, index) => (speed - speeds[index]) / seconds);
  const largest = (values) => Math.max(...values.slice(1).map((value, index) => Math.abs(value - values[index])));
  return {
    angle: +largest(angles).toFixed(4), // degrees per step
    speed: +largest(speeds).toFixed(2), // degrees/s per step
    acceleration: +largest(accelerations).toFixed(0), // degrees/s^2 per step
    maxSpeed: +Math.max(...speeds.map(Math.abs)).toFixed(1),
    maxAcceleration: +Math.max(...accelerations.map(Math.abs)).toFixed(0),
  };
}

// Angles from `from` to `to`, calling `action` once, at the first step at or
// after `at` (time only goes forward, as in a browser).
function sample(balance, from, to, at = Infinity, action = () => {}) {
  const angles = [];
  let done = false;
  let last = -Infinity;
  for (let now = from; now <= to; now += STEP) {
    if (!done && now >= at) {
      action(now);
      done = true;
    }
    angles.push(balance.angle(now));
    const time = balance.time(now);
    backwards = Math.max(backwards, last - time);
    last = time;
  }
  return angles;
}
let backwards = 0; // s: the largest step back in mechanism time, in any run

const settleMs = (new Balance(SWING, 0).settleSeconds * 1000);
// The angles of one settle requested at `requestAt`, from `from` to `to`.
function settled(requestAt, from, to) {
  const balance = new Balance(SWING, 0);
  balance.angle(requestAt);
  balance.settle(requestAt);
  return { mode: balance.mode, angles: sample(balance, from, to) };
}

const rows = [];
for (const requestAt of [0, 250, 500, 999.9, 1000, 1000.1, 1740]) {
  const whole = settled(requestAt, requestAt, requestAt + 1000 + settleMs + 1000);
  const extremeAt = whole.mode.name === "waiting" ? whole.mode.extreme * 1000 : null;
  const firstStill = whole.angles.findIndex((angle, index) => index > 0 && angle === 0);
  const restAt = requestAt + firstStill * STEP;
  const window = (at) => jumps(settled(requestAt, Math.max(requestAt, at - WINDOW), at + WINDOW).angles);
  rows.push({
    requestAt,
    modeAfterRequest: whole.mode.name,
    extremeAt,
    restAt: +restAt.toFixed(1),
    jumps: jumps(whole.angles),
    atTheExtreme: extremeAt === null ? null : window(extremeAt),
    atTheStop: window(restAt),
  });
}

const resume = new Balance(SWING, 0);
resume.settle(0);
const resumeAngles = sample(resume, 2950, 3000 + settleMs + 2000, 3000, (now) => resume.resume(now));
// Around the resume's start (from rest) and its join with the free swing.
const resumeWindow = (at) => {
  const balance = new Balance(SWING, 0);
  balance.settle(0);
  return jumps(sample(balance, at - WINDOW, at + WINDOW, 3000, (now) => balance.resume(now)));
};

// During the settle: back to the extreme, then swing.
const midway = new Balance(SWING, 0);
midway.settle(100);
const midwayAngles = sample(midway, 1250, 1300 + settleMs + 2000, 1300, (now) => midway.resume(now));

const free = new Balance(SWING, 0);
const result = {
  swing: SWING,
  settleSeconds: +(settleMs / 1000).toFixed(4),
  stepMs: STEP,
  control: { freeSwing: jumps(sample(free, 0, 4000)) },
  settles: rows,
  resumeFromRest: {
    whole: jumps(resumeAngles),
    atTheStart: resumeWindow(3000),
    atTheJoin: resumeWindow(3000 + settleMs),
  },
  resumeDuringSettle: jumps(midwayAngles),
  largestStepBackInMechanismTime: backwards,
};
writeFileSync(EVIDENCE, JSON.stringify(result, null, 1) + "\n");
console.log(JSON.stringify(result, null, 1));
