"""The article's sliders, at three places each: a check that a slider moves its
figure's story, and pictures of it.

    uv run --project ../../../watches experiments/page/slider.py URL OUT

URL is the deck's base. OUT gets FIGURE-at-N.png for each slider figure
(`curl`: hairspring-3; `wind`: mainspring-2) at 0, 0.5 and 1 of its slider.
"""

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

FIGURES = ("hairspring-3", "mainspring-2")
PLACES = (0.0, 0.25, 0.5, 0.75, 1.0)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("out", type=Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            args=["--enable-gpu", "--use-angle=metal", "--ignore-gpu-blocklist"]
        )
        page = browser.new_page(viewport={"width": 1440, "height": 900})
        page.goto(f"{args.url}/article")
        page.wait_for_timeout(4000)
        for name in FIGURES:
            figure = page.locator(f"#{name}")
            figure.scroll_into_view_if_needed()
            page.wait_for_timeout(2000)
            slider = figure.locator("input[type=range]")
            for place in PLACES:
                slider.evaluate(
                    "(input, value) => { input.value = String(value); input.dispatchEvent(new Event('input')); }",
                    place,
                )
                page.wait_for_timeout(1500)
                figure.screenshot(path=args.out / f"{name}-at-{place:.2f}.png")
        browser.close()


if __name__ == "__main__":
    main()
