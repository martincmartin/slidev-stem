#!/usr/bin/env python3
"""Write public/flexing-ruler.svg: a 12 inch steel ruler that turns edge-on, is
clamped, is pulled down by a hand and is let go.

    uv run art/flexing_ruler.py            # in watches/; writes the SVG
    uv run art/flexing_ruler.py --check    # fail if the file on disk differs

The file is a SMIL animation with one timeline (`Timeline`, seconds):

  turn      the ruler turns 90 degrees about its long axis: face-on to edge-on
  clamp     a block slides in from the left and grips the left end
  approach  a hand comes in from the right and grips the right end
  pull      the hand pulls the right end down; the left end stays horizontal
  hold      the hand holds it still
  release   the hand lets go and leaves; the ruler swings for ever

The swing has a constant amplitude, as if nothing lost energy. It is the first
vibration mode of a beam that is fixed at one end, drawn with a constant length
(the ruler does not stretch): its angle along the ruler is the mode's slope
shape, scaled by the angle of the free end. The pull uses the same shape, so
the release has no jump.

A page that shows the file drives the clock itself (components/FlexingRuler.vue):
the SVG's root has `data-swing-start`, the time at which the swing begins, so a
page can tell the start of the sequence from the start of the swing.

COLOURS. The page's theme paints the drawing. Each mark has a class, and a
<style> in the file gives each class `var(--palette-<role>, <hex>)`, so an
inlined SVG takes the colours of the slide it is on, including a slide's own
`class:`. Each mark also keeps the hex as its attribute: the house tools
(artcheck, barroom, motion) read and render the file on its own, where the
fallback paints the same pixels. The hex values are read from the theme that
the talk links, so `--check` fails when the theme changes.
"""

import argparse
import math
import pathlib
import re
import sys
from dataclasses import dataclass

TALK = pathlib.Path(__file__).resolve().parents[1]  # watches/
OUTPUT = TALK / "public" / "flexing-ruler.svg"

Point = tuple[float, float]

THEME_CSS = TALK / "node_modules" / "slidev-theme-ledger" / "styles" / "ledger.css"
CLASS_PREFIX = "flexing-ruler-"  # a <style> in an inlined SVG is the page's


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
    """The drawing's four inks (stem/docs/illustrations.md)."""

    line: Ink  # the subject: the ruler
    second: Ink  # what holds or moves it: the clamp and the hand
    tick: Ink  # the graduations
    knockout: Ink  # a pale face

    @classmethod
    def from_theme(cls, path: pathlib.Path = THEME_CSS) -> Inks:
        inks = theme_inks(path)
        roles = ("art-line", "muted", "ink", "art-knockout")
        missing = [role for role in roles if role not in inks]
        if missing:
            raise SystemExit(f"{path} sets no --palette-{', --palette-'.join(missing)}")
        return cls(*(inks[role] for role in roles))

    def style(self) -> str:
        """The <style> that paints each mark from the page's palette."""
        rules = [
            self.knockout.rule("fill"),
            self.line.rule("stroke"),
            self.second.rule("stroke"),
            self.tick.rule("stroke"),
        ]
        return "<style>\n" + "\n".join(rules) + "\n</style>"


# First vibration mode of a cantilever: beta * length, and the mode's sigma.
MODE_BETA_LENGTH = 1.8751040687119611
MODE_SIGMA = 0.7340955137
SEGMENTS = 24  # the beam's centre line is this many straight segments


@dataclass(frozen=True)
class Timeline:
    """Seconds since the start."""

    turn: float = 1.0
    clamp: float = 0.4
    approach: float = 0.6
    pull: float = 1.2
    hold: float = 0.4
    leave: float = 0.6
    period: float = 1.5  # one swing, there and back
    frames_per_second: int = 30

    def frames(self, seconds: float) -> int:
        """How many sample intervals cover `seconds`."""
        return round(seconds * self.frames_per_second)

    @property
    def pull_and_hold(self) -> float:
        return self.pull + self.hold

    @property
    def clamp_start(self) -> float:
        return self.turn

    @property
    def approach_start(self) -> float:
        return self.clamp_start + self.clamp - 0.1

    @property
    def pull_start(self) -> float:
        return self.approach_start + self.approach

    @property
    def swing_start(self) -> float:
        return self.pull_start + self.pull + self.hold


@dataclass(frozen=True)
class RulerDesign:
    """Lengths in CSS px, one SVG unit to a px, as the slide shows them."""

    width: int = 600
    height: int = 400
    ruler_left: float = 40.0
    ruler_length: float = 500.0  # 12 inches, the width of the balance wheel
    scale_margin: float = 6.0  # from the ruler's end to the 0 and 12 marks
    face_height: float = 42.0  # one inch of the face, as it is drawn
    thickness: float = 8.0  # more than a real ruler's, so it stays a solid line
    centre_y: float = 176.0
    clamp_width: float = 54.0  # the block, from the left of the ruler
    clamp_height: float = 50.0
    clamp_depth: float = 10.0  # the top face, drawn oblique
    free_length: float = 460.0  # from the clamp's right face to the free end
    swing_angle: float = math.radians(26.0)  # at the free end
    inch_tick: float = 18.0
    half_inch_tick: float = 11.0

    @property
    def ruler_right(self) -> float:
        return self.ruler_left + self.ruler_length

    @property
    def clamp_right(self) -> float:
        return self.ruler_right - self.free_length

    @property
    def inch_pitch(self) -> float:
        return (self.ruler_length - 2 * self.scale_margin) / 12


DESIGN = RulerDesign()
TIMELINE = Timeline()


def smoothstep(fraction: float) -> float:
    return fraction * fraction * (3 - 2 * fraction)


def number(value: float) -> str:
    text = f"{value:.1f}"
    return text.removesuffix(".0")


def path_data(*polygons: list[Point]) -> str:
    """Closed polygons, as one path."""
    return " ".join(
        "M" + " L".join(f"{number(x)} {number(y)}" for x, y in polygon) + " Z"
        for polygon in polygons
    )


def segments_data(segments: list[tuple[Point, Point]]) -> str:
    return " ".join(
        f"M{number(start[0])} {number(start[1])} L{number(end[0])} {number(end[1])}"
        for start, end in segments
    )


def mode_slope(fraction: float) -> float:
    """The slope of the first mode along the beam, 1 at the free end."""
    x = MODE_BETA_LENGTH * fraction
    end = MODE_BETA_LENGTH

    def raw(position: float) -> float:
        return (math.sinh(position) + math.sin(position)) - MODE_SIGMA * (
            math.cosh(position) - math.cos(position)
        )

    return raw(x) / raw(end)


def beam_centreline(design: RulerDesign, tip_angle: float) -> list[Point]:
    """The beam's centre line from the clamp to the free end, and its angle at
    the free end being `tip_angle` (radians, positive is down), of constant
    length. Then the straight part inside the clamp is put in front."""
    step = design.free_length / SEGMENTS
    points: list[Point] = [(design.ruler_left, design.centre_y)]
    x, y = design.clamp_right, design.centre_y
    points.append((x, y))
    for index in range(SEGMENTS):
        angle = tip_angle * mode_slope((index + 0.5) / SEGMENTS)
        x += step * math.cos(angle)
        y += step * math.sin(angle)
        points.append((x, y))
    return points


def band_polygon(design: RulerDesign, centreline: list[Point]) -> list[Point]:
    """The beam edge-on: the centre line, offset by half the thickness."""
    half = design.thickness / 2
    normals: list[Point] = []
    for index in range(len(centreline)):
        before = centreline[max(index - 1, 0)]
        after = centreline[min(index + 1, len(centreline) - 1)]
        length = math.hypot(after[0] - before[0], after[1] - before[1])
        normals.append(
            ((before[1] - after[1]) / length, (after[0] - before[0]) / length)
        )
    upper = [
        (x - half * nx, y - half * ny)
        for (x, y), (nx, ny) in zip(centreline, normals, strict=True)
    ]
    lower = [
        (x + half * nx, y + half * ny)
        for (x, y), (nx, ny) in zip(centreline, normals, strict=True)
    ]
    return upper + lower[::-1]


def tip_pose(design: RulerDesign, tip_angle: float) -> tuple[Point, float]:
    """Where the free end is, and its angle in degrees."""
    x, y = beam_centreline(design, tip_angle)[-1]
    return (x, y), math.degrees(tip_angle)


@dataclass(frozen=True)
class TurnedRuler:
    """The ruler at one angle of its turn, as the viewer sees it."""

    strip: list[Point]  # the lower edge, which shows as the ruler turns
    face: list[Point]
    marks: list[tuple[Point, Point]]


def turn_shapes(design: RulerDesign, turn_angle: float) -> TurnedRuler:
    """The ruler turned `turn_angle` about its long axis (0: face to the viewer,
    pi/2: edge-on, its face up). Returns the lower edge's strip, the face, and
    the marks. (Seen along the axis, a point at height u on the face and w
    through its thickness is at u cos + w sin.)"""
    cosine, sine = math.cos(turn_angle), math.sin(turn_angle)
    half_face = design.face_height / 2
    half_thickness = design.thickness / 2
    centre = design.centre_y
    left, right = design.ruler_left, design.ruler_right

    def screen_y(along_face: float, through: float) -> float:
        return centre - (along_face * cosine + through * sine)

    strip_top = screen_y(-half_face, half_thickness)
    strip_bottom = screen_y(-half_face, -half_thickness)
    strip = [
        (left, strip_top),
        (right, strip_top),
        (right, strip_bottom),
        (left, strip_bottom),
    ]
    face_top = screen_y(half_face, half_thickness)
    face_bottom = screen_y(-half_face, half_thickness)
    face = [
        (left, face_top),
        (right, face_top),
        (right, face_bottom),
        (left, face_bottom),
    ]
    marks: list[tuple[Point, Point]] = []
    for half_inch in range(25):
        x = left + design.scale_margin + half_inch * design.inch_pitch / 2
        length = design.inch_tick if half_inch % 2 == 0 else design.half_inch_tick
        marks.append(
            (
                (x, screen_y(half_face, half_thickness)),
                (x, screen_y(half_face - length, half_thickness)),
            )
        )
    return TurnedRuler(strip, face, marks)


def values(frames: list[str]) -> str:
    return ";".join(frames)


def animate(
    attribute: str,
    frames: list[str],
    begin: float,
    duration: float,
    *,
    repeat: bool = False,
    extra: str = "",
) -> str:
    ending = 'repeatCount="indefinite"' if repeat else 'fill="freeze"'
    return (
        f'<animate attributeName="{attribute}" begin="{number(begin)}s" dur="{number(duration)}s" '
        f'{ending} values="{values(frames)}"{extra}/>'
    )


def transform_animate(
    kind: str, frames: list[str], begin: float, duration: float, extra: str = ""
) -> str:
    return (
        f'<animateTransform attributeName="transform" type="{kind}" begin="{number(begin)}s" '
        f'dur="{number(duration)}s" fill="freeze" values="{values(frames)}"{extra}/>'
    )


# The hand, its origin at the grip: the end of the ruler is between the finger
# and the thumb. It reaches to the right, past the edge of the drawing.
HAND = (
    "M-18 -4 L2 -4 L2 4 L-18 4 Q-25 10.5 -18 17 L28 44 Q50 58 84 52 "
    "L200 38 L200 -70 L90 -58 Q50 -50 24 -38 L-18 -17 Q-25 -10.5 -18 -4 Z"
)
HAND_CREASE = "M30 -22 Q46 -4 34 22"


def build(
    inks: Inks, design: RulerDesign = DESIGN, timeline: Timeline = TIMELINE
) -> str:
    turn_frames = timeline.frames(timeline.turn)
    pull_frames = timeline.frames(timeline.pull_and_hold)
    swing_frames = timeline.frames(timeline.period)

    # turn
    angles = [
        math.pi / 2 * smoothstep(index / turn_frames)
        for index in range(turn_frames + 1)
    ]
    turned = [turn_shapes(design, angle) for angle in angles]
    strip_frames = [path_data(shape.strip) for shape in turned]
    face_frames = [path_data(shape.face) for shape in turned]
    mark_frames = [segments_data(shape.marks) for shape in turned]

    # pull, hold
    pull_angles = [
        design.swing_angle
        * smoothstep(min(index / timeline.frames(timeline.pull), 1.0))
        for index in range(pull_frames + 1)
    ]
    pull_beams = [
        path_data(band_polygon(design, beam_centreline(design, angle)))
        for angle in pull_angles
    ]
    pull_poses = [tip_pose(design, angle) for angle in pull_angles]

    # swing: down at the start, then up, then down again
    swing_angles = [
        design.swing_angle * math.cos(2 * math.pi * index / swing_frames)
        for index in range(swing_frames + 1)
    ]
    swing_beams = [
        path_data(band_polygon(design, beam_centreline(design, angle)))
        for angle in swing_angles
    ]

    straight_tip, _ = tip_pose(design, 0.0)
    down_tip, _ = tip_pose(design, design.swing_angle)
    away = 140.0  # how far right the hand stands when it is out of the drawing
    approach_from = f"{number(straight_tip[0] + away)} {number(straight_tip[1])}"
    approach_to = f"{number(straight_tip[0])} {number(straight_tip[1])}"
    pull_moves = [f"{number(x)} {number(y)}" for (x, y), _ in pull_poses]
    pull_turns = [number(degrees) for _, degrees in pull_poses]
    leave_from = f"{number(down_tip[0])} {number(down_tip[1])}"
    leave_to = f"{number(down_tip[0] + away)} {number(down_tip[1])}"
    spline = ' calcMode="spline" keyTimes="0;1" keySplines="0.3 0 0.2 1"'

    clamp_left = design.clamp_right - design.clamp_width
    clamp_top = design.centre_y - design.clamp_height / 2
    clamp_bottom = design.centre_y + design.clamp_height / 2
    depth = design.clamp_depth
    clamp_right = design.clamp_right
    clamp_front = path_data(
        [
            (clamp_left, clamp_top),
            (clamp_right, clamp_top),
            (clamp_right, clamp_bottom),
            (clamp_left, clamp_bottom),
        ]
    )
    clamp_top_face = path_data(
        [
            (clamp_left, clamp_top),
            (clamp_right, clamp_top),
            (clamp_right + depth, clamp_top - depth),
            (clamp_left + depth, clamp_top - depth),
        ]
    )
    clamp_side_face = path_data(
        [
            (clamp_right, clamp_top),
            (clamp_right + depth, clamp_top - depth),
            (clamp_right + depth, clamp_bottom - depth),
            (clamp_right, clamp_bottom),
        ]
    )
    clamp_from = "-70 0"

    lines = [
        (
            f'<svg xmlns="http://www.w3.org/2000/svg" width="{design.width}" height="{design.height}" '
            f'viewBox="0 0 {design.width} {design.height}" data-swing-start="{number(timeline.swing_start)}">'
        ),
        inks.style(),
        "<title>A 12 inch steel ruler, turned edge-on, clamped at one end, pulled down and let go</title>",
        f'<g id="flexing-ruler-body" {paint(fill=inks.knockout, stroke=inks.line)} stroke-width="3" stroke-linejoin="round">',
        f'<path id="flexing-ruler-edge" d="{strip_frames[0]}">',
        "  " + animate("d", strip_frames, 0, timeline.turn),
        "  " + animate("d", pull_beams, timeline.pull_start, timeline.pull_and_hold),
        "  "
        + animate("d", swing_beams, timeline.swing_start, timeline.period, repeat=True),
        "</path>",
        '<g id="flexing-ruler-face">',
        f'<path d="{face_frames[0]}">',
        "  " + animate("d", face_frames, 0, timeline.turn),
        "</path>",
        f'<path d="{mark_frames[0]}" fill="none" {paint(stroke=inks.tick)} stroke-opacity="0.6" stroke-width="2">',
        "  " + animate("d", mark_frames, 0, timeline.turn),
        "</path>",
        f'<set attributeName="display" to="none" begin="{number(timeline.turn)}s" fill="freeze"/>',
        "</g>",
        "</g>",
        f'<g id="flexing-ruler-clamp" opacity="0" transform="translate({clamp_from})" {paint(fill=inks.knockout, stroke=inks.second)} stroke-width="3" stroke-linejoin="round">',
        f'<path d="{clamp_top_face}"/>',
        f'<path d="{clamp_side_face}"/>',
        f'<path d="{clamp_front}"/>',
        f'<animate attributeName="opacity" begin="{number(timeline.clamp_start)}s" dur="0.15s" fill="freeze" values="0;1"/>',
        "  "
        + transform_animate(
            "translate",
            [clamp_from, "0 0"],
            timeline.clamp_start,
            timeline.clamp,
            spline,
        ),
        "</g>",
        f'<g id="flexing-ruler-hand" transform="translate({approach_from})">',
        transform_animate(
            "translate",
            [approach_from, approach_to],
            timeline.approach_start,
            timeline.approach,
            spline,
        ),
        transform_animate(
            "translate", pull_moves, timeline.pull_start, timeline.pull_and_hold
        ),
        transform_animate(
            "translate",
            [leave_from, leave_to],
            timeline.swing_start,
            timeline.leave,
            spline,
        ),
        '<g transform="rotate(0)">',
        transform_animate(
            "rotate", pull_turns, timeline.pull_start, timeline.pull_and_hold
        ),
        f'<path d="{HAND}" {paint(fill=inks.knockout, stroke=inks.second)} stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>',
        f'<path d="{HAND_CREASE}" fill="none" {paint(stroke=inks.second)} stroke-width="2" stroke-linecap="round"/>',
        "</g>",
        "</g>",
        "</svg>",
    ]
    return "\n".join(lines) + "\n"


def timings(text: str) -> list[tuple[str, str]]:
    """Every (begin, dur) in the SVG, in order."""
    return re.findall(r'begin="([^"]+)" dur="([^"]+)"', text)


def frame_rate_keeps_timing() -> bool:
    """The sampling density must not change when anything begins or lasts."""
    inks = Inks.from_theme()
    return timings(build(inks, timeline=Timeline(frames_per_second=30))) == timings(
        build(inks, timeline=Timeline(frames_per_second=60))
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__.splitlines()[0] if __doc__ else ""
    )
    parser.add_argument(
        "--check", action="store_true", help="fail if the file on disk differs"
    )
    arguments = parser.parse_args()
    text = build(Inks.from_theme())
    if arguments.check:
        if not frame_rate_keeps_timing():
            print("the frame rate changes a begin or a dur", file=sys.stderr)
            return 1
        if not OUTPUT.exists() or OUTPUT.read_bytes() != text.encode("utf-8"):
            print(
                f"{OUTPUT} differs from what {pathlib.Path(__file__).name} writes",
                file=sys.stderr,
            )
            return 1
        return 0
    OUTPUT.write_bytes(text.encode("utf-8"))
    print(f"wrote {OUTPUT} ({len(text)} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
