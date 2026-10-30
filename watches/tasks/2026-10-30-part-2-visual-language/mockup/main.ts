// The mockup's page: one slide at Slidev's size, in one of the styles of
// story.ts, a step at a time. In the address:
//   ?style=rail|cards|lessig|labels&step=0&wind=bands|near|all&sea=paper&settle=1&notext=1
// → or space steps forward, with the picture's motion; ← steps back at once.
// The labels open with the ship at the bottom of the map; at the next step
// it sails north to the islands' latitude. `wind=near` adds a gust by the
// voyage, where no label is; `wind=all` draws the wind in the voyage's band
// too, under the labels. `settle` shows each step at once,
// with no motion, and `notext` hides the words: tools/shots.ts uses both.
// `window.mock` gives it the measurements.
import "../../../../themes/house/styles/fonts.css";
import { SLIDE } from "./geo.ts";
import type { Point } from "./geo.ts";
import { DAY, PICTURES, placesOn, STYLES } from "./story.ts";
import type { Picture, Style, Text } from "./story.ts";

const SVG = "http://www.w3.org/2000/svg";
const STATUTE_MILES_PER_NAUTICAL = 1.15078;

/** Seconds that each picture's change takes. The ship is at the bottom of
 *  the map as the slide opens, and then sails north to the latitude; each
 *  day at sea takes DAY seconds; the last hours, to the islands, take less
 *  than one. */
const CHANGE: Readonly<Record<Picture, number>> = {
  south: 0,
  start: 2,
  east: 2 * DAY,
  west: 9 * DAY,
  found: 0.8,
};
/** Seconds that text waits after the picture's change, as `after-watch`. */
const AFTER = 0.15;
const RAIL = { left: 630, top: 90, width: 332 } as const;

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
const WIND: Readonly<Record<string, readonly Gust[]>> = {
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

const params = new URLSearchParams(location.search);
const style: Style =
  STYLES.find((candidate) => candidate.name === params.get("style")) ??
  STYLES[0] ??
  fail("no styles");
const places = placesOn(style.view);
const settle = params.get("settle") === "1";
const windName = params.get("wind") ?? "bands";
const gusts = WIND[windName] ?? BANDS;

function fail(message: string): never {
  throw new Error(message);
}

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
  readonly until?: Picture;
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

const mapLayer = element("div", "layer", slide);
const marks: Mark[] = [];
const picture = svgElement(
  "svg",
  {
    class: "layer",
    viewBox: `0 0 ${String(SLIDE.width)} ${String(SLIDE.height)}`,
  },
  slide,
);

function addMark(
  mark: Omit<Mark, "delay" | "draws"> & Partial<Pick<Mark, "delay" | "draws">>,
): void {
  // hidden until the first step shows it, so that nothing flashes at load
  mark.element.classList.add("mark", "hidden");
  marks.push({ delay: 0, draws: false, ...mark });
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

function drawShip(): void {
  const sized = svgElement(
    "g",
    { transform: `scale(${String(SHIP_SCALE)})` },
    ship,
  );
  const facing = svgElement("g", { class: "ship-facing" }, sized);
  for (const [className, d] of SHIP_PARTS)
    svgElement("path", { class: className, d }, facing);
  svgElement("path", { class: "ship-flag", d: "M0,-50L13,-47L0,-44Z" }, sized);
}

/** The ship's route at each picture; the ship starts at its first point
 *  and ends at its last. The west leg runs due west, on the parallel of the
 *  sighting: south of the east leg, so that both show. The ship jumps there
 *  from the turn, with no track: the drop is the drawing's, not a course
 *  sailed. It sights the islands at the end of the west leg, and then sails
 *  to its anchorage. */
const ROUTES: Readonly<Record<Picture, readonly Point[]>> = {
  south: [places.entry, places.south],
  start: [places.south, places.start],
  east: [places.start, places.turn],
  west: [[places.turn[0], places.found[1]], places.found],
  found: [places.found, places.anchorage],
};
/** The legs that take days, with a dot at the end of each day. */
const DAYS: Partial<Readonly<Record<Picture, number>>> = { east: 2, west: 9 };
/** Which way the ship faces: 1 east, -1 west. A side view cannot face
 *  north, so it faces east as it sails in. */
const HEADING: Readonly<Record<Picture, number>> = {
  south: 1,
  start: 1,
  east: 1,
  west: -1,
  found: -1,
};

function drawPicture(landPath: string, islands: SVGElement | null): void {
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
    { d: landPath, fill: "black", stroke: "black", "stroke-width": 8 },
    mask,
  );

  // The wind, over the sea, from the first leg on.
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

  addMark({
    element: svgElement(
      "path",
      {
        class: "latitude",
        d: `M0,${String(places.start[1])}H${String(places.coast[0] - 4)}`,
      },
      picture,
    ),
    from: "start",
  });

  // A scale: 100 statute miles. A nautical mile is a minute of latitude, and
  // near the centre the map's scale is the same in every direction.
  const scale = svgElement("g", { class: "scale" }, picture);
  const length = (100 / STATUTE_MILES_PER_NAUTICAL / 60) * style.view.scale;
  svgElement("path", { d: `M36,512v8h${length.toFixed(1)}v-8` }, scale);
  const label = svgElement("text", { x: 36, y: 504 }, scale);
  label.textContent = "100 miles";
  addMark({ element: scale, from: "south" });

  // The voyage. When the ship moves on, a dot stays where it was.
  for (const shows of PICTURES) track(shows);
  // The islands show when the ship sights them.
  if (islands !== null) addMark({ element: islands, from: "found" });

  picture.append(ship);
  drawShip();
}

const placeShip = ([x, y]: Point) =>
  `translate(${String(x)}px, ${String(y)}px)`;

interface Shown {
  readonly text: Text;
  readonly step: number;
  readonly element: HTMLElement;
}

const shown: Shown[] = [];

function drawText(): void {
  if (style.title !== null) {
    element("h1", "outlined", slide).textContent = style.title;
    if (style.subtitle !== null)
      element("p", "subtitle outlined", slide).textContent = style.subtitle;
  }
  const rail = element("div", "rail-column", slide);
  Object.assign(rail.style, {
    left: `${String(RAIL.left)}px`,
    top: `${String(RAIL.top)}px`,
    width: `${String(RAIL.width)}px`,
  });
  const screen = element("div", "screen-panel", slide);
  style.steps.forEach((step, index) => {
    for (const text of step.texts) {
      const parent =
        text.kind === "rail" ? rail : text.kind === "screen" ? screen : slide;
      const made = element(
        "div",
        `text ${text.kind}${text.small === true ? " small" : ""} hidden`,
        parent,
      );
      // A screen's words are one block, centred on the slide.
      made.innerHTML =
        text.kind === "screen" ? `<div>${text.html}</div>` : text.html;
      if (text.at !== undefined)
        Object.assign(made.style, {
          left: `${String(text.at[0])}px`,
          top: `${String(text.at[1])}px`,
        });
      if (text.width !== undefined)
        made.style.width = `${String(text.width)}px`;
      shown.push({ text, step: index, element: made });
    }
  });
}

let current: number | null = null;

function show(target: number, animate: boolean): void {
  const step = style.steps[target] ?? fail(`no step ${String(target)}`);
  const now = PICTURES.indexOf(step.picture);
  const previousStep = current === null ? undefined : style.steps[current];
  const before =
    previousStep === undefined ? -1 : PICTURES.indexOf(previousStep.picture);
  const change = animate && now > before ? CHANGE[step.picture] : 0;
  slide.classList.toggle("jump", !animate);

  for (const mark of marks) {
    const from = PICTURES.indexOf(mark.from);
    const until =
      mark.until === undefined ? PICTURES.length : PICTURES.indexOf(mark.until);
    const visible = from <= now && now < until;
    const entering = animate && visible && from === now && before < from;
    mark.element.classList.toggle("hidden", !visible);
    mark.element.style.transitionDelay = entering
      ? `${String(mark.delay)}s`
      : "0s";
    if (mark.draws) {
      if (entering) {
        mark.element.style.transition = "none";
        mark.element.style.strokeDashoffset = "1";
        mark.element.getBoundingClientRect();
        mark.element.style.transition = `stroke-dashoffset ${String(CHANGE[mark.from])}s linear`;
      }
      mark.element.style.strokeDashoffset = visible ? "0" : "1";
    }
  }

  // The ship sails along its route, at the speed that the track draws, and
  // turns to face its course. At the start it comes in from below the slide.
  const route = ROUTES[step.picture];
  for (const running of ship.getAnimations()) running.cancel();
  ship.style.transform = placeShip(route.at(-1) ?? fail("an empty route"));
  if (change > 0) {
    const lengths = segments(route);
    const total = lengths.reduce((sum, length) => sum + length, 0);
    let travelled = 0;
    const frames = route.map((point, index) => {
      travelled += index === 0 ? 0 : (lengths[index - 1] ?? 0);
      return {
        transform: placeShip(point),
        offset: total === 0 ? index / (route.length - 1) : travelled / total,
      };
    });
    ship.animate(frames, { duration: change * 1000, easing: "linear" });
  }
  ship.classList.toggle("west", HEADING[step.picture] < 0);

  const screenShows = step.texts.some((text) => text.kind === "screen");
  const screen =
    slide.querySelector<HTMLElement>(".screen-panel") ?? fail("no screen");
  screen.classList.toggle("hidden", !screenShows);
  for (const { text, step: index, element: made } of shown) {
    const visible = style.keeps ? index <= target : index === target;
    made.classList.toggle("hidden", !visible);
    made.classList.toggle("dimmed", style.keeps && index < target);
    const arriving = animate && index === target;
    // A screen's words wait for the last screen's words to fade out; other
    // text waits for the picture's change.
    const wait =
      text.kind === "screen"
        ? previousStep?.texts.some((other) => other.kind === "screen") === true
          ? 0.4
          : 0
        : change > 0
          ? change + AFTER
          : 0;
    made.style.transitionDelay =
      arriving && visible ? `${String(wait)}s` : "0s";
  }
  current = target;
  params.set("step", String(target));
  history.replaceState(null, "", `?${params.toString()}`);
  const counter = document.querySelector("#counter");
  if (counter !== null)
    counter.textContent = `${style.name}: step ${String(target + 1)} of ${String(style.steps.length)}`;
  if (!animate) {
    slide.getBoundingClientRect();
    requestAnimationFrame(() => {
      slide.classList.remove("jump");
    });
  }
}

function fit(): void {
  const bar =
    document.querySelector("#bar")?.getBoundingClientRect().height ?? 0;
  const scale = Math.min(
    window.innerWidth / SLIDE.width,
    (window.innerHeight - bar) / SLIDE.height,
  );
  slide.style.transform = `scale(${String(scale)})`;
}

interface TextMeasure {
  readonly kind: string;
  readonly words: number;
  readonly fontSize: number;
  readonly dimmed: boolean;
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
  const frame = slide.getBoundingClientRect();
  const scale = frame.width / SLIDE.width;
  const texts: TextMeasure[] = [];
  for (const { text, element: made } of shown) {
    if (made.classList.contains("hidden")) continue;
    const rect = made.getBoundingClientRect();
    const box: [number, number, number, number] = [
      (rect.left - frame.left) / scale,
      (rect.top - frame.top) / scale,
      rect.width / scale,
      rect.height / scale,
    ];
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
      words: (made.textContent ?? "").split(/\s+/).filter((word) => word !== "")
        .length,
      fontSize: Number.parseFloat(getComputedStyle(made).fontSize),
      dimmed: made.classList.contains("dimmed"),
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
      go: (step: number, animate?: boolean) => void;
    };
  }
}

async function start(): Promise<void> {
  const response = await fetch(`./maps/${style.view.name}.svg`);
  mapLayer.innerHTML = await response.text();
  const landPath =
    mapLayer.querySelector(".land")?.getAttribute("d") ??
    fail("no land in the map");
  drawPicture(landPath, mapLayer.querySelector<SVGElement>(".islands"));
  drawText();

  const choose = document.querySelector<HTMLSelectElement>("#style");
  if (choose !== null) {
    for (const candidate of STYLES)
      choose.add(
        new Option(candidate.name, candidate.name, false, candidate === style),
      );
    choose.addEventListener("change", () => {
      params.set("style", choose.value);
      params.set("step", "0");
      location.search = params.toString();
    });
  }
  // The wind's placement: the same step, with the other wind.
  const chooseWind = document.querySelector<HTMLSelectElement>("#wind");
  if (chooseWind !== null) {
    for (const name of Object.keys(WIND))
      chooseWind.add(new Option(name, name, false, name === windName));
    chooseWind.addEventListener("change", () => {
      params.set("wind", chooseWind.value);
      location.search = params.toString();
    });
  }
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
  // the hidden marks and text get their style before the first step shows them
  slide.getBoundingClientRect();
  // At the first step, the ship sails in, as it would when the slide comes in.
  const first = Math.min(
    style.steps.length - 1,
    Number(params.get("step") ?? "0"),
  );
  show(first, first === 0 && !settle);
  window.mock = {
    ready: true,
    steps: style.steps.length,
    measure,
    go: (target, animate = false) => {
      show(target, animate);
    },
  };
}

start().catch((error: unknown) => {
  document.body.prepend(String(error));
  throw error;
});
