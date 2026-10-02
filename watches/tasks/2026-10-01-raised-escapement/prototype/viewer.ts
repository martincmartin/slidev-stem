import { generate, PROPOSALS } from "./watch/generate.ts";
import type { Watch } from "./watch/generate.ts";
import { Motion } from "./watch/model.ts";
import { Renderer } from "./webgl/renderer.ts";
import { FLASH_INKS } from "./webgl/scene.ts";
import type { Mesh, Palette, Vec3 } from "./webgl/scene.ts";

function element<ElementType extends Element>(selector: string): ElementType {
  const found = document.querySelector(selector);
  if (!found) throw new Error(`Missing element: ${selector}`);
  return found as ElementType;
}
const canvas = element<HTMLCanvasElement>("#stage");
const viewport = element<HTMLElement>("#viewport");
const modelControl = element<HTMLSelectElement>("#model");
const tiltControl = element<HTMLInputElement>("#tilt");
const zoomControl = element<HTMLInputElement>("#zoom");
const fullControl = element<HTMLInputElement>("#full");
const highlightControl = element<HTMLInputElement>("#highlight");
const playControl = element<HTMLButtonElement>("#play");
const palette: Palette = {
  paper: "#FAF7F0",
  line: "#143C6B",
  frame: "#736A60",
  detail: "#2A2520",
  knockout: "#D3DCE3",
  second: "#9A6238",
  secondKnockout: "#E6D8CA",
};
const oscillatorParts = new Set([
  "balance",
  "hairspring",
  "hairspring stud",
  "impulse jewel",
  "pallet fork",
  "roller",
  "escape wheel",
]);
const descriptions = [
  "A: Lower the balance and spring. Keep the flat fork and train heights; deepen the case.",
  "B: Raise the escape plate and flat fork. Keep the pinion low on a longer arbor.",
  "C: Raise the fork mouth and lever. Keep the pallet arms and escape wheel low.",
  "Current model: the jewel and fork are below the balance; the spring is above it.",
];
let watch: Watch;
let motion: Motion;
let renderer: Renderer | undefined;
let warm = new Set<Mesh>();
let pivot: Vec3;
let width = 1;
let height = 1;
let panX = 0;
let panY = 0;
let tilt = 75;
let scale = 4.3;
let time = 0;
let playing = false;
let dirty = true;
let previousFrame = performance.now();
let frameId = 0;
let stopped = false;
let drag: { pointer: number; x: number; y: number } | undefined;
const heldKeys = new Set<string>();

function rebuildRenderer(): void {
  renderer?.dispose();
  const box = viewport.getBoundingClientRect();
  width = Math.max(1, box.width);
  height = Math.max(1, box.height);
  const meshes = fullControl.checked
    ? watch.scene.meshes
    : watch.scene.meshes.filter((mesh) => oscillatorParts.has(mesh.part));
  warm = new Set(
    meshes.filter((mesh) =>
      ["roller", "impulse jewel", "pallet fork"].includes(mesh.part),
    ),
  );
  renderer = new Renderer(
    canvas,
    { ...watch.scene, slide: [width, height], meshes },
    palette,
  );
  dirty = true;
}
function selectModel(): void {
  const selected = Number(modelControl.value);
  watch = generate(undefined, PROPOSALS[selected]);
  motion = new Motion(watch);
  const [centreX, centreY] = watch.design.watchCentre;
  const [balanceX, balanceY] = watch.design.balance.arbor;
  const escape = watch.design.wheels[4];
  if (!escape) throw new Error("Missing escape wheel");
  pivot = [
    centreX + (balanceX + escape.arbor[0]) / 2,
    centreY + (balanceY + escape.arbor[1]) / 2,
    4,
  ];
  element<HTMLElement>("#description").textContent =
    descriptions[selected] ?? "";
  rebuildRenderer();
}
function setTilt(value: number): void {
  tilt = value;
  tiltControl.value = String(value);
  element<HTMLOutputElement>("#angle").value = `${value}°`;
  dirty = true;
}
function setZoom(value: number, anchorX = 0, anchorY = 0): void {
  const next = Math.max(0.25, Math.min(16, value));
  const ratio = next / scale;
  panX = anchorX - ratio * (anchorX - panX);
  panY = anchorY - ratio * (anchorY - panY);
  scale = next;
  zoomControl.value = String(scale);
  dirty = true;
}
function resetView(): void {
  panX = 0;
  panY = 0;
  // Fit the whole watch, including the long straps, if it is selected.
  scale = fullControl.checked
    ? Math.min(width / 560, height / 2300)
    : Math.min(width / 225, height / 115, 4.3);
  scale = Math.max(0.25, scale);
  zoomControl.value = String(scale);
  setTilt(75);
}
function setPlaying(value: boolean): void {
  playing = value;
  playControl.textContent = value ? "Pause" : "Play";
  playControl.setAttribute("aria-pressed", String(value));
  dirty = true;
}
function draw(): void {
  if (!renderer) return;
  const swing =
    watch.design.timing.amplitude *
    Math.cos((2 * Math.PI * time) / watch.design.timing.period);
  renderer.updateMesh(watch.spring, motion.springGeometry(swing));
  const deviceScale = Math.min(window.devicePixelRatio || 1, 2);
  renderer.render({
    view: {
      name: "interactive",
      scale,
      pivot,
      shift: [
        width / 2 + panX - scale * pivot[0],
        height / 2 + panY - scale * pivot[1],
      ],
    },
    tilt,
    groupMatrices: motion.matrices(time, swing),
    size: [
      Math.max(1, Math.round(width * deviceScale)),
      Math.max(1, Math.round(height * deviceScale)),
    ],
    ...(highlightControl.checked
      ? { recolour: { meshes: warm, inks: FLASH_INKS } }
      : {}),
  });
  dirty = false;
}
function frame(now: number): void {
  if (stopped) return;
  const seconds = Math.min((now - previousFrame) / 1000, 0.05);
  previousFrame = now;
  if (playing) {
    time += seconds;
    dirty = true;
  }
  const movement = 350 * seconds;
  const horizontal = Number(heldKeys.has("d")) - Number(heldKeys.has("a"));
  const vertical = Number(heldKeys.has("s")) - Number(heldKeys.has("w"));
  if (horizontal || vertical) {
    panX += horizontal * movement;
    panY += vertical * movement;
    dirty = true;
  }
  try {
    if (dirty) draw();
  } catch (error) {
    stopped = true;
    element<HTMLElement>("#error").textContent =
      error instanceof Error ? error.message : String(error);
    renderer?.dispose();
    return;
  }
  frameId = requestAnimationFrame(frame);
}
modelControl.addEventListener("change", selectModel);
tiltControl.addEventListener("input", () => setTilt(Number(tiltControl.value)));
zoomControl.addEventListener("input", () => setZoom(Number(zoomControl.value)));
fullControl.addEventListener("change", () => {
  rebuildRenderer();
  resetView();
});
highlightControl.addEventListener("change", () => {
  dirty = true;
});
element("#top").addEventListener("click", () => setTilt(0));
element("#almost").addEventListener("click", () => setTilt(75));
element("#side").addEventListener("click", () => setTilt(90));
element("#reset").addEventListener("click", resetView);
playControl.addEventListener("click", () => setPlaying(!playing));
for (const [selector, stoppedTime] of [
  ["#tick", 0],
  ["#tock", 1],
] as const) {
  element(selector).addEventListener("click", () => {
    setPlaying(false);
    time = stoppedTime;
    dirty = true;
  });
}
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const box = canvas.getBoundingClientRect();
    const pixels =
      event.deltaY *
      (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? height : 1);
    setZoom(
      scale * Math.exp(-pixels * 0.0015),
      event.clientX - box.left - width / 2,
      event.clientY - box.top - height / 2,
    );
  },
  { passive: false },
);
canvas.addEventListener("pointerdown", (event) => {
  if (event.button !== 0) return;
  canvas.focus();
  canvas.setPointerCapture(event.pointerId);
  drag = { pointer: event.pointerId, x: event.clientX, y: event.clientY };
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag || drag.pointer !== event.pointerId) return;
  panX += event.clientX - drag.x;
  panY += event.clientY - drag.y;
  drag.x = event.clientX;
  drag.y = event.clientY;
  dirty = true;
});
canvas.addEventListener("lostpointercapture", () => {
  drag = undefined;
});
canvas.addEventListener("pointerup", (event) => {
  if (canvas.hasPointerCapture(event.pointerId))
    canvas.releasePointerCapture(event.pointerId);
  drag = undefined;
});
window.addEventListener("keydown", (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement
  )
    return;
  const key = event.key.toLowerCase();
  if (["w", "a", "s", "d"].includes(key)) {
    event.preventDefault();
    heldKeys.add(key);
  }
  if (key === "r") {
    event.preventDefault();
    resetView();
  }
});
window.addEventListener("keyup", (event) =>
  heldKeys.delete(event.key.toLowerCase()),
);
window.addEventListener("blur", () => {
  heldKeys.clear();
  drag = undefined;
});
document.addEventListener("visibilitychange", () => heldKeys.clear());
const resizeObserver = new ResizeObserver(() => {
  if (!stopped) rebuildRenderer();
});
window.addEventListener("pagehide", () => {
  stopped = true;
  cancelAnimationFrame(frameId);
  resizeObserver.disconnect();
  heldKeys.clear();
  renderer?.dispose();
});
try {
  selectModel();
  resetView();
  resizeObserver.observe(viewport);
  frameId = requestAnimationFrame(frame);
  Object.assign(window, { viewerReady: true });
} catch (error) {
  stopped = true;
  renderer?.dispose();
  element<HTMLElement>("#error").textContent =
    error instanceof Error ? error.message : String(error);
}
