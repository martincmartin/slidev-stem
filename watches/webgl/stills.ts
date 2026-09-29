// Stills: one hidden canvas and renderer for every still of a page, so that a
// page with many stills (print, the overview) has one WebGL context for
// them. Slidev mounts the layer once for each printed page, and one context a
// page passes the browser's limit.

import { Renderer } from "./renderer.ts";
import type { Scene } from "./scene.ts";

const renderers = new Map<Scene, Renderer>();
const stills = new Map<string, Promise<string>>();

/** A picture as an object URL. `key` says what the picture is: the same key
 *  gives the same picture, drawn once. `draw` draws it with the renderer. */
export function stillOf(
  scene: Scene,
  key: string,
  draw: (renderer: Renderer) => void,
): Promise<string> {
  const known = stills.get(key);
  if (known) return known;
  let renderer = renderers.get(scene);
  if (!renderer) {
    renderer = new Renderer(document.createElement("canvas"), scene);
    renderers.set(scene, renderer);
  }
  draw(renderer);
  // Read the picture back at once, before anything else draws.
  const canvas = renderer.canvas;
  const picture = new Promise<string>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(URL.createObjectURL(blob));
      else reject(new Error("no still"));
    }, "image/png");
  });
  stills.set(key, picture);
  return picture;
}

export function stillsInfo(scene: Scene): {
  stills: number;
  contextsLost: number;
} {
  return {
    stills: stills.size,
    contextsLost: renderers.get(scene)?.contextsLost ?? 0,
  };
}
