#!/usr/bin/env python3
"""C13: does the canvas watch stay smooth over a talk's length? The spike
deck on the cover for MINUTES minutes, in a visible full-screen window, in
Firefox and Chromium: every frame gap, per minute, and (Chromium only) the JS
heap; then three slide changes, measured as in deck_frames.py. The stage makes
a new Path2D and a new Map at each frame, so a garbage collector's pauses
would show here. Writes ../out/long-run-<label>.json.

    ../../../../node_modules/.bin/slidev slides.md --port 3132   # in deck/
    ../../../../.venv/bin/python3 long_run.py http://localhost:3132 --label first

--browsers firefox chromium, --minutes 10: which, and how long. --idle-only
skips the slide changes and does not need the canvas stage, so it also runs
on the zoom task's SVG deck (port 3131).
"""

import argparse
import json
from dataclasses import asdict

from deck_frames import change
from frame_gaps import GapSummary
from headed_check import NATIVE_ARGS, settle
from playwright.sync_api import sync_playwright
from spike_browser import OUT

MINUTES = 10
MINUTE_GAPS = """async minutes => {
  const perMinute = [];
  for (let minute = 0; minute < minutes; minute++) {
    const gaps = [];
    await new Promise(done => {
      let last = performance.now();
      const start = last;
      function frame(now) {
        gaps.push(now - last);
        last = now;
        if (now - start < 60000) requestAnimationFrame(frame); else done();
      }
      requestAnimationFrame(frame);
    });
    perMinute.push({ gaps, heap: performance.memory?.usedJSHeapSize ?? null });
  }
  return perMinute;
}"""


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("base")
    parser.add_argument("--label", required=True)
    parser.add_argument("--browsers", nargs="+", default=["firefox", "chromium"])
    parser.add_argument("--minutes", type=int, default=MINUTES)
    parser.add_argument("--idle-only", action="store_true")
    arguments = parser.parse_args()
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright:
        for kind in (getattr(playwright, name) for name in arguments.browsers):
            browser = kind.launch(headless=False, args=NATIVE_ARGS[kind.name])
            page = browser.new_page(no_viewport=True)
            page.goto(f"{arguments.base}/1")
            page.wait_for_selector(".watch-layer")
            window = settle(page)
            minutes = page.evaluate(MINUTE_GAPS, arguments.minutes)
            summaries = [
                {
                    **asdict(GapSummary.of([float(gap) for gap in minute["gaps"]])),
                    "heap": minute["heap"],
                }
                for minute in minutes
            ]
            changes = [
                {"in": change(page, "ArrowRight"), "out": change(page, "ArrowLeft")}
                for _ in range(0 if arguments.idle_only else 3)
            ]
            name = f"{kind.name} {browser.version}, window {window}"
            results[name] = {"minutes": summaries, "changes": changes}
            print(name)
            for index, row in enumerate(summaries, 1):
                print(f"  minute {index:2}  {row}")
            for pair in changes:
                for direction, zoom in pair.items():
                    print(
                        f"  zoom {direction:3}  >12.5ms {zoom['over_12ms']:3}  >25ms {zoom['over_25ms']:3}"
                    )
            browser.close()
    path = OUT / f"long-run-{arguments.label}.json"
    path.write_text(json.dumps(results, indent=1) + "\n")


if __name__ == "__main__":
    main()
