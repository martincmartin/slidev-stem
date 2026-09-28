#!/usr/bin/env python3
"""Check Python files with ruff format, ruff check, mypy --strict and pyright.

    .venv/bin/python3 tools/check_python.py              # in stem/: every tool here
    .venv/bin/python3 tools/check_python.py a.py b.py    # these files

ruff format rewrites the files in place. The checks stop at the first that
fails, print its output and exit non-zero. The settings (Python 3.14) are in
stem/pyproject.toml. A talk's validator runs this on its own scripts, so all
of the house's Python is held to the same checks.
"""

import argparse
import subprocess
import sys
from pathlib import Path

TOOLS = Path(__file__).resolve().parent  # stem/tools/
STEM = TOOLS.parent
BIN = STEM / ".venv" / "bin"


def run(label: str, command: list[str]) -> str:
    """Run `command` in stem/. Exit with its output if it fails."""
    result = subprocess.run(
        command, cwd=STEM, capture_output=True, text=True, check=False
    )
    output = result.stdout + result.stderr
    if result.returncode != 0:
        print(f"FAIL  {label}\n{output.rstrip()}")
        sys.exit(1)
    return output


def main() -> None:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("files", nargs="*", help="Python files (default: tools/*.py)")
    arguments = parser.parse_args()
    files = [str(Path(file).resolve()) for file in arguments.files] or sorted(
        str(file) for file in TOOLS.glob("*.py")
    )
    formatted = run("ruff format", [str(BIN / "ruff"), "format", *files]).strip()
    print(
        "ok    ruff format" + (f"  ({formatted.splitlines()[-1]})" if formatted else "")
    )
    run("ruff check", [str(BIN / "ruff"), "check", *files])
    print("ok    ruff check")
    run("mypy --strict", [str(BIN / "mypy"), "--strict", *files])
    print("ok    mypy --strict")
    run("pyright", [str(BIN / "pyright"), *files])
    print("ok    pyright")


if __name__ == "__main__":
    main()
