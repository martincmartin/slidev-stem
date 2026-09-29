// A watch on a canvas that moves between views: the camera, the fades, and
// one draw per frame. The spike deck's global layer uses it (../deck/).
//
// A change of view runs in three phases, each skipped when it has nothing to
// do: the parts that the new view shows fade in; the camera moves; the parts
// that it hides fade out. So a zoom in moves first and then fades, and a zoom
// out fades first and then moves.
//
// The camera is linear in scale. Its translation is then linear in scale
// too, which keeps one point of the canvas still (a dolly), so all three
// numbers move with the same eased fraction.
//
// The mechanism's clock is the time since the stage was made. It does not
// depend on drawing, so the stage can stop drawing while it is hidden.

import { DRAW_OPTIONS, camera, draw } from "./watch_player.js";

// Milliseconds; a frozen value; variants with {...TIMING, move: 2400}.
export const TIMING = Object.freeze({ move: 1800, fade: 800 });

// CSS's cubic-bezier() timing function.
export function cubicBezier(x1, y1, x2, y2) {
  // one coordinate of the curve at the Bezier parameter `along` (0 to 1)
  const bezier = (along, p1, p2) =>
    3 * p1 * along * (1 - along) ** 2 + 3 * p2 * along ** 2 * (1 - along) + along ** 3;
  return time => {
    let low = 0, high = 1;
    for (let step = 0; step < 30; step++) {
      const middle = (low + high) / 2;
      if (bezier(middle, x1, x2) < time) low = middle; else high = middle;
    }
    return bezier((low + high) / 2, y1, y2);
  };
}
const EASE_IN_OUT = cubicBezier(0.42, 0, 0.58, 1); // the camera
const EASE = cubicBezier(0.25, 0.1, 0.25, 1); // the fades

// Where the camera looks, and which parts stay visible (null: every part).
export class View {
  constructor(name, camera, kept) {
    this.name = name; // the name a slide's frontmatter uses
    this.camera = camera;
    this.kept = kept; // Part[] or null
  }

  shows(part) {
    return this.kept === null || this.kept.includes(part);
  }
}

// The views that the SVG's own <style> describes, plus "cover", the whole
// watch. A stand-in: the generator should write views as data (the zoom
// task's PLAN.md, step 2), not as CSS for a reader to parse.
export function viewsFrom(svgText, drawing) {
  const views = [new View("cover", camera(0, 0, 1), null)];
  const rule = /svg\[data-view=(\w+)\] \{ --cam-x: (-?[\d.]+); --cam-y: (-?[\d.]+); --cam-s: ([\d.]+);/g;
  for (const [, name, x, y, scale] of svgText.matchAll(rule)) {
    const kept = drawing.parts.filter(part =>
      svgText.includes(`svg[data-view=${name}] [data-part]:not([data-part=${part.name}])`));
    views.push(new View(name, camera(Number(x), Number(y), Number(scale)), kept));
  }
  return views;
}

// One number moving from `from` to `to`.
class Tween {
  constructor(from, to, start, duration, easing) {
    this.from = from;
    this.to = to;
    this.start = start;
    this.duration = duration;
    this.easing = easing;
  }

  valueAt(now) {
    const time = this.duration ? Math.min(Math.max((now - this.start) / this.duration, 0), 1) : 1;
    return this.from + (this.to - this.from) * this.easing(time);
  }
}

function between(from, to, fraction) {
  const mix = (start, end) => start + (end - start) * fraction;
  return camera(mix(from.x, to.x), mix(from.y, to.y), mix(from.scale, to.scale));
}

export class WatchStage {
  constructor(canvas, drawing, views, timing = TIMING, options = DRAW_OPTIONS) {
    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.drawing = drawing;
    this.views = views;
    this.timing = timing;
    this.options = options;
    this.clockStart = performance.now();
    this.view = views[0];
    this.move = { from: this.view.camera, to: this.view.camera, tween: null };
    this.fades = new Map(drawing.parts.map(part => [part, new Tween(1, 1, 0, 0, EASE)]));
    this.request = null; // the pending requestAnimationFrame, while running
    this.frame = this.frame.bind(this);
  }

  cameraAt(now) {
    const { from, to, tween } = this.move;
    return tween ? between(from, to, tween.valueAt(now)) : to;
  }

  // Go to `view`, with the three phases; or at once, for print.
  show(view, { instantly = false } = {}) {
    const now = performance.now();
    const { fade, move } = instantly ? { fade: 0, move: 0 } : this.timing;
    const opacity = new Map([...this.fades].map(([part, tween]) => [part, tween.valueAt(now)]));
    const appearing = this.drawing.parts.filter(part => view.shows(part) && opacity.get(part) < 1);
    const moveStart = now + (appearing.length ? fade : 0);
    const from = this.cameraAt(now);
    const moves = from.x !== view.camera.x || from.y !== view.camera.y || from.scale !== view.camera.scale;
    const fadeOutStart = moveStart + (moves ? move : 0);
    for (const part of this.drawing.parts) {
      const [to, start] = view.shows(part) ? [1, now] : [0, fadeOutStart];
      this.fades.set(part, new Tween(opacity.get(part), to, start, fade, EASE));
    }
    this.move = { from, to: view.camera, tween: new Tween(0, 1, moveStart, moves ? move : 0, EASE_IN_OUT) };
    this.view = view;
  }

  get running() {
    return this.request !== null;
  }

  start() {
    if (this.request === null) this.request = requestAnimationFrame(this.frame);
  }

  // Cancels the pending frame, so a start() right after cannot leave two loops.
  stop() {
    cancelAnimationFrame(this.request);
    this.request = null;
  }

  // Keep the backing store at the canvas's size on screen, in device pixels.
  // Slidev scales slides with a CSS transform, which no resize event reports,
  // so this runs at every frame.
  fit() {
    const box = this.canvas.getBoundingClientRect();
    const width = Math.round(box.width * devicePixelRatio);
    const height = Math.round(box.height * devicePixelRatio);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  drawAt(now) {
    this.fit();
    draw(this.context, this.drawing, {
      time: (now - this.clockStart) / 1000,
      camera: this.cameraAt(now),
      opacity: new Map([...this.fades].map(([part, tween]) => [part, tween.valueAt(now)])),
      pixelsPerUnit: this.canvas.width / this.drawing.width,
    }, this.options);
  }

  frame(now) {
    this.drawAt(now);
    this.request = requestAnimationFrame(this.frame);
  }
}
