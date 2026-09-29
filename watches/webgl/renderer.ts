// A WebGL2 renderer for meshes with the house's thick lines on their edges.
// The choices are in watches/tasks/2026-09-28-webgl-planning/PLAN.md and in
// stem/docs/webgl.md. It knows nothing about what a scene shows.
//
// Faces: the triangles of each mesh, with the depth test, in a flat colour.
//
// Lines: each edge is an instanced quad, expanded on the screen in the vertex
// shader (mattdesl's "expand in the vertex shader", in screen space). The
// fragment shader measures the distance to the segment and makes a capsule:
// round caps, so a polyline's joins are round, and analytic antialiasing.
// Line widths are CSS px of the slide, at every zoom. A silhouette edge is
// drawn only where the surface turns from facing the camera to facing away.
//
// Hidden lines: the centre-line test. The faces are drawn into a depth
// texture first. Each fragment of a line takes the point of the line's
// centre line nearest to it, and is drawn only if that point is visible:
// no nearer than the farthest of the 2 x 2 texels around it, plus TOLERANCE.
// So a line is drawn at its full width where its centre is visible, and not
// at all where it is hidden: the painter's rule of the 2D art. Lines do not
// test each other's depth: they are drawn in increasing `lineOrder`, so a
// nearer line covers a farther one where they cross.
//
// Hidden inside: a mesh is not drawn inside its discs (in plan), at any
// height.
//
// A fade (`keep` and `rest` of the frame) shows the meshes in `keep`, and the
// other meshes at opacity `rest`, as one image, as SVG's group opacity does:
// the frame is drawn twice, with the rest and without it, and the two
// pictures are mixed. So a fading part never shows its own hidden lines, and
// what it hid shows through it as it fades.

import type { Frame, Mesh, Scene, View, Vec3 } from "./scene.ts";
import { at } from "./checked.ts";
import { normalMatrix } from "./mesh.ts";

const DEPTH_RANGE = 2000; // slide px: world depth maps to clip z = -depth / range
const TOLERANCE = 0.25; // slide px of depth, for the centre-line test
const MAX_DISCS = 4;
// start xyz, end xyz, normal before xyz, normal after xyz, kind, colour rgba, width
const INSTANCE_FLOATS = 18;
const IDENTITY = Float32Array.from([
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
]);

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
in float width;      // CSS px of the slide
uniform mat4 model;
uniform mat3 normalMatrix;
uniform mat4 viewProj;
uniform vec3 toCamera;
uniform vec2 viewport;
uniform float pixelsPerCss;  // device px per CSS px of the slide
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
  halfWidth = width * pixelsPerCss / 2.0;
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

interface Program {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
  attributes: Map<string, number>;
}

function compile(
  gl: WebGL2RenderingContext,
  vertexSource: string,
  fragmentSource: string,
): Program {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexSource],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ] as const) {
    const shader = gl.createShader(type);
    if (shader === null) throw new Error("no shader");
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (
      !(gl.getShaderParameter(shader, gl.COMPILE_STATUS) as boolean) &&
      !gl.isContextLost()
    ) {
      throw new Error(gl.getShaderInfoLog(shader) ?? "shader failed");
    }
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (
    !(gl.getProgramParameter(program, gl.LINK_STATUS) as boolean) &&
    !gl.isContextLost()
  ) {
    throw new Error(gl.getProgramInfoLog(program) ?? "link failed");
  }
  const uniforms = new Map<string, WebGLUniformLocation | null>();
  const uniformCount = gl.getProgramParameter(
    program,
    gl.ACTIVE_UNIFORMS,
  ) as number;
  for (let index = 0; index < uniformCount; index++) {
    const name = gl.getActiveUniform(program, index)?.name.replace("[0]", "");
    if (name !== undefined) {
      uniforms.set(name, gl.getUniformLocation(program, name));
    }
  }
  const attributes = new Map<string, number>();
  const attributeCount = gl.getProgramParameter(
    program,
    gl.ACTIVE_ATTRIBUTES,
  ) as number;
  for (let index = 0; index < attributeCount; index++) {
    const name = gl.getActiveAttrib(program, index)?.name;
    if (name !== undefined) {
      attributes.set(name, gl.getAttribLocation(program, name));
    }
  }
  return { program, uniforms, attributes };
}

function uniform(program: Program, name: string): WebGLUniformLocation | null {
  return program.uniforms.get(name) ?? null;
}

function attribute(program: Program, name: string): number {
  return program.attributes.get(name) ?? -1;
}

type Rgba = [number, number, number, number];

function hexRgb(hex: string): Vec3 {
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function hexColour(hex: string, alpha = 1): Rgba {
  const [red, green, blue] = hexRgb(hex);
  return [red, green, blue, alpha];
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
  slide: [number, number],
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
/** The geometry that a dynamic mesh takes each frame. */
export type MeshGeometry = Pick<
  Mesh,
  "triangles" | "lines" | "silhouetteEdges"
>;

export interface RendererOptions {
  /** For screenshots and stills. */
  preserveDrawingBuffer?: boolean;
}

interface MeshBuffers {
  triangles: WebGLBuffer;
  triangleVertices: number;
  lines: WebGLBuffer;
  lineCount: number;
}

interface DrawnMesh {
  mesh: Mesh;
  fillColour: Rgba | null;
  discs: Float32Array;
}

interface Target {
  size: [number, number];
  colour: WebGLTexture;
  depth: WebGLTexture;
  framebuffer: WebGLFramebuffer;
}

/** What one picture needs: the camera and where each mesh is. */
interface Picture {
  camera: Camera;
  models: Map<Mesh, Float32Array>;
  size: [number, number];
  pixelsPerCss: number;
}

function lineInstances(mesh: Mesh): Float32Array {
  const values: number[] = [];
  for (const line of mesh.lines) {
    const { colour, opacity, width } = line.style;
    const style = [...hexColour(colour, opacity), width];
    const count = line.points.length;
    for (let index = 0; index < (line.closed ? count : count - 1); index++) {
      const start = at(line.points, index);
      const end = at(line.points, (index + 1) % count);
      values.push(...start, ...end, 0, 0, 0, 0, 0, 0, 0, ...style);
    }
  }
  for (const edge of mesh.silhouetteEdges) {
    const { colour, opacity, width } = edge.style;
    values.push(
      ...edge.start,
      ...edge.end,
      ...edge.normalBefore,
      ...edge.normalAfter,
      1,
      ...hexColour(colour, opacity),
      width,
    );
  }
  return new Float32Array(values);
}

export class Renderer {
  readonly canvas: HTMLCanvasElement;
  readonly scene: Scene;
  contextsLost = 0;
  private readonly gl: WebGL2RenderingContext;
  private fill!: Program;
  private line!: Program;
  private mix!: Program;
  private cornerBuffer!: WebGLBuffer;
  private drawn: DrawnMesh[] = [];
  private buffers = new Map<Mesh, MeshBuffers>();
  private targets: Target[] = [];
  private readonly paper: Rgba;

  constructor(
    canvas: HTMLCanvasElement,
    scene: Scene,
    options: RendererOptions = {},
  ) {
    this.canvas = canvas;
    this.scene = scene;
    this.paper = hexColour(scene.paper);
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    });
    if (gl === null) throw new Error("no WebGL2");
    this.gl = gl;
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault(); // so that the browser may restore it
      this.contextsLost++;
    });
    canvas.addEventListener("webglcontextrestored", () => {
      this.initialise();
    });
    this.initialise();
  }

  /** Everything that lives in the context: made again after a context loss. */
  private initialise(): void {
    const gl = this.gl;
    this.fill = compile(gl, FILL_VS, FILL_FS);
    this.line = compile(gl, LINE_VS, LINE_FS);
    this.mix = compile(gl, MIX_VS, MIX_FS);
    this.cornerBuffer = this.makeBuffer(
      new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]),
    );
    this.buffers = new Map();
    // Lines are drawn in increasing lineOrder, then in scene order.
    this.drawn = [...this.scene.meshes]
      .sort((first, second) => first.lineOrder - second.lineOrder)
      .map((mesh) => this.prepare(mesh));
    this.targets = [];
  }

  private makeBuffer(data: Float32Array, dynamic = false): WebGLBuffer {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      data,
      dynamic ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW,
    );
    return buffer;
  }

  private prepare(mesh: Mesh): DrawnMesh {
    if (mesh.hiddenInside.length > MAX_DISCS) {
      throw new Error(`${mesh.name} has more than ${String(MAX_DISCS)} discs`);
    }
    const discs = new Float32Array(3 * MAX_DISCS);
    for (const [index, disc] of mesh.hiddenInside.entries()) {
      discs.set([...disc.centre, disc.radius], 3 * index);
    }
    this.build(mesh);
    return { mesh, fillColour: this.fillColour(mesh), discs };
  }

  /** A palette colour over the paper: `opacity x colour + (1 - opacity) x paper`. */
  private fillColour(mesh: Mesh): Rgba | null {
    if (mesh.fill === null) return null;
    const [red, green, blue] = hexRgb(mesh.fill.hex);
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

  private build(mesh: Mesh): void {
    const gl = this.gl;
    const old = this.buffers.get(mesh);
    if (old) {
      gl.deleteBuffer(old.triangles);
      gl.deleteBuffer(old.lines);
    }
    const lines = lineInstances(mesh);
    this.buffers.set(mesh, {
      triangles: this.makeBuffer(mesh.triangles, mesh.dynamic),
      triangleVertices: mesh.triangles.length / 3,
      lines: this.makeBuffer(lines, mesh.dynamic),
      lineCount: lines.length / INSTANCE_FLOATS,
    });
  }

  /** A dynamic mesh takes new geometry (the spring at the balance's angle). */
  updateMesh(mesh: Mesh, geometry: MeshGeometry): void {
    mesh.triangles = geometry.triangles;
    mesh.lines = geometry.lines;
    mesh.silhouetteEdges = geometry.silhouetteEdges;
    if (!this.gl.isContextLost()) this.build(mesh);
  }

  /** The picture `index` (0, or 1 for a fade's second picture), at this size. */
  private target(index: number, width: number, height: number): Target {
    const gl = this.gl;
    const old = this.targets[index];
    if (old?.size[0] === width && old.size[1] === height) return old;
    if (old) {
      gl.deleteTexture(old.colour);
      gl.deleteTexture(old.depth);
      gl.deleteFramebuffer(old.framebuffer);
    }
    const texture = (format: number): WebGLTexture => {
      const made = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, made);
      gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
      for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) {
        gl.texParameteri(gl.TEXTURE_2D, parameter, gl.NEAREST);
      }
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
      return made;
    };
    const framebuffer = gl.createFramebuffer();
    const target: Target = {
      size: [width, height],
      colour: texture(gl.RGBA8),
      depth: texture(gl.DEPTH_COMPONENT24),
      framebuffer,
    };
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      target.colour,
      0,
    );
    this.attachDepth(target, true);
    this.targets[index] = target;
    return target;
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

  /** Draw one frame. */
  render(frame: Frame): void {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    const [width, height] = frame.size;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    const shown = this.drawn.filter(
      ({ mesh }) => !(frame.drawingOnly ?? false) || mesh.inDrawing,
    );
    const models = new Map<Mesh, Float32Array>();
    for (const { mesh } of shown) {
      models.set(
        mesh,
        (mesh.group ? frame.groupMatrices.get(mesh.group) : undefined) ??
          IDENTITY,
      );
    }
    const picture: Picture = {
      camera: viewProjection(frame.view, frame.tilt, this.scene.slide),
      models,
      size: [width, height],
      pixelsPerCss: width / this.scene.slide[0],
    };
    const keep = frame.keep;
    const rest = keep ? Math.min(Math.max(frame.rest ?? 1, 0), 1) : 1;
    const kept = shown.filter(({ mesh }) => keep?.has(mesh));

    if (rest === 1 || rest === 0) {
      const target = this.draw(0, rest === 1 ? shown : kept, picture);
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
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return;
    }
    const withRest = this.draw(0, shown, picture);
    const withoutRest = this.draw(1, kept, picture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    const program = this.mix;
    gl.useProgram(program.program);
    for (const [unit, target] of [withRest, withoutRest].entries()) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, target.colour);
    }
    gl.uniform1i(uniform(program, "withRest"), 0);
    gl.uniform1i(uniform(program, "withoutRest"), 1);
    gl.uniform1f(uniform(program, "rest"), rest);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    for (const unit of [1, 0]) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  /** Draw `meshes` into the picture `index`: faces, then lines. */
  private draw(index: number, meshes: DrawnMesh[], picture: Picture): Target {
    const gl = this.gl;
    const [width, height] = picture.size;
    const target = this.target(index, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    this.attachDepth(target, true);
    gl.viewport(0, 0, width, height);
    gl.clearColor(...this.paper);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    this.drawFaces(meshes, picture);
    // The lines read the depth texture: it must not be attached while they do.
    this.attachDepth(target, false);
    this.drawLines(meshes, picture, target);
    this.attachDepth(target, true);
    return target;
  }

  private setDiscs(program: Program, drawn: DrawnMesh): void {
    const gl = this.gl;
    gl.uniform3fv(uniform(program, "discs"), drawn.discs);
    gl.uniform1i(uniform(program, "discCount"), drawn.mesh.hiddenInside.length);
  }

  private drawFaces(meshes: DrawnMesh[], picture: Picture): void {
    const gl = this.gl;
    const program = this.fill;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(
      uniform(program, "viewProj"),
      false,
      picture.camera.matrix,
    );
    const position = attribute(program, "position");
    gl.enableVertexAttribArray(position);
    gl.depthMask(true);
    for (const drawn of meshes) {
      const buffers = this.buffers.get(drawn.mesh);
      if (!drawn.fillColour || !buffers || buffers.triangleVertices === 0)
        continue;
      gl.uniformMatrix4fv(
        uniform(program, "model"),
        false,
        picture.models.get(drawn.mesh) ?? IDENTITY,
      );
      gl.uniform4fv(uniform(program, "color"), drawn.fillColour);
      this.setDiscs(program, drawn);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.triangles);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, buffers.triangleVertices);
    }
  }

  private drawLines(
    meshes: DrawnMesh[],
    picture: Picture,
    target: Target,
  ): void {
    const gl = this.gl;
    const program = this.line;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(
      uniform(program, "viewProj"),
      false,
      picture.camera.matrix,
    );
    gl.uniform3fv(uniform(program, "toCamera"), picture.camera.toCamera);
    gl.uniform2fv(uniform(program, "viewport"), picture.size);
    gl.uniform1f(uniform(program, "pixelsPerCss"), picture.pixelsPerCss);
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

    const corner = attribute(program, "corner");
    gl.bindBuffer(gl.ARRAY_BUFFER, this.cornerBuffer);
    gl.enableVertexAttribArray(corner);
    gl.vertexAttribPointer(corner, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(corner, 0);
    const layout = [
      ["start", 3, 0],
      ["end", 3, 3],
      ["normalBefore", 3, 6],
      ["normalAfter", 3, 9],
      ["kind", 1, 12],
      ["colour", 4, 13],
      ["width", 1, 17],
    ] as const;
    for (const drawn of meshes) {
      const buffers = this.buffers.get(drawn.mesh);
      if (!buffers || buffers.lineCount === 0) continue;
      const model = picture.models.get(drawn.mesh) ?? IDENTITY;
      gl.uniformMatrix4fv(uniform(program, "model"), false, model);
      gl.uniformMatrix3fv(
        uniform(program, "normalMatrix"),
        false,
        normalMatrix(model),
      );
      this.setDiscs(program, drawn);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.lines);
      for (const [name, size, offset] of layout) {
        const location = attribute(program, name);
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
      }
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, buffers.lineCount);
    }
    for (const [name] of layout)
      gl.vertexAttribDivisor(attribute(program, name), 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
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
    for (const buffers of this.buffers.values()) {
      triangles += buffers.triangleVertices / 3;
      lineSegments += buffers.lineCount;
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
