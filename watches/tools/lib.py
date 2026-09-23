"""House constants and the colour/legibility maths every other tool here uses.

Stdlib only, deliberately: the checks that gate new content must run on a laptop
with nothing installed. The two tools that read rendered pixels (`barroom.py`,
`contact.py`) need more, and say so.

WHAT LIVES HERE AND WHAT DOES NOT. This file holds the *current* framework: the
Ledger palette, the Line-weighted drawing grammar, the venue model and the
thresholds new work has to clear. It does not hold the alternatives, the losing
candidates or the reasoning that picked these — those are in `tasks/`, and you
should not need them to make a new slide. See `docs/README.md`.

Everything here is a number someone can change. When you change one, change it
here and nowhere else: `palette.py` and `artcheck.py` read these constants rather
than repeating them, so a threshold cannot drift between tools.
"""
import re, math, pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]

# --------------------------------------------------------------------------
# The theme: Ledger. Chosen 2026-09-19. docs/theme.md is the prose version.
# --------------------------------------------------------------------------
LEDGER = {
    "background": "#FAF7F0",   # the slide field: warm cream
    "ink":        "#2A2520",   # body text, headings
    "muted":      "#736A60",   # secondary text, captions, units
    "accent":     "#1F5FA8",   # the one emphasised thing per slide
    "second":     "#9A6238",   # the warm counterpart: warnings, "the catch"
    "panel":      "#F2EEE4",   # card fill, sitting on the background
    "border":     "#E0D9CA",   # card edge
}

# Contrast gates, all measured against the surface the mark actually sits on --
# which is the PANEL for anything on a card, not the slide background. That
# distinction was a real defect once (theme archive, insight 8).
GATES = [
    # (role, against, minimum, why)
    ("ink",    "background", 12.0, "headroom to degrade from; Ledger has 14.2"),
    ("ink",    "panel",      12.0, "the same text on a card"),
    ("accent", "panel",       4.5, "the 37px stat number"),
    ("second", "panel",       3.5, "20px bold counts as large text: 3:1 plus margin"),
    # 4.5 is WCAG AA for normal text, and 17px body IS normal text (the large-text
    # relaxation starts at 18px, or 14px bold). The theme archive's table states
    # this gate as 4.6 and gives no derivation; Ledger's muted measures 4.578 on
    # the panel, so at 4.6 the chosen theme fails its own written gate by 0.02.
    # The standard is the defensible number, so 4.5 is what is enforced here --
    # and the real finding is recorded in docs/theme.md: muted-on-panel has 1.7%
    # of margin and is the thinnest thing in the palette. Do not shrink it.
    ("muted",  "panel",       4.5, "17px body is normal text, so WCAG AA applies"),
]
ACCENT_VS_INK_DE = 35      # emphasis must read as emphasis, not as darker ink
CVD_DE = 25                # accent vs second, under deuteranopia AND protanopia
CONTRAST_FLOOR = 3.0       # WCAG non-text: the floor a drawn mark must hold

# --------------------------------------------------------------------------
# The drawing grammar: set 2, "Line, weighted". Chosen 2026-09-21.
# docs/illustrations.md is the prose version.
# --------------------------------------------------------------------------
ART_BOX = (240, 190)       # every illustration is drawn in this viewBox
CARD_ART = (122, 97)       # ... and rendered at this size by TimekeeperCard.vue
UNIT_TO_CSSPX = CARD_ART[0] / ART_BOX[0]          # 0.5083

# The ladder. New art picks from these; it does not invent intermediate weights,
# because the hierarchy is the style and four steps is what makes it readable.
STROKE_LADDER = [4.0, 5.0, 6.0, 8.0]   # units -> 2.03, 2.54, 3.05, 4.07 CSS px

# Every colour a Line-weighted drawing is allowed to use, and its job.
ART_INK = {
    "#143C6B": "primary line work: the subject's own structure. Also as a 0.07-0.08 fill.",
    "#736A60": "secondary structure: the stand, the frame, the thing holding it up.",
    "#2A2520": "tertiary detail: tick marks, smoke. Usually at 0.5 stroke-opacity.",
    "#D3DCE3": "knockout: a pale face that has to read as lit, not as empty paper.",
}
ART_FIELD = LEDGER["panel"]    # illustrations sit on a card, not on the slide

# --------------------------------------------------------------------------
# The venue. Never visited; these are the rows you cannot rule out.
# Edit this table the day the venue is known -- it is the whole cost of
# re-deciding anything in docs/legibility.md.
# --------------------------------------------------------------------------
DECK_W = 980               # Slidev's canvas width in CSS px (the 980x552 default)
VENUES = [
    # label, screen width (m), back row (m)
    ("laptop",      0.31, 0.55),
    ("TV 55in @5m", 1.22, 5.00),
    ("TV 55in @7m", 1.22, 7.00),   # <- the hostile case, and the one to design for
    ("proj 2m @6m", 2.00, 6.00),
]
DESIGN_VENUE = "TV 55in @7m"


def arcmin_per_csspx(screen_w_m, dist_m):
    return math.degrees(math.atan(screen_w_m * 1000 / DECK_W / (dist_m * 1000))) * 60


def resolvable_csspx(venue_label=DESIGN_VENUE):
    """Thinnest mark an eye resolves at that venue, in CSS px. 1 arcmin limit."""
    w, d = next((w, d) for lbl, w, d in VENUES if lbl == venue_label)
    return 1.0 / arcmin_per_csspx(w, d)


STROKE_FLOOR_CSSPX = 1.64  # = resolvable_csspx("TV 55in @7m"), pinned for reference
STROKE_FLOOR_UNITS = STROKE_FLOOR_CSSPX / UNIT_TO_CSSPX   # 3.23 units


# --------------------------------------------------------------------------
# Colour maths. WCAG luminance/contrast, plus ambient flare and CVD.
# --------------------------------------------------------------------------
def srgb_to_lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    return 0.2126 * srgb_to_lin(r) + 0.7152 * srgb_to_lin(g) + 0.0722 * srgb_to_lin(b)


def contrast(a, b, flare=0.0):
    """WCAG contrast, with optional ADDITIVE ambient flare.

    Room light lands on the screen and adds: lin' = lin + F. It is deliberately
    not clipped at white -- reflected ambient really does push the screen's white
    above its nominal white, and the eye adapts to that new maximum. Clipping
    invents a penalty for every light design. Because contrast is a ratio, flare
    caps what ANY content can reach: 1.05/(F+0.05), so F=0.29 makes 3:1
    unreachable by any design whatsoever.
    """
    la, lb = luminance(a) + flare, luminance(b) + flare
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def flare_ceiling(flare):
    """The best contrast any design can reach at this flare level."""
    return 1.05 / (flare + 0.05)


def max_flare(a, b, floor=CONTRAST_FLOOR):
    """Fmax: the ambient flare at which this pair falls through the floor.

    A property of the colours, in units of how much room light they can take.
    0.30 is the physical ceiling. This is the number to shop venues with.
    """
    if contrast(a, b) < floor:
        return 0.0
    lo, hi = 0.0, 0.30
    for _ in range(40):
        m = (lo + hi) / 2
        lo, hi = (m, hi) if contrast(a, b, m) >= floor else (lo, m)
    return lo


def lightness_ratio(a, b):
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


# ---- colour-vision deficiency (Vienot, Brettel & Mollon 1999) -------------
def _lin(h):
    h = h.lstrip("#")
    return [srgb_to_lin(int(h[i:i + 2], 16)) for i in (0, 2, 4)]


def simulate(h, kind):
    r, g, b = _lin(h)
    l = 17.8824 * r + 43.5161 * g + 4.11935 * b
    m = 3.45565 * r + 27.1554 * g + 3.86714 * b
    s = 0.0299566 * r + 0.184309 * g + 1.46709 * b
    if kind == "deuter":
        m = 0.494207 * l + 1.24827 * s
    elif kind == "protan":
        l = 2.02344 * m - 2.52581 * s
    out = (0.080944 * l - 0.130504 * m + 0.116721 * s,
           -0.0102485 * l + 0.0540194 * m - 0.113615 * s,
           -0.000365294 * l - 0.00412163 * m + 0.693513 * s)
    return [max(0.0, min(1.0, c)) for c in out]


def _lab(rgb):
    r, g, b = rgb
    x, y, z = (0.4124 * r + 0.3576 * g + 0.1805 * b,
               0.2126 * r + 0.7152 * g + 0.0722 * b,
               0.0193 * r + 0.1192 * g + 0.9505 * b)
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (841 / 108) * t + 4 / 29
    fx, fy, fz = f(x / 0.95047), f(y / 1.0), f(z / 1.08883)
    return (116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz))


def de76(c1, c2, kind="normal"):
    a, b = _lab(simulate(c1, kind)), _lab(simulate(c2, kind))
    return sum((x - y) ** 2 for x, y in zip(a, b)) ** 0.5


def cvd(a, b):
    """Worst-case separation of two colours for a red-green deficient viewer.

    Rough reading: dE > 20 unmistakable, 10-20 clear, < 10 risky at a glance.
    Do not eyeball this -- hand estimates in the theme archive were wrong in
    both directions, calling safe pairs dangerous and the two worst pairs safe.
    """
    return min(de76(a, b, k) for k in ("deuter", "protan"))


# --------------------------------------------------------------------------
def blend(fg, bg, alpha):
    """What a colour drawn at `alpha` over `bg` actually becomes.

    SVG composites a normal-blend fill in the document colour space, which is
    non-linear sRGB, so this interpolates the 8-bit channels directly. That is
    what the browser does and therefore what the eye gets.
    """
    f, b = fg.lstrip("#"), bg.lstrip("#")
    return "#" + "".join(
        f"{round(int(f[i:i+2], 16) * alpha + int(b[i:i+2], 16) * (1 - alpha)):02X}"
        for i in (0, 2, 4))


def min_opacity(fg, bg=None, floor=CONTRAST_FLOOR):
    """The least opacity at which `fg` on `bg` still holds the contrast floor.

    Anything fainter is a wash: visible to the front three rows and gone at the
    back. That is a legitimate thing to draw -- but the drawing has to read
    without it. See docs/legibility.md.
    """
    bg = bg or ART_FIELD
    if contrast(fg, bg) < floor:
        return None                       # opaque is already below the floor
    lo, hi = 0.0, 1.0
    for _ in range(30):
        m = (lo + hi) / 2
        lo, hi = (lo, m) if contrast(blend(fg, bg, m), bg) >= floor else (m, hi)
    return hi


def art_files(paths=None):
    """The SVGs to check: given paths, or everything the deck ships."""
    if paths:
        out = []
        for p in paths:
            p = pathlib.Path(p)
            out += sorted(p.rglob("*.svg")) if p.is_dir() else [p]
        return out
    return sorted((ROOT / "public/timekeepers").rglob("*.svg"))


THEME_CSS = ROOT / "styles/index.css"   # where the deck sets LEDGER, as --tk-* variables


def css_palette(path=THEME_CSS):
    """The --tk-* variables that the `.tk-slide` rule in `path` sets, as
    {role: value}, with values upper-cased. None if there is no such rule."""
    src = re.sub(r"/\*.*?\*/", "", path.read_text(), flags=re.S)
    block = re.search(r"(?m)^\s*\.tk-slide\s*\{([^}]*)\}", src)
    if not block:
        return None
    return {k: v.strip().upper()
            for k, v in re.findall(r"--tk-([\w-]+)\s*:\s*([^;]+);", block.group(1))}


def stray_palette_declarations():
    """Every place outside THEME_CSS that declares a --tk-* variable, as
    (path, line number, text). The deck sets the palette in one place only."""
    files = sorted(ROOT.glob("slides*.md")) + sorted(ROOT.glob("pages/*.md")) \
        + sorted((ROOT / "components").glob("*.vue")) + sorted((ROOT / "styles").glob("*.css"))
    out = []
    for f in files:
        if f == THEME_CSS:
            continue
        for n, line in enumerate(f.read_text().splitlines(), 1):
            if re.search(r"--tk-[\w-]+\s*:", line):
                out.append((f.relative_to(ROOT), n, line.strip()))
    return out


def colours_in(src):
    return {c.upper() for c in re.findall(r"#[0-9A-Fa-f]{6}", src)}


def strokes_in(src):
    return [float(w) for w in re.findall(r'stroke-width="([0-9.]+)"', src)]


if __name__ == "__main__":
    print(f"Ledger, and the floor at {DESIGN_VENUE}\n")
    for k, v in LEDGER.items():
        print(f"  --tk-{k:<11} {v}   L={luminance(v):.4f}")
    print(f"\n  art box {ART_BOX[0]}x{ART_BOX[1]} units -> {CARD_ART[0]}x{CARD_ART[1]} CSS px"
          f"  ({UNIT_TO_CSSPX:.4f} px/unit)")
    print(f"  stroke ladder {STROKE_LADDER} units"
          f" = {[round(w * UNIT_TO_CSSPX, 2) for w in STROKE_LADDER]} CSS px")
    print(f"  stroke floor  {STROKE_FLOOR_CSSPX} CSS px = {STROKE_FLOOR_UNITS:.2f} units\n")
    for lbl, w, d in VENUES:
        am = arcmin_per_csspx(w, d)
        print(f"  {lbl:<13} {am:.2f} arcmin/CSSpx, thinnest resolvable mark "
              f"{1/am:.2f} CSS px{'   <- design for this one' if lbl == DESIGN_VENUE else ''}")
