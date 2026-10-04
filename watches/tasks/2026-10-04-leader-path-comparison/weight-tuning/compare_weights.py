"""Compare angular sampling and movement weights with the saved generator."""

import json
import math
from dataclasses import replace
from itertools import pairwise
from pathlib import Path
from time import perf_counter

from result.art.diving_board import (
    DESIGN,
    LEADER_DESIGN,
    TIMELINE,
    LeaderDesign,
    Point,
    curl_poses,
    leader_bend,
    leader_contacts,
    leader_step_costs,
    minimum_leader_path,
)


def metrics(anchors: list[Point], design: LeaderDesign) -> dict[str, object]:
    seconds = TIMELINE.curl / (len(anchors) - 1)
    length = [math.dist(point, design.elbow) for point in anchors]
    bends = [math.degrees(leader_bend(point, design)) for point in anchors]
    motion = [math.dist(before, after) for before, after in pairwise(anchors)]
    normal_squared: list[float] = []
    for before, after in pairwise(anchors):
        midpoint = (
            (before[0] + after[0]) / 2 - design.elbow[0],
            (before[1] + after[1]) / 2 - design.elbow[1],
        )
        normal_squared.append(
            (
                (after[0] - before[0]) * midpoint[1]
                - (after[1] - before[1]) * midpoint[0]
            )
            ** 2
            / (seconds**2 * sum(value**2 for value in midpoint))
        )
    return {
        "cost": sum(
            float(leader_step_costs([before], [after], design, seconds)[0, 0])
            for before, after in pairwise(anchors)
        ),
        "mean_final_segment_px": sum(length) / len(length),
        "mean_bend_degrees": sum(bends) / len(bends),
        "normal_rms_px_per_second": math.sqrt(
            sum(normal_squared) / len(normal_squared)
        ),
        "max_step_px": max(motion),
        "total_motion_px": sum(motion),
        "anchors": anchors,
    }


def main() -> None:
    poses = curl_poses(DESIGN, TIMELINE, 0)
    results = []
    for length_weight, movement_weight in (
        (1, 0.003),
        (0.9, 0.004),
        (0.8, 0.0045),
        (0.75, 0.006),
        (0.5, 0.01),
        (0.5, 0.03),
        (0.25, 0.03),
        (0.25, 0.1),
    ):
        profile = replace(
            LEADER_DESIGN,
            length_weight=length_weight,
            normal_velocity_weight=movement_weight,
        )
        started = perf_counter()
        contacts = leader_contacts(poses, profile)
        anchors = minimum_leader_path(contacts, profile, TIMELINE.curl)
        results.append(
            {
                "length_weight": length_weight,
                "normal_velocity_weight": movement_weight,
                "generation_seconds": perf_counter() - started,
                **metrics(anchors, profile),
            }
        )
        print(
            json.dumps(
                {key: value for key, value in results[-1].items() if key != "anchors"}
            ),
            flush=True,
        )
    task = Path(__file__).resolve().parent
    (task / "evidence/weight-comparison.json").write_text(
        json.dumps(results, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
