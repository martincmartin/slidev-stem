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


def test_full_validation_uses_smoke_and_never_exhaustive_navigation(
    tmp_path: Path,
) -> None:
    talk = tmp_path / "talk"
    talk.mkdir()
    (talk / "package.json").write_text('{"scripts": {}}')
    (talk / "pyproject.toml").write_text('[tool.mypy]\nfiles = ["art"]\n')
    for quick in (False, True):
        groups, exclusive = validate.talk_groups(
            talk, tmp_path / "deck", tmp_path / "work", False, quick
        )
        checks = [
            check for group in groups for check in group if isinstance(check, Check)
        ]
        checks.extend(check for check in exclusive if isinstance(check, Check))
        assert not any("tools/navcheck.py" in check.command for check in checks)
        assert any("tools/smokecheck.py" in check.command for check in checks) is (
            not quick
        )
