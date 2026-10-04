# Final rest-shape selection and review

Keep slide 2 with bend weight $15$.
Remove the zero-bend comparison slide, SVG, and component configuration.
The selected SVG is byte-identical to the quarter-bend result.

The [review](code-quality-review.md) is saved verbatim.
Its test-integration finding is resolved in `package.json`.
`pnpm test` now runs the seven mathematical checks with the TypeScript tests.
The canonical validator uses this script.
The coefficient units are explicit in `LeaderDesign`.

The project [watch doc](../../docs/watch.md) records the geometry, objective, layering, and lifecycle contracts.
The measurements doc records the contrast evidence.
No additional memory entry is needed.
The favicon maintenance instructions moved from the docs index into the watch doc.

## Static-view correction

The click-inclusive export exposed a straight ghost over a hairspring still at click 2.
[The saved page](evidence/export-before-click-2.png) shows the mismatch.
The watch still used click zero, and the board could run its animation clock during export.

Static views now read the page-local click count and select a fixed board pose.
Click 1 shows held deflection; click 2 shows the completed curl.
The watch still follows its page's hidden, settled, or resumed state.
Overview click changes also update these images without a component remount.
An asynchronous image from an older click cannot replace the current still.

The [static-view review](static-view-review.md) records two reactive findings.
The [final verification](final-review-verification.md) confirms their resolution.

The sampled graph gives a global minimum for its candidate contacts.
It does not guarantee a continuous global minimum for arbitrary shapes.
Motion along the leader remains unpenalized, as requested.
No broad module split is needed for this cohesive generator.

## Saved material

`inputs/` holds the source and theme before cleanup.
`result/` holds the final source and generated SVG.
`deck/` holds the cleaned offline deck used by the browser probes.
`evidence/` holds validation and browser results.
The earlier tasks retain their comparison sources and evidence.

## Reproduce

From `watches/`:

```bash
uv run tasks/2026-10-04-rest-shape-final-review/regenerate.py --out /tmp/final-rest-shape.svg
uv run tasks/2026-10-04-rest-shape-final-review/result/art/test_leader_path.py
uv run tasks/2026-10-04-rest-shape-final-review/check_rest_shape.py
uv run tasks/2026-10-04-rest-shape-final-review/check_layering.py
uv run tasks/2026-10-04-rest-shape-final-review/check_static_views.py
```

The regeneration command checks byte equality before writing.
The browser probes serve the saved deck and block outside requests.

No commit was made.

## Verification results

Chromium and Firefox pass the live lifecycle and foreground-reference pixel checks.
They also pass forward, reverse, and rapid overview click changes on the same component instance.
The probes record zero page errors and zero outside requests.

The [five exported pages](evidence/export-pages/) show the fixed poses at all slide 2 clicks.
Each page was inspected visually.
The export command emits an existing Slidev FloatingVue patch warning, but writes all five pages successfully.
The warning also occurred before the static-view correction.

The saved generator reproduces the selected SVG byte for byte.
The original mathematical-test finding and both static-view findings are resolved.
See [the final reviewer verification](final-review-verification.md).

The final canonical validation passes all 21 checks.
See [the validation result](evidence/validation-complete.txt).
