"""The whole cover drawing in 3D: the movement at heights where the parts
touch, and the case, lugs, strap, crown, chapter ring and its marks.

A library for scene_export.py; it has no command line.

It starts from depth_order.build_solids (the 2D plan's model, with the train
at meshing heights) and changes what that model got wrong:

- THE ESCAPEMENT. The pallet fork is at the height of the escape wheel's
  teeth, which its pallets lock, raised by PALLET_STEP. The 2D drawing draws
  each locked tooth under a pallet (12.8-24.9 px² of overlap in plan, at
  every time), and the impulse jewel under the fork's notch. At one height
  those top faces would fight in the depth buffer; one step up keeps the 2D
  paint order at tilt 0, and the pallets still reach into the teeth. The
  impulse jewel is at the teeth's height, in the notch. The balance, the hairspring and the staff rise together so
  that the balance sits on the fork: the fork's lever passes under the
  balance's rim and arms.
- THE HANDS. Each hand sits as low as it can while it clears every part of
  the movement that it sweeps over in a turn (a disc of its reach). Its arbor
  rises to meet it. The seconds hand is on the fourth arbor; the hour hand on
  the centre arbor, above the seconds hand; the minute hand on the hour
  hand; the centre pivot on the minute hand.
- THE DIAL SIDE. The chapter ring's top is at the bottom of the minute hand,
  the only hand that reaches over it. The case band's top is flush with it.
  The ring's outside edge meets the case band's inside edge.

And it adds what the 2D drawing has and the 2D plan's model did not:

- the case band, the lugs and the strap: extrusions of their 2D outlines.
  The case is deep enough to hold the crown. The lugs are the case's height
  and keep their 2D length (to 300 px from the centre, just off the slide at
  tilt 0). The strap is STRAP_THICKNESS thick, at the case's mid-height, and
  runs straight on to STRAP_LENGTH from the centre, so that its end leaves
  the slide at tilts up to about 75 degrees;
- the crown: a cylinder along x (the 2D drawing's rectangle is its view
  from above), at the case's mid-height;
- the line on each edge, in the colour, width and opacity of the 2D stroke
  that draws that edge. A 2D shape without a stroke (a wheel's body, the
  chapter ring, the case band) takes its lines from the stroke-only shapes
  that draw the same outline;
- decals: 2D strokes that draw no outline of a solid (the minute ticks, the
  hour marks) lie on the top face of the solid under them;
- the 2D drawing's clip paths, as discs in plan: a clipped solid is not
  drawn inside its disc, at any height;
- the 0.18-opacity fills (case, lugs, strap, crown) as the opaque colour
  that they show over the paper: in the 2D drawing each lies over bare paper.

And one part that the 2D drawing does not have: the hairspring stud, a block
that holds the spring's outer end. In a watch it hangs from the balance
cock; here it stands alone, so that the talk can fade everything but the
spring and its stud.

Heights are in slide px at the cover's scale, from the bottom of the escape
wheel.
"""

import dataclasses
import math
from collections.abc import Sequence
from dataclasses import dataclass
from xml.etree import ElementTree

import numpy as np
from depth_order import (
    KNOCKOUT,
    LINE,
    PARTS,
    TRAIN,
    Meshing,
    Part,
    Recipe,
    Solid,
    build_solids,
    reach,
)
from watch_svg import (
    FROZEN_SVG,
    SVG,
    Group,
    Polyline,
    Shape,
    circle_path,
    flatten,
    parse_path,
    read_shapes,
)

MESHING = Meshing(pinion_overhang=0.0, cap=3.0)  # the 2D plan's recommendation
PAPER = "#FAF7F0"
WATCH_CENTRE = (798.0, 276.0)  # the drawing's root translate
STRAP_THICKNESS = 4.0
STRAP_LENGTH = 1100.0  # from the watch centre: off the slide up to about 75 degrees
CROWN_CLEARANCE = 1.0  # between the crown and the case's top and bottom
PALLET_STEP = 1.0  # the fork above the escape wheel's teeth (see the docstring)
MATCH_TOLERANCE = 0.05  # px: a stroke draws an outline if every point is this close
FLAT = Recipe(0.0)
STUD_REACH = (-2.0, 5.0)  # px along the spring's radius, from its outer end
STUD_WIDTH = 5.0  # px across the spring's radius
STUD_OVERHANG = 1.0  # px above and below the ribbon


@dataclass(frozen=True)
class LineStyle:
    colour: str
    opacity: float
    width: float  # CSS px at the cover's scale


@dataclass(frozen=True)
class Disc:
    """A clip: the solid is not drawn inside this disc in plan."""

    centre: tuple[float, float]
    radius: float


@dataclass(eq=False)
class Decal:
    """Lines drawn on the top face of `on`, in their shape's own group."""

    shape: Shape
    lines: list[Polyline]  # in the group's frame
    on: Solid
    style: LineStyle


@dataclass(eq=False)
class Cylinder:
    """A solid extruded along the slide's x axis: its outline is in the
    (y, z) plane, about (0, 0), and its heights are x values."""

    centre_y: float
    centre_z: float


@dataclass(frozen=True, eq=False)
class Subject:
    """Solids that a slide can keep while the rest of the watch fades."""

    name: str
    solids: tuple[Solid, ...]


@dataclass
class CoverModel:
    """The solids, and side tables about them. Every solid is a z extrusion
    in depth_order's sense, except those in `cylinders`."""

    solids: list[Solid]
    additions: list[Solid]  # solids that the 2D drawing does not show
    subjects: list[Subject]
    styles: dict[Solid, list[LineStyle | None]]  # per polyline of its outline
    decals: list[Decal]
    clips: dict[Solid, list[Disc]]
    cylinders: dict[Solid, Cylinder]
    fills: dict[Solid, str]  # the opaque colour each solid is filled with


# ---- helpers -------------------------------------------------------------------------
def part_at(top_level: int) -> Part:
    """depth_order's part for a child of the drawing's root group."""
    return next(part for part in PARTS if part.top_level == top_level)


def over_paper(colour: str, opacity: float) -> str:
    """The opaque colour of `colour` at `opacity` over the paper."""
    mixed = [
        opacity * int(colour[index : index + 2], 16)
        + (1 - opacity) * int(PAPER[index : index + 2], 16)
        for index in (1, 3, 5)
    ]
    return "#" + "".join(f"{round(value):02X}" for value in mixed)


def centre_of(solid: Solid) -> tuple[float, float]:
    if solid.shape is not None:
        return solid.shape.pivot()
    points = np.concatenate([line.points for line in solid.fixed or []])
    return float(points[:, 0].mean()), float(points[:, 1].mean())


def reach_of(solid: Solid) -> float:
    if solid.shape is not None:
        return reach(solid.shape)
    centre = np.array(centre_of(solid))
    return max(
        float(np.hypot(*(line.points - centre).T).max()) for line in solid.fixed or []
    )


def sweeps_over(hand: Solid, solid: Solid) -> bool:
    """Whether `solid` is under the disc that `hand` sweeps in a turn."""
    distance = math.dist(centre_of(hand), centre_of(solid))
    return distance < reach_of(hand) + reach_of(solid)


def moved(solid: Solid, bottom: float, top: float) -> Solid:
    return dataclasses.replace(solid, bottom=bottom, top=top)


def same_line(first: Polyline, second: Polyline) -> bool:
    return (
        len(first.points) == len(second.points)
        and float(np.abs(first.points - second.points).max()) < MATCH_TOLERANCE
    )


# ---- the heights of the movement -------------------------------------------------------
def movement(shapes: Sequence[Shape]) -> list[Solid]:
    """depth_order's solids, with the escapement, the hands and the chapter
    ring moved (see the module's docstring)."""
    solids = build_solids(shapes, MESHING)
    of_part: dict[Part, list[Solid]] = {}
    for solid in solids:
        of_part.setdefault(solid.part, []).append(solid)
    escape_wheel, fourth_wheel, _, centre_wheel, _ = TRAIN
    balance, hairspring, jewel, fork = (part_at(index) for index in (14, 15, 16, 17))
    seconds, ring, hour, minute, pivot = (part_at(i) for i in (18, 19, 25, 26, 27))
    new: dict[Solid, Solid] = {}  # old solid -> the solid that replaces it

    # The escapement: fork and jewel at the escape wheel's teeth; the balance
    # and everything on its staff on top of the fork.
    teeth = of_part[escape_wheel][0]
    fork_body, fork_arbor = of_part[fork]
    fork_bottom = teeth.bottom + PALLET_STEP
    fork_top = fork_bottom + (fork_body.top - fork_body.bottom)
    new[fork_body] = moved(fork_body, fork_bottom, fork_top)
    arbor_height = fork_arbor.top - fork_arbor.bottom
    new[fork_arbor] = moved(fork_arbor, fork_top, fork_top + arbor_height)
    for solid in of_part[jewel]:
        new[solid] = moved(solid, teeth.bottom, teeth.top)
    lift = fork_top - min(solid.bottom for solid in of_part[balance])
    for solid in (
        of_part[balance] + of_part[hairspring]
    ):  # the staff is a hairspring solid
        new[solid] = moved(solid, solid.bottom + lift, solid.top + lift)

    def placed(solid: Solid) -> Solid:
        return new.get(solid, solid)

    dial_side = {seconds, ring, hour, minute, pivot}
    below = [placed(s) for s in solids if s.part not in dial_side]

    def lowest_clear(hand: Solid, own: Part, others: Sequence[Solid]) -> float:
        """The lowest bottom at which `hand` clears what it sweeps over,
        except its own arbor's part."""
        return max(
            solid.top
            for solid in others
            if solid.part is not own and sweeps_over(hand, solid)
        )

    def stack(hand_solids: list[Solid], bottom: float) -> tuple[list[Solid], float]:
        """The hand's solids stacked from `bottom`: the blade, then its cap."""
        placed_solids = []
        for solid in hand_solids:
            top = bottom + (solid.top - solid.bottom)
            placed_solids.append(moved(solid, bottom, top))
            bottom = top
        return placed_solids, bottom

    def raise_arbor(wheel: Part, to: float) -> None:
        arbor_end = max(of_part[wheel], key=lambda solid: solid.top)
        new[arbor_end] = moved(arbor_end, arbor_end.bottom, max(arbor_end.top, to))

    seconds_bottom = lowest_clear(of_part[seconds][0], fourth_wheel, below)
    seconds_solids, seconds_top = stack(of_part[seconds], seconds_bottom)
    raise_arbor(fourth_wheel, seconds_bottom)
    hour_bottom = max(
        lowest_clear(of_part[hour][0], centre_wheel, below),
        seconds_top if sweeps_over(of_part[hour][0], of_part[seconds][0]) else 0.0,
    )
    hour_solids, hour_top = stack(of_part[hour], hour_bottom)
    raise_arbor(centre_wheel, hour_bottom)
    # The minute hand is longer than the hour hand: it may sweep over more.
    minute_bottom = max(
        hour_top,
        lowest_clear(of_part[minute][0], centre_wheel, below),
        seconds_top if sweeps_over(of_part[minute][0], of_part[seconds][0]) else 0.0,
    )
    minute_solids, minute_top = stack(of_part[minute], minute_bottom)
    pivot_solids, _ = stack(of_part[pivot], minute_top)
    new.update(
        zip(
            of_part[seconds] + of_part[hour] + of_part[minute] + of_part[pivot],
            seconds_solids + hour_solids + minute_solids + pivot_solids,
            strict=True,
        )
    )
    for solid in of_part[ring]:
        thickness = solid.top - solid.bottom
        new[solid] = moved(solid, minute_bottom - thickness, minute_bottom)
    return [placed(solid) for solid in solids]


# ---- the case, lugs, strap and crown ----------------------------------------------------
def frame_part(name: str, top_level: int) -> Part:
    return Part(name, top_level, body=FLAT, circle=FLAT, other=FLAT)


def lengthened(shape: Shape, length: float) -> list[Polyline]:
    """The strap's outline with its far end (the 2D drawing's y = +-300 from
    the centre) moved out to `length` from the centre."""
    centre_y = WATCH_CENTRE[1]
    result = []
    for line in shape.polylines_at(0.0):
        points = line.points.copy()
        offset = points[:, 1] - centre_y
        far = np.abs(np.abs(offset) - 300) < 1e-6
        points[far, 1] = centre_y + np.sign(offset[far]) * length
        result.append(Polyline(points, line.closed, line.corners))
    return result


def frame(
    shapes: Sequence[Shape], ring_top: float
) -> tuple[list[Solid], Solid, Cylinder]:
    """The case band, lugs, strap and crown."""
    by_level = {shape.top_level: shape for shape in shapes if shape.top_level <= 8}
    crown_shape = by_level[7]
    crown_points = crown_shape.polylines_at(0.0)[0].points
    crown_radius = float(np.ptp(crown_points[:, 1])) / 2
    case_depth = 2 * (crown_radius + CROWN_CLEARANCE)
    case_bottom = ring_top - case_depth
    middle = (case_bottom + ring_top) / 2
    solids = [
        Solid(
            "case band",
            frame_part("case band", 8),
            by_level[8],
            None,
            case_bottom,
            ring_top,
            False,
            "",
            0.0,
        ),
    ]
    for level in (1, 2, 3, 4, 5, 6):
        is_strap = level in (1, 4)  # the middle strip; the others are lugs
        shape = by_level[level]
        name = "strap" if is_strap else "lug"
        bottom, top = (
            (middle - STRAP_THICKNESS / 2, middle + STRAP_THICKNESS / 2)
            if is_strap
            else (case_bottom, ring_top)
        )
        outline = (
            lengthened(shape, STRAP_LENGTH) if is_strap else shape.polylines_at(0.0)
        )
        solids.append(
            Solid(
                f"{name} {level}",
                frame_part(name, level),
                None,
                outline,
                bottom,
                top,
                False,
                "",
                0.0,
            )
        )
    left = float(crown_points[:, 0].min())
    right = float(crown_points[:, 0].max())
    crown = Solid(
        "crown",
        frame_part("crown", 7),
        None,
        flatten(circle_path(0.0, 0.0, crown_radius)),
        left,
        right,
        False,
        "",
        0.0,
    )
    centre_y = float(crown_points[:, 1].mean())
    return solids, crown, Cylinder(centre_y, middle)


# ---- the hairspring stud ---------------------------------------------------------------
def stud_for(spring: Solid) -> Solid:
    """A block around the spring's outer end, which is fixed: the spring
    turns only at its inner end."""
    assert spring.shape is not None
    end = spring.outline_at(0.0)[0].points[-1]
    outward = end - np.array(spring.shape.pivot())
    outward /= np.hypot(*outward)
    across = np.array([-outward[1], outward[0]])
    near, far = STUD_REACH
    half = STUD_WIDTH / 2
    points = np.array(
        [
            end + outward * along + across * side
            for along, side in ((near, -half), (far, -half), (far, half), (near, half))
        ]
    )
    return Solid(
        "hairspring stud (added)",
        Part("hairspring stud", spring.part.top_level, FLAT, FLAT, FLAT),
        None,
        [Polyline(points, True, np.ones(4, dtype=bool))],
        spring.bottom - STUD_OVERHANG,
        spring.top + STUD_OVERHANG,
        False,
        KNOCKOUT,
        2.0,
    )


# ---- lines, decals, clips ---------------------------------------------------------------
def style_of(shape: Shape) -> LineStyle | None:
    paint = shape.paint
    if paint.stroke is None:
        return None
    return LineStyle(paint.stroke, paint.stroke_opacity, paint.stroke_width)


def outline_of(solid: Solid) -> list[Polyline]:
    return solid.outline_at(0.0)


def line_styles(
    solids: Sequence[Solid], shapes: Sequence[Shape], sources: dict[Solid, Shape]
) -> tuple[dict[Solid, list[LineStyle | None]], list[tuple[Shape, Polyline]]]:
    """Each solid's style per polyline, and the stroke-only lines that match
    no outline (the decals, with their shapes)."""
    styles: dict[Solid, list[LineStyle | None]] = {}
    for solid in solids:
        source = sources.get(solid, solid.shape)
        own = None if source is None else style_of(source)
        styles[solid] = [own] * len(outline_of(solid))
    unmatched: list[tuple[Shape, Polyline]] = []
    stroke_only = [
        shape
        for shape in shapes
        if shape.paint.fill is None and shape.paint.stroke is not None
    ]
    ribbon_shapes = {solid.shape for solid in solids if solid.ribbon}
    for shape in stroke_only:
        if shape in ribbon_shapes:
            continue
        style = style_of(shape)
        for line in shape.polylines_at(0.0):
            matched = False
            for solid in solids:
                for index, outline in enumerate(outline_of(solid)):
                    if outline.closed == line.closed and same_line(outline, line):
                        styles[solid][index] = style
                        matched = True
            if not matched:
                unmatched.append((shape, line))
    return styles, unmatched


def inside(point: np.ndarray, lines: Sequence[Polyline]) -> bool:
    """Even-odd test of a point against the closed polylines."""
    crossings = 0
    x, y = float(point[0]), float(point[1])
    for line in lines:
        if not line.closed:
            continue
        points = line.points
        following = np.roll(points, -1, axis=0)
        for (x0, y0), (x1, y1) in zip(points, following, strict=True):
            if (y0 > y) != (y1 > y) and x < x0 + (y - y0) * (x1 - x0) / (y1 - y0):
                crossings += 1
    return crossings % 2 == 1


def decals_on(
    unmatched: Sequence[tuple[Shape, Polyline]], solids: Sequence[Solid]
) -> list[Decal]:
    """Each unmatched stroke on the top face of the highest solid under the
    middle of its line, in its shape's own group frame."""
    grouped: dict[tuple[Shape, Solid], list[Polyline]] = {}
    for shape, line in unmatched:
        middle = line.points[len(line.points) // 2]
        under = [
            solid
            for solid in solids
            if not solid.ribbon and inside(middle, outline_of(solid))
        ]
        on = max(under, key=lambda solid: solid.top)
        grouped.setdefault((shape, on), []).append(line)
    decals = []
    for (shape, on), lines in grouped.items():
        inverse = np.linalg.inv(shape.group.matrix_at(0.0))
        local = [line.transformed(inverse) for line in lines]
        style = style_of(shape)
        assert style is not None
        decals.append(Decal(shape, local, on, style))
    return decals


def clip_discs(solids: Sequence[Solid]) -> dict[Solid, list[Disc]]:
    """The 2D drawing's clip paths, as discs in slide px, per clipped solid."""
    root = ElementTree.parse(FROZEN_SVG).getroot()
    drawing = root.find(SVG + "g")
    assert drawing is not None
    discs: dict[str, Disc] = {}
    for clip in drawing.iter(SVG + "clipPath"):
        path = clip.find(SVG + "path")
        assert path is not None
        circle = flatten(parse_path(path.get("d", "")))[1].points
        centre = circle.mean(axis=0)
        radius = float(np.hypot(*(circle - centre).T).mean())
        discs[clip.get("id", "")] = Disc(
            (float(centre[0]) + WATCH_CENTRE[0], float(centre[1]) + WATCH_CENTRE[1]),
            radius,
        )
    clip_of_level: dict[int, Disc] = {}
    for index, child in enumerate(drawing):
        reference = child.get("clip-path")
        if reference:
            clip_of_level[index] = discs[
                reference.removeprefix("url(#").removesuffix(")")
            ]
    return {
        solid: [clip_of_level[solid.part.top_level]]
        for solid in solids
        if solid.part.top_level in clip_of_level
    }


# ---- the whole cover ----------------------------------------------------------------------
def cover_model() -> CoverModel:
    shapes = read_shapes()
    solids = movement(shapes)
    ring = next(solid for solid in solids if solid.part is part_at(19))
    frame_solids, crown, crown_cylinder = frame(shapes, ring.top)
    by_level = {shape.top_level: shape for shape in shapes if shape.top_level <= 8}
    sources = {
        solid: by_level[solid.part.top_level] for solid in [*frame_solids, crown]
    }
    spring = next(
        solid for solid in solids if solid.ribbon and solid.part is part_at(15)
    )
    stud = stud_for(spring)
    all_solids = [*frame_solids, crown, *solids, stud]
    fills = {}
    for solid in all_solids:
        source = sources.get(solid, solid.shape)
        paint = None if source is None else source.paint
        if paint is None or paint.fill is None:
            fills[solid] = solid.fill  # the staff, and the ribbons
        else:
            fills[solid] = over_paper(paint.fill, paint.fill_opacity)
    # Line styles: the crown's outline is its section, so it takes the 2D
    # rectangle's stroke; the stud has no 2D shape. Lines are matched against
    # the other solids only.
    matchable = [solid for solid in all_solids if solid not in (crown, stud)]
    styles, unmatched = line_styles(matchable, shapes, sources)
    crown_style = style_of(by_level[7])
    styles[crown] = [crown_style] * len(outline_of(crown))
    staff = next(solid for solid in solids if solid.shape is None)
    styles[staff] = [LineStyle(LINE, 1.0, staff.stroke_width)]
    styles[stud] = [LineStyle(LINE, 1.0, stud.stroke_width)]
    decals = decals_on(unmatched, matchable)
    return CoverModel(
        solids=all_solids,
        additions=[stud],
        subjects=[Subject("hairspring and stud", (spring, stud))],
        styles=styles,
        decals=decals,
        clips=clip_discs(all_solids),
        cylinders={crown: crown_cylinder},
        fills=fills,
    )


def group_of(solid: Solid) -> Group | None:
    return None if solid.shape is None else solid.shape.group
