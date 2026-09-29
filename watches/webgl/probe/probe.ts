// A page with one canvas (980 x 552 CSS px) that draws single frames of the
// watch, for the checks: tools/reference_stills.py in the WebGL task, and
// art/watch_stills.py. It sets `window.watchProbeReady` when it can draw, and
// gives `window.watchProbe.render(options)`.

import { generate } from "../../watch/generate.ts";
import { Motion } from "../../watch/model.ts";
import { Renderer } from "../renderer.ts";
import type { Scene } from "../scene.ts";

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

const canvas = document.getElementById("stage");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("no canvas");
const watch = generate();
const motion = new Motion(watch);
const renderer = new Renderer(canvas, watch.scene, {
  preserveDrawingBuffer: true,
});
const gl = canvas.getContext("webgl2");

window.watchProbe = {
  info: () => renderer.info(),
  scene: () => watch.scene,
  render(options) {
    const view = watch.scene.views.find(
      (candidate) => candidate.name === options.view,
    );
    if (!view) throw new Error(`no view called ${options.view}`);
    const subject = watch.scene.subjects.find(
      (candidate) => candidate.name === options.only,
    );
    renderer.updateMesh(watch.spring, motion.springGeometry(options.swing));
    renderer.render({
      view,
      tilt: options.tilt,
      groupMatrices: motion.matrices(options.time, options.swing),
      size: options.size,
      ...(subject ? { keep: subject.meshes } : {}),
      ...(options.rest === undefined ? {} : { rest: options.rest }),
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
