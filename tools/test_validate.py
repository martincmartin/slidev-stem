from pathlib import Path

import pytest
import validate
from check_python import STEM, Check
from validate import Later, run_all


def passing(label: str) -> Check:
    return Check(label, STEM, ("true",))


def failing(label: str) -> Check:
    return Check(label, STEM, ("false",))


def test_every_check_runs_and_a_summary_is_printed(
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert run_all("heading", [passing("one"), passing("two")]) == 0
    assert "all 2 checks passed" in capsys.readouterr().out


def test_a_failing_check_fails_the_run_but_the_next_one_still_runs(
    capsys: pytest.CaptureFixture[str],
) -> None:
    assert run_all("heading", [failing("one"), passing("two")]) == 1
    output = capsys.readouterr().out
    assert "FAIL  one" in output
    assert "ok    two" in output
    assert "1 of 2 checks failed (one)" in output


def test_a_later_check_that_cannot_be_made_fails_by_name_and_the_rest_run(
    capsys: pytest.CaptureFixture[str],
) -> None:
    def make() -> Check:
        raise FileNotFoundError("pairs.json")

    checks: list[Check | Later] = [
        failing("stills"),
        Later("motion (png)", make),
        passing("palette"),
    ]
    assert run_all("heading", checks) == 1
    output = capsys.readouterr().out
    assert "FAIL  motion (png)" in output
    assert "pairs.json" in output
    assert "ok    palette" in output
    assert "2 of 3 checks failed (stills, motion (png))" in output


def test_a_later_check_is_made_when_it_is_reached(
    capsys: pytest.CaptureFixture[str], tmp_path: Path
) -> None:
    marker = tmp_path / "made"
    first = Check("writes", STEM, ("touch", str(marker)))

    def make() -> Check:
        return passing("reads") if marker.exists() else failing("reads")

    assert run_all("heading", [first, Later("reads", make)]) == 0
    assert "all 2 checks passed" in capsys.readouterr().out


def test_motion_is_a_later_check_in_a_talk_with_stills(tmp_path: Path) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text('{"scripts": {"art:stills": "x"}}')
    checks = validate.art_checks(talk, tmp_path / "work")
    labels = [item.label for item in checks]
    assert labels == ["stills", "barroom (png)", "motion (png)"]
    assert [isinstance(item, Later) for item in checks] == [False, True, True]


def test_print_is_checked_on_the_built_deck_in_a_talk_with_the_script(
    tmp_path: Path,
) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text('{"scripts": {"art:print": "x"}}')
    deck = tmp_path / "deck"
    (check,) = validate.print_checks(talk, deck)
    assert check.label == "print"
    assert check.command == ("pnpm", "--silent", "art:print", str(deck))


def test_privacy_check_is_selected_by_talk_script(tmp_path: Path) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text('{"scripts": {"art:privacy": "x"}}')
    deck = tmp_path / "deck"
    (check,) = validate.privacy_checks(talk, deck)
    assert check.label == "private browsing"
    assert check.command == ("pnpm", "--silent", "art:privacy", str(deck))


def test_a_talk_without_the_script_has_no_print_check(tmp_path: Path) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text('{"scripts": {}}')
    assert validate.print_checks(talk, tmp_path / "deck") == []


def test_worker_groups_keep_dependencies_and_navigation_runs_alone(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
) -> None:
    import subprocess
    import threading

    first_started = threading.Event()
    second_started = threading.Event()
    finished: set[Check] = set()
    producer = passing("producer")
    independent = passing("independent")
    navigation = passing("navigation")

    def execute(check: Check) -> subprocess.CompletedProcess[str]:
        if check is producer:
            first_started.set()
            assert second_started.wait(5)
        elif check is independent:
            second_started.set()
            assert first_started.wait(5)
        elif check is navigation:
            assert producer in finished and independent in finished
        finished.add(check)
        return subprocess.CompletedProcess(check.command, 0, "", "")

    def dependent() -> Check:
        assert producer in finished
        return passing("dependent")

    monkeypatch.setattr(validate, "run", execute)
    assert (
        validate.run_groups(
            "heading",
            [[producer, Later("dependent", dependent)], [independent]],
            [navigation],
        )
        == 0
    )
    output = capsys.readouterr().out
    assert (
        output.index("ok    producer")
        < output.index("ok    dependent")
        < output.index("ok    navigation")
    )


def test_parallel_failures_and_launch_errors_do_not_hide_other_checks(
    capsys: pytest.CaptureFixture[str],
) -> None:
    missing = Check("missing command", STEM, ("/definitely/absent/validation-command",))
    assert (
        validate.run_groups(
            "heading", [[missing, passing("after missing")], [failing("failed")]]
        )
        == 1
    )
    output = capsys.readouterr().out
    assert "ok    after missing" in output
    assert "2 of 3 checks failed" in output


def test_quick_mode_keeps_generation_and_build_but_omits_browser_checks(
    tmp_path: Path,
) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text(
        '{"scripts": {"art:generated": "x", "art:stills": "x", "art:print": "x"}}'
    )
    (talk / "pyproject.toml").write_text('[tool.mypy]\nfiles = ["art"]\n')
    groups, exclusive = validate.talk_groups(
        talk, tmp_path / "deck", tmp_path / "work", False, True
    )
    labels = [item.label for group in groups for item in group]
    assert "generated" in labels and "build" in labels and "artcheck" in labels
    assert not {"stills", "print", "motion", "barroom"}.intersection(labels)
    assert not exclusive


def test_json_report_exposes_timings_and_failures(
    capsys: pytest.CaptureFixture[str],
) -> None:
    import json

    assert validate.run_groups("heading", [[failing("failed")]], machine_json=True) == 1
    result = json.loads(capsys.readouterr().out)
    assert result["passed"] is False
    assert result["checks"][0]["seconds"] >= 0
    assert result["checks"][0]["label"] == "failed"


def a_stem_and_a_talk(tmp_path: Path) -> tuple[Path, Path, Path]:
    """A house with a tool, a talk with art and a package.json, and a deck."""
    stem = tmp_path / "stem"
    (stem / "tools").mkdir(parents=True)
    (stem / "tools" / "lib.py").write_text("venue")
    (stem / "tools" / "smokecheck.ts").write_text("walk")
    (stem / "tools" / "chromium-args.json").write_text("{}")
    (stem / "uv.lock").write_text("playwright 1")
    (stem / "pnpm-lock.yaml").write_text("playwright-chromium 1")
    (stem / "package.json").write_text("{}")
    talk = stem / "talk"
    (talk / "art").mkdir(parents=True)
    (talk / "art" / "favicon.py").write_text("draw")
    (talk / "art" / "print-check.ts").write_text("print")
    (talk / "package.json").write_text("{}")
    (talk / "pnpm-lock.yaml").write_text("playwright-chromium 1")
    (talk / "docs").mkdir()
    (talk / "docs" / "notes.md").write_text("notes")
    deck = tmp_path / "deck"
    (deck / "assets").mkdir(parents=True)
    (deck / "index.html").write_text("<html>")
    (deck / "assets" / "index.js").write_text("slides")
    return stem, talk, deck


def test_the_deck_key_changes_with_the_deck_and_the_checkers_only(
    tmp_path: Path,
) -> None:
    stem, talk, deck = a_stem_and_a_talk(tmp_path)
    key = validate.deck_key(stem, talk, deck)
    (talk / "docs" / "notes.md").write_text("other notes")
    (talk / "art" / "__pycache__").mkdir()
    (talk / "art" / "__pycache__" / "favicon.cpython-315.pyc").write_text("x")
    assert validate.deck_key(stem, talk, deck) == key
    for changed in (
        deck / "assets" / "index.js",
        stem / "tools" / "lib.py",
        stem / "tools" / "smokecheck.ts",
        stem / "tools" / "chromium-args.json",
        stem / "uv.lock",
        stem / "pnpm-lock.yaml",
        stem / "package.json",
        talk / "art" / "favicon.py",
        talk / "art" / "print-check.ts",
        talk / "package.json",
        talk / "pnpm-lock.yaml",
    ):
        original = changed.read_text()
        changed.write_text(original + " changed")
        assert validate.deck_key(stem, talk, deck) != key, changed
        changed.write_text(original)
    assert validate.deck_key(stem, talk, deck) == key


def test_the_deck_key_tells_a_moved_file_from_a_changed_one(tmp_path: Path) -> None:
    stem, talk, deck = a_stem_and_a_talk(tmp_path)
    key = validate.deck_key(stem, talk, deck)
    (deck / "assets" / "index.js").rename(deck / "assets" / "other.js")
    assert validate.deck_key(stem, talk, deck) != key


def test_there_is_no_deck_key_without_a_built_deck(tmp_path: Path) -> None:
    stem, talk, deck = a_stem_and_a_talk(tmp_path)
    (deck / "index.html").unlink()
    with pytest.raises(ValueError, match="no built deck"):
        validate.deck_key(stem, talk, deck)


def counting_runs(monkeypatch: pytest.MonkeyPatch, code: int) -> list[str]:
    """Make `run` count the checks it runs, and exit with `code`."""
    import subprocess

    ran: list[str] = []

    def execute(check: Check) -> subprocess.CompletedProcess[str]:
        ran.append(check.label)
        return subprocess.CompletedProcess(check.command, code, "", "")

    monkeypatch.setattr(validate, "run", execute)
    return ran


def test_a_pass_is_reused_while_the_key_is_the_same(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    tmp_path: Path,
) -> None:
    ran = counting_runs(monkeypatch, 0)
    record = validate.PassRecord(tmp_path / ".validate" / "passes.json")
    key = "first"
    item = validate.Reusable(passing("print"), lambda: key, record)
    assert validate.run_groups("heading", [[item]], machine_json=True) == 0
    assert ran == ["print"]
    capsys.readouterr()
    assert validate.run_groups("heading", [[item]], machine_json=True) == 0
    assert ran == ["print"]
    import json

    (result,) = json.loads(capsys.readouterr().out)["checks"]
    assert result["reused"] is True
    key = "second"
    assert validate.run_groups("heading", [[item]], machine_json=True) == 0
    assert ran == ["print", "print"]


def test_a_failure_is_not_recorded(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    ran = counting_runs(monkeypatch, 1)
    record = validate.PassRecord(tmp_path / "passes.json")
    item = validate.Reusable(failing("print"), lambda: "key", record)
    for _ in range(2):
        assert validate.run_groups("heading", [[item]], machine_json=True) == 1
    assert ran == ["print", "print"]
    assert record.passed_at("key", "print") is None


def test_a_new_key_forgets_the_passes_of_the_old_one(tmp_path: Path) -> None:
    record = validate.PassRecord(tmp_path / "passes.json")
    record.record("old", "print")
    record.record("old", "navigation")
    record.record("new", "print")
    assert record.passed_at("new", "print") is not None
    assert record.passed_at("new", "navigation") is None
    assert record.passed_at("old", "navigation") is None


def test_an_unreadable_record_counts_as_empty(tmp_path: Path) -> None:
    file = tmp_path / "passes.json"
    for text in ("not json", "[]", '{"key": "key", "passed": []}'):
        file.write_text(text)
        assert validate.PassRecord(file).passed_at("key", "print") is None
    validate.PassRecord(file).record("key", "print")
    assert validate.PassRecord(file).passed_at("key", "print") is not None


def test_a_reusable_check_without_a_deck_fails_by_name_and_is_run_again(
    monkeypatch: pytest.MonkeyPatch,
    capsys: pytest.CaptureFixture[str],
    tmp_path: Path,
) -> None:
    counting_runs(monkeypatch, 0)
    stem, talk, deck = a_stem_and_a_talk(tmp_path)
    (deck / "index.html").unlink()
    record = validate.PassRecord(tmp_path / "passes.json")
    item = validate.Reusable(
        passing("print"), lambda: validate.deck_key(stem, talk, deck), record
    )
    assert validate.run_all("heading", [item]) == 1
    output = capsys.readouterr().out
    assert "FAIL  print" in output and "no built deck" in output


def test_print_and_navigation_are_reusable_only_with_a_record(tmp_path: Path) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text('{"scripts": {"art:print": "x"}}')
    (talk / "pyproject.toml").write_text('[tool.mypy]\nfiles = ["art"]\n')
    record = validate.PassRecord(tmp_path / "passes.json")
    for given, expected in ((record, True), (None, False)):
        groups, exclusive = validate.talk_groups(
            talk, tmp_path / "deck", tmp_path / "work", False, False, given
        )
        reusable = {
            item.label
            for item in [*exclusive, *(item for group in groups for item in group)]
            if isinstance(item, validate.Reusable)
        }
        assert reusable == ({"print", "navigation smoke"} if expected else set())


def test_full_validation_uses_smoke_and_never_exhaustive_navigation(
    tmp_path: Path,
) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text('{"scripts": {}}')
    (talk / "pyproject.toml").write_text('[tool.mypy]\nfiles = ["art"]\n')
    for record in (None, validate.PassRecord(tmp_path / "passes.json")):
        for quick in (False, True):
            groups, exclusive = validate.talk_groups(
                talk, tmp_path / "deck", tmp_path / "work", False, quick, record
            )
            items = [*exclusive, *(item for group in groups for item in group)]
            checks = [
                item.check if isinstance(item, validate.Reusable) else item
                for item in items
                if isinstance(item, Check | validate.Reusable)
            ]
            assert not any("navcheck" in check.command for check in checks)
            assert any("smokecheck" in check.command for check in checks) is (not quick)


def a_talk_in_git(tmp_path: Path, inputs: str | None) -> Path:
    """A committed talk, with `inputs` as its [tool.validate] print-inputs."""
    import subprocess

    talk = tmp_path / "talk"
    talk.mkdir()
    settings = '[tool.mypy]\nfiles = ["art"]\n'
    if inputs is not None:
        settings += f"[tool.validate]\nprint-inputs = {inputs}\n"
    (talk / "pyproject.toml").write_text(settings)
    (talk / "slide-bottom.vue").write_text("still")
    (talk / "slides.md").write_text("words")
    for command in (
        ("git", "init", "-q"),
        ("git", "add", "."),
        ("git", "-c", "user.name=t", "-c", "user.email=t@t", "commit", "-qm", "t"),
    ):
        subprocess.run(command, cwd=talk, check=True)
    return talk


def test_print_inputs_change_only_with_a_change_to_a_listed_file(
    tmp_path: Path,
) -> None:
    talk = a_talk_in_git(tmp_path, '["slide-bottom.vue", "art/print-check.ts"]')
    assert validate.print_inputs(talk) == ["slide-bottom.vue", "art/print-check.ts"]
    assert not validate.print_inputs_changed(talk)
    (talk / "slides.md").write_text("other words")
    assert not validate.print_inputs_changed(talk)
    (talk / "slide-bottom.vue").write_text("other still")
    assert validate.print_inputs_changed(talk)
    (talk / "slide-bottom.vue").write_text("still")
    assert not validate.print_inputs_changed(talk)
    (talk / "art").mkdir()
    (talk / "art" / "print-check.ts").write_text("new")  # untracked
    assert validate.print_inputs_changed(talk)


def test_print_runs_when_the_talk_declares_no_inputs_or_git_cannot_tell(
    tmp_path: Path,
) -> None:
    talk = a_talk_in_git(tmp_path, None)
    assert validate.print_inputs(talk) is None
    assert validate.print_inputs_changed(talk)
    outside = tmp_path / "outside"
    outside.mkdir()
    (outside / "pyproject.toml").write_text(
        '[tool.validate]\nprint-inputs = ["slide-bottom.vue"]\n'
    )
    assert validate.print_inputs_changed(outside)  # not a git repository


def test_print_inputs_must_be_a_list_of_paths(tmp_path: Path) -> None:
    (tmp_path / "pyproject.toml").write_text('[tool.validate]\nprint-inputs = "x"\n')
    with pytest.raises(ValueError, match="print-inputs"):
        validate.print_inputs(tmp_path)


def test_print_is_skipped_unless_asked_and_the_skip_passes_by_name(
    tmp_path: Path, capsys: pytest.CaptureFixture[str]
) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text('{"scripts": {"art:print": "x"}}')
    (talk / "pyproject.toml").write_text('[tool.mypy]\nfiles = ["art"]\n')
    for run_print in (True, False):
        groups, _ = validate.talk_groups(
            talk, tmp_path / "deck", tmp_path / "work", False, False, None, run_print
        )
        (item,) = [i for group in groups for i in group if i.label == "print"]
        assert isinstance(item, validate.Skipped) != run_print
    assert run_all("heading", [item, passing("build")]) == 0
    output = capsys.readouterr().out
    assert "skip  print  (no print input changed" in output
    assert "all 2 checks passed (1 skipped)" in output
