#!/usr/bin/env python3
"""The fade of the rest of the watch: its pictures, and what it costs the GPU.

    uv run tools/fade_check.py TALK --piece hairspring --piece collet \
        --piece stud --view cover:0 --view hairspring:20       # in stem/

TALK is the talk's directory. The talk must have a probe page, `webgl/probe/`
(docs/webgl.md), which Vite serves from the talk: it sets
`window.watchProbeReady`, and gives `window.watchProbe.render(options)` (one
frame, into the page's only canvas, with `preserveDrawingBuffer`) and
`window.watchProbe.info()`. The options are `view`, `tilt`, `time`, `swing`,
`size`, and for a fade `only` (the names of the pieces that stay) and `rest`
(the opacity of the rest). `--view` is `name:tilt`, as often as needed. Runs in Chromium (GPU
through Metal) and Firefox, at the laptop's full-screen size (3456 x 1954 px).

THE PICTURES. A fade must not jump at its ends, and in between it must be the
two pictures mixed:
- "rest 1 against no fade": 0 levels;
- "rest 0.002 against 0", "rest 0.998 against 1": at most 1 level of 255;
- "rest 0.5 against the mean of 0 and 1": at most 1 level.

THE COST. The median time of DRAWS frames with gl.finish(), with no fade and
in the middle of a fade. A frame at 120 Hz has 8.33 ms.

Writes fade_check.json and pictures to `--out` (default TALK/out/fade-check).
"""

import argparse
import base64
import contextlib
import io
import json
import os
import pathlib
import signal
import statistics
import subprocess
import time
import urllib.request
from collections.abc import Iterator
from dataclasses import dataclass

import numpy as np
from PIL import Image
from playwright.sync_api import Browser, Page, sync_playwright

CHROMIUM_GPU = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
SLIDE = (980, 552)  # CSS px
RATIO = 2
SCALE = 1728 / 980  # the laptop's full-screen slide, in slide px per CSS px
SIZE = [round(SLIDE[0] * SCALE * RATIO), round(SLIDE[1] * SCALE * RATIO)]
TIME = 0.37  # s
DRAWS = 60
TIMING = """({ options, draws }) => {
  const times = [];
  for (let index = 0; index < draws; index++) {
    const before = performance.now();
    window.watchProbe.render(options);
    times.push(performance.now() - before);
  }
  return times;
}"""


@dataclass(frozen=True)
class Fade:
    """What to check."""

    talk: pathlib.Path
    pieces: list[str]
    views: list[tuple[str, float]]
    port: int
    out: pathlib.Path


@contextlib.contextmanager
def probe_server(fade: Fade) -> Iterator[str]:
    fade.out.mkdir(parents=True, exist_ok=True)
    log = (fade.out / "vite.log").open("w")
    process = subprocess.Popen(
        [
            "pnpm",
            "exec",
            "vite",
            "webgl/probe",
            "--port",
            str(fade.port),
            "--strictPort",
        ],
        cwd=fade.talk,
        stdout=log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    base = f"http://localhost:{fade.port}"
    try:
        for _ in range(60):
            with (
                contextlib.suppress(OSError),
                urllib.request.urlopen(base, timeout=2) as response,
            ):
                if response.status == 200:
                    break
            time.sleep(1)
        else:
            raise RuntimeError("Vite did not start: see vite.log in --out")
        yield base
    finally:
        os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=30)
        log.close()


def picture(
    fade: Fade, page: Page, view: str, tilt: float, rest: float | None
) -> np.ndarray:
    options: dict[str, object] = {
        "view": view,
        "tilt": tilt,
        "time": TIME,
        "swing": 150 * float(np.cos(np.pi * TIME)),
        "size": SIZE,
    }
    if rest is not None:
        options |= {"only": fade.pieces, "rest": rest}
    page.evaluate("options => window.watchProbe.render(options)", options)
    # The drawing buffer itself (the probe preserves it), not a screenshot.
    url = page.evaluate("document.querySelector('canvas').toDataURL('image/png')")
    png = base64.b64decode(url.split(",", 1)[1])
    return np.asarray(Image.open(io.BytesIO(png)).convert("RGB")).astype(np.int16)


def largest(first: np.ndarray, second: np.ndarray) -> int:
    return int(np.abs(first - second).max())


def check(fade: Fade, browser: Browser, base: str, name: str) -> dict[str, object]:
    page = browser.new_page(device_scale_factor=RATIO)
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(base)
    page.wait_for_function("window.watchProbeReady === true")
    views = {}
    for view, tilt in fade.views:
        plain = picture(fade, page, view, tilt, None)
        ends = {
            rest: picture(fade, page, view, tilt, rest)
            for rest in (0.0, 0.002, 0.5, 0.998, 1.0)
        }
        mean = (ends[0.0] + ends[1.0]) / 2
        timings = {}
        for label, rest in (("no fade", None), ("middle of a fade", 0.5)):
            options: dict[str, object] = {
                "view": view,
                "tilt": tilt,
                "time": TIME,
                "size": SIZE,
            }
            if rest is not None:
                options |= {"only": fade.pieces, "rest": rest}
            page.evaluate(TIMING, {"options": options, "draws": 5})  # warm up
            times = page.evaluate(TIMING, {"options": options, "draws": DRAWS})
            timings[label] = {
                "median ms": round(statistics.median(times), 2),
                "largest ms": round(max(times), 2),
            }
        for rest in (0.0, 0.5, 1.0):
            Image.fromarray(ends[rest].astype(np.uint8)).save(
                fade.out / f"{name}-{view}-rest-{rest:g}.png"
            )
        views[f"{view} at {tilt:g}"] = {
            "rest 1 against no fade, levels": largest(ends[1.0], plain),
            "rest 0.002 against 0, levels": largest(ends[0.002], ends[0.0]),
            "rest 0.998 against 1, levels": largest(ends[0.998], ends[1.0]),
            "rest 0.5 against the mean of 0 and 1, levels": round(
                float(np.abs(ends[0.5] - mean).max()), 1
            ),
            "frame time with gl.finish": timings,
        }
    info = page.evaluate("window.watchProbe.info()")
    page.close()
    return {
        "version": browser.version,
        "renderer": info,
        "views": views,
        "page errors": errors,
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("talk", type=pathlib.Path)
    parser.add_argument(
        "--piece", action="append", required=True, help="a piece that stays"
    )
    parser.add_argument(
        "--view", action="append", required=True, help="name:tilt in degrees"
    )
    parser.add_argument("--port", type=int, default=3150)
    parser.add_argument("--out", type=pathlib.Path, default=None)
    arguments = parser.parse_args()
    talk = arguments.talk.resolve()
    views = []
    for text in arguments.view:
        name, _, tilt = text.partition(":")
        views.append((name, float(tilt or 0)))
    fade = Fade(
        talk=talk,
        pieces=arguments.piece,
        views=views,
        port=arguments.port,
        out=(arguments.out or talk / "out" / "fade-check").resolve(),
    )
    result: dict[str, object] = {"size px": SIZE, "draws": DRAWS}
    with probe_server(fade) as base, sync_playwright() as playwright:
        for name in ("chromium", "firefox"):
            browser = getattr(playwright, name).launch(
                args=CHROMIUM_GPU if name == "chromium" else []
            )
            result[name] = check(fade, browser, base, name)
            browser.close()
            print(name, json.dumps(result[name], indent=1))
    path = fade.out / "fade_check.json"
    path.write_text(json.dumps(result, indent=1) + "\n")
    print(f"wrote {path}")


if __name__ == "__main__":
    main()
