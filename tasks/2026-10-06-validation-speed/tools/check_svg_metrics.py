#!/usr/bin/env python3
"""Check both engines' motion metrics on the saved SVG sample frames.

Run with the house environment and give the repository root and task directory.
The subprocess imports normally from tools/.
"""

import argparse
import subprocess
import sys
from pathlib import Path

DRIVER = """from pathlib import Path
import sys, json, barroom, motion, lib
from PIL import Image
root = Path(sys.argv[1])
records = []
for engine in ('chromium', 'firefox'):
    for file in sorted((root / 'inputs/watches/public').rglob('*.svg')):
        plan = motion.plan(file)
        if plan is None: continue
        times = sorted({time for pair in plan.pairs for time in pair})
        changes = []
        for first, second in plan.pairs:
            with Image.open(root / 'evidence/frames' / engine / f'{file.stem}-{times.index(first)}.png') as before:
                with Image.open(root / 'evidence/frames' / engine / f'{file.stem}-{times.index(second)}.png') as after:
                    changes.append(motion.measure(before, after, lib.DESIGN_VENUE.blur_sigma(barroom.DEVICE_SCALE), 0.0))
        bands = {band: sum(change.band_areas[band] for change in changes) / len(changes) for band in motion.BANDS}
        measured = motion.Change(sum(change.peak for change in changes) / len(changes),
                                sum(change.p99 for change in changes) / len(changes), bands)
        records.append(dict(engine=engine, drawing=file.stem, peak=measured.peak,
                            bands=measured.band_areas, in_wash=measured.in_wash))
(root / 'evidence/browser-motion-metrics.json').write_text(json.dumps(records, indent=2))
for record in records: print(record['engine'], record['drawing'], not record['in_wash'])
raise SystemExit(int(any(record['in_wash'] for record in records)))
"""


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", type=Path)
    parser.add_argument("task", type=Path)
    arguments = parser.parse_args()
    subprocess.run(
        [sys.executable, "-c", DRIVER, str(arguments.task)],
        cwd=arguments.root / "tools",
        check=True,
    )


if __name__ == "__main__":
    main()
