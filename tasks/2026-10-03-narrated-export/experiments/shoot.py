"""Screenshots and checks of the narration prototype, for PLAN.md.

Run in the task directory, with the experiment deck's dev server running
(README.md says how):

    uv run --project ../.. experiments/shoot.py http://localhost:3131 out/shots

It writes PNGs to the output directory and prints one JSON object of
measurements.
"""

import json
import sys
import time
from pathlib import Path

from playwright.sync_api import ConsoleMessage, Page, sync_playwright

WIDE = {"width": 1920, "height": 1080}  # 16:9 monitor: panel at the right
LAPTOP = {"width": 1512, "height": 982}  # 14-inch MacBook Pro: panel below
PHONE = {"width": 390, "height": 844}  # iPhone 14/15: panel below


def settle(page: Page, seconds: float) -> None:
    page.wait_for_timeout(seconds * 1000)


def shoot(page: Page, base: str, out: Path, name: str, path: str) -> None:
    page.goto(f"{base}{path}")
    if "narration" in path:
        page.wait_for_selector(".narration-part.current")
    settle(page, 2.5)  # the panel's smooth scroll, and the slide's own moves
    page.screenshot(path=out / f"{name}.png")


def scroll_test(page: Page, base: str) -> dict[str, object]:
    """Scroll the panel by wheel until the diving board's part is on the reading line."""
    page.goto(f"{base}/1?narration")
    page.wait_for_selector(".narration-part.current")
    settle(page, 1.5)
    target = page.locator('[data-no="2"][data-clicks="1"]')
    panel = page.locator(".narration-panel")
    box = panel.bounding_box()
    assert box is not None
    page.mouse.move(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
    steps = 0
    while steps < 60:
        top = target.evaluate("element => element.getBoundingClientRect().top")
        line = box["y"] + box["height"] * 0.3
        if top <= line:
            break
        page.mouse.wheel(0, 80)
        steps += 1
        page.wait_for_timeout(30)
    page.wait_for_url("**/2?*clicks=1*", timeout=5000)
    return {
        "wheel_steps": steps,
        "url_after_scroll": page.url.removeprefix(base),
    }


def article(page: Page, base: str, out: Path) -> dict[str, object]:
    started = time.monotonic()
    page.goto(f"{base}/article")
    page.wait_for_selector(".article-figure")
    page.wait_for_load_state("networkidle")
    stills = page.locator(".watch-still-image")
    for index in range(stills.count()):
        stills.nth(index).wait_for(state="visible")
    loaded = round(time.monotonic() - started, 2)
    page.screenshot(path=out / "article-full.png", full_page=True)
    # As `slidev export` does: print with the screen's styles. Lay the page
    # out at the paper's printable width (Letter less 0.5 in margins), so the
    # figures' scale, which the page measures, holds on paper.
    page.emulate_media(media="screen")
    page.set_viewport_size({"width": 720, "height": 900})
    page.wait_for_timeout(500)
    page.pdf(path=out / "article.pdf", print_background=True, prefer_css_page_size=True)
    return {
        "article_url": page.url.removeprefix(base),
        "article_figures": page.locator(".article-figure").count(),
        "article_seconds_to_load": loaded,
        "article_height_px": page.evaluate("document.documentElement.scrollHeight"),
        "article_webgl_canvases": page.locator("canvas").count(),
        "article_pdf_bytes": (out / "article.pdf").stat().st_size,
    }


def main() -> None:
    base, out = sys.argv[1], Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    errors: list[str] = []

    def on_console(message: ConsoleMessage) -> None:
        if message.type == "error":
            errors.append(message.text[:200])

    results: dict[str, object] = {}
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        for name, viewport, path in [
            ("wide-slide2-click0", WIDE, "/2?narration"),
            ("wide-slide2-click1", WIDE, "/2?narration&clicks=1"),
            ("wide-slide3-click3", WIDE, "/3?narration&clicks=3"),
            ("laptop-slide2-click2", LAPTOP, "/2?narration&clicks=2"),
            ("phone-slide3-click2", PHONE, "/3?narration&clicks=2"),
            ("plain-slide2-click1", WIDE, "/2?clicks=1"),
        ]:
            page = browser.new_page(viewport=viewport)  # type: ignore[arg-type]
            page.on("console", on_console)
            shoot(page, base, out, name, path)
            page.close()
        page = browser.new_page(viewport=WIDE)  # type: ignore[arg-type]
        page.on("console", on_console)
        results.update(scroll_test(page, base))
        page.close()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        page.on("console", on_console)
        results.update(article(page, base, out))
        page.close()
        browser.close()
    results["console_errors"] = sorted(set(errors))
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()
