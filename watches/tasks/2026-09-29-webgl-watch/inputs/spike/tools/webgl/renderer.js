// A WebGL2 renderer for the skeleton-watch cover in 3D, with the house's
// thick lines on its edges. The method comparison that chose this design is
// frozen in ../method_comparison/ (see PLAN.md, section 4).
//
// Faces: stencil-then-cover, so an outline with holes fills by the even-odd
// rule, as in SVG, with no triangulation. Walls: one quad per outline edge.
// A solid is an extrusion of its outline along its own z; a placement matrix
// turns it (the crown is an extrusion along the slide's x axis).
//
// Lines: each edge is an instanced quad, expanded on the screen in the vertex
// shader (mattdesl's "expand in the vertex shader", in screen space). The
// fragment shader measures the distance to the segment and makes a capsule:
// round caps, so a polyline's joins are round, and analytic antialiasing.
// Each outline has the colour, opacity and width of the 2D stroke that draws
// it, or no line. A vertical edge that is not a corner is drawn only where
// the wall turns from facing the camera to facing away: the silhouette of a
// curved wall. A decal is lines only, on the top face of a solid.
//
// Hidden lines: the centre-line test. The faces are drawn into a depth
// texture first. Each fragment of a line takes the point of the line's
// centre line nearest to it, and is drawn only if that point is visible:
// no nearer than the farthest of the 2 x 2 texels around it, plus TOLERANCE.
// So a line is drawn at its full width where its centre is visible, and not
// at all where it is hidden: the painter's rule of the 2D art. Lines do not
// test each other's depth: they are drawn from the lowest solid up, so a
// nearer line covers a farther one where they cross.
//
// Clips: the 2D drawing's clip paths, as discs in plan. A clipped solid is
// not drawn inside its discs, at any height.
//
// The swing: given the balance's angle (option `swing`), the groups that turn
// by it and the hairspring's spiral follow it exactly. Without it, they
// follow SVG's 25 linear keyframes and frames of the swing, as the 2D
// drawing does.
//
// A fade (options `keep` and `rest`) shows the solids in `keep`, and the rest
// of the watch at opacity `rest`, as one image, as SVG's group opacity does:
// the frame is drawn twice, with the rest and without it, and the two
// pictures are mixed. So a fading part never shows its own hidden lines, and
// what it hid shows through it as it fades.

const DEPTH_RANGE = 2000; // slide px: world depth maps to clip z = -depth / range
const TOLERANCE = 0.25; // slide px of depth, for the centre-line test
const MAX_CLIPS = 4;
const SPIRAL_POINTS = 480; // at most 0.011 px from the curve at the cover's scale

const CLIP_GLSL = `
uniform vec3 clips[${MAX_CLIPS}];  // x, y, radius in slide px
uniform int clipCount;
bool clipped(vec2 plan) {
  for (int index = 0; index < ${MAX_CLIPS}; index++) {
    if (index >= clipCount) break;
    if (distance(plan, clips[index].xy) < clips[index].z) return true;
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
${CLIP_GLSL}
void main() {
  if (clipped(plan)) discard;
  fragColor = color;
}`;

const LINE_VS = `#version 300 es
in vec2 corner;      // x: 0 at the start, 1 at the end; y: -1 or +1, the side
in vec3 start;
in vec3 end;
in vec4 normals;     // a vertical edge: the outline normals of the edges on each side
in float kind;       // 0: always drawn; 1: drawn only on a silhouette
in vec4 colour;      // with the stroke's opacity
in float width;      // CSS px of the slide
uniform mat4 model;
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
    mat3 turn = mat3(model);
    float before = dot(turn * vec3(normals.xy, 0.0), toCamera);
    float after = dot(turn * vec3(normals.zw, 0.0), toCamera);
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
${CLIP_GLSL}
void main() {
  vec2 pixel = gl_FragCoord.xy;
  vec2 along = screenEnd - screenStart;
  float squared = dot(along, along);
  float t = squared > 1e-8 ? clamp(dot(pixel - screenStart, along) / squared, 0.0, 1.0) : 0.0;
  vec2 centre = screenStart + t * along;
  float coverage = clamp(halfWidth + 0.5 - distance(pixel, centre), 0.0, 1.0);
  if (coverage <= 0.0) discard;
  if (clipped(mix(planStart, planEnd, t))) discard;
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

function compile(gl, vertexSource, fragmentSource) {
  const program = gl.createProgram();
  for (const [type, source] of [
    [gl.VERTEX_SHADER, vertexSource],
    [gl.FRAGMENT_SHADER, fragmentSource],
  ]) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) && !gl.isContextLost())
      throw new Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost())
    throw new Error(gl.getProgramInfoLog(program));
  const uniforms = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let index = 0; index < count; index++) {
    const name = gl.getActiveUniform(program, index).name.replace("[0]", "");
    uniforms[name] = gl.getUniformLocation(program, name);
  }
  const attributes = {};
  const attributeCount = gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES);
  for (let index = 0; index < attributeCount; index++) {
    const name = gl.getActiveAttrib(program, index).name;
    attributes[name] = gl.getAttribLocation(program, name);
  }
  return { program, uniforms, attributes };
}

// The two pictures of a fade, mixed: the one with the fading solids at
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

function hexColour(hex, alpha = 1) {
  const value = parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255, alpha];
}

// ---- time: SMIL's linear keyframes, as watch_svg.py plays them ---------------------
function segmentAt(keyTimes, fraction) {
  let index = 0;
  while (index < keyTimes.length - 2 && keyTimes[index + 1] <= fraction) index++;
  const span = keyTimes[index + 1] - keyTimes[index];
  const along = span > 0 ? (fraction - keyTimes[index]) / span : 1;
  return [index, Math.min(Math.max(along, 0), 1)];
}

function spiralLine(spiral, swing) {
  const [innerRadius, outerRadius] = spiral.radii;
  const innerAngle = spiral.outerAngle - 360 * spiral.turns + swing;
  const xy = [];
  for (let index = 0; index < SPIRAL_POINTS; index++) {
    const fraction = index / (SPIRAL_POINTS - 1);
    const radius = innerRadius + fraction * (outerRadius - innerRadius);
    const theta = ((innerAngle + fraction * (spiral.outerAngle - innerAngle)) * Math.PI) / 180;
    xy.push([radius * Math.cos(theta), radius * Math.sin(theta)]);
  }
  return xy;
}

function rotationAt(keyframes, time) {
  const repeat = Math.floor(time / keyframes.dur);
  const [index, along] = segmentAt(keyframes.keyTimes, time / keyframes.dur - repeat);
  const start = keyframes.values[index];
  const value = start + (keyframes.values[index + 1] - start) * along;
  return keyframes.accumulate ? repeat * keyframes.values.at(-1) + value : value;
}

// 2D affine matrices as [a, b, c, d, e, f], as SVG's matrix().
function multiply(first, second) {
  const [a, b, c, d, e, f] = first;
  const [a2, b2, c2, d2, e2, f2] = second;
  return [
    a * a2 + c * b2,
    b * a2 + d * b2,
    a * c2 + c * d2,
    b * c2 + d * d2,
    a * e2 + c * f2 + e,
    b * e2 + d * f2 + f,
  ];
}

// `swing`: the balance's angle, or undefined for the keyframes.
function groupMatrix(groups, index, time, swing) {
  const group = groups[index];
  let local = group.static;
  if (group.rotation) {
    const degrees = group.swing && swing !== undefined ? swing : rotationAt(group.rotation, time);
    const radians = (degrees * Math.PI) / 180;
    local = [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0];
  }
  return group.parent === null ? local : multiply(groupMatrix(groups, group.parent, time, swing), local);
}

// 4 x 4 matrices, column-major, as WebGL takes them.
function fromAffine([a, b, c, d, e, f]) {
  return [a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, e, f, 0, 1];
}

function multiply4(first, second) {
  const result = new Float32Array(16);
  for (let column = 0; column < 4; column++)
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += first[k * 4 + row] * second[column * 4 + k];
      result[column * 4 + row] = sum;
    }
  return result;
}

// ---- the camera --------------------------------------------------------------------
// A view: { scale, shift: [x, y], pivot: [x, y, z] }, in slide px. A tilt
// about the horizontal axis through the pivot, then the slide's zoom.
// Screen y = pivot.y + (y - pivot.y) cos t - (z - pivot.z) sin t; depth
// (larger is nearer) = (y - pivot.y) sin t + (z - pivot.z) cos t.
export function viewProjection(view, tiltDegrees, slide) {
  const [width, height] = slide;
  const tilt = (tiltDegrees * Math.PI) / 180;
  const cosine = Math.cos(tilt);
  const sine = Math.sin(tilt);
  const [, pivotY, pivotZ] = view.pivot;
  const k = (2 * view.scale) / height;
  const rows = [
    [(2 * view.scale) / width, 0, 0, (2 * view.shift[0]) / width - 1],
    [
      0,
      -k * cosine,
      k * sine,
      1 - (2 / height) * (view.scale * (pivotY - pivotY * cosine + pivotZ * sine) + view.shift[1]),
    ],
    [0, -sine / DEPTH_RANGE, -cosine / DEPTH_RANGE, (pivotY * sine + pivotZ * cosine) / DEPTH_RANGE],
    [0, 0, 0, 1],
  ];
  const columnMajor = new Float32Array(16);
  for (let row = 0; row < 4; row++) for (let column = 0; column < 4; column++) columnMajor[column * 4 + row] = rows[row][column];
  return { matrix: columnMajor, toCamera: [0, sine, cosine] };
}

// ---- geometry of one solid -----------------------------------------------------------
function pointsOf(line) {
  const points = [];
  for (let index = 0; index < line.points.length; index += 2) points.push([line.points[index], line.points[index + 1]]);
  return points;
}

function edgesOf(line) {
  const count = line.xy.length;
  const edges = [];
  for (let index = 0; index < (line.closed ? count : count - 1); index++) edges.push([index, (index + 1) % count]);
  return edges;
}

function normalOf(line, [from, to]) {
  const dx = line.xy[to][0] - line.xy[from][0];
  const dy = line.xy[to][1] - line.xy[from][1];
  const length = Math.hypot(dx, dy) || 1;
  return [-dy / length, dx / length];
}

function wallTriangles(lines, bottom, top) {
  const values = [];
  for (const line of lines)
    for (const [from, to] of edgesOf(line)) {
      const [x0, y0] = line.xy[from];
      const [x1, y1] = line.xy[to];
      values.push(x0, y0, bottom, x1, y1, bottom, x1, y1, top, x0, y0, bottom, x1, y1, top, x0, y0, top);
    }
  return new Float32Array(values);
}

function faceFan(rings, height) {
  const values = [];
  for (const ring of rings) {
    const [x0, y0] = ring.xy[0];
    for (let index = 1; index + 1 < ring.xy.length; index++) {
      const [x1, y1] = ring.xy[index];
      const [x2, y2] = ring.xy[index + 1];
      values.push(x0, y0, height, x1, y1, height, x2, y2, height);
    }
  }
  return new Float32Array(values);
}

function coverQuad(rings, height) {
  const xs = rings.flatMap((ring) => ring.xy.map(([x]) => x));
  const ys = rings.flatMap((ring) => ring.xy.map(([, y]) => y));
  const [left, right, lowest, highest] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return new Float32Array([
    left, lowest, height, right, lowest, height, right, highest, height,
    left, lowest, height, right, highest, height, left, highest, height,
  ]);
}

// start xyz, end xyz, normals (4), kind, colour rgba, width
const INSTANCE_FLOATS = 16;

// The edges of a solid's outlines that have a line: top and bottom edges,
// and the vertical edges (corners and ends always; other points only on a
// silhouette). A decal has its top edges only.
function lineInstances(lines, bottom, top, decal) {
  const values = [];
  for (const line of lines) {
    if (!line.stroke) continue;
    const style = [...hexColour(line.stroke.colour, line.stroke.opacity), line.stroke.width];
    for (const [from, to] of edgesOf(line)) {
      const [x0, y0] = line.xy[from];
      const [x1, y1] = line.xy[to];
      for (const height of decal ? [top] : [top, bottom])
        values.push(x0, y0, height, x1, y1, height, 0, 0, 0, 0, 0, ...style);
    }
    if (decal) continue;
    const count = line.xy.length;
    for (let index = 0; index < count; index++) {
      const [x, y] = line.xy[index];
      const isEnd = !line.closed && (index === 0 || index === count - 1);
      if (line.corners[index] || isEnd) {
        values.push(x, y, bottom, x, y, top, 0, 0, 0, 0, 0, ...style);
        continue;
      }
      const before = normalOf(line, [(index - 1 + count) % count, index]);
      const after = normalOf(line, [index, (index + 1) % count]);
      values.push(x, y, bottom, x, y, top, ...before, ...after, 1, ...style);
    }
  }
  return new Float32Array(values);
}

// ---- the renderer --------------------------------------------------------------------
export class Renderer {
  // options: preserveDrawingBuffer (for screenshots and stills).
  constructor(canvas, scene, options = {}) {
    this.canvas = canvas;
    this.scene = scene;
    this.contextsLost = 0;
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
    });
    if (!gl) throw new Error("no WebGL2");
    this.gl = gl;
    canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault(); // so that the browser may restore it
      this.contextsLost++;
    });
    canvas.addEventListener("webglcontextrestored", () => this.initialise());
    this.initialise();
  }

  // Everything that lives in the context: made again after a context loss.
  initialise() {
    const gl = this.gl;
    this.fill = compile(gl, FILL_VS, FILL_FS);
    this.line = compile(gl, LINE_VS, LINE_FS);
    // Lines are drawn from the lowest solid up (see the header).
    this.solids = this.scene.solids
      .map((solid) => this.makeSolid(solid))
      .sort((first, second) => first.source.zTop - second.source.zTop);
    this.mix = compile(gl, MIX_VS, MIX_FS);
    this.corner = this.buffer(new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]));
    this.targets = []; // a picture's framebuffer, colour and depth; two for a fade
  }

  buffer(data, usage) {
    const gl = this.gl;
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, data, usage ?? gl.STATIC_DRAW);
    return buffer;
  }

  makeSolid(source) {
    const lines = source.lines.map((line) => ({ ...line, xy: pointsOf(line) }));
    const clips = new Float32Array(3 * MAX_CLIPS);
    source.clips.forEach((clip, index) => clips.set(clip, 3 * index));
    const solid = {
      source,
      lines,
      fillColour: source.fill ? hexColour(source.fill) : null,
      clips,
      clipCount: source.clips.length,
      buffers: null,
    };
    this.build(solid);
    return solid;
  }

  build(solid) {
    const gl = this.gl;
    const { bottom, top, ribbon, decal } = solid.source;
    const rings = ribbon || decal ? [] : solid.lines.filter((line) => line.closed);
    const data = {
      walls: decal ? new Float32Array() : wallTriangles(solid.lines, bottom, top),
      faces: rings.length ? [faceFan(rings, bottom), faceFan(rings, top)] : [],
      covers: rings.length ? [coverQuad(rings, bottom), coverQuad(rings, top)] : [],
      lines: lineInstances(solid.lines, bottom, top, decal),
    };
    const usage = solid.source.morph ? gl.DYNAMIC_DRAW : gl.STATIC_DRAW;
    const old = solid.buffers;
    if (old) for (const buffer of [old.walls, ...old.faces, ...old.covers, old.lines]) gl.deleteBuffer(buffer);
    solid.buffers = {
      walls: this.buffer(data.walls, usage),
      wallCount: data.walls.length / 3,
      faces: data.faces.map((values) => this.buffer(values, usage)),
      faceCounts: data.faces.map((values) => values.length / 3),
      covers: data.covers.map((values) => this.buffer(values, usage)),
      lines: this.buffer(data.lines, usage),
      lineCount: data.lines.length / INSTANCE_FLOATS,
    };
  }

  // The spring at the balance's angle: the same points, but on the spiral.
  spiralTo(solid, swing) {
    const line = solid.lines[0];
    line.xy = spiralLine(solid.source.spiral, swing);
    line.corners = line.xy.map(() => 0);
    this.build(solid);
  }

  morphTo(solid, time) {
    const morph = solid.source.morph;
    const repeat = Math.floor(time / morph.dur);
    const [index, along] = segmentAt(morph.keyTimes, time / morph.dur - repeat);
    solid.lines.forEach((line, lineIndex) => {
      const first = morph.frames[index][lineIndex];
      const second = morph.frames[index + 1][lineIndex];
      // from the frame, not from line.xy: after a spiral, that has other points
      line.xy = Array.from({ length: first.length / 2 }, (_, point) => [
        first[2 * point] + (second[2 * point] - first[2 * point]) * along,
        first[2 * point + 1] + (second[2 * point + 1] - first[2 * point + 1]) * along,
      ]);
      line.corners = solid.source.lines[lineIndex].corners;
    });
    this.build(solid);
  }

  modelOf(solid, time, swing) {
    const source = solid.source;
    const affine =
      source.group === null ? [1, 0, 0, 1, 0, 0] : groupMatrix(this.scene.groups, source.group, time, swing);
    const group = fromAffine(affine);
    return source.placement ? multiply4(group, source.placement) : new Float32Array(group);
  }

  // The picture `index` (0, or 1 for a fade's second picture), at this size.
  target(index, width, height) {
    const gl = this.gl;
    const old = this.targets[index];
    if (old && old.size[0] === width && old.size[1] === height) return old;
    if (old) {
      gl.deleteTexture(old.colour);
      gl.deleteTexture(old.depth);
      gl.deleteFramebuffer(old.framebuffer);
    }
    const texture = (format) => {
      const made = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, made);
      gl.texStorage2D(gl.TEXTURE_2D, 1, format, width, height);
      for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, parameter, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
      return made;
    };
    const target = { size: [width, height], colour: texture(gl.RGBA8), depth: texture(gl.DEPTH24_STENCIL8) };
    target.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.colour, 0);
    this.attachDepth(target, true);
    this.targets[index] = target;
    return target;
  }

  attachDepth(target, attached) {
    const gl = this.gl;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, attached ? target.depth : null, 0);
  }

  // Draw one frame. options:
  //   view: a view's name in the scene, or a view object (see viewProjection);
  //   tilt (degrees); time (s, the mechanism's clock);
  //   size: [width, height] of the drawing buffer in device px (default: the
  //     slide at the window's devicePixelRatio);
  //   clips (default true); slabOnly (only what the slab-order reference draws);
  //   drawingOnly (only what the 2D drawing shows: not the stud);
  //   swing (degrees: the balance's angle; default: from `time`, as SVG does);
  //   keep (a Set of the scene's solids) and rest (the opacity of the others,
  //     default 1): a fade.
  render(options) {
    const gl = this.gl;
    if (gl.isContextLost()) return;
    const scene = this.scene;
    const [slideWidth] = scene.slide;
    const ratio = window.devicePixelRatio ?? 1;
    const [width, height] = options.size ?? scene.slide.map((length) => Math.round(length * ratio));
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    const view =
      typeof options.view === "string" ? scene.views.find((candidate) => candidate.name === options.view) : options.view;
    const camera = viewProjection(view, options.tilt ?? 0, scene.slide);
    const shown = this.solids.filter(
      (solid) => (!options.slabOnly || solid.source.slab) && (!options.drawingOnly || solid.source.inDrawing),
    );
    const swing = options.swing;
    const models = new Map();
    for (const solid of shown) {
      if (solid.source.spiral && swing !== undefined) this.spiralTo(solid, swing);
      else if (solid.source.morph) this.morphTo(solid, options.time);
      models.set(solid, this.modelOf(solid, options.time, swing));
    }
    const picture = { camera, models, clipsOn: options.clips ?? true, size: [width, height], pixelsPerCss: width / slideWidth };
    const rest = options.keep ? Math.min(Math.max(options.rest ?? 1, 0), 1) : 1;
    const kept = shown.filter((solid) => options.keep?.has(solid.source));

    if (rest === 1 || rest === 0) {
      const target = this.draw(0, rest === 1 ? shown : kept, picture);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, target.framebuffer);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
      gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
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
    [withRest, withoutRest].forEach((target, unit) => {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, target.colour);
    });
    gl.uniform1i(program.uniforms.withRest, 0);
    gl.uniform1i(program.uniforms.withoutRest, 1);
    gl.uniform1f(program.uniforms.rest, rest);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    for (const unit of [1, 0]) {
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, null);
    }
  }

  // Draw `solids` into the picture `index`: faces, then lines.
  draw(index, solids, picture) {
    const gl = this.gl;
    const [width, height] = picture.size;
    const target = this.target(index, width, height);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    this.attachDepth(target, true);
    gl.viewport(0, 0, width, height);
    gl.clearColor(...hexColour(this.scene.paper));
    gl.clearDepth(1);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    this.drawSurfaces(solids, picture.models, picture.camera, picture.clipsOn);
    this.attachDepth(target, false); // the lines read the depth: it must not be attached
    this.drawLines(solids, picture.models, picture.camera, picture.clipsOn, target, picture.size, picture.pixelsPerCss);
    this.attachDepth(target, true);
    return target;
  }

  setClips(program, solid, clipsOn) {
    const gl = this.gl;
    gl.uniform3fv(program.uniforms.clips, solid.clips);
    gl.uniform1i(program.uniforms.clipCount, clipsOn ? solid.clipCount : 0);
  }

  // Walls, then faces by stencil-then-cover.
  drawSurfaces(shown, models, camera, clipsOn) {
    const gl = this.gl;
    const program = this.fill;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(program.uniforms.viewProj, false, camera.matrix);
    const position = program.attributes.position;
    gl.enableVertexAttribArray(position);
    for (const solid of shown) {
      if (!solid.fillColour) continue; // a decal
      const buffers = solid.buffers;
      gl.uniformMatrix4fv(program.uniforms.model, false, models.get(solid));
      gl.uniform4fv(program.uniforms.color, solid.fillColour);
      this.setClips(program, solid, clipsOn);
      gl.depthMask(true);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.walls);
      gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, buffers.wallCount);
      buffers.faces.forEach((fan, index) => {
        // Stencil: flip bit 0 for each triangle of the fan: odd means inside.
        gl.enable(gl.STENCIL_TEST);
        gl.colorMask(false, false, false, false);
        gl.depthMask(false);
        gl.disable(gl.DEPTH_TEST);
        gl.stencilMask(1);
        gl.stencilFunc(gl.ALWAYS, 0, 1);
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.INVERT);
        gl.bindBuffer(gl.ARRAY_BUFFER, fan);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, buffers.faceCounts[index]);
        // Cover: draw where bit 0 is set, and clear it again.
        gl.colorMask(true, true, true, true);
        gl.depthMask(true);
        gl.enable(gl.DEPTH_TEST);
        gl.stencilFunc(gl.EQUAL, 1, 1);
        gl.stencilOp(gl.KEEP, gl.ZERO, gl.ZERO);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffers.covers[index]);
        gl.vertexAttribPointer(position, 3, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        gl.disable(gl.STENCIL_TEST);
      });
    }
  }

  drawLines(shown, models, camera, clipsOn, target, viewport, pixelsPerCss) {
    const gl = this.gl;
    const program = this.line;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(program.uniforms.viewProj, false, camera.matrix);
    gl.uniform3fv(program.uniforms.toCamera, camera.toCamera);
    gl.uniform2fv(program.uniforms.viewport, viewport);
    gl.uniform1f(program.uniforms.pixelsPerCss, pixelsPerCss);
    gl.uniform1f(program.uniforms.tolerance, TOLERANCE / (2 * DEPTH_RANGE));
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, target.depth);
    gl.uniform1i(program.uniforms.faceDepth, 0);
    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    const attributes = program.attributes;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.corner);
    gl.enableVertexAttribArray(attributes.corner);
    gl.vertexAttribPointer(attributes.corner, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(attributes.corner, 0);
    const layout = [
      ["start", 3, 0],
      ["end", 3, 3],
      ["normals", 4, 6],
      ["kind", 1, 10],
      ["colour", 4, 11],
      ["width", 1, 15],
    ];
    for (const solid of shown) {
      if (solid.buffers.lineCount === 0) continue;
      gl.uniformMatrix4fv(program.uniforms.model, false, models.get(solid));
      this.setClips(program, solid, clipsOn);
      gl.bindBuffer(gl.ARRAY_BUFFER, solid.buffers.lines);
      for (const [name, size, offset] of layout) {
        const location = attributes[name];
        gl.enableVertexAttribArray(location);
        gl.vertexAttribPointer(location, size, gl.FLOAT, false, INSTANCE_FLOATS * 4, offset * 4);
        gl.vertexAttribDivisor(location, 1);
      }
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, solid.buffers.lineCount);
    }
    for (const [name] of layout) gl.vertexAttribDivisor(attributes[name], 0);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
  }

  info() {
    const gl = this.gl;
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
      vendor: debug ? gl.getParameter(debug.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR),
      version: gl.getParameter(gl.VERSION),
      solids: this.solids.length,
      wallTriangles: this.solids.reduce((sum, solid) => sum + solid.buffers.wallCount / 3, 0),
      lineSegments: this.solids.reduce((sum, solid) => sum + solid.buffers.lineCount, 0),
      contextsLost: this.contextsLost,
    };
  }
}
