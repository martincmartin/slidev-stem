"""Where each touch of the victory lap is, how fast each stop runs, and
what a low view of the barrel's touch can see.

    python3 tasks/2026-10-12-victory-lap/tools/touches.py \
        tasks/2026-10-12-victory-lap/tools/design-before.json \
        > tasks/2026-10-12-victory-lap/out/touches.txt

Stdlib only. It reads the design that the task started from
(design-before.json, a copy), and the heights in HEIGHTS (from
out/heights.txt), so its output does not change later.

Coordinates are the design's: px from the centre arbor, x to the right, y
down (toward 6 o'clock), z toward the dial (the camera at tilt 0).
"""

import json
import math
import sys

# Lowest and highest z of each part, from out/heights.txt (tools/heights.ts).
HEIGHTS = {
    "barrel": (12.25, 17.25),
    "centre pinion": (12.19, 17.25),
    "hour wheel": (20.38, 26.38),
    "chapter ring": (24.88, 27.88),
}

# s: the turn that the slower part of each touch shows, at its stop. The
# escape wheel turns once in 30 s, at 1x; the hour wheel at 1440x.
SHOWN_TURN = 30.0

# Frames a second of the projector, for the time-lapse's jumps.
FRAME_RATE = 60.0


def clock_position(x: float, y: float) -> float:
    """The direction (x, y) as an hour on the dial: 12 up, 3 to the right."""
    return (math.degrees(math.atan2(x, -y)) % 360) / 30


def main() -> None:
    design = json.loads(open(sys.argv[1]).read())
    wheels = {wheel["name"]: wheel for wheel in design["wheels"]}
    motion_works = design["motionWorks"]
    period = design["timing"]["period"]
    beats_a_second = 2 / period

    def turn_seconds(step: float) -> float:
        return 360 / abs(step) / beats_a_second

    minute_pinion_radius = (
        math.dist(motion_works["minute"]["arbor"], motion_works["hour"]["arbor"])
        - motion_works["hour"]["pitchRadius"]
    )
    # (name, driver's arbor, its radius, its turn; driven arbor, radius, turn)
    touches = [
        (
            "hour wheel / minute pinion",
            motion_works["minute"]["arbor"],
            minute_pinion_radius,
            turn_seconds(motion_works["minute"]["step"]),
            motion_works["hour"]["arbor"],
            motion_works["hour"]["pitchRadius"],
            turn_seconds(motion_works["hour"]["step"]),
        ),
        *[
            (
                f"{driver} wheel / {driven} pinion",
                wheels[driver]["arbor"],
                wheels[driver]["pitchRadius"],
                turn_seconds(wheels[driver]["step"]),
                wheels[driven]["arbor"],
                wheels[driven]["pinionRadius"],
                turn_seconds(wheels[driven]["step"]),
            )
            for driver, driven in [
                ("barrel", "centre"),
                ("centre", "third"),
                ("third", "fourth"),
                ("fourth", "escape"),
            ]
        ],
    ]

    print("## The touches\n")
    print(
        "touch                         at (x, y)        r     o'clock  tangent toward"
    )
    places = {}
    for name, driver_arbor, driver_radius, _, driven_arbor, _, _ in touches:
        across = [b - a for a, b in zip(driver_arbor, driven_arbor)]
        length = math.hypot(*across)
        unit = [value / length for value in across]
        x = driver_arbor[0] + unit[0] * driver_radius
        y = driver_arbor[1] + unit[1] * driver_radius
        places[name] = (x, y)
        print(
            f"{name:29} ({x:6.1f}, {y:6.1f})  {math.hypot(x, y):5.1f}  "
            f"{clock_position(x, y):5.1f}    "
            f"{clock_position(-unit[1], unit[0]):4.1f} and "
            f"{clock_position(unit[1], -unit[0]):4.1f}"
        )

    print("\n## The next touch, and the camera's side that keeps it behind\n")
    names = [touch[0] for touch in touches]
    for name, following in zip(names, names[1:]):
        here, there = places[name], places[following]
        toward = clock_position(there[0] - here[0], there[1] - here[1])
        print(
            f"{name:29} -> {following:29} is toward {toward:4.1f} o'clock; "
            f"camera from {(toward + 6) % 12:4.1f}"
        )

    print("\n## The speed of each stop\n")
    print(
        "The slower part of each touch turns once in "
        f"{SHOWN_TURN:.0f} s (the larger speed-up of the two parts)."
    )
    print(
        "Jumps: the time-lapse of watch/model.ts (mechanismAt) jumps the train "
        "by whole periods of the balance."
    )
    print(
        "touch                         driver s/turn  driven s/turn  speed-up  "
        "faster part's turn  jump every  balance period at full speed-up"
    )
    for name, _, _, driver_turn, _, _, driven_turn in touches:
        speed_up = max(driver_turn, driven_turn) / SHOWN_TURN
        faster = min(driver_turn, driven_turn) / speed_up
        jump = period / (speed_up - 1) if speed_up > 1 else math.inf
        swing = period / speed_up
        print(
            f"{name:29} {driver_turn:13.0f}  {driven_turn:13.0f}  "
            f"{speed_up:7.1f}x  {faster:15.2f} s  "
            f"{jump:8.3f} s ({jump * FRAME_RATE:6.1f} frames)  "
            f"{swing:6.3f} s ({swing * FRAME_RATE:5.1f} frames)"
        )

    print("\n## A low view of the barrel's touch, along its tangent\n")
    x, y = places["barrel wheel / centre pinion"]
    radius = math.hypot(x, y)
    low = max(HEIGHTS["barrel"][0], HEIGHTS["centre pinion"][0])
    high = min(HEIGHTS["barrel"][1], HEIGHTS["centre pinion"][1])
    hour_wheel_bottom = HEIGHTS["hour wheel"][0]
    ring_top = HEIGHTS["chapter ring"][1]
    hour_tip = motion_works["hour"]["outer"]
    ring_inner = design["case"]["ringRadius"]

    def along(edge: float) -> float:
        """How far the tangent runs from the touch to the circle `edge`."""
        return math.sqrt(edge**2 - radius**2)

    print(
        f"The touch is {low:.2f} to {high:.2f} high, {radius:.1f} from the centre "
        "arbor. Looking along its tangent, the line of sight passes under the "
        f"hour wheel (bottom {hour_wheel_bottom:.2f}, tip radius {hour_tip:.2f}) "
        f"for {along(hour_tip):.1f}, and over the chapter ring (top {ring_top:.2f}, "
        f"inner radius {ring_inner:.0f}) at {along(ring_inner):.1f}."
    )
    print("tilt  shows of the touch (under the hour wheel, over the ring)")
    for tilt in [60, 70, 75, 78, 80, 81, 82, 84, 86, 87, 88]:
        rise = 1 / math.tan(math.radians(tilt))
        top = min(high, hour_wheel_bottom - along(hour_tip) * rise)
        bottom = max(low, ring_top - along(ring_inner) * rise)
        shown = max(0.0, top - bottom)
        print(
            f"{tilt:4d}  {bottom:5.2f} to {top:5.2f}: "
            f"{100 * shown / (high - low):3.0f}% of its height"
        )
    least = math.degrees(
        math.atan(along(hour_tip) / (hour_wheel_bottom - high))
    )
    most = math.degrees(math.atan(along(ring_inner) / (ring_top - low)))
    print(
        f"All of it shows from {least:.1f} to {most:.1f} degrees. With the "
        "motion works hidden, only the ring limits the tilt."
    )


main()
