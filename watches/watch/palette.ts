// Where the inks' colours come from: the theme's CSS variables, read when the
// page loads. Nothing else in the watch knows a
// colour's value, so a theme change reaches the watch with no other step.

import { check } from "../webgl/checked.ts";
import type { InkName, Palette } from "../webgl/scene.ts";

/** The theme's variable that gives each ink its colour (docs/theme.md, "The
 *  roles"). */
export const INK_VARIABLES: Readonly<Record<InkName, string>> = {
  subject: "--palette-subject",
  subjectWash: "--palette-subject-wash",
  muted: "--palette-muted",
  mutedWash: "--palette-muted-wash",
  ink: "--palette-ink",
  second: "--palette-second",
  secondWash: "--palette-second-wash",
};

export const PAPER_VARIABLE = "--palette-background";

/** What `getComputedStyle` gives. */
export interface Variables {
  getPropertyValue(name: string): string;
}

/** A CSS colour as `#rrggbb`. A theme's value may be a recipe, such as
 *  `color-mix(in srgb, #736a60 18%, #faf7f0)`, which only a browser can
 *  work out. */
export type ToHex = (cssColour: string) => string;

/** The palette that a theme's variables give, each value made `#rrggbb` by
 *  `toHex`. The renderer throws on any other form. */
export function readPalette(variables: Variables, toHex: ToHex): Palette {
  const read = (name: string): string => {
    const value = variables.getPropertyValue(name).trim();
    check(value !== "", `the theme does not set ${name}`);
    return toHex(value);
  };
  const inks = Object.fromEntries(
    Object.entries(INK_VARIABLES).map(([ink, name]) => [ink, read(name)]),
  ) as Record<InkName, string>;
  return { paper: read(PAPER_VARIABLE), ...inks };
}

/** The browser's `#rrggbb` for a CSS colour: it paints one pixel in it and
 *  reads the pixel back, so a recipe gives the colour that the screen shows.
 *  A value that is not a colour leaves the pixel clear, and that throws. */
function browserHex(cssColour: string): string {
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("no 2D canvas to read the theme's colours");
  // a fillStyle that is not a colour is ignored, so start from clear
  context.fillStyle = "rgb(0 0 0 / 0)";
  context.fillStyle = cssColour;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0, alpha = 0] = context.getImageData(
    0,
    0,
    1,
    1,
  ).data;
  check(
    alpha === 255,
    `the theme's value ${cssColour} is not an opaque colour`,
  );
  return `#${[red, green, blue].map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** The palette of the theme that is on the page now. The theme sets its
 *  variables on `.slidev-layout`, so this reads them from an element of that
 *  class, which it adds to the page and takes away. */
export function themePalette(): Palette {
  const probe = document.createElement("div");
  probe.className = "slidev-layout";
  probe.hidden = true;
  document.body.append(probe);
  try {
    return readPalette(getComputedStyle(probe), browserHex);
  } finally {
    probe.remove();
  }
}
