// The marks of Part 2's three stories, on their story maps (docs/globe.md,
// "The marks"): where each place is, the voyage's legs, and the marks that
// a click can show. A slide names them in its frontmatter (`globeVoyage`,
// `globeMarks`); this file says where they are. Places come from the
// sources, in degrees, and the map projects them; a few are slide px off a
// place, so that a ship does not hide what it is near. The facts are from
// Richard Walter's account of Anson's voyage and the sources of the visual
// language task (`tasks/2026-10-30-part-2-visual-language/PLAN.md`, "The
// facts"). No DOM: the tests run it in Node.

import type { LonLat } from "./earth.ts";
import { CAPE_NOIR, JUAN_FERNANDEZ, SCILLY, project } from "./maps.ts";
import type { PlacedMap, StoryMap } from "./maps.ts";

export type Point = readonly [number, number];

/** A leg of a voyage: the ship sails its route, which draws itself as a
 *  track, over `seconds`, with a dot at the end of each of its `days` (none
 *  for 0). A route of one point is a place where the ship shows, with no
 *  track. */
export interface Leg {
  readonly name: string;
  readonly route: readonly Point[];
  readonly days: number;
  readonly seconds: number;
  /** Which way the ship faces: a side view cannot face north, so it faces
   *  east as it sails north. */
  readonly heading: "east" | "west";
}

/** A mark that shows, or does not: it fades in and out. Each part is an SVG
 *  path with a class of StoryMaps.vue's styles. */
export interface Mark {
  readonly name: string;
  readonly parts: readonly { readonly kind: string; readonly d: string }[];
  /** The ship's outline, dashed, at a point: where a ship thought it was. */
  readonly ghost?: Point;
  /** Text on the mark, at a point (its baseline's left end), with a class
   *  of StoryMaps.vue's styles: a scale's length, or what a count counts. */
  readonly label?: {
    readonly kind: string;
    readonly text: string;
    readonly at: Point;
  };
  /** A number under the label: `perDay` times the days at sea that the
   *  voyage shows (`VoyageFrame.days`), at a point (its baseline's left
   *  end). */
  readonly count?: { readonly perDay: number; readonly at: Point };
}

/** A story: its map, its voyage's legs, and its other marks. */
export interface Story {
  readonly placed: PlacedMap;
  readonly legs: readonly Leg[];
  readonly marks: readonly Mark[];
}

/** Seconds of the voyage for each day at sea. */
export const DAY_SECONDS = 0.7;

const STATUTE_MILES_PER_NAUTICAL = 1.15078;

/** The place a run of nautical miles from a place, on a bearing in degrees
 *  east of north, on a flat chart: near enough over a few dozen miles. */
function sail([lon, lat]: LonLat, bearing: number, miles: number): LonLat {
  const radians = (bearing * Math.PI) / 180;
  const to = lat + (miles * Math.cos(radians)) / 60;
  const shorten = Math.cos((to * Math.PI) / 180);
  return [lon + (miles * Math.sin(radians)) / 60 / shorten, to];
}

const number = (value: number): string => String(Math.round(value * 10) / 10);

// ---------------------------------------------------------------- the ship

/** The ship, loosely HMS Centurion (1732), a 60-gun ship: three masts,
 *  square sails on the fore and main masts and a sail aft of the mizzen, a
 *  high stern, and the stripe of a gun deck. The bow is to the right, and
 *  (0, 0) is on the waterline. Its hull is 54 px long; it is drawn at
 *  SHIP_SCALE. The pennant streams east, with the wind, whichever way the
 *  ship faces. */
export const SHIP_PARTS: readonly {
  readonly kind: string;
  readonly d: string;
}[] = [
  { kind: "ship-line", d: "M-16,-12V-36M0,-8V-50M13,-8V-42M24,-11L37,-18" },
  { kind: "ship-sail", d: "M-16,-34L-16,-14L-28,-14Z" },
  { kind: "ship-sail", d: "M-11,-27L11,-27L12,-14L-12,-14Z" },
  { kind: "ship-sail", d: "M-9,-42L9,-42L10,-30L-10,-30Z" },
  { kind: "ship-sail", d: "M4,-24L22,-24L23,-12L3,-12Z" },
  { kind: "ship-sail", d: "M6,-37L20,-37L21,-27L5,-27Z" },
  {
    kind: "ship-hull",
    d: "M-28,-13L-23,-13L-21,-8L18,-8L26,-12Q24,-1 15,4L-20,4Q-27,1 -28,-13Z",
  },
  { kind: "ship-wale", d: "M-21,-3H17" },
];
export const SHIP_FLAG = "M0,-50L13,-47L0,-44Z";
export const SHIP_SCALE = 0.8;
/** Slide px from the ship's middle to its bow. */
const BOW = 21;

/** A mark of where a ship thought it was: the ship's outline at `at`,
 *  dashed. */
function ghost(name: string, at: Point): Mark {
  return { name, parts: [], ghost: at };
}

// ------------------------------------------------------------ other marks

/** A dashed parallel, from the slide's left edge to `end`. */
function parallel(name: string, y: number, end: number): Mark {
  return {
    name,
    parts: [{ kind: "latitude", d: `M0,${number(y)}H${number(end)}` }],
  };
}

/** A bracket that measures a gap: a line, with a tick across each end. */
function bracket(name: string, [from, to]: readonly [Point, Point]): Mark {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const [x, y] = [
    (-(to[1] - from[1]) / length) * 8,
    ((to[0] - from[0]) / length) * 8,
  ];
  const tick = ([px, py]: Point): string =>
    `M${number(px - x)},${number(py - y)}L${number(px + x)},${number(py + y)}`;
  return {
    name,
    parts: [
      {
        kind: "gap",
        d: `${tick(from)}M${number(from[0])},${number(from[1])}L${number(to[0])},${number(to[1])}${tick(to)}`,
      },
    ],
  };
}

/** A scale of statute miles, at the bottom left of a story map. A nautical
 *  mile is a minute of latitude, and a story map's scale is the same in
 *  every direction at its centre. */
function scale(map: StoryMap, miles: number): Mark {
  const length = (miles / STATUTE_MILES_PER_NAUTICAL / 60) * map.pxPerDegree;
  return {
    name: "scale",
    parts: [{ kind: "scale", d: `M36,512v8h${number(length)}v-8` }],
    label: {
      kind: "scale-label",
      text: `${String(miles)} miles`,
      at: [36, 504],
    },
  };
}

/** A gust at (x, y): a line 140 px from west to east that curls at its east
 *  end, up or down, about three quarters of a turn. */
function gust([x, y]: Point, up: boolean): string {
  const [length, curl] = [140, 14];
  const end = x + length;
  const side = up ? -1 : 1;
  const sweep = up ? 0 : 1;
  const centre = y + side * curl;
  const arc = `A${String(curl)},${String(curl)} 0 0 ${String(sweep)}`;
  return `M${number(x)},${number(y)}H${number(end)}${arc} ${number(end)},${number(y + side * 2 * curl)}${arc} ${number(end - 0.94 * curl)},${number(centre - side * 0.34 * curl)}`;
}

/** The wind: gusts that take turns, each drawing itself from west to east,
 *  over the sea (StoryMaps.vue masks it to the sea). */
function wind(gusts: readonly (readonly [number, number, boolean])[]): Mark {
  return {
    name: "wind",
    parts: gusts.map(([x, y, up]) => ({ kind: "gust", d: gust([x, y], up) })),
  };
}

// ---------------------------------------------------------- the stories

/** Cape Noir, April 14, 1741, between 1 and 2 a.m.: land "right ahead",
 *  "but two miles distant", as the squadron stood north. Isla Noir is "that
 *  point called by [Frezier] Cape Noir"; they thought they were "upwards of
 *  ten degrees more westerly than this land", on the same parallel: 10° at
 *  54.5° S is 646 km, 401 miles. */
function capeNoir(placed: PlacedMap): Story {
  const { map } = placed;
  const cape = project(map, [-73.03, -54.47]);
  // south of the island, with sea between
  const ship: Point = [cape[0] - 6, cape[1] + 46];
  const shorten = Math.cos((map.centre[1] * Math.PI) / 180);
  const thought: Point = [ship[0] - 10 * map.pxPerDegree * shorten, ship[1]];
  // below where the track starts, so that the two do not join into one line
  const below = ship[1] + 90;
  return {
    placed,
    legs: [
      { name: "cliffs", route: [ship], days: 0, seconds: 0, heading: "east" },
    ],
    marks: [
      ghost("estimated", thought),
      parallel("parallel", ship[1], 980),
      bracket("gap", [
        [thought[0], below],
        [ship[0], below],
      ]),
      scale(map, 100),
    ],
  };
}

/** The search for Juan Fernández, May 28 to June 9, 1741. On May 28 the
 *  ship was in the islands' latitude, a few hours east of them; it sailed
 *  east for 2 days, to Chile, 12 or 13 leagues off (May 30); then west for
 *  9 days, and at daybreak on June 9 "we first descried the island of Juan
 *  Fernandes, bearing N. by E.½E., at eleven or twelve leagues distance"
 *  (Walter, Book II, chapter I). A league is 3 nautical miles, and N. by
 *  E.½E. is 16.875° east of north. It then sailed "all that day, and the
 *  next night" to anchor on the island's north side. */
function juanFernandez(
  placed: PlacedMap,
  slide: readonly [number, number],
): Story {
  const { map } = placed;
  const island: LonLat = [-78.83, -33.64];
  const start = project(map, [-78.35, island[1]]);
  const turn = project(map, [-72.4, island[1]]);
  const coast = project(map, [-71.62, island[1]]);
  // below the slide, where the track comes from; the ship as the slide
  // opens, at its bottom, on the way north
  const entry: Point = [start[0], slide[1] + 60];
  const south: Point = [start[0], slide[1] - 24];
  const found = project(map, sail(island, 16.875 + 180, 11.5 * 3));
  // drawn north-west of the island, with sea between: a ship drawn at the
  // anchorage would hide the island
  const [islandX, islandY] = project(map, island);
  const anchorage: Point = [islandX - 46, islandY - 16];
  // the west leg runs due west, on the parallel of the sighting: south of
  // the east leg, so that both show. The ship jumps there from the turn,
  // with no track: the drop is the drawing's, not a course sailed
  const leg = (
    name: string,
    route: readonly Point[],
    days: number,
    seconds: number,
    heading: "east" | "west",
  ): Leg => ({ name, route, days, seconds, heading });
  return {
    placed,
    legs: [
      leg("south", [entry, south], 0, 0, "east"),
      leg("start", [south, start], 0, 2, "east"),
      leg("east", [start, turn], 2, 2 * DAY_SECONDS, "east"),
      leg("west", [[turn[0], found[1]], found], 9, 9 * DAY_SECONDS, "west"),
      leg("found", [found, anchorage], 1, 0.8, "west"),
    ],
    marks: [
      parallel("parallel", start[1], coast[0] - 4),
      scale(map, 100),
      // gusts near the voyage, about 45 px from its labels; one left of "2
      // days east", and one that blows into the ship's bow at the end of "9
      // days back", level with the middle of its sails
      wind([
        [250, 206, true],
        [480, 206, true],
        [250, 268, true],
        [20, 320, false],
        [60, 434, false],
        [360, 434, false],
        [200, 500, false],
        [470, 500, false],
      ]),
      // the deaths at Walter's "six in a day", the top of his "four, five,
      // and six": 12 days to the anchorage make 72, within his 70-80 (the
      // visual language task, section 16). The numbers in between are not
      // his. On the land at the right, from the east leg on
      {
        name: "count",
        parts: [],
        label: { kind: "count-label", text: "Scurvy deaths:", at: [712, 147] },
        count: { perDay: 6, at: [712, 189] },
      },
      // the islands show when the ship sights them
      {
        name: "islands",
        parts: [{ kind: "story-land", d: placed.land.islands }],
      },
    ],
  };
}

/** The Isles of Scilly, October 22, 1707. HMS Orford's reckoning when the
 *  fleet hove to at 4 p.m., from Lieutenant Lochard's log: about 49°40' N,
 *  7°20' W. At about 6 p.m. the fleet sailed on east by north, and the
 *  Association struck the Outer Gilstone, among the Western Rocks, at about
 *  8 p.m.: two hours at an assumed 6 knots. The ship and the reckoning run
 *  the same course and distance, so the gap between them stays the same. */
function scilly(placed: PlacedMap): Story {
  const { map } = placed;
  const gilstone: LonLat = [-6.3972, 49.8656];
  const run = { bearing: 78.75, miles: 12 };
  const rock = project(map, gilstone);
  const from = project(map, sail(gilstone, run.bearing + 180, run.miles));
  const along: Point = [rock[0] - from[0], rock[1] - from[1]];
  const length = Math.hypot(...along);
  // the ship on the rocks, with its bow at the rock
  const wreck: Point = [
    rock[0] - (BOW * along[0]) / length,
    rock[1] - (BOW * along[1]) / length,
  ];
  const sailed: Point = [wreck[0] - along[0], wreck[1] - along[1]];
  const thought = project(map, sail([-7.33, 49.67], run.bearing, run.miles));
  // the bracket: parallel to the gap, 40 px on its south side, clear of the
  // track
  const gap = Math.hypot(wreck[0] - thought[0], wreck[1] - thought[1]);
  const [x, y] = [
    (-(wreck[1] - thought[1]) / gap) * 40,
    ((wreck[0] - thought[0]) / gap) * 40,
  ];
  return {
    placed,
    legs: [
      {
        name: "wreck",
        route: [sailed, wreck],
        days: 0,
        seconds: 1.2,
        heading: "east",
      },
    ],
    marks: [
      ghost("estimated", thought),
      bracket("gap", [
        [thought[0] + x, thought[1] + y],
        [wreck[0] + x, wreck[1] + y],
      ]),
      scale(map, 10),
    ],
  };
}

/** The story of each placed map, for a slide of `slide` px. Throws if a
 *  map has no story. */
export function makeStories(
  maps: readonly PlacedMap[],
  slide: readonly [number, number],
): readonly Story[] {
  return maps.map((placed) => {
    if (placed.map === CAPE_NOIR) return capeNoir(placed);
    if (placed.map === JUAN_FERNANDEZ) return juanFernandez(placed, slide);
    if (placed.map === SCILLY) return scilly(placed);
    throw new Error(`no story for the map ${placed.map.name}`);
  });
}
