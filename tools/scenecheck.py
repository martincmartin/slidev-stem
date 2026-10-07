#!/usr/bin/env python3
"""Does a 3D scene keep to the house's drawing grammar?

    pnpm art:scene > scene.json            # in a talk with WebGL art
    uv run tools/scenecheck.py scene.json
    uv run tools/scenecheck.py scene.json --json      # for another program

The 3D art follows the grammar of `artcheck.py` (docs/illustrations.md), but a
scene has no SVG to read: its colours, widths and opacities are data. This
checks them, on the scene that `pnpm art:scene` writes (a talk's
`watch/dump.ts`: a list of meshes, each with its fill and its line styles).
The scene holds no colours. Each fill and line has an ink, and the dump says
which theme variable (`--palette-ink`, ...) gives each ink its colour, so the
check holds for any theme:

  * every fill and every line is in an art ink: an ink whose variable is one
    of the art roles (`lib.ART_ROLES`);
  * every line width is on the stroke ladder (2, 2.5, 3 and 4 CSS px, within
    5%): line widths in a scene are CSS px on the screen, at every zoom;
  * opacities follow the docs: a line is solid, except a line of the detail
    ink, which is at 0.5; a face is a wash, solid; a fill in a line colour is
    a substance or a small dark part, at 0.60-1.0.

Stdlib only, with `lib.py`. It exits non-zero on a failure.
"""

import argparse
import json
import math
import pathlib
import sys
from dataclasses import dataclass

import lib

OPACITY_TOLERANCE = 1e-9


@dataclass(frozen=True)
class Finding:
    """One thing wrong with one mesh."""

    mesh: str
    what: str


@dataclass(frozen=True)
class Ink:
    """An ink of the scene, and the role of the theme variable that colours it."""

    name: str
    role: str


def read_inks(scene: dict[str, object]) -> list[Ink]:
    """The scene's inks, in the order that the meshes refer to them by index."""
    inks = scene["inks"]
    assert isinstance(inks, list)
    return [
        Ink(str(ink["name"]), str(ink["variable"]).removeprefix(lib.PALETTE_PREFIX))
        for ink in inks
    ]


def malformed(
    mesh: str, kind: str, entry: dict[str, object], numbers: tuple[str, ...], inks: int
) -> Finding | None:
    """What is wrong with the shape of a fill or a line style: an ink that is
    not one of the scene's `inks`, or a number that is missing or not finite.
    The grammar's comparisons are false for NaN, so a NaN would pass them."""
    ink = entry.get("ink")
    if isinstance(ink, bool) or not isinstance(ink, int) or not 0 <= ink < inks:
        return Finding(mesh, f"{kind} ink {ink!r} is not one of the scene's {inks}")
    for name in numbers:
        value = entry.get(name)
        if (
            isinstance(value, bool)
            or not isinstance(value, (int, float))
            or not math.isfinite(value)
        ):
            return Finding(mesh, f"{kind} {name} {value!r} is not a finite number")
    return None


def ink_finding(mesh: str, kind: str, ink: Ink) -> Finding | None:
    if ink.role not in lib.ART_ROLES:
        return Finding(
            mesh,
            f"{kind} ink {ink.name} is the theme's {lib.PALETTE_PREFIX}{ink.role}, "
            f"which is not an art colour ({', '.join(lib.ART_ROLES)})",
        )
    return None


def fill_findings(mesh: str, fill: dict[str, object], inks: list[Ink]) -> list[Finding]:
    if problem := malformed(mesh, "fill", fill, ("opacity",), len(inks)):
        return [problem]
    ink = inks[int(str(fill["ink"]))]
    found = [ink_finding(mesh, "fill", ink)]
    opacity = float(str(fill["opacity"]))
    if ink.role in lib.WASH_PAIRS:
        if abs(opacity - 1) > OPACITY_TOLERANCE:
            found.append(
                Finding(
                    mesh,
                    f"fill opacity {opacity:g} of a wash should be 1: a face is solid",
                )
            )
    elif not lib.SUBJECT_MIN_OPACITY - OPACITY_TOLERANCE <= opacity <= 1:
        found.append(
            Finding(
                mesh,
                f"fill opacity {opacity:g} of a line colour is not a substance "
                f"({lib.SUBJECT_MIN_OPACITY:g}-1); a face is its wash",
            )
        )
    return [finding for finding in found if finding]


def style_findings(
    mesh: str, style: dict[str, object], inks: list[Ink]
) -> list[Finding]:
    if problem := malformed(mesh, "line", style, ("width", "opacity"), len(inks)):
        return [problem]
    ink = inks[int(str(style["ink"]))]
    found = [ink_finding(mesh, "line", ink)]
    width = float(str(style["width"]))
    if not any(
        abs(width / step - 1) <= lib.LADDER_TOLERANCE for step in lib.STROKE_LADDER
    ):
        found.append(
            Finding(
                mesh,
                f"line width {width:g} CSS px is off the ladder "
                f"{lib.STROKE_LADDER} (within {lib.LADDER_TOLERANCE:.0%})",
            )
        )
    opacity = float(str(style["opacity"]))
    detail = ink.role == lib.DETAIL_ROLE
    wanted = lib.DETAIL_LINE_OPACITY if detail else 1.0
    if abs(opacity - wanted) > OPACITY_TOLERANCE:
        found.append(
            Finding(
                mesh,
                f"line opacity {opacity:g} should be {wanted:g} "
                f"({'detail ink' if detail else 'a solid line'})",
            )
        )
    return [finding for finding in found if finding]


def check(scene: dict[str, object]) -> tuple[int, list[Finding]]:
    """The number of meshes, and everything wrong with them."""
    meshes = scene["meshes"]
    assert isinstance(meshes, list)
    inks = read_inks(scene)
    findings: list[Finding] = []
    for mesh in meshes:
        name = str(mesh["name"])
        if mesh["fill"] is not None:
            findings += fill_findings(name, mesh["fill"], inks)
        for style in mesh["lineStyles"]:
            findings += style_findings(name, style, inks)
    seen: set[tuple[str, str]] = set()
    unique = []
    for finding in findings:  # the same fault in several meshes is one line each
        key = (finding.mesh, finding.what)
        if key not in seen:
            seen.add(key)
            unique.append(finding)
    return len(meshes), unique


def reject_constant(token: str) -> object:
    """Python's JSON reader takes NaN and Infinity, which JSON does not have."""
    raise ValueError(f"{token} is not JSON")


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("scene", help="the scene's JSON, from `pnpm art:scene`")
    parser.add_argument(
        "--json",
        action="store_true",
        help="print the findings as JSON, for another program",
    )
    arguments = parser.parse_args()
    scene = json.loads(
        pathlib.Path(arguments.scene).read_text(), parse_constant=reject_constant
    )
    count, findings = check(scene)
    if arguments.json:
        print(
            json.dumps(
                {
                    "meshes": count,
                    "passes": not findings,
                    "findings": [
                        {"mesh": finding.mesh, "what": finding.what}
                        for finding in findings
                    ],
                },
                indent=2,
            )
        )
    else:
        for finding in findings:
            print(f"FAIL  {finding.mesh}: {finding.what}")
        print(
            f"{count} mesh(es), {len(findings)} finding(s). Grammar: strokes "
            f"{lib.STROKE_LADDER} CSS px, the art inks, solid washes."
        )
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
