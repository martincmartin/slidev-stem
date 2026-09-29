#!/usr/bin/env python3
"""The renderer against its references: the check to run after any change
to renderer.js, cover_model.py or scene_export.py.

    uv run --project ../../.. python scene_export.py     # in tools/, first
    uv run --project ../../.. python pixel_check.py

Draws each "slab" and "parity" still of scene_export.py with webgl/index.html
in Playwright's Chromium (GPU through Metal) and Firefox, at a device pixel
ratio of 2, and compares it with its reference, as the method comparison did
(method_comparison/webgl_probe.py): a pixel is wrong if a colour channel
differs by more than THRESHOLD levels; the solid error is the wrong pixels
that survive a 3 x 3 erosion. Areas in CSS px^2.

It also compares with the comparison's column for the same method
("centre line 2x2", ../evidence/webgl_probe.json). Writes
../evidence/pixel_check.json.
"""

import functools
import http.server
import io
import json
import pathlib
import threading
from collections.abc import Iterator
from contextlib import contextmanager

import numpy as np
from PIL import Image
from playwright.sync_api import Browser, Page, sync_playwright

TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parent
OUT = TASK / "out"
EVIDENCE = TASK / "evidence"
FROZEN_SVG = TASK / "inputs" / "skeleton-watch.svg"
RATIO = 2
SLIDE = (980, 552)
THRESHOLD = 96  # levels of 255, in any channel
TIMEOUT = 120_000  # ms
CHROMIUM_GPU = ["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
COMPARED = "centre line 2x2"
SEEK = """time => {
  const svg = document.querySelector("svg");
  svg.pauseAnimations();
  svg.setCurrentTime(time);
}"""


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


def eroded(mask: np.ndarray) -> np.ndarray:
    """The pixels whose 3 x 3 neighbourhood is all in `mask`."""
    padded = np.pad(mask, 1)
    height, width = mask.shape
    result = np.ones_like(mask)
    for dy in range(3):
        for dx in range(3):
            result &= padded[dy : dy + height, dx : dx + width]
    return result


def references(
    browser: Browser, stills: list[dict[str, object]]
) -> dict[str, np.ndarray]:
    page = new_page(browser)
    result = {}
    drawing = FROZEN_SVG.read_text()
    for still in stills:
        name = str(still["name"])
        if still["kind"] == "slab":
            svg = (OUT / "reference" / f"{name}.svg").read_text()
            page.set_content(f'<body style="margin:0">{svg}</body>')
        else:
            page.set_content(f'<body style="margin:0">{drawing}</body>')
            page.evaluate(SEEK, still["time"])
            page.wait_for_timeout(100)
        result[name] = pixels(page.locator("svg").screenshot())
    page.close()
    return result


def check(
    browser: Browser,
    base: str,
    stills: list[dict[str, object]],
    truth: dict[str, np.ndarray],
) -> dict[str, object]:
    page = new_page(browser)
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{base}/tools/webgl/index.html?probe")
    page.wait_for_function("window.spikeReady === true")
    rows = {}
    for still in stills:
        name = str(still["name"])
        options = {
            "view": still["view"],
            "tilt": still["tilt"],
            "time": still["time"],
            "clips": still["clips"],
            "slabOnly": still["kind"] == "slab",
            "drawingOnly": True,  # not the stud, which the 2D drawing lacks
            "size": [SLIDE[0] * RATIO, SLIDE[1] * RATIO],
        }
        page.evaluate("options => spike.render(options)", options)
        drawn = pixels(page.locator("canvas").screenshot())
        wrong = np.asarray(np.abs(drawn - truth[name]).max(axis=2) > THRESHOLD)
        rows[name] = {
            "wrong": round(int(wrong.sum()) / RATIO**2, 1),
            "solid": round(int(eroded(wrong).sum()) / RATIO**2, 1),
        }
    info = page.evaluate("spike.info()")
    page.close()
    return {"renderer": info, "stills": rows, "page errors": errors}


def main() -> None:
    scene = json.loads((OUT / "scene.json").read_text())
    stills = [
        still
        for still in scene["stills"]
        if still["kind"] in ("slab", "parity") and still["lineWidth"] is None
    ]
    comparison = json.loads((EVIDENCE / "webgl_probe.json").read_text())
    result: dict[str, object] = {"threshold": THRESHOLD, "device pixel ratio": RATIO}
    with served() as base, sync_playwright() as playwright:
        chromium = playwright.chromium.launch()
        truth = references(chromium, stills)
        chromium.close()
        for name in ("chromium", "firefox"):
            browser = getattr(playwright, name).launch(
                args=CHROMIUM_GPU if name == "chromium" else []
            )
            run = check(browser, base, stills, truth)
            browser.close()
            before = {
                row["still"]: row[COMPARED]
                for row in comparison[name]["stills"]
                if COMPARED in row
            }
            rows = run["stills"]
            assert isinstance(rows, dict)
            changed = {
                still: {"now": area, "method comparison": before.get(still)}
                for still, area in rows.items()
                if area != before.get(still)
            }
            run["worst solid"] = max(area["solid"] for area in rows.values())
            run["stills that differ from the method comparison"] = changed
            result[name] = run
            print(
                name,
                "worst solid",
                run["worst solid"],
                "differ:",
                len(changed),
                run["page errors"],
            )
    (EVIDENCE / "pixel_check.json").write_text(json.dumps(result, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'pixel_check.json'}")


if __name__ == "__main__":
    main()
