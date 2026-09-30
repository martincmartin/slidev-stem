# Code-quality review: flexing ruler

**TASK_DIR:** `/Users/martin/Develop/slidev/stem/watches/tasks/2026-09-30-flexing-ruler`  
**Repository:** `/Users/martin/Develop/slidev/stem`  
**Recommendation:** Request changes for three medium-severity correctness issues. Retain the current SVG/SMIL design.

## Scope

I reviewed the local diff and these three added implementation files:

- `watches/art/flexing_ruler.py`
- `watches/components/FlexingRuler.vue`
- `watches/public/flexing-ruler.svg`

The tracked changes cover `docs/webgl.md`, `tools/artcheck.py`, `watches/docs/slide-patterns.md`, `watches/slides.md`, and `watches/watch/state.ts` and `state.test.ts`.

I read the task’s `PLAN.md` and `README.md` first. I used unchanged adjacent code and installed Slidev code to assess integration. Findings concern behavior introduced by this task.

I wrote no files.

## Findings

### 1. Medium — Hidden slides continue playback and can start an unrequested sequence

**Locations:** `watches/components/FlexingRuler.vue:22–25,32–41,52–53`; `watches/slides.md:53`

The component starts and stops its clock only when `playing` changes or the component unmounts. Slide visibility and slide activity do not control it.

Slidev keeps preloaded slides mounted:

- `watches/node_modules/@slidev/client/internals/SlidesShow.vue:62–65` retains preloaded routes.
- Lines `93–98` hide inactive slides with `v-show`.
- `watches/node_modules/@slidev/client/composables/useNav.ts:315–337` caches each route’s click context. Its getter returns `CLICKS_MAX` when the current slide follows that route.

This causes two concrete problems:

1. **Playback continues after leaving.** Returning to slide 2 at its final click leaves `playing` true. The watcher does not restart the sequence. The audience sees an elapsed animation instead of the turn, clamp, and pull.
2. **Skipping the slide can start playback off-screen.** Once slide 2 is mounted, navigating to a later slide gives it its final click state. `$clicks >= 3` becomes true even if the speaker never played the sequence.

The second case follows from the inspected Slidev code. It was not tested through full-deck navigation.

**Observed evidence:** In the actual-component harness, hiding the wrapper advanced the clock over approximately 450 ms:

| Browser | Before hiding | While hidden |
| --- | ---: | ---: |
| Chromium | 0.1487 s | 0.5987 s |
| Firefox | 0.155 s | 0.605 s |

Revealing the wrapper preserved the elapsed time. Ordinary `playing: true → false` reset the clock to zero in both browsers.

**Recommended change:** Control playback with slide activity as well as the props. Stop and reset on slide exit. Restart from zero when an active slide enters the playing state. Restrict live playback to the intended slide/presenter contexts.

A watcher on `visible` alone will not solve this: Slidev’s outer `v-show` can hide the slide while `visible` remains true.

### 2. Medium — Print/export runs the ruler and retains the replaced hairspring

**Locations:** `watches/components/FlexingRuler.vue:8,32–41,52`; `watches/slides.md:47–53`; `watches/watch/state.ts:54–61`

The component comment promises a face-on still in print/export. The implementation does not check print mode or render context.

Slidev’s default print rendering supplies the final click state through `createFixedClicks(route, CLICKS_MAX)` at `SlidesShow.vue:95`. For this slide, the final state makes both ruler props true. The component therefore starts its clock.

**Observed evidence:** Emulating print media did not stop playback:

| Browser | Before print interval | Approximately 250 ms later |
| --- | ---: | ---: |
| Chromium | 0.5987 s | 0.8654 s |
| Firefox | 0.613 s | 0.863 s |

This confirms the missing component-level print behavior. It does not constitute a full Slidev export test.

The new replacement sequence also conflicts with the existing watch-still integration. Unchanged `watches/slide-bottom.vue:16` computes `watchState($frontmatter, 0)`. Its print/export branch therefore still requests the hairspring image, although the new `watchHide: 2` hides the live watch at clicks 2 and 3.

The new final state consequently requests a visible ruler **and** the old hairspring still. This is an integration defect introduced by adding `watchHide`; it is not an unrelated finding against unchanged code.

**Recommended change:**

- In print/export, pause the ruler and seek to the documented face-on state.
- Decide whether to show the watch still from the rendered slide’s click state, so `watchHide` also applies there.
- Preserve the layout marker’s live-fade role when adjusting still visibility.

Full-deck rendering must confirm the final composition after these changes.

### 3. Medium — A supplied frame rate changes the pull duration incorrectly

**Locations:** `watches/art/flexing_ruler.py:255–256,293–297,310–312,382,419`

`build()` accepts a `Timeline`, but `frame_count()` reads the global `TIMELINE.frames_per_second`. The builder then converts those counts to durations with the supplied timeline’s frame rate.

The two calculations use different configurations.

**Confirmed evidence:** With `frames_per_second=60`, the edge animations have these timings:

| Phase | Begin | Actual duration | Intended duration |
| --- | ---: | ---: | ---: |
| Turn | 0 s | 1 s | 1 s |
| Pull and hold | 1.9 s | **0.8 s** | **1.6 s** |
| Swing | 3.5 s | 1.5 s | 1.5 s |

The pull/hold animation ends at 2.7 s. The swing still begins at 3.5 s. Changing sampling density has unintentionally changed the motion timing.

The default configuration does not expose this defect because both frame-rate values are 30.

**Recommended change:** Pass the selected frame rate into every frame-count calculation, or make frame counting a method of the supplied timeline. Use the intended phase duration directly for SMIL timing, so sample-count rounding does not alter it.

A regression check should verify that 30 fps and 60 fps retain the same phase boundaries.

## Strengths

- **The geometry and playback have clear responsibilities.** Python produces the shapes. Vue controls the clock. Slide frontmatter controls the presentation sequence.
- **The configuration objects are frozen and descriptive.** Timeline properties compute phase boundaries instead of storing duplicate start times.
- **The centreline construction preserves length.** It integrates fixed-length segments through the bend. Targeted measurements at $-26^\circ$, $0^\circ$, and $+26^\circ$ gave 500.0, 500.0000000000001, and 500.0 px.
- **Pull and release share the same shape calculation.** This avoids a separate release shape that could introduce a position jump.
- **The turn uses a coherent orthographic projection.** The face contracts while the thickness becomes visible. The face disappears at the edge-on endpoint.
- **The SVG remains inspectable and self-contained.** It uses paths and local SMIL timing. The generated output is 84,873 bytes, approximately 82.9 KiB.
- **The `watchHide` state change is small and consistent.** It validates a non-negative integer and reuses the existing hidden-watch state. Its tests cover the threshold and invalid types.
- **The art-check change handles the relevant semantic distinction.** SMIL `fill="freeze"` controls timing; it is not a paint colour.
- **Backward SMIL seeking worked in both tested browsers.** Seeking back to zero restored the face. The evidence does not support a general SMIL reset defect.

The length-preserving shape uses the first-mode slope as its angle profile. It is a useful illustration model, not an exact large-deflection beam simulation.

## Lean improvements

These are lower priority than the three findings.

1. **Fix the lint suppression location.**  
   `watches/components/FlexingRuler.vue:57` does not suppress the directive warning at line 63. Move the suppression so it applies to that directive. The asset is trusted local content; this is not an XSS finding.

2. **Use Vue’s explicit DOM-update primitive.**  
   At `watches/components/FlexingRuler.vue:49`, prefer `await nextTick()` over `await Promise.resolve()`. It states the intended contract directly.

3. **Remove or use the inactive design setting.**  
   `RulerDesign.clamp_width` at `watches/art/flexing_ruler.py:93` is never read. Clamp construction instead uses the fixed offset at line 341. A named setting should affect the output; otherwise, remove it.

4. **Clarify byte-level reproducibility if required across operating systems.**  
   The current `--check` passes. However, `read_text()` normalizes line endings, and `write_text()` uses platform-default newline handling. Explicit UTF-8 bytes would provide a stricter cross-platform byte contract.

No broad refactor or new dependency is needed.

## Alternatives, ranked

| Rank | Approach | Reasons and trade-offs |
| --- | --- | --- |
| **1** | **Retain generated SMIL and the manual clock; fix lifecycle, print, and configuration handling** | Smallest change. Keeps the 84,873-byte asset, existing art checks, and demonstrated two-browser seek/reset behavior. Manual seeking still occurs once per animation frame; its full-deck cost remains unmeasured. |
| **2** | Retain SMIL and use its native running clock between clicks | Could remove the per-frame JavaScript seek loop. Still needs activity, print, reset, and re-entry handling. Browser timing behavior needs fresh verification; no performance gain has been measured. |
| **3** | Generate and update SVG geometry in TypeScript | Removes sampled path data and gives direct control of geometry. Moves established Python math into runtime code and creates a larger testing burden. No evidence shows that the current asset size warrants this change. |
| **4** | Move the ruler into WebGL | Reuses the watch renderer, but requires new geometry and drawing integration for a simple side-view illustration. It also departs from the requested SVG deliverable. |

A self-playing `<img>` is unsuitable. It does not provide the required click-controlled SVG clock and exact reset.

**Preferred direction:** Keep SMIL. Fix its ownership and integration rather than replace the renderer.

## Validation evidence

The following targeted results were supplied for this review:

| Check | Result |
| --- | --- |
| `pnpm test` | PASS, **42/42** |
| `pnpm typecheck` | PASS |
| `pnpm lint` | Exit 0; **one** misplaced-suppression warning |
| Generator `--check`, with bytecode writes disabled | PASS |
| Ruff lint and format checks, with caches disabled | PASS |
| `artcheck` on `public/flexing-ruler.svg` | PASS |
| `git diff --check` | PASS |
| Non-default frame-rate check | Confirmed finding 3 |

### Browser evidence

Tests used an **in-memory harness**, not the full deck. It compiled the actual current Vue component and served the actual SVG and Vue runtime through Playwright interception.

Both Playwright Chromium and Firefox showed:

- Initial clock time zero.
- Clock advancement during playback.
- Reset to zero when `playing` became false.
- Continued playback under a hidden wrapper and print media.
- No browser page errors.

The actual generator output also received standalone SVG checks in both browsers. Seeking through `0, 1, 1.9, 3.5, 3.65, 4, 5, 0` produced consistent bounding boxes and face-display states. Times 3.5 s and 5 s gave the same repeat bounding box.

### Limits and task-document claims

No full new Slidev build or canonical validation run occurred. Those commands can update repository caches and were deliberately excluded by the review’s write restrictions.

Therefore, this review does **not** establish:

- Full-deck navigation and re-entry behavior through browser interaction.
- Full print/export composition.
- Offline operation of the built deck in Chrome and Firefox.
- Full-deck animation performance or back-row motion legibility.

`TASK_DIR/PLAN.md:50–52` states that canonical validation passed. I treat that as an existing task-document claim, not a result reproduced here.

The supplied checks and inspected Slidev sources are sufficient for these findings. **No inputs are missing.**

## Conclusion

The core geometry and SVG approach are sound. The main defects concern when the animation runs and how its state reaches print/export. One configuration defect also couples sampling density to motion duration.

Fix those three issues, retain the current SMIL design, and verify the affected behavior in the full deck when write-enabled validation is permitted.
