"""Screenshots of slide 4 at click 7 of a running Slidev, at a 980 x 552
viewport (one CSS px is one slide px), with the strike points marked.

    uv run tasks/2026-10-07-tick-tock-words/shoot.py URL OUT_DIR [COUNT [MS]]

Run it in watches/. URL is the slide, for example
http://localhost:3047/4?clicks=7. It takes COUNT screenshots (default 1),
MS apart (default 250).
"""

import sys
from pathlib import Path

from playwright.sync_api import sync_playwright


def main() -> None:
    url, out = sys.argv[1], Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(
            viewport={"width": 980, "height": 552}, device_scale_factor=2
        )
        page.goto(url)
        page.wait_for_function("window.watchStage !== undefined")
        page.wait_for_timeout(4000)
        for index in range(int(sys.argv[3]) if len(sys.argv) > 3 else 1):
            page.screenshot(path=str(out / f"shot-{index}.png"))
            page.wait_for_timeout(int(sys.argv[4]) if len(sys.argv) > 4 else 250)
        browser.close()


if __name__ == "__main__":
    main()
