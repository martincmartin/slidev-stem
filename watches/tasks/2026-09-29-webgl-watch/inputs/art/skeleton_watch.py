#!/usr/bin/env python3
"""The cover slide's skeleton watch, in the "Line, weighted" style.

THIS SCRIPT IS THE SOURCE of watches/public/cover/skeleton-watch.svg. To
change the drawing, edit this file and run it; do not edit the SVG.

    uv run art/skeleton_watch.py                # in watches/: writes the deck's SVG
    uv run art/skeleton_watch.py out.svg        # writes there instead
    uv run art/skeleton_watch.py out.svg --at 490 276   # the watch centre on the canvas

After every change, run the validator. It type-checks this file, checks the
layout, regenerates the SVG and runs the art checks:
    uv run art/validate_skeleton_watch.py       # in watches/

Stdlib only. The file fills the slide: width 980, height 552, and a viewBox of
the same size, so one unit is one CSS px. It uses the four art colours of
stem/docs/illustrations.md and the stroke ladder 2, 2.5, 3 and 4 CSS px.

The colours come from the talk's theme: the `theme:` line of slides.md names
it, and themes/<name>/styles/<name>.css sets the --palette-* variables.

The escapement moves in slow motion, at a beat a second, tick and tock (a
real watch beats six times a second); the hands keep real time. Every animated
attribute also has a static value equal to its first frame, so a renderer
without SMIL shows frame 0. Why the drawing is as it is:
watches/tasks/2026-09-24-cover-watch/PLAN.md; why the movement is turned as it
is, and why the hands show 2:35: watches/tasks/2026-09-25-eta-6497-orientation/.
"""

import argparse
import math
import pathlib
import re
from dataclasses import dataclass, field

Point = tuple[float, float]  # x, y in CSS px; y points down
Keyframes = tuple[list[float], list[float]]  # keyTimes, values

WIDTH, HEIGHT = 980, 552  # the slide canvas, in CSS px
TALK = pathlib.Path(__file__).resolve().parents[1]  # watches/
ORIGIN: Point = (0.0, 0.0)  # a part is drawn about its own origin, then moved


def theme_palette(talk: pathlib.Path = TALK) -> dict[str, str]:
    """The --palette-* variables of the talk's theme, as {role: "#RRGGBB"}.
    The theme is the `theme:` line in the headmatter of the talk's slides.md."""
    slides = talk / "slides.md"
    headmatter = re.match(r"---\n(.*?)\n---", slides.read_text(), re.DOTALL)
    theme = (
        re.search(r"(?m)^theme:\s*(\S+)", headmatter.group(1)) if headmatter else None
    )
    if theme is None:
        raise SystemExit(f"no `theme:` line in the headmatter of {slides}")
    name = theme.group(1)
    css = (talk.parent / "themes" / name / "styles" / f"{name}.css").read_text()
    return {
        role: value.strip().upper()
        for role, value in re.findall(r"--palette-([\w-]+)\s*:\s*([^;]+);", css)
    }


PALETTE = theme_palette()
LINE = PALETTE["art-line"]  # the movement and the hands' outlines
FRAME = PALETTE["muted"]  # the case, lugs, strap; the hands' faces
DETAIL = PALETTE["ink"]  # the minute ticks, at half opacity
KNOCKOUT = PALETTE["art-knockout"]  # lit faces: wheels, chapter ring, fork

# ---- timing -------------------------------------------------------------------
PERIOD = 2.0  # s, one full swing of the balance: two beats, a tick and a tock
AMPLITUDE = 150.0  # degrees each way from centre
PIN_ARC = 25.0  # the fork moves while the balance is within this of centre
BANK = 9.0  # degrees: the fork's swing each side of its centre line
# s: one turn of the fourth wheel and its seconds hand, at real speed:
# 6 degrees a beat, a beat a second
FOURTH_LOOP = 60.0


# ---- the parts ------------------------------------------------------------------
# A part holds only what never changes. Where its arbor is depends on the
# layout, so that is in a Placement, a side table made fresh for each layout.
# Parts compare and hash by identity (eq=False), so they can be dict keys.
# A Wheel has slots, so a misspelt attribute raises an error; it is the one
# part that changes after it is made (its `driver`).
@dataclass(eq=False, slots=True)
class Wheel:
    """A wheel and the pinion on its arbor. The train is a doubly linked list:
    `driven` is the wheel whose pinion this one's teeth turn, and `driver` the
    wheel that turns this one's pinion. A wheel's constructor sets its driven
    wheel's `driver`, so a wheel is made after the wheel it drives."""

    name: str  # for the SVG's ids and for reports
    teeth: int
    pitch_radius: float  # the circle on which it rolls against the pinion it drives
    spokes: int = 0
    leaves: int = 0  # the leaves of the pinion on its own arbor
    driven: Wheel | None = field(default=None, repr=False)
    root_radius: float | None = None  # if not pitch_radius - depth
    tip_radius: float | None = None  # if not pitch_radius + depth
    driver: Wheel | None = field(default=None, init=False, repr=False)

    def __post_init__(self) -> None:
        if self.driven is not None:
            self.driven.driver = self

    @property
    def pitch(self) -> float:
        """The arc between two teeth, on the pitch circle."""
        return 2 * math.pi * self.pitch_radius / self.teeth

    @property
    def depth(self) -> float:
        """Addendum and dedendum: 4 px, or less where the teeth are fine."""
        return min(4.0, 0.32 * self.pitch)

    @property
    def inner(self) -> float:
        """The root circle: the wheel hides what is below it inside this."""
        return (
            self.pitch_radius - self.depth
            if self.root_radius is None
            else self.root_radius
        )

    @property
    def outer(self) -> float:
        """The tip circle."""
        return (
            self.pitch_radius + self.depth
            if self.tip_radius is None
            else self.tip_radius
        )

    @property
    def pinion_radius(self) -> float:
        """The pinion on this arbor: its leaves at the pitch of its driver."""
        if self.driver is None:
            raise ValueError(f"nothing drives the {self.name} pinion")
        return self.leaves * self.driver.pitch_radius / self.driver.teeth

    @property
    def mesh_distance(self) -> float:
        """px from this arbor to the arbor of the wheel it drives."""
        if self.driven is None:
            raise ValueError(f"the {self.name} wheel drives no pinion")
        return self.pitch_radius + self.driven.pinion_radius

    @property
    def step(self) -> float:
        """Degrees a beat, clockwise. The escape wheel, which drives no
        pinion, turns half a tooth a beat, anticlockwise; each wheel before
        it turns its driven pinion that far."""
        if self.driven is None:
            return -360.0 / self.teeth / 2
        return -self.driven.step * self.driven.leaves / self.teeth


@dataclass(eq=False)
class Balance:
    name: str
    radius: float

    @property
    def inner(self) -> float:
        return self.radius

    @property
    def outer(self) -> float:
        return self.radius


@dataclass(eq=False)
class Fork:
    """The pallet fork. Its arbor is its pivot."""

    name: str


# Each wheel's teeth mesh with the pinion on the next arbor. A wheel and the
# pinion it drives share one tooth pitch, so the pinion's radius follows from
# its leaves, and the ratio of teeth to leaves is the ratio of their speeds:
#   barrel 36 / centre pinion 6   centre 32 / third pinion 4 = 8
#   third 30 / fourth pinion 4 = 7.5   fourth 16 / escape pinion 8 = 2
# A real pinion rarely has fewer than 6 leaves; 4 keeps the centre and third
# wheels' teeth coarse enough to read.
# 8 and 7.5 are a real watch's ratios, so the centre wheel and the minute hand
# on its arbor turn once an hour. 2 is not (a real one is about 10); with the
# escape wheel's 12 degrees a beat and a beat a second, it turns the fourth
# wheel 6 degrees a second: the seconds hand keeps real time. The escape
# pinion's radius is half the fourth wheel's, so it is large; the escape wheel
# is solid, so the pinion reads on its plain face.
# Made from the escape wheel back, since a wheel is made after the one it drives.
ESCAPE = Wheel(
    "escape",
    teeth=15,
    pitch_radius=27,
    spokes=5,
    leaves=8,
    root_radius=23,  # club teeth, not the usual depth
    tip_radius=33,
)
FOURTH = Wheel("fourth", teeth=16, pitch_radius=32, spokes=4, leaves=4, driven=ESCAPE)
THIRD = Wheel("third", teeth=30, pitch_radius=44, spokes=4, leaves=4, driven=FOURTH)
CENTRE = Wheel("centre", teeth=32, pitch_radius=50, spokes=5, leaves=6, driven=THIRD)
BARREL = Wheel("barrel", teeth=36, pitch_radius=74, driven=CENTRE)
TRAIN = [BARREL, CENTRE, THIRD, FOURTH, ESCAPE]
ESCAPE_SOLID = True  # small, with a large pinion: filled, not crossed out
HOUR_RATIO = 12  # the motion works under the dial turn the hour hand
BALANCE = Balance("balance", radius=56)
IMPULSE_PIN_RADIUS = 15  # the impulse jewel's distance from the balance's arbor
FORK = Fork("fork")
Part = Wheel | Balance | Fork
# The round parts. Each hides what is below it inside `inner`, and reaches
# out to `outer`.
Round = Wheel | Balance
# the round parts, back to front
STACK: list[Round] = [ESCAPE, FOURTH, THIRD, CENTRE, BARREL, BALANCE]


# ---- the layout -------------------------------------------------------------------
@dataclass(frozen=True)
class Layout:
    """The numbers that place the arbors. Angles are screen angles in degrees
    (0 = 3 o'clock, increasing clockwise), each from the arbor before it in the
    train. A wheel's distance from the arbor before it is fixed by the mesh
    (pitch radius plus pinion radius), so only these are free. A value: two
    layouts with the same numbers are equal."""

    barrel_angle: float  # from the centre arbor
    third_angle: float  # from the centre arbor
    fourth_angle: float  # from the third arbor
    escape_angle: float  # from the fourth arbor
    lever_angle: float  # from the escape arbor toward the balance
    fork_pivot_distance: float  # from the escape arbor, along lever_angle
    balance_distance: float  # from the escape arbor, along lever_angle


# The drawing's layout. As in an ETA 6497, the barrel is at 5 o'clock and the
# balance is across the dial from it, near the top. It leaves at least
# MIN_CLEARANCE between the visible parts of parts that do not mesh,
# FORK_CLEARANCE round the fork and RING_CLEARANCE inside the chapter ring:
# validate_skeleton_watch.py checks all three.
# The search also holds the barrel at 5 o'clock and keeps the visible
# third-barrel gap within 1 px of 12 px.
BARREL_ANGLE = 60.0
THIRD_BARREL_CLEARANCE = 12.0
THIRD_BARREL_TOLERANCE = 1.0
LAYOUT = Layout(
    barrel_angle=BARREL_ANGLE,
    third_angle=191.0,
    fourth_angle=243.5,
    escape_angle=288.5,
    lever_angle=353.5,
    fork_pivot_distance=36.0,
    balance_distance=110.0,
)
MIN_CLEARANCE = 8.0  # px between parts that do not mesh
FORK_CLEARANCE = 8.0  # px from the fork to the wheels it does not work on
RING_CLEARANCE = 8.0  # px from each part to the chapter ring's inside edge

# Tooth phase relative to the lever, so moving the arbors preserves both locks.
ESCAPE_PHASE = 9.5

# ---- the case, in px from the watch centre ---------------------------------------
CASE_RADIUS, BEZEL_RADIUS = (
    250,
    228,
)  # case edge; the bezel is the chapter ring's outside
RING_RADIUS = 192  # chapter ring inside


def num(value: float) -> str:
    """A coordinate for the file: one decimal, no '-0', no trailing zeros."""
    text = f"{value:.1f}".rstrip("0").rstrip(".")
    return "0" if text in ("-0", "") else text


def decimal(value: float) -> str:
    """A keyTime or an angle in a keyframe list: up to four decimals."""
    return f"{value:.4f}".rstrip("0").rstrip(".") if value else "0"


def polar(radius: float, angle_deg: float, origin: Point = ORIGIN) -> Point:
    """Polar to xy, from `origin`. The angle is in degrees on screen: 0 is
    3 o'clock, increasing clockwise, because the y axis points down."""
    theta = math.radians(angle_deg)
    return origin[0] + radius * math.cos(theta), origin[1] + radius * math.sin(theta)


def coords(point: Point) -> str:
    return f"{num(point[0])} {num(point[1])}"


def clock(clock_angle: float) -> float:
    """A clock-face angle (0 = 12 o'clock, clockwise) as a screen angle."""
    return clock_angle - 90


def direction(start: Point, end: Point) -> float:
    """The screen angle, in degrees, from `start` toward `end`."""
    return math.degrees(math.atan2(end[1] - start[1], end[0] - start[0]))


def attrs(attributes: dict[str, object]) -> str:
    return " ".join(
        f'{key.replace("_", "-")}="{value}"'
        for key, value in attributes.items()
        if value is not None
    )


def element(tag: str, **attributes: object) -> str:
    return f"<{tag} {attrs(attributes)}/>"


def wrap(tag: str, body: list[str], **attributes: object) -> str:
    return f"<{tag} {attrs(attributes)}>\n" + "\n".join(body) + f"\n</{tag}>"


def circle(centre: Point, radius: float, **attributes: object) -> str:
    return element(
        "circle", cx=num(centre[0]), cy=num(centre[1]), r=num(radius), **attributes
    )


# ---- shapes ---------------------------------------------------------------------
def gear(
    teeth: int,
    pitch_radius: float,
    phase: float = 0.0,
    addendum: float = 4,
    dedendum: float = 4,
    root_width: float = 0.56,
    tip_width: float = 0.30,
) -> str:
    """The closed outline of a toothed wheel, centred on the origin. The widths
    are fractions of the angle between two teeth."""
    tooth_angle = 360.0 / teeth
    root_radius, tip_radius = pitch_radius - dedendum, pitch_radius + addendum
    path = []
    for index in range(teeth):
        middle = phase + index * tooth_angle
        if index == 0:
            path.append(
                "M" + coords(polar(root_radius, middle - root_width * tooth_angle / 2))
            )
        path.append(
            "L" + coords(polar(tip_radius, middle - tip_width * tooth_angle / 2))
        )
        path.append(
            f"A{num(tip_radius)} {num(tip_radius)} 0 0 1 "
            + coords(polar(tip_radius, middle + tip_width * tooth_angle / 2))
        )
        path.append(
            "L" + coords(polar(root_radius, middle + root_width * tooth_angle / 2))
        )
        path.append(
            f"A{num(root_radius)} {num(root_radius)} 0 0 1 "
            + coords(
                polar(root_radius, middle + tooth_angle - root_width * tooth_angle / 2)
            )
        )
    return "".join(path) + "Z"


def escape_outline(
    teeth: int, root_radius: float, tip_radius: float, phase: float = 0.0
) -> str:
    """A lever escape wheel: club teeth whose locking face leads anticlockwise,
    the way this one turns."""
    tooth_angle = -360.0 / teeth
    path = []
    for index in range(teeth):
        tip = phase + index * tooth_angle
        if index == 0:
            path.append("M" + coords(polar(root_radius, tip - 0.9 * tooth_angle)))
        # the back of the tooth curves up to the club; the club's flat top is
        # the impulse face; the locking face drops almost radially
        path.append(
            "Q"
            + coords(polar(root_radius + 2, tip - 0.55 * tooth_angle))
            + " "
            + coords(polar(tip_radius - 2, tip - 0.22 * tooth_angle))
        )
        path.append("L" + coords(polar(tip_radius, tip)))
        path.append("L" + coords(polar(root_radius, tip + 0.04 * tooth_angle)))
        path.append(
            f"A{num(root_radius)} {num(root_radius)} 0 0 0 "
            + coords(polar(root_radius, tip + 0.1 * tooth_angle))
        )
    return "".join(path) + "Z"


def openings(
    spokes: int,
    hub_radius: float,
    rim_radius: float,
    spoke_width: float,
    phase: float = 0.0,
) -> str:
    """The gaps between straight spokes of constant width, one subpath each."""
    half_width = spoke_width / 2

    def edge(spoke_angle: float, side: int, radius: float) -> Point:
        along = math.sqrt(radius * radius - half_width * half_width)
        theta = math.radians(spoke_angle)
        return (
            along * math.cos(theta) - side * half_width * math.sin(theta),
            along * math.sin(theta) + side * half_width * math.cos(theta),
        )

    path = []
    for index in range(spokes):
        spoke = phase + index * 360.0 / spokes
        next_spoke = spoke + 360.0 / spokes
        path.append(
            "M"
            + coords(edge(spoke, +1, rim_radius))
            + f"A{num(rim_radius)} {num(rim_radius)} 0 0 1 "
            + coords(edge(next_spoke, -1, rim_radius))
            + "L"
            + coords(edge(next_spoke, -1, hub_radius))
            + f"A{num(hub_radius)} {num(hub_radius)} 0 0 0 "
            + coords(edge(spoke, +1, hub_radius))
            + "Z"
        )
    return "".join(path)


def disc(radius: float) -> str:
    return (
        f"M{num(radius)} 0A{num(radius)} {num(radius)} 0 1 1 {num(-radius)} 0"
        f"A{num(radius)} {num(radius)} 0 1 1 {num(radius)} 0Z"
    )


def ring(outer: float, inner: float) -> str:
    """An annulus as one path, for fill-rule evenodd."""
    return disc(outer) + disc(inner)


def spiral(
    inner_radius: float,
    outer_radius: float,
    inner_angle: float,
    outer_angle: float,
    segments: int,
) -> str:
    """An Archimedean spiral from (inner_radius, inner_angle) to (outer_radius,
    outer_angle), angles in degrees, as cubic Beziers. The same `segments`
    always gives the same commands, so two spirals can be frames of one
    <animate>."""
    inner_angle, outer_angle = math.radians(inner_angle), math.radians(outer_angle)
    sweep, radial_span = outer_angle - inner_angle, outer_radius - inner_radius

    def point(fraction: float) -> tuple[Point, Point]:
        radius, theta = (
            inner_radius + fraction * radial_span,
            inner_angle + fraction * sweep,
        )
        return (
            (radius * math.cos(theta), radius * math.sin(theta)),
            (
                radial_span * math.cos(theta) - radius * sweep * math.sin(theta),
                radial_span * math.sin(theta) + radius * sweep * math.cos(theta),
            ),
        )

    start, start_tangent = point(0.0)
    path = ["M" + coords(start)]
    handle = 1.0 / segments / 3
    for index in range(1, segments + 1):
        end, end_tangent = point(index / segments)
        path.append(
            "C"
            + coords(
                (
                    start[0] + start_tangent[0] * handle,
                    start[1] + start_tangent[1] * handle,
                )
            )
            + " "
            + coords(
                (end[0] - end_tangent[0] * handle, end[1] - end_tangent[1] * handle)
            )
            + " "
            + coords(end)
        )
        start, start_tangent = end, end_tangent
    return "".join(path)


def wheel(
    spec: Wheel,
    phase: float = 0.0,
    rim: float = 6,
    hub: float = 12,
    spoke_width: float = 6,
    outline: str | None = None,
    dedendum: float | None = None,
    solid: bool = False,
) -> list[str]:
    """A wheel with crossings: its lit face, the toothed outline, the openings.
    A `solid` wheel has no openings: its face is filled out to its teeth."""
    dedendum = spec.depth if dedendum is None else dedendum
    outline = outline or gear(spec.teeth, spec.pitch_radius, phase, dedendum, dedendum)
    holes = (
        ""
        if solid
        else openings(
            spec.spokes,
            hub,
            spec.pitch_radius - dedendum - rim,
            spoke_width,
            phase + 90 / spec.spokes,
        )
    )
    fine = spec.pitch < 9  # fine teeth take the thinner line
    parts = [
        element("path", d=outline + holes, fill=KNOCKOUT, fill_rule="evenodd"),
        element(
            "path",
            d=outline,
            fill="none",
            stroke=LINE,
            stroke_width="2" if fine else "2.5",
            stroke_linejoin="round",
        ),
    ]
    if holes:
        parts.append(
            element(
                "path",
                d=holes,
                fill="none",
                stroke=LINE,
                stroke_width="2",
                stroke_linejoin="round",
            )
        )
    parts.append(circle(ORIGIN, 4, fill=KNOCKOUT, stroke=LINE, stroke_width="2"))
    return parts


def pinion(leaves: int, radius: float, phase: float) -> list[str]:
    """A pinion: few, rounded leaves, at the pitch of the wheel that drives it."""
    leaf_pitch = 2 * math.pi * radius / leaves
    outline = gear(
        leaves,
        radius,
        phase,
        min(3.5, 0.3 * leaf_pitch),
        min(4.5, 0.42 * leaf_pitch),
        0.5,
        0.4,
    )
    return [
        element(
            "path",
            d=outline,
            fill=KNOCKOUT,
            stroke=LINE,
            stroke_width="2",
            stroke_linejoin="round",
        ),
        circle(ORIGIN, 3, fill=KNOCKOUT, stroke=LINE, stroke_width="2"),
    ]


def dagger(
    length: float,
    max_width: float,
    widest_at: float,
    tail: float,
    tail_width: float,
    stroke_width: str,
    turn: float = 0.0,
    neck: float | None = None,
) -> str:
    """A hand pointing at 12 from the origin, turned `turn` degrees: widest at
    `widest_at` of its length, with a short tail. A face in the frame colour,
    as sundial.svg's wall, with a deep-blue outline. With `neck`, the hand
    narrows to `tail_width` that far from the arbor, so it hides little there."""
    side = (
        [(max_width / 2, -length * widest_at)]
        + ([(tail_width / 2, -neck)] if neck else [])
        + [(tail_width / 2, tail)]
    )
    outline = (
        [(0, -length)] + side + [(-across, along) for across, along in reversed(side)]
    )
    path = "M" + "L".join(coords(corner) for corner in outline) + "Z"
    return element(
        "path",
        d=path,
        fill=FRAME,
        stroke=LINE,
        stroke_width=stroke_width,
        stroke_linejoin="round",
        transform=f"rotate({num(turn)})" if turn else None,
    )


# ---- motion -------------------------------------------------------------------------
def balance_angle(time: float) -> float:
    """Degrees, clockwise, at `time` s. At the end of its swing at time 0."""
    return AMPLITUDE * math.cos(2 * math.pi * time / PERIOD)


def tick_window() -> list[tuple[float, float]]:
    """The two parts of a period, as fractions, when the impulse pin drives
    the fork: the balance is within PIN_ARC of centre."""
    start = math.acos(PIN_ARC / AMPLITUDE) / (2 * math.pi)
    end = math.acos(-PIN_ARC / AMPLITUDE) / (2 * math.pi)
    return [(start, end), (1 - end, 1 - start)]


def stepper(duration: float, step: float) -> Keyframes:
    """keyTimes and values for a part that turns `step` degrees at each beat
    and holds still between beats, over `duration` seconds."""
    periods = duration / PERIOD
    times, values, angle_deg = [0.0], [0.0], 0.0
    for period in range(round(periods)):
        for start, end in tick_window():
            times += [(period + start) / periods, (period + end) / periods]
            values += [angle_deg, angle_deg + step]
            angle_deg += step
    return [*times, 1.0], [*values, angle_deg]


def rotor(
    duration: float, times: list[float], values: list[float], accumulate: bool = False
) -> str:
    """With `accumulate`, each repeat starts where the last one ended, so one
    period of keyframes turns a slow wheel for ever (Chromium and Firefox)."""
    return element(
        "animateTransform",
        attributeName="transform",
        type="rotate",
        values=";".join(decimal(value) for value in values),
        keyTimes=";".join(decimal(time) for time in times),
        dur=f"{duration:g}s",
        repeatCount="indefinite",
        accumulate="sum" if accumulate else None,
    )


def turning(
    centre: Point,
    body: list[str],
    duration: float,
    times: list[float],
    values: list[float],
    accumulate: bool = False,
) -> str:
    """`body` drawn about the origin, moved to `centre`, turning as `values`
    say. The static transform is the first frame."""
    inner = wrap(
        "g",
        [rotor(duration, times, values, accumulate), *body],
        transform=f"rotate({num(values[0])})" if values[0] else None,
    )
    return wrap("g", [inner], transform=f"translate({coords(centre)})")


def under(parts: list[Round], body: list[str]) -> str:
    """`body`, clipped by the hole of each of `parts` in turn."""
    for part in parts:
        body = [wrap("g", body, clip_path=f"url(#skeleton-watch-under-{part.name})")]
    return body[0]


class Placement:
    """Where each arbor is, from the watch centre, for one layout: a side
    table, so the parts hold only what never changes. The holes and the fork's
    outline follow from the arbors."""

    def __init__(self, layout: Layout) -> None:
        self.layout = layout
        third = polar(CENTRE.mesh_distance, layout.third_angle)
        fourth = polar(THIRD.mesh_distance, layout.fourth_angle, third)
        escape = polar(FOURTH.mesh_distance, layout.escape_angle, fourth)
        self.arbor: dict[Part, Point] = {
            BARREL: polar(BARREL.mesh_distance, layout.barrel_angle),
            CENTRE: ORIGIN,
            THIRD: third,
            FOURTH: fourth,
            ESCAPE: escape,
            FORK: polar(layout.fork_pivot_distance, layout.lever_angle, escape),
            BALANCE: polar(layout.balance_distance, layout.lever_angle, escape),
        }

    def hole(self, part: Round) -> str:
        """A clipPath that keeps everything except the part's inner disc: the
        part of a lower wheel that `part` covers. Ids carry the drawing's name,
        so copies of it on one page do not collide."""
        centre_x, centre_y = self.arbor[part]
        radius = part.inner
        path = (
            f"M-400 -400H400V400H-400ZM{num(centre_x + radius)} {num(centre_y)}"
            f"A{num(radius)} {num(radius)} 0 1 1 {num(centre_x - radius)} {num(centre_y)}"
            f"A{num(radius)} {num(radius)} 0 1 1 {num(centre_x + radius)} {num(centre_y)}Z"
        )
        return (
            f'<clipPath id="skeleton-watch-under-{part.name}">'
            + element("path", d=path, clip_rule="evenodd")
            + "</clipPath>"
        )

    def fork_polygon(self, bank: float) -> list[Point]:
        """The fork's outline in watch coordinates, turned `bank` degrees from
        its centre line (it swings between -BANK and +BANK)."""
        pivot, balance = self.arbor[FORK], self.arbor[BALANCE]
        mouth = math.dist(pivot, balance) - IMPULSE_PIN_RADIUS
        heading = math.radians(direction(pivot, balance) + bank)
        cos_heading, sin_heading = math.cos(heading), math.sin(heading)
        return [
            (
                pivot[0] + along * cos_heading - across * sin_heading,
                pivot[1] + along * sin_heading + across * cos_heading,
            )
            for along, across in fork_outline(mouth)
        ]


def fork_outline(mouth: float) -> list[Point]:
    """The pallet fork, as (along the lever, across it) from its pivot, with
    the lever pointing at the balance: the fork's mouth at `mouth`, its two
    pallets on the far side of the pivot, at the escape wheel."""
    return [
        (mouth - 17, 4.5),
        (mouth - 10, 11),
        (mouth + 3, 12.5),
        (mouth + 6.5, 8.5),
        (mouth - 7, 6.8),
        (mouth - 7, -6.8),
        (mouth + 6.5, -8.5),
        (mouth + 3, -12.5),
        (mouth - 10, -11),
        (mouth - 17, -4.5),
        (6, -4.5),
        # The entry pallet locks on its inside face. It cannot be a mirror
        # of the exit pallet below: that puts its body over the stopped tooth.
        (0, -26),
        (-11, -28),
        (-17, -23),
        (-16, -19),
        (-7, -24),
        (-5, 0),
        (-6, 13),
        (-13, 15),
        (-15, 19),
        (-9, 23),
        (1, 21),
        (6, 4.5),
    ]


# ---- the drawing ------------------------------------------------------------------------
def build(layout: Layout, centre_x: float, centre_y: float) -> str:
    placement = Placement(layout)
    arbor = placement.arbor
    mouth_distance = math.dist(arbor[FORK], arbor[BALANCE]) - IMPULSE_PIN_RADIUS

    # Back to front: escape wheel, fourth, third, centre, barrel. Each wheel's
    # teeth lie over the pinion they drive, so every mesh is in view. A lower
    # wheel is hidden inside the root circle of each wheel above it (the inside
    # edge of its teeth), so the gaps between teeth stay open.
    above: dict[Round, list[Round]] = {}  # the parts above each that overlap it
    for index, lower in enumerate(STACK):
        above[lower] = [
            upper
            for upper in STACK[index + 1 :]
            if math.dist(arbor[lower], arbor[upper]) < lower.outer + upper.inner
        ]
    elements = [
        wrap("defs", [placement.hole(part) for part in STACK if part is not ESCAPE])
    ]

    # ---- strap and lugs: what holds the watch -------------------------------------
    def case_y(x: float, side: int) -> float:
        """Where the case edge is at `x`: on top (side -1) or at the bottom (1)."""
        return side * math.sqrt(CASE_RADIUS**2 - x**2)

    def sweep(left: float, right: float, side: int) -> int:
        """The arc flag that follows the case edge on its outside."""
        return 1 if (right - left) * side < 0 else 0

    for side in (-1, 1):  # the top, then the bottom
        far = side * 300
        elements.append(
            element(
                "path",
                d=f"M-84 {num(far)}L-84 {num(case_y(84, side))}A{CASE_RADIUS} {CASE_RADIUS} 0 0 {sweep(-84, 84, side)} "
                f"84 {num(case_y(84, side))}L84 {num(far)}Z",
                fill=FRAME,
                fill_opacity="0.18",
                stroke=FRAME,
                stroke_width="3",
            )
        )
        for left, right in ((-112, -84), (84, 112)):
            elements.append(
                element(
                    "path",
                    d=f"M{left} {num(far)}L{left} {num(case_y(left, side))}A{CASE_RADIUS} {CASE_RADIUS} 0 0 "
                    f"{sweep(left, right, side)} {right} {num(case_y(right, side))}L{right} {num(far)}Z",
                    fill=FRAME,
                    fill_opacity="0.18",
                    stroke=FRAME,
                    stroke_width="3",
                    stroke_linejoin="round",
                )
            )
    elements.append(
        element(
            "rect",
            x=num(CASE_RADIUS - 2),
            y="-17",
            width="22",
            height="34",
            rx="4",
            fill=FRAME,
            fill_opacity="0.18",
            stroke=FRAME,
            stroke_width="3",
        )
    )  # the crown

    # ---- the case band -------------------------------------------------------------
    elements.append(
        element(
            "path",
            d=ring(CASE_RADIUS, BEZEL_RADIUS),
            fill=FRAME,
            fill_opacity="0.18",
            fill_rule="evenodd",
        )
    )

    # ---- the train, back to front -------------------------------------------------------
    # Steps: the escape wheel -12 degrees a beat, the fourth +6 (a turn a
    # minute), the centre +0.1 (a turn an hour).
    def accumulated(wheel: Wheel) -> tuple[list[float], list[float], bool]:
        """One period of the wheel's steps, repeated with accumulate."""
        return (*stepper(PERIOD, wheel.step), True)

    # Phases: at time 0 each driving wheel has a tooth on the line to the
    # pinion it drives, and that pinion has a gap facing it.
    def tooth_phase(wheel: Wheel) -> float:
        if wheel.driven is None:
            return 0.0
        return direction(arbor[wheel], arbor[wheel.driven])

    def pinion_of(wheel: Wheel) -> list[str]:
        """The pinion on the wheel's arbor, with a gap facing its driver."""
        if wheel.driver is None:
            raise ValueError(f"nothing drives the {wheel.name} pinion")
        return pinion(
            wheel.leaves,
            wheel.pinion_radius,
            direction(arbor[wheel], arbor[wheel.driver]) + 180 / wheel.leaves,
        )

    # The escape wheel: its teeth work the fork. It accumulates too: no loop of
    # its own repeats for 15 teeth, 5 spokes and a 6-leaf pinion at once, and a
    # loop that did not showed a jump at each restart.
    escape = wheel(
        ESCAPE,
        0,
        rim=5,
        hub=8,
        spoke_width=5,
        dedendum=ESCAPE.pitch_radius - ESCAPE.inner,
        outline=escape_outline(
            ESCAPE.teeth, ESCAPE.inner, ESCAPE.outer, layout.lever_angle + ESCAPE_PHASE
        ),
        solid=ESCAPE_SOLID,
    )
    elements.append(
        under(
            above[ESCAPE],
            [
                turning(
                    arbor[ESCAPE],
                    escape + pinion_of(ESCAPE),
                    PERIOD,
                    *accumulated(ESCAPE),
                )
            ],
        )
    )
    # the fourth wheel: 6 degrees a beat, one turn a minute; it carries the seconds hand
    times, values = stepper(FOURTH_LOOP, FOURTH.step)
    fourth = wheel(FOURTH, tooth_phase(FOURTH), hub=8, rim=5)
    elements.append(
        under(
            above[FOURTH],
            [
                turning(
                    arbor[FOURTH],
                    fourth + pinion_of(FOURTH),
                    FOURTH_LOOP,
                    times,
                    values,
                )
            ],
        )
    )
    third = wheel(THIRD, tooth_phase(THIRD))
    elements.append(
        under(
            above[THIRD],
            [
                turning(
                    arbor[THIRD],
                    third + pinion_of(THIRD),
                    PERIOD,
                    *accumulated(THIRD),
                )
            ],
        )
    )
    centre = wheel(CENTRE, tooth_phase(CENTRE), hub=14, spoke_width=7)
    elements.append(
        under(
            above[CENTRE],
            [
                turning(
                    arbor[CENTRE],
                    centre + pinion_of(CENTRE),
                    PERIOD,
                    *accumulated(CENTRE),
                )
            ],
        )
    )
    # the barrel, in front: its lid is cut away to show the mainspring
    outline = gear(BARREL.teeth, BARREL.pitch_radius, tooth_phase(BARREL))
    elements.append(
        under(
            above[BARREL],
            [
                turning(
                    arbor[BARREL],
                    [
                        element(
                            "path",
                            d=outline + disc(BARREL.pitch_radius - 12),
                            fill=KNOCKOUT,
                            fill_rule="evenodd",
                        ),
                        element(
                            "path",
                            d=outline,
                            fill="none",
                            stroke=LINE,
                            stroke_width="2.5",
                            stroke_linejoin="round",
                        ),
                        circle(
                            ORIGIN,
                            BARREL.pitch_radius - 12,
                            fill="none",
                            stroke=LINE,
                            stroke_width="2",
                        ),
                        element(
                            "path",
                            d=spiral(
                                19, BARREL.pitch_radius - 16, 300, 300 + 360 * 3.5, 14
                            ),
                            fill="none",
                            stroke=LINE,
                            stroke_width="2",
                            stroke_linecap="round",
                        ),
                        circle(
                            ORIGIN, 15, fill=KNOCKOUT, stroke=LINE, stroke_width="3"
                        ),
                    ],
                    PERIOD,
                    *accumulated(BARREL),
                )
            ],
        )
    )

    # ---- the balance and its hairspring ---------------------------------------------
    swing_times = [index / 24 for index in range(25)]
    swing_values = [balance_angle(index / 24 * PERIOD) for index in range(25)]
    pin_direction = direction(
        arbor[BALANCE], arbor[FORK]
    )  # the impulse pin faces the fork at rest
    balance = [
        element(
            "path",
            d=ring(BALANCE.radius, BALANCE.radius - 8),
            fill=KNOCKOUT,
            fill_rule="evenodd",
            stroke=LINE,
            stroke_width="3",
        )
    ]
    for index in range(3):
        arm_angle = pin_direction + 60 + 120 * index
        sin_arm, cos_arm = (
            math.sin(math.radians(arm_angle)),
            math.cos(math.radians(arm_angle)),
        )
        corners = [
            (
                radius * cos_arm + side * 3 * sin_arm,
                radius * sin_arm - side * 3 * cos_arm,
            )
            for radius, side in (
                (9, 1),
                (BALANCE.radius - 8, 1),
                (BALANCE.radius - 8, -1),
                (9, -1),
            )
        ]
        balance.append(
            element(
                "path",
                d="M" + "L".join(coords(corner) for corner in corners) + "Z",
                fill=KNOCKOUT,
                stroke=LINE,
                stroke_width="2",
                stroke_linejoin="round",
            )
        )
    balance.append(circle(ORIGIN, 10, fill=KNOCKOUT, stroke=LINE, stroke_width="2"))
    # the impulse jewel, on the roller: drawn over the hairspring, turning with
    # the balance, so the fork's work on it stays in view
    roller = [circle(polar(IMPULSE_PIN_RADIUS, pin_direction), 6, fill=LINE)]
    stud = (
        direction(arbor[BALANCE], arbor[CENTRE]) + 150
    )  # where the spring's outer end is held
    springs = [
        spiral(8, 38, stud - 360 * 3.25 + swing, stud, 13) for swing in swing_values
    ]
    spring = (
        f'<path d="{springs[0]}" fill="none" stroke="{LINE}" stroke-width="2" stroke-linecap="round">'
        + element(
            "animate",
            attributeName="d",
            values=";".join(springs),
            keyTimes=";".join(decimal(time) for time in swing_times),
            dur=f"{PERIOD:g}s",
            repeatCount="indefinite",
        )
        + "</path>"
    )
    elements.append(turning(arbor[BALANCE], balance, PERIOD, swing_times, swing_values))
    elements.append(
        wrap("g", [spring], transform=f"translate({coords(arbor[BALANCE])})")
    )
    elements.append(turning(arbor[BALANCE], roller, PERIOD, swing_times, swing_values))

    # ---- the pallet fork: flips at each beat -----------------------------------------
    (first_start, first_end), (second_start, second_end) = tick_window()
    fork_times = [0, first_start, first_end, second_start, second_end, 1]
    fork_values = [-BANK, -BANK, BANK, BANK, -BANK, -BANK]
    mouth = mouth_distance
    shape = fork_outline(mouth)
    heading = math.radians(direction(arbor[FORK], arbor[BALANCE]))
    cos_heading, sin_heading = math.cos(heading), math.sin(heading)
    fork = (
        "M"
        + "L".join(
            coords(
                (
                    along * cos_heading - across * sin_heading,
                    along * sin_heading + across * cos_heading,
                )
            )
            for along, across in shape
        )
        + "Z"
    )
    elements.append(
        turning(
            arbor[FORK],
            [
                element(
                    "path",
                    d=fork,
                    fill=KNOCKOUT,
                    stroke=LINE,
                    stroke_width="2.5",
                    stroke_linejoin="round",
                ),
                circle(ORIGIN, 4, fill=KNOCKOUT, stroke=LINE, stroke_width="2"),
            ],
            PERIOD,
            fork_times,
            fork_values,
        )
    )

    # ---- the seconds hand, on the fourth wheel's arbor --------------------------------
    times, values = stepper(FOURTH_LOOP, FOURTH.step)
    # a small pivot, not a cap, so the fourth pinion's mesh stays in view
    seconds = [dagger(60, 9, 0.70, 6, 2, "2", neck=16), circle(ORIGIN, 2.5, fill=LINE)]
    elements.append(turning(arbor[FOURTH], seconds, FOURTH_LOOP, times, values))

    # ---- the chapter ring: what is left of the dial ------------------------------------
    elements.append(
        element(
            "path",
            d=ring(BEZEL_RADIUS, RING_RADIUS),
            fill=KNOCKOUT,
            fill_rule="evenodd",
        )
    )
    elements.append(
        circle(ORIGIN, RING_RADIUS, fill="none", stroke=FRAME, stroke_width="2")
    )
    ticks = "".join(
        f"M{coords(polar(214, clock(minute * 6)))}L{coords(polar(221, clock(minute * 6)))}"
        for minute in range(60)
        if minute % 5
    )
    elements.append(
        element(
            "path",
            d=ticks,
            stroke=DETAIL,
            stroke_opacity="0.5",
            stroke_width="2",
            stroke_linecap="round",
        )
    )
    hours = "".join(
        f"M{coords(polar(200, clock(hour * 30)))}L{coords(polar(220, clock(hour * 30)))}"
        for hour in range(12)
    )
    elements.append(
        element("path", d=hours, stroke=LINE, stroke_width="4", stroke_linecap="round")
    )

    # ---- the case edge and the bezel ----------------------------------------------------
    elements.append(
        circle(ORIGIN, CASE_RADIUS, fill="none", stroke=FRAME, stroke_width="4")
    )
    elements.append(
        circle(ORIGIN, BEZEL_RADIUS, fill="none", stroke=FRAME, stroke_width="3")
    )

    # ---- the hands, at 2:35 ---------------------------------------------------------------
    # Not the usual 10:10 of a watch advert: that hides the balance and the
    # escapement, and 3:34 hides the mainspring.
    hour, minute = 2, 35
    hour_hand = dagger(140, 17, 0.62, 10, 3, "3", (hour + minute / 60) * 30, neck=26)
    elements.append(
        turning(
            arbor[CENTRE],
            [hour_hand],
            PERIOD,
            *stepper(PERIOD, CENTRE.step / HOUR_RATIO),
            True,
        )
    )
    minute_hand = dagger(206, 13, 0.70, 12, 3, "3", minute * 6, neck=26)
    elements.append(turning(arbor[CENTRE], [minute_hand], PERIOD, *accumulated(CENTRE)))
    # a small pivot, not a cap, so the barrel's mesh with the centre pinion shows
    elements.append(circle(ORIGIN, 3.5, fill=KNOCKOUT, stroke=LINE, stroke_width="2"))

    return (
        f'<svg width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}" '
        'xmlns="http://www.w3.org/2000/svg">\n'
        "<!-- Generated by watches/art/skeleton_watch.py. Edit that and run it, not this file. -->\n"
        f'<g transform="translate({num(centre_x)} {num(centre_y)})">\n'
        + "\n".join(elements)
        + "\n</g>\n</svg>\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "out", nargs="?", default=str(TALK / "public/cover/skeleton-watch.svg")
    )
    parser.add_argument(
        "--at", nargs=2, type=float, default=(798, 276), metavar=("X", "Y")
    )
    args = parser.parse_args()
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(build(LAYOUT, *args.at))
    print(f"wrote {out} ({out.stat().st_size / 1024:.1f} KiB)")


if __name__ == "__main__":
    main()
