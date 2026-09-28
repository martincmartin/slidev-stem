#!/usr/bin/env python3
"""Validate what the current directory belongs to. Run it before you commit.

    uv run tools/validate.py              # in stem/: the shared files only
    uv run ../tools/validate.py           # in a talk's directory: that talk only
    uv run tools/validate.py --fix        # ruff formats and fixes first

What it checks comes from the uv project that holds the current directory:

  * stem/, the house: the four Python checks of check_python.py (ruff format,
    ruff check, mypy --strict, pyright) on tools/; Prettier on the shared files
    (`pnpm format:check`); and the palette's gates (palette.py). Nothing in a
    talk.
  * a talk: the same four checks on the talk's own code, in the talk's uv
    project, with its versions and its settings; Prettier on the talk; artcheck.py,
    barroom.py and motion.py on every SVG in its public/; palette.py's check that
    the talk does not set the palette; and a build of the deck (`pnpm build`,
    into a temporary directory), which offline_check.py --walk then steps
    through, slide by slide and click by click, with every outside request
    blocked. Nothing outside the talk.

It only reports, unless you give --fix: then ruff and Prettier rewrite the
files first. It runs every check, even after one fails, then prints a summary
and exits non-zero if any check failed. Each Python command runs with
`uv run --locked`, so a uv.lock that does not match its pyproject.toml fails
too.

Run it only in a talk in progress. A given talk is not checked again
(AGENTS.md, "Given talks and versions").
"""

import argparse
import sys
import tempfile
import textwrap
from pathlib import Path

import lib
from check_python import (
    STEM,
    Check,
    code_paths,
    ok_line,
    project_of,
    python_checks,
    run,
    uv_run,
)


def prettier(directory: Path, fix: bool) -> Check:
    """Prettier, through the `format` scripts of the package.json in
    `directory`. Each project's scripts say which files are its own."""
    return Check("prettier", directory, ("pnpm", "format" if fix else "format:check"))


def house_checks(fix: bool) -> list[Check]:
    """The checks of the shared files in stem/."""
    return [
        *python_checks(STEM, code_paths(STEM), fix),
        prettier(STEM, fix),
        Check("palette", STEM, uv_run("tools/palette.py")),
    ]


def talk_checks(directory: Path, deck: Path, fix: bool) -> list[Check]:
    """The checks of the talk in `directory`. The house tools run in stem/, on
    the talk's files. The deck is built into `deck`, an empty directory."""
    talk = str(lib.display_path(directory))
    public = str(lib.display_path(directory / "public"))
    return [
        *python_checks(directory, code_paths(directory), fix),
        prettier(directory, fix),
        Check("artcheck", STEM, uv_run("tools/artcheck.py", public)),
        Check("barroom", STEM, uv_run("tools/barroom.py", public)),
        Check("motion", STEM, uv_run("tools/motion.py", public)),
        Check("palette", STEM, uv_run("tools/palette.py", "--talk", talk)),
        Check("build", directory, ("pnpm", "build", "--out", str(deck))),
        Check(
            "offline",
            STEM,
            uv_run("tools/offline_check.py", str(deck), "--walk"),
            shows_summary=True,
        ),
    ]


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "--fix",
        action="store_true",
        help="let ruff and Prettier rewrite the files first, then check",
    )
    arguments = parser.parse_args()
    project = project_of(Path.cwd())
    with tempfile.TemporaryDirectory(prefix="deck-") as deck:
        if project == STEM:
            heading, checks = "stem/, the shared files", house_checks(arguments.fix)
        elif (project / "slides.md").is_file():
            heading = f"{lib.display_path(project)}/, a talk"
            checks = talk_checks(project, Path(deck), arguments.fix)
        else:
            sys.exit(f"{project} is neither stem/ nor a talk (it has no slides.md)")
        return run_all(heading, checks)


def run_all(heading: str, checks: list[Check]) -> int:
    """Run every check, report each, and return the exit code."""
    print(f"--    {heading}")
    failed: list[Check] = []
    for check in checks:
        result = run(check)
        if result.returncode == 0:
            print(ok_line(check, result))
            continue
        failed.append(check)
        print(f"FAIL  {check.label}")
        print(textwrap.indent((result.stdout + result.stderr).rstrip(), "      "))
    if failed:
        names = ", ".join(check.label for check in failed)
        print(f"\n{len(failed)} of {len(checks)} checks failed ({names})")
        return 1
    print(f"\nall {len(checks)} checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
