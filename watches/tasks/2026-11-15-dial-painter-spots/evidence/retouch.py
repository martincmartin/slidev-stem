# /// script
# requires-python = ">=3.12"
# dependencies = ["opencv-python-headless==4.10.0.84", "numpy==2.1.3"]
# ///
"""Removes the dust specks from the dial painter's photo (PLAN.md).

Usage: uv run retouch.py BEFORE AFTER COMPARISON
BEFORE: public/radium/painters.jpg as crop.sh in
  ../../2026-11-15-dial-painter-photo/evidence/ makes it (a copy is
  painters-before.jpg here).
AFTER: the retouched photo, grey, JPEG quality 85.
COMPARISON: each speck before and after, enlarged, side by side.

Each speck is a disc, and the disc is filled from the pixels around it
(OpenCV's Telea inpainting). The fill is smooth, so it gets the film's grain:
noise with the standard deviation of the fine detail in a ring around it.
"""

import sys
from dataclasses import dataclass

import cv2
import numpy as np


@dataclass(frozen=True)
class Speck:
    """A speck of dust on the scan: a disc, in the pixels of BEFORE."""

    name: str
    x: int
    y: int
    radius: int


SPECKS = (
    Speck("chin", 603, 563, 5),
    Speck("wall, under the bag", 1162, 79, 12),
    Speck("wall, in front of her", 1040, 276, 13),
    Speck("wall, below it", 1018, 316, 6),
    Speck("wall, below it again", 1004, 332, 8),
    Speck("wall, top left", 54, 35, 4),
    Speck("fiber, top left", 328, 105, 8),
    Speck("hair's edge", 459, 130, 3),
    Speck("window bars", 962, 121, 4),
    Speck("wall, right", 1132, 143, 3),
    Speck("wall, right, lower", 1148, 343, 3),
    Speck("pillar", 1262, 193, 5),
    Speck("pillar, lower", 1284, 284, 3),
    Speck("below her hand", 662, 610, 4),
)

GRAIN_SEED = 1932
ENLARGE = 6
MARGIN = 10


def grain_strength(image: np.ndarray, speck: Speck) -> float:
    """The standard deviation of the fine detail in a ring around the speck."""
    detail = image.astype(np.float32) - cv2.GaussianBlur(
        image.astype(np.float32), (0, 0), 1.5
    )
    ring = np.zeros(image.shape, np.uint8)
    cv2.circle(ring, (speck.x, speck.y), speck.radius + 8, 1, -1)
    cv2.circle(ring, (speck.x, speck.y), speck.radius + 2, 0, -1)
    return float(detail[ring == 1].std())


def retouch(image: np.ndarray) -> np.ndarray:
    mask = np.zeros(image.shape, np.uint8)
    for speck in SPECKS:
        cv2.circle(mask, (speck.x, speck.y), speck.radius, 255, -1)
    filled = cv2.inpaint(image, mask, 3, cv2.INPAINT_TELEA).astype(np.float32)
    random = np.random.default_rng(GRAIN_SEED)
    for speck in SPECKS:
        disc = np.zeros(image.shape, np.uint8)
        cv2.circle(disc, (speck.x, speck.y), speck.radius, 1, -1)
        noise = cv2.GaussianBlur(
            random.normal(0, 1, image.shape).astype(np.float32), (0, 0), 0.6
        )
        noise *= grain_strength(image, speck) / max(float(noise.std()), 1e-6)
        filled[disc == 1] += noise[disc == 1]
    return np.clip(filled.round(), 0, 255).astype(np.uint8)


def window(image: np.ndarray, speck: Speck) -> np.ndarray:
    half = speck.radius + MARGIN
    top, left = max(speck.y - half, 0), max(speck.x - half, 0)
    part = image[top : speck.y + half, left : speck.x + half]
    return cv2.resize(
        part, None, fx=ENLARGE, fy=ENLARGE, interpolation=cv2.INTER_NEAREST
    )


def comparison(before: np.ndarray, after: np.ndarray) -> np.ndarray:
    rows = []
    for speck in SPECKS:
        pair = [window(before, speck), window(after, speck)]
        gap = np.full((pair[0].shape[0], 8), 255, np.uint8)
        rows.append(np.hstack([pair[0], gap, pair[1]]))
    width = max(row.shape[1] for row in rows)
    padded = [
        np.pad(row, ((0, 8), (0, width - row.shape[1])), constant_values=255)
        for row in rows
    ]
    return np.vstack(padded)


def main() -> None:
    before_path, after_path, comparison_path = sys.argv[1:4]
    before = cv2.imread(before_path, cv2.IMREAD_GRAYSCALE)
    if before is None:
        raise SystemExit(f"cannot read {before_path}")
    after = retouch(before)
    cv2.imwrite(after_path, after, [cv2.IMWRITE_JPEG_QUALITY, 85])
    cv2.imwrite(comparison_path, comparison(before, after))
    changed = int((after != before).sum())
    print(f"{len(SPECKS)} specks, {changed} pixels changed")


if __name__ == "__main__":
    main()
