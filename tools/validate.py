#!/usr/bin/env python3
"""Validate the current project. Full mode follows the policy in AGENTS.md.

    uv run tools/validate.py                 # shared files, from stem/
    uv run ../tools/validate.py              # one talk, from its directory
    uv run ../tools/validate.py --quick      # source, generation, and build
    uv run ../tools/validate.py --jobs 1     # full validation, serial preparation
    uv run ../tools/validate.py --json       # results and timings as JSON
    uv run ../tools/validate.py --no-reuse   # run print and smoke navigation again
    uv run ../tools/validate.py --print      # run print even if no print input changed

The project comes from the nearest pyproject.toml. No run checks other talks.
The house run checks Python and TypeScript, formatting, tests, documentation,
Vue components, and palette gates. A talk run also checks its types, lint,
tests, SVGs, generated art, spelling, and build.
Scripts in package.json select optional scene, stills, and print checks.
Legibility checks calculate the design-venue gate. Full reports remain available
through barroom.py. Motion checks retain every sample in their original plans.

Independent preparation groups use the default worker limit below. Each group keeps
its dependency order. Each source check is a group of its own (source_phases),
and the longest groups start first. Smoke navigation runs after preparation. It checks startup, page errors,
outside requests, and completion. Exhaustive navigation is diagnostic only.
Neither full nor quick validation runs navcheck.ts.

Full mode runs the print check only with --print, or when the working tree
changes one of the talk's print inputs ([tool.validate] print-inputs in its
pyproject.toml). Run --print before an export or a tag (docs/talks.md).

Full mode reuses a pass of print and of smoke navigation from an earlier full run
while the built deck and the checkers are byte-identical (`deck_key`); the
record is <project>/.validate/passes.json. Only passes are reused.

--quick omits rendered art, renderer browser checks, print, and navigation.
Use quick mode for routine feedback. Run full mode only after changes that
could affect its results. Before a commit, require a successful full run unless
the project and its relevant inputs are unchanged since that run.
--fix rewrites Python and formatted files first, in a phase of their own:
no other check runs while they write. All other modes only report. Build and art
outputs go to temporary directories. Python checks use uv run --locked.
Every check runs after failures. The summary includes each check's elapsed time.
See docs/talks.md, tasks/2026-10-06-validation-speed/PLAN.md and
tasks/2026-10-07-validation-reuse/PLAN.md.
"""

import argparse
import hashlib
import json
import shlex
import subprocess
import sys
import tempfile
import textwrap
import threading
import time
import tomllib
from collections.abc import Callable, Iterable, Sequence
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

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
from talkcheck import deck_files


def prettier(directory: Path, fix: bool) -> Check:
    """Prettier, through the `format` scripts of the package.json in
    `directory`. Each project's scripts say which files are its own."""
    return Check("prettier", directory, ("pnpm", "format" if fix else "format:check"))


# With more workers, the checks compete for the CPU, and the run is slower
# (tasks/2026-11-15-parallel-source-checks/PLAN.md).
DEFAULT_WORKERS = 4
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


def vuecheck(path: str) -> Check:
    """The Vue component check (vuecheck.ts) of the components in `path`."""
    return Check("vue roots", STEM, ("pnpm", "--silent", "vuecheck", path))


def spellcheck(directory: Path) -> Check:
    """The spelling check (spellcheck.ts) of the talk's deck files: the text
    that the audience and the readers see."""
    files = (str(lib.display_path(file)) for file in deck_files(directory))
    return Check(
        "spelling",
        STEM,
        ("pnpm", "--silent", "spellcheck", str(lib.display_path(directory)), *files),
    )


def source_phases(
    directory: Path, fix: bool, others: Sequence[Sequence[Item]]
) -> list[Phase]:
    """The phases of the checks of the project in `directory`, before smoke
    navigation: ruff, Prettier, and the groups `others`, which read the
    project's files. With `fix`, ruff and Prettier rewrite files that `others`
    read, so they are the first phase. They can run at the same time: ruff
    writes only Python, and Prettier has no parser for Python or TOML. Without
    `fix`, no check writes a file that another reads, except the tool caches,
    so all are one phase. A talk's Prettier checks every file in the talk, so
    its .prettierignore names those caches (docs/talks.md, "Check your work").
    The four Python checks are one group, because `ruff format` and
    `ruff check` write the same cache."""
    rewriting: list[Sequence[Item]] = [
        python_checks(directory, code_paths(directory), fix),
        [prettier(directory, fix)],
    ]
    if fix:
        return [Phase("ruff and Prettier", rewriting), Phase("preparation", others)]
    return [Phase("preparation", [*rewriting, *others])]


def house_phases(fix: bool) -> list[Phase]:
    """The checks of the shared files in stem/, each a group of its own
    (`source_phases`), the longest first."""
    checks: list[Item] = [
        *typescript_checks(STEM),
        Check(
            "pytest", STEM, uv_run("pytest", "-q", "-p", "no:cacheprovider", "tools")
        ),
        doccheck(STEM, HOUSE_DOC_PATHS),
        Check("palette", STEM, uv_run("tools/palette.py")),
        vuecheck("themes"),
    ]
    return source_phases(STEM, fix, [[check] for check in checks])


@dataclass(frozen=True)
class Later:
    """A check that is made when it is reached, because what it runs on is made
    by a check before it. Its label is known now, so that a failure to make it
    is reported under its name, and the checks after it still run."""

    label: str
    make: Callable[[], Check]


def deck_key(stem: Path, project: Path, deck: Path) -> str:
    """The key of what a check of the built deck reads: the deck, and the
    files that decide how it is checked. These are every file in the house's
    tools/ and in the talk's art/ (Python or TypeScript), each project's
    package.json (its scripts), and each project's lockfiles and
    .python-version (they pick Playwright, and so the browser engines: the
    house's smoke check and the talk's art checks take theirs from
    pnpm-lock.yaml). More than the checks read, so that a change can cost a
    run but cannot give a false pass."""
    if not (deck / "index.html").is_file():
        raise ValueError(f"no built deck in {deck}")

    def files(root: Path, pattern: str) -> list[Path]:
        # Python writes __pycache__ as it runs: it is no change to a checker
        return sorted(
            path
            for path in root.glob(pattern)
            if path.is_file() and "__pycache__" not in path.parts
        )

    pins = ("package.json", "pnpm-lock.yaml", "uv.lock", ".python-version")
    tools = stem / "tools"
    sources: list[tuple[str, Path, Iterable[Path]]] = [
        ("deck", deck, files(deck, "**/*")),
        ("tools", tools, files(tools, "**/*")),
        ("stem", stem, [stem / name for name in pins]),
        ("art", project / "art", files(project / "art", "**/*")),
        ("talk", project, [project / name for name in pins]),
    ]
    digest = hashlib.sha256()
    for tag, root, paths in sources:
        for path in paths:
            if not path.is_file():
                continue
            content = path.read_bytes()
            name = f"{tag}/{path.relative_to(root).as_posix()}"
            digest.update(f"{name}\0{len(content)}\0".encode())
            digest.update(content)
    return digest.hexdigest()


class PassRecord:
    """The checks that passed with one key, kept between runs in `file`. A
    pass with a new key replaces the record of the old key. Only passes are
    recorded. Unreadable records count as empty."""

    def __init__(self, file: Path) -> None:
        self.file = file
        self._lock = threading.Lock()

    def _read(self) -> dict[str, Any]:
        try:
            data = json.loads(self.file.read_text())
        except OSError, ValueError:
            return {}
        if not isinstance(data, dict) or not isinstance(data.get("passed"), dict):
            return {}
        return data

    def passed_at(self, key: str, label: str) -> str | None:
        """When `label` passed with `key`, or None if it has not."""
        with self._lock:
            data = self._read()
        if data.get("key") != key:
            return None
        when = data["passed"].get(label)
        return when if isinstance(when, str) else None

    def record(self, key: str, label: str) -> None:
        """Record that `label` passed now, with `key`."""
        with self._lock:
            data = self._read()
            if data.get("key") != key:
                data = {"key": key, "passed": {}}
            data["passed"][label] = (
                datetime.now(UTC).astimezone().isoformat(timespec="seconds")
            )
            self.file.parent.mkdir(parents=True, exist_ok=True)
            temporary = self.file.with_suffix(".tmp")
            temporary.write_text(json.dumps(data, indent=2) + "\n")
            temporary.replace(self.file)


@dataclass(frozen=True)
class Reusable:
    """A check whose pass is reused while `key()` is the key it passed with
    (tasks/2026-10-07-validation-reuse/PLAN.md)."""

    check: Check
    key: Callable[[], str]
    record: PassRecord

    @property
    def label(self) -> str:
        return self.check.label


# Where a project keeps its PassRecord. Git ignores it.
PASS_RECORD = Path(".validate") / "passes.json"


def scripts_of(directory: Path) -> set[str]:
    """The names of the scripts in the package.json of `directory`."""
    package = json.loads((directory / "package.json").read_text())
    return set(package.get("scripts", {}))


def typescript_checks(directory: Path) -> list[Check]:
    """Lint, unit tests and types of the project's TypeScript: the scripts of
    these names in its package.json, if it has them. The longest first, in
    watches/, so that a worker starts them first."""
    scripts = scripts_of(directory)
    return [
        Check(name, directory, ("pnpm", name))
        for name in ("lint", "test", "typecheck")
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


def privacy_checks(directory: Path, deck: Path) -> list[Check]:
    """Check live art startup with privacy restrictions, if the talk supplies a check."""
    if "art:privacy" not in scripts_of(directory):
        return []
    return [
        Check(
            "private browsing",
            directory,
            ("pnpm", "--silent", "art:privacy", str(deck)),
        )
    ]


def print_inputs(directory: Path) -> list[str] | None:
    """The talk's files that only the print check tests: `print-inputs` of
    [tool.validate] in its pyproject.toml, relative to the talk. None if the
    talk does not declare them."""
    settings = tomllib.loads((directory / "pyproject.toml").read_text())
    paths = settings.get("tool", {}).get("validate", {}).get("print-inputs")
    if paths is None:
        return None
    if not isinstance(paths, list) or not all(isinstance(p, str) for p in paths):
        raise ValueError("[tool.validate] print-inputs must be a list of paths")
    return paths


def print_inputs_changed(directory: Path) -> bool:
    """Whether the working tree changes a print input of the talk in
    `directory`: staged, unstaged or untracked, against HEAD. True when the
    talk declares no inputs, or when git cannot tell: then print runs."""
    paths = print_inputs(directory)
    if paths is None:
        return True
    try:
        status = subprocess.run(
            ("git", "status", "--porcelain", "--", *paths),
            cwd=directory,
            capture_output=True,
            text=True,
            check=True,
        )
    except OSError, subprocess.CalledProcessError:
        return True
    return bool(status.stdout.strip())


@dataclass(frozen=True)
class Skipped:
    """A check that is not run, and why. It passes, and says so."""

    label: str
    reason: str


Item = Check | Later | Reusable | Skipped


@dataclass(frozen=True)
class Phase:
    """Groups that run at the same time, each in its own order. A phase starts
    when the phase before it ends. The progress line shows `name`."""

    name: str
    groups: Sequence[Sequence[Item]]


def talk_phases(
    directory: Path,
    deck: Path,
    work: Path,
    fix: bool,
    quick: bool,
    record: PassRecord | None = None,
    run_print: bool = True,
) -> list[Phase]:
    """The phases of a talk's checks (`source_phases`). In full mode, smoke
    navigation is the last phase, alone. In a phase, the longest groups come
    first, so that no worker starts one late. With `record`, a pass of print
    or smoke navigation is reused while the deck and its checkers are
    unchanged. Without `run_print`, print is skipped (docs/talks.md, "The
    print check")."""

    def reusable(check: Check) -> Check | Reusable:
        if record is None:
            return check
        return Reusable(check, lambda: deck_key(STEM, directory, deck), record)

    def printing(check: Check) -> Item:
        if run_print:
            return reusable(check)
        return Skipped(
            check.label,
            "no print input changed; run --print before an export or a tag",
        )

    talk = str(lib.display_path(directory))
    public = str(lib.display_path(directory / "public"))
    checks: list[Item] = [
        *typescript_checks(directory),
        *generation_checks(directory, work),
        Check("palette", STEM, uv_run("tools/palette.py", "--talk", talk)),
        spellcheck(directory),
        vuecheck(talk),
        Check("talk setup", STEM, uv_run("tools/talkcheck.py", talk)),
        doccheck(directory, DOC_PATHS),
        Check("artcheck", STEM, uv_run("tools/artcheck.py", public)),
    ]
    source = [[check] for check in checks]
    build: list[Item] = [
        Check("build", directory, ("pnpm", "build", "--out", str(deck)))
    ]
    if quick:
        return source_phases(directory, fix, [build, *source])
    svg: list[Item] = [
        Check("barroom", STEM, uv_run("tools/barroom.py", public, "--gate-only")),
        Check("motion", STEM, uv_run("tools/motion.py", public)),
    ]
    stills: list[Item] = [*still_checks(directory, work)]
    built_deck = [
        *build,
        *map(printing, print_checks(directory, deck)),
        *map(reusable, privacy_checks(directory, deck)),
    ]
    smoke = reusable(
        Check(
            "navigation smoke",
            STEM,
            (
                "pnpm",
                "--silent",
                "smokecheck",
                str(deck),
                "--browser",
                "all",
                "--no-canvas-readback",
            ),
            shows_summary=True,
        )
    )
    return [
        *source_phases(directory, fix, [built_deck, stills, *source, svg]),
        Phase("smoke navigation alone", [[smoke]]),
    ]


@dataclass(frozen=True)
class CheckResult:
    label: str
    passed: bool
    seconds: float
    message: str
    output: str
    # passed in an earlier run, with the same key, and not run now
    reused: bool = False
    # not run, by design (Skipped)
    skipped: bool = False


def run_group(checks: Sequence[Item]) -> list[CheckResult]:
    """Run one dependency sequence. Continue after failures."""
    results = []
    for item in checks:
        started = time.perf_counter()
        if isinstance(item, Skipped):
            results.append(
                CheckResult(
                    item.label,
                    True,
                    0.0,
                    f"skip  {item.label}  ({item.reason})",
                    "",
                    skipped=True,
                )
            )
            continue
        try:
            key = None
            if isinstance(item, Reusable):
                key = item.key()
                when = item.record.passed_at(key, item.label)
                if when is not None:
                    results.append(
                        CheckResult(
                            item.label,
                            True,
                            time.perf_counter() - started,
                            f"ok    {item.label}  (reused: passed {when}"
                            " with the same deck and checkers)",
                            "",
                            reused=True,
                        )
                    )
                    continue
                check = item.check
            elif isinstance(item, Later):
                check = item.make()
            else:
                check = item
            result = run(check)
            passed = result.returncode == 0
            if passed and isinstance(item, Reusable) and key is not None:
                item.record.record(key, item.label)
            results.append(
                CheckResult(
                    check.label,
                    passed,
                    time.perf_counter() - started,
                    ok_line(check, result) if passed else f"FAIL  {check.label}",
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
            skipped = sum(result.skipped for result in results)
            note = f" ({skipped} skipped)" if skipped else ""
            print(f"\nall {len(results)} checks passed{note}")
        print(f"total: {seconds:.2f} s")
    return 1 if failed else 0


def run_phases(
    heading: str,
    phases: Sequence[Phase],
    jobs: int = DEFAULT_WORKERS,
    machine_json: bool = False,
) -> int:
    """Run each phase in turn, its groups on `jobs` workers. Buffer results in
    group order."""
    if jobs < 1:
        raise ValueError("jobs must be at least 1")
    started = time.perf_counter()
    results: list[CheckResult] = []
    if not machine_json:
        print(f"running {heading}: {jobs} worker(s)", flush=True)
    for phase in phases:
        if not machine_json:
            print(f"running {phase.name}: {len(phase.groups)} group(s)", flush=True)
        with ThreadPoolExecutor(max_workers=jobs) as workers:
            for group_results in workers.map(run_group, phase.groups):
                results.extend(group_results)
                if not machine_json:
                    print(f"finished {len(results)} checks", flush=True)
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
    parser.add_argument(
        "--print",
        action="store_true",
        help="run the print check even if no print input changed (before an export or a tag)",
    )
    parser.add_argument(
        "--no-reuse",
        action="store_true",
        help="run print and smoke navigation even if they passed with the same deck",
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
            phases = house_phases(arguments.fix)
        elif (project / "slides.md").is_file():
            heading = f"{lib.display_path(project)}/, a talk"
            phases = talk_phases(
                project,
                Path(deck),
                Path(work),
                arguments.fix,
                arguments.quick,
                None if arguments.no_reuse else PassRecord(project / PASS_RECORD),
                arguments.print or print_inputs_changed(project),
            )
        else:
            sys.exit(f"{project} is neither stem/ nor a talk (it has no slides.md)")
        if arguments.quick:
            heading += " (quick: browser and rendered-art checks omitted)"
        return run_phases(heading, phases, arguments.jobs, arguments.json)


def run_all(heading: str, checks: Sequence[Item]) -> int:
    """Run a serial sequence. Preserve the public entry point for callers."""
    started = time.perf_counter()
    return report(heading, run_group(checks), time.perf_counter() - started, False)


if __name__ == "__main__":
    sys.exit(main())
