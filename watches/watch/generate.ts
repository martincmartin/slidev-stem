// The design becomes a scene: the parts as meshes, with heights where they
// touch, the 2D art's line styles, the clip discs, the views and the subjects.
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
import type { Ring } from "../webgl/mesh.ts";
import type {
  Colour,
  Disc,
  Group,
  LineStyle,
  Mesh,
  Scene,
  Subject,
  View,
} from "../webgl/scene.ts";
import { INKS } from "../webgl/scene.ts";
import { at } from "../webgl/checked.ts";
import type { Design, Wheel } from "./design.ts";
import { DESIGN } from "./design.ts";
import { springPoints, SPRING_RADII, SPRING_TURNS } from "./model.ts";
import type { Spring } from "./model.ts";
import { Path, circlePath } from "./path.ts";
import type { Contour } from "./path.ts";
import {
  clock,
  dagger,
  disc,
  escapeOutline,
  gear,
  openings,
  pinionOutline,
  polar,
  radians,
  spiralCurve,
} from "./shapes.ts";

// ---- what the art says (the 2D drawing's numbers) ------------------------------------
/** Heights of the train's meshing: a pinion is level with the wheel that
 *  drives it, and an arbor's end rises this far above its pinion. */
const ARBOR_CAP = 3;
const WASH_OPACITY = 0.18;
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
/** Clearance between moving oscillator layers and beneath the balance. */
const OSCILLATOR_CLEARANCE = 2;
const ROLLER_THICKNESS = 2;
const JEWEL_RADIUS = 6;
/** The stud: a block around the spring's outer end. */
const STUD_REACH: [number, number] = [-2, 5];
const STUD_WIDTH = 5;
const STUD_OVERHANG = 1;
const CROWN_ZOOM = 2;
const HAIRSPRING_ZOOM = 250 / 56;
/** Where the balance's arbor is on the slide in the hairspring view. */
const HAIRSPRING_TARGET: Point2 = [275, 276];
const SPRING_FRAMES = 25;

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

interface Heights {
  bottom: number;
  top: number;
}

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
  /** The balance and the impulse jewel: they swing together. */
  readonly balance: Group;
  /** Static: the balance's arbor, where the spring is. */
  readonly springBase: Group;
  readonly fork: Group;
  readonly seconds: Group;
  readonly hour: Group;
  readonly minute: Group;
}

export interface Watch {
  readonly design: Design;
  readonly scene: Scene;
  readonly groups: WatchGroups;
  /** The hairspring: its geometry changes with the balance's angle. */
  readonly spring: Mesh;
  readonly springShape: Spring;
  /** The spring's heights, for `ribbonGeometry`. */
  readonly springHeights: Heights;
  /** The chapter ring's height, on which the decals lie. */
  readonly ringTop: number;
}

// ---- paint ------------------------------------------------------------------------------
/** The inks as the fills and line styles that the shapes use. */
interface Paint {
  knockout: Colour;
  ink: Colour;
  frame: Colour;
  wash: Colour;
  /** An ink line. */
  line: (width: number) => LineStyle;
  /** A line in the frame's colour. */
  frameLine: (width: number) => LineStyle;
}

function paintOf(): Paint {
  return {
    knockout: { ink: INKS.knockout, opacity: 1 },
    ink: { ink: INKS.line, opacity: 1 },
    frame: { ink: INKS.frame, opacity: 1 },
    wash: { ink: INKS.frame, opacity: WASH_OPACITY },
    line: (width) => ({ ink: INKS.line, opacity: 1, width }),
    frameLine: (width) => ({ ink: INKS.frame, opacity: 1, width }),
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

// ---- groups ----------------------------------------------------------------------------
interface GroupTree {
  groups: WatchGroups;
  /** Every group, the root first. */
  all: Group[];
  /** Where each group's origin is, in the frame of the watch centre. */
  origins: Map<Group, Point2>;
}

function makeGroups(design: Design): GroupTree {
  const { centre, fourth } = trainOf(design);
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
      balance: groupAt("balance", design.balance.arbor),
      springBase: groupAt("spring base", design.balance.arbor),
      fork: groupAt("fork", design.fork.pivot),
      seconds: groupAt("seconds hand", fourth.arbor),
      hour: groupAt("hour hand", centre.arbor),
      minute: groupAt("minute hand", centre.arbor),
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
  };
}

// ---- clip discs ------------------------------------------------------------------------
/** A lower wheel is hidden inside the root circle of each round part above it
 *  that overlaps it. */
function clipDiscs(design: Design): Map<Wheel, Disc[]> {
  interface Round {
    wheel: Wheel | null;
    arbor: Point2;
    inner: number;
    outer: number;
  }
  const { watchCentre } = design;
  const rounds: Round[] = design.stack.map((entry) =>
    entry === "balance"
      ? {
          wheel: null,
          arbor: design.balance.arbor,
          inner: design.balance.radius,
          outer: design.balance.radius,
        }
      : {
          wheel: entry,
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
        })),
    );
  }
  return discsOver;
}

// ---- meshes ----------------------------------------------------------------------------
/** The mesh of each solid, in the drawing's order. */
function solidMeshes(
  solids: Solid[],
  heights: Map<Solid, Heights>,
  dynamic: Solid,
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
        dynamic: each === dynamic,
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
): CaseMeshes {
  const { wash, frameLine } = paint;
  const { caseRadius, bezelRadius } = design.case;
  const caseDepth = 2 * (CROWN_RADIUS + CROWN_CLEARANCE);
  const caseBottom = Math.min(
    ringTop - caseDepth,
    movementBottom - OSCILLATOR_CLEARANCE,
  );
  const middle = (caseBottom + ringTop) / 2;
  const meshes: Mesh[] = [];
  meshes.push(
    extrude(
      ringsOf(
        [circlePath(0, 0, caseRadius), frameLine(4)],
        [circlePath(0, 0, bezelRadius), frameLine(3)],
      ),
      caseBottom,
      ringTop,
      {
        name: "case band",
        part: "case band",
        group: root,
        fill: wash,
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
    meshes.push(
      extrude(
        ringsOf([strapPath, frameLine(3)]),
        middle - STRAP_THICKNESS / 2,
        middle + STRAP_THICKNESS / 2,
        {
          name: `strap ${String(level)}`,
          part: "strap",
          group: root,
          fill: wash,
          lineOrder: middle + STRAP_THICKNESS / 2,
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
      meshes.push(
        extrude(ringsOf([lug, frameLine(3)]), caseBottom, ringTop, {
          name: `lug ${String(level)}`,
          part: "lug",
          group: root,
          fill: wash,
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
    ringsOf([circlePath(0, 0, CROWN_RADIUS), frameLine(3)]),
    crownLeft,
    crownLeft + CROWN_LENGTH,
    {
      name: "crown",
      part: "crown",
      group: root,
      fill: wash,
      lineOrder: middle + CROWN_RADIUS,
    },
  );
  meshes.push(transformMesh(crownMesh, crownPlacement(middle)));
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

/** The stud: a block around the spring's outer end, which is fixed. */
function studMesh(
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
      name: "hairspring stud (added)",
      part: "hairspring stud",
      group: root,
      fill: paint.knockout,
      lineOrder: top,
      inDrawing: false,
    }),
    top,
  };
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
    decal(minuteTicks, { ink: INKS.detail, opacity: 0.5, width: 2 }),
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
    owner: Part,
    role: Role,
    group: Group,
    rings: Ring[],
    fill: Colour | null,
    extra: Partial<
      Pick<Solid, "pivot" | "reach" | "ribbon" | "inDrawing">
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
      discs: owner.wheel ? (this.discsOver.get(owner.wheel) ?? []) : [],
      inDrawing: extra.inDrawing ?? true,
    };
    this.solids.push(made);
    return made;
  }
}

/** The train's wheels but the barrel, back to front: escape wheel, fourth,
 *  third, centre. */
function trainSolids(kit: Kit): void {
  const { design, paint, train, parts, groups, solids } = kit;
  const { knockout, line } = paint;
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
        : gear(wheel.teeth, wheel.pitchRadius, wheel.toothPhase, {
            addendum: wheel.depth,
            dedendum: wheel.depth,
          });
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
    const fine = wheel.pitch < 9; // fine teeth take the thinner line
    const bodyRings = ringsOf(
      [outline, line(fine ? 2 : 2.5)],
      ...(gaps ? ([[gaps, line(2)]] as [Path, LineStyle][]) : []),
    );
    solids.add(owner, "body", group, bodyRings, knockout);
    solids.add(
      owner,
      "circle",
      group,
      ringsOf([circlePath(0, 0, 4), line(2)]),
      knockout,
    );
    if (wheel.pinionRadius === null || wheel.pinionPhase === null) {
      throw new Error(`the ${wheel.name} wheel has no pinion`);
    }
    solids.add(
      owner,
      "other",
      group,
      ringsOf([
        pinionOutline(wheel.leaves, wheel.pinionRadius, wheel.pinionPhase),
        line(2),
      ]),
      knockout,
    );
    solids.add(
      owner,
      "circle",
      group,
      ringsOf([circlePath(0, 0, 3), line(2)]),
      knockout,
    );
  }
}

/** The barrel, in front: its lid is cut away to show the mainspring. */
function barrelSolids(kit: Kit): void {
  const { paint, train, parts, groups, solids } = kit;
  const { knockout, line } = paint;
  const { barrel } = train;
  const owner = lookup(parts.wheels, barrel, "barrel part");
  const group = lookup(groups.wheels, barrel, "barrel group");
  const lid = barrel.pitchRadius - 12;
  solids.add(
    owner,
    "body",
    group,
    ringsOf(
      [gear(barrel.teeth, barrel.pitchRadius, barrel.toothPhase), line(2.5)],
      [disc(lid), line(2)],
    ),
    knockout,
  );
  solids.add(
    owner,
    "stroke",
    group,
    ringsOf([
      spiralCurve(19, barrel.pitchRadius - 16, 300, 300 + 360 * 3.5, 14),
      line(2),
    ]),
    knockout,
    { ribbon: true },
  );
  solids.add(owner, "circle", group, ringsOf([disc(15), line(3)]), knockout);
}

interface BalanceSolids {
  /** The wheel's rim, arms, and hub as one solid. */
  wheel: Solid;
  /** The hairspring's coil. */
  spring: Solid;
  collet: Solid;
  /** The coil's points at rest. */
  restSpring: Point2[];
  springShape: Spring;
}

/** The balance, its hairspring and collet, and the impulse jewel. */
function balanceSolids(kit: Kit): BalanceSolids {
  const { design, paint, parts, groups, solids } = kit;
  const { knockout, ink: inkFill, line } = paint;
  const { balance: balancePart, spring: springPart, jewel: jewelPart } = parts;
  const { balance: balanceGroup, springBase } = groups;
  const balanceDesign = design.balance;
  const radius = balanceDesign.radius;
  // The rim, arms, and hub are one piece, with no lines at their joins.
  // The radial screws show that the rim turns with the arms.
  const wheel = solids.add(
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
    knockout,
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
    springPart,
    "stroke",
    springBase,
    [smoothRing(restSpring, line(2), false)],
    knockout,
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
  const collet = solids.add(
    springPart,
    "circle",
    balanceGroup,
    ringsOf([disc(at(SPRING_RADII, 0)), line(2)]),
    knockout,
    { inDrawing: false },
  );

  // The roller and jewel turn with the balance. The roller supports the
  // jewel's full footprint and joins it to the staff above the hairspring.
  solids.add(
    parts.roller,
    "body",
    balanceGroup,
    ringsOf([disc(balanceDesign.impulsePinRadius + JEWEL_RADIUS), line(2.5)]),
    knockout,
  );

  // the impulse jewel, on the roller: it turns with the balance
  const jewelCentre = polar(
    balanceDesign.impulsePinRadius,
    balanceDesign.pinDirection,
  );
  solids.add(
    jewelPart,
    "body",
    balanceGroup,
    ringsOf([circlePath(jewelCentre[0], jewelCentre[1], JEWEL_RADIUS), null]),
    inkFill,
  );
  return { wheel, spring: springSolid, collet, restSpring, springShape };
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
      fill: paint.knockout,
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
  const { knockout, line } = paint;
  const { fork: forkPart } = parts;
  const { fork: forkGroup } = groups;
  const forkDesign = design.fork;
  solids.add(
    forkPart,
    "body",
    forkGroup,
    [
      polygonRing(
        forkOutlineLocal(forkDesign.outline, forkDesign.heading),
        line(2.5),
      ),
    ],
    knockout,
  );
  solids.add(
    forkPart,
    "circle",
    forkGroup,
    ringsOf([circlePath(0, 0, 4), line(2)]),
    knockout,
  );
}

/** The seconds hand, the chapter ring, the hands (at 2:35) and their pivot.
 *  Returns the chapter ring. */
function dialSolids(kit: Kit): Solid {
  const { design, paint, parts, groups, solids } = kit;
  const { knockout, ink: inkFill, frame: frameFill, frameLine, line } = paint;
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
  solids.add(
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
    frameFill,
  );
  solids.add(
    secondsPart,
    "circle",
    secondsGroup,
    ringsOf([circlePath(0, 0, 2.5), null]),
    inkFill,
  );

  // the chapter ring: what is left of the dial
  const { bezelRadius, ringRadius } = design.case;
  const ringSolid = solids.add(
    ringPart,
    "body",
    root,
    ringsOf(
      [circlePath(0, 0, bezelRadius), frameLine(3)],
      [circlePath(0, 0, ringRadius), frameLine(2)],
    ),
    knockout,
  );

  // the hands, at 2:35
  const hourTurn = (design.hands.hour + design.hands.minute / 60) * 30;
  solids.add(
    hourPart,
    "body",
    hourGroup,
    ringsOf([
      turned(
        dagger({
          length: 140,
          maxWidth: 17,
          widestAt: 0.62,
          tail: 10,
          tailWidth: 3,
          neck: 26,
        }),
        hourTurn,
      ),
      line(3),
    ]),
    frameFill,
  );
  solids.add(
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
    frameFill,
  );
  solids.add(
    pivotPart,
    "body",
    root,
    ringsOf([circlePath(0, 0, 3.5), line(2)]),
    knockout,
  );
  return ringSolid;
}

/** The balance staff, which the drawing lacks: it rises through the spring's
 *  inner coil. It must come last: the heights place it after the others. */
function staffSolid(kit: Kit): Solid {
  const { design, paint, parts, groups, solids } = kit;
  const { knockout, line } = paint;
  const { watchCentre } = design;
  const balanceDesign = design.balance;
  const staffPart = parts.spring; // the balance staff belongs to the hairspring's part
  const { root } = groups;
  return solids.add(
    staffPart,
    "body",
    root,
    ringsOf([
      circlePath(balanceDesign.arbor[0], balanceDesign.arbor[1], STAFF_RADIUS),
      line(2),
    ]),
    knockout,
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
  const tree = makeGroups(design);
  const { root } = tree.groups;
  const parts = makeParts(train);
  const partOf = (wheel: Wheel): Part =>
    lookup(parts.wheels, wheel, `part for the ${wheel.name} wheel`);

  // ---- the solids of the movement, in the drawing's order ----
  const list = new SolidList(tree.origins, watchCentre, clipDiscs(design));
  const kit: Kit = {
    design,
    paint,
    train,
    parts,
    groups: tree.groups,
    solids: list,
  };
  trainSolids(kit);
  barrelSolids(kit);
  const {
    wheel: balanceSolid,
    spring: springSolid,
    collet,
    restSpring,
    springShape,
  } = balanceSolids(kit);
  forkSolids(kit);
  const ringSolid = dialSolids(kit);
  const staff = staffSolid(kit);
  const solids = list.solids;

  // ---- heights ----
  const heights = assignHeights(solids, {
    springSolid,
    staff,
    ringSolid,
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
  );
  const meshes: Mesh[] = [...caseMeshes];

  // ---- the movement's meshes ----
  const movementMeshes = solidMeshes(solids, heights, springSolid);
  meshes.push(...movementMeshes.values());
  const balanceScrews = balanceScrewMeshes(
    design.balance,
    heightOf(balanceSolid),
    tree.groups.balance,
    paint,
    BALANCE_SCREWS,
  );
  meshes.push(...balanceScrews);
  const springMesh = lookup(movementMeshes, springSolid, "spring mesh");
  const springHeights = heightOf(springSolid);
  const colletMesh = lookup(movementMeshes, collet, "collet mesh");

  const stud = studMesh(
    restSpring,
    design.balance.arbor,
    springHeights,
    paint,
    root,
  );
  meshes.push(stud.mesh);

  meshes.push(...decalMeshes(paint, root, ringTop));

  // ---- views and subjects ----
  const allHeights = heightRange(heights.values());
  const lowest = Math.min(caseBottom, allHeights.bottom);
  const highest = Math.max(ringTop, stud.top, allHeights.top);
  const subject: Subject = {
    name: "hairspring and stud",
    meshes: new Set([springMesh, colletMesh, stud.mesh]),
  };
  // the oscillator: what slide 2 flashes. Not the pallet fork.
  const oscillatorParts = new Set([
    parts.balance,
    parts.spring,
    parts.roller,
    parts.jewel,
  ]);
  const oscillator: Subject = {
    name: "balance and hairspring",
    meshes: new Set([
      ...[...movementMeshes]
        .filter(([solid]) => oscillatorParts.has(solid.part))
        .map(([, mesh]) => mesh),
      stud.mesh,
      ...balanceScrews,
    ]),
  };
  // the balance wheel with the hairspring and the balance staff (the staff is
  // part of the spring's `Part`), without the roller and the jewel: what slide
  // 3 shows. It holds `subject`, so the balance fades in alone.
  const wheelParts = new Set([parts.balance, parts.spring]);
  const wheel: Subject = {
    name: "balance wheel and hairspring",
    meshes: new Set([
      ...[...movementMeshes]
        .filter(([solid]) => wheelParts.has(solid.part))
        .map(([, mesh]) => mesh),
      stud.mesh,
      ...balanceScrews,
    ]),
  };
  // what slide 3 adds to slide 2's picture: the balance wheel, its screws and
  // the staff. Slide 3 flashes it when it has faded in.
  const wheelAdded: Subject = {
    name: "balance wheel",
    meshes: new Set(
      [...wheel.meshes].filter((mesh) => !subject.meshes.has(mesh)),
    ),
  };
  const scene: Scene = {
    slide: [design.canvas.width, design.canvas.height],
    meshes,
    groups: tree.all,
    views: views(
      design,
      (lowest + highest) / 2,
      (springHeights.bottom + springHeights.top) / 2,
      middle,
      crownCentreX,
    ),
    subjects: [subject, oscillator, wheel, wheelAdded],
  };

  return {
    design,
    scene,
    groups: tree.groups,
    spring: springMesh,
    springShape,
    springHeights,
    ringTop,
  };
}

function forkOutlineLocal(
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

// ---- heights ---------------------------------------------------------------------------------
interface HeightParts {
  springSolid: Solid;
  staff: Solid;
  ringSolid: Solid;
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
  return [heightOf(pinion).top, heightOf(pinion).top + ARBOR_CAP];
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
