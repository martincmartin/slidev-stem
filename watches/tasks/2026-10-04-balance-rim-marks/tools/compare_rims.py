"""Capture the frozen comparison. Run with uv from watches/."""

from __future__ import annotations

import argparse
import base64
import functools
import http.server
import io
import json
import math
import re
import subprocess
import threading
from pathlib import Path
from typing import Any

import barroom
import lib
import numpy as np
from PIL import Image, ImageDraw
from playwright.sync_api import sync_playwright

TASK = Path(__file__).resolve().parents[1]
TALK = TASK.parents[1]
VARIANTS = ("plain", "screws-4", "screws-6", "screws-8", "weights-4", "weights-6")


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        pass


def rim_mask(size: tuple[int, int], metadata: dict[str, Any]) -> np.ndarray:
    """Mask the projected annulus. Exclude the arm-to-rim joins and spring."""
    rows, columns = np.indices((size[1], size[0]))
    centre_x, centre_y = metadata["centre"]
    scale = metadata["scale"]
    x = (columns / 2 - centre_x) / scale
    y = (rows / 2 - centre_y) / (scale * math.cos(math.radians(metadata["tilt"])))
    distance = np.hypot(x, y)
    # The inner radius excludes the 48-unit opening edge and its 2.5 px line.
    # The outside margin includes the marks, side walls, and antialiasing.
    return (distance >= 51) & (distance <= 66)


def summarize(values: list[float]) -> dict[str, float]:
    return {"mean": float(np.mean(values)), "min": min(values), "max": max(values)}


def bundle_page() -> None:
    """Embed the built JavaScript so the comparison can open as a local file."""
    site = TASK / "site"
    source = (site / "index.html").read_text()

    def embed(match: re.Match[str]) -> str:
        script = (site / match.group(1)).read_text().replace("</script", "<\\/script")
        return '<script type="module">' + script + "</script>"

    bundled = re.sub(r'<script[^>]+src="([^"]+)"[^>]*></script>', embed, source)
    (TASK / "comparison.html").write_text(bundled)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--variants", nargs="+", choices=VARIANTS, default=VARIANTS)
    selected = parser.parse_args().variants
    subprocess.run(
        [
            "pnpm",
            "exec",
            "vite",
            "build",
            str(TASK / "prototype"),
            "--outDir",
            str(TASK / "site"),
            "--base",
            "./",
        ],
        cwd=TALK,
        check=True,
    )
    bundle_page()
    evidence = TASK / "evidence"
    handler = functools.partial(QuietHandler, directory=str(TASK / "site"))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    errors: list[str] = []
    outside: list[str] = []
    measurements: dict[str, Any] = {
        "sampling": {
            "fps": 60,
            "duration_s": 1,
            "separation_s": 0.1,
            "pairs": 55,
            "device_scale": 2,
            "venue": lib.DESIGN_VENUE.label,
            "flare": 0,
        },
        "browsers": {},
    }
    if (evidence / "measurements.json").exists():
        measurements = json.loads((evidence / "measurements.json").read_text())
    try:
        with sync_playwright() as playwright:
            for browser_type in (playwright.chromium, playwright.firefox):
                browser = browser_type.launch()
                page = browser.new_page(
                    viewport={"width": 980, "height": 680}, device_scale_factor=2
                )
                page.on("pageerror", lambda error: errors.append(str(error)))

                def route_request(route: Any) -> None:
                    if route.request.url.startswith(
                        f"http://127.0.0.1:{server.server_address[1]}/"
                    ):
                        route.continue_()
                    else:
                        outside.append(route.request.url)
                        route.abort()

                page.route("**/*", route_request)
                page.goto(f"http://127.0.0.1:{server.server_address[1]}/")
                page.wait_for_function("window.rimReady")
                page.evaluate("window.rimStop()")
                browser_results: dict[str, Any] = measurements["browsers"].get(
                    browser_type.name, {}
                )
                for name in selected:
                    for view in ("cover", "slide3"):
                        frames: list[Image.Image] = []
                        cropped: list[Image.Image] = []
                        metadata: dict[str, Any] = {}
                        output = evidence / browser_type.name / name / view
                        output.mkdir(parents=True, exist_ok=True)
                        for sample in range(61):
                            metadata = page.evaluate(
                                "([name,view,time]) => window.rimRender(name,view,time)",
                                [name, view, sample / 60],
                            )
                            encoded = page.evaluate(
                                'document.querySelector("#stage").toDataURL("image/png").split(",")[1]'
                            )
                            frame = Image.open(
                                io.BytesIO(base64.b64decode(encoded))
                            ).convert("RGB")
                            frames.append(frame)
                            centre_x, centre_y = metadata["centre"]
                            half = 78 if view == "cover" else 276
                            box = (
                                max(0, round((centre_x - half) * 2)),
                                max(0, round((centre_y - half) * 2)),
                                round((centre_x + half) * 2),
                                min(1104, round((centre_y + half) * 2)),
                            )
                            crop = frame.crop(box)
                            cropped.append(crop)
                            if browser_type.name == "chromium":
                                crop.save(output / f"frame-{sample:02}.png")
                                if sample in (0, 30, 60):
                                    frame.save(output / f"full-{sample:02}.png")
                        crop_metadata = {
                            **metadata,
                            "centre": [
                                metadata["centre"][0] - box[0] / 2,
                                metadata["centre"][1] - box[1] / 2,
                            ],
                        }
                        mask = rim_mask(cropped[0].size, crop_metadata)
                        areas: list[float] = []
                        flare_areas: list[float] = []
                        peaks: list[float] = []
                        sigma = lib.DESIGN_VENUE.blur_sigma(2)
                        # Blur each frame once. The exact house functions operate in linear light.
                        planes = [
                            barroom.luminance(
                                barroom.gauss(barroom.to_linear(frame), sigma)
                            )
                            for frame in cropped
                        ]
                        for first, second in zip(planes, planes[6:], strict=False):
                            delta = barroom.wcag(first, second)[mask]
                            lit_delta = barroom.wcag(first + 0.05, second + 0.05)[mask]
                            areas.append(float(np.count_nonzero(delta >= 3)) / 4)
                            flare_areas.append(
                                float(np.count_nonzero(lit_delta >= 3)) / 4
                            )
                            peaks.append(float(delta.max()))
                        print(f"{browser_type.name}: {name}/{view}", flush=True)
                        browser_results[f"{name}/{view}"] = {
                            "area_csspx2_at_3": summarize(areas),
                            "area_csspx2_at_3_flare_005": summarize(flare_areas),
                            "peak": summarize(peaks),
                            "projection": metadata,
                        }
                        if browser_type.name == "chromium":
                            cropped[0].save(
                                output / "motion.png",
                                save_all=True,
                                append_images=cropped[1:-1],
                                duration=1000 / 60,
                                loop=1,
                            )
                            # A GIF is convenient to view; its 20 ms frames play at 50 fps.
                            previews = [
                                frame.resize((frame.width // 2, frame.height // 2))
                                for frame in cropped[:-1]
                            ]
                            previews[0].save(
                                output / "preview.gif",
                                save_all=True,
                                append_images=previews[1:],
                                duration=20,
                            )
                measurements["browsers"][browser_type.name] = browser_results
                browser.close()
                print(
                    f"{browser_type.name}: captured {61 * 2 * len(selected)} frames",
                    flush=True,
                )
        measurements["errors"] = errors
        measurements["outside_requests"] = outside
        measurements["colour_contrast"] = {
            surface: lib.contrast(
                lib.Colour.from_hex("#143C6B"), lib.Colour.from_hex(value)
            )
            for surface, value in {
                "paper": "#FAF7F0",
                "knockout": "#D3DCE3",
                "frame": "#736A60",
            }.items()
        }
        (evidence / "measurements.json").write_text(
            json.dumps(measurements, indent=2) + "\n"
        )
        for view in ("cover", "slide3"):
            tiles = []
            for name in VARIANTS:
                frame = Image.open(evidence / "chromium" / name / view / "full-30.png")
                tile = Image.new("RGB", (980, 610), "#FAF7F0")
                tile.paste(frame.resize((980, 552)), (0, 58))
                ImageDraw.Draw(tile).text(
                    (24, 18), f"{name} | {view}", fill="#2A2520", font_size=24
                )
                tiles.append(tile)
            sheet = Image.new("RGB", (1960, 1830), "#FAF7F0")
            for index, tile in enumerate(tiles):
                sheet.paste(tile, ((index % 2) * 980, (index // 2) * 610))
            sheet.save(evidence / f"{view}-comparison.png")
        if errors or outside:
            raise RuntimeError({"browser_errors": errors, "outside_requests": outside})
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
