"""Check SVG clock control and worker drawing in Chromium and Firefox.

Use stem/.venv/bin/python. Browser binaries must already be installed.
The probe loads only frozen task inputs. It makes no network request.
"""

from __future__ import annotations

import json
from functools import partial
from pathlib import Path
from typing import cast

from playwright.sync_api import Request, sync_playwright

TASK = Path(__file__).resolve().parent


def record_request(requests: list[str], request: Request) -> None:
    requests.append(request.url)


def main() -> None:
    inputs = TASK / "inputs/watches"
    source = {
        "svgText": (inputs / "public/cover/skeleton-watch.svg").read_text(),
        "playerText": (
            inputs / "tasks/2026-09-25-canvas-2d-watch/spike/site/watch_player.js"
        ).read_text(),
    }
    script = (TASK / "browser_probe.js").read_text()
    results: list[dict[str, object]] = []
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            browser = browser_type.launch(headless=True)
            try:
                page = browser.new_page(viewport={"width": 1000, "height": 600})
                requests: list[str] = []
                page.on("request", partial(record_request, requests))
                page.set_content("<!doctype html><title>Architecture probe</title>")
                result = cast(dict[str, object], page.evaluate(script, source))
                network_requests = [
                    request
                    for request in requests
                    if request.startswith(("http:", "https:"))
                ]
                assert not network_requests, network_requests
                results.append(
                    {
                        "browser": browser_type.name,
                        "version": browser.version,
                        "headless": True,
                        "network_requests": network_requests,
                        "result": result,
                    }
                )
            finally:
                browser.close()
    output = TASK / "evidence"
    output.mkdir(exist_ok=True)
    (output / "browser_probe.json").write_text(json.dumps(results, indent=2) + "\n")
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
