# Implement the WebGL watch

The instructions are in `instructions.md`, the plan and the log in `PLAN.md`.

- 2026-09-29: the renderer changed after a review (`review/review.md`): vertex
  arrays, buffers reused, checked inputs, `dispose()`. See
  `../2026-09-29-webgl-review-fixes/PLAN.md`.
- 2026-10-23: `art/watch_stills.py` and the review fixes' `art/pixel_regression.py`
  are now TypeScript: `art/watch-stills.ts` and `art/pixel-regression.ts`, with
  `art/probe.ts`. Their frames and PNGs are the same.
