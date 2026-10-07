from pathlib import Path

import barroom
import lib
import pytest
from PIL import Image, ImageDraw


@pytest.mark.parametrize("shade", [0, 40, 100, 160, 230, 250])
def test_gate_only_has_the_same_failure_decision_as_the_full_report(shade: int) -> None:
    image = Image.new("RGB", (64, 48), "white")
    ImageDraw.Draw(image).rectangle((8, 8, 48, 36), fill=(shade, shade, shade))
    file = Path("drawing.png")
    (gate,) = barroom.gate_scores([file], [image])
    complete = barroom.score(file, image)
    assert gate.hold == complete.venues[lib.DESIGN_VENUE].hold
    assert gate.passes_gate == complete.passes_gate


def test_identical_pngs_reuse_one_measurement_but_keep_each_result(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    image = Image.new("RGB", (64, 48), "white")
    ImageDraw.Draw(image).rectangle((8, 8, 48, 36), fill="black")
    calls = []
    original = barroom.prep

    def measured(
        card: Image.Image, sigma: float
    ) -> tuple[barroom.Mask, barroom.Linear]:
        calls.append(sigma)
        return original(card, sigma)

    monkeypatch.setattr(barroom, "prep", measured)
    gates = barroom.gate_scores(
        [Path("cover.png"), Path("motion-a.png")], [image, image.copy()]
    )
    assert len(calls) == 1
    assert len(gates) == 2
    assert gates[0].hold == gates[1].hold
