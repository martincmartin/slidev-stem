"""House constants and the colour/legibility maths every other tool here uses.

Stdlib only, deliberately, so the checks that gate new content start at once and
need no packages. Use the Python version pinned in `.python-version`. Run it with
`uv run` in stem/, or with stem/.venv/bin/python3 (`uv sync` makes it). The tools
that render (`barroom.py`, `contact.py`, `motion.py`) need packages too, and say
so.

WHAT LIVES HERE AND WHAT DOES NOT. This file holds the *current* framework for
every STEM talk: the gates for every palette, the Line-weighted drawing
grammar, the venue model and the thresholds new work has to clear. It does not
hold the alternatives, the losing candidates or the reasoning that picked these —
those are in the talks' `tasks/`, and you should not need them to make a new
slide. See `docs/README.md`.

Everything here is a number someone can change. When you change one, change it
here and nowhere else: the tools read these constants rather than repeating them,
so a threshold cannot drift between tools. The palette values are the exception:
they are read from each palette's CSS, so they exist in one place only.
"""

import math
import pathlib
import re
from collections.abc import Callable, Iterable
from dataclasses import dataclass
from enum import Enum

ROOT = pathlib.Path(__file__).resolve().parents[1]  # stem/


def display_path(file: str | pathlib.Path) -> pathlib.Path:
    """A path for printing: relative to stem/ when it is inside it."""
    path = pathlib.Path(file).resolve()
    return path.relative_to(ROOT) if ROOT in path.parents else path


# --------------------------------------------------------------------------
# Colours. A colour is a value: parsed from hex once, and printed as hex.
# --------------------------------------------------------------------------
def srgb_to_linear(channel: float) -> float:
    """An 8-bit sRGB channel (0-255) in linear light (0-1)."""
    channel = channel / 255.0
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


@dataclass(frozen=True, order=True)
class Colour:
    """An sRGB colour. Ordered by channel, which is the order of its hex text."""

    red: int
    green: int
    blue: int

    @classmethod
    def from_hex(cls, text: str) -> Colour:
        """`#RRGGBB` or `RRGGBB`, in either case."""
        digits = text.strip().lstrip("#")
        if not re.fullmatch(r"[0-9A-Fa-f]{6}", digits):
            raise ValueError(f"{text!r} is not a 6-digit hex colour")
        return cls(*(int(digits[index : index + 2], 16) for index in (0, 2, 4)))

    @property
    def hex(self) -> str:
        return f"#{self.red:02X}{self.green:02X}{self.blue:02X}"

    def __str__(self) -> str:
        return self.hex

    def __format__(self, spec: str) -> str:
        return format(self.hex, spec)

    @property
    def linear(self) -> tuple[float, float, float]:
        return (
            srgb_to_linear(self.red),
            srgb_to_linear(self.green),
            srgb_to_linear(self.blue),
        )

    @property
    def channels(self) -> tuple[int, int, int]:
        return (self.red, self.green, self.blue)

    def distance(self, other: Colour) -> int:
        """The largest difference of one 8-bit channel."""
        return max(
            abs(mine - theirs)
            for mine, theirs in zip(self.channels, other.channels, strict=True)
        )

    @property
    def luminance(self) -> float:
        """WCAG relative luminance."""
        red, green, blue = self.linear
        return 0.2126 * red + 0.7152 * green + 0.0722 * blue

    def blend(self, background: Colour, alpha: float) -> Colour:
        """What this colour drawn at `alpha` over `background` actually becomes.

        SVG composites a normal-blend fill in the document colour space, which is
        non-linear sRGB, so this interpolates the 8-bit channels directly. That is
        what the browser does and therefore what the eye gets.
        """
        return Colour(
            *(
                round(front * alpha + back * (1 - alpha))
                for front, back in (
                    (self.red, background.red),
                    (self.green, background.green),
                    (self.blue, background.blue),
                )
            )
        )


Palette = dict[str, Colour]  # role -> colour; the roles are the CSS names
# role -> its CSS value: a #rrggbb colour, `var()` of another role, or
# `color-mix(in srgb, ...)` of those. A recipe follows its roles, so a slide
# class that changes a role changes what is made from it too.
Recipes = dict[str, str]

# --------------------------------------------------------------------------
# The palettes (docs/theme.md, "Palettes"). Each is an addon,
# themes/palettes/<name>/, whose palette.css holds one rule that sets every
# role: for a talk that loads the addon, and for any slide whose `class:`
# names it. The values are read from there, the one place they are set.
# --------------------------------------------------------------------------
PALETTES_DIR = ROOT / "themes/palettes"
PALETTE_PREFIX = "--palette-"  # every palette fills the same roles: --palette-ink, ...
SLIDE_SELECTOR = ".slidev-layout"  # Slidev's class on each slide's root element
# The roles that every palette sets (docs/theme.md, "The roles").
ROLES = (
    "background",
    "ink",
    "muted",
    "accent",
    "second",
    "panel",
    "border",
    "subject",
    "subject-wash",
    "muted-wash",
    "second-wash",
    "water",
    "ground",
    "ground-wash",
)
# The palette of the art's fallback colours, and of the tools that measure the
# art (docs/theme.md, "The reference palette"). A choice, not the structure:
# no palette and no theme file refers to it.
REFERENCE_PALETTE = "ledger"


def _block_recipes(block: str) -> Recipes:
    """The PALETTE_PREFIX variables that the body of a CSS rule sets, as
    {role: CSS value}, with the value's white space made plain."""
    return {
        role: re.sub(r"\s*\)", ")", re.sub(r"\(\s*", "(", " ".join(value.split())))
        for role, value in re.findall(
            re.escape(PALETTE_PREFIX) + r"([\w-]+)\s*:\s*([^;]+);", block
        )
    }


def _without_comments(path: pathlib.Path) -> str:
    return re.sub(r"/\*.*?\*/", "", path.read_text(), flags=re.DOTALL)


def palette_css(name: str, palettes: pathlib.Path = PALETTES_DIR) -> pathlib.Path:
    """The file that sets the palette `name`, of the palettes in `palettes`."""
    return palettes / name / "palette.css"


def palette_selector(name: str) -> str:
    """The selector of the palette `name`'s rule: every slide under the class
    (the talk's palette, from <html>), and a slide with the class (a preview).
    The first is the weaker, so a slide's own class wins."""
    return f":where(.palette-{name}) {SLIDE_SELECTOR}, {SLIDE_SELECTOR}.palette-{name}"


def css_recipes(path: pathlib.Path) -> Recipes | None:
    """The roles that the palette rule in `path` sets, as {role: CSS value}.
    None if `path` has no rule with the selector of its directory's palette."""
    selector = r"\s*,\s*".join(
        re.escape(part).replace(r"\ ", r"\s+")
        for part in palette_selector(path.parent.name).split(", ")
    )
    block = re.search(
        r"(?m)^\s*" + selector + r"\s*\{([^}]*)\}", _without_comments(path)
    )
    return None if not block else _block_recipes(block.group(1))


def _arguments(text: str) -> list[str]:
    """The comma-separated arguments of a CSS function's body, split only at
    the top level: `var(--a), b` is two."""
    parts, depth, current = [], 0, ""
    for character in text:
        if character == "," and depth == 0:
            parts.append(current.strip())
            current = ""
            continue
        depth += {"(": 1, ")": -1}.get(character, 0)
        current += character
    parts.append(current.strip())
    return parts


def _mix_part(text: str) -> tuple[str, float | None]:
    """A `color-mix()` colour and its percentage, if it has one."""
    found = re.fullmatch(r"(.+?)\s+([0-9.]+)%", text)
    return (found.group(1), float(found.group(2)) / 100) if found else (text, None)


def resolve(recipes: Recipes) -> Palette:
    """Each role's colour. A `color-mix()` mixes the 8-bit channels, as
    `Colour.blend` does and as the browser does in sRGB."""
    palette: Palette = {}

    def colour_of_value(text: str, chain: tuple[str, ...]) -> Colour:
        text = text.strip()
        if re.fullmatch(r"#[0-9A-Fa-f]{6}", text):
            return Colour.from_hex(text)
        if found := re.fullmatch(
            r"var\(\s*" + re.escape(PALETTE_PREFIX) + r"([\w-]+)\s*\)", text
        ):
            return colour_of_role(found.group(1), chain)
        if found := re.fullmatch(
            r"color-mix\(\s*in srgb\s*,(.*)\)", text, flags=re.DOTALL
        ):
            arguments = _arguments(found.group(1))
            if len(arguments) != 2:
                raise ValueError(f"{text!r}: color-mix() needs two colours")
            (first, first_share), (second, second_share) = map(_mix_part, arguments)
            share = (
                first_share
                if first_share is not None
                else 1 - second_share
                if second_share is not None
                else 0.5
            )
            return colour_of_value(first, chain).blend(
                colour_of_value(second, chain), share
            )
        raise ValueError(
            f"{text!r} is not a 6-digit hex colour, var() of a role, "
            "or color-mix(in srgb, ...) of those"
        )

    def colour_of_role(name: str, chain: tuple[str, ...]) -> Colour:
        if name in chain:
            raise ValueError(
                f"the roles refer to each other: {' -> '.join((*chain, name))}"
            )
        if name not in recipes:
            raise ValueError(f"{PALETTE_PREFIX}{name} is not a role of the palette")
        if name not in palette:
            palette[name] = colour_of_value(recipes[name], (*chain, name))
        return palette[name]

    for name in recipes:
        colour_of_role(name, ())
    return {name: palette[name] for name in recipes}


def house_palettes(palettes: pathlib.Path = PALETTES_DIR) -> list[str]:
    """The reference palette, then each other palette in `palettes`, by name."""
    return [
        REFERENCE_PALETTE,
        *sorted(
            directory.name
            for directory in palettes.iterdir()
            if directory.name != REFERENCE_PALETTE
            and palette_css(directory.name, palettes).is_file()
        ),
    ]


def palette_recipes(name: str, palettes: pathlib.Path = PALETTES_DIR) -> Recipes:
    """The roles of the palette `name` in `palettes`, as its rule sets them.
    Every palette sets every role: a role that a preview class left unset
    would come from the talk's palette, not from the class's."""
    path = palette_css(name, palettes)
    recipes = css_recipes(path) if path.is_file() else None
    if not recipes:
        raise ValueError(
            f"{name!r} is not a house palette: no `{palette_selector(name)} {{ "
            f"{PALETTE_PREFIX}... }}` rule in {display_path(path)}"
        )
    missing, unknown = set(ROLES) - set(recipes), set(recipes) - set(ROLES)
    if missing or unknown:
        raise ValueError(
            f"{display_path(path)} must set every role and no other: "
            f"missing {sorted(missing)}, unknown {sorted(unknown)}"
        )
    return {role: recipes[role] for role in ROLES}


REFERENCE_RECIPES: Recipes = palette_recipes(REFERENCE_PALETTE)
REFERENCE: Palette = resolve(REFERENCE_RECIPES)


def _headmatter(talk: pathlib.Path) -> str:
    slides = talk / "slides.md"
    head = re.match(r"---\n(.*?)\n---", slides.read_text(), flags=re.DOTALL)
    if not head:
        raise ValueError(f"{display_path(slides)} has no headmatter")
    return head.group(1)


def talk_palette(talk: pathlib.Path) -> str:
    """The palette whose addon the headmatter of `talk`'s slides.md loads:
    the one `palette-<name>` in its `addons:` list."""
    addons = re.search(r"(?m)^addons:\s*\n((?:\s+-.*\n?)+)", _headmatter(talk))
    names: list[str] = re.findall(
        r"""(?m)^\s+-\s*["']?palette-([\w-]+)["']?\s*(?:#.*)?$""",
        addons.group(1) if addons else "",
    )
    if len(names) != 1:
        raise ValueError(
            f"{display_path(talk / 'slides.md')} must load one palette addon "
            f"(`addons: [palette-<name>]`), not {len(names)}"
        )
    return names[0]


def talk_color_schema(talk: pathlib.Path) -> str | None:
    """The `colorSchema` of `talk`'s headmatter, or None if it sets none."""
    found = re.search(
        r"""(?m)^colorSchema:\s*["']?(\w+)["']?\s*(?:#.*)?$""", _headmatter(talk)
    )
    return found.group(1) if found else None


def paper_schema(palette: Palette) -> str:
    """ "dark" or "light": the Slidev colorSchema that suits the palette's
    paper, so that Slidev's own controls match it. Dark paper is paper that
    white text stands out on more than black text does."""
    paper = palette["background"]
    white, black = Colour(255, 255, 255), Colour(0, 0, 0)
    return "dark" if contrast(white, paper) > contrast(black, paper) else "light"


# Each wash and the line colour that it is the face for (docs/theme.md, "The
# pairs"). A drawing's variation of a face is its wash mixed toward its line or
# toward the paper.
WASH_PAIRS = {
    "subject-wash": "subject",
    "muted-wash": "muted",
    "second-wash": "second",
    "ground-wash": "ground",
}


def lch(colour: Colour) -> tuple[float, float, float]:
    """CIE L*C*h: lightness (0-100), chroma (how much colour shows: under about
    5 reads as grey) and hue in degrees."""
    light, a, b = lab(colour.linear)
    return light, math.hypot(a, b), math.degrees(math.atan2(b, a)) % 360


class Measure(Enum):
    """What a gate measures between two colours."""

    CONTRAST = "contrast"  # WCAG contrast ratio
    DE = "dE"  # CIE76 colour difference, normal vision
    CVD = "CVD dE"  # the same, worst of deuteranopia and protanopia


@dataclass(frozen=True)
class Gate:
    """`role` measured against `against` must be at least `minimum` and at most
    `maximum` (each optional). Both are palette roles: the CSS names, checked
    against the theme when this file loads. A gate that is not `required` is a
    preference: it is reported, and it does not fail."""

    role: str
    against: str
    measure: Measure
    why: str
    minimum: float | None = None
    maximum: float | None = None
    required: bool = True

    def value(self, palette: Palette) -> float:
        first, second = palette[self.role], palette[self.against]
        if self.measure is Measure.CONTRAST:
            return contrast(first, second)
        if self.measure is Measure.DE:
            return de76(first, second)
        return cvd(first, second)

    def passes(self, palette: Palette) -> bool:
        measured = self.value(palette)
        return (self.minimum is None or measured >= self.minimum) and (
            self.maximum is None or measured <= self.maximum
        )

    @property
    def limit(self) -> str:
        """The threshold, for a report: ">= 3" or "<= 1.5"."""
        parts = [f">= {self.minimum:g}"] if self.minimum is not None else []
        parts += [f"<= {self.maximum:g}"] if self.maximum is not None else []
        return " and ".join(parts)


@dataclass(frozen=True)
class HueGate:
    """A material's colour must read as that material: a hue in `low`-`high`
    degrees with at least `min_chroma`, or (if `grey_below` is set) a near
    grey, with less chroma than that."""

    role: str
    low: float
    high: float
    min_chroma: float
    why: str
    grey_below: float | None = None

    def passes(self, palette: Palette) -> bool:
        _, chroma, hue = lch(palette[self.role])
        if self.grey_below is not None and chroma < self.grey_below:
            return True
        return self.low <= hue <= self.high and chroma >= self.min_chroma


# The gates, all measured against the surface the mark actually sits on --
# which is the PANEL for anything on a card, not the slide background. That
# distinction was a real defect once (theme archive, insight 8). The numbers
# and their reasons are in docs/theme.md and in the tasks it links.
GATES = [
    Gate(
        "ink",
        "background",
        Measure.CONTRAST,
        "headroom to degrade from; Ledger has 14.2",
        12.0,
    ),
    Gate("ink", "panel", Measure.CONTRAST, "the same text on a card", 12.0),
    Gate("accent", "panel", Measure.CONTRAST, "the 37px stat number", 4.5),
    Gate(
        "second",
        "panel",
        Measure.CONTRAST,
        "20px bold counts as large text: 3:1 plus margin",
        3.5,
    ),
    # 4.5 is WCAG AA for normal text, and 17px body IS normal text (the large-text
    # relaxation starts at 18px, or 14px bold). The theme archive's table states
    # this gate as 4.6 and gives no derivation; Ledger's muted measures 4.578 on
    # the panel, so at 4.6 the chosen theme fails its own written gate by 0.02.
    # The standard is the defensible number, so 4.5 is what is enforced here --
    # and the real finding is recorded in docs/theme.md: muted-on-panel has 1.7%
    # of margin and is the thinnest thing in the palette. Do not shrink it.
    Gate(
        "muted",
        "panel",
        Measure.CONTRAST,
        "17px body is normal text, so WCAG AA applies",
        4.5,
    ),
    Gate(
        "accent",
        "ink",
        Measure.DE,
        "emphasis must read as emphasis, not as darker ink",
        35,
    ),
    Gate("accent", "second", Measure.CVD, "worst of deuteranopia and protanopia", 25),
    Gate(
        "accent",
        "second",
        Measure.CONTRAST,
        "hue fails before lightness does",
        1.4,
        required=False,
    ),
    # The drawings' own pairs (tasks/2026-10-07-theme-colour-system, §4.8).
    Gate(
        "subject", "muted", Measure.DE, "the subject must not look like its context", 30
    ),
    Gate(
        "subject",
        "ink",
        Measure.DE,
        "the subject must not look like a scale or a leader",
        30,
    ),
    Gate(
        "second",
        "subject",
        Measure.CVD,
        "a flash and a keyword callout must show for every viewer",
        25,
    ),
    *(
        gate
        for wash, line in WASH_PAIRS.items()
        for gate in (
            Gate(
                line,
                wash,
                Measure.CONTRAST,
                "a line on its own face: the floor for a drawn mark",
                3.0,
            ),
            Gate(
                wash,
                "panel",
                Measure.CONTRAST,
                "a face, not bare paper: the faintest face that reads",
                1.12,
            ),
            Gate(
                wash,
                "background",
                Measure.CONTRAST,
                "a face near the paper, so it does not compete with the lines",
                maximum=1.5,
            ),
        )
    ),
]
HUE_GATES = [
    HueGate("water", 190, 300, 15, "water reads as water: cyan to blue-violet"),
    HueGate("ground", 20, 110, 0, "ground reads as earth, or as stone", grey_below=10),
]
_unknown_roles = (
    {role for gate in GATES for role in (gate.role, gate.against)}
    | {gate.role for gate in HUE_GATES}
    | set(WASH_PAIRS)
    | set(WASH_PAIRS.values())
) - set(ROLES)
if _unknown_roles:
    raise SystemExit(
        f"the gates name roles that are not in ROLES: {sorted(_unknown_roles)}"
    )
CONTRAST_FLOOR = 3.0  # WCAG non-text: the floor a drawn mark must hold

# --------------------------------------------------------------------------
# The drawing grammar: set 2, "Line, weighted". Chosen 2026-09-21.
# docs/illustrations.md is the prose version.
# --------------------------------------------------------------------------
# Each SVG states the size a slide shows it at: its width and height attributes,
# in CSS px. Its viewBox is its own drawing units. So one unit is
# width / viewBox width CSS px, and the tools render each file at its own size.


@dataclass(frozen=True)
class ShownSize:
    """The size a slide shows an SVG at."""

    width: float  # CSS px
    height: float  # CSS px
    css_px_per_unit: float  # of the SVG's viewBox


def plain_number(text: str | None) -> float | None:
    """`text` as a number, or None if it is missing or not a plain number."""
    return (
        float(text)
        if text and re.fullmatch(r"[0-9]+\.?[0-9]*|\.[0-9]+", text)
        else None
    )


def shown_size(source: str) -> ShownSize | None:
    """The size an SVG states on its root: width, height and viewBox. None if
    any of them is missing, zero or not a plain number."""
    head = re.search(r"<svg\b[^>]*>", source)
    attributes = dict(re.findall(r'(\w+)="([^"]*)"', head.group(0))) if head else {}
    width = plain_number(attributes.get("width"))
    height = plain_number(attributes.get("height"))
    view_box = attributes.get("viewBox", "").split()
    view_width = float(view_box[2]) if len(view_box) == 4 else None
    if not (width and height and view_width):
        return None
    return ShownSize(width, height, width / view_width)


# The ladder, in CSS px as shown. New art picks from these; it does not invent
# intermediate weights, because the hierarchy is the style and four steps is what
# makes it readable. A stroke matches a step within LADDER_TOLERANCE: the
# timekeepers (240 units shown 122 px wide) measure 2.03, 2.54, 3.05 and 4.07.
STROKE_LADDER = [2.0, 2.5, 3.0, 4.0]
LADDER_TOLERANCE = 0.05
ASPECT_TOLERANCE = 0.01  # width:height vs the viewBox's, so nothing is squashed

# Every colour a Line-weighted drawing is allowed to use, and its job
# (docs/illustrations.md, "Colour"). The values come from the reference palette.
ART_ROLES = {
    "subject": "the subject's lines: its structure, and the thing that moves",
    "subject-wash": "the subject's faces: a solid face near the paper, read as lit",
    "muted": "context: what holds or acts on the subject (the stand, the case)",
    "muted-wash": "the context's faces",
    "ink": "detail: tick marks, smoke. Usually at 0.5 stroke-opacity.",
    "water": "water, where it meets another material (the pool)",
    "ground": "ground and stone, where they meet another material",
    "ground-wash": "the ground's faces",
}
ART_INK = {REFERENCE[role]: job for role, job in ART_ROLES.items()}
DETAIL_ROLE = "ink"  # the role whose lines are at DETAIL_LINE_OPACITY
ART_FIELD = REFERENCE["panel"]  # illustrations sit on a card, not on the slide
PAPERS = frozenset({REFERENCE["background"], REFERENCE["panel"]})


def wash_variation(colour: Colour, palette: Palette = REFERENCE) -> str | None:
    """The wash that `colour` is a variation of, or None: a wash mixed toward
    its line or toward a paper (a lit or a shaded face; docs/illustrations.md,
    "Washes"). Within one 8-bit step, for rounding."""
    for wash, line in WASH_PAIRS.items():
        base = palette[wash]
        for target in (palette[line], palette["background"], palette["panel"]):
            if target == base:
                continue
            # the share of `target` that gives the channel which moves most
            widest = max(
                range(3),
                key=lambda index: abs(target.channels[index] - base.channels[index]),
            )
            share = (colour.channels[widest] - base.channels[widest]) / (
                target.channels[widest] - base.channels[widest]
            )
            if 0 <= share <= 1 and abs(target.blend(base, share).distance(colour)) <= 1:
                return wash
    return None


# Opacities, from docs/illustrations.md. A face is its wash, solid. A fill in a
# line colour is a substance or a small dark part, at 0.60-1.0. A line is
# solid, except the detail colour's: it is at half opacity.
SUBJECT_MIN_OPACITY = 0.60
DETAIL_LINE_OPACITY = 0.5

# --------------------------------------------------------------------------
# The venue. Never visited; these are the rows you cannot rule out.
# Edit this table the day the venue is known -- it is the whole cost of
# re-deciding anything in docs/legibility.md.
# --------------------------------------------------------------------------
DECK_WIDTH = 980  # Slidev's canvas width in CSS px (the 980x552 default)


@dataclass(frozen=True)
class Venue:
    label: str  # for reports, and for --venue on the command line
    screen_width_m: float
    back_row_m: float

    @property
    def arcmin_per_csspx(self) -> float:
        return (
            math.degrees(
                math.atan(
                    self.screen_width_m * 1000 / DECK_WIDTH / (self.back_row_m * 1000)
                )
            )
            * 60
        )

    @property
    def resolvable_csspx(self) -> float:
        """Thinnest mark an eye resolves here, in CSS px. 1 arcmin limit."""
        return 1.0 / self.arcmin_per_csspx

    def blur_sigma(self, device_scale: float) -> float:
        """The Gaussian that models the eye here, in device px: FWHM 1 arcmin."""
        return (1.0 / self.arcmin_per_csspx) / 2.355 * device_scale


LAPTOP = Venue("laptop", 0.31, 0.55)
TV_55_AT_5M = Venue("TV 55in @5m", 1.22, 5.00)
TV_55_AT_7M = Venue("TV 55in @7m", 1.22, 7.00)
PROJECTOR_2M_AT_6M = Venue("proj 2m @6m", 2.00, 6.00)
VENUES = [LAPTOP, TV_55_AT_5M, TV_55_AT_7M, PROJECTOR_2M_AT_6M]
DESIGN_VENUE = TV_55_AT_7M  # the hostile case, and the one to design for
STROKE_FLOOR_CSSPX = DESIGN_VENUE.resolvable_csspx  # 1.64 CSS px


def venue_named(label: str) -> Venue:
    """The venue with this label, for the command line."""
    for venue in VENUES:
        if venue.label == label:
            return venue
    raise ValueError(
        f"no venue {label!r}; the venues are {', '.join(venue.label for venue in VENUES)}"
    )


# --------------------------------------------------------------------------
# Colour maths. WCAG contrast, plus ambient flare and CVD.
# --------------------------------------------------------------------------
def bisect(
    passes: Callable[[float], bool], passing: float, failing: float, steps: int
) -> float:
    """The edge between `passing`, where `passes` holds, and `failing`, where
    it does not, after `steps` halvings. Returns the last value that passed."""
    for _ in range(steps):
        middle = (passing + failing) / 2
        if passes(middle):
            passing = middle
        else:
            failing = middle
    return passing


def contrast(first: Colour, second: Colour, flare: float = 0.0) -> float:
    """WCAG contrast, with optional ADDITIVE ambient flare.

    Room light lands on the screen and adds: lin' = lin + F. It is deliberately
    not clipped at white -- reflected ambient really does push the screen's white
    above its nominal white, and the eye adapts to that new maximum. Clipping
    invents a penalty for every light design. Because contrast is a ratio, flare
    caps what ANY content can reach: 1.05/(F+0.05), so F=0.29 makes 3:1
    unreachable by any design whatsoever.
    """
    first_luminance = first.luminance + flare
    second_luminance = second.luminance + flare
    return (max(first_luminance, second_luminance) + 0.05) / (
        min(first_luminance, second_luminance) + 0.05
    )


def flare_ceiling(flare: float) -> float:
    """The best contrast any design can reach at this flare level."""
    return 1.05 / (flare + 0.05)


def max_flare(first: Colour, second: Colour, floor: float = CONTRAST_FLOOR) -> float:
    """Fmax: the ambient flare at which this pair falls through the floor.

    A property of the colours, in units of how much room light they can take.
    0.30 is the physical ceiling. This is the number to shop venues with.
    """
    if contrast(first, second) < floor:
        return 0.0
    return bisect(
        lambda flare: contrast(first, second, flare) >= floor,
        passing=0.0,
        failing=0.30,
        steps=40,
    )


# ---- colour-vision deficiency (Vienot, Brettel & Mollon 1999) -------------
class Deficiency(Enum):
    NORMAL = "normal"
    DEUTERANOPIA = "deuteranopia"
    PROTANOPIA = "protanopia"


def simulate(colour: Colour, deficiency: Deficiency) -> list[float]:
    """The colour as a viewer with `deficiency` sees it, in linear RGB."""
    red, green, blue = colour.linear
    long_cone = 17.8824 * red + 43.5161 * green + 4.11935 * blue
    medium_cone = 3.45565 * red + 27.1554 * green + 3.86714 * blue
    short_cone = 0.0299566 * red + 0.184309 * green + 1.46709 * blue
    if deficiency is Deficiency.DEUTERANOPIA:
        medium_cone = 0.494207 * long_cone + 1.24827 * short_cone
    elif deficiency is Deficiency.PROTANOPIA:
        long_cone = 2.02344 * medium_cone - 2.52581 * short_cone
    out = (
        0.080944 * long_cone - 0.130504 * medium_cone + 0.116721 * short_cone,
        -0.0102485 * long_cone + 0.0540194 * medium_cone - 0.113615 * short_cone,
        -0.000365294 * long_cone - 0.00412163 * medium_cone + 0.693513 * short_cone,
    )
    return [max(0.0, min(1.0, channel)) for channel in out]


def _lab_f(ratio: float) -> float:
    return ratio ** (1 / 3) if ratio > 216 / 24389 else (841 / 108) * ratio + 4 / 29


def lab(rgb: Iterable[float]) -> tuple[float, float, float]:
    """Linear RGB in CIE L*a*b*, D65 white."""
    red, green, blue = rgb
    x, y, z = (
        0.4124 * red + 0.3576 * green + 0.1805 * blue,
        0.2126 * red + 0.7152 * green + 0.0722 * blue,
        0.0193 * red + 0.1192 * green + 0.9505 * blue,
    )
    fx, fy, fz = _lab_f(x / 0.95047), _lab_f(y / 1.0), _lab_f(z / 1.08883)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def de76(
    first: Colour, second: Colour, deficiency: Deficiency = Deficiency.NORMAL
) -> float:
    """CIE76 colour difference, as a viewer with `deficiency` sees the pair."""
    first_lab = lab(simulate(first, deficiency))
    second_lab = lab(simulate(second, deficiency))
    squares = sum(
        (first_part - second_part) ** 2
        for first_part, second_part in zip(first_lab, second_lab, strict=True)
    )
    return float(squares**0.5)


def cvd(first: Colour, second: Colour) -> float:
    """Worst-case separation of two colours for a red-green deficient viewer.

    Rough reading: dE > 20 unmistakable, 10-20 clear, < 10 risky at a glance.
    Do not eyeball this -- hand estimates in the theme archive were wrong in
    both directions, calling safe pairs dangerous and the two worst pairs safe.
    """
    return min(
        de76(first, second, deficiency)
        for deficiency in (Deficiency.DEUTERANOPIA, Deficiency.PROTANOPIA)
    )


def min_opacity(
    foreground: Colour, background: Colour = ART_FIELD, floor: float = CONTRAST_FLOOR
) -> float | None:
    """The least opacity at which `foreground` on `background` still holds the
    contrast floor.

    Anything fainter is faint: visible to the front three rows and gone at the
    back. That is a legitimate thing to draw -- but the drawing has to read
    without it. See docs/legibility.md.
    """
    if contrast(foreground, background) < floor:
        return None  # opaque is already below the floor
    return bisect(
        lambda alpha: (
            contrast(foreground.blend(background, alpha), background) >= floor
        ),
        passing=1.0,
        failing=0.0,
        steps=30,
    )


# --------------------------------------------------------------------------
# Files.
# --------------------------------------------------------------------------
def art_files(paths: Iterable[str]) -> list[pathlib.Path]:
    """The SVGs to check: each given file, and every SVG in each given
    directory. There is no default of "every talk": a retired talk is not
    checked again (AGENTS.md, "Given talks, retired talks and versions")."""
    out: list[pathlib.Path] = []
    for given in paths:
        path = pathlib.Path(given)
        out += sorted(path.rglob("*.svg")) if path.is_dir() else [path]
    return out


def namespace_ids(source: str, tag: str) -> str:
    """An SVG with every id, and every url(#id) that refers to one, suffixed
    with `-tag`, so several copies of it on one page do not share ids. (If
    they did, every copy's clip paths and patterns would resolve to the first
    copy's, and all but one would look frozen.)"""
    for name in set(re.findall(r'id="([^"]+)"', source)):
        source = source.replace(f'id="{name}"', f'id="{name}-{tag}"').replace(
            f"url(#{name})", f"url(#{name}-{tag})"
        )
    return source


# A slide's `class:` goes on its layout's root, which has SLIDE_SELECTOR. So
# `.slidev-layout.dark` is the slides with `class: dark`, and nothing else.
SLIDE_CLASS_SELECTOR = re.compile(re.escape(SLIDE_SELECTOR) + r"(\.[\w-]+)+")


class Fault(Enum):
    """Why a talk may not make a palette declaration."""

    NOT_A_SLIDE_CLASS = "outside a `.slidev-layout.<class>` rule"
    UNKNOWN_ROLE = "a role that no palette sets"
    NOT_A_COLOUR = "a value that is not a #rrggbb colour"


@dataclass(frozen=True)
class Declaration:
    """One PALETTE_PREFIX declaration in a talk's file."""

    path: pathlib.Path
    line: int
    role: str
    value: str


@dataclass(frozen=True)
class SlideOverride:
    """A rule that sets roles of the palette for the slides with a class."""

    selector: str
    declarations: tuple[Declaration, ...]

    def palette(self, base: Recipes) -> Palette:
        """`base` (the talk's palette), with this rule's roles replaced: what
        those slides show. A recipe of `base` that uses a replaced role
        follows it, as in CSS."""
        return resolve(
            base
            | {declaration.role: declaration.value for declaration in self.declarations}
        )


@dataclass(frozen=True)
class PaletteDeclarations:
    """What `talk_palette_declarations` finds: the rules that may set the
    palette, and each declaration that may not, with its fault."""

    overrides: list[SlideOverride]
    faults: list[tuple[Declaration, Fault]]


def _rule_selector(before: str) -> str:
    """The selector of a CSS rule, from the text `before` its `{`: the last
    line, and each line above it that ends in a comma."""
    lines = before.rstrip().splitlines() or [""]
    selector = [lines.pop().strip()]
    while lines and lines[-1].rstrip().endswith(","):
        selector.insert(0, lines.pop().strip())
    return " ".join(selector)


# What a talk's own files may hold that the palette check does not read: the
# docs and tasks talk about the palette, and the rest is not source.
TALK_SOURCE_SUFFIXES = frozenset({".md", ".vue", ".css", ".ts", ".mts", ".js", ".html"})
TALK_SKIPPED_DIRECTORIES = frozenset(
    {"node_modules", "dist", "docs", "tasks", "public", ".venv"}
)
TALK_SKIPPED_FILES = frozenset({"README.md", "AGENTS.md"})


def talk_source_files(talk: pathlib.Path) -> list[pathlib.Path]:
    """Every file of the talk that can set a style: all source files, except
    the docs, the tasks, `public/` and the dependencies. This is a denylist, so
    a file in a place that nobody thought of is still read."""
    return sorted(
        file
        for file in talk.rglob("*")
        if file.is_file()
        and file.suffix in TALK_SOURCE_SUFFIXES
        and file.name not in TALK_SKIPPED_FILES
        and not any(
            part in TALK_SKIPPED_DIRECTORIES or part.startswith(".")
            for part in file.relative_to(talk).parts[:-1]
        )
    )


def talk_palette_declarations(
    talks: Iterable[pathlib.Path], base: Recipes
) -> PaletteDeclarations:
    """Every PALETTE_PREFIX declaration in the source files of `talks` (talk
    directories; see `talk_source_files`). A palette addon sets the palette. A
    talk may only change roles of `base` for the slides with a class, in a
    SLIDE_CLASS_SELECTOR rule, with #rrggbb values."""
    files = [file for talk in talks for file in talk_source_files(talk)]
    declaration_pattern = re.compile(
        re.escape(PALETTE_PREFIX) + r"([\w-]+)\s*:\s*([^;}\"'\n]*)"
    )
    overrides = []
    faults = []
    for file in files:
        # blank each comment, but keep its newlines, so line numbers hold
        source = re.sub(
            r"/\*.*?\*/",
            lambda comment: re.sub(r"[^\n]", " ", comment.group()),
            file.read_text(),
            flags=re.DOTALL,
        )
        slide_rules = [
            rule
            for rule in re.finditer(r"([^{}]*)\{([^{}]*)\}", source)
            if all(
                SLIDE_CLASS_SELECTOR.fullmatch(part.strip())
                for part in _rule_selector(rule.group(1)).split(",")
            )
        ]
        found: dict[re.Match[str], list[Declaration]] = {
            rule: [] for rule in slide_rules
        }
        for match in declaration_pattern.finditer(source):
            declaration = Declaration(
                display_path(file),
                source.count("\n", 0, match.start()) + 1,
                match.group(1),
                match.group(2).strip(),
            )
            rule = next(
                (
                    rule
                    for rule in slide_rules
                    if rule.start(2) <= match.start() < rule.end(2)
                ),
                None,
            )
            if rule is None:
                faults.append((declaration, Fault.NOT_A_SLIDE_CLASS))
            elif declaration.role not in base:
                faults.append((declaration, Fault.UNKNOWN_ROLE))
            elif not re.fullmatch(r"#[0-9A-Fa-f]{6}", declaration.value):
                faults.append((declaration, Fault.NOT_A_COLOUR))
            else:
                found[rule].append(declaration)
        overrides += [
            SlideOverride(_rule_selector(rule.group(1)), tuple(declarations))
            for rule, declarations in found.items()
            if declarations
        ]
    return PaletteDeclarations(overrides, faults)


def colours_in(source: str) -> set[Colour]:
    return {Colour.from_hex(text) for text in re.findall(r"#[0-9A-Fa-f]{6}", source)}


def strokes_in(source: str) -> list[float]:
    return [float(width) for width in re.findall(r'stroke-width="([0-9.]+)"', source)]


if __name__ == "__main__":
    print(
        f"{REFERENCE_PALETTE}, the reference palette, and the floor at {DESIGN_VENUE.label}\n"
    )
    for role, colour in REFERENCE.items():
        print(f"  {PALETTE_PREFIX}{role:<20} {colour}   L={colour.luminance:.4f}")
    print(
        f"\n  stroke ladder {STROKE_LADDER} CSS px as shown (within {LADDER_TOLERANCE:.0%})"
    )
    print(f"  stroke floor  {STROKE_FLOOR_CSSPX:.2f} CSS px\n")
    for venue in VENUES:
        design = "   <- design for this one" if venue is DESIGN_VENUE else ""
        print(
            f"  {venue.label:<13} {venue.arcmin_per_csspx:.2f} arcmin/CSSpx, "
            f"thinnest resolvable mark {venue.resolvable_csspx:.2f} CSS px{design}"
        )
