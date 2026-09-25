#!/usr/bin/env python3
"""Search the skeleton watch's layout for the most clearance.

    ../.venv/bin/python3 art/search-skeleton-watch-layout.py      # in watches/
    ../.venv/bin/python3 art/search-skeleton-watch-layout.py --balance-distance 110

It changes nothing: it prints the best layouts, for a person to copy into
LAYOUT in skeleton-watch.py and then run validate-skeleton-watch.py. It takes
a few minutes.

The free numbers are four of LAYOUT's angles (third, fourth, escape and lever)
and its balance distance; the distances between the train's arbors are fixed
by the meshes. Each candidate is a new Layout, made from LAYOUT with those
numbers changed. A layout is allowed if every part is inside the chapter ring
and the balance is on the left of the dial, beside the title. Its score is the
smallest of three gaps (watch_geometry.py says how they are measured):

- the tightest visible gap between two parts that do not mesh;
- the tightest gap from the fork, at either end of its swing, to a wheel;
- the tightest gap from a part to the chapter ring.

The search tries a coarse grid of the angles, then refines round the best
layouts, where it also tries other balance distances, unless
--balance-distance holds it fixed.
"""

import argparse
import dataclasses
import itertools
import math
import pathlib
import sys
from dataclasses import dataclass
from types import ModuleType
from typing import Any, ClassVar, Protocol

ART = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ART))
import watch_geometry as geometry

Angles = tuple[float, float, float, float]  # third, fourth, escape, lever
# (first, last, step) in degrees, for each of the Angles
COARSE: tuple[tuple[float, float, float], ...] = (
    (0.0, 100.0, 10.0),
    (20.0, 180.0, 10.0),
    (40.0, 240.0, 10.0),
    (140.0, 260.0, 10.0),
)
REFINE_ANGLE_STEPS = (-2.5, 0.0, 2.5)  # degrees, round each of the best coarse layouts
REFINE_BALANCE_DISTANCES = (105.0, 110.0, 115.0)  # px from the escape arbor
# screen angles from the watch centre: the left of the dial
BALANCE_SIDE = (100.0, 200.0)
COARSE_SPACING, FINE_SPACING = 2.0, 1.0  # px between samples of an outline
REFINE = 10  # how many of the best coarse layouts to refine
SHOW = 8


class Layout(Protocol):
    """What skeleton-watch.py's Layout provides. It is a dataclass, so
    dataclasses.replace() makes a changed copy."""

    __dataclass_fields__: ClassVar[dict[str, Any]]

    @property
    def third_angle(self) -> float: ...
    @property
    def fourth_angle(self) -> float: ...
    @property
    def escape_angle(self) -> float: ...
    @property
    def lever_angle(self) -> float: ...
    @property
    def balance_distance(self) -> float: ...


def angles_of(layout: Layout) -> Angles:
    return (
        layout.third_angle,
        layout.fourth_angle,
        layout.escape_angle,
        layout.lever_angle,
    )


def changed(layout: Layout, angles: Angles, balance_distance: float) -> Layout:
    """A copy of `layout` with the free numbers changed."""
    third, fourth, escape, lever = angles
    return dataclasses.replace(
        layout,
        third_angle=third,
        fourth_angle=fourth,
        escape_angle=escape,
        lever_angle=lever,
        balance_distance=balance_distance,
    )


@dataclass(frozen=True)
class Candidate:
    layout: Layout
    score: float
    wheels: tuple[str, float]
    fork: tuple[str, float]
    ring: tuple[str, float]


def evaluate(watch: ModuleType, layout: Layout, spacing: float) -> Candidate | None:
    """`layout`, scored; None if it is not allowed."""
    placement = watch.Placement(layout)
    balance = placement.arbor[watch.BALANCE]
    balance_angle = math.degrees(math.atan2(balance[1], balance[0])) % 360
    if not BALANCE_SIDE[0] <= balance_angle <= BALANCE_SIDE[1]:
        return None
    if any(
        math.hypot(*placement.arbor[part]) + part.outer > watch.RING_RADIUS
        for part in watch.STACK
    ):
        return None
    clearances = geometry.measure(watch, placement, spacing)
    wheels, fork, ring = (
        (geometry.label(key), gap)
        for key, gap in (
            clearances.tightest_wheels(),
            clearances.tightest_fork(),
            clearances.tightest_ring(),
        )
    )
    return Candidate(layout, min(wheels[1], fork[1], ring[1]), wheels, fork, ring)


def grid(first: float, last: float, step: float) -> list[float]:
    return [first + step * index for index in range(round((last - first) / step) + 1)]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--balance-distance",
        type=float,
        help="hold the balance distance at this, in px",
    )
    args = parser.parse_args()
    watch = geometry.load_watch(ART / "skeleton-watch.py")
    current: Layout = watch.LAYOUT
    distances: tuple[float, ...] = REFINE_BALANCE_DISTANCES
    coarse_distance = current.balance_distance
    if args.balance_distance is not None:
        distances = (args.balance_distance,)
        coarse_distance = args.balance_distance

    coarse = []
    for angles in itertools.product(*(grid(*axis) for axis in COARSE)):
        third, fourth, escape, lever = angles
        layout = changed(current, (third, fourth, escape, lever), coarse_distance)
        candidate = evaluate(watch, layout, COARSE_SPACING)
        if candidate is not None:
            coarse.append(candidate)
    coarse.sort(key=lambda candidate: -candidate.score)
    print(f"{len(coarse)} allowed layouts on the coarse grid")

    fine: dict[Layout, Candidate] = {}
    for seed in coarse[:REFINE]:
        seed_third, seed_fourth, seed_escape, seed_lever = angles_of(seed.layout)
        steps = itertools.product(REFINE_ANGLE_STEPS, repeat=4)
        for (third, fourth, escape, lever), distance in itertools.product(
            steps, distances
        ):
            layout = changed(
                current,
                (
                    seed_third + third,
                    seed_fourth + fourth,
                    seed_escape + escape,
                    seed_lever + lever,
                ),
                distance,
            )
            if layout not in fine:
                candidate = evaluate(watch, layout, FINE_SPACING)
                if candidate is not None:
                    fine[layout] = candidate
    best = sorted(fine.values(), key=lambda candidate: -candidate.score)

    now = evaluate(watch, current, FINE_SPACING)
    print(
        f"\n{'third':>6} {'fourth':>6} {'escape':>6} {'lever':>6} {'bal':>5}  {'score':>5}  tightest"
    )
    rows = ([now] if now else []) + best[:SHOW]
    for index, candidate in enumerate(rows):
        label = "  <- now" if now and index == 0 else ""
        shown = (
            " ".join(f"{angle:6g}" for angle in angles_of(candidate.layout))
            + f" {candidate.layout.balance_distance:5g}"
        )
        gaps = ", ".join(
            f"{kind} {name} {gap:.1f}"
            for kind, (name, gap) in (
                ("wheels", candidate.wheels),
                ("fork", candidate.fork),
                ("ring", candidate.ring),
            )
        )
        print(f"{shown}  {candidate.score:5.1f}  {gaps}{label}")


if __name__ == "__main__":
    main()
