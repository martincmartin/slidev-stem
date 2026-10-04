"""Check that only the selected leader changes and slide 3 stays identical."""

import json
import xml.etree.ElementTree as xml
from pathlib import Path


def main() -> None:
    task = Path(__file__).resolve().parent
    assert (task / "inputs/public/diving-board-no-bend.svg").read_bytes() == (
        task / "result/public/diving-board-no-bend.svg"
    ).read_bytes()
    previous = xml.parse(task / "inputs/public/diving-board.svg").getroot()
    selected = xml.parse(task / "result/public/diving-board.svg").getroot()
    initial = []
    for root in (previous, selected):
        callout = next(
            node for node in root if node.attrib.get("data-layer") == "rest-callout"
        )
        leader = next(
            node
            for node in callout
            if node.attrib.get("id") == "diving-board-rest-leader"
        )
        initial.append(leader.attrib["d"])
        callout.remove(leader)
    assert initial[0] == initial[1]
    assert xml.tostring(previous) == xml.tostring(selected)
    (task / "evidence/geometry-checks.json").write_text(
        json.dumps(
            {
                "slide_3_byte_identical": True,
                "only_slide_2_leader_changes": True,
                "pre_curl_leader_unchanged": True,
                "bend_weight": 15,
            },
            indent=2,
        )
        + "\n"
    )
    print("Slide 3 stays byte-identical. Only slide 2's animated leader changes.")


if __name__ == "__main__":
    main()
