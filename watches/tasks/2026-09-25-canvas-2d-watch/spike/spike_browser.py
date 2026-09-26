"""What the measurement scripts share: a local server for site/, the two
browsers, and a page of zoom.html with a given query string."""

import functools
import http.server
import pathlib
import threading
from collections.abc import Iterator
from contextlib import contextmanager

from playwright.sync_api import Browser, Page, Playwright

SPIKE = pathlib.Path(__file__).resolve().parent
SITE = SPIKE / "site"
OUT = SPIKE.parent / "out"  # the task's out/: tool output, not committed
VIEWPORT = {"width": 1500, "height": 900}  # room for host=1.5 (1470 x 828)


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:
        pass


@contextmanager
def serve_site() -> Iterator[str]:
    """Serve site/ on a free port; yield its base URL."""
    handler = functools.partial(QuietHandler, directory=str(SITE))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()


def browsers(playwright: Playwright) -> Iterator[Browser]:
    """Chromium, then Firefox: every test runs in both."""
    for kind in (playwright.chromium, playwright.firefox):
        browser = kind.launch()
        try:
            yield browser
        finally:
            browser.close()


@contextmanager
def open_page(
    browser: Browser, base: str, query: str, device_scale_factor: float = 1
) -> Iterator[Page]:
    """zoom.html with `query`, closed afterwards: a page left open behind
    another is hidden, and the browser then throttles its animation frames."""
    page = browser.new_page(
        viewport=VIEWPORT,  # type: ignore[arg-type]
        device_scale_factor=device_scale_factor,
    )
    page.on("pageerror", lambda error: print(f"page error: {error}"))
    page.goto(f"{base}/zoom.html?{query}")
    page.evaluate("window.ready")
    try:
        yield page
    finally:
        page.close()


def browser_name(browser: Browser) -> str:
    return f"{browser.browser_type.name} {browser.version}"
