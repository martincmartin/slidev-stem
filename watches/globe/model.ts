// The globe of the talk, made once at load from globe/earth.json, and the
// matrices that each frame needs: the disc turns to face the camera
// (docs/globe.md, "The globe").

import { towardCamera } from "../webgl/renderer.ts";
import type { CameraAngles, Group, Mesh, Piece, View } from "../webgl/scene.ts";
import type { Matrix4 } from "../webgl/math.ts";
import earthFile from "./earth.json" with { type: "json" };
import { parseEarth } from "./earth.ts";
import { DISC_GROUP, discMatrix, globeMeshes } from "./globe.ts";
import { globeViews } from "./views.ts";

/** The globe's part of a scene. */
export interface Globe {
  readonly meshes: readonly Mesh[];
  readonly groups: readonly Group[];
  readonly views: readonly View[];
  readonly piece: Piece;
}

/** The globe, for a slide `width` px wide. */
export function makeGlobe(width: number): Globe {
  const { meshes, piece } = globeMeshes(parseEarth(earthFile));
  return { meshes, groups: [DISC_GROUP], views: globeViews(width), piece };
}

/** The matrix of each of the globe's groups, for a frame whose camera is at
 *  `angles`. */
export function globeMatrices(angles: CameraAngles): Map<Group, Matrix4> {
  return new Map([[DISC_GROUP, discMatrix(towardCamera(angles))]]);
}
