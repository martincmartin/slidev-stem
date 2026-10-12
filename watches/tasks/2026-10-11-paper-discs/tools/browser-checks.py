"""Run window.webglChecks() (webgl/probe/checks.ts) in Chromium, Firefox and WebKit.

    uv run python tasks/2026-10-11-paper-discs/tools/browser-checks.py   # in watches/
"""
import pathlib, sys, tempfile
sys.path.insert(0, str(pathlib.Path.cwd() / "art"))
from watch_stills import build_probe, served  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402

with tempfile.TemporaryDirectory(prefix="probe-") as built:
    build_probe(pathlib.Path(built))
    with served(pathlib.Path(built)) as base, sync_playwright() as playwright:
        for engine in (playwright.chromium, playwright.firefox, playwright.webkit):
            browser = engine.launch()
            page = browser.new_context().new_page()
            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{base}/index.html")
            page.wait_for_function("window.watchProbeReady === true", timeout=120_000)
            results = page.evaluate("window.webglChecks()")
            failed = [r for r in results if r["failure"]]
            print(engine.name, f"{len(results) - len(failed)} of {len(results)} pass", errors or "")
            for r in failed:
                print("   FAIL", r["name"], "--", r["failure"])
            browser.close()
