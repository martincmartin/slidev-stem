# Paper discs

Why the watch's wheels hide what is under them with paper discs (holdouts)
and not clip discs, the gap and the line test that this needs, and the two
collisions that it showed. [PLAN.md](PLAN.md) holds the options, the
measurements and the figures; `prototype.patch`, the prototype that made them.

Two code-quality reviews of the clean implementation, and what they
changed, are in [review-2026-10-12.md](review-2026-10-12.md),
[review-2026-10-12-2.md](review-2026-10-12-2.md) and PLAN.md, "The review".

## Later decisions

- 2026-10-12, after the second review: the barrel arbor stays on the Hour
  Hand slide at every click. It ends level with the barrel's top, and its
  square is a flat outline on it (a decal), so the one-step hour wheel's
  paper disc covers it. This is PLAN.md's other way ("The two
  collisions"), without its cost to the Mainspring slide: the square
  stays, flat, and the key's pipe stands on the arbor. See
  `docs/watch.md`, "The Hour Hand slide".

- 2026-10-23: `tools/print-compare.py` imports `print_check` from the live
  `art/`, which is now TypeScript (`art/print-check.ts`). To run the tool,
  restore the module first: `git show 34ecc92:watches/art/print_check.py`.

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).
