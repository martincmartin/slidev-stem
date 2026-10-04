import { generate, PLAIN_RIM } from "./watch/generate.ts";
import type { RimMarks, Watch } from "./watch/generate.ts";
import { balanceAngle, Motion } from "./watch/model.ts";
import { Renderer } from "./webgl/renderer.ts";
import { checkScene } from "./webgl/scene.ts";
import type { Palette } from "./webgl/scene.ts";

const palette: Palette = {
  paper: "#FAF7F0",
  line: "#143C6B",
  frame: "#736A60",
  detail: "#2A2520",
  knockout: "#D3DCE3",
  second: "#9A6238",
  secondKnockout: "#E6D8CA",
};
const variants = [
  { name: "plain", label: "Plain rim", marks: PLAIN_RIM },
  ...[4, 6, 8].map((count) => ({
    name: `screws-${count}`,
    label: `${count} radial screws`,
    marks: Object.freeze({ ...PLAIN_RIM, kind: "screw", count }) as RimMarks,
  })),
  ...[4, 6].map((count) => ({
    name: `weights-${count}`,
    label: `${count} smooth weights`,
    marks: Object.freeze({ ...PLAIN_RIM, count }),
  })),
];
const canvas = document.querySelector<HTMLCanvasElement>("#stage")!;
const variantSelect = document.querySelector<HTMLSelectElement>("#variant")!;
const viewSelect = document.querySelector<HTMLSelectElement>("#view")!;
for (const variant of variants)
  variantSelect.add(new Option(variant.label, variant.name));
let watch: Watch;
let motion: Motion;
let renderer: Renderer;
let active = "";
let running = true;
let started = performance.now();
let frozenTime = 0;

function selectVariant(name: string): void {
  if (name === active) return;
  const variant = variants.find((candidate) => candidate.name === name);
  if (!variant) throw new Error(`Unknown variant: ${name}`);
  renderer?.dispose();
  watch = generate(undefined, variant.marks);
  checkScene(watch.scene);
  motion = new Motion(watch);
  renderer = new Renderer(canvas, watch.scene, palette, {
    preserveDrawingBuffer: true,
  });
  active = name;
}

function render(
  name: string,
  viewName: string,
  time: number,
  scale = 2,
): object {
  selectVariant(name);
  const close = viewName === "slide3";
  const view = watch.scene.views.find(
    (candidate) => candidate.name === (close ? "hairspring" : "cover"),
  )!;
  const tilt = close ? 20 : 0;
  const swing = balanceAngle(watch.design.timing, time);
  renderer.updateMesh(watch.spring, motion.springGeometry(swing));
  const subject = watch.scene.subjects.find(
    (candidate) => candidate.name === "balance wheel and hairspring",
  )!;
  renderer.render({
    view,
    tilt,
    groupMatrices: motion.matrices(time, swing),
    size: [980 * scale, 552 * scale],
    ...(close ? { keep: subject.meshes, rest: 0 } : {}),
  });
  const gl = canvas.getContext("webgl2")!;
  gl.finish();
  if (gl.getError() !== gl.NO_ERROR) throw new Error("WebGL render failed.");
  const body = watch.scene.meshes.find((mesh) => mesh.part === "balance")!;
  const top = Math.max(
    ...Array.from(body.triangles).filter((_, index) => index % 3 === 2),
  );
  const [centreX, centreY] = watch.design.watchCentre;
  const [arborX, arborY] = watch.design.balance.arbor;
  const angle = (tilt * Math.PI) / 180;
  const projectY = (height: number) =>
    view.scale *
      (view.pivot[1] +
        (centreY + arborY - view.pivot[1]) * Math.cos(angle) -
        (height - view.pivot[2]) * Math.sin(angle)) +
    view.shift[1];
  return {
    name,
    view: viewName,
    swing,
    centre: [view.scale * (centreX + arborX) + view.shift[0], projectY(top)],
    scale: view.scale,
    tilt,
    radius: watch.design.balance.radius,
    top,
    info: renderer.info(),
  };
}

Object.assign(window, {
  rimReady: true,
  rimRender: render,
  rimVariants: variants.map(({ name, label }) => ({ name, label })),
  rimPause: () => {
    running = false;
  },
});
document.querySelector<HTMLButtonElement>("#play")!.onclick = (event) => {
  if (running) frozenTime = (performance.now() - started) / 1000;
  else started = performance.now() - frozenTime * 1000;
  running = !running;
  (event.target as HTMLButtonElement).textContent = running ? "Pause" : "Play";
};
// Automated captures stop this loop before they set deterministic frames.
Object.assign(window, {
  rimStop: () => {
    stopped = true;
  },
});
let stopped = false;
function loop(): void {
  if (!stopped) {
    animateFrame();
    requestAnimationFrame(loop);
  }
}
function animateFrame(): void {
  render(
    variantSelect.value,
    viewSelect.value,
    running ? (performance.now() - started) / 1000 : frozenTime,
    window.devicePixelRatio,
  );
}
loop();
