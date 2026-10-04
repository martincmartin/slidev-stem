"""Record a clip of one animated click, and measure what it costs as a file.

For the static formats (Markdown, HTML, PDF), an animated slide is either a
still or a clip. This records slide 2 at click 1 (the diving board bends and
swings) and click 2 (it curls), from the experiment deck's dev server, then
encodes the recording as MP4 (H.264) and WebM (VP9) with ffmpeg. Run in the
task directory:

    uv run --project ../.. experiments/clip.py http://localhost:3131 out/clip

It prints one JSON object of file sizes.
"""

import json
import subprocess
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

SIZE = {"width": 980, "height": 552}  # the slide's own canvas: 1 CSS px = 1 video px
SECONDS = 6.0


def main() -> None:
    base, out = sys.argv[1], Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    with sync_playwright() as playwright:
        browser = playwright.chromium.launch()
        context = browser.new_context(
            viewport=SIZE, record_video_dir=str(out), record_video_size=SIZE
        )
        page = context.new_page()
        page.goto(f"{base}/2")
        page.wait_for_timeout(5000)  # the zoom from the cover settles
        page.keyboard.press("ArrowRight")  # click 1: the board bends, swings
        page.wait_for_timeout(SECONDS * 1000)
        page.keyboard.press("ArrowRight")  # click 2: the board curls
        page.wait_for_timeout(3000)
        video = page.video
        assert video is not None
        context.close()  # this writes the video
        recorded = Path(video.path())
        browser.close()
    raw = recorded.rename(out / "raw.webm")
    # Keep the animation only: skip the load and the first settle.
    encodes = {
        "clip.mp4": [
            "-c:v",
            "libx264",
            "-crf",
            "28",
            "-preset",
            "slow",
            "-pix_fmt",
            "yuv420p",
        ],
        "clip.webm": ["-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0"],
    }
    sizes: dict[str, object] = {}
    for name, codec in encodes.items():
        subprocess.run(
            [
                "ffmpeg",
                "-y",
                "-loglevel",
                "error",
                "-ss",
                "5",
                "-i",
                str(raw),
                "-an",
                *codec,
                str(out / name),
            ],
            check=True,
        )
        sizes[name] = (out / name).stat().st_size
    duration = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "csv=p=0",
            str(out / "clip.mp4"),
        ],
        check=True,
        capture_output=True,
        text=True,
    ).stdout.strip()
    sizes["seconds"] = float(duration)
    print(json.dumps(sizes, indent=2))


if __name__ == "__main__":
    main()
