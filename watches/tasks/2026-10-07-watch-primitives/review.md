# Watch primitives source review

**Task directory:** `/Users/martin/Develop/slidev/stem/watches/tasks/2026-10-07-watch-primitives`

**Reviewed:** the working tree against `a310e92`, on 2026-10-08.

**Recommendation:** keep the design. Fix two correctness gaps before using these primitives for arbitrary new slides. Neither gap reproduced a regression in the current deck.

## Scope and initial reading

I first read these task files:

- [PLAN.md](PLAN.md): the request, alternatives, and P1–P3 contracts.
- [README.md](README.md): the implementation cost, accepted camera change, and recorded checks.
- [evidence/compare.txt](evidence/compare.txt): the archived trace comparison.

I then read [watch.md](../../docs/watch.md), [slide-patterns.md](../../docs/slide-patterns.md), [webgl.md](../../../docs/webgl.md), and [navigation.md](../../../docs/navigation.md).

Before writing this analysis, I re-read the fitted-view, transition, and flash rules in `watch.md:385–434`. These rules define the review criteria.

The new evidence is a fresh transition trace, source validation, a successful build, and focused geometry and flash probes. The task’s existing measurements remain historical evidence.

The review covers named pieces, fitted views, the transition rule, and their integration with slides, stills, callouts, and tests. The Gears slide exercises these primitives. Its teaching content belongs to the separate Gears task. Existing balance physics, diving-board behaviour, and tick/tock presentation were not redesigned here.

## What is good

### New watch slides have a small authoring interface

The Gears slide uses a piece list, a tilt, and a transition policy. It adds no slide-specific TypeScript (`slides.md:306–317`).

The scene now exposes a wheel, its pinion, and its arbor separately. Their membership is explicit where the geometry is drawn (`watch/generate.ts:937–975`). This removes filters that depended on mesh order or geometry.

The generator tests check two useful invariants:

- Every mesh belongs to exactly one piece (`watch/generate.test.ts:137–151`).
- Each train wheel separates its wheel and hub, pinion, and arbor (`watch/generate.test.ts:153–165`).

These checks protect the authoring interface while preserving the detailed watch model.

### The transition rule is easier to reason about

The timeline computes the intermediate shown set, changes the camera, and then reaches the target set (`webgl/timeline.ts:248–300`).

A discriminated union ties each phase to its value type (`webgl/timeline.ts:81–98`). This prevents a fade phase from carrying camera values.

The renderer remains independent of watch names. Its executable code did not change. This limits the refactor’s effect on drawing, hidden lines, and GPU resources.

`watchMoveWith` belongs to the boundary between two slides. The live layer reads the later slide’s policy in both directions (`global-bottom.vue:228–231`). Thus, a reverse step uses the same presentation rule.

### Tests now read the actual deck

`watch/deck.ts:15–23` uses Slidev’s parser and merges imported pages. Tests no longer need to copy each slide’s frontmatter.

`watch/deck.test.ts:14–27` resolves each declared watch state at every declared click. It detects unknown piece and view names before presentation.

Adding `@slidev/parser` as a direct development dependency is appropriate. It already exists in the lockfile’s resolved dependency graph. The tests now declare their use of it.

### Existing transition behaviour has strong evidence

A fresh trace produced 150 scenarios:

| Comparison | Result |
| --- | --- |
| Current source against archived refactor | 150 identical; 0 different |
| Current source against archived main | 102 identical; 42 different |
| Scenarios unique to the refactor | 6 Gears scenarios |

Across the 144 shared scenarios, mesh opacity, tilt, flash membership, and sample counts agree. Only camera values differ in the 42 Escapement scenarios.

The task records an accepted placement change of about 5.7 px on the Escapement slide ([README.md:45–52](README.md#the-check-every-step-traced)). The archived montage shows clear leaders in the inspected pose. This is useful evidence, although it is not a fresh browser check.

## Findings

### F1 — P2: fitted views can clip valid tilted pieces

**Evidence:** `watch/generate.ts:1627–1646`; `watch/state.ts:210–221`.

`fittedView` computes scale from the piece’s plan width and height. It uses the height range only for the tilt pivot. The function does not receive the requested tilt.

Tilting projects some physical height onto the slide’s vertical axis. For a narrow, tall part, that contribution can exceed the available room.

This valid frontmatter reproduces the problem:

```yaml
watch: [balance staff]
watchTilt: 20
```

The geometry probe used `Motion.matrices(0.37, 0)`. It transformed the selected meshes’ triangle and line vertices, then projected them with `onSlide`, which uses the renderer’s camera.

| Piece, at 20° tilt | Projected top | Projected bottom | Projected height |
| --- | ---: | ---: | ---: |
| Balance staff | −33.575 px | 696.276 px | 729.851 px |
| Escape arbor | 62.191 px | 600.510 px | 538.319 px |
| Fourth arbor | 26.278 px | 636.422 px | 610.144 px |
| Stud | 42.288 px | 620.412 px | 578.124 px |

The slide is 552 px high. The balance staff’s fitted scale is 70. Its projected geometry exceeds both slide edges.

All singleton piece views contain finite numbers. Thus, a finite-value check does not detect this failure.

**Impact:** the existing deck’s selected subsets are not shown to clip. However, valid new slides can lose visual detail despite the fitted-view contract.

The current fitted-view test checks the Escapement subset’s stored plan box (`watch/generate.test.ts:184–211`). It does not check the projected geometry.

**Alternatives:**

| Option | Advantages | Costs |
| --- | --- | --- |
| Fit the projected 3D extent at the requested tilt | Preserves automatic framing. Handles tall parts without slide-specific code. | Requires passing tilt into the fitter. A box bound can leave some unused room. |
| Project a tighter motion envelope | Can give larger pictures than a box bound. | Adds geometry or sampling work. Requires clear coverage of motion extremes. |
| Add named views for affected pieces | Small immediate implementation. | Each new subset can require another exception. Weakens P2’s purpose. |

**Preferred:** fit a conservative 3D extent at the requested tilt. With this orthographic camera, a box’s vertical bound is:

$$
H_{\mathrm{projected}}
=
H_{\mathrm{plan}}|\cos\theta|
+
H_{\mathrm{depth}}|\sin\theta|.
$$

Use projected-geometry checks to verify containment. Preserve named views where other art requires a fixed match.

### F2 — P2: an interrupted fade can flash a half-visible piece and freeze its fade

**Evidence:** `webgl/timeline.ts:242–246` and `301–316`.

The flash code treats every mesh in `current.fade` as already on screen. It also retains a previous flash start time even when that flash has not started.

Together, these decisions can postpone completion of a fade until after a queued flash.

The focused reproduction used this sequence:

1. Show the spring at scale 1.
2. Add the balance, with a flash of the balance.
3. At 400 ms, request the same shown and flashed meshes at scale 2.

Before interruption, the balance should fade in from 0 to 800 ms. Its flash is queued from 800 to 3300 ms.

After interruption, the source produces:

| Time | Result |
| --- | --- |
| 400–800 ms | Balance opacity stays at 0.5. `phaseAt` reports `null`. |
| 800–3300 ms | The balance flashes at opacity 0.5. Its fade remains frozen. |
| 3300–4100 ms | The balance completes its fade. |
| 4100–5900 ms | The camera moves to scale 2. |

The retarget returns a flash delay of 2.9 s. The fade remains frozen for those 2.9 s.

This contradicts the rule that an interrupted fade finishes first. It also contradicts the rule that an entering piece flashes after it has faded in (`docs/watch.md:423–433`).

**Impact:** this is a public timeline-contract failure. Consecutive slides with a shared cue and different views can exercise it during rapid navigation.

The current deck trace did not reproduce this combination. The live layer also suppresses some repeated requests. Therefore, this is not evidence of a current presentation regression.

The old timeline also retained a queued flash’s start during an interrupted swap. The refactor’s new `onScreen` test adds the frozen wait. This is a lifecycle gap exposed by the more general interface.

The existing test covers a flash that has already started (`webgl/timeline.test.ts:315–321`). It does not cover a queued flash interrupted during its prerequisite fade.

**Alternatives:**

| Option | Advantages | Costs |
| --- | --- | --- |
| Separate queued flashes from active flashes | Makes the lifecycle explicit. Preserves an active cue without replaying it. | Adds a small state distinction and interruption tests. |
| Recompute every cue after interruption | Simple scheduling rule. | Can replay or extend a cue that has already started. |
| Suppress shared cues in the slide layer | Can avoid this deck path. | Leaves the reusable timeline contract broken. Adds caller-dependent behaviour. |

**Preferred:** preserve only a cue that has started. Recompute a queued cue after its fade prerequisites. Do not treat membership in `current.fade` as proof of full visibility.

## Maintainability improvements

These points are lower priority than F1 and F2.

### Keep piece identity during construction

`Solid.piece` is a string (`watch/generate.ts:180–182`). The generator then groups meshes through `Map<string, Mesh[]>` (`1505–1519`).

Consequently, a spelling error can create another valid piece instead of failing where the geometry is built.

A small piece object could hold the fixed name. Solids and added meshes could refer to that object. Names would remain necessary only at the frontmatter boundary and in reports.

This follows the project’s object-reference rule. However, I did not find a wrong current membership. A large registry or class hierarchy would cost more than it helps.

### Expand contract coverage rather than duplicating slide examples

The stored trace is valuable for preservation. It does not cover every valid combination of the new primitives.

The next tests should target:

- A tall piece’s projected containment at a nonzero tilt.
- A queued flash interrupted during its prerequisite fade.
- An already-active flash interrupted after it starts.

The first two probes found failures that the existing preservation trace missed. More copies of current slide frontmatter would add less coverage.

## Custom-layout audit

The talk and Ledger theme contain no custom `layouts/*.vue` files.

| Layout or customization | Decision | Reason |
| --- | --- | --- |
| Default layout for watch slides | Keep | Supplies the normal title and subtitle. The art lives in the shared layer. |
| Built-in `full` layout for “Before clocks” | Keep | Its composition remains beside its content. No layout component is needed. |
| Slide classes and local styles | Keep | They express slide-specific placement without another component interface. |
| Positioned watch-slide rule | Keep | `global-bottom.vue:329–331` puts text above positioned stills. Removing it can break paint order. |
| Proposed shared watch layout | Do not add now | P1–P3 need no layout abstraction. It would add a file and interface without removing a distinct behaviour. |

This agrees with the [slide-patterns rule](../../docs/slide-patterns.md#the-theme): use built-in layouts and keep specific composition near the slide.

## Overall design alternatives

| Approach | Advantages | Costs and limits |
| --- | --- | --- |
| Keep P1–P3 and fix F1/F2 | Retains frontmatter-only watch composition. Keeps one transition model. | Requires two focused contract fixes. |
| Keep P1–P3 with per-slide exceptions | Small fixes for a known presentation. | Transfers framing and cue rules back to callers. Future combinations remain unsafe. |
| Restore named subjects and special transitions | Returns to a smaller immediate authoring surface. | Each new subset can require TypeScript, views, and transition cases. |

The task records source growth of about 160 lines. The timeline itself changed from 374 to 364 lines. This is not a line-count reduction.

The stronger benefit is reduced work per slide. The recorded first Gears implementation needed 213 added lines across seven files. Its current watch selection needs only frontmatter.

These historical counts include related work. They do not establish an exact cost for every future slide. Even so, they support keeping the general interface.

## Verification and limitations

The review ran or inspected these checks:

| Check | Result |
| --- | --- |
| Canonical quick validation | 14 of 15 checks passed in 20.28 s |
| TypeScript tests | 119 passed |
| Python tests | 7 passed |
| Types, lint, formatting, docs, generated files, scene, palette | Passed |
| Initial build within quick validation | Failed on sandbox `EPERM` for shared-theme `.vite-temp` |
| Build rerun with authorized access and output in `/private/tmp` | Passed; Vite reported 2.03 s |
| `git diff --check` | Passed |
| Fresh task transition trace | 150 scenarios; matched archived refactor |
| Focused projected-geometry probe | Reproduced F1 |
| Focused timeline probe | Reproduced F2 |
| Archived Escapement and Gears images | Inspected |

The tracked diff remained unchanged after the checks: 32 files, 1304 insertions, and 1039 deletions. The review did not edit existing source files.

Limitations:

- Full validation was not run.
- Fresh Chromium, Firefox, offline, print, and export checks were not run.
- Archived images do not prove current browser output at every pose.
- The main trace was read from the task archive. The baseline executable was not rebuilt for this review.
- The trace samples every 25 ms and covers selected interruptions. It does not prove all timing combinations.
- Geometry probes use the renderer’s projection, but do not prove final raster appearance, occlusion, or antialiasing.
- No live frame-time, GPU, memory, or startup benchmark was run. Performance effects remain unmeasured.
- The review did not independently audit the whole mechanism’s physical accuracy.

## Ranked recommendations

1. **Fix tilted fitting.** Valid frontmatter can project geometry outside the slide. This directly defeats P2’s automatic-framing contract.
2. **Fix queued-flash interruption.** A reproduced request freezes a half-visible piece for 2.9 s and violates the transition order.
3. **Keep P1–P3 and the current layout approach.** The fresh trace supports preservation. The Gears slide demonstrates lower authoring cost.
4. **Add focused contract tests.** Test projected containment and queued-versus-active cue interruption. These cover the demonstrated gaps.
5. **Use piece objects during geometry construction.** This improves identity and catches accidental name splits earlier. It has lower urgency because current membership checks pass.

