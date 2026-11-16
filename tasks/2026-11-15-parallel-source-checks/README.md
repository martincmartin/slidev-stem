# Run the source checks in parallel

Covers: why quick validation used one worker in effect, the change that runs
each source check as a group of its own, the phases that let `--fix` run in
parallel, the pruned directory walks, and the default of four workers. Read
before you change the groups, the phases or the worker count of
`tools/validate.py`, or the walks in `lib.walk_files`. The options
and the decisions are in [PLAN.md](PLAN.md).

## What changed

- `validate.py` gives each source check its own group (`source_phases`).
  The four Python checks stay one group, because `ruff format` and
  `ruff check` write the same cache. This holds for a talk and for the root.
- The checks run in phases (`Phase`, `run_phases`). A phase is a set of
  groups that run at the same time; the next phase starts when it ends.
  Without `--fix`, all checks but smoke navigation are one phase. With
  `--fix`, ruff's group and Prettier are the first phase, at the same time
  (they write disjoint files), and the other checks follow in parallel.
  Smoke navigation is the last phase, alone.
- `--fix` no longer uses one worker.
- In a phase, the longest groups start first: ruff and Prettier, the build
  and the checks of the built deck, the stills, then the other source
  checks (lint, test, typecheck first), then the SVG checks.
- `DEFAULT_WORKERS` is 4 (it was 3).
- `lib.walk_files` walks a talk without going into a skipped directory.
  `lib.talk_source_files` and `talkcheck.deck_files` use it. They give the
  same files as before.

No check, and no file that a check reads, was removed.

## Evidence

The real command on the same machine, on 2026-11-15, at three points:
before (commit `2adf76c`), after the split and the walks (sections 1–5 of
the plan), and after the phases (section 6):

| Run | Before | Split | Phases |
| --- | ---: | ---: | ---: |
| `watches`, `--quick` | 26.56–27.25 s | 13.03–13.95 s | 13.87–14.06 s |
| `watches`, `--quick --fix` | not measured | 23.46–28.05 s | 12.62–13.88 s |
| `watches`, full, with reuse | 29.00 s | 18.61–18.99 s | 19.27 s |
| `watches`, `--fix`, with reuse | not measured | not measured | 15.44 s |
| `watches`, full, smoke and privacy run again | 54.49 s | 47.18 s* | 40.72 s* |
| root | 9.02–9.17 s | 6.17–6.25 s | 5.98 s* |

Each range is 2 or 3 runs; a single value is one run. With the split,
`--quick --fix` still used one worker, so its "Split" column is its time
before the phases, with the walks already pruned (they save about 2.4 s of
a serial run). Quick mode takes 51% less time, and `--quick --fix` about
half. All runs passed every check. A value with * is a run of `validate.py`
in the terminal, after `tools/` changed; its output is not saved. The other
runs are in `evidence/`.

The machine was busier during the later runs: load average 10 to 14 for
the "Split" runs, against 4 to 10 for the "before" runs
(`evidence/before-load.txt`, in the order quick 1–3, full 1–2;
`evidence/after-load.txt`; `evidence/fix-load.txt` for the `--fix` runs and
the "Phases" column). These are single
measurements on one machine (Apple silicon, 12 cores, 6 of them performance
cores, with browsers open), not statistical estimates. On a machine with
fewer cores, or without a GPU, the gain can differ.

The walks: `evidence/walks-compared.txt`. In `watches` and in `stem/`, the
old and new walks give the same lists; each walk takes 0.001–0.003 s,
against 0.37–1.36 s before.

Per-check wall and CPU times before the change: `evidence/cpu-per-check.txt`.

## Files

- `PLAN.md`: the question, the options with their data, and the choice.
- `evidence/before-*.json`, `evidence/after-*.json`: `validate.py --json`
  output. `before-quick`, `before-full`, `before-root`: commit `2adf76c`.
  `after-quick`, `after-full`, `after-root`, `before-fix-quick`: after the
  split. `after-fix-*`, `after-phases-*`: after the phases.
- `evidence/fix-restores-files.txt`: `--quick --fix` still fixes a Python
  and a Markdown file, with the phases.
- `evidence/prototype-quick-unpruned.jsonl`: the first prototype, 7 runs, on
  `2adf76c` as it was. It came from an earlier version of
  `tools/quick_parallel.py` with the same "each" and "serial" groupings.
- `evidence/prototype-quick-pruned.jsonl`, `evidence/prototype-full-pruned.jsonl`:
  the prototypes, on `2adf76c` with the pruned walks applied for the time of
  the measurement (an earlier form of `lib.walk_files`).
- `evidence/cpu-per-check.txt`: each check alone, and the profiles.
- `evidence/walks-compared.txt`: the old and new walks.
- `tools/quick_parallel.py`: quick-mode groupings and worker counts.
- `tools/full_parallel.py`: full-mode preparation, groupings and worker
  counts.
- `tools/quick_cpu.py`: each quick check alone, with its CPU time.
- `tools/pruned_walk.py`: the old walks (copied) against the current ones.

## Reproduce

`tools/pruned_walk.py` runs against the current project, in `stem/`:

```bash
PYTHONPATH=tools uv run python tasks/2026-11-15-parallel-source-checks/tools/pruned_walk.py watches .
```

The other three tools import `validate` and expect its groups at commit
`2adf76c` (`talk_groups` gave two quick groups, and four full ones). Run
them in a checkout of that commit, from its `watches/`, after
`pnpm install` at its root and in `watches/`:

```bash
git worktree add ../stem-2adf76c 2adf76c
cd ../stem-2adf76c/watches
PYTHONPATH=../tools uv run --project .. python /path/to/this/task/tools/quick_parallel.py 4 each
PYTHONPATH=../tools uv run --project .. python /path/to/this/task/tools/full_parallel.py 4 each
PYTHONPATH=../tools uv run --project .. python /path/to/this/task/tools/quick_cpu.py
```

To time the real command, run `uv run ../tools/validate.py --quick --json`
and `uv run ../tools/validate.py --json` in `watches/`, and
`uv run tools/validate.py --json` at the root. Run nothing else that uses
the CPU at the same time.

2026-11-16: the plan missed one shared state. Prettier (`prettier --check .`) lists every file in the talk, and mypy, which now runs at the same time, makes and deletes SQLite `-wal` and `-shm` files in `.mypy_cache/`. Prettier then failed with `ENOENT` on a file that it had listed, in 3 of 3 quick runs in `watches`, and passed when it ran alone. The talk's `.prettierignore` now names `.mypy_cache/` and `.ruff_cache/`. The phases and the worker count are unchanged.
