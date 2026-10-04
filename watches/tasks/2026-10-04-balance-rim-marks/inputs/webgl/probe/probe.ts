// A page with one canvas (980 x 552 CSS px) that draws single frames of the
// watch, for the checks: tools/reference_stills.py in the WebGL task, and
// art/watch_stills.py. It sets `window.watchProbeReady` when it can draw, and
// gives `window.watchProbe.render(options)`. It also gives
// `window.webglChecks()`: the renderer's own checks (checks.ts).

import { generate } from "../../watch/generate.ts";
import { Motion } from "../../watch/model.ts";
import { Renderer } from "../renderer.ts";
import "./checks.ts";
import { FLASH_INKS } from "../scene.ts";
import type { Palette, Scene, Subject } from "../scene.ts";

/** What one frame asks for. */
interface ProbeOptions {
  /** A view's name. */
  view: string;
  /** Degrees. */
  tilt: number;
  /** s: the mechanism's clock. */
  time: number;
  /** Degrees: the balance's angle. */
  swing: number;
  /** Device px. */
  size: [number, number];
  /** A subject's name: the rest of the watch fades, as `rest` says. */
  only?: string;
  /** The opacity of everything but the subject, 0 to 1. */
  rest?: number;
  /** A subject's name: it is drawn as a flash draws it while it is on. */
  flash?: string;
}

declare global {
  interface Window {
    watchProbe?: {
      render: (options: ProbeOptions) => void;
      scene: () => Scene;
      info: () => object;
    };
    watchProbeReady?: boolean;
  }
}

// The page has no theme: these are Ledger's values, as index.html's background
// is. They keep the reference pictures the same from run to run.
const PROBE_PALETTE: Palette = {
  paper: "#FAF7F0",
  line: "#143C6B",
  frame: "#736A60",
  detail: "#2A2520",
  knockout: "#D3DCE3",
  second: "#9A6238",
  secondKnockout: "#E6D8CA",
};

const canvas = document.getElementById("stage");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("no canvas");
const watch = generate();
const motion = new Motion(watch);
const renderer = new Renderer(canvas, watch.scene, PROBE_PALETTE, {
  preserveDrawingBuffer: true,
});
const gl = canvas.getContext("webgl2");

function subjectNamed(name: string | undefined): Subject | undefined {
  if (name === undefined) return undefined;
  const subject = watch.scene.subjects.find(
    (candidate) => candidate.name === name,
  );
  if (!subject) throw new Error(`no subject called ${name}`);
  return subject;
}

window.watchProbe = {
  info: () => renderer.info(),
  scene: () => watch.scene,
  render(options) {
    const view = watch.scene.views.find(
      (candidate) => candidate.name === options.view,
    );
    if (!view) throw new Error(`no view called ${options.view}`);
    const subject = subjectNamed(options.only);
    const flash = subjectNamed(options.flash);
    renderer.updateMesh(watch.spring, motion.springGeometry(options.swing));
    renderer.render({
      view,
      tilt: options.tilt,
      groupMatrices: motion.matrices(options.time, options.swing),
      size: options.size,
      ...(subject ? { keep: subject.meshes } : {}),
      ...(options.rest === undefined ? {} : { rest: options.rest }),
      ...(flash
        ? { recolour: { meshes: flash.meshes, inks: FLASH_INKS } }
        : {}),
    });
    if (gl) {
      gl.finish();
      const error = gl.getError();
      if (error !== gl.NO_ERROR)
        throw new Error(`WebGL error ${String(error)}`);
    }
  },
};
window.watchProbeReady = true;
