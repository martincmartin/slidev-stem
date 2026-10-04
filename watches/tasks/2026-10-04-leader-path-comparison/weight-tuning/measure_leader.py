"""Write isolated leaders at each allowed width, using the saved slide background."""

import copy
import xml.etree.ElementTree as xml
from pathlib import Path

from result.art.diving_board import theme_inks


def main() -> None:
    task = Path(__file__).resolve().parent
    namespace = "http://www.w3.org/2000/svg"
    xml.register_namespace("", namespace)
    background = theme_inks(task / "inputs/theme/ledger.css")["background"].value
    for variant, filename, prefix in (
        ("optimized", "diving-board.svg", "diving-board-"),
        ("original", "diving-board-original-leader.svg", "diving-board-comparison-"),
        ("strong", "diving-board-strong-movement.svg", "diving-board-strong-movement-"),
    ):
        root = xml.parse(task / "result/public" / filename).getroot()
        leader = root.find(f'.//*[@id="{prefix}rest-leader"]')
        assert leader is not None
        animation = leader.find(f"{{{namespace}}}animate")
        assert animation is not None
        frames = animation.attrib["values"].split(";")
        style = root.find(f"{{{namespace}}}style")
        assert style is not None
        for state, data in (("board", leader.attrib["d"]), ("spring", frames[-1])):
            isolated = xml.Element(root.tag, root.attrib)
            isolated.append(copy.deepcopy(style))
            xml.SubElement(
                isolated,
                f"{{{namespace}}}rect",
                {
                    "x": "50",
                    "y": "0",
                    "width": "980",
                    "height": "452",
                    "fill": background,
                },
            )
            line = copy.deepcopy(leader)
            line.attrib["d"] = data
            for child in list(line):
                line.remove(child)
            isolated.append(line)
            xml.ElementTree(isolated).write(
                task / f"evidence/leader-{variant}-{state}.svg"
            )


if __name__ == "__main__":
    main()
