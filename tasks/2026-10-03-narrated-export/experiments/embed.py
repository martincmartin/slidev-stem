"""Live slides on one page: an iframe for each figure, against one document.

For each layout below, in a fresh browser context: the time until the slides
are drawn (their count holds for 1 s), the slides drawn, the network
requests (and how many the cache served), the JS heap after a garbage
collection, the DOM, the WebGL contexts (made and lost), the bytes uploaded to
WebGL buffers (static and dynamic), and 3 s of frame times. Build first (see
README.md), then, in the task directory:

    uv run --project ../.. experiments/embed.py out/build

It prints one JSON list. Chromium runs in its new headless mode, with the
GPU (Metal, on a Mac): the old headless shell draws WebGL in software
(SwiftShader), which made every live layout run at 5-6 frames a second. Each
row names the renderer.
"""

import json
import sys
import time
from pathlib import Path
from typing import Any

from playwright.sync_api import (
    Browser,
    CDPSession,
    ConsoleMessage,
    Frame,
    Page,
    sync_playwright,
)
from serve import serve

# The narration parts of the experiment deck: (slide, click) for each figure.
PARTS = [
    (1, 0),
    *((2, clicks) for clicks in range(5)),
    *((3, clicks) for clicks in range(6)),
]
FIGURE = (760, 428)  # the article's column, at the slide's aspect
FILLER = (
    "A paragraph of narration stands here, as long as a typical part: about sixty "
    "words, so that the figures sit as far apart as they would in the article. "
) * 2

# Runs in every frame before its scripts: counts WebGL contexts, lost
# contexts, and the bytes given to bufferData, by usage.
PROBE = """
(() => {
  const probe = { contexts: 0, lost: 0, staticBytes: 0, dynamicBytes: 0, renderer: null };
  window.__probe = probe;
  const STATIC_DRAW = 0x88e4;
  for (const Canvas of [window.HTMLCanvasElement, window.OffscreenCanvas]) {
    if (!Canvas) continue;
    const getContext = Canvas.prototype.getContext;
    Canvas.prototype.getContext = function (type, ...rest) {
      const context = getContext.call(this, type, ...rest);
      if (context && /webgl/.test(type) && !this.__probed) {
        this.__probed = true;
        probe.contexts += 1;
        this.addEventListener("webglcontextlost", () => { probe.lost += 1; });
        if (probe.renderer === null) {
          const info = context.getExtension("WEBGL_debug_renderer_info");
          probe.renderer = info ? context.getParameter(info.UNMASKED_RENDERER_WEBGL) : "unknown";
        }
      }
      return context;
    };
  }
  for (const Context of [window.WebGLRenderingContext, window.WebGL2RenderingContext]) {
    const bufferData = Context.prototype.bufferData;
    Context.prototype.bufferData = function (target, data, usage, ...rest) {
      const bytes = typeof data === "number" ? data : (data?.byteLength ?? 0);
      if (usage === STATIC_DRAW) probe.staticBytes += bytes;
      else probe.dynamicBytes += bytes;
      return bufferData.call(this, target, data, usage, ...rest);
    };
  }
})();
"""

CHROMIUM_ARGS = [
    "--enable-precise-memory-info",
    "--js-flags=--expose-gc",
    "--enable-gpu",
    "--use-angle=metal",
    "--ignore-gpu-blocklist",
]

FRAME_TIMES = """
() => new Promise((resolve) => {
  const intervals = [];
  let last = performance.now();
  const end = last + 3000;
  function tick(now) {
    intervals.push(now - last);
    last = now;
    if (now < end) requestAnimationFrame(tick);
    else resolve(intervals);
  }
  requestAnimationFrame(tick);
})
"""


def iframe_page(copies: int, lazy: bool) -> str:
    loading = ' loading="lazy"' if lazy else ""
    width, height = FIGURE
    figures = "\n".join(
        f'<iframe src="/{no}?embedded=true&clicks={clicks}" width="{width}" height="{height}"'
        f' style="border:0;display:block"{loading} title="slide {no}, click {clicks}"></iframe>'
        f"<p>{FILLER}</p>"
        for _ in range(copies)
        for no, clicks in PARTS
    )
    return (
        "<!doctype html><meta charset=utf-8><title>iframes</title>"
        f'<main style="width:{width}px;margin:0 auto">{figures}</main>'
    )


PAGES = {
    "/__iframes-12.html": iframe_page(1, lazy=False),
    "/__iframes-24.html": iframe_page(2, lazy=False),
    "/__iframes-12-lazy.html": iframe_page(1, lazy=True),
}

LAYOUTS = [
    ("one slide, play mode", "/2?clicks=1"),
    ("12 iframes, one for each part", "/__iframes-12.html"),
    ("24 iframes", "/__iframes-24.html"),
    ("12 iframes, loading=lazy", "/__iframes-12-lazy.html"),
    ("one document, 12 live figures", "/article-live"),
    ("one document, 24 live figures", "/article-live?copies=2"),
    ("one document, 12 live figures, one shared context", "/article-live?shared"),
    (
        "one document, 24 live figures, one shared context",
        "/article-live?shared&copies=2",
    ),
    ("one document, 12 stills (print mode)", "/article"),
]


def loaded_frames(page: Page) -> list[Frame]:
    """The frames with a document: a lazy iframe that has not loaded has none,
    and Playwright would wait for ever to run a script in it."""
    return [frame for frame in page.frames if frame.url.startswith("http")]


def script_seconds(cdp: CDPSession) -> float:
    """The page's script time so far (Chrome's ScriptDuration), in s."""
    metrics = cdp.send("Performance.getMetrics")["metrics"]
    return float(
        next(item["value"] for item in metrics if item["name"] == "ScriptDuration")
    )


def count_slides(page: Page) -> int:
    """The slides drawn on the page, in all its frames."""
    return sum(frame.locator(".slidev-page").count() for frame in loaded_frames(page))


def wait_until_stable(page: Page, started: float) -> float:
    """Wait until the count of drawn slides holds for 1 s; return when it settled."""
    count, since = -1, time.monotonic()
    while time.monotonic() - started < 60:
        now_count = count_slides(page)
        if now_count != count:
            count, since = now_count, time.monotonic()
        elif count > 0 and time.monotonic() - since >= 1.0:
            break
        page.wait_for_timeout(100)
    return since - started


def measure(browser: Browser, base: str, name: str, path: str) -> dict[str, Any]:
    context = browser.new_context(viewport={"width": 1280, "height": 900})
    context.add_init_script(PROBE)
    page = context.new_page()
    warnings: list[str] = []

    def on_console(message: ConsoleMessage) -> None:
        if "WebGL" in message.text:
            warnings.append(message.text[:120])

    page.on("console", on_console)
    cdp = context.new_cdp_session(page)
    cdp.send("Network.enable")
    cdp.send("Performance.enable")
    network = {"requests": 0, "from_cache": 0, "bytes": 0}

    def on_request(_: object) -> None:
        network["requests"] += 1

    def on_cached(_: object) -> None:
        network["from_cache"] += 1

    def on_finished(event: dict[str, Any]) -> None:
        network["bytes"] += int(event["encodedDataLength"])

    cdp.on("Network.requestWillBeSent", on_request)
    cdp.on("Network.requestServedFromCache", on_cached)
    cdp.on("Network.loadingFinished", on_finished)

    started = time.monotonic()
    page.goto(f"{base}{path}", wait_until="load", timeout=120_000)
    ready_seconds = wait_until_stable(page, started)
    page.wait_for_timeout(4000)  # the stages start; the boards fetch their SVG
    script_before = script_seconds(cdp)
    intervals: list[float] = page.evaluate(FRAME_TIMES)
    script_during = script_seconds(cdp) - script_before
    page.evaluate("gc()")
    metrics = {
        item["name"]: item["value"]
        for item in cdp.send("Performance.getMetrics")["metrics"]
    }
    probes = [
        probe
        for frame in loaded_frames(page)
        if (probe := frame.evaluate("window.__probe ?? null"))
    ]
    slides_drawn = count_slides(page)
    context.close()

    intervals.sort()
    return {
        "layout": name,
        "path": path,
        "ready_seconds": round(ready_seconds, 2),
        "slides_drawn": slides_drawn,
        "requests": network["requests"],
        "requests_from_cache": network["from_cache"],
        "network_kb": round(network["bytes"] / 1024),
        "documents": int(metrics["Documents"]),
        "dom_nodes": int(metrics["Nodes"]),
        "js_heap_mb": round(metrics["JSHeapUsedSize"] / 2**20, 1),
        "webgl_contexts": sum(probe["contexts"] for probe in probes),
        "webgl_contexts_lost": sum(probe["lost"] for probe in probes),
        "static_upload_kb": round(sum(probe["staticBytes"] for probe in probes) / 1024),
        "dynamic_upload_kb_in_run": round(
            sum(probe["dynamicBytes"] for probe in probes) / 1024
        ),
        "frames_per_second": round(1000 * len(intervals) / sum(intervals), 1),
        "frame_p95_ms": round(intervals[int(0.95 * (len(intervals) - 1))], 1),
        "script_ms_per_frame": round(1000 * script_during / len(intervals), 2),
        "webgl_warnings": len(warnings),
        "renderer": next(
            (probe["renderer"] for probe in probes if probe["renderer"]), None
        ),
    }


def main() -> None:
    build = Path(sys.argv[1]).resolve()
    results = []
    with serve(build, PAGES) as base, sync_playwright() as playwright:
        browser = playwright.chromium.launch(channel="chromium", args=CHROMIUM_ARGS)
        for name, path in LAYOUTS:
            results.append(measure(browser, base, name, path))
            print(f"measured: {name}", file=sys.stderr)
        browser.close()
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
