// A WebGL2 spike: the skeleton-watch cover in 3D, with thick lines on its edges.
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
// Clips: the 2D drawing's clip paths, as discs in plan. A clipped solid is
// not drawn inside its discs, at any height.
//
// Which parts of a line are hidden: four methods, to compare.
//   BIAS    (Bartosz): the line's depth, moved towards the camera by a
//           constant, is tested against the faces' depth buffer, fragment
//           by fragment.
//   SLOPE   the same, against a second depth pass of the faces made with
//           glPolygonOffset(factor = half the line width): the faces are
//           moved away by their own depth slope times the half-width.
//   CENTRE  each fragment tests the point of the line's centre line that is
//           nearest to it, against the faces' depth there (the farthest of
//           the 3 x 3 texels around it). A line is drawn at its full width
//           where its centre is visible, and not at all where it is hidden.
//   CENTRE_2X2  the same, with the farthest of the 2 x 2 texels nearest to
//           the centre point: a smaller margin at an occluder's edge.
// Lines do not test each other's depth: they are drawn from the lowest
// solid up, so a nearer line covers a farther one where they cross.

const DEPTH_RANGE = 2000; // slide px: world depth maps to clip z = -depth / range
const MAX_CLIPS = 4;

export const Method = Object.freeze({ BIAS: 0, SLOPE: 1, CENTRE: 2, CENTRE_2X2: 3 });

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
in float width;      // CSS px
uniform mat4 model;
uniform mat4 viewProj;
uniform vec3 toCamera;
uniform vec2 viewport;
uniform float pixelRatio;
uniform float widthOverride;  // CSS px; 0: each line's own
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
  halfWidth = (widthOverride > 0.0 ? widthOverride : width) * pixelRatio / 2.0;
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
uniform int method;
uniform float bias;          // window depth, towards the camera (BIAS)
uniform float tolerance;     // window depth (CENTRE)
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
  if (method == ${Method.CENTRE} || method == ${Method.CENTRE_2X2}) {
    ivec2 size = textureSize(faceDepth, 0);
    bool small = method == ${Method.CENTRE_2X2};
    ivec2 texel = small ? ivec2(floor(centre - 0.5)) : ivec2(floor(centre)) - 1;
    int span = small ? 2 : 3;
    float farthest = 0.0;
    for (int dy = 0; dy < span; dy++) {
      for (int dx = 0; dx < span; dx++) {
        ivec2 at = clamp(texel + ivec2(dx, dy), ivec2(0), size - 1);
        farthest = max(farthest, texelFetch(faceDepth, at, 0).r);
      }
    }
    if (centreDepth > farthest + tolerance) discard;
    gl_FragDepth = centreDepth;
  } else {
    gl_FragDepth = centreDepth - bias;
  }
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
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
      throw new Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program, shader);
  }
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS))
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

function groupMatrix(groups, index, time) {
  const group = groups[index];
  let local = group.static;
  if (group.rotation) {
    const radians = (rotationAt(group.rotation, time) * Math.PI) / 180;
    local = [Math.cos(radians), Math.sin(radians), -Math.sin(radians), Math.cos(radians), 0, 0];
  }
  return group.parent === null ? local : multiply(groupMatrix(groups, group.parent, time), local);
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
// A tilt about the horizontal axis through the pivot, then the slide's zoom.
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
  constructor(canvas, scene) {
    const gl = canvas.getContext("webgl2", { antialias: false, preserveDrawingBuffer: true, alpha: false });
    if (!gl) throw new Error("no WebGL2");
    this.gl = gl;
    this.canvas = canvas;
    this.scene = scene;
    this.fill = compile(gl, FILL_VS, FILL_FS);
    this.line = compile(gl, LINE_VS, LINE_FS);
    // Lines are drawn from the lowest solid up (see the header).
    this.solids = scene.solids.map((solid) => this.makeSolid(solid)).sort((first, second) => first.source.zTop - second.source.zTop);
    this.corner = this.buffer(new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]));
    this.targetSize = [0, 0];
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

  morphTo(solid, time) {
    const morph = solid.source.morph;
    const repeat = Math.floor(time / morph.dur);
    const [index, along] = segmentAt(morph.keyTimes, time / morph.dur - repeat);
    solid.lines.forEach((line, lineIndex) => {
      const first = morph.frames[index][lineIndex];
      const second = morph.frames[index + 1][lineIndex];
      line.xy = line.xy.map((_, point) => [
        first[2 * point] + (second[2 * point] - first[2 * point]) * along,
        first[2 * point + 1] + (second[2 * point + 1] - first[2 * point + 1]) * along,
      ]);
    });
    this.build(solid);
  }

  modelOf(solid, time) {
    const source = solid.source;
    const affine = source.group === null ? [1, 0, 0, 1, 0, 0] : groupMatrix(this.scene.groups, source.group, time);
    const group = fromAffine(affine);
    return source.placement ? multiply4(group, source.placement) : new Float32Array(group);
  }

  target(width, height) {
    const gl = this.gl;
    if (this.targetSize[0] === width && this.targetSize[1] === height) return;
    this.targetSize = [width, height];
    for (const old of [this.colour, this.depth]) if (old) gl.deleteTexture(old);
    if (this.framebuffer) gl.deleteFramebuffer(this.framebuffer);
    this.colour = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.colour);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, width, height);
    this.depth = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.depth);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH24_STENCIL8, width, height);
    for (const parameter of [gl.TEXTURE_MIN_FILTER, gl.TEXTURE_MAG_FILTER]) gl.texParameteri(gl.TEXTURE_2D, parameter, gl.NEAREST);
    this.framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.colour, 0);
    this.attachDepth(true);
  }

  attachDepth(attached) {
    const gl = this.gl;
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.TEXTURE_2D, attached ? this.depth : null, 0);
  }

  // Draw one frame. options: view (name), tilt (degrees), time (s),
  // lineWidth (CSS px, or null for each line's own), method, bias (slide px
  // of depth), tolerance (slide px of depth), pixelRatio, clips (default
  // true), slabOnly (only the solids that the slab-order reference draws).
  render(options) {
    const gl = this.gl;
    const scene = this.scene;
    const ratio = options.pixelRatio ?? window.devicePixelRatio ?? 1;
    const [slideWidth, slideHeight] = scene.slide;
    const width = Math.round(slideWidth * ratio);
    const height = Math.round(slideHeight * ratio);
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.target(width, height);
    const view = scene.views.find((candidate) => candidate.name === options.view);
    const camera = viewProjection(view, options.tilt, scene.slide);
    const shown = this.solids.filter((solid) => !options.slabOnly || solid.source.slab);
    const models = new Map();
    for (const solid of shown) {
      if (solid.source.morph) this.morphTo(solid, options.time);
      models.set(solid, this.modelOf(solid, options.time));
    }
    const clipsOn = options.clips ?? true;

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer);
    this.attachDepth(true);
    gl.viewport(0, 0, width, height);
    gl.clearColor(...hexColour(scene.paper));
    gl.clearDepth(1);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    gl.disable(gl.BLEND);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LESS);
    this.drawSurfaces(shown, models, camera, clipsOn, true, options);

    const method = options.method ?? Method.CENTRE_2X2;
    if (method === Method.SLOPE) {
      // A depth-only pass of the faces, moved away by their slope.
      gl.clear(gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.POLYGON_OFFSET_FILL);
      this.drawSurfaces(shown, models, camera, clipsOn, false, options);
      gl.disable(gl.POLYGON_OFFSET_FILL);
    }
    if (method === Method.CENTRE || method === Method.CENTRE_2X2) this.attachDepth(false);
    this.drawLines(shown, models, camera, clipsOn, options, method, [width, height]);
    this.attachDepth(true);

    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.framebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, null);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  setClips(program, solid, clipsOn) {
    const gl = this.gl;
    gl.uniform3fv(program.uniforms.clips, solid.clips);
    gl.uniform1i(program.uniforms.clipCount, clipsOn ? solid.clipCount : 0);
  }

  // Walls, then faces by stencil-then-cover. With `colour` false, depth only,
  // with the polygon offset for the SLOPE method.
  drawSurfaces(shown, models, camera, clipsOn, colour, options) {
    const gl = this.gl;
    const program = this.fill;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(program.uniforms.viewProj, false, camera.matrix);
    const position = program.attributes.position;
    gl.enableVertexAttribArray(position);
    gl.colorMask(colour, colour, colour, colour);
    if (!colour) {
      const ratio = options.pixelRatio ?? window.devicePixelRatio ?? 1;
      const halfWidth = ((options.lineWidth ?? 4) * ratio) / 2; // the widest line
      gl.polygonOffset(halfWidth + 1, 1);
    }
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
        gl.colorMask(colour, colour, colour, colour);
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
    gl.colorMask(true, true, true, true);
  }

  drawLines(shown, models, camera, clipsOn, options, method, viewport) {
    const gl = this.gl;
    const program = this.line;
    gl.useProgram(program.program);
    gl.uniformMatrix4fv(program.uniforms.viewProj, false, camera.matrix);
    gl.uniform3fv(program.uniforms.toCamera, camera.toCamera);
    gl.uniform2fv(program.uniforms.viewport, viewport);
    gl.uniform1f(program.uniforms.pixelRatio, options.pixelRatio ?? window.devicePixelRatio ?? 1);
    gl.uniform1f(program.uniforms.widthOverride, options.lineWidth ?? 0);
    gl.uniform1i(program.uniforms.method, method);
    gl.uniform1f(program.uniforms.bias, (options.bias ?? 0) / (2 * DEPTH_RANGE));
    gl.uniform1f(program.uniforms.tolerance, (options.tolerance ?? 0.25) / (2 * DEPTH_RANGE));
    // The depth texture is bound only while it is detached from the
    // framebuffer: bound and attached is a feedback loop, and WebGL then
    // refuses the draw call, even if the shader does not sample it.
    gl.activeTexture(gl.TEXTURE0);
    const centre = method === Method.CENTRE || method === Method.CENTRE_2X2;
    gl.bindTexture(gl.TEXTURE_2D, centre ? this.depth : null);
    gl.uniform1i(program.uniforms.faceDepth, 0);
    if (centre) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.NONE);
      gl.disable(gl.DEPTH_TEST);
    } else {
      gl.enable(gl.DEPTH_TEST);
      gl.depthFunc(gl.LEQUAL);
    }
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
    };
  }
}
