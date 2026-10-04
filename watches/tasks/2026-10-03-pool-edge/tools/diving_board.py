#!/usr/bin/env python3
"""Write the pool-edge comparison's SVGs, deck/public/diving-board-<edge>.svg:
a diving board over the edge of a pool, one file for each way the pool can end
(`Edge`). It bends down, is held, is let go and swings; then the pool and the
stand fade and the board curls up into the hairspring at rest.

This is the task's own copy of watches/art/diving_board.py as it was on
2026-10-03, with every edge. The talk's copy keeps only the chosen edge (the
fade). Change this copy, not the talk's, to try a new edge (PLAN.md).

    uv run tasks/2026-10-03-pool-edge/tools/diving_board.py              # in watches/
    uv run tasks/2026-10-03-pool-edge/tools/diving_board.py --edge fade  # one edge
    uv run tasks/2026-10-03-pool-edge/tools/diving_board.py --check      # fail if a file differs

The picture is oblique: the ground is on the left, the pool on the right, and it
is cropped by a vertical cut at 60% of the slide's width (`crop_right`). The viewer is above and in front, so the
back of everything is up and to the right (`Oblique`).

The file is a SMIL animation with one timeline (`Timeline`, seconds):

  rest   the board lies straight (the slide fades the picture in)
  bend   the free end goes down
  hold   it stays at the bottom
  swing  it is let go and swings for ever, one period a second (a loop)
  curl   the board curls into the hairspring's rest shape; the board's plank
         and thickness shrink to the line that the hairspring is

The swing has a constant amplitude, as if nothing lost energy. It is the first
vibration mode of a beam that is fixed at one end, drawn with a constant length:
its angle along the board is the mode's slope shape, scaled by the angle of the
free end. The bend uses the same shape, so the release has no jump.

A page that shows the file drives the clock itself (components/DivingBoard.vue).
The curl starts from the bottom of the swing, where the board is still, so a
page waits for it. The root's data attributes give the page the times:
`data-swing-start` and `data-swing-period` (the swing's cycle is the loop of
`swing-start` to `swing-start + swing-period`) and `data-curl-start`, which is
the end of that cycle: a page shows the swing at times inside the cycle, and the
curl from `curl-start`. The pool and the stand fade when the root has the class
`diving-board-curling` (a CSS transition in the file's <style>).

The curl ends on the spring of watch/model.ts at swing 0, as the hairspring
view shows it: `SPRING_RADII`, `SPRING_TURNS` and the stud's angle, in the
spring's constants below. The numbers are copied from there and from
watch/generate.ts; `art/validate_watch_design.py` does not read them, so change
them here when the spring changes.

COLOURS. The page's theme paints the drawing. Each mark has a class, and a
<style> in the file gives each class `var(--palette-<role>, <hex>)`, so an
inlined SVG takes the colours of the slide it is on, including a slide's own
`class:`. Each mark also keeps the hex as its attribute: the house tools
(artcheck, barroom, motion) read and render the file on its own, where the
fallback paints the same pixels. The hex values are read from the theme that
the talk links, so `--check` fails when the theme changes.
"""

import argparse
import dataclasses
import math
import pathlib
import random
import re
import sys
from dataclasses import dataclass
from enum import Enum
from itertools import pairwise

TASK = pathlib.Path(__file__).resolve().parents[1]  # tasks/2026-10-03-pool-edge/
TALK = TASK.parents[1]  # watches/: its theme gives the colours
OUTPUT_DIR = TASK / "deck" / "public"

Point = tuple[float, float]
Point3 = tuple[float, float, float]

THEME_CSS = TALK / "node_modules" / "slidev-theme-ledger" / "styles" / "ledger.css"
CLASS_PREFIX = "diving-board-"  # a <style> in an inlined SVG is the page's


@dataclass(frozen=True)
class Ink:
    """A palette role (`--palette-<role>`) and its value in the theme."""

    role: str
    value: str  # #RRGGBB

    def class_name(self, name: str) -> str:
        """The class that paints `name` (fill or stroke) in this ink."""
        return f"{CLASS_PREFIX}{name}-{self.role}"

    def rule(self, name: str) -> str:
        return f".{self.class_name(name)} {{ {name}: var(--palette-{self.role}, {self.value}); }}"


def paint(*, fill: Ink | None = None, stroke: Ink | None = None) -> str:
    """The attributes of a mark painted in these inks: a class for the page's
    palette, and the hex for a viewer without it."""
    painted = [(name, ink) for name, ink in (("fill", fill), ("stroke", stroke)) if ink]
    classes = " ".join(ink.class_name(name) for name, ink in painted)
    return f'class="{classes}" ' + " ".join(
        f'{name}="{ink.value}"' for name, ink in painted
    )


def theme_inks(path: pathlib.Path) -> dict[str, Ink]:
    """Every `--palette-<role>: #hex` that the theme's CSS sets, by role."""
    source = re.sub(r"/\*.*?\*/", "", path.read_text(), flags=re.DOTALL)
    return {
        role: Ink(role, value.upper())
        for role, value in re.findall(
            r"--palette-([\w-]+)\s*:\s*(#[0-9A-Fa-f]{6})\s*;", source
        )
    }


@dataclass(frozen=True)
class Inks:
    """The drawing's three inks (stem/docs/illustrations.md)."""

    line: Ink  # the subject: the board; and the water, as a wash
    context: Ink  # what holds it: the ground, the stand and the pool's walls, as washes
    knockout: Ink  # a pale face: the board's

    @classmethod
    def from_theme(cls, path: pathlib.Path = THEME_CSS) -> Inks:
        inks = theme_inks(path)
        roles = ("art-line", "muted", "art-knockout")
        missing = [role for role in roles if role not in inks]
        if missing:
            raise SystemExit(f"{path} sets no --palette-{', --palette-'.join(missing)}")
        return cls(*(inks[role] for role in roles))

    def style(self) -> str:
        """The <style> that paints each mark from the page's palette, and fades
        the pool and the stand when a page asks."""
        rules = [
            self.knockout.rule("fill"),
            self.knockout.rule("stroke"),
            self.context.rule("fill"),
            self.line.rule("fill"),
            self.line.rule("stroke"),
            self.context.rule("stroke"),
            f".{CLASS_PREFIX}set {{ transition: opacity {FADE_SECONDS}s; }}",
            f".{CLASS_PREFIX}curling .{CLASS_PREFIX}set {{ opacity: 0; }}",
            f"@media (prefers-reduced-motion: reduce) {{ .{CLASS_PREFIX}set {{ transition: none; }} }}",
        ]
        return "<style>\n" + "\n".join(rules) + "\n</style>"


# First vibration mode of a cantilever: beta * length, and the mode's sigma.
MODE_BETA_LENGTH = 1.8751040687119611
MODE_SIGMA = 0.7340955137
SEGMENTS = 24  # the board's centre line is this many straight segments
CURL_POINTS = (
    40  # a smooth curve through this many points: within 0.06 px of the spring
)
WATER_OPACITY = 0.6  # of the art line: more than a wash of context, which is faint
WALL_OPACITY = 0.3  # of muted: the pool's walls, in shade
GROUND_OPACITY = 0.14  # of muted
WAVES = (  # x, z of a ripple
    (330, 140),
    (430, 185),
    (350, 235),
    (470, 275),
    (260, 300),
    (300, 60),
    (430, 20),
    (350, -40),
    (460, -90),
    (310, -140),
    (420, -190),
)
WAVE_LENGTH = 52.0
WAVE_HEIGHT = 2.5
FADE_SECONDS = 0.6  # of the pool and the stand: the page's transition

# The hairspring at rest, as the hairspring view shows it (see the docstring).
SPRING_RADII = (8.0, 38.0)
SPRING_TURNS = 3.25
SPRING_OUTER_ANGLE = 210.00132887586108  # degrees: the stud (watch/design.json)
SPRING_SCALE = 250 / 56  # the view's zoom (HAIRSPRING_ZOOM in watch/generate.ts)
SLIDE_ORIGIN = (-50.0, 100.0)  # where the slide shows the drawing's top left
SPRING_CENTRE = (275.0 - SLIDE_ORIGIN[0], 276.0 - SLIDE_ORIGIN[1])  # HAIRSPRING_TARGET
SPRING_TILT = math.radians(20.0)  # `watchTilt` on slide 2: squeezes y
# The spring is a ribbon, a wall as high as `SPRING_Z` (watch/generate.ts
# `springHeights`), and the view's pivot is at `SPRING_PIVOT_Z`: a higher point
# is drawn higher up the slide, by its height times sin(tilt) times the zoom.
SPRING_Z = (-11.0, -3.0)  # the ribbon's bottom and top
SPRING_PIVOT_Z = -7.0  # watch/generate.test.ts fails if these three change
RIBBON_BOTTOM = (SPRING_PIVOT_Z - SPRING_Z[0]) * math.sin(SPRING_TILT) * SPRING_SCALE
RIBBON_TOP = (SPRING_Z[1] - SPRING_PIVOT_Z) * math.sin(SPRING_TILT) * SPRING_SCALE


@dataclass(frozen=True)
class Timeline:
    """Seconds since the start."""

    rest: float = 0.8  # the picture fades in
    bend: float = 1.0
    hold: float = 0.6
    period: float = 1.0  # one swing, there and back: 1 Hz
    curl: float = 2.4
    frames_per_second: int = 30

    def frames(self, seconds: float) -> int:
        """How many sample intervals cover `seconds`."""
        return round(seconds * self.frames_per_second)

    @property
    def swing_start(self) -> float:
        return self.rest + self.bend + self.hold

    @property
    def curl_start(self) -> float:
        """After the swing's cycle, which a page keeps its time inside."""
        return self.swing_start + self.period


@dataclass(frozen=True)
class Oblique:
    """x goes right, y up, z away from the viewer. A point further away is
    drawn up and to the right. Lengths in CSS px."""

    ground_y: float = 330.0  # where the front top edge of the ground is drawn
    depth_x: float = 0.5  # right, for each unit of z
    depth_y: float = 0.35  # up, for each unit of z

    def project(self, x: float, y: float, z: float) -> Point:
        return (x + self.depth_x * z, self.ground_y - y - self.depth_y * z)


class Edge(Enum):
    """How the pool and the ground end at `crop_right`."""

    UNCROPPED = "uncropped"  # they run on, off the slide's right edge
    CROP = "crop"  # a straight vertical cut
    FADE = "fade"  # they fade to the paper, with a smootherstep ramp
    BROKEN = "broken"  # a wavy, broken-away boundary: the drawing is partial
    CUTAWAY = "cutaway"  # a freehand break line, as in a cutaway drawing


@dataclass(frozen=True)
class BoardDesign:
    """Lengths in CSS px, one SVG unit to a px, as the slide shows them. The
    slide puts the drawing's x 0 at x -50 and its top at y 100."""

    width: int = 980  # the slide's: the ground runs off its bottom and slants left
    view_left: int = 50  # the viewBox's left: the slide's left edge (`SLIDE_ORIGIN`)
    height: int = 452  # the slide's bottom: the pool goes on below it
    oblique: Oblique = Oblique()
    board_left: float = 70.0  # the front top edge: where the board starts
    clamp_right: float = 125.0  # where it leaves the stand
    free_length: float = 415.0  # from the stand to the free end
    height_above_ground: float = 140.0  # of the front top edge
    board_z: float = 40.0  # the front edge's distance from the front
    board_width: float = 44.0  # in z
    thickness: float = 7.0
    swing_angle: float = math.radians(22.0)  # at the free end
    stand_x: tuple[float, float] = (40.0, 100.0)
    stand_z: tuple[float, float] = (34.0, 90.0)
    ground_x: float = 6.0  # the ground's left end
    ground_depth: float = 330.0
    pool_front: float = (
        600.0  # the ground's and the water's front edge (z): far below the drawing
    )
    pool_x: float = 195.0  # the pool's left wall: two thirds of the board is over it
    coping: float = 14.0
    water_depth: float = 34.0  # the water's surface below the ground
    # x: where the pool and the ground are cropped, a straight vertical cut:
    # 60% of the slide's width from its left (`SLIDE_ORIGIN`), so the pool seems
    # to go on to the right. A pool that ended in a drawn wall would be as wide as
    # the board, and read as a small pool.
    crop_right: float = 0.6 * 980 - SLIDE_ORIGIN[0]
    edge: Edge = Edge.CROP
    off_slide: float = (
        1400.0  # x: past the right of the drawing, at the pool's front too
    )

    @property
    def plank_offset(self) -> Point:
        """From the board's near edge to its far edge, as drawn."""
        return (
            self.oblique.depth_x * self.board_width,
            -self.oblique.depth_y * self.board_width,
        )

    @property
    def centre_y(self) -> float:
        """The screen y of the board's front top edge."""
        return self.oblique.project(0, self.height_above_ground, self.board_z)[1]


CROP_MARGIN = 2000.0  # px: the crop's other three sides are far outside the drawing
DESIGN = BoardDesign()


FADE_LENGTH = 85.0  # px: the fade's length, ending at `crop_right`
# The fade is a gradient of the mask's opacity: the blend of the pool with the
# paper is smootherstep(t), t from 0 to 1 across the fade, which has zero slope and
# curvature at both ends. A linear ramp (in sRGB or in linear light) has a sudden
# change of slope at each end, which the eye exaggerates into a bright or dark band
# (a Mach band). An SVG gradient is piecewise linear, so it has a stop every third
# of a pixel. The offsets must be written with enough decimals: `number()` rounds
# to 0.1, and the fade then had about ten wide steps. Measured: the render matches
# the formula to 0.003 (tasks/2026-10-03-pool-edge/evidence/).
FADE_STOPS = 256
EDGE_STEP = 3.0  # px between the points of the cutaway's line, down the drawing
EDGE_MARGIN = 8.0  # px: the cutaway starts this far above the ground's back edge
# the cutaway's zigzag: half its length in px, its amplitude, and its teeth
BREAK_BOLT = (40.0, 12.0, 2.5)
# the broken-away edge's lobes (see `broken_edge`): how far each swings sideways,
# how many full wiggles (a right lobe and a left lobe) an edge as tall as the
# slide has (the edge's own count is in proportion to its height, rounded to the
# nearest half), the slant of its centre line, and the seed of its irregularity.
BROKEN_AMPLITUDE = 9.0
BROKEN_CYCLES_PER_SLIDE = 10.0  # cycles for an edge as tall as the slide
BROKEN_SLOPE = 0.08  # px right, for each px down, of the centre line
BROKEN_VARIATION = (
    0.4,
    1.6,
)  # how far each lobe swings out is the amplitude times a number in this range
BROKEN_SEED = 1


@dataclass(frozen=True)
class DrawnEdge:
    """An edge that is a line: the region that it keeps (left of it) and the
    line itself, as SVG path data."""

    clip: str
    line: str


def cutaway_points(design: BoardDesign) -> list[Point]:
    """A break line of a technical drawing, top to bottom about the vertical line
    x = `crop_right`: a thin, nearly straight line with one sharp zigzag (a
    lightning bolt) in the middle of the drawing's height."""
    x = design.crop_right
    top = design.oblique.project(0, 0, design.ground_depth)[1] - EDGE_MARGIN
    steps = round((design.height + EDGE_MARGIN - top) / EDGE_STEP)
    middle = top + (design.height - top) / 2
    points = []
    for step in range(steps + 1):
        y = top + EDGE_STEP * step
        across = (y - middle) / BREAK_BOLT[0]  # -1 to 1 across the bolt
        bolt = (
            BREAK_BOLT[1] * (1 - 2 * abs(((across + 1) * BREAK_BOLT[2]) % 2 - 1))
            if abs(across) < 1
            else 0.0
        )
        points.append((x + 2.0 * math.sin(y / 53.0) + bolt, y))
    return points


def broken_edge(
    x: float,
    y_top: float,
    y_bottom: float,
    amplitude: float,
    cycles: float,
    drift: float,
    seed: int,
) -> list[tuple[Point, Point, Point]]:
    """The cubic curves (first control, second control, end) of an irregular,
    broken-away edge about a centre line, from (x, y_top) down to
    (x + `drift`, y_bottom): the centre line is straight, and slants to the
    right if `drift` is positive. Each curve is one lobe, alternately right and left, and each
    has the same height, and swings out by `amplitude` times a number in
    BROKEN_VARIATION, so the edge does not look like a sine wave. Both ends of a
    lobe are on the centre line; both control points move sideways, which makes one smooth
    lobe. There are two lobes to a cycle, so `cycles` is rounded to the nearest half. A seeded generator, so the file does not change
    between runs."""
    if y_bottom <= y_top:
        raise ValueError("y_bottom must be greater than y_top")
    rng = random.Random(seed)
    half_waves = max(1, round(2 * cycles))
    step = (y_bottom - y_top) / half_waves

    def centre(y: float) -> float:
        return x + drift * (y - y_top) / (y_bottom - y_top)

    lobes = []
    for index in range(half_waves):
        y = y_top + index * step
        direction = 1 if index % 2 == 0 else -1
        excursion = amplitude * rng.uniform(*BROKEN_VARIATION) * direction
        lobes.append(
            (
                (centre(y + step * 0.28) + excursion, y + step * 0.28),
                (centre(y + step * 0.72) + excursion, y + step * 0.72),
                (centre(y + step), y + step),
            )
        )
    return lobes


def drawn_edge(design: BoardDesign) -> DrawnEdge | None:
    """The edge's line and the region it keeps, or None if the edge is not a
    line. The kept region reaches far above, to the left and below the drawing."""
    left = design.view_left - CROP_MARGIN
    bottom = design.height + CROP_MARGIN
    x = design.crop_right
    if design.edge is Edge.CUTAWAY:
        points = cutaway_points(design)
        clip = path_data(
            [(left, -CROP_MARGIN), (x, -CROP_MARGIN), *points, (left, bottom)]
        )
        return DrawnEdge(clip, polyline_data(points))
    if design.edge is Edge.BROKEN:
        # from the ground's back edge to the drawing's bottom: only where the
        # ground, the wall and the water are at the right, never in the air
        top = design.oblique.project(0, 0, design.ground_depth)[1]
        edge_height = design.height - top
        slide_height = SLIDE_ORIGIN[1] + design.height
        drift = BROKEN_SLOPE * edge_height
        # the centre line is at `crop_right` less one amplitude at the bottom,
        # where the fade is all paper, and slants left going up
        x_top = x - BROKEN_AMPLITUDE - drift
        lobes = broken_edge(
            x_top,
            top,
            design.height,
            BROKEN_AMPLITUDE,
            BROKEN_CYCLES_PER_SLIDE * edge_height / slide_height,
            drift,
            BROKEN_SEED,
        )
        curves = " ".join(
            f"C {number(first[0])} {number(first[1])}, {number(second[0])} {number(second[1])}, {number(end[0])} {number(end[1])}"
            for first, second, end in lobes
        )
        line = f"M {number(x_top)} {number(top)} {curves}"
        clip = (
            f"M {number(left)} {number(-CROP_MARGIN)} L {number(x_top)} {number(-CROP_MARGIN)} "
            f"L {number(x_top)} {number(top)} {curves} L {number(lobes[-1][2][0])} {number(bottom)} "
            f"L {number(left)} {number(bottom)} Z"
        )
        return DrawnEdge(clip, line)
    return None


TIMELINE = Timeline()


def smootherstep(fraction: float) -> float:
    """0 to 1 with zero slope and curvature at both ends."""
    return fraction**3 * (fraction * (fraction * 6 - 15) + 10)


def smoothstep(fraction: float) -> float:
    return fraction * fraction * (3 - 2 * fraction)


def number(value: float) -> str:
    text = f"{value:.1f}".removesuffix(".0")
    return "0" if text == "-0" else text


def path_data(*polygons: list[Point]) -> str:
    """Closed polygons, as one path."""
    return " ".join(
        "M" + " L".join(f"{number(x)} {number(y)}" for x, y in polygon) + " Z"
        for polygon in polygons
    )


def polyline_data(points: list[Point]) -> str:
    """An open line, as a path."""
    return "M" + " L".join(f"{number(x)} {number(y)}" for x, y in points)


def tangents(run: list[Point]) -> list[Point]:
    """The unit tangent at each point of a curve: the direction from the point
    before to the point after. At each end, the next tangent mirrored in the
    end's chord, which is exact for a circular arc."""
    result: list[Point] = []
    for index in range(1, len(run) - 1):
        before, after = run[index - 1], run[index + 1]
        length = math.hypot(after[0] - before[0], after[1] - before[1])
        result.append(
            ((after[0] - before[0]) / length, (after[1] - before[1]) / length)
        )

    def mirrored(end: Point, other: Point, inner: Point) -> Point:
        length = math.hypot(other[0] - end[0], other[1] - end[1])
        chord = ((other[0] - end[0]) / length, (other[1] - end[1]) / length)
        along = 2 * (chord[0] * inner[0] + chord[1] * inner[1])
        return (along * chord[0] - inner[0], along * chord[1] - inner[1])

    first = mirrored(run[0], run[1], result[0])
    last = mirrored(run[-1], run[-2], (-result[-1][0], -result[-1][1]))
    return [first, *result, (-last[0], -last[1])]


def smooth_data(runs: list[list[Point]], *, closed: bool) -> str:
    """Smooth curves through points, as one path. Each run is a curve: a cubic
    Bezier between each pair of points, with the tangents of `tangents`, and
    handles as long as those of a circular arc with the same chord and turn (a
    third of the chord, and a little more for a big turn), so a spiral that
    `spring_rest` samples is drawn within 0.1 px. The end of each run is joined
    to the start of the next by a straight line. A polygon is closed back to the
    start of the first."""
    parts: list[str] = []
    for index, run in enumerate(runs):
        first = run[0]
        parts.append(
            ("M" if index == 0 else "L") + f"{number(first[0])} {number(first[1])}"
        )
        directions = tangents(run)
        for position, (start, end) in enumerate(pairwise(run)):
            start_direction = directions[position]
            end_direction = directions[position + 1]
            turn = math.acos(
                min(
                    1.0,
                    start_direction[0] * end_direction[0]
                    + start_direction[1] * end_direction[1],
                )
            )
            handle = (
                math.hypot(end[0] - start[0], end[1] - start[1])
                / 3
                * (1 + turn * turn / 16)
            )
            controls = [
                (
                    start[0] + start_direction[0] * handle,
                    start[1] + start_direction[1] * handle,
                ),
                (
                    end[0] - end_direction[0] * handle,
                    end[1] - end_direction[1] * handle,
                ),
                end,
            ]
            parts.append(
                "C" + " ".join(f"{number(x)} {number(y)}" for x, y in controls)
            )
    return " ".join(parts) + (" Z" if closed else "")


def mode_slope(fraction: float) -> float:
    """The slope of the first mode along the beam, 1 at the free end."""
    position = MODE_BETA_LENGTH * fraction
    end = MODE_BETA_LENGTH

    def raw(value: float) -> float:
        return (math.sinh(value) + math.sin(value)) - MODE_SIGMA * (
            math.cosh(value) - math.cos(value)
        )

    return raw(position) / raw(end)


def beam_centreline(design: BoardDesign, tip_angle: float) -> list[Point]:
    """The board's front top edge from its left end to the free end, the angle
    at the free end being `tip_angle` (radians, positive is down), of constant
    length. The part on the stand is straight, and one segment."""
    step = design.free_length / SEGMENTS
    y = design.centre_y
    points: list[Point] = [(design.board_left, y), (design.clamp_right, y)]
    x = design.clamp_right
    for index in range(SEGMENTS):
        angle = tip_angle * mode_slope((index + 0.5) / SEGMENTS)
        x += step * math.cos(angle)
        y += step * math.sin(angle)
        points.append((x, y))
    return points


def spring_rest(count: int) -> list[Point]:
    """The hairspring at rest as the slide shows it, from the stud to the
    collet, `count` points. (watch/model.ts `springPoints`, with no spread; y is
    squeezed by the view's tilt.)"""
    inner_radius, outer_radius = SPRING_RADII
    inner_angle = SPRING_OUTER_ANGLE - 360 * SPRING_TURNS
    centre_x, centre_y = SPRING_CENTRE
    points: list[Point] = []
    for index in range(count):
        from_collet = 1 - index / (count - 1)
        radius = inner_radius + from_collet * (outer_radius - inner_radius)
        angle = math.radians(
            inner_angle + from_collet * (SPRING_OUTER_ANGLE - inner_angle)
        )
        points.append(
            (
                centre_x + SPRING_SCALE * radius * math.cos(angle),
                centre_y
                + SPRING_SCALE * math.cos(SPRING_TILT) * radius * math.sin(angle),
            )
        )
    return points


def resample_by_length(points: list[Point], count: int) -> list[Point]:
    """The same polyline, as `count` points an equal distance apart along it."""
    lengths = [0.0]
    for (x0, y0), (x1, y1) in pairwise(points):
        lengths.append(lengths[-1] + math.hypot(x1 - x0, y1 - y0))
    resampled: list[Point] = []
    segment = 0
    for index in range(count):
        target = lengths[-1] * index / (count - 1)
        while segment < len(points) - 2 and lengths[segment + 1] < target:
            segment += 1
        span = lengths[segment + 1] - lengths[segment]
        fraction = (target - lengths[segment]) / span
        (x0, y0), (x1, y1) = points[segment], points[segment + 1]
        resampled.append((x0 + (x1 - x0) * fraction, y0 + (y1 - y0) * fraction))
    return resampled


def segments_polar(points: list[Point]) -> list[Point]:
    """Each segment of a polyline as (length, angle). The angle is continuous
    along the line: it is not reduced to one turn."""
    segments: list[Point] = []
    previous = 0.0
    for index, ((x0, y0), (x1, y1)) in enumerate(pairwise(points)):
        angle = math.atan2(y1 - y0, x1 - x0)
        if index:
            angle += 2 * math.pi * round((previous - angle) / (2 * math.pi))
        segments.append((math.hypot(x1 - x0, y1 - y0), angle))
        previous = angle
    return segments


def curled(start: list[Point], spiral: list[Point], mix: float) -> list[Point]:
    """The board `mix` of the way from `start` to `spiral` (both the same
    number of points; 0 is `start`, 1 is `spiral`). It mixes each segment's
    angle and length, not its position, so it is a stiff strip that winds up:
    the free end turns round and round, with no kink, and the line does not cross
    itself on the way. A strip of constant length could not end as the spiral,
    which is five times longer, so the segments grow, late, when the strip is
    already coiled and the growth does not show as a long reach."""
    board = segments_polar(start)
    spring = segments_polar(spiral)
    # the strip does not start with a turn that the spiral's start has by chance
    spring_start = spring[0][1]
    turns = round((board[0][1] - spring_start) / (2 * math.pi))
    x = start[0][0] + (spiral[0][0] - start[0][0]) * mix
    y = start[0][1] + (spiral[0][1] - start[0][1]) * mix
    points: list[Point] = [(x, y)]
    for (length0, angle0), (length1, angle1) in zip(board, spring, strict=True):
        length = length0 + (length1 - length0) * mix**2  # later: when it is coiled
        angle = angle0 + (angle1 + 2 * math.pi * turns - angle0) * mix
        x += length * math.cos(angle)
        y += length * math.sin(angle)
        points.append((x, y))
    return points


@dataclass(frozen=True)
class Board:
    """The board's three visible faces at one pose. The front and the top are
    each two curves, joined at their ends; the end is a quadrilateral."""

    front: list[list[Point]]  # the edge that faces the viewer
    top: list[list[Point]]
    end: list[Point]  # the right end, which faces right

    def paths(self) -> tuple[str, str, str]:
        return (
            smooth_data(self.front, closed=True),
            smooth_data(self.top, closed=True),
            path_data(self.end),
        )


def board_faces(near_edge: list[Point], offset: Point, thickness: float) -> Board:
    """The board with its near top edge on `near_edge`. Its far edge is the near
    edge moved by `offset`, and the thickness is below the near edge. On the
    board the offset is the plank's width, going back; on the hairspring it is
    the ribbon's height, going up, and the thickness is 0."""
    normals: list[Point] = []
    for index in range(len(near_edge)):
        before = near_edge[max(index - 1, 0)]
        after = near_edge[min(index + 1, len(near_edge) - 1)]
        length = math.hypot(after[0] - before[0], after[1] - before[1])
        normals.append(
            ((before[1] - after[1]) / length, (after[0] - before[0]) / length)
        )
    underside = [
        (x + thickness * nx, y + thickness * ny)
        for (x, y), (nx, ny) in zip(near_edge, normals, strict=True)
    ]
    far_edge = [(x + offset[0], y + offset[1]) for x, y in near_edge]
    far_underside = [(x + offset[0], y + offset[1]) for x, y in underside]
    return Board(
        front=[near_edge, underside[::-1]],
        top=[near_edge, far_edge[::-1]],
        end=[near_edge[-1], far_edge[-1], far_underside[-1], underside[-1]],
    )


def values(frames: list[str]) -> str:
    return ";".join(frames)


def animate(
    attribute: str,
    frames: list[str],
    begin: float,
    duration: float,
    *,
    repeat: bool = False,
) -> str:
    ending = 'repeatCount="indefinite"' if repeat else 'fill="freeze"'
    return (
        f'<animate attributeName="{attribute}" begin="{number(begin)}s" dur="{number(duration)}s" '
        f'{ending} values="{values(frames)}"/>'
    )


def box(
    oblique: Oblique,
    x: tuple[float, float],
    y: tuple[float, float],
    z: tuple[float, float],
) -> list[list[Point]]:
    """The faces of a box that the viewer sees: front, top and right."""
    project = oblique.project
    return [
        [
            project(x[0], y[1], z[0]),
            project(x[1], y[1], z[0]),
            project(x[1], y[0], z[0]),
            project(x[0], y[0], z[0]),
        ],
        [
            project(x[0], y[1], z[0]),
            project(x[1], y[1], z[0]),
            project(x[1], y[1], z[1]),
            project(x[0], y[1], z[1]),
        ],
        [
            project(x[1], y[1], z[0]),
            project(x[1], y[1], z[1]),
            project(x[1], y[0], z[1]),
            project(x[1], y[0], z[0]),
        ],
    ]


def wave(oblique: Oblique, x: float, y: float, z: float) -> list[Point]:
    """A ripple on the water at height `y`: a wave of one and a half periods that starts at
    (x, z), drawn through points a quarter of a period apart."""
    points: list[Point] = []
    for quarter in range(7):
        along = quarter * WAVE_LENGTH / 4 / 1.5 / 2
        screen_x, screen_y = oblique.project(x + along, y, z)
        points.append(
            (screen_x, screen_y + WAVE_HEIGHT * math.sin(math.pi / 2 * quarter))
        )
    return points


def quad(oblique: Oblique, *corners: Point3) -> list[Point]:
    return [oblique.project(*corner) for corner in corners]


def set_markup(inks: Inks, design: BoardDesign) -> list[str]:
    """The ground, the pool and the stand: what fades before the curl. The pool
    goes on in front, past the bottom of the drawing, as if its near wall were
    far below the slide: it has none."""
    oblique = design.oblique
    far, near = design.off_slide, design.ground_x
    depth = design.ground_depth
    pool_left = design.pool_x
    coping = design.coping
    water = -design.water_depth
    pool_front = -design.pool_front
    ground_top = path_data(
        quad(
            oblique,
            (near, 0, pool_front),
            (pool_left, 0, pool_front),
            (pool_left, 0, depth - coping),
            (far, 0, depth - coping),
            (far, 0, depth),
            (near, 0, depth),
        )
    )
    left_wall = quad(
        oblique,
        (pool_left, 0, pool_front),
        (pool_left, 0, depth - coping),
        (pool_left, water, depth - coping),
        (pool_left, water, pool_front),
    )
    far_wall = quad(
        oblique,
        (pool_left, 0, depth - coping),
        (far, 0, depth - coping),
        (far, water, depth - coping),
        (pool_left, water, depth - coping),
    )
    surface = quad(
        oblique,
        (pool_left, water, pool_front),
        (far, water, pool_front),
        (far, water, depth - coping),
        (pool_left, water, depth - coping),
    )
    surface_edge = quad(  # where the water meets the walls
        oblique,
        (pool_left, water, pool_front),
        (pool_left, water, depth - coping),
        (far, water, depth - coping),
    )
    ripples = [
        smooth_data([wave(oblique, start, water, z)], closed=False)
        for start, z in WAVES
    ]
    stand_top_y = design.height_above_ground - design.thickness
    stand_front, stand_top, stand_right = box(
        oblique, design.stand_x, (0, stand_top_y), design.stand_z
    )
    outline = f'fill="none" {paint(stroke=inks.context)} stroke-width="3" stroke-linejoin="round"'
    wash = paint(fill=inks.context)
    stand_hull = [
        oblique.project(design.stand_x[0], 0, design.stand_z[0]),
        oblique.project(design.stand_x[0], stand_top_y, design.stand_z[0]),
        oblique.project(design.stand_x[0], stand_top_y, design.stand_z[1]),
        oblique.project(design.stand_x[1], stand_top_y, design.stand_z[1]),
        oblique.project(design.stand_x[1], 0, design.stand_z[1]),
        oblique.project(design.stand_x[1], 0, design.stand_z[0]),
    ]
    everything = f"M{design.view_left} 0 H{design.view_left + design.width} V{design.height} H{design.view_left} Z"
    # the page can hold several of these drawings (a neighbouring slide's), and
    # a `url(#id)` finds the first id in the page: so each edge has its own ids
    crop_id = f"{CLASS_PREFIX}{design.edge.value}-crop"
    fade_id = f"{CLASS_PREFIX}{design.edge.value}-fade"
    mask_id = f"{CLASS_PREFIX}{design.edge.value}-mask"
    ground_clip_id = f"{CLASS_PREFIX}{design.edge.value}-ground-clip"
    drawn = drawn_edge(design)
    clip_shape = (
        f'<path d="{drawn.clip}"/>'
        if drawn
        else f'<rect x="{number(design.view_left - CROP_MARGIN)}" y="{number(-CROP_MARGIN)}" width="{number(design.crop_right - design.view_left + CROP_MARGIN)}" height="{number(design.height + 2 * CROP_MARGIN)}"/>'
    )
    fade_start = design.crop_right - FADE_LENGTH
    fade_defs = (
        [
            f'<linearGradient id="{fade_id}" gradientUnits="userSpaceOnUse" x1="{number(fade_start)}" x2="{number(design.crop_right)}" y1="0" y2="0">'
            + "".join(
                f'<stop offset="{index / FADE_STOPS:.5f}" stop-color="{inks.knockout.value}" stop-opacity="{1 - smootherstep(index / FADE_STOPS):.4f}"/>'
                for index in range(FADE_STOPS + 1)
            )
            + "</linearGradient>",
            # an alpha mask: only the opacity of what it holds counts
            # the mask is only as big as the drawing: with a huge one, Chromium drew
            # the fade in about ten wide steps
            f'<mask id="{mask_id}" mask-type="alpha" maskUnits="userSpaceOnUse" x="{number(design.view_left)}" y="0" width="{number(design.crop_right - design.view_left)}" height="{number(design.height)}">'
            # one rect: the gradient's first stop pads to the left of its start,
            # so no seam shows where the full part meets the fade
            + f'<rect x="{number(design.view_left)}" y="0" width="{number(design.crop_right - design.view_left)}" height="{number(design.height)}" fill="url(#{fade_id})"/></mask>',
        ]
        if design.edge is Edge.FADE
        else []
    )
    # the pool and the ground are drawn in a group that is clipped (or masked)
    # at the edge; the edge's own marks come after it, so they are not clipped
    inner = (
        f'<g mask="url(#{mask_id})">'
        if design.edge is Edge.FADE
        else "<g>"
        if design.edge is Edge.UNCROPPED
        else f'<g clip-path="url(#{crop_id})">'
    )
    return [
        "<defs>",
        f'<clipPath id="{crop_id}">{clip_shape}</clipPath>',
        *fade_defs,
        f'<clipPath id="{ground_clip_id}"><path clip-rule="evenodd" d="{everything} {path_data(stand_hull)}"/></clipPath>',
        "</defs>",
        f'<g id="diving-board-set" class="{CLASS_PREFIX}set">',
        inner,
        # the pool: the water is a wash of the art line, the walls are shaded
        f'<path d="{path_data(surface)}" {paint(fill=inks.line)} fill-opacity="{WATER_OPACITY}"/>',
        f'<path d="{path_data(left_wall)}" {wash} fill-opacity="{WALL_OPACITY}"/>',
        f'<path d="{path_data(far_wall)}" {wash} fill-opacity="{WALL_OPACITY}"/>',
        f'<g fill="none" {paint(stroke=inks.context)} stroke-width="2" stroke-linejoin="round">',
        f'<path d="{path_data(left_wall)}"/>',
        f'<path d="{path_data(far_wall)}"/>',
        "</g>",
        f'<path d="{polyline_data(surface_edge)}" fill="none" {paint(stroke=inks.line)} stroke-width="2" stroke-opacity="0.7" stroke-linejoin="round"/>',
        f'<g fill="none" {paint(stroke=inks.knockout)} stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        *(f'<path d="{ripple}"/>' for ripple in ripples),
        "</g>",
        # the ground, which the stand hides
        f'<g clip-path="url(#{ground_clip_id})">',
        f'<path d="{ground_top}" {wash} fill-opacity="{GROUND_OPACITY}"/>',
        f'<path d="{ground_top}" {outline}/>',
        "</g>",
        # the stand
        f'<path d="{path_data(stand_right)}" {wash} fill-opacity="{GROUND_OPACITY + 0.1}"/>',
        f'<path d="{path_data(stand_top)}" {wash} fill-opacity="{GROUND_OPACITY}"/>',
        f'<path d="{path_data(stand_front)}" {wash} fill-opacity="{GROUND_OPACITY + 0.05}"/>',
        f"<g {outline}>",
        f'<path d="{path_data(stand_right)}"/>',
        f'<path d="{path_data(stand_top)}"/>',
        f'<path d="{path_data(stand_front)}"/>',
        "</g>",
        "</g>",  # the clipped group
        *edge_marks(inks, drawn),
        "</g>",
    ]


def edge_marks(inks: Inks, drawn: DrawnEdge | None) -> list[str]:
    """The line drawn on the edge itself, over the clipped picture."""
    if drawn is None:
        return []
    stroke = f'fill="none" {paint(stroke=inks.context)} stroke-width="2" stroke-linejoin="round" stroke-linecap="round"'
    return [f'<path d="{drawn.line}" {stroke}/>']


def solidity_in_curl(fraction: float) -> float:
    """The thickness is gone by the time the curl is under way."""
    return 1 - smoothstep(min(fraction / 0.45, 1.0))


def build(
    inks: Inks, design: BoardDesign = DESIGN, timeline: Timeline = TIMELINE
) -> str:
    bend_frames = timeline.frames(timeline.bend)
    swing_frames = timeline.frames(timeline.period)
    curl_frames = timeline.frames(timeline.curl)

    def straight_board(angle: float) -> Board:
        return board_faces(
            beam_centreline(design, angle), design.plank_offset, design.thickness
        )

    bend = [
        straight_board(design.swing_angle * smoothstep(index / bend_frames))
        for index in range(bend_frames + 1)
    ]
    swing = [
        straight_board(
            design.swing_angle * math.cos(2 * math.pi * index / swing_frames)
        )
        for index in range(swing_frames + 1)
    ]
    start = resample_by_length(beam_centreline(design, design.swing_angle), CURL_POINTS)
    # the board's near edge becomes the ribbon's bottom edge, and its far edge
    # (the plank's width, going back) the ribbon's top edge (its height, going up)
    spiral = [(x, y + RIBBON_BOTTOM) for x, y in spring_rest(CURL_POINTS)]
    ribbon_offset = (0.0, -(RIBBON_BOTTOM + RIBBON_TOP))
    plank_x, plank_y = design.plank_offset
    curl = []
    for index in range(curl_frames + 1):
        fraction = index / curl_frames
        mix = smoothstep(fraction)
        offset = (
            plank_x + (ribbon_offset[0] - plank_x) * mix,
            plank_y + (ribbon_offset[1] - plank_y) * mix,
        )
        curl.append(
            board_faces(
                curled(start, spiral, mix),
                offset,
                design.thickness * solidity_in_curl(fraction),
            )
        )

    clips = [
        (timeline.rest, timeline.bend, bend, False),
        (timeline.swing_start, timeline.period, swing, True),
        (timeline.curl_start, timeline.curl, curl, False),
    ]
    lines = [
        (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{design.width}" height="{design.height}" '
            f'viewBox="{design.view_left} 0 {design.width} {design.height}" data-swing-start="{number(timeline.swing_start)}" '
            f'data-swing-period="{number(timeline.period)}" data-curl-start="{number(timeline.curl_start)}">'
        ),
        inks.style(),
        "<title>A diving board over the edge of a pool: it bends down, swings up and down, then curls into the hairspring</title>",
        *set_markup(inks, design),
        f'<g id="diving-board-board" {paint(fill=inks.knockout, stroke=inks.line)} stroke-width="3" stroke-linejoin="round">',
    ]
    for face, name in enumerate(("front", "top", "end")):
        lines.append(f'<path id="diving-board-{name}" d="{bend[0].paths()[face]}">')
        for begin, duration, poses, repeat in clips:
            frames = [pose.paths()[face] for pose in poses]
            lines.append("  " + animate("d", frames, begin, duration, repeat=repeat))
        lines.append("</path>")
    lines += ["</g>", "</svg>"]
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__.splitlines()[0] if __doc__ else ""
    )
    parser.add_argument(
        "--check", action="store_true", help="fail if the file on disk differs"
    )
    parser.add_argument(
        "--edge",
        choices=[edge.value for edge in Edge],
        action="append",
        help="write only this edge (repeat for more); default: every edge",
    )
    arguments = parser.parse_args()
    edges = [Edge(value) for value in arguments.edge] if arguments.edge else list(Edge)
    inks = Inks.from_theme()
    failed = False
    for edge in edges:
        output = OUTPUT_DIR / f"diving-board-{edge.value}.svg"
        text = build(inks, dataclasses.replace(DESIGN, edge=edge))
        if arguments.check:
            if not output.exists() or output.read_bytes() != text.encode("utf-8"):
                print(
                    f"{output} differs from what {pathlib.Path(__file__).name} writes",
                    file=sys.stderr,
                )
                failed = True
            continue
        output.write_bytes(text.encode("utf-8"))
        print(f"wrote {output} ({len(text)} bytes)")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
