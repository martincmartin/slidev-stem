# Canvas 2D planning

The instructions are in `instructions.md`, the plan and the log in `PLAN.md`.

2026-10-23: the talk no longer depends on scipy. `tools/tilt_animation.py` ran with scipy 1.18.1 (and scipy-stubs 1.18.1.1). To run it again, add them to the talk for that session: `uv add scipy==1.18.1`.

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).
