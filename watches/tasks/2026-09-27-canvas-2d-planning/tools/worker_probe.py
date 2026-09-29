#!/usr/bin/env python3
"""Does Canvas 2D in a worker (OffscreenCanvas) work, match the main thread,
and keep drawing while the main thread is busy?

    ../../../../.venv/bin/python3 worker_probe.py      # in tools/: about 30 s

Serves worker_probe/ over HTTP on 127.0.0.1 (a worker cannot load from
file://), and drives it in Playwright's Chromium and Firefox, headless, at a
device pixel ratio of 2. Writes ../evidence/worker_probe.json and the two
canvases of each browser as ../out/worker-<browser>-<main|offscreen>.png.

Headless frame times show what blocks what; they do not show how smooth a
visible window would be.
"""

import functools
import http.server
import io
import json
import pathlib
import re
import threading
from xml.etree import ElementTree

import numpy as np
from PIL import Image
from playwright.sync_api import sync_playwright

TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parent
SITE = TOOLS / "worker_probe"
EVIDENCE = TASK / "evidence"
OUT = TASK / "out"
FROZEN_SVG = TASK / "inputs" / "skeleton-watch.svg"
SVG = "{http://www.w3.org/2000/svg}"
TIMEOUT = 60_000  # ms
DRAW_TIME = 1.234  # s: when both canvases are drawn for the comparison


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


def scene() -> dict[str, object]:
    """Four shapes of the watch as plain data: path strings, paints, where
    each turns about, and how fast it turns."""
    drawing = ElementTree.parse(FROZEN_SVG).getroot().find(SVG + "g")
    if drawing is None:
        raise ValueError("no drawing group")
    children = list(drawing)
    shapes = []
    for top_level, turns in ((9, -0.05), (14, 0.2), (15, 0.0), (17, 0.02)):
        group = children[top_level]
        translate = next(
            element.get("transform", "")
            for element in group.iter()
            if element.get("transform", "").startswith("translate")
        )
        match = re.fullmatch(r"translate\(([-\d.]+) ([-\d.]+)\)", translate)
        if match is None:
            raise ValueError(translate)
        path = next(group.iter(SVG + "path"))
        shapes.append(
            {
                "d": path.get("d"),
                "fill": None
                if path.get("fill") in (None, "none")
                else path.get("fill"),
                "fillRule": path.get("fill-rule", "nonzero"),
                "stroke": path.get("stroke") or "#143C6B",
                "strokeWidth": float(path.get("stroke-width", "2")),
                "x": 798 + float(match.group(1)) - 560,
                "y": 276 + float(match.group(2)) - 30,
                "turnsPerSecond": turns,
                "clipHole": {"x": 30.0, "y": 10.0, "radius": 12.0}
                if top_level == 9
                else None,
            }
        )
    return {"width": 490, "height": 276, "shapes": shapes}


def spring_numbers() -> list[float]:
    """Every number of the hairspring's path: M and 13 C commands."""
    drawing = ElementTree.parse(FROZEN_SVG).getroot().find(SVG + "g")
    if drawing is None:
        raise ValueError("no drawing group")
    text = next(list(drawing)[15].iter(SVG + "path")).get("d", "")
    return [float(value) for value in re.findall(r"-?\d+\.?\d*", text)]


def pixels(png: bytes) -> np.typing.NDArray[np.int16]:
    return np.asarray(Image.open(io.BytesIO(png)).convert("RGB"), dtype=np.int16)


def main() -> None:
    OUT.mkdir(exist_ok=True)
    handler = functools.partial(QuietHandler, directory=str(SITE))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_address[1]}/index.html"
    results: dict[str, object] = {}
    try:
        with sync_playwright() as playwright:
            for browser_type in (playwright.chromium, playwright.firefox):
                browser = browser_type.launch()
                page = browser.new_page(
                    device_scale_factor=2, viewport={"width": 1000, "height": 700}
                )
                page.set_default_timeout(TIMEOUT)
                errors: list[str] = []

                def record(error: object, into: list[str] = errors) -> None:
                    into.append(str(error))

                page.on("pageerror", record)
                page.goto(url)
                page.wait_for_function("window.ready === true")
                result = page.evaluate(
                    "([scene, time]) => setUp(scene, time)", [scene(), DRAW_TIME]
                )
                page.wait_for_timeout(300)  # let the worker's frame reach the screen
                images = {}
                for name in ("main", "offscreen"):
                    png = page.locator(f"#{name}").screenshot()
                    (OUT / f"worker-{browser_type.name}-{name}.png").write_bytes(png)
                    images[name] = pixels(png)
                difference = np.abs(images["main"] - images["offscreen"]).max(axis=2)
                result["pixels"] = {
                    "size": list(images["main"].shape[:2]),
                    "largest channel difference": int(difference.max()),
                    "pixels differing by more than 2 levels": int(
                        (difference > 2).sum()
                    ),
                }
                result["blocking"] = page.evaluate("blockingTest(4, 400, 100)")
                result["path2dCost"] = page.evaluate(
                    "numbers => pathCosts(numbers)", spring_numbers()
                )
                result["version"] = browser.version
                result["pageErrors"] = errors
                results[browser_type.name] = result
                print(browser_type.name, json.dumps(result, indent=1))
                page.close()
                browser.close()
    finally:
        server.shutdown()
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "worker_probe.json").write_text(json.dumps(results, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'worker_probe.json'}")


if __name__ == "__main__":
    main()
