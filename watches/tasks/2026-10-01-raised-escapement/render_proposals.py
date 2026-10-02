"""Build the frozen proposal page and save browser renders. Run from watches/."""

from __future__ import annotations

import functools
import http.server
import json
import subprocess
import threading
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

TASK = Path(__file__).resolve().parent
TALK = TASK.parents[1]


def main() -> None:
    built = TASK / "site"
    subprocess.run(
        [
            "pnpm",
            "exec",
            "vite",
            "build",
            str(TASK / "prototype"),
            "--outDir",
            str(built),
            "--base",
            "./",
        ],
        cwd=TALK,
        check=True,
    )
    handler = functools.partial(
        http.server.SimpleHTTPRequestHandler, directory=str(built)
    )
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    evidence = TASK / "evidence"
    errors: list[str] = []
    measurements: dict[str, object] = {}
    try:
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page(
                viewport={"width": 980, "height": 460}, device_scale_factor=2
            )
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"http://127.0.0.1:{server.server_address[1]}/")
            page.wait_for_function("window.proposalReady")
            for proposal_index, name in enumerate(
                ("a-lowered", "b-raised", "c-stepped", "current")
            ):
                for tilt in (90, 75):
                    measurements[name] = page.evaluate(
                        "([index, tilt]) => window.proposalRender(index, tilt)",
                        [proposal_index, tilt],
                    )
                    page.locator("#card").screenshot(
                        path=str(evidence / f"{name}-{tilt}.png")
                    )
                    page.evaluate(
                        "([index, tilt]) => window.proposalRender(index, tilt, 0, true)",
                        [proposal_index, tilt],
                    )
                    page.locator("#card").screenshot(
                        path=str(evidence / f"{name}-full-{tilt}.png")
                    )
                for sample in range(49):
                    page.evaluate(
                        "([index,time]) => window.proposalRender(index, 75, time)",
                        [proposal_index, sample / 24],
                    )
                page.evaluate(
                    "index => window.proposalRender(index,75,1)", proposal_index
                )
                page.locator("#card").screenshot(
                    path=str(evidence / f"{name}-75-tock.png")
                )
            browser.close()
        if errors:
            raise RuntimeError(errors)
        measurements["browser_errors"] = errors
        measurements["motion_frames"] = 49 * 4
        (evidence / "heights.json").write_text(
            json.dumps(measurements, indent=2) + "\n"
        )
        sheet = Image.new("RGB", (3920, 2760), "#FAF7F0")
        for row, name in enumerate(("a-lowered", "b-raised", "c-stepped")):
            for column, tilt in enumerate((90, 75)):
                with Image.open(evidence / f"{name}-{tilt}.png") as panel:
                    sheet.paste(panel.convert("RGB"), (column * 1960, row * 920))
        sheet.save(evidence / "proposals.png")
    finally:
        server.shutdown()


if __name__ == "__main__":
    main()
