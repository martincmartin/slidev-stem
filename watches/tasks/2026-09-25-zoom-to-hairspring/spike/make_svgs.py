#!/usr/bin/env python3
"""Make the spike's two test SVGs from the mirror copies of the generator.

    ../../../../.venv/bin/python3 make_svgs.py      # in spike/

It runs mirror/watches/art/skeleton_watch.py (one decimal, as in production)
and skeleton_watch_2dp.py (two decimals) into out/, then writes a tagged copy
of each into site/:

- tags each top-level group `data-part="hairspring"` or `data-part="rest"`;
- wraps the drawing in `<g class="camera">`;
- adds a `<style>` that sets the camera numbers of the "hairspring" view as
  custom properties, and hides every part but the hairspring in that view.

This is a stand-in for step 2 of PLAN.md, which does it in the generator.
"""

import math
import pathlib
import re
import subprocess
import sys
from dataclasses import dataclass
from xml.etree import ElementTree

SPIKE = pathlib.Path(__file__).resolve().parent
SITE = SPIKE / "site"
OUT = SPIKE / "out"
ART = SPIKE / "mirror/watches/art"
SVG_NS = "http://www.w3.org/2000/svg"
WATCH_CENTRE = (798.0, 276.0)  # the generator's default --at
BALANCE_RADIUS = 56.0
TARGET_CENTRE = (705.0, 276.0)  # PLAN.md, decisions
TARGET_RADIUS = 250.0


@dataclass(frozen=True)
class Camera:
    """translate(x, y) scale(scale), with the origin at the canvas's top left."""

    x: float
    y: float
    scale: float


def balance_centre(svg_text: str) -> tuple[float, float]:
    """The balance arbor on the canvas, read from its clip path's circle."""
    match = re.search(
        r'id="skeleton-watch-under-balance">.*?Z'
        r"M(-?[\d.]+) (-?[\d.]+)A([\d.]+) ",
        svg_text,
    )
    if match is None:
        raise SystemExit("no balance clip path")
    right, centre_y, radius = (float(group) for group in match.groups())
    return WATCH_CENTRE[0] + right - radius, WATCH_CENTRE[1] + centre_y


def camera_for(focus: tuple[float, float]) -> Camera:
    scale = TARGET_RADIUS / BALANCE_RADIUS
    return Camera(
        TARGET_CENTRE[0] - scale * focus[0],
        TARGET_CENTRE[1] - scale * focus[1],
        scale,
    )


def view_css(camera: Camera) -> str:
    return (
        "svg[data-view=hairspring] {"
        f" --cam-x: {camera.x:.3f}; --cam-y: {camera.y:.3f};"
        f" --cam-s: {camera.scale:.5f}; --cam-z: {math.log(camera.scale):.5f}; }}\n"
        "svg[data-view=hairspring] [data-part]:not([data-part=hairspring])"
        " { opacity: 0; }\n"
    )


def tag(raw: pathlib.Path, out: pathlib.Path) -> Camera:
    text = raw.read_text()
    camera = camera_for(balance_centre(text))
    ElementTree.register_namespace("", SVG_NS)
    root = ElementTree.fromstring(text)
    placed = root.find(f"{{{SVG_NS}}}g")
    if placed is None:
        raise SystemExit("no top-level group")
    for child in placed:
        if child.tag == f"{{{SVG_NS}}}defs":
            continue
        is_spring = any(
            animate.get("attributeName") == "d"
            for animate in child.iter(f"{{{SVG_NS}}}animate")
        )
        child.set("data-part", "hairspring" if is_spring else "rest")
    root.remove(placed)
    camera_group = ElementTree.SubElement(root, f"{{{SVG_NS}}}g", {"class": "camera"})
    camera_group.append(placed)
    style = ElementTree.Element(f"{{{SVG_NS}}}style")
    style.text = view_css(camera)
    root.insert(0, style)
    out.write_text(ElementTree.tostring(root, encoding="unicode") + "\n")
    return camera


def main() -> None:
    for generator, name in (
        ("skeleton_watch.py", "watch-1dp"),
        ("skeleton_watch_2dp.py", "watch-2dp"),
    ):
        raw = OUT / f"{name}-raw.svg"
        subprocess.run([sys.executable, str(ART / generator), str(raw)], check=True)
        camera = tag(raw, SITE / f"{name}.svg")
        print(f"{name}: {camera}")


if __name__ == "__main__":
    main()
