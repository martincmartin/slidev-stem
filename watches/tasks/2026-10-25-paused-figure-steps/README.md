# Steps in a paused figure

The instructions are in `instructions.md`, and the plan and the log in
`PLAN.md`. The browser checks are in `tools/`: run them from the talk's
directory, with a built deck's directory as the argument
(`node tasks/2026-10-25-paused-figure-steps/tools/paused-step.ts dist`).

2026-11-01: The Part 2 production checks found that a paused step could stop
before its final frame, leaving a count one day short. The figure now draws
its endpoint. `art/privacy-check.ts` checks this in all three engines.
See [the production task](../2026-10-31-part-2-production/PLAN.md), section 10.
