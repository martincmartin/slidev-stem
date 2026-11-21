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
// other change: at once). Take the time from `now`, never from the page's
// clock or a frame's time: it stands while the figure is paused. Set
// `busyUntil` when a change ends: a playing figure waits for it, and a paused
// figure's time runs to it, so that a step plays and then stands. While
// `jumps` is true, a step is a jump. Draw only while `moving` is true, and
// once after any other change (a control's), and nothing while `near` is
// false. A layer may add controls (a slider, a button) to `controls`; the
// article draws them under the figure. Set `still` while nothing in the figure moves
// by itself: the article then shows no pause button. A layer that draws a
// 3D picture may let the reader turn it by a drag: it sets `turner` while
// its picture can turn (see `FigureTurner`).
//
// IN A FIGURE OF A PICTURE (the talk's `pictureBox` gives a box), the slide's
// text is hidden: only elements with the class `in-figure` (a callout's
// label) show over the picture. The crop widens to hold the `in-figure`
// elements, the slide's and those of the talk's global layers (which are
// never hidden). Where the talk gives no box, a slide's
// `in-figure` elements are its picture (a painting): the figure is cropped
// to them. IN A FIGURE OF THE WHOLE SLIDE (no box, and nothing `in-figure`),
// the slide's text shows, but not its title. docs/article.md has the reasons.

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

/** The reader's turn of a figure's 3D picture, which the talk's layer gives.
 *  The article owns the drag: on a drag over the figure, it calls `turn`,
 *  with a drag across the whole figure as 180°. It shows a "Reset view"
 *  button while `turned`, and hides the slide's own content (the labels,
 *  whose leaders would point at nothing). The layer clamps the turn and
 *  draws it. A step keeps the turn, after the step's own camera; the layer
 *  ends it where its picture cannot turn. In a figure that plays its steps,
 *  a turn holds the tour, and a press of a step's button ends the turn
 *  (`reset`). docs/article.md, "Turning a figure". */
export interface FigureTurner {
  /** Turn by `yaw` and `pitch` degrees (+: the near side goes right, and
   *  down: the way the reader drags), as far as the picture lets it. */
  turn(yaw: number, pitch: number): void;
  /** Go back to the step's own view: an ease, or at once with `atOnce`
   *  (a reader who asks for reduced motion). `turned` is false once the
   *  picture is back. */
  reset(atOnce: boolean): void;
  /** Whether the picture is turned from the step's own view. */
  readonly turned: Readonly<Ref<boolean>>;
}

export interface FigureContext {
  /** The click that the figure shows now. */
  readonly clicks: Readonly<Ref<number>>;
  /** Whether the figure is on or near the screen. */
  readonly near: Readonly<Ref<boolean>>;
  /** The part of the slide that the figure shows, in slide px: a layer
   *  need draw no more. */
  readonly crop: Readonly<Ref<Box>>;
  /** The figure's time (ms): the page's clock while the figure plays; it
   *  stands while the figure is paused, but for a run to `busyUntil`
   *  (clock.ts). */
  readonly now: () => number;
  /** Whether the figure's time runs. */
  readonly moving: Readonly<Ref<boolean>>;
  /** Whether a step is a jump: the figure is paused for a reader who asks
   *  for reduced motion. */
  readonly jumps: Readonly<Ref<boolean>>;
  /** When the change at the current click ends (ms, the figure's time). */
  readonly busyUntil: Ref<number>;
  /** The controls that the talk's layer adds. */
  readonly controls: Ref<readonly FigureControl[]>;
  /** Whether nothing in the figure moves by itself (false until the talk's
   *  layer says so). */
  readonly still: Ref<boolean>;
  /** The reader's turn of the picture, while the talk's layer lets the
   *  reader turn it; `null` while it does not. */
  readonly turner: Ref<FigureTurner | null>;
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
   *  it, and the slide's text is hidden. `null`: the figure is cropped to the
   *  slide's `in-figure` elements, or, with none, is the whole slide, with
   *  its text. */
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
