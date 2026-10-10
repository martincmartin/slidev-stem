// The design becomes a scene: the parts as meshes, with heights where they
// touch, the 2D art's line styles, the clip discs, the pieces that slides name,
// and the views.
//
// Ported from the spike of watches/tasks/2026-09-28-webgl-planning/
// (depth_order.py: build_solids; cover_model.py: movement, frame, stud_for;
// scene_export.py: views), and from build() in watch_design.py (the shapes
// and their paint). The rules are ported, not the numbers: the numbers follow
// from the layout in design.json. Geometry is in the frame of each part's own
// group: about its arbor if it turns.

import type { Point2 } from "../webgl/mesh.ts";
import {
  extrude,
  polygonRing,
  ribbon,
  smoothRing,
  transformMesh,
} from "../webgl/mesh.ts";
import type { MeshInfo, Ring } from "../webgl/mesh.ts";
import type {
  Colour,
  Disc,
  Group,
  LineStyle,
  Mesh,
  Scene,
  Piece,
  Vec3,
  View,
} from "../webgl/scene.ts";
import { INKS } from "../webgl/scene.ts";
import { at } from "../webgl/checked.ts";
import { HIDDEN_LINE_TOLERANCE } from "../webgl/renderer.ts";
import type { Design, DrivenWheel, Wheel } from "./design.ts";
import { DESIGN, hourRatio } from "./design.ts";
import {
  MAINSPRING_TURNS,
  springPoints,
  SPRING_RADII,
  SPRING_TURNS,
} from "./model.ts";
import type { Spring } from "./model.ts";
import { Path, circlePath } from "./path.ts";
import type { Contour } from "./path.ts";
import {
  clock,
  dagger,
  disc,
  dShape,
  escapeOutline,
  openings,
  polar,
  polygon,
  radians,
} from "./shapes.ts";
import {
  drivenWheelTeeth,
  drivingPinionLeaves,
  meshedSpan,
  pinionLeafShapes,
  pinionLeaves,
  wheelTeeth,
  wheelToothShapes,
} from "./teeth.ts";

// ---- what the art says (the 2D drawing's numbers) ------------------------------------
/** Heights of the train's meshing: a pinion is level with the wheel that
 *  drives it, and an arbor's end rises this far above its pinion. The arbor
 *  runs up from its wheel, through the pinion, so that a view without the
 *  pinion (the Escapement slide's escape wheel) shows no floating arbor. */
const ARBOR_CAP = 3;
const STRAP_THICKNESS = 4;
/** From the watch centre: off the slide up to a tilt of about 75 degrees. */
const STRAP_LENGTH = 1100;
const LUG_LENGTH = 300;
const CROWN_CLEARANCE = 1;
/** The 2D crown is a rectangle 22 by 34 px: a cylinder of this radius along x. */
const CROWN_RADIUS = 17;
const CROWN_LENGTH = 22;
/** The fork sits this far above the escape wheel's teeth. */
const PALLET_STEP = 1;
const STAFF_RADIUS = 3;
/** The balance: its rim's width, its hub's radius, its arms' width. */
const BALANCE_RIM = 8;
const BALANCE_HUB = 10;
const BALANCE_ARM_WIDTH = 6;
/** The balance's radial screws. See docs/watch.md: Balance rim motion. */
interface BalanceScrews {
  readonly count: number;
  readonly radius: number;
  readonly protrusion: number;
  readonly phase: number;
}

const BALANCE_SCREWS: BalanceScrews = Object.freeze({
  count: 4,
  radius: 4,
  protrusion: 4.8,
  phase: 30,
});
/** The span on the Gears slide: teeth of the fourth wheel next to each other,
 *  and the escape pinion's leaves that they drive, in the second. */
interface GearSpan {
  readonly teeth: number;
}

const GEAR_SPAN: GearSpan = Object.freeze({ teeth: 4 });
/** Clearance between moving oscillator layers and beneath the balance. */
const OSCILLATOR_CLEARANCE = 2;
const ROLLER_THICKNESS = 2;
export const JEWEL_RADIUS = 6;
/** The impulse jewel is a D, as in a Swiss lever: its flat faces the fork,
 *  this far from its centre. */
export const JEWEL_FLAT_OFFSET = JEWEL_RADIUS / 3;
/** The circle on the pallet fork's pivot. */
export const FORK_PIVOT_RADIUS = 4;
/** The stud: a block around the spring's outer end. */
const STUD_REACH: [number, number] = [-2, 5];
const STUD_WIDTH = 5;
const STUD_OVERHANG = 1;
const CROWN_ZOOM = 2;
const HAIRSPRING_ZOOM = 250 / 56;
/** Where the balance's arbor is on the slide in the hairspring view. */
const HAIRSPRING_TARGET: Point2 = [275, 276];
/** A fitted view's room across, in slide px (docs/watch.md, "Fitted
 *  views"): the shown pieces are no wider than this. Their middle is at the
 *  middle of the slide's left FIT_FOCUS, but their left edge is never left of
 *  FIT_LEFT. The main focus of a slide is on its left; the callouts use the
 *  room on the right. */
const FIT_LEFT = 16;
const FIT_WIDTH = 948;
const FIT_FOCUS = 0.6;
/** The picture band, in slide px, on the screen (docs/watch.md, "Fitted
 *  views"): where the Gears slide's gears show, under the subtitle. They set
 *  it: their plan filled 420 px halfway between the subtitle's baseline
 *  (110.7, as measured) and the slide's bottom, and at their tilt of 20 they
 *  show here. `watch/generate.test.ts` checks that the Gears slide's view is
 *  still that view. */
export const PICTURE_BAND = { top: 138.44, bottom: 537.53 } as const;
const SPRING_FRAMES = 25;

/** Where a fitted view puts its pieces, up and down (docs/watch.md, "Fitted
 *  views"): in the picture band, under the subtitle; or in the slide band,
 *  the slide's height with the picture band's bottom margin at both ends,
 *  for a picture that may run behind the title. */
export const FIT_BANDS = ["picture", "slide"] as const;
export type FitBand = (typeof FIT_BANDS)[number];

/** The top and the height of a band, in slide px. */
function bandOf(
  band: FitBand,
  slideHeight: number,
): { top: number; height: number } {
  const { top, bottom } = PICTURE_BAND;
  const margin = slideHeight - bottom;
  return band === "picture"
    ? { top, height: bottom - top }
    : { top: margin, height: slideHeight - 2 * margin };
}

// ---- parts and recipes ---------------------------------------------------------------
type Stacking = "touch" | "everything" | "body";

interface Recipe {
  thickness: number;
  stacking: Stacking;
  /** For stacking "body": how far it rises above the body's top. */
  rise: number;
  ribbon: boolean;
}

function recipe(
  thickness: number,
  stacking: Stacking = "touch",
  rise = 0,
  isRibbon = false,
): Recipe {
  return { thickness, stacking, rise, ribbon: isRibbon };
}

/** Which shape of a part a solid is, as the 2D drawing draws it: its first
 *  filled shape, its other filled circles, its other filled paths, and its
 *  open strokes (a spring). */
type Role = "body" | "circle" | "other" | "stroke";

interface Part {
  name: string;
  recipes: Record<Role, Recipe | null>;
  /** The wheel of the train that this part is; null if it is not one. */
  wheel: Wheel | null;
  /** The part whose teeth turn this part's pinion. */
  driver: Part | null;
}

function part(
  name: string,
  recipes: Partial<Record<Role, Recipe>>,
  wheel: Wheel | null = null,
): Part {
  return {
    name,
    recipes: {
      body: recipes.body ?? null,
      circle: recipes.circle ?? null,
      other: recipes.other ?? null,
      stroke: recipes.stroke ?? null,
    },
    wheel,
    driver: null,
  };
}

const WHEEL_RECIPES = {
  body: recipe(3),
  circle: recipe(1.5),
  other: recipe(4),
};

// ---- solids ----------------------------------------------------------------------------
/** A solid before it has heights: an outline in its group's frame. */
interface Solid {
  /** The piece that a slide names to show it (`Scene.pieces`). */
  piece: BuiltPiece;
  part: Part;
  role: Role;
  name: string;
  group: Group;
  rings: Ring[];
  fill: Colour | null;
  /** On the slide: where its group's origin is (the arbor it turns about). */
  pivot: Point2;
  /** How far it reaches from `pivot`, at any time. */
  reach: number;
  ribbon: boolean;
  discs: Disc[];
  inDrawing: boolean;
}

export interface Heights {
  bottom: number;
  top: number;
}

/** Where a piece reaches, at any time: a box on the slide, and its heights. */
export interface Extent {
  readonly box: PlanBox;
  readonly bottom: number;
  readonly top: number;
}

/** A box on the slide, in px. */
export interface PlanBox {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** The smallest box that holds each circle, at any time. */
function contourRing(contour: Contour, style: LineStyle | null): Ring {
  return {
    points: contour.points,
    corners: contour.corners,
    style,
    closed: contour.closed,
  };
}

/** The rings of paths, each path with its own line style. */
function ringsOf(...drawn: [Path, LineStyle | null][]): Ring[] {
  return drawn.flatMap(([path, style]) =>
    path.contours().map((contour) => contourRing(contour, style)),
  );
}

function maxDistance(rings: Ring[], from: Point2): number {
  return Math.max(
    ...rings.flatMap((each) =>
      each.points.map((point) =>
        Math.hypot(point[0] - from[0], point[1] - from[1]),
      ),
    ),
  );
}

function turned(path: Path, degrees: number): Path {
  // A path's points, turned about the origin as SVG's rotate() does.
  const cosine = Math.cos(radians(degrees));
  const sine = Math.sin(radians(degrees));
  const result = new Path();
  for (const contour of path.contours()) {
    contour.points.forEach(([x, y], index) => {
      const at2: Point2 = [x * cosine - y * sine, x * sine + y * cosine];
      if (index === 0) result.moveTo(...at2);
      else result.lineTo(...at2);
    });
    if (contour.closed) result.close();
  }
  return result;
}

// ---- the result --------------------------------------------------------------------------
/** The groups that turn or move, for the model. Every mesh is in one. */
export interface WatchGroups {
  /** Static: the watch centre on the slide. */
  readonly root: Group;
  /** Each wheel of the train, about its arbor. */
  readonly wheels: ReadonlyMap<Wheel, Group>;
  /** The one-step wheel (`oneStepWheel`), about its arbor. */
  readonly oneStep: Group;
  /** The barrel arbor and the winding key, about the arbor: they turn when
   *  the key winds the mainspring, and hold still while the barrel turns. */
  readonly barrelArbor: Group;
  /** Static: the barrel arbor, where the mainspring is. */
  readonly mainspring: Group;
  /** The balance and the impulse jewel: they swing together. */
  readonly balance: Group;
  /** Static: the balance's arbor, where the spring is. */
  readonly springBase: Group;
  readonly fork: Group;
  readonly seconds: Group;
  /** The hour hand, about the centre arbor. */
  readonly hour: Group;
  /** The hour wheel, about the centre arbor, with the hour hand's step. It is
   *  not in the hand's group: its clip disc hides only while its group is
   *  drawn, and the cover draws the hand without the wheel. */
  readonly hourWheel: Group;
  readonly minute: Group;
  /** The minute wheel and its pinion, about its arbor. */
  readonly minuteWheel: Group;
  /** The Hour Hand slide's one-step hour wheel and its hand. */
  readonly oneStepHour: Group;
}

export interface Watch {
  readonly design: Design;
  readonly scene: Scene;
  /** Where each of the scene's pieces reaches, at any time: for a fitted
   *  view (`fittedView`). */
  readonly extents: ReadonlyMap<Piece, Extent>;
  readonly groups: WatchGroups;
  /** The hairspring: its geometry changes with the balance's angle. */
  readonly spring: Mesh;
  readonly springShape: Spring;
  /** The spring's heights, for `ribbonGeometry`. */
  readonly springHeights: Heights;
  /** The mainspring: its geometry changes as it winds and lets down
   *  (watch/mainspring.ts). */
  readonly mainspring: Mesh;
  readonly mainspringShape: Spring;
  readonly mainspringHeights: Heights;
  /** The winding key's meshes (its piece, which `all` leaves out). The
   *  Mainspring slide's story shows them (`WatchModel.extra`). */
  readonly key: ReadonlySet<Mesh>;
  /** The chapter ring's height, on which the decals lie. */
  readonly ringTop: number;
  /** The tops of the escape wheel, the fork and the impulse jewel: where
   *  the Escapement slide's callouts point (watch/callouts.ts). */
  readonly escapementTops: {
    readonly escape: number;
    readonly fork: number;
    readonly jewel: number;
  };
  /** The fourth wheel's top, level with the escape pinion that it drives:
   *  where the Gears slide's callouts point (watch/callouts.ts). */
  readonly gearsTop: number;
  /** The Gear Train slide's one-step wheel (`oneStepWheel`). */
  readonly oneStep: Wheel;
  /** The Hour Hand slide's one-step hour wheel (`oneStepHourWheel`). */
  readonly oneStepHour: DrivenWheel;
}

// ---- paint ------------------------------------------------------------------------------
/** The inks as the fills and line styles that the shapes use. */
interface Paint {
  /** The subject's faces. */
  subjectWash: Colour;
  /** A small dark part of the subject, solid: the jewel, the seconds hand. */
  subjectFill: Colour;
  /** Muted, solid: the hands. */
  mutedFill: Colour;
  /** The faces of what holds the subject: the case, the strap. */
  mutedWash: Colour;
  /** A line in the subject colour. */
  line: (width: number) => LineStyle;
  /** A line in muted. */
  mutedLine: (width: number) => LineStyle;
  /** The second, solid: a mark that says "look here" (the Gears slide's
   *  span). */
  secondFill: Colour;
  /** The faces of a flashed part. */
  secondWash: Colour;
  /** A line in the second: a flashed part's. */
  secondLine: (width: number) => LineStyle;
}

function paintOf(): Paint {
  return {
    subjectWash: { ink: INKS.subjectWash, opacity: 1 },
    subjectFill: { ink: INKS.subject, opacity: 1 },
    mutedFill: { ink: INKS.muted, opacity: 1 },
    mutedWash: { ink: INKS.mutedWash, opacity: 1 },
    line: (width) => ({ ink: INKS.subject, opacity: 1, width }),
    mutedLine: (width) => ({ ink: INKS.muted, opacity: 1, width }),
    secondFill: { ink: INKS.second, opacity: 1 },
    secondWash: { ink: INKS.secondWash, opacity: 1 },
    secondLine: (width) => ({ ink: INKS.second, opacity: 1, width }),
  };
}

// ---- the train -------------------------------------------------------------------------
interface Train {
  barrel: Wheel;
  centre: Wheel;
  third: Wheel;
  fourth: Wheel;
  escape: Wheel;
}

function trainOf(design: Design): Train {
  const [barrel, centre, third, fourth, escape] = design.wheels as [
    Wheel,
    Wheel,
    Wheel,
    Wheel,
    Wheel,
  ];
  return { barrel, centre, third, fourth, escape };
}

// ---- the one-step wheel ---------------------------------------------------------------
/** For the Gear Train slide (docs/watch.md): one wheel that turns the fourth
 *  pinion this many times slower, where the third and the centre wheels take
 *  two steps. It drives the fourth pinion as the third wheel does, at the
 *  third wheel's height, with teeth of the same size, so it has `leaves`
 *  times this many teeth. */
const ONE_STEP_RATIO = 60;
const ONE_STEP_DRAWING = { spokes: 6, rim: 10, hub: 20, spokeWidth: 10 };

/** The one-step wheel: on the line from the escape arbor through the fourth
 *  arbor, where it meshes with the fourth pinion (docs/watch.md, "The Gear
 *  Train slide", says why there). It has a tooth in a gap of
 *  the pinion at the train's start, as the third wheel has. */
export function oneStepWheel(design: Design): Wheel {
  const { escape, third, fourth } = trainOf(design);
  const { pinionRadius, pinionPhase, leaves } = fourth;
  if (pinionRadius === null || pinionPhase === null) {
    throw new Error("the fourth wheel has no pinion");
  }
  const pitchRadius = pinionRadius * ONE_STEP_RATIO;
  const teeth = leaves * ONE_STEP_RATIO;
  const centres = pitchRadius + pinionRadius;
  // the screen angle (degrees, y down) from the fourth arbor to its arbor
  const angle =
    (Math.atan2(
      fourth.arbor[1] - escape.arbor[1],
      fourth.arbor[0] - escape.arbor[0],
    ) *
      180) /
    Math.PI;
  // the pinion's leaves are at pinionPhase, every leafAngle, with gaps
  // between. The wheel's tooth is as far from the line of centres, on the
  // wheel's pitch circle, as the pinion's nearest gap is
  const leafAngle = 360 / leaves;
  const gapPhase = pinionPhase - leafAngle / 2;
  const gap = gapPhase + Math.round((angle - gapPhase) / leafAngle) * leafAngle;
  return {
    name: "one-step wheel",
    teeth,
    pitchRadius,
    inner: pitchRadius - third.depth,
    outer: pitchRadius + third.depth,
    depth: third.depth,
    pitch: (2 * Math.PI * pitchRadius) / teeth,
    spokes: ONE_STEP_DRAWING.spokes,
    leaves: 0,
    pinionRadius: null,
    step: -fourth.step / ONE_STEP_RATIO,
    arbor: [
      fourth.arbor[0] + centres * Math.cos(radians(angle)),
      fourth.arbor[1] + centres * Math.sin(radians(angle)),
    ],
    driven: fourth,
    toothPhase: angle + 180 - (gap - angle) / ONE_STEP_RATIO,
    pinionPhase: null,
  };
}

/** The one-step wheel's meshes, at the heights of the third wheel's body
 *  and of its arbor's circle. Its piece is its name, which `all` leaves out.
 *  No part that shows with it is above it, so nothing hides it. */
function oneStepMeshes(
  wheel: Wheel,
  group: Group,
  heights: { body: Heights; circle: Heights },
  paint: Paint,
): Mesh[] {
  const { line, subjectWash } = paint;
  const { rim, hub, spokeWidth } = ONE_STEP_DRAWING;
  const gaps = openings(
    wheel.spokes,
    hub,
    wheel.inner - rim,
    spokeWidth,
    wheel.toothPhase + 90 / wheel.spokes,
  );
  const info = (name: string, top: number) => ({
    name: `${wheel.name} ${name}`,
    part: wheel.name,
    group,
    fill: subjectWash,
    lineOrder: top,
    inDrawing: false,
  });
  const { body, circle } = heights;
  return [
    extrude(
      ringsOf([wheelTeeth(wheel), line(teethLine(wheel))], [gaps, line(2)]),
      body.bottom,
      body.top,
      info("body", body.top),
    ),
    extrude(
      ringsOf([circlePath(0, 0, 4), line(2)]),
      circle.bottom,
      circle.top,
      info("arbor", circle.top),
    ),
  ];
}

// ---- the motion works ------------------------------------------------------------------
/** Screen degrees from the centre arbor to its arbor: 8 o'clock, where it
 *  covers only the barrel, and its hand's pivot is clear of the minute hand
 *  (the motion-works task, out/scan_one_step_hour.txt). Any angle would do
 *  for the story: every one is off centre. */
const ONE_STEP_HOUR_ANGLE = 150;
/** The motion works' wheels are drawn as the train's are. A rim is wider
 *  than the train's: at tilt 20 the disc that hides the wheels below slides
 *  up to about 3 px against the wheel above (`clipDiscs`), and the rim must
 *  be twice that. */
const MOTION_DRAWINGS = {
  minute: { rim: 6, hub: 6, spokeWidth: 3 },
  hour: { rim: 6, hub: 7, spokeWidth: 3 },
  oneStepHour: { rim: 6, hub: 14, spokeWidth: 7, spokes: 6 },
};
/** The hour wheel's pipe, round the centre arbor, up to the hour hand. */
const HOUR_PIPE_RADIUS = 5.5;

/** The Hour Hand slide's first try (docs/watch.md): one wheel that the
 *  cannon pinion drives as many times slower as the motion works do, so
 *  that the hour hand on its arbor turns once in 12 hours. Its teeth are
 *  the cannon pinion's size, as the minute wheel's are, so it is the 8:1
 *  stage's size times 12/8. It meshes with the cannon pinion at
 *  ONE_STEP_HOUR_ANGLE. A tooth is as far from the line of centres, on its
 *  pitch circle, as the pinion's nearest gap is (as `oneStepWheel`). */
export function oneStepHourWheel(design: Design): DrivenWheel {
  const { cannon, minute } = design.motionWorks;
  const ratio = hourRatio(design.motionWorks);
  if (!Number.isInteger(ratio)) throw new Error("the hour ratio is not whole");
  const teeth = cannon.leaves * ratio;
  const pitchRadius = cannon.radius * ratio;
  const pitch = (2 * Math.PI * pitchRadius) / teeth;
  // the minute wheel's teeth, which mesh with the same pinion
  const { depth } = minute;
  const centres = pitchRadius + cannon.radius;
  const angle = ONE_STEP_HOUR_ANGLE;
  const leafAngle = 360 / cannon.leaves;
  const gapPhase = cannon.phase - leafAngle / 2;
  const gap = gapPhase + Math.round((angle - gapPhase) / leafAngle) * leafAngle;
  return {
    name: "one-step hour",
    teeth,
    pitchRadius,
    inner: pitchRadius - depth,
    outer: pitchRadius + depth,
    depth,
    pitch,
    spokes: MOTION_DRAWINGS.oneStepHour.spokes,
    step: (-cannon.step * cannon.leaves) / teeth,
    arbor: [
      cannon.arbor[0] + centres * Math.cos(radians(angle)),
      cannon.arbor[1] + centres * Math.sin(radians(angle)),
    ],
    toothPhase: angle + 180 - (gap - angle) / ratio,
    driver: cannon,
    pinion: null,
  };
}

/** A wheel of the motion works: its teeth with spoked openings. */
function drivenWheelRings(
  wheel: DrivenWheel,
  drawing: { rim: number; hub: number; spokeWidth: number },
  paint: Paint,
): Ring[] {
  const gaps = openings(
    wheel.spokes,
    drawing.hub,
    wheel.inner - drawing.rim,
    drawing.spokeWidth,
    wheel.toothPhase + 90 / wheel.spokes,
  );
  return ringsOf(
    [drivenWheelTeeth(wheel), paint.line(teethLine(wheel))],
    [gaps, paint.line(2)],
  );
}

/** The motion works' solids (docs/watch.md, "The motion works"): the cannon
 *  pinion on the centre arbor, the minute wheel with its pinion and arbor,
 *  and the hour wheel with its pipe. Each is a piece that `all` leaves out,
 *  so the cover does not show them. Their heights are set in
 *  `assignHeights`. */
function motionWorksSolids(kit: Kit): MotionSolids {
  const { design, paint, train, parts, groups, solids } = kit;
  const { subjectWash, line } = paint;
  const { cannon, minute, hour } = design.motionWorks;
  const minutePinion = minute.pinion;
  if (minutePinion === null) throw new Error("the minute wheel has no pinion");
  const piece = (name: string): BuiltPiece =>
    kit.pieces.make(name, { inAll: false });
  const centreGroup = lookup(groups.wheels, train.centre, "centre group");
  // the hour wheel is above the cannon pinion and the minute wheel: they
  // are hidden under its openings, as the train is
  const underHour = {
    discs: [
      motionDisc(design, hour, MOTION_DRAWINGS.hour.rim, groups.hourWheel),
    ],
  };
  const cannonSolid = solids.add(
    piece("cannon pinion"),
    parts.cannon,
    "other",
    centreGroup,
    ringsOf([drivingPinionLeaves(cannon), line(LEAVES_LINE)]),
    subjectWash,
    underHour,
  );
  const minutePiece = piece("minute wheel");
  const minuteBody = solids.add(
    minutePiece,
    parts.minuteWheel,
    "body",
    groups.minuteWheel,
    drivenWheelRings(minute, MOTION_DRAWINGS.minute, paint),
    subjectWash,
    underHour,
  );
  const minuteHub = solids.add(
    minutePiece,
    parts.minuteWheel,
    "circle",
    groups.minuteWheel,
    ringsOf([circlePath(0, 0, 4), line(2)]),
    subjectWash,
  );
  const minutePinionSolid = solids.add(
    piece("minute pinion"),
    parts.minuteWheel,
    "other",
    groups.minuteWheel,
    ringsOf([drivingPinionLeaves(minutePinion), line(LEAVES_LINE)]),
    subjectWash,
  );
  const minuteArbor = solids.add(
    piece("minute arbor"),
    parts.minuteWheel,
    "circle",
    groups.minuteWheel,
    ringsOf([circlePath(0, 0, 3), line(2)]),
    subjectWash,
  );
  const hourPiece = piece("hour wheel");
  const hourBody = solids.add(
    hourPiece,
    parts.hourWheel,
    "body",
    groups.hourWheel,
    drivenWheelRings(hour, MOTION_DRAWINGS.hour, paint),
    subjectWash,
  );
  const hourPipe = solids.add(
    hourPiece,
    parts.hourWheel,
    "circle",
    groups.hourWheel,
    ringsOf([circlePath(0, 0, HOUR_PIPE_RADIUS), line(2)]),
    subjectWash,
  );
  return {
    cannon: cannonSolid,
    minuteBody,
    minuteHub,
    minutePinion: minutePinionSolid,
    minuteArbor,
    hourBody,
    hourPipe,
  };
}

/** The motion works' solids, for `assignHeights`. */
interface MotionSolids {
  cannon: Solid;
  minuteBody: Solid;
  minuteHub: Solid;
  minutePinion: Solid;
  minuteArbor: Solid;
  hourBody: Solid;
  hourPipe: Solid;
}

/** The one-step hour wheel and its hand, at the heights of the minute
 *  wheel (it meshes with the cannon pinion too) and of the hour hand. Its
 *  pieces are props, which `all` leaves out. */
function oneStepHourMeshes(
  wheel: DrivenWheel,
  group: Group,
  heights: { body: Heights; hand: Heights },
  hand: Path,
  paint: Paint,
): { wheel: Mesh[]; hand: Mesh[] } {
  const { line, subjectWash, mutedFill } = paint;
  const info = (name: string, top: number, fill: Colour) => ({
    name: `${wheel.name} ${name}`,
    part: `${wheel.name} wheel`,
    group,
    fill,
    lineOrder: top,
    inDrawing: false,
  });
  const { body, hand: handHeights } = heights;
  return {
    wheel: [
      extrude(
        drivenWheelRings(wheel, MOTION_DRAWINGS.oneStepHour, paint),
        body.bottom,
        body.top,
        info("body", body.top, subjectWash),
      ),
      extrude(
        ringsOf([circlePath(0, 0, 4), line(2)]),
        body.bottom,
        handHeights.bottom,
        info("arbor", handHeights.bottom, subjectWash),
      ),
    ],
    hand: [
      extrude(
        ringsOf([hand, line(3)]),
        handHeights.bottom,
        handHeights.top,
        info("hand", handHeights.top, mutedFill),
      ),
    ],
  };
}

// ---- groups ----------------------------------------------------------------------------
interface GroupTree {
  groups: WatchGroups;
  /** Every group, the root first. */
  all: Group[];
  /** Where each group's origin is, in the frame of the watch centre. */
  origins: Map<Group, Point2>;
}

function makeGroups(
  design: Design,
  oneStep: Wheel,
  oneStepHour: DrivenWheel,
): GroupTree {
  const { barrel, centre, fourth } = trainOf(design);
  const root: Group = { name: "watch", parent: null };
  const origins = new Map<Group, Point2>([[root, [0, 0]]]);
  const all: Group[] = [root];
  const groupAt = (name: string, arbor: Point2): Group => {
    const made: Group = { name, parent: root };
    origins.set(made, arbor);
    all.push(made);
    return made;
  };
  const wheels = new Map<Wheel, Group>(
    design.wheels.map((wheel) => [
      wheel,
      groupAt(`${wheel.name} wheel`, wheel.arbor),
    ]),
  );
  return {
    groups: {
      root,
      wheels,
      oneStep: groupAt(oneStep.name, oneStep.arbor),
      barrelArbor: groupAt("barrel arbor", barrel.arbor),
      mainspring: groupAt("mainspring", barrel.arbor),
      balance: groupAt("balance", design.balance.arbor),
      springBase: groupAt("spring base", design.balance.arbor),
      fork: groupAt("fork", design.fork.pivot),
      seconds: groupAt("seconds hand", fourth.arbor),
      hour: groupAt("hour hand", centre.arbor),
      hourWheel: groupAt("hour wheel", centre.arbor),
      minute: groupAt("minute hand", centre.arbor),
      minuteWheel: groupAt("minute wheel", design.motionWorks.minute.arbor),
      oneStepHour: groupAt(`${oneStepHour.name} wheel`, oneStepHour.arbor),
    },
    all,
    origins,
  };
}

// ---- parts -----------------------------------------------------------------------------
interface Parts {
  /** The parts of the train's wheels, with their drivers linked. */
  wheels: Map<Wheel, Part>;
  balance: Part;
  spring: Part;
  roller: Part;
  jewel: Part;
  fork: Part;
  seconds: Part;
  ring: Part;
  hour: Part;
  minute: Part;
  pivot: Part;
  cannon: Part;
  minuteWheel: Part;
  hourWheel: Part;
}

function makeParts({ barrel, centre, third, fourth, escape }: Train): Parts {
  const trainWheels = [escape, fourth, third, centre, barrel];
  const wheels = new Map<Wheel, Part>();
  for (const wheel of trainWheels) {
    wheels.set(
      wheel,
      wheel === barrel
        ? part(
            "barrel",
            {
              body: recipe(5),
              circle: recipe(5, "body", 1.5),
              other: recipe(5),
              stroke: recipe(5, "body", 0, true),
            },
            wheel,
          )
        : part(`${wheel.name} wheel`, WHEEL_RECIPES, wheel),
    );
  }
  for (const [wheel, owner] of wheels) {
    // the wheel whose teeth turn this wheel's pinion is the one that drives it
    const driver = trainWheels.find((other) => other.driven === wheel);
    owner.driver = driver ? (wheels.get(driver) ?? null) : null;
  }
  return {
    wheels,
    balance: part("balance", {
      body: recipe(5),
      circle: recipe(2),
      other: recipe(3, "body"),
    }),
    spring: part("hairspring", {
      stroke: recipe(8, "touch", 0, true),
      // the collet, level with the spring
      circle: recipe(8, "body"),
    }),
    roller: part("roller", { body: recipe(ROLLER_THICKNESS) }),
    jewel: part("impulse jewel", {
      body: recipe(3),
      circle: recipe(3),
      other: recipe(3),
    }),
    fork: part("pallet fork", {
      body: recipe(3),
      circle: recipe(1.5),
      other: recipe(3),
    }),
    seconds: part("seconds hand", {
      body: recipe(1.5),
      circle: recipe(1),
      other: recipe(1.5),
    }),
    ring: part("chapter ring", {
      body: recipe(3, "everything"),
      circle: recipe(3),
      other: recipe(3),
    }),
    hour: part("hour hand", {
      body: recipe(1.5, "everything"),
      circle: recipe(1),
      other: recipe(1.5),
    }),
    minute: part("minute hand", {
      body: recipe(1.5, "everything"),
      circle: recipe(1),
      other: recipe(1.5),
    }),
    pivot: part("centre pivot", {
      body: recipe(1, "everything"),
      circle: recipe(1),
      other: recipe(1),
    }),
    // the motion works: `assignHeights` stacks them over the train
    cannon: part("cannon pinion", { other: WHEEL_RECIPES.body }),
    minuteWheel: part("minute wheel", WHEEL_RECIPES),
    hourWheel: part("hour wheel", WHEEL_RECIPES),
  };
}

// ---- clip discs ------------------------------------------------------------------------
/** A lower wheel is hidden inside the root circle of each round part above it
 *  that overlaps it. */
function clipDiscs(
  design: Design,
  groups: WatchGroups,
  oneStep: Wheel,
  oneStepHour: DrivenWheel,
): Map<Wheel, Disc[]> {
  interface Round {
    wheel: Wheel | null;
    group: Group;
    arbor: Point2;
    inner: number;
    outer: number;
  }
  const { watchCentre } = design;
  const rounds: Round[] = design.stack.map((entry) =>
    entry === "balance"
      ? {
          wheel: null,
          group: groups.balance,
          arbor: design.balance.arbor,
          inner: design.balance.radius,
          outer: design.balance.radius,
        }
      : {
          wheel: entry,
          group: lookup(
            groups.wheels,
            entry,
            `group for the ${entry.name} wheel`,
          ),
          arbor: entry.arbor,
          inner: entry.inner,
          outer: entry.outer,
        },
  );
  const discsOver = new Map<Wheel, Disc[]>();
  for (const [index, lower] of rounds.entries()) {
    if (lower.wheel === null) continue;
    discsOver.set(
      lower.wheel,
      rounds
        .slice(index + 1)
        .filter(
          (upper) =>
            Math.hypot(
              lower.arbor[0] - upper.arbor[0],
              lower.arbor[1] - upper.arbor[1],
            ) <
            lower.outer + upper.inner,
        )
        .map((upper) => ({
          centre: [
            watchCentre[0] + upper.arbor[0],
            watchCentre[1] + upper.arbor[1],
          ],
          radius: upper.inner,
          by: upper.group,
        })),
    );
  }
  // the one-step wheel is above the pinion's wheel, as the third wheel is
  if (oneStep.driven) {
    discsOver.get(oneStep.driven)?.push({
      centre: [
        watchCentre[0] + oneStep.arbor[0],
        watchCentre[1] + oneStep.arbor[1],
      ],
      radius: oneStep.inner,
      by: groups.oneStep,
    });
  }
  // The motion works and the one-step hour wheel are far above the train. At
  // a tilt, a disc in the plan slides against the wheel above it, by the
  // height between them times the tilt's tangent. A disc out to the root
  // circle then cuts a sliver out of the wheel below, beside the rim, and a
  // disc out to the openings shows a crescent of it in each opening. So
  // their discs end half way across their rims: they cover the openings,
  // and the rim covers their edges, while the slide is less than half the
  // rim (docs/watch.md, "The motion works").
  const { minute, hour } = design.motionWorks;
  const above: [DrivenWheel, number, Group][] = [
    [minute, MOTION_DRAWINGS.minute.rim, groups.minuteWheel],
    [hour, MOTION_DRAWINGS.hour.rim, groups.hourWheel],
    [oneStepHour, MOTION_DRAWINGS.oneStepHour.rim, groups.oneStepHour],
  ];
  for (const lower of rounds) {
    if (lower.wheel === null) continue;
    for (const [upper, rim, by] of above) {
      const disc = motionDisc(design, upper, rim, by);
      const apart = Math.hypot(
        lower.arbor[0] - upper.arbor[0],
        lower.arbor[1] - upper.arbor[1],
      );
      if (apart >= lower.outer + disc.radius) continue;
      discsOver.get(lower.wheel)?.push(disc);
    }
  }
  return discsOver;
}

/** The disc inside which a wheel of the motion works, or the one-step hour
 *  wheel, hides what is below it: half way across its rim (`clipDiscs`). */
function motionDisc(
  design: Design,
  wheel: DrivenWheel,
  rim: number,
  by: Group,
): Disc {
  const { watchCentre } = design;
  return {
    centre: [watchCentre[0] + wheel.arbor[0], watchCentre[1] + wheel.arbor[1]],
    radius: wheel.inner - rim / 2,
    by,
  };
}

// ---- meshes ----------------------------------------------------------------------------
/** The mesh of each solid, in the drawing's order. */
function solidMeshes(
  solids: Solid[],
  heights: Map<Solid, Heights>,
  dynamic: ReadonlySet<Solid>,
): Map<Solid, Mesh> {
  return new Map(
    solids.map((each) => {
      const { bottom, top } = lookup(heights, each, `heights for ${each.name}`);
      const info = {
        name: each.name,
        part: each.part.name,
        group: each.group,
        fill: each.fill,
        hiddenInside: each.discs,
        lineOrder: top,
        inDrawing: each.inDrawing,
        dynamic: dynamic.has(each),
      };
      return [
        each,
        each.ribbon
          ? ribbon(at(each.rings, 0), bottom, top, info)
          : extrude(each.rings, bottom, top, info),
      ];
    }),
  );
}

interface CaseMeshes {
  meshes: Mesh[];
  caseBottom: number;
  /** Half way between the case's bottom and the chapter ring's top. */
  middle: number;
  /** Where the crown is, along x. */
  crownCentreX: number;
}

/** The case, lugs, strap and crown, around a chapter ring whose top is at
 *  `ringTop`. */
function caseOf(
  design: Design,
  paint: Paint,
  root: Group,
  ringTop: number,
  movementBottom: number,
  pieces: PieceList,
): CaseMeshes {
  const { mutedWash, mutedLine } = paint;
  const { caseRadius, bezelRadius } = design.case;
  const caseDepth = 2 * (CROWN_RADIUS + CROWN_CLEARANCE);
  const caseBottom = Math.min(
    ringTop - caseDepth,
    movementBottom - OSCILLATOR_CLEARANCE,
  );
  const middle = (caseBottom + ringTop) / 2;
  const meshes: Mesh[] = [];
  const add = (piece: BuiltPiece, mesh: Mesh): void => {
    piece.meshes.add(mesh);
    meshes.push(mesh);
  };
  const strapPiece = pieces.make("strap");
  // the same strap, just under the chapter ring's top: above the train, so
  // that it covers the Gear Train slide's one-step wheel (docs/watch.md)
  const raisedStrapPiece = pieces.make("raised strap", { inAll: false });
  const raisedTop = ringTop - 1;
  const lugPiece = pieces.make("lug");
  add(
    pieces.make("case band"),
    extrude(
      ringsOf(
        [circlePath(0, 0, caseRadius), mutedLine(4)],
        [circlePath(0, 0, bezelRadius), mutedLine(3)],
      ),
      caseBottom,
      ringTop,
      {
        name: "case band",
        part: "case band",
        group: root,
        fill: mutedWash,
        lineOrder: ringTop,
      },
    ),
  );
  const caseY = (x: number, side: number): number =>
    side * Math.sqrt(caseRadius ** 2 - x ** 2);
  // the arc flag that follows the case edge on its outside
  const sweep = (left: number, right: number, side: number): boolean =>
    (right - left) * side < 0;
  let level = 1;
  for (const side of [-1, 1]) {
    const far = side * LUG_LENGTH;
    const strapFar = side * STRAP_LENGTH;
    const strapPath = new Path()
      .moveTo(-84, strapFar)
      .lineTo(-84, caseY(84, side))
      .arcTo(caseRadius, false, sweep(-84, 84, side), 84, caseY(84, side))
      .lineTo(84, strapFar)
      .close();
    add(
      strapPiece,
      extrude(
        ringsOf([strapPath, mutedLine(3)]),
        middle - STRAP_THICKNESS / 2,
        middle + STRAP_THICKNESS / 2,
        {
          name: `strap ${String(level)}`,
          part: "strap",
          group: root,
          fill: mutedWash,
          lineOrder: middle + STRAP_THICKNESS / 2,
        },
      ),
    );
    add(
      raisedStrapPiece,
      extrude(
        ringsOf([strapPath, mutedLine(3)]),
        raisedTop - STRAP_THICKNESS,
        raisedTop,
        {
          name: `raised strap ${String(level)}`,
          part: "strap",
          group: root,
          fill: mutedWash,
          lineOrder: raisedTop,
        },
      ),
    );
    level++;
    for (const [left, right] of [
      [-112, -84],
      [84, 112],
    ] as const) {
      const lug = new Path()
        .moveTo(left, far)
        .lineTo(left, caseY(left, side))
        .arcTo(
          caseRadius,
          false,
          sweep(left, right, side),
          right,
          caseY(right, side),
        )
        .lineTo(right, far)
        .close();
      add(
        lugPiece,
        extrude(ringsOf([lug, mutedLine(3)]), caseBottom, ringTop, {
          name: `lug ${String(level)}`,
          part: "lug",
          group: root,
          fill: mutedWash,
          lineOrder: ringTop,
        }),
      );
      level++;
    }
  }
  // the crown: a cylinder along x (the 2D drawing's rectangle is its view from
  // above), at the case's mid-height; the 2D rectangle is 248..270 by -17..17
  const crownLeft = caseRadius - 2;
  const crownMesh = extrude(
    ringsOf([circlePath(0, 0, CROWN_RADIUS), mutedLine(3)]),
    crownLeft,
    crownLeft + CROWN_LENGTH,
    {
      name: "crown",
      part: "crown",
      group: root,
      fill: mutedWash,
      lineOrder: middle + CROWN_RADIUS,
    },
  );
  add(pieces.make("crown"), transformMesh(crownMesh, crownPlacement(middle)));
  return {
    meshes,
    caseBottom,
    middle,
    crownCentreX: crownLeft + CROWN_LENGTH / 2,
  };
}

/** The crown's placement: the outline's (u, v) to the slide's (y, z), the
 *  extrusion's w to x, and up to the case's mid-height. */
function crownPlacement(middle: number): Float32Array {
  // prettier-ignore
  return Float32Array.from([
    0, 1, 0, 0,
    0, 0, 1, 0,
    1, 0, 0, 0,
    0, 0, middle, 1,
  ]);
}

/** A stud: a block around a spring's outer end, which it holds. `name`
 *  names its part. */
function studMesh(
  name: string,
  restSpring: Point2[],
  arbor: Point2,
  springHeights: Heights,
  paint: Paint,
  root: Group,
): { mesh: Mesh; top: number } {
  const outerEnd = at(restSpring, restSpring.length - 1);
  const outward: Point2 = [
    outerEnd[0] / Math.hypot(...outerEnd),
    outerEnd[1] / Math.hypot(...outerEnd),
  ];
  const across: Point2 = [-outward[1], outward[0]];
  const half = STUD_WIDTH / 2;
  const [near, far] = STUD_REACH;
  const points = (
    [
      [near, -half],
      [far, -half],
      [far, half],
      [near, half],
    ] as const
  ).map(([along, side]): Point2 => [
    arbor[0] + outerEnd[0] + outward[0] * along + across[0] * side,
    arbor[1] + outerEnd[1] + outward[1] * along + across[1] * side,
  ]);
  const bottom = springHeights.bottom - STUD_OVERHANG;
  const top = springHeights.top + STUD_OVERHANG;
  return {
    mesh: extrude([polygonRing(points, paint.line(2))], bottom, top, {
      name: `${name} (added)`,
      part: name,
      group: root,
      fill: paint.subjectWash,
      lineOrder: top,
      inDrawing: false,
    }),
    top,
  };
}

// ---- the Mainspring slide's props ----------------------------------------------------
/** The square on the barrel arbor's top, which the key fits: its side, and how
 *  far it rises. It shows the arbor turn. */
const ARBOR_SQUARE = { side: 12, height: 4 };
/** The winding key, an antique clock key: a pipe over the arbor's square, and
 *  a flat bow on it, upright, to turn it by (in the bow's plane: across, and
 *  up from the pipe). Two round lobes, each with a hole, and a dip between. */
const KEY = {
  pipeRadius: 10,
  pipeHeight: 12,
  neck: 5,
  lobeCentre: [13, 15] as Point2,
  lobeRadius: 11,
  holeRadius: 4,
  dip: 18,
  thickness: 3,
  lobePoints: 24,
};
/** The dashes of the mainspring's rest shape, in slide px, as the Hairspring
 *  slide's (art/diving_board.py), at the view that fits the mainspring at
 *  tilt 0; at the slide's tilt they are a little longer. */
const REST_DASH = { dash: 8, gap: 6, width: 4 };

/** The arbor's square, on top of the arbor's disc. */
/** The barrel arbor's square, hidden inside `hiddenInside`: the barrel's
 *  discs, as the arbor is. */
function arborSquareMesh(
  arborTop: number,
  group: Group,
  paint: Paint,
  hiddenInside: Disc[],
): Mesh {
  const half = ARBOR_SQUARE.side / 2;
  const top = arborTop + ARBOR_SQUARE.height;
  return extrude(
    ringsOf([
      polygon([
        [-half, -half],
        [half, -half],
        [half, half],
        [-half, half],
      ]),
      paint.line(2),
    ]),
    arborTop,
    top,
    {
      name: "barrel arbor square (added)",
      part: "barrel arbor",
      group,
      fill: paint.subjectWash,
      hiddenInside,
      lineOrder: top,
      inDrawing: false,
    },
  );
}

/** The key's bow, in its own plane: across (x) and up (y), from the pipe. */
function keyBowRings(paint: Paint): Ring[] {
  const { neck, lobeCentre, lobeRadius, holeRadius, dip, lobePoints } = KEY;
  const [centreX, centreY] = lobeCentre;
  const arc = (side: 1 | -1): Point2[] =>
    Array.from({ length: lobePoints + 1 }, (_, index) => {
      // the right lobe from its lower right, anticlockwise over its top; the
      // left lobe is its mirror image, also anticlockwise
      const angle = radians(-60 + (210 * index) / lobePoints);
      const right: Point2 = [
        centreX + lobeRadius * Math.cos(angle),
        centreY + lobeRadius * Math.sin(angle),
      ];
      return side === 1 ? right : [-right[0], right[1]];
    });
  const right = arc(1);
  const left = arc(-1).reverse();
  const points: Point2[] = [[neck, 0], ...right, [0, dip], ...left, [-neck, 0]];
  const corner = (index: number): boolean =>
    index === 0 ||
    index === 1 ||
    index === right.length ||
    index === right.length + 1 ||
    index === right.length + 2 ||
    index === points.length - 2 ||
    index === points.length - 1;
  const outline: Ring = {
    points,
    corners: points.map((_, index) => corner(index)),
    style: paint.mutedLine(2.5),
    closed: true,
  };
  const holes = [1, -1].map((side) =>
    smoothRing(
      Array.from({ length: lobePoints }, (_, index): Point2 => {
        const angle = (2 * Math.PI * index) / lobePoints;
        return [
          side * centreX + holeRadius * Math.cos(angle),
          centreY + holeRadius * Math.sin(angle),
        ];
      }),
      paint.mutedLine(2),
    ),
  );
  return [outline, ...holes];
}

/** The winding key on the arbor: its pipe, standing on the arbor's disc over
 *  the square, and its bow, upright, in the plane through the arbor and the
 *  slide's x axis, so that it faces the viewer at the start of each turn.
 *  Muted: it acts on the subject. */
function keyMeshes(arborTop: number, group: Group, paint: Paint): Mesh[] {
  const { mutedWash, mutedLine } = paint;
  const pipeTop = arborTop + KEY.pipeHeight;
  const bowTop = pipeTop + KEY.lobeCentre[1] + KEY.lobeRadius;
  const info = (name: string, top: number) => ({
    name: `winding key ${name} (added)`,
    part: "winding key",
    group,
    fill: mutedWash,
    lineOrder: top,
    inDrawing: false,
  });
  const pipe = extrude(
    ringsOf([disc(KEY.pipeRadius), mutedLine(2.5)]),
    arborTop,
    pipeTop,
    info("pipe", pipeTop),
  );
  const flat = extrude(
    keyBowRings(paint),
    -KEY.thickness / 2,
    KEY.thickness / 2,
    info("bow", bowTop),
  );
  // the bow's across stays x, its up becomes z, and its thickness y
  const upright = Float32Array.from([
    1,
    0,
    0,
    0,
    0,
    0,
    1,
    0,
    0,
    -1,
    0,
    0,
    0,
    0,
    pipeTop,
    1,
  ]);
  return [pipe, transformMesh(flat, upright)];
}

/** The mainspring's rest shape, dashed, on its top edge (the edge nearer the
 *  viewer at a tilt), as the Hairspring slide's is: a reference mark, in
 *  muted. `scale`: the view's, which sets the dashes' length in the model. */
function restDashMesh(
  restSpring: Point2[],
  top: number,
  scale: number,
  group: Group,
  paint: Paint,
): Mesh {
  const dash = REST_DASH.dash / scale;
  const period = (REST_DASH.dash + REST_DASH.gap) / scale;
  const dashes: Ring[] = [];
  let along = 0;
  let current: Point2[] = [];
  const close = (): void => {
    if (current.length >= 2) {
      dashes.push(smoothRing(current, paint.mutedLine(REST_DASH.width), false));
    }
    current = [];
  };
  for (let index = 1; index < restSpring.length; index++) {
    const start = at(restSpring, index - 1);
    const end = at(restSpring, index);
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    // split the segment where a dash starts or ends
    const cuts = [0, length];
    for (
      let edge = Math.floor(along / period) * period;
      edge < along + length;
      edge += period
    ) {
      cuts.push(edge - along, edge + dash - along);
    }
    const inside = cuts
      .filter((cut) => cut >= 0 && cut <= length)
      .sort((first, second) => first - second);
    for (let cut = 1; cut < inside.length; cut++) {
      const from = at(inside, cut - 1);
      const to = at(inside, cut);
      if (to - from < 1e-6) continue;
      const middle = along + (from + to) / 2;
      const point = (distance: number): Point2 => [
        start[0] + ((end[0] - start[0]) * distance) / length,
        start[1] + ((end[1] - start[1]) * distance) / length,
      ];
      if (middle % period < dash) {
        if (current.length === 0) current.push(point(from));
        current.push(point(to));
      } else {
        close();
      }
    }
    along += length;
  }
  close();
  // just above the spring's top edge, so that the spring does not hide it
  const height = top + 0.1;
  return extrude(
    dashes,
    height,
    height,
    {
      name: "mainspring rest (added)",
      part: "mainspring rest",
      group,
      fill: null,
      lineOrder: top + 0.5,
      inDrawing: false,
    },
    { decal: true },
  );
}

/** The minute ticks and the hour marks, lying on the chapter ring. */
function decalMeshes(paint: Paint, root: Group, ringTop: number): Mesh[] {
  const tick = (from: number, to: number, angle: number): Ring =>
    polygonRing(
      [polar(from, clock(angle)), polar(to, clock(angle))],
      null,
      false,
    );
  const minuteTicks: Ring[] = [];
  const hourMarks: Ring[] = [];
  for (let minute = 0; minute < 60; minute++) {
    if (minute % 5 !== 0) minuteTicks.push(tick(214, 221, minute * 6));
  }
  for (let hour = 0; hour < 12; hour++)
    hourMarks.push(tick(200, 220, hour * 30));
  const decal = (rings: Ring[], style: LineStyle): Mesh =>
    extrude(
      rings.map((each) => ({ ...each, style })),
      ringTop,
      ringTop,
      {
        name: "decal on chapter ring 1",
        part: "chapter ring",
        group: root,
        fill: null,
        lineOrder: ringTop,
      },
      { decal: true },
    );
  return [
    decal(minuteTicks, { ink: INKS.ink, opacity: 0.5, width: 2 }),
    decal(hourMarks, paint.line(4)),
  ];
}

/** The lowest bottom and the highest top of some heights. */
function heightRange(items: Iterable<Heights>): Heights {
  const all = [...items];
  return {
    bottom: Math.min(...all.map((each) => each.bottom)),
    top: Math.max(...all.map((each) => each.top)),
  };
}

function lookup<Key, Value>(
  map: ReadonlyMap<Key, Value>,
  key: Key,
  what: string,
): Value {
  const found = map.get(key);
  if (found === undefined) throw new Error(`no ${what}`);
  return found;
}

// ---- solids ----------------------------------------------------------------------------
/** What the functions that make solids share. */
interface Kit {
  design: Design;
  paint: Paint;
  train: Train;
  parts: Parts;
  groups: WatchGroups;
  solids: SolidList;
  pieces: PieceList;
}

/** A piece while the watch is built: each mesh joins its piece where it is
 *  made. The scene's pieces (`Scene.pieces`) are these. */
interface BuiltPiece {
  readonly name: string;
  readonly meshes: Set<Mesh>;
  readonly inAll: boolean;
}

/** The pieces, in the order in which they are made. */
class PieceList {
  readonly pieces: BuiltPiece[] = [];

  /** `inAll: false` for a piece that `watch: all` leaves out (`Piece`). */
  make(name: string, { inAll = true } = {}): BuiltPiece {
    const made: BuiltPiece = { name, meshes: new Set(), inAll };
    this.pieces.push(made);
    return made;
  }
}

/** The solids of the movement, in the drawing's order. */
class SolidList {
  readonly solids: Solid[] = [];
  private readonly counts = new Map<Part, number>();
  private readonly origins: ReadonlyMap<Group, Point2>;
  private readonly watchCentre: Point2;
  private readonly discsOver: ReadonlyMap<Wheel, Disc[]>;

  constructor(
    origins: ReadonlyMap<Group, Point2>,
    watchCentre: Point2,
    discsOver: ReadonlyMap<Wheel, Disc[]>,
  ) {
    this.origins = origins;
    this.watchCentre = watchCentre;
    this.discsOver = discsOver;
  }

  add(
    piece: BuiltPiece,
    owner: Part,
    role: Role,
    group: Group,
    rings: Ring[],
    fill: Colour | null,
    extra: Partial<
      Pick<Solid, "pivot" | "reach" | "ribbon" | "inDrawing" | "discs">
    > = {},
  ): Solid {
    const { watchCentre } = this;
    const origin = this.origins.get(group) ?? [0, 0];
    const pivot = extra.pivot ?? [
      watchCentre[0] + origin[0],
      watchCentre[1] + origin[1],
    ];
    const number = (this.counts.get(owner) ?? 0) + 1;
    this.counts.set(owner, number);
    const made: Solid = {
      piece,
      part: owner,
      role,
      name: `${owner.name} ${String(number)}`,
      group,
      rings,
      fill,
      pivot,
      reach:
        extra.reach ??
        maxDistance(
          rings,
          extra.pivot
            ? [pivot[0] - watchCentre[0], pivot[1] - watchCentre[1]]
            : [0, 0],
        ),
      ribbon: extra.ribbon ?? false,
      discs:
        extra.discs ??
        (owner.wheel ? (this.discsOver.get(owner.wheel) ?? []) : []),
      inDrawing: extra.inDrawing ?? true,
    };
    this.solids.push(made);
    return made;
  }
}

/** The width of the line round a wheel's teeth: fine teeth take the thinner
 *  line. */
function teethLine(wheel: Pick<Wheel, "pitch">): number {
  return wheel.pitch < 9 ? 2 : 2.5;
}

/** The width of the line round a pinion's leaves. */
const LEAVES_LINE = 2;

/** The train's wheels but the barrel, back to front: escape wheel, fourth,
 *  third, centre. */
function trainSolids(kit: Kit): void {
  const { design, paint, train, parts, groups, solids } = kit;
  const { subjectWash, line } = paint;
  const { centre, third, fourth, escape } = train;
  interface Drawing {
    rim: number;
    hub: number;
    spokeWidth: number;
  }
  const drawings: [Wheel, Drawing][] = [
    [escape, { rim: 5, hub: 8, spokeWidth: 5 }],
    [fourth, { rim: 5, hub: 8, spokeWidth: 6 }],
    [third, { rim: 6, hub: 12, spokeWidth: 6 }],
    [centre, { rim: 6, hub: 14, spokeWidth: 7 }],
  ];
  for (const [wheel, drawing] of drawings) {
    const owner = lookup(
      parts.wheels,
      wheel,
      `part for the ${wheel.name} wheel`,
    );
    const group = lookup(
      groups.wheels,
      wheel,
      `group for the ${wheel.name} wheel`,
    );
    const outline =
      wheel === escape
        ? escapeOutline(
            wheel.teeth,
            wheel.inner,
            wheel.outer,
            design.escapePhase,
          )
        : wheelTeeth(wheel);
    const gaps =
      wheel === escape && design.escapeSolid
        ? null
        : openings(
            wheel.spokes,
            drawing.hub,
            wheel.pitchRadius - wheel.depth - drawing.rim,
            drawing.spokeWidth,
            wheel.toothPhase + 90 / wheel.spokes,
          );
    const bodyRings = ringsOf(
      [outline, line(teethLine(wheel))],
      ...(gaps ? ([[gaps, line(2)]] as [Path, LineStyle][]) : []),
    );
    // the wheel and its hub are one piece
    const wheelPiece = kit.pieces.make(`${wheel.name} wheel`);
    solids.add(wheelPiece, owner, "body", group, bodyRings, subjectWash);
    solids.add(
      wheelPiece,
      owner,
      "circle",
      group,
      ringsOf([circlePath(0, 0, 4), line(2)]),
      subjectWash,
    );
    solids.add(
      kit.pieces.make(`${wheel.name} pinion`),
      owner,
      "other",
      group,
      ringsOf([pinionLeaves(wheel), line(LEAVES_LINE)]),
      subjectWash,
    );
    solids.add(
      kit.pieces.make(`${wheel.name} arbor`),
      owner,
      "circle",
      group,
      ringsOf([circlePath(0, 0, 3), line(2)]),
      subjectWash,
    );
  }
}

/** The barrel arbor's radius: the mainspring's inner end is hooked to it. */
const BARREL_ARBOR_RADIUS = 15;
/** How far inside the barrel's pitch circle its wall is: where its lid is cut
 *  away, and where the mainspring's outer end is hooked. */
const BARREL_WALL_INSET = 12;
/** Screen degrees: where the mainspring's outer end is, at rest. */
const MAINSPRING_OUTER_ANGLE = 120;

interface BarrelSolids {
  mainspring: Solid;
  arbor: Solid;
  /** The mainspring's coil at rest. */
  restMainspring: Point2[];
  mainspringShape: Spring;
}

/** The barrel, in front: its lid is cut away to show the mainspring. The
 *  mainspring's inner end is hooked to the arbor, and its outer end to the
 *  barrel's wall. Its coils wind outward clockwise, so winding turns the
 *  arbor anticlockwise, as the barrel turns when the spring lets down. */
function barrelSolids(kit: Kit): BarrelSolids {
  const { paint, train, parts, groups, solids } = kit;
  const { subjectWash, line } = paint;
  const { barrel } = train;
  if (!(barrel.step < 0)) {
    throw new Error(
      "the barrel must turn anticlockwise to let the spring down",
    );
  }
  const owner = lookup(parts.wheels, barrel, "barrel part");
  const group = lookup(groups.wheels, barrel, "barrel group");
  const wall = barrel.pitchRadius - BARREL_WALL_INSET;
  solids.add(
    kit.pieces.make("barrel"),
    owner,
    "body",
    group,
    ringsOf([wheelTeeth(barrel), line(2.5)], [disc(wall), line(2)]),
    subjectWash,
  );
  const mainspringShape: Spring = {
    // from the arbor's wall to the barrel's
    radii: [BARREL_ARBOR_RADIUS, wall],
    turns: MAINSPRING_TURNS,
    outerAngle: MAINSPRING_OUTER_ANGLE,
  };
  const restMainspring = springPoints(mainspringShape, 0);
  const mainspring = solids.add(
    kit.pieces.make("mainspring"),
    owner,
    "stroke",
    groups.mainspring,
    [smoothRing(restMainspring, line(2), false)],
    subjectWash,
    // wound, its coils draw in: at rest it reaches furthest
    { ribbon: true },
  );
  const arbor = solids.add(
    kit.pieces.make("barrel arbor"),
    owner,
    "circle",
    groups.barrelArbor,
    ringsOf([disc(BARREL_ARBOR_RADIUS), line(3)]),
    subjectWash,
  );
  return { mainspring, arbor, restMainspring, mainspringShape };
}

/** How a span is painted. */
interface SpanStyle {
  /** What follows the gear's piece name in the span's piece name. */
  readonly name: string;
  readonly fill: Colour;
  readonly line: (width: number) => LineStyle;
}

/** The Gears slide's span (`GEAR_SPAN`) in `style`: the fourth wheel's
 *  teeth, on `teeth`, its body, and the escape pinion's leaves that they
 *  drive, on `leaves`, the pinion. Each is the whole tooth or leaf, at the
 *  same place as its gear's faces (an overlay); it turns with its gear and
 *  is hidden where its gear is. The solid style's outline stays the
 *  subject's: in the second, a tooth and the leaf that it drives would merge
 *  where they touch. */
function spanMeshes(
  fourth: Wheel,
  on: { teeth: Solid; leaves: Solid },
  heightOf: (which: Solid) => Heights,
  style: SpanStyle,
  span: GearSpan,
): { teeth: Mesh; leaves: Mesh } {
  const escape = fourth.driven;
  if (escape === null) throw new Error("the fourth wheel drives no pinion");
  const { teeth, leaves } = meshedSpan(fourth, span.teeth);
  const lying = (solid: Solid, outline: Path, width: number): Mesh => {
    // the whole tooth, at the same place as the gear's faces: an overlay
    const { bottom, top } = heightOf(solid);
    return extrude(ringsOf([outline, style.line(width)]), bottom, top, {
      name: `${solid.piece.name} ${style.name}`,
      part: solid.part.name,
      group: solid.group,
      fill: style.fill,
      hiddenInside: solid.discs,
      lineOrder: top,
      inDrawing: false,
      overlay: true,
    });
  };
  return {
    teeth: lying(on.teeth, wheelToothShapes(fourth, teeth), teethLine(fourth)),
    leaves: lying(on.leaves, pinionLeafShapes(escape, leaves), LEAVES_LINE),
  };
}

/** The drive arrow on a wheel of the train: an arc on the wheel's face,
 *  centred on the line to the wheel that drives it, pointing the way that
 *  the wheel turns (docs/watch.md, "The drive arrow"). The arc's radius is
 *  a fraction of the wheel's root radius: the push enters at the pinion, but
 *  an arrow there, close to the arbor, looks as if it had no leverage. The
 *  head's size is a fraction of the arc's radius, so the arrow is the same
 *  shape on every wheel. The line is CSS px, as every line is. */
const DRIVE_ARROW = {
  radius: 0.7,
  /** Degrees. */
  arc: 90,
  points: 24,
  headLength: 0.31,
  headHalfWidth: 0.175,
  width: 4,
  /** How high the arrow stands on the wheel's face: twice the renderer's
   *  tolerance, so that its head hides the wheel's lines under it. At a
   *  tilt of 20°, the head is then 0.94 of this in front of them. */
  rise: 2 * HIDDEN_LINE_TOLERANCE,
};

/** The drive arrow on `wheel`, in the watch's plan: the shaft, an arc from
 *  its tail, and the head, a triangle from its tip. */
export function driveArrowShape(
  wheel: Wheel,
  driver: Wheel,
): { shaft: Point2[]; head: [Point2, Point2, Point2] } {
  const centre = wheel.arbor;
  const radius = DRIVE_ARROW.radius * wheel.inner;
  const toDriver =
    (Math.atan2(driver.arbor[1] - centre[1], driver.arbor[0] - centre[0]) *
      180) /
    Math.PI;
  const turn = Math.sign(wheel.step);
  if (turn === 0) throw new Error(`the ${wheel.name} wheel does not turn`);
  const headLength = DRIVE_ARROW.headLength * radius;
  const halfWidth = DRIVE_ARROW.headHalfWidth * radius;
  const tipAngle = toDriver + (turn * DRIVE_ARROW.arc) / 2;
  const tip = polar(radius, tipAngle, centre);
  // along the arc's tangent at the tip, the way that the wheel turns
  const tangent = polar(1, tipAngle + turn * 90, [0, 0]);
  const base: Point2 = [
    tip[0] - tangent[0] * headLength,
    tip[1] - tangent[1] * headLength,
  ];
  const side: Point2 = [-tangent[1] * halfWidth, tangent[0] * halfWidth];
  // the shaft runs from the tail to the middle of the head, so that the
  // line's round end does not show past the tip
  const tailAngle = tipAngle - turn * DRIVE_ARROW.arc;
  const endAngle =
    tipAngle - turn * ((headLength / 2 / radius) * (180 / Math.PI));
  const shaft = Array.from({ length: DRIVE_ARROW.points + 1 }, (_, index) =>
    polar(
      radius,
      tailAngle + (endAngle - tailAngle) * (index / DRIVE_ARROW.points),
      centre,
    ),
  );
  return {
    shaft,
    head: [
      tip,
      [base[0] + side[0], base[1] + side[1]],
      [base[0] - side[0], base[1] - side[1]],
    ],
  };
}

/** The drive arrow on `wheel` (`driveArrowShape`), on its face at `top`,
 *  where it does not turn with the wheel: the shaft, a line on the face, and
 *  the head, filled. */
function driveArrowMeshes(
  wheel: Wheel,
  driver: Wheel,
  top: number,
  root: Group,
  paint: Paint,
): Mesh[] {
  const { shaft, head } = driveArrowShape(wheel, driver);
  const info = (name: string, fill: Colour | null): MeshInfo => ({
    name: `${wheel.name} wheel drive ${name}`,
    part: `${wheel.name} wheel drive`,
    group: root,
    fill,
    lineOrder: top + 0.5,
    inDrawing: false,
  });
  // above the wheel's face, so that the head hides the face's lines
  const height = top + DRIVE_ARROW.rise;
  return [
    extrude(
      [smoothRing(shaft, paint.mutedLine(DRIVE_ARROW.width), false)],
      height,
      height,
      info("shaft", null),
      { decal: true },
    ),
    extrude(
      [polygonRing(head, null)],
      top,
      height,
      info("head", paint.mutedFill),
    ),
  ];
}

interface BalanceSolids {
  /** The wheel's rim, arms, and hub as one solid. */
  wheel: Solid;
  /** The hairspring's coil. */
  spring: Solid;
  /** The coil's points at rest. */
  restSpring: Point2[];
  springShape: Spring;
}

/** The balance, its hairspring and collet, and the impulse jewel. */
function balanceSolids(kit: Kit): BalanceSolids {
  const { design, paint, parts, groups, solids } = kit;
  const { subjectWash, subjectFill, line } = paint;
  const { balance: balancePart, spring: springPart, jewel: jewelPart } = parts;
  const { balance: balanceGroup, springBase } = groups;
  const balanceDesign = design.balance;
  const radius = balanceDesign.radius;
  // The rim, arms, and hub are one piece, with no lines at their joins.
  // The radial screws show that the rim turns with the arms.
  const wheel = solids.add(
    kit.pieces.make("balance wheel"),
    balancePart,
    "body",
    balanceGroup,
    ringsOf(
      [disc(radius), line(3)],
      [
        openings(
          3,
          BALANCE_HUB,
          radius - BALANCE_RIM,
          BALANCE_ARM_WIDTH,
          balanceDesign.pinDirection + 60,
        ),
        line(2.5),
      ],
    ),
    subjectWash,
  );

  const springShape: Spring = {
    radii: SPRING_RADII,
    turns: SPRING_TURNS,
    outerAngle: balanceDesign.studAngle,
  };
  const swingSamples = Array.from(
    { length: SPRING_FRAMES },
    (_, index) =>
      design.timing.amplitude *
      Math.cos((2 * Math.PI * index) / (SPRING_FRAMES - 1)),
  );
  const restSpring = springPoints(springShape, at(swingSamples, 0));
  const springSolid = solids.add(
    kit.pieces.make("hairspring"),
    springPart,
    "stroke",
    springBase,
    [smoothRing(restSpring, line(2), false)],
    subjectWash,
    {
      ribbon: true,
      // the largest reach over the swing
      reach: Math.max(
        ...swingSamples.map((swing) =>
          maxDistance(
            [smoothRing(springPoints(springShape, swing), null, false)],
            [0, 0],
          ),
        ),
      ),
    },
  );

  // the collet, which the drawing lacks: the spring's inner end is fixed to
  // it, and it turns with the balance
  solids.add(
    kit.pieces.make("collet"),
    springPart,
    "circle",
    balanceGroup,
    ringsOf([disc(at(SPRING_RADII, 0)), line(2)]),
    subjectWash,
    { inDrawing: false },
  );

  // The roller and jewel turn with the balance. The roller supports the
  // jewel's full footprint and joins it to the staff above the hairspring.
  solids.add(
    kit.pieces.make("roller"),
    parts.roller,
    "body",
    balanceGroup,
    ringsOf([disc(balanceDesign.impulsePinRadius + JEWEL_RADIUS), line(2.5)]),
    subjectWash,
  );

  // the impulse jewel, on the roller: it turns with the balance
  const jewelCentre = polar(
    balanceDesign.impulsePinRadius,
    balanceDesign.pinDirection,
  );
  solids.add(
    kit.pieces.make("impulse jewel"),
    jewelPart,
    "body",
    balanceGroup,
    ringsOf([
      dShape(
        jewelCentre,
        JEWEL_RADIUS,
        JEWEL_FLAT_OFFSET,
        balanceDesign.pinDirection,
      ),
      null,
    ]),
    subjectFill,
  );
  return { wheel, spring: springSolid, restSpring, springShape };
}

/** Radial screw heads with slots on their outward faces. */
function balanceScrewMeshes(
  balance: Design["balance"],
  rimHeights: Heights,
  group: Group,
  paint: Paint,
  screws: BalanceScrews,
): Mesh[] {
  const meshes: Mesh[] = [];
  for (let index = 0; index < screws.count; index++) {
    const angle = radians(
      balance.pinDirection + screws.phase + (360 * index) / screws.count,
    );
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const info = {
      name: `balance screw ${String(index + 1)}`,
      part: "balance",
      group,
      fill: paint.subjectWash,
      lineOrder: rimHeights.top,
      inDrawing: false,
    };
    const head = extrude(
      ringsOf([disc(screws.radius), paint.line(2.5)]),
      balance.radius - 1,
      balance.radius + screws.protrusion,
      info,
    );
    const middle = (rimHeights.bottom + rimHeights.top) / 2;
    const placement = Float32Array.from([
      -sine,
      cosine,
      0,
      0,
      0,
      0,
      1,
      0,
      cosine,
      sine,
      0,
      0,
      0,
      0,
      middle,
      1,
    ]);
    meshes.push(transformMesh(head, placement));
    const slot = extrude(
      [
        polygonRing(
          [
            [-screws.radius * 0.65, 0],
            [screws.radius * 0.65, 0],
          ],
          paint.line(2),
          false,
        ),
      ],
      balance.radius + screws.protrusion,
      balance.radius + screws.protrusion,
      { ...info, name: `${info.name} slot`, fill: null },
      { decal: true },
    );
    meshes.push(transformMesh(slot, placement));
  }
  return meshes;
}

/** The pallet fork. */
function forkSolids(kit: Kit): void {
  const { design, paint, parts, groups, solids } = kit;
  const { subjectWash, line } = paint;
  const { fork: forkPart } = parts;
  const { fork: forkGroup } = groups;
  const forkDesign = design.fork;
  const forkPiece = kit.pieces.make("pallet fork");
  solids.add(
    forkPiece,
    forkPart,
    "body",
    forkGroup,
    [
      polygonRing(
        forkOutlineLocal(forkDesign.outline, forkDesign.heading),
        line(2.5),
      ),
    ],
    subjectWash,
  );
  solids.add(
    forkPiece,
    forkPart,
    "circle",
    forkGroup,
    ringsOf([circlePath(0, 0, FORK_PIVOT_RADIUS), line(2)]),
    subjectWash,
  );
}

/** The seconds hand, the chapter ring, the hands and their pivot.
 *  Returns the chapter ring. */
function dialSolids(kit: Kit): Solid {
  const { design, paint, parts, groups, solids } = kit;
  const { subjectWash, subjectFill, mutedFill, mutedLine, line } = paint;
  const {
    root,
    seconds: secondsGroup,
    hour: hourGroup,
    minute: minuteGroup,
  } = groups;
  const {
    seconds: secondsPart,
    ring: ringPart,
    hour: hourPart,
    minute: minutePart,
    pivot: pivotPart,
  } = parts;
  // the seconds hand, on the fourth wheel's arbor
  const secondsPiece = kit.pieces.make("seconds hand");
  solids.add(
    secondsPiece,
    secondsPart,
    "body",
    secondsGroup,
    ringsOf([
      dagger({
        length: 60,
        maxWidth: 9,
        widestAt: 0.7,
        tail: 6,
        tailWidth: 2,
        neck: 16,
      }),
      line(2),
    ]),
    mutedFill,
  );
  solids.add(
    secondsPiece,
    secondsPart,
    "circle",
    secondsGroup,
    ringsOf([circlePath(0, 0, 2.5), null]),
    subjectFill,
  );

  // the chapter ring: what is left of the dial
  const { bezelRadius, ringRadius } = design.case;
  const ringSolid = solids.add(
    kit.pieces.make("chapter ring"),
    ringPart,
    "body",
    root,
    ringsOf(
      [circlePath(0, 0, bezelRadius), mutedLine(3)],
      [circlePath(0, 0, ringRadius), mutedLine(2)],
    ),
    subjectWash,
  );

  // the hands
  solids.add(
    kit.pieces.make("hour hand"),
    hourPart,
    "body",
    hourGroup,
    ringsOf([hourHandPath(design), line(3)]),
    mutedFill,
  );
  solids.add(
    kit.pieces.make("minute hand"),
    minutePart,
    "body",
    minuteGroup,
    ringsOf([
      turned(
        dagger({
          length: 206,
          maxWidth: 13,
          widestAt: 0.7,
          tail: 12,
          tailWidth: 3,
          neck: 26,
        }),
        design.hands.minute * 6,
      ),
      line(3),
    ]),
    mutedFill,
  );
  solids.add(
    kit.pieces.make("centre pivot"),
    pivotPart,
    "body",
    root,
    ringsOf([circlePath(0, 0, 3.5), line(2)]),
    subjectWash,
  );
  return ringSolid;
}

/** The hour hand about its arbor, at the design's time. */
function hourHandPath(design: Design): Path {
  return turned(
    dagger({
      length: 140,
      maxWidth: 17,
      widestAt: 0.62,
      tail: 10,
      tailWidth: 3,
      neck: 26,
    }),
    (design.hands.hour + design.hands.minute / 60) * 30,
  );
}

/** The balance staff, which the drawing lacks: it rises through the spring's
 *  inner coil. It must come last: the heights place it after the others. */
function staffSolid(kit: Kit): Solid {
  const { design, paint, parts, groups, solids } = kit;
  const { subjectWash, line } = paint;
  const { watchCentre } = design;
  const balanceDesign = design.balance;
  const staffPart = parts.spring; // the balance staff belongs to the hairspring's part
  const { root } = groups;
  return solids.add(
    kit.pieces.make("balance staff"),
    staffPart,
    "body",
    root,
    ringsOf([
      circlePath(balanceDesign.arbor[0], balanceDesign.arbor[1], STAFF_RADIUS),
      line(2),
    ]),
    subjectWash,
    {
      pivot: [
        watchCentre[0] + balanceDesign.arbor[0],
        watchCentre[1] + balanceDesign.arbor[1],
      ],
      reach: STAFF_RADIUS,
    },
  );
}

// ---- the generator -------------------------------------------------------------------------
export function generate(design: Design = DESIGN): Watch {
  const { watchCentre } = design;
  const paint = paintOf();
  const train = trainOf(design);
  const oneStep = oneStepWheel(design);
  const oneStepHour = oneStepHourWheel(design);
  const tree = makeGroups(design, oneStep, oneStepHour);
  const { root } = tree.groups;
  const parts = makeParts(train);
  const partOf = (wheel: Wheel): Part =>
    lookup(parts.wheels, wheel, `part for the ${wheel.name} wheel`);

  // ---- the solids of the movement, in the drawing's order ----
  const discsOver = clipDiscs(design, tree.groups, oneStep, oneStepHour);
  const list = new SolidList(tree.origins, watchCentre, discsOver);
  const kit: Kit = {
    design,
    paint,
    train,
    parts,
    groups: tree.groups,
    solids: list,
    pieces: new PieceList(),
  };
  trainSolids(kit);
  const {
    mainspring: mainspringSolid,
    arbor: barrelArborSolid,
    restMainspring,
    mainspringShape,
  } = barrelSolids(kit);
  const {
    wheel: balanceSolid,
    spring: springSolid,
    restSpring,
    springShape,
  } = balanceSolids(kit);
  forkSolids(kit);
  const motionSolids = motionWorksSolids(kit);
  const ringSolid = dialSolids(kit);
  const staff = staffSolid(kit);
  const solids = list.solids;

  // ---- heights ----
  const heights = assignHeights(solids, {
    springSolid,
    staff,
    ringSolid,
    motion: motionSolids,
    partsOf: {
      escape: partOf(train.escape),
      fourth: partOf(train.fourth),
      centre: partOf(train.centre),
      balance: parts.balance,
      spring: parts.spring,
      roller: parts.roller,
      jewel: parts.jewel,
      fork: parts.fork,
      seconds: parts.seconds,
      ring: parts.ring,
      hour: parts.hour,
      minute: parts.minute,
      pivot: parts.pivot,
    },
  });
  const heightOf = (which: Solid): Heights => {
    const found = heights.get(which);
    if (!found) throw new Error(`no heights for ${which.name}`);
    return found;
  };
  const ringTop = heightOf(ringSolid).top;
  const solidAt = (owner: Part, role: Role): Solid => {
    const found = solids.find(
      (solid) => solid.part === owner && solid.role === role,
    );
    if (!found) throw new Error(`${owner.name} has no ${role}`);
    return found;
  };
  const topOf = (owner: Part, role: Role): number =>
    heightOf(solidAt(owner, role)).top;
  const escapementTops = {
    escape: topOf(partOf(train.escape), "body"),
    fork: topOf(parts.fork, "body"),
    jewel: topOf(parts.jewel, "body"),
  };
  const gearsTop = topOf(partOf(train.fourth), "body");

  // ---- the case, lugs, strap and crown ----
  const {
    meshes: caseMeshes,
    caseBottom,
    middle,
    crownCentreX,
  } = caseOf(
    design,
    paint,
    root,
    ringTop,
    heightRange(heights.values()).bottom,
    kit.pieces,
  );
  const meshes: Mesh[] = [...caseMeshes];

  // ---- the movement's meshes ----
  const movementMeshes = solidMeshes(
    solids,
    heights,
    new Set([springSolid, mainspringSolid]),
  );
  meshes.push(...movementMeshes.values());
  // after the fourth pinion: a wheel's teeth are painted over the pinion
  // that it drives
  const oneStepPiece = kit.pieces.make(oneStep.name, { inAll: false });
  for (const mesh of oneStepMeshes(
    oneStep,
    tree.groups.oneStep,
    {
      body: heightOf(solidAt(partOf(train.third), "body")),
      circle: heightOf(solidAt(partOf(train.third), "circle")),
    },
    paint,
  )) {
    oneStepPiece.meshes.add(mesh);
    meshes.push(mesh);
  }
  // the one-step hour wheel meshes with the cannon pinion, at the minute
  // wheel's height; its hand is where the hour hand is
  const oneStepHourParts = oneStepHourMeshes(
    oneStepHour,
    tree.groups.oneStepHour,
    {
      body: heightOf(motionSolids.minuteBody),
      hand: heightOf(solidAt(parts.hour, "body")),
    },
    hourHandPath(design),
    paint,
  );
  for (const [name, made] of [
    [`${oneStepHour.name} wheel`, oneStepHourParts.wheel],
    [`${oneStepHour.name} hand`, oneStepHourParts.hand],
  ] as const) {
    const piece = kit.pieces.make(name, { inAll: false });
    for (const mesh of made) {
      piece.meshes.add(mesh);
      meshes.push(mesh);
    }
  }
  const balanceScrews = balanceScrewMeshes(
    design.balance,
    heightOf(balanceSolid),
    tree.groups.balance,
    paint,
    BALANCE_SCREWS,
  );
  meshes.push(...balanceScrews);
  const spanStyles: SpanStyle[] = [
    { name: "span", fill: paint.secondFill, line: paint.line },
    // a trial, to compare: the flash's colours
    // (docs/watch.md, "The Gears slide")
    {
      name: "span wash",
      fill: paint.secondWash,
      line: paint.secondLine,
    },
  ];
  const spans = spanStyles.map((style) => {
    const span = spanMeshes(
      train.fourth,
      {
        teeth: solidAt(partOf(train.fourth), "body"),
        leaves: solidAt(partOf(train.escape), "other"),
      },
      heightOf,
      style,
      GEAR_SPAN,
    );
    // the pinion's span first: each wheel's teeth are painted over the
    // pinion that it drives
    meshes.push(span.leaves, span.teeth);
    return { style, ...span };
  });
  // the drive arrows: one on each wheel that a hidden wheel drives
  // (docs/watch.md, "The drive arrow")
  const driveArrows = [
    train.escape,
    train.fourth,
    train.third,
    train.centre,
  ].map((wheel) => {
    const driver = design.wheels.find((each) => each.driven === wheel);
    if (!driver) throw new Error(`nothing drives the ${wheel.name} wheel`);
    const arrow = driveArrowMeshes(
      wheel,
      driver,
      topOf(partOf(wheel), "body"),
      root,
      paint,
    );
    meshes.push(...arrow);
    return { wheel, meshes: arrow };
  });
  const springMesh = lookup(movementMeshes, springSolid, "spring mesh");
  const springHeights = heightOf(springSolid);

  const stud = studMesh(
    "hairspring stud",
    restSpring,
    design.balance.arbor,
    springHeights,
    paint,
    root,
  );
  meshes.push(stud.mesh);

  const decals = decalMeshes(paint, root, ringTop);
  meshes.push(...decals);

  // the Mainspring slide's props (docs/watch.md, "The Mainspring slide")
  const mainspringMesh = lookup(
    movementMeshes,
    mainspringSolid,
    "mainspring mesh",
  );
  const mainspringHeights = heightOf(mainspringSolid);
  const arborTop = heightOf(barrelArborSolid).top;
  const arborSquare = arborSquareMesh(
    arborTop,
    tree.groups.barrelArbor,
    paint,
    discsOver.get(train.barrel) ?? [],
  );
  const keys = keyMeshes(
    arborTop + ARBOR_SQUARE.height,
    tree.groups.barrelArbor,
    paint,
  );
  const mainspringStud = studMesh(
    "mainspring stud",
    restMainspring,
    train.barrel.arbor,
    mainspringHeights,
    paint,
    root,
  );
  // the scale of the view that fits the mainspring: its height fills the
  // picture band
  const restDashes = restDashMesh(
    restMainspring,
    mainspringHeights.top,
    (PICTURE_BAND.bottom - PICTURE_BAND.top) / (2 * mainspringSolid.reach),
    tree.groups.mainspring,
    paint,
  );
  meshes.push(arborSquare, ...keys, mainspringStud.mesh, restDashes);

  // ---- the pieces: what a slide names (watch/state.ts) ----
  for (const [solid, mesh] of movementMeshes) solid.piece.meshes.add(mesh);
  // the screws turn with the balance wheel: they are part of it
  for (const mesh of balanceScrews) balanceSolid.piece.meshes.add(mesh);
  kit.pieces.make("stud").meshes.add(stud.mesh);
  barrelArborSolid.piece.meshes.add(arborSquare);
  kit.pieces
    .make("mainspring stud", { inAll: false })
    .meshes.add(mainspringStud.mesh);
  kit.pieces.make("mainspring rest", { inAll: false }).meshes.add(restDashes);
  // the story shows the key (`WatchModel.extra`): no slide needs to name it
  const keyPiece = kit.pieces.make("winding key", { inAll: false });
  for (const mesh of keys) keyPiece.meshes.add(mesh);
  // the spans are marks on the gears, for the Gears slide only: not in `all`
  for (const { style, teeth, leaves } of spans) {
    kit.pieces
      .make(`fourth wheel ${style.name}`, { inAll: false })
      .meshes.add(teeth);
    kit.pieces
      .make(`escape pinion ${style.name}`, { inAll: false })
      .meshes.add(leaves);
  }
  for (const mesh of decals) ringSolid.piece.meshes.add(mesh);
  // a slide names the arrow that it shows: not in `all`
  for (const arrow of driveArrows) {
    const piece = kit.pieces.make(`${arrow.wheel.name} wheel drive`, {
      inAll: false,
    });
    for (const mesh of arrow.meshes) piece.meshes.add(mesh);
  }
  const pieces: readonly Piece[] = kit.pieces.pieces;
  for (const piece of pieces) {
    if (piece.meshes.size === 0) throw new Error(`${piece.name} has no mesh`);
  }
  const solidOf = new Map(
    [...movementMeshes].map(([solid, mesh]) => [mesh, solid]),
  );
  const extents = new Map(
    pieces.map((piece): [Piece, Extent] => [
      piece,
      extentOf(
        [...piece.meshes].map((mesh) =>
          meshExtent(mesh, solidOf.get(mesh), tree, watchCentre),
        ),
      ),
    ]),
  );

  // ---- the named views ----
  const allHeights = heightRange(heights.values());
  const lowest = Math.min(caseBottom, allHeights.bottom);
  const highest = Math.max(ringTop, stud.top, allHeights.top);
  const springMiddle = (springHeights.bottom + springHeights.top) / 2;
  const scene: Scene = {
    slide: [design.canvas.width, design.canvas.height],
    meshes,
    groups: tree.all,
    views: views(
      design,
      (lowest + highest) / 2,
      springMiddle,
      middle,
      crownCentreX,
    ),
    pieces,
  };

  return {
    design,
    scene,
    extents,
    groups: tree.groups,
    spring: springMesh,
    springShape,
    springHeights,
    mainspring: mainspringMesh,
    mainspringShape,
    mainspringHeights,
    key: keyPiece.meshes,
    ringTop,
    escapementTops,
    gearsTop,
    oneStep,
    oneStepHour,
  };
}

/** The fork's outline in its group's frame: the design's (along, across)
 *  turned to the fork's heading. */
export function forkOutlineLocal(
  outline: readonly Point2[],
  heading: number,
): Point2[] {
  const cosine = Math.cos(radians(heading));
  const sine = Math.sin(radians(heading));
  return outline.map(([along, across]) => [
    along * cosine - across * sine,
    along * sine + across * cosine,
  ]);
}

function views(
  design: Design,
  coverMiddle: number,
  springMiddle: number,
  caseMiddle: number,
  crownCentreX: number,
): View[] {
  const [centreX, centreY] = design.watchCentre;
  const arbor: Point2 = [
    centreX + design.balance.arbor[0],
    centreY + design.balance.arbor[1],
  ];
  const [targetX, targetY] = HAIRSPRING_TARGET;
  const width = design.canvas.width;
  const height = design.canvas.height;
  return [
    {
      name: "cover",
      scale: 1,
      shift: [0, 0],
      pivot: [centreX, centreY, coverMiddle],
    },
    {
      name: "hairspring",
      scale: HAIRSPRING_ZOOM,
      shift: [
        targetX - HAIRSPRING_ZOOM * arbor[0],
        targetY - HAIRSPRING_ZOOM * arbor[1],
      ],
      pivot: [arbor[0], arbor[1], springMiddle],
    },
    {
      name: "crown",
      scale: CROWN_ZOOM,
      shift: [
        width / 2 - CROWN_ZOOM * (centreX + crownCentreX),
        height / 2 - CROWN_ZOOM * centreY,
      ],
      pivot: [centreX + crownCentreX, centreY, caseMiddle],
    },
  ];
}

/** The view of `pieces` when a slide names no view (docs/watch.md, "Fitted
 *  views"): as large as they fit in FIT_WIDTH by the band's height, centred
 *  in the slide's left FIT_FOCUS but not left of FIT_LEFT, with their middle
 *  at the band's middle (`bandOf`). If `right` is a number, their right edge
 *  is there instead, in slide px (`watchRight`). It tilts about their middle,
 *  at the middle of their heights. */
export function fittedView(
  watch: Watch,
  pieces: readonly Piece[],
  right: number | null = null,
  band: FitBand = "picture",
  tilt = 0,
): View {
  const extents = pieces.map((piece) =>
    lookup(watch.extents, piece, `extent of ${piece.name}`),
  );
  const { box, bottom, top } = extentOf(extents);
  const { width, height } = watch.design.canvas;
  const room = bandOf(band, height);
  const middle: Point2 = [
    (box.left + box.right) / 2,
    (box.top + box.bottom) / 2,
  ];
  const pivotZ = (bottom + top) / 2;
  // Up and down on the slide, from the pivot, before the scale: each piece
  // as the tilted camera shows it, so that the band's margins are on the
  // screen. The camera is orthographic: a point shows at (y - pivot y)
  // cos(tilt) - (z - pivot z) sin(tilt) (`viewProjection` in
  // webgl/renderer.ts).
  const across = radians(tilt);
  const shownY = (y: number, z: number): number =>
    (y - middle[1]) * Math.cos(across) - (z - pivotZ) * Math.sin(across);
  const reach = extents.flatMap((extent) => [
    shownY(extent.box.top, extent.top),
    shownY(extent.box.top, extent.bottom),
    shownY(extent.box.bottom, extent.top),
    shownY(extent.box.bottom, extent.bottom),
  ]);
  const upper = Math.min(...reach);
  const lower = Math.max(...reach);
  const scale = Math.min(
    FIT_WIDTH / (box.right - box.left),
    room.height / (lower - upper),
  );
  const halfWidth = (scale * (box.right - box.left)) / 2;
  const middleX =
    right === null
      ? Math.max((FIT_FOCUS * width) / 2, FIT_LEFT + halfWidth)
      : right - halfWidth;
  // the middle of what shows at the band's middle
  const middleY = room.top + room.height / 2 - (scale * (upper + lower)) / 2;
  return {
    name: pieces.map((piece) => piece.name).join(", "),
    scale,
    shift: [middleX - scale * middle[0], middleY - scale * middle[1]],
    pivot: [...middle, pivotZ],
  };
}

/** The smallest extent that holds all of `extents`. */
function extentOf(extents: readonly Extent[]): Extent {
  if (extents.length === 0) throw new Error("the extent of nothing");
  return {
    box: {
      left: Math.min(...extents.map(({ box }) => box.left)),
      top: Math.min(...extents.map(({ box }) => box.top)),
      right: Math.max(...extents.map(({ box }) => box.right)),
      bottom: Math.max(...extents.map(({ box }) => box.bottom)),
    },
    bottom: Math.min(...extents.map(({ bottom }) => bottom)),
    top: Math.max(...extents.map(({ top }) => top)),
  };
}

/** Where a mesh reaches, at any time: its solid's circle, if it has one (the
 *  solid knows its reach over a swing); else, in a group that turns, the
 *  circle that its vertices sweep; else, its vertices. */
function meshExtent(
  mesh: Mesh,
  solid: Solid | undefined,
  tree: GroupTree,
  watchCentre: Point2,
): Extent {
  const { triangles } = mesh;
  const vertices: Vec3[] = [];
  for (let index = 0; index < triangles.length; index += 3) {
    vertices.push([
      at(triangles, index),
      at(triangles, index + 1),
      at(triangles, index + 2),
    ]);
  }
  const bottom = Math.min(...vertices.map(([, , z]) => z));
  const top = Math.max(...vertices.map(([, , z]) => z));
  const circle = (centre: Point2, reach: number): Extent => ({
    box: {
      left: centre[0] - reach,
      top: centre[1] - reach,
      right: centre[0] + reach,
      bottom: centre[1] + reach,
    },
    bottom,
    top,
  });
  if (solid) return circle(solid.pivot, solid.reach);
  const group = mesh.group ?? tree.groups.root;
  const origin = lookup(tree.origins, group, `origin of ${group.name}`);
  const centre: Point2 = [
    watchCentre[0] + origin[0],
    watchCentre[1] + origin[1],
  ];
  if (group !== tree.groups.root) {
    return circle(
      centre,
      Math.max(...vertices.map(([x, y]) => Math.hypot(x, y))),
    );
  }
  return {
    box: {
      left: centre[0] + Math.min(...vertices.map(([x]) => x)),
      top: centre[1] + Math.min(...vertices.map(([, y]) => y)),
      right: centre[0] + Math.max(...vertices.map(([x]) => x)),
      bottom: centre[1] + Math.max(...vertices.map(([, y]) => y)),
    },
    bottom,
    top,
  };
}

// ---- heights ---------------------------------------------------------------------------------
interface HeightParts {
  springSolid: Solid;
  staff: Solid;
  ringSolid: Solid;
  motion: MotionSolids;
  partsOf: {
    escape: Part;
    fourth: Part;
    centre: Part;
    balance: Part;
    spring: Part;
    roller: Part;
    jewel: Part;
    fork: Part;
    seconds: Part;
    ring: Part;
    hour: Part;
    minute: Part;
    pivot: Part;
  };
}

/** Where the train touches: a pinion is level with the wheel that drives it. */
const MESHING_OVERHANG = 0;

/** The heights of every solid: the 2D plan's rules (build_solids), then the
 *  cover's changes to them (movement). */
function assignHeights(
  solids: Solid[],
  found: HeightParts,
): Map<Solid, Heights> {
  const { partsOf } = found;
  const heights = new Map<Solid, Heights>();
  const heightOf = (which: Solid): Heights => {
    const known = heights.get(which);
    if (!known) throw new Error(`no heights yet for ${which.name}`);
    return known;
  };
  const bodyOf = new Map<Part, Solid>();
  const pinionOf = new Map<Part, Solid>();
  const placed: Solid[] = [];
  const isStaff = (which: Solid): boolean => which === found.staff;

  for (const each of solids) {
    if (isStaff(each)) continue;
    const owner = each.part;
    const own = owner.recipes[each.role];
    if (own === null || own.thickness === 0) continue;
    let bottom: number;
    let top: number;
    const meshed = trainHeights(
      owner,
      each.role,
      own,
      bodyOf,
      pinionOf,
      heightOf,
    );
    if (meshed) {
      [bottom, top] = meshed;
    } else if (own.stacking === "body") {
      const body = heightOf(bodyOf.get(owner) ?? failNoBody(owner));
      bottom = body.bottom;
      top = own.rise === 0 ? bottom + own.thickness : body.top + own.rise;
    } else {
      const candidates = placed.filter(
        (other) =>
          own.stacking === "everything" ||
          Math.hypot(
            each.pivot[0] - other.pivot[0],
            each.pivot[1] - other.pivot[1],
          ) <
            each.reach + other.reach,
      );
      bottom = Math.max(0, ...candidates.map((other) => heightOf(other).top));
      top = bottom + own.thickness;
    }
    heights.set(each, { bottom, top });
    placed.push(each);
    if (bodyOf.has(owner) && each.role === "other" && owner.driver !== null) {
      pinionOf.set(owner, each);
    }
    if (!bodyOf.has(owner)) bodyOf.set(owner, each);
  }
  placed.push(found.staff);

  // ---- movement(): the escapement, the hands and the chapter ring ----
  const ofPart = (owner: Part): Solid[] =>
    placed.filter((each) => each.part === owner);
  const teeth = at(ofPart(partsOf.escape), 0);
  const [forkBody, forkArbor] = ofPart(partsOf.fork) as [Solid, Solid];
  const forkBottom = heightOf(teeth).bottom + PALLET_STEP;
  const forkTop =
    forkBottom + (heightOf(forkBody).top - heightOf(forkBody).bottom);
  const arborHeight = heightOf(forkArbor).top - heightOf(forkArbor).bottom;
  const moves = new Map<Solid, Heights>();
  moves.set(forkBody, { bottom: forkBottom, top: forkTop });
  moves.set(forkArbor, { bottom: forkTop, top: forkTop + arborHeight });
  // Stack down from the fork, preserving train heights. The spring is
  // between the lower balance and the upper roller (task: raised-escapement).
  const thicknessOf = (each: Solid): number => {
    const own = heightOf(each);
    return own.top - own.bottom;
  };
  const roller = at(ofPart(partsOf.roller), 0);
  const rollerTop = forkBottom;
  const rollerBottom = rollerTop - thicknessOf(roller);
  moves.set(roller, { bottom: rollerBottom, top: rollerTop });
  for (const each of ofPart(partsOf.jewel)) {
    moves.set(each, { bottom: rollerTop, top: rollerTop + thicknessOf(each) });
  }
  const springTop = rollerBottom - OSCILLATOR_CLEARANCE;
  const springBottom = springTop - thicknessOf(found.springSolid);
  for (const each of ofPart(partsOf.spring)) {
    if (each === found.staff) continue;
    moves.set(each, { bottom: springBottom, top: springTop });
  }
  const balanceTop = springBottom - OSCILLATOR_CLEARANCE;
  for (const each of ofPart(partsOf.balance)) {
    moves.set(each, {
      bottom: balanceTop - thicknessOf(each),
      top: balanceTop,
    });
  }
  moves.set(found.staff, { bottom: balanceTop, top: rollerTop });
  const original = new Map(heights);
  for (const [each, moved] of moves) heights.set(each, moved);

  const dialSide = new Set([
    partsOf.seconds,
    partsOf.ring,
    partsOf.hour,
    partsOf.minute,
    partsOf.pivot,
  ]);
  const below = placed.filter((each) => !dialSide.has(each.part));

  // ---- the motion works, above the train and under the hands ----
  const { motion } = found;
  const motionSet = new Set<Solid>(Object.values(motion));
  const overlaps = (first: Solid, second: Solid): boolean =>
    Math.hypot(
      first.pivot[0] - second.pivot[0],
      first.pivot[1] - second.pivot[1],
    ) <
    first.reach + second.reach;
  // the centre arbor runs up through them: `raiseArbor` makes it longer
  const under = below.filter(
    (each) =>
      !motionSet.has(each) &&
      !(each.part === partsOf.centre && each.role === "circle") &&
      [motion.minuteBody, motion.hourBody].some((wheel) =>
        overlaps(wheel, each),
      ),
  );
  const motionBottom = Math.max(...under.map((each) => heightOf(each).top));
  const firstTop = motionBottom + thicknessOf(motion.minuteBody);
  const secondTop = firstTop + thicknessOf(motion.hourBody);
  const level = (each: Solid, bottom: number, top: number): void => {
    heights.set(each, { bottom, top });
  };
  // a pinion is level with the wheel that it drives
  level(motion.cannon, motionBottom, firstTop);
  level(motion.minuteBody, motionBottom, firstTop);
  level(motion.minuteHub, motionBottom, firstTop);
  level(motion.minutePinion, firstTop, secondTop);
  level(motion.minuteArbor, firstTop, secondTop + ARBOR_CAP);
  level(motion.hourBody, firstTop, secondTop);
  level(motion.hourPipe, firstTop, secondTop);

  const centreOf = (each: Solid): Point2 => each.pivot;
  const sweepsOver = (hand: Solid, other: Solid): boolean =>
    Math.hypot(
      centreOf(hand)[0] - centreOf(other)[0],
      centreOf(hand)[1] - centreOf(other)[1],
    ) <
    hand.reach + other.reach;
  const lowestClear = (hand: Solid, own: Part): number =>
    Math.max(
      ...below
        .filter((other) => other.part !== own && sweepsOver(hand, other))
        .map((other) => heightOf(other).top),
    );
  const stack = (handSolids: Solid[], from: number): number => {
    let bottom = from;
    for (const each of handSolids) {
      const original_ = original.get(each) ?? heightOf(each);
      const top = bottom + (original_.top - original_.bottom);
      heights.set(each, { bottom, top });
      bottom = top;
    }
    return bottom;
  };
  const raiseArbor = (wheelPart: Part, to: number): void => {
    const end = ofPart(wheelPart).reduce((best, each) =>
      (original.get(each) ?? heightOf(each)).top >
      (original.get(best) ?? heightOf(best)).top
        ? each
        : best,
    );
    const own = original.get(end) ?? heightOf(end);
    heights.set(end, { bottom: own.bottom, top: Math.max(own.top, to) });
  };

  const seconds = ofPart(partsOf.seconds);
  const secondsHand = at(seconds, 0);
  const secondsBottom = lowestClear(secondsHand, partsOf.fourth);
  const secondsTop = stack(seconds, secondsBottom);
  raiseArbor(partsOf.fourth, secondsBottom);
  const hour = ofPart(partsOf.hour);
  const hourHand = at(hour, 0);
  const hourBottom = Math.max(
    lowestClear(hourHand, partsOf.centre),
    sweepsOver(hourHand, secondsHand) ? secondsTop : 0,
  );
  const hourTop = stack(hour, hourBottom);
  raiseArbor(partsOf.centre, hourBottom);
  // the hour wheel's pipe carries the hour hand
  heights.set(motion.hourPipe, { bottom: firstTop, top: hourBottom });
  // The minute hand is longer than the hour hand: it may sweep over more.
  const minute = ofPart(partsOf.minute);
  const minuteHand = at(minute, 0);
  const minuteBottom = Math.max(
    hourTop,
    lowestClear(minuteHand, partsOf.centre),
    sweepsOver(minuteHand, secondsHand) ? secondsTop : 0,
  );
  const minuteTop = stack(minute, minuteBottom);
  stack(ofPart(partsOf.pivot), minuteTop);
  for (const each of ofPart(partsOf.ring)) {
    const own = original.get(each) ?? heightOf(each);
    const thickness = own.top - own.bottom;
    heights.set(each, { bottom: minuteBottom - thickness, top: minuteBottom });
  }
  return heights;
}

function failNoBody(owner: Part): never {
  throw new Error(`${owner.name} has no body yet`);
}

/** Bottom and top of a train solid under the meshing, or null if the stacking
 *  rules place it. A wheel's shapes come in the drawing's order: the wheel, its
 *  hub, its pinion, then its arbor's end. */
function trainHeights(
  owner: Part,
  role: Role,
  own: Recipe,
  bodyOf: Map<Part, Solid>,
  pinionOf: Map<Part, Solid>,
  heightOf: (which: Solid) => Heights,
): [number, number] | null {
  if (owner.wheel === null) return null;
  const body = bodyOf.get(owner);
  if (body === undefined) {
    // the first shape: on the wheel that this one's teeth drive
    const driven = owner.wheel.driven;
    const drivenBody = driven ? bodyByWheel(bodyOf, driven) : undefined;
    const base = drivenBody ? heightOf(drivenBody).top : 0;
    return [base, base + own.thickness];
  }
  const bodyHeights = heightOf(body);
  if (owner.driver === null) return null;
  if (role === "other") {
    return [
      bodyHeights.top,
      bodyHeights.top +
        (owner.driver.recipes.body?.thickness ?? 0) +
        MESHING_OVERHANG,
    ];
  }
  const pinion = pinionOf.get(owner);
  if (pinion === undefined) return [bodyHeights.bottom, bodyHeights.top]; // the hub
  return [bodyHeights.top, heightOf(pinion).top + ARBOR_CAP];
}

function bodyByWheel(
  bodyOf: Map<Part, Solid>,
  wheel: Wheel,
): Solid | undefined {
  for (const [owner, body] of bodyOf) {
    if (owner.wheel === wheel) return body;
  }
  return undefined;
}
