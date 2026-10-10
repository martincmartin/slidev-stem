#!/usr/bin/env python3
"""Check a built deck with a fast forward smoke walk.

    uv run tools/smokecheck.py /tmp/deck
    uv run tools/smokecheck.py /tmp/deck --browser firefox
    uv run tools/smokecheck.py /tmp/deck --browser webkit --no-canvas-readback

Full validation uses this check in Chromium, Firefox, and WebKit, with
--no-canvas-readback. Each walk uses a fresh non-persistent context.
Chromium draws WebGL on the GPU (browsers.CHROMIUM_GPU), as Chrome does.
This is an incognito-like session, not a reproduction of every privacy policy.
Quick validation has no browser walk.
The Ledger theme supplies window.slideNavigation(), as specified in
docs/navigation.md. Each press must reach its declared next position.
The walk must reach the declared last slide and its final click.
Page errors, outside requests, missing navigation metadata, and stalls fail.
This does not test animation continuity, backward states, or direct loads.
Use navcheck.py only to investigate a suspected navigation problem.
"""

import argparse
import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import browsers
from offline_check import HOST, OFFLINE_SIZE, serve_build
from playwright.async_api import Page, async_playwright
from playwright.async_api import TimeoutError as PlaywrightTimeoutError


@dataclass(frozen=True)
class SmokeLimits:
    ready_timeout_ms: int = 15_000
    move_timeout_ms: int = 2000
    startup_ms: int = 1500
    visit_ms: int = 100
    positions: int = 1000

    def __post_init__(self) -> None:
        if min(self.ready_timeout_ms, self.move_timeout_ms, self.positions) < 1:
            raise ValueError("Smoke deadlines and position limit must be positive.")
        if min(self.startup_ms, self.visit_ms) < 0:
            raise ValueError("Smoke observation periods must be nonnegative.")


DEFAULT_LIMITS = SmokeLimits()


@dataclass(frozen=True)
class Position:
    slide: int
    click: int


@dataclass(frozen=True)
class Navigation:
    position: Position
    next_position: Position | None
    last_slide: int
    clicks_total: int


async def navigation(page: Page) -> Navigation:
    data: dict[str, Any] = await page.evaluate("window.slideNavigation()")
    position = Position(int(data["slide"]), int(data["click"]))
    next_data = data["next"]
    next_position = (
        None
        if next_data is None
        else Position(int(next_data["slide"]), int(next_data["click"]))
    )
    last_slide, clicks_total = int(data["lastSlide"]), int(data["clicksTotal"])
    if (
        position.slide < 1
        or position.click < 0
        or last_slide < position.slide
        or clicks_total < position.click
    ):
        raise ValueError("The deck reported invalid navigation metadata.")
    return Navigation(position, next_position, last_slide, clicks_total)


async def walk(page: Page, limits: SmokeLimits) -> list[Position]:
    await page.wait_for_timeout(limits.startup_ms)
    state = await navigation(page)
    if state.position != Position(1, 0):
        raise ValueError("The smoke walk did not start at slide 1, click 0.")
    last_slide = state.last_slide
    positions = [state.position]
    while state.next_position is not None:
        if len(positions) >= limits.positions:
            raise ValueError(f"The smoke walk exceeded {limits.positions} positions.")
        target = state.next_position
        if target in positions:
            raise ValueError("The deck declared a repeated position.")
        await page.keyboard.press("ArrowRight")
        await page.wait_for_url(
            f"http://{HOST}/{target.slide}"
            + (f"?clicks={target.click}" if target.click else ""),
            timeout=limits.move_timeout_ms,
        )
        await page.wait_for_timeout(limits.visit_ms)
        state = await navigation(page)
        if state.position != target or state.last_slide != last_slide:
            raise ValueError("The deck did not reach its declared next position.")
        positions.append(state.position)
    if state.position != Position(last_slide, state.clicks_total):
        raise ValueError("The smoke walk stopped before the declared final position.")
    return positions


async def check(
    deck: Path,
    engine: str,
    limits: SmokeLimits = DEFAULT_LIMITS,
    *,
    no_canvas_readback: bool = False,
) -> int:
    problems: list[str] = []
    blocked: list[str] = []
    async with async_playwright() as playwright:
        browser_type = browsers.select(playwright, engine)
        browsers.install(browser_type)
        browser = await browser_type.launch(args=browsers.launch_args(engine))
        try:
            # A new non-persistent context is an incognito-like session.
            context = await browser.new_context(
                viewport={"width": OFFLINE_SIZE[0], "height": OFFLINE_SIZE[1]}
            )
            if no_canvas_readback:
                await context.add_init_script("""
                    CanvasRenderingContext2D.prototype.getImageData = function() {
                        throw new Error('Canvas pixel read blocked by the privacy check');
                    };
                """)
            page = await context.new_page()
            await serve_build(page, deck, blocked)
            page.on("pageerror", lambda error: problems.append(f"Page error: {error}"))
            try:
                await page.goto(f"http://{HOST}/1", timeout=limits.ready_timeout_ms)
                await page.wait_for_selector(
                    ".slidev-layout", state="visible", timeout=limits.ready_timeout_ms
                )
                await page.wait_for_function(
                    "typeof window.slideNavigation === 'function'",
                    timeout=limits.ready_timeout_ms,
                )
                positions = await walk(page, limits)
                final = positions[-1]
                print(
                    f"Browser: {engine}; fresh non-persistent context; canvas reads blocked: {no_canvas_readback}"
                )
                print(
                    f"Smoke walk: {len(positions)} positions; final {final.slide}:{final.click}"
                )
            except (PlaywrightTimeoutError, ValueError, KeyError, TypeError) as error:
                problems.append(f"Smoke navigation failed: {error}")
        finally:
            await browser.close()
    print(f"Outside requests: {len(blocked)}")
    for url in blocked:
        print(f"FAIL outside request: {url}")
    for problem in problems:
        print(f"FAIL {problem}")
    return 1 if blocked or problems else 0


async def check_all(deck: Path, *, no_canvas_readback: bool = False) -> int:
    """Walk all supported engines at once, with the same per-engine checks."""
    results = await asyncio.gather(
        *(
            check(deck, engine, no_canvas_readback=no_canvas_readback)
            for engine in browsers.NAMES
        )
    )
    return int(any(results))


def main() -> int:
    parser = argparse.ArgumentParser(
        description=__doc__.split("\n")[0] if __doc__ else "Smoke navigation"
    )
    parser.add_argument("deck", type=Path)
    parser.add_argument(
        "--browser", choices=(*browsers.NAMES, "all"), default="chromium"
    )
    parser.add_argument(
        "--no-canvas-readback",
        action="store_true",
        help="block 2D canvas pixel reads to check compatibility with privacy protection",
    )
    arguments = parser.parse_args()
    if not (arguments.deck / "index.html").is_file():
        parser.error("The deck has no index.html. Build it first.")
    if arguments.browser == "all":
        return asyncio.run(
            check_all(
                arguments.deck,
                no_canvas_readback=arguments.no_canvas_readback,
            )
        )
    return asyncio.run(
        check(
            arguments.deck,
            arguments.browser,
            no_canvas_readback=arguments.no_canvas_readback,
        )
    )


if __name__ == "__main__":
    raise SystemExit(main())
