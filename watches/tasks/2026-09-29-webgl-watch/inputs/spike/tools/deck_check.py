#!/usr/bin/env python3
"""The WebGL watch in a real Slidev deck (../deck/): visible windows, the
presenter view, the export and the overview.

    uv run --project ../../.. python scene_export.py          # in tools/, first
    uv run --project ../../.. python deck_check.py windows    # or presenter, export, overview, opening, all

It starts the deck with the talk's own Slidev (`pnpm exec slidev`, in
watches/), on PORT, and stops it at the end. Visible windows open on this
laptop's screen. Writes ../evidence/deck_check-<part>.json and screenshots
in ../out/deck/.

WINDOWS. For each browser and window, it goes through the deck's slides
with the arrow key, SLIDE_SECONDS on each, and records every animation
frame's gap (requestAnimationFrame) and the stage's JS time per frame. A
gap over 25 ms is a lost frame even at 60 Hz. The plain slide (no watch)
is the baseline: the stage is stopped there. Windows:
- laptop: no emulation, the screen's devicePixelRatio (2), the window as
  large as the screen (Chromium: --window-size=1728,1117; Firefox: kiosk):
  full-screen Slidev on this laptop, as the zoom and canvas tasks did.
- projector: an emulated 1920 x 1080 viewport at devicePixelRatio 1.

PRESENTER. One visible window with two iframes side by side, as the canvas
task's C18 did: the presenter view (/presenter/1) on the left and the
audience view (/1) on the right. The arrow key goes to the presenter, and
Slidev moves both. Records the gaps in both frames, counts the WebGL
contexts each frame made, and screenshots the presenter view, whose "next"
pane should show a still of the next slide's watch.

EXPORT. Follows `slidev export` (Slidev 53, its export-*.mjs). When this was
written, the talk did not install playwright-chromium, which the command
needs, so this does the same steps with this venv's Playwright Chromium,
headless and without GPU flags
(so WebGL runs on SwiftShader, as a default headless export would): a
980 px wide viewport as tall as all the slides, deviceScaleFactor 2, the
/print?print=true route, networkidle, screen media, the waits for
.slidev-slide-loading and [data-waitfor], then page.pdf() and a screenshot
of each .print-slide-container. Checks that each slide with the watch has
the watch's line colour in it, and counts the WebGL contexts.

OVERVIEW. /overview in headless Chromium: the WebGL contexts, and the
stills drawn.

OPENING. The talk's first two slides (../deck/slides-opening.md), in the
windows above: the cover; a key press goes to slide 2, where the camera
zooms to the hairspring, the rest of the watch fades, and the camera tilts;
a key press settles the balance at its next extreme; then back again, a key
press at a time. Each frame's gap and JS time are split by the stage's phase
at that frame (its channels "view", "rest" (the fade: two pictures a
frame), "tilt"; "balance waiting", "balance settling", "balance rest",
"balance resuming"; "idle").
A gap over 12.5 ms is a missed frame at 120 Hz.

OPENING-FRAMES. The same sequence in headless Chromium (GPU), with a
screenshot at each of FRAME_TIMES, for the figure: screenshots stall the
page, so they are not taken in the timed runs.
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
DECK = TASK / "deck" / "slides.md"
OPENING = TASK / "deck" / "slides-opening.md"
OUT = TASK / "out" / "deck"
EVIDENCE = TASK / "evidence"
PORT = 3140
BASE = f"http://localhost:{PORT}"
SLIDE_SECONDS = 3.0
LOST_FRAME = 25.0  # ms
MISSED_AT_120 = 12.5  # ms: 1.5 frames at 120 Hz
LINE = (0x14, 0x3C, 0x6B)  # the watch's line colour
SLIDES = [  # (title, has the watch), in the deck's order
    ("cover", True),
    ("hairspring", True),
    ("hairspring, tilted 45", True),
    ("cover, 60", True),
    ("crown", True),
    ("crown, 45", True),
    ("plain", False),
    ("cover, 30", True),
    ("cover, 85", True),
    ("hairspring, 75", True),
    ("cover again", True),
]
NATIVE = {"chromium": ["--window-size=1728,1117"], "firefox": ["-kiosk"]}
PROJECTOR: ViewportSize = {"width": 1920, "height": 1080}
# Count the WebGL contexts that each page or frame makes.
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
# Record every animation frame's gap from now on, into window.__gaps.
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
    ? { starts: stage.frameStarts, draws: stage.drawTimes, phases: stage.framePhases,
        sizes: stage.frameSizes, info: stage.renderer.info() }
    : null;
}"""


# ---- the dev server ------------------------------------------------------------------
@contextlib.contextmanager
def deck_server(mode: str, entry: pathlib.Path) -> Iterator[None]:
    """The deck `entry` on PORT: Slidev's dev server ("dev"), or the server
    that `slidev export` starts ("export", see export_server.mjs)."""
    OUT.mkdir(parents=True, exist_ok=True)
    log = (OUT / f"slidev-{mode}.log").open("w")
    deck = str(entry.relative_to(TALK))
    command = (
        ["pnpm", "exec", "slidev", deck, "--port", str(PORT)]
        if mode == "dev"
        else ["pnpm", "exec", "node", str(TOOLS / "export_server.mjs"), deck, str(PORT)]
    )
    process = subprocess.Popen(
        command,
        cwd=TALK,
        stdout=log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
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
            raise RuntimeError("the deck did not start: see out/deck/slidev.log")
        yield
    finally:
        os.killpg(process.pid, signal.SIGTERM)
        process.wait(timeout=30)
        log.close()


# ---- measures ------------------------------------------------------------------------
Row = dict[str, Any]  # one slide's measures, as JSON


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
        "JS per frame, median ms": round(statistics.median(draws), 2),
        "JS per frame, 95th percentile ms": round(
            ordered[int(0.95 * (len(ordered) - 1))], 2
        ),
    }


def by_slide(
    marks: list[float], gaps: list[list[float]], stage: dict[str, Any] | None
) -> list[Row]:
    """Split the recorded frames at the slide changes (`marks`, page time)."""
    rows = []
    for index, (title, watched) in enumerate(SLIDES):
        start = marks[index]
        end = marks[index + 1] if index + 1 < len(marks) else float("inf")
        chosen = [gap for now, gap in gaps if start < now <= end]
        worst_at = max(
            ((gap, now - start) for now, gap in gaps if start < now <= end),
            default=(0.0, 0.0),
        )[1]
        draws = []
        if stage is not None:
            draws = [
                draw
                for now, draw in zip(stage["starts"], stage["draws"], strict=True)
                if start < now <= end
            ]
        rows.append(
            {
                "largest gap at ms after the change": round(worst_at),
                "slide": index + 1,
                "title": title,
                "watch": watched,
                **gap_summary(chosen),
                **draw_summary(draws),
            }
        )
    return rows


def totals(rows: list[Row]) -> dict[str, object]:
    watched = [row for row in rows if row["watch"]]
    return {
        "gaps over 25 ms, slides with the watch": sum(
            int(row.get("gaps over 25 ms", 0)) for row in watched
        ),
        "largest gap ms, slides with the watch": max(
            float(row.get("largest gap ms", 0)) for row in watched
        ),
        "median gap ms, plain slide": next(
            row.get("median gap ms") for row in rows if not row["watch"]
        ),
    }


def walk(page: Page, target: Page | Frame) -> list[float]:
    """Go through every slide by the arrow key; return the page time of
    each slide's start, from `target`."""
    marks = [float(target.evaluate("performance.now()"))]
    for _ in SLIDES[1:]:
        page.wait_for_timeout(SLIDE_SECONDS * 1000)
        marks.append(float(target.evaluate("performance.now()")))
        page.keyboard.press("ArrowRight")
    page.wait_for_timeout(SLIDE_SECONDS * 1000)
    return marks


def wait_for_stage(target: Page | Frame) -> None:
    target.wait_for_function(
        "window.watchStage && window.watchStage.frameStarts.length > 30", timeout=60_000
    )


# ---- 1. visible windows --------------------------------------------------------------
def windows(playwright: Playwright) -> dict[str, object]:
    result: dict[str, object] = {}
    for name in ("chromium", "firefox"):
        for window in ("laptop", "projector"):
            launcher = getattr(playwright, name)
            browser: Browser = launcher.launch(
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
            gaps = page.evaluate("window.__gaps")
            stage = page.evaluate(STAGE)
            rows = by_slide(marks, gaps, stage)
            label = f"{name}, {window}"
            entry: dict[str, Any] = {
                "version": browser.version,
                "window": page.evaluate("[innerWidth, innerHeight, devicePixelRatio]"),
                "renderer": stage["info"] if stage else None,
                "webgl contexts": page.evaluate("window.__webglContexts"),
                "contexts lost": page.evaluate("window.__contextsLost"),
                **totals(rows),
                "slides": rows,
            }
            result[label] = entry
            page.screenshot(path=str(OUT / f"window-{name}-{window}.png"))
            print(
                label, {key: value for key, value in entry.items() if key != "slides"}
            )
            browser.close()
    return result


# ---- 2. the presenter view -----------------------------------------------------------
STILLS = {"eager": "", "lazy": "?stills=lazy"}  # when the presenter draws its stills


def two_frames(query: str) -> str:
    return f"""<!doctype html><style>
html, body {{ margin: 0; height: 100%; background: #333; }}
iframe {{ position: absolute; top: 0; width: 50%; height: 100%; border: 0; }}
#presenter {{ left: 0; }} #audience {{ left: 50%; }}
</style>
<iframe id="presenter" name="presenter" src="{BASE}/presenter/1{query}"></iframe>
<iframe id="audience" name="audience" src="{BASE}/1"></iframe>"""


WRAPPER = f"{BASE}/two-views.html"
NEXT_PANE_STILLS = (
    "[...document.querySelectorAll('.watch-still-image')]"
    ".filter(image => image.complete && image.naturalWidth > 0).length"
)


def frame_named(page: Page, name: str) -> Frame:
    for _ in range(120):
        for frame in page.frames:
            if frame.name == name and frame.url.startswith("http"):
                with contextlib.suppress(Exception):
                    if frame.evaluate("Boolean(window.watchStage)"):
                        return frame
        time.sleep(0.5)
    raise RuntimeError(f"no stage in the {name} frame")


def presenter_run(browser: Browser, name: str, variant: str) -> dict[str, object]:
    page = browser.new_page(no_viewport=True)
    page.add_init_script(COUNT_CONTEXTS)
    # Served as if from the deck's own origin: headed Chromium denies
    # localStorage to a third-party iframe, and Slidev then fails (the
    # canvas task's presenter_check.py found this).
    body = two_frames(STILLS[variant])
    page.route(
        WRAPPER, lambda route: route.fulfill(body=body, content_type="text/html")
    )
    page.goto(WRAPPER)
    frames = {
        "presenter": frame_named(page, "presenter"),
        "audience": frame_named(page, "audience"),
    }
    for frame in frames.values():
        wait_for_stage(frame)
    page.wait_for_timeout(3000)  # the eager stills are drawn in this time
    for frame in frames.values():
        frame.evaluate(RECORD)
    page.focus("#presenter")
    marks = {
        label: [float(frame.evaluate("performance.now()"))]
        for label, frame in frames.items()
    }
    next_pane = None
    for index in range(1, len(SLIDES)):
        page.wait_for_timeout(SLIDE_SECONDS * 1000)
        if index == 3:
            page.screenshot(path=str(OUT / f"presenter-{name}-{variant}-slide-3.png"))
            next_pane = frames["presenter"].evaluate(NEXT_PANE_STILLS)
        for label, frame in frames.items():
            marks[label].append(float(frame.evaluate("performance.now()")))
        page.keyboard.press("ArrowRight")
    page.wait_for_timeout(SLIDE_SECONDS * 1000)
    entry: dict[str, object] = {"next-pane stills on slide 3": next_pane}
    for label, frame in frames.items():
        rows = by_slide(
            marks[label], frame.evaluate("window.__gaps"), frame.evaluate(STAGE)
        )
        entry[label] = {
            "webgl contexts": frame.evaluate("window.__webglContexts"),
            "contexts lost": frame.evaluate("window.__contextsLost"),
            "slide reached": frame.evaluate("location.pathname"),
            **totals(rows),
            "slides": rows,
        }
    page.close()
    return entry


def presenter(playwright: Playwright) -> dict[str, object]:
    result: dict[str, object] = {}
    for name in ("chromium", "firefox"):
        browser: Browser = getattr(playwright, name).launch(
            headless=False, args=NATIVE[name]
        )
        for variant in STILLS:
            entry = presenter_run(browser, name, variant)
            label = f"{name} {browser.version}, stills {variant}"
            result[label] = entry
            print(
                label,
                {
                    key: (
                        {k: v for k, v in value.items() if k != "slides"}
                        if isinstance(value, dict)
                        else value
                    )
                    for key, value in entry.items()
                },
            )
        browser.close()
    return result


# ---- 3. the export -------------------------------------------------------------------
def line_pixels(picture: np.ndarray) -> int:
    """Pixels within 24 levels of the watch's line colour."""
    difference = np.abs(picture[:, :, :3].astype(int) - np.array(LINE)).max(axis=2)
    return int((difference <= 24).sum())


def export(playwright: Playwright) -> dict[str, object]:
    width, height, scale = (
        980,
        551,
        2,
    )  # canvasWidth, / aspect ratio, export's default scale
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
        count = line_pixels(np.asarray(Image.open(path).convert("RGB")))
        title, watched = SLIDES[index]
        pages.append(
            {"slide": index + 1, "title": title, "watch": watched, "line pixels": count}
        )
    renderer = page.evaluate(
        "() => { const gl = document.createElement('canvas').getContext('webgl2');"
        " const d = gl.getExtension('WEBGL_debug_renderer_info');"
        " return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER); }"
    )
    result = {
        "version": browser.version,
        "renderer": renderer,
        "seconds until every still is drawn": round(ready, 1),
        "seconds in all": round(time.perf_counter() - started, 1),
        "pages": containers.count(),
        "webgl contexts": page.evaluate("window.__webglContexts")
        - 1,  # less the one just made
        "contexts lost": page.evaluate("window.__contextsLost"),
        "pdf bytes": (OUT / "deck-export.pdf").stat().st_size,
        "page errors": errors,
        "slides": pages,
    }
    print({key: value for key, value in result.items() if key != "slides"})
    for row in pages:
        print(row)
    browser.close()
    return result


# ---- 4. the overview -----------------------------------------------------------------
def overview(playwright: Playwright) -> dict[str, object]:
    browser = playwright.chromium.launch(
        args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
    )
    page = browser.new_page(
        viewport={"width": 1400, "height": 900}, device_scale_factor=2
    )
    page.add_init_script(COUNT_CONTEXTS)
    page.goto(f"{BASE}/overview", wait_until="networkidle")
    page.wait_for_timeout(3000)
    result = {
        "webgl contexts": page.evaluate("window.__webglContexts"),
        "contexts lost": page.evaluate("window.__contextsLost"),
        "stills drawn": page.evaluate(
            "[...document.querySelectorAll('.watch-still-image')].filter(image => image.complete && image.naturalWidth > 0).length"
        ),
        "slides with the watch": sum(1 for _, watched in SLIDES if watched),
    }
    page.screenshot(path=str(OUT / "overview.png"), full_page=True)
    print(result)
    browser.close()
    return result


# ---- 5. the opening: zoom, fade, tilt, settle ---------------------------------------
OPENING_STEPS = [  # (key, what it does, ms to wait after it)
    ("ArrowRight", "to slide 2: zoom, fade, tilt", 7000),
    ("ArrowRight", "click: settle", 3500),
    ("ArrowLeft", "click back: resume", 2500),
    ("ArrowLeft", "to slide 1: untilt, unfade, zoom out", 6000),
]


def by_phase(stage: dict[str, Any], keys: list[float]) -> dict[str, object]:
    """The stage's frames, by its phase at each frame: gaps and JS time.
    Gaps within 100 ms after a key press are also counted apart: there
    Slidev changes the slide or the click, not the stage."""
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


def page_errors(page: Page) -> list[str]:
    """The page's errors from now on, as they come."""
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    return errors


def page_loads(page: Page) -> list[str]:
    """The URLs that the page loads from now on, as they come."""
    loads: list[str] = []
    page.on("load", lambda loaded: loads.append(loaded.url))
    return loads


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
            errors = page_errors(page)
            loads = page_loads(page)
            page.goto(f"{BASE}/1")
            wait_for_stage(page)
            page.wait_for_timeout(1500)
            keys = []
            states = []
            for key, doing, wait in OPENING_STEPS:
                keys.append(float(page.evaluate("performance.now()")))
                page.keyboard.press(key)
                page.wait_for_timeout(wait)
                states.append(
                    {
                        "step": doing,
                        "slide": page.evaluate("location.pathname"),
                        "balance": page.evaluate("window.watchStage.balance.mode.name"),
                    }
                )
                if key == "ArrowRight":
                    page.screenshot(
                        path=str(OUT / f"opening-{name}-{window}-{len(keys)}.png")
                    )
            stage = page.evaluate(STAGE)
            label = f"{name}, {window}"
            entry: dict[str, Any] = {
                "version": browser.version,
                "window": page.evaluate("[innerWidth, innerHeight, devicePixelRatio]"),
                "renderer": stage["info"],
                "webgl contexts": page.evaluate("window.__webglContexts"),
                "contexts lost": page.evaluate("window.__contextsLost"),
                "page errors": [
                    error for error in errors if "FloatingVue" not in error
                ],
                # 1 load, and a whole run of frames: else the run was disturbed
                "page loads": len(loads),
                "stage frames": len(stage["starts"]),
                # the drawing's size in device px, and when it changed (s after
                # the first key)
                "drawing sizes": [
                    [round((start - keys[0]) / 1000, 3), size]
                    for start, size in stage["sizes"]
                ],
                "after each step": states,
                "phases": by_phase(stage, keys),
            }
            result[label] = entry
            print(label, json.dumps(entry, indent=1))
            browser.close()
    return result


FRAME_TIMES = [  # (key, then screenshots at ms after it, with their labels)
    ("", [(0, "the cover")]),
    (
        "ArrowRight",
        [
            (600, "zooming, the title fading"),
            (1800, "zoomed"),
            (2250, "the rest fading"),
            (2700, "the spring and the stud"),
            (3400, "tilting"),
            (5500, "tilted, swinging"),
        ],
    ),
    ("ArrowRight", [(3000, "settled at rest")]),
]


def opening_frames(playwright: Playwright) -> dict[str, object]:
    browser = playwright.chromium.launch(
        args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
    )
    page = browser.new_page(
        viewport={"width": 980, "height": 552}, device_scale_factor=2
    )
    page.goto(f"{BASE}/1")
    wait_for_stage(page)
    page.wait_for_timeout(1500)
    frames: list[dict[str, object]] = []
    for key, moments in FRAME_TIMES:
        pressed = float(page.evaluate("performance.now()"))
        if key:
            page.keyboard.press(key)
        for at, label in moments:
            waited = float(page.evaluate("performance.now()")) - pressed
            page.wait_for_timeout(max(0.0, at - waited))
            path = OUT / f"opening-frame-{len(frames) + 1:02}.png"
            actual = float(page.evaluate("performance.now()")) - pressed
            page.screenshot(path=str(path))
            frames.append(
                {"file": path.name, "label": label, "ms after the key": round(actual)}
            )
    browser.close()
    print(frames)
    return {"frames": frames}


PARTS = {
    "windows": windows,
    "presenter": presenter,
    "export": export,
    "overview": overview,
    "opening": opening,
    "opening-frames": opening_frames,
}
SERVER = {
    "windows": ("dev", DECK),
    "presenter": ("dev", DECK),
    "export": ("export", DECK),
    "overview": ("dev", DECK),
    "opening": ("dev", OPENING),
    "opening-frames": ("dev", OPENING),
}


def main() -> None:
    chosen = sys.argv[1:] or ["all"]
    names = list(PARTS) if chosen == ["all"] else chosen
    EVIDENCE.mkdir(exist_ok=True)
    for name in names:
        mode, entry = SERVER[name]
        with deck_server(mode, entry), sync_playwright() as playwright:
            result = PARTS[name](playwright)
        path = EVIDENCE / f"deck_check-{name}.json"
        path.write_text(json.dumps(result, indent=1) + "\n")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
