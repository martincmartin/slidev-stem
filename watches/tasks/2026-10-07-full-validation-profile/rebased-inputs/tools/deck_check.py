#!/usr/bin/env python3
"""A talk with live WebGL art, in browsers: frame gaps in visible windows,
the presenter view, the export, the overview and the opening.

    uv run tools/deck_check.py TALK --slides cover,hairspring windows
    uv run tools/deck_check.py watches --slides cover,hairspring presenter export overview opening
    uv run tools/deck_check.py watches --slides cover,hairspring all       # in stem/

TALK is the talk's directory (`watches`). `--slides` names the talk's shown
slides, in order, with commas (Slidev leaves hidden slides out of its
numbering): only the names and the count are used. The talk must follow
docs/webgl.md: `window.watchStage` (a webgl/stage.ts `Stage`), the class
`watch-still-image` on each still, and `data-waitfor` on a page that draws one.
It starts the talk's own Slidev (`pnpm exec slidev`, in the talk) on --port and
stops it at the end. WINDOWS, PRESENTER and OPENING open visible windows on
this computer: **do not use the computer while they run.** The output goes to
`--out` (default TALK/out/deck-check): JSON files and pictures.

`OPENING_STEPS` is the sequence of `opening`, for a talk whose first two
slides are a cover and a slide that zooms, fades, tilts and settles a balance
(the `watches` talk's). Edit it for another talk.

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

OPENING. From the cover: a key goes to the Hairspring slide (zoom, fade, tilt), a key
settles the balance, a key back resumes it, a key goes back to the cover. Each
frame's gap and JS time are split by the stage's phase at that frame. A gap
over 12.5 ms is a missed frame at 120 Hz.

Writes deck_check-<part>.json and pictures.
"""

import argparse
import contextlib
import json
import os
import pathlib
import signal
import statistics
import subprocess
import time
import urllib.request
from collections.abc import Iterator
from dataclasses import dataclass
from typing import Any

import lib
import numpy as np
from PIL import Image
from playwright.sync_api import (
    Browser,
    Error,
    Frame,
    Page,
    Playwright,
    ViewportSize,
    sync_playwright,
)

SLIDE_SECONDS = 4.0
LOST_FRAME = 25.0  # ms
MISSED_AT_120 = 12.5  # ms: 1.5 frames at 120 Hz
_LINE = lib.LEDGER["subject"]
LINE = (_LINE.red, _LINE.green, _LINE.blue)  # the art's line colour
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


@dataclass(frozen=True)
class Deck:
    """The talk under test."""

    talk: pathlib.Path
    slides: list[str]
    port: int
    out: pathlib.Path

    @property
    def base(self) -> str:
        return f"http://localhost:{self.port}"


# `slidev export` starts Slidev in "export" mode, which turns on the /print
# route. It needs playwright-chromium, so the export part runs its own steps.
# As `node --eval`, the import resolves from the talk's directory.
EXPORT_SERVER = """
import { createServer, resolveOptions } from '@slidev/cli'
const [entry, port] = process.argv.slice(1)
const options = await resolveOptions({ entry }, 'export')
const server = await createServer(options, { server: { port: Number(port) }, clearScreen: false })
await server.listen(Number(port))
"""


@contextlib.contextmanager
def deck_server(mode: str, deck: Deck) -> Iterator[None]:
    """The talk on its port: Slidev's dev server ("dev"), or the server that
    `slidev export` starts ("export", see EXPORT_SERVER)."""
    deck.out.mkdir(parents=True, exist_ok=True)
    log = (deck.out / f"slidev-{mode}.log").open("w")
    command = (
        ["pnpm", "exec", "slidev", "--port", str(deck.port)]
        if mode == "dev"
        else [
            "pnpm",
            "exec",
            "node",
            "--input-type=module",
            "--eval",
            EXPORT_SERVER,
            "slides.md",
            str(deck.port),
        ]
    )
    process = subprocess.Popen(
        command,
        cwd=deck.talk,
        stdout=log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    try:
        for _ in range(120):
            with (
                contextlib.suppress(OSError),
                urllib.request.urlopen(f"{deck.base}/1", timeout=2) as response,
            ):
                if response.status == 200:
                    break
            time.sleep(1)
        else:
            raise RuntimeError("the talk did not start: see slidev-*.log in --out")
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
    return bool(
        abs(drawing_width - width * ratio) <= 1
        and abs(drawing_height - height * ratio) <= 1
    )


def slide_rows(
    deck: Deck,
    starts: list[float],
    gaps: list[list[float]],
    stage: dict[str, Any],
) -> list[dict[str, Any]]:
    rows = []
    for index, title in enumerate(deck.slides):
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
    """Wait on the cover, press the key, wait on the Hairspring slide: the page time at
    the start of each slide."""
    marks = [float(target.evaluate("performance.now()"))]
    page.wait_for_timeout(SLIDE_SECONDS * 1000)
    marks.append(float(target.evaluate("performance.now()")))
    page.keyboard.press("ArrowRight")
    page.wait_for_timeout(SLIDE_SECONDS * 1000)
    return marks


def windows(playwright: Playwright, deck: Deck) -> dict[str, object]:
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
            page.goto(f"{deck.base}/1")
            wait_for_stage(page)
            page.wait_for_timeout(1000)
            page.evaluate(RECORD)
            marks = walk(page, page)
            stage = page.evaluate(STAGE)
            rows = slide_rows(deck, marks, page.evaluate("window.__gaps"), stage)
            entry: dict[str, Any] = {
                "version": browser.version,
                "window": page.evaluate("[innerWidth, innerHeight, devicePixelRatio]"),
                "renderer": stage["info"],
                "webgl contexts": page.evaluate("window.__webglContexts"),
                "contexts lost": page.evaluate("window.__contextsLost"),
                "drawing size equals canvas size": drawing_matches_canvas(stage),
                "canvas on screen w, h (css px), drawing w, h (px), ratio": stage[
                    "canvas"
                ],
                "slides": rows,
            }
            result[f"{name}, {window}"] = entry
            page.screenshot(path=str(deck.out / f"window-{name}-{window}.png"))
            print(f"{name}, {window}", json.dumps(entry, indent=1))
            browser.close()
    return result


def two_frames(deck: Deck) -> str:
    return f"""<!doctype html><style>
html, body {{ margin: 0; height: 100%; background: #333; }}
iframe {{ position: absolute; top: 0; width: 50%; height: 100%; border: 0; }}
#presenter {{ left: 0; }} #audience {{ left: 50%; }}
</style>
<iframe id="presenter" name="presenter" src="{deck.base}/presenter/{len(deck.slides)}"></iframe>
<iframe id="audience" name="audience" src="{deck.base}/{len(deck.slides)}"></iframe>"""


def frame_named(page: Page, name: str) -> Frame:
    for _ in range(120):
        for frame in page.frames:
            if frame.name == name and frame.url.startswith("http"):
                with contextlib.suppress(Exception):
                    if frame.evaluate("Boolean(window.watchStage)"):
                        return frame
        time.sleep(0.5)
    raise RuntimeError(f"no stage in the {name} frame")


def presenter(playwright: Playwright, deck: Deck) -> dict[str, object]:
    result: dict[str, object] = {}
    body = two_frames(deck)
    for name in ("chromium", "firefox"):
        browser: Browser = getattr(playwright, name).launch(
            headless=False, args=NATIVE[name]
        )
        page = browser.new_page(no_viewport=True)
        page.add_init_script(COUNT_CONTEXTS)
        # Served as if from the talk's own origin: headed Chromium denies
        # localStorage to a third-party iframe, and Slidev then fails.
        wrapper = f"{deck.base}/two-views.html"
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
        page.screenshot(path=str(deck.out / f"presenter-{name}.png"))
        entry: dict[str, object] = {
            "next-pane stills drawn": frames["presenter"].evaluate(NEXT_PANE_STILLS)
        }
        for label, frame in frames.items():
            stage = frame.evaluate(STAGE)
            gaps = [
                gap
                for now, gap in frame.evaluate("window.__gaps")
                if now > marks[label][0]
            ]
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


def export(playwright: Playwright, deck: Deck) -> dict[str, object]:
    width, height, scale = 980, 551, 2  # canvasWidth, its aspect ratio, export scale
    browser = playwright.chromium.launch()
    page = browser.new_page(
        viewport={"width": width, "height": height * len(deck.slides)},
        device_scale_factor=scale,
    )
    page.add_init_script(COUNT_CONTEXTS)
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    started = time.perf_counter()
    page.goto(
        f"{deck.base}/print?print=true", wait_until="networkidle", timeout=120_000
    )
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
        path=str(deck.out / "deck-export.pdf"),
        width=f"{width}px",
        height=f"{height}px",
        margin={"left": "0", "top": "0", "right": "0", "bottom": "0"},
        print_background=True,
        prefer_css_page_size=True,
    )
    containers = page.locator(".print-slide-container")
    pages = []
    for index in range(containers.count()):
        path = deck.out / f"export-{index + 1:02}.png"
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
        "pdf bytes": (deck.out / "deck-export.pdf").stat().st_size,
        "page errors": errors,
        "pages detail": pages,
    }
    print(json.dumps(result, indent=1))
    browser.close()
    return result


def overview(playwright: Playwright, deck: Deck) -> dict[str, object]:
    browser = playwright.chromium.launch(
        args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"]
    )
    page = browser.new_page(
        viewport={"width": 1400, "height": 900}, device_scale_factor=2
    )
    page.add_init_script(COUNT_CONTEXTS)
    page.goto(f"{deck.base}/overview", wait_until="networkidle")
    page.wait_for_timeout(3000)
    result = {
        "webgl contexts": page.evaluate("window.__webglContexts"),
        "contexts lost": page.evaluate("window.__contextsLost"),
        "stills drawn": page.evaluate(NEXT_PANE_STILLS),
        "slides with the watch": len(deck.slides),
    }
    page.screenshot(path=str(deck.out / "overview.png"), full_page=True)
    print(result)
    browser.close()
    return result


OPENING_STEPS = [  # (key, what it does, ms to wait after it)
    ("ArrowRight", "to the Hairspring slide: zoom, fade, tilt", 7000),
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


def record_errors_and_loads(page: Page) -> tuple[list[str], list[str]]:
    """The page's errors and loads from now on, as they come."""
    errors: list[str] = []
    loads: list[str] = []

    def add_error(error: Error) -> None:
        errors.append(str(error))

    def add_load(loaded: Page) -> None:
        loads.append(loaded.url)

    page.on("pageerror", add_error)
    page.on("load", add_load)
    return errors, loads


def opening(playwright: Playwright, deck: Deck) -> dict[str, object]:
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
            errors, loads = record_errors_and_loads(page)
            page.goto(f"{deck.base}/1")
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
                        path=str(deck.out / f"opening-{name}-{window}-{len(keys)}.png")
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
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("talk", type=pathlib.Path, help="the talk's directory")
    parser.add_argument(
        "--slides", required=True, help="the shown slides' names, in order, with commas"
    )
    parser.add_argument("--port", type=int, default=3140)
    parser.add_argument("--out", type=pathlib.Path, default=None)
    parser.add_argument("parts", nargs="+", choices=[*PARTS, "all"])
    arguments = parser.parse_args()
    talk = arguments.talk.resolve()
    deck = Deck(
        talk=talk,
        slides=arguments.slides.split(","),
        port=arguments.port,
        out=(arguments.out or talk / "out" / "deck-check").resolve(),
    )
    names = list(PARTS) if "all" in arguments.parts else arguments.parts
    for name in names:
        part, mode = PARTS[name]
        with deck_server(mode, deck), sync_playwright() as playwright:
            result = part(playwright, deck)
        path = deck.out / f"deck_check-{name}.json"
        path.write_text(json.dumps(result, indent=1) + "\n")
        print(f"wrote {path}")


if __name__ == "__main__":
    main()
