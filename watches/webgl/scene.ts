// The types of a scene: what the renderer draws, and what the stage asks for.
// Nothing here knows what the scene shows.
//
// A scene is read-only once it is made: the renderer reads it once, when it
// starts (and again after a context loss), and does not see later changes.
// The only geometry that changes is a dynamic mesh's, through
// `Renderer.updateMesh`. `readonly` cannot cover a `Float32Array`'s contents:
// do not write into a mesh's `triangles` either. `checkScene` checks what the
// renderer assumes.

import { check, checkFinite } from "./checked.ts";

export type Vec3 = readonly [number, number, number];

/** The house's art colours, by their jobs (docs/illustrations.md, and the
 *  roles in docs/theme.md): the five that a scene draws with, and the two
 *  that a flash draws with. This is the one list of them: `INKS` and
 *  `Palette` must each cover it. */
export type InkName =
  | "subject"
  | "subjectWash"
  | "muted"
  | "mutedWash"
  | "ink"
  | "second"
  | "secondWash";

/** A colour by its job, not its value. A scene's fills and lines point to one
 *  of `INKS`; a `Palette` says which colour each ink is when a renderer
 *  starts, so a scene does not change with the theme. */
export interface Ink {
  /** For reports and export; also the ink's field in a `Palette`. */
  readonly name: InkName;
}

export const INKS = {
  /** The subject's lines: its structure, and what moves. */
  subject: { name: "subject" },
  /** The subject's faces: solid, near the paper. */
  subjectWash: { name: "subjectWash" },
  /** What holds the subject: the frame, the case. */
  muted: { name: "muted" },
  /** The faces of what holds the subject. */
  mutedWash: { name: "mutedWash" },
  /** Detail: tick marks, at half opacity. */
  ink: { name: "ink" },
  /** A flash's lines: "look here". */
  second: { name: "second" },
  /** A flash's faces. */
  secondWash: { name: "secondWash" },
} as const satisfies Readonly<Record<InkName, Ink>>;

/** A flash (docs/illustrations.md, "Flash"): each ink of a flashed part, and
 *  the ink that it is drawn in while the flash is on. Each line goes to the
 *  second, and each wash to the second's wash. */
export const FLASH_INKS: ReadonlyMap<Ink, Ink> = new Map<Ink, Ink>([
  [INKS.subject, INKS.second],
  [INKS.muted, INKS.second],
  [INKS.ink, INKS.second],
  [INKS.subjectWash, INKS.secondWash],
  [INKS.mutedWash, INKS.secondWash],
]);

/** Return a second-coloured mark to subject inks for the first half-cycle. */
export const INVERSE_FLASH_INKS: ReadonlyMap<Ink, Ink> = new Map<Ink, Ink>([
  [INKS.second, INKS.subject],
  [INKS.secondWash, INKS.subjectWash],
]);

/** `#rrggbb` for the paper (what the scene is drawn on, and what a fill's
 *  opacity is over) and for each ink. */
export type Palette = Readonly<Record<InkName, string>> & {
  readonly paper: string;
};

/** An ink, and how much of it is over the paper. */
export interface Colour {
  readonly ink: Ink;
  readonly opacity: number;
}

/** `width` is in px of the slide (CSS px when the slide is shown at its own
 *  size), at every zoom of the camera. */
export interface LineStyle {
  readonly ink: Ink;
  readonly opacity: number;
  readonly width: number;
}

/** Always drawn. */
export interface Line {
  readonly points: readonly Vec3[];
  readonly closed: boolean;
  readonly style: LineStyle;
}

/** Drawn only where the view turns the surface. */
export interface SilhouetteEdge {
  readonly start: Vec3;
  readonly end: Vec3;
  readonly normalBefore: Vec3;
  readonly normalAfter: Vec3;
  readonly style: LineStyle;
}

/** A disc in plan, in world x and y (slide px), after the mesh's group
 *  matrix: it does not move with the mesh. */
export interface Disc {
  readonly centre: readonly [number, number];
  readonly radius: number;
  /** The group of the part that covers the disc. The disc hides only in a
   *  picture that draws a mesh of this group: when that part has faded out,
   *  what was under it shows. */
  readonly by: Group;
}

/** Its matrix comes with each frame. */
export interface Group {
  readonly name: string;
  /** For reports only: the renderer does not compose matrices. */
  readonly parent: Group | null;
}

/** The geometry of a mesh: all that `Renderer.updateMesh` changes. */
export interface MeshGeometry {
  /** x, y, z of each vertex, three vertices a triangle. */
  readonly triangles: Float32Array;
  readonly lines: readonly Line[];
  readonly silhouetteEdges: readonly SilhouetteEdge[];
}

export interface Mesh extends MeshGeometry {
  readonly name: string;
  /** The part's name, for reports only: the grouping of the 2D drawing that
   *  the mesh came from. It is not a piece (`Scene.pieces`): one part can
   *  hold several pieces, and their names can differ. */
  readonly part: string;
  readonly group: Group | null;
  /** `null`: lines only (a decal). */
  readonly fill: Colour | null;
  /** Not drawn inside these discs, at any height. */
  readonly hiddenInside: readonly Disc[];
  /** The order of the lines: a later mesh's lines cover an earlier one's. */
  readonly lineOrder: number;
  /** `false` for a part that the 2D drawing did not have. */
  readonly inDrawing: boolean;
  /** `true` for a mark on another mesh's surface: where its faces are at
   *  the same place as the other mesh's, its own show. The renderer moves
   *  its faces' depth a little toward the camera (a polygon offset). */
  readonly overlay: boolean;
  /** `true` if `Renderer.updateMesh` may change its geometry. */
  readonly dynamic: boolean;
}

export interface View {
  readonly name: string;
  readonly scale: number;
  readonly shift: readonly [number, number];
  readonly pivot: Vec3;
}

/** A named set of meshes: what a slide names to show a part of the scene. */
export interface Piece {
  readonly name: string;
  readonly meshes: ReadonlySet<Mesh>;
  /** `false` for a piece that shows only where a slide names it, such as a
   *  mark on another piece: `watch: all` leaves it out. */
  readonly inAll: boolean;
}

export interface Scene {
  /** Width and height, in slide px. */
  readonly slide: readonly [number, number];
  readonly meshes: readonly Mesh[];
  readonly groups: readonly Group[];
  readonly views: readonly View[];
  readonly pieces: readonly Piece[];
}

/** What the renderer takes for each frame. */
export interface Frame {
  /** Or an eased mix of two views. */
  readonly view: View;
  /** Degrees. */
  readonly tilt: number;
  /** The world matrix of each group that a drawn mesh has: 4 x 4,
   *  column-major, affine. The renderer does not compose `Group.parent`. */
  readonly groupMatrices: ReadonlyMap<Group, Float32Array>;
  /** A fade: these meshes stay (default: none). */
  readonly keep?: ReadonlySet<Mesh>;
  /** The opacity of all other meshes, 0 to 1 (default 1). */
  readonly rest?: number;
  /** Only these meshes (and those in `keep`) show at `rest` and above, and no
   *  other mesh is drawn: the meshes that fade in or out. Default: every
   *  mesh. */
  readonly fade?: ReadonlySet<Mesh>;
  /** Device px, whole numbers. */
  readonly size: readonly [number, number];
  /** Leave out the meshes with `inDrawing` false. */
  readonly drawingOnly?: boolean;
  /** Draw these meshes with other inks: each ink that `inks` has goes to its
   *  value (a flash: `FLASH_INKS`). Default: every mesh in its own inks. */
  readonly recolour?: Recolour;
  /** Dimmed meshes: the weight of each one's own colours, 0 to 1, against
   *  the paper. Each face and line colour is `weight x colour + (1 - weight)
   *  x paper`, so a dimmed part looks as it would at that opacity over the
   *  paper, but it still hides what is under it. Default: none. */
  readonly dim?: ReadonlyMap<Mesh, number>;
}

export interface Recolour {
  readonly meshes: ReadonlySet<Mesh>;
  readonly inks: ReadonlyMap<Ink, Ink>;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** A `#rrggbb` colour as red, green and blue, 0 to 1. */
export function hexRgb(hex: string): Vec3 {
  check(HEX.test(hex), `${hex} is not a #rrggbb colour`);
  const value = parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
}

function checkOpacity(opacity: number, what: string): void {
  check(
    opacity >= 0 && opacity <= 1,
    `${what}: opacity ${String(opacity)} is outside 0..1`,
  );
}

const ALL_INKS: ReadonlySet<Ink> = new Set(Object.values(INKS));

export function checkInk(ink: Ink, what: string): void {
  check(ALL_INKS.has(ink), `${what}: the ink ${ink.name} is not one of INKS`);
}

function checkStyle(style: LineStyle, what: string): void {
  checkInk(style.ink, what);
  checkOpacity(style.opacity, what);
  check(
    Number.isFinite(style.width) && style.width > 0,
    `${what}: line width ${String(style.width)}`,
  );
}

/** Throw unless the geometry is what the renderer can draw. */
export function checkGeometry(geometry: MeshGeometry, what: string): void {
  check(
    geometry.triangles.length % 9 === 0,
    `${what}: ${String(geometry.triangles.length)} triangle values is not whole triangles`,
  );
  checkFinite(geometry.triangles, `${what}'s triangles`);
  for (const line of geometry.lines) {
    check(
      line.points.length >= (line.closed ? 3 : 2),
      `${what}: a line of ${String(line.points.length)} points`,
    );
    for (const point of line.points) checkFinite(point, `${what}'s line`);
    checkStyle(line.style, what);
  }
  for (const edge of geometry.silhouetteEdges) {
    for (const vector of [edge.start, edge.end]) {
      checkFinite(vector, `${what}'s silhouette edge`);
    }
    for (const normal of [edge.normalBefore, edge.normalAfter]) {
      checkFinite(normal, `${what}'s silhouette normal`);
      check(Math.hypot(...normal) > 0, `${what}: a zero silhouette normal`);
    }
    checkStyle(edge.style, what);
  }
}

/** Throw unless the scene is what the renderer assumes. */
export function checkScene(scene: Scene): void {
  const [width, height] = scene.slide;
  check(width > 0 && height > 0, "the slide has no area");
  checkFinite(scene.slide, "the slide");
  const groups = new Set(scene.groups);
  check(groups.size === scene.groups.length, "a group is listed twice");
  for (const group of scene.groups) {
    check(
      group.parent === null || groups.has(group.parent),
      `${group.name}'s parent is not in the scene`,
    );
  }
  const meshes = new Set(scene.meshes);
  check(meshes.size === scene.meshes.length, "a mesh is listed twice");
  for (const mesh of scene.meshes) {
    check(
      mesh.group === null || groups.has(mesh.group),
      `${mesh.name}'s group is not in the scene`,
    );
    if (mesh.fill) {
      checkInk(mesh.fill.ink, mesh.name);
      checkOpacity(mesh.fill.opacity, mesh.name);
    }
    for (const disc of mesh.hiddenInside) {
      checkFinite([...disc.centre, disc.radius], `${mesh.name}'s disc`);
      check(
        disc.radius > 0,
        `${mesh.name}: a disc of radius ${String(disc.radius)}`,
      );
      check(
        groups.has(disc.by),
        `${mesh.name}: a disc's group is not in the scene`,
      );
    }
    checkFinite([mesh.lineOrder], `${mesh.name}'s line order`);
    checkGeometry(mesh, mesh.name);
  }
  // slides name the views and the pieces
  for (const [kind, named] of [
    ["view", scene.views],
    ["piece", scene.pieces],
  ] as const) {
    const names = new Set(named.map((item) => item.name));
    check(names.size === named.length, `two ${kind}s have one name`);
  }
  for (const view of scene.views) {
    checkFinite([view.scale, ...view.shift, ...view.pivot], view.name);
    check(view.scale > 0, `${view.name}: scale ${String(view.scale)}`);
  }
  for (const piece of scene.pieces) {
    for (const mesh of piece.meshes) {
      check(
        meshes.has(mesh),
        `${piece.name}: ${mesh.name} is not in the scene`,
      );
    }
  }
}

/** Throw unless each colour of the palette is `#rrggbb`. */
export function checkPalette(palette: Palette): void {
  hexRgb(palette.paper);
  for (const ink of ALL_INKS) hexRgb(palette[ink.name]);
}
