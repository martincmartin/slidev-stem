"""Run each quick check alone, and print its wall time and CPU time.

    cd watches && PYTHONPATH=../tools uv run --project .. python quick_cpu.py
"""

import resource
import tempfile
import time
from pathlib import Path

import validate
from check_python import project_of, run


def main() -> None:
    project = project_of(Path.cwd())
    with (
        tempfile.TemporaryDirectory(prefix="deck-") as deck,
        tempfile.TemporaryDirectory(prefix="art-") as work,
    ):
        (source, build), _ = validate.talk_groups(
            project, Path(deck), Path(work), fix=False, quick=True
        )
        total_wall = total_cpu = 0.0
        for check in [*source, *build]:
            before = resource.getrusage(resource.RUSAGE_CHILDREN)
            started = time.perf_counter()
            result = run(check)
            wall = time.perf_counter() - started
            after = resource.getrusage(resource.RUSAGE_CHILDREN)
            cpu = (after.ru_utime - before.ru_utime) + (after.ru_stime - before.ru_stime)
            total_wall += wall
            total_cpu += cpu
            print(f"{check.label:14} wall {wall:6.2f}  cpu {cpu:6.2f}  cores {cpu / wall:4.1f}  exit {result.returncode}")
        print(f"{'TOTAL':14} wall {total_wall:6.2f}  cpu {total_cpu:6.2f}")


if __name__ == "__main__":
    main()
