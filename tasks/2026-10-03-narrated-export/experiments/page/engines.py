"""The article in Chromium, Firefox and WebKit: its errors, its figures, and
pictures of two figures (a live one, and a slider's).

    uv run --project ../../../watches experiments/page/engines.py URL OUT

URL is the deck's base, where /article is. Each engine runs in a fresh,
non-persistent context, as the house's checks do (AGENTS.md, "Browser
support"). OUT gets ENGINE-FIGURE.png and the counts on stdout.
"""

import argparse
from pathlib import Path

from playwright.sync_api import sync_playwright

FIGURES = ("escapement-4", "hairspring-3")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("out", type=Path)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        for engine in (playwright.chromium, playwright.firefox, playwright.webkit):
            browser = engine.launch()
            context = browser.new_context(viewport={"width": 1440, "height": 900})
            page = context.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{args.url}/article")
            page.wait_for_timeout(5000)
            counts = page.evaluate(
                "() => ({figures: document.querySelectorAll('figure.article-figure').length,"
                " canvases: document.querySelectorAll('figure canvas').length})"
            )
            for name in FIGURES:
                figure = page.locator(f"#{name}")
                figure.scroll_into_view_if_needed()
                page.wait_for_timeout(2500)
                slider = figure.locator("input[type=range]")
                if slider.count() > 0:
                    slider.evaluate(
                        "input => { input.value = '0.6'; input.dispatchEvent(new Event('input')); }"
                    )
                    page.wait_for_timeout(1500)
                figure.screenshot(path=args.out / f"{engine.name}-{name}.png")
            print(engine.name, counts, errors[:3])
            context.close()
            browser.close()


if __name__ == "__main__":
    main()
