// The mockup's page: one slide at Slidev's size, in one of the styles of
// story.ts, a step at a time. In the address:
//   ?style=lessig|labels&step=0&wind=bands|near|all&label=outline|card|paper
//    &old=dim|remove&punch=card|veil|screen&start=globe|america&sea=paper
//    &settle=1&notext=1
// → or space steps forward, with the picture's motion; ← steps back at once.
// The story opens on the whole globe, or South America (`start`), and the
// camera flies to Cape Noir, then to Juan Fernández, then across the
// Atlantic to the English Channel, and in to the Isles of Scilly; the globe
// turns under it (globe.ts).
// Each story map rides the camera, placed by the camera
// that fits it best (tools/maps.ts), and fades in as the camera comes near
// it: its parallels are straight, and the globe's are not. The search opens with the ship at
// the bottom of the map; at the next step it sails north to the islands'
// latitude. `wind=near` adds a gust by the voyage, where no label is;
// `wind=all` draws the wind in the voyage's band too, under the labels.
// `label`, `old`, `punch` and `start` are in choices.ts. A step's text leaves at the
// next step: kept and dimmed, it was too busy by the last (PLAN.md, section
// 13). The exception is a label that stays, dimmed, to the end of its slide
// (story.ts, `stays`; PLAN.md, section 16).
// `settle` shows each step at once, with no motion, and `notext` hides the
// words: tools/shots.ts uses both. `window.mock` gives it the measurements.
import "../../../../themes/house/styles/fonts.css";
import { CHOICE_LIST, CHOICE_NAMES, CHOICES } from "./choices.ts";
import type { Choice, Chosen } from "./choices.ts";
import {
  ANSON,
  EARTH_RADIUS,
  NOIR,
  place,
  SCILLY,
  seen,
  SLIDE,
  SOUTH_AMERICA,
  unit,
  WHOLE_GLOBE,
} from "./geo.ts";
import type { Camera, LonLat, MapView, Point } from "./geo.ts";
import { COAST, Globe, globeData } from "./globe.ts";
import type { Colours } from "./globe.ts";
import {
  DAY,
  GLOBE_VIEW,
  noirPlacesOn,
  PICTURES,
  placesOn,
  REGION,
  scillyPlacesOn,
  STYLES,
} from "./story.ts";
import type { Picture, Style, Text } from "./story.ts";

const SVG = "http://www.w3.org/2000/svg";
const STATUTE_MILES_PER_NAUTICAL = 1.15078;

/** Seconds that each picture's change takes. At Cape Noir the ship shows
 *  off the land, and then the parallel, and the gap between the ships. On
 *  the search the ship is at the bottom of the map as the slide opens, and
 *  then sails north to the latitude; each day at sea takes DAY seconds; the
 *  last hours, to the islands, take less than one. At Scilly the ship sails
 *  its last two hours onto the rocks. */
const CHANGE: Readonly<Record<Picture, number>> = {
  globe: 0,
  thought: 0,
  real: 0,
  parallel: 0,
  gap: 0,
  south: 0,
  start: 2,
  east: 2 * DAY,
  west: 9 * DAY,
  found: 0.8,
  channel: 0,
  reckoned: 0,
  wreck: 1.2,
  toll: 0,
};
/** Seconds that text waits after the picture's change, as `after-watch`. */
const AFTER = 0.15;
/** Seconds that text takes to fade: style.css, `--text-fade`. */
const TEXT_FADE = 0.4;
/** Slide px between the points where a label's box is tested for land. */
const LAND_TEST = 4;
/** The camera's flight between two views, as in van Wijk and Nuij, "Smooth
 *  and efficient zooming and panning" (2003): it zooms out as far as the pan
 *  needs, pans, and zooms in. `rho` trades zoom for pan (their √2); a unit
 *  of the flight's length takes `seconds`, within `least` and `most`. */
const FLIGHT = { rho: Math.SQRT2, seconds: 1, least: 1, most: 3.5 } as const;
/** Seconds that the flight to a picture takes, where FLIGHT does not set
 *  it: the flight across the Atlantic, from Juan Fernández to the Channel,
 *  is long enough for the audience to follow the globe as it turns. By
 *  FLIGHT it would take its cap, 3.5 s; you asked for twice that. */
const FLIGHT_TIME: Partial<Readonly<Record<Picture, number>>> = {
  channel: 7,
};
/** A story map fades in as the camera's scale comes within this factor of
 *  the map's own, and out as the camera leaves. It is gone by `out` of the
 *  flight, and comes in after `in`, even when the flight hardly zooms: it
 *  fits the globe only near its own view, so it shows only near rest. */
const HANDOVER = { zoom: 3, out: 0.1, in: 0.9 } as const;

/** The wind: lines that end in a curl, drawn from west to east, over and
 *  over. Each is [x, y, curls up]. "bands" keeps the voyage's band clear;
 *  "near" adds a gust by the voyage, in a gap between the labels; "all"
 *  draws in the band too, under the labels. */
type Gust = readonly [number, number, boolean];
const BANDS: readonly Gust[] = [
  [250, 128, true],
  [480, 128, true],
  [60, 446, false],
  [360, 446, false],
  [200, 512, false],
  [470, 512, false],
];
const WIND: Readonly<Record<Chosen<"wind">, readonly Gust[]>> = {
  bands: BANDS,
  near: [...BANDS, [250, 268, true]],
  all: [
    ...BANDS,
    [60, 200, true],
    [300, 262, true],
    [440, 372, false],
    [60, 392, false],
  ],
};
const GUST = { length: 140, curl: 14 } as const;
const START: Readonly<Record<Chosen<"start">, Camera>> = {
  globe: WHOLE_GLOBE,
  america: SOUTH_AMERICA,
};

const params = new URLSearchParams(location.search);
const style: Style =
  STYLES.find((candidate) => candidate.name === params.get("style")) ??
  STYLES[0] ??
  fail("no styles");
const settle = params.get("settle") === "1";
const anson = placesOn(ANSON);
const noir = noirPlacesOn(NOIR);
const scilly = scillyPlacesOn(SCILLY);

function fail(message: string): never {
  throw new Error(message);
}

/** The name that the address gives for a choice, or its default. */
function chosen<C extends Choice>(choice: C): Chosen<C> {
  const names: readonly Chosen<C>[] = CHOICES[choice];
  return (
    names.find((name) => name === params.get(choice)) ??
    names[0] ??
    fail(`no ${choice}`)
  );
}

const gusts = WIND[chosen("wind")];
const dims = chosen("old") === "dim";

/** Whether step `target` is on the slide of step `index`, at or after it. */
function onSlide(index: number, target: number): boolean {
  const title = style.steps[index]?.title;
  return (
    index <= target &&
    style.steps
      .slice(index + 1, target + 1)
      .every((step) => step.title === title)
  );
}

/** Whether a text of step `index` stays, dimmed, at step `target`: it
 *  stays (story.ts, `stays`), and the target is later on its slide, before
 *  the text's `until`. */
function kept(text: Text, index: number, target: number): boolean {
  const shows = style.steps[target]?.picture;
  return (
    dims &&
    text.stays === true &&
    index < target &&
    onSlide(index, target) &&
    (text.until === undefined ||
      shows === undefined ||
      PICTURES.indexOf(shows) < PICTURES.indexOf(text.until))
  );
}

/** A count's number after `days` more days at sea than at the end of the
 *  picture before `shows`: its number a day, times the days at sea from
 *  the count's own picture on. */
function counted(
  text: Text,
  index: number,
  shows: Picture,
  days: number,
): number {
  const from = style.steps[index]?.picture ?? fail("no step");
  const before = PICTURES.slice(
    PICTURES.indexOf(from),
    PICTURES.indexOf(shows),
  ).reduce((sum, each) => sum + (DAYS[each] ?? 0), 0);
  const perDay = text.perDay ?? fail(`a count with no perDay: ${text.html}`);
  return perDay * (before + days);
}
/** The timers that tick the counts at the current step's dots. */
let ticks: number[] = [];

/** Show a count's number at the end of the picture `shows`. In motion, it
 *  starts from its number at the picture before, and ticks at each day's
 *  dot: `lead` seconds on, a day each `change / days` (track). */
function count(
  text: Text,
  index: number,
  made: HTMLElement,
  shows: Picture,
  motion: { readonly lead: number; readonly change: number } | null,
): void {
  const number =
    made.querySelector<HTMLElement>(".number") ?? fail("a count's number");
  const days = DAYS[shows] ?? 0;
  const write = (day: number) => {
    number.textContent = String(counted(text, index, shows, day));
  };
  if (motion === null || days === 0) {
    write(days);
    return;
  }
  write(0);
  for (let day = 1; day <= days; day += 1)
    ticks.push(
      window.setTimeout(
        () => {
          write(day);
        },
        (motion.lead + (day / days) * motion.change) * 1000,
      ),
    );
}
const startCamera = START[chosen("start")];

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
  parent: Element,
): HTMLElementTagNameMap[K] {
  const made = document.createElement(tag);
  made.className = className;
  parent.append(made);
  return made;
}

function svgElement(
  tag: string,
  attributes: Readonly<Record<string, string | number>>,
  parent: Element,
): SVGElement {
  const made = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attributes))
    made.setAttribute(name, String(value));
  parent.append(made);
  return made as SVGElement;
}

/** A mark of the picture: it shows from one picture on, until another. */
interface Mark {
  readonly element: SVGElement;
  readonly from: Picture;
  readonly until?: Picture | undefined;
  /** seconds into its picture's change that it appears: a day's dot */
  readonly delay: number;
  /** a track: it draws itself over its picture's change */
  readonly draws: boolean;
}

const slide =
  document.querySelector<HTMLElement>("#slide") ?? fail("no #slide");
slide.classList.toggle("sea-paper", params.get("sea") === "paper");
slide.classList.toggle("no-text", params.get("notext") === "1");
// settled: the wind stands, so that two pictures of a step differ only in the text
slide.classList.toggle("settle", settle);
// how the labels stand out: style.css, "D: a label"
slide.classList.add(`labels-${chosen("label")}`);
slide.classList.add(`punch-${chosen("punch")}`);

/** Whether a text shows the paper panel under it: a screen does, and a
 *  punchline does on a veil or a screen, not on a card. */
const panelled = (text: Text) =>
  text.kind === "screen" ||
  (text.kind === "punch" &&
    (chosen("punch") === "veil" || chosen("punch") === "screen"));

const viewBox = `0 0 ${String(SLIDE.width)} ${String(SLIDE.height)}`;
const canvas = element("canvas", "layer globe", slide);
const context = canvas.getContext("2d") ?? fail("no 2D canvas");
/** The story maps, each placed on the globe at each frame. */
const regionLayer = svgElement("svg", { class: "layer", viewBox }, slide);
const marks: Mark[] = [];
const picture = svgElement("svg", { class: "layer", viewBox }, slide);

/** A story's map on the globe: the camera that shows it as drawn, and its
 *  group. */
interface RegionMap {
  readonly camera: Camera;
  readonly group: SVGElement;
}
const regionMaps = new Map<MapView, RegionMap>();

/** The first picture after `from` with another map: when a mark of the
 *  map leaves. */
const leaves = (from: Picture): Picture | undefined =>
  PICTURES.slice(PICTURES.indexOf(from)).find(
    (later) => REGION[later] !== REGION[from],
  );

function addMark(
  mark: Omit<Mark, "delay" | "draws" | "until"> &
    Partial<Pick<Mark, "delay" | "draws">>,
): void {
  // hidden until the first step shows it, so that nothing flashes at load
  mark.element.classList.add("mark", "hidden");
  marks.push({ delay: 0, draws: false, until: leaves(mark.from), ...mark });
}

/** The lengths of a route's segments, in slide px. */
const segments = (route: readonly Point[]): number[] =>
  route.slice(1).map((point, index) => {
    const from = route[index] ?? point;
    return Math.hypot(point[0] - from[0], point[1] - from[1]);
  });

/** The point a share of the way along a route, by length. */
function along(route: readonly Point[], share: number): Point {
  const lengths = segments(route);
  let left = share * lengths.reduce((sum, length) => sum + length, 0);
  for (const [index, length] of lengths.entries()) {
    const from = route[index];
    const to = route[index + 1];
    if (from === undefined || to === undefined) break;
    if (left <= length || index === lengths.length - 1) {
      const part = length === 0 ? 0 : Math.min(left / length, 1);
      return [
        from[0] + (to[0] - from[0]) * part,
        from[1] + (to[1] - from[1]) * part,
      ];
    }
    left -= length;
  }
  return route.at(-1) ?? fail("an empty route");
}

/** A picture's route: a track that draws itself over the picture's change,
 *  and, for a leg of days at sea, a dot at the end of each day. */
function track(shows: Picture): void {
  const route = ROUTES[shows];
  if (route === null || route.length < 2) return;
  addMark({
    element: svgElement(
      "path",
      {
        class: "track",
        d: `M${route.map(([x, y]) => `${String(x)},${String(y)}`).join("L")}`,
        pathLength: 1,
      },
      picture,
    ),
    from: shows,
    draws: true,
  });
  const days = DAYS[shows];
  if (days === undefined) return;
  for (let day = 0; day <= days; day += 1) {
    const share = day / days;
    const [cx, cy] = along(route, share);
    addMark({
      element: svgElement("circle", { class: "dot", cx, cy, r: 4.5 }, picture),
      from: shows,
      delay: share * CHANGE[shows],
    });
  }
}

/** A gust: a line from west to east that curls at its east end, up or down,
 *  about three quarters of a turn. */
function gust([x, y, up]: Gust): string {
  const { length, curl } = GUST;
  const end = x + length;
  const side = up ? -1 : 1;
  const sweep = up ? 0 : 1;
  const centre = y + side * curl;
  const arc = `A${String(curl)},${String(curl)} 0 0 ${String(sweep)}`;
  return `M${String(x)},${String(y)}H${String(end)}${arc} ${String(end)},${String(y + side * 2 * curl)}${arc} ${String(end - 0.94 * curl)},${String(centre - side * 0.34 * curl)}`;
}

/** The ship, loosely HMS Centurion (1732), a 60-gun ship: three masts,
 *  square sails on the fore and main masts and a sail aft of the mizzen, a
 *  high stern, and the stripe of a gun deck. The bow is to the right, and
 *  (0, 0) is on the waterline. The pennant streams east, with the wind,
 *  whichever way the ship faces. */
const SHIP_PARTS: readonly (readonly [string, string])[] = [
  ["ship-line", "M-16,-12V-36M0,-8V-50M13,-8V-42M24,-11L37,-18"],
  ["ship-sail", "M-16,-34L-16,-14L-28,-14Z"],
  ["ship-sail", "M-11,-27L11,-27L12,-14L-12,-14Z"],
  ["ship-sail", "M-9,-42L9,-42L10,-30L-10,-30Z"],
  ["ship-sail", "M4,-24L22,-24L23,-12L3,-12Z"],
  ["ship-sail", "M6,-37L20,-37L21,-27L5,-27Z"],
  [
    "ship-hull",
    "M-28,-13L-23,-13L-21,-8L18,-8L26,-12Q24,-1 15,4L-20,4Q-27,1 -28,-13Z",
  ],
  ["ship-wale", "M-21,-3H17"],
];

/** The ship's size: SHIP_PARTS are drawn for a hull 54 px long. */
const SHIP_SCALE = 0.8;

const ship = svgElement("g", { class: "ship" }, picture);

/** Draws a ship into a group: the one that sails, or where the squadron
 *  thought it was (`.ghost`). */
function drawShip(group: SVGElement): void {
  const sized = svgElement(
    "g",
    { transform: `scale(${String(SHIP_SCALE)})` },
    group,
  );
  const facing = svgElement("g", { class: "ship-facing" }, sized);
  for (const [className, d] of SHIP_PARTS)
    svgElement("path", { class: className, d }, facing);
  svgElement("path", { class: "ship-flag", d: "M0,-50L13,-47L0,-44Z" }, sized);
}

/** The ship's route at each picture, or null where it does not show; the
 *  ship starts at the route's first point and ends at its last. At Cape
 *  Noir it shows 2 miles off the land, on the parallel of where they
 *  thought they were: it does not sail in, which would show it off that
 *  parallel first. On the search, the west leg
 *  runs due west, on the parallel of the sighting: south of the east leg,
 *  so that both show. The ship jumps there from the turn, with no track:
 *  the drop is the drawing's, not a course sailed. It sights the islands at
 *  the end of the west leg, and then sails to its anchorage. At Scilly it
 *  sails its last two hours onto the rocks. */
const ROUTES: Readonly<Record<Picture, readonly Point[] | null>> = {
  globe: null,
  thought: null,
  real: [noir.ship],
  parallel: [noir.ship],
  gap: [noir.ship],
  south: [anson.entry, anson.south],
  start: [anson.south, anson.start],
  east: [anson.start, anson.turn],
  west: [[anson.turn[0], anson.found[1]], anson.found],
  found: [anson.found, anson.anchorage],
  channel: null,
  reckoned: null,
  wreck: [scilly.sailed, scilly.wreck],
  toll: [scilly.wreck],
};
/** The legs that take days, with a dot at the end of each day; a count
 *  ticks at each. Found: from the sighting at daybreak on June 9, "all that
 *  day, and the next night" to the anchorage (PLAN.md, section 9); its dot
 *  is under the ship. */
const DAYS: Partial<Readonly<Record<Picture, number>>> = {
  east: 2,
  west: 9,
  found: 1,
};
/** Which way the ship faces: 1 east, -1 west. A side view cannot face
 *  north, so it faces east as it sails north. */
const HEADING: Readonly<Record<Picture, number>> = {
  globe: 1,
  thought: 1,
  real: 1,
  parallel: 1,
  gap: 1,
  south: 1,
  start: 1,
  east: 1,
  west: -1,
  found: -1,
  channel: 1,
  reckoned: 1,
  wreck: 1,
  toll: 1,
};

/** A scale of statute miles, at the bottom left of a story map. A nautical
 *  mile is a minute of latitude, and a story map's scale is the same in
 *  every direction at its centre. Each map's scale is about 110 px long. */
function drawScale(view: MapView, miles: number, from: Picture): void {
  const scale = svgElement("g", { class: "scale" }, picture);
  const length = (miles / STATUTE_MILES_PER_NAUTICAL / 60) * view.scale;
  svgElement("path", { d: `M36,512v8h${length.toFixed(1)}v-8` }, scale);
  const label = svgElement("text", { x: 36, y: 504 }, scale);
  label.textContent = `${String(miles)} miles`;
  addMark({ element: scale, from });
}

/** A ship where they thought they were: dashed, with no fill. */
function drawGhost([x, y]: Point, from: Picture): void {
  const ghost = svgElement(
    "g",
    {
      class: "ship ghost",
      transform: `translate(${String(x)},${String(y)})`,
    },
    picture,
  );
  drawShip(ghost);
  addMark({ element: ghost, from });
}

/** A bracket that measures a gap: a line, with a tick across each end. */
function drawBracket(
  [from, to]: readonly [Point, Point],
  shows: Picture,
): void {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  const [x, y] = [
    (-(to[1] - from[1]) / length) * 8,
    ((to[0] - from[0]) / length) * 8,
  ];
  const tick = ([px, py]: Point) =>
    `M${String(px - x)},${String(py - y)}L${String(px + x)},${String(py + y)}`;
  addMark({
    element: svgElement(
      "path",
      {
        class: "gap",
        d: `${tick(from)}M${String(from[0])},${String(from[1])}L${String(to[0])},${String(to[1])}${tick(to)}`,
      },
      picture,
    ),
    from: shows,
  });
}

/** A dashed parallel, from the slide's left edge. */
function drawParallel(y: number, end: number, from: Picture): void {
  addMark({
    element: svgElement(
      "path",
      { class: "latitude", d: `M0,${String(y)}H${String(end)}` },
      picture,
    ),
    from,
  });
}

function drawPicture(ansonLand: string, islands: SVGElement | null): void {
  const mask = svgElement(
    "mask",
    { id: "sea-only" },
    svgElement("defs", {}, picture),
  );
  svgElement(
    "rect",
    { width: SLIDE.width, height: SLIDE.height, fill: "white" },
    mask,
  );
  svgElement(
    "path",
    { d: ansonLand, fill: "black", stroke: "black", "stroke-width": 8 },
    mask,
  );

  // Cape Noir: where the squadron thought it was, and then the parallel
  // that both places share, across the slide as on a map, and then the
  // gap between them.
  drawGhost(noir.thought, "thought");
  drawParallel(noir.ship[1], SLIDE.width, "parallel");
  drawBracket(
    [
      [noir.thought[0], noir.bracket],
      [noir.ship[0], noir.bracket],
    ],
    "gap",
  );
  drawScale(NOIR, 100, "thought");

  // Scilly: where the fleet thought it was, and then the gap between that
  // and the rocks.
  drawGhost(scilly.thought, "reckoned");
  drawBracket(scilly.bracket, "toll");
  drawScale(SCILLY, 10, "reckoned");

  // The search: the wind, over the sea, from the first leg on.
  const wind = svgElement(
    "g",
    { class: "wind", mask: "url(#sea-only)" },
    picture,
  );
  gusts.forEach((each, index) => {
    const made = svgElement(
      "path",
      { class: "gust", d: gust(each), pathLength: 1 },
      wind,
    );
    made.style.animationDelay = `${String(-index * 0.9)}s`;
  });
  addMark({ element: wind, from: "east" });
  drawParallel(anson.start[1], anson.coast[0] - 4, "start");
  drawScale(ANSON, 100, "south");

  // The voyage. When the ship moves on, a dot stays where it was.
  for (const shows of PICTURES) track(shows);
  // The islands show when the ship sights them.
  if (islands !== null) addMark({ element: islands, from: "found" });

  picture.append(ship);
  drawShip(ship);
}

const placeShip = ([x, y]: Point) =>
  `translate(${String(x)}px, ${String(y)}px)`;

// The camera's flight. It pans along the great circle between the two
// centres, and moves `at` and the turn with the pan.
const sameCamera = (a: Camera, b: Camera): boolean =>
  Math.hypot(a.centre[0] - b.centre[0], a.centre[1] - b.centre[1]) < 1e-6 &&
  Math.hypot(a.at[0] - b.at[0], a.at[1] - b.at[1]) < 1e-3 &&
  Math.abs(Math.log(a.kmPerPx / b.kmPerPx)) < 1e-4 &&
  Math.abs(a.angle - b.angle) < 1e-4;

interface Flight {
  /** van Wijk and Nuij's length of the flight */
  readonly length: number;
  readonly at: (share: number) => Camera;
}

function flight(from: Camera, to: Camera): Flight {
  const { rho } = FLIGHT;
  const [w0, w1] = [from.kmPerPx * SLIDE.width, to.kmPerPx * SLIDE.width];
  const [a, b] = [unit(from.centre), unit(to.centre)];
  const cosTurn = a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const turn = Math.acos(Math.max(-1, Math.min(1, cosTurn)));
  const distance = EARTH_RADIUS * turn;
  const mix = (start: number, end: number, share: number) =>
    start + (end - start) * share;
  /** the camera `u` km along the pan, with `width` km across the slide */
  const camera = (u: number, width: number, share: number): Camera => {
    const along = distance === 0 ? share : u / distance;
    const [fromA, fromB] =
      turn === 0
        ? [1, 0]
        : [
            Math.sin((1 - along) * turn) / Math.sin(turn),
            Math.sin(along * turn) / Math.sin(turn),
          ];
    return {
      centre: place([
        fromA * a[0] + fromB * b[0],
        fromA * a[1] + fromB * b[1],
        fromA * a[2] + fromB * b[2],
      ]),
      at: [mix(from.at[0], to.at[0], along), mix(from.at[1], to.at[1], along)],
      kmPerPx: width / SLIDE.width,
      angle: mix(from.angle, to.angle, along),
    };
  };
  if (distance < 1e-6 * Math.max(w0, w1)) {
    // a zoom with no pan
    const ratio = Math.log(w1 / w0);
    return {
      length: Math.abs(ratio) / rho,
      at: (share) => camera(0, w0 * Math.exp(ratio * share), share),
    };
  }
  const b0 = (w: number, sign: number) =>
    (w1 * w1 - w0 * w0 + sign * rho ** 4 * distance ** 2) /
    (2 * w * rho ** 2 * distance);
  const r = (value: number) => Math.log(-value + Math.sqrt(value ** 2 + 1));
  const r0 = r(b0(w0, 1));
  const r1 = r(b0(w1, -1));
  const length = (r1 - r0) / rho;
  return {
    length,
    at: (share) => {
      const s = share * length;
      return camera(
        (w0 / rho ** 2) *
          (Math.cosh(r0) * Math.tanh(rho * s + r0) - Math.sinh(r0)),
        (w0 * Math.cosh(r0)) / Math.cosh(rho * s + r0),
        share,
      );
    },
  };
}

const smooth = (share: number) => {
  const clamped = Math.min(Math.max(share, 0), 1);
  return clamped * clamped * (3 - 2 * clamped);
};

/** The camera that each picture shows: its story map's, or the globe's
 *  (GLOBE_VIEW, or the start). */
function cameraAt(shows: Picture): Camera {
  const region = REGION[shows];
  return region === null
    ? (GLOBE_VIEW[shows] ?? startCamera)
    : (regionMaps.get(region)?.camera ?? fail(`no map ${region.name}`));
}

let shownCamera = startCamera;
let globe: Globe | null = null;
let colours: Colours | null = null;

/** Each story map's opacity at rest: only the picture's own map shows. */
function restingOpacity(
  shows: Picture | undefined,
): ReadonlyMap<RegionMap, number> {
  const region = shows === undefined ? null : REGION[shows];
  const map = region === null ? undefined : regionMaps.get(region);
  return new Map(map === undefined ? [] : [[map, 1]]);
}

/** Where a story map shows through a camera: its own camera's centre at
 *  that place on the globe, turned and scaled to match. It fits the globe
 *  only near its own view, and shows only there (HANDOVER). */
function regionTransform(camera: Camera, map: Camera): string {
  const [x, y] = seen(camera, map.centre);
  return `translate(${String(x)},${String(y)}) rotate(${String(((camera.angle - map.angle) * 180) / Math.PI)}) scale(${String(map.kmPerPx / camera.kmPerPx)}) translate(${String(-map.at[0])},${String(-map.at[1])})`;
}

/** Draws the globe through a camera, with each story map at its opacity. */
function draw(camera: Camera, opacity: ReadonlyMap<RegionMap, number>): void {
  if (globe !== null && colours !== null) globe.draw(context, camera, colours);
  for (const region of regionMaps.values()) {
    const shown = opacity.get(region) ?? 0;
    region.group.style.opacity = String(shown);
    region.group.style.visibility = shown > 0 ? "visible" : "hidden";
    if (shown === 0) continue;
    region.group.setAttribute(
      "transform",
      regionTransform(camera, region.camera),
    );
    region.group.style.setProperty(
      "--line",
      String((COAST * camera.kmPerPx) / region.camera.kmPerPx),
    );
  }
  shownCamera = camera;
}

interface Move {
  readonly flight: Flight;
  /** ms, performance.now(), when show() started it */
  readonly start: number;
  /** seconds: the wait, while what leaves fades out, and the flight */
  readonly delay: number;
  readonly seconds: number;
  readonly leaving: RegionMap | null;
  readonly coming: RegionMap | null;
}
let move: Move | null = null;
/** the frames of the last flight, ms, performance.now() */
let flightFrames: number[] = [];

/** How much a story map shows when the camera is at this scale. */
const nearness = (camera: Camera, region: RegionMap) =>
  1 -
  smooth(
    Math.log(camera.kmPerPx / region.camera.kmPerPx) / Math.log(HANDOVER.zoom),
  );

function fly(now: number): void {
  const running = move;
  if (running === null) return;
  const elapsed = (now - running.start) / 1000 - running.delay;
  if (elapsed >= 0) flightFrames.push(now);
  const share = smooth(elapsed / running.seconds);
  const camera = running.flight.at(share);
  const opacity = new Map<RegionMap, number>();
  if (running.leaving !== null)
    opacity.set(
      running.leaving,
      Math.min(
        nearness(camera, running.leaving),
        1 - smooth(share / HANDOVER.out),
      ),
    );
  if (running.coming !== null)
    opacity.set(
      running.coming,
      Math.min(
        nearness(camera, running.coming),
        smooth((share - HANDOVER.in) / (1 - HANDOVER.in)),
      ),
    );
  draw(camera, opacity);
  if (elapsed < running.seconds) requestAnimationFrame(fly);
  else move = null;
}

interface Shown {
  readonly text: Text;
  readonly step: number;
  readonly element: HTMLElement;
}

const shown: Shown[] = [];
/** each slide's title, and its steps */
const titles: { readonly element: HTMLElement; readonly steps: number[] }[] =
  [];

/** Where a place on the globe shows through a picture's camera. */
function globePoint(where: LonLat, shows: Picture): Point {
  const [x, y] = seen(cameraAt(shows), where);
  return [x, y];
}

function drawText(): void {
  style.steps.forEach((step, index) => {
    const last = titles.at(-1);
    if (step.title === undefined) return;
    if (last !== undefined && last.element.textContent === step.title) {
      last.steps.push(index);
      return;
    }
    const made = element("h1", "outlined hidden", slide);
    made.textContent = step.title;
    titles.push({ element: made, steps: [index] });
  });
  const screen = element("div", "screen-panel", slide);
  style.steps.forEach((step, index) => {
    for (const text of step.texts) {
      const parent = text.kind === "screen" ? screen : slide;
      // A count is a label with a number.
      const made = element(
        "div",
        `text ${text.kind === "count" ? "label count" : text.kind} hidden`,
        parent,
      );
      // A screen's or a punchline's words are one block, centred on the
      // slide.
      made.innerHTML =
        text.kind === "label"
          ? text.html
          : text.kind === "count"
            ? `${text.html}<div class="number"></div>`
            : `<div>${text.html}</div>`;
      // A label on the globe is at its place there, through its picture's
      // camera.
      const [x, y] =
        text.on === undefined
          ? (text.at ?? [0, 0])
          : globePoint(text.on, step.picture);
      if (text.at !== undefined || text.on !== undefined)
        Object.assign(made.style, {
          left: `${String(x)}px`,
          top: `${String(y)}px`,
        });
      made.classList.toggle("centred", text.on !== undefined);
      shown.push({ text, step: index, element: made });
    }
  });
}

/** Slide px between a callout's label and its leader, as WatchCallout.vue
 *  draws one (stem/docs/illustrations.md, "Leaders"). */
const LEADER_START_GAP = 4;

/** An element's box as it shows on the slide, in slide px: left, top,
 *  width and height. */
function slideBox(made: Element): readonly [number, number, number, number] {
  const frame = slide.getBoundingClientRect();
  const scale = frame.width / SLIDE.width;
  const rect = made.getBoundingClientRect();
  return [
    (rect.left - frame.left) / scale,
    (rect.top - frame.top) / scale,
    rect.width / scale,
    rect.height / scale,
  ];
}

/** A callout's leader, inside its label so that it fades with the label:
 *  straight, from the side of the label's box (grown by LEADER_START_GAP)
 *  that faces the place, to `stop` px short of the place. Its width and
 *  color are style.css's (`.leader`). Call it once the fonts have loaded,
 *  so that the box has its size. */
function drawLeader(made: HTMLElement, to: Point, stop: number): void {
  const [left, top, width, height] = slideBox(made);
  const centre: Point = [left + width / 2, top + height / 2];
  const [dx, dy] = [to[0] - centre[0], to[1] - centre[1]];
  const reach = Math.min(
    dx === 0 ? Infinity : (width / 2 + LEADER_START_GAP) / Math.abs(dx),
    dy === 0 ? Infinity : (height / 2 + LEADER_START_GAP) / Math.abs(dy),
  );
  const start: Point = [centre[0] + dx * reach, centre[1] + dy * reach];
  const length = Math.hypot(to[0] - start[0], to[1] - start[1]);
  const end: Point = [
    start[0] + ((to[0] - start[0]) * (length - stop)) / length,
    start[1] + ((to[1] - start[1]) * (length - stop)) / length,
  ];
  // in the label's own px, from inside its border (a card has one)
  const local = ([x, y]: Point) =>
    `${String(x - left - made.clientLeft)},${String(y - top - made.clientTop)}`;
  const leader = svgElement("svg", { class: "leader" }, made);
  svgElement("path", { d: `M${local(start)}L${local(end)}` }, leader);
}

/** Whether no land is under a label's box. With `label=paper`, the words of
 *  such a label are in the paper, with no outline; a label over the land,
 *  or partly over it, keeps the ink and the outline. Call it once the fonts
 *  have loaded, so that the box has its size. */
function overSea(made: HTMLElement, onLand: (x: number, y: number) => boolean) {
  // as it shows: a centred label is moved by its CSS
  const [left, top, width, height] = slideBox(made);
  const right = left + width;
  const bottom = top + height;
  for (let x = left; x <= right; x += LAND_TEST)
    for (let y = top; y <= bottom; y += LAND_TEST)
      if (onLand(x, y)) return false;
  return true;
}

/** Whether a slide point is on the land of a picture: its story map's, or
 *  the globe's, which is on a canvas, through the picture's camera. */
function landTest(shows: Picture): (x: number, y: number) => boolean {
  if (REGION[shows] !== null) {
    const land = landOf(shows);
    return (x, y) =>
      land.some((path) => path.isPointInFill(new DOMPoint(x, y)));
  }
  const path = (globe ?? fail("no globe")).land(cameraAt(shows));
  const tester =
    document.createElement("canvas").getContext("2d") ?? fail("no 2D canvas");
  return (x, y) => tester.isPointInPath(path, x, y);
}

/** The land of a picture's story map, in slide px, or none. */
const landOf = (shows: Picture): SVGGeometryElement[] => {
  const region = REGION[shows];
  const group = region === null ? undefined : regionMaps.get(region)?.group;
  return group === undefined
    ? []
    : [...group.querySelectorAll<SVGGeometryElement>(".land")];
};

let current: number | null = null;

/** Seconds after a step starts: when its flight starts and ends. */
interface Timing {
  readonly flightStart: number;
  readonly flightEnd: number;
}

function show(target: number, animate: boolean): Timing {
  const step = style.steps[target] ?? fail(`no step ${String(target)}`);
  const now = PICTURES.indexOf(step.picture);
  const previousStep = current === null ? undefined : style.steps[current];
  const before =
    previousStep === undefined ? -1 : PICTURES.indexOf(previousStep.picture);
  const goal = cameraAt(step.picture);
  const flies = animate && move === null && !sameCamera(shownCamera, goal);
  const change = animate && now > before ? CHANGE[step.picture] : 0;
  const hadScreen = previousStep?.texts.some(panelled) === true;
  const screenShows = step.texts.some(panelled);
  // Before the camera flies, what leaves fades out: marks, labels, a
  // screen. When a screen fades out, the picture waits for it.
  const route = flies ? flight(shownCamera, goal) : null;
  const seconds =
    route === null
      ? 0
      : (FLIGHT_TIME[step.picture] ??
        Math.min(
          Math.max(route.length * FLIGHT.seconds, FLIGHT.least),
          FLIGHT.most,
        ));
  const flightStart = flies ? TEXT_FADE : 0;
  const lead = flies
    ? flightStart + seconds
    : change > 0 && hadScreen && !screenShows
      ? TEXT_FADE
      : 0;
  slide.classList.toggle("jump", !animate);

  // The camera.
  move = null;
  const region = REGION[step.picture];
  const map = region === null ? undefined : regionMaps.get(region);
  if (route === null) {
    draw(goal, restingOpacity(step.picture));
  } else {
    const leavingRegion =
      previousStep === undefined ? null : REGION[previousStep.picture];
    move = {
      flight: route,
      start: performance.now(),
      delay: flightStart,
      seconds,
      leaving:
        leavingRegion === null ? null : (regionMaps.get(leavingRegion) ?? null),
      coming: map ?? null,
    };
    flightFrames = [];
    requestAnimationFrame(fly);
  }

  for (const mark of marks) {
    const from = PICTURES.indexOf(mark.from);
    const until =
      mark.until === undefined ? PICTURES.length : PICTURES.indexOf(mark.until);
    const visible = from <= now && now < until;
    const entering = animate && visible && from === now && before < from;
    mark.element.classList.toggle("hidden", !visible);
    mark.element.style.transitionDelay = entering
      ? `${String(lead + mark.delay)}s`
      : "0s";
    if (mark.draws) {
      if (entering) {
        mark.element.style.transition = "none";
        mark.element.style.strokeDashoffset = "1";
        mark.element.getBoundingClientRect();
        mark.element.style.transition = `stroke-dashoffset ${String(CHANGE[mark.from])}s linear ${String(lead)}s`;
      }
      mark.element.style.strokeDashoffset = visible ? "0" : "1";
    }
  }

  moveShip(ROUTES[step.picture], animate, flies, lead, change);
  ship.classList.toggle("west", HEADING[step.picture] < 0);

  const screen =
    slide.querySelector<HTMLElement>(".screen-panel") ?? fail("no screen");
  screen.classList.toggle("hidden", !screenShows);
  for (const tick of ticks) clearTimeout(tick);
  ticks = [];
  for (const { text, step: index, element: made } of shown) {
    const dimmed = kept(text, index, target);
    const counts = text.kind === "count" && onSlide(index, target);
    const visible = index === target || dimmed || counts;
    // A label that lingers leaves with the new labels, still dimmed.
    const lingering =
      animate &&
      !visible &&
      text.lingers === true &&
      text.until === step.picture &&
      !made.classList.contains("hidden");
    made.classList.toggle("hidden", !visible);
    made.classList.toggle("dimmed", dimmed || lingering);
    if (counts)
      count(
        text,
        index,
        made,
        step.picture,
        animate && now > before ? { lead, change } : null,
      );
    // A screen's words wait for the last screen's words to fade out; a
    // count comes as the ship sets off; other text waits for the picture's
    // change.
    const labelWait = lead + change > 0 ? lead + change + AFTER : 0;
    const wait =
      text.kind === "screen"
        ? hadScreen
          ? TEXT_FADE
          : 0
        : text.kind === "count"
          ? lead
          : labelWait;
    // A lingering label dims at once and fades out later: the delays are
    // for opacity and --text-dim, in style.css's order.
    made.style.transitionDelay = lingering
      ? `${String(labelWait)}s, 0s`
      : animate && index === target
        ? `${String(wait)}s`
        : "0s";
  }
  // A new slide's title waits for the camera, as other text does.
  for (const title of titles) {
    const visible = title.steps.includes(target);
    const stays = visible && !title.element.classList.contains("hidden");
    title.element.classList.toggle("hidden", !visible);
    title.element.style.transitionDelay =
      animate && visible && !stays && flies ? `${String(lead + AFTER)}s` : "0s";
  }
  current = target;
  params.set("step", String(target));
  history.replaceState(null, "", `?${params.toString()}`);
  const counter = document.querySelector("#counter") ?? fail("no #counter");
  counter.textContent = `${style.name}: step ${String(target + 1)} of ${String(style.steps.length)}`;
  if (!animate) {
    slide.getBoundingClientRect();
    requestAnimationFrame(() => {
      slide.classList.remove("jump");
    });
  }
  return { flightStart, flightEnd: flightStart + seconds };
}

/** The ship to its route's end: it sails the route over the picture's
 *  change, after `lead`. Before a flight it fades out where it is, and
 *  after the flight it fades in at its route's start; it fades out, too,
 *  where it leaves the picture, and in where it comes into it. */
function moveShip(
  route: readonly Point[] | null,
  animate: boolean,
  flies: boolean,
  lead: number,
  change: number,
): void {
  const computed = getComputedStyle(ship);
  const was = { transform: computed.transform, opacity: computed.opacity };
  for (const running of ship.getAnimations()) running.cancel();
  const first = route?.[0];
  const last = route?.at(-1);
  if (last !== undefined) ship.style.transform = placeShip(last);
  ship.style.opacity = route === null ? "0" : "1";
  if (!animate) return;
  // Keyframes in seconds, for transform and opacity apart.
  type Key = readonly [number, string];
  const play = (property: "transform" | "opacity", keys: readonly Key[]) => {
    const total = Math.max(...keys.map(([at]) => at));
    if (keys.length < 2 || total === 0) return;
    ship.animate(
      keys.map(([at, value]) => ({ [property]: value, offset: at / total })),
      { duration: total * 1000, easing: "linear", fill: "backwards" },
    );
  };
  const sailed: Key[] =
    route === null || first === undefined
      ? []
      : (() => {
          const lengths = segments(route);
          const length = lengths.reduce((sum, each) => sum + each, 0);
          let travelled = 0;
          return route.map((point, index) => {
            travelled += index === 0 ? 0 : (lengths[index - 1] ?? 0);
            const share =
              length === 0
                ? index / Math.max(route.length - 1, 1)
                : travelled / length;
            return [lead + share * change, placeShip(point)];
          });
        })();
  const shows = route !== null;
  const wasShown = Number(was.opacity) > 0;
  if (flies) {
    const start = first === undefined ? was.transform : placeShip(first);
    play("transform", [
      [0, was.transform],
      [TEXT_FADE, was.transform],
      [TEXT_FADE, start],
      [lead, start],
      ...sailed,
    ]);
    play("opacity", [
      [0, was.opacity],
      [TEXT_FADE, "0"],
      [lead, "0"],
      [lead + TEXT_FADE, shows ? "1" : "0"],
    ]);
    return;
  }
  if (sailed.length >= 2)
    play("transform", [[0, sailed[0]?.[1] ?? ""], ...sailed]);
  if (shows && !wasShown)
    play("opacity", [
      [0, "0"],
      [lead, "0"],
      [lead + TEXT_FADE, "1"],
    ]);
  if (!shows && wasShown)
    play("opacity", [
      [0, was.opacity],
      [TEXT_FADE, "0"],
    ]);
}

function fit(): void {
  const bar =
    document.querySelector("#bar")?.getBoundingClientRect().height ?? 0;
  const scale = Math.min(
    window.innerWidth / SLIDE.width,
    (window.innerHeight - bar) / SLIDE.height,
  );
  slide.style.transform = `scale(${String(scale)})`;
  // The canvas has a device px for each px of the scaled slide, and draws
  // in slide px.
  const pixels = scale * window.devicePixelRatio;
  canvas.width = Math.round(SLIDE.width * pixels);
  canvas.height = Math.round(SLIDE.height * pixels);
  context.setTransform(pixels, 0, 0, pixels, 0, 0);
  if (move === null)
    draw(shownCamera, restingOpacity(style.steps[current ?? 0]?.picture));
}

interface TextMeasure {
  readonly kind: string;
  readonly words: number;
  readonly fontSize: number;
  /** a label of an earlier step, kept (story.ts, `stays`) */
  readonly dimmed: boolean;
  /** a label with no land under it (overSea) */
  readonly onSea: boolean;
  /** slide px: left, top, width, height */
  readonly box: readonly [number, number, number, number];
  /** slide px from the place that the text is about to its box; null: none */
  readonly travel: number | null;
}

function measure(): {
  style: string;
  step: number;
  picture: Picture;
  texts: TextMeasure[];
} {
  const texts: TextMeasure[] = [];
  for (const { text, element: made } of shown) {
    if (made.classList.contains("hidden")) continue;
    const box = slideBox(made);
    const travel =
      text.about === undefined
        ? null
        : Math.hypot(
            Math.max(
              box[0] - text.about[0],
              0,
              text.about[0] - box[0] - box[2],
            ),
            Math.max(
              box[1] - text.about[1],
              0,
              text.about[1] - box[1] - box[3],
            ),
          );
    texts.push({
      kind: text.kind,
      words: made.innerText.split(/\s+/).filter((word) => word !== "").length,
      fontSize: Number.parseFloat(getComputedStyle(made).fontSize),
      dimmed: made.classList.contains("dimmed"),
      onSea: made.classList.contains("on-sea"),
      box,
      travel,
    });
  }
  const step = style.steps[current ?? 0] ?? fail("no step");
  return {
    style: style.name,
    step: current ?? 0,
    picture: step.picture,
    texts,
  };
}

declare global {
  interface Window {
    mock: {
      ready: boolean;
      steps: number;
      measure: typeof measure;
      go: (step: number, animate?: boolean) => Timing;
      /** the land of the current step's story map, in slide px, or null */
      land: () => string | null;
      /** ms between the frames of the last flight */
      frames: () => number[];
    };
  }
}

/** A camera from a story map's `data-camera`: the centre's longitude and
 *  latitude, at x and y, km to a px, and the turn (tools/maps.ts). */
function cameraData(text: string | null): Camera {
  const numbers = (text ?? "").split(" ").map(Number);
  const [lon, lat, atX, atY, kmPerPx, angle] = numbers;
  if (
    numbers.length !== 6 ||
    !numbers.every(Number.isFinite) ||
    lon === undefined ||
    lat === undefined ||
    atX === undefined ||
    atY === undefined ||
    kmPerPx === undefined ||
    angle === undefined
  )
    fail(`not a camera: ${String(text)}`);
  return { centre: [lon, lat], at: [atX, atY], kmPerPx, angle };
}

async function start(): Promise<void> {
  const parse = async (name: string): Promise<Document> =>
    new DOMParser().parseFromString(
      await (await fetch(`./maps/${name}.svg`)).text(),
      "image/svg+xml",
    );
  globe = new Globe(globeData(await (await fetch("./maps/globe.json")).json()));
  const computed = getComputedStyle(canvas);
  colours = {
    sea: computed.getPropertyValue("--globe-sea"),
    land: computed.getPropertyValue("--globe-land"),
    coast: computed.getPropertyValue("--globe-coast"),
  };
  // Each story map, placed at each frame (draw).
  for (const view of [NOIR, ANSON, SCILLY]) {
    const map = (await parse(view.name)).documentElement;
    const camera = cameraData(map.getAttribute("data-camera"));
    const group = svgElement("g", { class: "region" }, regionLayer);
    // The whole <svg>, not its children: a nested svg clips to its slide,
    // so the land's cut and stroked edge, 20 px outside it, never shows.
    group.append(document.importNode(map, true));
    regionMaps.set(view, { camera, group });
  }
  const ansonMap = regionMaps.get(ANSON)?.group;
  drawPicture(
    ansonMap?.querySelector(".land")?.getAttribute("d") ??
      fail("no land in the Anson map"),
    ansonMap?.querySelector<SVGElement>(".islands") ?? null,
  );
  drawText();

  const choose =
    document.querySelector<HTMLSelectElement>("#style") ?? fail("no #style");
  for (const candidate of STYLES)
    choose.add(
      new Option(candidate.name, candidate.name, false, candidate === style),
    );
  choose.addEventListener("change", () => {
    params.set("style", choose.value);
    params.set("step", "0");
    location.search = params.toString();
  });
  // A dropdown for each choice (choices.ts), before the counter: the same
  // step, with the other name. A choice that the style does not use is
  // shown, disabled.
  const uses = (test: (text: Text) => boolean) =>
    style.steps.some((each) => each.texts.some(test));
  const applies: Readonly<Record<Choice, boolean>> = {
    wind: true,
    label: uses((text) => text.kind === "label"),
    old: uses((text) => text.stays === true),
    punch: uses((text) => text.kind === "punch"),
    start: true,
  };
  const counter = document.querySelector("#counter") ?? fail("no #counter");
  const offer = <C extends Choice>(choice: C): void => {
    const select = document.createElement("select");
    select.id = choice;
    const label = document.createElement("label");
    label.append(`${CHOICE_NAMES[choice]} `, select);
    counter.before(label);
    const now = chosen(choice);
    for (const name of CHOICES[choice])
      select.add(new Option(name, name, false, name === now));
    select.disabled = !applies[choice];
    select.addEventListener("change", () => {
      params.set(choice, select.value);
      location.search = params.toString();
    });
  };
  for (const choice of CHOICE_LIST) offer(choice);
  const step = (by: number): void => {
    const target = Math.min(
      style.steps.length - 1,
      Math.max(0, (current ?? 0) + by),
    );
    if (target !== current) show(target, by === 1 && !settle);
  };
  document.addEventListener("keydown", (event) => {
    if (event.key === "ArrowRight" || event.key === " ") step(1);
    if (event.key === "ArrowLeft") step(-1);
  });
  slide.addEventListener("click", () => {
    step(1);
  });
  window.addEventListener("resize", fit);
  fit();
  await document.fonts.ready;
  for (const { text, step: index, element: made } of shown) {
    const shows = style.steps[index]?.picture;
    if ((text.kind === "label" || text.kind === "count") && shows !== undefined)
      made.classList.toggle("on-sea", overSea(made, landTest(shows)));
    if (text.leader !== undefined)
      drawLeader(
        made,
        text.about ?? fail(`a leader with no place: ${text.html}`),
        text.leader,
      );
  }
  // the hidden marks and text get their style before the first step shows them
  slide.getBoundingClientRect();
  const first = Math.min(
    style.steps.length - 1,
    Number(params.get("step") ?? "0"),
  );
  show(first, first === 0 && !settle);
  window.mock = {
    ready: true,
    steps: style.steps.length,
    measure,
    go: (target, animate = false) => show(target, animate),
    land: () => {
      const shows = style.steps[current ?? 0]?.picture;
      const land = shows === undefined ? undefined : landOf(shows)[0];
      return land?.getAttribute("d") ?? null;
    },
    frames: () =>
      flightFrames
        .slice(1)
        .map((at, index) => at - (flightFrames[index] ?? at)),
  };
}

start().catch((error: unknown) => {
  document.body.prepend(String(error));
  throw error;
});
