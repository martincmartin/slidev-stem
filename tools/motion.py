#!/usr/bin/env python3
"""Does the ANIMATION survive the room, not just the drawing?

    .venv/bin/python3 tools/motion.py                       # every talk's art
    .venv/bin/python3 tools/motion.py new.svg               # one new drawing
    .venv/bin/python3 tools/motion.py new.svg --sep 3.0     # pick the pairing yourself

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

WHAT THE THRESHOLDS ARE NOT. 1.5:1 is borrowed from barroom's mark-detection cut so
the two tools agree on what counts as a visible difference. It is NOT a measured
psychophysical detection threshold for slow, large-area motion at 7 m -- that number
is not known here, and a moving edge is probably detectable somewhat below it. The
comparison between drawings is unaffected: everything is scored identically, so the
ORDER is trustworthy even where the absolute cut is a convention.
"""

import argparse
import pathlib
import re
import sys

import barroom
import lib
import numpy as np
from PIL import Image

BANDS = [1.2, 1.5, 2.0, 3.0]
N_PAIRS = 4

Plan = tuple[float | None, list[tuple[float, float]], list[str]]


def durations(source: str) -> list[float]:
    return sorted(
        {float(duration) for duration in re.findall(r'dur="([0-9.]+)s"', source)}
    )


def plan(file: pathlib.Path, separation: float | None = None) -> Plan:
    """-> (separation, [(t1,t2) x N_PAIRS], notes) from ONE drawing's own durations.

    Per file, not pooled: the four timekeepers run at 11 / 8 / 12 / 9 s, and a
    separation that cancels one drawing's flicker says nothing about another's.
    """
    found = durations(file.read_text())
    notes = []
    if not found:
        return None, [], ["no <animate dur> found: nothing to measure"]
    longest = max(found)
    if separation is None:
        separation = longest / 2
        notes.append(
            f"longest animation {longest:g}s -> sampling {separation:g}s apart "
            f"(opposite extremes of it)"
        )
    else:
        notes.append(f"separation {separation:g}s given on the command line")
    for duration in found:
        if duration == longest:
            continue
        periods = separation / duration
        if abs(periods - round(periods)) < 1e-6:
            notes.append(
                f"  {duration:g}s animation cancels exactly ({periods:.0f} whole periods), "
                f"so it is excluded"
            )
        else:
            notes.append(
                f"  {duration:g}s animation does NOT cancel ({periods:.2f} periods) "
                f"and is included in this row's numbers"
            )
    step = longest / (2 * N_PAIRS) if longest else 1.0
    return (
        separation,
        [(index * step, index * step + separation) for index in range(N_PAIRS)],
        notes,
    )


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


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "paths", nargs="*", help="SVG files or directories (default: every talk's art)"
    )
    parser.add_argument(
        "--sep",
        type=float,
        default=None,
        help="seconds between the two sampled frames (default: half the longest dur)",
    )
    parser.add_argument("--flare", type=float, default=0.0)
    parser.add_argument("--venue", default=lib.DESIGN_VENUE)
    arguments = parser.parse_args()

    files = lib.art_files(arguments.paths or None)
    if not files:
        sys.exit("no SVGs found")
    plans = {file: plan(file, arguments.sep) for file in files}
    if not any(pairs for _, pairs, _ in plans.values()):
        sys.exit("no <animate dur> found in any file: nothing to measure")

    # Render each needed time once for every file, then let each file use its own.
    all_times = sorted(
        {time for _, pairs, _ in plans.values() for pair in pairs for time in pair}
    )
    frames = {time: render_at(files, time) for time in all_times}
    screen_width, distance = next(
        (screen_width, distance)
        for label, screen_width, distance in lib.VENUES
        if label == arguments.venue
    )
    sigma = (1.0 / lib.arcmin_per_csspx(screen_width, distance)) / 2.355 * barroom.DSF
    per_csspx = barroom.DSF**2

    print(f"MOTION at {arguments.venue}, flare {arguments.flare:.2f}\n")
    header = "".join(f"{'>=' + format(band, '.1f'):>9}" for band in BANDS)
    print(f"{'drawing':<22}{'dPeak':>8}{'dP99':>8}   area CSS px^2 changing by{header}")
    weak, footnotes = [], []
    for index, file in enumerate(files):
        _separation, pairs, notes = plans[file]
        if not pairs:
            print(f"{barroom.label_for(file, files):<22}{'  (no animation)':>8}")
            continue
        footnotes.append((barroom.label_for(file, files), pairs, notes))
        peaks, p99s = [], []
        band_areas: dict[float, list[float]] = {band: [] for band in BANDS}
        for first_time, second_time in pairs:
            difference = delta(
                frames[first_time][index],
                frames[second_time][index],
                sigma,
                arguments.flare,
            )
            peaks.append(float(difference.max()))
            p99s.append(float(np.percentile(difference, 99)))
            for band in BANDS:
                band_areas[band].append(float((difference >= band).sum()) / per_csspx)
        peak, p99 = np.mean(peaks), np.mean(p99s)
        area = {band: np.mean(values) for band, values in band_areas.items()}
        cells = "".join(f"{area[band]:>9.0f}" for band in BANDS)
        flag = " !" if area[lib.CONTRAST_FLOOR] < 1 and area[1.2] > 50 else ""
        print(
            f"{barroom.label_for(file):<22}{peak:>8.2f}{p99:>8.2f}{'':>26}{cells}{flag}"
        )
        if flag:
            weak.append(barroom.label_for(file))

    print()
    shown_sizes = {
        barroom.label_for(file, files): size
        for file, size in zip(files, barroom.sizes(files), strict=True)
    }
    for name, pairs, notes in footnotes:
        width, height = shown_sizes[name]
        print(
            f"{name} ({width:g}x{height:g} = {width * height:.0f} CSS px^2 in total): "
            + ", ".join(f"({first:g},{second:g})" for first, second in pairs)
        )
        for note in notes:
            print(f"    {note}")
    if weak:
        print(f"\nMOTION IN A WASH: {', '.join(weak)}")
        print(
            "  These change over a wide area and nowhere by 3:1. The animation is\n"
            "  drawn in marks the back row cannot resolve -- see docs/legibility.md,\n"
            "  'put the motion in the marks that survive'."
        )
    else:
        print("no drawing animates only in marks below the floor.")


if __name__ == "__main__":
    main()
