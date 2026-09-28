# One command to validate the house and a talk

## The request (2026-09-28)

Make a uv "script" named `validate` that runs our tools, `mypy --strict`,
`pyright`, `ruff check` and `ruff format`. Follow the usual practice for uv and
for each tool. Also: which other tools or checks are worth considering? The
user added: no task runner, and one is not needed.

## Decisions

**D1. The form is a plain script, `uv run tools/validate.py`.** (It took
talk arguments at first; see D8.)

- uv has no task runner. uv 0.12.19 rejects unknown `[tool.uv]` keys, and its
  list of valid keys has no tasks or scripts (tested).
- The standard way to get `uv run validate` is a `[project.scripts]` entry
  point, and that needs the root project to be a package. In a test, `uv_build`
  refused a single module in `tools/`: "Expected a Python module at:
  tools/validate/__init__.py". An editable install would also put every module
  in `tools/` (`lib`, `motion`, `palette` and so on) on `sys.path` for all code
  in the venv.
- A task runner (poethepoet, just, make) was declined by the user.
- A plain script is how every other tool here runs, and it needs no packaging.

**D2. It only reports by default. `--fix` lets ruff rewrite first.** Without
`--fix`, it runs `ruff format --check` and plain `ruff check`, which is what a
check before a commit or in CI does. With `--fix`, it runs `ruff format` and
`ruff check --fix` (safe fixes only). `check_python.py` keeps its old
behavior, which rewrites the files, because a talk's validator uses it.

**D3. The settings are in `pyproject.toml`, not on the command line.**
`[tool.mypy] strict = true` and `files`, and `[tool.pyright] include`. A bare
`mypy`, a bare `pyright`, an editor and `validate.py` then agree. Two ruff
settings came from tests:

- `include` cannot limit ruff to the code. ruff uses the nearest config for
  each file, and the tasks keep copies of `pyproject.toml` in `inputs/`. A
  bare `ruff check` in `watches/` then checked
  `tasks/2026-09-26-canvas-2d-refactor/inputs/…` (2 errors). So
  `validate.py` gives ruff the paths in `[tool.mypy] files`
  (`check_python.code_paths`). `extend-exclude = ["tasks"]` keeps a bare
  `ruff format` away from the frozen tasks.
- ruff 0.16 includes Markdown by default, and formats the Python blocks in it:
  `ruff format tools` counted `tools/README.md`. Markdown belongs to Prettier,
  so `include = ["*.py", "*.pyi"]`.

**D4. It runs every check, then prints a summary, and exits 1 if any check
failed.** A check that stops at the first failure hides the other failures.

**D5. It uses `uv run --locked`.** A `uv.lock` that does not match its
`pyproject.toml` fails, and nothing is re-locked without anyone noticing.

**D6. `barroom.py` and `motion.py` now exit 1 when a drawing fails.**
`barroom.py` fails when a drawing is below the gate (`passes_gate`), and
`motion.py` when a drawing moves only in a wash (`in_wash`). Before this
change, both always exited 0, so no program could see a failure without
parsing their output. Their printed output does not change: all 15 captures
of `capture_outputs.sh` are identical.

**D7. The checks run one after another.** A full run takes 40 s (12 checks).
barroom and motion use most of it. Running them in parallel could save time,
but the output would then need buffering to stay in order. Not done.

**D8. The scope comes from the current directory (user's request,
2026-09-28).** In `stem/`, it checks only the shared files. In a talk, it checks
only that talk. The first version took talk arguments and always checked the
house too. It uses the uv project that holds the current directory
(`check_python.project_of`), so `stem/docs/` counts as `stem/` and
`watches/art/` counts as `watches/`. `palette.py --talk` now checks only the
talk and does not print the gates. Otherwise a talk's run would fail because
of a house problem. `capture_outputs.sh` records the two separately
(`palette.txt` and `palette-talk.txt`). The old combined output is exactly the
two put together.

## What it checks

| Where you run it | Checks |
| --- | --- |
| `stem/` (or below, outside a talk) | ruff format, ruff check, mypy (strict), pyright on `tools/`; `palette.py` (the gates). 5 checks. |
| a talk (`uv run ../tools/validate.py`) | the same four on the talk's code, in the talk's own uv project; `artcheck.py`, `barroom.py`, `motion.py` on its `public/`; `palette.py --talk`. 8 checks, 38 s. |

(This table is the state after D8. D9 adds three checks: see there for the
final list.)

## Verification

- `check_python.py` gives the same output as before on the tools, except that
  the count of files is 9 (it was 8). The ninth file is the new
  `validate.py`. On explicit files (`watches/art/*.py tools/lib.py`), the
  output is identical.
- `watches/art/validate_skeleton_watch.py` gives identical output.
- All 15 tool captures are identical.
- `validate.py watches`: all 12 checks pass, exit 0.
- A badly formatted file in `tools/`: exit 1, and the summary names
  "house (stem/): ruff format". `--fix` formats it, and the run then passes.
- A talk argument without `slides.md`: a usage error.
- `barroom.py` on a drawing recoloured to near-background: exit 1.

## Other checks

Each candidate was run once on the current code (`survey.sh`, output in
`evidence/survey.txt`). They are ranked by value for the cost, highest first.

| Rank | Check | Found now | Cost per run | Recommendation |
| ---: | --- | --- | --- | --- |
| 1 | Deck build and `offline_check.py`, per talk | passes | 9 s | Add. It checks the thing you present, and the offline rule. |
| 2 | Prettier (`pnpm format:check`), per project | passes | about 1 s | Add. AGENTS.md requires it, and nothing checks it now. |
| 3 | More ruff rules: `I, UP, B, SIM, C4, PTH, N, PERF, RUF` | 10: B905 (a `zip` without `strict=`), 6 × RUF005, 3 × PERF401 | none extra | Add. Little churn, and B905 is the kind of bug `strict=True` catches. |
| 4 | pyright `typeCheckingMode = "strict"` | 59, all `reportUnknown*`, mostly empty collections without an annotation | none extra | Consider. The fixes are mechanical. It closes the gap where mypy infers a type and pyright does not. |
| 5 | vulture (dead code) | 0 | about 1 s | Optional. It would enforce the AGENTS.md rule "delete a field or a function that nothing reads", but it finds nothing now. |
| 6 | `uv audit` | 0 | network | Skip as a gate; it is experimental. Run it now and then. |
| 7 | ty (`uv check`) | 0 on the code; 41 on the whole project, from the frozen tasks | about 1 s | Skip. It is a third type checker and adds nothing now. Look again if it could replace mypy and pyright. |
| 8 | `pnpm audit` | 8 (3 high), held back below Slidev 53.0.0 (the newest): `chevrotain` 11.1.2 (from `mermaid` 12.0.0, the newest) pins `lodash-es` 4.17.23; Slidev's `monaco-editor ^0.56.0` excludes 0.57.0, and 0.56.0 pins `dompurify` 3.4.8; `pptxgenjs` 4.0.1 (the newest) wants `image-size ^1.2.1`, and the fix is only in 2.x | network | Not a gate: it would fail until upstream moves. A pnpm `overrides` entry could force the fixed versions. The risk needs untrusted input, and a deck's input is its author's own. |
| 9 | codespell, shellcheck | 0, 0 | about 1 s | Skip. There is little text code and one shell script. |
| 10 | deptry | 11, all false: sibling-module imports, and `PIL` not linked to Pillow; packages used only by tasks | about 1 s | Skip. |
| 11 | ruff `PL`, `S`, `D` | 27, 5, 210 | none extra | Skip. `PL` is mostly magic numbers, which in these tools are deliberate. `S` flags the subprocess calls. `D` conflicts with the house docstring style. |
| – | pytest | no tests | – | Not now. `capture_outputs.sh` is the regression check for the tools. |
| – | A pre-commit hook that runs `validate.py` | – | 40 s per commit | Too slow for a hook. A hook with ruff only (under 1 s) would be possible. |

Note: ruff 0.16's default rules include import sorting (`I001`). The survey's
`I: 0` was measured before `validate.py` existed. The first scoped run then
caught an unsorted import in `validate.py`, and `--fix` sorted it.

## The command form, and the three checks the user chose (2026-09-28)

**D9. The command stays `uv run tools/validate.py` (option 1 below).** The
user asked how hard `uv run validate` would be, from `[project.scripts]`. A
scratch test (a copy of the layout: root package, talk with a path dependency):

- It works. `uv run validate` in the root and in the talk each run in their
  own venv, so the scope rule of D8 holds.
- The root must become a package: `[build-system]` (`uv_build`),
  `tools/__init__.py`, `module-root = ""`. The editable install then puts all
  of `stem/` on `sys.path` in every venv that has it.
- Each talk needs `stem-tools = { path = "..", editable = true }`. The talk's
  `uv.lock` records the house package's version and dependency groups
  (`[package.metadata.requires-dev]`). After a change to a house dependency
  group, the talk's `uv run --locked` failed until it was locked again. A
  change to the house's `[tool.ruff]` did not do this.

| Rank | Command | Cost | Coupling between talks |
| ---: | --- | --- | --- |
| 1 | `uv run tools/validate.py` / `uv run ../tools/validate.py` | none | none |
| 2 | `pnpm validate` (one script line per project) | 2 lines, plus 1 per talk | none |
| 3 | `uv run validate`, from a separate package with no dependencies | about an hour; one more project; `sys.path` side effect | only when that package changes |
| 4 | `uv run validate`, with the root as the package | about 30 minutes | every house dependency change re-locks every talk |

The user chose 1. AGENTS.md says why it is not `uv run validate`.

**D10. Three checks were added (ranks 1–3 of "Other checks").**

- **Prettier**, through each project's `pnpm format:check` (or `pnpm format`
  with `--fix`). Each project's scripts say which files are its own.
- **A build of the deck and a walk through it** (talk only). `pnpm build
  --out <temporary directory>`, then `offline_check.py --walk`. The walk is
  new: it presses the right arrow from slide 1 until the URL stops changing.
  Slidev adds `?clicks=N` to the URL for each click, so every slide and click
  is visited. It was tested on a throwaway deck with 3 slides and 3 clicks
  (6 steps). `watches` has 2 visible slides (slide 3 is `hide: true`), so it
  takes 2 steps. Without a slide list, the old `offline_check.py` visited
  nothing, and so it could not fail.
- **More ruff rules**: `extend-select = ["I", "UP", "B", "SIM", "C4", "PTH",
  "N", "PERF", "RUF"]`, in both projects. The 10 findings were fixed, with the
  same behavior: 3 × PERF401 in `artcheck.py` (`fails.extend`), 6 × RUF005 in
  the watch scripts (unpacking), and B905 (`zip(..., strict=True)` on two
  lists of equal length). The generated SVG is byte-identical.

**D11. Every check runs through `/bin/sh -c 'exec "$@"'`.** Homebrew's pnpm
is a shell script without a shebang, because its native binary was not
installed. macOS refuses to start such a file from `subprocess` (`OSError:
[Errno 8] Exec format error`). A POSIX shell runs it as a shell script. A
native binary runs the same way through the shell.

**Verification (final):**

- `stem/`: 6 checks pass. `watches/`: 11 checks pass, in 45 s.
- A badly formatted JSON file in the talk fails `prettier`, and `--fix`
  formats it. An outside image on slide 2 fails `offline` (4 requests to
  `example.com`, found by the walk).
- All 16 tool captures, `check_python.py` (tools, and explicit files) and the
  watch validator are identical to before this task's last changes.

Note on the machine: Homebrew's pnpm runs through Node.js, because its native
binary was not installed. It works, but it starts more slowly.
