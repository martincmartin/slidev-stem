#!/usr/bin/env python3
"""The fade of the rest of the watch (renderer.js, options keep and rest):
its pictures, and what it costs the GPU.

    uv run --project ../../../.. python fade_check.py     # in tools/

With webgl/index.html in Playwright's Chromium (GPU through Metal) and
Firefox, at the laptop's full-screen size (1728 x 1117 CSS px at a device
pixel ratio of 2, so 3456 x 1954 px for the slide), for the views of the
opening: the cover at 0 degrees and the hairspring at 20 degrees.

THE PICTURES. A fade must not jump at its ends, and in between it must be
the two pictures mixed:
- "rest 1 against no fade": the picture with the fade at its start is the
  picture with no fade (0 levels: the same code draws both);
- "rest 0.002 against 0", "rest 0.998 against 1": the largest step into and
  out of the fade, in levels of 255 (a mix of weight 0.002 moves a level by
  at most 0.5, so 1 is the most that rounding allows);
- "rest 0.5 against the mean of 0 and 1": the middle of the fade is the mean
  of its ends, to 1 level.

THE COST. The median time of DRAWS frames with gl.finish() (the time until
the GPU is done), with no fade and in the middle of a fade (two pictures and
a mix). A frame at 120 Hz has 8.33 ms.

Writes ../evidence/fade_check.json and the three pictures of each view in
../out/fade/.
"""

import base64
import io
import json
import statistics

import numpy as np
from PIL import Image
from pixel_check import CHROMIUM_GPU, EVIDENCE, OUT, served
from playwright.sync_api import Browser, Page, sync_playwright

SUBJECT = "hairspring and stud"
SLIDE = (980, 552)  # CSS px
RATIO = 2
SCALE = 1728 / 980  # the laptop's full-screen slide, in slide px per CSS px
SIZE = [round(SLIDE[0] * SCALE * RATIO), round(SLIDE[1] * SCALE * RATIO)]
VIEWS = [("cover", 0.0), ("hairspring", 20.0)]
TIME = 0.37  # s
DRAWS = 60
PICTURES = OUT / "fade"
TIMING = """({ options, draws }) => {
  const times = [];
  for (let index = 0; index < draws; index++) {
    const before = performance.now();
    spike.render(options);
    times.push(performance.now() - before);
  }
  return times;
}"""


def picture(page: Page, view: str, tilt: float, rest: float | None) -> np.ndarray:
    options: dict[str, object] = {
        "view": view,
        "tilt": tilt,
        "time": TIME,
        "swing": 150 * float(np.cos(np.pi * TIME)),
        "size": SIZE,
    }
    if rest is not None:
        options |= {"only": SUBJECT, "rest": rest}
    page.evaluate("options => spike.render(options)", options)
    # The drawing buffer itself (the probe preserves it), not a screenshot of
    # the canvas element, which would scale it to the element's size.
    url = page.evaluate("document.querySelector('canvas').toDataURL('image/png')")
    png = base64.b64decode(url.split(",", 1)[1])
    return np.asarray(Image.open(io.BytesIO(png)).convert("RGB")).astype(np.int16)


def largest(first: np.ndarray, second: np.ndarray) -> int:
    return int(np.abs(first - second).max())


def check(browser: Browser, base: str, name: str) -> dict[str, object]:
    page = browser.new_page(device_scale_factor=RATIO)
    errors: list[str] = []
    page.on("pageerror", lambda error: errors.append(str(error)))
    page.goto(f"{base}/tools/webgl/index.html?probe")
    page.wait_for_function("window.spikeReady === true")
    views = {}
    for view, tilt in VIEWS:
        plain = picture(page, view, tilt, None)
        ends = {
            rest: picture(page, view, tilt, rest)
            for rest in (0.0, 0.002, 0.5, 0.998, 1.0)
        }
        mean = (ends[0.0] + ends[1.0]) / 2
        timings = {}
        for label, rest in (("no fade", None), ("middle of a fade", 0.5)):
            options: dict[str, object] = {
                "view": view,
                "tilt": tilt,
                "time": TIME,
                "size": SIZE,
            }
            if rest is not None:
                options |= {"only": SUBJECT, "rest": rest}
            page.evaluate(TIMING, {"options": options, "draws": 5})  # warm up
            times = page.evaluate(TIMING, {"options": options, "draws": DRAWS})
            timings[label] = {
                "median ms": round(statistics.median(times), 2),
                "largest ms": round(max(times), 2),
            }
        for rest in (0.0, 0.5, 1.0):
            Image.fromarray(ends[rest].astype(np.uint8)).save(
                PICTURES / f"{name}-{view}-rest-{rest:g}.png"
            )
        views[f"{view} at {tilt:g}"] = {
            "rest 1 against no fade, levels": largest(ends[1.0], plain),
            "rest 0.002 against 0, levels": largest(ends[0.002], ends[0.0]),
            "rest 0.998 against 1, levels": largest(ends[0.998], ends[1.0]),
            "rest 0.5 against the mean of 0 and 1, levels": round(
                float(np.abs(ends[0.5] - mean).max()), 1
            ),
            "frame time with gl.finish": timings,
        }
    info = page.evaluate("spike.info()")
    page.close()
    return {
        "version": browser.version,
        "renderer": info["renderer"],
        "views": views,
        "page errors": errors,
    }


def main() -> None:
    PICTURES.mkdir(parents=True, exist_ok=True)
    result: dict[str, object] = {"size px": SIZE, "draws": DRAWS}
    with served() as base, sync_playwright() as playwright:
        for name in ("chromium", "firefox"):
            browser = getattr(playwright, name).launch(
                args=CHROMIUM_GPU if name == "chromium" else []
            )
            result[name] = check(browser, base, name)
            browser.close()
            print(name, json.dumps(result[name], indent=1))
    (EVIDENCE / "fade_check.json").write_text(json.dumps(result, indent=1) + "\n")
    print(f"wrote {EVIDENCE / 'fade_check.json'}")


if __name__ == "__main__":
    main()
