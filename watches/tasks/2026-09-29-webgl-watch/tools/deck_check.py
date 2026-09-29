#!/usr/bin/env python3
"""The real talk (watches/slides.md) in browsers: frame gaps in visible
windows, the presenter view, the export, the overview and the opening.

    uv run tools/deck_check.py windows      # in this task's directory
    uv run tools/deck_check.py presenter export overview opening
    uv run tools/deck_check.py all

Run it with the talk's venv (`uv run` in watches/ finds it). It starts the
talk's own Slidev (`pnpm exec slidev`, in watches/) on PORT and stops it at
the end. WINDOWS, PRESENTER and OPENING open visible windows on this
computer: do not use the computer while they run.

Ported from the planning task's deck_check.py, for the two slides of the real
talk. The talk's first Slidev slide is hidden (see slides.md), so the cover is
where the browser lands.

WINDOWS. For each browser and window (laptop: the screen's own pixel ratio,
as large as the screen; projector: 1920 x 1080 at ratio 1), the cover and slide
2 wait SLIDE_SECONDS each. Every animation frame's gap is recorded, and the
stage's JS time. A gap over 25 ms is a lost frame even at 60 Hz. Also the
drawing size against the canvas size on the screen (gotcha 1).

PRESENTER. One window, two iframes: the presenter view and the audience view.
Counts the WebGL contexts of each frame.

EXPORT. What `slidev export` does, with this venv's Playwright Chromium
(headless, no GPU flags, so WebGL runs on SwiftShader): the /print route, the
`data-waitfor` waits, a PDF, and a picture of each page. Counts the contexts
and the pixels of the watch's line colour on each page.

OVERVIEW. /overview in headless Chromium: contexts, and stills drawn.

OPENING. From the cover: a key goes to slide 2 (zoom, fade, tilt), a key
settles the balance, a key back resumes it, a key goes back to the cover. Each
frame's gap and JS time are split by the stage's phase at that frame. A gap
over 12.5 ms is a missed frame at 120 Hz.

Writes evidence/deck_check-<part>.json and pictures in out/deck/.
"""

import contextlib
import json
import os
import pathlib
import signal
import statistics
import subprocess
import sys
import time
import urllib.request
from collections.abc import Iterator
from typing import Any

import numpy as np
from PIL import Image
from playwright.sync_api import (
    Browser,
    Frame,
    Page,
    Playwright,
    ViewportSize,
    sync_playwright,
)

TOOLS = pathlib.Path(__file__).resolve().parent
TASK = TOOLS.parent
TALK = TASK.parents[1]
OUT = TASK / "out" / "deck"
EVIDENCE = TASK / "evidence"
PORT = 3140
BASE = f"http://localhost:{PORT}"
SLIDE_SECONDS = 4.0
LOST_FRAME = 25.0  # ms
MISSED_AT_120 = 12.5  # ms: 1.5 frames at 120 Hz
LINE = (0x14, 0x3C, 0x6B)  # the watch's line colour
SLIDES = ["cover", "hairspring"]  # the talk's shown slides, in order
NATIVE = {"chromium": ["--window-size=1728,1117"], "firefox": ["-kiosk"]}
PROJECTOR: ViewportSize = {"width": 1920, "height": 1080}
COUNT_CONTEXTS = """(() => {
  const original = HTMLCanvasElement.prototype.getContext;
  window.__webglContexts = 0;
  window.__contextsLost = 0;
  HTMLCanvasElement.prototype.getContext = function (kind, ...rest) {
    const known = this.__counted;
    const context = original.call(this, kind, ...rest);
    if (context && String(kind).startsWith("webgl") && !known) {
      this.__counted = true;
      window.__webglContexts++;
      this.addEventListener("webglcontextlost", () => window.__contextsLost++);
    }
    return context;
  };
})()"""
RECORD = """() => {
  window.__gaps = [];
  let last = performance.now();
  function frame(now) {
    window.__gaps.push([now, now - last]);
    last = now;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}"""
STAGE = """() => {
  const stage = window.watchStage;
  return stage
    ? { starts: stage.log.starts, draws: stage.log.drawTimes,
        phases: stage.log.phases, sizes: stage.log.sizes,
        info: stage.renderer.info(),
        canvas: [stage.canvas.getBoundingClientRect().width,
                 stage.canvas.getBoundingClientRect().height,
                 stage.canvas.width, stage.canvas.height, devicePixelRatio] }
    : null;
}"""
NEXT_PANE_STILLS = (
    "[...document.querySelectorAll('.watch-still-image')]"
    ".filter(image => image.complete && image.naturalWidth > 0).length"
)


@contextlib.contextmanager
def deck_server(mode: str) -> Iterator[None]:
    """The talk on PORT: Slidev's dev server ("dev"), or the server that
    `slidev export` starts ("export", see export_server.mjs)."""
    OUT.mkdir(parents=True, exist_ok=True)
    log = (OUT / f"slidev-{mode}.log").open("w")
    command = (
        ["pnpm", "exec", "slidev", "--port", str(PORT)]
        if mode == "dev"
        else ["pnpm", "exec", "node", str(TOOLS / "export_server.mjs"), "slides.md", str(PORT)]
    )
    process = subprocess.Popen(
        command, cwd=TALK, stdout=log, stderr=subprocess.STDOUT, start_new_session=True
    )
    try:
        for _ in range(120):
            with (
                contextlib.suppress(OSError),
                urllib.request.urlopen(f"{BASE}/1", timeout=2) as response,
            ):
                if response.status == 200:
                    break
            time.sleep(1)
        else:
            raise RuntimeError("the talk did not start: see out/deck/slidev-*.log")
        yield
    finally:
        os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=30)
        log.close()


def gap_summary(gaps: list[float]) -> dict[str, object]:
    if not gaps:
        return {"frames": 0}
    return {
        "frames": len(gaps),
        "median gap ms": round(statistics.median(gaps), 2),
        "gaps over 25 ms": sum(1 for gap in gaps if gap > LOST_FRAME),
        "largest gap ms": round(max(gaps), 1),
    }


def draw_summary(draws: list[float]) -> dict[str, object]:
    if not draws:
        return {}
    ordered = sorted(draws)
    return {
        "JS per frame, median ms": round(statistics.median(ordered), 2),
        "JS per frame, 95th percentile ms": round(
            ordered[int(0.95 * (len(ordered) - 1))], 2
        ),
    }


def wait_for_stage(target: Page | Frame) -> None:
    target.wait_for_function(
        "window.watchStage && window.watchStage.log.starts.length > 30",
        timeout=60_000,
    )


def drawing_matches_canvas(stage: dict[str, Any]) -> bool:
    """The drawing's size in device px is the canvas's size on the screen (its
    bounding box, after the slide's scale)."""
    width, height, drawing_width, drawing_height, ratio = stage["canvas"]
    return (
        abs(drawing_width - width * ratio) <= 1
        and abs(drawing_height - height * ratio) <= 1
    )


def slide_rows(
    starts: list[float], gaps: list[list[float]], stage: dict[str, Any]
) -> list[dict[str, Any]]:
    rows = []
    for index, title in enumerate(SLIDES):
        start = starts[index]
        end = starts[index + 1] if index + 1 < len(starts) else float("inf")
        inside = [(now, gap) for now, gap in gaps if start < now <= end]
        draws = [
            draw
            for now, draw in zip(stage["starts"], stage["draws"], strict=True)
            if start < now <= end
        ]
        rows.append(
            {
                "slide": title,
                **gap_summary([gap for _, gap in inside]),
                "largest gap at ms after the change": round(
                    max(inside, default=(0.0, 0.0), key=lambda pair: pair[1])[0] - start
                ),
                **draw_summary(draws),
            }
        )
    return rows


def walk(page: Page, target: Page | Frame) -> list[float]:
    """Wait on the cover, press the key, wait on slide 2: the page time at
    the start of each slide."""
    marks = [float(target.evaluate("performance.now()"))]
    page.wait_for_timeout(SLIDE_SECONDS * 1000)
    marks.append(float(target.evaluate("performance.now()")))
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(SLIDE_SECONDS * 1000)
    return marks


def windows(playwright: Playwright) -> dict[str, object]:
    result: dict[str, object] = {}
    for name in ("chromium", "firefox"):
        for window in ("laptop", "projector"):
            browser: Browser = getattr(playwright, name).launch(
                headless=False, args=NATIVE[name] if window == "laptop" else []
            )
            if window == "laptop":
                page = browser.new_page(no_viewport=True)
            else:
                page = browser.new_page(viewport=PROJECTOR, device_scale_factor=1)
            page.add_init_script(COUNT_CONTEXTS)
            page.goto(f"{BASE}/1")
            wait_for_stage(page)
            page.wait_for_timeout(1000)
            page.evaluate(RECORD)
            marks = walk(page, page)
            stage = page.evaluate(STAGE)
            rows = slide_rows(marks, page.evaluate("window.__gaps"), stage)
            entry: dict[str, Any] = {
                "version": browser.version,
                "window": page.evaluate("[innerWidth, innerHeight, devicePixelRatio]"),
                "renderer": stage["info"],
                "webgl contexts": page.evaluate("window.__webglContexts"),
                "contexts lost": page.evaluate("window.__contextsLost"),
                "drawing size equals canvas size": drawing_matches_canvas(stage),
                "canvas on screen w, h (css px), drawing w, h (px), ratio": stage["canvas"],
                "slides": rows,
            }
            result[f"{name}, {window}"] = entry
            page.screenshot(path=str(OUT / f"window-{name}-{window}.png"))
            print(f"{name}, {window}", json.dumps(entry, indent=1))
            browser.close()
    return result


def two_frames() -> str:
    return f"""<!doctype html><style>
html, body {{ margin: 0; height: 100%; background: #333; }}
iframe {{ position: absolute; top: 0; width: 50%; height: 100%; border: 0; }}
#presenter {{ left: 0; }} #audience {{ left: 50%; }}
</style>
<iframe id="presenter" name="presenter" src="{BASE}/presenter/2"></iframe>
<iframe id="audience" name="audience" src="{BASE}/2"></iframe>"""


def frame_named(page: Page, name: str) -> Frame:
    for _ in range(120):
        for frame in page.frames:
            if frame.name == name and frame.url.startswith("http"):
                with contextlib.suppress(Exception):
                    if frame.evaluate("Boolean(window.watchStage)"):
                        return frame
        time.sleep(0.5)
    raise RuntimeError(f"no stage in the {name} frame")


def presenter(playwright: Playwright) -> dict[str, object]:
    result: dict[str, object] = {}
    for name in ("chromium", "firefox"):
        browser: Browser = getattr(playwright, name).launch(
            headless=False, args=NATIVE[name]
        )
        page = browser.new_page(no_viewport=True)
        page.add_init_script(COUNT_CONTEXTS)
        # Served as if from the talk's own origin: headed Chromium denies
        # localStorage to a third-party iframe, and Slidev then fails.
        body = two_frames()
        wrapper = f"{BASE}/two-views.html"
        page.route(
            wrapper, lambda route: route.fulfill(body=body, content_type="text/html")
        )
        page.goto(wrapper)
        frames = {
            "presenter": frame_named(page, "presenter"),
            "audience": frame_named(page, "audience"),
        }
        for frame in frames.values():
            wait_for_stage(frame)
        page.wait_for_timeout(4000)  # the presenter draws its stills in this time
        for frame in frames.values():
            frame.evaluate(RECORD)
        page.focus("#presenter")
        marks = {
            label: [float(frame.evaluate("performance.now()"))]
            for label, frame in frames.items()
        }
        page.wait_for_timeout(SLIDE_SECONDS * 1000)
        page.screenshot(path=str(OUT / f"presenter-{name}.png"))
        entry: dict[str, object] = {
            "next-pane stills drawn": frames["presenter"].evaluate(NEXT_PANE_STILLS)
        }
        for label, frame in frames.items():
            stage = frame.evaluate(STAGE)
            gaps = [gap for now, gap in frame.evaluate("window.__gaps") if now > marks[label][0]]
            entry[label] = {
                "webgl contexts": frame.evaluate("window.__webglContexts"),
                "contexts lost": frame.evaluate("window.__contextsLost"),
                "slide": frame.evaluate("location.pathname"),
                **gap_summary(gaps),
                "drawing size equals canvas size": drawing_matches_canvas(stage),
            }
        result[f"{name} {browser.version}"] = entry
        print(name, json.dumps(entry, indent=1))
        page.close()
        browser.close()
    return result


def line_pixels(picture: np.ndarray) -> int:
    """Pixels within 24 levels of the watch's line colour."""
    difference = np.abs(picture[:, :, :3].astype(int) - np.array(LINE)).max(axis=2)
    return int((difference <= 24).sum())


def export(playwright: Playwright) -> dict[str, object]:
    width, height, scale = 980, 551, 2  # canvasWidth, its aspect ratio, export scale
    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": width, "height": height * len(SLIDES)},
        device_scale_factor=scale,
    )
    page.add_init_script(COUNT_CONTEXTS)
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    started = time.perf_counter()
    page.goto(f"{BASE}/print?print=true", wait_until="networkidle", timeout=120_000)
    page.emulate_media(color_scheme="light", media="screen")
    page.locator("body").wait_for()
    loading = page.locator(".slidev-slide-loading")
    for index in range(loading.count()):
        loading.nth(index).wait_for(state="detached")
    waiting = page.locator("[data-waitfor]")
    for index in range(waiting.count()):
        element = waiting.nth(index)
        selector = element.get_attribute("data-waitfor")
        if selector:
            element.locator(selector).wait_for(state="visible", timeout=60_000)
    ready = time.perf_counter() - started
    page.pdf(
        path=str(OUT / "deck-export.pdf"),
        width=f"{width}px",
        height=f"{height}px",
        margin={"left": "0", "top": "0", "right": "0", "bottom": "0"},
        print_background=True,
        prefer_css_page_size=True,
    )
    containers = page.locator(".print-slide-container")
    pages = []
    for index in range(containers.count()):
        path = OUT / f"export-{index + 1:02}.png"
        containers.nth(index).screenshot(path=str(path))
        pages.append(
            {
                "page": index + 1,
                "line pixels": line_pixels(np.asarray(Image.open(path).convert("RGB"))),
            }
        )
    result = {
        "version": browser.version,
        "seconds until every still is drawn": round(ready, 1),
        "pages": containers.count(),
        "webgl contexts": page.evaluate("window.__webglContexts"),
        "contexts lost": page.evaluate("window.__contextsLost"),
        "pdf bytes": (OUT / "deck-export.pdf").stat().st_size,
        "page errors": errors,
        "pages detail": pages,
    }
    print(json.dumps(result, indent=1))
    browser.close()
    return result


def overview(playwright: Playwright) -> dict[str, object]:
    browser = playwright.chromium.launch(
        args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
    )
    page = browser.new_page(viewport={"width": 1400, "height": 900}, device_scale_factor=2)
    page.add_init_script(COUNT_CONTEXTS)
    page.goto(f"{BASE}/overview", wait_until="networkidle")
    page.wait_for_timeout(3000)
    result = {
        "webgl contexts": page.evaluate("window.__webglContexts"),
        "contexts lost": page.evaluate("window.__contextsLost"),
        "stills drawn": page.evaluate(NEXT_PANE_STILLS),
        "slides with the watch": len(SLIDES),
    }
    page.screenshot(path=str(OUT / "overview.png"), full_page=True)
    print(result)
    browser.close()
    return result


OPENING_STEPS = [  # (key, what it does, ms to wait after it)
    ("ArrowRight", "to slide 2: zoom, fade, tilt", 7000),
    ("ArrowRight", "click: settle", 3500),
    ("ArrowLeft", "click back: resume", 2500),
    ("ArrowLeft", "to the cover: untilt, unfade, zoom out", 6000),
]


def by_phase(stage: dict[str, Any], keys: list[float]) -> dict[str, object]:
    """The stage's frames by its phase at each frame. Gaps within 100 ms after
    a key press are also counted apart: there Slidev changes the slide."""
    starts, draws, phases = stage["starts"], stage["draws"], stage["phases"]
    groups: dict[str, dict[str, list[float]]] = {}
    for index in range(1, len(starts)):
        gap = starts[index] - starts[index - 1]
        near_key = any(0 <= starts[index] - key < 100 for key in keys)
        group = groups.setdefault(
            phases[index], {"gaps": [], "draws": [], "near key": [], "at": []}
        )
        group["gaps"].append(gap)
        group["draws"].append(draws[index])
        group["at"].append(starts[index] - keys[0])
        if near_key:
            group["near key"].append(gap)
    return {
        phase: {
            **gap_summary(group["gaps"]),
            "gaps over 12.5 ms": sum(1 for gap in group["gaps"] if gap > MISSED_AT_120),
            "gaps over 25 ms after the first key": sum(
                1
                for gap, at in zip(group["gaps"], group["at"], strict=True)
                if at >= 0 and gap > LOST_FRAME
            ),
            "gaps over 12.5 ms after the first key": sum(
                1
                for gap, at in zip(group["gaps"], group["at"], strict=True)
                if at >= 0 and gap > MISSED_AT_120
            ),
            "of them within 100 ms of a key press": sum(
                1 for gap in group["near key"] if gap > MISSED_AT_120
            ),
            "largest gap at s after the first key": round(
                max(zip(group["gaps"], group["at"], strict=True))[1] / 1000, 2
            ),
            **draw_summary(group["draws"]),
            "JS per frame, largest ms": round(max(group["draws"]), 2),
        }
        for phase, group in groups.items()
    }


def opening(playwright: Playwright) -> dict[str, object]:
    result: dict[str, object] = {}
    for name in ("chromium", "firefox"):
        for window in ("laptop", "projector"):
            browser: Browser = getattr(playwright, name).launch(
                headless=False, args=NATIVE[name] if window == "laptop" else []
            )
            if window == "laptop":
                page = browser.new_page(no_viewport=True)
            else:
                page = browser.new_page(viewport=PROJECTOR, device_scale_factor=1)
            page.add_init_script(COUNT_CONTEXTS)
            errors: list[str] = []
            page.on("pageerror", lambda error, errors=errors: errors.append(str(error)))
            loads: list[str] = []
            page.on("load", lambda loaded, loads=loads: loads.append(loaded.url))
            page.goto(f"{BASE}/1")
            wait_for_stage(page)
            page.wait_for_timeout(1500)
            keys: list[float] = []
            states = []
            for key, doing, wait in OPENING_STEPS:
                keys.append(float(page.evaluate("performance.now()")))
                page.keyboard.press(key)
                page.wait_for_timeout(wait)
                states.append(
                    {
                        "step": doing,
                        "slide": page.evaluate("location.pathname"),
                        "phase": page.evaluate(
                            "window.watchStage.phaseAt(performance.now())"
                        ),
                    }
                )
                if key == "ArrowRight":
                    page.screenshot(
                        path=str(OUT / f"opening-{name}-{window}-{len(keys)}.png")
                    )
            stage = page.evaluate(STAGE)
            entry: dict[str, Any] = {
                "version": browser.version,
                "window": page.evaluate("[innerWidth, innerHeight, devicePixelRatio]"),
                "renderer": stage["info"],
                "webgl contexts": page.evaluate("window.__webglContexts"),
                "contexts lost": page.evaluate("window.__contextsLost"),
                "page errors": [e for e in errors if "FloatingVue" not in e],
                "page loads": len(loads),
                "stage frames": len(stage["starts"]),
                "drawing size equals canvas size": drawing_matches_canvas(stage),
                "drawing sizes": [
                    [round((start - keys[0]) / 1000, 3), size]
                    for start, size in stage["sizes"]
                ],
                "after each step": states,
                "phases": by_phase(stage, keys),
            }
            result[f"{name}, {window}"] = entry
            print(f"{name}, {window}", json.dumps(entry, indent=1))
            browser.close()
    return result


PARTS = {
    "windows": (windows, "dev"),
    "presenter": (presenter, "dev"),
    "export": (export, "export"),
    "overview": (overview, "dev"),
    "opening": (opening, "dev"),
}


def main() -> None:
    chosen = sys.argv[1:] or ["all"]
    names = list(PARTS) if chosen == ["all"] else chosen
    EVIDENCE.mkdir(exist_ok=True)
    for name in names:
        part, mode = PARTS[name]
        with deck_server(mode), sync_playwright() as playwright:
            result = part(playwright)
        path = EVIDENCE / f"deck_check-{name}.json"
        path.write_text(json.dumps(result, indent=1) + "\n")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
