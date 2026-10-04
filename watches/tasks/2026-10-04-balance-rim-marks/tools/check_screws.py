"""Compare the live watch with the selected frozen proposal in both browsers."""

from __future__ import annotations

import base64
import functools
import http.server
import io
import json
import math
import subprocess
import tempfile
import threading
from pathlib import Path
from typing import Any

import barroom
import lib
import numpy as np
from compare_rims import rim_mask, summarize
from PIL import Image, ImageChops
from playwright.sync_api import Page, sync_playwright

TASK = Path(__file__).resolve().parents[1]
TALK = TASK.parents[1]


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        pass


def canvas_image(page: Page, selector: str) -> Image.Image:
    encoded = page.evaluate(
        "selector => document.querySelector(selector).toDataURL().split(',')[1]",
        selector,
    )
    return Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")


def main() -> None:
    evidence = TASK / "evidence" / "installed-screws"
    evidence.mkdir(parents=True, exist_ok=True)
    design = json.loads((TALK / "watch" / "design.json").read_text())
    amplitude = design["timing"]["amplitude"]
    period = design["timing"]["period"]
    errors: list[str] = []
    outside: list[str] = []
    results: dict[str, object] = {}
    with tempfile.TemporaryDirectory(prefix="rim-installed-") as temporary:
        built = Path(temporary)
        subprocess.run(
            [
                "pnpm",
                "exec",
                "vite",
                "build",
                "webgl/probe",
                "--outDir",
                str(built),
                "--base",
                "./",
            ],
            cwd=TALK,
            check=True,
        )
        handler = functools.partial(QuietHandler, directory=str(built))
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
        threading.Thread(target=server.serve_forever, daemon=True).start()
        base = f"http://127.0.0.1:{server.server_address[1]}/"
        try:
            with sync_playwright() as playwright:
                for browser_type in (playwright.chromium, playwright.firefox):
                    browser = browser_type.launch()
                    context = browser.new_context(device_scale_factor=2)

                    def route_request(route: Any) -> None:
                        if route.request.url.startswith((base, "file:")):
                            route.continue_()
                        else:
                            outside.append(route.request.url)
                            route.abort()

                    context.route("**/*", route_request)
                    live = context.new_page()
                    approved = context.new_page()
                    for page in (live, approved):
                        page.on("pageerror", lambda error: errors.append(str(error)))
                    live.goto(base)
                    live.wait_for_function("window.watchProbeReady")
                    approved.goto((TASK / "screw-reference.html").as_uri())
                    approved.wait_for_function("window.rimReady")
                    approved.evaluate("window.rimStop()")
                    mismatches: list[str] = []
                    scores = {}
                    for view in ("cover", "slide3"):
                        cropped = []
                        for sample in range(61):
                            time = sample / 60
                            options = {
                                "view": "hairspring" if view == "slide3" else "cover",
                                "tilt": 20 if view == "slide3" else 0,
                                "time": time,
                                "swing": amplitude
                                * math.cos(2 * math.pi * time / period),
                                "size": [1960, 1104],
                            }
                            if view == "slide3":
                                options.update(
                                    only="balance wheel and hairspring", rest=0
                                )
                            live.evaluate(
                                "options => window.watchProbe.render(options)", options
                            )
                            metadata = approved.evaluate(
                                "([view,time]) => window.rimRender('screws-4',view,time,2)",
                                [view, time],
                            )
                            actual = canvas_image(live, "canvas")
                            centre_x, centre_y = metadata["centre"]
                            half = 78 if view == "cover" else 276
                            box = (
                                max(0, round((centre_x - half) * 2)),
                                max(0, round((centre_y - half) * 2)),
                                round((centre_x + half) * 2),
                                min(1104, round((centre_y + half) * 2)),
                            )
                            cropped.append(actual.crop(box))
                            expected = canvas_image(approved, "#stage")
                            if (
                                ImageChops.difference(actual, expected).getbbox()
                                is not None
                            ):
                                name = f"{browser_type.name}-{view}-{sample:02}"
                                mismatches.append(name)
                                actual.save(evidence / f"{name}-actual.png")
                                expected.save(evidence / f"{name}-expected.png")
                            if sample in (0, 30, 60):
                                actual.save(
                                    evidence
                                    / f"{browser_type.name}-{view}-{sample:02}.png"
                                )
                        crop_metadata = {
                            **metadata,
                            "centre": [
                                metadata["centre"][0] - box[0] / 2,
                                metadata["centre"][1] - box[1] / 2,
                            ],
                        }
                        mask = rim_mask(cropped[0].size, crop_metadata)
                        planes = [
                            barroom.luminance(
                                barroom.gauss(
                                    barroom.to_linear(frame),
                                    lib.DESIGN_VENUE.blur_sigma(2),
                                )
                            )
                            for frame in cropped
                        ]
                        areas = []
                        flare_areas = []
                        for first, second in zip(planes, planes[6:], strict=False):
                            areas.append(
                                float(
                                    np.count_nonzero(
                                        barroom.wcag(first, second)[mask] >= 3
                                    )
                                )
                                / 4
                            )
                            flare_areas.append(
                                float(
                                    np.count_nonzero(
                                        barroom.wcag(first + 0.05, second + 0.05)[mask]
                                        >= 3
                                    )
                                )
                                / 4
                            )
                        scores[view] = {
                            "area": summarize(areas),
                            "flare_area": summarize(flare_areas),
                        }
                    results[browser_type.name] = {
                        "compared_frames": 122,
                        "scores": scores,
                        "mismatches": mismatches,
                    }
                    browser.close()
                    print(
                        f"{browser_type.name}: 122 frames, {len(mismatches)} mismatches",
                        flush=True,
                    )
                    if mismatches:
                        raise RuntimeError(results)
        finally:
            server.shutdown()
    results["errors"] = errors
    results["outside_requests"] = outside
    (evidence / "pixel-check.json").write_text(json.dumps(results, indent=2) + "\n")
    if errors or outside:
        raise RuntimeError(results)


if __name__ == "__main__":
    main()
