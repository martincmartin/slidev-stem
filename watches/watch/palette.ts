// Where the inks' colours come from: the theme's CSS variables, read when the
// page loads. Nothing else in the watch knows a
// colour's value, so a theme change reaches the watch with no other step.

import { check } from "../webgl/checked.ts";
import type { InkName, Palette } from "../webgl/scene.ts";

/** The theme's variable that gives each ink its colour. */
export const INK_VARIABLES: Readonly<Record<InkName, string>> = {
  line: "--palette-art-line",
  frame: "--palette-muted",
  detail: "--palette-ink",
  knockout: "--palette-art-knockout",
};

export const PAPER_VARIABLE = "--palette-background";

/** What `getComputedStyle` gives. */
export interface Variables {
  getPropertyValue(name: string): string;
}

/** The palette that a theme's variables give. A variable's value must be
 *  `#rrggbb`: the renderer throws on any other form. */
export function readPalette(variables: Variables): Palette {
  const read = (name: string): string => {
    const value = variables.getPropertyValue(name).trim();
    check(value !== "", `the theme does not set ${name}`);
    return value;
  };
  return {
    paper: read(PAPER_VARIABLE),
    line: read(INK_VARIABLES.line),
    frame: read(INK_VARIABLES.frame),
    detail: read(INK_VARIABLES.detail),
    knockout: read(INK_VARIABLES.knockout),
  };
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
    return readPalette(getComputedStyle(probe));
  } finally {
    probe.remove();
  }
}
