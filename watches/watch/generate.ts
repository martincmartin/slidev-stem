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
  polygon,
  radians,
  ring,
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
const STAFF_ABOVE_SPRING = 4;
/** The stud: a block around the spring's outer end. */
const STUD_REACH: [number, number] = [-2, 5];
const STUD_WIDTH = 5;
const STUD_OVERHANG = 1;
const CROWN_ZOOM = 2;
const HAIRSPRING_ZOOM = 250 / 56;
/** Where the balance's arbor is on the slide in the hairspring view. */
const HAIRSPRING_TARGET: Point2 = [705, 276];
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
  root: Group;
  /** Each wheel of the train, about its arbor. */
  wheels: Map<Wheel, Group>;
  /** The balance and the impulse jewel: they swing together. */
  balance: Group;
  /** Static: the balance's arbor, where the spring is. */
  springBase: Group;
  fork: Group;
  seconds: Group;
  hour: Group;
  minute: Group;
}

export interface Watch {
  design: Design;
  scene: Scene;
  groups: WatchGroups;
  /** The hairspring: its geometry changes with the balance's angle. */
  spring: Mesh;
  springShape: Spring;
  /** The spring's heights, for `ribbonGeometry`. */
  springHeights: Heights;
  /** The chapter ring's height, on which the decals lie. */
  ringTop: number;
}

// ---- the generator -------------------------------------------------------------------------
export function generate(design: Design = DESIGN): Watch {
  const { palette, watchCentre } = design;
  const knockout: Colour = { hex: palette.knockout, opacity: 1 };
  const inkFill: Colour = { hex: palette.line, opacity: 1 };
  const frameFill: Colour = { hex: palette.frame, opacity: 1 };
  const wash: Colour = { hex: palette.frame, opacity: WASH_OPACITY };
  const line = (width: number): LineStyle => ({
    colour: palette.line,
    opacity: 1,
    width,
  });
  const frameLine = (width: number): LineStyle => ({
    colour: palette.frame,
    opacity: 1,
    width,
  });

  const [barrel, centre, third, fourth, escape] = design.wheels as [
    Wheel,
    Wheel,
    Wheel,
    Wheel,
    Wheel,
  ];
  const trainWheels = [escape, fourth, third, centre, barrel];

  // ---- groups ----
  const root: Group = { name: "watch", parent: null };
  const origins = new Map<Group, Point2>([[root, [0, 0]]]);
  const groups: Group[] = [root];
  const groupAt = (
    name: string,
    arbor: Point2,
    parent: Group = root,
  ): Group => {
    const made: Group = { name, parent };
    origins.set(made, arbor);
    groups.push(made);
    return made;
  };
  const wheelGroups = new Map<Wheel, Group>(
    design.wheels.map((wheel) => [
      wheel,
      groupAt(`${wheel.name} wheel`, wheel.arbor),
    ]),
  );
  const balanceGroup = groupAt("balance", design.balance.arbor);
  const springBase = groupAt("spring base", design.balance.arbor);
  const forkGroup = groupAt("fork", design.fork.pivot);
  const secondsGroup = groupAt("seconds hand", fourth.arbor);
  const hourGroup = groupAt("hour hand", centre.arbor);
  const minuteGroup = groupAt("minute hand", centre.arbor);
  const groupOf = (wheel: Wheel): Group => {
    const found = wheelGroups.get(wheel);
    if (!found) throw new Error(`no group for the ${wheel.name} wheel`);
    return found;
  };

  // ---- parts ----
  const wheelParts = new Map<Wheel, Part>();
  for (const wheel of trainWheels) {
    wheelParts.set(
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
  const wheelPart = (wheel: Wheel): Part => {
    const found = wheelParts.get(wheel);
    if (!found) throw new Error(`no part for the ${wheel.name} wheel`);
    return found;
  };
  for (const wheel of trainWheels) {
    // the wheel whose teeth turn this wheel's pinion is the one that drives it
    const driver = trainWheels.find((other) => other.driven === wheel);
    wheelPart(wheel).driver = driver ? wheelPart(driver) : null;
  }
  const balancePart = part("balance", {
    body: recipe(5),
    circle: recipe(2),
    other: recipe(3, "body"),
  });
  const springPart = part("hairspring", {
    stroke: recipe(8, "touch", 0, true),
  });
  const jewelPart = part("impulse jewel", {
    body: recipe(3),
    circle: recipe(3),
    other: recipe(3),
  });
  const forkPart = part("pallet fork", {
    body: recipe(3),
    circle: recipe(1.5),
    other: recipe(3),
  });
  const secondsPart = part("seconds hand", {
    body: recipe(1.5),
    circle: recipe(1),
    other: recipe(1.5),
  });
  const ringPart = part("chapter ring", {
    body: recipe(3, "everything"),
    circle: recipe(3),
    other: recipe(3),
  });
  const hourPart = part("hour hand", {
    body: recipe(1.5, "everything"),
    circle: recipe(1),
    other: recipe(1.5),
  });
  const minutePart = part("minute hand", {
    body: recipe(1.5, "everything"),
    circle: recipe(1),
    other: recipe(1.5),
  });
  const pivotPart = part("centre pivot", {
    body: recipe(1, "everything"),
    circle: recipe(1),
    other: recipe(1),
  });
  const staffPart = springPart; // the balance staff belongs to the hairspring's part

  // ---- clip discs: a lower wheel is hidden inside the root circle of each
  // round part above it that overlaps it ----
  interface Round {
    wheel: Wheel | null;
    arbor: Point2;
    inner: number;
    outer: number;
  }
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

  // ---- the solids of the movement, in the drawing's order ----
  const solids: Solid[] = [];
  const countOf = new Map<Part, number>();
  const solid = (
    owner: Part,
    role: Role,
    group: Group,
    rings: Ring[],
    fill: Colour | null,
    extra: Partial<
      Pick<Solid, "pivot" | "reach" | "ribbon" | "inDrawing">
    > = {},
  ): Solid => {
    const origin = origins.get(group) ?? [0, 0];
    const pivot = extra.pivot ?? [
      watchCentre[0] + origin[0],
      watchCentre[1] + origin[1],
    ];
    const number = (countOf.get(owner) ?? 0) + 1;
    countOf.set(owner, number);
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
      discs: owner.wheel ? (discsOver.get(owner.wheel) ?? []) : [],
      inDrawing: extra.inDrawing ?? true,
    };
    solids.push(made);
    return made;
  };

  // The train, back to front: escape wheel, fourth, third, centre, barrel.
  interface Drawing {
    rim: number;
    hub: number;
    spokeWidth: number;
  }
  const drawings = new Map<Wheel, Drawing>([
    [escape, { rim: 5, hub: 8, spokeWidth: 5 }],
    [fourth, { rim: 5, hub: 8, spokeWidth: 6 }],
    [third, { rim: 6, hub: 12, spokeWidth: 6 }],
    [centre, { rim: 6, hub: 14, spokeWidth: 7 }],
  ]);
  for (const wheel of [escape, fourth, third, centre]) {
    const owner = wheelPart(wheel);
    const group = groupOf(wheel);
    const drawing = drawings.get(wheel);
    if (!drawing) throw new Error("no drawing for the wheel");
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
    solid(owner, "body", group, bodyRings, knockout);
    solid(
      owner,
      "circle",
      group,
      ringsOf([circlePath(0, 0, 4), line(2)]),
      knockout,
    );
    if (wheel.pinionRadius === null || wheel.pinionPhase === null) {
      throw new Error(`the ${wheel.name} wheel has no pinion`);
    }
    solid(
      owner,
      "other",
      group,
      ringsOf([
        pinionOutline(wheel.leaves, wheel.pinionRadius, wheel.pinionPhase),
        line(2),
      ]),
      knockout,
    );
    solid(
      owner,
      "circle",
      group,
      ringsOf([circlePath(0, 0, 3), line(2)]),
      knockout,
    );
  }
  // the barrel, in front: its lid is cut away to show the mainspring
  {
    const owner = wheelPart(barrel);
    const group = groupOf(barrel);
    const lid = barrel.pitchRadius - 12;
    solid(
      owner,
      "body",
      group,
      ringsOf(
        [gear(barrel.teeth, barrel.pitchRadius, barrel.toothPhase), line(2.5)],
        [disc(lid), line(2)],
      ),
      knockout,
    );
    solid(
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
    solid(owner, "circle", group, ringsOf([disc(15), line(3)]), knockout);
  }

  // the balance and its hairspring
  const { balance: balanceDesign, fork: forkDesign } = design;
  const radius = balanceDesign.radius;
  solid(
    balancePart,
    "body",
    balanceGroup,
    ringsOf([ring(radius, radius - 8), line(3)]),
    knockout,
  );
  for (let index = 0; index < 3; index++) {
    const armAngle = balanceDesign.pinDirection + 60 + 120 * index;
    const sine = Math.sin(radians(armAngle));
    const cosine = Math.cos(radians(armAngle));
    const corners = (
      [
        [9, 1],
        [radius - 8, 1],
        [radius - 8, -1],
        [9, -1],
      ] as const
    ).map(([along, side]): Point2 => [
      along * cosine + side * 3 * sine,
      along * sine - side * 3 * cosine,
    ]);
    solid(
      balancePart,
      "other",
      balanceGroup,
      ringsOf([polygon(corners), line(2)]),
      knockout,
    );
  }
  solid(
    balancePart,
    "circle",
    balanceGroup,
    ringsOf([disc(10), line(2)]),
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
  const springSolid = solid(
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

  // the impulse jewel, on the roller: it turns with the balance
  const jewelCentre = polar(
    balanceDesign.impulsePinRadius,
    balanceDesign.pinDirection,
  );
  solid(
    jewelPart,
    "body",
    balanceGroup,
    ringsOf([circlePath(jewelCentre[0], jewelCentre[1], 6), null]),
    inkFill,
  );

  // the pallet fork
  solid(
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
  solid(
    forkPart,
    "circle",
    forkGroup,
    ringsOf([circlePath(0, 0, 4), line(2)]),
    knockout,
  );

  // the seconds hand, on the fourth wheel's arbor
  solid(
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
  solid(
    secondsPart,
    "circle",
    secondsGroup,
    ringsOf([circlePath(0, 0, 2.5), null]),
    inkFill,
  );

  // the chapter ring: what is left of the dial
  const { caseRadius, bezelRadius, ringRadius } = design.case;
  const ringSolid = solid(
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
  solid(
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
  solid(
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
  solid(
    pivotPart,
    "body",
    root,
    ringsOf([circlePath(0, 0, 3.5), line(2)]),
    knockout,
  );

  // the balance staff, which the drawing lacks: it rises through the spring's
  // inner coil
  const staff = solid(
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

  // ---- heights ----
  const heights = assignHeights(solids, {
    springSolid,
    staff,
    ringSolid,
    partsOf: {
      escape: wheelPart(escape),
      fourth: wheelPart(fourth),
      centre: wheelPart(centre),
      balance: balancePart,
      spring: springPart,
      jewel: jewelPart,
      fork: forkPart,
      seconds: secondsPart,
      ring: ringPart,
      hour: hourPart,
      minute: minutePart,
      pivot: pivotPart,
    },
  });
  const heightOf = (which: Solid): Heights => {
    const found = heights.get(which);
    if (!found) throw new Error(`no heights for ${which.name}`);
    return found;
  };
  const ringTop = heightOf(ringSolid).top;

  // ---- the case, lugs, strap and crown ----
  const caseDepth = 2 * (CROWN_RADIUS + CROWN_CLEARANCE);
  const caseBottom = ringTop - caseDepth;
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
  // the outline's (u, v) to the slide's (y, z), the extrusion's w to x
  const crownPlacement = Float32Array.from([
    0,
    1,
    0,
    0,
    0,
    0,
    1,
    0,
    1,
    0,
    0,
    0,
    0,
    0,
    middle,
    1,
  ]);
  meshes.push(transformMesh(crownMesh, crownPlacement));

  // ---- the movement's meshes, and the stud ----
  const drawnOrder = solids.filter((each) => each !== staff);
  const movementMeshes = [...drawnOrder, staff].map((each) => {
    const { bottom, top } = heightOf(each);
    const info = {
      name: each.name,
      part: each.part.name,
      group: each.group,
      fill: each.fill,
      hiddenInside: each.discs,
      lineOrder: top,
      inDrawing: each.inDrawing,
      dynamic: each === springSolid,
    };
    return each.ribbon
      ? ribbon(at(each.rings, 0), bottom, top, info)
      : extrude(each.rings, bottom, top, info);
  });
  meshes.push(...movementMeshes);
  const springMesh = at(
    movementMeshes,
    [...drawnOrder, staff].indexOf(springSolid),
  );
  const springHeights = heightOf(springSolid);

  // the stud: a block around the spring's outer end, which is fixed
  const outerEnd = at(restSpring, restSpring.length - 1);
  const outward: Point2 = [
    outerEnd[0] / Math.hypot(...outerEnd),
    outerEnd[1] / Math.hypot(...outerEnd),
  ];
  const across: Point2 = [-outward[1], outward[0]];
  const half = STUD_WIDTH / 2;
  const [near, far] = STUD_REACH;
  const studPoints = (
    [
      [near, -half],
      [far, -half],
      [far, half],
      [near, half],
    ] as const
  ).map(([along, side]): Point2 => [
    balanceDesign.arbor[0] +
      outerEnd[0] +
      outward[0] * along +
      across[0] * side,
    balanceDesign.arbor[1] +
      outerEnd[1] +
      outward[1] * along +
      across[1] * side,
  ]);
  const studBottom = springHeights.bottom - STUD_OVERHANG;
  const studTop = springHeights.top + STUD_OVERHANG;
  const studMesh = extrude(
    [polygonRing(studPoints, line(2))],
    studBottom,
    studTop,
    {
      name: "hairspring stud (added)",
      part: "hairspring stud",
      group: root,
      fill: knockout,
      lineOrder: studTop,
      inDrawing: false,
    },
  );
  meshes.push(studMesh);

  // ---- decals: the minute ticks and the hour marks, on the chapter ring ----
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
  meshes.push(
    decal(minuteTicks, { colour: palette.detail, opacity: 0.5, width: 2 }),
    decal(hourMarks, line(4)),
  );

  // ---- views and subjects ----
  const heightsOfAll = [...heights.values()];
  const lowest = Math.min(
    caseBottom,
    ...heightsOfAll.map((each) => each.bottom),
  );
  const highest = Math.max(
    ringTop,
    studTop,
    ...heightsOfAll.map((each) => each.top),
  );
  const springMiddle =
    (Math.min(
      ...[...solids]
        .filter((each) => each.part === balancePart || each.part === springPart)
        .map((each) => heightOf(each).bottom),
    ) +
      Math.max(
        ...[...solids]
          .filter(
            (each) => each.part === balancePart || each.part === springPart,
          )
          .map((each) => heightOf(each).top),
      )) /
    2;
  const subject: Subject = {
    name: "hairspring and stud",
    meshes: new Set([springMesh, studMesh]),
  };
  const scene: Scene = {
    slide: [design.canvas.width, design.canvas.height],
    paper: palette.background,
    meshes,
    groups,
    views: views(
      design,
      (lowest + highest) / 2,
      springMiddle,
      middle,
      crownLeft + CROWN_LENGTH / 2,
    ),
    subjects: [subject],
  };

  return {
    design,
    scene,
    groups: {
      root,
      wheels: wheelGroups,
      balance: balanceGroup,
      springBase,
      fork: forkGroup,
      seconds: secondsGroup,
      hour: hourGroup,
      minute: minuteGroup,
    },
    spring: springMesh,
    springShape,
    springHeights,
    ringTop,
  };
}

function forkOutlineLocal(outline: Point2[], heading: number): Point2[] {
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
  // the balance staff rises through the spring's inner coil
  const hub = placed
    .filter((each) => each.part === partsOf.balance)
    .reduce((best, each) =>
      heightOf(each).top > heightOf(best).top ? each : best,
    );
  heights.set(found.staff, {
    bottom: heightOf(hub).top,
    top: heightOf(found.springSolid).top + STAFF_ABOVE_SPRING,
  });
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
  for (const each of ofPart(partsOf.jewel)) {
    moves.set(each, { ...heightOf(teeth) });
  }
  const lift =
    forkTop -
    Math.min(...ofPart(partsOf.balance).map((each) => heightOf(each).bottom));
  for (const each of [...ofPart(partsOf.balance), ...ofPart(partsOf.spring)]) {
    const own = heightOf(each);
    moves.set(each, { bottom: own.bottom + lift, top: own.top + lift });
  }
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
