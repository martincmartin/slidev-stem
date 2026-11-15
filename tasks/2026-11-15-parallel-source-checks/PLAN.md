# Run the source checks in parallel

**Request (2026-11-15):** quick validation of `watches` takes about 30 s.
Why does it use only one worker, would more workers make it faster, and what
makes it faster without weakening any check? The user then asked for the two
changes that this plan recommends: run the source checks in parallel, and
prune the directory walks. After that, the user asked to make
`--quick --fix` faster too, because it is the command they use most
(section 6).

Docs read first: `AGENTS.md` ("Validate before you commit"),
`docs/talks.md` ("Check your work", "Change a house item"),
`tools/README.md` ("Validation modes"),
`tasks/2026-10-06-validation-speed/` (it chose "independent sequences
instead of a general dependency graph" and three workers), and
`tasks/2026-10-07-validation-reuse/`. `watches` is the only talk in
progress, so it is the only talk that these tools serve.

## 1. Where the time goes

Quick mode had two groups: the source checks (16 checks, one after another)
and the build. It printed "3 worker(s)", but the third worker had no work.
The source group set the wall time: its checks added up to 29.88 s, and the
run took 29.87 s. The build overlapped only its first 5 s.

The source checks were one sequence because of `--fix`: ruff and Prettier
then rewrite files that the other checks read. Without `--fix`, no source
check writes into the project:

- ruff and Prettier run with `--check`.
- The three `art:generated` scripts write nothing with `--check` (each
  script's `main`).
- `scenecheck` writes only into the temporary work directory.
- No test file writes into the talk (a search for file writes found none).
- The build writes into a temporary directory, and it already ran in
  parallel with the source checks.

The tool caches are the one shared state. `ruff format` and `ruff check`
write the same `.ruff_cache`, so the four Python checks stay one group.
They take 1.9 s in `watches` and 3.2 s at the root. mypy is the only writer
of `.mypy_cache`.

Each check alone, wall and CPU time (`evidence/cpu-per-check.txt`):

| Check | Wall | CPU |
| --- | ---: | ---: |
| lint | 7.6 s | 13.2 s |
| test | 6.0 s | 33.9 s |
| build | 4.2 s | 11.4 s |
| typecheck | 2.9 s | 5.4 s |
| prettier | 2.4 s | 4.7 s |
| generated | 2.5 s | 2.5 s |
| palette | 2.4 s | 2.4 s |
| pyright | 1.6 s | 2.6 s |
| talk setup | 1.2 s | 1.2 s |
| 8 others | 2.1 s | 3.1 s |
| total | 32.8 s | 80.5 s |

`talk setup` and `palette` spent most of their time in two directory walks:
`talkcheck.deck_files` and `lib.talk_source_files`. Each `Path.rglob` read
45,036 directory entries, most of them in `node_modules`, and then the
filter dropped them. `validate.py` also calls `deck_files` (for the spelling
check) before any check starts, so every mode waited 0.56 s for it.

## 2. Options

Each option below keeps every check and every file that a check reads.

### A. One group for each source check, when `--fix` is not set

The prototype (`tools/quick_parallel.py`) gives each check its own group
and starts the longest first. Three rounds, with the pruned walks (option
B) applied (`evidence/prototype-quick-pruned.jsonl`):

| Groups, workers | Round 1 | Round 2 | Round 3 |
| --- | ---: | ---: | ---: |
| today's, 1 | 28.70 s | 38.38 s | 29.32 s |
| today's, 3 | 26.19 s | 25.81 s | 25.26 s |
| one per check, 3 | 14.41 s | 13.58 s | 14.01 s |
| one per check, 4 | 13.79 s | 13.09 s | 12.61 s |
| one per check, 6 | 20.28 s | 14.01 s | 13.53 s |

Full-mode preparation (no smoke navigation; `tools/full_parallel.py`,
`evidence/prototype-full-pruned.jsonl`), two rounds:

| Groups, workers | Round 1 | Round 2 |
| --- | ---: | ---: |
| today's, 3 | 34.65 s | 37.32 s |
| one per check, 3 | 31.15 s | 31.97 s |
| one per check, 4 | 28.10 s | 28.74 s |
| one per check, 5 | 31.74 s | 30.40 s |

All checks passed in all 39 prototype runs (these 32, and 7 runs before
the walks were pruned: `evidence/prototype-quick-unpruned.jsonl`).

- Pro: quick mode takes about half the time. Full mode saves 6 to 9 s.
- Pro: the code stays a list of independent sequences. With `--fix`, the
  run is serial (one worker), so the groups run in list order, and ruff and
  Prettier come first, as before.
- Con: more checks compete for the CPU. In full mode, the browser checks
  get slower (the private-browsing check went from 17 s to 19–21 s). No
  check failed, but 6 full-mode runs is a small sample.

### B. Prune the directory walks

`tools/pruned_walk.py` compares the current walks with walks that do not go
into a skipped directory. The file lists are identical (in `watches`, 1 deck file and 140
source files; `evidence/walks-compared.txt` checks `stem/` too). `deck_files` goes from 0.558 s to 0.001 s,
and `talk_source_files` from 1.364 s to 0.002 s. `doccheck.py` already
prunes its walk in this way, but it imports nothing from the house
("Stdlib only"), so it keeps its own walk.

- Pro: every mode starts 0.56 s sooner, and `talk setup` and `palette` use
  2.4 s less CPU.
- Con: none found. The existing tests of the walk's rules apply unchanged.

### C. Four workers instead of three

With option A, 4 workers were best in both modes (tables above): about
1 s faster than 3 in quick mode and about 3 s in full mode. Six workers
were slower, because the checks compete for the CPU.

### D. ESLint threads (`--concurrency auto`)

Alone, lint goes from 7.5 s to 6.4 s. In the parallel run there was no
gain: 13.33 s and 13.36 s, against 13.09 s and 12.61 s without it. The
other checks already use the cores. Not done.

### E. Lower priority for the short checks (`nice -n 5`)

13.09 s and 12.39 s, against 13.09 s and 12.61 s without it: no gain
larger than the noise. Not done.

### F. ESLint `--cache`

This makes a check weaker. The typed rules read the types of other files.
ESLint's cache keys each file on its own content and the config, so a type
change in one file can leave a stale pass on another, unchanged file. Not
done.

### G. One process for all the tests (`--test-isolation=none`)

This makes a check weaker: the test files would share module state. It
also runs them one at a time. Not done.

### H. Not measured, for later

- `vue-tsc --incremental`: TypeScript's own build information. Typecheck is
  not on the critical path, so it would save CPU only.
- `art/diving_board.py --check`: 2.5 s of pure-Python geometry. A faster
  version must give byte-identical output. Not on the critical path.
- `prettier --cache`: I do not know if its cache key includes the Slidev
  plugin's version. Until that is known, it can weaken the check.

## 3. Ranking and choice

1. **A**: it removes most of the time (quick 30 s to about 13 s), with no
   check removed.
2. **B**: small, but in every mode and with no cost.
3. **C**: about 1 to 3 s, measured on this machine only.

D and E give nothing measurable. F and G weaken a check. Do A, B and C.

After A, lint is the critical path: 7.0 s alone, 12.6–13 s with the other
checks. The checks use about 77 s of CPU in total, so about 13 s is near
the limit of this machine (12 cores, 6 of them performance cores). A larger
gain must cut CPU work. The test step is the largest user (34 s of CPU).

## 4. Design

This was the first design. Section 6 changes its `--fix` parts: ruff and
Prettier are now a phase of their own, and the groups after them run in
parallel.

- `validate.py` gives each source check its own group, and the four Python
  checks one group. This is the same with and without `--fix`. `--fix`
  runs with one worker, so the groups then run in list order. The list
  puts ruff and Prettier first, then the other checks, longest first.
- The order of the groups: without `--fix`, the long sequences first (the
  build and the checks of the built deck, then the stills), then the
  source checks, then the SVG checks. With `--fix`, the source checks
  first, as before.
- `typescript_checks` lists lint, test, typecheck, longest first in
  `watches`.
- The root run gets the same split. Its critical path was the TypeScript
  group: typecheck, lint and test one after another, 9.2 s.
- `lib.walk_files` is the pruned walk. `lib.talk_source_files` and
  `talkcheck.deck_files` use it.
- `DEFAULT_WORKERS` becomes 4.

## 5. Verification

- The existing tests pass. New tests: without `--fix`, no group holds two
  source checks, apart from the Python checks; with `--fix`, ruff and
  Prettier come before each check that reads the files.
- The walk's existing tests pass, and the file lists in `watches` stay the
  same (`tools/pruned_walk.py`).
- Full validation at the root and in `watches`.
- Timings before and after, with the real command, in `evidence/`.

## 6. `--fix`

**Request:** `uv run ../tools/validate.py --quick --fix`, in `watches/`, is
the user's usual command, and it said "1 worker(s)". `main` gave the pool
one worker whenever `--fix` was set, so the split of section 4 did not help
it: all 17 checks still ran one after another. Three runs took 23.46 s,
23.74 s and 28.05 s (`evidence/before-fix-quick-*.json`, with the walks of
option B).

The one worker was there to keep the readers from reading a file while ruff
or Prettier writes it. That need is real, but it holds only between the
rewriters and the readers:

- ruff writes only Python files.
- Prettier has no parser for Python or TOML (`prettier --file-info` on
  `art/favicon.py`, `tools/lib.py` and `pyproject.toml` gives
  `"inferredParser": null`), so `prettier --write` does not write them.
- mypy and pyright, which read Python, are in ruff's group, after ruff.

So ruff and Prettier can run at the same time, and the other checks can
run in parallel after both end.

### Options

- **A. Phases.** A phase is a set of groups that run at the same time; the
  next phase starts when it ends. With `--fix`, ruff's group and Prettier
  are the first phase. Then come all the other checks, as without `--fix`.
  Smoke navigation becomes the last phase, alone, as before.
  Phase 1 takes about 2.2 s (Prettier). Then the rest runs as in quick mode.
- **B. Like A, but ruff and then Prettier, one after another.** Safe even
  if the two wrote the same files, but they do not. It costs about 1.9 s.
- **C. A dependency for each kind of file.** For example, a check that
  reads only TypeScript waits for Prettier only. More code, and the gain
  is under 2.2 s, the length of phase 1.
- **D. Keep one worker.** 23.5–28.1 s.

### Choice

A: it removes most of the time, with the least code. The phases also
replace the special case for smoke navigation ("exclusive" groups) in
`run_groups`: smoke navigation is the last phase. The functions are renamed
for what they now give: `talk_phases`, `house_phases`, `source_phases` and
`run_phases`.

### Verification

- The tests check that, with `--fix`, the first phase is exactly ruff's
  group and Prettier, and that lint is in a later phase; and that without
  `--fix`, smoke navigation is a phase of its own.
- `--fix` still fixes: a Python file and a Markdown file with broken
  formatting came back byte-identical (`evidence/fix-restores-files.txt`).
- Timings: `evidence/after-fix-*.json`, `evidence/after-phases-*.json`, and
  the README.
