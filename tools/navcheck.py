#!/usr/bin/env python3
"""Walk a deck forward and back, and check that going back needs no work.

    uv run tools/navcheck.py /tmp/deck                     # a build (`slidev build --out`)
    uv run tools/navcheck.py http://localhost:3030         # a running dev server

Diagnostic only: run this tool when a navigation problem is found or suspected.
No validation mode runs it. Do not run it routinely.

The rules are in docs/navigation.md. The deck must define `window.slideState()`,
which returns `{settled, continuous, busy}` (docs/navigation.md, "Diagnostic: exhaustive navigation").
Without --offline, a deck without it passes with a note. With --offline,
a deck without it receives the ordinary rapid offline walk.

The walk presses the right arrow from slide 1 to the end of the deck, then the
left arrow back to slide 1. After each press it samples `slideState()` every
frame until the move ends: nothing is `busy` and no number has changed for
QUIET_MS. Then it loads each place (slide and click) directly. It fails if:

- a place's `settled` after a move differs from its `settled` after a direct
  load (rule 0: the settled screen depends only on the slide and the click);
- a `continuous` number leaves the range between its value before the press
  and its value at the end (it jumps out and comes back: a flash);
- a `continuous` number covers more than CUT_SHARE of its change by the first
  frame after the press, when that frame comes within CUT_WINDOW_MS (a cut).
  A later first frame cannot tell a cut from a fast fade: the check says so,
  and does not fail;
- a move does not end within MOVE_TIMEOUT_MS, or the page throws an error.

A build is served from disk with every outside request aborted.
With --offline, a separate rapid walk retains offline_check.py's viewport,
500 ms cadence, and startup delay. It must move and end.
The same browser runs both walks; page errors and outside requests fail both. This remains a diagnostic command; validation uses smokecheck.py.
"""

import argparse
import asyncio
import itertools
import pathlib
import urllib.parse
from dataclasses import dataclass
from typing import Any

import browsers
from offline_check import (
    DEFAULT_WALK_LIMITS,
    HOST,
    OFFLINE_SIZE,
    WalkLimits,
    serve_build,
    walk,
)
from playwright.async_api import Page, async_playwright
from playwright.async_api import TimeoutError as PlaywrightTimeoutError

# A move has ended when nothing is busy and no number has changed for this long.
QUIET_MS = 600
MOVE_TIMEOUT_MS = 15_000
# The first frame after a press may cover at most this share of a change...
CUT_SHARE = 0.6
# ...if it comes this soon after the press. The fastest fade here is 0.3 s:
# 120 ms into it (0.4 of its time), a cubic ease-in-out has covered
# 4 * 0.4^3, about 0.26 of it, and a CSS `ease` about 0.5. A cut has covered all.
CUT_WINDOW_MS = 120
# A number is unchanged within this share of its size (at least 1).
TOLERANCE = 0.02

# Record when each key goes down, before Slidev sees it.
PRESS_JS = """window.addEventListener('keydown',
  () => { window.__navPress = performance.now(); }, { capture: true });"""
# Sample every frame until the move ends. With `pressed`, wait for a press
# first (Playwright sends the key after this starts).
SAMPLE_JS = """async ({ pressed, quiet, timeout, token }) => {
  if (!window.slideState) return null;
  const start = performance.now();
  window.__navSampler = token;
  const samples = [];
  let last = null;
  let since = start;
  for (;;) {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const now = performance.now();
    const state = window.slideState();
    samples.push({ t: now, continuous: state.continuous });
    const key = JSON.stringify([state.settled, state.continuous]);
    if (key !== last || state.busy) since = now;
    last = key;
    const press = window.__navPress ?? -Infinity;
    const after = !pressed || press >= start;
    if (after && now - since >= quiet)
      return { samples, settled: state.settled, press, timedOut: false };
    if (now - start >= timeout)
      return { samples, settled: state.settled, press, timedOut: true };
  }
}"""


@dataclass(frozen=True)
class Sample:
    time: float
    values: dict[str, float]


@dataclass(frozen=True)
class Move:
    """One press, from one place to the next, and what the screen did."""

    start: str
    end: str
    key: str
    press: float
    samples: list[Sample]
    settled: dict[str, Any]
    timed_out: bool


def place_of(url: str) -> str:
    """'2:3' for slide 2 at click 3."""
    parsed = urllib.parse.urlparse(url)
    slide = parsed.path.strip("/").split("/")[-1] or "1"
    clicks = urllib.parse.parse_qs(parsed.query).get("clicks", ["0"])[0]
    return f"{slide}:{clicks}"


def rounded(settled: dict[str, Any]) -> dict[str, Any]:
    return {
        name: round(value, 3) if isinstance(value, float) else value
        for name, value in settled.items()
    }


def move_problems(move: Move) -> tuple[list[str], list[str]]:
    """The failures and the notes for one move."""
    problems: list[str] = []
    notes: list[str] = []
    label = f"{move.start} -> {move.end} ({move.key})"
    if move.timed_out:
        problems.append(f"{label}: did not end within {MOVE_TIMEOUT_MS} ms")
    before = [sample for sample in move.samples if sample.time < move.press]
    after = [sample for sample in move.samples if sample.time >= move.press]
    if not before or not after:
        notes.append(f"{label}: no frame before or after the press")
        return problems, notes
    first, last = before[-1].values, after[-1].values
    for name, start in first.items():
        end = last.get(name, start)
        tolerance = TOLERANCE * max(1.0, abs(start), abs(end))
        low, high = min(start, end) - tolerance, max(start, end) + tolerance
        outside = [s for s in after if not low <= s.values.get(name, end) <= high]
        if outside:
            worst = outside[0].values[name]
            problems.append(
                f"{label}: {name} went to {worst:.2f} on its way from "
                f"{start:.2f} to {end:.2f}"
            )
            continue
        change = abs(end - start)
        if change <= tolerance:
            continue
        early = after[0]
        covered = abs(early.values.get(name, end) - start) / change
        if covered > CUT_SHARE:
            delay = early.time - move.press
            text = (
                f"{label}: {name} went from {start:.2f} to {end:.2f} with "
                f"{covered:.0%} of it in the first frame, {delay:.0f} ms after the press"
            )
            if delay <= CUT_WINDOW_MS:
                problems.append(text + " (a cut)")
            else:
                notes.append(text + ": the frame came too late to tell")
    return problems, notes


async def sample(page: Page, pressed: bool, token: int = 0) -> dict[str, Any] | None:
    result: dict[str, Any] | None = await page.evaluate(
        SAMPLE_JS,
        {
            "pressed": pressed,
            "quiet": QUIET_MS,
            "timeout": MOVE_TIMEOUT_MS,
            "token": token,
        },
    )
    return result


async def press(page: Page, key: str, token: int) -> Move | None:
    """Press `key`, and return the move it made, or None if the URL did not
    change (the end of the deck). `token` is new for each press."""
    start = page.url
    sampling = asyncio.ensure_future(sample(page, pressed=True, token=token))
    # the sampler must run before the key goes down: Playwright does not keep
    # the order of an evaluate and a key press
    await page.wait_for_function(f"window.__navSampler === {token}")
    await page.wait_for_timeout(100)  # frames before the press
    await page.keyboard.press(key)
    result = await sampling
    if result is not None and result["timedOut"] and page.url == start:
        raise PlaywrightTimeoutError("The key press did not produce a settled page.")
    if result is None or page.url == start:
        return None
    return Move(
        start=place_of(start),
        end=place_of(page.url),
        key=key,
        press=float(result["press"]),
        samples=[
            Sample(
                float(item["t"]), {k: float(v) for k, v in item["continuous"].items()}
            )
            for item in result["samples"]
        ],
        settled=rounded(result["settled"]),
        timed_out=bool(result["timedOut"]),
    )


async def main(
    arguments: argparse.Namespace, limits: WalkLimits = DEFAULT_WALK_LIMITS
) -> int:
    target: str = arguments.deck
    base = target.rstrip("/") if target.startswith("http") else f"http://{HOST}"
    blocked: list[str] = []
    problems: list[str] = []
    notes: list[str] = []
    async with async_playwright() as playwright:
        browser_type = browsers.select(playwright, arguments.browser)
        browsers.install(browser_type)
        browser = await browser_type.launch()
        page = await browser.new_page(viewport={"width": 980, "height": 552})
        if not target.startswith("http"):
            await serve_build(page, pathlib.Path(target), blocked)
        await page.add_init_script(PRESS_JS)
        # Headless browsers cannot acquire a screen wake lock. Supply that
        # browser service so real page errors remain failures.
        await page.add_init_script("""Object.defineProperty(navigator, 'wakeLock', {
            value: {request: async type => {
                if (type !== 'screen') throw new TypeError('Invalid wake-lock type');
                return {released: false, release: async () => {},
                    addEventListener() {}, removeEventListener() {}};
            }}
        });""")

        def page_error(error: Exception) -> None:
            problems.append(f"page error: {error}")

        page.on("pageerror", page_error)

        async def load(place: str) -> dict[str, Any] | None:
            slide, clicks = place.split(":")
            query = "" if clicks == "0" else f"?clicks={clicks}"
            await page.goto(f"{base}/{slide}{query}")
            await page.wait_for_selector(
                ".slidev-layout", state="visible", timeout=limits.ready_timeout_ms
            )
            return await sample(page, pressed=False)

        async def rapid_walk() -> None:
            # Retain the original offline check's viewport and 500 ms cadence.
            # These presses can interrupt animations; settled navigation cannot.
            await page.set_viewport_size(
                {"width": OFFLINE_SIZE[0], "height": OFFLINE_SIZE[1]}
            )
            await page.goto(f"{base}/1")
            await page.wait_for_selector(
                ".slidev-layout", state="visible", timeout=limits.ready_timeout_ms
            )
            steps = await walk(page, problems, limits)
            print(f"rapid offline walk: {len(steps)} positions", flush=True)

        moves: list[Move] = []
        direct: dict[str, dict[str, Any]] = {}
        try:
            first = await load("1:0")
            if first is None:
                if arguments.offline:
                    await rapid_walk()
                else:
                    print(
                        "navcheck: the deck has no window.slideState(): nothing to check"
                    )
            else:
                if first["timedOut"]:
                    problems.append("slide 1 did not settle within the move timeout")
                tokens = itertools.count(1)
                for key in ("ArrowRight", "ArrowLeft"):
                    for _ in range(limits.steps - 1):
                        move = await press(page, key, token=next(tokens))
                        if move is None:
                            break
                        moves.append(move)
                        seconds = (move.samples[-1].time - move.press) / 1000
                        late = " (did not end)" if move.timed_out else ""
                        print(
                            f"  {move.start} -> {move.end}: {seconds:.1f} s{late}",
                            flush=True,
                        )
                    else:
                        problems.append(
                            f"{key}: the walk did not end within {limits.steps} steps"
                        )
                if arguments.offline and not any(
                    move.key == "ArrowRight" for move in moves
                ):
                    problems.append("the walk did not move from slide 1")
                if moves and place_of(page.url) != "1:0":
                    problems.append("the backward walk did not return to slide 1")
                for place in dict.fromkeys(move.end for move in moves):
                    loaded = await load(place)
                    if loaded is None or loaded["timedOut"]:
                        problems.append(
                            f"{place}: direct load did not return a settled state"
                        )
                    else:
                        direct[place] = rounded(loaded["settled"])
                if arguments.offline:
                    await rapid_walk()
        except PlaywrightTimeoutError as error:
            problems.append(f"deck readiness or navigation timed out: {error}")
        finally:
            await browser.close()

    for move in moves:
        found, noted = move_problems(move)
        problems += found
        notes += noted
        wanted = direct.get(move.end)
        if wanted is not None and wanted != move.settled:
            differ = sorted(
                name
                for name in wanted.keys() | move.settled.keys()
                if wanted.get(name) != move.settled.get(name)
            )
            problems.append(
                f"{move.start} -> {move.end} ({move.key}): ends unlike a direct load of "
                + move.end
                + "; "
                + ", ".join(
                    f"{name} {move.settled.get(name)!r}, not {wanted.get(name)!r}"
                    for name in differ
                )
            )
    forward = sum(move.key == "ArrowRight" for move in moves)
    print(f"navcheck: {forward} moves forward, {len(moves) - forward} back")
    for note in notes:
        print("note", note)
    print(f"outside requests: {len(blocked)}")
    for url_text in blocked:
        print("blocked", url_text)
    for problem in problems:
        print("FAIL", problem)
    return 1 if problems or blocked else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("--browser", choices=browsers.NAMES, default="chromium")
    parser.add_argument(
        "deck", help="the directory `slidev build --out` wrote, or a dev server's URL"
    )
    parser.add_argument(
        "--offline",
        action="store_true",
        help="also require startup and a complete offline walk; fall back if no state probe exists",
    )
    raise SystemExit(asyncio.run(main(parser.parse_args())))
