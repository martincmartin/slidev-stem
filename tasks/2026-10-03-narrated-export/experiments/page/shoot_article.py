"""Screenshots of the article (/article) of a running deck, and its errors.

    uv run --project ../../../watches experiments/page/shoot_article.py URL OUT [--width W] [--height H] [--screens] [--no-figures]

URL is the deck's base (http://localhost:3141). OUT gets top.png (the first
screen), screen-N.png (each screen of the page, with --screens: a page this
tall is too tall for one capture), figure-N.png (each figure), and
errors.txt (the console's errors and the page's). The script
waits SETTLE seconds after the load, scrolls to each figure, and waits
FIGURE_SETTLE seconds there, so that it draws.
"""

import argparse
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

SETTLE = 4.0
FIGURE_SETTLE = 2.5


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("out", type=Path)
    parser.add_argument("--width", type=int, default=1440)
    parser.add_argument("--height", type=int, default=900)
    parser.add_argument("--screens", action="store_true")
    parser.add_argument("--no-figures", action="store_true")
    parser.add_argument("--only", type=int, nargs="*", default=None)
    args = parser.parse_args()
    args.out.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch(
            args=["--enable-gpu", "--use-angle=metal", "--ignore-gpu-blocklist"]
        )
        page = browser.new_page(viewport={"width": args.width, "height": args.height})
        page.on("console", lambda message: errors.append(f"console {message.type}: {message.text}") if message.type in ("error", "warning") else None)
        page.on("pageerror", lambda error: errors.append(f"pageerror: {error}"))
        page.goto(f"{args.url}/article")
        page.wait_for_timeout(SETTLE * 1000)
        page.screenshot(path=args.out / "top.png")
        figures = page.locator("figure.article-figure")
        count = figures.count()
        print(f"{count} figures")
        for index in range(0 if args.no_figures else count):
            if args.only is not None and index not in args.only:
                continue
            figure = figures.nth(index)
            figure.scroll_into_view_if_needed()
            page.wait_for_timeout(FIGURE_SETTLE * 1000)
            figure.screenshot(path=args.out / f"figure-{index:02d}.png")
        if args.screens:
            height = page.evaluate("document.documentElement.scrollHeight")
            for screen, top in enumerate(range(0, height, args.height)):
                page.evaluate(f"window.scrollTo(0, {top})")
                page.wait_for_timeout(FIGURE_SETTLE * 1000)
                page.screenshot(path=args.out / f"screen-{screen:02d}.png")
        browser.close()
    (args.out / "errors.txt").write_text("\n".join(errors) + "\n")
    print("\n".join(errors[:40]))
    sys.exit(0)


if __name__ == "__main__":
    main()
