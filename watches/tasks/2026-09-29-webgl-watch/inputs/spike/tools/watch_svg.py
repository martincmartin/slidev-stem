"""Read the skeleton watch's SVG, pose it at a mechanism time, and flatten
every shape to polylines in slide px.

A library for depth_order.py; it has no command line.

The input is ../inputs/skeleton-watch.svg, a frozen copy of the production
SVG. The reader knows only what the generator writes:
- <g> with translate() or rotate(), and a clip-path, which it ignores;
- <animateTransform type="rotate">: linear between keyTimes, repeated for
  ever, optionally with accumulate="sum";
- <animate attributeName="d">: a morph whose frames share their commands;
- <path>, <circle> and <rect rx>, with absolute M, L, H, V, A, Q, C and Z.
It raises ValueError on anything else, so a change to the art cannot be read
wrong without notice.
"""

import bisect
import math
import pathlib
import re
from dataclasses import dataclass
from enum import Enum
from xml.etree import ElementTree

import numpy as np
from numpy.typing import NDArray

SVG = "{http://www.w3.org/2000/svg}"
TASK = pathlib.Path(__file__).resolve().parents[1]
FROZEN_SVG = TASK / "inputs" / "skeleton-watch.svg"
ARC_STEP = math.radians(3.0)  # flatten arcs in steps of at most this
CURVE_STEPS = 16  # points per quadratic or cubic Bezier
# Two path commands that meet at a turn of more than this make a corner. An
# arc's end tangent is taken from its last chord, at most ARC_STEP / 2 off.
CORNER_TURN = math.radians(5.0)

Points = NDArray[np.float64]  # shape (n, 2)
Matrix = NDArray[np.float64]  # shape (3, 3), an affine transform


class Element(Enum):
    PATH = "path"
    CIRCLE = "circle"
    RECT = "rect"


class Command(Enum):
    MOVE = "M"
    LINE = "L"
    ARC = "A"
    QUADRATIC = "Q"
    CUBIC = "C"
    CLOSE = "Z"


ARITY = {
    Command.MOVE: 2,
    Command.LINE: 2,
    Command.ARC: 7,
    Command.QUADRATIC: 4,
    Command.CUBIC: 6,
    Command.CLOSE: 0,
}


@dataclass(frozen=True)
class Segment:
    """One path command and its absolute arguments."""

    command: Command
    arguments: tuple[float, ...]


PathData = tuple[Segment, ...]


@dataclass(frozen=True)
class Keyframes:
    """A rotation's keyframes, as SMIL plays them."""

    values: tuple[float, ...]
    key_times: tuple[float, ...]
    duration: float
    accumulate: bool

    def value_at(self, time: float) -> float:
        repeat = math.floor(time / self.duration)
        index, along = segment_at(self.key_times, time / self.duration - repeat)
        start, end = self.values[index], self.values[index + 1]
        value = start + (end - start) * along
        return repeat * self.values[-1] + value if self.accumulate else value


@dataclass(frozen=True)
class Morph:
    """An <animate attributeName="d">: frames with the same commands."""

    frames: tuple[PathData, ...]
    key_times: tuple[float, ...]
    duration: float

    def at(self, time: float) -> PathData:
        repeat = math.floor(time / self.duration)
        index, along = segment_at(self.key_times, time / self.duration - repeat)
        return tuple(
            Segment(
                first.command,
                tuple(
                    start + (end - start) * along
                    for start, end in zip(
                        first.arguments, second.arguments, strict=True
                    )
                ),
            )
            for first, second in zip(
                self.frames[index], self.frames[index + 1], strict=True
            )
        )


def segment_at(key_times: tuple[float, ...], fraction: float) -> tuple[int, float]:
    """The keyframe interval that `fraction` falls in, and how far along it."""
    index = min(
        max(bisect.bisect_right(key_times, fraction) - 1, 0), len(key_times) - 2
    )
    span = key_times[index + 1] - key_times[index]
    along = (fraction - key_times[index]) / span if span > 0 else 1.0
    return index, min(max(along, 0.0), 1.0)


@dataclass(frozen=True)
class Paint:
    fill: str | None  # "#RRGGBB", or None for no fill
    fill_opacity: float
    stroke: str | None
    stroke_width: float
    stroke_opacity: float


@dataclass(eq=False)
class Group:
    """A <g>. An animated rotation replaces its static transform (SMIL)."""

    parent: Group | None
    static: Matrix
    rotation: Keyframes | None

    def matrix_at(self, time: float) -> Matrix:
        local = (
            rotation_matrix(self.rotation.value_at(time))
            if self.rotation is not None
            else self.static
        )
        return local if self.parent is None else self.parent.matrix_at(time) @ local


@dataclass(eq=False)
class Shape:
    """A <path>, <circle> or <rect>, in document order."""

    element: Element
    group: Group
    own: Matrix  # the element's own transform attribute
    outline: PathData | Morph
    paint: Paint
    top_level: int  # which child of the drawing's root group it is in
    order: int  # its place in the document

    def polylines_at(self, time: float) -> list[Polyline]:
        path = (
            self.outline.at(time) if isinstance(self.outline, Morph) else self.outline
        )
        matrix = self.group.matrix_at(time) @ self.own
        return [line.transformed(matrix) for line in flatten(path)]

    def pivot(self) -> tuple[float, float]:
        """Where its group's origin is on the slide: the arbor it turns about."""
        origin = self.group.matrix_at(0.0) @ np.array([0.0, 0.0, 1.0])
        return float(origin[0]), float(origin[1])


@dataclass(frozen=True, eq=False)
class Polyline:
    points: Points
    closed: bool
    corners: NDArray[np.bool_]  # per point: two commands meet there at an angle

    def transformed(self, matrix: Matrix) -> Polyline:
        return Polyline(
            self.points @ matrix[:2, :2].T + matrix[:2, 2], self.closed, self.corners
        )


def translation_matrix(x: float, y: float) -> Matrix:
    return np.array([[1.0, 0.0, x], [0.0, 1.0, y], [0.0, 0.0, 1.0]])


def rotation_matrix(degrees: float) -> Matrix:
    cosine, sine = math.cos(math.radians(degrees)), math.sin(math.radians(degrees))
    return np.array([[cosine, -sine, 0.0], [sine, cosine, 0.0], [0.0, 0.0, 1.0]])


def parse_transform(text: str | None) -> Matrix:
    matrix = np.eye(3)
    for name, arguments in re.findall(r"(\w+)\(([^)]*)\)", text or ""):
        numbers = [float(value) for value in re.split(r"[\s,]+", arguments.strip())]
        if name == "translate":
            matrix = matrix @ translation_matrix(
                numbers[0], numbers[1] if len(numbers) > 1 else 0.0
            )
        elif name == "rotate" and len(numbers) == 1:
            matrix = matrix @ rotation_matrix(numbers[0])
        else:
            raise ValueError(f"transform {name}({arguments})")
    return matrix


TOKEN = re.compile(r"[A-Za-z]|-?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")


def parse_path(text: str) -> PathData:
    """Absolute commands only. H and V become L; extra pairs after M are L."""
    segments: list[Segment] = []
    letter: str | None = None
    numbers: list[float] = []
    current = (0.0, 0.0)

    def finish() -> None:
        nonlocal current, letter
        if letter is None:
            return
        if letter in "HV":
            for value in numbers:
                current = (value, current[1]) if letter == "H" else (current[0], value)
                segments.append(Segment(Command.LINE, current))
            return
        command = Command(letter)
        arity = ARITY[command]
        if arity == 0:
            if numbers:
                raise ValueError("numbers after Z")
            segments.append(Segment(command, ()))
            return
        if not numbers or len(numbers) % arity:
            raise ValueError(f"{letter} needs {arity} numbers, has {len(numbers)}")
        for start in range(0, len(numbers), arity):
            this = (
                command if start == 0 or command is not Command.MOVE else Command.LINE
            )
            arguments = tuple(numbers[start : start + arity])
            segments.append(Segment(this, arguments))
            current = (arguments[-2], arguments[-1])

    for token in TOKEN.findall(text):
        if token.isalpha():
            finish()
            if token not in "MLHVAQCZ":
                raise ValueError(f"path command {token}")
            letter, numbers = token, []
        else:
            numbers.append(float(token))
    finish()
    return tuple(segments)


def arc_points(
    start: tuple[float, float], arguments: tuple[float, ...]
) -> list[tuple[float, float]]:
    """Points along an SVG arc, after its start (SVG 1.1, appendix F.6.5)."""
    radius_x, radius_y, rotation, large, sweep, end_x, end_y = arguments
    if radius_x == 0 or radius_y == 0:
        return [(end_x, end_y)]
    phi = math.radians(rotation)
    cos_phi, sin_phi = math.cos(phi), math.sin(phi)
    half_x, half_y = (start[0] - end_x) / 2, (start[1] - end_y) / 2
    x1 = cos_phi * half_x + sin_phi * half_y
    y1 = -sin_phi * half_x + cos_phi * half_y
    radius_x, radius_y = abs(radius_x), abs(radius_y)
    excess = x1**2 / radius_x**2 + y1**2 / radius_y**2
    if excess > 1:
        radius_x, radius_y = radius_x * math.sqrt(excess), radius_y * math.sqrt(excess)
    numerator = radius_x**2 * radius_y**2 - radius_x**2 * y1**2 - radius_y**2 * x1**2
    denominator = radius_x**2 * y1**2 + radius_y**2 * x1**2
    factor = math.sqrt(max(0.0, numerator / denominator)) * (
        -1 if large == sweep else 1
    )
    centre_x1 = factor * radius_x * y1 / radius_y
    centre_y1 = -factor * radius_y * x1 / radius_x
    centre_x = cos_phi * centre_x1 - sin_phi * centre_y1 + (start[0] + end_x) / 2
    centre_y = sin_phi * centre_x1 + cos_phi * centre_y1 + (start[1] + end_y) / 2
    first = math.atan2((y1 - centre_y1) / radius_y, (x1 - centre_x1) / radius_x)
    last = math.atan2((-y1 - centre_y1) / radius_y, (-x1 - centre_x1) / radius_x)
    turn = last - first
    if sweep and turn < 0:
        turn += 2 * math.pi
    elif not sweep and turn > 0:
        turn -= 2 * math.pi
    steps = max(1, math.ceil(abs(turn) / ARC_STEP))
    points = []
    for step in range(1, steps + 1):
        angle = first + turn * step / steps
        along_x, along_y = radius_x * math.cos(angle), radius_y * math.sin(angle)
        points.append(
            (
                centre_x + cos_phi * along_x - sin_phi * along_y,
                centre_y + sin_phi * along_x + cos_phi * along_y,
            )
        )
    points[-1] = (end_x, end_y)
    return points


def bezier_points(
    start: tuple[float, float], arguments: tuple[float, ...]
) -> list[tuple[float, float]]:
    controls = np.array([start, *zip(arguments[0::2], arguments[1::2], strict=True)])
    degree = len(controls) - 1
    fractions = np.linspace(0, 1, CURVE_STEPS + 1)[1:, None]
    weights = [
        math.comb(degree, index)
        * fractions**index
        * (1 - fractions) ** (degree - index)
        for index in range(degree + 1)
    ]
    curve = sum(
        weight * control for weight, control in zip(weights, controls, strict=True)
    )
    return [(float(x), float(y)) for x, y in np.asarray(curve)]


Point = tuple[float, float]


def is_corner(arriving: Point | None, leaving: Point | None) -> bool:
    """Whether a path turns by more than CORNER_TURN where a command with
    end tangent `arriving` meets one with start tangent `leaving`."""
    if arriving is None or leaving is None:
        return False
    cross = arriving[0] * leaving[1] - arriving[1] * leaving[0]
    dot = arriving[0] * leaving[0] + arriving[1] * leaving[1]
    return abs(math.atan2(cross, dot)) > CORNER_TURN


def direction(start: Point, end: Point) -> Point | None:
    """From `start` to `end`, or None if they are the same point."""
    if start == end:
        return None
    return end[0] - start[0], end[1] - start[1]


def end_tangents(
    start: Point, segment: Segment, new: list[Point]
) -> tuple[Point | None, Point | None]:
    """The directions in which a drawing command leaves `start` and arrives at
    its end. For a Bezier they come from its control points; for an arc,
    from its first and last chords."""
    if segment.command in (Command.QUADRATIC, Command.CUBIC):
        arguments = segment.arguments
        controls = [start, *zip(arguments[0::2], arguments[1::2], strict=True)]
        leaving = next(
            (direction(start, point) for point in controls[1:] if point != start),
            None,
        )
        end = controls[-1]
        arriving = next(
            (
                direction(point, end)
                for point in reversed(controls[:-1])
                if point != end
            ),
            None,
        )
        return leaving, arriving
    before_end = new[-2] if len(new) > 1 else start
    return direction(start, new[0]), direction(before_end, new[-1])


def flatten(path: PathData) -> list[Polyline]:
    """Each subpath as a polyline, with its corners: the points where two
    commands meet at an angle. Points inside one arc or curve are never
    corners, however coarse the steps."""
    lines: list[Polyline] = []
    points: list[Point] = []
    corners: list[bool] = []
    current = (0.0, 0.0)
    first_leaving: Point | None = None  # the subpath's first command's start
    arriving: Point | None = None  # the last command's end tangent

    def finish(closed: bool) -> None:
        nonlocal points, corners
        if len(points) > 1:
            if closed:
                closing = direction(points[-1], points[0])
                if closing is None:
                    points.pop()
                    corners.pop()
                    corners[0] = is_corner(arriving, first_leaving)
                else:
                    corners[-1] = is_corner(arriving, closing)
                    corners[0] = is_corner(closing, first_leaving)
            lines.append(
                Polyline(np.array(points, dtype=float), closed, np.array(corners))
            )
        points, corners = [], []

    for segment in path:
        if segment.command is Command.MOVE:
            finish(False)
            current = (segment.arguments[0], segment.arguments[1])
            points, corners = [current], [False]
            first_leaving = arriving = None
        elif segment.command is Command.CLOSE:
            finish(True)
        else:
            if segment.command is Command.LINE:
                new = [(segment.arguments[0], segment.arguments[1])]
            elif segment.command is Command.ARC:
                new = arc_points(current, segment.arguments)
            else:
                new = bezier_points(current, segment.arguments)
            leaving, next_arriving = end_tangents(current, segment, new)
            if len(points) == 1:
                first_leaving = leaving
            else:
                corners[-1] = is_corner(arriving, leaving)
            points.extend(new)
            corners.extend([False] * len(new))
            current = new[-1]
            arriving = next_arriving
    finish(False)
    return lines


def circle_path(centre_x: float, centre_y: float, radius: float) -> PathData:
    return (
        Segment(Command.MOVE, (centre_x + radius, centre_y)),
        Segment(Command.ARC, (radius, radius, 0, 1, 1, centre_x - radius, centre_y)),
        Segment(Command.ARC, (radius, radius, 0, 1, 1, centre_x + radius, centre_y)),
        Segment(Command.CLOSE, ()),
    )


def seconds(element: ElementTree.Element) -> float:
    match = re.fullmatch(r"([\d.]+)s", element.get("dur", ""))
    if match is None or element.get("repeatCount") != "indefinite":
        raise ValueError(f"timing of {element.attrib}")
    return float(match.group(1))


def key_times(element: ElementTree.Element, count: int) -> tuple[float, ...]:
    times = tuple(float(value) for value in element.get("keyTimes", "").split(";"))
    if len(times) != count or times[0] != 0 or times[-1] != 1:
        raise ValueError("keyTimes must run from 0 to 1, one per value")
    return times


def read_rotation(element: ElementTree.Element) -> Keyframes:
    if element.get("attributeName") != "transform" or element.get("type") != "rotate":
        raise ValueError(f"animateTransform {element.attrib}")
    values = tuple(float(value) for value in element.get("values", "").split(";"))
    return Keyframes(
        values,
        key_times(element, len(values)),
        seconds(element),
        element.get("accumulate") == "sum",
    )


def read_morph(element: ElementTree.Element) -> Morph:
    if element.get("attributeName") != "d":
        raise ValueError(f"animate {element.attrib}")
    frames = tuple(parse_path(frame) for frame in element.get("values", "").split(";"))
    if any(
        [segment.command for segment in frame]
        != [segment.command for segment in frames[0]]
        for frame in frames
    ):
        raise ValueError("morph frames differ in their commands")
    return Morph(frames, key_times(element, len(frames)), seconds(element))


def read_paint(element: ElementTree.Element) -> Paint:
    fill = element.get("fill")
    stroke = element.get("stroke")
    return Paint(
        None if fill in (None, "none") else fill,
        float(element.get("fill-opacity", "1")),
        None if stroke in (None, "none") else stroke,
        float(element.get("stroke-width", "1")),
        float(element.get("stroke-opacity", "1")),
    )


def read_shapes(svg_path: pathlib.Path = FROZEN_SVG) -> list[Shape]:
    """Every shape of the drawing, in document order."""
    root = ElementTree.parse(svg_path).getroot()
    drawing = root.find(SVG + "g")
    if drawing is None:
        raise ValueError("no drawing group")
    base = Group(None, parse_transform(drawing.get("transform")), None)
    shapes: list[Shape] = []

    def visit(element: ElementTree.Element, group: Group, top_level: int) -> None:
        tag = element.tag.removeprefix(SVG)
        if tag == "g":
            rotations = [
                item for item in element if item.tag == SVG + "animateTransform"
            ]
            rotation = read_rotation(rotations[0]) if rotations else None
            inner = Group(group, parse_transform(element.get("transform")), rotation)
            for child in element:
                visit(child, inner, top_level)
        elif tag in ("path", "circle", "rect"):
            outline: PathData | Morph
            if tag == "path":
                morphs = [item for item in element if item.tag == SVG + "animate"]
                outline = (
                    read_morph(morphs[0])
                    if morphs
                    else parse_path(element.get("d", ""))
                )
            elif tag == "circle":
                centre_x, centre_y = (
                    float(element.get("cx", "0")),
                    float(element.get("cy", "0")),
                )
                outline = circle_path(centre_x, centre_y, float(element.get("r", "0")))
            else:
                outline = rect_path(element)
            own = parse_transform(element.get("transform"))
            shapes.append(
                Shape(
                    Element(tag),
                    group,
                    own,
                    outline,
                    read_paint(element),
                    top_level,
                    len(shapes),
                )
            )
        elif tag not in ("defs", "animateTransform", "animate"):
            raise ValueError(f"element <{tag}>")

    for index, child in enumerate(drawing):
        visit(child, base, index)
    return shapes


def rect_path(element: ElementTree.Element) -> PathData:
    """A <rect> with rx, as lines and quarter arcs."""
    x, y = float(element.get("x", "0")), float(element.get("y", "0"))
    width, height = float(element.get("width", "0")), float(element.get("height", "0"))
    corner = float(element.get("rx", "0"))
    arc = (corner, corner, 0, 0, 1)
    return (
        Segment(Command.MOVE, (x + corner, y)),
        Segment(Command.LINE, (x + width - corner, y)),
        Segment(Command.ARC, (*arc, x + width, y + corner)),
        Segment(Command.LINE, (x + width, y + height - corner)),
        Segment(Command.ARC, (*arc, x + width - corner, y + height)),
        Segment(Command.LINE, (x + corner, y + height)),
        Segment(Command.ARC, (*arc, x, y + height - corner)),
        Segment(Command.LINE, (x, y + corner)),
        Segment(Command.ARC, (*arc, x + corner, y)),
        Segment(Command.CLOSE, ()),
    )
