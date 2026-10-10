"""Where can the minute wheel go, and what does the motion works cover?

    python3 tasks/2026-10-09-motion-works/tools/scan_minute_wheel.py DESIGN_JSON

For each option of the gearing (PLAN.md, "The gearing"), and for each angle of
the minute wheel's arbor about the centre arbor, it prints the area (px^2,
in the plan) of each part of the movement that the motion works' discs cover:
the minute wheel's tip circle, and the hour wheel's tip circle about the
centre. The motion works are above the train, so they cover what they
overlap. Stdlib only. It reads the design that the task started from
(design-before.json, a copy), so its output does not change later.
"""

import json
import math
import sys

# One option: (name, the minute wheel's distance from the centre arbor,
# its tip radius, the hour wheel's tip radius). The numbers come from
# PLAN.md, "The gearing".
OPTIONS = [
    ("E: the centre pinion (6 leaves) drives an 18-tooth minute wheel", 49.33, 41.33, 43.07),
    ("C: a new 4-leaf pinion drives a 12-tooth minute wheel", 25.0, 21.25, 22.5),
]
GRID = 1.0  # px between samples of the area


def main() -> None:
    design = json.loads(open(sys.argv[1]).read())
    parts = {
        wheel["name"]: (tuple(wheel["arbor"]), wheel["outer"])
        for wheel in design["wheels"]
        if wheel["name"] != "centre"
    }
    parts["balance"] = (tuple(design["balance"]["arbor"]), design["balance"]["radius"])
    ring = design["case"]["ringRadius"]
    for name, distance, minute_tip, hour_tip in OPTIONS:
        print(f"\n{name}")
        print(f"{'angle':>5} {'clock':>5} " + " ".join(f"{part:>8}" for part in parts) + f" {'ring gap':>8}")
        for angle in range(0, 360, 10):
            arbor = (
                distance * math.cos(math.radians(angle)),
                distance * math.sin(math.radians(angle)),
            )
            covered = {}
            for part, (centre, radius) in parts.items():
                count = 0
                steps = int(radius / GRID)
                for row in range(-steps, steps + 1):
                    for column in range(-steps, steps + 1):
                        x = centre[0] + column * GRID
                        y = centre[1] + row * GRID
                        if math.hypot(x - centre[0], y - centre[1]) > radius:
                            continue
                        if (
                            math.hypot(x - arbor[0], y - arbor[1]) <= minute_tip
                            or math.hypot(x, y) <= hour_tip
                        ):
                            count += 1
                covered[part] = count * GRID * GRID
            ring_gap = ring - (distance + minute_tip)
            clock = ((angle + 90) % 360) / 30
            hours = int(clock) or 12
            minutes = round((clock % 1) * 60)
            print(
                f"{angle:5d} {hours:2d}:{minutes:02d} "
                + " ".join(f"{covered[part]:8.0f}" for part in parts)
                + f" {ring_gap:8.1f}"
            )


if __name__ == "__main__":
    main()
