"""Where a frame's script time goes: the live slide against the live figures.

For each page: the animation-frame callbacks and their time, and the
`drawImage` copies and their time, per frame, over 3 s, on the GPU (as
embed.py). Slide 2 at click 0 has the watch swinging: the live slide's own
cost. Build first (see README.md), then, in the task directory:

    uv run --project ../.. experiments/frame_cost.py out/build

It prints one JSON list.
"""

import json
import sys
from pathlib import Path

from embed import CHROMIUM_ARGS, FRAME_TIMES
from playwright.sync_api import sync_playwright
from serve import serve

PAGES = ["/2", "/2?clicks=1", "/article-live?shared", "/article-live"]

# Times every animation-frame callback and every drawImage, in every frame.
HOOK = """
(() => {
  const timing = { rafCalls: 0, rafMs: 0, drawImageCalls: 0, drawImageMs: 0 };
  window.__timing = timing;
  const drawImage = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (...args) {
    const start = performance.now();
    const result = drawImage.apply(this, args);
    timing.drawImageMs += performance.now() - start;
    timing.drawImageCalls += 1;
    return result;
  };
  const requestFrame = window.requestAnimationFrame;
  window.requestAnimationFrame = function (callback) {
    return requestFrame.call(window, (now) => {
      const start = performance.now();
      try {
        callback(now);
      } finally {
        timing.rafCalls += 1;
        timing.rafMs += performance.now() - start;
      }
    });
  };
})();
"""


def main() -> None:
    build = Path(sys.argv[1]).resolve()
    results = []
    with serve(build) as base, sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chromium", args=CHROMIUM_ARGS)
        for path in PAGES:
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.add_init_script(HOOK)
            page.goto(f"{base}{path}")
            page.wait_for_timeout(5000)  # the zoom from the cover, the board's bend
            page.evaluate(
                "Object.keys(window.__timing).forEach((key) => { window.__timing[key] = 0; })"
            )
            frames = len(page.evaluate(FRAME_TIMES))
            timing = page.evaluate("window.__timing")
            results.append(
                {
                    "path": path,
                    "frames": frames,
                    "frame_callbacks_per_frame": round(timing["rafCalls"] / frames, 2),
                    "frame_callback_ms_per_frame": round(timing["rafMs"] / frames, 2),
                    "draw_image_calls_per_frame": round(
                        timing["drawImageCalls"] / frames, 2
                    ),
                    "draw_image_ms_per_frame": round(timing["drawImageMs"] / frames, 3),
                }
            )
            page.close()
        browser.close()
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
