"""The narrated mode's two layouts, measured on common screens.

For each screen: the slide's width on screen, its scale (screen px per slide
px), the size that the house's 17 px text floor becomes, and the narration's
line length in characters. The layouts are those of
deck/addons/narration/global-top.vue:

- side: a column at the right, clamp(320 px, 32vw, 560 px) wide;
- below: a panel 34vh tall, under the slide.

Run anywhere: `python3 layout.py`. It prints a Markdown table.
"""

from dataclasses import dataclass

SLIDE_WIDTH = 980
SLIDE_HEIGHT = 552
FLOOR_PX = 17  # the house's smallest text on a slide (stem/docs/legibility.md)
PANEL_FONT_PX = 17
CHAR_WIDTH_EM = 0.5  # an estimate for IBM Plex Sans: average character width
# The panel's padding, and the part's left border and padding.
PANEL_PADDING_PX = 28 * 2 + 15


@dataclass(frozen=True)
class Screen:
    name: str
    width: int
    height: int


@dataclass(frozen=True)
class Fit:
    slide_width: float
    text_width: float

    @property
    def scale(self) -> float:
        return self.slide_width / SLIDE_WIDTH

    @property
    def floor(self) -> float:
        return FLOOR_PX * self.scale

    @property
    def chars(self) -> float:
        return (self.text_width - PANEL_PADDING_PX) / (PANEL_FONT_PX * CHAR_WIDTH_EM)


def fit(area_width: float, area_height: float) -> float:
    """The slide's width when it is scaled to fit an area."""
    return min(area_width, area_height * SLIDE_WIDTH / SLIDE_HEIGHT)


def side(screen: Screen) -> Fit:
    column = min(max(320, 0.32 * screen.width), 560)
    return Fit(fit(screen.width - column, screen.height), column)


def below(screen: Screen) -> Fit:
    return Fit(fit(screen.width, 0.66 * screen.height), screen.width)


def full(screen: Screen) -> float:
    return fit(screen.width, screen.height)


SCREENS = [
    Screen("1920x1080 monitor", 1920, 1080),
    Screen("2560x1440 monitor", 2560, 1440),
    Screen("1728x1117 MacBook Pro 16", 1728, 1117),
    Screen("1512x982 MacBook Pro 14", 1512, 982),
    Screen("1470x956 MacBook Air 15", 1470, 956),
    Screen("1280x800 small laptop", 1280, 800),
    Screen("1180x820 iPad, landscape", 1180, 820),
    Screen("820x1180 iPad, portrait", 820, 1180),
    Screen("390x844 phone, portrait", 390, 844),
    Screen("844x390 phone, landscape", 844, 390),
]


def main() -> None:
    print(
        "| Screen | Aspect | Play mode: slide width | Side: slide width (scale) | Side: 17 px is | Side: chars/line "
        "| Below: slide width (scale) | Below: 17 px is | Below: chars/line | Chosen by 8/5 rule |"
    )
    print("|" + " --- |" * 10)
    for screen in SCREENS:
        aspect = screen.width / screen.height
        side_fit, below_fit = side(screen), below(screen)
        chosen = "side" if aspect >= 8 / 5 else "below"
        print(
            f"| {screen.name} | {aspect:.2f} | {full(screen):.0f} "
            f"| {side_fit.slide_width:.0f} ({side_fit.scale:.2f}) | {side_fit.floor:.1f} px | {side_fit.chars:.0f} "
            f"| {below_fit.slide_width:.0f} ({below_fit.scale:.2f}) | {below_fit.floor:.1f} px | {below_fit.chars:.0f} "
            f"| {chosen} |"
        )


if __name__ == "__main__":
    main()
