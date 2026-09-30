// Stills: pictures of a scene, drawn by one hidden canvas and renderer, as
// object URLs. A page with many stills (print, the overview) needs only one
// WebGL context for them: one context for each still passes the browser's
// limit. The caller decides how many `Stills` to make and when to dispose
// them.

import { check } from "./checked.ts";
import { Renderer } from "./renderer.ts";
import type { Palette, Scene } from "./scene.ts";

export class Stills {
  readonly scene: Scene;
  readonly palette: Palette;
  /** Made at the first still. */
  private renderer: Renderer | null = null;
  private readonly pictures = new Map<string, Promise<string>>();
  /** The object URLs made, to revoke. */
  private readonly urls = new Set<string>();
  private disposed = false;

  constructor(scene: Scene, palette: Palette) {
    this.scene = scene;
    this.palette = palette;
  }

  /** A picture as an object URL. `key` says what the picture is: the same key
   *  gives the same picture, drawn once. `draw` draws it with the renderer. */
  of(key: string, draw: (renderer: Renderer) => void): Promise<string> {
    check(!this.disposed, "the stills are disposed");
    const known = this.pictures.get(key);
    if (known) return known;
    this.renderer ??= new Renderer(
      document.createElement("canvas"),
      this.scene,
      this.palette,
    );
    const renderer = this.renderer;
    draw(renderer);
    // Read the picture back at once, before anything else draws: toBlob
    // copies the canvas now, and encodes it later.
    const picture = new Promise<string>((resolve, reject) => {
      renderer.canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("no still"));
        } else if (this.disposed) {
          reject(new Error("the stills were disposed"));
        } else {
          const url = URL.createObjectURL(blob);
          this.urls.add(url);
          resolve(url);
        }
      }, "image/png");
    });
    this.pictures.set(key, picture);
    return picture;
  }

  /** Free the renderer and revoke every URL: images that show them go blank.
   *  Calling it again does nothing. */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    if (this.renderer) {
      this.renderer.dispose();
      // The canvas is this object's own: free its context now, not when the
      // canvas is collected (a page may have only 16 or so contexts).
      this.renderer.canvas
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext();
      this.renderer = null;
    }
    for (const url of this.urls) URL.revokeObjectURL(url);
    this.urls.clear();
    this.pictures.clear();
  }
}
