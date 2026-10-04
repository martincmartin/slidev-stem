#!/usr/bin/env python3
"""Measure the fade in fade-screenshot.png and compare it with three formulas.

    python3 analyse_fade.py          # needs numpy and pillow; writes fade-curves.svg

The screenshot is a part of the water, cropped from the fade slide. In each
column, the median over the rows (so the ripples drop out) is a colour between
the water's and the paper's. Its blend alpha is the projection of that colour on
the line from the water colour to the paper colour: 0 is water, 1 is paper.

Formulas, each as the colour at fade parameter t (0 at the fade's left edge, 1 at
its right):
  linear-sRGB   colour = water + (paper - water) t            (the first fade)
  smootherstep  the same, with t replaced by smootherstep(t)  (the second fade)
  linear-light  colour = ((1-t) water^2.2 + t paper^2.2)^(1/2.2), per channel
"""

import pathlib

import numpy as np
from PIL import Image

HERE = pathlib.Path(__file__).parent
GAMMA = 2.2
FADE_CSS_PX = 85.0  # the fade's length in the slide (FADE_LENGTH in art/diving_board.py)


def smootherstep(t):
    t = np.clip(t, 0, 1)
    return t**3 * (t * (t * 6 - 15) + 10)


def colour_linear_srgb(t, water, paper):
    return water + (paper - water) * np.clip(t, 0, 1)[:, None]


def colour_smootherstep(t, water, paper):
    return water + (paper - water) * smootherstep(t)[:, None]


def colour_linear_light(t, water, paper):
    t = np.clip(t, 0, 1)[:, None]
    mixed = (1 - t) * (water / 255) ** GAMMA + t * (paper / 255) ** GAMMA
    return mixed ** (1 / GAMMA) * 255


def alpha_of(colours, water, paper):
    direction = paper - water
    return (colours - water) @ direction / (direction @ direction)


def main():
    image = np.asarray(Image.open(HERE / "fade-screenshot.png").convert("RGB")).astype(float)
    profile = np.median(image[45:], axis=0)  # the rows that are all water
    water, paper = profile[:5].mean(0), profile[-5:].mean(0)
    columns = np.arange(len(profile), dtype=float)
    measured = alpha_of(profile, water, paper)

    models = {
        "linear in sRGB": colour_linear_srgb,
        "smootherstep in sRGB": colour_smootherstep,
        "linear light (gamma 2.2)": colour_linear_light,
    }
    fits = {}
    for name, model in models.items():
        best = None
        for start in np.arange(30, 90, 0.5):
            for end in np.arange(120, 200, 0.5):
                t = (columns - start) / (end - start)
                error = alpha_of(model(t, water, paper), water, paper) - measured
                rms = float(np.sqrt(np.mean(error**2)))
                if best is None or rms < best[0]:
                    best = (rms, start, end)
        fits[name] = best
    # a free sigmoid, t^p / (t^p + (1-t)^p): p = 1 is a straight line
    best = None
    for start in np.arange(30, 90, 0.5):
        for end in np.arange(120, 200, 0.5):
            for p in np.arange(1.0, 5.01, 0.05):
                t = np.clip((columns - start) / (end - start), 0, 1)
                alpha = t**p / (t**p + (1 - t) ** p)
                rms = float(np.sqrt(np.mean((alpha - measured) ** 2)))
                if best is None or rms < best[0]:
                    best = (rms, start, end, p)
    print(f"water {water}, paper {paper}")
    for name, (rms, start, end) in fits.items():
        print(f"{name:26s} RMS {rms:.4f}  fade from column {start} to {end}")
    print(f"free sigmoid               RMS {best[0]:.4f}  p = {best[3]:.2f}, columns {best[1]} to {best[2]}")

    # the plot: x in CSS px along the fade, alpha 0 to 1; the measured points
    # are placed with the smootherstep fit, which is the formula in the file
    _, start, end = fits["smootherstep in sRGB"]
    scale = (end - start) / FADE_CSS_PX
    css_x = (columns - start) / scale
    t_design = np.linspace(0, 1, 200)
    design_x = t_design * FADE_CSS_PX
    curves = {
        "linear in sRGB": t_design,
        "smootherstep in sRGB": smootherstep(t_design),
        "linear light (gamma 2.2)": alpha_of(
            colour_linear_light(t_design, water, paper), water, paper
        ),
    }
    new = {}
    for label, name in (("smootherstep, 256 stops", "fade-new-smootherstep.png"), ("linear light, 256 stops", "fade-new-light.png")):
        crop = np.asarray(Image.open(HERE / name).convert("RGB")).astype(float)
        row_profile = np.median(crop, axis=0)
        w, pp = row_profile[:5].mean(0), row_profile[-5:].mean(0)
        # the crop starts at device column 900 of a 2x screenshot; the fade
        # starts at slide x 503 (FADE_LENGTH before the 60% line, 588)
        cols = (np.arange(len(row_profile)) + 900) / 2 - 503
        new[label] = (cols, alpha_of(row_profile, w, pp))
        for model_name, model in models.items():
            t = cols / FADE_CSS_PX
            error = alpha_of(model(t, w, pp), w, pp) - new[label][1]
            print(f"  new render {label:26s} vs {model_name:26s} RMS {float(np.sqrt(np.mean(error**2))):.4f}")
    write_svg(css_x, measured, design_x, curves, best, fits, new)
    for name, curve in curves.items():
        print(f"{name:26s} alpha at x = 10, 21.25, 42.5, 63.75, 75 px:",
              [round(float(np.interp(x, design_x, curve)), 3) for x in (10, 21.25, 42.5, 63.75, 75)])


def write_svg(css_x, measured, design_x, curves, sigmoid, fits, new):
    width, height, left, bottom, top, right = 820, 520, 70, 470, 40, 790
    def sx(x): return left + (right - left) * x / FADE_CSS_PX
    def sy(a): return bottom - (bottom - top) * a
    colours = {"linear in sRGB": "#b07a2a", "smootherstep in sRGB": "#2a6f4e", "linear light (gamma 2.2)": "#143c6b"}
    out = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" font-family="sans-serif" font-size="13">',
           f'<rect width="{width}" height="{height}" fill="#fff"/>']
    for tick in range(0, 11):
        a = tick / 10
        out.append(f'<line x1="{left}" x2="{right}" y1="{sy(a)}" y2="{sy(a)}" stroke="#ddd"/><text x="{left-8}" y="{sy(a)+4}" text-anchor="end">{a:.1f}</text>')
    for x in range(0, 86, 10):
        out.append(f'<line x1="{sx(x)}" x2="{sx(x)}" y1="{top}" y2="{bottom}" stroke="#eee"/><text x="{sx(x)}" y="{bottom+18}" text-anchor="middle">{x}</text>')
    out.append(f'<text x="{(left+right)/2}" y="{height-12}" text-anchor="middle">x along the fade (CSS px; 0 = left edge, 85 = right edge)</text>')
    out.append(f'<text transform="translate(18 {(top+bottom)/2}) rotate(-90)" text-anchor="middle">alpha (0 = water, 1 = paper)</text>')
    points = " ".join(f"{sx(x):.1f},{sy(a):.1f}" for x, a in zip(css_x, measured) if -3 <= x <= 88)
    out.append(f'<polyline points="{points}" fill="none" stroke="#c0392b" stroke-width="3" stroke-opacity="0.45"/>')
    new_colours = {"smootherstep, 256 stops": "#2a6f4e", "linear light, 256 stops": "#143c6b"}
    for label, (cols, alpha) in new.items():
        pts = " ".join(f"{sx(x):.1f},{sy(a):.1f}" for x, a in zip(cols, alpha) if -3 <= x <= 88)
        out.append(f'<polyline points="{pts}" fill="none" stroke="{new_colours[label]}" stroke-width="5" stroke-opacity="0.3"/>')
    for name, curve in curves.items():
        path = " ".join(f"{sx(x):.1f},{sy(a):.1f}" for x, a in zip(design_x, curve))
        out.append(f'<polyline points="{path}" fill="none" stroke="{colours[name]}" stroke-width="2"/>')
    legend = [("measured: first screenshot (24 stops, offsets rounded)", "#c0392b"), ("measured: new smootherstep (wide, pale green)", "#2a6f4e"), ("measured: new linear light (wide, pale blue)", "#143c6b")] + [(f"formula: {name}", colours[name]) for name in curves]
    for index, (label, colour) in enumerate(legend):
        y = top + 8 + 20 * index + 250 * 0
        out.append(f'<line x1="{left+14}" x2="{left+44}" y1="{y}" y2="{y}" stroke="{colour}" stroke-width="3"/><text x="{left+52}" y="{y+4}">{label}</text>')
    out.append("</svg>")
    (HERE / "fade-curves.svg").write_text("\n".join(out))


main()
