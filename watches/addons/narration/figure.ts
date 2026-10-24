// What the article (views/ArticlePage.vue) and a talk's own layers say to
// each other. The article draws each figure as the slide at a click, with the
// talk's global and slide layers (Slidev's print component); a layer that
// finds `FIGURE` knows that it draws a figure, not the talk's live slide, and
// which click to show. The talk gives the article its rules with
// `ARTICLE_HOOKS` (in its setup/main.ts); without them, each slide is one
// figure, the whole slide at its last click.
//
// CONTRACT for a talk's layer in a figure: draw the slide's state at
// `clicks`, and follow it when it changes (a step: the step's moves; any
// other change: at once). Draw nothing while `paused` is true or `near` is
// false. Set `busyUntil` when a change ends, so that a playing figure waits
// for it. A layer may add controls (a slider, a button) to `controls`; the article
// draws them under the figure. Set `still` while nothing in the figure moves
// by itself: the article then shows no pause button.
//
// IN A FIGURE OF A PICTURE (the talk's `pictureBox` gives a box), the slide's
// text is hidden: only elements with the class `in-figure` (a callout's
// label) show over the picture. docs/article.md has the reasons.

import type { InjectionKey, Ref } from "vue";

/** A box on the slide, in slide px. */
export interface Box {
  readonly left: number;
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
}

/** A slider under a figure: `value` runs from 0 to 1, from the `start`
 *  label to the `end` label. `release`, if given, is called when the reader
 *  lets go of the thumb (the input's `change`: a pointer's release, or a
 *  key's step). */
export interface FigureSlider {
  readonly kind: "slider";
  readonly label: string;
  readonly start: string;
  readonly end: string;
  readonly value: Ref<number>;
  readonly release?: () => void;
}

/** A button under a figure that the reader presses to make a thing happen,
 *  and presses again to undo it. `pressed` is false at first; each press
 *  turns it over. The button says `label` while `pressed` is false, and
 *  `undo` while it is true. */
export interface FigureButton {
  readonly kind: "button";
  readonly label: string;
  readonly undo: string;
  readonly pressed: Ref<boolean>;
}

export type FigureControl = FigureSlider | FigureButton;

export interface FigureContext {
  /** The click that the figure shows now. */
  readonly clicks: Readonly<Ref<number>>;
  /** Whether the figure is on or near the screen. */
  readonly near: Readonly<Ref<boolean>>;
  /** Whether the figure is paused: by the reader, or by "pause all". */
  readonly paused: Readonly<Ref<boolean>>;
  /** When the change at the current click ends (ms, `performance.now`). */
  readonly busyUntil: Ref<number>;
  /** The controls that the talk's layer adds. */
  readonly controls: Ref<readonly FigureControl[]>;
  /** Whether nothing in the figure moves by itself (false until the talk's
   *  layer says so). */
  readonly still: Ref<boolean>;
}

export const FIGURE: InjectionKey<FigureContext> = Symbol("narration:figure");

/** A talk's rules for its figures. `frontmatter` is a slide's. */
export interface ArticleHooks {
  /** The clicks that get a figure by default, in order. `total`: the
   *  slide's clicks. */
  defaultFigures(frontmatter: Record<string, unknown>, total: number): number[];
  /** A key for the picture at a click: two equal keys draw the same picture;
   *  `null` for a slide with no picture of its own. */
  pictureKey(
    frontmatter: Record<string, unknown>,
    clicks: number,
  ): string | null;
  /** Where the picture is on the slide at a click: the figure is cropped to
   *  it, and the slide's text is hidden. `null`: the figure is the whole
   *  slide, with its text. */
  pictureBox(frontmatter: Record<string, unknown>, clicks: number): Box | null;
  /** A key for the camera at a click: the figures of one slide whose clicks
   *  share a key get one crop, so that the picture keeps its place and size
   *  from figure to figure. `null`: the figure's crop is its own. */
  frameKey(frontmatter: Record<string, unknown>, clicks: number): string | null;
}

export const ARTICLE_HOOKS: InjectionKey<ArticleHooks> =
  Symbol("narration:hooks");

/** The rules without a talk's: one figure for each slide, at its last
 *  click, the whole slide. */
export const DEFAULT_HOOKS: ArticleHooks = {
  defaultFigures: (_frontmatter, total) => [total],
  pictureKey: () => null,
  pictureBox: () => null,
  frameKey: () => null,
};
