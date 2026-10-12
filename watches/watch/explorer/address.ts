// The explorer's state in its address's hash, so that a reload or a link opens
// the same picture: the camera, what runs, the pose whose pieces are dimmed,
// the guides and the shown pieces. This file turns the state into a hash and
// back, with no page; explorer.ts applies what it decodes. A part of the hash
// that is wrong or missing decodes to `null`, and the other parts still
// apply: so a link from before a part existed still opens.

import type { Piece, Vec3 } from "../../webgl/scene.ts";
import type { WatchModelState } from "../model.ts";
import { modelState } from "../state.ts";
import type { DeckPose } from "./deck-poses.ts";

/** What runs: the mechanism freely at a speed-up (`watchLapse`), or a deck
 *  pose's motion, at its own speed-up. */
export type ExplorerMotion =
  | { readonly kind: "free"; readonly speedUp: number }
  | { readonly kind: "pose"; readonly pose: DeckPose };

/** The speed-up that `motion` runs at. */
export function speedUpOf(motion: ExplorerMotion): number {
  return motion.kind === "free" ? motion.speedUp : motion.pose.state.lapse;
}

/** The model's state for `motion`. */
export function motionState(motion: ExplorerMotion): WatchModelState {
  return motion.kind === "free"
    ? { settled: false, spin: null, mainspring: null, lapse: motion.speedUp }
    : modelState(motion.pose.state);
}

/** A pose's name, to show and in the address: its slide's title and click. */
export function poseName(pose: DeckPose): string {
  return `${pose.title} @${String(pose.click)}`;
}

/** The camera's numbers, as the address holds them (the page's `Camera`). */
export interface AddressCamera {
  readonly target: Vec3;
  readonly scale: number;
  readonly tilt: number;
  readonly turn: number;
}

/** The page's state, all of it, to encode. */
export interface ExplorerState {
  readonly camera: AddressCamera;
  readonly motion: ExplorerMotion;
  readonly dimmedBy: DeckPose | null;
  readonly guides: boolean;
  readonly shown: ReadonlySet<Piece>;
}

/** What an address holds: each part is `null` if it is missing or wrong. */
export interface Address {
  readonly camera: AddressCamera | null;
  readonly motion: ExplorerMotion | null;
  readonly dimmedBy: DeckPose | null;
  readonly guides: boolean;
  readonly shown: ReadonlySet<Piece> | null;
  /** The names in the address that name nothing, to report. */
  readonly unknown: readonly string[];
}

/** What an address can name: the page's pieces, the deck's poses, and the
 *  speed-ups and the zoom that the page offers. */
export interface AddressChoices {
  readonly pieces: readonly Piece[];
  readonly poses: readonly DeckPose[];
  readonly speedUps: readonly number[];
  readonly scaleRange: { readonly least: number; readonly most: number };
}

/** The hash for `state`, without its "#". */
export function encodeAddress(state: ExplorerState): string {
  const { camera, motion, dimmedBy } = state;
  const values = new URLSearchParams({
    tilt: camera.tilt.toFixed(2),
    turn: camera.turn.toFixed(2),
    scale: camera.scale.toPrecision(8),
    target: camera.target.map((value) => value.toFixed(3)).join(","),
  });
  if (motion.kind === "pose") values.set("pose", poseName(motion.pose));
  else values.set("speed", String(motion.speedUp));
  if (dimmedBy) values.set("dim", poseName(dimmedBy));
  values.set("guides", state.guides ? "1" : "0");
  values.set("show", [...state.shown].map((piece) => piece.name).join("|"));
  return values.toString();
}

/** What the hash `hash` (with or without its "#") holds. */
export function decodeAddress(hash: string, choices: AddressChoices): Address {
  const values = new URLSearchParams(hash.replace(/^#/, ""));
  const unknown: string[] = [];
  const poseNamed = (name: string | null): DeckPose | null => {
    if (!name) return null;
    const found = choices.poses.find((pose) => poseName(pose) === name);
    if (!found) unknown.push(`pose ${name}`);
    return found ?? null;
  };

  const showNames = values.get("show");
  let shown: Set<Piece> | null = null;
  if (showNames !== null) {
    shown = new Set();
    for (const name of showNames.split("|").filter((each) => each !== "")) {
      const piece = choices.pieces.find((candidate) => candidate.name === name);
      if (piece) shown.add(piece);
      else unknown.push(`piece ${name}`);
    }
  }

  // a pose's motion has its own speed-up
  const pose = poseNamed(values.get("pose"));
  const speedUp = Number(values.get("speed") ?? Number.NaN);
  const motion: ExplorerMotion | null = pose
    ? { kind: "pose", pose }
    : choices.speedUps.includes(speedUp)
      ? { kind: "free", speedUp }
      : null;

  return {
    camera: cameraOf(values, choices.scaleRange),
    motion,
    dimmedBy: poseNamed(values.get("dim")),
    guides: values.get("guides") !== "0",
    shown,
    unknown,
  };
}

function cameraOf(
  values: URLSearchParams,
  scaleRange: AddressChoices["scaleRange"],
): AddressCamera | null {
  const tilt = Number(values.get("tilt"));
  // an address from before the turn has none
  const turn = Number(values.get("turn") ?? 0);
  const scale = Number(values.get("scale"));
  const target = (values.get("target") ?? "").split(",").map(Number);
  const [x, y, z] = target;
  if (
    !values.has("tilt") ||
    !(scale >= scaleRange.least && scale <= scaleRange.most) ||
    target.length !== 3 ||
    x === undefined ||
    y === undefined ||
    z === undefined ||
    ![tilt, turn, x, y, z].every(Number.isFinite)
  ) {
    return null;
  }
  return { target: [x, y, z], scale, tilt, turn };
}
