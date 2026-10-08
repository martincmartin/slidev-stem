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
import type { Mesh, Palette, Scene } from "../scene.ts";

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
  /** Pieces' names: the rest of the watch fades, as `rest` says. */
  only?: string[];
  /** The opacity of everything but `only`, 0 to 1. */
  rest?: number;
  /** Pieces' names: they are drawn as a flash draws them while it is on. */
  flash?: string[];
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
  subject: "#143C6B",
  subjectWash: "#D3DCE3",
  muted: "#736A60",
  mutedWash: "#E2DED6",
  ink: "#2A2520",
  second: "#B5601E",
  secondWash: "#ECD8C4",
};

const canvas = document.getElementById("stage");
if (!(canvas instanceof HTMLCanvasElement)) throw new Error("no canvas");
const watch = generate();
const motion = new Motion(watch);
const renderer = new Renderer(canvas, watch.scene, PROBE_PALETTE, {
  preserveDrawingBuffer: true,
});
const gl = canvas.getContext("webgl2");

function meshesOf(names: string[] | undefined): Set<Mesh> | undefined {
  if (names === undefined) return undefined;
  return new Set(
    names.flatMap((name) => {
      const piece = watch.scene.pieces.find(
        (candidate) => candidate.name === name,
      );
      if (!piece) throw new Error(`no piece called ${name}`);
      return [...piece.meshes];
    }),
  );
}

window.watchProbe = {
  info: () => renderer.info(),
  scene: () => watch.scene,
  render(options) {
    const view = watch.scene.views.find(
      (candidate) => candidate.name === options.view,
    );
    if (!view) throw new Error(`no view called ${options.view}`);
    const kept = meshesOf(options.only);
    const flash = meshesOf(options.flash);
    renderer.updateMesh(watch.spring, motion.springGeometry(options.swing));
    renderer.render({
      view,
      tilt: options.tilt,
      groupMatrices: motion.matrices(options.time, options.swing),
      size: options.size,
      ...(kept ? { keep: kept } : {}),
      ...(options.rest === undefined ? {} : { rest: options.rest }),
      ...(flash ? { recolour: { meshes: flash, inks: FLASH_INKS } } : {}),
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
