// One renderer for many live pictures on one page (the article's figures):
// one WebGL context, and one copy of the scene's buffers on the GPU, however
// many figures show the scene. A browser keeps about 16 WebGL contexts on a
// page, so a context for each figure fails past that
// (../../docs/export.md).
//
// Each figure is a view: a 2D canvas, with its own timeline, model and time
// (`now`: the figure's, which stands while the figure is paused), as a
// stage has. At each animation frame, the renderer draws each view that is
// on or near the screen, and not paused, on its own hidden canvas, and the
// view copies the picture (`drawImage`). Bartosz Ciechanowski's "Mechanical
// Watch" works this way. A view off the screen is not drawn: its model's
// time goes on, so it shows the present when it comes back. A paused view is
// drawn once after each change (`redraw`).
//
// A view's frame is the stage's (`drawFrame`, stage.ts), so a figure draws
// what the talk's stage would, with marks: meshes in the flash's colours for
// as long as they show.
//
// The shared stage draws while it has views. `remove` takes a view away;
// `dispose` stops it and frees the renderer.

import { check } from "./checked.ts";
import { Renderer } from "./renderer.ts";
import type { Mesh, Palette, Scene } from "./scene.ts";
import { deviceSize, drawFrame } from "./stage.ts";
import type { Model } from "./stage.ts";
import { Timeline } from "./timeline.ts";
import type { StageState } from "./timeline.ts";

/** px: how near the screen a view must be to be drawn. */
const NEAR_SCREEN = "200px";

/** A figure's picture: its canvas, its timeline and its model. */
export class SharedView<ModelState> {
  readonly canvas: HTMLCanvasElement;
  readonly model: Model<ModelState>;
  readonly timeline = new Timeline();
  /** Drawn in the flash's colours while they show. */
  marked: ReadonlySet<Mesh> = new Set();
  /** The colours that the view draws in: its slide's palette. */
  palette: Palette;
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

  /** Draw with `renderer` at the view's time, and copy the picture to this
   *  view's canvas. */
  draw(renderer: Renderer): void {
    const now = this.now();
    const size = deviceSize(this.canvas);
    drawFrame(renderer, this.timeline, this.model, now, size, this.marked);
    const [width, height] = size;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
    this.context.clearRect(0, 0, width, height);
    this.context.drawImage(renderer.canvas, 0, 0);
    this.changed = false;
  }
}

export class SharedStage<ModelState> {
  readonly renderer: Renderer;
  /** Each view, and whether it is on or near the screen. */
  private readonly views = new Map<SharedView<ModelState>, boolean>();
  private readonly observer: IntersectionObserver;
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
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          for (const view of this.views.keys()) {
            if (view.canvas === entry.target) {
              this.views.set(view, entry.isIntersecting);
            }
          }
        }
      },
      { rootMargin: NEAR_SCREEN },
    );
  }

  /** Draw the view at each animation frame while it is near the screen.
   *  Show it a state first. */
  add(view: SharedView<ModelState>): void {
    check(!this.disposed, "the shared stage is disposed");
    check(view.timeline.hasState, "show a state before the view is added");
    this.views.set(view, false);
    this.observer.observe(view.canvas);
    this.request ??= requestAnimationFrame(this.frame);
  }

  /** Stop drawing the view. Removing it again does nothing. */
  remove(view: SharedView<ModelState>): void {
    if (!this.views.delete(view)) return;
    this.observer.unobserve(view.canvas);
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
    this.observer.disconnect();
    this.views.clear();
    this.renderer.dispose();
  }

  private readonly frame = (): void => {
    this.request = null;
    for (const [view, near] of this.views) {
      if (!near || !view.due) continue;
      try {
        if (view.palette !== this.palette) {
          this.renderer.setPalette(view.palette);
          this.palette = view.palette;
        }
        view.draw(this.renderer);
      } catch (error) {
        // as a stage does: a view whose frame throws stops; the others go on
        console.error(error);
        this.remove(view);
      }
    }
    if (this.views.size > 0) this.request = requestAnimationFrame(this.frame);
  };
}
