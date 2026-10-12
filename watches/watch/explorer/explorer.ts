// A page to choose a camera before a slide names it: the live watch, which
// the keys and the mouse move, tilt, turn and zoom; groups of pieces on and off (the
// case, the chapter ring, the strap, ...); and the mechanism at the deck's
// time-lapse speeds, run by the deck's own model (`WatchModel`). Each slide's
// pose, at each click, is a choice too (deck-poses.ts, from slides.md). It
// shows the view that it draws as numbers to copy, and keeps its
// state in the address, so a link opens the same picture. `pnpm explore`
// serves it (docs/watch.md, "The explorer").
//
// The camera is a point of the world at the focus, a zoom, a tilt and a turn
// (`CameraAngles`), so the tilt, the turn and the zoom keep what is at the
// focus in place. The focus is where a
// fitted view puts the middle of a narrow picture: the middle of the slide's
// left FIT_FOCUS, in the picture band (docs/watch.md, "Fitted views"). Each frame
// makes a `View` from them for the renderer.

import { check } from "../../webgl/checked.ts";
import { Renderer } from "../../webgl/renderer.ts";
import type {
  CameraAngles,
  Mesh,
  Piece,
  Vec3,
  View,
} from "../../webgl/scene.ts";
import { deviceSize } from "../../webgl/stage.ts";
import {
  FIT_FOCUS,
  FIT_LEFT,
  PICTURE_BAND,
  fittedView,
  generate,
} from "../generate.ts";
import type { FitBand } from "../generate.ts";
import { Motion, WatchModel } from "../model.ts";
import { stageState } from "../state.ts";
import { deckPoses } from "./deck-poses.ts";
import type { DeckPose } from "./deck-poses.ts";
import {
  decodeAddress,
  encodeAddress,
  motionState,
  poseName,
  speedUpOf,
} from "./address.ts";
import type { ExplorerMotion } from "./address.ts";
import { slidePalette } from "../palette.ts";
import { radians } from "../shapes.ts";

/** The page's camera: the world point at the focus, the zoom (slide px a
 *  world unit), and its angles. */
interface Camera extends CameraAngles {
  readonly target: Vec3;
  readonly scale: number;
}

/** Slide px a second, while a key to move is down. */
const MOVE_SPEED = 400;
/** Degrees a second, while a key to tilt is down. */
const TILT_SPEED = 30;
/** Degrees a second, while a key to turn is down. */
const TURN_SPEED = 45;
/** The zoom's factor a second, while a key to zoom is down. */
const ZOOM_SPEED = 2;
/** How many times faster each is, with Shift down. */
const FAST = 4;
/** The zoom's factor for each px that the mouse wheel turns: e^-(this x px). */
const WHEEL_ZOOM = 0.002;
const SCALE_RANGE = { least: 0.05, most: 100 } as const;
const TILT_RANGE = 90;
/** The longest step of one frame: after a pause (a hidden tab), the camera
 *  and the clock do not jump. */
const LONGEST_FRAME = 0.1;

/** The groups that go on and off together, by the names that slides use, and
 *  the key for each, and whether each shows at the start. The rest of
 *  `watch: all` shows at the start too. The strap does not: the fit of a
 *  picture with the strap is mostly strap. */
const GROUPS = [
  {
    label: "Case",
    key: "1",
    atStart: true,
    names: ["case band", "lug", "crown"],
  },
  { label: "Chapter ring", key: "2", atStart: true, names: ["chapter ring"] },
  { label: "Strap", key: "3", atStart: false, names: ["strap"] },
  {
    label: "Motion works",
    key: "4",
    atStart: true,
    names: [
      "cannon pinion",
      "minute wheel",
      "minute pinion",
      "minute arbor",
      "hour wheel",
    ],
  },
  {
    label: "Hands",
    key: "5",
    atStart: true,
    names: ["hour hand", "minute hand", "seconds hand", "centre pivot"],
  },
] as const;

const watch = generate();
const { scene } = watch;
const [slideWidth, slideHeight] = scene.slide;
/** Slide px: where the camera tilts and zooms. */
const focus = [
  (FIT_FOCUS * slideWidth) / 2,
  (PICTURE_BAND.top + PICTURE_BAND.bottom) / 2,
] as const;

function element<Kind extends Element>(
  id: string,
  kind: abstract new () => Kind,
): Kind {
  const found = document.getElementById(id);
  check(found instanceof kind, `the page has no ${kind.name} #${id}`);
  return found;
}

const canvas = element("stage", HTMLCanvasElement);
const guides = element("guides", SVGSVGElement);
const readout = element("readout", HTMLPreElement);
const poseChoice = element("pose", HTMLSelectElement);
const speedChoice = element("speed", HTMLSelectElement);
const playButton = element("play", HTMLButtonElement);

const palette = slidePalette().palette;
element("slide", HTMLDivElement).style.background = palette.paper;
const renderer = new Renderer(canvas, scene, palette);

// ---- the pieces ------------------------------------------------------------------

/** The pieces that the mechanism places: each mesh's group has a matrix. */
const placed = new Motion(watch).matrices(0, 0);
const pieces = scene.pieces.filter((piece) =>
  [...piece.meshes].every(
    (mesh) => mesh.group === null || placed.has(mesh.group),
  ),
);

function pieceNamed(name: string): Piece {
  const piece = pieces.find((candidate) => candidate.name === name);
  check(piece !== undefined, `the watch has no piece called ${name}`);
  return piece;
}

const groups = GROUPS.map((group) => ({
  label: group.label,
  key: group.key,
  atStart: group.atStart,
  pieces: group.names.map(pieceNamed),
}));

const shown = new Set<Piece>([
  ...pieces.filter((piece) => piece.inAll),
  ...groups.filter((group) => group.atStart).flatMap((group) => group.pieces),
]);
for (const group of groups) {
  if (!group.atStart) for (const piece of group.pieces) shown.delete(piece);
}
let shownMeshes = new Set<Mesh>();
const NOTHING: ReadonlySet<Mesh> = new Set();
const UNDIMMED: ReadonlyMap<Mesh, number> = new Map();
/** The deck's pose whose dimmed pieces are dimmed (`watchDim`), or `null`.
 *  A change of the shown pieces ends it. */
let dimmedBy: DeckPose | null = null;
/** The weights of the dimmed meshes' own colours, as the stage has them. */
let dim = UNDIMMED;

function dimLike(pose: DeckPose | null): void {
  dimmedBy = pose;
  dim = pose ? (stageState(watch, pose.state).dim ?? UNDIMMED) : UNDIMMED;
  addressChanged = true;
}

const groupBoxes = new Map<(typeof groups)[number], HTMLInputElement>();
const pieceBoxes = new Map<Piece, HTMLInputElement>();

/** A checkbox in a label, which loses the focus after a click, so that the
 *  page's keys (Space) do not click it again. */
function checkbox(
  parent: Element,
  text: string,
  onChange: (checked: boolean) => void,
): HTMLInputElement {
  const label = document.createElement("label");
  const box = document.createElement("input");
  box.type = "checkbox";
  box.addEventListener("change", () => {
    onChange(box.checked);
    box.blur();
  });
  label.append(box, ` ${text}`);
  parent.append(label);
  return box;
}

for (const group of groups) {
  groupBoxes.set(
    group,
    checkbox(
      element("groups", HTMLDivElement),
      `${group.label} (${group.key})`,
      (checked) => {
        showPieces(group.pieces, checked);
      },
    ),
  );
}
for (const piece of pieces) {
  pieceBoxes.set(
    piece,
    checkbox(
      element("pieces", HTMLDivElement),
      piece.inAll ? piece.name : `${piece.name} (not in all)`,
      (checked) => {
        showPieces([piece], checked);
      },
    ),
  );
}

function showPieces(chosen: readonly Piece[], show: boolean): void {
  dimLike(null);
  for (const piece of chosen) {
    if (show) shown.add(piece);
    else shown.delete(piece);
  }
  shownChanged();
}

function shownChanged(): void {
  shownMeshes = new Set([...shown].flatMap((piece) => [...piece.meshes]));
  for (const [piece, box] of pieceBoxes) box.checked = shown.has(piece);
  for (const [group, box] of groupBoxes) {
    const count = group.pieces.filter((piece) => shown.has(piece)).length;
    box.checked = count === group.pieces.length;
    box.indeterminate = count > 0 && count < group.pieces.length;
  }
  addressChanged = true;
}

// ---- the camera ------------------------------------------------------------------

function viewOf({ target, scale }: Camera): View {
  return {
    name: "explorer",
    scale,
    pivot: target,
    shift: [focus[0] - scale * target[0], focus[1] - scale * target[1]],
  };
}

/** The camera with the point that was `right` and `down` slide px from the
 *  focus now at the focus, at the target's depth. With turn u and tilt t,
 *  right on the screen is (cos u, -sin u, 0) in the world, and down is
 *  (sin u cos t, cos u cos t, -sin t) (`viewProjection`). */
function moved(camera: Camera, right: number, down: number): Camera {
  const tilt = radians(camera.tilt);
  const turn = radians(camera.turn);
  const [x, y, z] = camera.target;
  const { scale } = camera;
  return {
    ...camera,
    target: [
      x +
        (right * Math.cos(turn) + down * Math.sin(turn) * Math.cos(tilt)) /
          scale,
      y +
        (-right * Math.sin(turn) + down * Math.cos(turn) * Math.cos(tilt)) /
          scale,
      z - (down * Math.sin(tilt)) / scale,
    ],
  };
}

/** The camera that draws the same picture as `view` at `angles`. */
function cameraOf(view: View, angles: CameraAngles): Camera {
  const [x, y] = view.pivot;
  const onSlide = [
    view.scale * x + view.shift[0],
    view.scale * y + view.shift[1],
  ] as const;
  return moved(
    {
      target: view.pivot,
      scale: view.scale,
      tilt: angles.tilt,
      turn: angles.turn,
    },
    focus[0] - onSlide[0],
    focus[1] - onSlide[1],
  );
}

/** The camera zoomed by `factor`, with the point at `fixed` (slide px) kept
 *  where it is on the slide. */
function zoomed(
  camera: Camera,
  factor: number,
  fixed: readonly [number, number],
): Camera {
  const scale = Math.min(
    Math.max(camera.scale * factor, SCALE_RANGE.least),
    SCALE_RANGE.most,
  );
  const right = fixed[0] - focus[0];
  const down = fixed[1] - focus[1];
  return moved({ ...moved(camera, right, down), scale }, -right, -down);
}

function tilted(camera: Camera, tilt: number): Camera {
  return {
    ...camera,
    tilt: Math.min(Math.max(tilt, -TILT_RANGE), TILT_RANGE),
  };
}

/** The camera turned to `turn` degrees, from -180 to 180. */
function turned(camera: Camera, turn: number): Camera {
  return { ...camera, turn: turn - 360 * Math.round(turn / 360) };
}

/** The fitted view of what shows, at `angles`. The fit is at turn 0
 *  (`fittedView`): turned, the picture is the same size, but its box may
 *  not fit. */
function fitted(band: FitBand, angles: CameraAngles): Camera {
  return cameraOf(
    fittedView(watch, [...shown], null, band, angles.tilt),
    angles,
  );
}

// ---- the clock and the deck's poses -------------------------------------------------
// The deck's own model runs the mechanism (`WatchModel`), so the page shows
// the deck's time-lapse (watch/lapse.ts): a change of speed eases as it does
// in the deck. The page's clock stops while it is paused.

const poses = deckPoses();

/** ms: the page's clock, which stands still while the page is paused. */
let clockNow = 0;
let playing = true;
let model = new WatchModel(watch, clockNow);

// the deck's speed-ups, each with the poses that use it
const speeds = new Map<number, string[]>([[1, []]]);
for (const pose of poses) {
  const named = speeds.get(pose.state.lapse) ?? [];
  named.push(poseName(pose));
  speeds.set(pose.state.lapse, named);
}
for (const [speedUp, named] of [...speeds].sort(
  ([first], [second]) => second - first,
)) {
  const choice = document.createElement("option");
  choice.value = String(speedUp);
  choice.textContent =
    speedUp === 1
      ? "1× (the mechanism's own speed)"
      : `${String(speedUp)}× (${named.join(", ")})`;
  speedChoice.append(choice);
}
/** What runs: at first, freely at the menu's first speed-up. */
let motion: ExplorerMotion = {
  kind: "free",
  speedUp: Number(speedChoice.value),
};

/** Run `next`, and show it in the menus: at once, or eased as in the deck. */
function runMotion(next: ExplorerMotion, instantly: boolean): void {
  motion = next;
  speedChoice.value = String(speedUpOf(next));
  poseChoice.value =
    next.kind === "pose" ? String(poses.indexOf(next.pose)) : "";
  model.show(motionState(next), clockNow, instantly);
  addressChanged = true;
}

/** Run the motion from a new model, at once: the page's start, and Restart. */
function restart(): void {
  model = new WatchModel(watch, clockNow);
  runMotion(motion, true);
}

speedChoice.addEventListener("change", () => {
  runMotion({ kind: "free", speedUp: Number(speedChoice.value) }, false);
  speedChoice.blur();
});

for (const [index, pose] of poses.entries()) {
  const choice = document.createElement("option");
  choice.value = String(index);
  choice.textContent = poseName(pose);
  poseChoice.append(choice);
}

/** Show the deck's pose: its camera, its pieces and its motion. */
poseChoice.addEventListener("change", () => {
  poseChoice.blur();
  // the placeholder is not a pose, and `Number("")` is 0
  if (poseChoice.value === "") return;
  const pose = poses[Number(poseChoice.value)];
  if (!pose) return;
  const stage = stageState(watch, pose.state);
  camera = cameraOf(stage.view, stage);
  shown.clear();
  for (const piece of pieces) {
    if ([...piece.meshes].every((mesh) => stage.shown.has(mesh))) {
      shown.add(piece);
    }
  }
  shownChanged();
  dimLike(pose);
  runMotion({ kind: "pose", pose }, true);
});

function setPlaying(now: boolean): void {
  playing = now;
  playButton.textContent = playing ? "Pause" : "Play";
}

playButton.addEventListener("click", () => {
  setPlaying(!playing);
  playButton.blur();
});
element("restart", HTMLButtonElement).addEventListener("click", (event) => {
  restart();
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.blur();
});

// ---- the address ------------------------------------------------------------------
// The state in the address's hash (address.ts), so that a reload or a link
// opens the same picture.

let addressChanged = false;
let addressSaved = 0;
/** ms between two saves of the address: Safari limits how often a page may
 *  replace its history entry. */
const ADDRESS_INTERVAL = 300;

function saveAddress(): void {
  const hash = encodeAddress({
    camera,
    motion,
    dimmedBy,
    guides: guides.style.display !== "none",
    shown,
  });
  history.replaceState(null, "", `#${hash}`);
}

const address = decodeAddress(location.hash, {
  pieces,
  poses,
  speedUps: [...speedChoice.options].map((option) => Number(option.value)),
  scaleRange: SCALE_RANGE,
});
for (const name of address.unknown) {
  console.warn(`the address names no ${name}`);
}
if (address.shown) {
  shown.clear();
  for (const piece of address.shown) shown.add(piece);
}
if (address.motion) motion = address.motion;
dimLike(address.dimmedBy);
if (!address.guides) guides.style.display = "none";
let camera: Camera = address.camera
  ? turned(tilted(address.camera, address.camera.tilt), address.camera.turn)
  : fitted("picture", { tilt: 0, turn: 0 });
restart();
shownChanged();

// ---- the frames and the guides ------------------------------------------------------

const frames = element("frames", HTMLDivElement);

function frameButton(text: string, choose: () => Camera): void {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", () => {
    camera = choose();
    button.blur();
  });
  frames.append(button);
}

frameButton("Fit what shows", () => fitted("picture", camera));
frameButton("Fit, slide band", () => fitted("slide", camera));
for (const view of scene.views) {
  frameButton(`View: ${view.name}`, () => cameraOf(view, camera));
}
frameButton("Level", () => turned(tilted(camera, 0), 0));

function line(x1: number, y1: number, x2: number, y2: number): void {
  const drawn = document.createElementNS("http://www.w3.org/2000/svg", "line");
  for (const [name, value] of Object.entries({ x1, y1, x2, y2 })) {
    drawn.setAttribute(name, String(value));
  }
  guides.append(drawn);
}

guides.setAttribute(
  "viewBox",
  `0 0 ${String(slideWidth)} ${String(slideHeight)}`,
);
// the picture band, the left 60% of the slide and its middle, FIT_LEFT, and
// a cross at the focus
line(0, PICTURE_BAND.top, slideWidth, PICTURE_BAND.top);
line(0, PICTURE_BAND.bottom, slideWidth, PICTURE_BAND.bottom);
line(FIT_FOCUS * slideWidth, 0, FIT_FOCUS * slideWidth, slideHeight);
line(
  (FIT_FOCUS * slideWidth) / 2,
  0,
  (FIT_FOCUS * slideWidth) / 2,
  slideHeight,
);
line(FIT_LEFT, 0, FIT_LEFT, slideHeight);
line(focus[0] - 12, focus[1], focus[0] + 12, focus[1]);
line(focus[0], focus[1] - 12, focus[0], focus[1] + 12);

// ---- the keys and the mouse ------------------------------------------------------

/** The keys that are down, by `KeyboardEvent.code`. */
const held = new Set<string>();
const HELD_KEYS = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "KeyQ",
  "KeyE",
  "KeyZ",
  "KeyX",
  "ArrowLeft",
  "ArrowRight",
  "ShiftLeft",
  "ShiftRight",
]);

window.addEventListener("keydown", (event) => {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (HELD_KEYS.has(event.code)) {
    held.add(event.code);
    event.preventDefault();
    return;
  }
  if (event.repeat) return;
  const group = groups.find((each) => `Digit${each.key}` === event.code);
  if (group) {
    showPieces(group.pieces, !group.pieces.every((piece) => shown.has(piece)));
  } else if (event.code === "Space") {
    setPlaying(!playing);
  } else if (event.code === "KeyG") {
    guides.style.display = guides.style.display === "none" ? "" : "none";
    addressChanged = true;
  } else {
    return;
  }
  event.preventDefault();
});
window.addEventListener("keyup", (event) => {
  held.delete(event.code);
});
window.addEventListener("blur", () => {
  held.clear();
});

/** Slide px for each CSS px of the canvas. */
function slidePerPixel(): number {
  return slideWidth / canvas.getBoundingClientRect().width;
}

let dragFrom: readonly [number, number] | null = null;
canvas.addEventListener("pointerdown", (event) => {
  canvas.setPointerCapture(event.pointerId);
  dragFrom = [event.clientX, event.clientY];
});
canvas.addEventListener("pointermove", (event) => {
  if (dragFrom === null) return;
  const ratio = slidePerPixel();
  camera = moved(
    camera,
    -(event.clientX - dragFrom[0]) * ratio,
    -(event.clientY - dragFrom[1]) * ratio,
  );
  dragFrom = [event.clientX, event.clientY];
});
for (const kind of ["pointerup", "pointercancel"] as const) {
  canvas.addEventListener(kind, () => {
    dragFrom = null;
  });
}
canvas.addEventListener(
  "wheel",
  (event) => {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const ratio = slidePerPixel();
    // Firefox can give lines, not px
    const pixels =
      event.deltaMode === WheelEvent.DOM_DELTA_LINE
        ? event.deltaY * 16
        : event.deltaY;
    camera = zoomed(camera, Math.exp(-pixels * WHEEL_ZOOM), [
      (event.clientX - rect.left) * ratio,
      (event.clientY - rect.top) * ratio,
    ]);
  },
  { passive: false },
);

element("copy", HTMLButtonElement).addEventListener("click", (event) => {
  const view = viewOf(camera);
  const text = JSON.stringify({
    tilt: Number(camera.tilt.toFixed(1)),
    turn: Number(camera.turn.toFixed(1)),
    scale: view.scale,
    shift: view.shift,
    pivot: view.pivot,
  });
  void navigator.clipboard.writeText(text);
  if (event.currentTarget instanceof HTMLElement) event.currentTarget.blur();
});

// ---- each frame ------------------------------------------------------------------

/** -1, 0 or 1: the direction that two held keys ask for. */
function direction(less: string, more: string): number {
  return (held.has(more) ? 1 : 0) - (held.has(less) ? 1 : 0);
}

function steer(seconds: number): void {
  const fast = held.has("ShiftLeft") || held.has("ShiftRight") ? FAST : 1;
  const across = direction("KeyA", "KeyD");
  const down = direction("KeyW", "KeyS");
  if (across !== 0 || down !== 0) {
    const distance = MOVE_SPEED * fast * seconds;
    camera = moved(camera, across * distance, down * distance);
  }
  const tilt = direction("KeyQ", "KeyE");
  if (tilt !== 0) {
    camera = tilted(camera, camera.tilt + tilt * TILT_SPEED * fast * seconds);
  }
  const turn = direction("ArrowLeft", "ArrowRight");
  if (turn !== 0) {
    camera = turned(camera, camera.turn + turn * TURN_SPEED * fast * seconds);
  }
  const zoom = direction("KeyZ", "KeyX");
  if (zoom !== 0) {
    camera = zoomed(camera, ZOOM_SPEED ** (zoom * fast * seconds), focus);
  }
}

let shownCamera: Camera | null = null;

function report(now: number): void {
  if (camera !== shownCamera) {
    const view = viewOf(camera);
    const numbers = (values: readonly number[]): string =>
      `[${values.map((value) => value.toFixed(2)).join(", ")}]`;
    readout.textContent = [
      `tilt   ${camera.tilt.toFixed(1)}°`,
      `turn   ${camera.turn.toFixed(1)}°`,
      `scale  ${view.scale.toFixed(4)} slide px a unit`,
      `shift  ${numbers(view.shift)}`,
      `pivot  ${numbers(view.pivot)}`,
    ].join("\n");
    shownCamera = camera;
    addressChanged = true;
  }
  if (addressChanged && now - addressSaved > ADDRESS_INTERVAL) {
    saveAddress();
    addressChanged = false;
    addressSaved = now;
  }
}

let lastFrame: number | null = null;

function frame(now: number): void {
  const seconds =
    lastFrame === null ? 0 : Math.min((now - lastFrame) / 1000, LONGEST_FRAME);
  lastFrame = now;
  steer(seconds);
  if (playing) clockNow += seconds * 1000;
  const groupMatrices = model.frame(clockNow, renderer);
  renderer.render({
    view: viewOf(camera),
    tilt: camera.tilt,
    turn: camera.turn,
    groupMatrices,
    keep: shownMeshes,
    fade: NOTHING,
    dim,
    rest: 1,
    size: deviceSize(canvas),
  });
  report(now);
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
