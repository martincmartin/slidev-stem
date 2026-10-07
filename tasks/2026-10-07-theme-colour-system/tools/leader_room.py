"""Is there room in Ledger for one more hue, for the leaders and their words?

Search sRGB colours of every hue whose contrast on the background is at least
4.5:1 (a 4 px leader in muted, 4.96:1, held 3.58:1 at the back row; see
watches/docs/measurements.md) and print the best ones by their worst CVD
separation from every role a leader sits beside: ink (the label's other
words), the subject (the outlines it crosses), the accent, second (a flash),
and muted (the drive arrow). Ledger's values of 2026-10-07 are copied here.

ΔE76 overstates differences among blues, so a CVD search alone picks pure
blue, which reads as the same family as the subject and the accent. So a
candidate must also be a visible colour (C* >= MIN_CHROMA) whose hue is at
least MIN_HUE_GAP degrees from each chromatic role (subject, accent, second).

Run from stem/: uv run python tasks/2026-10-07-theme-colour-system/tools/leader_room.py
"""

import importlib.util
import pathlib

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("house_lib", HERE.parents[2] / "tools" / "lib.py")
assert spec and spec.loader
house = importlib.util.module_from_spec(spec)
spec.loader.exec_module(house)
Colour, contrast, cvd, de76 = house.Colour, house.contrast, house.cvd, house.de76

LEDGER = {
    "ink": "#2A2520", "subject": "#143C6B", "accent": "#1F5FA8",
    "second": "#9A6238", "muted": "#736A60",
}
BACKGROUND = Colour.from_hex("#FAF7F0")
NEIGHBOURS = {name: Colour.from_hex(value) for name, value in LEDGER.items()}


MIN_CHROMA = 30
MIN_HUE_GAP = 45


def lch(colour: Colour) -> tuple[float, float, float]:
    import math

    light, a, b = house.lab(house.simulate(colour, house.Deficiency.NORMAL))
    return light, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


def hue_gap(first: float, second: float) -> float:
    gap = abs(first - second) % 360
    return min(gap, 360 - gap)


CHROMATIC = [lch(NEIGHBOURS[name])[2] for name in ("subject", "accent", "second")]


def main() -> None:
    found = []
    for red in range(0, 256, 6):
        for green in range(0, 256, 6):
            for blue in range(0, 256, 6):
                colour = Colour(red, green, blue)
                if contrast(colour, BACKGROUND) < 4.5:
                    continue
                _, chroma, hue = lch(colour)
                if chroma < MIN_CHROMA or min(hue_gap(hue, other) for other in CHROMATIC) < MIN_HUE_GAP:
                    continue
                separations = {name: cvd(colour, other) for name, other in NEIGHBOURS.items()}
                found.append((min(separations.values()), colour, separations))
    found.sort(key=lambda row: -row[0])
    print("best worst-case CVD separation from ink, subject, accent, second and muted")
    print("(above 20 unmistakable, 10-20 clear, below 10 risky: tools/lib.py, cvd)\n")
    for worst, colour, separations in found[:12]:
        detail = ", ".join(f"{name} {value:.0f}" for name, value in separations.items())
        _, chroma, hue = lch(colour)
        print(f"{colour.hex}  h {hue:3.0f} C {chroma:3.0f}  worst {worst:5.1f}  "
              f"contrast {contrast(colour, BACKGROUND):.2f}  ({detail})")
    second = NEIGHBOURS["second"]
    separations = {name: cvd(second, other) for name, other in NEIGHBOURS.items() if name != "second"}
    print(f"\nsecond itself {second.hex}: " + ", ".join(f"{n} {v:.0f}" for n, v in separations.items())
          + f"; contrast {contrast(second, BACKGROUND):.2f}")


main()
