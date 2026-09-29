#!/usr/bin/env python3
"""Validate watch_design.py, and write watch/design.json. Run it after every
change to watch_design.py:

    uv run art/validate_watch_design.py      # in watches/

It runs itself under watches/.venv, stops at the first failure and exits
non-zero. It runs the house tools in stem/ under stem/.venv.
The steps:

1-2. style and types: stem/tools/check_python.py on the art scripts (ruff
   format, which rewrites them in place, ruff check, mypy --strict, pyright);
3. layout, as the viewer sees it (watch_geometry.py says how):
   - the barrel is fixed at +60 degrees and the visible third-barrel gap
     is 12 +/- 1 px;
   - each wheel sits exactly one mesh distance from the pinion it drives;
   - every part is at least RING_CLEARANCE inside the chapter ring;
   - the visible parts of two parts that do not mesh are at least
     MIN_CLEARANCE apart;
   - the pallet fork, at both ends of its swing, is at least FORK_CLEARANCE
     from the visible parts of the parts it does not work on;
4. write watch/design.json.

The art checks of the drawing (palette, stroke ladder, legibility, motion) are
run by stem/tools/validate.py on the scene and on stills of the watch.

Needs uv. `uv run` makes both venvs from their uv.lock if they are missing.
"""

import os
import pathlib
import shutil
import subprocess
import sys
from typing import NoReturn

ART = pathlib.Path(__file__).resolve().parent  # watches/art/
TALK = ART.parent  # watches/
STEM = TALK.parent  # stem/
VENV = TALK / ".venv"
GENERATOR = ART / "watch_design.py"
SCRIPTS = [
    GENERATOR,
    ART / "watch_geometry.py",
    ART / "search_watch_layout.py",
    ART / "favicon.py",
    pathlib.Path(__file__),
]
DESIGN = TALK / "watch" / "design.json"
UV = shutil.which("uv") or "uv"
# Runs a house tool under stem/.venv, the project of the working directory.
TOOL = [UV, "run", "--quiet"]


def run(label: str, command: list[str]) -> str:
    """Run `command` in stem/; fail with its output if it exits non-zero."""
    # uv warns if VIRTUAL_ENV names another project's venv: this talk's.
    environment = {
        name: value for name, value in os.environ.items() if name != "VIRTUAL_ENV"
    }
    result = subprocess.run(
        command, cwd=STEM, env=environment, capture_output=True, text=True, check=False
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


def check_python() -> None:
    """The house's checks for Python, from stem/tools/check_python.py."""
    output = run(
        "python checks",
        [*TOOL, "tools/check_python.py", *(str(script) for script in SCRIPTS)],
    )
    print(output.rstrip())


# The checks below import the generator, so they run it. They import it
# here, not at the top, so a broken generator fails the style and type checks
# with a report, before it can fail with a traceback.


def check_layout() -> None:
    import watch_design as watch
    import watch_geometry as geometry

    placement = watch.Placement(watch.LAYOUT)
    clearances = geometry.measure(placement)
    label = geometry.label
    problems = [
        f"{label(pair)}: {error}" for pair, error in clearances.mesh_errors.items()
    ]
    problems.extend(geometry.layout_constraints(placement))
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


def main() -> None:
    # numpy is in watches/.venv: rerun there if this is not it
    if pathlib.Path(sys.prefix).resolve() != VENV.resolve():
        command = [UV, "run", "--project", str(TALK), "python", __file__]
        os.execv(UV, [*command, *sys.argv[1:]])
    check_python()
    check_layout()
    run("write design.json", [sys.executable, str(GENERATOR)])
    ok("write design.json", str(DESIGN.relative_to(TALK)))
    print("\nall passed")


if __name__ == "__main__":
    main()
