# Rest-shape cleanup and final review

Read [watch.md](../../docs/watch.md), [slide-patterns.md](../../docs/slide-patterns.md), and [measurements.md](../../docs/measurements.md).
Read the house illustration, legibility, and validation rules.

## Scope and choices

Keep the selected leader, including bend weight $15$.
Remove the zero-bend slide, SVG, and configuration branch.
Keep the comparison sources and evidence in their existing frozen tasks.

Prefer targeted cleanup within the existing generator.
Extract another module only if the review identifies a clear maintenance benefit.
A speculative module split adds imports and documentation without reducing the current behavior's complexity.

## Work

1. Save the source before cleanup and remove the experimental production branch.
2. Review the full uncommitted change with the relevant code-quality reviewer.
   The reviewer must read this task and return a complete Markdown report without writing files.
3. Save that report verbatim. Resolve actionable findings and record remaining limits.
4. Check that cleanup leaves the selected SVG byte-identical.
5. Update docs to describe the final slide and its maintenance contract.
6. Record durable geometry, objective, layering, and lifecycle decisions in project docs or this task.
   Do not save memory. Do not commit without explicit approval.
7. Run appropriate tests, the canonical validator, and Chromium and Firefox checks offline.
8. Save final sources, evidence, and the review outcome.
