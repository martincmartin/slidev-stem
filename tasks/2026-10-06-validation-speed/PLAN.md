# Faster validation

Covers: the six approved changes to shared validation and the watches print check.

Read before changing the validation schedule or its coverage.

## Baseline

On 2026-10-06, full validation passed 23 checks in 214.7 seconds.
Navigation, print, SVG motion, and offline checks used 182.0 seconds.
See `evidence/before-timing.json` for individual commands and results.
The source snapshot is in `inputs/`. Watches is the only live talk in this checkout.

## Options, ranked

1. Reuse one SVG browser and render each drawing at its required times.
   This preserves sampling and removes 32 browser launches and 19.2 seconds of fixed waits.
   Verify pixels and full tool reports against the source snapshot.
2. Add `--quick` for source checks, generation checks, and a build.
   The baseline cost is 16.1 seconds. It excludes browser and rendered-art checks.
   Full validation remains the default and the requirement before a commit.
3. Combine offline and navigation coverage in one browser check.
   Preserve startup, page-error, outside-request, nonmovement, and walk-limit failures.
   A deck without the navigation contract still needs an offline walk.
4. Use explicit print readiness conditions instead of fixed waits.
   Fixed waits cost 28 seconds. Preserve intermediate board poses and state comparisons.
   Do not use equality between the two pages as their readiness condition.
5. Calculate only the design-venue gate during validation.
   Keep complete reports available by default. Deduplicate identical PNG pixels.
6. Run independent preparation groups with a bounded worker pool.
   Keep dependencies sequential. Run navigation without competing browser checks.
   Keep serial execution available for comparison.

## Alternatives

Dropping types or unit tests saves little. They remain in both modes.
Dropping navigation would save 82.5 seconds but remove real transition and backward-path checks.
Reducing animation durations would change the presentation. No duration changes are planned.
Persistent caches need complete dependency keys. They are outside this change.

## Verification

Capture tool outputs before edits. Compare rendered pixels and measurements after edits.
Add regression tests for scheduling, failure reporting, gate equivalence, and merged walk failures.
Run root and watches canonical validation. Compare quick, serial, and concurrent timings.
Check print and SVG rendering in Chromium and Firefox.
Update current documentation and record final evidence in this directory.
Do not commit.

## Sources and new evidence

The current workflow is in [talks.md](../../docs/talks.md).
Navigation coverage is defined in [navigation.md](../../docs/navigation.md).
The art failure gates are defined in [legibility.md](../../docs/legibility.md).
Tool commands are defined in [tools/README.md](../../tools/README.md).

The new evidence is the per-check baseline timing, exact Chromium frame comparison,
unchanged report comparison, browser failure fixtures, and final mode timings.
No animation duration or art threshold changed.

## Execution decisions

Preparation uses independent sequences instead of a general dependency graph.
This keeps the small validator readable and preserves each sequence's file dependencies.
Navigation starts only after the worker pool closes.
The build and print sequence starts first because it is the longest preparation sequence.
When --fix is used, source rewrites start first and all preparation is serial.

SVG sampling uses eight capture rounds, with a separate sample time for each drawing.
This retains all 40 requested frames while avoiding unrelated timestamps and repeated browser setup.

The print check captures the live state before loading its printed page.
This prevents a slow printed load from changing the live story phase used for comparison.
The curl click retains its intermediate picture. The following click waits for the story's end.
Both Chromium and Firefox pass all 17 positions.

The combined navigation check provides an ordinary offline walk when no state probe exists.
Its failure fixtures include startup, page errors, outside requests, nonmovement, and bounded walking.
The standalone offline tool remains available for diagnostic walks and screenshots.

## Coverage refinement, 2026-10-06

The original offline walk pressed every 500 ms at a larger viewport.
The settled navigation walk has a different cadence and viewport.
Replacing the rapid walk would reduce path and viewport coverage.
The combined check therefore retains both walks in one browser.
It saves duplicate browser setup, not the rapid walk itself.
Two extra failure fixtures prove rapid-only errors and large-viewport requests are still detected.
The standalone invocation is removed, but its walk and failure conditions remain.
