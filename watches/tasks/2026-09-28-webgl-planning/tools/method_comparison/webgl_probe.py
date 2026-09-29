#!/usr/bin/env python3
"""Draw the cover with the WebGL spike, compare it with its references, and
time it.

    uv run --project ../../.. python scene_export.py     # in tools/, first
    uv run --project ../../.. python webgl_probe.py

Needs ../out/scene.json and ../out/reference/ from scene_export.py. Serves
the task directory and loads webgl/index.html in Playwright's Chromium and
Firefox at a device pixel ratio of 2 (the 980 x 552 slide is 1960 x 1104
device px, about the 1080p projector).

1. STILLS. For each still of scene_export.py and each hidden-line method
   (and bias), it screenshots the canvas and compares it with the still's
   reference, drawn by Chromium at the same size: for a "slab" still, the
   slab-order SVG (the solids and decals of the slab order only, no clips);
   for a "parity" still, the real 2D drawing, paused at the same time. A
   "show" still is drawn with the proposed method and kept as a picture. A pixel is WRONG if one of its
   colour channels differs by more than THRESHOLD levels: a line where the
   reference has none, or none where it has one. Antialiased edges that
   differ by a fraction of a pixel stay under it. Areas are in CSS px^2
   (4 device px each). "Solid" counts only the wrong pixels that survive a
   3 x 3 erosion: a missing or extra line (4-8 device px wide) survives it,
   and the scattered specks where two antialiasers place an edge half a
   pixel apart do not.
2. TIMING. It tilts the whole cover from 0 to 89 degrees and back while the
   mechanism runs, for SECONDS, and records the JS time per frame, the time
   with gl.finish() (which waits for the GPU), and the gaps between frames.

Writes ../evidence/webgl_probe.json, and PNGs of chosen stills and of their
wrong pixels to ../out/pictures/ (Chromium's only: Firefox's areas are the
same). figures.py crops some of them into ../evidence/figures/.
"""

import functools
import http.server
import io
import json
import pathlib
import statistics
import threading
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass

import numpy as np
from PIL import Image
from playwright.sync_api import Browser, Page, Playwright, sync_playwright

TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parents[1]
OUT = TASK / "out"
EVIDENCE = TASK / "evidence"
PICTURES = OUT / "pictures"  # about 19 MB: not committed; figures.py crops some
RATIO = 2
SLIDE = (980, 552)
THRESHOLD = 96  # levels of 255, in any channel
SECONDS = 6.0
TIMEOUT = 120_000  # ms
# Chromium's headless default is SwiftShader, a CPU renderer. These flags ask
# for the GPU through ANGLE's Metal back end, as a visible Chrome on a Mac uses.
CHROMIUM_GPU = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]


@dataclass(frozen=True)
class Method:
    """A hidden-line method of renderer.js, with its bias in slide px of depth."""

    label: str
    code: int
    bias: float = 0.0


METHODS = (
    Method("centre line", 2),
    Method("centre line 2x2", 3),
    Method("bias 0.25 px", 0, 0.25),
    Method("bias 1 px", 0, 1.0),
    Method("bias 4 px", 0, 4.0),
    Method("slope-scaled offset", 1),
)
PROPOSED = METHODS[1]
SAVED = {  # slab stills whose pictures are kept, with every method
    "slab-cover-tilt-5-time-0.37-lines-own",
    "slab-cover-tilt-15-time-0.37-lines-own",
    "slab-hairspring-tilt-5-time-0.37-lines-own",
    "slab-hairspring-tilt-89-time-0.37-lines-own",
    "slab-cover-tilt-45-time-0.37-lines-own",
    "slab-cover-tilt-75-time-0.37-lines-own",
    "slab-hairspring-tilt-60-time-0.37-lines-own",
    "slab-cover-tilt-45-time-0.6-lines-own",
    "slab-cover-tilt-0-time-0.37-lines-own",
}
FROZEN_SVG = TASK / "inputs" / "skeleton-watch.svg"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


@contextmanager
def served() -> Iterator[str]:
    handler = functools.partial(QuietHandler, directory=str(TASK))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()


def new_page(browser: Browser) -> Page:
    page = browser.new_page(
        viewport={"width": SLIDE[0], "height": SLIDE[1]}, device_scale_factor=RATIO
    )
    page.set_default_timeout(TIMEOUT)
    return page


def pixels(png: bytes) -> np.ndarray:
    return np.asarray(Image.open(io.BytesIO(png)).convert("RGB")).astype(np.int16)


SEEK = """time => {
  const svg = document.querySelector("svg");
  svg.pauseAnimations();
  svg.setCurrentTime(time);
}"""


def references(
    browser: Browser, stills: list[dict[str, object]]
) -> dict[str, np.ndarray]:
    """Each compared still's reference picture, by name."""
    page = new_page(browser)
    result = {}
    drawing = FROZEN_SVG.read_text()
    for still in stills:
        name = str(still["name"])
        if still["kind"] == "slab":
            page.set_content(
                f'<body style="margin:0">{(OUT / "reference" / f"{name}.svg").read_text()}</body>'
            )
        elif still["kind"] == "parity":
            page.set_content(f'<body style="margin:0">{drawing}</body>')
            page.evaluate(SEEK, still["time"])
            page.wait_for_timeout(100)
        else:
            continue
        result[name] = pixels(page.locator("svg").screenshot())
    page.close()
    return result


def wrong_mask(drawn: np.ndarray, reference: np.ndarray) -> np.ndarray:
    return np.asarray(np.abs(drawn - reference).max(axis=2) > THRESHOLD)


def eroded(mask: np.ndarray) -> np.ndarray:
    """The pixels whose 3 x 3 neighbourhood is all in `mask`."""
    padded = np.pad(mask, 1)
    height, width = mask.shape
    result = np.ones_like(mask)
    for dy in range(3):
        for dx in range(3):
            result &= padded[dy : dy + height, dx : dx + width]
    return result


def save_pair(name: str, drawn: np.ndarray, wrong: np.ndarray) -> None:
    PICTURES.mkdir(parents=True, exist_ok=True)
    Image.fromarray(drawn.astype(np.uint8)).save(PICTURES / f"{name}.png")
    shown = drawn.astype(np.float64) * 0.35 + 255 * 0.65
    shown[wrong] = (220, 30, 30)
    Image.fromarray(shown.astype(np.uint8)).save(PICTURES / f"{name}-wrong.png")


def slug(text: str) -> str:
    return text.replace(" ", "-").replace(".", "_")


def compare_stills(
    page: Page,
    browser_name: str,
    stills: list[dict[str, object]],
    truth: dict[str, np.ndarray],
) -> list[dict[str, object]]:
    rows = []
    for still in stills:
        name = str(still["name"])
        keep = browser_name == "chromium" and (name in SAVED or still["kind"] != "slab")
        if keep and name in truth:
            Image.fromarray(truth[name].astype(np.uint8)).save(
                PICTURES / f"{name}-reference.png"
            )
        row: dict[str, object] = {"still": name, "kind": still["kind"]}
        for method in METHODS if name in truth else (PROPOSED,):
            options = {
                "view": still["view"],
                "tilt": still["tilt"],
                "time": still["time"],
                "lineWidth": still["lineWidth"],
                "clips": still["clips"],
                "slabOnly": still["kind"] == "slab",
                "method": method.code,
                "bias": method.bias,
                "pixelRatio": RATIO,
            }
            page.evaluate("options => spike.render(options)", options)
            drawn = pixels(page.locator("canvas").screenshot())
            if name not in truth:
                if keep:
                    Image.fromarray(drawn.astype(np.uint8)).save(
                        PICTURES / f"{name}.png"
                    )
                continue
            wrong = wrong_mask(drawn, truth[name])
            row[method.label] = {
                "wrong": round(int(wrong.sum()) / RATIO**2, 1),
                "solid": round(int(eroded(wrong).sum()) / RATIO**2, 1),
            }
            if keep:
                save_pair(f"{browser_name}-{name}-{slug(method.label)}", drawn, wrong)
        rows.append(row)
        print(browser_name, row)
    return rows


def method_summary(rows: list[dict[str, object]], kind: str) -> dict[str, object]:
    """Per method and line width: the worst and median areas over the
    stills of `kind`, and how many stills have no solid error."""
    result: dict[str, object] = {}
    for width in ("own", "1px"):
        chosen = [
            row
            for row in rows
            if row["kind"] == kind and f"lines-{width}" in str(row["still"])
        ]
        if not chosen:
            continue
        for method in METHODS:
            areas = [row[method.label] for row in chosen]
            solid = [float(area["solid"]) for area in areas]  # type: ignore[index]
            wrong = [float(area["wrong"]) for area in areas]  # type: ignore[index]
            result[f"{method.label}, lines {width}"] = {
                "stills": len(chosen),
                "stills with no solid error": sum(1 for area in solid if area == 0),
                "worst solid": max(solid),
                "median solid": statistics.median(solid),
                "worst wrong": max(wrong),
                "median wrong": statistics.median(wrong),
            }
    return result


def summary(intervals: list[float], draw_times: list[float]) -> dict[str, object]:
    ordered = sorted(draw_times)
    return {
        "frames": len(draw_times),
        "median ms": round(statistics.median(draw_times), 2),
        "95th percentile ms": round(ordered[int(0.95 * (len(ordered) - 1))], 2),
        "worst ms": round(max(draw_times), 2),
        "median interval ms": round(statistics.median(intervals), 2),
        "gaps over 25 ms": sum(1 for interval in intervals if interval > 25),
        "largest gap ms": round(max(intervals), 1),
    }


def timing(page: Page) -> dict[str, object]:
    result: dict[str, object] = {}
    for view in ("cover", "hairspring"):
        for finish in (False, True):
            run = page.evaluate(
                "args => spike.timeFrames(args)",
                {"seconds": SECONDS, "view": view, "method": 3, "finish": finish},
            )
            label = f"{view}, {'with gl.finish()' if finish else 'JS only'}"
            result[label] = summary(run["intervals"], run["drawTimes"])
            print(label, result[label])
    return result


def run_browser(
    playwright: Playwright,
    browser_name: str,
    base: str,
    stills: list[dict[str, object]],
    truth: dict[str, np.ndarray],
) -> dict[str, object]:
    launcher = getattr(playwright, browser_name)
    browser = launcher.launch(args=CHROMIUM_GPU if browser_name == "chromium" else [])
    page = new_page(browser)
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{base}/tools/method_comparison/webgl/index.html?probe")
    page.wait_for_function("window.spikeReady === true")
    info = page.evaluate("spike.info()")
    print(browser_name, info)
    rows = compare_stills(page, browser_name, stills, truth)
    result = {
        "version": browser.version,
        "renderer": info,
        "summary of the slab stills": method_summary(rows, "slab"),
        "summary of the parity stills": method_summary(rows, "parity"),
        "stills": rows,
        "timing": timing(page),
        "page errors": errors,
    }
    browser.close()
    return result


def main() -> None:
    scene = json.loads((OUT / "scene.json").read_text())
    stills = scene["stills"]
    PICTURES.mkdir(parents=True, exist_ok=True)
    result: dict[str, object] = {
        "threshold": THRESHOLD,
        "device pixel ratio": RATIO,
        "methods": [method.__dict__ for method in METHODS],
    }
    with served() as base, sync_playwright() as playwright:
        chromium = playwright.chromium.launch()
        truth = references(chromium, stills)
        chromium.close()
        drawn_area = {
            name: round(
                int((np.abs(picture - picture[0, 0]).max(axis=2) > THRESHOLD).sum())
                / RATIO**2,
                1,
            )
            for name, picture in truth.items()
        }
        result["drawing area of each reference, CSS px^2"] = drawn_area
        for browser_name in ("chromium", "firefox"):
            result[browser_name] = run_browser(
                playwright, browser_name, base, stills, truth
            )
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "webgl_probe.json").write_text(json.dumps(result, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'webgl_probe.json'}")


if __name__ == "__main__":
    main()
