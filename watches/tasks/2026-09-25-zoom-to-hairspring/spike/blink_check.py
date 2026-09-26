#!/usr/bin/env python3
"""Do parts blink out during the zoom in Chromium? Writes out/blink.json and,
for the worst variant, out/blink-*.png.

    ../../../../.venv/bin/python3 blink_check.py      # in spike/

The DevTools screencast sends each frame that Chromium's compositor draws.
In each frame, count the pixels of the knockout colour (the lit faces of the
wheels, the fork and the chapter ring). During a zoom that count changes
smoothly. A part that blinks out makes it drop for a frame or two and come
back. A "blink" here is a frame whose count is under 80% of the median of the
five frames on each side.
"""

import base64
import io
import json
import statistics

import numpy
from PIL import Image
from playwright.sync_api import Browser, sync_playwright
from spike_browser import OUT, VIEWPORT, serve_site
from spike_pixels import Pixels, save

KNOCKOUT = numpy.array([0xD3, 0xDC, 0xE3])  # --palette-art-knockout
VARIANTS = (
    "mode=svg&ease=linear",
    "mode=js&ease=exp",
    "mode=svg&ease=linear&fadelater=1",
    "mode=js&ease=exp&fadelater=1",
)


def frames_during_zoom(browser: Browser, base: str, query: str) -> list[Pixels]:
    page = browser.new_page(viewport=VIEWPORT)  # type: ignore[arg-type]
    page.goto(f"{base}/zoom.html?{query}")
    page.evaluate("window.ready")
    session = page.context.new_cdp_session(page)
    frames: list[Pixels] = []

    def keep(event: dict[str, object]) -> None:
        png = base64.b64decode(str(event["data"]))
        image = Image.open(io.BytesIO(png)).convert("RGB")
        frames.append(numpy.asarray(image, dtype=float))
        session.send("Page.screencastFrameAck", {"sessionId": event["sessionId"]})

    session.on("Page.screencastFrame", keep)
    session.send("Page.startScreencast", {"format": "png", "everyNthFrame": 1})
    page.wait_for_timeout(300)
    page.evaluate("spike.zoom(true)")
    page.wait_for_timeout(2200)  # the 1.8 s zoom, and a little more
    session.send("Page.stopScreencast")
    page.close()
    return frames


def knockout_count(pixels: Pixels) -> int:
    return int((numpy.abs(pixels - KNOCKOUT).max(axis=2) < 8).sum())


def blinks(counts: list[int]) -> list[int]:
    found = []
    for index, count in enumerate(counts):
        around = counts[max(0, index - 5) : index] + counts[index + 1 : index + 6]
        if around and count < 0.8 * statistics.median(around):
            found.append(index)
    return found


def main() -> None:
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        browser = playwright.chromium.launch()
        for query in VARIANTS:
            frames = frames_during_zoom(browser, base, query)
            counts = [knockout_count(frame) for frame in frames]
            found = blinks(counts)
            results[query] = {"frames": len(frames), "blink_frames": found}
            if found:
                index = found[0]
                pair = numpy.concatenate([frames[index - 1], frames[index]], axis=1)
                tag = query.replace("&", "-").replace("=", "")
                save(pair, str(OUT / f"blink-{tag}.png"))
        browser.close()
    (OUT / "blink.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
