"""What the one-step hour wheel covers, by the angle of its arbor.

    python3 tools/scan_one_step_hour.py tools/design-before.json > out/scan_one_step_hour.txt

The wheel's tip circle is 78.6 px, and its arbor 81.25 px from the centre
arbor (PLAN.md, "The gearing"). For each angle it prints the area (px^2, in
the plan) of each part's disc inside the tip circle; the fork's is a disc of
its swing, roughly. "busy" is all but the barrel. Stdlib only.
"""

import json
import math
import sys

DISTANCE, TIP = 81.25, 78.6
FORK_REACH = 40.0


def main() -> None:
    design = json.loads(open(sys.argv[1]).read())
    parts = {
        wheel["name"]: (tuple(wheel["arbor"]), wheel["outer"])
        for wheel in design["wheels"]
        if wheel["name"] != "centre"
    }
    parts["balance"] = (tuple(design["balance"]["arbor"]), design["balance"]["radius"])
    parts["fork"] = (tuple(design["fork"]["pivot"]), FORK_REACH)
    print(f"{'angle':>5} {'clock':>5} " + " ".join(f"{part:>8}" for part in parts) + "   busy (all but barrel)")
    for angle in range(0, 360, 15):
        arbor = (DISTANCE * math.cos(math.radians(angle)), DISTANCE * math.sin(math.radians(angle)))
        covered = {}
        for name, (centre, radius) in parts.items():
            count = 0
            for row in range(-int(radius), int(radius) + 1):
                for column in range(-int(radius), int(radius) + 1):
                    x, y = centre[0] + column, centre[1] + row
                    if math.hypot(column, row) <= radius and math.hypot(x - arbor[0], y - arbor[1]) <= TIP:
                        count += 1
            covered[name] = count
        busy = sum(area for name, area in covered.items() if name != "barrel")
        clock = ((angle + 90) % 360) / 30
        print(f"{angle:5d} {int(clock) or 12:2d}:{round(clock % 1 * 60):02d} " + " ".join(f"{covered[part]:8d}" for part in parts) + f"   {busy:8d}")


if __name__ == "__main__":
    main()
