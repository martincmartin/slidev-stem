"""Compare leader cost weights with the saved generator and curl geometry."""

from dataclasses import replace
from itertools import pairwise
import json
import math
from pathlib import Path

from result.art.diving_board import (
    DESIGN,
    TIMELINE,
    LEADER_DESIGN,
    curl_poses,
    leader_anchors,
    leader_bend,
    squared_distance,
)


def main() -> None:
    poses = curl_poses(DESIGN, TIMELINE, 0)
    profiles = (
        ("length_only", replace(LEADER_DESIGN, bend_weight=0, movement_weight=0)),
        ("weighted", LEADER_DESIGN),
        ("movement_0.5", replace(LEADER_DESIGN, movement_weight=0.5)),
        ("movement_0.75", replace(LEADER_DESIGN, movement_weight=0.75)),
        ("movement_3", replace(LEADER_DESIGN, movement_weight=3)),
    )
    results: list[dict[str, object]] = []
    for name, design in profiles:
        anchors = leader_anchors(poses, design)
        motion = [
            math.sqrt(squared_distance(first, second))
            for first, second in pairwise(anchors)
        ]
        lengths = [
            math.sqrt(squared_distance(design.start, design.elbow))
            + math.sqrt(squared_distance(design.elbow, point))
            for point in anchors
        ]
        bends = [math.degrees(leader_bend(point, design)) for point in anchors]
        results.append(
            {
                "name": name,
                "weights": [
                    design.length_weight,
                    design.bend_weight,
                    design.movement_weight,
                ],
                "initial_length_px": lengths[0],
                "mean_length_px": sum(lengths) / len(lengths),
                "mean_bend_degrees": sum(bends) / len(bends),
                "total_motion_px": sum(motion),
                "max_step_px": max(motion),
                "anchors": anchors,
            }
        )
    output = Path(__file__).resolve().parent / "evidence/weighted-comparison.json"
    output.write_text(json.dumps(results, indent=2) + "\n")


if __name__ == "__main__":
    main()
