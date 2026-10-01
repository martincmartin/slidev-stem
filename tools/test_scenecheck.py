import copy
import json

import pytest
import scenecheck

INKS = [
    {"name": "line", "variable": "--palette-art-line"},
    {"name": "detail", "variable": "--palette-ink"},
]


def scene(
    fill: dict[str, object] | None = None, style: dict[str, object] | None = None
) -> dict[str, object]:
    return {
        "inks": copy.deepcopy(INKS),
        "meshes": [
            {
                "name": "plate",
                "fill": fill,
                "lineStyles": [style] if style else [],
            }
        ],
    }


def whats(scene_data: dict[str, object]) -> list[str]:
    return [finding.what for finding in scenecheck.check(scene_data)[1]]


def test_a_good_line_and_fill_pass() -> None:
    good = scene({"ink": 0, "opacity": 1.0}, {"ink": 0, "width": 2.0, "opacity": 1.0})
    assert whats(good) == []


def test_a_detail_line_is_at_half_opacity() -> None:
    assert whats(scene(None, {"ink": 1, "width": 2.0, "opacity": 0.5})) == []
    assert (
        "should be 0.5"
        in whats(scene(None, {"ink": 1, "width": 2.0, "opacity": 1.0}))[0]
    )


@pytest.mark.parametrize("bad", [float("nan"), float("inf"), None, "0.5", True])
def test_a_line_opacity_that_is_not_a_finite_number_fails(bad: object) -> None:
    found = whats(scene(None, {"ink": 0, "width": 2.0, "opacity": bad}))
    assert len(found) == 1
    assert "not a finite number" in found[0]


def test_a_nan_width_or_fill_opacity_fails() -> None:
    nan = float("nan")
    assert (
        "not a finite number"
        in whats(scene(None, {"ink": 0, "width": nan, "opacity": 1.0}))[0]
    )
    assert "not a finite number" in whats(scene({"ink": 0, "opacity": nan}))[0]


@pytest.mark.parametrize("ink", [-1, 2, "0", None, 0.0, True])
def test_an_ink_that_is_not_an_index_of_the_scene_fails(ink: object) -> None:
    found = whats(scene(None, {"ink": ink, "width": 2.0, "opacity": 1.0}))
    assert len(found) == 1
    assert "not one of the scene's 2" in found[0]


def test_the_command_line_reader_rejects_nan() -> None:
    with pytest.raises(ValueError, match="NaN is not JSON"):
        json.loads('{"opacity": NaN}', parse_constant=scenecheck.reject_constant)
