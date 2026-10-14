"""Does a palette addon's <html class> survive Slidev's start, in each engine?

Serves a built probe deck (argument 1) with a single-page fallback, opens
slides 1-3 in Chromium, Firefox and WebKit, and prints, as JSON, the <html>
classes and the custom properties that each slide's .slidev-layout computes.
With JavaScript off it also reads slide 1, as a reader of a static page would.
"""

import functools
import http.server
import json
import pathlib
import sys
import threading

from playwright.sync_api import sync_playwright

ROLES = ["--probe-from-addon", "--palette-background", "--palette-ink"]


class SinglePage(http.server.SimpleHTTPRequestHandler):
    def send_head(self):  # type: ignore[no-untyped-def]
        path = pathlib.Path(self.translate_path(self.path))
        if not path.exists():
            self.path = "/index.html"
        return super().send_head()

    def log_message(self, *args):  # type: ignore[no-untyped-def]
        pass


def read(page, number):  # type: ignore[no-untyped-def]
    page.wait_for_selector(".slidev-layout", state="attached")
    page.wait_for_timeout(500)
    return page.evaluate(
        """([number, roles]) => {
          const layout = [...document.querySelectorAll('.slidev-layout')]
            .find((element) => element.closest('[data-slidev-no="' + number + '"]'))
            ?? document.querySelector('.slidev-layout');
          const style = getComputedStyle(layout);
          return {
            html: document.documentElement.className,
            layout: layout.className,
            roles: Object.fromEntries(roles.map((role) => [role, style.getPropertyValue(role).trim()])),
          };
        }""",
        [number, ROLES],
    )


def main() -> None:
    build = pathlib.Path(sys.argv[1]).resolve()
    handler = functools.partial(SinglePage, directory=str(build))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_address[1]}"
    results = {}
    with sync_playwright() as playwright:
        for engine in (playwright.chromium, playwright.firefox, playwright.webkit):
            browser = engine.launch()
            context = browser.new_context()
            page = context.new_page()
            results[engine.name] = {
                str(number): read((page.goto(f"{base}/{number}"), page)[1], number)
                for number in (1, 2, 3)
            }
            static = browser.new_context(java_script_enabled=False).new_page()
            static.goto(f"{base}/1")
            results[engine.name]["static"] = static.evaluate(
                "() => document.documentElement.className"
            )
            browser.close()
    server.shutdown()
    print(json.dumps(results, indent=2))


main()
