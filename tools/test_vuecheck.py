from pathlib import Path

import vuecheck

FILE = Path("One.vue")


def component(template: str) -> str:
    return f'<script setup lang="ts">\n</script>\n\n<template>\n{template}</template>\n'


def test_a_comment_before_the_one_root_fails() -> None:
    text = component('  <!-- a note -->\n  <div class="callout">\n    x\n  </div>\n')
    [found] = vuecheck.problems(FILE, text)
    assert "'a note'" in found


def test_a_comment_after_the_one_root_fails() -> None:
    text = component("  <div>\n    x\n  </div>\n  <!-- a note -->\n")
    assert vuecheck.problems(FILE, text)


def test_a_comment_inside_the_root_passes() -> None:
    text = component('  <div>\n    <!-- a note -->\n    <img src="a.png">\n  </div>\n')
    assert not vuecheck.problems(FILE, text)


def test_a_template_with_two_roots_is_not_checked() -> None:
    text = component("  <!-- a note -->\n  <i />\n  <div>x</div>\n")
    assert not vuecheck.problems(FILE, text)


def test_a_v_else_branch_is_the_same_root() -> None:
    text = component(
        '  <!-- a note -->\n  <i v-if="on" />\n  <b v-else-if="half" />\n'
        "  <div v-else>x</div>\n"
    )
    assert vuecheck.problems(FILE, text)


def test_a_nested_template_ends_inside_the_root() -> None:
    text = component(
        '  <!-- a note -->\n  <main>\n    <template v-for="x of xs" :key="x">\n'
        "      <p>{{ x }}</p>\n    </template>\n  </main>\n"
    )
    assert vuecheck.problems(FILE, text)


def test_a_file_with_no_template_passes() -> None:
    assert not vuecheck.problems(FILE, "<script setup>\n</script>\n")


def test_the_skipped_directories_are_not_read(tmp_path: Path) -> None:
    for name in ("A.vue", "node_modules/p/B.vue", "tasks/t/C.vue", ".x/D.vue"):
        path = tmp_path / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text("", encoding="utf-8")
    names = [file.name for file in vuecheck.vue_files([tmp_path])]
    assert names == ["A.vue"]


def directives(*comments: str) -> list[str]:
    return vuecheck.directive_problems(FILE, list(comments))


def test_a_block_disable_with_its_enable_passes() -> None:
    assert not directives(
        "eslint-disable vue/no-v-html -- our own file",
        "eslint-enable vue/no-v-html",
    )


def test_a_block_disable_without_an_enable_fails() -> None:
    [found] = directives("eslint-disable vue/no-v-html -- our own file")
    assert "no later eslint-enable for vue/no-v-html" in found


def test_an_enable_with_no_rules_ends_every_disable() -> None:
    assert not directives("eslint-disable a, b -- why", "eslint-enable")


def test_a_next_line_disable_needs_no_enable_but_a_reason() -> None:
    assert not directives("eslint-disable-next-line vue/no-v-html -- why")
    [found] = directives("eslint-disable-next-line vue/no-v-html")
    assert "gives no reason" in found


def test_a_disable_that_names_no_rule_fails() -> None:
    assert any(
        "names no rule" in found for found in directives("eslint-disable -- why")
    )


def test_other_comments_are_not_directives() -> None:
    assert not directives("prettier-ignore", "a note about eslint-disable")
