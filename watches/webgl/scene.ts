// The types of a scene: what the renderer draws, and what the stage asks for.
// Nothing here knows what the scene shows.

export type Vec3 = [number, number, number];

/** A palette colour; `opacity` is over the paper. */
export interface Colour {
  hex: string;
  opacity: number;
}

/** `width` is in CSS px on the screen, at every zoom. */
export interface LineStyle {
  colour: string;
  opacity: number;
  width: number;
}

/** Always drawn. */
export interface Line {
  points: Vec3[];
  closed: boolean;
  style: LineStyle;
}

/** Drawn only where the view turns the surface. */
export interface SilhouetteEdge {
  start: Vec3;
  end: Vec3;
  normalBefore: Vec3;
  normalAfter: Vec3;
  style: LineStyle;
}

/** A disc in plan, in slide px. */
export interface Disc {
  centre: [number, number];
  radius: number;
}

/** Its matrix comes with each frame. */
export interface Group {
  name: string;
  parent: Group | null;
}

export interface Mesh {
  name: string;
  /** The part's name, for reports only. */
  part: string;
  group: Group | null;
  /** `null`: lines only (a decal). */
  fill: Colour | null;
  /** x, y, z of each vertex, three vertices a triangle. */
  triangles: Float32Array;
  lines: Line[];
  silhouetteEdges: SilhouetteEdge[];
  /** Not drawn inside these discs, at any height. */
  hiddenInside: Disc[];
  /** Lines are drawn in increasing `lineOrder`. */
  lineOrder: number;
  /** `false` for a part that the 2D drawing did not have. */
  inDrawing: boolean;
  /** `true` if its geometry changes each frame. */
  dynamic: boolean;
}

export interface View {
  name: string;
  scale: number;
  shift: [number, number];
  pivot: Vec3;
}

export interface Subject {
  name: string;
  meshes: Set<Mesh>;
}

export interface Scene {
  slide: [number, number];
  paper: string;
  meshes: Mesh[];
  groups: Group[];
  views: View[];
  subjects: Subject[];
}

/** What the renderer takes for each frame. */
export interface Frame {
  /** Or an eased mix of two views. */
  view: View;
  /** Degrees. */
  tilt: number;
  /** 4 x 4, column-major; the model computes them. */
  groupMatrices: Map<Group, Float32Array>;
  /** A fade: these meshes stay. */
  keep?: Set<Mesh>;
  /** The opacity of all other meshes, 0 to 1 (default 1). */
  rest?: number;
  /** Device px. */
  size: [number, number];
  /** Leave out the meshes with `inDrawing` false. */
  drawingOnly?: boolean;
}
