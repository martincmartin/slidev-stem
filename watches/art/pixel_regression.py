#!/usr/bin/env python3
"""Draw a fixed set of frames of the watch with the probe page, as PNGs.

    uv run art/pixel_regression.py OUT_DIR       # in watches/
    uv run art/pixel_regression.py --compare A B

Use it around a change to webgl/ that must not change the picture: draw the
frames before and after, and compare. Two runs of the same code give
byte-identical PNGs in Chromium. It reuses art/watch_stills.py to build and
serve the probe.
The frames cover each path of the renderer: a still frame, the spring's
update, the tilt, the three views, and a fade at rest 0, 0.5 and 1. The same
page draws them in order, so the GL state that one frame leaves is what the
next one starts from. `--compare` says which files differ, and by how many
pixels.
"""

import argparse
import base64
import json
import math
import pathlib
import sys
import tempfile

import numpy as np
import watch_stills
from PIL import Image
from playwright.sync_api import sync_playwright

SUBJECT = "hairspring and stud"


def options(
    view: str, tilt: float, time: float, rest: float | None = None
) -> dict[str, object]:
    swing = watch_stills.AMPLITUDE * math.cos(2 * math.pi * time / watch_stills.PERIOD)
    result: dict[str, object] = {
        "view": view,
        "tilt": tilt,
        "time": time,
        "swing": swing,
        "size": list(watch_stills.SIZE),
    }
    if rest is not None:
        result["only"] = SUBJECT
        result["rest"] = rest
    return result


FRAMES = {
    "01-cover.png": options("cover", 0, 0),
    "02-cover-later.png": options("cover", 0, 0.37),
    "03-cover-tilt45.png": options("cover", 45, 0.8),
    "04-hairspring.png": options("hairspring", 0, 0.2),
    "05-hairspring-fade-half.png": options("hairspring", 0, 0.3, 0.5),
    "06-hairspring-fade-out.png": options("hairspring", 0, 0.4, 0),
    "07-hairspring-tilt20.png": options("hairspring", 20, 0.5, 0),
    "08-hairspring-fade-in.png": options("hairspring", 20, 0.6, 1),
    "09-crown.png": options("crown", 0, 1.1),
    "10-cover-again.png": options("cover", 0, 0),
}


def draw(out: pathlib.Path) -> None:
    out.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="probe-") as built:
        watch_stills.build_probe(pathlib.Path(built))
        with (
            watch_stills.served(pathlib.Path(built)) as base,
            sync_playwright() as playwright,
        ):
            browser = playwright.chromium.launch()
            page = browser.new_page(device_scale_factor=watch_stills.DEVICE_SCALE)
            page.set_default_timeout(watch_stills.TIMEOUT)
            errors: list[str] = []
            page.on("pageerror", lambda error: errors.append(str(error)))
            page.goto(f"{base}/index.html")
            page.wait_for_function("window.watchProbeReady === true")
            subjects = page.evaluate(
                "window.watchProbe.scene().subjects.map(s => s.name)"
            )
            if SUBJECT not in subjects:
                sys.exit(f"no subject {SUBJECT!r}: {subjects}")
            for name, frame in FRAMES.items():
                page.evaluate("o => window.watchProbe.render(o)", frame)
                url = str(page.evaluate("document.querySelector('canvas').toDataURL()"))
                (out / name).write_bytes(base64.b64decode(url.split(",", 1)[1]))
            info = page.evaluate("window.watchProbe.info()")
            browser.close()
    if errors:
        sys.exit(f"the probe page failed: {errors}")
    (out / "info.json").write_text(json.dumps(info, indent=2) + "\n")
    print(f"wrote {len(FRAMES)} frames to {out}")


def compare(first: pathlib.Path, second: pathlib.Path) -> int:
    failures = 0
    for name in FRAMES:
        one = np.asarray(Image.open(first / name).convert("RGBA"), dtype=np.int16)
        two = np.asarray(Image.open(second / name).convert("RGBA"), dtype=np.int16)
        if one.shape != two.shape:
            print(f"{name}: sizes differ, {one.shape} and {two.shape}")
            failures += 1
            continue
        changed = int(np.any(one != two, axis=2).sum())
        largest = int(np.abs(one - two).max())
        same_bytes = (first / name).read_bytes() == (second / name).read_bytes()
        print(
            f"{name}: {changed} px differ (largest step {largest}),"
            f" bytes {'identical' if same_bytes else 'differ'}"
        )
        failures += changed > 0
    return failures


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("out", nargs="?")
    parser.add_argument("--compare", nargs=2, metavar=("A", "B"))
    arguments = parser.parse_args()
    if arguments.compare:
        first, second = (pathlib.Path(path) for path in arguments.compare)
        sys.exit(1 if compare(first, second) else 0)
    if not arguments.out:
        parser.error("give OUT_DIR, or --compare A B")
    draw(pathlib.Path(arguments.out))


if __name__ == "__main__":
    main()
