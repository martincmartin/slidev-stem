#!/usr/bin/env python3
"""measure_zoom.mid_sharpness in the other Chromium builds: Playwright's
full Chromium ("chromium" channel, new headless mode) and the installed
Google Chrome ("chrome" channel). The default launch uses the stripped
headless shell, whose compositor differs. Writes out/channel_sharpness.json.

    ../../../../.venv/bin/python3 channel_sharpness.py      # in spike/
"""

import json

from measure_zoom import MODES, mid_sharpness
from playwright.sync_api import sync_playwright
from spike_browser import OUT, browser_name, serve_site


def main() -> None:
    results: dict[str, dict[str, float]] = {}
    with sync_playwright() as playwright, serve_site() as base:
        for channel in ("chromium", "chrome"):
            browser = playwright.chromium.launch(channel=channel)
            name = f"{channel}: {browser_name(browser)}"
            results[name] = {
                f"{mode}, {ease}, smil {smil}": mid_sharpness(
                    browser, base, mode, ease, smil
                )
                for mode, ease in MODES
                for smil in ("paused", "running")
            }
            browser.close()
    (OUT / "channel_sharpness.json").write_text(json.dumps(results, indent=2) + "\n")
    for name, rows in results.items():
        print(name)
        for label, ratio in rows.items():
            print(f"  {label:28} {ratio:.3f}")


if __name__ == "__main__":
    main()
