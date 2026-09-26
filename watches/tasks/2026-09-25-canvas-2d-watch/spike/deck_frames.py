#!/usr/bin/env python3
"""C9: frame gaps in the spike deck (deck/) through the change from slide 1
(the cover) to slide 2 (the hairspring) and back, in visible full-screen
windows at the screen's own devicePixelRatio (2), in Firefox and Chromium.
This is the whole page: Slidev's own slide transition, and the canvas.
Writes ../out/deck-frames.json.

    ../../../../node_modules/.bin/slidev slides.md --port 3132   # in deck/
    ../../../../.venv/bin/python3 deck_frames.py http://localhost:3132   # in spike/
"""

import json
import sys
from dataclasses import asdict

from frame_gaps import IDLE, GapSummary
from headed_check import NATIVE_ARGS, settle
from playwright.sync_api import Page, sync_playwright
from spike_browser import OUT

REPEATS = 3
RECORD_MS = 3000  # the longer change (out: fade 0.8 s, then the camera 1.8 s)
FRAMES = """async milliseconds => {
  const frames = [];
  await new Promise(done => {
    let last = performance.now();
    const start = last;
    function frame(now) {
      frames.push([now - start, now - last, watchStage.cameraAt(now).scale]);
      last = now;
      if (now - start < milliseconds) requestAnimationFrame(frame); else done();
    }
    requestAnimationFrame(frame);
  });
  return frames;
}"""


def change(page: Page, key: str) -> dict[str, object]:
    page.keyboard.press(key)
    frames = page.evaluate(FRAMES, RECORD_MS)
    gaps = [float(gap) for _, gap, _ in frames]
    worst = sorted(frames, key=lambda frame: frame[1], reverse=True)[:3]
    page.wait_for_timeout(1000)
    return {
        **asdict(GapSummary.of(gaps)),
        "worst_gaps_ms_at_scale": [
            (round(gap, 1), round(scale, 2)) for _, gap, scale in worst
        ],
        "gaps_ms": [round(gap, 1) for gap in gaps],
    }


def main() -> None:
    base = sys.argv[1]
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright:
        for kind in (playwright.firefox, playwright.chromium):
            browser = kind.launch(headless=False, args=NATIVE_ARGS[kind.name])
            page = browser.new_page(no_viewport=True)
            page.goto(f"{base}/1")
            page.wait_for_function("window.watchStage?.running")
            window = settle(page)
            idle = GapSummary.of([float(gap) for gap in page.evaluate(IDLE)])
            changes = []
            for _ in range(REPEATS):
                changes.append(
                    {"in": change(page, "ArrowRight"), "out": change(page, "ArrowLeft")}
                )
            name = f"{kind.name} {browser.version}, window {window}"
            results[name] = {"idle": asdict(idle), "changes": changes}
            print(name)
            print(f"  idle     {idle}")
            for pair in changes:
                for direction, row in pair.items():
                    print(
                        f"  zoom {direction:3}  >12.5ms {row['over_12ms']:3}"
                        f"  >25ms {row['over_25ms']:3}  frames {row['frames']:4}"
                        f"  worst {row['worst_gaps_ms_at_scale']}"
                    )
            browser.close()
    (OUT / "deck-frames.json").write_text(json.dumps(results, indent=1) + "\n")


if __name__ == "__main__":
    main()
