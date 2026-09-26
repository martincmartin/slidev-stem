#!/usr/bin/env python3
"""measure_zoom.mid_sharpness, five times for each camera mode, to see how
much it varies from run to run. Writes out/repeat_sharpness.json.

    ../../../../.venv/bin/python3 repeat_sharpness.py      # in spike/
"""

import json
import statistics

from measure_zoom import MODES, mid_sharpness
from playwright.sync_api import sync_playwright
from spike_browser import OUT, browser_name, browsers, serve_site

REPEATS = 5


def main() -> None:
    results: dict[str, dict[str, list[float]]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for browser in browsers(playwright):
            results[browser_name(browser)] = {
                f"{mode}, {ease}, smil {smil}": [
                    mid_sharpness(browser, base, mode, ease, smil)
                    for _ in range(REPEATS)
                ]
                for mode, ease in MODES
                for smil in ("paused", "running")
            }
    (OUT / "repeat_sharpness.json").write_text(json.dumps(results, indent=2) + "\n")
    for name, rows in results.items():
        print(name)
        for label, ratios in rows.items():
            print(
                f"  {label:28} mean {statistics.mean(ratios):.3f}"
                f"  min {min(ratios):.3f}  max {max(ratios):.3f}"
            )


if __name__ == "__main__":
    main()
