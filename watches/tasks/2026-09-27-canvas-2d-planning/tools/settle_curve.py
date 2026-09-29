#!/usr/bin/env python3
"""Bring the balance to rest at its centre, from its next extreme: how
smooth is each way to do it?

    ../../../../.venv/bin/python3 settle_curve.py      # in tools/

The balance swings as A cos(2 pi t / T): A = 150 degrees, T = 2 s, as in the
generator. A key press at t = 0.3 s asks it to stop. It first reaches an
extreme at t = 1 s, where it is at rest for an instant. From there:

- "settle": the angle follows a smoothstep to 0 over D seconds. Its speed is
  a quadratic in time, zero at both ends: the proposal in instructions.md.
  D = sqrt(6) / omega also matches the swing's acceleration at the extreme,
  so position, speed and acceleration are all continuous.
- "slow clock": the mechanism's own clock eases from the extreme to the next
  quarter period with a smoothstep; every part follows it.
- "freeze": stop at once at the key press, for comparison.

Writes ../evidence/settle.json (the jumps at each hand-over) and
../evidence/settle.svg (the angle against time).
"""

import json
import math
import pathlib
from collections.abc import Callable

import numpy as np
from numpy.typing import NDArray

EVIDENCE = pathlib.Path(__file__).resolve().parents[1] / "evidence"
AMPLITUDE = 150.0  # degrees
PERIOD = 2.0  # s
OMEGA = 2 * math.pi / PERIOD
PRESS = 0.3  # s: the key press
EXTREME = 1.0  # s: the next extreme after the press
SETTLE = math.sqrt(6) / OMEGA  # s: matches the acceleration at the extreme
STEP = 1e-4  # s: for the one-sided derivatives

Curve = Callable[[float], float]


def swing(time: float) -> float:
    return AMPLITUDE * math.cos(OMEGA * time)


def smoothstep(fraction: float) -> float:
    fraction = min(max(fraction, 0.0), 1.0)
    return fraction * fraction * (3 - 2 * fraction)


def settle(time: float) -> float:
    if time <= EXTREME:
        return swing(time)
    return swing(EXTREME) * (1 - smoothstep((time - EXTREME) / SETTLE))


def slow_clock(time: float) -> float:
    if time <= EXTREME:
        return swing(time)
    return swing(EXTREME + PERIOD / 4 * smoothstep((time - EXTREME) / SETTLE))


def freeze(time: float) -> float:
    return swing(min(time, PRESS))


def jumps(curve: Curve, at: float) -> dict[str, float]:
    """Change in angle, speed and acceleration at `at`: the limit from the
    right minus the limit from the left, by one-sided differences."""
    left = [curve(at - index * STEP) for index in range(3)]
    right = [curve(at + index * STEP) for index in range(3)]
    return {
        "angle, degrees": round(right[0] - left[0], 3),
        "speed, degrees/s": round(
            (right[1] - right[0]) / STEP - (left[0] - left[1]) / STEP, 1
        ),
        "acceleration, degrees/s^2": round(
            (right[2] - 2 * right[1] + right[0]) / STEP**2
            - (left[0] - 2 * left[1] + left[2]) / STEP**2
        ),
    }


def peak_speed(curve: Curve, start: float, end: float) -> float:
    times = np.linspace(start, end, 4001)
    values = np.array([curve(time) for time in times])
    speeds: NDArray[np.float64] = np.abs(np.gradient(values, times))
    return round(float(speeds.max()), 1)


# ---- the chart ----------------------------------------------------------------------
WIDTH, HEIGHT = 720, 380
LEFT, RIGHT, TOP, BOTTOM = 64, 24, 58, 44
SURFACE, GRID, TEXT, MUTED = "#fcfcfb", "#e4e3df", "#0b0b0b", "#52514e"
SERIES = [
    ("settle (proposed), 0.78 s", settle, "#2a78d6"),
    ("slow the clock, 0.78 s", slow_clock, "#eb6834"),
]
TIME_RANGE, ANGLE_RANGE = (0.0, 2.4), (-165.0, 165.0)


def x_of(time: float) -> float:
    return LEFT + (time - TIME_RANGE[0]) / (TIME_RANGE[1] - TIME_RANGE[0]) * (
        WIDTH - LEFT - RIGHT
    )


def y_of(angle: float) -> float:
    return TOP + (ANGLE_RANGE[1] - angle) / (ANGLE_RANGE[1] - ANGLE_RANGE[0]) * (
        HEIGHT - TOP - BOTTOM
    )


def polyline(curve: Curve, start: float, end: float) -> str:
    times = np.linspace(start, end, 600)
    return " ".join(
        f"{x_of(float(time)):.1f},{y_of(curve(float(time))):.1f}" for time in times
    )


def chart() -> str:
    font = 'font-family="system-ui, -apple-system, Segoe UI, sans-serif"'
    title = (
        f'<text x="{LEFT}" y="22" {font} font-size="15" font-weight="600" fill="{TEXT}">'
        "Bringing the balance to rest from its next extreme</text>"
    )
    subtitle = (
        f'<text x="{LEFT}" y="40" {font} font-size="12" fill="{MUTED}">'
        "Balance angle (degrees) against time (s). Key press at 0.3 s; "
        "the swing reaches an extreme at 1 s.</text>"
    )
    parts = [
        f'<rect width="{WIDTH}" height="{HEIGHT}" fill="{SURFACE}"/>',
        title,
        subtitle,
    ]
    for angle in (-150, -75, 0, 75, 150):
        parts.append(
            f'<line x1="{LEFT}" x2="{WIDTH - RIGHT}" y1="{y_of(angle):.1f}" y2="{y_of(angle):.1f}" stroke="{GRID}" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{LEFT - 8}" y="{y_of(angle) + 4:.1f}" {font} font-size="11" fill="{MUTED}" text-anchor="end">{angle}</text>'
        )
    parts.extend(
        f'<text x="{x_of(float(tick)):.1f}" y="{HEIGHT - BOTTOM + 18}" {font} font-size="11" fill="{MUTED}" text-anchor="middle">{tick:.1f}</text>'
        for tick in np.arange(0, 2.41, 0.4)
    )
    for moment, label in ((PRESS, "key press"), (EXTREME, "extreme")):
        parts.append(
            f'<line x1="{x_of(moment):.1f}" x2="{x_of(moment):.1f}" y1="{TOP}" y2="{HEIGHT - BOTTOM}" stroke="{GRID}" stroke-width="1"/>'
        )
        parts.append(
            f'<text x="{x_of(moment) + 4:.1f}" y="{TOP + 12}" {font} font-size="11" fill="{MUTED}">{label}</text>'
        )
    parts.append(
        f'<polyline points="{polyline(swing, 0, TIME_RANGE[1])}" fill="none" stroke="#b9b8b2" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
    )
    for _, curve, colour in SERIES:
        parts.append(
            f'<polyline points="{polyline(curve, EXTREME, TIME_RANGE[1])}" fill="none" stroke="{colour}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
        )
    parts.append(
        f'<circle cx="{x_of(EXTREME):.1f}" cy="{y_of(swing(EXTREME)):.1f}" r="4" fill="{TEXT}" stroke="{SURFACE}" stroke-width="2"/>'
    )
    # the legend sits in the empty lower right of the plot
    legend_x, legend_y = x_of(1.83), y_of(-78)
    entries = [
        ("free swing, for reference", "#b9b8b2"),
        *[(label, colour) for label, _, colour in SERIES],
    ]
    for index, (label, colour) in enumerate(entries):
        row = legend_y + index * 20
        parts.append(
            f'<line x1="{legend_x:.1f}" x2="{legend_x + 18:.1f}" y1="{row:.1f}" y2="{row:.1f}" stroke="{colour}" stroke-width="2" stroke-linecap="round"/>'
        )
        parts.append(
            f'<text x="{legend_x + 24:.1f}" y="{row + 4:.1f}" {font} font-size="11" fill="{TEXT}">{label}</text>'
        )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{WIDTH}" height="{HEIGHT}" viewBox="0 0 {WIDTH} {HEIGHT}">\n'
        "<title>Balance angle against time for two ways to settle</title>\n"
        + "\n".join(parts)
        + "\n</svg>\n"
    )


def main() -> None:
    result = {
        "settle duration, s (sqrt(6)/omega)": round(SETTLE, 4),
        "free swing, peak speed, degrees/s": round(AMPLITUDE * OMEGA, 1),
        "jumps at the hand-over": {
            "settle": jumps(settle, EXTREME),
            "slow clock": jumps(slow_clock, EXTREME),
            "freeze at the key press": jumps(freeze, PRESS),
        },
        "peak speed while settling, degrees/s": {
            "settle": peak_speed(settle, EXTREME, EXTREME + SETTLE),
            "slow clock": peak_speed(slow_clock, EXTREME, EXTREME + SETTLE),
        },
        "swing's acceleration at the extreme, degrees/s^2": round(
            -(OMEGA**2) * swing(EXTREME), 0
        ),
    }
    print(json.dumps(result, indent=1))
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "settle.json").write_text(json.dumps(result, indent=1) + "\n")
    (EVIDENCE / "settle.svg").write_text(chart())
    print(f"wrote {EVIDENCE / 'settle.json'} and settle.svg")


if __name__ == "__main__":
    main()
