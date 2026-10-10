#!/usr/bin/env python3
"""Does each printed page show the watch that the live slide shows at that click?

    uv run art/print_check.py DECK_DIR      # also `pnpm art:print DECK_DIR`
    uv run art/print_check.py DECK_DIR --browser firefox    # or webkit

DECK_DIR is the built deck (`pnpm build --out DECK_DIR`). An export has one page
for each click (`slidev export --with-clicks`), and a page's still must be the
live slide's watch at the same click. The two layers write the state that they
show in a `data-watch` attribute: the live canvas (global-bottom.vue) and the
still (slide-bottom.vue). First this steps through the live deck with the right
arrow, as the viewer does, and records the state at each slide and click. Then
it loads each slide in print mode at each click (`/N?print=clicks&clicks=C`,
the address that `slidev export --format png --with-clicks` opens), in
PRINTED_PAGES browsers at once, and fails if a printed state differs from the
live one. It compares states, not pixels: the live watch swings, and the still
draws one pose of it. It does not check that the still's picture matches its
state.

The two phases do not share a browser, so the printed loads do not compete with
the live watch's animation. A printed page draws the still of every watch slide,
which is why its loads are spread over several browsers. Chromium draws WebGL
on the GPU (CHROMIUM_GPU), as Chrome does in a talk; without a GPU it falls back
to software (SwiftShader), and the check is the same, but slower. The output
names the renderer.

The diving board (components/DivingBoard.vue) is checked the same way: the
printed page must show the board when the live slide does, its picture when
the live one does, curling when it curls, and its SVG clock must be at the pose
of its click: the bottom of the swing, inside the curl, or, once only the rest
shape shows, the end of the sentence's edit. The live board bounces, so its
time is not compared.
The live board is the watch layer's (global-bottom.vue), and a printed page's
is the page's own (slide-bottom.vue). A page with no board shows none.

--browser runs it in Firefox or in Playwright's WebKit, which is not Safari
itself. Install them once: `uv run python -m playwright install firefox webkit`.

Not covered: the PDF export, which Slidev draws on a route (`/print`) that only
its export mode has, so a build cannot open it. It reads the same `$clicks`
through a nav of its own for each page. After a change to the stills, look at
`pnpm export`'s pages for the Hairspring slide.

A page with no still is a page with no watch: its state is `null`, the same as
the live canvas's on a slide that hides the watch. Every outside request fails
the check, as in `stem/tools/offline_check.py`.
"""

import argparse
import mimetypes
import sys
from collections.abc import Callable, Sequence
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from playwright.sync_api import (
    Browser,
    BrowserType,
    Page,
    Playwright,
    Route,
    ViewportSize,
    sync_playwright,
)

HOST = "deck.test"
TIMEOUT_MS = 60_000
STEP_LIMIT = 1000  # no talk has this many steps
BOARD_TIME_TOLERANCE_S = 0.05  # the SVG's clock reads a little after it is set
VIEWPORT: ViewportSize = {"width": 1960, "height": 1104}
# Browsers that load printed pages at once. On an Apple M3 Pro, 47 pages took
# 21.5 s in one and 8.9 s in three.
PRINTED_PAGES = 3
# The same as stem/tools/browsers.py's: a talk does not import the house tools.
CHROMIUM_GPU = ("--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist")


# The engines that --browser accepts: Playwright's name for each is its attribute.
BROWSERS: dict[str, Callable[[Playwright], BrowserType]] = {
    "chromium": lambda playwright: playwright.chromium,
    "firefox": lambda playwright: playwright.firefox,
    "webkit": lambda playwright: playwright.webkit,
}


def launch(playwright: Playwright, engine: str) -> Browser:
    """Start `engine`: Chromium on the GPU, as Chrome draws a talk."""
    return BROWSERS[engine](playwright).launch(
        args=list(CHROMIUM_GPU) if engine == "chromium" else []
    )


def serve_from(directory: Path, page: Page, outside: list[str]) -> None:
    """Answer the page's requests from `directory`, with index.html for a route
    (Slidev uses history routing); record any request to another host."""

    def answer(route: Route) -> None:
        url = route.request.url
        if url.startswith(("blob:", "data:")):  # the page's own; WebKit routes them
            route.continue_()
            return
        if f"//{HOST}/" not in url:
            outside.append(url)
            route.abort()
            return
        path = urlparse(url).path.lstrip("/")
        file = directory / path
        if not path or not file.is_file():
            file = directory / "index.html"
        route.fulfill(
            body=file.read_bytes(),
            content_type=mimetypes.guess_type(str(file))[0]
            or "application/octet-stream",
        )

    page.route("**/*", answer)


def show(page: Page, path: str, slide: int) -> None:
    """Go to `path` and wait until `slide` is on the screen and settled. In print
    mode Slidev draws every slide, and only this one has a size."""
    page.goto(f"http://{HOST}/{path}")
    slide_selector = f'[data-slidev-no="{slide}"]'
    page.wait_for_selector(slide_selector, state="visible")
    page.wait_for_function(
        """selector => {
            const slide = document.querySelector(selector);
            return slide && [...slide.querySelectorAll('[data-waitfor]')].every(host => {
                const target = host.querySelector(host.dataset.waitfor);
                return target && (!(target instanceof HTMLImageElement)
                    || (target.complete && target.naturalWidth > 0));
            });
        }""",
        arg=slide_selector,
    )
    paint(page)


def paint(page: Page) -> None:
    """Let Vue apply its changes and let the browser paint them."""
    page.evaluate("""async () => {
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }""")


def live_ready(page: Page, finish_story: bool = False) -> None:
    """Wait for loaded layers. Keep the curl click's intermediate picture."""
    paint(page)
    page.wait_for_function("""() => {
        const host = document.querySelector('.watch-layer .diving-board');
        const canvas = document.querySelector('.watch-canvas');
        return window.slideState && canvas &&
            window.slideState().settled.watch === canvas.getAttribute('data-watch') &&
            host?.querySelector('svg') && host.dataset.phase !== undefined;
    }""")
    if finish_story:
        page.wait_for_function("""() => {
            const host = document.querySelector('.watch-layer .diving-board');
            return !host?.querySelector('svg.diving-board-curling')
                || host.dataset.busy !== 'true';
        }""")
    paint(page)


def watch_state(page: Page, selector: str) -> str:
    """The `data-watch` of the first element that matches, or "null"."""
    state: str | None = page.evaluate(
        "selector => document.querySelector(selector)?.getAttribute('data-watch')"
        " ?? null",
        selector,
    )
    return state or "null"


def still_loaded(page: Page, slide: int) -> bool:
    """Whether the still on `slide` is a picture the browser decoded."""
    loaded: bool = page.evaluate(
        """slide => {
            const image = document.querySelector(
                `[data-slidev-no="${slide}"] .watch-still-image`);
            return image !== null && image.naturalWidth > 0;
        }""",
        slide,
    )
    return loaded


LIVE_BOARD = ".watch-layer .diving-board"


def printed_board(slide: int) -> str:
    """The selector of the board on a printed page of `slide`."""
    return f'[data-slidev-no="{slide}"] .diving-board'


def board_pose(page: Page, selector: str) -> dict[str, float | bool] | None:
    """The diving board that `selector` finds: whether it shows (the picture or
    the rest shape), whether the picture shows, whether it curls, and its SVG
    clock with the times of the file. `None` if there is no board."""
    pose: dict[str, float | bool] | None = page.evaluate(
        """selector => {
            const host = document.querySelector(selector);
            const board = host?.querySelector('svg');
            if (!host || !board) return null;
            const times = board.dataset;
            return {
                shown: host.classList.contains('diving-board-picture-on')
                    || host.classList.contains('diving-board-rest-on'),
                picture: host.classList.contains('diving-board-picture-on'),
                curling: board.classList.contains('diving-board-curling'),
                time: board.getCurrentTime(),
                swingStart: Number(times.swingStart),
                curlStart: Number(times.curlStart),
                curlDuration: Number(times.curlDuration),
                editDuration: Number(times.editDuration),
            };
        }""",
        selector,
    )
    return pose


def board_problems(
    live: dict[str, float | bool] | None, printed: dict[str, float | bool] | None
) -> list[str]:
    """What is wrong with a printed page's board, compared with the live one."""
    if live is None or printed is None:
        shown = (live or printed or {}).get("shown", False)
        return ["only one of the two pages shows the board"] if shown else []
    problems = [
        f"the board's {name} is {printed[name]}, live {live[name]}"
        for name in ("shown", "picture", "curling")
        if live[name] != printed[name]
    ]
    time = float(printed["time"])
    curl_start = float(printed["curlStart"])
    curl_end = curl_start + float(printed["curlDuration"])
    edit_end = curl_end + float(printed["editDuration"])
    curling = printed["shown"] and printed["curling"]
    if curling and printed["picture"] and not curl_start < time < curl_end:
        problems.append(f"the board's clock, {time:.2f} s, is not inside its curl")
    # only the rest shape and its callout: curled, and the sentence edited
    if (
        curling
        and not printed["picture"]
        and abs(time - edit_end) > BOARD_TIME_TOLERANCE_S
    ):
        problems.append(
            f"the board's clock, {time:.2f} s, is not at the edit's end,"
            f" {edit_end:.2f} s"
        )
    if printed["shown"] and not printed["curling"]:
        swing_start = float(printed["swingStart"])
        if abs(time - swing_start) > BOARD_TIME_TOLERANCE_S:
            problems.append(
                f"the board's clock, {time:.2f} s, is not at the swing's bottom,"
                f" {swing_start:.2f} s"
            )
    return problems


@dataclass(frozen=True)
class Position:
    slide: int
    click: int


def clicks_of(url: str) -> Position:
    """The slide and the click that a live URL shows."""
    parts = urlparse(url)
    clicks = parse_qs(parts.query).get("clicks", ["0"])
    return Position(int(parts.path.strip("/")), int(clicks[0]))


Pose = dict[str, float | bool]


@dataclass(frozen=True)
class LiveView:
    """What the live slide shows at one position."""

    position: Position
    watch: str
    board: Pose | None


@dataclass(frozen=True)
class PrintedView:
    """What the printed page of one position shows."""

    watch: str
    board: Pose | None
    still_loaded: bool


@dataclass
class Findings:
    """What one browser found. Each browser has its own."""

    problems: list[str] = field(default_factory=list)
    outside: list[str] = field(default_factory=list)


def open_page(browser: Browser, deck: Path, findings: Findings) -> Page:
    page = browser.new_page(viewport=VIEWPORT)
    page.set_default_timeout(TIMEOUT_MS)
    page.on("pageerror", lambda error: findings.problems.append(f"page error: {error}"))
    serve_from(deck, page, findings.outside)
    return page


def renderer(page: Page) -> str:
    """The WebGL renderer: the GPU, or SwiftShader when there is none."""
    name: str = page.evaluate("""() => {
        const gl = document.createElement('canvas').getContext('webgl2');
        const info = gl?.getExtension('WEBGL_debug_renderer_info');
        return info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : 'unknown';
    }""")
    return name


def walk_live(deck: Path, engine: str) -> tuple[list[LiveView], str, Findings]:
    """Step through the live deck, and record what each position shows."""
    findings = Findings()
    views: list[LiveView] = []
    with sync_playwright() as playwright:
        browser = launch(playwright, engine)
        try:
            live = open_page(browser, deck, findings)
            show(live, "1", 1)
            live_ready(live)
            gl = renderer(live)
            urls = [live.url]
            while len(urls) < STEP_LIMIT:
                board = board_pose(live, LIVE_BOARD)
                views.append(
                    LiveView(
                        clicks_of(urls[-1]), watch_state(live, ".watch-canvas"), board
                    )
                )
                live.keyboard.press("ArrowRight")
                live_ready(live, finish_story=bool(board and board["curling"]))
                if live.url == urls[-1]:
                    break
                urls.append(live.url)
            else:
                findings.problems.append(
                    f"the walk did not end within {STEP_LIMIT} steps"
                )
        finally:
            browser.close()
    return views, gl, findings


def load_printed(
    deck: Path, engine: str, positions: Sequence[Position]
) -> tuple[dict[Position, PrintedView], Findings]:
    """Load the printed page of each position, in one browser."""
    findings = Findings()
    views: dict[Position, PrintedView] = {}
    with sync_playwright() as playwright:
        browser = launch(playwright, engine)
        try:
            page = open_page(browser, deck, findings)
            for position in positions:
                slide = position.slide
                show(page, f"{slide}?print=clicks&clicks={position.click}", slide)
                watch = watch_state(page, f'[data-slidev-no="{slide}"] .watch-still')
                views[position] = PrintedView(
                    watch,
                    board_pose(page, printed_board(slide)),
                    watch != "null" and still_loaded(page, slide),
                )
        finally:
            browser.close()
    return views, findings


def check(deck: Path, engine: str) -> int:
    live, gl, findings = walk_live(deck, engine)
    positions = [view.position for view in live]
    shares = [positions[start::PRINTED_PAGES] for start in range(PRINTED_PAGES)]
    with ThreadPoolExecutor(max_workers=PRINTED_PAGES) as pool:
        loads = list(
            pool.map(
                lambda share: load_printed(deck, engine, share), filter(None, shares)
            )
        )
    printed: dict[Position, PrintedView] = {}
    problems, outside = list(findings.problems), list(findings.outside)
    for views, more in loads:
        printed.update(views)
        problems.extend(more.problems)
        outside.extend(more.outside)
    with_watch = 0  # pages that show a watch: a check of none compares nothing
    for view in live:
        page = printed.get(view.position)
        where = f"slide {view.position.slide}, click {view.position.click}"
        if page is None:
            problems.append(f"{where}: the printed page did not load")
            continue
        if page.watch != view.watch:
            problems.append(
                f"{where}: the printed page shows {page.watch},"
                f" the live slide {view.watch}"
            )
        problems.extend(
            f"{where}: {problem}" for problem in board_problems(view.board, page.board)
        )
        if page.watch != "null":
            with_watch += 1
            if not page.still_loaded:
                problems.append(f"{where}: the still did not load")
    if with_watch == 0:
        problems.append("no page shows the watch: nothing was compared")
    print(f"WebGL renderer: {gl}")
    print(f"slides and clicks compared: {len(live)}, with the watch: {with_watch}")
    problems.extend(f"outside request: {url}" for url in outside)
    for problem in problems:
        print("FAIL", problem)
    return 1 if problems else 0


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("deck", type=Path, help="the built deck (pnpm build --out)")
    parser.add_argument("--browser", choices=sorted(BROWSERS), default="chromium")
    arguments = parser.parse_args()
    if not (arguments.deck / "index.html").is_file():
        sys.exit(f"{arguments.deck} has no index.html: build the deck first")
    sys.exit(check(arguments.deck, arguments.browser))


if __name__ == "__main__":
    main()
