# Cleaning up `stem/tools/`

The request (2026-09-25): apply the rules in `~/.config/agents/AGENTS.md`
("Code design" and "Python") to the house tools. They are shared by every talk.

The tools must print exactly what they print now. The check is each tool's
output, before and after, on every talk's art.

## What is there

| File               | Lines | Needs            | mypy `--strict` |
| ------------------ | ----: | ---------------- | --------------- |
| `lib.py`           |   318 | stdlib           | 42 errors       |
| `barroom.py`       |   258 | playwright/numpy | not run         |
| `artcheck.py`      |   193 | stdlib           | not run         |
| `motion.py`        |   171 | playwright/numpy | not run         |
| `palette.py`       |   147 | stdlib           | not run         |
| `offline_check.py` |   114 | playwright       | not run         |
| `contact.py`       |   107 | playwright       | not run         |

Nothing checks the tools: no ruff, no mypy, no pyright.

## Findings, by rule

**Names.** One-letter and short names are everywhere: `w, h, d, c, r, g, b,
la, lb, lo, hi, m, f, l, s, k, p, a` (for the parsed arguments), `P` (for the
palette), `pg`, `vb`, `am` and `lbl`. There are lambdas assigned to names
(`num`, `f`). `worst` in `palette.py` is a list of passes.

**Strings that refer to things.**

- A venue is a tuple, found by its label: `resolvable_csspx("TV 55in @7m")`,
  `DESIGN_VENUE = "TV 55in @7m"`, and `v == lib.DESIGN_VENUE` in `barroom.py`.
- A colour-vision deficiency is a string: `simulate(hex, "deuter")`.
- The report rows in `barroom.py` and `motion.py` are dicts keyed by label
  strings (`worst`, `area`).
- The palette roles (`"ink"`, `"panel"`, …) are strings in `GATES` and in
  `palette.py`. These are the CSS variable names, so they are external data.
  See choice 3.

**A fact or a computation in more than one place.**

- `lightness_ratio(a, b)` is the same formula as `contrast(a, b)`.
- Three bisections: `lib.max_flare`, `lib.min_opacity` and `barroom.fmax`.
- The venue's blur sigma, `(1 / arcmin_per_csspx) / 2.355 * DSF`, is in
  `barroom.py` twice and in `motion.py` once.
- `STROKE_FLOOR_CSSPX = 1.64` is "pinned for reference", but `artcheck.py`
  enforces it. It is `resolvable_csspx(DESIGN_VENUE)`, rounded.
- The id namespacing for several copies of one SVG on a page is in
  `barroom.render()` and in `contact.instance()`.
- A hex colour is parsed in `luminance`, `_lin` and `blend`, separately.

**Output that another program reads.** `watches/art/validate_skeleton_watch.py`
reads the text tables of `barroom.py` and `motion.py` with regular expressions.
A change to either table's layout breaks it.

**Types and checks.** There are no type signatures. `shown_size()` returns a
tuple in which any item can be `None`. `css_palette()` returns a dict or `None`.

## The proposed data model

```python
# lib.py
@dataclass(frozen=True)
class Colour:            # a value: equal to any other with the same channels
    red: int; green: int; blue: int
    @classmethod
    def from_hex(cls, text: str) -> Colour: ...
    hex, linear, luminance: properties
    def blend(self, background: Colour, alpha: float) -> Colour: ...

class Deficiency(Enum):  # NORMAL, DEUTERANOPIA, PROTANOPIA

@dataclass(frozen=True)
class Venue:             # a value
    label: str           # for reports and for --venue on the command line
    screen_width_m: float
    back_row_m: float
    arcmin_per_csspx, resolvable_csspx: properties
    def blur_sigma(self, device_scale: float) -> float: ...

LAPTOP, TV_55_AT_5M, TV_55_AT_7M, PROJECTOR_2M_AT_6M = Venue(...), ...
VENUES = [LAPTOP, TV_55_AT_5M, TV_55_AT_7M, PROJECTOR_2M_AT_6M]
DESIGN_VENUE = TV_55_AT_7M
STROKE_FLOOR_CSSPX = DESIGN_VENUE.resolvable_csspx   # computed, not pinned

@dataclass(frozen=True)
class ShownSize:         # replaces the (w, h, scale) tuple with Nones
    width: float; height: float; css_px_per_unit: float
def shown_size(src: str) -> ShownSize | None: ...

@dataclass(frozen=True)
class Gate:
    role: str; against: str; minimum: float; why: str   # roles: see choice 3

def bisect(passes: Callable[[float], bool], low: float, high: float,
           steps: int) -> float: ...   # the one bisection
def namespace_ids(src: str, tag: str) -> str: ...  # the one id namespacing

# barroom.py and motion.py
@dataclass(frozen=True)
class VenueScore: hold: float; p90: float; fmax: float
@dataclass(frozen=True)
class DrawingScore:      # one row of barroom's table
    path: Path; ink_percent: float; venues: dict[Venue, VenueScore]
def score(files: list[Path]) -> list[DrawingScore]: ...   # barroom
@dataclass(frozen=True)
class MotionScore: path: Path; peak: float; p99: float; bands: dict[float, float]
def score_motion(files, separation, venue, flare) -> list[MotionScore]: ...
```

Both tools print their tables from these objects, and a `--json` option
prints the same objects as JSON. The watch validator then reads JSON, not
text columns.

## Choices to make

### 1. Which Python (decided: 3.14 everywhere)

The stdlib tools (`lib.py`, `artcheck.py`, `palette.py`) ran on macOS's own
`/usr/bin/python3`, which is 3.9.6 (tested), and their docstrings promised that
they ran "with nothing installed". Type signatures in 3.9 need
`from __future__ import annotations`. 3.9 also has no `X | Y` outside
annotations, no `@dataclass(slots=True)`, no `match` and no `type` statements.

- **A. Keep 3.9 for the stdlib tools.** The venv tools could use 3.14 freely.
- **B. Require the venv's Python, 3.14.7, everywhere (chosen).** No code
  needed a change: every tool already ran on 3.14. The cost was text: 36 run
  commands in the docs became `.venv/bin/python3 tools/...`, two docstrings
  lost "runs anywhere", `requirements.txt` says `python3.14 -m venv`, and
  `stem/.python-version` pins 3.14. A new `stem/pyproject.toml` sets 3.14 for
  ruff, mypy and pyright.

Why B: nothing depended on 3.9. There was no git hook (`.git/hooks` held only
samples), `package.json` calls no Python, four of the seven tools and the
watch validator already needed the venv, and presenting a deck needs no
Python. B gives one version for all code, so every rule in AGENTS.md applies
to every file as written. The three tools still use no packages.

### 2. How the watch validator reads `barroom.py` and `motion.py`

- **A. `--json` (recommended).** The validator runs the tool as now, and
  parses JSON. There is no import across directories.
- **B. Import `score()` directly.** `stem/tools/` is not a package, so
  `watches/art/` would need a `sys.path` change, which the art cleanup just
  removed. Both tools also launch Chromium, so a subprocess is no cost.

### 3. Palette roles

The roles are the CSS variable names, read from `ledger.css`. They are keys of
external data, like the fields of a JSON file, not names of objects in this
code.

- **A. Keep `Palette` as `dict[str, Colour]`, keyed by role (recommended).**
  Gates name roles as strings, and `lib.py` checks at import that every role
  a gate names is in the CSS, so a misspelt role fails at once.
- **B. A frozen `Palette` dataclass with a field for each role.** Misspelt
  roles are caught by the type checkers. But `Gate` would then need an
  accessor for each role (a `lambda palette: palette.ink`), and a new CSS role
  would need a code change before any tool could see it.

### 4. How much to change at once

The findings split into two stages:

- **Stage 1: mechanical.** Names, type signatures, ruff, mypy and pyright, and
  a `tools/validate_tools.py` that runs them. The output does not change. This
  needs no new classes.
- **Stage 2: the data model** above, the removed copies, and `--json`.

I recommend both stages, each committed separately, with the output compared
after each.

## Verification

Before any change, save the output of:

- `palette.py`, and `palette.py "#C0451C" accent`;
- `artcheck.py`, over every talk's art;
- `barroom.py` and `motion.py`, over every talk's art;
- `motion.py` with `--sep 1` on the cover watch, as the validator runs it;
- `offline_check.py` on a fresh build of `watches/`;
- `contact.py` (the PNG).

After each stage, the text output must be byte-identical, and the PNG
pixel-identical. The one known exception: `resolvable_csspx(DESIGN_VENUE)` is
1.6357 (computed), and the pinned floor is 1.64. If the floor is computed, a
stroke from 1.636 to 1.64 CSS px would pass where it fails today, and the
printed floor needs a format (`:.2f`) to still read "1.64". Such a stroke
fails the ladder anyway: its lowest step is 2.0 within 5%, so 1.9 CSS px. So
no verdict can change, and the before-and-after diff will confirm it.

## Outcome (2026-09-25)

Choices: 1 B (Python 3.14 everywhere), 2 A (`--json`), 3 A (roles stay CSS
names, checked when `lib.py` loads), 4 (two stages). Each step was committed
separately:

1. **Python 3.14** (`166d973`). The output was byte-identical.
2. **Stage 1** (`f072f32`): names, type signatures and `tools/check_python.py`.
   Every tool passes ruff (0.16.9's default rules), mypy `--strict` and pyright.
   The watch validator runs `check_python.py` rather than its own copy of the
   steps. The output was byte-identical.
3. **Stage 2**: `Colour`, `Gate`, `ShownSize`, `Venue` and `Deficiency` in
   `lib.py`; one `bisect()` and one `namespace_ids()`; `lightness_ratio()`
   removed (it was `contrast()`). `DrawingScore`/`VenueScore` in `barroom.py`,
   and `SamplingPlan`/`MotionScore` in `motion.py`. Both print their tables
   from these, and print `--json` for programs. The watch validator reads the
   JSON. `capture.sh` found every output byte-identical, images included.

Differences outside `capture.sh`'s cases, all deliberate:

- `STROKE_FLOOR_CSSPX` is computed (1.6357), not pinned (1.64). It is printed
  as `1.64`. No verdict can change: a stroke under 1.64 CSS px is off the
  ladder anyway.
- An invalid colour (`palette.py red`) and an unknown venue
  (`motion.py --venue x`) exit with a message, not a traceback. So does
  `contact.py` on a drawing with no width or height.
- The watch validator's motion check fails when less than 1 CSS px^2 changes
  by 3:1. Before, it failed when the rounded table cell was 0 (under 0.5 CSS
  px^2). 1 is the threshold that `motion.py` itself uses.

Not done: `watches/art/skeleton_watch.py` still reads the palette from the
CSS with its own `theme_palette()`, which repeats `lib.css_palette()`. To use
the tools' one, a talk's script would need to import from `stem/tools/`
across directories, which `stem/tools/` is not set up for (it is not a
package).

## Finished (2026-09-25)

The task is complete. For readers working within the decision:

- `capture.sh` was copied into the project as `tools/capture_outputs.sh`. The
  copy here stays as it was used.
- `tools/README.md` names the new tools and says, under "Not oversights", why
  Python is 3.14, why palette roles are strings, why other programs use
  `--json`, and why the stroke floor is computed. It points back here.
