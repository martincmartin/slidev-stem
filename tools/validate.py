#!/usr/bin/env python3
"""Validate what the current directory belongs to. Run it before you commit.

    uv run tools/validate.py              # in stem/: the shared files only
    uv run ../tools/validate.py           # in a talk's directory: that talk only
    uv run tools/validate.py --fix        # ruff formats and fixes first

What it checks comes from the uv project that holds the current directory:

  * stem/, the house: the four Python checks of check_python.py (ruff format,
    ruff check, mypy --strict, pyright) on tools/; Prettier on the shared files
    (`pnpm format:check`); pytest on the tests in tools/ (test_*.py); the doc
    check (doccheck.py) on docs/, tools/, themes/, README.md and AGENTS.md; and
    the palette's gates (palette.py). Nothing in a talk.
  * a talk: the same four checks on the talk's own code, in the talk's uv
    project, with its versions and its settings; Prettier on the talk; the doc
    check on its docs/, README.md and AGENTS.md; artcheck.py,
    barroom.py and motion.py on every SVG in its public/; palette.py's check that
    the talk sets the palette only for slide classes, within the gates; and a build of the deck (`pnpm build`,
    into a temporary directory), which offline_check.py --walk then steps
    through, slide by slide and click by click, with every outside request
    blocked. Nothing outside the talk.
  * a talk with TypeScript (scripts in its package.json): also `pnpm typecheck`,
    `pnpm lint` and `pnpm test`. A talk with WebGL art (the script `art:scene`)
    also has its scene written to a temporary file and checked by scenecheck.py;
    with the script `art:stills`, its PNG stills written to a temporary directory
    (with pairs.json, a list of [first, second] file names), and barroom.py run
    on the PNGs and motion.py --png-pair on each pair.

It only reports, unless you give --fix: then ruff and Prettier rewrite the
files first. It runs every check, even after one fails, then prints a summary
and exits non-zero if any check failed. Each Python command runs with
`uv run --locked`, so a uv.lock that does not match its pyproject.toml fails
too.

Run it only in a talk in progress. A given talk is not checked again
(AGENTS.md, "Given talks and versions").
"""

import argparse
import json
import shlex
import sys
import tempfile
import textwrap
from collections.abc import Callable, Sequence
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


# The Markdown that doccheck reads in each project, if it is there. Not tasks/:
# a finished task is frozen, and its links may point at what has moved since.
DOC_PATHS = ("docs", "README.md", "AGENTS.md")
HOUSE_DOC_PATHS = (*DOC_PATHS, "tools", "themes")


def doccheck(directory: Path, names: Sequence[str]) -> Check:
    """The doc check (doccheck.py): links, anchors, each docs/
    against its two indexes, and the paths into tools/, in the files and
    directories `names` of `directory`."""
    paths = [
        str(lib.display_path(directory / name))
        for name in names
        if (directory / name).exists()
    ]
    return Check(
        "doccheck", STEM, uv_run("tools/doccheck.py", *paths, "--tools", "tools")
    )


def house_checks(fix: bool) -> list[Check]:
    """The checks of the shared files in stem/."""
    return [
        *python_checks(STEM, code_paths(STEM), fix),
        prettier(STEM, fix),
        Check(
            "pytest", STEM, uv_run("pytest", "-q", "-p", "no:cacheprovider", "tools")
        ),
        doccheck(STEM, HOUSE_DOC_PATHS),
        Check("palette", STEM, uv_run("tools/palette.py")),
    ]


# A check that is made when it is reached, because what it runs on is made by a
# check before it.
Later = Callable[[], Check]


def scripts_of(directory: Path) -> set[str]:
    """The names of the scripts in the package.json of `directory`."""
    package = json.loads((directory / "package.json").read_text())
    return set(package.get("scripts", {}))


def typescript_checks(directory: Path) -> list[Check]:
    """Types, lint and unit tests, for a talk that has the scripts."""
    scripts = scripts_of(directory)
    return [
        Check(name, directory, ("pnpm", name))
        for name in ("typecheck", "lint", "test")
        if name in scripts
    ]


def art_checks(directory: Path, work: Path) -> list[Check | Later]:
    """The checks of a talk's WebGL art: its scene, and its PNG stills. `work`
    is an empty directory for what they write."""
    scripts = scripts_of(directory)
    checks: list[Check | Later] = []
    if "art:scene" in scripts:
        scene = work / "scene.json"
        command = (
            f"pnpm --silent art:scene > {shlex.quote(str(scene))}"
            f" && cd {shlex.quote(str(STEM))}"
            f" && {shlex.join(uv_run('tools/scenecheck.py', str(scene)))}"
        )
        checks.append(Check("scenecheck", directory, ("sh", "-c", command)))
    if "art:stills" in scripts:
        stills = work / "stills"
        checks.append(
            Check("stills", directory, ("pnpm", "--silent", "art:stills", str(stills)))
        )
        checks.append(
            lambda: Check(
                "barroom (png)",
                STEM,
                uv_run("tools/barroom.py", *map(str, sorted(stills.glob("*.png")))),
            )
        )

        def motion() -> Check:
            pairs = json.loads((stills / "pairs.json").read_text())
            arguments = [
                argument
                for first, second in pairs
                for argument in (
                    "--png-pair",
                    str(stills / first),
                    str(stills / second),
                )
            ]
            return Check("motion (png)", STEM, uv_run("tools/motion.py", *arguments))

        checks.append(motion)
    return checks


def talk_checks(
    directory: Path, deck: Path, work: Path, fix: bool
) -> list[Check | Later]:
    """The checks of the talk in `directory`. The house tools run in stem/, on
    the talk's files. The deck is built into `deck`, an empty directory; the
    art's files are written into `work`, another."""
    talk = str(lib.display_path(directory))
    public = str(lib.display_path(directory / "public"))
    return [
        *python_checks(directory, code_paths(directory), fix),
        prettier(directory, fix),
        doccheck(directory, DOC_PATHS),
        *typescript_checks(directory),
        Check("artcheck", STEM, uv_run("tools/artcheck.py", public)),
        Check("barroom", STEM, uv_run("tools/barroom.py", public)),
        Check("motion", STEM, uv_run("tools/motion.py", public)),
        *art_checks(directory, work),
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
    with (
        tempfile.TemporaryDirectory(prefix="deck-") as deck,
        tempfile.TemporaryDirectory(prefix="art-") as work,
    ):
        checks: Sequence[Check | Later]
        if project == STEM:
            heading, checks = "stem/, the shared files", house_checks(arguments.fix)
        elif (project / "slides.md").is_file():
            heading = f"{lib.display_path(project)}/, a talk"
            checks = talk_checks(project, Path(deck), Path(work), arguments.fix)
        else:
            sys.exit(f"{project} is neither stem/ nor a talk (it has no slides.md)")
        return run_all(heading, checks)


def run_all(heading: str, checks: Sequence[Check | Later]) -> int:
    """Run every check, report each, and return the exit code."""
    print(f"--    {heading}")
    failed: list[Check] = []
    for item in checks:
        check = item() if callable(item) else item
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
