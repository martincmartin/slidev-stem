// The worker side of worker_probe.html: a module worker that draws on the
// OffscreenCanvas it is sent, with the same drawScene() as the main thread.

import { drawScene } from "./draw_scene.js";

let canvas = null, context = null, scene = null;
const frames = [];
let running = false;

function capabilities() {
  let path2dFromString = false;
  try {
    path2dFromString = new Path2D("M0 0L10 10") instanceof Path2D;
  } catch {
    path2dFromString = false;
  }
  return {
    offscreenCanvas: typeof OffscreenCanvas === "function",
    path2d: typeof Path2D === "function",
    path2dFromString,
    requestAnimationFrame: typeof requestAnimationFrame === "function",
    fonts: typeof self.fonts === "object" && self.fonts !== null,
    fontFace: typeof FontFace === "function",
    domParser: typeof DOMParser === "function",
    domMatrix: typeof DOMMatrix === "function",
    timeOrigin: performance.timeOrigin,
  };
}

function loop(now) {
  if (!running) return;
  frames.push(now);
  drawScene(context, scene, now / 1000);
  requestAnimationFrame(loop);
}

onmessage = ({ data }) => {
  if (data.kind === "capabilities") {
    postMessage({ kind: "capabilities", value: capabilities() });
  } else if (data.kind === "canvas") {
    canvas = data.canvas;
    scene = data.scene;
    canvas.width = data.width;
    canvas.height = data.height;
    context = canvas.getContext("2d");
    drawScene(context, scene, data.time);
    postMessage({ kind: "drawn" });
  } else if (data.kind === "start") {
    frames.length = 0;
    running = true;
    requestAnimationFrame(loop);
    postMessage({ kind: "started" });
  } else if (data.kind === "stop") {
    running = false;
    postMessage({ kind: "frames", value: frames.map(time => time + performance.timeOrigin) });
  } else if (data.kind === "redraw") {
    drawScene(context, scene, data.time);
    postMessage({ kind: "drawn" });
  }
};
