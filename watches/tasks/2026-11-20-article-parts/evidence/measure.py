"""What each article page and the deck load: bytes, time to the first figure
canvas, and (Chromium) the JS heap. Prints JSON lines. Three runs a page; the
median of each number."""

import json
import statistics
import sys
from playwright.sync_api import sync_playwright

base, label = sys.argv[1], sys.argv[2]
PAGES = ["article/1/", "article/2/", "article/3/", "1"]
RUNS = 3

with sync_playwright() as playwright:
    for engine in [playwright.chromium, playwright.firefox, playwright.webkit]:
        browser = engine.launch()
        for path in PAGES:
            rows = []
            for _ in range(RUNS):
                context = browser.new_context(viewport={"width": 1280, "height": 900})
                page = context.new_page()
                page.goto(f"{base}/{path}", wait_until="load")
                page.wait_for_function(
                    "document.querySelector('.article-figure canvas, .watch-canvas') !== null",
                    timeout=30000,
                )
                first_canvas = page.evaluate("performance.now()")
                page.wait_for_timeout(4000)
                resources = page.evaluate(
                    """() => performance.getEntriesByType('resource').map(r => ({
                        name: r.name, size: r.transferSize || 0}))"""
                )
                total = sum(r["size"] for r in resources)
                script = sum(r["size"] for r in resources if r["name"].endswith(".js"))
                elements = page.evaluate("document.getElementsByTagName('*').length")
                heap = None
                if engine.name == "chromium":
                    session = context.new_cdp_session(page)
                    session.send("HeapProfiler.collectGarbage")
                    heap = session.send("Runtime.getHeapUsage")["usedSize"]
                rows.append((total, script, first_canvas, heap, elements))
                context.close()
            med = lambda index: statistics.median(r[index] for r in rows) if rows[0][index] is not None else None
            print(json.dumps({
                "label": label, "engine": engine.name, "page": path,
                "kB": round(med(0) / 1000), "js_kB": round(med(1) / 1000),
                "first_canvas_ms": round(med(2)),
                "elements": round(med(4)),
                "heap_MB": round(med(3) / 1e6, 1) if med(3) is not None else None,
            }))
        browser.close()
