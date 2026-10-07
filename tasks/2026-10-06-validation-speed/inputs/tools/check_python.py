#!/usr/bin/env python3
"""Check Python files with ruff format, ruff check, mypy --strict and pyright.

    uv run tools/check_python.py              # in stem/: every tool here
    uv run tools/check_python.py a.py b.py    # these files

ruff rewrites the files in place: it formats them and applies its safe fixes.
The checks stop at the first that fails, print its output and exit non-zero.
Each file is checked in its own uv project: the nearest directory above it
with a pyproject.toml (stem/ for the tools, the talk's directory for a talk's
scripts). That project's venv gives the checkers and the package versions, and
its pyproject.toml gives the settings. A talk's validator runs this on its own
scripts, so all of the house's Python is held to the same checks.

This file also defines those checks for validate.py, which runs them without
rewriting anything.
"""

import argparse
import os
import subprocess
import sys
import tomllib
from dataclasses import dataclass
from pathlib import Path

STEM = Path(__file__).resolve().parents[1]  # stem/


@dataclass(frozen=True)
class Check:
    """A command, run in `directory`, that passes if it exits 0."""

    label: str
    directory: Path
    command: tuple[str, ...]
    # Print the last line of the output after "ok" (ruff format's count).
    shows_summary: bool = False


def project_of(path: Path) -> Path:
    """The directory of the uv project that holds `path`, a file or a
    directory."""
    for directory in (path, *path.parents):
        if (directory / "pyproject.toml").is_file():
            return directory
    sys.exit(f"no pyproject.toml above {path}")


def code_paths(project: Path) -> list[str]:
    """The project's own Python code: the `files` of [tool.mypy] in its
    pyproject.toml."""
    settings = tomllib.loads((project / "pyproject.toml").read_text())
    paths: list[str] = settings["tool"]["mypy"]["files"]
    return paths


def uv_run(*arguments: str) -> tuple[str, ...]:
    """A command that runs `arguments` in the venv of the uv project that holds
    the working directory. With `--locked`, it fails if the project's uv.lock
    does not match its pyproject.toml."""
    return ("uv", "run", "--locked", "--quiet", *arguments)


def python_checks(project: Path, files: list[str], fix: bool) -> list[Check]:
    """The four checks on `files` in `project`. With `fix`, ruff rewrites the
    files first: it formats them and applies its safe fixes. Without it, ruff
    only reports."""
    return [
        Check(
            "ruff format",
            project,
            uv_run("ruff", "format", *(() if fix else ("--check",)), *files),
            shows_summary=True,
        ),
        Check(
            "ruff check",
            project,
            uv_run("ruff", "check", *(("--fix",) if fix else ()), *files),
        ),
        Check("mypy --strict", project, uv_run("mypy", *files)),  # strict: in settings
        Check("pyright", project, uv_run("pyright", *files)),
    ]


def run(check: Check) -> subprocess.CompletedProcess[str]:
    """Run `check`, and capture its output."""
    # uv warns if VIRTUAL_ENV names another project's venv: the caller's.
    environment = {
        name: value for name, value in os.environ.items() if name != "VIRTUAL_ENV"
    }
    return subprocess.run(
        check.command,
        cwd=check.directory,
        env=environment,
        capture_output=True,
        text=True,
        check=False,
    )


def ok_line(check: Check, result: subprocess.CompletedProcess[str]) -> str:
    """The line that reports that `check` passed."""
    output = (result.stdout + result.stderr).strip()
    if check.shows_summary and output:
        return f"ok    {check.label}  ({output.splitlines()[-1]})"
    return f"ok    {check.label}"


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("files", nargs="*", help="Python files (default: tools/)")
    arguments = parser.parse_args()
    by_project: dict[Path, list[str]] = {}
    for file in arguments.files:
        path = Path(file).resolve()
        by_project.setdefault(project_of(path), []).append(str(path))
    if not by_project:
        by_project[STEM] = code_paths(STEM)
    for project, project_files in by_project.items():
        if len(by_project) > 1:
            print(f"--    {project}")
        for check in python_checks(project, project_files, fix=True):
            result = run(check)
            if result.returncode != 0:
                print(
                    f"FAIL  {check.label}\n{(result.stdout + result.stderr).rstrip()}"
                )
                sys.exit(1)
            print(ok_line(check, result))


if __name__ == "__main__":
    main()
