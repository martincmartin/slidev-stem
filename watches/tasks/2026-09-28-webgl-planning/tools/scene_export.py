#!/usr/bin/env python3
"""Export the cover in 3D for the WebGL spike, and draw the reference
pictures that the spike is compared with.

    uv run --project ../../.. python scene_export.py     # in tools/

THE MODEL is cover_model.py: the 2D plan's extruded movement (its
depth_order.py and watch_svg.py, copied here), at heights where the parts
touch, with the case, lugs, strap, crown, chapter ring and its marks.

THE EXPORT (../out/scene.json) keeps what a GPU renderer needs and nothing
it can compute: for each solid, its outline in its own group's frame, its
heights, its fill, a placement if it is not a z extrusion, its clip discs,
and the line style of each outline; for each group, its parent, its static
transform and its rotation keyframes; the hairspring's morph as flattened
frames. The browser extrudes the solids and animates the groups.

THE SWING. The balance swings as q(t) = 150 cos(2 pi t / 2 s) degrees,
but SVG can only interpolate 25 samples of it linearly (in angle, and in the
spring's shape). So the export also says which groups turn by the swing
("swing": true), with the swing's amplitude and period ("swing", at the
top), and gives the spring as an Archimedean spiral ("spiral"):
from SPRING_RADII[0] at angle outer - 360 SPRING_TURNS + q to SPRING_RADII[1]
at angle outer. A renderer that is given q draws both exactly; one that is
not uses the keyframes and the frames, as SVG does. The export checks the
spiral against every frame of the drawing's spring: the points where its 13
Bezier segments join lie on the spiral (to the SVG's rounding). Between the
joins the Beziers bulge off it, by up to 0.91 px at the widest swing: the
spiral is the more accurate of the two.

THE SUBJECTS: named sets of solids that a slide can keep while the rest of
the watch fades ("hairspring and stud"). "inDrawing": false marks a solid
that the 2D drawing does not show (the stud), which the parity check leaves
out.

THE STILLS. Three kinds, listed in the export for webgl_probe.py:
- "slab": every z extrusion and decal, with no clips, at 9 tilts, 2 line
  widths and 4 moving poses. The reference is the 2D plan's slab order
  (../out/reference/*.svg), which a z-buffer showed to be exact where solids
  do not intersect: each piece is filled and outlined, back to front, with
  each outline's own line style. The order is made again for each time.
- "parity": the whole cover at tilt 0, with clips. The reference is the
  real 2D drawing (../inputs/skeleton-watch.svg) at the same time.
- "show": the whole cover at other tilts, for the eye. No reference.
"""

import json
import pathlib
from collections.abc import Sequence
from dataclasses import dataclass
from enum import Enum

import numpy as np
from cover_model import (
    PAPER,
    CoverModel,
    Cylinder,
    Decal,
    LineStyle,
    cover_model,
    group_of,
    outline_of,
)
from depth_order import (
    STATIC_TIME,
    Camera,
    Face,
    Floats,
    OrderStats,
    Piece,
    Pose,
    Solid,
    Wall,
    path_data,
    screen_polygon,
    visible,
    wall_lines,
)
from watch_svg import Group, Keyframes, Morph, Polyline, flatten

# The generator's swing and spring (../../../art/skeleton_watch.py: AMPLITUDE,
# PERIOD, the 25 swing samples, and spiral(8, 38, stud - 360 * 3.25 + swing,
# stud, SPRING_SEGMENTS)). The export checks them against the frozen drawing.
AMPLITUDE = 150.0  # degrees
PERIOD = 2.0  # s
SWING_SAMPLES = 25
SPRING_RADII = (8.0, 38.0)  # px, the inner and outer ends
SPRING_TURNS = 3.25  # at rest (q = 0)
SPRING_SEGMENTS = 13  # cubic Beziers in the drawing's spring
JOIN_TOLERANCE = 0.1  # px: the drawing's joins against the spiral (SVG rounds to 0.1)
KEYFRAME_TOLERANCE = 1e-3  # degrees
TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parent
OUT = TASK / "out"
SLIDE = (980, 552)  # CSS px


@dataclass(frozen=True)
class View:
    """A tilt about the horizontal axis through `pivot`, then the slide's
    camera: screen = scale * projected + shift."""

    name: str
    scale: float
    shift: tuple[float, float]
    pivot: tuple[float, float, float]

    def to_screen(self, projected: Floats, camera: Camera) -> Floats:
        """Points projected by depth_order (y cos t - z sin t, no pivot) to
        slide px: move the pivot back to where it was, then zoom."""
        _, centre_y, centre_z = self.pivot
        offset = centre_y - centre_y * camera.cosine + centre_z * camera.sine
        moved = projected + np.array([0.0, offset])
        return np.asarray(moved * self.scale + np.array(self.shift), dtype=np.float64)


CROWN_ZOOM = 2.0


def views(model: CoverModel) -> list[View]:
    """The cover (the whole watch), the zoom task's hairspring view, and a
    view of the crown (the cover crops it off the slide's right edge)."""
    extruded = [solid for solid in model.solids if solid not in model.cylinders]
    middle = (min(s.bottom for s in extruded) + max(s.top for s in extruded)) / 2
    spring = next(s for s in extruded if s.part.name == "hairspring" and s.shape)
    assert spring.shape is not None
    balance = [s for s in extruded if s.part.name in ("balance", "hairspring")]
    spring_middle = (min(s.bottom for s in balance) + max(s.top for s in balance)) / 2
    return [
        View("cover", 1.0, (0.0, 0.0), (798.0, 276.0, middle)),
        View(
            "hairspring",
            250 / 56,
            (-3067.8, -450.3),
            (*spring.shape.pivot(), spring_middle),
        ),
        crown_view(model),
    ]


def crown_view(model: CoverModel) -> View:
    """The crown at CROWN_ZOOM, at the middle of the slide."""
    crown, cylinder = next(iter(model.cylinders.items()))
    centre_x = (crown.bottom + crown.top) / 2
    width, height = SLIDE
    return View(
        "crown",
        CROWN_ZOOM,
        (
            width / 2 - CROWN_ZOOM * centre_x,
            height / 2 - CROWN_ZOOM * cylinder.centre_y,
        ),
        (centre_x, cylinder.centre_y, cylinder.centre_z),
    )


# ---- the swing and the spiral -----------------------------------------------------------
def swing_at(time: float) -> float:
    return AMPLITUDE * float(np.cos(2 * np.pi * time / PERIOD))


def is_swing(keyframes: Keyframes | None) -> bool:
    """Whether a group turns by the balance's swing, sampled as SVG does."""
    if keyframes is None or len(keyframes.values) != SWING_SAMPLES:
        return False
    fractions = np.linspace(0, 1, SWING_SAMPLES)
    return keyframes.duration == PERIOD and all(
        abs(value - swing_at(fraction * PERIOD)) < KEYFRAME_TOLERANCE
        for value, fraction in zip(keyframes.values, fractions, strict=True)
    )


def spiral_points(outer_angle: float, swing: float, count: int) -> Floats:
    """`count` points of the spring at swing angle `swing` (degrees)."""
    fraction = np.linspace(0, 1, count)
    inner_radius, outer_radius = SPRING_RADII
    radius = inner_radius + fraction * (outer_radius - inner_radius)
    inner_angle = outer_angle - 360 * SPRING_TURNS + swing
    theta = np.radians(inner_angle + fraction * (outer_angle - inner_angle))
    return np.stack([radius * np.cos(theta), radius * np.sin(theta)], axis=1)


def spiral_data(
    solid: Solid, frames: Sequence[Sequence[Polyline]]
) -> dict[str, object]:
    """The spring as a spiral, checked against the drawing's frames: at each
    frame's swing, the joins of its Beziers lie on the spiral."""
    outer_end = frames[0][0].points[-1]
    outer_angle = float(np.degrees(np.arctan2(outer_end[1], outer_end[0])))
    worst_join = worst = 0.0
    for index, frame in enumerate(frames):
        swing = swing_at(index / (SWING_SAMPLES - 1) * PERIOD)
        curve = spiral_points(outer_angle, swing, 20_000)
        points = frame[0].points
        offsets = (points[:, None, :] - curve[None, :, :]).transpose(2, 0, 1)
        distances = np.hypot(*offsets).min(axis=1)
        per_segment = (len(points) - 1) // SPRING_SEGMENTS
        worst_join = max(worst_join, float(distances[::per_segment].max()))
        worst = max(worst, float(distances.max()))
    if worst_join > JOIN_TOLERANCE:
        raise ValueError(f"{solid.name}: a join is {worst_join:.3f} px off the spiral")
    return {
        "radii": list(SPRING_RADII),
        "turns": SPRING_TURNS,
        "outerAngle": round(outer_angle, 4),
        "drawingJoinsOff": round(worst_join, 3),
        "drawingBulge": round(worst, 3),
    }


# ---- the export -----------------------------------------------------------------------
def rounded(values: Floats) -> list[float]:
    return [round(float(value), 3) for value in values.ravel()]


def stroke_data(style: LineStyle | None) -> dict[str, object] | None:
    if style is None:
        return None
    return {"colour": style.colour, "opacity": style.opacity, "width": style.width}


def polyline_data(line: Polyline, style: LineStyle | None) -> dict[str, object]:
    return {
        "closed": line.closed,
        "points": rounded(line.points),
        "corners": [int(corner) for corner in line.corners],
        "stroke": stroke_data(style),
    }


def keyframes_data(keyframes: Keyframes) -> dict[str, object]:
    return {
        "values": list(keyframes.values),
        "keyTimes": list(keyframes.key_times),
        "dur": keyframes.duration,
        "accumulate": keyframes.accumulate,
    }


def affine(matrix: Floats) -> list[float]:
    """An SVG matrix(a b c d e f) from a 3 x 3 affine matrix."""
    return [round(float(value), 6) for value in matrix[:2, :].T.ravel()]


def placement(cylinder: Cylinder) -> list[float]:
    """Column-major 4 x 4: the outline's (u, v) to the slide's (y, z), the
    extrusion's w to the slide's x."""
    return [
        0,
        1,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        0,
        cylinder.centre_y,
        cylinder.centre_z,
        1,
    ]


def local_lines(solid: Solid) -> list[Polyline]:
    """The solid's outline in its own group's frame, at its first frame."""
    shape = solid.shape
    if shape is None:
        return solid.fixed or []
    outline = shape.outline
    path = outline.frames[0] if isinstance(outline, Morph) else outline
    return [line.transformed(shape.own) for line in flatten(path)]


class Exporter:
    """Writes scene.json. Holds the groups' indices: a side table of one export."""

    def __init__(self, model: CoverModel) -> None:
        self.model = model
        self.group_index: dict[Group, int] = {}
        self.groups: list[dict[str, object]] = []

    def index_of(self, group: Group | None) -> int | None:
        if group is None:
            return None
        if group not in self.group_index:
            parent = self.index_of(group.parent)
            self.group_index[group] = len(self.groups)
            self.groups.append(
                {
                    "parent": parent,
                    "static": affine(group.static),
                    "rotation": None
                    if group.rotation is None
                    else keyframes_data(group.rotation),
                    "swing": is_swing(group.rotation),
                }
            )
        return self.group_index[group]

    def solid_data(self, solid: Solid) -> dict[str, object]:
        model = self.model
        cylinder = model.cylinders.get(solid)
        styles = model.styles[solid]
        lines = local_lines(solid)
        if len(lines) != len(styles):
            raise ValueError(f"{solid.name}: {len(lines)} lines, {len(styles)} styles")
        row: dict[str, object] = {
            "name": solid.name,
            "part": solid.part.name,
            "bottom": solid.bottom,
            "top": solid.top,
            "zTop": solid.top
            if cylinder is None
            else cylinder.centre_z + max(abs(p[1]) for l in lines for p in l.points),
            "ribbon": solid.ribbon,
            "decal": False,
            "slab": cylinder is None,
            "fill": model.fills[solid],
            "group": self.index_of(group_of(solid)),
            "placement": None if cylinder is None else placement(cylinder),
            "clips": [
                [disc.centre[0], disc.centre[1], disc.radius]
                for disc in model.clips.get(solid, [])
            ],
            "lines": [
                polyline_data(line, style)
                for line, style in zip(lines, styles, strict=True)
            ],
            "morph": None,
            "spiral": None,
            "inDrawing": solid not in model.additions,
        }
        shape = solid.shape
        if shape is not None and isinstance(shape.outline, Morph):
            outline = shape.outline
            frames = [
                [line.transformed(shape.own) for line in flatten(frame)]
                for frame in outline.frames
            ]
            counts = {tuple(len(line.points) for line in frame) for frame in frames}
            if len(counts) != 1:
                raise ValueError(f"{solid.name}: morph frames flatten differently")
            row["morph"] = {
                "keyTimes": list(outline.key_times),
                "dur": outline.duration,
                "frames": [
                    [rounded(line.points) for line in frame] for frame in frames
                ],
            }
            row["spiral"] = spiral_data(solid, frames)
        return row

    def decal_data(self, decal: Decal) -> dict[str, object]:
        height = decal.on.top
        return {
            "name": f"decal on {decal.on.name}",
            "part": decal.on.part.name,
            "bottom": height,
            "top": height,
            "zTop": height,
            "ribbon": False,
            "decal": True,
            "slab": True,
            "fill": None,
            "group": self.index_of(decal.shape.group),
            "placement": None,
            "clips": [],
            "lines": [polyline_data(line, decal.style) for line in decal.lines],
            "morph": None,
            "spiral": None,
            "inDrawing": True,
        }

    def scene(
        self, scene_views: Sequence[View], stills: Sequence[Still]
    ) -> dict[str, object]:
        solids = [self.solid_data(solid) for solid in self.model.solids]
        solids += [self.decal_data(decal) for decal in self.model.decals]
        return {
            "format": 0,
            "slide": list(SLIDE),
            "paper": PAPER,
            "staticTime": STATIC_TIME,
            "swing": {"amplitude": AMPLITUDE, "period": PERIOD},
            "groups": self.groups,
            "solids": solids,
            "views": [
                {
                    "name": view.name,
                    "scale": view.scale,
                    "shift": list(view.shift),
                    "pivot": list(view.pivot),
                }
                for view in scene_views
            ],
            "stills": [still.data() for still in stills],
            "subjects": [
                {
                    "name": subject.name,
                    "solids": [
                        self.model.solids.index(solid) for solid in subject.solids
                    ],
                }
                for subject in self.model.subjects
            ],
        }


# ---- the reference pictures -----------------------------------------------------------
def stroke_attributes(style: LineStyle, width: float | None) -> str:
    opacity = "" if style.opacity == 1 else f' stroke-opacity="{style.opacity:g}"'
    return (
        f'fill="none" stroke="{style.colour}" stroke-width="{width or style.width:g}"'
        f'{opacity} stroke-linecap="round" stroke-linejoin="round"'
    )


def decal_screen_lines(
    decal: Decal, time: float, view: View, camera: Camera
) -> list[Floats]:
    matrix = decal.shape.group.matrix_at(time)
    height = decal.on.top
    result = []
    for line in decal.lines:
        points = line.transformed(matrix).points
        projected = np.column_stack(
            (points[:, 0], points[:, 1] * camera.cosine - height * camera.sine)
        )
        result.append(view.to_screen(projected, camera))
    return result


def reference_svg(
    model: CoverModel,
    order: Sequence[Piece],
    view: View,
    camera: Camera,
    time: float,
    line_width: float | None,
) -> str:
    """The pieces in `order`, filled and outlined with each outline's style,
    over the whole slide; each decal after its solid's top face. `line_width`
    replaces every line's own width, if given."""
    shapes = []
    decals_on: dict[Solid, list[Decal]] = {}
    for decal in model.decals:
        decals_on.setdefault(decal.on, []).append(decal)
    for piece in order:
        solid = piece.solid
        styles = model.styles[solid]
        # Seen from straight above, a wall has no area, but a ribbon (a
        # spring) still shows as its line, as in the 2D drawing.
        edge_on_ribbon = isinstance(piece, Wall) and solid.ribbon
        if not visible(piece, camera) and not edge_on_ribbon:
            continue
        polygons = [view.to_screen(p, camera) for p in screen_polygon(piece, camera)]
        if isinstance(piece, Face):
            shapes.append(
                f'<path d="{path_data(polygons, closed=True)}" fill="{model.fills[solid]}" '
                f'fill-rule="evenodd"/>'
            )
            closed = [
                index for index, line in enumerate(outline_of(solid)) if line.closed
            ]
            for ring, polygon in zip(closed, polygons, strict=True):
                style = styles[ring]
                if style is not None:
                    shapes.append(
                        f'<path d="{path_data([polygon], closed=True)}" '
                        f"{stroke_attributes(style, line_width)}/>"
                    )
            for decal in decals_on.get(solid, []):
                lines = decal_screen_lines(decal, time, view, camera)
                shapes.append(
                    f'<path d="{path_data(lines, closed=False)}" '
                    f"{stroke_attributes(decal.style, line_width)}/>"
                )
            continue
        if visible(piece, camera):
            shapes.append(
                f'<path d="{path_data(polygons, closed=True)}" fill="{model.fills[solid]}"/>'
            )
        assert piece.run is not None
        style = styles[piece.run.line]
        if style is not None:
            lines = [view.to_screen(line, camera) for line in wall_lines(piece, camera)]
            shapes.append(
                f'<path d="{path_data(lines, closed=False)}" '
                f"{stroke_attributes(style, line_width)}/>"
            )
    width, height = SLIDE
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" '
        f'viewBox="0 0 {width} {height}">\n'
        f'<rect width="{width}" height="{height}" fill="{PAPER}"/>\n'
        + "\n".join(shapes)
        + "\n</svg>\n"
    )


class Kind(Enum):
    SLAB = "slab"  # against the slab order; no crown, no clips
    PARITY = "parity"  # against the real 2D drawing; tilt 0, clips
    SHOW = "show"  # for the eye


@dataclass(frozen=True)
class Still:
    """One picture that the probe draws."""

    kind: Kind
    view: View
    tilt: float
    time: float
    line_width: float | None = None  # None: each line's own
    clips: bool = False

    @property
    def name(self) -> str:
        width = "own" if self.line_width is None else f"{self.line_width:g}px"
        clips = "-clips" if self.clips else ""
        return (
            f"{self.kind.value}-{self.view.name}-tilt-{self.tilt:g}-time-{self.time:g}"
            f"-lines-{width}{clips}"
        )

    def data(self) -> dict[str, object]:
        return {
            "name": self.name,
            "kind": self.kind.value,
            "view": self.view.name,
            "tilt": self.tilt,
            "time": self.time,
            "lineWidth": self.line_width,
            "clips": self.clips,
        }


TILTS = (0.0, 5.0, 15.0, 30.0, 45.0, 60.0, 75.0, 85.0, 89.0)
MOVING_TIMES = (0.1, 0.25, 0.6, 1.3)  # s: the 2D plan's times, and one more
MOVING_TILT = 45.0


def stills(scene_views: Sequence[View]) -> list[Still]:
    cover, hairspring, crown = scene_views
    result = [
        Still(Kind.SLAB, view, tilt, STATIC_TIME, width)
        for view in (cover, hairspring)
        for tilt in TILTS
        for width in (None, 1.0)
    ]
    result += [
        Still(Kind.SLAB, view, MOVING_TILT, moment)
        for view in (cover, hairspring)
        for moment in MOVING_TIMES
    ]
    result += [
        Still(Kind.PARITY, cover, 0.0, moment, clips=True)
        for moment in (STATIC_TIME, *MOVING_TIMES)
    ]
    result += [
        Still(Kind.SHOW, view, tilt, STATIC_TIME, clips=clips)
        for view, tilt in (
            (cover, 30.0),
            (cover, 60.0),
            (cover, 85.0),
            (hairspring, 45.0),
            (crown, 0.0),
            (crown, 45.0),
        )
        for clips in (False, True)
    ]
    return result


def main() -> None:
    model = cover_model()
    scene_views = views(model)
    all_stills = stills(scene_views)
    OUT.mkdir(exist_ok=True)
    scene = Exporter(model).scene(scene_views, all_stills)
    (OUT / "scene.json").write_text(json.dumps(scene, separators=(",", ":")))
    print(
        f"wrote {OUT / 'scene.json'}: {len(model.solids)} solids, {len(model.decals)} decals"
    )
    folder = OUT / "reference"
    folder.mkdir(exist_ok=True)
    # The references are the 2D drawing's parts only, as the parity check's are.
    slab_solids = [
        solid
        for solid in model.solids
        if solid not in model.cylinders and solid not in model.additions
    ]
    orders: dict[float, list[Piece]] = {}
    written = 0
    for still in all_stills:
        if still.kind is not Kind.SLAB:
            continue
        if still.time not in orders:
            orders[still.time] = Pose(slab_solids, still.time).slab(OrderStats())
        picture = reference_svg(
            model,
            orders[still.time],
            still.view,
            Camera(still.tilt),
            still.time,
            still.line_width,
        )
        (folder / f"{still.name}.svg").write_text(picture)
        written += 1
    print(f"wrote {written} reference pictures to {folder}")


if __name__ == "__main__":
    main()
