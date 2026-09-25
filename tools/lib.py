"""House constants and the colour/legibility maths every other tool here uses.

Stdlib only, deliberately, so the checks that gate new content start at once and
need no packages. Like every tool here, it needs Python 3.14: run it with
stem/.venv/bin/python3 (../requirements.txt says how to make the venv). The tools
that render (`barroom.py`, `contact.py`, `motion.py`) need packages too, and say
so.

WHAT LIVES HERE AND WHAT DOES NOT. This file holds the *current* framework for
every STEM talk: the gates for the Ledger palette, the Line-weighted drawing
grammar, the venue model and the thresholds new work has to clear. It does not
hold the alternatives, the losing candidates or the reasoning that picked these —
those are in the talks' `tasks/`, and you should not need them to make a new
slide. See `docs/README.md`.

Everything here is a number someone can change. When you change one, change it
here and nowhere else: the tools read these constants rather than repeating them,
so a threshold cannot drift between tools. The palette values are the exception:
they are read from the theme's CSS, so they exist in one place only.
"""

import math
import pathlib
import re
from collections.abc import Iterable

ROOT = pathlib.Path(__file__).resolve().parents[1]  # stem/
# A talk is a directory of stem/ with a slides.md.
TALKS = sorted(
    directory for directory in ROOT.iterdir() if (directory / "slides.md").is_file()
)

# --------------------------------------------------------------------------
# The theme: Ledger. Chosen 2026-09-19. docs/theme.md is the prose version.
# The values are read from the theme's CSS, the one place they are set.
# --------------------------------------------------------------------------
THEME_CSS = ROOT / "themes/ledger/styles/ledger.css"
THEME_SELECTOR = ".slidev-layout"  # the rule in THEME_CSS that holds the palette
PALETTE_PREFIX = "--palette-"  # every theme fills the same roles: --palette-ink, ...


def css_palette(path: pathlib.Path = THEME_CSS) -> dict[str, str] | None:
    """The PALETTE_PREFIX variables that the THEME_SELECTOR rule in `path` sets, as
    {role: value}, with values upper-cased. None if there is no such rule."""
    source = re.sub(r"/\*.*?\*/", "", path.read_text(), flags=re.DOTALL)
    block = re.search(
        r"(?m)^\s*" + re.escape(THEME_SELECTOR) + r"\s*\{([^}]*)\}", source
    )
    if not block:
        return None
    return {
        role: value.strip().upper()
        for role, value in re.findall(
            re.escape(PALETTE_PREFIX) + r"([\w-]+)\s*:\s*([^;]+);", block.group(1)
        )
    }


_palette = css_palette()
if not _palette:
    raise SystemExit(
        f"no `{THEME_SELECTOR} {{ {PALETTE_PREFIX}... }}` rule in {THEME_CSS}"
    )
LEDGER: dict[str, str] = _palette

# Contrast gates, all measured against the surface the mark actually sits on --
# which is the PANEL for anything on a card, not the slide background. That
# distinction was a real defect once (theme archive, insight 8).
GATES = [
    # (role, against, minimum, why)
    ("ink", "background", 12.0, "headroom to degrade from; Ledger has 14.2"),
    ("ink", "panel", 12.0, "the same text on a card"),
    ("accent", "panel", 4.5, "the 37px stat number"),
    ("second", "panel", 3.5, "20px bold counts as large text: 3:1 plus margin"),
    # 4.5 is WCAG AA for normal text, and 17px body IS normal text (the large-text
    # relaxation starts at 18px, or 14px bold). The theme archive's table states
    # this gate as 4.6 and gives no derivation; Ledger's muted measures 4.578 on
    # the panel, so at 4.6 the chosen theme fails its own written gate by 0.02.
    # The standard is the defensible number, so 4.5 is what is enforced here --
    # and the real finding is recorded in docs/theme.md: muted-on-panel has 1.7%
    # of margin and is the thinnest thing in the palette. Do not shrink it.
    ("muted", "panel", 4.5, "17px body is normal text, so WCAG AA applies"),
]
ACCENT_VS_INK_DE = 35  # emphasis must read as emphasis, not as darker ink
CVD_DE = 25  # accent vs second, under deuteranopia AND protanopia
CONTRAST_FLOOR = 3.0  # WCAG non-text: the floor a drawn mark must hold

# --------------------------------------------------------------------------
# The drawing grammar: set 2, "Line, weighted". Chosen 2026-09-21.
# docs/illustrations.md is the prose version.
# --------------------------------------------------------------------------
# Each SVG states the size a slide shows it at: its width and height attributes,
# in CSS px. Its viewBox is its own drawing units. So one unit is
# width / viewBox width CSS px, and the tools render each file at its own size.


def plain_number(text: str | None) -> float | None:
    """`text` as a number, or None if it is missing or not a plain number."""
    return float(text) if text and re.fullmatch(r"[0-9.]+", text) else None


def shown_size(source: str) -> tuple[float | None, float | None, float | None]:
    """-> (width, height, CSS px per unit) of an SVG, from its root attributes.
    None for a value that is missing or not a plain number."""
    head = re.search(r"<svg\b[^>]*>", source)
    attributes = dict(re.findall(r'(\w+)="([^"]*)"', head.group(0))) if head else {}
    width = plain_number(attributes.get("width"))
    height = plain_number(attributes.get("height"))
    view_box = attributes.get("viewBox", "").split()
    view_width = float(view_box[2]) if len(view_box) == 4 else None
    return width, height, (width / view_width if width and view_width else None)


# The ladder, in CSS px as shown. New art picks from these; it does not invent
# intermediate weights, because the hierarchy is the style and four steps is what
# makes it readable. A stroke matches a step within LADDER_TOLERANCE: the
# timekeepers (240 units shown 122 px wide) measure 2.03, 2.54, 3.05 and 4.07.
STROKE_LADDER = [2.0, 2.5, 3.0, 4.0]
LADDER_TOLERANCE = 0.05
ASPECT_TOLERANCE = 0.01  # width:height vs the viewBox's, so nothing is squashed

# Every colour a Line-weighted drawing is allowed to use, and its job. The
# values come from the theme: two are the drawings' own variables, two are
# palette colours.
ART_INK = {
    LEDGER["art-line"]: (
        "primary line work: the subject's own structure. Also as a 0.07-0.08 fill."
    ),
    LEDGER["muted"]: (
        "secondary structure: the stand, the frame, the thing holding it up."
    ),
    LEDGER["ink"]: "tertiary detail: tick marks, smoke. Usually at 0.5 stroke-opacity.",
    LEDGER["art-knockout"]: (
        "knockout: a pale face that has to read as lit, not as empty paper."
    ),
}
ART_FIELD = LEDGER["panel"]  # illustrations sit on a card, not on the slide

# --------------------------------------------------------------------------
# The venue. Never visited; these are the rows you cannot rule out.
# Edit this table the day the venue is known -- it is the whole cost of
# re-deciding anything in docs/legibility.md.
# --------------------------------------------------------------------------
DECK_W = 980  # Slidev's canvas width in CSS px (the 980x552 default)
VENUES = [
    # label, screen width (m), back row (m)
    ("laptop", 0.31, 0.55),
    ("TV 55in @5m", 1.22, 5.00),
    ("TV 55in @7m", 1.22, 7.00),  # <- the hostile case, and the one to design for
    ("proj 2m @6m", 2.00, 6.00),
]
DESIGN_VENUE = "TV 55in @7m"


def arcmin_per_csspx(screen_width_m: float, distance_m: float) -> float:
    return (
        math.degrees(math.atan(screen_width_m * 1000 / DECK_W / (distance_m * 1000)))
        * 60
    )


def resolvable_csspx(venue_label: str = DESIGN_VENUE) -> float:
    """Thinnest mark an eye resolves at that venue, in CSS px. 1 arcmin limit."""
    screen_width, distance = next(
        (screen_width, distance)
        for label, screen_width, distance in VENUES
        if label == venue_label
    )
    return 1.0 / arcmin_per_csspx(screen_width, distance)


STROKE_FLOOR_CSSPX = 1.64  # = resolvable_csspx("TV 55in @7m"), pinned for reference


# --------------------------------------------------------------------------
# Colour maths. WCAG luminance/contrast, plus ambient flare and CVD.
# --------------------------------------------------------------------------
def srgb_to_lin(channel: float) -> float:
    channel = channel / 255.0
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def luminance(hex_colour: str) -> float:
    digits = hex_colour.lstrip("#")
    red, green, blue = (int(digits[index : index + 2], 16) for index in (0, 2, 4))
    return (
        0.2126 * srgb_to_lin(red)
        + 0.7152 * srgb_to_lin(green)
        + 0.0722 * srgb_to_lin(blue)
    )


def contrast(first: str, second: str, flare: float = 0.0) -> float:
    """WCAG contrast, with optional ADDITIVE ambient flare.

    Room light lands on the screen and adds: lin' = lin + F. It is deliberately
    not clipped at white -- reflected ambient really does push the screen's white
    above its nominal white, and the eye adapts to that new maximum. Clipping
    invents a penalty for every light design. Because contrast is a ratio, flare
    caps what ANY content can reach: 1.05/(F+0.05), so F=0.29 makes 3:1
    unreachable by any design whatsoever.
    """
    first_luminance = luminance(first) + flare
    second_luminance = luminance(second) + flare
    return (max(first_luminance, second_luminance) + 0.05) / (
        min(first_luminance, second_luminance) + 0.05
    )


def flare_ceiling(flare: float) -> float:
    """The best contrast any design can reach at this flare level."""
    return 1.05 / (flare + 0.05)


def max_flare(first: str, second: str, floor: float = CONTRAST_FLOOR) -> float:
    """Fmax: the ambient flare at which this pair falls through the floor.

    A property of the colours, in units of how much room light they can take.
    0.30 is the physical ceiling. This is the number to shop venues with.
    """
    if contrast(first, second) < floor:
        return 0.0
    low, high = 0.0, 0.30
    for _ in range(40):
        middle = (low + high) / 2
        low, high = (
            (middle, high)
            if contrast(first, second, middle) >= floor
            else (low, middle)
        )
    return low


def lightness_ratio(first: str, second: str) -> float:
    first_luminance, second_luminance = luminance(first), luminance(second)
    return (max(first_luminance, second_luminance) + 0.05) / (
        min(first_luminance, second_luminance) + 0.05
    )


# ---- colour-vision deficiency (Vienot, Brettel & Mollon 1999) -------------
def _lin(hex_colour: str) -> list[float]:
    digits = hex_colour.lstrip("#")
    return [srgb_to_lin(int(digits[index : index + 2], 16)) for index in (0, 2, 4)]


def simulate(hex_colour: str, kind: str) -> list[float]:
    red, green, blue = _lin(hex_colour)
    long_cone = 17.8824 * red + 43.5161 * green + 4.11935 * blue
    medium_cone = 3.45565 * red + 27.1554 * green + 3.86714 * blue
    short_cone = 0.0299566 * red + 0.184309 * green + 1.46709 * blue
    if kind == "deuter":
        medium_cone = 0.494207 * long_cone + 1.24827 * short_cone
    elif kind == "protan":
        long_cone = 2.02344 * medium_cone - 2.52581 * short_cone
    out = (
        0.080944 * long_cone - 0.130504 * medium_cone + 0.116721 * short_cone,
        -0.0102485 * long_cone + 0.0540194 * medium_cone - 0.113615 * short_cone,
        -0.000365294 * long_cone - 0.00412163 * medium_cone + 0.693513 * short_cone,
    )
    return [max(0.0, min(1.0, channel)) for channel in out]


def _lab_f(ratio: float) -> float:
    return ratio ** (1 / 3) if ratio > 216 / 24389 else (841 / 108) * ratio + 4 / 29


def _lab(rgb: Iterable[float]) -> tuple[float, float, float]:
    red, green, blue = rgb
    x, y, z = (
        0.4124 * red + 0.3576 * green + 0.1805 * blue,
        0.2126 * red + 0.7152 * green + 0.0722 * blue,
        0.0193 * red + 0.1192 * green + 0.9505 * blue,
    )
    fx, fy, fz = _lab_f(x / 0.95047), _lab_f(y / 1.0), _lab_f(z / 1.08883)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def de76(first: str, second: str, kind: str = "normal") -> float:
    first_lab, second_lab = _lab(simulate(first, kind)), _lab(simulate(second, kind))
    squares = sum(
        (first_part - second_part) ** 2
        for first_part, second_part in zip(first_lab, second_lab, strict=True)
    )
    return float(squares**0.5)


def cvd(first: str, second: str) -> float:
    """Worst-case separation of two colours for a red-green deficient viewer.

    Rough reading: dE > 20 unmistakable, 10-20 clear, < 10 risky at a glance.
    Do not eyeball this -- hand estimates in the theme archive were wrong in
    both directions, calling safe pairs dangerous and the two worst pairs safe.
    """
    return min(de76(first, second, kind) for kind in ("deuter", "protan"))


# --------------------------------------------------------------------------
def blend(foreground: str, background: str, alpha: float) -> str:
    """What a colour drawn at `alpha` over `background` actually becomes.

    SVG composites a normal-blend fill in the document colour space, which is
    non-linear sRGB, so this interpolates the 8-bit channels directly. That is
    what the browser does and therefore what the eye gets.
    """
    front, back = foreground.lstrip("#"), background.lstrip("#")
    return "#" + "".join(
        f"{round(int(front[index : index + 2], 16) * alpha + int(back[index : index + 2], 16) * (1 - alpha)):02X}"
        for index in (0, 2, 4)
    )


def min_opacity(
    foreground: str, background: str | None = None, floor: float = CONTRAST_FLOOR
) -> float | None:
    """The least opacity at which `foreground` on `background` still holds the
    contrast floor.

    Anything fainter is a wash: visible to the front three rows and gone at the
    back. That is a legitimate thing to draw -- but the drawing has to read
    without it. See docs/legibility.md.
    """
    background = background or ART_FIELD
    if contrast(foreground, background) < floor:
        return None  # opaque is already below the floor
    low, high = 0.0, 1.0
    for _ in range(30):
        middle = (low + high) / 2
        low, high = (
            (low, middle)
            if contrast(blend(foreground, background, middle), background) >= floor
            else (middle, high)
        )
    return high


def art_files(paths: Iterable[str] | None = None) -> list[pathlib.Path]:
    """The SVGs to check: given paths, or every SVG in every talk's public/."""
    if paths:
        out: list[pathlib.Path] = []
        for given in paths:
            path = pathlib.Path(given)
            out += sorted(path.rglob("*.svg")) if path.is_dir() else [path]
        return out
    return [file for talk in TALKS for file in sorted((talk / "public").rglob("*.svg"))]


def rel(file: str | pathlib.Path) -> pathlib.Path:
    """A path for printing: relative to stem/ when it is inside it."""
    path = pathlib.Path(file).resolve()
    return path.relative_to(ROOT) if ROOT in path.parents else path


def stray_palette_declarations() -> list[tuple[pathlib.Path, int, str]]:
    """Every place in a talk that declares a PALETTE_PREFIX variable, as
    (path, line number, text). Only the theme sets the palette."""
    files = [
        file
        for talk in TALKS
        for file in sorted(talk.glob("slides*.md"))
        + sorted(talk.glob("pages/*.md"))
        + sorted((talk / "components").glob("*.vue"))
        + sorted((talk / "styles").glob("*.css"))
    ]
    out = []
    for file in files:
        for number, line in enumerate(file.read_text().splitlines(), 1):
            if re.search(re.escape(PALETTE_PREFIX) + r"[\w-]+\s*:", line):
                out.append((rel(file), number, line.strip()))
    return out


def colours_in(source: str) -> set[str]:
    return {colour.upper() for colour in re.findall(r"#[0-9A-Fa-f]{6}", source)}


def strokes_in(source: str) -> list[float]:
    return [float(width) for width in re.findall(r'stroke-width="([0-9.]+)"', source)]


if __name__ == "__main__":
    print(f"Ledger, and the floor at {DESIGN_VENUE}\n")
    for role, value in LEDGER.items():
        print(f"  {PALETTE_PREFIX}{role:<11} {value}   L={luminance(value):.4f}")
    print(
        f"\n  stroke ladder {STROKE_LADDER} CSS px as shown (within {LADDER_TOLERANCE:.0%})"
    )
    print(f"  stroke floor  {STROKE_FLOOR_CSSPX} CSS px\n")
    for label, screen_width, distance in VENUES:
        arcmin = arcmin_per_csspx(screen_width, distance)
        design = "   <- design for this one" if label == DESIGN_VENUE else ""
        print(
            f"  {label:<13} {arcmin:.2f} arcmin/CSSpx, thinnest resolvable mark "
            f"{1 / arcmin:.2f} CSS px{design}"
        )
