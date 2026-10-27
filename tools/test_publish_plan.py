from pathlib import Path

import publish_plan
from publish_plan import Talk

NAMES = {"watches", "gears"}
IN_PROGRESS = Talk(name="watches", retired=False, built_from="abc")
RETIRED = Talk(name="watches", retired=True, built_from="abc")


def test_a_talks_deck_and_code_render() -> None:
    for path in (
        "slides.md",
        "pages/intro.md",
        "components/WatchCallout.vue",
        "watch/article.ts",
        "public/diving-board.svg",
        "package.json",
        "pnpm-lock.yaml",
    ):
        assert publish_plan.talk_renders(path), path


def test_a_talks_docs_tests_and_scripts_do_not_render() -> None:
    for path in (
        "README.md",
        "AGENTS.md",
        "docs/article.md",
        "tasks/2026-10-22-x/PLAN.md",
        "watch/article.test.ts",
        "art/diving_board.py",
        "art/print-check.ts",
        "uv.lock",
        "spelling-words.txt",
    ):
        assert not publish_plan.talk_renders(path), path


def test_the_theme_and_the_site_are_house_changes() -> None:
    for path in ("themes/house/styles/index.ts", "site/index.html", "new-file.css"):
        assert publish_plan.house_renders(path, NAMES), path


def test_docs_tools_and_other_talks_are_not_house_changes() -> None:
    for path in (
        "docs/talks.md",
        "tools/validate.py",
        "tools/browser.ts",
        ".github/workflows/publish.yml",
        ".claude/settings.json",
        "themes/palettes/README.md",
        "AGENTS.md",
        "pnpm-lock.yaml",
        "gears/slides.md",
    ):
        assert not publish_plan.house_renders(path, NAMES), path


def test_a_talk_in_progress_publishes_for_its_own_or_a_house_change() -> None:
    def changes(paths: list[str]) -> list[str]:
        return publish_plan.page_changes(IN_PROGRESS, paths, [], NAMES)

    assert changes(["watches/slides.md"]) == ["watches/slides.md"]
    assert changes(["themes/house/layouts/section.vue"]) == [
        "themes/house/layouts/section.vue"
    ]
    assert changes(["watches/docs/article.md", "tools/validate.py"]) == []
    assert changes(["gears/slides.md"]) == []


def test_a_talk_in_progress_compares_with_its_build_not_the_push() -> None:
    changes = publish_plan.page_changes(
        IN_PROGRESS, ["watches/slides.md"], ["watches/README.md"], NAMES
    )
    assert changes == ["watches/slides.md"]


def test_a_retired_talk_publishes_only_for_its_own_change_in_the_push() -> None:
    def changes(since_build: list[str], in_push: list[str]) -> list[str]:
        return publish_plan.page_changes(RETIRED, since_build, in_push, NAMES)

    assert changes([], ["watches/slides.md"]) == ["watches/slides.md"]
    assert changes(["themes/house/x.css"], ["themes/house/x.css"]) == []
    # an earlier push's change that did not build is not tried again
    assert changes(["watches/slides.md"], ["tools/validate.py"]) == []


def test_the_build_record_gives_its_commit(tmp_path: Path) -> None:
    (tmp_path / "watches").mkdir()
    record = tmp_path / "watches" / publish_plan.BUILD_RECORD
    record.write_text('{"ref": "main", "commit": "b35e83c"}', encoding="utf-8")
    assert publish_plan.recorded_build(tmp_path, "watches") == "b35e83c"


def test_a_missing_or_bad_build_record_gives_none(tmp_path: Path) -> None:
    assert publish_plan.recorded_build(tmp_path, "watches") is None
    (tmp_path / "watches").mkdir()
    record = tmp_path / "watches" / publish_plan.BUILD_RECORD
    for text in ("not json", "[]", '{"ref": "main"}', '{"commit": ""}'):
        record.write_text(text, encoding="utf-8")
        assert publish_plan.recorded_build(tmp_path, "watches") is None, text
