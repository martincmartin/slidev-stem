# Implement the WebGL watch

The instructions are in `instructions.md`, the plan and the log in `PLAN.md`.

- 2026-09-29: the renderer changed after a review (`review/review.md`): vertex
  arrays, buffers reused, checked inputs, `dispose()`. See
  `../2026-09-29-webgl-review-fixes/PLAN.md`.
- 2026-10-23: `art/watch_stills.py` and the review fixes' `art/pixel_regression.py`
  are now TypeScript: `art/watch-stills.ts` and `art/pixel-regression.ts`, with
  `art/probe.ts`. Their frames and PNGs are the same.

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).
