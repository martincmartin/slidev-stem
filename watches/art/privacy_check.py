#!/usr/bin/env python3
"""Check live watch startup without canvas pixel reads in all three engines.

    uv run art/privacy_check.py DECK_DIR

Playwright contexts start without saved browser data. Blocking canvas readback
reproduces the constraint that exposed the Safari private-window palette bug.
Playwright's WebKit is not Safari's private window. The engines run at once,
each in its own browser.
"""

import argparse
import sys
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from pathlib import Path

from playwright.sync_api import Error, sync_playwright
from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from print_check import BROWSERS, launch, serve_from

STARTUP_TIMEOUT_MS = 5_000
NO_CANVAS_READBACK = """CanvasRenderingContext2D.prototype.getImageData = function() {
    throw new Error('Canvas pixel read blocked by the privacy check');
};"""


def record_page_error(problems: list[str], error: Error) -> None:
    problems.append(str(error))


def check_engine(deck: Path, engine: str) -> list[str]:
    """The problems of `engine`: none if its live watch started on the cover."""
    errors: list[str] = []
    with sync_playwright() as playwright:
        browser = launch(playwright, engine)
        try:
            context = browser.new_context()
            context.add_init_script(NO_CANVAS_READBACK)
            page = context.new_page()
            outside: list[str] = []
            serve_from(deck, page, outside)
            page.on("pageerror", partial(record_page_error, errors))
            page.goto("http://deck.test/1", wait_until="domcontentloaded")
            try:
                page.wait_for_function(
                    """() => window.watchStage &&
                      document.querySelector('.watch-canvas')?.getAttribute('data-watch') !== 'null'
                    """,
                    timeout=STARTUP_TIMEOUT_MS,
                )
            except PlaywrightTimeoutError:
                errors.append("the live watch did not start on the cover")
            errors.extend(f"outside request: {url}" for url in outside)
        finally:
            browser.close()
    return errors


def check(deck: Path) -> int:
    """Check every engine at once. Each has its own browser and list."""
    with ThreadPoolExecutor(max_workers=len(BROWSERS)) as pool:
        results = list(pool.map(partial(check_engine, deck), BROWSERS))
    for engine, errors in zip(BROWSERS, results, strict=True):
        for error in errors:
            print(f"FAIL {engine}: {error}")
        if not errors:
            print(f"ok {engine}: live watch started with canvas pixel reads blocked")
    return 1 if any(results) else 0


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("deck", type=Path)
    arguments = parser.parse_args()
    if not (arguments.deck / "index.html").is_file():
        parser.error("The deck has no index.html. Build it first.")
    sys.exit(check(arguments.deck))


if __name__ == "__main__":
    main()
