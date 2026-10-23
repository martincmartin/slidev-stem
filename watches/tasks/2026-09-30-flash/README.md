# Flash timing

See [PLAN.md](PLAN.md) for the original decision and evidence.

2026-10-01: The flash now starts with the zoom. The zoom, tilt, and fade keep their previous durations.

2026-10-07: The flash colours are renamed. `art-second-knockout` is now `--palette-second-wash`, and each wash of a flashed part (the subject's, muted's) goes to it; the case's face is now muted's wash, not muted at 0.18. See [`tasks/2026-10-07-theme-colour-system`](../../../tasks/2026-10-07-theme-colour-system/PLAN.md).

2026-10-07: The flash is now orange: Ledger's second changed from `#9A6238` to `#B5601E`, and its wash from `#E6D8CA` to `#ECD8C4` (same recipe).

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).
