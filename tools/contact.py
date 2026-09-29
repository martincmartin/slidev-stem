#!/usr/bin/env python3
"""Look at an animated drawing properly: every frame that matters, side by side.

    .venv/bin/python3 tools/contact.py watches/public/timekeepers
    .venv/bin/python3 tools/contact.py new.svg --times 0.2 4 8 11.8
    .venv/bin/python3 tools/contact.py new.svg --out /tmp/sheet.png

Needs playwright; it installs Chromium if it is missing (`browsers.py`). Writes
a PNG and prints its path. Each drawing appears once large, and once at every
requested time at the size its file states: the size a slide shows it at.

WHY THIS EXISTS RATHER THAN JUST SCREENSHOTTING THE DECK. Two traps, both of
which cost real time:

 1. SMIL animation makes a live screenshot non-reproducible. Every drawing here
    is paused and pinned to an explicit time with setCurrentTime(), so two runs
    are comparable and so a defect that only exists at t = 8 s is visible at all.
    One real bug -- a leader line that pointed at a flame after the flame had
    burned down past it -- was invisible at t = 0 and obvious at t = 8, and no
    metric caught it, because a line pointing at nothing is exactly as much ink
    as one pointing at something.
 2. The same SVG appearing many times on one page shares its ids. Without
    namespacing every id per instance, all copies resolve clipPath and pattern
    references to the first one and the animation looks frozen in all but one.
    This file does the namespacing; a hand-rolled harness usually does not.

WHAT TO LOOK FOR. Whether the drawing still reads at the size it is shown at --
the large row is only there to show you what you are losing.
Whether anything animates off its own feature. Whether a texture has turned to
mud. For "can the back row see it", use `barroom.py`; this one is for your eyes.
"""

import argparse
import pathlib
import re
import sys

import browsers
import lib

DEFAULT_TIMES = [0.2, 3.0, 6.0, 9.0, 11.8]


def instance(
    path: pathlib.Path, tag: str, width: int | None = None, height: int | None = None
) -> str:
    """One copy of a drawing, with every id namespaced so refs stay local to it.
    At (width, height) if given, otherwise at the size the file states."""
    source = lib.namespace_ids(path.read_text(), tag)
    if width is None:
        return source
    return re.sub(
        r'<svg width="[0-9.]+" height="[0-9.]+"',
        f'<svg width="{width}" height="{height}"',
        source,
        count=1,
    )


def build_html(files: list[pathlib.Path], times: list[float]) -> str:
    palette = lib.LEDGER
    page_parts = [
        "<!doctype html><meta charset=utf-8><style>",
        (
            f"body{{margin:0;background:{palette['background']};"
            'font:12px "IBM Plex Sans",Arial,sans-serif;padding:12px}'
        ),
        ".row{display:flex;gap:14px;align-items:center;margin-bottom:8px}",
        f".t{{width:44px;font:600 14px monospace;color:{palette['accent']}}}",
        # the card chrome the deck actually puts around these drawings
        (
            f".card{{display:flex;padding:9px 11px;background:{palette['panel']};"
            f"border:1px solid {palette['border']};border-radius:12px}}"
        ),
        ".card svg{border-radius:6px;display:block}",
        f'h2{{font:600 14px "IBM Plex Sans";color:{palette["muted"]};margin:12px 0 6px}}</style>',
        f'<h2>{len(files)} drawing(s) &mdash; 200 px wide</h2><div class="row" data-t="4.0">',
    ]
    for index, file in enumerate(files):
        size = lib.shown_size(file.read_text())
        if size is None:
            sys.exit(
                f"{lib.display_path(file)}: no width/height. Run tools/artcheck.py"
            )
        tall = round(200 * size.height / size.width)
        page_parts.append(
            f'<div class="card">{instance(file, f"big-{index}", 200, tall)}</div>'
        )
    page_parts.append(
        "</div><h2>at the size each file states &mdash; what a slide shows</h2>"
    )
    for time in times:
        tag = str(time).replace(".", "p")
        page_parts.append(
            f'<div class="row" data-t="{time}"><div class="t">{time}s</div>'
        )
        page_parts += [
            f'<div class="card">{instance(file, f"{index}-{tag}")}</div>'
            for index, file in enumerate(files)
        ]
        page_parts.append("</div>")
    page_parts.append(
        '<script>document.querySelectorAll("[data-t]").forEach(c=>{'
        "const t=parseFloat(c.dataset.t);"
        'c.querySelectorAll("svg").forEach(s=>{s.pauseAnimations();s.setCurrentTime(t);});});</script>'
    )
    return "\n".join(page_parts)


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("paths", nargs="+", help="SVG files or directories")
    parser.add_argument(
        "--times",
        nargs="+",
        type=float,
        default=DEFAULT_TIMES,
        help="animation times to pin, in seconds",
    )
    parser.add_argument(
        "--out", default=None, help="output PNG (default: out/contact.png)"
    )
    arguments = parser.parse_args()

    files = lib.art_files(arguments.paths)
    if not files:
        sys.exit("no SVGs found")
    out = pathlib.Path(arguments.out) if arguments.out else lib.ROOT / "out/contact.png"
    out.parent.mkdir(parents=True, exist_ok=True)
    page_file = out.with_suffix(".html")
    page_file.write_text(build_html(files, arguments.times))

    from playwright.sync_api import sync_playwright

    with sync_playwright() as playwright:
        browsers.install(playwright.chromium)
        browser = playwright.chromium.launch()
        page = browser.new_page(
            viewport={"width": 260 + 150 * len(files), "height": 800}
        )
        page.goto(page_file.as_uri())
        page.wait_for_timeout(300)
        page.screenshot(path=str(out), full_page=True)
        browser.close()
    print(
        f"{out}   ({len(files)} drawing(s) at {', '.join(str(time) for time in arguments.times)} s)"
    )


if __name__ == "__main__":
    main()
