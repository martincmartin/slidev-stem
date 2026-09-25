#!/usr/bin/env python3
"""Search the skeleton watch's layout for the most clearance.

    ../.venv/bin/python3 art/search-skeleton-watch-layout.py      # in watches/
    ../.venv/bin/python3 art/search-skeleton-watch-layout.py --balance-distance 110

It changes nothing: it prints the best layouts, for a person to copy into
skeleton-watch.py and then run validate-skeleton-watch.py. It takes a few
minutes.

The free numbers are THIRD_ANGLE, FOURTH_ANGLE, ESCAPE_ANGLE, LEVER_ANGLE and
BALANCE_DISTANCE (the distances between the train's arbors are fixed by the
meshes). A layout is allowed if every part is inside the chapter ring and the
balance is on the left of the dial, beside the title. Its score is the
smallest of three gaps (watch_geometry.py says how they are measured):

- the tightest visible gap between two parts that do not mesh;
- the tightest gap from the fork, at either end of its swing, to a wheel;
- the tightest gap from a part to the chapter ring.

The search tries a coarse grid of the angles, then refines round the best
layouts, where it also tries other balance distances, unless
--balance-distance holds it fixed.
"""

import argparse
import itertools
import math
import pathlib
import sys
from dataclasses import dataclass
from types import ModuleType

ART = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(ART))
import watch_geometry as geometry

PARAMETERS = (
    "THIRD_ANGLE",
    "FOURTH_ANGLE",
    "ESCAPE_ANGLE",
    "LEVER_ANGLE",
    "BALANCE_DISTANCE",
)
COARSE = {  # (first, last, step), in degrees
    "THIRD_ANGLE": (0.0, 100.0, 10.0),
    "FOURTH_ANGLE": (20.0, 180.0, 10.0),
    "ESCAPE_ANGLE": (40.0, 240.0, 10.0),
    "LEVER_ANGLE": (140.0, 260.0, 10.0),
}
REFINE_ANGLE_STEPS = (-2.5, 0.0, 2.5)  # degrees, round each of the best coarse layouts
REFINE_BALANCE_DISTANCES = (105.0, 110.0, 115.0)  # px from the escape arbor
# screen angles from the watch centre: the left of the dial
BALANCE_SIDE = (100.0, 200.0)
COARSE_SPACING, FINE_SPACING = 2.0, 1.0  # px between samples of an outline
REFINE = 10  # how many of the best coarse layouts to refine
SHOW = 8


@dataclass(frozen=True)
class Candidate:
    values: tuple[float, ...]  # in the order of PARAMETERS
    score: float
    wheels: tuple[str, float]
    fork: tuple[str, float]
    ring: tuple[str, float]


def evaluate(
    watch: ModuleType, values: tuple[float, ...], spacing: float
) -> Candidate | None:
    """The layout with these values, scored; None if it is not allowed."""
    for name, value in zip(PARAMETERS, values, strict=True):
        setattr(watch, name, value)
    positions = watch.arbors()
    balance = positions["balance"]
    balance_angle = math.degrees(math.atan2(balance[1], balance[0])) % 360
    if not BALANCE_SIDE[0] <= balance_angle <= BALANCE_SIDE[1]:
        return None
    footprints = watch.part_footprints(positions)
    if any(
        math.hypot(*part.centre) + part.outer > watch.RING_RADIUS
        for part in footprints.values()
    ):
        return None
    layout = geometry.measure(watch, spacing)
    wheels, fork, ring = (
        layout.tightest_wheels(),
        layout.tightest_fork(),
        layout.tightest_ring(),
    )
    return Candidate(values, min(wheels[1], fork[1], ring[1]), wheels, fork, ring)


def grid(first: float, last: float, step: float) -> list[float]:
    return [first + step * index for index in range(round((last - first) / step) + 1)]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--balance-distance", type=float, help="hold BALANCE_DISTANCE at this, in px"
    )
    args = parser.parse_args()
    watch = geometry.load_watch(ART / "skeleton-watch.py")
    current = tuple(float(getattr(watch, name)) for name in PARAMETERS)
    distances: tuple[float, ...] = REFINE_BALANCE_DISTANCES
    coarse_distance = current[4]
    if args.balance_distance is not None:
        distances = (args.balance_distance,)
        coarse_distance = args.balance_distance

    coarse = []
    for angles in itertools.product(*(grid(*COARSE[name]) for name in PARAMETERS[:4])):
        candidate = evaluate(watch, (*angles, coarse_distance), COARSE_SPACING)
        if candidate is not None:
            coarse.append(candidate)
    coarse.sort(key=lambda candidate: -candidate.score)
    print(f"{len(coarse)} allowed layouts on the coarse grid")

    fine: dict[tuple[float, ...], Candidate] = {}
    for seed in coarse[:REFINE]:
        steps = itertools.product(REFINE_ANGLE_STEPS, repeat=4)
        for offsets, distance in itertools.product(steps, distances):
            angles = tuple(
                angle + offset
                for angle, offset in zip(seed.values[:4], offsets, strict=True)
            )
            values = (*angles, distance)
            if values not in fine:
                candidate = evaluate(watch, values, FINE_SPACING)
                if candidate is not None:
                    fine[values] = candidate
    best = sorted(fine.values(), key=lambda candidate: -candidate.score)

    now = evaluate(watch, current, FINE_SPACING)
    print(
        f"\n{'third':>6} {'fourth':>6} {'escape':>6} {'lever':>6} {'bal':>5}  {'score':>5}  tightest"
    )
    rows = ([now] if now else []) + best[:SHOW]
    for index, candidate in enumerate(rows):
        label = "  <- now" if now and index == 0 else ""
        shown = (
            " ".join(f"{value:6g}" for value in candidate.values[:4])
            + f" {candidate.values[4]:5g}"
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
