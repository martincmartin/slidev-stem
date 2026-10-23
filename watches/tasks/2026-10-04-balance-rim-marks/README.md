# Balance rim marks: comparison

**Selected:** four radial screws, with slots on their outward faces.
The user corrected the initial weight selection on 2026-10-04.
The live model uses screws with slightly shorter heads to fit the existing frame.
The ETA 6497 reference affects only the gross layout.

The comparison and initial weight installation below remain as historical evidence.
The [corrected installation](#corrected-selection-four-screws-2026-10-04) records the current result.

## Basis and new evidence

The relevant rules are in [watch.md](../../docs/watch.md), [measurements.md](../../docs/measurements.md),
[illustrations.md](../../../docs/illustrations.md), [legibility.md](../../../docs/legibility.md), and [webgl.md](../../../docs/webgl.md).
The task keeps the versions used in [inputs/docs](inputs/docs/).

Those rules require visible motion after blur, structural marks, and consistent framing.
This comparison adds rendered rim measurements, six visual proposals, and a check of each proposal's full rotation bounds.
The comparison used frozen copies of the model and renderer.

## Look at the proposals

Open [comparison.html](comparison.html) in Chromium or Firefox. It is a complete local page with no external assets.
Select a proposal and a view. The page uses the watch's actual motion and the existing camera settings.

Static comparisons: [whole cover](evidence/cover-comparison.png) and [slide 3](evidence/slide3-comparison.png).
These show the art at the slide's size. They omit the slide text.

| Proposal     | Cover clip                                           | Slide 3 clip                                          |
| ------------ | ---------------------------------------------------- | ----------------------------------------------------- |
| Plain rim    | [APNG](evidence/chromium/plain/cover/motion.png)     | [APNG](evidence/chromium/plain/slide3/motion.png)     |
| Four screws  | [APNG](evidence/chromium/screws-4/cover/motion.png)  | [APNG](evidence/chromium/screws-4/slide3/motion.png)  |
| Six screws   | [APNG](evidence/chromium/screws-6/cover/motion.png)  | [APNG](evidence/chromium/screws-6/slide3/motion.png)  |
| Eight screws | [APNG](evidence/chromium/screws-8/cover/motion.png)  | [APNG](evidence/chromium/screws-8/slide3/motion.png)  |
| Four weights | [APNG](evidence/chromium/weights-4/cover/motion.png) | [APNG](evidence/chromium/weights-4/slide3/motion.png) |
| Six weights  | [APNG](evidence/chromium/weights-6/cover/motion.png) | [APNG](evidence/chromium/weights-6/slide3/motion.png) |

Each APNG shows one recorded half-swing at 60 fps. Each adjacent GIF is a convenience preview at 50 fps.
Use the HTML page to see repeated, complete swings at the display's frame rate.
The individual PNG frames remain beside each clip.

## What was compared

All proposals use the same layout, amplitude, period, camera target, and zoom.
The rim, arms, and hub remain one piece. No lines return at their joins.

The screws are radial cylinders with slots on their outward faces.
The smooth weights are short cylinders supported by the rim's top face.
Both use the existing subject outline and pale face colours.
These are simplified shapes; they do not reproduce a particular movement.

For this comparison, both shapes are eight model units across and extend about five units beyond the rim.
The prototype's frozen `RimMarks` value object holds the dimensions.
Their outlines are 2.5 CSS px at both zooms. Geometry scales; line widths remain fixed on the screen.

The first weight trial had a face level with the rim. This let the rim line cross the weight.
The final weights sit above the rim. Both browsers repeated the weight captures after this correction.

## Measurement

Each view has 61 sampled states over one second, including both endpoints.
The score uses 55 pairs separated by 100 ms.
The balance's angle follows the existing cosine motion.

The calculation uses the house tools' linear-light blur for a 55-inch TV viewed from seven metres.
For each pixel, the change contrast is

$$
D = \frac{\max(L_t,L_{t+0.1}) + 0.05}{\min(L_t,L_{t+0.1}) + 0.05}.
$$

The table counts CSS px² where $D \geq 3$ within the projected rim band.
The band excludes the openings, arms, and hairspring. Its model radii are 51–66 units.
Each entry is the mean across all 55 pairs, rounded to the nearest CSS px².

| Proposal     | Cover | Slide 3 | Cover, flare $F=0.05$ | Slide 3, flare $F=0.05$ |
| ------------ | ----: | ------: | --------------------: | ----------------------: |
| Plain rim    |    21 |       0 |                    17 |                       0 |
| Four screws  |   263 |   2,658 |                   226 |                   2,380 |
| Six screws   |   386 |   3,983 |                   331 |                   3,563 |
| Eight screws |   352 |   4,077 |                   294 |                   3,599 |
| Four weights |   356 |   3,006 |                   296 |                   2,677 |
| Six weights  |   525 |   4,500 |                   437 |                   4,008 |

These are Chromium results. Firefox gives the same rounded means.
Exact means, ranges, peaks, and browser details are in [measurements.json](evidence/measurements.json).

The plain rim has exactly zero change on slide 3.
On the cover, nearby moving parts cross the rim band and give the small residual score.
The cover score therefore includes some nearby motion. Do not treat it as an isolated measurement of the marks.

Four weights exceed four screws by about 35% on the cover and 13% on slide 3.
Six weights exceed four weights by about 47% and 50%, respectively, with 50% more parts.

Eight screws have a weakness at this sampling interval.
Near peak speed, 100 ms advances the balance by approximately their 45° spacing.
Some pairs therefore look almost unchanged; the minimum cover score is zero.
This is a symmetry problem in the sampled pairs. It does not prove visible reversal at 60 fps.

These scores compare visible change. They do not measure human recognition or prove that an audience can track a particular mark.

## Legibility, framing, and cost

At cover scale, an eight-unit head spans eight CSS px. Its 2.5 px outline exceeds the 1.64 px resolution floor.
The nominal line contrast is 10.39:1 on paper and 8.00:1 on the pale part faces.
Against the dark frame outline, it is only 2.10:1.
This comparison does not establish the 3:1 gate where two dark outlines cross.

The smooth weights fit the existing slide 3 frame throughout their rotational envelope.
Their outlined left edge has approximately 1.43 CSS px of clearance.
Their outlined bottom edge stays about 9.7 px above the slide boundary.

The screw trial's bottom stroke can reach approximately 0.22 CSS px beyond the frame.
A screw selection needs a small geometry adjustment and another measurement.
Keep the established camera target and zoom.
The frozen [bounds tool](tools/measure_bounds.mjs) produced [bounds.json](evidence/bounds.json).

Four weights add four meshes and 720 triangles, about 3.4% of the baseline triangle count.
Six weights add six meshes and 1,080 triangles, about 5.1%.
Each screw also has a separate slot mesh.
These counts do not establish frame time. The capture used headless browser renderers.

## Original comparison ranking

1. **Four smooth weights.** Strong motion in both views, four added parts, and clean circular outlines. This is the recommended default.
2. **Six smooth weights.** The highest measured change in both views. Prefer these when the cover needs a stronger cue.
3. **Six screws.** Strong motion, but more meshes and edges than either weight proposal. Their bottom stroke needs an adjustment.
4. **Four screws.** Sparse, but less measured motion than four weights. Their bottom stroke also needs an adjustment.
5. **Eight screws.** More marks, little gain over six screws on slide 3, and weaker cover results at this sampling interval.
6. **Plain rim.** The control. It leaves the slide 3 rim visually stationary.

The ranking uses motion first, then the number and shape of the added marks.
ETA balance details have no weight in this decision.
Top-face marks and a swing arrow remain possible additions from [PLAN.md](PLAN.md); this comparison did not render them.

## Validation and reproduction

The prototype passed strict TypeScript checking and all 46 existing frozen watch tests.
Both browsers rendered all six proposals without page errors or outside requests.
The standalone page also passed both browser checks with HTTP requests blocked.
The live talk passed all 23 canonical checks; see [validation.log](evidence/validation.log).
That command excludes task prototypes, so the prototype checks are separate evidence.

From `watches/`, with the project's dependencies installed:

```bash
uv run tasks/2026-10-04-balance-rim-marks/tools/compare_rims.py
uv run tasks/2026-10-04-balance-rim-marks/tools/check_standalone.py
pnpm exec node tasks/2026-10-04-balance-rim-marks/tools/measure_bounds.mjs
pnpm exec vue-tsc --noEmit --project tasks/2026-10-04-balance-rim-marks/prototype/tsconfig.json
```

`inputs/` holds the baseline model, renderer, docs, configuration, and lockfiles.
`prototype/` holds the comparison model and page.
`tools/` holds the capture tools and the frozen house measurement tools.
`themes/` holds the palette source used by those tools.
The bundled HTML remains usable without the source project or package installation.

## Initial weight selection and installation, 2026-10-04

The user selected four radial weights from the comparison.
The live watch uses the smooth `weights-4` proposal, with the same size, phase, and placement.
`watch/generate.ts` builds the weights from a frozen value object after it assigns the rim's height.
It adds them to the oscillator flash and the balance-wheel subject.
The existing camera settings, part heights, and timing remain unchanged.

The geometry tests check four equally spaced weights, contact with the rim, and membership in the balance's motion and visibility groups.
All 14 tests in `watch/generate.test.ts` passed.
The canonical `uv run ../tools/validate.py` run passed all 23 checks.
The final documentation check found no issues.

The installed model matched the selected proposal in 122 full-slide frames per browser.
Chromium and Firefox each compared both views at 61 sampled times, with zero differing pixels.
There were no page errors or outside requests.
The [pixel check](evidence/installed/pixel-check.json) records the result.
The [installed screenshots](evidence/installed/) include both views at the two extremes and the middle of the swing.

The cover's refreshed still and motion measurements are in
[installed-barroom.json](evidence/installed-barroom.json) and [installed-motion.json](evidence/installed-motion.json).
Current values are documented in [measurements.md](../../docs/measurements.md).
The [validation log](evidence/installed-validation.log) records the full talk checks.
`result/` keeps the installed model, renderer, supporting types, docs, and lockfiles.

To repeat the live-to-proposal comparison from `watches/`:

```bash
uv run tasks/2026-10-04-balance-rim-marks/tools/check_installed.py
```

## Corrected selection: four screws, 2026-10-04

The user corrected the selection to four radial screws.
This supersedes the initial weight installation.
`BALANCE_SCREWS` in `watch/generate.ts` holds the current dimensions and phase.
`balanceScrewMeshes` builds radial cylinders with slots on their outward faces.
The heads and slots turn, flash, and fade with the balance group.

The original screw trial could extend 0.22 CSS px beyond slide 3.
The installed heads extend 0.2 fewer model units beyond the rim.
This change preserves the established camera target, zoom, heights, and timing.
The full rotation envelope now leaves 0.62 CSS px below the screw outlines and 1.73 px at the left edge.
The [bounds](evidence/screw-bounds.json) include the fixed 1.25 px half-stroke margin.

The installed screws match the shortened, frozen prototype in all 122 sampled frames per browser.
Chromium and Firefox each checked both views at 61 times.
Both browsers reported zero differing pixels, page errors, or outside requests.
The [pixel check and measurements](evidence/installed-screws/pixel-check.json) record these results.
The [screenshots](evidence/installed-screws/) show both views at the extremes and middle of the swing.

The same blurred rim-band method gives these rounded means:

| View    | Mean CSS px² changing by at least 3:1 | With ambient flare $F=0.05$ |
| ------- | ------------------------------------: | --------------------------: |
| Cover   |                                   258 |                         221 |
| Slide 3 |                                 2,626 |                       2,351 |

The shortened heads reduce the original four-screw score by about 2% on the cover and 1% on slide 3.
Both browser means round to the same values.
These scores measure visible change; they do not establish human recognition.
The cover still passes the house legibility gate.
Its refreshed measurements are in [screw-barroom.json](evidence/screw-barroom.json) and [screw-motion.json](evidence/screw-motion.json).

The geometry checks passed all 14 tests.
All 23 canonical talk checks passed, including the offline slide walk.
The [validation log](evidence/screw-validation.log) records the results.
`screw-reference/` keeps the shortened prototype; [screw-reference.html](screw-reference.html) bundles it for local viewing.
`screw-result/` keeps the installed source, docs, renderer, and lockfiles.
`result/` remains the earlier weight installation.

To compare the live model with the frozen screw reference:

```bash
uv run tasks/2026-10-04-balance-rim-marks/tools/check_screws.py
pnpm exec node tasks/2026-10-04-balance-rim-marks/tools/measure_screw_bounds.mjs
```

2026-10-23: the talk no longer depends on Python's Playwright, which this
task's tools import. The talk's last version was playwright 1.63.0; the version
on the task's date is in that day's `uv.lock`. To run the tools again, add it
to the talk for that session (`uv add playwright==1.63.0`), and install the
browsers they use (`uv run python -m playwright install chromium`).
