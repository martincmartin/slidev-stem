#!/usr/bin/env python3
"""Search the skeleton watch's layout for the most clearance.

    uv run art/search_watch_layout.py      # in watches/
    uv run art/search_watch_layout.py --balance-distance 110

It changes nothing: it prints the best layouts, for a person to copy into
LAYOUT in watch_design.py and then run validate_watch_design.py. It takes
a few minutes.

The free numbers are four of LAYOUT's angles (third, fourth, escape and lever)
and its balance distance; the distances between the train's arbors are fixed
by the meshes. Each candidate is a new Layout, made from LAYOUT with those
numbers changed. A layout is allowed if every part is inside the chapter ring
and the balance is at the top left of the dial, away from the barrel fixed at
BARREL_ANGLE. The visible third-barrel gap must be 12 +/- 1 px. Its score is the
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
from dataclasses import dataclass

import watch_geometry as geometry
from watch_design import BALANCE, BARREL_ANGLE, LAYOUT, Layout, Placement

Angles = tuple[float, float, float, float]  # third, fourth, escape, lever
# (first, last, step) in degrees, for each of the Angles
COARSE: tuple[tuple[float, float, float], ...] = (
    (-70.0, 30.0, 2.0),  # fine enough to find the 12 +/- 1 px barrel gap
    (-150.0, 10.0, 10.0),
    (-210.0, -10.0, 10.0),
    (-230.0, -110.0, 10.0),
)
REFINE_ANGLE_STEPS = (-2.5, 0.0, 2.5)  # degrees, round each of the best coarse layouts
REFINE_BALANCE_DISTANCES = (105.0, 110.0, 115.0)  # px from the escape arbor
# screen angles from the watch centre: the top left of the dial
BALANCE_SIDE = (190.0, 290.0)
COARSE_SPACING, FINE_SPACING = 2.0, 1.0  # px between samples of an outline
REFINE = 10  # how many of the best coarse layouts to refine
SHOW = 8


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
        barrel_angle=BARREL_ANGLE,
        third_angle=third,
        fourth_angle=fourth,
        escape_angle=escape,
        lever_angle=lever,
        balance_distance=balance_distance,
    )


@dataclass(frozen=True)
class Candidate:
    layout: Layout
    clearances: geometry.Clearances

    @property
    def score(self) -> float:
        """The tightest of the three gaps."""
        return min(
            self.clearances.tightest_parts()[1],
            self.clearances.tightest_fork()[1],
            self.clearances.tightest_ring()[1],
        )


def evaluate(layout: Layout, spacing: float) -> Candidate | None:
    """`layout`, measured; None if it is not allowed."""
    placement = Placement(layout)
    balance = placement.arbor[BALANCE]
    balance_angle = math.degrees(math.atan2(balance[1], balance[0])) % 360
    if not BALANCE_SIDE[0] <= balance_angle <= BALANCE_SIDE[1]:
        return None
    if min(geometry.ring_gaps(placement).values()) < 0:
        return None
    # Use the same sampling as the validator even during the coarse search:
    # this gap's allowed band is narrower than the coarse outline spacing.
    if geometry.layout_constraints(placement):
        return None
    return Candidate(layout, geometry.measure(placement, spacing))


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
    current = LAYOUT
    distances: tuple[float, ...] = REFINE_BALANCE_DISTANCES
    coarse_distance = current.balance_distance
    if args.balance_distance is not None:
        distances = (args.balance_distance,)
        coarse_distance = args.balance_distance

    coarse = []
    for third, fourth, escape, lever in itertools.product(
        *(grid(*axis) for axis in COARSE)
    ):
        layout = changed(current, (third, fourth, escape, lever), coarse_distance)
        candidate = evaluate(layout, COARSE_SPACING)
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
                candidate = evaluate(layout, FINE_SPACING)
                if candidate is not None:
                    fine[layout] = candidate
    best = sorted(fine.values(), key=lambda candidate: -candidate.score)

    now = evaluate(current, FINE_SPACING)
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
        clearances = candidate.clearances
        parts, part_gap = clearances.tightest_parts()
        fork, fork_gap = clearances.tightest_fork()
        ring, ring_gap = clearances.tightest_ring()
        gaps = (
            f"parts {geometry.label(parts)} {part_gap:.1f}, "
            f"fork {geometry.label(fork)} {fork_gap:.1f}, "
            f"ring {geometry.label(ring)} {ring_gap:.1f}"
        )
        print(f"{shown}  {candidate.score:5.1f}  {gaps}{label}")


if __name__ == "__main__":
    main()
