#!/usr/bin/env python3
"""Validate the current project. Full validation is required before a commit.

    uv run tools/validate.py                 # shared files, from stem/
    uv run ../tools/validate.py              # one talk, from its directory
    uv run ../tools/validate.py --quick      # source, generation, and build
    uv run ../tools/validate.py --jobs 1     # full validation, serial preparation
    uv run ../tools/validate.py --json       # results and timings as JSON

The project comes from the nearest pyproject.toml. No run checks other talks.
The house run checks Python, formatting, tests, documentation, and palette gates.
A talk run also checks its types, lint, tests, SVGs, generated art, and build.
Scripts in package.json select optional scene, stills, and print checks.
Legibility checks calculate the design-venue gate. Full reports remain available
through barroom.py. Motion checks retain every sample in their original plans.

Independent preparation groups use the default worker limit below. Each group keeps
its dependency order. Navigation runs alone after preparation. Its --offline
mode checks startup, page errors, outside requests, and a complete deck walk.
A deck without a state probe receives the ordinary offline walk instead.

--quick omits rendered art, renderer browser checks, print, and navigation.
It does not replace full validation. --fix rewrites Python and formatted files,
with one worker to prevent races. All other modes only report. Build and art
outputs go to temporary directories. Python checks use uv run --locked.
Every check runs after failures. The summary includes each check's elapsed time.
See docs/talks.md and tasks/2026-10-06-validation-speed/PLAN.md.
"""

import argparse
import json
import shlex
import sys
import tempfile
import textwrap
import time
from collections.abc import Callable, Sequence
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
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
DEFAULT_WORKERS = 2
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


@dataclass(frozen=True)
class Later:
    """A check that is made when it is reached, because what it runs on is made
    by a check before it. Its label is known now, so that a failure to make it
    is reported under its name, and the checks after it still run."""

    label: str
    make: Callable[[], Check]


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


def generation_checks(directory: Path, work: Path) -> list[Check | Later]:
    """Check scene data and generated files without browser rendering."""
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
    if "art:generated" in scripts:
        checks.append(
            Check("generated", directory, ("pnpm", "--silent", "art:generated"))
        )
    return checks


def still_checks(directory: Path, work: Path) -> list[Check | Later]:
    """Write watch frames, then check their legibility and motion."""
    scripts = scripts_of(directory)
    checks: list[Check | Later] = []
    if "art:stills" in scripts:
        stills = work / "stills"
        checks.append(
            Check("stills", directory, ("pnpm", "--silent", "art:stills", str(stills)))
        )
        checks.append(
            Later(
                "barroom (png)",
                lambda: Check(
                    "barroom (png)",
                    STEM,
                    uv_run(
                        "tools/barroom.py",
                        *map(str, sorted(stills.glob("*.png"))),
                        "--gate-only",
                    ),
                ),
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

        checks.append(Later("motion (png)", motion))
    return checks


def art_checks(directory: Path, work: Path) -> list[Check | Later]:
    """Return the complete art sequence for callers that run it serially."""
    return [*generation_checks(directory, work), *still_checks(directory, work)]


def print_checks(directory: Path, deck: Path) -> list[Check]:
    """The check of a talk's export pages, for a talk with the script
    `art:print`. It runs on the built deck, which it takes as its argument."""
    if "art:print" not in scripts_of(directory):
        return []
    return [Check("print", directory, ("pnpm", "--silent", "art:print", str(deck)))]


def talk_groups(
    directory: Path, deck: Path, work: Path, fix: bool, quick: bool
) -> tuple[list[list[Check | Later]], list[Check | Later]]:
    """Group independent work. Keep navigation outside the worker pool."""
    talk = str(lib.display_path(directory))
    public = str(lib.display_path(directory / "public"))
    source: list[Check | Later] = [
        *python_checks(directory, code_paths(directory), fix),
        prettier(directory, fix),
        doccheck(directory, DOC_PATHS),
        *typescript_checks(directory),
        Check("artcheck", STEM, uv_run("tools/artcheck.py", public)),
        *generation_checks(directory, work),
        Check("palette", STEM, uv_run("tools/palette.py", "--talk", talk)),
        Check("talk setup", STEM, uv_run("tools/talkcheck.py", talk)),
    ]
    build: list[Check | Later] = [
        Check("build", directory, ("pnpm", "build", "--out", str(deck)))
    ]
    if quick:
        return [source, build], []
    svg: list[Check | Later] = [
        Check("barroom", STEM, uv_run("tools/barroom.py", public, "--gate-only")),
        Check("motion", STEM, uv_run("tools/motion.py", public)),
    ]
    stills = still_checks(directory, work)
    built_deck = [*build, *print_checks(directory, deck)]
    # Start the longest preparation sequence first. With --fix, source
    # rewrites must finish before any browser or build reads those files.
    groups = (
        [source, svg, stills, built_deck] if fix else [built_deck, source, svg, stills]
    )
    return groups, [
        Check(
            "navigation and offline",
            STEM,
            uv_run("tools/navcheck.py", str(deck), "--offline"),
            shows_summary=True,
        ),
    ]


@dataclass(frozen=True)
class CheckResult:
    label: str
    passed: bool
    seconds: float
    message: str
    output: str


def run_group(checks: Sequence[Check | Later]) -> list[CheckResult]:
    """Run one dependency sequence. Continue after failures."""
    results = []
    for item in checks:
        started = time.perf_counter()
        try:
            check = item.make() if isinstance(item, Later) else item
            result = run(check)
            results.append(
                CheckResult(
                    check.label,
                    result.returncode == 0,
                    time.perf_counter() - started,
                    ok_line(check, result)
                    if result.returncode == 0
                    else f"FAIL  {check.label}",
                    (result.stdout + result.stderr).rstrip(),
                )
            )
        except (OSError, ValueError) as error:
            results.append(
                CheckResult(
                    item.label,
                    False,
                    time.perf_counter() - started,
                    f"FAIL  {item.label}",
                    f"could not run: {error}",
                )
            )
    return results


def report(
    heading: str, results: Sequence[CheckResult], seconds: float, machine_json: bool
) -> int:
    failed = [result.label for result in results if not result.passed]
    if machine_json:
        from dataclasses import asdict

        print(
            json.dumps(
                {
                    "project": heading,
                    "seconds": seconds,
                    "passed": not failed,
                    "checks": [asdict(result) for result in results],
                },
                indent=2,
            )
        )
    else:
        print(f"--    {heading}")
        for result in results:
            print(f"{result.message}  [{result.seconds:.2f} s]")
            if not result.passed:
                print(textwrap.indent(result.output, "      "))
        if failed:
            print(
                f"\n{len(failed)} of {len(results)} checks failed ({', '.join(failed)})"
            )
        else:
            print(f"\nall {len(results)} checks passed")
        print(f"total: {seconds:.2f} s")
    return 1 if failed else 0


def run_groups(
    heading: str,
    groups: Sequence[Sequence[Check | Later]],
    exclusive: Sequence[Check | Later] = (),
    jobs: int = DEFAULT_WORKERS,
    machine_json: bool = False,
) -> int:
    """Buffer results in group order. Run frame sampling after workers stop."""
    if jobs < 1:
        raise ValueError("jobs must be at least 1")
    started = time.perf_counter()
    results: list[CheckResult] = []
    if not machine_json:
        print(f"running {heading}: {jobs} worker(s); navigation runs alone", flush=True)
    with ThreadPoolExecutor(max_workers=jobs) as workers:
        for group_results in workers.map(run_group, groups):
            results.extend(group_results)
            if not machine_json:
                print(f"finished {len(results)} checks", flush=True)
    if exclusive and not machine_json:
        print("running navigation and offline alone", flush=True)
    results.extend(run_group(exclusive))
    return report(heading, results, time.perf_counter() - started, machine_json)


def main() -> int:
    parser = argparse.ArgumentParser(description=(__doc__ or "").split("\n")[0])
    parser.add_argument(
        "--fix",
        action="store_true",
        help="let ruff and Prettier rewrite the files first, then check",
    )
    parser.add_argument(
        "--quick",
        action="store_true",
        help="source checks, generated files, and build; no browser or rendered-art checks",
    )
    parser.add_argument(
        "--jobs",
        type=int,
        default=DEFAULT_WORKERS,
        help=f"independent preparation workers (default: {DEFAULT_WORKERS}; use 1 for serial execution)",
    )
    parser.add_argument(
        "--json", action="store_true", help="print timings and results as JSON"
    )
    arguments = parser.parse_args()
    if arguments.jobs < 1:
        parser.error("--jobs must be at least 1")
    project = project_of(Path.cwd())
    with (
        tempfile.TemporaryDirectory(prefix="deck-") as deck,
        tempfile.TemporaryDirectory(prefix="art-") as work,
    ):
        if project == STEM:
            heading = "stem/, the shared files"
            groups: list[list[Check | Later]] = [list(house_checks(arguments.fix))]
            exclusive: list[Check | Later] = []
        elif (project / "slides.md").is_file():
            heading = f"{lib.display_path(project)}/, a talk"
            groups, exclusive = talk_groups(
                project, Path(deck), Path(work), arguments.fix, arguments.quick
            )
        else:
            sys.exit(f"{project} is neither stem/ nor a talk (it has no slides.md)")
        if arguments.quick:
            heading += " (quick: browser and rendered-art checks omitted)"
        return run_groups(
            heading,
            groups,
            exclusive,
            1 if arguments.fix else arguments.jobs,
            arguments.json,
        )


def run_all(heading: str, checks: Sequence[Check | Later]) -> int:
    """Run a serial sequence. Preserve the public entry point for callers."""
    started = time.perf_counter()
    return report(heading, run_group(checks), time.perf_counter() - started, False)


if __name__ == "__main__":
    sys.exit(main())
