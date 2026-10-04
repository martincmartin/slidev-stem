"""Check the standalone comparison in both browsers with HTTP blocked."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

TASK = Path(__file__).resolve().parents[1]


def main() -> None:
    results = {}
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            errors: list[str] = []
            outside: list[str] = []
            browser = browser_type.launch()
            page = browser.new_page()
            page.on(
                "pageerror",
                lambda error, captured_errors=errors: captured_errors.append(
                    str(error)
                ),
            )
            page.on(
                "request",
                lambda request, captured_requests=outside: (
                    captured_requests.append(request.url)
                    if request.url.startswith(("http:", "https:"))
                    else None
                ),
            )
            page.route("http://**/*", lambda route: route.abort())
            page.route("https://**/*", lambda route: route.abort())
            page.goto((TASK / "comparison.html").as_uri())
            page.wait_for_function("window.rimReady")
            page.locator("#variant").select_option("weights-4")
            page.locator("#view").select_option("slide3")
            page.locator("#play").click()
            assert page.locator("#play").inner_text() == "Play"
            page.locator("#play").click()
            assert page.locator("#play").inner_text() == "Pause"
            page.evaluate("window.rimStop()")
            variants = page.evaluate("window.rimVariants")
            for variant in variants:
                for view in ("cover", "slide3"):
                    page.evaluate(
                        "([name,view]) => window.rimRender(name,view,0.5)",
                        [variant["name"], view],
                    )
            results[browser_type.name] = {
                "renders": len(variants) * 2,
                "errors": errors,
                "outside_requests": outside,
            }
            browser.close()
            if errors or outside:
                raise RuntimeError(results)
    (TASK / "evidence" / "standalone-check.json").write_text(
        json.dumps(results, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
