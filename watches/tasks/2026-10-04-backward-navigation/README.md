# Plan: going back works with no extra work

The plan and the log are in `PLAN.md`.

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).

2026-10-23: the navigation check is now TypeScript, `tools/navcheck.ts`
(`pnpm navcheck`), with the same thresholds and failures. One change: the
sampler now says it has started only after its first frame. Before, it said so
at once, and the key went down 100 ms later. Where a frame takes longer than
that (a machine without a GPU), many moves had no frame before the press, and
the check noted them and judged nothing: 75 of 106 moves in one run of the
port. This task's `tools/navcheck.py` imports the house's
`tools/offline_check.py`; to run it again, run it in a checkout of commit
`133dd10`, the last with that file (`git worktree add ../stem-133dd10
133dd10`).

2026-10-23: navcheck no longer starts a sampler for each press. A recorder,
installed in each page before the deck's scripts, records `slideState()`
after each frame's callbacks (a message posted from a frame callback), and
when each key goes down; the check waits for one frame before each press,
and for quiet after it. Reading after the frame's callbacks means that an
animation loop which starts on the key press is seen in its first frame, not
one frame late, whatever the order in which the loops were registered.

2026-10-23: a `continuous` number that leaves `slideState()` during a move (a
fade out, then gone) now ends at the last value it had. Before, the check took
its end to be its start, so a fade from 1 to 0 then gone read as "went to 0 on
its way from 1 to 1", a flash. The recorder caught such a frame (the time
scale's opacity) on the Recap slide's step to its last click; the per-press
sampler had not.
