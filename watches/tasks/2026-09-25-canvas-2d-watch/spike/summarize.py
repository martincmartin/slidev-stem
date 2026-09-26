#!/usr/bin/env python3
"""Print the ranges that INVESTIGATION.md's tables quote, from the JSON files
in ../evidence/ (or, with --out, in ../out/ after a rerun): for each
measured variant, the smallest and largest count of gaps over 25 ms and over
12.5 ms per zoom, the largest gap, and the median JS draw time. Reads only;
writes nothing.

    ../../../../.venv/bin/python3 summarize.py      # in spike/
"""

import json
import sys
from collections.abc import Sequence
from pathlib import Path

from frame_gaps import GapSummary
from spike_browser import OUT

HEADED = (
    "svg-canvas",
    "native",
    "firefox-accelerated",
    "firefox-unaccelerated",
    "firefox-cost",
    "firefox-limits",
    "erase",
    "erase-interleaved",
)


def span(values: Sequence[float]) -> str:
    low, high = min(values), max(values)
    return f"{low:g}" if low == high else f"{low:g}–{high:g}"


def summary_line(zooms: Sequence[GapSummary], draws: Sequence[float] = ()) -> str:
    draw = f"  draw median {span(draws)} ms" if draws else ""
    return (
        f">25ms {span([zoom.over_25ms for zoom in zooms]):6} >12.5ms "
        f"{span([zoom.over_12ms for zoom in zooms]):6} largest {max(zoom.largest_ms for zoom in zooms):6.1f}{draw}"
    )


def headed(source: Path) -> None:
    for name in HEADED:
        table = json.loads((source / f"headed-{name}.json").read_text())
        print(f"headed-{name}")
        for browser, rows in table.items():
            print(f"  {browser}")
            for variant, zooms in rows.items():
                if variant == "idle":
                    continue
                gaps = [GapSummary.of(zoom["gaps_ms"]) for zoom in zooms]
                draws = [
                    zoom["draw_ms_median_max"][0]
                    for zoom in zooms
                    if zoom["draw_ms_median_max"]
                ]
                print(f"    {variant:42} {summary_line(gaps, draws)}")


def real(source: Path) -> None:
    for path in sorted(source.glob("real-*.json")):
        report = json.loads(path.read_text())
        print(f"{path.stem} {report['window']}")
        for direction in ("zoomIn", "zoomOut"):
            gaps = [
                GapSummary.of([gap for _, gap, _ in zoom[direction]])
                for zoom in report["zooms"]
            ]
            print(f"    {direction:8} {summary_line(gaps)}")


def deck(source: Path) -> None:
    table = json.loads((source / "deck-frames.json").read_text())
    print("deck-frames")
    for browser, rows in table.items():
        for direction in ("in", "out"):
            gaps = [
                GapSummary.of(pair[direction]["gaps_ms"]) for pair in rows["changes"]
            ]
            print(f"  {browser[:30]:30} {direction:3} {summary_line(gaps)}")


def main() -> None:
    source = OUT if "--out" in sys.argv[1:] else OUT.parent / "evidence"
    headed(source)
    real(source)
    deck(source)


if __name__ == "__main__":
    main()
