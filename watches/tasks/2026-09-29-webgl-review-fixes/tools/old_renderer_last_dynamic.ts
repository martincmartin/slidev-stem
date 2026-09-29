import { extrude, polygonRing, ribbon, ribbonGeometry, smoothRing } from "../mesh.ts";
import type { Point2 } from "../mesh.ts";
import { Renderer } from "../renderer.ts";
import type { Group, Scene } from "../scene.ts";
const STYLE = { colour: "#143C6B", opacity: 1, width: 3 };
const group: Group = { name: "root", parent: null };
const spiral = (turn: number): Point2[] => Array.from({ length: 24 }, (_, i): Point2 => [140 + (10 + i * 1.2) * Math.cos(turn + i * 0.5), 50 + (10 + i * 1.2) * Math.sin(turn + i * 0.5)]);
const box = extrude([polygonRing([[20, 20], [70, 20], [70, 70], [20, 70]], STYLE)], 0, 10, { name: "box", part: "box", group, fill: { hex: "#E3E8EC", opacity: 1 } });
const spring = ribbon(smoothRing(spiral(0), STYLE, false), 0, 4, { name: "spring", part: "spring", group, fill: null, lineOrder: 1000, dynamic: true });
const scene: Scene = { slide: [200, 100], paper: "#FAF7F0", meshes: [box, spring], groups: [group], views: [{ name: "all", scale: 1, shift: [0, 0], pivot: [0, 0, 0] }], subjects: [] };
const canvas = document.getElementById("stage") as HTMLCanvasElement;
const renderer = new Renderer(canvas, scene, { preserveDrawingBuffer: true });
const gl = canvas.getContext("webgl2")!;
const frame = { view: scene.views[0]!, tilt: 30, groupMatrices: new Map([[group, Float32Array.from([1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1])]]), size: [200, 100] as [number, number] };
const errors: number[] = [];
for (let i = 0; i < 4; i++) {
  renderer.updateMesh(spring, ribbonGeometry(smoothRing(spiral(i * 0.3), STYLE, false), 0, 4));
  renderer.render(frame);
  errors.push(gl.getError());
}
(window as unknown as { result: number[] }).result = errors;
