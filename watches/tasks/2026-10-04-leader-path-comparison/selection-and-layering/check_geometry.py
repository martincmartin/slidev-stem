"""Verify that selection changes only SVG paint order."""

import json
import xml.etree.ElementTree as xml
from pathlib import Path


def main() -> None:
    task = Path(__file__).resolve().parent
    previous = xml.parse(task / "inputs/public/diving-board.svg").getroot()
    selected = xml.parse(task / "result/public/diving-board.svg").getroot()
    for layer in ("rest", "rest-callout"):
        group = next(
            node for node in previous if node.attrib.get("data-layer") == layer
        )
        previous.remove(group)
        previous.append(group)
    assert xml.tostring(previous) == xml.tostring(selected)
    assert (task / "result/slides.md").read_text().count(
        "# Hairspring and Balance Wheel"
    ) == 2
    experiment = xml.fromstring(
        (task / "result/public/diving-board-no-bend.svg")
        .read_text()
        .replace("diving-board-no-bend-", "diving-board-")
    )
    selected_copy = xml.fromstring(xml.tostring(selected))
    for root in (selected_copy, experiment):
        callout = next(
            node for node in root if node.attrib.get("data-layer") == "rest-callout"
        )
        leader = next(
            node
            for node in callout
            if node.attrib.get("id") == "diving-board-rest-leader"
        )
        callout.remove(leader)
    assert xml.tostring(selected_copy) == xml.tostring(experiment)
    (task / "evidence/geometry-checks.json").write_text(
        json.dumps(
            {
                "only_svg_paint_order_changed": True,
                "reference_above_board": True,
                "moving_geometry_unchanged": True,
                "leader_unchanged": True,
                "zero_bend_changes_only_leader": True,
                "selected_and_zero_bend_slides": True,
            },
            indent=2,
        )
        + "\n"
    )
    print("Only SVG paint order changed. The selected and zero-bend slides remain.")


if __name__ == "__main__":
    main()
