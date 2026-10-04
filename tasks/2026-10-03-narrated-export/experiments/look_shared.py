"""Screenshots of two live figures, drawn two ways, for the follow-up.

Slide 2 at click 1 (the diving board) and at click 3 (the hairspring at rest),
on /article-live: once with one shared renderer (`?shared`), once with a
WebGL context for each figure. Build first (see README.md), then, in the task
directory:

    uv run --project ../.. experiments/look_shared.py out/build out/shared

It writes the PNGs and `compare.png` (all four, side by side), and prints each
page's WebGL probe (from embed.py).
"""

import subprocess
import sys
from pathlib import Path

from embed import PROBE
from playwright.sync_api import sync_playwright
from serve import serve

FIGURES = {"slide2-click1": 2, "slide2-click3": 4}  # index of the figure on the page
WAYS = {"shared": "/article-live?shared", "per-figure": "/article-live"}


def main() -> None:
    build, out = Path(sys.argv[1]).resolve(), Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    shots: list[Path] = []
    with serve(build) as base, sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for way, path in WAYS.items():
            page = browser.new_page(viewport={"width": 1280, "height": 900})
            page.add_init_script(PROBE)
            page.goto(f"{base}{path}")
            page.wait_for_selector(".article-figure")
            for name, index in FIGURES.items():
                figure = page.locator(".article-figure").nth(index)
                figure.scroll_into_view_if_needed()
                page.wait_for_timeout(3000)  # the board bends; the views draw
                shot = out / f"{way}-{name}.png"
                figure.screenshot(path=shot)
                shots.append(shot)
            print(way, page.evaluate("window.__probe"))
            page.close()
        browser.close()
    subprocess.run(
        [
            "magick",
            *map(str, shots),
            "-resize",
            "50%",
            "+append",
            str(out / "compare.png"),
        ],
        check=True,
    )


if __name__ == "__main__":
    main()
