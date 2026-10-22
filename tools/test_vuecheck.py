from pathlib import Path

import vuecheck

FILE = Path("One.vue")


def component(template: str) -> str:
    return f'<script setup lang="ts">\n</script>\n\n<template>\n{template}</template>\n'


def test_a_comment_before_the_one_root_fails() -> None:
    text = component('  <!-- a note -->\n  <div class="callout">\n    x\n  </div>\n')
    found = vuecheck.problem(FILE, text)
    assert found is not None
    assert "'a note'" in found


def test_a_comment_after_the_one_root_fails() -> None:
    text = component("  <div>\n    x\n  </div>\n  <!-- a note -->\n")
    assert vuecheck.problem(FILE, text) is not None


def test_a_comment_inside_the_root_passes() -> None:
    text = component('  <div>\n    <!-- a note -->\n    <img src="a.png">\n  </div>\n')
    assert vuecheck.problem(FILE, text) is None


def test_a_template_with_two_roots_is_not_checked() -> None:
    text = component("  <!-- a note -->\n  <i />\n  <div>x</div>\n")
    assert vuecheck.problem(FILE, text) is None


def test_a_v_else_branch_is_the_same_root() -> None:
    text = component(
        '  <!-- a note -->\n  <i v-if="on" />\n  <b v-else-if="half" />\n'
        "  <div v-else>x</div>\n"
    )
    assert vuecheck.problem(FILE, text) is not None


def test_a_nested_template_ends_inside_the_root() -> None:
    text = component(
        '  <!-- a note -->\n  <main>\n    <template v-for="x of xs" :key="x">\n'
        "      <p>{{ x }}</p>\n    </template>\n  </main>\n"
    )
    assert vuecheck.problem(FILE, text) is not None


def test_a_file_with_no_template_passes() -> None:
    assert vuecheck.problem(FILE, "<script setup>\n</script>\n") is None


def test_the_skipped_directories_are_not_read(tmp_path: Path) -> None:
    for name in ("A.vue", "node_modules/p/B.vue", "tasks/t/C.vue", ".x/D.vue"):
        path = tmp_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("", encoding="utf-8")
    names = [file.name for file in vuecheck.vue_files([tmp_path])]
    assert names == ["A.vue"]
