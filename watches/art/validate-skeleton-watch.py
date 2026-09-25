#!/usr/bin/env python3
"""Validate skeleton-watch.py and the SVG it writes. Run it after every change
to skeleton-watch.py:

    python3 art/validate-skeleton-watch.py      # in watches/

It stops at the first failure and exits non-zero. The steps:

1. types: mypy --strict and pyright on skeleton-watch.py and on this file;
2. layout: each wheel sits exactly one mesh distance from the pinion it
   drives; parts that do not mesh are at least MIN_CLEARANCE apart; every part
   is inside the chapter ring;
3. regenerate public/cover/skeleton-watch.svg;
4. art: stem/tools/artcheck.py (palette, stroke ladder, structure),
   barroom.py (the 3.0 gate at the design venue) and motion.py (some area
   changes by at least 3:1), with its two frames half a balance period apart.

Needs stem/.venv with requirements.txt installed (mypy, pyright, playwright,
Pillow, numpy). Steps 1 and 4 run tools from there.
"""
import importlib.util, itertools, math, pathlib, re, subprocess, sys
from types import ModuleType
from typing import NoReturn

ART = pathlib.Path(__file__).resolve().parent            # watches/art/
TALK = ART.parent                                        # watches/
STEM = TALK.parent                                       # stem/
VENV = STEM / ".venv" / "bin"
GENERATOR = ART / "skeleton-watch.py"
SVG = TALK / "public" / "cover" / "skeleton-watch.svg"
MESH_TOLERANCE = 0.01          # px: a mesh distance must be exact, up to rounding


def load_generator() -> ModuleType:
    """skeleton-watch.py as a module (its name has a hyphen, so no import)."""
    spec = importlib.util.spec_from_file_location("skeleton_watch", GENERATOR)
    if spec is None or spec.loader is None:
        raise SystemExit(f"cannot load {GENERATOR}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(label: str, command: list[str]) -> str:
    """Run `command` in stem/; fail with its output if it exits non-zero."""
    result = subprocess.run(command, cwd=STEM, capture_output=True, text=True)
    output = result.stdout + result.stderr
    if result.returncode != 0:
        fail(label, output)
    return output


def fail(label: str, detail: str) -> NoReturn:
    print(f"FAIL  {label}\n{detail.rstrip()}")
    sys.exit(1)


def ok(label: str, detail: str = "") -> None:
    print(f"ok    {label}" + (f"  ({detail})" if detail else ""))


def check_types() -> None:
    files = [str(GENERATOR), str(pathlib.Path(__file__).resolve())]
    run("mypy --strict", [str(VENV / "mypy"), "--strict", *files])
    ok("mypy --strict")
    run("pyright", [str(VENV / "pyright"), *files])
    ok("pyright")


def check_layout(watch: ModuleType) -> None:
    positions = watch.arbors()
    wheels = {"barrel": watch.BARREL, "centre": watch.CENTRE, "third": watch.THIRD,
              "fourth": watch.FOURTH, "escape": watch.ESCAPE}
    meshes = [("barrel", "centre"), ("centre", "third"), ("third", "fourth"), ("fourth", "escape")]
    problems = []

    for driver, driven in meshes:
        want = wheels[driver].pitch_radius + watch.pinion_radius(wheels[driver], wheels[driven])
        have = math.dist(positions[driver], positions[driven])
        if abs(have - want) > MESH_TOLERANCE:
            problems.append(f"{driver} -> {driven}: arbors {have:.2f} px apart, the mesh needs {want:.2f}")

    footprints = watch.part_footprints(positions)
    clearances = []
    for first, second in itertools.combinations(footprints, 2):
        if (first, second) in meshes or (second, first) in meshes:
            continue
        gap = (math.dist(footprints[first].centre, footprints[second].centre)
               - footprints[first].outer - footprints[second].outer)
        clearances.append((gap, f"{first}-{second}"))
        if gap < watch.MIN_CLEARANCE:
            problems.append(f"{first} and {second} are {gap:.1f} px apart, under MIN_CLEARANCE "
                            f"{watch.MIN_CLEARANCE:g}")

    for name, part in footprints.items():
        reach = math.hypot(*part.centre) + part.outer
        if reach > watch.RING_RADIUS:
            problems.append(f"{name} reaches {reach:.1f} px from the centre, under the chapter ring "
                            f"(inside edge {watch.RING_RADIUS})")

    if problems:
        fail("layout", "\n".join(f"      {problem}" for problem in problems))
    tightest, pair = min(clearances)
    ok("layout", f"meshes exact; tightest gap {tightest:.1f} px, {pair}; all inside the chapter ring")


def check_art(watch: ModuleType) -> None:
    relative = str(SVG.relative_to(STEM))
    run("artcheck", ["python3", "tools/artcheck.py", relative])
    ok("artcheck")

    barroom = run("barroom", [str(VENV / "python3"), "tools/barroom.py", relative])
    row = next((line for line in barroom.splitlines() if line.startswith(SVG.stem)), None)
    if row is None or "!" in row:
        fail("barroom: the 3.0 gate", barroom)
    # The header names the venues in order; each has hold, p90 and Fmax in the
    # row, after the name and ink%. The "gate:" line names the design venue.
    header = next(line for line in barroom.splitlines() if line.startswith("drawing"))
    venues = re.split(r"\s{2,}", header.strip())[2:]
    gate = re.search(r"gate: .* at (.+?)\s+\(", barroom)
    design = gate.group(1) if gate else venues[0]
    column = 2 + 3 * venues.index(design)
    hold, p90, fmax = row.split()[column:column + 3]
    ok("barroom", f"at {design}: hold {hold}, p90 {p90}, Fmax {fmax}")

    # Half a balance period apart, so the balance, fork and escape wheel are at
    # opposite ends of their motion. motion.py's default (half the longest
    # loop, the seconds hand's) is a whole number of periods: they would cancel.
    separation = f"{watch.PERIOD / 2:g}"
    motion = run("motion", [str(VENV / "python3"), "tools/motion.py", relative, "--sep", separation])
    row = next((line for line in motion.splitlines() if re.match(rf"{SVG.stem}\s+[\d.]", line)), None)
    if row is None or float(row.split()[-1]) <= 0:
        fail("motion: no area changes by 3:1", motion)
    ok(f"motion --sep {separation}", f"dPeak {row.split()[1]}, {row.split()[-1]} px2 >= 3:1")


def main() -> None:
    check_types()
    watch = load_generator()
    check_layout(watch)
    run("generate", ["python3", str(GENERATOR)])
    ok("generate", str(SVG.relative_to(TALK)))
    check_art(watch)
    print("\nall passed")


if __name__ == "__main__":
    main()
