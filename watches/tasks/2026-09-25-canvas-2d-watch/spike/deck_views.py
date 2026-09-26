#!/usr/bin/env python3
"""C11: what Slidev's other views show of the canvas watch, headless, in
Chromium and Firefox: the presenter (on slides 1 and 2), the overview, and
print. Writes screenshots to ../out/views/ and the page errors to ../out/views.json.

    ../../../../node_modules/.bin/slidev slides.md --port 3132   # in deck/
    ../../../../.venv/bin/python3 deck_views.py http://localhost:3132   # in spike/
"""

import json
import sys

from deck_check import collector
from playwright.sync_api import sync_playwright
from spike_browser import OUT, browsers

PICTURES = OUT / "views"
VIEWS = {
    "presenter-1": "/presenter/1",
    "presenter-2": "/presenter/2",
    "overview": "/overview",
    "print": "/print",
}


def main() -> None:
    base = sys.argv[1]
    PICTURES.mkdir(exist_ok=True)
    errors: dict[str, list[str]] = {}
    with sync_playwright() as playwright:
        for browser in browsers(playwright):
            for name, path in VIEWS.items():
                page = browser.new_page(viewport={"width": 1600, "height": 900})
                tag = f"{browser.browser_type.name}-{name}"
                errors[tag] = []
                page.on("pageerror", collector(errors[tag]))
                page.goto(base + path)
                page.wait_for_timeout(4000)  # past any zoom and fade
                page.screenshot(path=str(PICTURES / f"{tag}.png"), full_page=True)
                page.close()
    (OUT / "views.json").write_text(json.dumps(errors, indent=2) + "\n")
    print(json.dumps(errors, indent=2))


if __name__ == "__main__":
    main()
