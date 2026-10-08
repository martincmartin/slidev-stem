from xml.etree import ElementTree

import artcheck
import pytest
from lib import Colour

INK = "#2A2520"


def alphas(svg: str) -> list[float]:
    root = ElementTree.fromstring(
        f'<svg xmlns="http://www.w3.org/2000/svg">{svg}</svg>'
    )
    return [alpha for _, _, alpha in artcheck.marks(root)]


def test_a_plain_mark_is_opaque() -> None:
    assert alphas(f'<path stroke="{INK}"/>') == [1.0]


def test_stroke_opacity_inherits_from_a_group() -> None:
    assert alphas(f'<g stroke-opacity="0.5"><path stroke="{INK}"/></g>') == [0.5]


def test_nested_groups_multiply() -> None:
    svg = f'<g opacity="0.5"><g opacity="0.5"><path stroke="{INK}"/></g></g>'
    assert alphas(svg) == [0.25]


def test_a_child_at_opacity_1_does_not_undo_its_parents() -> None:
    svg = f'<g opacity="0.5"><path opacity="1" stroke="{INK}"/></g>'
    assert alphas(svg) == [0.5]


def test_opacity_and_stroke_opacity_multiply() -> None:
    svg = f'<g opacity="0.5"><path stroke-opacity="0.5" stroke="{INK}"/></g>'
    assert alphas(svg) == [0.25]


def test_each_of_two_siblings_has_only_its_own_opacity() -> None:
    svg = f'<g><path opacity="0.5" stroke="{INK}"/><path stroke="{INK}"/></g>'
    assert alphas(svg) == [0.5, 1.0]


def test_an_animated_opacity_is_not_the_static_one() -> None:
    svg = (
        f'<path opacity="0" stroke="{INK}">'
        '<animate attributeName="opacity" values="0;1"/></path>'
    )
    assert alphas(svg) == [1.0]


def test_marks_does_not_change_the_tree() -> None:
    svg = (
        f'<svg xmlns="http://www.w3.org/2000/svg"><path opacity="0" stroke="{INK}">'
        '<animate attributeName="opacity" values="0;1"/></path></svg>'
    )
    root = ElementTree.fromstring(svg)
    before = ElementTree.tostring(root)
    list(artcheck.marks(root))
    assert ElementTree.tostring(root) == before


def test_the_colour_and_kind_are_reported() -> None:
    root = ElementTree.fromstring(
        f'<svg xmlns="http://www.w3.org/2000/svg"><rect fill="{INK}"/></svg>'
    )
    assert list(artcheck.marks(root)) == [("fill", Colour.from_hex(INK), 1.0)]


@pytest.mark.parametrize("tag", ["defs", "clipPath", "mask"])
def test_what_is_not_painted_is_skipped(tag: str) -> None:
    assert alphas(f'<{tag}><path stroke="{INK}"/></{tag}>') == []
