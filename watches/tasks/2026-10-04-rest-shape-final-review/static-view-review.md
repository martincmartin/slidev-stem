# Follow-up review: static rest-shape and watch views

TASK_DIR: `/Users/martin/Develop/slidev/stem2/watches/tasks/2026-10-04-rest-shape-final-review`

## Assessment

The change addresses the reported export mismatch for independently mounted click pages. It uses the correct Slidev click API.

Two reactive lifecycle gaps remain. They affect overview click selection and the presenter's next-frame pane. Those views can change clicks without remounting the slide.

## Findings

### P2: Static board geometry does not update for all click changes

**Location:** `components/DivingBoard.vue:155–167`.

The static pose is selected in `apply()`. However, the current watchers do not call it for every static click transition.

Two examples follow:

- At static click $0 \rightarrow 1$, `running` remains false. The `visible` watcher does nothing when visibility becomes true. The board remains at time zero instead of showing the held deflection.
- At static click $1 \rightarrow 2$, the `curling` watcher calls `curl()`. That function schedules a curl only when `running` is true. In a static view, it changes the class but leaves the SVG clock at its preceding pose.

These are supported interactions. Slidev's `overview.vue` changes `ctx.current` when the user selects a click marker. Its presenter page also updates the next-frame click context without replacing the slide.

**Recommended correction:** In static views, apply the fixed pose when the relevant props change. Preserve the existing live curl scheduling. Include the static-view state in the watcher dependencies.

**Validation:** Exercise static transitions $0 \rightarrow 1 \rightarrow 2 \rightarrow 3 \rightarrow 4$ and their reverse order without remounting the component.

### P2: Watch stills update their visibility but not their image

**Location:** `slide-bottom.vue:16–32`.

The watch state now uses the page's reactive click count. The still image is generated only in `onMounted`.

This creates two inconsistent states when clicks change on a mounted static page:

- A page mounted at click 2 has no watch still. Advancing it to click 3 creates the still container, but no image is generated.
- A page mounted at click 3 generates a settled spring. Advancing it to click 4 retains that settled image instead of drawing the resumed state.

The second case also occurs when the overview starts at the final click and the user selects an earlier click.

**Recommended correction:** Generate the image reactively from the static-view requirement and watch state. Clear the image when it is no longer needed. Prevent an older asynchronous result from replacing a newer state's image.

**Validation:** Check hidden-to-visible transitions and settled-to-resumed transitions on the same mounted static page. Include rapid state changes.

## Resolved items from the original review

The Python mathematical tests now participate in `pnpm test`. The canonical validator invokes that script. This resolves the original test-integration finding.

`LeaderDesign` now states the coefficient units:

- Length coefficient: dimensionless.
- Bend coefficient: CSS px per radian.
- Movement coefficient: seconds squared per CSS px.
- Integrated objective: CSS px-seconds.

These units agree with the implemented objective.

The local Slidev API declaration now includes `$clicks: Ref<number>`. Its type matches the installed implementation.

## API and export contract

The installed `@slidev/client/context.ts` implements:

```ts
const $clicks = toRef($clicksContext, "current");
```

Using `$clicks.value` therefore reads the correct page-local click count. It is preferable to the previous constant zero.

The installed exporter reads each `data-waitfor` attribute as a descendant selector. `data-waitfor="svg"` is valid and waits for the inline SVG.

The static clock choices are appropriate:

- Click 1 selects the held deflection at `swingStart`.
- Click 2 and later select the completed curl.
- Static views do not run the animation loop.

The documentation describes those choices clearly. Its claim that overview follows each page's click state requires the reactive fixes above.

## Task ownership and reproducibility

The task's regeneration tool uses its saved generator and saved theme. It checks byte equality against the saved SVG before writing. This preserves the selected drawing independently of later source changes.

The browser tools serve the task's saved deck and block outside requests. Their evidence belongs to that deck, rather than implicitly to current production source.

After the export fix is complete, refresh this active task's final snapshots and deck. Preserve the earlier comparison tasks. Record the export mismatch and fixed static-view contract in this task's README.

The two reactive findings should also be recorded as resolved or retained limitations. Do not silently replace the original review.

## Review scope and limits

I read the active task README, the original review, changed component and still code, current documentation, local types, and relevant installed Slidev source.

I verified the click API and exporter waiting contract through source inspection. I also inspected Slidev's overview and presenter code to establish that static click contexts can change without remounting.

I did not run fresh browser sessions, export, typecheck, or canonical validation during this follow-up. The lifecycle findings follow directly from the watcher paths and mounted-only still generation.

## Commit readiness

Resolve the two reactive findings. Then verify the actual click-inclusive export and same-instance static click transitions.

The live animation path should retain its existing timing. No generator refactor is needed for these fixes.
