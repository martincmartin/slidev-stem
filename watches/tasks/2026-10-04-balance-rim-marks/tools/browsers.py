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
from typing import Protocol


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
