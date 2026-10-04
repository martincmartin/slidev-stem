"""Check geometry preservation, the original leader, and the single rest edge."""

import json
from pathlib import Path
import xml.etree.ElementTree as xml

from result.art.diving_board import DESIGN, TIMELINE, curl_poses, smooth_data


def path_frames(root: xml.Element, identity: str) -> list[str]:
    path = root.find(f'.//*[@id="{identity}"]')
    assert path is not None
    return [
        path.attrib["d"],
        *[child.attrib["values"] for child in path if child.tag.endswith("animate")],
    ]


def main() -> None:
    task = Path(__file__).resolve().parent
    old = xml.parse(task / "inputs/public/diving-board.svg").getroot()
    original = xml.parse(task / "inputs/public/diving-board-original.svg").getroot()
    current = xml.parse(task / "result/public/diving-board.svg").getroot()
    comparison = xml.parse(
        task / "result/public/diving-board-original-leader.svg"
    ).getroot()
    for root, prefix in (
        (current, "diving-board-"),
        (comparison, "diving-board-comparison-"),
    ):
        for face in ("front", "top", "end"):
            assert path_frames(old, f"diving-board-{face}") == path_frames(
                root, prefix + face
            )
        for face in ("front", "top"):
            assert (
                path_frames(old, f"diving-board-rest-{face}")[0]
                == path_frames(root, prefix + "rest-" + face)[0]
            )
        old_pool = old.find('.//*[@id="diving-board-set"]')
        new_pool = root.find(f'.//*[@id="{prefix}set"]')
        assert old_pool is not None and new_pool is not None
        old_paths = [node.attrib.get("d") for node in old_pool.iter()]
        new_paths = [node.attrib.get("d") for node in new_pool.iter()]
        assert old_paths == new_paths
    assert path_frames(original, "diving-board-rest-leader") == path_frames(
        comparison, "diving-board-comparison-rest-leader"
    )
    edge = path_frames(current, "diving-board-rest-edge")
    expected = [
        smooth_data([pose.front[0]], closed=False)
        for pose in curl_poses(DESIGN, TIMELINE, 0)
    ]
    assert edge[1].split(";") == expected
    assert edge[0] == expected[0]
    main_ids = {node.attrib["id"] for node in current.iter() if "id" in node.attrib}
    comparison_ids = {
        node.attrib["id"] for node in comparison.iter() if "id" in node.attrib
    }
    assert not main_ids.intersection(comparison_ids)
    (task / "evidence/geometry-checks.json").write_text(
        json.dumps(
            {
                "moving_paths_unchanged": True,
                "pool_paths_unchanged": True,
                "original_leader_unchanged": True,
                "single_edge_matches_front_edge": True,
                "distinct_svg_ids": True,
                "curl_frames": len(expected),
            },
            indent=2,
        )
        + "\n"
    )
    print("Geometry, original leader, and SVG identity checks passed.")


if __name__ == "__main__":
    main()
