# Full validation runtime

Measure full watches validation. Keep production code and check coverage unchanged.

Read the current workflow in [talks.md](../../../docs/talks.md),
the check contracts in [tools/README.md](../../../tools/README.md),
the [navigation rules](../../../docs/navigation.md), and the
[legibility gates](../../../docs/legibility.md).
The [previous optimization task](../../../tasks/2026-10-06-validation-speed/PLAN.md)
records changes already made.

## Options

1. Measure the default full command with its JSON timing output.
   This measures current elapsed time and preserves all checks.
   Individual check times overlap because preparation uses two workers.
2. Compare full validation with four preparation workers.
   This keeps coverage. Extra browser contention could increase runtime.
3. Reduce navigation observation waits in an isolated experiment.
   This could save time. Shorter waits could miss delayed state changes.
   A passing experiment does not prove equal defect detection.
4. Remove checks with overlapping coverage.
   This saves their runtime but can remove distinct failure gates.
   Inspect their contracts before ranking cuts.

## Chosen method

Start with option 1. Compare option 2 after the baseline completes.
Separate measured savings from estimates. Document coverage lost by each cut.
Keep input copies and raw results here. Do not change or commit production files.

## New evidence

This task measures the current deck after the previous optimization.
It distinguishes check runtime from savings on the full run's critical path.

## Scope update

The user asked for a fast replacement for the navigation checks.
Prioritize a rapid smoke walk over the preview-removal experiment.
The isolated preview-free source is retained but was not benchmarked.
Measure the current deck in Chromium and Firefox with 100 ms between clicks.
Retain the existing startup delay and offline failure checks in the experiment.
Do not change the live validator.

## Approved implementation

The user approved the smoke replacement on 2026-10-07.
Exhaustive navigation must not run in any validation mode.
It is only for an actual or suspected problem. It must not run routinely.

Add a shared smoke tool and a Ledger navigation metadata probe.
Check each next position and the final slide and click.
Retain request blocking, page-error detection, and bounded navigation deadlines.
Keep quick mode without a browser walk.
Update the validation policy and current docs in the same change.
Test stalls, early ends, missing metadata, page errors, and outside requests.
Run canonical shared and watches validation. Check the smoke walk in both browsers.
Do not run exhaustive navigation to verify this change. Do not commit.
