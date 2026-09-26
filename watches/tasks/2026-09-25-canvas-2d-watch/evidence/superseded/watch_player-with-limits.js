// Draws the skeleton watch's SVG with Canvas 2D, and plays its SMIL.
//
// readDrawing(svgText) reads the SVG once into fixed objects (the data model
// is in ../../PLAN.md). draw(context, drawing, state, options) then draws one
// frame. The reader knows only the elements and attributes that the
// generator writes, and throws on anything else: a new SVG feature must stop
// the player, not be drawn wrong.

const SVG_NS = "http://www.w3.org/2000/svg";
const SHAPE_ATTRIBUTES = [
  "fill", "fill-opacity", "fill-rule", "stroke", "stroke-width", "stroke-opacity",
  "stroke-linejoin", "stroke-linecap", "transform", "data-part",
];
const KNOWN_ATTRIBUTES = {
  svg: ["xmlns", "width", "height", "viewBox"],
  style: [],
  defs: [],
  clipPath: ["id"],
  g: ["transform", "clip-path", "data-part", "class"],
  path: ["d", ...SHAPE_ATTRIBUTES],
  circle: ["cx", "cy", "r", ...SHAPE_ATTRIBUTES],
  rect: ["x", "y", "width", "height", "rx", ...SHAPE_ATTRIBUTES],
  animateTransform: ["attributeName", "type", "values", "keyTimes", "dur", "repeatCount", "accumulate"],
  animate: ["attributeName", "values", "keyTimes", "dur", "repeatCount"],
};
const CLIP_PATH_ATTRIBUTES = ["d", "clip-rule"];
const ARITY = { M: 2, L: 2, H: 1, V: 1, Q: 4, C: 6, A: 7, Z: 0 };
const MORPH_COMMANDS = ["M", "L", "Q", "C", "Z"]; // what buildPath draws

// ---- fixed data ----------------------------------------------------------

export class Drawing {
  constructor(width, height, root, parts) {
    this.width = width;
    this.height = height;
    this.root = root; // Group
    this.parts = parts; // Part[]
  }
}

export class Part {
  constructor(name) {
    this.name = name; // the SVG's data-part: to match its CSS, and to print
  }
}

class Group {
  constructor(matrix, rotation, clip, limit, part, children) {
    this.matrix = matrix; // DOMMatrix, or null for none
    this.rotation = rotation; // Keyframes, or null: replaces `matrix` (SMIL)
    this.clip = clip; // Clip, or null
    // With a clip: a rectangle (Path2D) that holds all the group draws, at
    // any time. Clipping to it first gives the same picture, but the
    // browser's clip mask covers only the rectangle, not the whole canvas.
    this.limit = limit;
    this.part = part; // Part, or null
    this.children = children; // (Group | Shape)[]
  }
}

class Shape {
  constructor(outline, matrix, fill, fillRule, stroke, strokeWidth, lineJoin, lineCap, part) {
    this.outline = outline; // Path2D, or Morph
    this.matrix = matrix; // DOMMatrix, or null
    this.fill = fill; // Paint, or null
    this.fillRule = fillRule; // "nonzero" | "evenodd"
    this.stroke = stroke; // Paint, or null
    this.strokeWidth = strokeWidth; // slide px at camera scale 1
    this.lineJoin = lineJoin;
    this.lineCap = lineCap;
    this.part = part; // Part, or null
  }
}

class Paint {
  constructor(style) {
    this.style = style; // a canvas fillStyle / strokeStyle
  }
}

class Clip {
  constructor(outline, fillRule) {
    this.outline = outline; // Path2D
    this.fillRule = fillRule;
  }
}

// A rectangle, used while reading to find each clipped group's limit.
class Box {
  constructor(left, top, right, bottom) {
    this.left = left;
    this.top = top;
    this.right = right;
    this.bottom = bottom;
  }

  static around(points) {
    const xs = points.map(([x]) => x), ys = points.map(([, y]) => y);
    return new Box(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys));
  }

  static union(boxes) {
    return Box.around(boxes.flatMap(box => box.corners()));
  }

  corners() {
    return [[this.left, this.top], [this.right, this.top], [this.right, this.bottom], [this.left, this.bottom]];
  }

  grown(margin) {
    return new Box(this.left - margin, this.top - margin, this.right + margin, this.bottom + margin);
  }

  transformed(matrix) {
    if (!matrix) return this;
    return Box.around(this.corners().map(([x, y]) => {
      const point = matrix.transformPoint({ x, y });
      return [point.x, point.y];
    }));
  }

  // The box that holds this one turned by any angle about the origin.
  turning() {
    const radius = Math.max(...this.corners().map(([x, y]) => Math.hypot(x, y)));
    return new Box(-radius, -radius, radius, radius);
  }

  path() {
    const path = new Path2D();
    path.rect(this.left, this.top, this.right - this.left, this.bottom - this.top);
    return path;
  }
}

// Points whose box holds the whole path: ends, control points, and for an
// arc a square of twice its radius around its end (the arc's circle passes
// through the end, so no point of the arc is farther than a diameter away).
function pathPoints(commands, values) {
  const points = [];
  let at = 0, x = 0, y = 0;
  for (const letter of commands) {
    const n = values.subarray(at, at + ARITY[letter]);
    at += ARITY[letter];
    if (letter === "H") x = n[0];
    else if (letter === "V") y = n[0];
    else if (letter === "A") {
      const reach = 2 * Math.max(n[0], n[1]);
      [x, y] = [n[5], n[6]];
      points.push([x - reach, y - reach], [x + reach, y + reach]);
    } else if (letter !== "Z") {
      for (let index = 0; index < n.length; index += 2) points.push([n[index], n[index + 1]]);
      [x, y] = [n.at(-2), n.at(-1)];
    }
    points.push([x, y]);
  }
  return points;
}

// Where `fraction` (0 to 1) falls between keyTimes: [index, along], with
// along from 0 to 1 between keyTimes[index] and keyTimes[index + 1].
function segmentAt(keyTimes, fraction) {
  let low = 0, high = keyTimes.length - 1;
  while (high - low > 1) {
    const middle = (low + high) >> 1;
    if (keyTimes[middle] <= fraction) low = middle; else high = middle;
  }
  const span = keyTimes[high] - keyTimes[low];
  return [low, span > 0 ? Math.min((fraction - keyTimes[low]) / span, 1) : 1];
}

// How far into its simple duration an animation is at `time`: [repeat,
// fraction]. repeatCount is always "indefinite" here.
function repeatAt(duration, time) {
  const repeat = Math.floor(time / duration);
  return [repeat, time / duration - repeat];
}

export class Keyframes {
  constructor(values, keyTimes, duration, accumulate) {
    this.values = values;
    this.keyTimes = keyTimes;
    this.duration = duration; // s
    this.accumulate = accumulate; // "sum": each repeat adds the last value
  }

  valueAt(time) {
    const [repeat, fraction] = repeatAt(this.duration, time);
    const [index, along] = segmentAt(this.keyTimes, fraction);
    const value = this.values[index] + (this.values[index + 1] - this.values[index]) * along;
    return this.accumulate ? repeat * this.values.at(-1) + value : value;
  }
}

export class Morph {
  constructor(commands, frames, keyTimes, duration) {
    this.commands = commands; // letters, e.g. ["M", "C", "C", ...]
    this.frames = frames; // one Float64Array of every number, per keyframe
    this.keyTimes = keyTimes;
    this.duration = duration; // s
  }

  pathAt(time) {
    const [, fraction] = repeatAt(this.duration, time);
    const [index, along] = segmentAt(this.keyTimes, fraction);
    const from = this.frames[index], to = this.frames[index + 1];
    const numbers = from.map((value, at) => value + (to[at] - value) * along);
    return buildPath(this.commands, numbers);
  }
}

function buildPath(commands, numbers) {
  const path = new Path2D();
  let at = 0;
  for (const letter of commands) {
    const n = numbers.subarray(at, at + ARITY[letter]);
    if (letter === "M") path.moveTo(n[0], n[1]);
    else if (letter === "L") path.lineTo(n[0], n[1]);
    else if (letter === "Q") path.quadraticCurveTo(n[0], n[1], n[2], n[3]);
    else if (letter === "C") path.bezierCurveTo(n[0], n[1], n[2], n[3], n[4], n[5]);
    else path.closePath();
    at += ARITY[letter];
  }
  return path;
}

// ---- reading the SVG -----------------------------------------------------

function fail(element, message) {
  throw new Error(`watch_player: <${element.localName}>: ${message}`);
}

function checkAttributes(element, known) {
  for (const attribute of element.attributes)
    if (!known.includes(attribute.name)) fail(element, `unknown attribute ${attribute.name}`);
}

function numbers(text) {
  return text.trim().split(/[\s,]+/).map(Number);
}

function seconds(element) {
  const match = /^([\d.]+)s$/.exec(element.getAttribute("dur") ?? "");
  if (!match) fail(element, `dur ${element.getAttribute("dur")}`);
  if (element.getAttribute("repeatCount") !== "indefinite") fail(element, "repeatCount");
  return Number(match[1]);
}

function parseTransform(element) {
  const text = element.getAttribute("transform");
  if (text === null) return null;
  const matrix = new DOMMatrix();
  for (const [, name, list] of text.matchAll(/(\w+)\(([^)]*)\)/g)) {
    const [a, b = 0, c = 0] = numbers(list);
    if (name === "translate") matrix.translateSelf(a, b);
    else if (name === "rotate") matrix.translateSelf(b, c).rotateSelf(a).translateSelf(-b, -c);
    else fail(element, `transform ${name}`);
  }
  return matrix;
}

// Absolute commands only; extra pairs after M are L, as in SVG.
function parsePathData(element, d) {
  const commands = [], values = [];
  let letter = null, pending = 0;
  for (const [token] of d.matchAll(/[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/g)) {
    if (/[A-Za-z]/.test(token)) {
      if (!(token in ARITY)) fail(element, `path command ${token}`);
      if (pending) fail(element, "path data ends early");
      letter = token;
      commands.push(letter);
      pending = ARITY[letter];
    } else {
      if (!pending) {
        if (letter === null || letter === "Z") fail(element, "number without command");
        letter = letter === "M" ? "L" : letter;
        commands.push(letter);
        pending = ARITY[letter];
      }
      values.push(Number(token));
      pending -= 1;
    }
  }
  if (pending) fail(element, "path data ends early");
  return { commands, values: Float64Array.from(values) };
}

function readPaint(element, name) {
  const colour = element.getAttribute(name) ?? (name === "fill" ? "#000000" : "none");
  if (colour === "none") return null;
  const match = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(colour);
  if (!match) fail(element, `${name} ${colour}`);
  const opacity = Number(element.getAttribute(`${name}-opacity`) ?? "1");
  if (opacity === 1) return new Paint(colour);
  const [red, green, blue] = match.slice(1).map(hex => parseInt(hex, 16));
  return new Paint(`rgba(${red}, ${green}, ${blue}, ${opacity})`);
}

function readKeyTimes(element, count) {
  const keyTimes = element.getAttribute("keyTimes").split(";").map(Number);
  if (keyTimes.some(Number.isNaN) || keyTimes.length !== count || keyTimes[0] !== 0 || keyTimes.at(-1) !== 1)
    fail(element, "keyTimes must run from 0 to 1, one per value");
  return keyTimes;
}

function readRotation(animation) {
  checkAttributes(animation, KNOWN_ATTRIBUTES.animateTransform);
  if (animation.getAttribute("attributeName") !== "transform" || animation.getAttribute("type") !== "rotate")
    fail(animation, "only type=rotate on transform");
  const accumulate = animation.getAttribute("accumulate");
  if (accumulate !== null && accumulate !== "sum") fail(animation, `accumulate ${accumulate}`);
  const values = animation.getAttribute("values").split(";").map(Number);
  if (values.some(Number.isNaN)) fail(animation, "rotate takes one angle per value");
  return new Keyframes(values, readKeyTimes(animation, values.length), seconds(animation), accumulate === "sum");
}

function readMorph(animation) {
  checkAttributes(animation, KNOWN_ATTRIBUTES.animate);
  if (animation.getAttribute("attributeName") !== "d") fail(animation, "only attributeName=d");
  const parsed = animation.getAttribute("values").split(";").map(d => parsePathData(animation, d));
  const commands = parsed[0].commands;
  if (parsed.some(frame => frame.commands.join("") !== commands.join("")))
    fail(animation, "keyframes differ in their commands");
  if (commands.some(letter => !MORPH_COMMANDS.includes(letter)))
    fail(animation, "a morph takes M, L, Q, C and Z only");
  const keyTimes = readKeyTimes(animation, parsed.length);
  return new Morph(commands, parsed.map(frame => frame.values), keyTimes, seconds(animation));
}

class Reader {
  constructor(svg) {
    this.parts = new Map(); // data-part name -> Part, while reading only
    this.clips = new Map(); // clipPath id -> Clip, while reading only
    this.boxes = new Map(); // node -> Box in its parent's space, while reading only
    for (const clipPath of svg.getElementsByTagNameNS(SVG_NS, "clipPath")) {
      checkAttributes(clipPath, KNOWN_ATTRIBUTES.clipPath);
      const paths = [...clipPath.children];
      if (paths.length !== 1 || paths[0].localName !== "path") fail(clipPath, "one <path> only");
      checkAttributes(paths[0], CLIP_PATH_ATTRIBUTES);
      this.clips.set(clipPath.id, new Clip(new Path2D(paths[0].getAttribute("d")), paths[0].getAttribute("clip-rule") ?? "nonzero"));
    }
  }

  part(element) {
    const name = element.getAttribute("data-part");
    if (name === null) return null;
    if (!this.parts.has(name)) this.parts.set(name, new Part(name));
    return this.parts.get(name);
  }

  children(element) {
    const children = [];
    for (const child of element.children) {
      const name = child.localName;
      if (name === "g") children.push(this.group(child));
      else if (name === "path" || name === "circle" || name === "rect") children.push(this.shape(child));
      else if (name === "defs" || name === "style") checkAttributes(child, KNOWN_ATTRIBUTES[name]);
      else if (name !== "animateTransform" && name !== "animate") fail(child, "unknown element");
    }
    return children;
  }

  group(element) {
    checkAttributes(element, KNOWN_ATTRIBUTES.g);
    const animations = [...element.children].filter(child => child.localName === "animateTransform");
    if (animations.length > 1) fail(element, "more than one animateTransform");
    const rotation = animations.length ? readRotation(animations[0]) : null;
    let clip = null;
    const reference = element.getAttribute("clip-path");
    if (reference !== null) {
      clip = this.clips.get(/^url\(#(.+)\)$/.exec(reference)?.[1]);
      if (!clip) fail(element, `clip-path ${reference}`);
    }
    const children = this.children(element);
    const content = Box.union(children.map(child => this.boxes.get(child)));
    const matrix = parseTransform(element);
    const limit = clip ? content.grown(1).path() : null; // 1 px more, for anti-aliasing
    const group = new Group(matrix, rotation, clip, limit, this.part(element), children);
    this.boxes.set(group, rotation ? content.turning() : content.transformed(matrix));
    return group;
  }

  shape(element) {
    const name = element.localName;
    checkAttributes(element, KNOWN_ATTRIBUTES[name]);
    const number = attribute => Number(element.getAttribute(attribute) ?? "0");
    let outline, box;
    if (name === "path") {
      const animations = [...element.children];
      if (animations.length > 1 || (animations.length && animations[0].localName !== "animate"))
        fail(element, "only one <animate> child");
      if (animations.length) {
        outline = readMorph(animations[0]);
        box = Box.around(outline.frames.flatMap(frame => pathPoints(outline.commands, frame)));
      } else {
        const { commands, values } = parsePathData(element, element.getAttribute("d"));
        outline = new Path2D(element.getAttribute("d"));
        box = Box.around(pathPoints(commands, values));
      }
    } else if (name === "circle") {
      const [x, y, radius] = [number("cx"), number("cy"), number("r")];
      outline = new Path2D();
      outline.arc(x, y, radius, 0, 2 * Math.PI);
      outline.closePath();
      box = new Box(x - radius, y - radius, x + radius, y + radius);
    } else {
      const [x, y, width, height] = [number("x"), number("y"), number("width"), number("height")];
      outline = new Path2D();
      outline.roundRect(x, y, width, height, number("rx"));
      box = new Box(x, y, x + width, y + height);
    }
    if (name !== "path" && element.children.length) fail(element, "unexpected children");
    const shape = new Shape(
      outline,
      parseTransform(element),
      readPaint(element, "fill"),
      element.getAttribute("fill-rule") ?? "nonzero",
      readPaint(element, "stroke"),
      Number(element.getAttribute("stroke-width") ?? "1"),
      element.getAttribute("stroke-linejoin") ?? "miter",
      element.getAttribute("stroke-linecap") ?? "butt",
      this.part(element),
    );
    // A stroke reaches half its width out, a miter join (limit 4) twice it.
    const margin = shape.stroke ? 2 * shape.strokeWidth : 0;
    this.boxes.set(shape, box.grown(margin).transformed(shape.matrix));
    return shape;
  }
}

export function readDrawing(svgText) {
  const svg = new DOMParser().parseFromString(svgText, "image/svg+xml").documentElement;
  if (svg.localName !== "svg") throw new Error("watch_player: not an SVG");
  checkAttributes(svg, KNOWN_ATTRIBUTES.svg);
  const width = Number(svg.getAttribute("width")), height = Number(svg.getAttribute("height"));
  if (svg.getAttribute("viewBox") !== `0 0 ${width} ${height}`) fail(svg, "viewBox must match the size");
  const reader = new Reader(svg);
  const root = new Group(null, null, null, null, null, reader.children(svg));
  return new Drawing(width, height, root, [...reader.parts.values()]);
}

// ---- drawing a frame -----------------------------------------------------

// translate(x, y) scale(scale), in slide px: a frozen value.
export function camera(x, y, scale) {
  return Object.freeze({ x, y, scale });
}

// What a caller can tune; make variants with {...DRAW_OPTIONS, clips: false}.
export const DRAW_OPTIONS = Object.freeze({
  compensate: true, // divide line widths by the camera's scale
  clips: true, // apply clip paths (false only to measure their cost)
  limits: true, // clip to each clipped group's limit first (see Group)
});

// state: { time (s on the mechanism's clock), camera, opacity (Map<Part,
// number>, 1 when missing), pixelsPerUnit (device px per slide px) }
export function draw(context, drawing, state, options = DRAW_OPTIONS) {
  const { camera: view, pixelsPerUnit: unit } = state;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.setTransform(unit * view.scale, 0, 0, unit * view.scale, unit * view.x, unit * view.y);
  context.miterLimit = 4; // SVG's default; Canvas 2D's is 10
  const lineScale = options.compensate ? 1 / view.scale : 1;
  drawGroup(context, drawing.root, state, options, lineScale, 1);
}

function opacityOf(node, state, inherited) {
  return node.part ? inherited * (state.opacity.get(node.part) ?? 1) : inherited;
}

function applyMatrix(context, matrix) {
  context.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f);
}

function drawGroup(context, group, state, options, lineScale, inherited) {
  const alpha = opacityOf(group, state, inherited);
  if (alpha === 0) return;
  context.save();
  if (group.rotation) context.rotate((group.rotation.valueAt(state.time) * Math.PI) / 180);
  else if (group.matrix) applyMatrix(context, group.matrix);
  if (group.clip && options.clips) {
    if (options.limits) context.clip(group.limit);
    context.clip(group.clip.outline, group.clip.fillRule);
  }
  for (const child of group.children) {
    if (child instanceof Group) drawGroup(context, child, state, options, lineScale, alpha);
    else drawShape(context, child, state, lineScale, alpha);
  }
  context.restore();
}

function drawShape(context, shape, state, lineScale, inherited) {
  const alpha = opacityOf(shape, state, inherited);
  if (alpha === 0) return;
  const outline = shape.outline instanceof Morph ? shape.outline.pathAt(state.time) : shape.outline;
  if (shape.matrix) {
    context.save();
    applyMatrix(context, shape.matrix);
  }
  context.globalAlpha = alpha;
  if (shape.fill) {
    context.fillStyle = shape.fill.style;
    context.fill(outline, shape.fillRule);
  }
  if (shape.stroke) {
    context.strokeStyle = shape.stroke.style;
    context.lineWidth = shape.strokeWidth * lineScale;
    context.lineJoin = shape.lineJoin;
    context.lineCap = shape.lineCap;
    context.stroke(outline);
  }
  if (shape.matrix) context.restore();
}
