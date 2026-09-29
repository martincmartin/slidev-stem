#!/usr/bin/env python3
"""What can JavaScript learn and change about running SVG animations?

    ../../../../.venv/bin/python3 smil_probe.py      # in tools/: about 15 s

Loads smil_probe.html in Playwright's Chromium and Firefox (visible windows
are not needed: the probe reads animation values and times, not frame
pacing), calls its runProbe(), and writes ../evidence/smil_probe.json.
"""

import json
import pathlib

from playwright.sync_api import sync_playwright

TOOLS = pathlib.Path(__file__).resolve().parent
EVIDENCE = TOOLS.parent / "evidence"
PAGE = TOOLS / "smil_probe.html"
TIMEOUT = 30_000  # ms: an exception inside the probe must not hang the run


def main() -> None:
    results: dict[str, object] = {}
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            browser = browser_type.launch()
            page = browser.new_page()
            page.set_default_timeout(TIMEOUT)
            errors: list[str] = []

            def record(error: object, into: list[str] = errors) -> None:
                into.append(str(error))

            page.on("pageerror", record)
            page.goto(PAGE.as_uri())
            result = page.evaluate("runProbe()")
            result["version"] = browser.version
            result["pageErrors"] = errors
            results[browser_type.name] = result
            print(browser_type.name, browser.version)
            print(json.dumps(result, indent=1))
            page.close()
            browser.close()
    EVIDENCE.mkdir(exist_ok=True)
    (EVIDENCE / "smil_probe.json").write_text(json.dumps(results, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'smil_probe.json'}")


if __name__ == "__main__":
    main()
