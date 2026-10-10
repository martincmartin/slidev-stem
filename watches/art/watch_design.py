#!/usr/bin/env python3
"""The skeleton watch's design: the parts, the layout and the numbers that the
layout search and the clearance checks use.

THIS SCRIPT IS THE SOURCE of watch/design.json. To change the watch's layout
or timing, edit this file and run it; do not edit the JSON. The watch's
geometry is made from the JSON in TypeScript, at load (watch/generate.ts).

    uv run art/watch_design.py                  # in watches/: writes watch/design.json
    uv run art/watch_design.py out.json         # writes there instead
    uv run art/watch_design.py --check          # fail if watch/design.json differs

After every change, run the validator. It type-checks the art scripts, checks
the layout and writes the JSON:
    uv run art/validate_watch_design.py         # in watches/

Stdlib only. The design has no colours: the watch's inks get their colours
from the theme, in the browser (watch/palette.ts).

The escapement moves in slow motion, at a beat a second, tick and tock (a
real watch beats six times a second); the hands keep real time. Why the
watch is as it is: watches/tasks/2026-09-24-cover-watch/PLAN.md; why the
movement is turned as it is:
watches/tasks/2026-09-25-eta-6497-orientation/. Why it is in WebGL:
watches/tasks/2026-09-28-webgl-planning/.
"""

import argparse
import json
import math
import pathlib
import sys
from dataclasses import dataclass, field

Point = tuple[float, float]  # x, y in CSS px; y points down

WIDTH, HEIGHT = 980, 552  # the slide canvas, in CSS px
TALK = pathlib.Path(__file__).resolve().parents[1]  # watches/
ORIGIN: Point = (0.0, 0.0)  # a part is drawn about its own origin, then moved


# ---- timing -------------------------------------------------------------------
PERIOD = 2.0  # s, one full swing of the balance: two beats, a tick and a tock
AMPLITUDE = 150.0  # degrees each way from centre
PIN_ARC = 25.0  # the fork moves while the balance is within this of centre
BANK = 9.0  # degrees: the fork's swing each side of its centre line
# The fraction of each tick window in which the fork turns but the train holds:
# the locked pallet stone must clear its tooth before the escape wheel moves.
# At 0.5 the stones never overlap the teeth (the geometry-problems task).
UNLOCK = 0.5
# s: one turn of the fourth wheel and its seconds hand, at real speed:
# 6 degrees a beat, a beat a second
FOURTH_LOOP = 60.0


# ---- the parts ------------------------------------------------------------------
def tooth_depth(pitch: float) -> float:
    """Addendum and dedendum: 4 px, or less where the teeth are fine."""
    return min(4.0, 0.32 * pitch)


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
        return tooth_depth(self.pitch)

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


@dataclass(frozen=True)
class GearSize:
    """A wheel's teeth: how many, and its pitch radius. The rest follows,
    by the train's rules."""

    teeth: int
    pitch_radius: float

    @property
    def pitch(self) -> float:
        return 2 * math.pi * self.pitch_radius / self.teeth

    @property
    def depth(self) -> float:
        return tooth_depth(self.pitch)

    @property
    def inner(self) -> float:
        return self.pitch_radius - self.depth

    @property
    def outer(self) -> float:
        return self.pitch_radius + self.depth


@dataclass(frozen=True)
class MotionWorks:
    """The gears on the dial side that turn the hour hand: a pinion on the
    centre arbor (the cannon pinion, but fixed: nothing sets the hands)
    drives the minute wheel; the minute wheel's pinion drives the hour wheel,
    which turns about the centre arbor. So the two stages go out from the
    centre and come back to it, and their centre distances are equal. Here
    each pinion drives a wheel, the reverse of the train. Why these numbers:
    watches/tasks/2026-10-09-motion-works/PLAN.md."""

    cannon_leaves: int
    minute_teeth: int
    minute_leaves: int
    hour_teeth: int
    # px of pitch radius a tooth, in the first stage
    tooth_size: float
    minute_spokes: int
    hour_spokes: int

    @property
    def centres(self) -> float:
        """px from the centre arbor to the minute wheel's arbor."""
        return self.tooth_size * (self.cannon_leaves + self.minute_teeth)

    @property
    def second_tooth_size(self) -> float:
        """px of pitch radius a tooth, in the second stage: it fits the
        same centres."""
        return self.centres / (self.minute_leaves + self.hour_teeth)

    @property
    def cannon_radius(self) -> float:
        return self.tooth_size * self.cannon_leaves

    @property
    def minute(self) -> GearSize:
        return GearSize(self.minute_teeth, self.tooth_size * self.minute_teeth)

    @property
    def minute_pinion_radius(self) -> float:
        return self.second_tooth_size * self.minute_leaves

    @property
    def hour(self) -> GearSize:
        return GearSize(self.hour_teeth, self.second_tooth_size * self.hour_teeth)

    @property
    def ratio(self) -> float:
        """Turns of the minute hand to one of the hour hand."""
        return (self.minute_teeth / self.cannon_leaves) * (
            self.hour_teeth / self.minute_leaves
        )


# 1 : 3 and then 1 : 4, as on the ETA 6497. The first stage has the centre
# wheel's tooth size, as the 8:1 stage (centre wheel to third pinion) has: the
# Hour Hand slide's one-step trial is that stage's pinion with 48 teeth.
MOTION_WORKS = MotionWorks(
    cannon_leaves=4,
    minute_teeth=12,
    minute_leaves=4,
    hour_teeth=16,
    tooth_size=CENTRE.pitch_radius / CENTRE.teeth,
    minute_spokes=4,
    hour_spokes=4,
)
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
    # the minute wheel, from the centre arbor. It is above the train, so the
    # search and the clearance checks do not move it. At 10:40 it covers
    # nothing that the hour wheel does not (the motion-works task)
    minute_angle: float = 230.0


# The drawing's layout. The train runs from the centre wheel leftwards, so that
# the Hairspring slide's hairspring is on the left of the slide (watches/docs/watch.md): the
# balance is at 11 o'clock, as in an ETA 6497. The barrel is as near 5 o'clock
# as the third wheel allows. It leaves at least
# MIN_CLEARANCE between the visible parts of parts that do not mesh,
# FORK_CLEARANCE round the fork and RING_CLEARANCE inside the chapter ring:
# validate_watch_design.py checks all three.
# The search also holds the barrel at BARREL_ANGLE and keeps the visible
# third-barrel gap within 1 px of 12 px.
BARREL_ANGLE = 112.0
THIRD_BARREL_CLEARANCE = 12.0
THIRD_BARREL_TOLERANCE = 1.0
LAYOUT = Layout(
    barrel_angle=BARREL_ANGLE,
    third_angle=-18.45,
    fourth_angle=-70.95,
    escape_angle=-115.95,
    lever_angle=-180.95,
    fork_pivot_distance=40.0,
    balance_distance=110.0,
    minute_angle=230.0,
)
MIN_CLEARANCE = 8.0  # px between parts that do not mesh
FORK_CLEARANCE = 8.0  # px from the fork to the wheels it does not work on
RING_CLEARANCE = 8.0  # px from each part to the chapter ring's inside edge

# Tooth phase relative to the lever, so moving the arbors preserves both locks.
ESCAPE_PHASE = 9.5
# The escape wheel's teeth, as watch/shapes.ts escapeOutline draws them: a
# tooth's locking face runs from its tip, on the tip circle, to the root
# circle this fraction of a tooth pitch ahead (in the wheel's turn).
LOCKING_FACE_LEAD = 0.04
# The pallet stones. When a stone locks, its face lies on the tooth's locking
# face and its inner corner is LOCK_DEPTH inside the tip circle; the other
# stone is then out of the teeth. The tooth each one locks, as a tip angle
# from the line of centres, at the fork's bank: tips are ESCAPE_PHASE - 24 k
# at the bank -BANK and ESCAPE_PHASE - 12 - 24 k at +BANK.
LOCK_DEPTH = 4.0
STONE_WIDTH = 4.5
STONE_SLANT = 1.5  # the let-off corner is this much shallower: the impulse face
STONE_LENGTH = 15.0  # from the inner corner, along the face
STONE_SHOWN = 0.5  # the fraction of its length out of the fork's arm
LOCKS = {"exit": (ESCAPE_PHASE - 48, -BANK), "entry": (ESCAPE_PHASE + 36, BANK)}

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
        self.minute_arbor = polar(MOTION_WORKS.centres, layout.minute_angle)

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
            for along, across in fork_outline(mouth, self.layout.fork_pivot_distance)
        ]


def pallet_stone(tip_angle: float, bank: float, pivot_distance: float) -> list[Point]:
    """A pallet stone as (along the lever, across it) from the fork's pivot:
    its inner (locking) corner, its let-off corner, and the two ends of the
    part that the arm holds, on the back and on the face. The stone locks the
    tooth whose tip is at `tip_angle` (degrees from the line of centres) when
    the fork is at `bank`: then its face lies on the tooth's locking face."""
    escape: Point = (-pivot_distance, 0.0)  # the escape arbor, from the pivot
    tip = polar(ESCAPE.outer, tip_angle, escape)
    root = polar(
        ESCAPE.inner, tip_angle - LOCKING_FACE_LEAD * 360 / ESCAPE.teeth, escape
    )
    length = math.dist(tip, root)
    face = ((tip[0] - root[0]) / length, (tip[1] - root[1]) / length)  # outward
    # the stone lies ahead of the tooth: on the side the wheel turns toward
    ahead = (math.sin(math.radians(tip_angle)), -math.cos(math.radians(tip_angle)))
    side = (-face[1], face[0])
    if side[0] * ahead[0] + side[1] * ahead[1] < 0:
        side = (-side[0], -side[1])

    def at(along: float, across: float) -> Point:
        # `along` from the root on the face's line, `across` into the stone
        return (
            root[0] + face[0] * along + side[0] * across,
            root[1] + face[1] * along + side[1] * across,
        )

    inner = ESCAPE.outer - LOCK_DEPTH - ESCAPE.inner  # along the face, roughly radial
    shown = inner + STONE_SHOWN * STONE_LENGTH
    corners = [
        at(inner, 0.0),
        at(inner + STONE_SLANT, STONE_WIDTH),
        at(shown + STONE_SLANT, STONE_WIDTH),
        at(shown, 0.0),
    ]
    # into the fork's frame: undo the bank at which it locks
    turn = math.radians(-bank)
    return [
        (
            x * math.cos(turn) - y * math.sin(turn),
            x * math.sin(turn) + y * math.cos(turn),
        )
        for x, y in corners
    ]


def fork_outline(mouth: float, pivot_distance: float) -> list[Point]:
    """The pallet fork, as (along the lever, across it) from its pivot, with
    the lever pointing at the balance: the fork's mouth at `mouth`, its two
    pallet stones on the far side of the pivot, at the escape wheel. Each arm
    reaches round outside the teeth and holds its stone at the far end."""
    exit_stone = pallet_stone(*LOCKS["exit"], pivot_distance)
    entry_stone = pallet_stone(*LOCKS["entry"], pivot_distance)
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
        # the exit pallet's arm: its stone locks a tooth inside the pallets'
        # span, on its inside face
        (6, -26),
        (1, -35),
        exit_stone[2],
        exit_stone[1],
        exit_stone[0],
        exit_stone[3],
        (-4, -18),
        (-2, -6),
        # the back of the pivot, clear of the tooth tips
        (-2, 6),
        # the entry pallet's arm: its stone locks a tooth from outside the span,
        # on its outside face
        (-4, 16),
        entry_stone[2],
        entry_stone[1],
        entry_stone[0],
        entry_stone[3],
        (-6, 36),
        (3, 33),
        (6, 18),
        (6, 4.5),
    ]


# ---- the design file ---------------------------------------------------------------
DESIGN_FILE = TALK / "watch" / "design.json"
WATCH_CENTRE: Point = (798, 276)  # the cover's watch centre on the canvas
HANDS = {"hour": 3, "minute": 44}


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
        "timing": {
            "period": PERIOD,
            "amplitude": AMPLITUDE,
            "pinArc": PIN_ARC,
            "bank": BANK,
            "unlock": UNLOCK,
            "fourthLoop": FOURTH_LOOP,
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
            "outline": [
                list(point) for point in fork_outline(mouth, layout.fork_pivot_distance)
            ],
        },
        "stack": [part.name for part in STACK],
        "case": {
            "caseRadius": CASE_RADIUS,
            "bezelRadius": BEZEL_RADIUS,
            "ringRadius": RING_RADIUS,
        },
        "hands": HANDS,
        "motionWorks": motion_works_entry(placement),
    }


def motion_works_entry(placement: Placement) -> dict[str, object]:
    """The motion works in design.json (MotionWorks). As in the train, a
    wheel has a tooth on the line to the pinion that it meshes with, and the
    pinion a gap there; here the pinion drives."""
    works = MOTION_WORKS
    centre = placement.arbor[CENTRE]
    minute = placement.minute_arbor
    out = direction(centre, minute)  # from the centre arbor to the minute arbor
    back = direction(minute, centre)
    cannon_step = CENTRE.step
    minute_step = -cannon_step * works.cannon_leaves / works.minute_teeth
    hour_step = -minute_step * works.minute_leaves / works.hour_teeth

    def wheel(
        name: str, size: GearSize, spokes: int, step: float, phase: float
    ) -> dict[str, object]:
        return {
            "name": name,
            "teeth": size.teeth,
            "pitchRadius": size.pitch_radius,
            "inner": size.inner,
            "outer": size.outer,
            "depth": size.depth,
            "pitch": size.pitch,
            "spokes": spokes,
            "step": step,
            "toothPhase": phase,
        }

    def pinion(
        name: str,
        leaves: int,
        radius: float,
        step: float,
        facing: float,
        arbor: Point,
    ) -> dict[str, object]:
        return {
            "name": name,
            "arbor": list(arbor),
            "leaves": leaves,
            "radius": radius,
            "step": step,
            "phase": facing + 180 / leaves,
        }

    return {
        "cannon": pinion(
            "cannon",
            works.cannon_leaves,
            works.cannon_radius,
            cannon_step,
            out,
            centre,
        ),
        "minute": {
            **wheel(
                "minute",
                works.minute,
                works.minute_spokes,
                minute_step,
                back,
            ),
            "arbor": list(minute),
            "pinion": pinion(
                "minute",
                works.minute_leaves,
                works.minute_pinion_radius,
                minute_step,
                back,
                minute,
            ),
        },
        "hour": {
            **wheel("hour", works.hour, works.hour_spokes, hour_step, out),
            "arbor": list(centre),
        },
    }


def design_text(layout: Layout = LAYOUT) -> str:
    """The text of design.json: indented, so that a git diff is readable."""
    return json.dumps(design(layout), indent=1) + "\n"


# A regenerated number may differ in its last digits between machines (numpy,
# scipy), and `pnpm format` rewrites the file's whitespace, so --check compares
# what the JSON means, not its bytes.
CHECK_TOLERANCE = 1e-9


def same_design(first: object, second: object) -> bool:
    """Whether two parsed JSON values are equal, numbers up to CHECK_TOLERANCE."""
    if isinstance(first, dict) and isinstance(second, dict):
        return first.keys() == second.keys() and all(
            same_design(first[key], second[key]) for key in first
        )
    if isinstance(first, list) and isinstance(second, list):
        return len(first) == len(second) and all(
            same_design(one, other) for one, other in zip(first, second, strict=True)
        )
    if isinstance(first, (int, float)) and isinstance(second, (int, float)):
        return abs(first - second) <= CHECK_TOLERANCE
    return first == second


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("out", nargs="?", default=str(DESIGN_FILE))
    parser.add_argument(
        "--check",
        action="store_true",
        help="fail if the file on disk means something else; write nothing",
    )
    args = parser.parse_args()
    out = pathlib.Path(args.out)
    if args.check:
        if not out.exists() or not same_design(
            json.loads(out.read_text()), json.loads(design_text())
        ):
            print(
                f"{out} differs from what {pathlib.Path(__file__).name} writes",
                file=sys.stderr,
            )
            return 1
        return 0
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(design_text())
    print(f"wrote {out} ({out.stat().st_size / 1024:.1f} KiB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
