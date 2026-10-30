// The Longitude Act's prizes as a picture: how far ½° and 1° of longitude
// reach, along the parallel of the venue. One frame, the last click; ?sea=paper
// leaves the sea unfilled. The Act measures the error as a distance on a great
// circle: 1° is 60 nautical miles, about 69 statute miles, in any latitude.
import "../../../../themes/house/styles/fonts.css";
import { NEW_ENGLAND, project } from "./geo.ts";
import type { LonLat, Point } from "./geo.ts";

const SVG = "http://www.w3.org/2000/svg";
const slide = document.querySelector<HTMLElement>("#slide");
if (slide === null) throw new Error("no #slide");
slide.classList.toggle(
  "sea-paper",
  new URLSearchParams(location.search).get("sea") === "paper",
);

/** Approximate places, to a hundredth of a degree. */
const TOWNS: readonly { name: string; at: LonLat; side: "left" | "right" }[] = [
  { name: "Worcester", at: [-71.8, 42.26], side: "right" },
  { name: "Springfield", at: [-72.59, 42.1], side: "right" },
  { name: "Provincetown", at: [-70.19, 42.06], side: "right" },
];
const HERE = project(NEW_ENGLAND, NEW_ENGLAND.centre);
/** Slide px for a distance along the parallel: near the map's centre, a
 *  nautical mile is a minute of latitude in every direction. */
const pxForDegrees = (degrees: number) => degrees * NEW_ENGLAND.scale;

function svg(
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

function label(html: string, [x, y]: Point, className = "text label"): void {
  const made = document.createElement("div");
  made.className = className;
  made.innerHTML = html;
  Object.assign(made.style, { left: `${String(x)}px`, top: `${String(y)}px` });
  slide?.append(made);
}

async function start(): Promise<void> {
  if (slide === null) return;
  const map = document.createElement("div");
  map.className = "layer";
  map.innerHTML = await (await fetch(`./maps/${NEW_ENGLAND.name}.svg`)).text();
  slide.append(map);
  const marks = svg("svg", { class: "layer", viewBox: "0 0 980 552" }, slide);
  // The two reaches: 1° (60 nautical miles) and ½° each way from here.
  for (const [degrees, className] of [
    [1, "reach wide"],
    [0.5, "reach"],
  ] as const) {
    const half = pxForDegrees(degrees);
    svg(
      "path",
      {
        class: className,
        d: `M${String(HERE[0] - half)},${String(HERE[1] - 12)}v24M${String(HERE[0] - half)},${String(HERE[1])}H${String(HERE[0] + half)}M${String(HERE[0] + half)},${String(HERE[1] - 12)}v24`,
      },
      marks,
    );
  }
  svg("circle", { class: "ship", cx: HERE[0], cy: HERE[1], r: 8 }, marks);
  for (const town of TOWNS) {
    const [x, y] = project(NEW_ENGLAND, town.at);
    svg("circle", { class: "town", cx: x, cy: y, r: 5 }, marks);
    label(
      town.name,
      [
        town.side === "right" ? x + 10 : x - 10 - town.name.length * 10.5,
        y - 12,
      ],
      "text label small",
    );
  }
  const h1 = document.createElement("h1");
  h1.className = "outlined";
  h1.textContent = "The Longitude Act, 1714";
  const subtitle = document.createElement("p");
  subtitle.className = "subtitle outlined";
  subtitle.textContent = "Find a ship's longitude at sea, and win";
  slide.append(h1, subtitle);
  label("You are here", [HERE[0] - 64, HERE[1] - 50]);
  label('Within 1°: £10,000<br><span class="aside">about $2.3 M today</span>', [
    HERE[0] + pxForDegrees(1) - 210,
    HERE[1] - 104,
  ]);
  label(
    'Within ½°: <em>£20,000</em><br><span class="aside">about $4.6 M today</span>',
    [HERE[0] - 150, HERE[1] + 66],
  );
  await document.fonts.ready;
  document.body.dataset["ready"] = "1";
}

start().catch((error: unknown) => {
  document.body.prepend(String(error));
  throw error;
});
