"""Draw the four flash options side by side, as a 2 x 2 video and GIF.

    uv run tasks/2026-09-30-flash/tools/flash_video.py OUT_DIR   # in watches/

It builds the prototype page (../prototype/probe, a copy of the talk's webgl/
and watch/ with two flash inks) with Vite, draws each frame of the cover view
in headless Chromium, and puts the four options in a grid. Each cell is the
980 x 552 slide, drawn at 2x and scaled down. The video and the GIF go to
OUT_DIR. The grid's frames (about 53 MB of PNGs) go to FRAMES, the task's
git-ignored out/.

The timeline: LEAD s as it is, then the flash (FLASH_CYCLES cycles of ON s in
the flash colours and OFF s as it is), then TAIL s as it is. The balance swings
all the time, as it does on the cover.
"""

import base64
import contextlib
import functools
import http.server
import io
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import threading
from collections.abc import Iterator

from PIL import Image, ImageDraw, ImageFont
from playwright.sync_api import sync_playwright

TASK = pathlib.Path(__file__).resolve().parents[1]
TALK = TASK.parents[1]
PROBE = TASK / "prototype" / "probe"
FRAMES = TASK / "out" / "frames"

SLIDE = (980, 552)
SCALE = 2
FPS = 30
LEAD, TAIL = 0.5, 1.0
ON, OFF, FLASH_CYCLES = 0.25, 0.25, 5
LABEL_HEIGHT = 44
REPEATS = 3  # the MP4 plays the timeline this many times

LABELS = {
    "A lines only": "A. Lines only: second lines, knockout fill",
    "B one colour": "B. One colour: second lines and fill",
    "C1 two colours": "C1. Two colours: second lines, #E6D8CA fill",
    "E inverted": "E. Inverted: knockout lines, second fill",
}


def flash_on(time: float) -> bool:
    into = time - LEAD
    return 0 <= into < FLASH_CYCLES * (ON + OFF) and into % (ON + OFF) < ON


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format: str, *args: object) -> None:  # noqa: A002
        pass


@contextlib.contextmanager
def served(directory: pathlib.Path) -> Iterator[str]:
    handler = functools.partial(QuietHandler, directory=str(directory))
    server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    try:
        yield f"http://127.0.0.1:{server.server_address[1]}"
    finally:
        server.shutdown()


def build(directory: pathlib.Path) -> None:
    environment = {
        name: value for name, value in os.environ.items() if name != "VIRTUAL_ENV"
    }
    result = subprocess.run(
        [shutil.which("pnpm") or "pnpm", "exec", "vite", "build", str(PROBE)]
        + ["--outDir", str(directory), "--emptyOutDir", "--base", "./"],
        cwd=TALK,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    if result.returncode != 0:
        sys.exit(f"vite build failed:\n{result.stdout}{result.stderr}")


def font(size: int) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    for path in ("/System/Library/Fonts/Helvetica.ttc", "/Library/Fonts/Arial.ttf"):
        if pathlib.Path(path).exists():
            return ImageFont.truetype(path, size)
    return ImageFont.load_default()


def cell(picture: Image.Image, label: str, on: bool) -> Image.Image:
    width, height = SLIDE
    made = Image.new("RGB", (width, height + LABEL_HEIGHT), "#FAF7F0")
    made.paste(picture.resize(SLIDE, Image.Resampling.LANCZOS), (0, LABEL_HEIGHT))
    draw = ImageDraw.Draw(made)
    draw.text((16, 10), label, fill="#2A2520", font=font(22))
    if on:
        draw.ellipse((width - 34, 12, width - 14, 32), fill="#9A6238")
    draw.line((0, height + LABEL_HEIGHT - 1, width, height + LABEL_HEIGHT - 1), fill="#E0D9CA")
    return made


def main() -> None:
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    out = pathlib.Path(sys.argv[1]).resolve()
    out.mkdir(parents=True, exist_ok=True)
    frames_dir = FRAMES
    frames_dir.mkdir(parents=True, exist_ok=True)
    total = LEAD + FLASH_CYCLES * (ON + OFF) + TAIL
    count = round(total * FPS)
    size = [SLIDE[0] * SCALE, SLIDE[1] * SCALE]
    with tempfile.TemporaryDirectory(prefix="flash-") as built:
        build(pathlib.Path(built))
        with served(pathlib.Path(built)) as base, sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            page = browser.new_page()
            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{base}/index.html")
            page.wait_for_function("window.flashProbeReady === true || false", timeout=60_000)
            options: list[str] = page.evaluate("window.flashProbe.options()")
            for index in range(count):
                time = index / FPS
                on = flash_on(time)
                cells = []
                for option in options:
                    url: str = page.evaluate(
                        "([option, on, time, size]) =>"
                        " window.flashProbe.render(option, on, time, size)",
                        [option, on, time, size],
                    )
                    png = base64.b64decode(url.split(",", 1)[1])
                    picture = Image.open(io.BytesIO(png)).convert("RGB")
                    cells.append(cell(picture, LABELS.get(option, option), on))
                width, height = cells[0].size
                grid = Image.new("RGB", (2 * width + 8, 2 * height + 8), "#E0D9CA")
                for position, made in enumerate(cells):
                    grid.paste(made, ((position % 2) * (width + 8), (position // 2) * (height + 8)))
                grid.save(frames_dir / f"{index:04d}.png")
            browser.close()
            if errors:
                sys.exit("page errors:\n" + "\n".join(errors))
    pattern = str(frames_dir / "%04d.png")
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-stream_loop", str(REPEATS - 1)]
        + ["-framerate", str(FPS), "-i", pattern, "-c:v", "libx264", "-crf", "12"]
        + ["-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out / "flash-options.mp4")],
        check=True,
    )
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", pattern]
        + ["-vf", "scale=1308:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=none"]
        + ["-loop", "0", str(out / "flash-options.gif")],
        check=True,
    )
    print(f"{count} frames; {out / 'flash-options.mp4'}; {out / 'flash-options.gif'}")


if __name__ == "__main__":
    main()
