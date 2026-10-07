"""Data for the proposed gates (PLAN.md §4.8): derive each theme's subject and
washes by the steps of "Making a theme" (PLAN.md §5), and measure the pairs
that no house gate checks yet.

For each candidate theme of watches/tasks/2026-09-18-theme-colors that passes
the house gates of 2026-10-07:
- subject: the accent's hue and chroma, moved away from the panel until it is
  9.6:1 on it (Ledger's value); chroma is cut to the sRGB gamut if needed.
- subject-wash: the panel's lightness side, at the hue of the subject and
  chroma 5, at 1.2:1 on the panel.
- second-wash: second over the background, at the blend that gives the
  subject-wash's contrast on the panel.
- muted-wash: muted at 0.18 over the background.

Then (part 2) every gate, the house's of 2026-10-07 and the new ones of
PLAN.md §4.8, on every candidate theme, with each miss and its margin.

Run from stem/: uv run python tasks/2026-10-07-theme-colour-system/tools/gate_data.py
"""

import importlib.util
import math
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
STEM = HERE.parents[2]


def load(name: str, path: pathlib.Path):  # noqa: ANN201
    spec = importlib.util.spec_from_file_location(name, path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


house = load("house_lib", STEM / "tools" / "lib.py")
theme_task = load("theme_task_lib", STEM / "watches" / "tasks" / "2026-09-18-theme-colors" / "tools" / "lib.py")
Colour, Deficiency = house.Colour, house.Deficiency
contrast, cvd, de76 = house.contrast, house.cvd, house.de76

# The house gates on 2026-10-07 (tools/lib.py), copied.
GATES = [("ink", "bg", 12.0), ("ink", "panel", 12.0), ("accent", "panel", 4.5),
         ("warn", "panel", 3.5), ("muted", "panel", 4.5)]
SUBJECT_CONTRAST = 9.6
WASH_CONTRAST = 1.2
WASH_CHROMA = 5.0
MUTED_WASH = 0.18


def lch(colour: Colour) -> tuple[float, float, float]:
    light, a, b = house.lab(house.simulate(colour, Deficiency.NORMAL))
    return light, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def from_lch(light: float, chroma: float, hue: float) -> Colour | None:
    """The sRGB colour, or None outside the gamut."""
    a, b = chroma * math.cos(math.radians(hue)), chroma * math.sin(math.radians(hue))
    fy = (light + 16) / 116
    fx, fz = fy + a / 500, fy - b / 200
    inverse = lambda f: f ** 3 if f > 6 / 29 else 3 * (6 / 29) ** 2 * (f - 4 / 29)  # noqa: E731
    x, y, z = 0.95047 * inverse(fx), inverse(fy), 1.08883 * inverse(fz)
    linear = (3.2406 * x - 1.5372 * y - 0.4986 * z,
              -0.9689 * x + 1.8758 * y + 0.0415 * z,
              0.0557 * x - 0.2040 * y + 1.0570 * z)
    if not all(-1e-4 <= channel <= 1 + 1e-4 for channel in linear):
        return None
    encode = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055  # noqa: E731
    return Colour(*(round(255 * min(1.0, max(0.0, encode(c)))) for c in linear))


def in_gamut(light: float, chroma: float, hue: float) -> Colour:
    """The colour, with its chroma cut until it is in sRGB."""
    while chroma >= 0:
        colour = from_lch(light, chroma, hue)
        if colour is not None:
            return colour
        chroma -= 0.5
    raise ValueError("no colour")


def at_contrast(paper: Colour, chroma: float, hue: float, target: float, away: bool) -> Colour:
    """The colour of this hue and chroma whose contrast on `paper` is `target`:
    darker than the paper if the paper is light, lighter if it is dark."""
    paper_light = lch(paper)[0]
    toward_black = paper_light > 50
    low, high = (0.0, paper_light) if toward_black else (paper_light, 100.0)
    for _ in range(40):
        middle = (low + high) / 2
        ratio = contrast(in_gamut(middle, chroma, hue), paper)
        # moving away from the paper raises the contrast
        too_far = ratio > target
        if toward_black:
            low, high = (middle, high) if too_far else (low, middle)
        else:
            low, high = (low, middle) if too_far else (middle, high)
    return in_gamut((low + high) / 2, chroma, hue)


def blend_for(line: Colour, paper: Colour, surface: Colour, target: float) -> Colour:
    """`line` over `paper` at the blend that gives `target` on `surface`."""
    low, high = 0.0, 1.0
    for _ in range(40):
        middle = (low + high) / 2
        if contrast(line.blend(paper, middle), surface) < target:
            low = middle
        else:
            high = middle
    return line.blend(paper, (low + high) / 2)


def derived(c: dict) -> dict:
    """The theme's derived colours, by the steps of PLAN.md §5."""
    _, accent_chroma, accent_hue = lch(c["accent"])
    subject = at_contrast(c["panel"], accent_chroma, accent_hue, SUBJECT_CONTRAST, True)
    subject_wash = at_contrast(c["panel"], WASH_CHROMA, lch(subject)[2], WASH_CONTRAST, False)
    second_wash = blend_for(c["warn"], c["bg"], c["panel"], contrast(subject_wash, c["panel"]))
    muted_wash = c["muted"].blend(c["bg"], MUTED_WASH)
    return {"subject": subject, "subject_wash": subject_wash,
            "second_wash": second_wash, "muted_wash": muted_wash}


def all_gates(c: dict) -> list[tuple[str, float, float, bool]]:
    """(gate, value, threshold, passes) for every gate: the house's, then §4.8's."""
    d = derived(c)
    at_least = lambda name, value, floor: (name, value, floor, value >= floor)  # noqa: E731
    at_most = lambda name, value, ceiling: (name, value, ceiling, value <= ceiling)  # noqa: E731
    return [
        at_least("ink on background", contrast(c["ink"], c["bg"]), 12.0),
        at_least("ink on panel", contrast(c["ink"], c["panel"]), 12.0),
        at_least("accent on panel", contrast(c["accent"], c["panel"]), 4.5),
        at_least("second on panel", contrast(c["warn"], c["panel"]), 3.5),
        at_least("muted on panel", contrast(c["muted"], c["panel"]), 4.5),
        at_least("accent vs ink dE", de76(c["accent"], c["ink"]), 35),
        at_least("accent vs second CVD dE", cvd(c["accent"], c["warn"]), 25),
        at_least("NEW subject vs muted dE", de76(d["subject"], c["muted"]), 30),
        at_least("NEW subject vs ink dE", de76(d["subject"], c["ink"]), 30),
        at_least("NEW second vs subject CVD dE", cvd(c["warn"], d["subject"]), 25),
        at_least("subject on its wash", contrast(d["subject"], d["subject_wash"]), 3.0),
        at_least("second on its wash", contrast(c["warn"], d["second_wash"]), 3.0),
        at_least("NEW muted on its wash", contrast(c["muted"], d["muted_wash"]), 3.0),
        at_least("NEW subject-wash on panel", contrast(d["subject_wash"], c["panel"]), 1.12),
        at_least("NEW second-wash on panel", contrast(d["second_wash"], c["panel"]), 1.12),
        at_least("NEW muted-wash on panel", contrast(d["muted_wash"], c["panel"]), 1.12),
        at_most("NEW subject-wash on background", contrast(d["subject_wash"], c["bg"]), 1.5),
        at_most("NEW second-wash on background", contrast(d["second_wash"], c["bg"]), 1.5),
        at_most("NEW muted-wash on background", contrast(d["muted_wash"], c["bg"]), 1.5),
    ]


def report() -> None:
    print("\n\n2. Every gate on every candidate (NEW: PLAN.md §4.8)")
    for theme in theme_task.load_themes():
        c = {role: Colour.from_hex(theme[role]) for role in ("bg", "panel", "ink", "muted", "accent", "warn")}
        misses = [(name, value, limit) for name, value, limit, passes in all_gates(c) if not passes]
        print(f"\n{theme['name']}: {'passes every gate' if not misses else f'{len(misses)} miss(es)'}")
        for name, value, limit in misses:
            print(f"  {name}: {value:.2f} against {limit:g} (short by {abs(value - limit):.2f})")


def main() -> None:
    rows = []
    for theme in theme_task.load_themes():
        c = {role: Colour.from_hex(theme[role]) for role in ("bg", "panel", "ink", "muted", "accent", "warn")}
        if any(contrast(c[role], c[against]) < floor for role, against, floor in GATES):
            continue
        if de76(c["accent"], c["ink"]) < 35 or cvd(c["accent"], c["warn"]) < 25:
            continue
        _, accent_chroma, accent_hue = lch(c["accent"])
        subject = at_contrast(c["panel"], accent_chroma, accent_hue, SUBJECT_CONTRAST, True)
        subject_wash = at_contrast(c["panel"], WASH_CHROMA, lch(subject)[2], WASH_CONTRAST, False)
        second_wash = blend_for(c["warn"], c["bg"], c["panel"], contrast(subject_wash, c["panel"]))
        muted_wash = c["muted"].blend(c["bg"], MUTED_WASH)
        rows.append((theme["name"], {
            "subject": subject.hex,
            "subject C*": lch(subject)[1],
            "subject/muted dE": de76(subject, c["muted"]),
            "subject/ink dE": de76(subject, c["ink"]),
            "second/subject CVD": cvd(c["warn"], subject),
            "subject on its wash": contrast(subject, subject_wash),
            "second on its wash": contrast(c["warn"], second_wash),
            "muted on its wash": contrast(c["muted"], muted_wash),
            "subject-wash on panel": contrast(subject_wash, c["panel"]),
            "second-wash on panel": contrast(second_wash, c["panel"]),
            "muted-wash on panel": contrast(muted_wash, c["panel"]),
        }))
    keys = list(rows[0][1])
    for key in keys:
        print(f"\n{key}")
        for name, values in rows:
            value = values[key]
            print(f"  {name:24} {value if isinstance(value, str) else f'{value:.2f}'}")
        numbers = [values[key] for _, values in rows if not isinstance(values[key], str)]
        if numbers:
            print(f"  {'min / max':24} {min(numbers):.2f} / {max(numbers):.2f}")


main()
report()
