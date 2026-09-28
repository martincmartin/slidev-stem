#!/usr/bin/env python3
"""Check Python files with ruff format, ruff check, mypy --strict and pyright.

    uv run tools/check_python.py              # in stem/: every tool here
    uv run tools/check_python.py a.py b.py    # these files

ruff format rewrites the files in place. The checks stop at the first that
fails, print its output and exit non-zero. Each file is checked in its own uv
project: the nearest directory above it with a pyproject.toml (stem/ for the
tools, the talk's directory for a talk's scripts). That project's venv gives
the checkers and the package versions, and its pyproject.toml gives the
settings. A talk's validator runs this on its own scripts, so all of the
house's Python is held to the same checks.
"""

import argparse
import os
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent  # stem/tools/


def project_of(file: Path) -> Path:
    """The directory of the uv project that holds `file`."""
    for directory in file.parents:
        if (directory / "pyproject.toml").is_file():
            return directory
    sys.exit(f"no pyproject.toml above {file}")


def run(label: str, project: Path, command: list[str]) -> str:
    """Run `command` in `project`'s venv and directory. Exit with its output if
    it fails."""
    # uv warns if VIRTUAL_ENV names another project's venv: the caller's.
    environment = {
        name: value for name, value in os.environ.items() if name != "VIRTUAL_ENV"
    }
    result = subprocess.run(
        ["uv", "run", "--quiet", *command],
        cwd=project,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )
    output = result.stdout + result.stderr
    if result.returncode != 0:
        print(f"FAIL  {label}\n{output.rstrip()}")
        sys.exit(1)
    return output


def check(project: Path, files: list[str]) -> None:
    """Run the four checks on `files`, which are all in `project`."""
    formatted = run("ruff format", project, ["ruff", "format", *files]).strip()
    print(
        "ok    ruff format" + (f"  ({formatted.splitlines()[-1]})" if formatted else "")
    )
    run("ruff check", project, ["ruff", "check", *files])
    print("ok    ruff check")
    run("mypy --strict", project, ["mypy", "--strict", *files])
    print("ok    mypy --strict")
    run("pyright", project, ["pyright", *files])
    print("ok    pyright")


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("files", nargs="*", help="Python files (default: tools/*.py)")
    arguments = parser.parse_args()
    files = [Path(file).resolve() for file in arguments.files] or sorted(
        TOOLS.glob("*.py")
    )
    by_project: dict[Path, list[str]] = {}
    for file in files:
        by_project.setdefault(project_of(file), []).append(str(file))
    for project, project_files in by_project.items():
        if len(by_project) > 1:
            print(f"--    {project}")
        check(project, project_files)


if __name__ == "__main__":
    main()
