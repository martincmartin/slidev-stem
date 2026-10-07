#!/usr/bin/env python3
"""PNG stills of the WebGL watch, for the house's legibility checks.

    uv run art/watch_stills.py OUT_DIR       # in watches/; also `pnpm art:stills OUT_DIR`

The watch has no SVG, so stem/tools/barroom.py and motion.py cannot render it:
they take its stills as PNGs. This builds the probe page (webgl/probe/) with
Vite into a temporary directory, serves it, and draws in Chromium:

  cover.png     the cover: tilt 0, at the size the slide shows it
  motion-a.png  the escapement's first frame: time 0 (the balance at one end
  motion-b.png  of its swing) and one second on (the other end): the fork and
                the escape wheel have moved

Each is at DEVICE_SCALE (2) device px for each CSS px of the 980 x 552 slide.
It also writes pairs.json, a list of [first, second] file names, for
`motion.py --png-pair`. Then it runs the renderer's browser checks
(`window.webglChecks()`, webgl/probe/checks.ts: context loss, dispose, the
fade, the contract of each input) and fails if one fails. The tilted views are not here: the cover's numbers are
what the SVG's had (watches/docs/measurements.md).
"""

import argparse
import base64
import functools
import http.server
import json
import math
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

from playwright.sync_api import sync_playwright

TALK = pathlib.Path(__file__).resolve().parents[1]  # watches/
SLIDE = (980, 552)  # CSS px
DEVICE_SCALE = 2  # device px for each CSS px: stem/tools/barroom.py's
SIZE = (SLIDE[0] * DEVICE_SCALE, SLIDE[1] * DEVICE_SCALE)
AMPLITUDE, PERIOD = 150.0, 2.0  # the balance's swing (design.json's timing)
TIMEOUT = 120_000  # ms


@dataclass(frozen=True)
class Frame:
    """One still: a view at a tilt, at a mechanism time (s)."""

    view: str
    tilt: float
    time: float

    def options(self) -> dict[str, object]:
        return {
            "view": self.view,
            "tilt": self.tilt,
            "time": self.time,
            "swing": AMPLITUDE * math.cos(2 * math.pi * self.time / PERIOD),
            "size": list(SIZE),
        }


FRAMES = {
    "cover.png": Frame("cover", 0.0, 0.0),
    "motion-a.png": Frame("cover", 0.0, 0.0),
    "motion-b.png": Frame("cover", 0.0, PERIOD / 2),
}
PAIRS = [["motion-a.png", "motion-b.png"]]


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


def build_probe(directory: pathlib.Path) -> None:
    """Build the probe page with Vite into `directory`."""
    environment = {
        name: value for name, value in os.environ.items() if name != "VIRTUAL_ENV"
    }
    pnpm = shutil.which("pnpm") or "pnpm"
    result = subprocess.run(
        [
            pnpm,
            "exec",
            "vite",
            "build",
            "webgl/probe",
            "--outDir",
            str(directory),
            "--emptyOutDir",
            "--base",
            "./",
        ],
        cwd=TALK,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        sys.exit(f"vite build failed:\n{result.stdout}{result.stderr}")


def draw(out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="probe-") as built:
        build_probe(pathlib.Path(built))
        with served(pathlib.Path(built)) as base, sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(device_scale_factor=DEVICE_SCALE)
            page.set_default_timeout(TIMEOUT)
            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{base}/index.html")
            page.wait_for_function("window.watchProbeReady === true")
            for name, frame in FRAMES.items():
                page.evaluate(
                    "options => window.watchProbe.render(options)", frame.options()
                )
                url = str(page.evaluate("document.querySelector('canvas').toDataURL()"))
                (out / name).write_bytes(base64.b64decode(url.split(",", 1)[1]))
            checks = page.evaluate("window.webglChecks()")
            browser.close()
    if errors:
        sys.exit(f"the probe page failed: {errors}")
    failures = [
        f"  {check['name']}: {check['failure']}"
        for check in checks
        if check["failure"] is not None
    ]
    if failures:
        sys.exit("the renderer's checks failed:\n" + "\n".join(failures))
    (out / "pairs.json").write_text(json.dumps(PAIRS) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("out", help="the directory for the PNGs and pairs.json")
    arguments = parser.parse_args()
    draw(pathlib.Path(arguments.out))
    print(f"wrote {', '.join(FRAMES)} and pairs.json to {arguments.out}")
    print("the renderer's browser checks passed")


if __name__ == "__main__":
    main()
