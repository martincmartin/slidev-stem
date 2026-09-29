// The watch on a slide: a live Stage that moves its camera from view to view,
// fades the rest of the watch away from a subject, and runs the mechanism;
// and stills for the pages that must not animate (print and export, the
// overview, the presenter's "next" pane).
//
// A spike for deck/. A slide asks for a state:
//   { view, tilt, only, settled }
// view: a view's name; tilt: degrees; only: a subject's name (the rest of the
// watch fades out) or undefined; settled: the balance stops at rest.
//
// THE ORDER. Each change runs one channel at a time, eased: towards a subject
// the camera moves, then the rest fades, then the camera tilts; away from it,
// the reverse. A new state starts from what is on the screen now, so a
// change during a transition does not jump.
//
// THE BALANCE. It swings as q = A cos(2 pi t / T). To settle, it waits for the
// next extreme (|q| = A, where it is still), then goes to rest (q = 0) as
//   q = q_e (1 - s(u)),  s(u) = 3u^2 - 2u^3,  u = (t - t_e) / D,
// with D = sqrt(6) / omega = 0.78 s for T = 2 s. Its angle, speed and
// acceleration at t_e are those of the free swing, and its speed is 0 at the
// end. (The 2026-09-27 plan, "The settle curve", measured the other methods;
// this one has no jump in any of the three.) To resume: a cubic from where it
// is, at the speed it has, on to the opposite extreme, still, in D; then the
// free swing. From rest, that cubic is the settle mirrored, and it meets the
// free swing with no jump in acceleration either.
//
// The rest of the mechanism follows the balance, by the mechanism time at
// which the free swing has the balance's angle (the 2026-09-27 plan's time
// map): tau = t_e + arccos(q / q_e) / omega. So the train stops when the
// balance stops, with the fork on its centre line, and it only runs forward.
import { Renderer } from "./renderer.js";

export const MOVE_SECONDS = 1.8;
export const FADE_SECONDS = 0.8;
export const TILT_SECONDS = 1.5;

function ease(u) {
  return u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2;
}

function smoothstep(u) {
  return u * u * (3 - 2 * u);
}

// The cubic from `from` at `speed` (per unit of u) to `to`, still, at u = 1.
function hermite(from, speed, to, u) {
  const cube = u * u * u;
  const square = u * u;
  return (2 * cube - 3 * square + 1) * from + (cube - 2 * square + u) * speed + (3 * square - 2 * cube) * to;
}

function mix(first, second, u) {
  return first + (second - first) * u;
}

function mixView(first, second, u) {
  return {
    scale: mix(first.scale, second.scale, u),
    shift: first.shift.map((value, index) => mix(value, second.shift[index], u)),
    pivot: first.pivot.map((value, index) => mix(value, second.pivot[index], u)),
  };
}

// The scene's names, resolved to its objects once, at the boundary with the
// slides' frontmatter.
function viewNamed(scene, name) {
  const view = scene.views.find((candidate) => candidate.name === name);
  if (!view) throw new Error(`no watch view ${name}`);
  return view;
}

function subjectNamed(scene, name) {
  if (name === undefined) return null;
  const subject = scene.subjects.find((candidate) => candidate.name === name);
  if (!subject) throw new Error(`no watch subject ${name}`);
  return new Set(subject.solids.map((index) => scene.solids[index]));
}

// The element's size on the screen, in device px. Slidev scales the slide with
// a CSS transform, which clientWidth leaves out: the bounding box has it.
function deviceSize(element) {
  const ratio = window.devicePixelRatio || 1;
  const { width, height } = element.getBoundingClientRect();
  return [Math.max(1, Math.round(width * ratio)), Math.max(1, Math.round(height * ratio))];
}

// ---- the balance's clock ---------------------------------------------------------------
// Times: `now` in ms (performance.now()); mechanism time in s.
export class Balance {
  constructor(swing, now) {
    this.amplitude = swing.amplitude;
    this.period = swing.period;
    this.settleSeconds = Math.sqrt(6) / ((2 * Math.PI) / swing.period);
    this.mode = { name: "free", anchor: now, from: 0 }; // mechanism time `from` at `anchor`
  }

  swingAt(time) {
    return this.amplitude * Math.cos((2 * Math.PI * time) / this.period);
  }

  // Move the mode on to `now`: a wait that reached its extreme, a settle or a
  // resume that ended. The boundary times are exact, so a late frame lands
  // on the right curve and never beyond it.
  advance(now) {
    const mode = this.mode;
    const seconds = this.settleSeconds * 1000;
    if (mode.name === "waiting") {
      const reached = mode.anchor + (mode.extreme - mode.from) * 1000;
      if (now >= reached) this.mode = { name: "settling", start: reached, extreme: mode.extreme, from: this.swingAt(mode.extreme) };
    }
    if (this.mode.name === "settling" && now >= this.mode.start + seconds) {
      this.mode = { name: "rest", extreme: this.mode.extreme };
    }
    if (this.mode.name === "resuming" && now >= this.mode.start + seconds) {
      const { start, extreme, settleAfter } = this.mode;
      const opposite = extreme + this.period / 2;
      this.mode = settleAfter
        ? { name: "settling", start: start + seconds, extreme: opposite, from: this.swingAt(opposite) }
        : { name: "free", anchor: start + seconds, from: opposite };
      this.advance(now);
    }
  }

  time(now) {
    this.advance(now);
    const mode = this.mode;
    if (mode.name === "free" || mode.name === "waiting") return mode.from + (now - mode.anchor) / 1000;
    const ratio = Math.min(1, Math.max(-1, this.angle(now) / this.swingAt(mode.extreme)));
    return mode.extreme + (Math.acos(ratio) * this.period) / (2 * Math.PI);
  }

  angle(now) {
    this.advance(now);
    const mode = this.mode;
    const u = (start) => Math.min(1, (now - start) / (this.settleSeconds * 1000));
    if (mode.name === "free" || mode.name === "waiting") return this.swingAt(this.time(now));
    if (mode.name === "settling") return mode.from * (1 - smoothstep(u(mode.start)));
    if (mode.name === "rest") return 0;
    const opposite = this.swingAt(mode.extreme + this.period / 2);
    return hermite(mode.from, mode.speed * this.settleSeconds, opposite, u(mode.start)); // resuming
  }

  // Degrees per second, while settling (the only mode a resume can start in
  // while it moves).
  settlingSpeed(now) {
    const mode = this.mode;
    if (mode.name !== "settling") return 0;
    const u = Math.min(1, (now - mode.start) / (this.settleSeconds * 1000));
    return (-mode.from * 6 * u * (1 - u)) / this.settleSeconds;
  }

  // Wait for the next extreme (they come every half period), then settle.
  settle(now) {
    this.advance(now);
    const mode = this.mode;
    if (mode.name === "free") {
      const half = this.period / 2;
      const extreme = Math.ceil(this.time(now) / half) * half;
      this.mode = { name: "waiting", anchor: mode.anchor, from: mode.from, extreme };
    } else if (mode.name === "resuming") {
      mode.settleAfter = true; // it is going to the opposite extreme: settle from there
    }
  }

  resume(now) {
    this.advance(now);
    const mode = this.mode;
    if (mode.name === "waiting") {
      this.mode = { name: "free", anchor: mode.anchor, from: mode.from };
    } else if (mode.name === "settling" || mode.name === "rest") {
      this.mode = {
        name: "resuming",
        start: now,
        extreme: mode.extreme,
        from: this.angle(now),
        speed: this.settlingSpeed(now),
      };
    } else if (mode.name === "resuming") {
      mode.settleAfter = false;
    }
  }

  // At once: for a slide reached directly, and for stills.
  place(settled, now) {
    this.mode = settled ? { name: "rest", extreme: 0 } : { name: "free", anchor: now, from: 0 };
  }

  get moving() {
    return this.mode.name !== "rest";
  }
}

// ---- the live stage --------------------------------------------------------------------
const TOWARDS_SUBJECT = ["view", "rest", "tilt"];
const SECONDS = { view: MOVE_SECONDS, rest: FADE_SECONDS, tilt: TILT_SECONDS };

export class Stage {
  constructor(canvas, scene) {
    this.canvas = canvas;
    this.scene = scene;
    this.renderer = new Renderer(canvas, scene);
    this.balance = new Balance(scene.swing, performance.now());
    this.running = false;
    this.values = null; // { view, tilt, rest }: where each channel is, when no phase runs
    this.phases = []; // { channel, from, to, start, seconds }, one after another
    this.keep = null; // the subject's solids, while the rest is faded or fading
    // For the measurement scripts: each frame's start, JS time and phase.
    this.frameStarts = [];
    this.drawTimes = [];
    this.framePhases = [];
    this.frameSizes = []; // [start, "width x height"] at each change of the drawing's size
    this.frame = this.frame.bind(this);
  }

  // Go to a slide's state: at once, or one channel at a time from where the
  // camera and the fade are now.
  show(state, { instantly = false } = {}) {
    const now = performance.now();
    const keep = subjectNamed(this.scene, state.only);
    const target = { view: viewNamed(this.scene, state.view), tilt: state.tilt ?? 0, rest: keep ? 0 : 1 };
    if (keep) this.keep = keep;
    if (instantly || !this.values) {
      this.values = target;
      this.phases = [];
      this.balance.place(Boolean(state.settled), now);
      return;
    }
    const current = this.valuesAt(now);
    const order = target.rest < current.rest ? TOWARDS_SUBJECT : [...TOWARDS_SUBJECT].reverse();
    this.values = current;
    this.phases = [];
    let start = now;
    for (const channel of order) {
      if (current[channel] === target[channel]) continue;
      this.phases.push({ channel, from: current[channel], to: target[channel], start, seconds: SECONDS[channel] });
      start += SECONDS[channel] * 1000;
    }
    if (state.settled) this.balance.settle(now);
    else this.balance.resume(now);
  }

  valuesAt(now) {
    const values = { ...this.values };
    for (const phase of this.phases) {
      if (now < phase.start) continue;
      const u = Math.min(1, (now - phase.start) / (phase.seconds * 1000));
      const eased = ease(u);
      // At its end, the target itself, so that the next state can tell that
      // this channel is already there.
      values[phase.channel] =
        u >= 1 ? phase.to : phase.channel === "view" ? mixView(phase.from, phase.to, eased) : mix(phase.from, phase.to, eased);
    }
    return values;
  }

  phaseAt(now) {
    const running = this.phases.find(
      (phase) => now >= phase.start && now < phase.start + phase.seconds * 1000,
    );
    if (running) return running.channel;
    const mode = this.balance.mode.name;
    return mode === "free" ? "idle" : `balance ${mode}`;
  }

  start() {
    if (this.running) return;
    this.running = true;
    requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
  }

  frame(now) {
    if (!this.running) return;
    const before = performance.now();
    const values = this.valuesAt(now);
    const size = deviceSize(this.canvas);
    const sizeText = size.join(" x ");
    if (this.frameSizes.at(-1)?.[1] !== sizeText) this.frameSizes.push([now, sizeText]);
    this.renderer.render({
      view: values.view,
      tilt: values.tilt,
      time: this.balance.time(now),
      swing: this.balance.angle(now),
      keep: this.keep,
      rest: values.rest,
      size,
    });
    this.frameStarts.push(now);
    this.drawTimes.push(performance.now() - before);
    this.framePhases.push(this.phaseAt(now));
    requestAnimationFrame(this.frame);
  }
}

// Stills: one hidden canvas and renderer for every still of the page, so a
// page with many stills (print, the overview) has one WebGL context for them.
let stillRenderer = null;
const stills = new Map(); // key -> Promise of an object URL

// A slide's state (see the header) as a picture, at the scene's static time
// or at rest.
export function stillOf(scene, state, size) {
  const key = JSON.stringify([state.view, state.tilt ?? 0, state.only, Boolean(state.settled), size]);
  if (!stills.has(key)) {
    if (!stillRenderer) stillRenderer = new Renderer(document.createElement("canvas"), scene);
    const balance = new Balance(scene.swing, 0);
    balance.place(Boolean(state.settled), 0);
    const time = state.settled ? 0 : scene.staticTime;
    const keep = subjectNamed(scene, state.only);
    stillRenderer.render({
      view: state.view,
      tilt: state.tilt ?? 0,
      time,
      swing: state.settled ? 0 : balance.swingAt(time),
      keep,
      rest: keep ? 0 : 1,
      size,
    });
    // Read the picture back at once, before anything else draws.
    const promise = new Promise((resolve, reject) =>
      stillRenderer.canvas.toBlob((blob) => (blob ? resolve(URL.createObjectURL(blob)) : reject(new Error("no still"))), "image/png"),
    );
    stills.set(key, promise);
  }
  return stills.get(key);
}

export function stillsInfo() {
  return { stills: stills.size, contextsLost: stillRenderer?.contextsLost ?? 0 };
}
