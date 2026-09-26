"""Pixel arithmetic that the measurement scripts share."""

import io
from dataclasses import dataclass

import numpy
from numpy.typing import NDArray
from PIL import Image
from playwright.sync_api import Page

Pixels = NDArray[numpy.float64]
BACKGROUND, LINE = (0xFA, 0xF7, 0xF0), (0x14, 0x3C, 0x6B)  # ledger.css
LUMINANCE = numpy.array([0.2126, 0.7152, 0.0722])


def grab(page: Page, selector: str = "#stage") -> Pixels:
    png = page.locator(selector).screenshot()
    return numpy.asarray(Image.open(io.BytesIO(png)).convert("RGB"), dtype=float)


def save(pixels: Pixels, path: str) -> None:
    Image.fromarray(pixels.astype(numpy.uint8)).save(path)


def sharpness(pixels: Pixels) -> float:
    """Mean |Laplacian| / mean |gradient|: per edge, so it barely depends on
    how much is drawn. A blurred edge has a smaller ratio."""
    grey = pixels.mean(axis=2)
    laplacian = (
        grey[1:-1, :-2] + grey[1:-1, 2:] + grey[:-2, 1:-1] + grey[2:, 1:-1]
    ) - 4 * grey[1:-1, 1:-1]
    gradient = numpy.hypot(
        grey[1:-1, 2:] - grey[1:-1, :-2], grey[2:, 1:-1] - grey[:-2, 1:-1]
    )
    return float(numpy.abs(laplacian).mean() / gradient.mean())


def ink(pixels: Pixels) -> Pixels:
    """0 on the background, 1 on the line colour, by luminance."""
    background = float(numpy.dot(BACKGROUND, LUMINANCE))
    line = float(numpy.dot(LINE, LUMINANCE))
    coverage: Pixels = numpy.clip(
        (background - pixels @ LUMINANCE) / (background - line), 0, 1
    )
    return coverage


@dataclass(frozen=True)
class Crossing:
    """Where a ray crosses a line. Blur spreads a line's ink over more pixels
    but keeps its total, so `width` stays and `extent` grows."""

    width: float  # px: the total ink of the run
    extent: int  # px: how many pixels have any ink (> 0.05)


def crossings(pixels: Pixels, row: int, start: int) -> list[Crossing]:
    """The lines crossed by the ray along `row` from column `start` to the
    right."""
    found, total, extent = [], 0.0, 0
    for value in ink(pixels)[row, start:]:
        if value > 0.05:
            total, extent = total + float(value), extent + 1
        elif extent:
            found.append(Crossing(total, extent))
            total, extent = 0.0, 0
    return found
