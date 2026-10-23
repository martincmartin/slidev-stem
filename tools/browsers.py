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

import json
import subprocess
import sys
from pathlib import Path
from typing import Protocol

NAMES = ("chromium", "firefox", "webkit")

# Chromium's arguments, in chromium-args.json, which browser.ts reads too (the
# watches talk's art/browser.ts has its own copy: a talk does not import the
# house tools). Without "gpu", headless Chromium draws WebGL in software
# (SwiftShader), on the CPU; with it, on the GPU (Metal on a Mac), as Chrome
# does in a talk. Where there is no GPU (a Linux machine without /dev/dri, such
# as a cloud container), Chromium draws in software either way: "noGpu",
# ANGLE's SwiftShader backend, drew the watch about 4.8 times as fast as
# Chromium's default there, and cut the print check from 117 s to 94 s
# (docs/talks.md, "Browser support").
_ARGS = json.loads((Path(__file__).parent / "chromium-args.json").read_text())
CHROMIUM_GPU: tuple[str, ...] = tuple(_ARGS["gpu"])
CHROMIUM_NO_GPU: tuple[str, ...] = tuple(_ARGS["noGpu"])


def has_gpu() -> bool:
    """Whether Chromium can draw on a GPU here: a Mac, or Linux with /dev/dri."""
    return sys.platform == "darwin" or Path("/dev/dri").exists()


def launch_args(name: str) -> list[str]:
    """The launch arguments for engine `name`: for Chromium, the GPU, or the
    faster software renderer where there is none."""
    if name not in NAMES:
        raise ValueError(f"Unknown browser engine: {name}")
    if name != "chromium":
        return []
    return list(CHROMIUM_GPU if has_gpu() else CHROMIUM_NO_GPU)


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
