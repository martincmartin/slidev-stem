"""List every use of each colour in the talk's art: the SVGs and the WebGL scene.

    uv run tasks/2026-09-30-flash/tools/colour_survey.py   # in watches/

For each SVG, each drawn element with its colours as it inherits them: stroke,
fill, their opacities, the stroke width in the file's units, and the first
numbers of its geometry, to find it in the file. For the WebGL scene
(`node watch/dump.ts`), each (ink, fill or line, opacity, width) with the parts
that use it. The text is for a person to read and classify.
"""

import collections
import json
import pathlib
import subprocess
import xml.etree.ElementTree as ElementTree

TALK = pathlib.Path(__file__).resolve().parents[3]
SVGS = [
    *sorted((TALK / "public/timekeepers").glob("*.svg")),
    TALK / "public/flexing-ruler.svg",
]
DRAWN = {"path", "rect", "circle", "ellipse", "line", "polyline", "polygon"}
INHERITED = ("stroke", "fill", "stroke-opacity", "fill-opacity", "opacity", "stroke-width")
GEOMETRY = ("d", "x", "y", "cx", "cy", "r", "x1", "y1", "x2", "y2", "points", "width", "height")


def local(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def walk(element: ElementTree.Element, inherited: dict[str, str], depth: int) -> list[str]:
    own = dict(inherited)
    for name in INHERITED:
        if name in element.attrib:
            if name == "opacity":  # opacity multiplies; show the chain
                own[name] = (
                    f"{inherited['opacity']}*{element.attrib[name]}"
                    if "opacity" in inherited
                    else element.attrib[name]
                )
            else:
                own[name] = element.attrib[name]
    if "class" in element.attrib:
        own["class"] = element.attrib["class"]
    rows: list[str] = []
    tag = local(element.tag)
    if tag == "clipPath" or tag == "defs":
        return rows
    if tag in DRAWN:
        where = " ".join(f"{name}={element.attrib[name][:24]}" for name in GEOMETRY if name in element.attrib)
        colours = " ".join(f"{name}={own[name]}" for name in (*INHERITED, "class") if name in own)
        animated = sorted({child.attrib.get("attributeName", "") for child in element if local(child.tag).startswith("animate")})
        rows.append(f"{'  ' * depth}{tag:<8} {colours}   [{where}]" + (f"  animates {animated}" if animated else ""))
    for child in element:
        rows += walk(child, own, depth + 1)
    return rows


def scene_rows() -> list[str]:
    dumped = subprocess.run(["node", "watch/dump.ts"], cwd=TALK, capture_output=True, text=True, check=True)
    scene = json.loads(dumped.stdout)
    inks = [f"{ink['name']} ({ink['variable']})" for ink in scene["inks"]]
    uses: dict[tuple[str, str, float, float | None], set[str]] = collections.defaultdict(set)
    for mesh in scene["meshes"]:
        if mesh["fill"] is not None:
            uses[(inks[mesh["fill"]["ink"]], "fill", mesh["fill"]["opacity"], None)].add(mesh["part"])
        for style in mesh["lineStyles"]:
            uses[(inks[style["ink"]], "line", style["opacity"], style["width"])].add(mesh["part"])
    return [
        f"  {ink:<36} {kind:<4} opacity {opacity:<5} {'' if width is None else f'width {width}':<10} {', '.join(sorted(parts))}"
        for (ink, kind, opacity, width), parts in sorted(uses.items(), key=lambda item: (item[0][0], item[0][1], -item[0][2], item[0][3] or 0))
    ]


def main() -> None:
    for svg in SVGS:
        root = ElementTree.parse(svg).getroot()
        print(f"== {svg.relative_to(TALK)}  width={root.attrib.get('width')} viewBox={root.attrib.get('viewBox')}")
        print("\n".join(walk(root, {}, 0)))
        print()
    print("== the WebGL scene (node watch/dump.ts)")
    print("\n".join(scene_rows()))


if __name__ == "__main__":
    main()
