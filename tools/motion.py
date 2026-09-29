#!/usr/bin/env python3
"""Does the ANIMATION survive the room, not just the drawing?

    .venv/bin/python3 tools/motion.py watches/public/       # a talk's art
    .venv/bin/python3 tools/motion.py new.svg               # one new drawing
    .venv/bin/python3 tools/motion.py new.svg --sep 3.0     # pick the pairing yourself
    .venv/bin/python3 tools/motion.py new.svg --json        # for another program
    .venv/bin/python3 tools/motion.py --png-pair a.png b.png    # two frames you drew

Needs playwright, Pillow and numpy. Reuses `lib.py` for the venue model and
`barroom.py` for the blur, flare and linear-light handling, so its numbers are
commensurable with barroom's.

WHY THIS EXISTS. `barroom.py` measures a single frame: how much of the drawing
survives the back row. It is structurally blind to a drawing that measures fine and
animates entirely in marks that do not -- which is not hypothetical. The water clock
shipped that way: outline `p90 7.71`, and a level change whose peak contrast was
2.34:1 with NOT ONE PIXEL of the card crossing the 3:1 floor between its two states.
A still-frame metric cannot see that, and neither could anyone on a laptop.

WHAT IT MEASURES. Render at two animation times, apply the venue's acuity blur and
ambient flare in linear light, and compare the two frames per pixel:

    dPeak   the largest WCAG contrast between a pixel's two states
    dP99    the same at the 99th percentile, so one stray pixel cannot carry it
    bands   CSS px^2 whose two states differ by at least 1.2 / 1.5 / 2.0 / 3.0 : 1,
            with each drawing at the size its file states

READ IT AS: dPeak and dP99 say how strongly the moving region changes; the bands say
how much of the card changes by at least that much. **A drawing whose motion lives in
a wash has area in the 1.2 band and nothing in the 3.0 band** -- the level moves, but
only just. That signature is the thing to look for.

CHOOSING THE TIMES, which is the whole trick. A drawing usually has one long
animation you care about and several short ones you do not (a flicker, a drip, a
dashed stream). Sampling pairs separated by HALF the longest duration puts the long
animation at opposite extremes; and when that separation is a whole number of a short
animation's periods, the short one lands at an IDENTICAL phase in both frames and
cancels exactly. This file computes the separation from the SVG's own `dur` values,
says which shorter animations cancel and which do not, and averages over four
offset pairs so one unlucky phase cannot decide the answer.

PNG PAIRS. A picture that something else drew (a talk's WebGL art, which has no
SVG) is measured from two frames of it: `--png-pair FIRST SECOND`, once for each
animation. Both are PNGs at DEVICE_SCALE, like barroom's, of the same size; the
frames are chosen by whoever draws them, so nothing here plans the times. The
scores are the same, from the same blur, flare and bands.

WHAT THE THRESHOLDS ARE NOT. 1.5:1 is borrowed from barroom's mark-detection cut so
the two tools agree on what counts as a visible difference. It is NOT a measured
psychophysical detection threshold for slow, large-area motion at 7 m -- that number
is not known here, and a moving edge is probably detectable somewhat below it. The
comparison between drawings is unaffected: everything is scored identically, so the
ORDER is trustworthy even where the absolute cut is a convention.
"""

import argparse
import json
import pathlib
import re
import sys
from dataclasses import dataclass

import barroom
import lib
import numpy as np
from PIL import Image

BANDS = [1.2, 1.5, 2.0, 3.0]
PAIR_COUNT = 4


def durations(source: str) -> list[float]:
    return sorted(
        {float(duration) for duration in re.findall(r'dur="([0-9.]+)s"', source)}
    )


@dataclass(frozen=True)
class SamplingPlan:
    """Which pairs of animation times to compare, for one drawing."""

    durations: list[float]  # the drawing's distinct animation durations, sorted
    separation: float  # s between the two times of a pair
    separation_given: bool  # on the command line, not half the longest duration
    pairs: list[tuple[float, float]]

    @property
    def longest(self) -> float:
        return self.durations[-1]

    def periods(self, duration: float) -> float:
        """How many of this animation's periods fit in the separation."""
        return self.separation / duration

    def cancels(self, duration: float) -> bool:
        """Whether this animation is at the same phase in both times of a pair."""
        periods = self.periods(duration)
        return abs(periods - round(periods)) < 1e-6


def plan(file: pathlib.Path, separation: float | None = None) -> SamplingPlan | None:
    """The pairs to compare, from ONE drawing's own durations. None if it has
    no animation.

    Per file, not pooled: the four timekeepers run at 11 / 8 / 12 / 9 s, and a
    separation that cancels one drawing's flicker says nothing about another's.
    """
    found = durations(file.read_text())
    if not found:
        return None
    longest = found[-1]
    given = separation is not None
    if separation is None:
        separation = longest / 2
    step = longest / (2 * PAIR_COUNT) if longest else 1.0
    return SamplingPlan(
        found,
        separation,
        given,
        [(index * step, index * step + separation) for index in range(PAIR_COUNT)],
    )


def plan_notes(sampling: SamplingPlan) -> list[str]:
    """The plan in words, for the footnotes under the table."""
    if sampling.separation_given:
        notes = [f"separation {sampling.separation:g}s given on the command line"]
    else:
        notes = [
            (
                f"longest animation {sampling.longest:g}s -> sampling "
                f"{sampling.separation:g}s apart (opposite extremes of it)"
            )
        ]
    for duration in sampling.durations:
        if duration == sampling.longest:
            continue
        periods = sampling.periods(duration)
        if sampling.cancels(duration):
            notes.append(
                f"  {duration:g}s animation cancels exactly ({periods:.0f} whole periods), "
                f"so it is excluded"
            )
        else:
            notes.append(
                f"  {duration:g}s animation does NOT cancel ({periods:.2f} periods) "
                f"and is included in this row's numbers"
            )
    return notes


def render_at(files: list[pathlib.Path], time: float) -> list[Image.Image]:
    """barroom's harness, pinned to `time`: one crop per file."""
    return barroom.render(files, time)[1]


def delta(
    first: Image.Image, second: Image.Image, sigma: float, flare: float
) -> barroom.Plane:
    first_luminance = barroom.luminance(
        barroom.gauss(barroom.to_linear(first), sigma) + flare
    )
    second_luminance = barroom.luminance(
        barroom.gauss(barroom.to_linear(second), sigma) + flare
    )
    return barroom.wcag(first_luminance, second_luminance)


@dataclass(frozen=True)
class Change:
    """How strongly an animation changes a picture, at one venue."""

    peak: float  # the largest contrast between a pixel's two states
    p99: float  # the same at the 99th percentile
    band_areas: dict[float, float]  # band -> CSS px^2 changing by at least it

    @property
    def in_wash(self) -> bool:
        """Changes over a wide area, and nowhere by the contrast floor."""
        return self.band_areas[lib.CONTRAST_FLOOR] < 1 and self.band_areas[1.2] > 50


@dataclass(frozen=True)
class MotionScore(Change):
    """One SVG's animation."""

    file: pathlib.Path
    sampling: SamplingPlan


@dataclass(frozen=True)
class PairScore(Change):
    """Two PNG frames of one animation."""

    first: pathlib.Path
    second: pathlib.Path


def measure(
    first: Image.Image, second: Image.Image, sigma: float, flare: float
) -> Change:
    """The change from one frame to another."""
    difference = delta(first, second, sigma, flare)
    per_csspx = barroom.DEVICE_SCALE**2
    return Change(
        float(difference.max()),
        float(np.percentile(difference, 99)),
        {band: float((difference >= band).sum()) / per_csspx for band in BANDS},
    )


def pair_scores(
    pairs: list[tuple[pathlib.Path, pathlib.Path]], venue: lib.Venue, flare: float
) -> list[PairScore]:
    """The score of each pair of PNG frames."""
    sigma = venue.blur_sigma(barroom.DEVICE_SCALE)
    scores = []
    for first, second in pairs:
        first_frame, second_frame = barroom.render([first, second])[1]
        if first_frame.size != second_frame.size:
            sys.exit(f"{first} and {second} are not the same size")
        change = measure(first_frame, second_frame, sigma, flare)
        scores.append(
            PairScore(change.peak, change.p99, change.band_areas, first, second)
        )
    return scores


def score(
    files: list[pathlib.Path],
    plans: dict[pathlib.Path, SamplingPlan | None],
    venue: lib.Venue,
    flare: float,
) -> dict[pathlib.Path, MotionScore]:
    """Each animated drawing's score. Each needed time is rendered once for
    every file; each file then uses its own times."""
    all_times = sorted(
        {
            time
            for sampling in plans.values()
            if sampling
            for pair in sampling.pairs
            for time in pair
        }
    )
    frames = {time: render_at(files, time) for time in all_times}
    sigma = venue.blur_sigma(barroom.DEVICE_SCALE)
    per_csspx = barroom.DEVICE_SCALE**2
    scores = {}
    for index, file in enumerate(files):
        sampling = plans[file]
        if sampling is None:
            continue
        peaks, p99s = [], []
        band_areas: dict[float, list[float]] = {band: [] for band in BANDS}
        for first_time, second_time in sampling.pairs:
            difference = delta(
                frames[first_time][index], frames[second_time][index], sigma, flare
            )
            peaks.append(float(difference.max()))
            p99s.append(float(np.percentile(difference, 99)))
            for band in BANDS:
                band_areas[band].append(float((difference >= band).sum()) / per_csspx)
        scores[file] = MotionScore(
            peak=float(np.mean(peaks)),
            p99=float(np.mean(p99s)),
            band_areas={
                band: float(np.mean(areas)) for band, areas in band_areas.items()
            },
            file=file,
            sampling=sampling,
        )
    return scores


def print_table(
    files: list[pathlib.Path],
    scores: dict[pathlib.Path, MotionScore],
    venue: lib.Venue,
    flare: float,
) -> None:
    print(f"MOTION at {venue.label}, flare {flare:.2f}\n")
    header = "".join(f"{'>=' + format(band, '.1f'):>9}" for band in BANDS)
    print(f"{'drawing':<22}{'dPeak':>8}{'dP99':>8}   area CSS px^2 changing by{header}")
    for file in files:
        motion = scores.get(file)
        if motion is None:
            print(f"{barroom.label_for(file, files):<22}{'  (no animation)':>8}")
            continue
        cells = "".join(f"{motion.band_areas[band]:>9.0f}" for band in BANDS)
        flag = " !" if motion.in_wash else ""
        print(
            f"{barroom.label_for(file):<22}{motion.peak:>8.2f}{motion.p99:>8.2f}"
            f"{'':>26}{cells}{flag}"
        )

    print()
    for file, size in zip(files, barroom.sizes(files), strict=True):
        motion = scores.get(file)
        if motion is None:
            continue
        print(
            f"{barroom.label_for(file, files)} ({size.width:g}x{size.height:g} = "
            f"{size.width * size.height:.0f} CSS px^2 in total): "
            + ", ".join(
                f"({first:g},{second:g})" for first, second in motion.sampling.pairs
            )
        )
        for note in plan_notes(motion.sampling):
            print(f"    {note}")
    weak = [
        barroom.label_for(file)
        for file in files
        if file in scores and scores[file].in_wash
    ]
    if weak:
        print(f"\nMOTION IN A WASH: {', '.join(weak)}")
        print(
            "  These change over a wide area and nowhere by 3:1. The animation is\n"
            "  drawn in marks the back row cannot resolve -- see docs/legibility.md,\n"
            "  'put the motion in the marks that survive'."
        )
    else:
        print("no drawing animates only in marks below the floor.")


def print_pairs(scores: list[PairScore], venue: lib.Venue, flare: float) -> None:
    print(f"MOTION between PNG frames, at {venue.label}, flare {flare:.2f}\n")
    header = "".join(f"{'>=' + format(band, '.1f'):>9}" for band in BANDS)
    print(
        f"{'first frame':<22}{'dPeak':>8}{'dP99':>8}   area CSS px^2 changing by{header}"
    )
    for score_ in scores:
        cells = "".join(f"{score_.band_areas[band]:>9.0f}" for band in BANDS)
        flag = " !" if score_.in_wash else ""
        print(
            f"{score_.first.stem[:21]:<22}{score_.peak:>8.2f}{score_.p99:>8.2f}"
            f"{'':>26}{cells}{flag}"
        )
    for score_ in scores:
        print(f"{score_.first.stem[:21]} against {score_.second.name}")


def as_json(
    files: list[pathlib.Path],
    scores: dict[pathlib.Path, MotionScore],
    pairs: list[PairScore],
    venue: lib.Venue,
    flare: float,
) -> str:
    drawings: list[dict[str, object]] = []
    for file in files:
        entry: dict[str, object] = {
            "path": str(lib.display_path(file)),
            "label": barroom.label_for(file, files),
            "animated": file in scores,
        }
        motion = scores.get(file)
        if motion is not None:
            entry |= {
                "separation": motion.sampling.separation,
                "pairs": motion.sampling.pairs,
                "peak": motion.peak,
                "p99": motion.p99,
                "bands": {
                    f"{band:.1f}": area for band, area in motion.band_areas.items()
                },
                "in_wash": motion.in_wash,
            }
        drawings.append(entry)
    drawings.extend(
        {
            "path": str(lib.display_path(score_.first)),
            "label": score_.first.stem[:21],
            "animated": True,
            "pair": [
                str(lib.display_path(score_.first)),
                str(lib.display_path(score_.second)),
            ],
            "peak": score_.peak,
            "p99": score_.p99,
            "bands": {f"{band:.1f}": area for band, area in score_.band_areas.items()},
            "in_wash": score_.in_wash,
        }
        for score_ in pairs
    )
    return json.dumps(
        {
            "venue": venue.label,
            "flare": flare,
            "floor": lib.CONTRAST_FLOOR,
            "drawings": drawings,
        },
        indent=2,
    )


def venue_argument(label: str) -> lib.Venue:
    try:
        return lib.venue_named(label)
    except ValueError as error:
        raise argparse.ArgumentTypeError(str(error)) from error


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("paths", nargs="*", help="SVG files or directories")
    parser.add_argument(
        "--png-pair",
        nargs=2,
        action="append",
        default=[],
        metavar=("FIRST", "SECOND"),
        help="two PNG frames of one animation (repeat for more), at DEVICE_SCALE",
    )
    parser.add_argument(
        "--sep",
        type=float,
        default=None,
        help="seconds between the two sampled frames (default: half the longest dur)",
    )
    parser.add_argument("--flare", type=float, default=0.0)
    parser.add_argument(
        "--venue",
        type=venue_argument,
        default=lib.DESIGN_VENUE,
        help=f"one of: {', '.join(venue.label for venue in lib.VENUES)}",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="print the scores as JSON, for another program, not as a table",
    )
    arguments = parser.parse_args()

    files = lib.art_files(arguments.paths)
    pairs = [
        (pathlib.Path(first), pathlib.Path(second))
        for first, second in arguments.png_pair
    ]
    if not files and not pairs:
        sys.exit("no SVGs found, and no --png-pair given")
    plans = {file: plan(file, arguments.sep) for file in files}
    if files and not pairs and not any(plans.values()):
        sys.exit("no <animate dur> found in any file: nothing to measure")
    scores = score(files, plans, arguments.venue, arguments.flare) if files else {}
    pair_results = pair_scores(pairs, arguments.venue, arguments.flare)
    if arguments.json:
        print(as_json(files, scores, pair_results, arguments.venue, arguments.flare))
    else:
        if scores:
            print_table(files, scores, arguments.venue, arguments.flare)
        if pair_results:
            print_pairs(pair_results, arguments.venue, arguments.flare)
    if any(motion.in_wash for motion in [*scores.values(), *pair_results]):
        sys.exit(1)  # a drawing moves only in marks the back row cannot resolve


if __name__ == "__main__":
    main()
