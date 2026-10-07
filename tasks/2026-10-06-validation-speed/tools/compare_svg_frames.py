#!/usr/bin/env python3
"""Compare frozen and current SVG samples, then check both browser engines.

Run with the house environment. Give the repository root and evidence directory.
The subprocess imports from tools/ normally. No module search path is changed.
"""

import argparse
import json
import subprocess
import sys
from pathlib import Path

from PIL import Image, ImageChops

DRIVER = """from pathlib import Path
import sys, barroom, motion
public, output, engine, mode = map(Path, sys.argv[1:])
files = sorted(public.rglob('*.svg'))
plans = {file: motion.plan(file) for file in files}
samples = {file: sorted({time for pair in plan.pairs for time in pair})
           for file, plan in plans.items() if plan}
output.mkdir(parents=True, exist_ok=True)
if str(mode) == 'baseline':
    for time in sorted({time for times in samples.values() for time in times}):
        _, cards = barroom.render_svgs(files, time)
        for file, card in zip(files, cards, strict=True):
            if file in samples and time in samples[file]:
                card.save(output / (file.stem + '-' + str(samples[file].index(time)) + '.png'))
else:
    frames = barroom.render_samples(samples, str(engine))
    for file, times in samples.items():
        for index, time in enumerate(times):
            frames[file][time].save(output / (file.stem + '-' + str(index) + '.png'))
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("task", type=Path)
    arguments = parser.parse_args()
    public = arguments.task / "inputs/watches/public"
    evidence = arguments.task / "evidence/frames"
    variants = (
        ("baseline", arguments.task / "inputs/tools", "chromium", "baseline"),
        ("chromium", arguments.root / "tools", "chromium", "current"),
        ("firefox", arguments.root / "tools", "firefox", "current"),
    )
    for name, directory, engine, mode in variants:
        subprocess.run(
            [
                sys.executable,
                "-c",
                DRIVER,
                str(public),
                str(evidence / name),
                engine,
                mode,
            ],
            cwd=directory,
            check=True,
        )
        print(name, "rendered", flush=True)
    records = []
    for file in sorted((evidence / "baseline").glob("*.png")):
        with Image.open(file) as original:
            for name in ("chromium", "firefox"):
                with Image.open(evidence / name / file.name) as current:
                    difference = ImageChops.difference(
                        original.convert("RGB"), current.convert("RGB")
                    )
                    records.append(
                        {
                            "frame": file.name,
                            "engine": name,
                            "identical": difference.getbbox() is None,
                        }
                    )
    (arguments.task / "evidence/frame-comparison.json").write_text(
        json.dumps(records, indent=2)
    )
    # Firefox rasterization can differ. Chromium must preserve every baseline pixel.
    if any(
        not record["identical"] for record in records if record["engine"] == "chromium"
    ):
        sys.exit(1)
    print("Chromium baseline parity passed for", len(records) // 2, "samples")
    print(
        "Firefox identical samples:",
        sum(record["identical"] for record in records if record["engine"] == "firefox"),
    )


if __name__ == "__main__":
    main()
