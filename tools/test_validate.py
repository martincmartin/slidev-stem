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
