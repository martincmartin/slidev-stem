#!/usr/bin/env python3
"""Reference pictures of the watch, and the check of a new renderer against
them.

    uv run --project ../../.. python reference_stills.py make
    uv run --project ../../.. python reference_stills.py compare --url URL

in this task's tools/ directory, with the talk's venv (watches/).

MAKE draws each still in STILLS with the frozen spike of the planning task
(../inputs/spike/: its renderer.js, its probe page webgl/index.html and its
scene.json), in Playwright's Chromium with the GPU (Metal), at a device pixel
ratio of 2: 1960 x 1104 px. It writes ../reference/<name>.png and
../reference/stills.json. It was run once, on 2026-09-29, when the planning
task closed. Do not run it again: the pictures are the target.

COMPARE draws the same stills with the page at URL, and compares each with its
reference, as the planning task's pixel_check.py does: a pixel is wrong if a
colour channel differs by more than THRESHOLD levels; the solid error is the
wrong pixels that survive a 3 x 3 erosion (a shift of a line by a fraction of
a pixel is wrong but not solid). Areas are in CSS px^2. A still passes if its
solid error is at most SOLID_LIMIT. It writes ../evidence/compare.json and,
for each still that fails, a picture of the wrong pixels in ../out/compare/.
It exits non-zero if a still fails.

THE PROBE CONTRACT. The page at URL must, once it is ready, set
`window.watchProbeReady = true`, and give `window.watchProbe.render(options)`,
which draws one frame into the page's only <canvas>, synchronously, with
`preserveDrawingBuffer: true`. The options are the keys of Still.options():
view (a view's name), tilt (degrees), time (s, the mechanism's clock), swing
(degrees, the balance's angle), size ([width, height] in device px), and for a
fade: only (a subject's name) and rest (the opacity of the rest of the watch).
The spike's page gives the same function as `window.spike`.
"""

import argparse
import base64
import functools
import http.server
import io
import json
import math
import pathlib
import sys
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

import numpy as np
from PIL import Image
from playwright.sync_api import Page, sync_playwright

TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parent
SPIKE = TASK / "inputs" / "spike"
REFERENCE = TASK / "reference"
EVIDENCE = TASK / "evidence"
OUT = TASK / "out" / "compare"
SIZE = (1960, 1104)  # device px: the 980 x 552 slide at a pixel ratio of 2
RATIO = 2
THRESHOLD = 96  # levels of 255, in any channel
SOLID_LIMIT = 5.0  # CSS px^2 of solid error allowed in each still
CHROMIUM_GPU = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
TIMEOUT = 120_000  # ms
AMPLITUDE, PERIOD = 150.0, 2.0  # the balance's swing
SUBJECT = "hairspring and stud"
READY = "window.watchProbeReady === true || window.spikeReady === true"
RENDER = "options => (window.watchProbe ?? window.spike).render(options)"
PIXELS = "document.querySelector('canvas').toDataURL('image/png')"


@dataclass(frozen=True)
class Still:
    """One picture: a view at a tilt, at a mechanism time, maybe faded."""

    name: str
    view: str
    tilt: float
    time: float = 0.37  # s: a pose with nothing at a keyframe
    rest: float | None = None  # the rest of the watch's opacity, for a fade
    at_rest: bool = False  # the balance still, at its centre (after a settle)

    def options(self) -> dict[str, object]:
        swing = (
            0.0
            if self.at_rest
            else AMPLITUDE * math.cos(2 * math.pi * self.time / PERIOD)
        )
        options: dict[str, object] = {
            "view": self.view,
            "tilt": self.tilt,
            "time": self.time,
            "swing": swing,
            "size": list(SIZE),
        }
        if self.rest is not None:
            options |= {"only": SUBJECT, "rest": self.rest}
        return options


STILLS = [
    Still("cover-0", "cover", 0.0),
    Still("cover-30", "cover", 30.0),
    Still("cover-60", "cover", 60.0),
    Still("cover-85", "cover", 85.0),
    Still("cover-45-moving", "cover", 45.0, time=1.3),
    Still("hairspring-0", "hairspring", 0.0),
    Still("hairspring-20", "hairspring", 20.0),
    Still("hairspring-45", "hairspring", 45.0),
    Still("crown-0", "crown", 0.0),
    Still("crown-45", "crown", 45.0),
    Still("opening-faded", "hairspring", 20.0, rest=0.0),
    Still("opening-mid-fade", "hairspring", 20.0, rest=0.5),
    Still("opening-at-rest", "hairspring", 20.0, rest=0.0, at_rest=True),
]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


@contextmanager
def served(directory: pathlib.Path) -> Iterator[str]:
    handler = functools.partial(QuietHandler, directory=str(directory))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()


def draw(page: Page, still: Still) -> Image.Image:
    page.evaluate(RENDER, still.options())
    url = str(page.evaluate(PIXELS))
    return Image.open(io.BytesIO(base64.b64decode(url.split(",", 1)[1]))).convert("RGB")


def pictures(url: str) -> tuple[dict[str, Image.Image], list[str]]:
    """Every still, drawn by the page at `url`, and the page's errors."""
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(args=CHROMIUM_GPU)
        page = browser.new_page(device_scale_factor=RATIO)
        page.set_default_timeout(TIMEOUT)
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        page.goto(url)
        page.wait_for_function(READY)
        drawn = {still.name: draw(page, still) for still in STILLS}
        browser.close()
    return drawn, errors


def eroded(mask: np.ndarray) -> np.ndarray:
    """The pixels whose 3 x 3 neighbourhood is all in `mask`."""
    padded = np.pad(mask, 1)
    height, width = mask.shape
    result = np.ones_like(mask)
    for dy in range(3):
        for dx in range(3):
            result &= padded[dy : dy + height, dx : dx + width]
    return result


def make() -> None:
    REFERENCE.mkdir(exist_ok=True)
    with served(SPIKE) as base:
        drawn, errors = pictures(f"{base}/tools/webgl/index.html?probe")
    if errors:
        sys.exit(f"the spike's page failed: {errors}")
    for name, picture in drawn.items():
        picture.save(REFERENCE / f"{name}.png", optimize=True)
    listing = [{"name": still.name, "options": still.options()} for still in STILLS]
    (REFERENCE / "stills.json").write_text(json.dumps(listing, indent=1) + "\n")
    print(f"wrote {len(drawn)} stills to {REFERENCE}")


def compare(url: str) -> int:
    drawn, errors = pictures(url)
    OUT.mkdir(parents=True, exist_ok=True)
    EVIDENCE.mkdir(exist_ok=True)
    rows: dict[str, dict[str, object]] = {}
    failed = []
    for still in STILLS:
        reference = np.asarray(
            Image.open(REFERENCE / f"{still.name}.png").convert("RGB")
        ).astype(np.int16)
        new = np.asarray(drawn[still.name]).astype(np.int16)
        if new.shape != reference.shape:
            rows[still.name] = {"error": f"size {new.shape} against {reference.shape}"}
            failed.append(still.name)
            continue
        wrong = np.abs(new - reference).max(axis=2) > THRESHOLD
        solid = eroded(wrong)
        wrong_area = round(int(wrong.sum()) / RATIO**2, 1)
        solid_area = round(int(solid.sum()) / RATIO**2, 1)
        rows[still.name] = {"wrong": wrong_area, "solid": solid_area}
        if solid_area > SOLID_LIMIT:
            failed.append(still.name)
            Image.fromarray((wrong * 255).astype(np.uint8)).save(
                OUT / f"{still.name}-wrong.png"
            )
        print(f"{still.name:20} wrong {wrong_area:8} solid {solid_area:8}")
    result = {
        "url": url,
        "solid limit": SOLID_LIMIT,
        "stills": rows,
        "failed": failed,
        "page errors": errors,
    }
    (EVIDENCE / "compare.json").write_text(json.dumps(result, indent=1) + "\n")
    print(f"failed: {failed or 'none'}; page errors: {errors or 'none'}")
    return 1 if failed or errors else 0


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("mode", choices=["make", "compare"])
    parser.add_argument("--url", help="compare: the page that gives window.watchProbe")
    arguments = parser.parse_args()
    if arguments.mode == "make":
        make()
        return
    if not arguments.url:
        parser.error("compare needs --url")
    sys.exit(compare(arguments.url))


if __name__ == "__main__":
    main()
