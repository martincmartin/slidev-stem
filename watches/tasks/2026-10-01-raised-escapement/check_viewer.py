"""Check the interactive viewer in Chromium and Firefox. Run from watches/."""

from __future__ import annotations

import json
from pathlib import Path

from playwright.sync_api import sync_playwright

TASK = Path(__file__).resolve().parent


def main() -> None:
    results: dict[str, object] = {}
    with sync_playwright() as playwright:
        for browser_type in (playwright.chromium, playwright.firefox):
            browser = browser_type.launch()
            page = browser.new_page(viewport={"width": 1440, "height": 1000})
            errors: list[str] = []
            page.on(
                "pageerror",
                lambda error, captured_errors=errors: captured_errors.append(
                    str(error)
                ),
            )
            page.goto((TASK / "viewer.html").as_uri())
            page.wait_for_function("window.viewerReady === true")
            canvas = page.locator("canvas")
            page.wait_for_timeout(100)
            initial = canvas.screenshot()
            canvas.click()
            page.keyboard.down("d")
            page.wait_for_timeout(300)
            page.keyboard.up("d")
            panned = canvas.screenshot()
            assert panned != initial, "WASD did not change the image"
            page.locator("#reset").click()
            page.wait_for_timeout(100)
            reset = canvas.screenshot()
            assert reset == initial, "Reset did not restore the view"
            box = canvas.bounding_box()
            assert box is not None
            page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            page.mouse.wheel(0, -300)
            page.wait_for_timeout(100)
            assert canvas.screenshot() != reset, "Wheel zoom did not change the image"
            assert float(page.locator("#zoom").input_value()) > 4.3
            page.mouse.down()
            page.mouse.move(
                box["x"] + box["width"] / 2 + 100, box["y"] + box["height"] / 2 + 50
            )
            page.mouse.up()
            dragged = canvas.screenshot()
            page.locator("#reset").click()
            page.wait_for_timeout(100)
            assert canvas.screenshot() != dragged, "Drag did not change the image"
            for model in ("0", "1", "2", "3"):
                page.locator("#model").select_option(model)
                for button, expected in (
                    ("#top", "0"),
                    ("#almost", "75"),
                    ("#side", "90"),
                ):
                    page.locator(button).click()
                    page.wait_for_timeout(50)
                    assert page.locator("#tilt").input_value() == expected
                page.locator("#almost").click()
                page.locator("#tick").click()
                page.wait_for_timeout(50)
                tick = canvas.screenshot()
                page.locator("#tock").click()
                page.wait_for_timeout(50)
                assert canvas.screenshot() != tick, "Stopped states are identical"
            page.locator("#model").select_option("1")
            page.locator("#tick").click()
            page.locator("#reset").click()
            page.locator("#full").check()
            page.wait_for_timeout(50)
            page.locator("#full").uncheck()
            page.locator("#highlight").uncheck()
            page.wait_for_timeout(50)
            page.locator("#highlight").check()
            page.locator("#play").click()
            page.wait_for_timeout(150)
            moving = canvas.screenshot()
            page.wait_for_timeout(150)
            assert canvas.screenshot() != moving, "Playback did not move"
            page.locator("#tick").click()
            assert page.locator("#play").get_attribute("aria-pressed") == "false"
            page.set_viewport_size({"width": 720, "height": 900})
            page.wait_for_timeout(150)
            assert page.locator("#error").inner_text() == ""
            page.set_viewport_size({"width": 1440, "height": 1000})
            page.wait_for_timeout(150)
            page.screenshot(
                path=str(TASK / "evidence" / f"viewer-{browser_type.name}.png")
            )
            assert errors == [], errors
            results[browser_type.name] = {"controls": "passed", "page_errors": errors}
            browser.close()
    (TASK / "evidence" / "viewer-checks.json").write_text(
        json.dumps(results, indent=2) + "\n"
    )


if __name__ == "__main__":
    main()
