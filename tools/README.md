# tools — the checks that settle arguments

These answer "is this good enough?" with arithmetic rather than opinion, for every
STEM talk. The thresholds they enforce are the ones in [`../docs/`](../docs/); the
reasoning behind the thresholds is in the talks' `tasks/` directories. Run them in
`stem/`.

**All of them read `lib.py` for constants.** Change a threshold, a stroke weight or
the venue table there and every tool follows. Nothing is repeated between tools,
so a number cannot drift. The palette values are not in `lib.py`: it reads them
from the house theme (`../themes/ledger/styles/ledger.css`), the one place they are
set. Each drawing's display size comes from the drawing itself (its `width` and
`height`).

| tool                 | needs                    | answers                                                                     |
| -------------------- | ------------------------ | --------------------------------------------------------------------------- |
| `lib.py`             | stdlib                   | the constants themselves; run it to print them                              |
| `palette.py`         | stdlib                   | does the palette pass its gates, does a talk set it; can I use this colour  |
| `artcheck.py`        | stdlib                   | is this SVG valid, in-style, and thick enough at the size it is shown       |
| `contact.py`         | playwright               | what does it look like, frame by frame                                      |
| `barroom.py`         | playwright + PIL + numpy | what does the back row of a lit room get                                    |
| `motion.py`          | playwright + PIL + numpy | can the back row see the thing that moves                                   |
| `offline_check.py`   | playwright               | does a built deck make any outside request; its fonts and colours per slide |
| `check_python.py`    | ruff, mypy, pyright      | do these Python files pass the house's checks (default: every tool here)    |
| `validate.py`        | all of the above         | does this project (stem/ or a talk) pass every check: run before a commit   |
| `capture_outputs.sh` | playwright               | every tool's output, saved, to compare before and after a change to a tool  |

```bash
uv run tools/validate.py                                # every check of the shared files
(cd watches && uv run ../tools/validate.py)             # every check of one talk, only
uv run tools/validate.py --fix                          # ... after ruff formats and fixes
.venv/bin/python3 tools/lib.py                          # the framework, as numbers
.venv/bin/python3 tools/palette.py                      # every gate, pass/fail
.venv/bin/python3 tools/palette.py --talk watches       # only: does this talk set it?
.venv/bin/python3 tools/palette.py "#C0451C" accent     # a candidate colour, measured
.venv/bin/python3 tools/artcheck.py watches/public/     # every SVG in a talk's public/
.venv/bin/python3 tools/artcheck.py path/to/new.svg     # ... or just the new one
.venv/bin/python3 tools/contact.py watches/public/timekeepers --times 0.2 4 8 11.8
.venv/bin/python3 tools/barroom.py watches/public/ --save out/
.venv/bin/python3 tools/motion.py watches/public/   # every animated drawing in a talk
.venv/bin/python3 tools/offline_check.py <build dir> 1:0 2:5   # see its docstring
.venv/bin/python3 tools/offline_check.py <build dir> --walk    # every slide and click
.venv/bin/python3 tools/check_python.py      # after you change a tool
tools/capture_outputs.sh /tmp/before          # before you change a tool; again after,
diff -r /tmp/before /tmp/after                # ... then compare: a refactor changes nothing
```

Every check exits non-zero on failure, so it works in `validate.py`, a
pre-commit hook or CI. `barroom.py` fails if a drawing is below the gate, and
`motion.py` if a drawing moves only in a wash. They also print their scores as
JSON with `--json`: a program that reads the scores (such as a talk's validator)
must use that, not their tables. All of them need Python 3.14, so run them
with `stem/.venv/bin/python3` or `uv run`: `uv sync` in `stem/` makes the venv. The
"needs" column above lists the packages. Each tool that checks art needs the paths
to check: there is no default of "every talk", because a given talk is not checked
again (`../AGENTS.md`, "Given talks and versions").

## Which tool is the authority

They disagree on purpose, because they see different things.

- **`artcheck.py` reads the source.** It knows the stated size, the palette, the stroke
  ladder and — through the SVG inheritance chain — what opacity each mark is
  actually painted at. It does not know about overlap, texture, or how marks
  compose.
- **`barroom.py` reads the pixels**, after a physically-modelled acuity blur and
  additive ambient flare, both in linear light. **When they disagree, barroom is
  right.**
- **`motion.py` reads two frames** through the same blur and flare, and compares
  them per pixel. It answers the one question the other two are structurally blind
  to: whether the thing that MOVES is drawn in marks that survive. A drawing can
  pass `artcheck` and `barroom` and still animate invisibly -- the water clock did,
  for a day (`../docs/legibility.md`).

The division is deliberate: `artcheck` is instant and stdlib-only, so it can run
on every save; `barroom` costs a browser launch, so it runs when the drawing is
roughly done — but _early_ in the drawing's life, not at the end. Every failure it
finds is cheap while the art is still being drawn.

## Three signatures worth recognising

Failures are not all the same failure. `barroom.py` says so in its own output, and
it is the single most useful thing to internalise from `../docs/legibility.md`:

- **`hold` low, `p90` healthy** -- the outline survives and the washes do not. The
  drawing reduces to line work at the back row. Often fine; check that the line work
  alone carries the meaning.
- **`hold` and `p90` both low** -- a real failure. Ask whether it is _weight_
  (fixable by remapping the stroke span; do not ship a uniform multiplier) or
  _palette_ (not fixable with ink at all).
- **`barroom` fine, `motion` with area at 1.2 and nothing at 3.0** -- the drawing is
  legible and its animation is not. Put the motion in the marks that survive.

## Why these are copies of tools in `tasks/`

The archives hold near-identical scripts, and that duplication is intentional.

**An archive has to reproduce its own numbers forever**, so its tools are frozen
with its art. **This directory has to evolve**, because the framework learns things
— `artcheck.py` already enforces the stroke ladder and computes effective contrast
through opacity inheritance, neither of which any archive tool does. A tool that
must stay still cannot also learn, so there are two.

Consequences worth knowing:

- **Do not "sync" these with the archive copies.** Divergence is the design.
- **Do not point these at archive art**, or the archive's generators at live art.
  These read each talk's `public/`; an archive's read its own `deck/public/`.
- **When a check here changes what we believe**, add a dated line to the relevant
  archive README saying so. The archive stays frozen; the line is a forwarding
  address for whoever lands there first.

## Not oversights

These look like things to improve. Each was considered and chosen; the options
and the evidence are in
[`../tasks/2026-09-25-tools-cleanup/PLAN.md`](../tasks/2026-09-25-tools-cleanup/PLAN.md).

- **Every tool needs Python 3.14, even the three that use no packages.** They used
  to run on macOS's own Python 3.9, but nothing depended on that, and one version
  lets all the code use the same features and checks.
- **Palette roles are strings (`"ink"`, `"panel"`), not fields of a class.** They
  are the theme's CSS names: external data. A new role in the CSS needs no code.
  `lib.py` stops at once if a gate names a role that the CSS does not set.
- **A program reads `barroom.py` and `motion.py` through `--json`, not by
  importing them.** `tools/` is not a package, so an import from a talk would need
  a `sys.path` change. Both tools start a browser, so a subprocess costs nothing.
- **The stroke floor is computed from `DESIGN_VENUE` (1.6357 CSS px), not pinned
  at 1.64.** Change the design venue and the floor follows.

## Adding a tool

Put the thresholds in `lib.py`, never in the tool. Before you change a tool,
save its output with `capture_outputs.sh`; after, run `check_python.py` and
compare. Write the docstring for someone
who has not read the archives: say what the tool measures, what the number means,
what it cannot see, and what a bad result should make you do. Then add a row to the
table above and a line to the relevant file in `../docs/`.
