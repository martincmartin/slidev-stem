# Full validation and a fast navigation alternative

Measured on 2026-10-07 at commit `f1ccbcc6dd4e33bdc845ad207d1a47df6359027d`.
Profiling kept production files unchanged. The approved implementation is recorded below. The full deck has 36 slide-and-click positions.

The current contracts are in [talks.md](../../../docs/talks.md),
[navigation.md](../../../docs/navigation.md), and
[tools/README.md](../../../tools/README.md).
The [earlier optimization](../../../tasks/2026-10-06-validation-speed/PLAN.md)
already removed repeated browser launches and several fixed rendering waits.
New evidence here measures the current deck and a reduced navigation check.

## Measured full validation

Both runs passed all 22 checks.

| Configuration | Elapsed time | Navigation and offline | Build and print |
| --- | ---: | ---: | ---: |
| Default, two workers | 271.84 s | 199.95 s | 71.88 s |
| Four workers | 273.50 s | 195.95 s | 77.55 s |

These are two local measurements, not a timing distribution.
An unrelated validation process was observed during the first run.
The second run overlapped briefly with the smoke experiment near its end.
Do not interpret their small difference as a reliable worker-count effect.
Neither measurement supports increasing the worker count for this deck.

Default check times:

| Check | Time |
| --- | ---: |
| Navigation and offline | 199.95 s |
| Print | 68.58 s |
| Build | 3.30 s |
| Stills and renderer browser checks | 4.13 s |
| ESLint | 3.95 s |
| Generated-file checks | 2.64 s |
| SVG motion | 1.93 s |
| Pyright | 1.87 s |
| Palette | 1.57 s |
| TypeScript types | 1.19 s |
| SVG legibility | 1.17 s |
| Prettier | 1.13 s |
| Talk setup | 1.05 s |
| Unit tests | 0.60 s |
| PNG legibility | 0.48 s |
| PNG motion | 0.38 s |
| Scene grammar | 0.28 s |
| Mypy | 0.24 s |
| Ruff format | 0.07 s |
| Documentation | 0.07 s |
| SVG source checks | 0.06 s |
| Ruff lint | 0.02 s |

Check times overlap. The source sequence totals 14.75 s.
SVG checks total 3.11 s. Stills and their pixel checks total 4.99 s.
These sequences finish before build and print finish.
Their removal would provide little or no elapsed-time saving under this schedule.

Navigation starts after preparation. It accounts for 73.6% of elapsed time.
It performs 35 forward moves, 35 backward moves, and 36 direct-load comparisons.
It then performs a rapid forward walk at the larger viewport.
Reported forward and backward move times sum to approximately 112.3 s.
Those times include the quiet period and are rounded to tenths of a second.
The remaining 87.6 s includes setup, pre-press waits, direct loads, and the rapid walk.
Those components were not timed separately.

The sampler requires 600 ms without a state change after animations finish.
Every key press also has a 100 ms pre-press observation period.
Direct loads use the same 600 ms observation rule.
The existing rapid walk has a 1.5 s startup delay and 500 ms between presses.

## Measured smoke alternative

The experiment uses the standalone offline walk with 100 ms between presses.
It retains the 1.5 s startup delay, request blocking, and existing failure conditions.
The full 36-position deck remains in the experiment.
Only the copied tools were changed.

| Browser | Smoke walk | Separate build |
| --- | ---: | ---: |
| Chromium | 9.34 s | 2.99 s |
| Firefox | 7.47 s | 2.55 s |

Both walks reached `/8?clicks=5`, visited 36 positions, and reported zero outside requests.
The smoke time includes browser startup and shutdown. It excludes the build.
Full validation already builds the deck, so a replacement can reuse that output.
The Chromium walk overlapped briefly with the end of the four-worker full run.
Firefox was measured after that full run completed.

Replacing the default navigation stage with the measured Chromium smoke stage
would reduce its runtime by approximately 95.3%.
Keeping the measured preparation time gives a projected full runtime of 81.23 s.
Running both browser smoke walks gives a projected full runtime of 88.70 s.
These totals are estimates, not measured replacement-validator runs.
Print would then be the largest cost.

The smoke walk checks startup, page errors, outside requests, movement, and a bounded walk.
It does not check transition continuity, overshoot, settled backward state, or direct-load equality.
It can miss errors that occur after its short visit to a position.
The generic walk detects an end when the URL stops changing.
It does not independently verify the expected final slide and click.
This experiment reached the expected end, as established by the full run.
A production replacement should verify the declared final position or expected position count.
It should also wait for the URL to change after each key press before declaring an early end.
These guards are proposed improvements; they were not added to this timing experiment.

## Ranked recommendation

1. Use the rapid smoke walk for default validation.
   Its measured cost is 7.5–9.3 s per browser.
   Retain the slow suite as an explicit diagnostic command for navigation changes.
   Add the completion guards described above.
   This gives the largest measured saving while retaining basic integration checks.
2. Add a rapid backward walk if a 15–25 s browser budget is acceptable.
   This range is an estimate. It can catch crashes and navigation stalls on the return path.
   It still cannot prove equal settled states or continuous animation.
3. Keep a few targeted slow regressions for known navigation defects.
   Cover the board curl and the watch view change in both directions.
   Select cases by failure history, rather than walking every click slowly.
   Runtime depends on the chosen cases and has not been measured here.
4. Shorten the quiet period if the complete slow suite must remain.
   Reducing 600 ms to 200 ms across approximately 109 sampler calls
   could save roughly 44 s. This is a source-based estimate.
   It reduces the observation window and needs defect fixtures before adoption.
   The suite would still wait for every real animation.

The three palette previews repeat the same hairspring story.
They add 12 positions and repeat its long animations forward and backward.
Remove them after the palette decision, or keep them in a separate comparison deck.
This changes content coverage. No removal timing was measured.

Do not cut the source checks for speed: they are off the current critical path.
Static legibility and motion also enforce different failure gates.
Deleting all browser checks would lose startup and offline integration coverage for little benefit over smoke testing.

## Evidence and reproduction

- `evidence/full-default.json`: complete default run, results, and timings.
- `evidence/full-jobs4.json`: complete four-worker run.
- `evidence/smoke-chromium.json` and `smoke-firefox.json`: timed smoke commands and output.
- `evidence/smoke-build-setup-failure.json`: initial snapshot setup failure, not a deck failure.
- `inputs/`: tool, deck, source, theme, and lockfile copies.
- `inputs/slides-without-previews.md`: unmeasured content alternative.
- `run_browser_chain.py`: experiment harness.

The snapshot reuses local installed dependencies through symlinks.
For a separate machine, install from the copied lockfiles instead.
The harness calls the installed Slidev executable directly for the snapshot build.
This avoids pnpm trying to install into the snapshot's dependency symlink.

From watches:

```bash
uv run ../tools/validate.py --json
uv run ../tools/validate.py --jobs 4 --json
uv run tasks/2026-10-07-full-validation-profile/run_browser_chain.py \
  --smoke --output /tmp/smoke-chromium.json
uv run tasks/2026-10-07-full-validation-profile/run_browser_chain.py \
  --smoke --browser firefox --output /tmp/smoke-firefox.json
```


## 2026-10-07: approved implementation

The user approved smoke navigation as the full-validation browser walk.
Exhaustive navigation is excluded from every validation mode.
Run it only when an actual navigation problem is found or suspected.
Do not run it routinely, including before commits or after ordinary navigation changes.
This instruction supersedes the earlier ranked recommendations in this report.

Full watches validation passed all 22 checks in 84.68 s.
The guarded production smoke stage took 11.85 s and visited all 36 positions.
This reduced full runtime by approximately 68.9% from the measured baseline.
Both Chromium and Firefox reached the final position, `8:5`, with zero outside requests.
No exhaustive diagnostic was run to verify the implementation.

The Ledger probe declares each next position and the final slide and click.
The smoke tool waits for each expected URL change, detects repeated positions,
and rejects an early stop. It retains startup and page-error checks and outside-request blocking.
The tests cover delayed URL updates, navigation stalls, early ends, missing metadata,
page errors, and outside requests.
A scheduling regression proves that neither validation mode invokes `navcheck.py`.

`implementation/` holds copies of the implemented tool, probe, tests, and policy.
`evidence/full-smoke-implemented.json` holds the full watches validation result.
The original profiling inputs remain unchanged.
No commit was made during the implementation phase.


## 2026-10-07: integration with main

The user approved a rebase, commit, and push.
The branch fast-forwarded to `9ad4d34`, which added validation-result reuse.
Reuse now applies to print and smoke navigation. Exhaustive navigation remains diagnostic only.
The integration tests check both validation modes with and without a pass record.
`implementation-rebased/` holds the merged tool, tests, and current policy copies.
`rebased-inputs/` holds the source changes brought in from main.
The earlier profiling and implementation copies remain unchanged.

After integration, full watches validation passed all 22 checks in 80.19 s with reuse disabled.
The smoke stage took 10.43 s and visited 34 positions; main had removed two trial clicks.
Firefox also visited all 34 positions and reached `8:5` with zero outside requests.
Shared full validation passed all eight checks in 8.48 s.

## 2026-10-22: screenshot deleted

The copies of `docs/text-display/disco-elysium.png` (a screenshot of the game _Disco Elysium_) are deleted from this task, because the repo is to be public and holds only images that are generated, public domain or CC-licensed. The report that showed it now links to a screenshot on the web. The task does not need the image: its results do not depend on it. If you really need it, it is in the git history: `git show e5510d0:docs/text-display/disco-elysium.png > disco-elysium.png`.

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).

2026-10-23: the smoke check is now TypeScript, `tools/smokecheck.ts`, with the
same walk, limits and failures. It serves the deck at an https origin, as
GitHub Pages does, with a stand-in screen wake lock, and prints each engine's
result in order after all three finish. `tools/offline_check.py` is now
`tools/offline-check.ts`.
