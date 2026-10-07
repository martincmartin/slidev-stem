# Faster validation

Covers: the approved changes to validation scheduling, SVG sampling, print readiness, and legibility gates.
Read before changing these parts of the validator.
The options and decisions are in [PLAN.md](PLAN.md).

## Current behavior

- Full validation remains the default and the requirement before a commit or presentation.
- `--quick` runs source checks, generated-file checks, and a build.
- `--jobs 1` runs preparation serially. The default uses two workers.
- `--fix` always uses one worker.
- Navigation runs alone after preparation and includes both settled navigation and the original rapid offline walk.
- Every check reports its elapsed time. `--json` gives the same results as JSON.
- SVG motion preserves every original sample and uses one browser with eight capture rounds.
- Full validation measures only the existing design-venue legibility gate.
- Complete legibility reports remain available from `barroom.py` without `--gate-only`.
- Identical decoded PNG pixels share a score. Each filename still gets a result.
- Print readiness uses loaded layers, posed SVGs, decoded images, and two paint frames.
- Readiness does not depend on agreement between the two pages.
- The live curl click is captured before it ends. The next click waits for the completed story.

## Evidence

| Mode                     |    Time | Result                                        |
| ------------------------ | ------: | --------------------------------------------- |
| Original full validation | 214.7 s | 23 checks passed                              |
| Final full validation    | 125.1 s | 22 checks passed; both browser paths retained |
| Quick validation         |  14.1 s | 15 checks passed; reduced scope               |

Full validation saves 89.5 seconds in these samples.
The reduction is $1 - t_{\mathrm{after}} / t_{\mathrm{before}} = 41.7\%$.
The standalone offline invocation is now part of navigation. Both original walks remain.
Intermediate timings that omitted the rapid walk are marked in `evidence/timing-scope.md`.
They are not used in the final coverage comparison.

Per-check times overlap when preparation runs concurrently. Do not add them to estimate wall time.

The complete before-and-after tool captures match byte for byte.
All nine captured images have identical decoded pixels.
All 40 Chromium motion sample frames match the frozen baseline pixel for pixel.
Firefox rasterization differs from Chromium. All five Firefox motion measurements pass the same gate.
Print state comparisons pass in Chromium and Firefox: 17 positions, including 11 with a watch.
All twelve final browser fixtures passed their expected exit-code checks.
They verify valid decks, fallback walks, and intentional failure cases.
Those cases cover startup, page errors, outside requests, nonmovement, and walk limits.
Two cases expose errors only during rapid presses or at the larger viewport.
The shared test suite passes 142 tests.

These are local measurements with installed dependencies and browsers.
They are not statistical timing estimates. Navigation still runs the presentation at its actual speed.
The checks do not establish arbitrary camera correctness, frame-rate performance, or PDF pixel parity.

## Reproduce

The `inputs/` directory holds the before-change source, configuration, lockfiles, theme, and artwork.
It excludes historical task archives and installed packages.
It is sufficient for the archived art tools and rendering probes.
A full historical doccheck also needs the historical archives linked by those documents.
The scripts below import tools from their own directories. They do not change the Python module search path.
Run them in the house Python environment. Give all paths explicitly.

```bash
uv run tasks/2026-10-06-validation-speed/tools/check_browser_contracts.py \
  /path/to/stem2 /path/to/contracts.json
uv run tasks/2026-10-06-validation-speed/tools/compare_svg_frames.py \
  /path/to/stem2 /path/to/stem2/tasks/2026-10-06-validation-speed
uv run tasks/2026-10-06-validation-speed/tools/check_svg_metrics.py \
  /path/to/stem2 /path/to/stem2/tasks/2026-10-06-validation-speed
```

`inputs/tools/capture_outputs.sh` reproduces the archived reports after its dependencies are installed.
The frame comparison requires the root and talk Playwright versions to use installed matching browsers.
Run current validation from the watches directory, with no other browser probes running:

```bash
uv run ../tools/validate.py --quick --json
uv run ../tools/validate.py --jobs 1 --json
uv run ../tools/validate.py --json
```

No files were committed.

## Coverage comparison

Full validation retains all original type checks, lint checks, unit tests, generated-file checks, and scene checks.
SVG motion retains four frame pairs per drawing and all 40 source frames.
The legibility failure condition is unchanged. Full validation omits three extra venue reports, p90, and Fmax.
Those values never determined validation failure. The complete report remains available separately.
Navigation retains all forward/backward moves and direct-load comparisons, with the same timing and continuity thresholds.
The rapid offline walk retains the original viewport, startup delay, and 500 ms press interval.
Printed-state comparisons retain all 17 positions and all board-pose checks. Their sampling waits now use readiness.
The shared-project suite adds fourteen regression tests; no unit test was removed.

Quick mode has intentionally less coverage. It does not run browser, rendered-art, motion, print, or navigation checks.
It is suitable for routine feedback and cannot replace full validation.

Readiness waits and concurrency change the test harness's execution order and observation times.
The evidence verifies the stated comparisons and gates, not detection of every possible future bug.
The headless check stubs screen wake-lock acquisition. It still rejects invalid wake-lock types and all page errors.
It does not test real browser permission handling.

2026-10-06: The [validation policy](../../AGENTS.md#validate-before-you-commit) now permits reuse of an unchanged project's last successful full run.
Use quick mode for routine feedback.
During work, run full mode only after changes that could affect its results.
Before a commit, require a successful full run.
If the project and its relevant inputs are unchanged since that run, reuse it.
