#!/usr/bin/env python3
"""Validate skeleton_watch.py and the SVG it writes. Run it after every change
to skeleton_watch.py:

    python3 art/validate_skeleton_watch.py      # in watches/

It runs itself under stem/.venv, stops at the first failure and exits non-zero.
The steps:

1. style: ruff format (it rewrites the art scripts in place), then ruff check;
2. types: mypy --strict and pyright on the art scripts;
3. layout, as the viewer sees it (watch_geometry.py says how):
   - each wheel sits exactly one mesh distance from the pinion it drives;
   - every part is at least RING_CLEARANCE inside the chapter ring;
   - the visible parts of two parts that do not mesh are at least
     MIN_CLEARANCE apart;
   - the pallet fork, at both ends of its swing, is at least FORK_CLEARANCE
     from the visible parts of the parts it does not work on;
4. regenerate public/cover/skeleton-watch.svg;
5. art: stem/tools/artcheck.py (palette, stroke ladder, structure),
   barroom.py (the 3.0 gate at the design venue) and motion.py (some area
   changes by at least 3:1), with its two frames half a balance period apart.

Needs stem/.venv with requirements.txt installed.
"""

import os
import pathlib
import re
import subprocess
import sys
from typing import NoReturn

ART = pathlib.Path(__file__).resolve().parent  # watches/art/
TALK = ART.parent  # watches/
STEM = TALK.parent  # stem/
VENV = STEM / ".venv"
GENERATOR = ART / "skeleton_watch.py"
SCRIPTS = [
    GENERATOR,
    ART / "watch_geometry.py",
    ART / "search_skeleton_watch_layout.py",
    pathlib.Path(__file__),
]
SVG = TALK / "public" / "cover" / "skeleton-watch.svg"
PYTHON = str(VENV / "bin" / "python3")


def run(label: str, command: list[str]) -> str:
    """Run `command` in stem/; fail with its output if it exits non-zero."""
    result = subprocess.run(
        command, cwd=STEM, capture_output=True, text=True, check=False
    )
    output = result.stdout + result.stderr
    if result.returncode != 0:
        fail(label, output)
    return output


def fail(label: str, detail: str) -> NoReturn:
    print(f"FAIL  {label}\n{detail.rstrip()}")
    sys.exit(1)


def ok(label: str, detail: str = "") -> None:
    print(f"ok    {label}" + (f"  ({detail})" if detail else ""))


def check_style() -> None:
    files = [str(script) for script in SCRIPTS]
    changed = run("ruff format", [str(VENV / "bin" / "ruff"), "format", *files])
    ok("ruff format", changed.strip().splitlines()[-1] if changed.strip() else "")
    run("ruff check", [str(VENV / "bin" / "ruff"), "check", *files])
    ok("ruff check")


def check_types() -> None:
    files = [str(script) for script in SCRIPTS]
    run("mypy --strict", [str(VENV / "bin" / "mypy"), "--strict", *files])
    ok("mypy --strict")
    run("pyright", [str(VENV / "bin" / "pyright"), *files])
    ok("pyright")


# The checks below import the generator, so they run it. They import it
# here, not at the top, so a broken generator fails the style and type checks
# with a report, before it can fail with a traceback.


def check_layout() -> None:
    import skeleton_watch as watch
    import watch_geometry as geometry

    clearances = geometry.measure(watch.Placement(watch.LAYOUT))
    label = geometry.label
    problems = [
        f"{label(pair)}: {error}" for pair, error in clearances.mesh_errors.items()
    ]
    for part, gap in clearances.ring_gaps.items():
        if gap < watch.RING_CLEARANCE:
            problems.append(
                f"{label(part)}: {gap:.1f} px from the chapter ring, "
                f"under RING_CLEARANCE {watch.RING_CLEARANCE:g}"
            )
    for pair, gap in clearances.part_gaps.items():
        if gap < watch.MIN_CLEARANCE:
            problems.append(
                f"{label(pair)}: visible parts {gap:.1f} px apart, under MIN_CLEARANCE {watch.MIN_CLEARANCE:g}"
            )
    for part, gap in clearances.fork_gaps.items():
        if gap < watch.FORK_CLEARANCE:
            problems.append(
                f"fork-{label(part)}: {gap:.1f} px apart, under FORK_CLEARANCE {watch.FORK_CLEARANCE:g}"
            )
    if problems:
        fail("layout", "\n".join(f"      {problem}" for problem in problems))
    part_pair, part_gap = clearances.tightest_parts()
    fork_wheel, fork_gap = clearances.tightest_fork()
    ring_part, ring_gap = clearances.tightest_ring()
    ok(
        "layout",
        f"meshes exact; tightest visible gap {part_gap:.1f} px, {label(part_pair)}; "
        f"fork {fork_gap:.1f} px from the {label(fork_wheel)} wheel; "
        f"{label(ring_part)} {ring_gap:.1f} px from the chapter ring",
    )


def check_art() -> None:
    from skeleton_watch import PERIOD

    relative = str(SVG.relative_to(STEM))
    run("artcheck", [PYTHON, "tools/artcheck.py", relative])
    ok("artcheck")

    barroom = run("barroom", [PYTHON, "tools/barroom.py", relative])
    row = next(
        (line for line in barroom.splitlines() if line.startswith(SVG.stem)), None
    )
    if row is None or "!" in row:
        fail("barroom: the 3.0 gate", barroom)
    # The header names the venues in order; each has hold, p90 and Fmax in the
    # row, after the name and ink%. The "gate:" line names the design venue.
    header = next(line for line in barroom.splitlines() if line.startswith("drawing"))
    venues = re.split(r"\s{2,}", header.strip())[2:]
    gate = re.search(r"gate: .* at (.+?)\s+\(", barroom)
    design = gate.group(1) if gate else venues[0]
    column = 2 + 3 * venues.index(design)
    hold, p90, fmax = row.split()[column : column + 3]
    ok("barroom", f"at {design}: hold {hold}, p90 {p90}, Fmax {fmax}")

    # Half a balance period apart, so the balance, fork and escape wheel are at
    # opposite ends of their motion. motion.py's default (half the longest
    # loop, the seconds hand's) is a whole number of periods: they would cancel.
    separation = f"{PERIOD / 2:g}"
    motion = run("motion", [PYTHON, "tools/motion.py", relative, "--sep", separation])
    row = next(
        (
            line
            for line in motion.splitlines()
            if re.match(rf"{SVG.stem}\s+[\d.]", line)
        ),
        None,
    )
    if row is None or float(row.split()[-1]) <= 0:
        fail("motion: no area changes by 3:1", motion)
    ok(
        f"motion --sep {separation}",
        f"dPeak {row.split()[1]}, {row.split()[-1]} px2 >= 3:1",
    )


def main() -> None:
    # numpy and the checkers are in stem/.venv: rerun there if this is not it
    if pathlib.Path(sys.prefix).resolve() != VENV.resolve():
        os.execv(PYTHON, [PYTHON, __file__, *sys.argv[1:]])
    check_style()
    check_types()
    check_layout()
    run("generate", [sys.executable, str(GENERATOR)])
    ok("generate", str(SVG.relative_to(TALK)))
    check_art()
    print("\nall passed")


if __name__ == "__main__":
    main()
