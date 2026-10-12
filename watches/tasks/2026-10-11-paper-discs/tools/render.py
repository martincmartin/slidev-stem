#!/usr/bin/env python3
"""Draw the deck's watch states in each variant, and compare with today's.

    node tasks/2026-10-11-paper-discs/tools/states.ts > tasks/2026-10-11-paper-discs/out/states.json
    uv run tasks/2026-10-11-paper-discs/tools/render.py [ROUND]     # in watches/; ROUND 1 to 7

It builds the probe page (tools/probe/) with Vite, draws each frame in
Chromium at 2 device px a CSS px, and writes out/<variant>/<frame>.png. Then,
for each variant, it counts the pixels that differ from its reference (the
variant's `reference`, or else the baseline: clip discs, tolerance 0.25) in
each frame, and writes out/summary-<ROUND>.json. A pixel
differs if a channel differs at all; it differs visibly if a channel differs
by more than VISIBLE (of 255); it is lighter if it differs visibly and is
lighter (a line lost, or a part gone).
"""

import base64
import functools
import http.server
import io
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import threading
from collections.abc import Iterator
from contextlib import contextmanager

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

TASK = pathlib.Path(__file__).resolve().parents[1]
TALK = TASK.parents[1]
OUT = TASK / "out"
SIZE = [1960, 1104]
VISIBLE = 32
# frames drawn again at steeper tilts than the deck's
STEEP = ["What Every Nerd Should Know About Mechanical Watches 0", "Escapement 0", "Gear Train 0", "Hour Hand 0", "Hour Hand 3"]
STEEP_TILTS = [45, 60, 75]
BASELINE = {"name": "clip-0.25", "mode": "clip", "tolerance": 0.25, "raise": 0, "gap": 0}
# Round 1: the tolerance, the raised disc and the holdout. Round 2: the gap.
# Each variant is compared with its reference: today's picture, or the clip
# discs with the same gap (the disc's own effect).
ROUNDS = {
    1: [
        BASELINE,
        *[{"name": f"clip-{value}", "mode": "clip", "tolerance": value, "raise": 0, "gap": 0} for value in (0.1, 0.05, 0.02, 0.01, 0.005, 0.0)],
        {"name": "holdout-0.25", "mode": "holdout", "tolerance": 0.25, "raise": 0, "gap": 0},
        {"name": "raised-0.3-0.25", "mode": "raised", "tolerance": 0.25, "raise": 0.3, "gap": 0},
        {"name": "raised-0.05-0.02", "mode": "raised", "tolerance": 0.02, "raise": 0.05, "gap": 0},
    ],
    3: [
        {**BASELINE, "name": "clip-0.25-angle"},
        {"name": "paper-gap-0.5-angle", "mode": "paper", "tolerance": 0.25, "raise": 0, "gap": 0.5, "reference": "clip-0.25-angle"},
    ],
    4: [
        BASELINE,
        {"name": "exact-clip-0.25", "mode": "clip", "tolerance": 0.25, "raise": 0, "gap": 0, "exact": True},
        *[
            variant
            for gap in (0.01, 0.02, 0.05)
            for variant in (
                {"name": f"clip-gap-{gap}", "mode": "clip", "tolerance": 0.25, "raise": 0, "gap": gap},
                {"name": f"exact-paper-gap-{gap}", "mode": "paper", "tolerance": 0.005, "raise": 0, "gap": gap, "exact": True, "reference": f"clip-gap-{gap}"},
            )
        ],
    ],
    5: [
        {**BASELINE, "name": "clip-gap-0.02", "gap": 0.02},
        *[{"name": f"exact-paper-gap-0.02-tol-{value}", "mode": "paper", "tolerance": value, "raise": 0, "gap": 0.02, "exact": True, "reference": "clip-gap-0.02"} for value in (0.25, 0.05, 0.015, 0.005)],
    ],
    6: [
        BASELINE,
        *[
            variant
            for gap in (0.03, 0.05, 0.1)
            for variant in (
                {"name": f"clip-gap-{gap}", "mode": "clip", "tolerance": 0.25, "raise": 0, "gap": gap},
                {"name": f"exact-paper-gap-{gap}-tol-{gap / 2}", "mode": "paper", "tolerance": gap / 2, "raise": 0, "gap": gap, "exact": True, "reference": f"clip-gap-{gap}"},
            )
        ],
    ],
    7: [
        {**BASELINE, "name": "gpu-clip-0.25"},
        {"name": "gpu-clip-gap-0.05", "mode": "clip", "tolerance": 0.25, "raise": 0, "gap": 0.05, "reference": "gpu-clip-0.25"},
        {"name": "gpu-exact-paper-gap-0.05-tol-0.025", "mode": "paper", "tolerance": 0.025, "raise": 0, "gap": 0.05, "exact": True, "reference": "gpu-clip-gap-0.05"},
        {"name": "gpu-exact-clip-0.25", "mode": "clip", "tolerance": 0.25, "raise": 0, "gap": 0, "exact": True, "reference": "gpu-clip-0.25"},
    ],
    2: [
        BASELINE,
        *[
            variant
            for gap in (0.15, 0.3, 0.5)
            for variant in (
                {"name": f"clip-gap-{gap}", "mode": "clip", "tolerance": 0.25, "raise": 0, "gap": gap},
                {"name": f"paper-gap-{gap}", "mode": "paper", "tolerance": 0.25, "raise": 0, "gap": gap, "reference": f"clip-gap-{gap}"},
            )
        ],
    ],
}


class Quiet(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


@contextmanager
def served(directory: pathlib.Path) -> Iterator[str]:
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(Quiet, directory=str(directory)))
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()


def build(directory: pathlib.Path) -> None:
    environment = {name: value for name, value in os.environ.items() if name != "VIRTUAL_ENV"}
    result = subprocess.run(
        [shutil.which("pnpm") or "pnpm", "exec", "vite", "build", str(TASK / "tools" / "probe"), "--outDir", str(directory), "--emptyOutDir", "--base", "./"],
        cwd=TALK, env=environment, capture_output=True, text=True, check=False,
    )
    if result.returncode != 0:
        sys.exit(f"vite build failed:\n{result.stdout}{result.stderr}")


def frames() -> list[dict[str, object]]:
    """The frames to draw: all, or those whose name holds PAPER_FRAMES."""
    wanted = os.environ.get("PAPER_FRAMES", "")
    return [frame for frame in all_frames() if wanted in str(frame["name"])]


def all_frames() -> list[dict[str, object]]:
    states = json.loads((OUT / "states.json").read_text())
    result: list[dict[str, object]] = [{"name": each["name"], "state": each["state"]} for each in states]
    for each in states:
        if each["name"] in STEEP:
            result += [{"name": f"{each['name']} tilt {tilt}", "state": each["state"], "tilt": tilt} for tilt in STEEP_TILTS]
    return result


def file_name(name: str) -> str:
    return name.replace(" ", "_") + ".png"


def draw(chosen: list[dict[str, object]]) -> dict[str, object]:
    discs: dict[str, object] = {}
    with tempfile.TemporaryDirectory(prefix="paper-probe-") as built:
        build(pathlib.Path(built))
        with served(pathlib.Path(built)) as base, sync_playwright() as playwright:
            # PAPER_GPU=1: draw on the GPU, as the deck does; else in software
            # (SwiftShader), as the stills and the print check do
            gpu = os.environ.get("PAPER_GPU") == "1"
            browser = playwright.chromium.launch(args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"] if gpu else [])
            page = browser.new_page(device_scale_factor=2)
            page.set_default_timeout(120_000)
            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{base}/index.html")
            page.wait_for_function("window.paperProbeReady === true")
            for variant in chosen:
                folder = OUT / str(variant["name"])
                folder.mkdir(parents=True, exist_ok=True)
                for frame in frames():
                    url = page.evaluate(
                        "([variant, frame]) => window.paperProbe.render(variant, frame)",
                        [variant, {**frame, "size": SIZE}],
                    )
                    (folder / file_name(str(frame["name"]))).write_bytes(base64.b64decode(str(url).split(",", 1)[1]))
                    if errors:
                        sys.exit(f"the probe failed: {errors}")
                discs[str(variant["name"])] = page.evaluate("window.paperProbe.discs()")
            browser.close()
    return discs


def compare(variants: list[dict[str, object]]) -> dict[str, object]:
    summary: dict[str, object] = {}
    for variant in variants[1:]:
        reference = str(variant.get("reference", BASELINE["name"]))
        rows = []
        for frame in frames():
            name = file_name(str(frame["name"]))
            first = np.asarray(Image.open(OUT / reference / name).convert("RGB"), dtype=np.int16)
            second = np.asarray(Image.open(OUT / str(variant["name"]) / name).convert("RGB"), dtype=np.int16)
            difference = np.abs(first - second).max(axis=2)
            lighter = (second.sum(axis=2) > first.sum(axis=2)) & (difference > VISIBLE)
            rows.append({"frame": frame["name"], "differ": int((difference > 0).sum()), "visible": int((difference > VISIBLE).sum()), "lighter": int(lighter.sum())})
        summary[str(variant["name"])] = {"reference": reference, "frames": rows}
    return summary


def main() -> None:
    round_ = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    variants = ROUNDS[round_]
    discs = draw(variants)
    summary = compare(variants)
    wanted = os.environ.get("PAPER_FRAMES", "")
    (OUT / f"summary-{round_}{'-' + wanted.replace(' ', '_') if wanted else ''}.json").write_text(json.dumps({"discs": discs, "differences": summary}, indent=1) + "\n")
    for variant, result in summary.items():
        assert isinstance(result, dict)
        rows = result["frames"]
        changed = [row for row in rows if row["differ"]]
        visible = sum(row["visible"] for row in rows)
        lighter = sum(row["lighter"] for row in rows)
        print(f"{variant:18} vs {result['reference']:14} {len(changed):3} of {len(rows)} frames differ; {visible:7} visible px, {lighter:7} lighter")


if __name__ == "__main__":
    main()
