#!/usr/bin/env python3
"""Where do the dropped frames during the zoom come from? In Chromium and
Firefox, five zooms of each variant; the gaps between animation frames.
Writes out/jank.json.

    ../../../../.venv/bin/python3 jank_check.py      # in spike/

A gap over 25 ms is at least one dropped frame at 60 Hz. The variants take
away one suspect each: the clip paths, the running mechanism (SMIL), the
pending fade.
"""

import json
import statistics

from playwright.sync_api import Page, sync_playwright
from spike_browser import OUT, browser_name, browsers, open_page, serve_site

REPEATS = 5
VARIANTS = (
    "mode=svg&ease=linear",
    "mode=svg&ease=linear&clips=off",
    "mode=svg&ease=linear&smil=paused",
    "mode=svg&ease=linear&fadelater=1",
    "mode=js&ease=exp",
    # second round, after the first showed Firefox dropping frames in all five
    "mode=svg&ease=linear&fadelater=1&stroke=scaled",
    "mode=svg&ease=linear&fadelater=1&clips=off",
    "mode=svg&ease=linear&fadelater=1&only=hairspring",
    "mode=svg&ease=linear&fadelater=1&smil=paused&clips=off&stroke=scaled",
    # third round: constant line widths without non-scaling-stroke
    "mode=js&ease=linear&fadelater=1&stroke=compensated",
    "mode=js&ease=linear&fadelater=1&stroke=fixed",
)
GAPS = """async () => {
  const gaps = [];
  spike.zoom(true);
  await new Promise(done => {
    let last = performance.now();
    const start = last;
    function frame(now) {
      gaps.push(now - last);
      last = now;
      if (now - start < 1800) requestAnimationFrame(frame); else done();
    }
    requestAnimationFrame(frame);
  });
  return gaps;
}"""


def zoom_gaps(page: Page) -> list[float]:
    page.wait_for_timeout(300)
    return [float(gap) for gap in page.evaluate(GAPS)]


def main() -> None:
    results: dict[str, dict[str, dict[str, float]]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            rows: dict[str, dict[str, float]] = {}
            for query in VARIANTS:
                gaps: list[float] = []
                for _ in range(REPEATS):
                    with open_page(browser, base, query) as page:
                        gaps += zoom_gaps(page)
                rows[query] = {
                    "frames": len(gaps),
                    "median_ms": statistics.median(gaps),
                    "over_25ms": sum(gap > 25 for gap in gaps),
                    "max_ms": max(gaps),
                }
            results[browser_name(browser)] = rows
    (OUT / "jank.json").write_text(json.dumps(results, indent=2) + "\n")
    for name, rows in results.items():
        print(name)
        for query, row in rows.items():
            print(
                f"  {query:36} frames {row['frames']:4.0f}  median"
                f" {row['median_ms']:5.1f}  >25ms {row['over_25ms']:3.0f}"
                f"  max {row['max_ms']:5.1f}"
            )


if __name__ == "__main__":
    main()
