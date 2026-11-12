"""Measure the tones of pictures, and find the flattest-histogram gamma.

Usage:
    tones.py gamma IMAGE      print the gamma on CIELAB lightness whose
                              lightness histogram (64 bins) has the most
                              entropy, for gammas 1.00 to 4.00 in steps of 0.05
    tones.py stats IMAGE...   print, for each image, the 1st, 50th and 99th
                              percentiles of grey (0-255), the share of pixels
                              with a channel at 254 or more (clipped white) and
                              the share of grey 2 or less (black)

Needs ImageMagick 7 (`magick`) and NumPy. PLAN.md gives the results.
"""

import subprocess
import sys

import numpy as np

HISTOGRAM_BINS = 64
GAMMAS = np.round(np.arange(1.0, 4.0 + 0.001, 0.05), 2)


def read_samples(image: str, options: list[str], raw_format: str) -> np.ndarray:
    """Return the image's raw samples after `options`, scaled to 0-1."""
    raw = subprocess.run(
        ["magick", image, *options, "-depth", "16", "-endian", "MSB", f"{raw_format}:-"],
        capture_output=True,
        check=True,
    ).stdout
    return np.frombuffer(raw, dtype=">u2") / 65535.0


def entropy(values: np.ndarray) -> float:
    counts, _ = np.histogram(values, bins=HISTOGRAM_BINS, range=(0, 1))
    shares = counts[counts > 0] / counts.sum()
    return float(-(shares * np.log2(shares)).sum())


def flattest_gamma(image: str) -> float:
    lightness = read_samples(image, ["-colorspace", "Lab", "-channel", "R", "-separate"], "gray")
    scores = [entropy(lightness ** (1 / gamma)) for gamma in GAMMAS]
    return float(GAMMAS[int(np.argmax(scores))])


def print_stats(image: str) -> None:
    grey = read_samples(image, ["-colorspace", "Gray"], "gray") * 255
    colour = read_samples(image, [], "rgb").reshape(-1, 3) * 255
    percentiles = np.percentile(grey, [1, 50, 99]).round().astype(int)
    clipped_white = (colour.max(axis=1) >= 254).mean() * 100
    black = (grey <= 2).mean() * 100
    print(f"{image}: p1/p50/p99 {percentiles.tolist()}, white {clipped_white:.2f}%, black {black:.2f}%")


if __name__ == "__main__":
    command, *images = sys.argv[1:]
    if command == "gamma" and len(images) == 1:
        print(flattest_gamma(images[0]))
    elif command == "stats" and images:
        for image in images:
            print_stats(image)
    else:
        sys.exit(__doc__)
