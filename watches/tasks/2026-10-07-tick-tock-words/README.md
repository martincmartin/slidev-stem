# Tick-tock words

The plan, the decisions and the result are in [PLAN.md](PLAN.md).

2026-10-09: the user chose the plain words. The Escapement slide's trial click of _Batman_ bursts is gone, and so is the burst style: `watchTickTock` is now `true` or `false`.

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).

2026-10-27: the words moved from the jewel's strike to the drop. A real tick
and tock come from a tooth of the escape wheel that lands on a pallet stone,
not from the jewel on the fork. So a word now appears at the end of a tick
window, at the stone, and drifts straight out from the escape wheel's arbor
(NW and SW). The lower stone is next to the end of the pallet's leader: the
words start 68 px from the strike and drift 22 px, so that "tock" clears the
leader by 4 px and "tick" ends 8 px below the jewel's label. See
`docs/watch.md`, "Tick and tock".
