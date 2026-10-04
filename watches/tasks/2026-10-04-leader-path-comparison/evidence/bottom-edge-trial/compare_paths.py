"""Compare angular sampling and movement weights with the saved generator."""

from dataclasses import replace
from itertools import pairwise
import json
import math
from pathlib import Path
from time import perf_counter

from result.art.diving_board import (
    DESIGN,
    TIMELINE,
    LEADER_DESIGN,
    Point,
    LeaderDesign,
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
    for samples in (64, 128, 256, 512, 1024):
        design = replace(LEADER_DESIGN, contact_samples=samples)
        started = perf_counter()
        contacts = leader_contacts(poses, design)
        sampling_seconds = perf_counter() - started
        for weight in (0.001, 0.003, 0.01, 0.03) if samples == 128 else (0.003,):
            profile = replace(design, normal_velocity_weight=weight)
            started = perf_counter()
            anchors = minimum_leader_path(contacts, profile, TIMELINE.curl)
            solving_seconds = perf_counter() - started
            results.append(
                {
                    "samples": samples,
                    "normal_velocity_weight": weight,
                    "sampling_seconds": sampling_seconds,
                    "solving_seconds": solving_seconds,
                    "candidate_counts": [len(frame) for frame in contacts],
                    "transition_count": sum(
                        len(before) * len(after) for before, after in pairwise(contacts)
                    ),
                    **metrics(anchors, profile),
                }
            )
            print(
                json.dumps(
                    {
                        key: value
                        for key, value in results[-1].items()
                        if key not in ("anchors", "candidate_counts")
                    }
                ),
                flush=True,
            )
    task = Path(__file__).resolve().parent
    (task / "evidence/path-comparison.json").write_text(
        json.dumps(results, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
