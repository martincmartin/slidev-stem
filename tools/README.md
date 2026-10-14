# tools: the checks that settle arguments

**Covers:** each house tool, its commands, and which tool is the authority.
This is the one place that lists the commands; the docs link here.
**Read before** you run a check, change a tool, or add one.
**Tasks:**
[`tasks/2026-09-25-tools-cleanup/`](../tasks/2026-09-25-tools-cleanup/PLAN.md),
[`tasks/2026-09-28-validate/`](../tasks/2026-09-28-validate/PLAN.md),
[`tasks/2026-10-06-validation-speed/`](../tasks/2026-10-06-validation-speed/PLAN.md).

These answer "is this good enough?" with arithmetic rather than opinion, for every
STEM talk. The thresholds they enforce are the ones in [`../docs/`](../docs/README.md). Run them in
`stem/`.

**All of them read `lib.py` for constants.** Change a threshold, a stroke weight or
the venue table there and every tool follows. Nothing is repeated between tools,
so a number cannot drift. The palette values are not in `lib.py`: it reads them
from the house theme (`../themes/ledger/styles/ledger.css`), the one place they are
set. Each drawing's display size comes from the drawing itself (its `width` and
`height`).

| tool                   | needs                    | answers                                                                                                                                |
| ---------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| `lib.py`               | stdlib                   | the constants themselves; run it to print them                                                                                         |
| `browsers.py`          | playwright               | does this venv's Playwright have its browser; if not, install it (the tools that render call it)                                       |
| `palette.py`           | stdlib                   | does the palette pass its gates, does a talk set it; can I use this colour; the palette classes' gates                                 |
| `derive_palette.py`    | stdlib                   | a palette class's art roles, derived from its text roles, as a CSS rule                                                                |
| `artcheck.py`          | stdlib                   | is this SVG valid, in-style, and thick enough at the size it is shown                                                                  |
| `scenecheck.py`        | stdlib                   | does a 3D scene (a talk's WebGL art) keep to the art inks, the stroke ladder and the opacities (a face is its wash, solid)             |
| `deck_check.py`        | playwright + PIL + numpy | does a talk's live WebGL art keep its frame rate, contexts and size in visible windows, the presenter view, the export (opens windows) |
| `fade_check.py`        | playwright + PIL + numpy | is a fade of the rest of the scene continuous, and what does it cost the GPU (needs the talk's probe page)                             |
| `contact.py`           | playwright               | what does it look like, frame by frame                                                                                                 |
| `barroom.py`           | playwright + PIL + numpy | what does the back row of a lit room get (an SVG, or a PNG that something else drew)                                                   |
| `motion.py`            | playwright + PIL + numpy | can the back row see the thing that moves (an SVG's animation, or two PNG frames of one)                                               |
| `offline_check.py`     | playwright               | does a built deck make any outside request, and does it start and show its slides; its fonts and colours per slide                     |
| `smokecheck.py`        | playwright               | does the built deck start, navigate through its declared positions, and work offline                                                   |
| `navcheck.py`          | playwright               | diagnostic for suspected navigation problems: continuity and direct-load equality ([navigation.md](../docs/navigation.md))             |
| `talkcheck.py`         | stdlib, pnpm             | does a talk have its own `pnpm-workspace.yaml`, and does Prettier read each of its deck files with the Slidev parser                   |
| `check_python.py`      | ruff, mypy, pyright      | do these Python files pass the house's checks (default: every tool here)                                                               |
| `doccheck.py`          | stdlib                   | do the docs' links and anchors resolve, does each `docs/` match its two indexes, does each named tool exist                            |
| `validate.py`          | all of the above         | does this project (stem/ or a talk) pass its checks; full or quick mode                                                                |
| `flatten_pnpm_list.py` | stdlib                   | every resolved JS package, one `name@version` a line: diff before and after an upgrade                                                 |
| `compare_dist.py`      | stdlib                   | are two deck builds the same, apart from Vue scope ids and content hashes                                                              |
| `capture_outputs.sh`   | playwright               | every tool's output, saved, to compare before and after a change to a tool                                                             |

```bash
uv run tools/validate.py                                # every check of the shared files
(cd watches && uv run ../tools/validate.py)             # every check of one talk, only
uv run tools/validate.py --fix                          # ... after ruff formats and fixes
(cd watches && uv run ../tools/validate.py --quick)     # source, generated files, and build
(cd watches && uv run ../tools/validate.py --jobs 1)    # full checks, serial preparation
(cd watches && uv run ../tools/validate.py --json)      # results and elapsed times as JSON
(cd watches && uv run ../tools/validate.py --no-reuse)  # run print and smoke navigation again
(cd watches && uv run ../tools/validate.py --print)     # run print even if no print input changed
uv run tools/lib.py                          # the framework, as numbers
uv run tools/palette.py                      # every gate, pass/fail
uv run tools/palette.py --talk watches       # only: does this talk set it outside a slide class?
uv run tools/palette.py "#C0451C" accent     # a candidate colour, measured
uv run tools/artcheck.py watches/public/     # every SVG in a talk's public/
uv run tools/artcheck.py path/to/new.svg     # ... or just the new one
uv run tools/contact.py watches/public/timekeepers --times 0.2 4 8 11.8
uv run tools/barroom.py watches/public/ --save out/
uv run tools/motion.py watches/public/   # every animated drawing in a talk
uv run tools/barroom.py cover.png           # a PNG, at 2 device px a CSS px
uv run tools/barroom.py watches/public/ --gate-only # only the design-venue failure gate
uv run tools/motion.py --png-pair a.png b.png   # two frames of one animation
uv run tools/scenecheck.py scene.json       # from a talk's `pnpm art:scene`
uv run tools/offline_check.py <build dir> 1:0 2:5   # see its docstring
uv run tools/offline_check.py <build dir> --walk    # every slide and click
uv run tools/smokecheck.py <build dir> --browser all --no-canvas-readback  # full validation
uv run tools/smokecheck.py <build dir> --browser firefox
uv run tools/smokecheck.py <build dir> --browser webkit --no-canvas-readback
uv run tools/offline_check.py <build dir> --browser webkit 1:0
uv run tools/navcheck.py <build dir> --offline      # suspected navigation problems only
uv run tools/navcheck.py <build dir>                # diagnostic; also accepts a dev server URL
uv run tools/check_python.py      # after you change a tool
tools/capture_outputs.sh /tmp/before watches  # before you change a tool; again after,
diff -r /tmp/before /tmp/after                # ... then compare: a refactor changes nothing
```

Every check exits non-zero on failure, so it works in `validate.py`, a
pre-commit hook or CI. `barroom.py` fails if a drawing is below the gate, and
`motion.py` if a drawing moves only in a wash. They also print their scores as
JSON with `--json`: a program that reads the scores (such as a talk's validator)
must use that, not their tables. All of them use the Python version pinned in `.python-version`. Run them with `uv run`, which makes
`stem/.venv` first. The
"needs" column above lists the packages. The tools that render install their required browser engines
the first time they run, into Playwright's cache for your user, which every
checkout shares (`browsers.py`). Each tool that checks art needs the paths
to check: there is no default of "every talk", because a retired talk is not checked
again (`../AGENTS.md`, "Given talks, retired talks and versions").

## Validation modes

Use quick mode for routine feedback.
The [validation policy](../AGENTS.md#validate-before-you-commit) defines when full mode is required.
Run full mode during work only after changes that could affect its results.
Before a commit, reuse the last successful full run only if the project and its relevant inputs have not changed.
After changes to docs only, a quick run is enough (the policy says which files).
Full mode reuses a pass of print and smoke navigation while the built deck and its checkers are byte-identical;
`--no-reuse` runs them again. [talks.md](../docs/talks.md#check-your-work) gives the key.
Full mode runs print only with `--print` or after a change to a print input
([talks.md](../docs/talks.md#the-print-check)); run `--print` before an export or a tag.
`--quick` checks source files, generated files, and a build.
It omits rendered art, browser checks, print, and navigation.

Independent preparation groups use the worker limit in `validate.py`.
Each group keeps its dependency order. Navigation runs after preparation. Its three independent engine walks run together.
`--jobs 1` selects serial preparation; `--fix` always uses one worker.
Results stay in group order and include elapsed times.
`--json` prints the same results as one JSON object.

Full validation uses `barroom.py --gate-only`.
The failure calculation is unchanged; other venue reports are omitted.
Identical decoded PNG pixels share one measurement.
The default `barroom.py` report and its JSON output retain all measurements.

`motion.py` reuses one browser and poses each SVG at its required sample times.
The sampling plans and contrast calculations are unchanged.
Frame capture waits for fonts and two paint frames instead of a fixed delay.

`smokecheck.py` provides the full validation deck walk in Chromium, Firefox,
and WebKit. Each uses a fresh non-persistent context, and Chromium draws on the
GPU ([browser support](../docs/talks.md#browser-support)). Full validation blocks
2D canvas pixel reads as a privacy regression check.
See [browser support](../docs/talks.md#browser-support) for the requirements and limits.
It checks startup, page errors, outside requests, navigation stalls, and completion.
If a talk has an `art:privacy` script, full validation also runs its live-art
startup check with canvas pixel reads blocked.
The Ledger theme supplies the next and final positions from Slidev navigation.
Quick validation has no browser walk.

`navcheck.py` is diagnostic only. Run it when a navigation problem is found or suspected.
No validation mode runs exhaustive navigation. Do not run it routinely,
including before commits or after ordinary navigation changes.
The diagnostic retains forward/backward animation sampling and direct-load comparisons.
`offline_check.py` remains available for screenshots and diagnostic walks.

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

How to read what they report, and what a failure means, is in
[`../docs/legibility.md`](../docs/legibility.md).

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

- **Every tool uses the pinned Python, even the three that use no packages.** They used
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

## `doccheck.py`

`validate.py` runs it on each project's `docs/`, `README.md` and `AGENTS.md`
(and, at the root, `tools/` and `themes/`), never on `tasks/`. To run it by
hand, in `stem/`:

```bash
uv run tools/doccheck.py docs tools themes README.md AGENTS.md --tools tools
uv run tools/doccheck.py watches/docs watches/README.md watches/AGENTS.md --tools tools
```

It checks that the docs hold together (links, anchors, indexes, tool paths),
not that what they say is true. That is still a reader's job: when you change
code, search the docs for each name that you changed.

It reads Markdown with regular expressions. The cases it must get right (and
the limits it documents) are tests in `test_doccheck.py`, which the root run of
`validate.py` runs with pytest. When doccheck reads some Markdown wrongly, add
a test that fails, then fix the reader. Each tool and `lib.py` has its own
`test_<name>.py`, run the same way. When a check gives a wrong answer, add a
test with the input that fooled it, then fix the check.

## Adding a tool

Put the thresholds in `lib.py`, never in the tool. Before you change a tool,
save its output with `capture_outputs.sh`; after, run `check_python.py` and
compare. Write the docstring for someone
who has not read the archives: say what the tool measures, what the number means,
what it cannot see, and what a bad result should make you do. Then add a row to the
table above and a line to the relevant file in `../docs/`.
