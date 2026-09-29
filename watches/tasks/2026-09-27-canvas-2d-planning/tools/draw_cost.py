#!/usr/bin/env python3
"""How long does one frame of a tilting 3D view take to draw, with Canvas 2D
and with SVG?

    ../../../../.venv/bin/python3 draw_cost.py      # in tools/: about 1 minute

Exports the slab-ordered pieces of two scenes from depth_order.py (the whole
watch, 448 pieces; the balance and hairspring, 23 pieces) to
../out/draw_cost_scenes.json, serves the task directory, and loads
draw_cost/index.html in Playwright's Chromium and Firefox, headless, at a
device pixel ratio of 2 and a 980 x 552 slide. Each frame the tilt changes,
so every piece is projected and drawn again, as during a tilt animation:
- canvas: build a Path2D per piece, fill it, stroke its edges;
- svg: set the `d` of one <path> per piece (and one per piece's edges).
Writes ../evidence/draw_cost.json.

Headless browsers draw without the GPU that a visible window may use, so
the frame times are a first indication, not the verdict. The JS time
(projecting and issuing the drawing) is the more portable number.
"""

import functools
import http.server
import json
import pathlib
import threading

from depth_order import (
    STATIC_TIME,
    Face,
    OrderStats,
    Piece,
    Pose,
    Wall,
    build_solids,
    hairspring_scene,
)
from playwright.sync_api import sync_playwright
from watch_svg import read_shapes

TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parent
EVIDENCE = TASK / "evidence"
SCENES = TASK / "out" / "draw_cost_scenes.json"  # made by this tool; not committed
TIMEOUT = 120_000  # ms


def as_data(order: list[Piece]) -> list[dict[str, object]]:
    """The pieces as plain data, in drawing order."""
    rows: list[dict[str, object]] = []
    for piece in order:
        solid = piece.solid
        if isinstance(piece, Face):
            rows.append(
                {
                    "face": [
                        [round(float(value), 2) for value in ring.ravel()]
                        for ring in piece.rings
                    ],
                    "height": piece.height,
                    "fill": solid.fill,
                    "width": solid.stroke_width,
                }
            )
        elif isinstance(piece, Wall):
            rows.append(
                {
                    "xs": [round(float(value), 2) for value in piece.xs],
                    "ys": [round(float(value), 2) for value in piece.ys],
                    "bottom": piece.bottom,
                    "top": piece.top,
                    "strokeTop": piece.top == solid.top,
                    "corners": [] if piece.run is None else piece.run.inner_corners(),
                    "strokeBottom": piece.bottom == solid.bottom,
                    "fill": solid.fill,
                    "width": solid.stroke_width,
                }
            )
    return rows


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


def scene_data() -> dict[str, list[dict[str, object]]]:
    """The two scenes' pieces as plain data, in the slab order."""
    solids = build_solids(read_shapes())
    return {
        "whole watch": as_data(Pose(solids, STATIC_TIME).slab(OrderStats())),
        "balance and hairspring": as_data(
            Pose(hairspring_scene(solids, 8.0), STATIC_TIME).slab(OrderStats())
        ),
    }


def main() -> None:
    scenes = scene_data()
    SCENES.parent.mkdir(exist_ok=True)
    SCENES.write_text(json.dumps(scenes))
    handler = functools.partial(QuietHandler, directory=str(TASK))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    url = f"http://127.0.0.1:{server.server_address[1]}/tools/draw_cost/index.html"
    results: dict[str, object] = {}
    try:
        with sync_playwright() as playwright:
            for browser_type in (playwright.chromium, playwright.firefox):
                browser = browser_type.launch()
                page = browser.new_page(
                    device_scale_factor=2, viewport={"width": 1000, "height": 600}
                )
                page.set_default_timeout(TIMEOUT)
                page.goto(url)
                page.wait_for_function("window.ready === true")
                runs = {}
                for scene in scenes:
                    for renderer in ("canvas", "svg"):
                        runs[f"{scene}, {renderer}"] = page.evaluate(
                            "([scene, renderer]) => measure(scene, renderer, 4)",
                            [scene, renderer],
                        )
                        print(
                            browser_type.name,
                            scene,
                            renderer,
                            runs[f"{scene}, {renderer}"],
                        )
                results[browser_type.name] = {"version": browser.version, "runs": runs}
                page.close()
                browser.close()
    finally:
        server.shutdown()
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "draw_cost.json").write_text(json.dumps(results, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'draw_cost.json'}")


if __name__ == "__main__":
    main()
