// One renderer for many live pictures on one page (the article's figures):
// one WebGL context, and one copy of the scene's buffers on the GPU, however
// many figures show the scene. A browser keeps about 16 WebGL contexts on a
// page, so a context for each figure fails past that
// (../../docs/export.md).
//
// Each figure is a view: a 2D canvas, with its own timeline, model and time
// (`now`: the figure's, which stands while the figure is paused), as a
// stage has. At each animation frame, the renderer draws each view that is
// on the screen, and not paused, on its own hidden canvas, and the view
// copies the picture (`drawImage`). Bartosz Ciechanowski's "Mechanical
// Watch" works this way. A view near the screen (NEAR_SCREEN) but not on it
// is drawn once when it comes near, so that it has a picture when it comes
// on. A view farther off is not drawn: its model's time goes on, so it shows
// the present when it comes back. A paused view is drawn once after each
// change (`redraw`).
//
// ALL THE VIEWS OF A FRAME, THEN ALL THE COPIES. Each view of a frame has a
// place of its own on the hidden canvas (a sheet, atlas.ts). The renderer
// draws them all, and then each view copies its own place. Firefox for
// Android, at times, copied the picture before the last one: the Gear Train
// slide's figure at click 4 showed, at times, the figure before it, at
// click 3, which has the same size and no case. Now a copy can only be the
// same view's. Firefox also reads the canvas back to copy it, and does so
// once for a frame, not once for each view.
//
// A VIEW DRAWS ITS CROP. A figure shows a part of its slide (`crop`), and
// its canvas covers just that part, so that the renderer draws and Firefox
// copies no pixel that the figure does not show. Not an oversight: a canvas
// over the whole slide was up to 2.8 times as large
// (tasks/2026-10-27-firefox-figure-copies).
//
// A view's frame is the stage's (`drawFrame`, stage.ts), so a figure draws
// what the talk's stage would, with marks: meshes in the flash's colours for
// as long as they show.
//
// The shared stage draws while it has views. `remove` takes a view away;
// `dispose` stops it and frees the renderer.

import { pack } from "./atlas.ts";
import { at, check } from "./checked.ts";
import { Renderer } from "./renderer.ts";
import type { Place } from "./renderer.ts";
import type { Mesh, Palette, Scene, SlideRect } from "./scene.ts";
import { deviceSize, drawFrame } from "./stage.ts";
import type { Model } from "./stage.ts";
import { Timeline } from "./timeline.ts";
import type { StageState } from "./timeline.ts";

/** px: how near the screen a view must be to be drawn once, before it
 *  comes on. */
const NEAR_SCREEN = "200px";
/** Device px: the largest sheet that holds several views. WebGL2 promises
 *  2048, and the GPUs that draw the article give 8192 or more. */
const SHEET_LIMIT = 4096;

/** A figure's picture: its canvas, its timeline and its model. */
export class SharedView<ModelState> {
  readonly canvas: HTMLCanvasElement;
  readonly model: Model<ModelState>;
  readonly timeline = new Timeline();
  /** Drawn in the flash's colours while they show. */
  marked: ReadonlySet<Mesh> = new Set();
  /** The colours that the view draws in: its slide's palette. */
  palette: Palette;
  /** The part of the slide that the view shows, which its canvas covers.
   *  `null`: the whole slide. */
  crop: SlideRect | null = null;
  /** The view's time (ms). */
  readonly now: () => number;
  private readonly context: CanvasRenderingContext2D;
  /** Whether the view's time stands: it keeps its picture until a change
   *  (`redraw`). Its last frame may be up to a frame before the time stood:
   *  it is not drawn again, as a frame can take 0.4 s without a GPU, and
   *  the prerender pauses all the figures before each still. */
  paused = false;
  /** Whether the view must be drawn although its time stands. */
  private changed = true;

  constructor(
    canvas: HTMLCanvasElement,
    model: Model<ModelState>,
    palette: Palette,
    now: () => number,
  ) {
    const context = canvas.getContext("2d");
    check(context !== null, "the canvas has a context of another kind");
    this.canvas = canvas;
    this.model = model;
    this.palette = palette;
    this.now = now;
    this.context = context;
  }

  /** As `Stage.show`: go to a state, at once or by the timeline's moves. */
  show(state: StageState, modelState: ModelState, instantly = false): void {
    const now = this.now();
    const atOnce = instantly || !this.timeline.hasState;
    this.timeline.show(state, now, atOnce);
    this.model.show(modelState, now, atOnce, this.timeline.endAt(now));
    this.redraw();
  }

  /** Draw the view at the next frame, even if it is paused: its state or
   *  its model changed. */
  redraw(): void {
    this.changed = true;
  }

  /** Whether the next frame draws the view, if it is near the screen. */
  get due(): boolean {
    return !this.paused || this.changed;
  }

  /** When the change ends (ms, the view's time), with its flash and the
   *  model's story, or now if it has. */
  endAt(): number {
    const now = this.now();
    return Math.max(this.timeline.endAt(now), this.model.endAt?.(now) ?? now);
  }

  /** The canvas's size in device px. */
  size(): [number, number] {
    return deviceSize(this.canvas);
  }

  /** Draw with `renderer` at the view's time, `size` device px, at `place`
   *  on the renderer's canvas. */
  draw(renderer: Renderer, size: [number, number], place: Place): void {
    drawFrame(renderer, this.timeline, this.model, this.now(), size, {
      marked: this.marked,
      place,
      ...(this.crop ? { crop: this.crop } : {}),
    });
    this.changed = false;
  }

  /** Copy the picture of `size` device px at `at` on `source` to this
   *  view's canvas. */
  copy(
    source: HTMLCanvasElement,
    [width, height]: [number, number],
    [left, top]: readonly [number, number],
  ): void {
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.context.clearRect(0, 0, width, height);
    this.context.drawImage(
      source,
      left,
      top,
      width,
      height,
      0,
      0,
      width,
      height,
    );
  }
}

/** Where a view is, as the observers last said, and whether it has been
 *  drawn since it came near the screen. */
interface Sight {
  near: boolean;
  onScreen: boolean;
  drawnNear: boolean;
}

export class SharedStage<ModelState> {
  readonly renderer: Renderer;
  private readonly views = new Map<SharedView<ModelState>, Sight>();
  private readonly nearObserver: IntersectionObserver;
  private readonly screenObserver: IntersectionObserver;
  private request: number | null = null;
  private disposed = false;
  /** The palette that the renderer draws in now. */
  private palette: Palette;

  constructor(scene: Scene, palette: Palette) {
    this.palette = palette;
    this.renderer = new Renderer(
      document.createElement("canvas"),
      scene,
      palette,
    );
    const observer = (
      margin: string,
      see: (sight: Sight, seen: boolean) => void,
    ): IntersectionObserver =>
      new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            for (const [view, sight] of this.views) {
              if (view.canvas === entry.target)
                see(sight, entry.isIntersecting);
            }
          }
        },
        { rootMargin: margin },
      );
    this.nearObserver = observer(NEAR_SCREEN, (sight, near) => {
      if (near && !sight.near) sight.drawnNear = false;
      sight.near = near;
    });
    this.screenObserver = observer("0px", (sight, onScreen) => {
      sight.onScreen = onScreen;
    });
  }

  /** Draw the view at each animation frame while it is on the screen, and
   *  once when it comes near it. Show it a state first. */
  add(view: SharedView<ModelState>): void {
    check(!this.disposed, "the shared stage is disposed");
    check(view.timeline.hasState, "show a state before the view is added");
    this.views.set(view, { near: false, onScreen: false, drawnNear: false });
    this.nearObserver.observe(view.canvas);
    this.screenObserver.observe(view.canvas);
    this.request ??= requestAnimationFrame(this.frame);
  }

  /** Stop drawing the view. Removing it again does nothing. */
  remove(view: SharedView<ModelState>): void {
    if (!this.views.delete(view)) return;
    this.nearObserver.unobserve(view.canvas);
    this.screenObserver.unobserve(view.canvas);
    if (this.views.size === 0 && this.request !== null) {
      cancelAnimationFrame(this.request);
      this.request = null;
    }
  }

  /** Stop, and free the renderer. Calling it again does nothing. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.request !== null) cancelAnimationFrame(this.request);
    this.request = null;
    this.nearObserver.disconnect();
    this.screenObserver.disconnect();
    this.views.clear();
    this.renderer.dispose();
  }

  private readonly frame = (): void => {
    this.request = null;
    const due = [...this.views]
      .filter(
        ([view, sight]) =>
          sight.near && view.due && (sight.onScreen || !sight.drawnNear),
      )
      .map(([view, sight]) => ({ view, sight, size: view.size() }));
    for (const sheet of pack(
      due.map(({ size }) => size),
      SHEET_LIMIT,
    )) {
      const drawn: {
        view: SharedView<ModelState>;
        size: [number, number];
        corner: Place["at"];
      }[] = [];
      for (const { index, at: corner } of sheet.places) {
        const { view, sight, size } = at(due, index);
        try {
          if (view.palette !== this.palette) {
            this.renderer.setPalette(view.palette);
            this.palette = view.palette;
          }
          view.draw(this.renderer, size, { canvas: sheet.size, at: corner });
          sight.drawnNear = true;
          drawn.push({ view, size, corner });
        } catch (error) {
          // as a stage does: a view whose frame throws stops; the others go on
          console.error(error);
          this.remove(view);
        }
      }
      for (const { view, size, corner } of drawn) {
        view.copy(this.renderer.canvas, size, corner);
      }
    }
    if (this.views.size > 0) this.request = requestAnimationFrame(this.frame);
  };
}
