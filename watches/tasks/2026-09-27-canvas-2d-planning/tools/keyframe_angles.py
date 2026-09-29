#!/usr/bin/env python3
"""Where to put keyframes between 0 and 90 degrees so that the 1 - cos mix
(tilt_animation.py's flat profile) has the same worst error in every
interval.

    ../../../../.venv/bin/python3 keyframe_angles.py      # in tools/: 1 s

The mix keeps cos(tilt) exact and moves along the chord between the two
keyframes' points (cos, sin) on the unit circle. A point at height Z (from
the pivot) is off by |Z| times the gap between the arc and the chord at the
same cosine. For an interval from a to b, with middle m = (a + b) / 2 and
half-width d = (b - a) / 2, that gap is largest at the tilt m, where it is
(1 - cos d) / sin m. The tool checks both facts by sampling, then finds, for
N interior keyframes, the angles at which every interval's largest gap is
the same, by bisection. Writes ../evidence/keyframe_angles.json.
"""

import itertools
import json
import math
import pathlib

import numpy as np

EVIDENCE = pathlib.Path(__file__).resolve().parents[1] / "evidence"
LAST_TILT = math.pi / 2
HEIGHT = 9.25  # px: the train's largest |Z| from the pivot (tilt_animation.py)
# px: the largest error known to look right while the tilt moves (the train
# with two interior keyframes, measured over the swing). 1.31 px (one
# keyframe, at its best angle of 32.28 degrees) was clearly visible. The true
# limit is somewhere between.
LOOKS_RIGHT = 0.68
INTERIOR = range(6)  # numbers of interior keyframes to solve for
TALLER = (9.25, 15.0, 20.0, 30.0, 50.0)  # px: |Z| of taller scenes, for interior_needed
# ranges inside [0, 90] degrees, to check that two interior keyframes do at
# least as well in each as in the whole range
RANGES = [
    (0, 90),
    (0, 45),
    (45, 90),
    (0, 30),
    (60, 90),
    (20, 70),
    (10, 80),
    (5, 90),
]


def gap(first: float, second: float, tilt: float) -> float:
    """Arc minus chord, in sin, at the cosine of `tilt` (radians)."""
    progress = (math.cos(first) - math.cos(tilt)) / (math.cos(first) - math.cos(second))
    chord = (1 - progress) * math.sin(first) + progress * math.sin(second)
    return math.sin(tilt) - chord


def largest_gap(first: float, second: float) -> float:
    """The closed form: (1 - cos d) / sin m."""
    return (1 - math.cos((second - first) / 2)) / math.sin((first + second) / 2)


def check(first: float, second: float) -> dict[str, object]:
    """Sample the gap across the interval: where is it largest, and how big?"""
    tilts = np.linspace(first, second, 20001)[1:-1]
    gaps = np.array([gap(first, second, float(tilt)) for tilt in tilts])
    worst = int(np.argmax(gaps))
    return {
        "interval, degrees": [
            round(math.degrees(first), 3),
            round(math.degrees(second), 3),
        ],
        "sampled worst tilt, degrees": round(math.degrees(float(tilts[worst])), 3),
        "middle, degrees": round(math.degrees((first + second) / 2), 3),
        "sampled worst gap": round(float(gaps[worst]), 8),
        "closed form": round(largest_gap(first, second), 8),
    }


def next_keyframe(start: float, end: float, target: float) -> float:
    """The keyframe after `start` whose interval's largest gap is `target`
    (or `end`, if even the interval to `end` stays below it)."""
    if largest_gap(start, end) <= target:
        return end
    low, high = start, end
    for _ in range(100):
        middle = (low + high) / 2
        if largest_gap(start, middle) < target:
            low = middle
        else:
            high = middle
    return (low + high) / 2


def equal_gaps(start: float, end: float, interior: int) -> tuple[list[float], float]:
    """Keyframes from `start` to `end` (radians, 0 <= start < end <= pi/2),
    with `interior` between, whose intervals all have the same largest gap;
    and that gap. Each interval's gap grows with its width, so for a given
    gap the keyframes are placed one after another; a bisection on the gap
    makes the last interval end exactly at `end`."""
    low, high = 0.0, largest_gap(start, end)
    for _ in range(100):
        target = (low + high) / 2
        keyframes = [start]
        while keyframes[-1] < end and len(keyframes) <= interior + 1:
            keyframes.append(next_keyframe(keyframes[-1], end, target))
        if keyframes[-1] < end:
            low = target  # too small: the keyframes run out before the end
        else:
            high = target
    keyframes = [start]
    for _ in range(interior):
        keyframes.append(next_keyframe(keyframes[-1], end, high))
    keyframes.append(end)
    return keyframes, high


def keyframe_tilts(first: float, last: float, interior: int) -> list[float]:
    """In degrees, from `first` to `last` (either way, both in [0, 90]): the
    keyframes with equal worst errors, to 0.01 degrees."""
    low, high = sorted((first, last))
    assert 0 <= low < high <= 90
    angles, _ = equal_gaps(math.radians(low), math.radians(high), interior)
    tilts = [low, *(round(math.degrees(angle), 2) for angle in angles[1:-1]), high]
    return tilts if first < last else tilts[::-1]


def interior_needed(
    first: float, last: float, height: float, limit: float = LOOKS_RIGHT
) -> int:
    """The fewest interior keyframes for a tilt from `first` to `last`
    (degrees, in [0, 90]) whose worst error, for a largest height `height`
    from the pivot (px), is at most `limit` (px)."""
    low, high = sorted((math.radians(first), math.radians(last)))
    interior = 0
    while height * equal_gaps(low, high, interior)[1] > limit:
        interior += 1
    return interior


def row(keyframes: list[float]) -> dict[str, object]:
    gaps = [largest_gap(a, b) for a, b in itertools.pairwise(keyframes)]
    walls = [
        1 - largest_gap(a, b) / math.sin((a + b) / 2)
        for a, b in itertools.pairwise(keyframes)
    ]
    return {
        "keyframes, degrees": [round(math.degrees(angle), 2) for angle in keyframes],
        "worst error per interval, px": [round(HEIGHT * value, 3) for value in gaps],
        "worst error, px": round(HEIGHT * max(gaps), 3),
        "walls at each interval's middle, fraction of true": [
            round(value, 3) for value in walls
        ],
    }


def main() -> None:
    result: dict[str, object] = {
        "height |Z|, px": HEIGHT,
        "checks (sampled against the closed form)": [
            check(math.radians(a), math.radians(b))
            for a, b in ((0, 45), (45, 90), (0, 90), (10, 35), (60, 70))
        ],
        "equal worst error": {
            f"{interior} interior": row(equal_gaps(0.0, LAST_TILT, interior)[0])
            for interior in INTERIOR
        },
        "two interior keyframes, over ranges inside 0-90 degrees": {
            f"{first}-{last}": row(
                equal_gaps(math.radians(first), math.radians(last), 2)[0]
            )
            for first, last in RANGES
        },
        f"interior keyframes needed for 0-90 degrees, worst error <= {LOOKS_RIGHT} px": {
            f"|Z| = {height:g} px": interior_needed(0, 90, height) for height in TALLER
        },
        "evenly spaced, for comparison": {
            f"{interior} interior": row(
                list(np.linspace(0.0, LAST_TILT, interior + 2).tolist())
            )
            for interior in INTERIOR
        },
    }
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "keyframe_angles.json").write_text(json.dumps(result, indent=1) + "\n")
    print(json.dumps(result, indent=1))


if __name__ == "__main__":
    main()
