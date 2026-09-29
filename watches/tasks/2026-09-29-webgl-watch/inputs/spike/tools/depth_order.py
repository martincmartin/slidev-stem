#!/usr/bin/env python3
"""Can one painter's order draw the extruded watch at every tilt? A check
with numbers.

    ../../../../.venv/bin/python3 depth_order.py          # in tools/: about 3 minutes

It extrudes the real drawing (../inputs/skeleton-watch.svg) into 3D, tilts
it about the x axis, and draws it with three painter's orders. A z-buffer
of the same pieces is the reference. Each order's error is the area where
it shows a surface that lies behind the nearest one. It writes
../evidence/depth_order.json and pictures in ../evidence/depth/.

THE MODEL. Each filled shape of the drawing becomes a solid: its fill region
extruded along z. The hairspring and the mainspring become ribbons: their
centre lines extruded, seen from both sides. A solid sits on top of every
solid drawn before it that it can touch as it turns, so the view from above
(tilt 0) is the drawing's own paint order. The dial side (chapter ring and
hands) sits on top of everything. One solid is added that the drawing lacks:
the balance staff, which rises through the hairspring's inner coil, so that
one solid passes through the height of another.

THE CAMERA. Tilt t turns the view from straight above (0) towards the
watch's 6 o'clock side (90 degrees). A point (x, y, z), with y down the
slide and z out of it, lands at screen (x, y cos t - z sin t), at depth
y sin t + z cos t (larger is nearer).

THE ORDERS.
- "centre, per quad": each front-facing edge of an outline becomes one quad,
  as proposed in instructions.md; quads and top faces are sorted by the
  depth of their centres, at each tilt.
- "centre, per run": the same with each x-monotone run of front-facing edges
  as one piece. For the hairspring, a run is the proposed half-coil.
- "slab": cut every solid at every height where a solid starts or ends.
  Draw the slabs from the bottom up. In a slab, draw the walls so that at
  each x the wall with the larger y comes later, then the top faces. The
  order does not depend on the tilt, so it is computed once.
"""

import heapq
import itertools
import json
import math
import pathlib
import time as clock
from collections.abc import Callable, Sequence
from dataclasses import dataclass, field
from enum import Enum

import numpy as np
from numpy.typing import NDArray
from PIL import Image
from watch_svg import (
    FROZEN_SVG,
    TASK,
    Element,
    Morph,
    Polyline,
    Shape,
    circle_path,
    flatten,
    read_shapes,
)

Floats = NDArray[np.float64]
EVIDENCE = TASK / "evidence"
PICTURES = EVIDENCE / "depth"
PIXEL = 0.5  # slide px per pixel of the depth images
DEPTH_TOLERANCE = 0.75  # a surface this close to the nearest one is not an error
TILTS = [*range(5, 90, 5), 89, 90]
STATIC_TIME = 0.37  # s: a pose with nothing at a keyframe
HAIRSPRING_ZOOM = 250 / 56  # the zoom task's hairspring view: balance radius 56 -> 250
LINE = "#143C6B"
KNOCKOUT = "#D3DCE3"


# ---- the solids ----------------------------------------------------------------------
class Stacking(Enum):
    ON_WHAT_IT_TOUCHES = "sits on each solid drawn before it that it can touch"
    ON_EVERYTHING = "sits on every solid drawn before it (the dial side)"
    WITH_BODY = "starts at the bottom of its part's first solid"


@dataclass(frozen=True)
class Recipe:
    """How one kind of shape becomes a solid."""

    thickness: float
    stacking: Stacking = Stacking.ON_WHAT_IT_TOUCHES
    ribbon: bool = False
    rise: float = 0.0  # for WITH_BODY: how far it rises above the body's top


@dataclass(eq=False)
class Part:
    name: str
    top_level: int  # its child of the drawing's root group
    body: Recipe  # its first filled shape
    circle: Recipe  # its other filled circles
    other: Recipe  # its other filled paths
    stroke: Recipe | None = None  # its unfilled paths, if they are solids
    driver: Part | None = None  # the wheel whose teeth turn this part's pinion


@dataclass(frozen=True)
class Meshing:
    """Heights for the train as a movement has them, in place of the
    stacking rules: each wheel sits on the wheel it drives, and each pinion
    is at the height of the wheel that drives it, so teeth and leaves mesh."""

    pinion_overhang: float  # how far a pinion rises above its driver's teeth
    cap: float  # how far an arbor's end rises above its pinion; 0: no end


MESHING = Meshing(pinion_overhang=0.0, cap=1.5)

WHEEL = {"body": Recipe(3.0), "circle": Recipe(1.5), "other": Recipe(4.0)}
BARREL = Part(
    "barrel",
    13,
    body=Recipe(5.0),
    circle=Recipe(5.0, Stacking.WITH_BODY, rise=1.5),
    other=Recipe(5.0),
    stroke=Recipe(5.0, Stacking.WITH_BODY, ribbon=True),
)
CENTRE_WHEEL = Part("centre wheel", 12, **WHEEL, driver=BARREL)
THIRD_WHEEL = Part("third wheel", 11, **WHEEL, driver=CENTRE_WHEEL)
FOURTH_WHEEL = Part("fourth wheel", 10, **WHEEL, driver=THIRD_WHEEL)
ESCAPE_WHEEL = Part("escape wheel", 9, **WHEEL, driver=FOURTH_WHEEL)
TRAIN = [ESCAPE_WHEEL, FOURTH_WHEEL, THIRD_WHEEL, CENTRE_WHEEL, BARREL]
PARTS = [
    *TRAIN,
    Part(
        "balance",
        14,
        body=Recipe(5.0),
        circle=Recipe(2.0),
        other=Recipe(3.0, Stacking.WITH_BODY),
    ),
    Part(
        "hairspring",
        15,
        body=Recipe(0.0),
        circle=Recipe(0.0),
        other=Recipe(0.0),
        stroke=Recipe(8.0, ribbon=True),
    ),
    Part("impulse jewel", 16, body=Recipe(3.0), circle=Recipe(3.0), other=Recipe(3.0)),
    Part("pallet fork", 17, body=Recipe(3.0), circle=Recipe(1.5), other=Recipe(3.0)),
    Part("seconds hand", 18, body=Recipe(1.5), circle=Recipe(1.0), other=Recipe(1.5)),
    Part(
        "chapter ring",
        19,
        body=Recipe(3.0, Stacking.ON_EVERYTHING),
        circle=Recipe(3.0),
        other=Recipe(3.0),
    ),
    Part(
        "hour hand",
        25,
        body=Recipe(1.5, Stacking.ON_EVERYTHING),
        circle=Recipe(1.0),
        other=Recipe(1.5),
    ),
    Part(
        "minute hand",
        26,
        body=Recipe(1.5, Stacking.ON_EVERYTHING),
        circle=Recipe(1.0),
        other=Recipe(1.5),
    ),
    Part(
        "centre pivot",
        27,
        body=Recipe(1.0, Stacking.ON_EVERYTHING),
        circle=Recipe(1.0),
        other=Recipe(1.0),
    ),
]
STAFF_RADIUS = 3.0
STAFF_ABOVE_SPRING = 4.0


@dataclass(eq=False)
class Solid:
    """An extruded shape. Its outline at a time comes from its SVG shape; the
    staff, which the drawing lacks, has a fixed outline."""

    name: str
    part: Part
    shape: Shape | None
    fixed: list[Polyline] | None
    bottom: float
    top: float
    ribbon: bool
    fill: str
    stroke_width: float

    def outline_at(self, time: float) -> list[Polyline]:
        if self.shape is not None:
            return self.shape.polylines_at(time)
        return self.fixed or []


def reach(shape: Shape) -> float:
    """How far the shape reaches from the point it turns about, at any time."""
    pivot = np.array(shape.pivot())
    times = (
        [0.0]
        if not isinstance(shape.outline, Morph)
        else list(np.linspace(0, shape.outline.duration, 25))
    )
    return max(
        float(np.hypot(*(line.points - pivot).T).max())
        for time in times
        for line in shape.polylines_at(time)
    )


def train_heights(
    part: Part,
    recipe: Recipe,
    body_of: dict[Part, Solid],
    pinion_of: dict[Part, Solid],
    meshing: Meshing,
) -> tuple[float, float] | None:
    """Bottom and top of a train solid under `meshing`, or None if the
    stacking rules place it. A wheel's shapes come in the generator's order:
    the wheel, its hub, its pinion, then its arbor's end."""
    if part not in TRAIN:
        return None
    if part not in body_of:
        driven = next((wheel for wheel in TRAIN if wheel.driver is part), None)
        base = 0.0 if driven is None else body_of[driven].top
        return base, base + recipe.thickness
    body = body_of[part]
    if part.driver is None:
        return None
    if recipe is part.other:
        top = body.top + part.driver.body.thickness + meshing.pinion_overhang
        return body.top, top
    if part not in pinion_of:
        return body.bottom, body.top  # the hub, flush with the wheel
    pinion = pinion_of[part]
    return pinion.top, pinion.top + meshing.cap


def build_solids(
    shapes: Sequence[Shape], meshing: Meshing | None = None
) -> list[Solid]:
    """The solids, bottom first within each part, in the drawing's order.
    With `meshing`, the train's heights follow it, not the stacking rules."""
    part_of = {part.top_level: part for part in PARTS}
    solids: list[Solid] = []
    discs: dict[Solid, tuple[float, float, float]] = {}  # solid -> centre x, y, reach
    body_of: dict[Part, Solid] = {}
    pinion_of: dict[Part, Solid] = {}
    for shape in shapes:
        part = part_of.get(shape.top_level)
        if part is None:
            continue
        paint = shape.paint
        is_circle = shape.element is Element.CIRCLE
        if paint.fill is not None and paint.fill_opacity == 1:
            recipe = (
                part.body
                if part not in body_of
                else part.circle
                if is_circle
                else part.other
            )
            if recipe.thickness == 0:
                continue
        elif (
            paint.fill is None
            and paint.stroke is not None
            and part.stroke is not None
            and not any(line.closed for line in shape.polylines_at(0.0))
        ):
            recipe = part.stroke
        else:
            continue
        centre_x, centre_y = shape.pivot()
        radius = reach(shape)
        heights = (
            None
            if meshing is None
            else train_heights(part, recipe, body_of, pinion_of, meshing)
        )
        if heights is not None:
            base, top = heights
            if top == base:
                continue
        elif recipe.stacking is Stacking.WITH_BODY:
            base = body_of[part].bottom
            top = (
                body_of[part].top + recipe.rise
                if recipe.rise
                else base + recipe.thickness
            )
        else:
            candidates = [
                solid
                for solid in solids
                if recipe.stacking is Stacking.ON_EVERYTHING
                or math.dist((centre_x, centre_y), discs[solid][:2])
                < radius + discs[solid][2]
            ]
            base = max((solid.top for solid in candidates), default=0.0)
            top = base + recipe.thickness
        solid = Solid(
            f"{part.name} {len([s for s in solids if s.part is part]) + 1}",
            part,
            shape,
            None,
            base,
            top,
            recipe.ribbon,
            paint.fill or KNOCKOUT,
            paint.stroke_width if paint.stroke is not None else 2.0,
        )
        solids.append(solid)
        discs[solid] = (centre_x, centre_y, radius)
        if part in body_of and recipe is part.other and part.driver is not None:
            pinion_of[part] = solid
        body_of.setdefault(part, solid)
    spring = next(solid for solid in solids if solid.part.name == "hairspring")
    hub = max((s for s in solids if s.part.name == "balance"), key=lambda s: s.top)
    assert spring.shape is not None
    arbor_x, arbor_y = spring.shape.pivot()
    staff = Solid(
        "balance staff (added)",
        spring.part,
        None,
        flatten(circle_path(arbor_x, arbor_y, STAFF_RADIUS)),
        hub.top,
        spring.top + STAFF_ABOVE_SPRING,
        False,
        KNOCKOUT,
        2.0,
    )
    solids.append(staff)
    return solids


# ---- walls and faces ---------------------------------------------------------------
@dataclass(eq=False)
class Run:
    """An x-monotone run of front-facing edges of one polyline of a solid,
    with x increasing. For the hairspring, a half-coil."""

    solid: Solid
    line: int  # which polyline of the solid's outline
    edges: list[int]  # which edges of that polyline, in order along x
    xs: Floats
    ys: Floats
    corners: NDArray[np.bool_]  # per point: a corner of the outline

    def inner_corners(self) -> list[int]:
        """The points inside the run, not at its ends, that are corners."""
        return [int(index) + 1 for index in np.nonzero(self.corners[1:-1])[0]]


@dataclass(eq=False)
class Wall:
    """A run, or one edge, between two heights."""

    solid: Solid
    xs: Floats
    ys: Floats
    bottom: float
    top: float
    run: Run | None = None  # the run it is part of, if it is a run


@dataclass(eq=False)
class Face:
    solid: Solid
    rings: list[Floats]
    height: float


Piece = Wall | Face


def inside_even_odd(points: Floats, rings: Sequence[Floats]) -> NDArray[np.bool_]:
    """Which points lie in the region the rings bound, by the even-odd rule."""
    inside = np.zeros(len(points), dtype=bool)
    for ring in rings:
        start, end = ring, np.roll(ring, -1, axis=0)
        point_x, point_y = points[:, 0][:, None], points[:, 1][:, None]
        spans = (start[:, 1] > point_y) != (end[:, 1] > point_y)
        with np.errstate(divide="ignore", invalid="ignore"):
            crossing_x = start[:, 0] + (point_y - start[:, 1]) * (
                end[:, 0] - start[:, 0]
            ) / (end[:, 1] - start[:, 1])
        inside ^= np.count_nonzero(spans & (point_x < crossing_x), axis=1) % 2 == 1
    return inside


def front_facing(solid: Solid, lines: Sequence[Polyline]) -> list[NDArray[np.bool_]]:
    """For each polyline, which of its edges face the camera at every tilt
    from 0 to 90 degrees: their outward normal points to +y. A ribbon shows
    both of its sides, so all its edges face the camera."""
    if solid.ribbon:
        return [
            np.ones(len(line.points) - (0 if line.closed else 1), dtype=bool)
            for line in lines
        ]
    rings = [line.points for line in lines if line.closed]
    result = []
    for line in lines:
        start = line.points
        end = np.roll(start, -1, axis=0) if line.closed else start[1:]
        start = start if line.closed else start[:-1]
        direction = end - start
        length = np.hypot(*direction.T)
        normal = (
            np.column_stack((-direction[:, 1], direction[:, 0]))
            / np.maximum(length, 1e-12)[:, None]
        )
        probe = (start + end) / 2 + 1e-3 * normal
        material_on_normal_side = inside_even_odd(probe, rings)
        outward_y = np.where(material_on_normal_side, -normal[:, 1], normal[:, 1])
        result.append((outward_y > 1e-9) & (length > 1e-9))
    return result


def runs_of(solid: Solid, lines: Sequence[Polyline]) -> list[Run]:
    """The solid's front-facing edges, cut where x turns back."""
    runs: list[Run] = []
    for line_index, (line, facing) in enumerate(
        zip(lines, front_facing(solid, lines), strict=True)
    ):
        points = line.points
        count = len(facing)
        dx = np.roll(points, -1, axis=0)[:count, 0] - points[:count, 0]
        sign = np.where(facing, np.sign(dx), 0).astype(int)
        groups: list[list[int]] = []
        for edge in range(count):
            if sign[edge] == 0:
                continue
            if (
                groups
                and groups[-1][-1] == edge - 1
                and sign[groups[-1][-1]] == sign[edge]
            ):
                groups[-1].append(edge)
            else:
                groups.append([edge])
        if (
            line.closed
            and len(groups) > 1
            and groups[0][0] == 0
            and groups[-1][-1] == count - 1
            and sign[0] == sign[count - 1]
        ):
            groups[0] = groups.pop() + groups[0]
        for group in groups:
            indices = [*group, (group[-1] + 1) % len(points)]
            xs, ys = points[indices, 0], points[indices, 1]
            corners = line.corners[indices]
            if xs[-1] < xs[0]:
                xs, ys, corners = xs[::-1], ys[::-1], corners[::-1]
                group = group[::-1]
            runs.append(
                Run(
                    solid,
                    line_index,
                    list(group),
                    xs.copy(),
                    ys.copy(),
                    corners.copy(),
                )
            )
    return runs


def edge_walls(solid: Solid, lines: Sequence[Polyline]) -> list[Wall]:
    """Each front-facing edge as its own wall: the proposal's quads."""
    walls = []
    for line, facing in zip(lines, front_facing(solid, lines), strict=True):
        points = line.points
        for edge in np.nonzero(facing)[0]:
            start, end = points[edge], points[(edge + 1) % len(points)]
            if start[0] == end[0]:
                continue
            first, second = (start, end) if start[0] < end[0] else (end, start)
            walls.append(
                Wall(
                    solid,
                    np.array([first[0], second[0]]),
                    np.array([first[1], second[1]]),
                    solid.bottom,
                    solid.top,
                )
            )
    return walls


def faces_of(solid: Solid, lines: Sequence[Polyline]) -> list[Face]:
    rings = [line.points for line in lines if line.closed]
    return [] if solid.ribbon or not rings else [Face(solid, rings, solid.top)]


# ---- the orders ----------------------------------------------------------------------
def centre_depth(piece: Piece, tilt: float) -> float:
    sine, cosine = math.sin(math.radians(tilt)), math.cos(math.radians(tilt))
    if isinstance(piece, Wall):
        return float(piece.ys.mean()) * sine + (piece.bottom + piece.top) / 2 * cosine
    return (
        float(np.concatenate(piece.rings)[:, 1].mean()) * sine + piece.height * cosine
    )


def centre_order(pieces: Sequence[Piece], tilt: float) -> list[Piece]:
    return sorted(pieces, key=lambda piece: centre_depth(piece, tilt))


@dataclass
class OrderStats:
    """What the slab order found while it sorted: a count per kind of pair."""

    pairs_compared: int = 0
    crossings: int = 0  # runs whose curves cross in a slab: solids that intersect
    cycles: int = 0


def y_order(walls: Sequence[Wall], stats: OrderStats) -> list[Wall]:
    """Walls of one slab, so that at each x the wall with the larger y comes
    later (it is nearer at every tilt from 0 to 90 degrees)."""
    count = len(walls)
    if count < 2:
        return list(walls)
    lows = np.array([wall.xs[0] for wall in walls])
    highs = np.array([wall.xs[-1] for wall in walls])
    later: list[list[int]] = [[] for _ in range(count)]
    earlier_count = [0] * count
    for first in range(count - 1):
        overlap_low = np.maximum(lows[first], lows[first + 1 :])
        overlap_high = np.minimum(highs[first], highs[first + 1 :])
        for offset in np.nonzero(overlap_high - overlap_low > 1e-6)[0]:
            second = first + 1 + int(offset)
            stats.pairs_compared += 1
            samples = np.linspace(overlap_low[offset], overlap_high[offset], 9)[1:-1]
            difference = np.interp(
                samples, walls[first].xs, walls[first].ys
            ) - np.interp(samples, walls[second].xs, walls[second].ys)
            if (difference > -1e-6).all() and (difference > 1e-6).any():
                later[second].append(first)
                earlier_count[first] += 1
            elif (difference < 1e-6).all() and (difference < -1e-6).any():
                later[first].append(second)
                earlier_count[second] += 1
            elif not (np.abs(difference) <= 1e-6).all():
                stats.crossings += 1
    mean_y = [float(wall.ys.mean()) for wall in walls]
    ready = [
        (mean_y[index], index) for index in range(count) if earlier_count[index] == 0
    ]
    heapq.heapify(ready)
    order: list[int] = []
    while ready:
        _, index = heapq.heappop(ready)
        order.append(index)
        for successor in later[index]:
            earlier_count[successor] -= 1
            if earlier_count[successor] == 0:
                heapq.heappush(ready, (mean_y[successor], successor))
    if len(order) < count:
        stats.cycles += 1
        order += [index for index in range(count) if index not in set(order)]
    return [walls[index] for index in order]


def slab_order(
    solids: Sequence[Solid],
    runs: dict[Solid, list[Run]],
    faces: dict[Solid, list[Face]],
    stats: OrderStats,
) -> list[Piece]:
    levels = sorted(
        {solid.bottom for solid in solids} | {solid.top for solid in solids}
    )
    order: list[Piece] = []
    for lower, upper in itertools.pairwise(levels):
        walls = [
            Wall(solid, run.xs, run.ys, lower, upper, run)
            for solid in solids
            if solid.bottom <= lower and solid.top >= upper
            for run in runs[solid]
        ]
        order += y_order(walls, stats)
        order += [
            face for solid in solids if solid.top == upper for face in faces[solid]
        ]
    return order


# ---- depth images --------------------------------------------------------------------
@dataclass(frozen=True)
class Camera:
    tilt: float  # degrees

    @property
    def sine(self) -> float:
        return math.sin(math.radians(self.tilt))

    @property
    def cosine(self) -> float:
        return math.cos(math.radians(self.tilt))


def screen_polygon(piece: Piece, camera: Camera) -> list[Floats]:
    """The piece's outline on the screen: one polygon for a wall, one per ring
    for a face."""
    sine, cosine = camera.sine, camera.cosine
    if isinstance(piece, Wall):
        top = np.column_stack((piece.xs, piece.ys * cosine - piece.top * sine))
        bottom = np.column_stack((piece.xs, piece.ys * cosine - piece.bottom * sine))
        return [np.concatenate((top, bottom[::-1]))]
    return [
        np.column_stack((ring[:, 0], ring[:, 1] * cosine - piece.height * sine))
        for ring in piece.rings
    ]


def depth_function(piece: Piece, camera: Camera) -> Callable[[Floats, Floats], Floats]:
    sine, cosine = camera.sine, camera.cosine
    if isinstance(piece, Wall):
        xs, ys = piece.xs, piece.ys

        def wall_depth(screen_x: Floats, screen_y: Floats) -> Floats:
            wall_y = np.interp(screen_x, xs, ys)
            height = (wall_y * cosine - screen_y) / sine
            return wall_y * sine + height * cosine

        return wall_depth
    height = piece.height

    def face_depth(screen_x: Floats, screen_y: Floats) -> Floats:
        return screen_y * sine / cosine + height / cosine

    return face_depth


def visible(piece: Piece, camera: Camera) -> bool:
    if isinstance(piece, Face):
        return camera.cosine > 1e-6
    return camera.sine > 1e-6 and piece.top > piece.bottom


@dataclass(frozen=True)
class Grid:
    left: float
    top: float
    width: int
    height: int

    @classmethod
    def around(cls, pieces: Sequence[Piece], camera: Camera) -> Grid:
        points = np.concatenate(
            [polygon for piece in pieces for polygon in screen_polygon(piece, camera)]
        )
        low, high = points.min(axis=0) - 4, points.max(axis=0) + 4
        return cls(
            float(low[0]),
            float(low[1]),
            int((high[0] - low[0]) / PIXEL) + 1,
            int((high[1] - low[1]) / PIXEL) + 1,
        )


def fill_even_odd(
    polygons: Sequence[Floats], columns: Floats, rows: Floats
) -> NDArray[np.bool_]:
    """Which pixel centres (columns x rows) lie inside the polygons, by the
    even-odd rule. Each edge toggles the pixels to the right of where it
    crosses a row; a running parity along the row then fills the inside."""
    toggles = np.zeros((len(rows), len(columns) + 1), dtype=np.int32)
    for polygon in polygons:
        start, end = polygon, np.roll(polygon, -1, axis=0)
        for (x0, y0), (x1, y1) in zip(start, end, strict=True):
            if y0 == y1:
                continue
            low, high = (y0, y1) if y0 < y1 else (y1, y0)
            first, last = (
                np.searchsorted(rows, low, "left"),
                np.searchsorted(rows, high, "left"),
            )
            if first >= last:
                continue
            crossing = x0 + (rows[first:last] - y0) * (x1 - x0) / (y1 - y0)
            np.add.at(
                toggles,
                (np.arange(first, last), np.searchsorted(columns, crossing, "left")),
                1,
            )
    inside: NDArray[np.bool_] = (np.cumsum(toggles[:, :-1], axis=1) % 2) == 1
    return inside


class DepthImage:
    """The depth of the surface drawn at each pixel, and which piece drew it."""

    def __init__(self, grid: Grid) -> None:
        self.grid = grid
        self.depth = np.full((grid.height, grid.width), -np.inf)
        self.piece = np.full((grid.height, grid.width), -1)

    def cover(
        self, piece: Piece, camera: Camera
    ) -> tuple[tuple[slice, slice], NDArray[np.bool_], Floats] | None:
        """The pixels whose centres lie inside the piece, by the even-odd
        rule: a window of the image, a mask in it, and the depths there. A
        depth is only ever taken inside the piece, never extrapolated."""
        polygons = screen_polygon(piece, camera)
        points = np.concatenate(polygons)
        column_low = max(
            int(np.floor((points[:, 0].min() - self.grid.left) / PIXEL)), 0
        )
        row_low = max(int(np.floor((points[:, 1].min() - self.grid.top) / PIXEL)), 0)
        column_high = min(
            int(np.ceil((points[:, 0].max() - self.grid.left) / PIXEL)) + 1,
            self.grid.width,
        )
        row_high = min(
            int(np.ceil((points[:, 1].max() - self.grid.top) / PIXEL)) + 1,
            self.grid.height,
        )
        if column_high <= column_low or row_high <= row_low:
            return None
        columns: Floats = (
            self.grid.left + np.arange(column_low, column_high, dtype=float) * PIXEL
        )
        rows: Floats = self.grid.top + np.arange(row_low, row_high, dtype=float) * PIXEL
        mask = fill_even_odd(polygons, columns, rows)
        if not mask.any():
            return None
        screen_x, screen_y = np.meshgrid(columns, rows)
        return (
            (slice(row_low, row_high), slice(column_low, column_high)),
            mask,
            depth_function(piece, camera)(screen_x, screen_y),
        )

    def paint(self, piece: Piece, camera: Camera, label: int) -> None:
        """Draw over whatever is there: the painter's algorithm."""
        covered = self.cover(piece, camera)
        if covered is not None:
            window, mask, depth = covered
            self.depth[window][mask] = depth[mask]
            self.piece[window][mask] = label

    def keep_nearest(self, piece: Piece, camera: Camera, label: int) -> None:
        """Draw only where nearer than what is there: a z-buffer."""
        covered = self.cover(piece, camera)
        if covered is not None:
            window, mask, depth = covered
            nearer = mask & (depth > self.depth[window])
            self.depth[window][nearer] = depth[nearer]
            self.piece[window][nearer] = label


def reference(pieces: Sequence[Piece], camera: Camera, grid: Grid) -> DepthImage:
    image = DepthImage(grid)
    for label, piece in enumerate(pieces):
        if visible(piece, camera):
            image.keep_nearest(piece, camera, label)
    return image


def painted(order: Sequence[Piece], camera: Camera, grid: Grid) -> DepthImage:
    image = DepthImage(grid)
    for label, piece in enumerate(order):
        if visible(piece, camera):
            image.paint(piece, camera, label)
    return image


def wrong_area(drawn: DepthImage, truth: DepthImage) -> tuple[float, NDArray[np.bool_]]:
    """Slide px² where the drawing shows a surface behind the nearest one."""
    wrong = np.isfinite(truth.depth) & (drawn.depth < truth.depth - DEPTH_TOLERANCE)
    return float(wrong.sum()) * PIXEL * PIXEL, wrong


# ---- one pose ----------------------------------------------------------------------------
@dataclass
class Pose:
    """The pieces of every solid at one time: a side table for one run."""

    solids: list[Solid]
    time: float
    lines: dict[Solid, list[Polyline]] = field(default_factory=dict)
    runs: dict[Solid, list[Run]] = field(default_factory=dict)
    edges: dict[Solid, list[Wall]] = field(default_factory=dict)
    faces: dict[Solid, list[Face]] = field(default_factory=dict)

    def __post_init__(self) -> None:
        for solid in self.solids:
            lines = solid.outline_at(self.time)
            self.lines[solid] = lines
            self.runs[solid] = runs_of(solid, lines)
            self.edges[solid] = edge_walls(solid, lines)
            self.faces[solid] = faces_of(solid, lines)

    def quads(self) -> list[Piece]:
        pieces: list[Piece] = []
        for solid in self.solids:
            pieces += self.edges[solid]
            pieces += self.faces[solid]
        return pieces

    def run_walls(self) -> list[Piece]:
        pieces: list[Piece] = []
        for solid in self.solids:
            pieces += [
                Wall(solid, run.xs, run.ys, solid.bottom, solid.top, run)
                for run in self.runs[solid]
            ]
            pieces += self.faces[solid]
        return pieces

    def slab(self, stats: OrderStats) -> list[Piece]:
        return slab_order(self.solids, self.runs, self.faces, stats)


def compare(
    pose: Pose, tilts: Sequence[float], fixed_tilt: float = 45.0
) -> dict[str, object]:
    """Each order's wrong area at each tilt."""
    stats = OrderStats()
    slab = pose.slab(stats)
    quads = pose.quads()
    run_walls = pose.run_walls()
    fixed_quads = centre_order(quads, fixed_tilt)
    rows = []
    for tilt in tilts:
        camera = Camera(tilt)
        grid = Grid.around(quads, camera)
        truth = reference(quads, camera, grid)
        row: dict[str, float] = {
            "tilt": tilt,
            "covered": float(np.isfinite(truth.depth).sum()) * PIXEL * PIXEL,
        }
        for label, order in (
            ("centre, per quad", centre_order(quads, tilt)),
            (f"centre, per quad, sorted once at {fixed_tilt:g}", fixed_quads),
            ("centre, per run", centre_order(run_walls, tilt)),
            ("slab", slab),
        ):
            row[label], _ = wrong_area(painted(order, camera, grid), truth)
        rows.append(row)
        print("   ", {key: round(value, 1) for key, value in row.items()}, flush=True)
    return {
        "quads": len(quads),
        "runs": sum(len(pose.runs[solid]) for solid in pose.solids),
        "slab pieces": len(slab),
        "slab pairs compared": stats.pairs_compared,
        "slab crossings": stats.crossings,
        "slab cycles": stats.cycles,
        "by tilt": rows,
    }


def centre_order_changes(
    pose: Pose, first_tilt: float, second_tilt: float, overlap_tilt: float
) -> dict[str, int]:
    """How many pairs of quads that overlap on the screen at `overlap_tilt`
    swap places in the centre-depth order between two tilts."""
    quads = pose.quads()
    camera = Camera(overlap_tilt)
    boxes = np.array(
        [
            np.concatenate([polygon.min(axis=0), polygon.max(axis=0)])
            for piece in quads
            for polygon in screen_polygon(piece, camera)[:1]
        ]
    )
    first = np.array([centre_depth(piece, first_tilt) for piece in quads])
    second = np.array([centre_depth(piece, second_tilt) for piece in quads])
    overlapping = swapped = 0
    for index in range(len(quads) - 1):
        others = slice(index + 1, None)
        touch = (
            (boxes[others, 0] < boxes[index, 2])
            & (boxes[index, 0] < boxes[others, 2])
            & (boxes[others, 1] < boxes[index, 3])
            & (boxes[index, 1] < boxes[others, 3])
        )
        overlapping += int(touch.sum())
        flips = np.sign(first[others] - first[index]) != np.sign(
            second[others] - second[index]
        )
        swapped += int((touch & flips).sum())
    return {"pairs overlapping": overlapping, "pairs that swap": swapped}


# ---- pictures --------------------------------------------------------------------------
def wall_lines(piece: Wall, camera: Camera) -> list[Floats]:
    """The lines drawn on a wall: its top and bottom edges where they are the
    solid's own (not a slab cut), and a vertical line at each end and at each
    corner of the outline inside it."""
    top, bottom = (
        piece.ys * camera.cosine - piece.top * camera.sine,
        piece.ys * camera.cosine - piece.bottom * camera.sine,
    )
    lines = []
    if piece.top == piece.solid.top:
        lines.append(np.column_stack((piece.xs, top)))
    if piece.bottom == piece.solid.bottom:
        lines.append(np.column_stack((piece.xs, bottom)))
    inner = [] if piece.run is None else piece.run.inner_corners()
    lines.extend(
        np.array([[piece.xs[at], top[at]], [piece.xs[at], bottom[at]]])
        for at in (0, *inner, len(piece.xs) - 1)
    )
    return lines


def path_data(lines: Sequence[Floats], closed: bool) -> str:
    """SVG path data for polylines, to 0.01 px."""
    return "".join(
        "M" + "L".join(f"{x:.2f} {y:.2f}" for x, y in line) + ("Z" if closed else "")
        for line in lines
    )


def svg_picture(
    order: Sequence[Piece],
    camera: Camera,
    path: pathlib.Path,
    title: str,
    zoom: float = 1.0,
) -> None:
    """The pieces in `order`, filled and outlined, as an SVG file, enlarged
    `zoom` times with the lines kept at their width on the screen."""
    shapes = []
    for piece in order:
        if not visible(piece, camera):
            continue
        width = f"{piece.solid.stroke_width / zoom:.3f}"
        data = path_data(screen_polygon(piece, camera), closed=True)
        if isinstance(piece, Face):
            shapes.append(
                f'<path d="{data}" fill="{piece.solid.fill}" fill-rule="evenodd" stroke="{LINE}" stroke-width="{width}" stroke-linejoin="round"/>'
            )
            continue
        shapes.append(f'<path d="{data}" fill="{piece.solid.fill}"/>')
        data = path_data(wall_lines(piece, camera), closed=False)
        shapes.append(
            f'<path d="{data}" fill="none" stroke="{LINE}" stroke-width="{width}" stroke-linecap="round" stroke-linejoin="round"/>'
        )
    points = np.concatenate(
        [
            polygon
            for piece in order
            if visible(piece, camera)
            for polygon in screen_polygon(piece, camera)
        ]
    )
    low, high = points.min(axis=0) - 10 / zoom, points.max(axis=0) + 10 / zoom
    size = high - low
    path.write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{size[0] * zoom:.0f}" height="{size[1] * zoom:.0f}" '
        f'viewBox="{low[0]:.1f} {low[1]:.1f} {size[0]:.1f} {size[1]:.1f}">\n'
        f"<title>{title}</title>\n"
        f'<rect x="{low[0]:.1f}" y="{low[1]:.1f}" width="{size[0]:.1f}" height="{size[1]:.1f}" fill="#FAF7F0"/>\n'
        + "\n".join(shapes)
        + "\n</svg>\n"
    )


def error_picture(
    order: Sequence[Piece],
    truth_pieces: Sequence[Piece],
    camera: Camera,
    path: pathlib.Path,
) -> None:
    """The drawn depth in grey, and in red where it is wrong."""
    grid = Grid.around(truth_pieces, camera)
    truth = reference(truth_pieces, camera, grid)
    drawn = painted(order, camera, grid)
    _, wrong = wrong_area(drawn, truth)
    finite = np.isfinite(drawn.depth)
    shade = np.full(drawn.depth.shape, 250.0)
    if finite.any():
        low, high = drawn.depth[finite].min(), drawn.depth[finite].max()
        shade[finite] = 90 + 140 * (drawn.depth[finite] - low) / max(high - low, 1e-9)
    rgb = np.repeat(shade[:, :, None], 3, axis=2)
    rgb[wrong] = (220, 30, 30)
    Image.fromarray(rgb.astype(np.uint8)).save(path)


# ---- the experiments ------------------------------------------------------------------
def hairspring_scene(solids: Sequence[Solid], ribbon_height: float) -> list[Solid]:
    """The balance, the hairspring and the staff only; the spring's height
    set to `ribbon_height`."""
    kept = [solid for solid in solids if solid.part.name == "balance"]
    hub_top = max(solid.top for solid in kept)
    spring = next(
        solid
        for solid in solids
        if solid.part.name == "hairspring" and solid.shape is not None
    )
    staff = next(solid for solid in solids if solid.shape is None)
    new_spring = Solid(
        spring.name,
        spring.part,
        spring.shape,
        None,
        hub_top,
        hub_top + ribbon_height,
        True,
        spring.fill,
        spring.stroke_width,
    )
    new_staff = Solid(
        staff.name,
        staff.part,
        None,
        staff.fixed,
        hub_top,
        hub_top + ribbon_height + STAFF_ABOVE_SPRING,
        False,
        staff.fill,
        staff.stroke_width,
    )
    return [*kept, new_spring, new_staff]


def half_coils_alone(solids: Sequence[Solid], ribbon_height: float) -> dict[str, float]:
    """The proposed half-coil sort with no other parts, and with the staff
    through the spring: the worst wrong area over the tilts."""
    scene = hairspring_scene(solids, ribbon_height)
    spring_only = [
        solid
        for solid in scene
        if solid.part.name == "hairspring" and solid.shape is not None
    ]
    with_staff = [solid for solid in scene if solid.part.name == "hairspring"]
    result = {}
    for label, chosen in (
        ("spring alone", spring_only),
        ("spring and staff", with_staff),
    ):
        pose = Pose(chosen, STATIC_TIME)
        quads = pose.quads()
        worst = 0.0
        for tilt in TILTS[:-2]:
            camera = Camera(tilt)
            grid = Grid.around(quads, camera)
            area, _ = wrong_area(
                painted(centre_order(pose.run_walls(), tilt), camera, grid),
                reference(quads, camera, grid),
            )
            worst = max(worst, area)
        result[f"{label}: worst wrong area, centre per run (half-coils)"] = worst
    return result


def animated(
    solids: Sequence[Solid], tilt: float, times: Sequence[float]
) -> list[dict[str, float]]:
    """At a fixed tilt, with the mechanism running: the slab order made again
    at each frame, against the order of the first frame kept for all frames
    (its pieces follow the parts as they turn)."""
    camera = Camera(tilt)
    first = Pose(list(solids), times[0])
    stats = OrderStats()
    frozen_plan = frozen_pieces(first, stats)
    rows = []
    for moment in times:
        pose = Pose(list(solids), moment)
        frame_stats = OrderStats()
        started = clock.perf_counter()
        order = pose.slab(frame_stats)
        seconds = clock.perf_counter() - started
        quads = pose.quads()
        grid = Grid.around(quads, camera)
        truth = reference(quads, camera, grid)
        remade, _ = wrong_area(painted(order, camera, grid), truth)
        kept, _ = wrong_area(painted(follow(frozen_plan, pose), camera, grid), truth)
        facing_changed = sum(
            int((now != then).sum())
            for solid in solids
            for now, then in zip(
                front_facing(solid, pose.lines[solid]),
                front_facing(solid, first.lines[solid]),
                strict=True,
            )
        )
        row = {
            "time": moment,
            "slab pieces": len(order),
            "pairs compared": frame_stats.pairs_compared,
            "python seconds to order": round(seconds, 4),
            "edges that changed facing": facing_changed,
            "wrong area, order made again": remade,
            "wrong area, first frame's order kept": kept,
        }
        rows.append(row)
        print("   ", row, flush=True)
    return rows


@dataclass(frozen=True)
class PlannedEdge:
    """One edge of the first frame's order, found again in a later pose."""

    solid: Solid
    line: int
    edge: int
    bottom: float
    top: float


def frozen_pieces(pose: Pose, stats: OrderStats) -> list[PlannedEdge | Face]:
    """The first frame's slab order, edge by edge."""
    plan: list[PlannedEdge | Face] = []
    for piece in pose.slab(stats):
        if isinstance(piece, Face):
            plan.append(piece)
        elif piece.run is not None:
            run = piece.run
            plan += [
                PlannedEdge(run.solid, run.line, edge, piece.bottom, piece.top)
                for edge in run.edges
            ]
    return plan


def follow(plan: Sequence[PlannedEdge | Face], pose: Pose) -> list[Piece]:
    """The planned pieces with the geometry of a later pose."""
    pieces: list[Piece] = []
    for item in plan:
        if isinstance(item, Face):
            pieces += list(pose.faces[item.solid])
            continue
        points = pose.lines[item.solid][item.line].points
        start, end = points[item.edge], points[(item.edge + 1) % len(points)]
        if start[0] == end[0]:
            continue
        first, second = (start, end) if start[0] < end[0] else (end, start)
        pieces.append(
            Wall(
                item.solid,
                np.array([first[0], second[0]]),
                np.array([first[1], second[1]]),
                item.bottom,
                item.top,
            )
        )
    return pieces


def main() -> None:
    started = clock.perf_counter()
    PICTURES.mkdir(parents=True, exist_ok=True)
    solids = build_solids(read_shapes())
    print(f"{len(solids)} solids from {FROZEN_SVG.name}")
    result: dict[str, object] = {
        "solids": [
            {
                "name": solid.name,
                "bottom": solid.bottom,
                "top": solid.top,
                "ribbon": solid.ribbon,
            }
            for solid in solids
        ],
        "pixel": PIXEL,
        "depth tolerance": DEPTH_TOLERANCE,
    }

    print("1. the whole watch, still, at each tilt")
    pose = Pose(solids, STATIC_TIME)
    result["whole watch"] = compare(pose, TILTS)
    result["centre order changes, 5 to 85 degrees"] = centre_order_changes(
        pose, 5, 85, 45
    )

    print("2. the balance, hairspring and staff, still")
    for height in (8.0, 20.0):
        scene = hairspring_scene(solids, height)
        result[f"hairspring scene, ribbon {height:g} high"] = compare(
            Pose(scene, STATIC_TIME), TILTS
        )
        result[f"half-coils without the balance, ribbon {height:g} high"] = (
            half_coils_alone(solids, height)
        )

    print("3. the whole watch, running, at 45 degrees")
    result["running at 45 degrees"] = animated(
        solids, 45.0, [index * 0.05 for index in range(41)]
    )

    print("4. pictures")
    stats = OrderStats()
    slab = pose.slab(stats)
    for tilt in (0.0, 30.0, 60.0):
        svg_picture(
            slab,
            Camera(tilt),
            PICTURES / f"watch-tilt-{tilt:g}.svg",
            f"The watch extruded, tilted {tilt:g} degrees, slab order",
        )
    spring_pose = Pose(hairspring_scene(solids, 8.0), STATIC_TIME)
    spring_slab = spring_pose.slab(OrderStats())
    for tilt in (45.0, 75.0):
        svg_picture(
            spring_slab,
            Camera(tilt),
            PICTURES / f"hairspring-tilt-{tilt:g}.svg",
            f"Balance and hairspring, tilted {tilt:g} degrees, slab order, at the hairspring view's zoom",
            HAIRSPRING_ZOOM,
        )
    for tilt in (30.0, 60.0):
        camera = Camera(tilt)
        error_picture(
            centre_order(pose.quads(), tilt),
            pose.quads(),
            camera,
            PICTURES / f"errors-centre-per-quad-tilt-{tilt:g}.png",
        )
        error_picture(
            slab, pose.quads(), camera, PICTURES / f"errors-slab-tilt-{tilt:g}.png"
        )
    tall = Pose(hairspring_scene(solids, 20.0), STATIC_TIME)
    error_picture(
        centre_order(tall.run_walls(), 60.0),
        tall.quads(),
        Camera(60.0),
        PICTURES / "errors-hairspring-20-centre-per-run-tilt-60.png",
    )

    result["seconds"] = round(clock.perf_counter() - started, 1)
    (EVIDENCE / "depth_order.json").write_text(json.dumps(result, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'depth_order.json'} in {result['seconds']} s")


if __name__ == "__main__":
    main()
