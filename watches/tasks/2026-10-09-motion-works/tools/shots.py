"""Screenshots of a slide at each click, after its watch has settled.

    uv run tasks/2026-10-09-motion-works/tools/shots.py DIST SLIDE CLICKS OUT_DIR [--browser chromium]

In watches/. DIST is a built deck (`pnpm build`), SLIDE the slide's number
in the deck's URL (it changes when a slide is added), CLICKS the last click.
It starts from the last click of the slide before, so that the first step
is the step into the slide. It steps forward from click 0, as a speaker does, and
waits for each step's motion and text to end. It writes click-N.png.
"""

import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "art"))
from print_check import BROWSERS, serve_from  # noqa: E402

SETTLE_MS = 9000  # the longest step: fades, camera, flash, then the text


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("dist", type=Path)
    parser.add_argument("slide", type=int)
    parser.add_argument("clicks", type=int)
    parser.add_argument("out", type=Path)
    parser.add_argument("--browser", default="chromium", choices=list(BROWSERS))
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = BROWSERS[args.browser](playwright).launch()
        context = browser.new_context(
            viewport={"width": 980, "height": 552}, device_scale_factor=2
        )
        page = context.new_page()
        outside: list[str] = []
        errors: list[str] = []
        page.on("pageerror", lambda error: errors.append(str(error)))
        serve_from(args.dist, page, outside)
        number = args.slide
        page.goto(f"http://deck.test/{number - 1}?clicks=99")
        page.wait_for_function("window.watchStage !== undefined")
        page.wait_for_timeout(SETTLE_MS)
        page.keyboard.press("ArrowRight")
        page.wait_for_timeout(SETTLE_MS)
        page.screenshot(path=str(args.out / "click-0.png"))
        for click in range(1, args.clicks + 1):
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(SETTLE_MS)
            page.screenshot(path=str(args.out / f"click-{click}.png"))
        print(f"slide {number}; errors: {errors}; outside: {outside}")
        context.close()
        browser.close()


if __name__ == "__main__":
    main()
