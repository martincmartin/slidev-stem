#!/usr/bin/env python3
"""Print the tables of PLAN.md from ../evidence/webgl_probe.json.

    uv run --project ../../.. python summarize.py      # in tools/, after webgl_probe.py

For each "slab" still, the FLOOR is the smallest solid error of any method.
An error that every method makes is in the model or the reference, not in a
hidden-line method: for example, a line at a concave edge where a wall rises
from a face, which the slab order half covers with the wall drawn after it.
A method's EXCESS is its solid error above the floor.
"""

import json
import pathlib
import statistics

TOOLS = pathlib.Path(__file__).resolve().parent
PROBE = TOOLS.parents[1] / "evidence" / "webgl_probe.json"
TILTS = ("0", "5", "15", "30", "45", "60", "75", "85", "89")
MOVING = ("0.1", "0.25", "0.6", "1.3")


def cell(area: dict[str, float]) -> str:
    return f"{area['solid']:g} ({area['wrong']:,.0f})"


def main() -> None:
    data = json.loads(PROBE.read_text())
    labels = [method["label"] for method in data["methods"]]
    drawn = data["drawing area of each reference, CSS px^2"]
    rows = {row["still"]: row for row in data["chromium"]["stills"]}
    firefox = {row["still"]: row for row in data["firefox"]["stills"]}
    differences = [
        abs(rows[name][label][key] - firefox[name][label][key])
        for name in rows
        if rows[name]["kind"] != "show"
        for label in labels
        for key in ("wrong", "solid")
    ]
    print(f"largest Chromium-Firefox difference: {max(differences):g} px²\n")

    for width in ("own", "1px"):
        slab = [
            row
            for row in rows.values()
            if row["kind"] == "slab" and f"lines-{width}" in row["still"]
        ]
        floors = {
            row["still"]: min(row[label]["solid"] for label in labels) for row in slab
        }
        print(f"## slab stills, lines {width}: {len(slab)} stills")
        print(
            "| Method | No solid error | Worst solid | Median solid | Worst excess | Stills with excess | Worst wrong | Median wrong |"
        )
        print("| --- | --- | --- | --- | --- | --- | --- | --- |")
        for label in labels:
            solid = [row[label]["solid"] for row in slab]
            wrong = [row[label]["wrong"] for row in slab]
            excess = [row[label]["solid"] - floors[row["still"]] for row in slab]
            print(
                f"| {label} | {sum(1 for area in solid if area == 0)} | {max(solid):g} | "
                f"{statistics.median(solid):g} | {max(excess):g} | "
                f"{sum(1 for area in excess if area > 0)} | {max(wrong):,.0f} | "
                f"{statistics.median(wrong):,.0f} |"
            )
        print()

    for view in ("cover", "hairspring"):
        print(f"## {view}: solid (wrong), house widths")
        print("| Tilt | Drawn | Floor | " + " | ".join(labels) + " |")
        print("| --- | --- | --- | " + " | ".join("---" for _ in labels) + " |")
        names = [
            (f"{tilt}°", f"slab-{view}-tilt-{tilt}-time-0.37-lines-own")
            for tilt in TILTS
        ]
        names += [
            (f"45°, {time} s", f"slab-{view}-tilt-45-time-{time}-lines-own")
            for time in MOVING
        ]
        for title, name in names:
            row = rows[name]
            floor = min(row[label]["solid"] for label in labels)
            print(
                f"| {title} | {drawn[name]:,.0f} | {floor:g} | "
                + " | ".join(cell(row[label]) for label in labels)
                + " |"
            )
        print()

    print("## parity: the whole cover at 0°, against the real 2D drawing")
    print("| Time | Drawn | " + " | ".join(labels) + " |")
    print("| --- | --- | " + " | ".join("---" for _ in labels) + " |")
    for name, row in rows.items():
        if row["kind"] == "parity":
            time = name.split("-time-")[1].split("-")[0]
            print(
                f"| {time} s | {drawn[name]:,.0f} | "
                + " | ".join(cell(row[label]) for label in labels)
                + " |"
            )
    print()

    print("## timing")
    for browser in ("chromium", "firefox"):
        print(browser, data[browser]["version"], data[browser]["renderer"]["renderer"])
        for label, summary in data[browser]["timing"].items():
            print(f"  {label}: {summary}")


if __name__ == "__main__":
    main()
