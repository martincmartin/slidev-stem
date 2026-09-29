#!/usr/bin/env python3
"""Does a 3D scene keep to the house's drawing grammar?

    pnpm art:scene > scene.json            # in a talk with WebGL art
    uv run tools/scenecheck.py scene.json
    uv run tools/scenecheck.py scene.json --json      # for another program

The 3D art follows the grammar of `artcheck.py` (docs/illustrations.md), but a
scene has no SVG to read: its colours, widths and opacities are data. This
checks them, on the scene that `pnpm art:scene` writes (a talk's
`watch/dump.ts`: a list of meshes, each with its fill and its line styles):

  * every fill colour and every line colour is one of the four art colours;
  * every line width is on the stroke ladder (2, 2.5, 3 and 4 CSS px, within
    5%): line widths in a scene are CSS px on the screen, at every zoom;
  * opacities follow the docs: a line is solid, except a line of the detail
    colour, which is at 0.5; a fill is the subject (0.60-1.0) or a wash
    (0.07-0.18), and nothing between.

Stdlib only, with `lib.py`. It exits non-zero on a failure.
"""

import argparse
import json
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


def colour_finding(mesh: str, role: str, text: str) -> Finding | None:
    try:
        colour = lib.Colour.from_hex(text)
    except ValueError:
        return Finding(mesh, f"{role} colour {text!r} is not a hex colour")
    if colour not in lib.ART_INK:
        return Finding(
            mesh,
            f"{role} colour {colour} is not in the drawing palette "
            f"({', '.join(str(ink) for ink in sorted(lib.ART_INK))})",
        )
    return None


def fill_findings(mesh: str, fill: dict[str, object]) -> list[Finding]:
    found = [colour_finding(mesh, "fill", str(fill["hex"]))]
    opacity = float(str(fill["opacity"]))
    low, high = lib.WASH_OPACITY
    is_wash = low - OPACITY_TOLERANCE <= opacity <= high + OPACITY_TOLERANCE
    is_subject = lib.SUBJECT_MIN_OPACITY - OPACITY_TOLERANCE <= opacity <= 1
    if not (is_wash or is_subject):
        found.append(
            Finding(
                mesh,
                f"fill opacity {opacity:g} is neither a wash ({low:g}-{high:g}) "
                f"nor the subject ({lib.SUBJECT_MIN_OPACITY:g}-1)",
            )
        )
    return [finding for finding in found if finding]


def style_findings(mesh: str, style: dict[str, object]) -> list[Finding]:
    found = [colour_finding(mesh, "line", str(style["colour"]))]
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
    try:
        detail = lib.Colour.from_hex(str(style["colour"])) == lib.LEDGER["ink"]
    except ValueError:
        detail = False
    wanted = lib.DETAIL_LINE_OPACITY if detail else 1.0
    if abs(opacity - wanted) > OPACITY_TOLERANCE:
        found.append(
            Finding(
                mesh,
                f"line opacity {opacity:g} should be {wanted:g} "
                f"({'detail colour' if detail else 'a solid line'})",
            )
        )
    return [finding for finding in found if finding]


def check(scene: dict[str, object]) -> tuple[int, list[Finding]]:
    """The number of meshes, and everything wrong with them."""
    meshes = scene["meshes"]
    assert isinstance(meshes, list)
    findings: list[Finding] = []
    for mesh in meshes:
        name = str(mesh["name"])
        if mesh["fill"] is not None:
            findings += fill_findings(name, mesh["fill"])
        for style in mesh["lineStyles"]:
            findings += style_findings(name, style)
    seen: set[tuple[str, str]] = set()
    unique = []
    for finding in findings:  # the same fault in several meshes is one line each
        key = (finding.mesh, finding.what)
        if key not in seen:
            seen.add(key)
            unique.append(finding)
    return len(meshes), unique


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("scene", help="the scene's JSON, from `pnpm art:scene`")
    parser.add_argument(
        "--json",
        action="store_true",
        help="print the findings as JSON, for another program",
    )
    arguments = parser.parse_args()
    scene = json.loads(pathlib.Path(arguments.scene).read_text())
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
            f"{lib.STROKE_LADDER} CSS px, four colours, washes "
            f"{lib.WASH_OPACITY[0]:g}-{lib.WASH_OPACITY[1]:g}."
        )
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())
