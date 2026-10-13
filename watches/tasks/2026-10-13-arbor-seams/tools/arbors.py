"""Close-ups of each place where an arbor comes up through a face.

Run from watches/, with the explorer on port 3141
(`pnpm exec vite watch/explorer --port 3141`):

    uv run python tasks/2026-10-13-arbor-seams/tools/arbors.py OUT_DIR [PORT]

PORT is the explorer's port (default 3141).

Each case is centred on the arbor, at the height of the face that it comes
through (the heights are an example, from the scene of 2026-10-13).
"""

import json
import math
import pathlib
import sys
import time
from urllib.parse import urlencode

from playwright.sync_api import sync_playwright

out = pathlib.Path(sys.argv[1])
port = sys.argv[2] if len(sys.argv) > 2 else "3141"
design = json.load(open("watch/design.json"))
cx, cy = design["watchCentre"]
arbors = {wheel["name"]: wheel["arbor"] for wheel in design["wheels"]}
arbors["minute"] = design["motionWorks"]["minute"]["arbor"]
arbors["balance"] = design["balance"]["arbor"]
# the one-step hour wheel: 12 x the cannon pinion, at 150 degrees from it
cannon = design["motionWorks"]["cannon"]["radius"]
centres = cannon * 12 + cannon
arbors["one-step hour"] = [
    centres * math.cos(math.radians(150)),
    centres * math.sin(math.radians(150)),
]


def train(name: str) -> list[str]:
    return [f"{name} wheel", f"{name} pinion", f"{name} arbor"]


motion = ["cannon pinion", "minute wheel", "minute pinion", "minute arbor"]
# name: (arbor, pieces shown, face height)
cases = {
    "escape": ("escape", train("escape"), 6.1),
    "fourth": ("fourth", train("fourth"), 9.1),
    "third": ("third", train("third"), 12.2),
    "centre": ("centre", train("centre"), 17.3),
    "cannon": ("centre", [*train("centre"), "cannon pinion"], 20.3),
    "minute": ("minute", motion, 23.4),
    "hour-pipe": ("centre", [*train("centre"), *motion, "hour wheel"], 26.4),
    "one-step-hour": (
        "one-step hour",
        ["cannon pinion", "one-step hour wheel"],
        20.3,
    ),
    "collet": (
        "balance",
        ["balance wheel", "balance staff", "hairspring", "collet"],
        -4.0,
    ),
}
with sync_playwright() as playwright:
    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": 900, "height": 600}, device_scale_factor=2
    )
    page.goto(f"http://localhost:{port}/")
    time.sleep(2)
    for name, (arbor, show, height) in cases.items():
        ax, ay = arbors[arbor]
        for tilt, scale in [(0, 8), (40, 8), (40, 3)]:
            fragment = urlencode(
                {
                    "tilt": f"{tilt:.2f}",
                    "turn": "0.00",
                    "scale": str(scale),
                    "target": f"{cx + ax:.3f},{cy + ay:.3f},{height}",
                    "speed": "1",
                    "guides": "0",
                    "show": "|".join(show),
                }
            )
            page.goto("about:blank")
            page.goto(f"http://localhost:{port}/#{fragment}")
            time.sleep(2)
            page.screenshot(path=out / f"{name}-t{tilt}-s{scale}.png")
    browser.close()
