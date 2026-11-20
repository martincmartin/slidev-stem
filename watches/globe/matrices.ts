// The matrices of the globe's groups at each frame: the disc turns to face
// the camera (docs/globe.md, "The globe"), and the Longitude From Time
// slide's noon line and clock follow it. Apart from model.ts, so that a page
// gets them without the Earth's data.

import { towardCamera } from "../webgl/renderer.ts";
import type { CameraAngles, Group } from "../webgl/scene.ts";
import type { Matrix4 } from "../webgl/math.ts";
import { DISC_GROUP, discMatrix } from "./globe.ts";
import { noonMatrices } from "./noon.ts";
import type { SlidePoint } from "./noon.ts";

/** The matrix of each of the globe's groups, for a frame whose camera is at
 *  `angles`, with the Longitude From Time slide's clock at `clockAt`
 *  (`noonMatrices`). */
export function globeMatrices(
  angles: CameraAngles,
  clockAt: SlidePoint,
): Map<Group, Matrix4> {
  return new Map([
    [DISC_GROUP, discMatrix(towardCamera(angles))],
    ...noonMatrices(angles, clockAt),
  ]);
}
