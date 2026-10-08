"""Time build, print, or smoke checks of the isolated deck."""

import argparse
import json
import subprocess
import tempfile
import time
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--browser", choices=("chromium", "firefox"), default="chromium"
    )
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--smoke", action="store_true")
    arguments = parser.parse_args()
    project = Path(__file__).resolve().parent / "inputs/project"
    started = time.perf_counter()
    results: list[dict[str, object]] = []
    with tempfile.TemporaryDirectory(prefix="validation-profile-") as temporary:
        commands = [
            (
                "build",
                project / "watches",
                [
                    str(project / "watches/node_modules/.bin/slidev"),
                    "build",
                    "--out",
                    temporary,
                ],
            ),
            (
                "print",
                project / "watches",
                [
                    "uv",
                    "run",
                    "art/print_check.py",
                    temporary,
                    "--browser",
                    arguments.browser,
                ],
            ),
        ]
        if arguments.smoke:
            commands = commands[:1]
            commands.append(
                (
                    "rapid smoke walk",
                    project,
                    [
                        "uv",
                        "run",
                        f"tools/offline_smoke_{arguments.browser}.py",
                        temporary,
                        "--walk",
                    ],
                )
            )
        for label, directory, command in commands:
            check_started = time.perf_counter()
            result = subprocess.run(
                command, cwd=directory, capture_output=True, text=True, check=False
            )
            seconds = time.perf_counter() - check_started
            results.append(
                {
                    "label": label,
                    "command": command,
                    "cwd": str(directory),
                    "seconds": seconds,
                    "passed": result.returncode == 0,
                    "output": result.stdout + result.stderr,
                }
            )
            print(f"{label}: {seconds:.2f} s; exit {result.returncode}", flush=True)
            if result.returncode != 0:
                break
    arguments.output.write_text(
        json.dumps(
            {"seconds": time.perf_counter() - started, "checks": results}, indent=2
        )
        + "\n"
    )
    if any(not result["passed"] for result in results):
        raise SystemExit(1)


if __name__ == "__main__":
    main()
