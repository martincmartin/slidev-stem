# Motion works

The options, the evidence and the steps are in [PLAN.md](PLAN.md).

## Later decisions

- 2026-10-12: the barrel arbor and its square leave the Hour Hand slide at
  clicks 1 and 2. They rise through the one-step hour wheel at 8 o'clock,
  and the barrel's clip disc only hid that. The one-step hour wheel stays at
  8 o'clock: the places clear of the arbor cover the balance, or put the
  hand through the chapter ring. See
  [`../2026-10-11-paper-discs/PLAN.md`](../2026-10-11-paper-discs/PLAN.md).
- 2026-10-12, later: the barrel arbor stays on the Hour Hand slide at every
  click. It ends level with the barrel's top, and its square is a flat
  outline on it (a decal), so the one-step hour wheel's paper disc covers
  it. This is the paper-discs task's other way, without its cost to the
  Mainspring slide: the square stays, flat, and the key's pipe stands on
  the arbor. See `docs/watch.md`, "The Hour Hand slide".
- 2026-10-12: paper discs replace the clip discs of steps 4 and 5. The
  motion works' discs still end half way across the rim, and the 6 px rims
  are kept, though the paper discs do not slide. The hour wheel stands a
  small gap above the cannon pinion and the minute wheel. See
  [`../2026-10-11-paper-discs/PLAN.md`](../2026-10-11-paper-discs/PLAN.md).

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).
