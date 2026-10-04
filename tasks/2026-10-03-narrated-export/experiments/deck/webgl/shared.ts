// One renderer for many live figures on one page: one WebGL context, and one
// copy of the scene's buffers, however many figures show the scene. Each
// figure is a view: a 2D canvas, with its own timeline and model. At each
// animation frame, the renderer draws each visible view on its own hidden
// canvas, and the view copies the picture (`drawImage`). A view off the
// screen is not drawn. Bartosz Ciechanowski's articles work this way.
//
// This is the follow-up's prototype (PLAN.md, "Live slides inside the
// article"): it copies Stage's frame (stage.ts) for many views.

import { check } from "./checked.ts";
import { Renderer } from "./renderer.ts";
import { FLASH_INKS } from "./scene.ts";
import type { Palette, Scene } from "./scene.ts";
import type { Model } from "./stage.ts";
import { deviceSize } from "./stage.ts";
import { Timeline } from "./timeline.ts";
import type { StageState } from "./timeline.ts";

/** A figure's picture: its canvas, its timeline and its model. */
export class SharedView<ModelState> {
  readonly canvas: HTMLCanvasElement;
  readonly model: Model<ModelState>;
  readonly timeline = new Timeline();
  readonly context: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement, model: Model<ModelState>) {
    const context = canvas.getContext("2d");
    check(context !== null, "the canvas has a context of another kind");
    this.canvas = canvas;
    this.model = model;
    this.context = context;
  }

  /** As Stage.show. */
  show(state: StageState, modelState: ModelState, instantly = false): void {
    const now = performance.now();
    const atOnce = instantly || !this.timeline.hasState;
    this.timeline.show(state, now, atOnce);
    this.model.show(modelState, now, atOnce);
  }
}

export class SharedStage<ModelState> {
  readonly renderer: Renderer;
  /** Each view, and whether it is on (or near) the screen. */
  private readonly views = new Map<SharedView<ModelState>, boolean>();
  private readonly observer: IntersectionObserver;
  private request: number | null = null;
  private disposed = false;

  constructor(scene: Scene, palette: Palette) {
    this.renderer = new Renderer(document.createElement("canvas"), scene, palette);
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          for (const view of this.views.keys()) {
            if (view.canvas === entry.target) this.views.set(view, entry.isIntersecting);
          }
        }
      },
      { rootMargin: "100px" },
    );
  }

  /** Draw the view at each animation frame while it is on the screen. */
  add(view: SharedView<ModelState>): void {
    check(!this.disposed, "the stage is disposed");
    check(view.timeline.hasState, "show a state before the view is added");
    this.views.set(view, false);
    this.observer.observe(view.canvas);
    this.request ??= requestAnimationFrame(this.frame);
  }

  remove(view: SharedView<ModelState>): void {
    this.views.delete(view);
    this.observer.unobserve(view.canvas);
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

  private draw(view: SharedView<ModelState>, now: number): void {
    const values = view.timeline.valuesAt(now);
    const flashing = view.timeline.flashingAt(now);
    const size = deviceSize(view.canvas);
    this.renderer.render({
      view: values.view,
      tilt: values.tilt,
      groupMatrices: view.model.frame(now, this.renderer),
      ...(values.subject ? { keep: values.subject.meshes } : {}),
      rest: values.rest,
      ...(flashing ? { recolour: { meshes: flashing.meshes, inks: FLASH_INKS } } : {}),
      size,
    });
    const [width, height] = size;
    if (view.canvas.width !== width || view.canvas.height !== height) {
      view.canvas.width = width;
      view.canvas.height = height;
    }
    view.context.drawImage(this.renderer.canvas, 0, 0);
  }

  private readonly frame = (now: number): void => {
    this.request = null;
    for (const [view, visible] of this.views) {
      if (visible) this.draw(view, now);
    }
    this.request = requestAnimationFrame(this.frame);
  };
}
