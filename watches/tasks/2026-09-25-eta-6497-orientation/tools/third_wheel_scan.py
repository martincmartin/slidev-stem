#!/usr/bin/env python3
"""Turn the third wheel anticlockwise, toward the barrel, as far as the
layout's worst clearance allows.

    ../../../../.venv/bin/python3 third_wheel_scan.py           # in this directory
    ../../../../.venv/bin/python3 third_wheel_scan.py --carry

It starts from LAYOUT in the copy of skeleton_watch.py beside it (the layout
turned by 150 degrees), and decreases third_angle in STEP degree steps. The
fourth, escape, fork and balance arbors follow the third arbor without
turning. With --carry, they turn with it about the centre arbor: the fourth,
escape and lever angles decrease by the same step. At each angle
it prints the score of search_skeleton_watch_layout.py (the smallest of the
tightest part, fork and ring gaps) and the third-barrel gap. It stops at the
first angle where the score is under the score of LAYOUT, or where the
search does not allow the layout.
"""

import argparse
import dataclasses

import search_skeleton_watch_layout as search
import watch_geometry as geometry
from skeleton_watch import BARREL, LAYOUT, THIRD, Layout

STEP = 0.1  # degrees
SPACING = 0.25  # px between outline samples: finer than the validator's 1 px
LIMIT = 90.0  # degrees: the scan stops here if nothing else stops it


def turned(turn: float, carry: bool) -> Layout:
    """LAYOUT with the third arbor turned `turn` degrees about the centre
    arbor; with `carry`, the arbors after it turn with it."""
    if not carry:
        return dataclasses.replace(LAYOUT, third_angle=LAYOUT.third_angle + turn)
    return dataclasses.replace(
        LAYOUT,
        third_angle=LAYOUT.third_angle + turn,
        fourth_angle=LAYOUT.fourth_angle + turn,
        escape_angle=LAYOUT.escape_angle + turn,
        lever_angle=LAYOUT.lever_angle + turn,
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--carry", action="store_true", help="turn the arbors after the third too"
    )
    args = parser.parse_args()
    start = search.evaluate(LAYOUT, SPACING)
    if start is None:
        raise SystemExit("the search does not allow LAYOUT")
    floor = start.score
    print(f"LAYOUT: third_angle {LAYOUT.third_angle:g}, score {floor:.2f}")
    print(f"{'third':>7} {'score':>6} {'third-barrel':>12}  tightest")
    best = start
    for index in range(1, round(LIMIT / STEP) + 1):
        layout = turned(-index * STEP, args.carry)
        candidate = search.evaluate(layout, SPACING)
        if candidate is None:
            print(f"{layout.third_angle:7.1f}  not allowed by the search")
            break
        clearances = candidate.clearances
        parts, part_gap = clearances.tightest_parts()
        fork, fork_gap = clearances.tightest_fork()
        ring, ring_gap = clearances.tightest_ring()
        print(
            f"{layout.third_angle:7.1f} {candidate.score:6.2f} "
            f"{clearances.part_gaps[(THIRD, BARREL)]:12.2f}  "
            f"parts {geometry.label(parts)} {part_gap:.2f}, "
            f"fork {geometry.label(fork)} {fork_gap:.2f}, "
            f"ring {geometry.label(ring)} {ring_gap:.2f}"
        )
        if candidate.score < floor:
            break
        best = candidate
    print(
        f"\nsmallest third_angle with score >= {floor:.2f}: "
        f"{best.layout.third_angle:.1f} (score {best.score:.2f}, "
        f"third-barrel {best.clearances.part_gaps[(THIRD, BARREL)]:.2f})"
    )


if __name__ == "__main__":
    main()
