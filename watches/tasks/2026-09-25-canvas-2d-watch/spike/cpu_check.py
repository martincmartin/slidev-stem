#!/usr/bin/env python3
"""C19: how much CPU does the watch cost on the cover, where it animates all
talk long? For the canvas deck, the canvas deck with erase, the zoom task's
SVG deck (which still uses non-scaling-stroke), and the test page's best SVG
and canvas at host 1.7 (the fair pair), in visible full-screen Firefox and
Chromium windows: the CPU
time that all of the browser's processes used in 30 s, from `ps`, as cores
(1.0 = one core busy). GPU time is not measured. Writes ../out/cpu.json.

    ../../../../node_modules/.bin/slidev slides.md --port 3132   # in deck/
    ../../../../.venv/bin/python3 cpu_check.py http://localhost:3132 http://localhost:3131 \
        http://127.0.0.1:8001      # the canvas deck, the SVG deck, this site/
"""

import json
import subprocess
import sys
import time
from pathlib import Path

from frame_gaps import IDLE, GapSummary
from headed_check import NATIVE_ARGS, settle
from playwright.sync_api import sync_playwright
from spike_browser import OUT

SECONDS = 30
# Loaded: the canvas deck's stage, the test page's hooks, or the SVG deck's
# inline SVG.
READY = "() => window.watchStage || window.spike || document.querySelector('.watch-layer svg')"


def cpu_seconds(app: Path) -> float:
    """The CPU time used so far by every process whose command is in `app`."""
    listing = subprocess.run(
        ["ps", "-A", "-o", "time=,command="], capture_output=True, text=True, check=True
    ).stdout
    total = 0.0
    for line in listing.splitlines():
        used, _, command = line.strip().partition(" ")
        if command.startswith(str(app)):
            *hours, minutes, seconds = used.split(":")
            total += (
                float(seconds)
                + 60 * float(minutes)
                + 3600 * float(hours[0] if hours else 0)
            )
    return total


def app_of(executable: str) -> Path:
    """The .app bundle (or directory) that holds a browser's executable."""
    path = Path(executable)
    for parent in path.parents:
        if parent.suffix == ".app":
            return parent
    return path.parent


def main() -> None:
    canvas, svg, site = sys.argv[1], sys.argv[2], sys.argv[3]
    page_query = (
        f"{site}/zoom.html?mode=js&ease=linear&fadelater=1&stroke=compensated&host=1.7"
    )
    decks = {
        "canvas deck": f"{canvas}/1",
        "canvas deck, erase": f"{canvas}/1?clips=erase",
        "SVG deck (zoom task)": f"{svg}/1",
        "test page, SVG": f"{page_query}&renderer=svg",
        "test page, canvas": f"{page_query}&renderer=canvas",
    }
    results: dict[str, dict[str, object]] = {}
    with sync_playwright() as playwright:
        for kind in (playwright.firefox, playwright.chromium):
            app = app_of(kind.executable_path)
            for deck, url in decks.items():
                browser = kind.launch(headless=False, args=NATIVE_ARGS[kind.name])
                page = browser.new_page(no_viewport=True)
                page.goto(url)
                page.wait_for_function(READY)
                window = settle(page)
                page.wait_for_timeout(5000)
                start, before = time.monotonic(), cpu_seconds(app)
                page.wait_for_timeout(SECONDS * 1000 - 2000)
                gaps = GapSummary.of([float(gap) for gap in page.evaluate(IDLE)])
                cores = (cpu_seconds(app) - before) / (time.monotonic() - start)
                name = f"{kind.name} {browser.version}, window {window}, {deck}"
                results[name] = {"cores": round(cores, 2), "last_240_frames": str(gaps)}
                print(f"{name}: {cores:.2f} cores; last 240 frames: {gaps}")
                browser.close()
    (OUT / "cpu.json").write_text(json.dumps(results, indent=1) + "\n")


if __name__ == "__main__":
    main()
