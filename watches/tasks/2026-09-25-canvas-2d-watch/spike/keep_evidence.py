#!/usr/bin/env python3
"""Copy what INVESTIGATION.md and README.md cite from ../out/ (tool output,
not committed) to ../evidence/ (committed), as the talk's .gitignore asks:
every JSON result and log, and the images named in CITED.

    ../../../../.venv/bin/python3 keep_evidence.py      # in spike/
"""

import shutil
from pathlib import Path

from spike_browser import OUT

EVIDENCE = OUT.parent / "evidence"
CITED = (
    "pixels/sheet-chromium.png",
    "pixels/sheet-firefox.png",
    "pixels/sheet-control.png",
    "fade/chromium-at1-opacity0.5.png",
    "fade/chromium-at1-opacity0.5-diff.png",
    "fade/firefox-at1-opacity0.5.png",
    "mid-zoom/chromium-svg-running.png",
    "mid-zoom/chromium-canvas-running.png",
    "mid-zoom/firefox-svg-running.png",
    "mid-zoom/firefox-canvas-running.png",
    "mid-zoom/chromium-svg-css-paused-end.png",
    "superseded/mid-zoom-c12/chromium-svg-running.png",
    "superseded/mid-zoom-c12/chromium-canvas-running.png",
    "superseded/mid-zoom-c12/firefox-svg-running.png",
    "superseded/mid-zoom-c12/firefox-canvas-running.png",
    "screen-sharpness/chromium-svg-css-paused-end-detail.png",
    "screen-sharpness/chromium-svg-css-no-will-change-paused-end-detail.png",
    "screen-sharpness/firefox-svg-paused-detail.png",
    "screen-sharpness/firefox-canvas-paused-detail.png",
    "deck/firefox-1280-1.png",
    "deck/chromium-1920-2.png",
    "views/firefox-presenter-1.png",
    "views/firefox-overview.png",
    "views/firefox-export-all.png",
    "views/chromium-print-print-all.png",
    "superseded/pixels-erase-translucent/firefox-t0.5-at0.35-dpr1-diff.png",
    "superseded/watch_player-with-limits.js",
)


def main() -> None:
    kept: list[Path] = [
        path.relative_to(OUT)
        for pattern in ("**/*.json", "**/*.log")
        for path in OUT.glob(pattern)
    ]
    kept += [Path(name) for name in CITED]
    for name in sorted(kept):
        target = EVIDENCE / name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(OUT / name, target)
    print(f"{len(kept)} files in {EVIDENCE}")


if __name__ == "__main__":
    main()
