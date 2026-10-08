// Where the inks' colours come from: the theme's CSS variables, as a slide's
// classes change them (a palette class, docs/theme.md). Nothing else in the
// watch knows a colour's value, so a theme change reaches the watch with no
// other step.

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

/** The start of the name of each of the theme's variables. */
export const ROLE_PREFIX = "--palette-";

/** What `getComputedStyle` gives. */
export interface Variables {
  getPropertyValue(name: string): string;
}

/** What `getComputedStyle` gives, with the name of each property. */
export interface ListedVariables extends Variables, Iterable<string> {}

/** The theme's variables, as a slide's classes change them. */
export interface SlidePalette {
  /** The colours for a renderer. */
  readonly palette: Palette;
  /** Each ROLE_PREFIX variable and its value, to set on an element outside
   *  the slide (a layer for the whole talk). Each `var()` is worked out, so a
   *  recipe gives the same colour on any element. */
  readonly variables: Readonly<Record<string, string>>;
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

/** Each ROLE_PREFIX variable of `variables`, and its value. */
export function readVariables(
  variables: ListedVariables,
): Record<string, string> {
  const found = Object.fromEntries(
    [...variables]
      .filter((name) => name.startsWith(ROLE_PREFIX))
      .map((name) => [name, variables.getPropertyValue(name).trim()]),
  );
  check(
    PAPER_VARIABLE in found,
    `the browser lists no ${PAPER_VARIABLE} among the theme's variables`,
  );
  return found;
}

/** The classes in a slide's `class:` frontmatter: a string of classes, or a
 *  list of them. */
export function slideClasses(slideClass: unknown): string[] {
  if (slideClass === undefined || slideClass === null) return [];
  const list = typeof slideClass === "string" ? [slideClass] : slideClass;
  check(
    Array.isArray(list) &&
      list.every((item: unknown): item is string => typeof item === "string"),
    `a slide's class is a string or a list of strings, not ${JSON.stringify(slideClass)}`,
  );
  return list.flatMap((item) => item.split(/\s+/)).filter(Boolean);
}

/** Convert a computed `color(srgb ...)` to opaque, eight-bit sRGB.
 *  Clamp channels outside the sRGB range, as an sRGB canvas does. */
export function srgbHex(computedColour: string): string {
  const match = /^color\(srgb\s+([^/]+?)(?:\s*\/\s*([^/]+))?\)$/.exec(
    computedColour,
  );
  const channels = match?.[1]?.trim().split(/\s+/).map(Number) ?? [];
  check(
    channels.length === 3 && channels.every(Number.isFinite),
    `the browser returned an invalid sRGB colour: ${computedColour}`,
  );
  check(
    Number(match?.[2] ?? 1) === 1,
    `the theme's value ${computedColour} is not an opaque colour`,
  );
  return `#${channels
    .map((channel) =>
      Math.round(Math.max(0, Math.min(1, channel)) * 255)
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Resolve a CSS recipe with computed style. Canvas reads can contain noise
 *  in private browsing, so they cannot give the theme's exact colours. */
function browserHex(cssColour: string): string {
  const probe = document.createElement("span");
  probe.hidden = true;
  probe.style.setProperty(
    "color",
    `color(from ${cssColour} srgb r g b)`,
    "important",
  );
  check(
    probe.style.color !== "",
    `the theme's value ${cssColour} is not a colour`,
  );
  document.body.append(probe);
  try {
    return srgbHex(getComputedStyle(probe).color);
  } finally {
    probe.remove();
  }
}

/** The palette of a slide whose `class:` frontmatter is `slideClass`: the
 *  theme's, as those classes change it. Slidev puts a slide's classes on its
 *  `.slidev-layout`, and the theme sets its variables there, so this reads
 *  them from a hidden element with that class and the slide's, which it adds
 *  to the page and takes away. With no class, it is the theme's palette. */
export function slidePalette(slideClass?: unknown): SlidePalette {
  const probe = document.createElement("div");
  probe.className = ["slidev-layout", ...slideClasses(slideClass)].join(" ");
  probe.hidden = true;
  document.body.append(probe);
  try {
    const style = getComputedStyle(probe);
    return {
      palette: readPalette(style, browserHex),
      variables: readVariables(style),
    };
  } finally {
    probe.remove();
  }
}
