// The spike's page: the globe in the house renderer, with controls (in the
// address: ?scale=50m&water=wash&view=whole&spin=1&step=3&palette=ledger
// &width=400&finish=1) and frame times. `window.globe` gives the results to
// tools/frames.ts.
import { DISC_GROUP, discMatrix, facing, globeScene, parseLand, SLIDE, view } from "./globe.ts";
import type { GlobeCounts, LonLat } from "./globe.ts";
import { Renderer, viewProjection } from "./webgl/renderer.ts";
import type { Palette } from "./webgl/scene.ts";

interface Place {
  readonly center: LonLat;
  readonly scale: number;
}

/** The views: the whole globe, the North Atlantic, the approach to the
 *  Channel (the Scilly wreck), and the sea off Chile (Anson's search). */
const PLACES: Readonly<Record<string, Place>> = {
  whole: { center: [-30, 20], scale: 0.5 },
  atlantic: { center: [-35, 35], scale: 0.9 },
  scilly: { center: [-5.5, 49.5], scale: 15 },
  anson: { center: [-76, -34], scale: 10 },
};
/** Degrees a second that the globe turns at scale 1: 12 at the whole
 *  globe's scale, 0.5. */
const SPIN = 6;

const params = new URLSearchParams(location.search);
const option = (name: string, fallback: string): string => params.get(name) ?? fallback;
const settings = {
  scale: option("scale", "50m"),
  water: option("water", "none"),
  view: option("view", "whole"),
  spin: option("spin", "1"),
  step: option("step", "3"),
  palette: option("palette", "ledger"),
  width: option("width", ""),
  finish: option("finish", "1"),
  occluder: option("occluder", "sphere"),
};

/** A theme colour (a recipe or a value) as #rrggbb, by computed style, as
 *  watches/watch/palette.ts does. */
function hex(cssColour: string): string {
  const probe = document.createElement("span");
  probe.style.setProperty("color", `color(from ${cssColour} srgb r g b)`);
  document.body.append(probe);
  const computed = getComputedStyle(probe).color;
  probe.remove();
  const channels = /color\(srgb ([^)]+)\)/.exec(computed)?.[1]?.split(" ").map(Number) ?? [];
  if (channels.length < 3) throw new Error(`not a colour: ${cssColour} (${computed})`);
  return `#${channels.slice(0, 3).map((value) => Math.round(Math.max(0, Math.min(1, value)) * 255).toString(16).padStart(2, "0")).join("")}`;
}

/** The palette's roles on the renderer's inks, for the spike only: the
 *  coast is the ground (`muted`), the water's wash is `mutedWash` (a recipe
 *  like the ground's wash), the limb is the subject, the meridians are ink,
 *  made half as dark as a colour (the look of ink at 0.5, with no dots where
 *  segments overlap). */
function globePalette(name: string): Palette {
  const probe = document.createElement("div");
  probe.className = `slidev-layout palette-${name}`;
  document.body.append(probe);
  const style = getComputedStyle(probe);
  const role = (variable: string): string => {
    const value = style.getPropertyValue(`--palette-${variable}`).trim();
    if (value === "") throw new Error(`the palette ${name} has no --palette-${variable}`);
    return value;
  };
  const palette: Palette = {
    paper: hex(role("background")),
    subject: hex(role("subject")),
    subjectWash: hex(role("subject-wash")),
    muted: hex(role("ground")),
    mutedWash: hex(`color-mix(in srgb, ${role("water")} 18%, ${role("background")})`),
    ink: hex(`color-mix(in srgb, ${role("ink")} 50%, ${role("background")})`),
    second: hex(role("second")),
    secondWash: hex(role("second-wash")),
  };
  probe.remove();
  return palette;
}

function quantile(values: readonly number[], fraction: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(fraction * sorted.length))] ?? 0;
}

interface Results {
  ready: boolean;
  error: string | null;
  settings: typeof settings;
  counts: GlobeCounts | null;
  loadMs: number;
  buildMs: number;
  device: string;
  gpu: string;
  /** Over the last `frames` frames: ms of each draw (with gl.finish(), the
   *  GPU's work too), and ms between animation frames. */
  stats(): { frames: number; draw: { median: number; p95: number; max: number }; interval: { median: number; p95: number; max: number } };
}

declare global {
  interface Window {
    globe: Results;
  }
}

const draws: number[] = [];
const intervals: number[] = [];
const keep = (list: number[], value: number): void => {
  list.push(value);
  if (list.length > 600) list.shift();
};
const summary = (list: readonly number[]) => ({
  median: quantile(list, 0.5),
  p95: quantile(list, 0.95),
  max: Math.max(0, ...list),
});
window.globe = {
  ready: false,
  error: null,
  settings,
  counts: null,
  loadMs: 0,
  buildMs: 0,
  device: "",
  gpu: "",
  stats: () => ({ frames: draws.length, draw: summary(draws), interval: summary(intervals) }),
};

function controls(): void {
  const choices: Record<keyof typeof settings, string[]> = {
    scale: ["110m", "50m", "10m"],
    water: ["none", "wash"],
    view: Object.keys(PLACES),
    spin: ["1", "0"],
    step: ["1.5", "3"],
    palette: ["ledger", "after-hours"],
    width: ["", "400", "800"],
    finish: ["1", "0"],
    occluder: ["sphere", "disc"],
  };
  const form = document.querySelector("#controls");
  for (const [name, values] of Object.entries(choices) as [keyof typeof settings, string[]][]) {
    const label = document.createElement("label");
    label.textContent = `${name} `;
    const select = document.createElement("select");
    for (const value of values) select.add(new Option(value === "" ? "full" : value, value, false, value === settings[name]));
    select.addEventListener("change", () => {
      params.set(name, select.value);
      location.search = params.toString();
    });
    label.append(select);
    form?.append(label);
  }
}

async function start(): Promise<void> {
  controls();
  const place = PLACES[settings.view];
  if (place === undefined) throw new Error(`no view ${settings.view}`);
  const loadStart = performance.now();
  const response = await fetch(`./ne_${settings.scale}_land.geojson`);
  if (!response.ok) throw new Error(`no ne_${settings.scale}_land.geojson: run tools/fetch.sh`);
  const polygons = parseLand(await response.json());
  window.globe.loadMs = performance.now() - loadStart;
  const buildStart = performance.now();
  const { scene, counts } = globeScene(polygons, {
    step: Number(settings.step),
    water: settings.water === "wash",
    meridianSpacing: 15,
    occluder: settings.occluder === "disc" ? "disc" : "sphere",
  });
  window.globe.buildMs = performance.now() - buildStart;
  window.globe.counts = counts;

  const canvas = document.querySelector("canvas");
  if (canvas === null) throw new Error("no canvas");
  if (settings.width !== "") canvas.style.maxWidth = `${settings.width}px`;
  const renderer = new Renderer(canvas, scene, globePalette(settings.palette));
  const gl = canvas.getContext("webgl2");
  if (gl === null) throw new Error("no WebGL2");
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  window.globe.gpu = String(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));

  const angles = facing(place.center);
  const camera = view(settings.view, place.scale);
  const report = document.querySelector("#report");
  let last = 0;
  let shown = 0;
  const frame = (now: number): void => {
    const box = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;
    const size: [number, number] = [Math.max(1, Math.round(box.width * ratio)), Math.max(1, Math.round(box.height * ratio))];
    const turn = angles.turn + (settings.spin === "1" ? ((SPIN / place.scale) * now) / 1000 : 0);
    const before = performance.now();
    // the disc faces the camera: a matrix from the camera's angles, each frame
    const groupMatrices =
      settings.occluder === "disc"
        ? new Map([[DISC_GROUP, discMatrix(viewProjection(camera, { tilt: angles.tilt, turn }, SLIDE).toCamera)]])
        : new Map();
    renderer.render({ view: camera, tilt: angles.tilt, turn, groupMatrices, size });
    if (settings.finish === "1") gl.finish();
    keep(draws, performance.now() - before);
    if (last > 0) keep(intervals, now - last);
    last = now;
    window.globe.device = `${String(size[0])} x ${String(size[1])} device px, ratio ${String(ratio)}`;
    window.globe.ready = draws.length > 30;
    if (report !== null && now - shown > 1000) {
      shown = now;
      const { draw, interval } = window.globe.stats();
      const ms = (value: number): string => value.toFixed(1);
      report.textContent = [
        `${counts.triangles.toLocaleString()} triangles, ${counts.lineSegments.toLocaleString()} line segments, ${counts.silhouetteEdges.toLocaleString()} limb edges`,
        `load ${ms(window.globe.loadMs)} ms, build ${ms(window.globe.buildMs)} ms (${Object.entries(counts.times).map(([name, time]) => `${name} ${ms(time)}`).join(", ")})`,
        `draw${settings.finish === "1" ? " + finish" : ""}: median ${ms(draw.median)}, p95 ${ms(draw.p95)}, max ${ms(draw.max)} ms`,
        `between frames: median ${ms(interval.median)}, p95 ${ms(interval.p95)}, max ${ms(interval.max)} ms`,
        `${window.globe.device}; ${window.globe.gpu}`,
      ].join("\n");
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

start().catch((error: unknown) => {
  window.globe.error = String(error);
  const report = document.querySelector("#report");
  if (report !== null) report.textContent = String(error);
  throw error;
});
