# Phase 8 evidence, 2026-11-01

These files record the article, print, privacy, and visible-window checks.
Read them when revisiting phases 7 and 8 of the production plan.
The physical Android Firefox check is still open.

## Files

- `source.tar.gz`: the tested source, package pins, house files and task checks.
  It excludes dependencies, generated output, other talks and older tasks.
- `source-files.json`: SHA-256 hashes of the files in that source copy.
- `build-comparison.json`: the comparison of the tested build with work2's build.
- `validation.log`: the final full validation in work2, with print enabled.
- `article-checks.json`: three engines, normal and reduced motion, phone-sized
  layouts, paused steps and the static page without JavaScript.
- `print-counts.json`: the printed voyage's last four counts in each engine.
- `frame-timing.json`: five Part 2 changes in each engine and window size.
- `house-windows.json`: the house tool's opening-slide window check.
- `phone-check.json`: the physical device check and its limit.
- `paused-step-before.log`: the regression on the build before the endpoint fix.
- `article.md`: the narration text and figure plan that were checked.
- `screenshots/`: the initial and final voyage states. Every saved image was
  inspected. The initial state has the ship near the bottom and no east/west
  route. The final state has the complete route and count 72. Neither has a
  punchline screen. `no-js-voyage-final.png` has no controls.

## Results

Full validation, including print, passed. The article matrix passed in
Chromium, Firefox and WebKit. The count reaches 12, 66 and 72. Gusts stop
when paused. The ship returns to its start on a backward step.
Reduced motion shows targets at once. Screenshots wait for the 0.4 s text
fade to settle. The static article keeps the complete final map.
The printed voyage counts are 12, 66, 72 and 72 in every engine.
No check requested an outside resource. Canvas pixel reads were blocked
throughout the live article matrix.

The source bug was a missed final frame in a paused figure. The old build
failed the new privacy regression in Firefox and WebKit; Chromium passed
that run. The fixed build passed all three. Manual pauses retain their
last picture, so the prerender still avoids redrawing every figure.

The six desktop/phone reduced-motion captures replaced early screenshots
that still showed their outgoing labels during the text fade. The normal
motion checks did not change. The JSON combines both successful runs.

## Visible window timing

The Part 2 timing run was separate from other browser checks, on an Apple
M3 Pro. Each engine used a fresh browser. The laptop viewport was
$1728 \times 980$ CSS px at ratio 2; the projector was
$1920 \times 1080$ at ratio 1. These are browser windows on this Mac,
not measurements from a physical projector.

| Engine | Median frame gap, ms | Largest per-change JS 95th, ms | Largest per-change gap 95th, ms | Gaps over 25 ms |
| --- | ---: | ---: | ---: | ---: |
| Chromium | 8.3 | 3.7 | 9.3 | 20 / 5793 (0.35%) |
| Firefox | 8.34 | 6 | 16.68 | 25 / 5610 (0.45%) |
| WebKit | 17 | 6 | 18 | 28 / 2909 (0.96%) |

Chromium and Firefox have median gaps near 120 Hz. Their JS times fit
within the 8.3 ms budget at the 95th percentile. This measures the stage
and its SVG listeners, not a separate GPU completion time. Firefox misses
some 120 Hz frames. WebKit runs near 60 Hz here; this does not establish
120 Hz performance in Safari itself. The JSON preserves each change and
browser version. Startup and triangulation are outside these frame samples.

The house opening check ran separately after the other browser checks
finished. Each window kept one WebGL context, lost none, and drew at the
canvas's visible device size. Its walk covers the cover and Hairspring;
`measure-frames.ts` supplies the Part 2 measurements.

## Phone limit

The phone-sized checks use desktop engines at $393 \times 851$ CSS px,
ratio 2, with touch enabled. They check layout and controls, not Android
Firefox's mobile compositor or performance. The page has no horizontal
overflow in those profiles. Map labels are small, as `docs/article.md`
already states. The physical phone could not reach the LAN preview.
That check remains incomplete; no phone frame timing is claimed.

## Reproduce the article and timing checks

Extract `source.tar.gz` into an empty directory. Install its locked packages
at the root, then in `watches/`. Use the pinned runtimes. The source copy
holds the build and check inputs. Older task archives are not included,
so historical documentation links cannot all be checked from this copy.

From `watches/`:

```bash
pnpm exec slidev build --out /tmp/part2-deck
pnpm exec node addons/narration/prerender.ts /tmp/part2-deck
pnpm exec node tasks/2026-10-31-part-2-production/checks/check-article.ts /tmp/part2-deck /tmp/part2-article
pnpm exec node tasks/2026-10-31-part-2-production/checks/check-print.ts /tmp/part2-deck /tmp/part2-print
pnpm exec node tasks/2026-10-31-part-2-production/checks/measure-frames.ts /tmp/part2-deck /tmp/part2-frames
```

The timing script opens visible windows. Do not use the computer during it.
For only the reduced-motion captures, add `--reduced-only` to the article
check. Run the house opening check at the root:

```bash
uv run tools/deck_check.py watches --slides 'What Every Nerd Should Know About Mechanical Watches,Hairspring' --out /tmp/part2-house windows
```

The fresh work2 build has 203 files. Its referenced application assets
match the tested build after the house tool removes Vue scope IDs and
content hashes. Raw build bytes differ across checkout paths. The comparison
excludes stale assets left by earlier temporary builds and the prerender.

The implementation and final validation are in `work2`, from `4d8e1c8`.
Initial article checks used the same source in `work1`. All transferred
files were compared byte for byte; work1 was left clean. No commit was made.

2026-11-01: The user later confirmed that the physical Android Firefox check
works. See [the confirmation](../phase-8-android-firefox/README.md). The
pending status above records the earlier checkpoint.
