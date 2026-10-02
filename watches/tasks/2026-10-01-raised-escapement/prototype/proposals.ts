import { generate, PROPOSALS } from "./watch/generate.ts";
import { Motion } from "./watch/model.ts";
import { Renderer } from "./webgl/renderer.ts";
import { FLASH_INKS, checkScene } from "./webgl/scene.ts";
import type { Mesh, Palette } from "./webgl/scene.ts";

const palette: Palette = {
  paper: "#FAF7F0",
  line: "#143C6B",
  frame: "#736A60",
  detail: "#2A2520",
  knockout: "#D3DCE3",
  second: "#9A6238",
  secondKnockout: "#E6D8CA",
};
const canvas = document.querySelector("canvas")!;
let renderer: Renderer | undefined;
const bounds = (mesh: Mesh) => {
  const values = [...mesh.triangles].filter((_, index) => index % 3 === 2);
  return [Math.min(...values), Math.max(...values)];
};
function render(proposalIndex: number, tilt: number, time = 0, full = false) {
  renderer?.dispose();
  const proposal = PROPOSALS[proposalIndex];
  const watch = generate(undefined, proposal);
  const motion = new Motion(watch);
  const parts = new Set([
    "balance",
    "hairspring",
    "hairspring stud",
    "impulse jewel",
    "pallet fork",
    "roller",
    "escape wheel",
  ]);
  const meshes = full
    ? watch.scene.meshes
    : watch.scene.meshes.filter((mesh) => parts.has(mesh.part));
  const scene = { ...watch.scene, slide: [980, 340] as const, meshes };
  checkScene(scene);
  renderer = new Renderer(canvas, scene, palette, {
    preserveDrawingBuffer: true,
  });
  const swing =
    watch.design.timing.amplitude *
    Math.cos((2 * Math.PI * time) / watch.design.timing.period);
  renderer.updateMesh(watch.spring, motion.springGeometry(swing));
  const [centreX, centreY] = watch.design.watchCentre;
  const [balanceX, balanceY] = watch.design.balance.arbor;
  const [escapeX, escapeY] = watch.design.wheels[4]!.arbor;
  const pivot = [
    centreX + (balanceX + escapeX) / 2,
    centreY + (balanceY + escapeY) / 2,
    4,
  ] as const;
  const scale = full ? 1.6 : 4.3;
  const view = {
    name: "proposal",
    scale,
    pivot,
    shift: [490 - scale * pivot[0], 170 - scale * pivot[1]] as const,
  };
  const warm = new Set(
    meshes.filter((mesh) =>
      ["roller", "impulse jewel", "pallet fork"].includes(mesh.part),
    ),
  );
  renderer.render({
    view,
    tilt,
    groupMatrices: motion.matrices(time, swing),
    size: [1960, 680],
    recolour: { meshes: warm, inks: FLASH_INKS },
  });
  const gl = canvas.getContext("webgl2")!;
  gl.finish();
  if (gl.getError() !== gl.NO_ERROR) throw new Error("WebGL render failed");
  document.querySelector("#title")!.textContent =
    `${proposal?.name ?? "Current model"} · ${tilt}° from vertical`;
  document.querySelector("#description")!.textContent =
    proposalIndex === 0
      ? "Keep the train and flat fork. Lower the oscillator; deepen the case."
      : proposalIndex === 1
        ? "Raise the escape plate and flat fork. Keep its pinion low; lengthen its arbor."
        : proposalIndex === 2
          ? "Keep the escape plate low. Step the fork up to the raised roller."
          : "Current order: jewel and fork below balance; hairspring above balance.";
  return watch.scene.meshes
    .filter((mesh) => mesh.triangles.length > 0)
    .map((mesh) => ({
      name: mesh.name,
      part: mesh.part,
      heights: bounds(mesh),
    }));
}
Object.assign(window, { proposalRender: render, proposalReady: true });
