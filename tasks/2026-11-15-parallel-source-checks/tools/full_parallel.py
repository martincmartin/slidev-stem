"""Prototype: full-mode preparation (no smoke navigation) with the source
group split into one group per check.

    cd watches && PYTHONPATH=../tools uv run --project .. python full_parallel.py JOBS SPLIT

SPLIT: "serial" (today's groups) or "each". Print is skipped, as in a normal
run where no print input changed. No pass record is read or written.
"""

import json
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import validate
from check_python import project_of

ORDER = ["lint", "test", "prettier", "typecheck", "generated", "palette", "pyright",
         "spelling", "scenecheck", "talk setup", "vue roots", "mypy --strict",
         "doccheck", "ruff format", "ruff check", "artcheck"]


def main() -> None:
    jobs = int(sys.argv[1])
    split = sys.argv[2]
    project = project_of(Path.cwd())
    started = time.perf_counter()
    with (
        tempfile.TemporaryDirectory(prefix="deck-") as deck,
        tempfile.TemporaryDirectory(prefix="art-") as work,
    ):
        groups, _ = validate.talk_groups(
            project, Path(deck), Path(work), fix=False, quick=False,
            record=None, run_print=False,
        )
        built_deck, source, svg, stills = groups
        if split == "each":
            singles = sorted(([c] for c in source), key=lambda g: ORDER.index(g[0].label))
            groups = [built_deck, stills, *singles, svg]
        results: list[validate.CheckResult] = []
        with ThreadPoolExecutor(max_workers=jobs) as workers:
            for group_results in workers.map(validate.run_group, groups):
                results.extend(group_results)
        wall = time.perf_counter() - started
    print(json.dumps({
        "variant": f"{split} {jobs}",
        "wall": round(wall, 2),
        "failed": [r.label for r in results if not r.passed],
        "checks": {r.label: round(r.seconds, 2) for r in results},
    }))


if __name__ == "__main__":
    main()
