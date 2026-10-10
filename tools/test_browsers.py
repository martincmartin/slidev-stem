import sys

import browsers
import pytest


@pytest.mark.parametrize(
    ("gpu", "expected"),
    [(True, browsers.CHROMIUM_GPU), (False, browsers.CHROMIUM_NO_GPU)],
)
def test_chromium_draws_on_the_gpu_or_in_the_faster_software_renderer(
    monkeypatch: pytest.MonkeyPatch, gpu: bool, expected: tuple[str, ...]
) -> None:
    monkeypatch.setattr(browsers, "has_gpu", lambda: gpu)
    assert browsers.launch_args("chromium") == list(expected)
    assert browsers.launch_args("firefox") == []
    assert browsers.launch_args("webkit") == []


def test_a_mac_has_a_gpu(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(sys, "platform", "darwin")
    assert browsers.has_gpu()


def test_an_unknown_engine_is_an_error() -> None:
    with pytest.raises(ValueError, match="Unknown browser engine"):
        browsers.launch_args("lynx")
