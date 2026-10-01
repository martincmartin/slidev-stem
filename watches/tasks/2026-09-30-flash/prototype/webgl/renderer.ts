// A WebGL2 renderer for meshes with the house's thick lines on their edges.
// The choices are in watches/tasks/2026-09-28-webgl-planning/PLAN.md and in
// stem/docs/webgl.md. It knows nothing about what a scene shows.
//
// The camera is orthographic (`viewProjection`), and each group matrix is
// affine: the line shader has no perspective divide.
//
// Faces: the triangles of each mesh, with the depth test, in a flat colour,
// seen from both sides.
//
// Lines: each edge is an instanced quad, expanded on the screen in the vertex
// shader (mattdesl's "expand in the vertex shader", in screen space). The
// fragment shader measures the distance to the segment and makes a capsule:
// round caps, so a polyline's joins are round, and analytic antialiasing.
// Each segment is a capsule of its own, so at a join two caps overlap: a line
// at opacity 0.5 is 1 - 0.5^2 = 0.75 there. Give a line with joins opacity 1.
// Line widths are px of the slide (`Frame.size` over `Scene.slide`), at every
// zoom of the camera. A silhouette edge is drawn only where the surface turns
// from facing the camera to facing away.
//
// Hidden lines: the centre-line test. The faces are drawn into a depth
// texture first. Each fragment of a line takes the point of the line's
// centre line nearest to it, and is drawn only if that point is visible:
// no nearer than the farthest of the 2 x 2 texels around it, plus TOLERANCE.
// So a line is drawn at its full width where its centre is visible, and not
// at all where it is hidden: the painter's rule of the 2D art. Lines do not
// test each other's depth: they are drawn in increasing `lineOrder`, then in
// scene order, so a later line covers an earlier one where they cross. That
// is depth order only if `lineOrder` follows the depth of the view.
//
// Hidden inside: a mesh is not drawn inside its discs, in world x and y, at
// any height.
//
// A fade (`keep` and `rest` of the frame) shows the meshes in `keep`, and the
// other meshes at opacity `rest`, as one image, as SVG's group opacity does:
// the frame is drawn twice, with the rest and without it, and the two
// pictures are mixed. So a fading part never shows its own hidden lines, and
// what it hid shows through it as it fades.
//
// Ownership: a renderer is the only user of its canvas's context, until
// `dispose()`. It sets the GL state that it needs at the start of each frame,
// binds a vertex array object for each draw, and leaves the default bindings
// at the end. It keeps every GL object that it makes, and `dispose()` deletes
// them all. After a context loss, it makes them again from the scene and the
// last geometry of each dynamic mesh.

import type {
  Frame,
  Ink,
  Mesh,
  MeshGeometry,
  Palette,
  Scene,
  View,
  Vec3,
} from "./scene.ts";
import {
  INKS,
  checkGeometry,
  checkPalette,
  checkScene,
  hexRgb,
} from "./scene.ts";
import { at, check, checkFinite } from "./checked.ts";
import { IDENTITY, checkAffine, normalMatrix } from "./math.ts";
import type { Matrix4 } from "./math.ts";

const DEPTH_RANGE = 2000; // slide px: world depth maps to clip z = -depth / range
const TOLERANCE = 0.25; // slide px of depth, for the centre-line test
const MAX_DISCS = 4;

/** One line segment in the instance buffer: its attributes, in order, and
 *  the number of floats of each. */
const INSTANCE_LAYOUT = [
  ["start", 3],
  ["end", 3],
  ["normalBefore", 3],
  ["normalAfter", 3],
  ["kind", 1],
  ["colour", 4],
  ["width", 1],
] as const;
type InstanceAttribute = (typeof INSTANCE_LAYOUT)[number][0];
type Instance = Record<InstanceAttribute, readonly number[]>;
const INSTANCE_FLOATS = INSTANCE_LAYOUT.reduce(
  (sum, [, size]) => sum + size,
  0,
);
const LINE_ATTRIBUTES = ["corner", ...INSTANCE_LAYOUT.map(([name]) => name)];

const DISC_GLSL = `
uniform vec3 discs[${String(MAX_DISCS)}];  // x, y, radius in slide px
uniform int discCount;
bool hidden(vec2 plan) {
  for (int index = 0; index < ${String(MAX_DISCS)}; index++) {
    if (index >= discCount) break;
    if (distance(plan, discs[index].xy) < discs[index].z) return true;
  }
  return false;
}`;
const DISC_UNIFORMS = ["discs", "discCount"];

const FILL_VS = `#version 300 es
in vec3 position;
uniform mat4 model;
uniform mat4 viewProj;
out vec2 plan;
void main() {
  vec4 world = model * vec4(position, 1.0);
  plan = world.xy;
  gl_Position = viewProj * world;
}`;

const FILL_FS = `#version 300 es
precision highp float;
in vec2 plan;
uniform vec4 color;
out vec4 fragColor;
${DISC_GLSL}
void main() {
  if (hidden(plan)) discard;
  fragColor = color;
}`;

const LINE_VS = `#version 300 es
in vec2 corner;      // x: 0 at the start, 1 at the end; y: -1 or +1, the side
in vec3 start;
in vec3 end;
in vec3 normalBefore; // a silhouette edge: the surface normals on each side
in vec3 normalAfter;
in float kind;       // 0: always drawn; 1: drawn only on a silhouette
in vec4 colour;      // with the stroke's opacity
in float width;      // px of the slide
uniform mat4 model;
uniform mat3 normalMatrix;
uniform mat4 viewProj;
uniform vec3 toCamera;
uniform vec2 viewport;
uniform float pixelsPerSlidePx;  // device px per px of the slide
flat out vec2 screenStart;
flat out vec2 screenEnd;
flat out float depthStart;
flat out float depthEnd;
flat out vec2 planStart;
flat out vec2 planEnd;
flat out vec4 lineColour;
flat out float halfWidth;
void main() {
  vec4 worldStart = model * vec4(start, 1.0);
  vec4 worldEnd = model * vec4(end, 1.0);
  vec4 clipStart = viewProj * worldStart;
  vec4 clipEnd = viewProj * worldEnd;
  if (kind > 0.5) {
    float before = dot(normalMatrix * normalBefore, toCamera);
    float after = dot(normalMatrix * normalAfter, toCamera);
    if (sign(before) == sign(after)) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);  // outside the clip volume: no fragments
      return;
    }
  }
  halfWidth = width * pixelsPerSlidePx / 2.0;
  vec2 first = (clipStart.xy * 0.5 + 0.5) * viewport;
  vec2 last = (clipEnd.xy * 0.5 + 0.5) * viewport;
  vec2 along = last - first;
  float length_ = length(along);
  vec2 direction = length_ > 1e-4 ? along / length_ : vec2(1.0, 0.0);
  vec2 across = vec2(-direction.y, direction.x);
  float reach = halfWidth + 1.0;
  vec2 pixel = (corner.x < 0.5 ? first - direction * reach : last + direction * reach)
             + across * corner.y * reach;
  float depth = corner.x < 0.5 ? clipStart.z : clipEnd.z;
  gl_Position = vec4(pixel / viewport * 2.0 - 1.0, depth, 1.0);
  screenStart = first;
  screenEnd = last;
  depthStart = clipStart.z * 0.5 + 0.5;
  depthEnd = clipEnd.z * 0.5 + 0.5;
  planStart = worldStart.xy;
  planEnd = worldEnd.xy;
  lineColour = colour;
}`;

const LINE_FS = `#version 300 es
precision highp float;
flat in vec2 screenStart;
flat in vec2 screenEnd;
flat in float depthStart;
flat in float depthEnd;
flat in vec2 planStart;
flat in vec2 planEnd;
flat in vec4 lineColour;
flat in float halfWidth;
uniform float tolerance;     // window depth
uniform highp sampler2D faceDepth;
out vec4 fragColor;
${DISC_GLSL}
void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 along = screenEnd - screenStart;
  float squared = dot(along, along);
  float t = squared > 1e-8 ? clamp(dot(pixel - screenStart, along) / squared, 0.0, 1.0) : 0.0;
  vec2 centre = screenStart + t * along;
  float coverage = clamp(halfWidth + 0.5 - distance(pixel, centre), 0.0, 1.0);
  if (coverage <= 0.0) discard;
  if (hidden(mix(planStart, planEnd, t))) discard;
  float centreDepth = mix(depthStart, depthEnd, t);
  ivec2 size = textureSize(faceDepth, 0);
  ivec2 texel = ivec2(floor(centre - 0.5));
  float farthest = 0.0;
  for (int dy = 0; dy < 2; dy++) {
    for (int dx = 0; dx < 2; dx++) {
      ivec2 at = clamp(texel + ivec2(dx, dy), ivec2(0), size - 1);
      farthest = max(farthest, texelFetch(faceDepth, at, 0).r);
    }
  }
  if (centreDepth > farthest + tolerance) discard;
  fragColor = vec4(lineColour.rgb, lineColour.a * coverage);
}`;

// The two pictures of a fade, mixed: the one with the fading meshes at
// `rest`, the one without them at 1 - `rest`.
const MIX_VS = `#version 300 es
void main() {
  vec2 corner = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(corner, 0.0, 1.0);
}`;

const MIX_FS = `#version 300 es
precision highp float;
uniform sampler2D withRest;
uniform sampler2D withoutRest;
uniform float rest;
out vec4 fragColor;
void main() {
  ivec2 at = ivec2(gl_FragCoord.xy);
  fragColor = mix(texelFetch(withoutRest, at, 0), texelFetch(withRest, at, 0), rest);
}`;

/** Thrown while the context is lost: the renderer waits for its restoration. */
class ContextLost extends Error {}

/** A linked program, and the location of each of its uniforms and
 *  attributes. It has exactly the names that it was compiled with. */
interface Program {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation>;
  attributes: Map<string, number>;
}

function uniform(program: Program, name: string): WebGLUniformLocation {
  const location = program.uniforms.get(name);
  check(location !== undefined, `the program has no uniform ${name}`);
  return location;
}

function attribute(program: Program, name: string): number {
  const location = program.attributes.get(name);
  check(location !== undefined, `the program has no attribute ${name}`);
  return location;
}

type Rgba = [number, number, number, number];

function hexColour(hex: string, alpha = 1): Rgba {
  const [red, green, blue] = hexRgb(hex);
  return [red, green, blue, alpha];
}

/** The colour of each ink, as the renderer resolved it when it started. */
type InkColours = ReadonlyMap<Ink, Rgba>;

function inkColour(inks: InkColours, ink: Ink): Rgba {
  const colour = inks.get(ink);
  check(
    colour !== undefined,
    `the palette has no colour for the ink ${ink.name}`,
  );
  return colour;
}

// ---- the camera --------------------------------------------------------------------
export interface Camera {
  matrix: Float32Array;
  /** The direction to the camera, in world space. */
  toCamera: Vec3;
}

/** A view is a tilt about the horizontal axis through its pivot, then the
 *  slide's zoom. Screen y = pivot.y + (y - pivot.y) cos t - (z - pivot.z) sin t;
 *  depth (larger is nearer) = (y - pivot.y) sin t + (z - pivot.z) cos t. */
export function viewProjection(
  view: View,
  tiltDegrees: number,
  slide: readonly [number, number],
): Camera {
  const [width, height] = slide;
  const tilt = (tiltDegrees * Math.PI) / 180;
  const cosine = Math.cos(tilt);
  const sine = Math.sin(tilt);
  const [, pivotY, pivotZ] = view.pivot;
  const scaleY = (2 * view.scale) / height;
  const rows = [
    [(2 * view.scale) / width, 0, 0, (2 * view.shift[0]) / width - 1],
    [
      0,
      -scaleY * cosine,
      scaleY * sine,
      1 -
        (2 / height) *
          (view.scale * (pivotY - pivotY * cosine + pivotZ * sine) +
            view.shift[1]),
    ],
    [
      0,
      -sine / DEPTH_RANGE,
      -cosine / DEPTH_RANGE,
      (pivotY * sine + pivotZ * cosine) / DEPTH_RANGE,
    ],
    [0, 0, 0, 1],
  ] as const;
  const matrix = new Float32Array(16);
  for (const [row, values] of rows.entries()) {
    for (const [column, value] of values.entries()) {
      matrix[column * 4 + row] = value;
    }
  }
  return { matrix, toCamera: [0, sine, cosine] };
}

// ---- the renderer --------------------------------------------------------------------
export interface RendererOptions {
  /** For screenshots and stills. */
  preserveDrawingBuffer?: boolean;
}

/** A mesh's buffers and vertex arrays, made once for each context. */
interface MeshResources {
  triangles: WebGLBuffer;
  lines: WebGLBuffer;
  faces: WebGLVertexArrayObject;
  segments: WebGLVertexArrayObject;
  triangleVertices: number;
  lineCount: number;
}

interface Target {
  size: [number, number];
  colour: WebGLTexture;
  depth: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

/** Everything that lives in the context: made again after a context loss. */
interface Resources {
  fill: Program;
  line: Program;
  mix: Program;
  corners: WebGLBuffer;
  /** No attributes: the mix makes its triangle from gl_VertexID. */
  empty: WebGLVertexArrayObject;
  meshes: Map<Mesh, MeshResources>;
  /** Picture 0, and picture 1 for a fade. */
  targets: (Target | undefined)[];
}

/** What the renderer computes once for each mesh, from the scene. */
interface DrawnMesh {
  mesh: Mesh;
  fillColour: Rgba | null;
  discs: Float32Array;
}

/** What one picture needs: the camera and where each mesh is. */
interface Picture {
  camera: Camera;
  models: Map<Mesh, Matrix4>;
  size: [number, number];
  pixelsPerSlidePx: number;
}

function modelOf(picture: Picture, mesh: Mesh): Matrix4 {
  const model = picture.models.get(mesh);
  check(model !== undefined, `${mesh.name} is not in the picture`);
  return model;
}

function appendInstance(values: number[], instance: Instance): void {
  for (const [name, size] of INSTANCE_LAYOUT) {
    const part = instance[name];
    check(part.length === size, `${name} has ${String(part.length)} values`);
    for (const value of part) values.push(value);
  }
}

function lineInstances(geometry: MeshGeometry, inks: InkColours): Float32Array {
  const values: number[] = [];
  const none = [0, 0, 0];
  for (const line of geometry.lines) {
    const { ink, opacity, width } = line.style;
    const [red, green, blue] = inkColour(inks, ink);
    const count = line.points.length;
    for (let index = 0; index < (line.closed ? count : count - 1); index++) {
      appendInstance(values, {
        start: at(line.points, index),
        end: at(line.points, (index + 1) % count),
        normalBefore: none,
        normalAfter: none,
        kind: [0],
        colour: [red, green, blue, opacity],
        width: [width],
      });
    }
  }
  for (const edge of geometry.silhouetteEdges) {
    const { ink, opacity, width } = edge.style;
    const [red, green, blue] = inkColour(inks, ink);
    appendInstance(values, {
      start: edge.start,
      end: edge.end,
      normalBefore: edge.normalBefore,
      normalAfter: edge.normalAfter,
      kind: [1],
      colour: [red, green, blue, opacity],
      width: [width],
    });
  }
  return new Float32Array(values);
}

function segmentCount(geometry: MeshGeometry): number {
  let count = geometry.silhouetteEdges.length;
  for (const line of geometry.lines) {
    count += line.closed ? line.points.length : line.points.length - 1;
  }
  return count;
}

/** The canvases that a live renderer draws on. */
const CLAIMED = new WeakSet<HTMLCanvasElement>();

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly scene: Scene;
  contextsLost = 0;
  private readonly gl: WebGL2RenderingContext;
  private readonly paper: Rgba;
  /** Each ink of the scene, resolved once: a change to the palette that the
   *  caller gave does not reach this renderer. */
  private readonly inks: InkColours;
  /** In the order of their lines. */
  private readonly drawn: DrawnMesh[];
  /** The geometry that each mesh has now: its own, or the last that
   *  `updateMesh` gave it. */
  private readonly geometry = new Map<Mesh, MeshGeometry>();
  /** Each GL object that this renderer made, and how to delete it. */
  private readonly owned = new Map<object, () => void>();
  private resources: Resources | null = null;
  private disposed = false;

  /** Checks the scene and its palette, and takes the canvas's WebGL2
   *  context. The canvas must not have another renderer until that one's
   *  `dispose()`. The palette is read here, once. */
  constructor(
    canvas: HTMLCanvasElement,
    scene: Scene,
    palette: Palette,
    options: RendererOptions = {},
  ) {
    check(
      !CLAIMED.has(canvas),
      "another renderer draws on this canvas: dispose it first",
    );
    checkScene(scene);
    checkPalette(palette);
    for (const mesh of scene.meshes) {
      check(
        mesh.hiddenInside.length <= MAX_DISCS,
        `${mesh.name} has more than ${String(MAX_DISCS)} discs`,
      );
    }
    this.canvas = canvas;
    this.scene = scene;
    this.paper = hexColour(palette.paper);
    this.inks = new Map(
      Object.values(INKS).map((ink) => [ink, hexColour(palette[ink.name])]),
    );
    // Lines are drawn in increasing lineOrder, then in scene order.
    this.drawn = [...scene.meshes]
      .sort((first, second) => first.lineOrder - second.lineOrder)
      .map((mesh) => this.prepare(mesh));
    for (const mesh of scene.meshes) this.geometry.set(mesh, mesh);
    const preserveDrawingBuffer = options.preserveDrawingBuffer ?? false;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer,
    });
    check(
      gl !== null,
      "no WebGL2 (or the canvas has a context of another kind)",
    );
    // A canvas keeps its first context: an earlier renderer's settings stay.
    const settings = gl.getContextAttributes();
    check(
      settings === null ||
        (settings.antialias === false &&
          settings.alpha === false &&
          settings.preserveDrawingBuffer === preserveDrawingBuffer),
      "the canvas already has a WebGL2 context with other settings",
    );
    this.gl = gl;
    CLAIMED.add(canvas);
    canvas.addEventListener("webglcontextlost", this.onContextLost);
    canvas.addEventListener("webglcontextrestored", this.onContextRestored);
    try {
      this.resources = this.initialise();
    } catch (error) {
      this.dispose();
      throw error;
    }
  }

  private readonly onContextLost = (event: Event): void => {
    event.preventDefault(); // so that the browser may restore it
    this.contextsLost++;
    // The lost context's objects are gone: there is nothing to delete.
    this.owned.clear();
    this.resources = null;
  };

  private readonly onContextRestored = (): void => {
    this.resources = this.initialise();
  };

  /** Delete every GL object that this renderer made, and let the canvas take
   *  a new renderer. Afterwards `render` and `updateMesh` throw. Calling it
   *  again does nothing. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    this.canvas.removeEventListener("webglcontextlost", this.onContextLost);
    this.canvas.removeEventListener(
      "webglcontextrestored",
      this.onContextRestored,
    );
    this.freeAll();
    this.resources = null;
    CLAIMED.delete(this.canvas);
  }

  private own<Made extends object>(
    made: Made,
    remove: (made: Made) => void,
  ): Made {
    this.owned.set(made, () => {
      remove(made);
    });
    return made;
  }

  private free(made: object): void {
    this.owned.get(made)?.();
    this.owned.delete(made);
  }

  private freeAll(): void {
    if (!this.gl.isContextLost()) {
      for (const remove of this.owned.values()) remove();
    }
    this.owned.clear();
  }

  /** Make everything that lives in the context. `null` if the context is
   *  lost: then it is made when the context comes back. */
  private initialise(): Resources | null {
    const gl = this.gl;
    this.freeAll();
    if (gl.isContextLost()) return null;
    try {
      const corners = this.makeBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, corners);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW,
      );
      const resources: Resources = {
        fill: this.compile(FILL_VS, FILL_FS, {
          uniforms: ["model", "viewProj", "color", ...DISC_UNIFORMS],
          attributes: ["position"],
        }),
        line: this.compile(LINE_VS, LINE_FS, {
          uniforms: [
            "model",
            "normalMatrix",
            "viewProj",
            "toCamera",
            "viewport",
            "pixelsPerSlidePx",
            "tolerance",
            "faceDepth",
            ...DISC_UNIFORMS,
          ],
          attributes: LINE_ATTRIBUTES,
        }),
        mix: this.compile(MIX_VS, MIX_FS, {
          uniforms: ["withRest", "withoutRest", "rest"],
          attributes: [],
        }),
        corners,
        empty: this.makeVertexArray(),
        meshes: new Map(),
        targets: [],
      };
      for (const [mesh, geometry] of this.geometry) {
        resources.meshes.set(
          mesh,
          this.meshResources(resources, mesh, geometry),
        );
      }
      this.leaveDefaults();
      return resources;
    } catch (error) {
      this.freeAll();
      if (error instanceof ContextLost) return null;
      throw error;
    }
  }

  private makeBuffer(): WebGLBuffer {
    const gl = this.gl;
    return this.own(gl.createBuffer(), (made) => {
      gl.deleteBuffer(made);
    });
  }

  private makeVertexArray(): WebGLVertexArrayObject {
    const gl = this.gl;
    return this.own(gl.createVertexArray(), (made) => {
      gl.deleteVertexArray(made);
    });
  }

  private makeTexture(): WebGLTexture {
    const gl = this.gl;
    return this.own(gl.createTexture(), (made) => {
      gl.deleteTexture(made);
    });
  }

  /** Compile and link, and check that the program has exactly the uniforms
   *  and attributes that the renderer sets. */
  private compile(
    vertexSource: string,
    fragmentSource: string,
    names: { uniforms: string[]; attributes: string[] },
  ): Program {
    const gl = this.gl;
    const program = this.own(gl.createProgram(), (made) => {
      gl.deleteProgram(made);
    });
    const shaders: WebGLShader[] = [];
    try {
      for (const [type, source] of [
        [gl.VERTEX_SHADER, vertexSource],
        [gl.FRAGMENT_SHADER, fragmentSource],
      ] as const) {
        const shader = gl.createShader(type);
        if (shader === null) throw new ContextLost();
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(program, shader);
      }
      gl.linkProgram(program);
      if (gl.isContextLost()) throw new ContextLost();
      if (!(gl.getProgramParameter(program, gl.LINK_STATUS) as boolean)) {
        const logs = shaders.map((shader) => gl.getShaderInfoLog(shader));
        throw new Error(
          [gl.getProgramInfoLog(program), ...logs].filter(Boolean).join("\n") ||
            "the program did not link",
        );
      }
    } finally {
      // A linked program keeps what it needs: the shaders can go.
      for (const shader of shaders) {
        gl.detachShader(program, shader);
        gl.deleteShader(shader);
      }
    }
    const uniforms = new Map<string, WebGLUniformLocation>();
    const uniformCount = gl.getProgramParameter(
      program,
      gl.ACTIVE_UNIFORMS,
    ) as number;
    for (let index = 0; index < uniformCount; index++) {
      const name = gl.getActiveUniform(program, index)?.name.replace("[0]", "");
      if (name?.startsWith("gl_")) continue;
      const location =
        name === undefined ? null : gl.getUniformLocation(program, name);
      if (name === undefined || location === null) throw new ContextLost();
      uniforms.set(name, location);
    }
    const attributes = new Map<string, number>();
    const attributeCount = gl.getProgramParameter(
      program,
      gl.ACTIVE_ATTRIBUTES,
    ) as number;
    for (let index = 0; index < attributeCount; index++) {
      const name = gl.getActiveAttrib(program, index)?.name;
      if (name === undefined) throw new ContextLost();
      // Some drivers list built-ins (gl_VertexID): they have no location.
      if (name.startsWith("gl_")) continue;
      attributes.set(name, gl.getAttribLocation(program, name));
    }
    for (const [kind, found, wanted] of [
      ["uniforms", [...uniforms.keys()], names.uniforms],
      ["attributes", [...attributes.keys()], names.attributes],
    ] as const) {
      check(
        [...found].sort().join() === [...wanted].sort().join(),
        `the program's ${kind} are ${found.join(", ")}, not ${wanted.join(", ")}`,
      );
    }
    return { program, uniforms, attributes };
  }

  private prepare(mesh: Mesh): DrawnMesh {
    const discs = new Float32Array(3 * MAX_DISCS);
    for (const [index, disc] of mesh.hiddenInside.entries()) {
      discs.set([...disc.centre, disc.radius], 3 * index);
    }
    return { mesh, fillColour: this.fillColour(mesh), discs };
  }

  /** A palette colour over the paper: `opacity x colour + (1 - opacity) x paper`. */
  private fillColour(mesh: Mesh): Rgba | null {
    if (mesh.fill === null) return null;
    const [red, green, blue] = inkColour(this.inks, mesh.fill.ink);
    const opacity = mesh.fill.opacity;
    const mixed = (own: number, paper: number): number =>
      opacity * own + (1 - opacity) * paper;
    return [
      mixed(red, this.paper[0]),
      mixed(green, this.paper[1]),
      mixed(blue, this.paper[2]),
      1,
    ];
  }

  /** A mesh's buffers, and a vertex array for its faces and one for its
   *  lines, with the geometry in them. */
  private meshResources(
    resources: Resources,
    mesh: Mesh,
    geometry: MeshGeometry,
  ): MeshResources {
    const gl = this.gl;
    const made: MeshResources = {
      triangles: this.makeBuffer(),
      lines: this.makeBuffer(),
      faces: this.makeVertexArray(),
      segments: this.makeVertexArray(),
      triangleVertices: 0,
      lineCount: 0,
    };
    gl.bindVertexArray(made.faces);
    const position = attribute(resources.fill, "position");
    gl.bindBuffer(gl.ARRAY_BUFFER, made.triangles);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);

    gl.bindVertexArray(made.segments);
    const corner = attribute(resources.line, "corner");
    gl.bindBuffer(gl.ARRAY_BUFFER, resources.corners);
    gl.enableVertexAttribArray(corner);
    gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, made.lines);
    let offset = 0;
    for (const [name, size] of INSTANCE_LAYOUT) {
      const location = attribute(resources.line, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(
        location,
        size,
        gl.FLOAT,
        false,
        INSTANCE_FLOATS * 4,
        offset * 4,
      );
      gl.vertexAttribDivisor(location, 1);
      offset += size;
    }
    gl.bindVertexArray(null);
    this.upload(made, mesh, geometry);
    return made;
  }

  /** Put the geometry into the mesh's buffers (the same buffers each time). */
  private upload(
    made: MeshResources,
    mesh: Mesh,
    geometry: MeshGeometry,
  ): void {
    const gl = this.gl;
    const usage = mesh.dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
    const lines = lineInstances(geometry, this.inks);
    gl.bindBuffer(gl.ARRAY_BUFFER, made.triangles);
    gl.bufferData(gl.ARRAY_BUFFER, geometry.triangles, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, made.lines);
    gl.bufferData(gl.ARRAY_BUFFER, lines, usage);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    made.triangleVertices = geometry.triangles.length / 3;
    made.lineCount = lines.length / INSTANCE_FLOATS;
  }

  /** A dynamic mesh of the scene takes new geometry (the spring at the
   *  balance's angle). The mesh itself does not change: this renderer keeps
   *  the geometry. */
  updateMesh(mesh: Mesh, geometry: MeshGeometry): void {
    check(!this.disposed, "the renderer is disposed");
    check(this.geometry.has(mesh), `${mesh.name} is not in the scene`);
    check(mesh.dynamic, `${mesh.name} is not dynamic`);
    checkGeometry(geometry, mesh.name);
    this.geometry.set(mesh, geometry);
    const made = this.resources?.meshes.get(mesh);
    if (made && !this.gl.isContextLost()) this.upload(made, mesh, geometry);
  }

  /** The picture `index` (0, or 1 for a fade's second picture), at this size. */
  private target(
    resources: Resources,
    index: number,
    width: number,
    height: number,
  ): Target {
    const gl = this.gl;
    const old = resources.targets[index];
    if (old?.size[0] === width && old.size[1] === height) return old;
    if (old) {
      this.free(old.colour);
      this.free(old.depth);
      this.free(old.framebuffer);
      resources.targets[index] = undefined;
    }
    const texture = (format: number): WebGLTexture => {
      const made = this.makeTexture();
      gl.bindTexture(gl.TEXTURE_2D, made);
      gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
      for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) {
        gl.texParameteri(gl.TEXTURE_2D, parameter, gl.NEAREST);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
      gl.bindTexture(gl.TEXTURE_2D, null);
      return made;
    };
    // Kept only when it is complete, so that a later call does not take an
    // incomplete picture of the same size; if it is not, its objects go now.
    const made: object[] = [];
    try {
      const framebuffer = this.own(gl.createFramebuffer(), (object) => {
        gl.deleteFramebuffer(object);
      });
      made.push(framebuffer);
      const colour = texture(gl.RGBA8);
      made.push(colour);
      const depth = texture(gl.DEPTH_COMPONENT24);
      made.push(depth);
      const target: Target = {
        size: [width, height],
        colour,
        depth,
        framebuffer,
      };
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        colour,
        0,
      );
      this.attachDepth(target, true);
      const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
      if (gl.isContextLost()) throw new ContextLost();
      check(
        status === gl.FRAMEBUFFER_COMPLETE,
        `a ${String(width)} x ${String(height)} picture is not complete (status ${String(status)})`,
      );
      resources.targets[index] = target;
      return target;
    } catch (error) {
      for (const object of made) this.free(object);
      throw error;
    }
  }

  private attachDepth(target: Target, attached: boolean): void {
    const gl = this.gl;
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.DEPTH_ATTACHMENT,
      gl.TEXTURE_2D,
      attached ? target.depth : null,
      0,
    );
  }

  /** Check the frame, and find each mesh's model matrix. */
  private picture(frame: Frame, shown: DrawnMesh[]): Picture {
    const [width, height] = frame.size;
    check(
      Number.isInteger(width) &&
        Number.isInteger(height) &&
        width > 0 &&
        height > 0,
      `a frame of ${String(width)} x ${String(height)} device px`,
    );
    const { view } = frame;
    checkFinite(
      [frame.tilt, view.scale, ...view.shift, ...view.pivot],
      `the frame's view ${view.name}`,
    );
    check(view.scale > 0, `${view.name}: scale ${String(view.scale)}`);
    const checked = new Set<Float32Array>();
    const models = new Map<Mesh, Matrix4>();
    for (const { mesh } of shown) {
      let model = IDENTITY;
      if (mesh.group) {
        const matrix = frame.groupMatrices.get(mesh.group);
        check(
          matrix !== undefined,
          `the frame has no matrix for ${mesh.group.name}`,
        );
        if (!checked.has(matrix)) {
          checkAffine(matrix, `${mesh.group.name}'s matrix`);
          normalMatrix(matrix); // throws if it is singular
          checked.add(matrix);
        }
        model = matrix;
      }
      models.set(mesh, model);
    }
    return {
      camera: viewProjection(view, frame.tilt, this.scene.slide),
      models,
      size: [width, height],
      pixelsPerSlidePx: width / this.scene.slide[0],
    };
  }

  /** Draw one frame. It sets the canvas's size to `frame.size`: give it the
   *  slide's aspect ratio, or the picture is stretched. */
  render(frame: Frame): void {
    check(!this.disposed, "the renderer is disposed");
    const keep = frame.keep ?? new Set<Mesh>();
    for (const mesh of keep) {
      check(this.geometry.has(mesh), `${mesh.name} is not in the scene`);
    }
    const rest = frame.rest ?? 1;
    check(rest >= 0 && rest <= 1, `rest ${String(rest)} is outside 0..1`);
    const shown = this.drawn.filter(
      ({ mesh }) => !(frame.drawingOnly ?? false) || mesh.inDrawing,
    );
    const picture = this.picture(frame, shown);
    const gl = this.gl;
    if (gl.isContextLost()) return;
    this.resources ??= this.initialise();
    const resources = this.resources;
    if (resources === null) return; // lost while it was made
    const [width, height] = picture.size;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.setState();
    try {
      const kept = shown.filter(({ mesh }) => keep.has(mesh));
      if (rest === 1 || rest === 0) {
        const target = this.draw(
          resources,
          0,
          rest === 1 ? shown : kept,
          picture,
        );
        gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.framebuffer);
        gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
        gl.blitFramebuffer(
          0,
          0,
          width,
          height,
          0,
          0,
          width,
          height,
          gl.COLOR_BUFFER_BIT,
          gl.NEAREST,
        );
        return;
      }
      const withRest = this.draw(resources, 0, shown, picture);
      const withoutRest = this.draw(resources, 1, kept, picture);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, width, height);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      const program = resources.mix;
      gl.useProgram(program.program);
      gl.bindVertexArray(resources.empty);
      for (const [unit, target] of [withRest, withoutRest].entries()) {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, target.colour);
      }
      gl.uniform1i(uniform(program, "withRest"), 0);
      gl.uniform1i(uniform(program, "withoutRest"), 1);
      gl.uniform1f(uniform(program, "rest"), rest);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    } catch (error) {
      if (!(error instanceof ContextLost)) throw error;
    } finally {
      this.leaveDefaults();
    }
  }

  /** The state that a frame assumes, whatever other code left. */
  private setState(): void {
    const gl = this.gl;
    for (const capability of [
      gl.SCISSOR_TEST,
      gl.CULL_FACE,
      gl.STENCIL_TEST,
      gl.POLYGON_OFFSET_FILL,
      gl.RASTERIZER_DISCARD,
      gl.SAMPLE_ALPHA_TO_COVERAGE,
      gl.SAMPLE_COVERAGE,
    ]) {
      gl.disable(capability);
    }
    gl.colorMask(true, true, true, true);
  }

  /** The default bindings, and no blend or depth test. */
  private leaveDefaults(): void {
    const gl = this.gl;
    gl.bindVertexArray(null);
    gl.useProgram(null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    for (const unit of [1, 0]) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
    gl.disable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
  }

  /** Draw `meshes` into the picture `index`: faces, then lines. */
  private draw(
    resources: Resources,
    index: number,
    meshes: DrawnMesh[],
    picture: Picture,
  ): Target {
    const gl = this.gl;
    const [width, height] = picture.size;
    const target = this.target(resources, index, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    this.attachDepth(target, true);
    gl.viewport(0, 0, width, height);
    gl.clearColor(...this.paper);
    gl.clearDepth(1);
    gl.depthMask(true);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    this.drawFaces(resources, meshes, picture);
    // The lines read the depth texture: it must not be attached while they do.
    this.attachDepth(target, false);
    this.drawLines(resources, meshes, picture, target);
    this.attachDepth(target, true);
    return target;
  }

  private setDiscs(program: Program, drawn: DrawnMesh): void {
    const gl = this.gl;
    gl.uniform3fv(uniform(program, "discs"), drawn.discs);
    gl.uniform1i(uniform(program, "discCount"), drawn.mesh.hiddenInside.length);
  }

  private meshResourcesOf(resources: Resources, mesh: Mesh): MeshResources {
    const made = resources.meshes.get(mesh);
    check(made !== undefined, `${mesh.name} has no buffers`);
    return made;
  }

  private drawFaces(
    resources: Resources,
    meshes: DrawnMesh[],
    picture: Picture,
  ): void {
    const gl = this.gl;
    const program = resources.fill;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(
      uniform(program, "viewProj"),
      false,
      picture.camera.matrix,
    );
    for (const drawn of meshes) {
      const made = this.meshResourcesOf(resources, drawn.mesh);
      if (!drawn.fillColour || made.triangleVertices === 0) continue;
      gl.uniformMatrix4fv(
        uniform(program, "model"),
        false,
        modelOf(picture, drawn.mesh),
      );
      gl.uniform4fv(uniform(program, "color"), drawn.fillColour);
      this.setDiscs(program, drawn);
      gl.bindVertexArray(made.faces);
      gl.drawArrays(gl.TRIANGLES, 0, made.triangleVertices);
    }
    gl.bindVertexArray(null);
  }

  private drawLines(
    resources: Resources,
    meshes: DrawnMesh[],
    picture: Picture,
    target: Target,
  ): void {
    const gl = this.gl;
    const program = resources.line;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(
      uniform(program, "viewProj"),
      false,
      picture.camera.matrix,
    );
    gl.uniform3fv(uniform(program, "toCamera"), picture.camera.toCamera);
    gl.uniform2fv(uniform(program, "viewport"), picture.size);
    gl.uniform1f(
      uniform(program, "pixelsPerSlidePx"),
      picture.pixelsPerSlidePx,
    );
    gl.uniform1f(uniform(program, "tolerance"), TOLERANCE / (2 * DEPTH_RANGE));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.depth);
    gl.uniform1i(uniform(program, "faceDepth"), 0);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(
      gl.SRC_ALPHA,
      gl.ONE_MINUS_SRC_ALPHA,
      gl.ONE,
      gl.ONE_MINUS_SRC_ALPHA,
    );
    for (const drawn of meshes) {
      const made = this.meshResourcesOf(resources, drawn.mesh);
      if (made.lineCount === 0) continue;
      const model = modelOf(picture, drawn.mesh);
      gl.uniformMatrix4fv(uniform(program, "model"), false, model);
      gl.uniformMatrix3fv(
        uniform(program, "normalMatrix"),
        false,
        normalMatrix(model),
      );
      this.setDiscs(program, drawn);
      gl.bindVertexArray(made.segments);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, made.lineCount);
    }
    gl.bindVertexArray(null);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
  }

  /** What the GPU is, and how much there is to draw. */
  info(): {
    renderer: string;
    vendor: string;
    version: string;
    meshes: number;
    triangles: number;
    lineSegments: number;
    contextsLost: number;
  } {
    const gl = this.gl;
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const text = (parameter: number): string =>
      String(gl.getParameter(parameter));
    let triangles = 0;
    let lineSegments = 0;
    for (const geometry of this.geometry.values()) {
      triangles += geometry.triangles.length / 9;
      lineSegments += segmentCount(geometry);
    }
    return {
      renderer: text(debug ? debug.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
      vendor: text(debug ? debug.UNMASKED_VENDOR_WEBGL : gl.VENDOR),
      version: text(gl.VERSION),
      meshes: this.drawn.length,
      triangles,
      lineSegments,
      contextsLost: this.contextsLost,
    };
  }
}
