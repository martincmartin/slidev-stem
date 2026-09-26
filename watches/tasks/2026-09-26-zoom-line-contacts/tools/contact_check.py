#!/usr/bin/env python3
"""Which parts touch only through their ink? See ../PLAN.md for the test:
a pair is at risk at a time when its centre lines are g apart, with
(w1 + w2) / (2 s) < g <= (w1 + w2) / 2, so the ink touches at rest and a gap
opens when the view is zoomed by s with constant screen widths.

The browser measures its own drawing: each outline is sampled once in its own
coordinates, and at each time SMIL is paused there and getCTM() places it.
A placement that has not changed since the time before is reused. A gap is
hidden when the fill at its midpoint belongs to a shape painted at or above
the pair's upper shape (hit-testing fills only). Writes
../out/contacts-<browser>.json, and prints the at-risk pairs, worst first.

    ../../../../.venv/bin/python3 contact_check.py ../../../public/cover/skeleton-watch.svg
"""

import json
import sys
from dataclasses import dataclass
from pathlib import Path

import numpy as np
from numpy.typing import NDArray
from playwright.sync_api import Page, sync_playwright
from scipy.spatial import KDTree

Points = NDArray[np.float64]  # shape (n, 2)
OUT = Path(__file__).resolve().parent.parent / "out"
SCALE = 250 / 56  # the hairspring view (the zoom task)
# The hairspring view's frame in drawing units: the camera translate(-3067.768,
# -450.339) scale(SCALE) of the zoom task's watch-1dp.svg, on a 980 x 552 canvas.
VIEW = (3067.768 / SCALE, 450.339 / SCALE, 980 / SCALE, 552 / SCALE)
SPACING = 0.1  # drawing units between samples
# The hairspring changes shape, so it is sampled at each time, and
# getPointAtLength on its long path is slow: every 0.3 units, not 0.1.
MORPH_SPACING = 0.3
TIMES = [*np.arange(0, 2, 0.005), *np.arange(2, 62, 0.5)]  # a period, then a minute
# Every stroked or filled shape outside <defs>, its stroke width, the element
# whose animation moves it (or none), and its outline in its own coordinates.
SAMPLE = """spacing => {
  const svg = document.documentElement;
  svg.pauseAnimations();
  svg.setCurrentTime(0);
  window.shapes = [...svg.querySelectorAll("path, circle, rect, ellipse, polygon")]
    .filter(shape => !shape.closest("defs"));
  const fillsOnly = document.createElementNS("http://www.w3.org/2000/svg", "style");
  fillsOnly.textContent = "* { pointer-events: fill !important; }";
  svg.append(fillsOnly);
  const animated = node => node.querySelector(":scope > animate, :scope > animateTransform");
  window.outline = (shape, spacing) => {
    const length = shape.getTotalLength(), count = Math.max(8, Math.ceil(length / spacing));
    return Array.from({ length: count }, (_, index) => {
      const point = shape.getPointAtLength(index * length / count);
      return [point.x, point.y];
    });
  };
  return shapes.map(shape => {
    let mover = shape;
    while (mover !== svg && !animated(mover)) mover = mover.parentElement;
    const origin = mover === svg ? null : new DOMPoint(0, 0).matrixTransform(mover.getCTM());
    const stroke = getComputedStyle(shape).stroke;
    return {
      mover: origin && `${animated(mover).localName} at ${origin.x.toFixed(1)},${origin.y.toFixed(1)}`,
      width: stroke === "none" ? 0 : parseFloat(getComputedStyle(shape).strokeWidth),
      outline: outline(shape, spacing),
    };
  });
}"""
# At `time`: each shape's CTM, and the outlines of the shapes that change shape.
AT = """([time, spacing]) => {
  document.documentElement.setCurrentTime(time);
  return shapes.map(shape => {
    const matrix = shape.getCTM();
    return {
      matrix: [matrix.a, matrix.b, matrix.c, matrix.d, matrix.e, matrix.f],
      outline: shape.querySelector(":scope > animate[attributeName=d]") ? outline(shape, spacing) : null,
    };
  });
}"""
# For each [x, y, upper]: is the topmost fill there painted below shape `upper`?
UNCOVERED = """points => points.map(([x, y, upper]) =>
  shapes.indexOf(document.elementFromPoint(x, y)) < upper)"""


@dataclass(eq=False)
class Shape:
    index: int  # among the SVG's shapes
    mover: str | None  # what moves it, for reports; None if nothing does
    width: float
    outline: Points  # in its own coordinates


@dataclass(eq=False)
class Placement:
    """Where a shape is at one time. The same object while it does not move."""

    matrix: list[float]
    tree: KDTree


@dataclass(frozen=True)
class Gap:
    first: Shape
    second: Shape
    time: float
    gap: float  # between the centre lines, in drawing units
    where: tuple[float, float]
    visible: bool  # not covered by a fill painted above the pair

    @property
    def zoomed(self) -> float:
        """The gap on the screen in the zoomed view, in px."""
        return self.gap * SCALE - (self.first.width + self.second.width) / 2

    @property
    def in_view(self) -> bool:
        left, top, width, height = VIEW
        return (
            left <= self.where[0] <= left + width
            and top <= self.where[1] <= top + height
        )


def placed(outline: Points, matrix: list[float]) -> Points:
    a, b, c, d, e, f = matrix
    result: Points = outline @ np.array([[a, b], [c, d]]) + np.array([e, f])
    return result


# A pair's closest approach under reach, as (distance, midpoint), and the two
# placements it was measured at.
Nearest = tuple[float, tuple[float, float]] | None
PairCache = dict[tuple[Shape, Shape], tuple[Placement, Placement, Nearest]]


def nearest(first: Placement, second: Placement, reach: float) -> Nearest:
    if (first.tree.mins > second.tree.maxes + reach).any() or (
        second.tree.mins > first.tree.maxes + reach
    ).any():
        return None
    distances, indices = second.tree.query(first.tree.data, distance_upper_bound=reach)
    closest = int(distances.argmin())
    if not np.isfinite(distances[closest]):
        return None
    x, y = (first.tree.data[closest] + second.tree.data[indices[closest]]) / 2
    return float(distances[closest]), (float(x), float(y))


def gaps_at(
    page: Page,
    shapes: list[Shape],
    time: float,
    before: dict[Shape, Placement],
    pairs: PairCache,
) -> list[Gap]:
    """The at-risk gaps at `time`. `before` and `pairs` are this run's side
    tables: each shape's last placement, and each pair's last result."""
    for shape, state in zip(
        shapes, page.evaluate(AT, [time, MORPH_SPACING]), strict=True
    ):
        last = before.get(shape)
        if state["outline"] or last is None or last.matrix != state["matrix"]:
            outline = np.array(state["outline"] or shape.outline)
            before[shape] = Placement(
                state["matrix"], KDTree(placed(outline, state["matrix"]))
            )
    risky = []
    for index, first in enumerate(shapes):
        for second in shapes[index + 1 :]:
            if first.mover is not None and first.mover == second.mover:
                continue  # one part's own lines
            reach = (first.width + second.width) / 2
            cached = pairs.get((first, second))
            if cached and cached[0] is before[first] and cached[1] is before[second]:
                result = cached[2]
            else:
                result = nearest(before[first], before[second], reach)
                pairs[(first, second)] = (before[first], before[second], result)
            if result and reach / SCALE < result[0] <= reach:
                risky.append((first, second, *result))
    uncovered = page.evaluate(
        UNCOVERED, [[*where, second.index] for _, second, _, where in risky]
    )
    return [
        Gap(first, second, time, gap, where, visible)
        for (first, second, gap, where), visible in zip(risky, uncovered, strict=True)
    ]


def main() -> None:
    svg = Path(sys.argv[1]).resolve()
    OUT.mkdir(exist_ok=True)
    with sync_playwright() as playwright:
        for kind in (playwright.chromium, playwright.firefox):
            browser = kind.launch()
            page = browser.new_page()
            page.goto(svg.as_uri())
            shapes = [
                Shape(index, row["mover"], row["width"], np.array(row["outline"]))
                for index, row in enumerate(page.evaluate(SAMPLE, SPACING))
            ]
            before: dict[Shape, Placement] = {}
            cache: PairCache = {}
            found = [
                gap
                for time in TIMES
                for gap in gaps_at(page, shapes, time, before, cache)
                if gap.visible
            ]
            browser.close()
            pairs: dict[tuple[Shape, Shape], list[Gap]] = {}
            for gap in found:
                pairs.setdefault((gap.first, gap.second), []).append(gap)
            rows = []
            print(f"{kind.name}: {len(shapes)} shapes, {len(TIMES)} times")
            for (first, second), gaps in pairs.items():
                worst = max(gaps, key=lambda gap: gap.zoomed)
                rows.append(
                    {
                        "shapes": [first.index, second.index],
                        "movers": [first.mover, second.mover],
                        "widths": [first.width, second.width],
                        "times_visible_at_risk": len(gaps),
                        "in_view": any(gap.in_view for gap in gaps),
                        "time": round(float(worst.time), 3),
                        "gap": round(worst.gap, 3),
                        "zoomed_px": round(worst.zoomed, 2),
                        "where": [round(value, 1) for value in worst.where],
                    }
                )
            rows.sort(key=lambda row: -float(str(row["zoomed_px"])))
            for row in rows:
                print(" ", row)
            (OUT / f"contacts-{kind.name}.json").write_text(
                json.dumps(rows, indent=1) + "\n"
            )


if __name__ == "__main__":
    main()
