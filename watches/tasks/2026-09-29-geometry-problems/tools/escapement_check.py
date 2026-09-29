#!/usr/bin/env python3
"""How much the pallet fork overlaps the escape wheel, over one beat.

    uv run tasks/2026-09-29-geometry-problems/tools/escapement_check.py   # in watches/

Reads watch/design.json. Draws the escape wheel (as watch/shapes.ts
escapeOutline does) and the fork's outline as pixels, 20 to a CSS px, and
prints their overlap in CSS px^2 at 41 moments of the tick: the fork turns
from -bank to +bank; the wheel holds for the first `unlock` of the window,
then turns one step. With --picture DIR it also writes PNGs at rest and
mid-tick. A flush contact rasterises as up to about 0.2 px^2.
"""

import argparse
import json
import math
import pathlib

import numpy as np
from PIL import Image, ImageDraw

TALK = pathlib.Path(__file__).resolve().parents[3]
DESIGN = json.loads((TALK / "watch" / "design.json").read_text())
SCALE = 20
ORIGIN = (-60.0, -60.0)
SIZE = (150 * SCALE, 120 * SCALE)
Point = tuple[float, float]


def polar(radius: float, degrees: float) -> Point:
    angle = math.radians(degrees)
    return radius * math.cos(angle), radius * math.sin(angle)


def quad(start: Point, control: Point, end: Point, steps: int = 24) -> list[Point]:
    return [
        (
            (1 - t) ** 2 * start[0] + 2 * (1 - t) * t * control[0] + t * t * end[0],
            (1 - t) ** 2 * start[1] + 2 * (1 - t) * t * control[1] + t * t * end[1],
        )
        for t in (i / steps for i in range(1, steps + 1))
    ]


def wheel(phase: float) -> list[Point]:
    """The escape wheel about its arbor, turned `phase` degrees from the line
    of centres (the fork's pivot is on +x)."""
    escape = DESIGN["wheels"][-1]
    teeth, root, tip = escape["teeth"], escape["inner"], escape["outer"]
    tooth = -360 / teeth
    points = [polar(root, phase - 0.9 * tooth)]
    for index in range(teeth):
        at = phase + index * tooth
        points += quad(
            points[-1], polar(root + 2, at - 0.55 * tooth), polar(tip - 2, at - 0.22 * tooth)
        )
        points += [polar(tip, at), polar(root, at + 0.04 * tooth)]
        points += [polar(root, at + (0.04 + 0.01 * k) * tooth) for k in range(1, 7)]
    return points


def fork(bank: float, distance: float) -> list[Point]:
    """The fork's outline about the escape arbor, turned `bank` degrees."""
    turn = math.radians(bank)
    return [
        (
            distance + along * math.cos(turn) - across * math.sin(turn),
            along * math.sin(turn) + across * math.cos(turn),
        )
        for along, across in DESIGN["fork"]["outline"]
    ]


def mask(points: list[Point]) -> np.ndarray:
    image = Image.new("1", SIZE, 0)
    ImageDraw.Draw(image).polygon(
        [((x - ORIGIN[0]) * SCALE, (y - ORIGIN[1]) * SCALE) for x, y in points], fill=1
    )
    return np.array(image)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--picture", type=pathlib.Path)
    arguments = parser.parse_args()
    timing = DESIGN["timing"]
    bank, unlock = timing["bank"], timing["unlock"]
    step = DESIGN["wheels"][-1]["step"]
    pivot = DESIGN["fork"]["pivot"]
    arbor = DESIGN["wheels"][-1]["arbor"]
    distance = math.dist(pivot, arbor)
    phase = DESIGN["escapePhase"] - DESIGN["fork"]["heading"]
    print(f"pivot {distance:.2f} px from the escape arbor; tooth phase {phase % 360:.2f}")
    worst = 0.0
    for u in np.linspace(0, 1, 41):
        fork_bank = -bank + 2 * bank * u
        turned = step * max(0.0, (u - unlock) / (1 - unlock))
        area = float((mask(fork(fork_bank, distance)) & mask(wheel(phase + turned))).sum())
        area /= SCALE**2
        worst = max(worst, area)
        print(f"u {u:.3f}  fork {fork_bank:+6.2f}  wheel {turned:+6.2f}  overlap {area:.3f} px^2")
        if arguments.picture and round(u * 40) in (0, 20, 40):
            arguments.picture.mkdir(parents=True, exist_ok=True)
            picture = Image.new("RGB", (100 * 8, 90 * 8), "white")
            draw = ImageDraw.Draw(picture)
            place = lambda p: ((p[0] + 40) * 8, (p[1] + 45) * 8)  # noqa: E731
            draw.polygon([place(p) for p in wheel(phase + turned)], fill=(210, 220, 227), outline=(20, 60, 107), width=3)
            draw.polygon([place(p) for p in fork(fork_bank, distance)], fill=(230, 235, 240), outline=(20, 60, 107), width=3)
            picture.save(arguments.picture / f"escapement-u{u:.2f}.png")
    print(f"worst overlap {worst:.3f} px^2")


if __name__ == "__main__":
    main()
