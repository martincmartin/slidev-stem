// The Noon Comes Later slide, as one still (PLAN.md, section 18): the globe
// from above the North Pole, with the Sun fixed and the Earth turned.
//   noon.html?sun=bottom|left&tilt=DEGREES&hours=0|2&markLat=DEGREES&compass=1
//     &marks=all|story|every45|none
// `sun` is where the Sun is, `tilt` how far the camera leans from over the
// pole, and `hours` how long the Earth has turned since noon in London.
// `markLat` is where each meridian's degree mark starts, and `compass` adds
// W or E to it. `marks` is which meridians have one: `story` is the three that
// the Earth's turn crosses, from London to the ship.
import "../../../../themes/house/styles/fonts.css";
import { axesOf, EARTH_RADIUS, seen, SLIDE, unit } from "./geo.ts";
import type { Axes, Camera, LonLat, Point, Vector } from "./geo.ts";
import { Globe, globeData } from "./globe.ts";
import type { Colours } from "./globe.ts";

const LONDON: LonLat = [-0.1, 51.5];
const SHIP: LonLat = [-30, 51.5];
/** Degrees that the Earth turns in an hour: also between two meridians. */
const DEGREES_AN_HOUR = 15;
/** Degrees between the points of a meridian or a parallel. */
const LINE_STEP = 1;
/** The top of the words' column, in slide px. */
const WORDS_TOP = 130;

/** Each place for the Sun: where the globe and the Sun are on the slide, and
 *  how far east of the noon meridian the camera is, which puts noon on the
 *  Sun's side of the globe. */
const LAYOUTS = {
  bottom: {
    radius: 200,
    at: [294, 278] as Point,
    sun: [294, 562] as Point,
    eastOfNoon: 0,
    wordsLeft: 530,
  },
  left: {
    radius: 231,
    at: [300, 309] as Point,
    sun: [-10, 309] as Point,
    eastOfNoon: 90,
    wordsLeft: 560,
  },
} as const;
const SUN_RADIUS = 42;
const RAY_LENGTH = 24;

const parameters = new URLSearchParams(location.search);
const layout = LAYOUTS[parameters.get("sun") === "left" ? "left" : "bottom"];
const tilt = Number(parameters.get("tilt") ?? 15);
const hours = Number(parameters.get("hours") ?? 0);
const markLat = Number(parameters.get("markLat") ?? 70);
const compass = parameters.get("compass") === "1";
const MARKS = {
  all: () => true,
  story: (lon: number) => lon === 0 || lon === -15 || lon === -30,
  every45: (lon: number) => lon % 45 === 0,
  none: () => false,
} as const;
const marks = MARKS[(parameters.get("marks") ?? "all") as keyof typeof MARKS];
/** The longitude where it is noon now: the Earth has turned east under the
 *  Sun, so noon has moved west. */
const noonLon = -DEGREES_AN_HOUR * hours;

const slide = document.querySelector<HTMLElement>("#slide");
if (slide === null) throw new Error("no #slide");

const dot = (a: Vector, b: Vector) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

function strokeLine(
  context: CanvasRenderingContext2D,
  camera: Camera,
  places: readonly LonLat[],
): void {
  context.beginPath();
  let drawing = false;
  for (const where of places) {
    const [x, y, facing] = seen(camera, where);
    if (facing < 0) {
      drawing = false;
    } else if (drawing) {
      context.lineTo(x, y);
    } else {
      context.moveTo(x, y);
      drawing = true;
    }
  }
  context.stroke();
}

function meridian(lon: number): LonLat[] {
  const places: LonLat[] = [];
  for (let lat = 90; lat >= -90; lat -= LINE_STEP) places.push([lon, lat]);
  return places;
}

/** The half of the globe away from the Sun: the limb's half on that side,
 *  and the half ellipse of the line between day and night. */
function shadeNight(context: CanvasRenderingContext2D, axes: Axes): void {
  const sun = unit([noonLon, 0]);
  const across = dot(axes.x, sun) / axes.radius;
  const down = dot(axes.y, sun) / axes.radius;
  const towardViewer = dot(axes.z, sun);
  const angle = Math.atan2(down, across);
  context.beginPath();
  context.arc(
    axes.at[0],
    axes.at[1],
    axes.radius,
    angle + Math.PI / 2,
    angle + (3 * Math.PI) / 2,
  );
  context.ellipse(
    axes.at[0],
    axes.at[1],
    axes.radius * Math.max(0, towardViewer),
    axes.radius,
    angle,
    (3 * Math.PI) / 2,
    Math.PI / 2,
    true,
  );
  context.closePath();
  context.fill();
}

function drawSun(context: CanvasRenderingContext2D, axes: Axes): void {
  const [sunX, sunY] = layout.sun;
  context.beginPath();
  context.arc(sunX, sunY, SUN_RADIUS, 0, 2 * Math.PI);
  context.fill();
  // Short rays, in the Sun's direction, from the Sun to the limb
  const length = Math.hypot(axes.at[0] - sunX, axes.at[1] - sunY);
  const [along, side]: [Point, Point] = [
    [(axes.at[0] - sunX) / length, (axes.at[1] - sunY) / length],
    [-(axes.at[1] - sunY) / length, (axes.at[0] - sunX) / length],
  ];
  context.beginPath();
  // Within the Sun's width, all one length, each starting just off its edge
  for (const offset of [-34, -17, 0, 17, 34]) {
    const start = Math.sqrt(SUN_RADIUS ** 2 - offset ** 2) + 6;
    const end = start + RAY_LENGTH;
    context.moveTo(
      sunX + along[0] * start + side[0] * offset,
      sunY + along[1] * start + side[1] * offset,
    );
    context.lineTo(
      sunX + along[0] * end + side[0] * offset,
      sunY + along[1] * end + side[1] * offset,
    );
  }
  context.stroke();
}

/** A meridian's degree mark: along the meridian, reading away from the pole
 *  or toward it, whichever is not upside down, and starting at `markLat`. */
function degreeMark(
  context: CanvasRenderingContext2D,
  camera: Camera,
  lon: number,
): void {
  const [x, y, facing] = seen(camera, [lon, markLat]);
  const [nextX, nextY] = seen(camera, [lon, markLat - 1]);
  if (facing < 0) return;
  const angle = Math.atan2(nextY - y, nextX - x);
  const upsideDown = Math.abs(angle) > Math.PI / 2;
  const degrees = Math.abs(lon);
  const side =
    compass && degrees !== 0 && degrees !== 180 ? (lon < 0 ? " W" : " E") : "";
  context.save();
  context.translate(x, y);
  context.rotate(upsideDown ? angle + Math.PI : angle);
  context.textAlign = upsideDown ? "right" : "left";
  context.textBaseline = "middle";
  context.strokeText(`${String(degrees)}°${side}`, 0, 0);
  context.fillText(`${String(degrees)}°${side}`, 0, 0);
  context.restore();
}

function label(html: string, [x, y]: Point, rightAligned = false): void {
  const made = document.createElement("div");
  made.className = "text label";
  made.innerHTML = html;
  Object.assign(made.style, {
    left: `${String(x)}px`,
    top: `${String(y)}px`,
    transform: rightAligned ? "translateX(-100%)" : "",
  });
  slide?.append(made);
}

async function start(): Promise<void> {
  if (slide === null) return;
  await document.fonts.load('600 17px "IBM Plex Sans"');
  const scale = window.devicePixelRatio;
  const canvas = document.createElement("canvas");
  canvas.className = "globe";
  canvas.width = SLIDE.width * scale;
  canvas.height = SLIDE.height * scale;
  Object.assign(canvas.style, { position: "absolute", inset: "0" });
  slide.append(canvas);
  const context = canvas.getContext("2d");
  if (context === null) throw new Error("no 2D context");
  context.scale(scale, scale);
  const computed = getComputedStyle(canvas);
  const colour = (name: string) => computed.getPropertyValue(name);
  const colours: Colours = {
    sea: colour("--globe-sea"),
    land: colour("--globe-land"),
    coast: colour("--globe-coast"),
  };
  const globe = new Globe(
    globeData(await (await fetch("./maps/globe.json")).json()),
  );
  const camera: Camera = {
    centre: [noonLon + layout.eastOfNoon, 90 - tilt],
    at: layout.at,
    kmPerPx: EARTH_RADIUS / layout.radius,
    angle: 0,
  };
  const axes = axesOf(camera);
  globe.draw(context, camera, colours);

  // The meridians, over the land and the sea alike
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.strokeStyle = colour("--palette-ink");
  context.lineWidth = 2;
  context.globalAlpha = 0.6;
  for (let lon = -180; lon < 180; lon += DEGREES_AN_HOUR)
    strokeLine(context, camera, meridian(lon));
  context.restore();

  context.save();
  context.fillStyle = colour("--palette-ink");
  context.globalAlpha = 0.3;
  shadeNight(context, axes);
  context.restore();

  // The noon line: on the globe, and on to the Sun
  context.save();
  context.lineCap = "round";
  context.strokeStyle = colour("--palette-second");
  context.fillStyle = colour("--palette-second");
  context.lineWidth = 4;
  strokeLine(context, camera, meridian(noonLon));
  context.lineWidth = 3;
  drawSun(context, axes);
  context.restore();

  // The two hours along the parallel, once the Earth has turned
  if (hours > 0) {
    const parallel: LonLat[] = [];
    for (let lon = SHIP[0]; lon <= LONDON[0]; lon += LINE_STEP)
      parallel.push([lon, LONDON[1]]);
    context.save();
    context.lineCap = "round";
    context.strokeStyle = colour("--palette-ink");
    context.lineWidth = 5;
    strokeLine(context, camera, parallel);
    context.restore();
  }

  context.save();
  context.font = '600 17px "IBM Plex Sans"';
  context.lineJoin = "round";
  context.lineWidth = 4;
  context.strokeStyle = colour("--palette-background");
  context.fillStyle = colour("--palette-ink");
  for (let lon = -165; lon <= 180; lon += DEGREES_AN_HOUR)
    if (marks(lon)) degreeMark(context, camera, lon);
  context.restore();

  const mark = (where: LonLat) => {
    const [x, y] = seen(camera, where);
    context.beginPath();
    context.arc(x, y, 6, 0, 2 * Math.PI);
    context.fill();
    context.lineWidth = 2;
    context.stroke();
    return [x, y] as const;
  };
  context.strokeStyle = colour("--palette-background");
  context.fillStyle = colour("--palette-ink");
  const [londonX, londonY] = mark(LONDON);
  context.fillStyle = colour("--palette-accent");
  const [shipX, shipY] = mark(SHIP);
  const shipLeft = shipX < londonX;
  label("London", [londonX + (shipLeft ? 12 : -12), londonY - 15], !shipLeft);
  label("Ship", [shipX - 12, shipY - 15], true);

  const h1 = document.createElement("h1");
  h1.textContent = "Noon Comes Later";
  slide.append(h1);
  const words = [
    ...(hours > 0
      ? [
          "Noon at the ship",
          `${String(hours)}:00 in London`,
          `${String(hours)} hours later: 30° west`,
        ]
      : ["12:00 in London", "Ship: not noon yet"]),
    "15° = 1 hour",
    "1° = 4 minutes",
  ];
  words.forEach((line, index) => {
    label(line, [layout.wordsLeft, WORDS_TOP + index * 44]);
  });
  await document.fonts.ready;
  document.body.dataset["ready"] = "1";
}

start().catch((error: unknown) => {
  document.body.prepend(String(error));
  throw error;
});
