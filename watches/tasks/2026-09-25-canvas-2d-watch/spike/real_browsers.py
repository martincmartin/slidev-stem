#!/usr/bin/env python3
"""C6 and C10: frame gaps in the browsers installed on this laptop (Firefox and
Google Chrome), which Playwright cannot drive. Each browser starts full screen
(kiosk) with a new, empty profile in a temporary directory, so Martin's own
profiles are not read or changed. zoom.html?auto=N zooms by itself, and the
spike deck with ?auto=N changes slides by itself (site/watch_self_test.js);
each POSTs its frames to /report. Writes ../out/real-<browser>-<page>.json.

    ../../../../.venv/bin/python3 real_browsers.py svg canvas   # in spike/
    ../../../../.venv/bin/python3 real_browsers.py --deck http://localhost:3132 deck

--browsers picks from firefox, firefox-beta (FirefoxBeta.app, C21) and chrome;
the default is firefox and chrome. --firefox-pref NAME=VALUE (repeatable) adds a
line to Firefox's user.js, for example
--firefox-pref svg.Moz2D.strokeBounds.enabled=false (C20).

The pages are svg, svg-css, svg-css-scaled, svg-css-no-will-change, canvas and
canvas-erase (zoom.html; svg-css is the camera as a CSS transform on the <svg>
element, C22), and deck and deck-erase (with --deck, the running deck's URL).
--profiles DIR puts the temporary profiles in DIR; --suffix S is added to each
label, to keep a rerun's files apart.

A fresh profile has the browser's default preferences, as Martin's has unless
he changed graphics settings.
"""

import argparse
import functools
import http.server
import json
import queue
import subprocess
import tempfile
import threading
import urllib.parse
from abc import ABC, abstractmethod
from collections.abc import Iterator
from contextlib import contextmanager
from dataclasses import dataclass
from pathlib import Path
from typing import TypedDict

from frame_gaps import GapSummary
from spike_browser import OUT, SITE, QuietHandler

FIREFOX = "/Applications/Firefox.app/Contents/MacOS/firefox"
FIREFOX_BETA = "/Applications/FirefoxBeta.app/Contents/MacOS/firefox"
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
BASE_QUERY = "ease=linear&fadelater=1&host=1.7&auto=3"
# No first-run pages or prompts in a new Firefox profile.
FIREFOX_USER_JS = """\
user_pref("browser.shell.checkDefaultBrowser", false);
user_pref("browser.startup.homepage_override.mstone", "ignore");
user_pref("browser.aboutwelcome.enabled", false);
user_pref("datareporting.policy.dataSubmissionPolicyBypassNotification", true);
user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);
user_pref("browser.startup.page", 0);
"""


@dataclass(frozen=True)
class RealBrowser(ABC):
    name: str
    executable: str

    @abstractmethod
    def command(self, profile: Path, url: str, firefox_prefs: str) -> list[str]:
        """`firefox_prefs`: more user.js lines, for Firefox only."""


@dataclass(frozen=True)
class Firefox(RealBrowser):
    def command(self, profile: Path, url: str, firefox_prefs: str) -> list[str]:
        (profile / "user.js").write_text(FIREFOX_USER_JS + firefox_prefs)
        return [self.executable, "-no-remote", "-profile", str(profile), "-kiosk", url]


@dataclass(frozen=True)
class Chrome(RealBrowser):
    def command(self, profile: Path, url: str, firefox_prefs: str) -> list[str]:
        return [
            self.executable,
            f"--user-data-dir={profile}",
            "--no-first-run",
            "--no-default-browser-check",
            "--kiosk",
            url,
        ]


BROWSERS = (
    Firefox("firefox", FIREFOX),
    Firefox("firefox-beta", FIREFOX_BETA),
    Chrome("chrome", CHROME),
)
# The pages, by the name used on the command line and in labels, with their
# own query: zoom.html's, and the spike deck's.
TEST_PAGES = {
    "svg": "renderer=svg&mode=js&stroke=compensated",
    "svg-css": "renderer=svg&mode=js-css&stroke=compensated",
    "svg-css-scaled": "renderer=svg&mode=js-css&stroke=scaled",
    "svg-css-no-will-change": "renderer=svg&mode=js-css&stroke=compensated&willchange=0",
    "canvas": "renderer=canvas&stroke=compensated",
    "canvas-erase": "renderer=canvas&clips=erase&stroke=compensated",
}
DECK_PAGES = {"deck": "", "deck-erase": "clips=erase&"}


class ZoomFrames(TypedDict):
    """Each frame: [ms since the zoom began, ms since the frame before, scale]."""

    zoomIn: list[list[float]]
    zoomOut: list[list[float]]


class Report(TypedDict):
    """What zoom.html?auto=N POSTs (see `automatic` there)."""

    label: str
    query: str
    userAgent: str
    window: list[float]
    idle: list[list[float]]
    zooms: list[ZoomFrames]
    drawTimes: list[float]


class ReportHandler(QuietHandler):
    """Serves site/, and puts each POSTed report on the server's queue."""

    reports: queue.Queue[Report]

    def do_POST(self) -> None:
        length = int(self.headers["Content-Length"])
        self.reports.put(json.loads(self.rfile.read(length)))
        self.send_response(204)
        self.end_headers()


@contextmanager
def serve_reports() -> Iterator[tuple[str, queue.Queue[Report]]]:
    reports: queue.Queue[Report] = queue.Queue()
    handler_class = type("Handler", (ReportHandler,), {"reports": reports})
    handler = functools.partial(handler_class, directory=str(SITE))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}", reports
    finally:
        server.shutdown()


def measure(
    browser: RealBrowser,
    url: str,
    reports: queue.Queue[Report],
    profiles: str | None,
    firefox_prefs: str,
) -> Report:
    with tempfile.TemporaryDirectory(prefix="watch-profile-", dir=profiles) as profile:
        process = subprocess.Popen(
            browser.command(Path(profile), url, firefox_prefs),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        try:
            return reports.get(timeout=120)
        finally:
            process.terminate()
            process.wait(timeout=30)


def page_url(page: str, label: str, base: str, deck: str | None) -> str:
    if page in TEST_PAGES:
        return f"{base}/zoom.html?{BASE_QUERY}&{TEST_PAGES[page]}&label={label}"
    if deck is None:
        raise SystemExit("the deck pages need --deck URL")
    report = urllib.parse.quote(f"{base}/report", safe="")
    return f"{deck}/1?{DECK_PAGES[page]}auto=3&label={label}&report={report}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("pages", nargs="+", choices=[*TEST_PAGES, *DECK_PAGES])
    parser.add_argument("--profiles")
    parser.add_argument("--deck")
    parser.add_argument("--suffix", default="", help="added to each label")
    parser.add_argument(
        "--browsers",
        nargs="+",
        choices=[browser.name for browser in BROWSERS],
        default=["firefox", "chrome"],
    )
    parser.add_argument(
        "--firefox-pref",
        action="append",
        default=[],
        help="NAME=VALUE, written to Firefox's user.js (VALUE as in user.js)",
    )
    arguments = parser.parse_args()
    firefox_prefs = "".join(
        f'user_pref("{name}", {value});\n'
        for name, _, value in (pref.partition("=") for pref in arguments.firefox_pref)
    )
    with serve_reports() as (base, reports):
        for browser in (
            known for known in BROWSERS if known.name in arguments.browsers
        ):
            for page in arguments.pages:
                label = f"{browser.name}-{page}{arguments.suffix}"
                url = page_url(page, label, base, arguments.deck)
                report = measure(
                    browser, url, reports, arguments.profiles, firefox_prefs
                )
                (OUT / f"real-{label}.json").write_text(json.dumps(report) + "\n")
                print(label, report["window"], report["userAgent"][-40:])
                print(
                    "  idle    ", GapSummary.of([gap for _, gap, _ in report["idle"]])
                )
                for zoom in report["zooms"]:
                    for name, frames in (
                        ("in", zoom["zoomIn"]),
                        ("out", zoom["zoomOut"]),
                    ):
                        print(
                            f"  zoom {name:3}",
                            GapSummary.of([gap for _, gap, _ in frames]),
                        )


if __name__ == "__main__":
    main()
