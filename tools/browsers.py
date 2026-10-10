"""Install a browser for Playwright before a tool starts it.

`uv sync` installs the `playwright` package but not its browsers, and uv has no
step that runs after it. So each tool that renders calls `install` first. A new
clone or worktree then needs no setup step.

Playwright keeps its browsers in one cache for each user
(~/Library/Caches/ms-playwright on macOS), which every checkout shares. When the
browser is there, `install` takes about 0.2 s and downloads nothing. It also
records this venv's Playwright in the cache. A later `playwright install` from
another checkout deletes only the browsers that no recorded Playwright needs.
"""

import subprocess
import sys
from typing import Protocol, overload

from playwright.async_api import BrowserType as AsyncBrowserType
from playwright.async_api import Playwright as AsyncPlaywright
from playwright.sync_api import BrowserType as SyncBrowserType
from playwright.sync_api import Playwright as SyncPlaywright

NAMES = ("chromium", "firefox", "webkit")

# Without these, headless Chromium draws WebGL in software (SwiftShader), on the
# CPU. With them, it draws on the GPU (Metal on a Mac), as Chrome does in a talk.
# Where there is no GPU, Chromium uses SwiftShader: slower, but the same checks.
CHROMIUM_GPU = ("--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist")


def launch_args(name: str) -> list[str]:
    """The launch arguments for engine `name`: the GPU for Chromium."""
    if name not in NAMES:
        raise ValueError(f"Unknown browser engine: {name}")
    return list(CHROMIUM_GPU) if name == "chromium" else []


@overload
def select(playwright: AsyncPlaywright, name: str) -> AsyncBrowserType: ...


@overload
def select(playwright: SyncPlaywright, name: str) -> SyncBrowserType: ...


def select(
    playwright: AsyncPlaywright | SyncPlaywright, name: str
) -> AsyncBrowserType | SyncBrowserType:
    """Select an engine at the command-line boundary. Reject unknown names."""
    match name:
        case "chromium":
            return playwright.chromium
        case "firefox":
            return playwright.firefox
        case "webkit":
            return playwright.webkit
        case _:
            raise ValueError(f"Unknown browser engine: {name}")


class BrowserType(Protocol):
    """Playwright's `BrowserType`, sync or async: `playwright.chromium`, for example."""

    @property
    def name(self) -> str: ...


def install(browser_type: BrowserType) -> None:
    """Download `browser_type` if this venv's Playwright does not have it yet."""
    # Progress goes to stderr, so that a tool's --json output stays clean.
    subprocess.run(
        [sys.executable, "-m", "playwright", "install", browser_type.name],
        stdout=sys.stderr,
        check=True,
    )
