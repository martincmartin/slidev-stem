// PROTOTYPE (2026-09-30-flash). One page that draws the watch at the cover
// view, as it is and as each flash option draws it, for flash_video.py.
//
// The renderer here still resolves each ink once, when it starts. So each
// option has its own canvas and renderer, for a copy of the scene in which the
// flashed meshes point at the option's inks. The "off" frames come from one
// more renderer, with the scene as it is. The live fix (R1 in PLAN.md) would
// change the inks per draw instead.

import { generate } from "../watch/generate.ts";
import { Motion } from "../watch/model.ts";
import { Renderer } from "../webgl/renderer.ts";
import { INKS } from "../webgl/scene.ts";
import type {
  Colour,
  Ink,
  LineStyle,
  Mesh,
  MeshGeometry,
  Palette,
  Scene,
} from "../webgl/scene.ts";

/** Which ink each ink of a flashed mesh becomes. An ink not in the map stays. */
type InkMap = ReadonlyMap<Ink, Ink>;

/** The options of PLAN.md, section 2. */
const OPTIONS: Readonly<Record<string, InkMap>> = {
  "A lines only": new Map([[INKS.line, INKS.second]]),
  "B one colour": new Map([
    [INKS.line, INKS.second],
    [INKS.knockout, INKS.second],
  ]),
  "C1 two colours": new Map([
    [INKS.line, INKS.second],
    [INKS.knockout, INKS.secondKnockout],
  ]),
  "E inverted": new Map([
    [INKS.line, INKS.knockout],
    [INKS.knockout, INKS.second],
  ]),
};

const PALETTE: Palette = {
  paper: "#FAF7F0",
  line: "#143C6B",
  frame: "#736A60",
  detail: "#2A2520",
  knockout: "#D3DCE3",
  second: "#9A6238",
  secondKnockout: "#E6D8CA",
};

const FLASHED = "balance and hairspring";

function recolourStyle(style: LineStyle, inks: InkMap): LineStyle {
  return { ...style, ink: inks.get(style.ink) ?? style.ink };
}

function recolourFill(fill: Colour | null, inks: InkMap): Colour | null {
  return fill === null ? null : { ...fill, ink: inks.get(fill.ink) ?? fill.ink };
}

function recolourGeometry(geometry: MeshGeometry, inks: InkMap): MeshGeometry {
  return {
    triangles: geometry.triangles,
    lines: geometry.lines.map((line) => ({
      ...line,
      style: recolourStyle(line.style, inks),
    })),
    silhouetteEdges: geometry.silhouetteEdges.map((edge) => ({
      ...edge,
      style: recolourStyle(edge.style, inks),
    })),
  };
}

const watch = generate();
const motion = new Motion(watch);
const subject = watch.scene.subjects.find((each) => each.name === FLASHED);
if (!subject) throw new Error(`no subject ${FLASHED}`);
const view = watch.scene.views.find((each) => each.name === "cover");
if (!view) throw new Error("no cover view");

interface Drawn {
  canvas: HTMLCanvasElement;
  renderer: Renderer;
  /** The scene's spring, or its recoloured copy. */
  spring: Mesh;
  inks: InkMap;
}

function drawn(inks: InkMap): Drawn {
  const copies = new Map<Mesh, Mesh>();
  for (const mesh of subject?.meshes ?? []) {
    copies.set(mesh, {
      ...mesh,
      ...recolourGeometry(mesh, inks),
      fill: recolourFill(mesh.fill, inks),
    });
  }
  const scene: Scene = {
    ...watch.scene,
    meshes: watch.scene.meshes.map((mesh) => copies.get(mesh) ?? mesh),
    subjects: [],
  };
  const canvas = document.createElement("canvas");
  document.body.append(canvas);
  const renderer = new Renderer(canvas, scene, PALETTE, {
    preserveDrawingBuffer: true,
  });
  return {
    canvas,
    renderer,
    spring: copies.get(watch.spring) ?? watch.spring,
    inks,
  };
}

const plain = drawn(new Map());
const options = new Map(
  Object.entries(OPTIONS).map(([name, inks]) => [name, drawn(inks)]),
);

declare global {
  interface Window {
    flashProbe?: {
      options: () => string[];
      /** A PNG data URL of the cover view at `time` s: the option's flash
       *  colours if `on`, else the watch as it is. */
      render: (
        option: string,
        on: boolean,
        time: number,
        size: [number, number],
      ) => string;
    };
    flashProbeReady?: boolean;
  }
}

const AMPLITUDE = 150;
const PERIOD = 2;

window.flashProbe = {
  options: () => [...options.keys()],
  render(option, on, time, size) {
    const chosen = options.get(option);
    if (!chosen) throw new Error(`no option ${option}`);
    const target = on ? chosen : plain;
    const swing = AMPLITUDE * Math.cos((2 * Math.PI * time) / PERIOD);
    target.canvas.width = size[0];
    target.canvas.height = size[1];
    target.renderer.updateMesh(
      target.spring,
      recolourGeometry(motion.springGeometry(swing), target.inks),
    );
    target.renderer.render({
      view,
      tilt: 0,
      groupMatrices: motion.matrices(time, swing),
      size,
    });
    return target.canvas.toDataURL("image/png");
  },
};
window.flashProbeReady = true;
