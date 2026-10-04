"""Write isolated leaders at each allowed width, using the saved slide background."""

import copy
from pathlib import Path
import xml.etree.ElementTree as xml

from result.art.diving_board import theme_inks


def main() -> None:
    task = Path(__file__).resolve().parent
    namespace = "http://www.w3.org/2000/svg"
    xml.register_namespace("", namespace)
    root = xml.parse(task / "result/public/diving-board.svg").getroot()
    leader = root.find('.//*[@id="diving-board-rest-leader"]')
    assert leader is not None
    animation = leader.find(f"{{{namespace}}}animate")
    assert animation is not None
    frames = animation.attrib["values"].split(";")
    style = root.find(f"{{{namespace}}}style")
    assert style is not None
    background = theme_inks(task / "inputs/theme/ledger.css")["background"].value
    for state, data in (("board", frames[0]), ("spring", frames[-1])):
        for width in (2, 2.5, 3, 4):
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
            line.attrib["stroke-width"] = str(width)
            for child in list(line):
                line.remove(child)
            isolated.append(line)
            xml.ElementTree(isolated).write(
                task / f"evidence/leader-{state}-{width}px.svg"
            )


if __name__ == "__main__":
    main()
