"""Check this package: ruff format, ruff check, mypy --strict, pyright, pytest.

    uv run validate.py          # in doccheck/
    uv run validate.py --fix    # let ruff format and fix first

It runs every check, prints a summary, and exits 1 if any failed.
"""

import argparse
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent


def commands(fix: bool) -> list[tuple[str, ...]]:
    ruff = [("ruff", "format"), ("ruff", "check", "--fix")] if fix else []
    return [
        *ruff,
        ("ruff", "format", "--check"),
        ("ruff", "check"),
        ("mypy",),
        ("pyright",),
        ("pytest", "-q"),
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument("--fix", action="store_true", help="let ruff rewrite first")
    arguments = parser.parse_args()
    failed: list[str] = []
    for command in commands(arguments.fix):
        result = subprocess.run(
            command, cwd=HERE, capture_output=True, text=True, check=False
        )
        label = " ".join(command)
        if result.returncode == 0:
            print(f"ok    {label}")
        else:
            failed.append(label)
            print(f"FAIL  {label}\n{result.stdout}{result.stderr}")
    if failed:
        print(f"\n{len(failed)} checks failed: {', '.join(failed)}")
        return 1
    print("\nall checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
