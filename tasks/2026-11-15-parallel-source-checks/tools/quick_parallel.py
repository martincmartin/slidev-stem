"""Prototype: run quick validation with each source check in its own group.

    cd watches && PYTHONPATH=../tools uv run --project .. python quick_parallel.py JOBS SPLIT [FLAGS...]

SPLIT: "each" (one group per check) or "serial" (today's grouping).
FLAGS: "eslint-threads" (lint --concurrency auto), "nice" (every check but
lint and build at nice 5).
Prints one JSON line: the wall time from before talk_groups, and each check's
time.
"""

import dataclasses
import json
import sys
import tempfile
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import validate
from check_python import project_of

# The longest checks first, from a serial quick run on 2026-11-15.
ORDER = [
    "lint",
    "test",
    "build",
    "prettier",
    "typecheck",
    "generated",
    "palette",
    "pyright",
    "talk setup",
    "spelling",
    "scenecheck",
    "vue roots",
    "mypy --strict",
    "doccheck",
    "ruff format",
    "ruff check",
    "artcheck",
]


def main() -> None:
    jobs = int(sys.argv[1])
    split = sys.argv[2]
    flags = set(sys.argv[3:])
    project = project_of(Path.cwd())
    started = time.perf_counter()
    with (
        tempfile.TemporaryDirectory(prefix="deck-") as deck,
        tempfile.TemporaryDirectory(prefix="art-") as work,
    ):
        (source, build), _ = validate.talk_groups(
            project, Path(deck), Path(work), fix=False, quick=True
        )
        checks = []
        for check in [*source, *build]:
            command = check.command
            if check.label == "lint" and "eslint-threads" in flags:
                command = (*command, "--concurrency", "auto")
            if check.label not in {"lint", "build"} and "nice" in flags:
                command = ("nice", "-n", "5", *command)
            checks.append(dataclasses.replace(check, command=command))
        if split == "serial":
            groups = [checks[:-1], checks[-1:]]
        else:
            groups = sorted(([c] for c in checks), key=lambda g: ORDER.index(g[0].label))
        results: list[validate.CheckResult] = []
        with ThreadPoolExecutor(max_workers=jobs) as workers:
            for group_results in workers.map(validate.run_group, groups):
                results.extend(group_results)
        wall = time.perf_counter() - started
    failed = [r.label for r in results if not r.passed]
    print(
        json.dumps(
            {
                "variant": " ".join([split, str(jobs), *sorted(flags)]),
                "wall": round(wall, 2),
                "failed": failed,
                "checks": {r.label: round(r.seconds, 2) for r in results},
            }
        )
    )


if __name__ == "__main__":
    main()
