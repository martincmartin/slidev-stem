"""Check the narration prototype in a static build of the experiment deck.

Build first, in the talk's directory (README.md says why there):

    pnpm exec slidev build <task>/experiments/deck/slides.md --out <task>/out/build

Then, in the task directory:

    uv run --project ../.. experiments/check_build.py out/build

It serves the build as a static host (experiments/serve.py), opens the
narrated mode and the article, and prints one JSON object of measurements.
"""

import json
import sys
from pathlib import Path

from playwright.sync_api import ConsoleMessage, sync_playwright
from serve import serve


def main() -> None:
    build = Path(sys.argv[1]).resolve()
    results: dict[str, object] = {
        "build_bytes": sum(
            file.stat().st_size for file in build.rglob("*") if file.is_file()
        ),
    }
    errors: list[str] = []
    with serve(build) as base, sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        page = browser.new_page(viewport={"width": 1920, "height": 1080})

        def on_console(message: ConsoleMessage) -> None:
            if message.type == "error":
                errors.append(message.text[:160])

        page.on("console", on_console)
        page.goto(f"{base}/2?narration&clicks=1")
        page.wait_for_selector(".narration-part.current", timeout=15000)
        results["narrated_current_part"] = page.locator(
            ".narration-part.current"
        ).inner_text()[:60]
        results["narrated_parts"] = page.locator(".narration-part").count()
        page.goto(f"{base}/article")
        page.wait_for_selector(".article-figure", timeout=15000)
        results["article_url"] = page.url.removeprefix(base)
        results["article_figures"] = page.locator(".article-figure").count()
        page.goto(f"{base}/presenter/2")
        page.wait_for_timeout(2000)
        results["presenter_note_text"] = page.locator(
            ".slidev-note"
        ).first.inner_text()[:80]
        browser.close()
    results["console_errors"] = sorted(set(errors))
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
