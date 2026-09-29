#!/usr/bin/env python3
"""The skeleton watch's design: the parts, the layout and the numbers that the
layout search and the clearance checks use.

THIS SCRIPT IS THE SOURCE of watch/design.json. To change the watch's layout
or timing, edit this file and run it; do not edit the JSON. The watch's
geometry is made from the JSON in TypeScript, at load (watch/generate.ts).

    uv run art/watch_design.py                  # in watches/: writes watch/design.json
    uv run art/watch_design.py out.json         # writes there instead

After every change, run the validator. It type-checks the art scripts, checks
the layout and writes the JSON:
    uv run art/validate_watch_design.py         # in watches/

Stdlib only. The colours come from the talk's theme: the `theme:` line of
slides.md names it, and themes/<name>/styles/<name>.css sets the --palette-*
variables.

The escapement moves in slow motion, at a beat a second, tick and tock (a
real watch beats six times a second); the hands keep real time. Why the
watch is as it is: watches/tasks/2026-09-24-cover-watch/PLAN.md; why the
movement is turned as it is, and why the hands show 2:35:
watches/tasks/2026-09-25-eta-6497-orientation/. Why it is in WebGL:
watches/tasks/2026-09-28-webgl-planning/.
"""

import argparse
import json
import math
import pathlib
import re
from dataclasses import dataclass, field

Point = tuple[float, float]  # x, y in CSS px; y points down

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

    name: str  # for reports and for design.json
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
# validate_watch_design.py checks all three.
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


def polar(radius: float, angle_deg: float, origin: Point = ORIGIN) -> Point:
    """Polar to xy, from `origin`. The angle is in degrees on screen: 0 is
    3 o'clock, increasing clockwise, because the y axis points down."""
    theta = math.radians(angle_deg)
    return origin[0] + radius * math.cos(theta), origin[1] + radius * math.sin(theta)


def clock(clock_angle: float) -> float:
    """A clock-face angle (0 = 12 o'clock, clockwise) as a screen angle."""
    return clock_angle - 90


def direction(start: Point, end: Point) -> float:
    """The screen angle, in degrees, from `start` toward `end`."""
    return math.degrees(math.atan2(end[1] - start[1], end[0] - start[0]))


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


# ---- the design file ---------------------------------------------------------------
DESIGN_FILE = TALK / "watch" / "design.json"
WATCH_CENTRE: Point = (798, 276)  # the cover's watch centre on the canvas
HANDS = {"hour": 2, "minute": 35}  # 2:35: see the eta-6497-orientation task


def design(layout: Layout = LAYOUT) -> dict[str, object]:
    """Every number that the layout search and the clearance checks use, and
    nothing that only the drawing uses: the format is DesignFile in
    watch/design.ts. Names are strings here; the TypeScript turns each into a
    reference once, at load."""
    placement = Placement(layout)
    arbor = placement.arbor

    def tooth_phase(wheel: Wheel) -> float:
        """A driving wheel has a tooth on the line to the pinion it drives."""
        if wheel.driven is None:
            return 0.0
        return direction(arbor[wheel], arbor[wheel.driven])

    def pinion_phase(wheel: Wheel) -> float | None:
        """A pinion has a gap facing its driver."""
        if wheel.driver is None:
            return None
        return direction(arbor[wheel], arbor[wheel.driver]) + 180 / wheel.leaves

    def wheel_entry(wheel: Wheel) -> dict[str, object]:
        return {
            "name": wheel.name,
            "teeth": wheel.teeth,
            "pitchRadius": wheel.pitch_radius,
            "inner": wheel.inner,
            "outer": wheel.outer,
            "depth": wheel.depth,
            "pitch": wheel.pitch,
            "spokes": wheel.spokes,
            "leaves": wheel.leaves,
            "pinionRadius": None if wheel.driver is None else wheel.pinion_radius,
            "step": wheel.step,
            "arbor": list(arbor[wheel]),
            "driven": None if wheel.driven is None else wheel.driven.name,
            "toothPhase": tooth_phase(wheel),
            "pinionPhase": pinion_phase(wheel),
        }

    mouth = math.dist(arbor[FORK], arbor[BALANCE]) - IMPULSE_PIN_RADIUS
    return {
        "format": 1,
        "canvas": {"width": WIDTH, "height": HEIGHT},
        "watchCentre": list(WATCH_CENTRE),
        "palette": {
            "line": LINE,
            "frame": FRAME,
            "detail": DETAIL,
            "knockout": KNOCKOUT,
            "background": PALETTE["background"],
        },
        "timing": {
            "period": PERIOD,
            "amplitude": AMPLITUDE,
            "pinArc": PIN_ARC,
            "bank": BANK,
            "fourthLoop": FOURTH_LOOP,
            "hourRatio": HOUR_RATIO,
        },
        "wheels": [wheel_entry(wheel) for wheel in TRAIN],
        "escapeSolid": ESCAPE_SOLID,
        "escapePhase": layout.lever_angle + ESCAPE_PHASE,
        "balance": {
            "radius": BALANCE.radius,
            "arbor": list(arbor[BALANCE]),
            "impulsePinRadius": IMPULSE_PIN_RADIUS,
            "pinDirection": direction(arbor[BALANCE], arbor[FORK]),
            "studAngle": direction(arbor[BALANCE], arbor[CENTRE]) + 150,
        },
        "fork": {
            "pivot": list(arbor[FORK]),
            "heading": direction(arbor[FORK], arbor[BALANCE]),
            "outline": [list(point) for point in fork_outline(mouth)],
        },
        "stack": [part.name for part in STACK],
        "case": {
            "caseRadius": CASE_RADIUS,
            "bezelRadius": BEZEL_RADIUS,
            "ringRadius": RING_RADIUS,
        },
        "hands": HANDS,
    }


def design_text(layout: Layout = LAYOUT) -> str:
    """The text of design.json: indented, so that a git diff is readable."""
    return json.dumps(design(layout), indent=1) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("out", nargs="?", default=str(DESIGN_FILE))
    args = parser.parse_args()
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(design_text())
    print(f"wrote {out} ({out.stat().st_size / 1024:.1f} KiB)")


if __name__ == "__main__":
    main()
