# Plan: a half-day test of Slidev + Canvas 2D for the skeleton watch

**Status:** done overnight. The results and the recommendation are in
[README.md](README.md). "As built" and "Changes from the plan" at the end say
where the work differs from this plan.

Task: option O2 of
[../2026-09-25-zoom-to-hairspring/RENDERING-OPTIONS.md](../2026-09-25-zoom-to-hairspring/RENDERING-OPTIONS.md).
Context and rules for this session: [CONTEXT.md](CONTEXT.md). Martin was asleep
while this plan was written and carried out, and asked for the data model to be
recorded here, not waited on.

## Goal and pass mark

- **Pass:** in visible Firefox windows at host scales 1 and 2, a zoom of the
  watch drawn with Canvas 2D has about 0 slow frames (gaps over 25 ms),
  measured like E13 of the zoom task's INVESTIGATION.md.
- **Also:** the same in visible Chromium, and a look by eye in Martin's
  desktop Firefox 156.0.1 and Chrome 153.0.8010.53.
- **First:** a pixel check that the canvas draws what the SVG draws.

The baseline to beat (E13, the SVG page): Firefox 3–5 slow frames per zoom at
host 1 and 17 at host 2; Chromium 0–1.

## Where the player gets the drawing

| | (a) The player reads the generated SVG | (b) The generator also writes JSON |
| --- | --- | --- |
| Source of truth | one file, the SVG the art checks already check | two outputs to keep in step |
| Generator change for the test | none | a JSON writer (in the mirror copy) |
| SVG meaning (clip space, `replace` animations) | decided in JS | decided in Python, but still decided |
| Risk | the player misreads an SVG feature | the export leaves one out |
| Pixel check | the same file in two renderers | the SVG against a second file |
| Load cost | one `DOMParser` pass over 45 KB (a few ms) | a `JSON.parse` |

**Choice: (a).** The drawing stays one file, and the check compares one file in
two renderers. The player reduces the misread risk: it knows a short list of
elements and attributes, and it **throws** on anything else. So a new SVG
feature stops the player instead of being drawn wrong. (b) stays open for
production, if a real deck wants a smaller or faster load.

## The player's data model (`spike/site/watch_player.js`)

**Fixed data**, made once from the SVG by `readDrawing(svgText)`. Nothing below
changes after it is made.

| Class | Fields | What it is |
| --- | --- | --- |
| `Drawing` | `width`, `height`, `root: Group`, `parts: Part[]` | the picture |
| `Part` | `name` | a top-level piece tagged `data-part` (`hairspring`, `rest`). `name` is only to match the SVG's own CSS and to print. |
| `Group` | `matrix: DOMMatrix`, `rotation: Keyframes \| null`, `clip: Clip \| null`, `part: Part \| null`, `children: (Group \| Shape)[]` | a `<g>` |
| `Shape` | `outline: Path2D \| Morph`, `matrix`, `fill: Paint \| null`, `fillRule`, `stroke: Paint \| null`, `strokeWidth`, `lineJoin`, `lineCap`, `part: Part \| null` | a `<path>`, `<circle>` or `<rect>` |
| `Paint` | `style` | a colour with its opacity, as the canvas style string |
| `Clip` | `outline: Path2D`, `fillRule`, `hole: Path2D \| null` (added for C16) | a `<clipPath>` with one path |
| `Keyframes` | `values`, `keyTimes`, `duration`, `accumulate`; method `valueAt(time)` | an `<animateTransform type="rotate">` |
| `Morph` | `commands`, `frames` (one number array per keyframe), `keyTimes`, `duration`; method `pathAt(time)` | an `<animate attributeName="d">` |

**Links:** a `Group` holds its children; a `Group` or `Shape` holds its `Part`
when it is tagged. The clip and the keyframes belong to the group they act on.
Nothing is looked up by name after reading. The `url(#id)` of a clip is
resolved to its `Clip` object once, while reading.

**Data each frame computes** (a new value per frame, not stored on the
drawing):

| Class | Fields |
| --- | --- |
| `Camera` (a frozen value) | `x`, `y`, `scale`: `translate(x, y) scale(scale)` in slide px |
| `FrameState` | `time` (s on the mechanism's clock), `camera`, `opacity: Map<Part, number>`, `pixelsPerUnit` (device px per slide px) |

What a caller can tune, as a frozen value (`DRAW_OPTIONS`, with variants made
by spreading it): `compensate` (divide line widths by the scale) and `clips`:
`"clip"`, `"erase"` (draw, then erase the clip's hole; added for C16) or
`"off"` (only to measure their cost).

`draw(context, drawing, frameState)` walks the tree once: clear, set the
device-pixel transform and the camera, then for each node save, transform,
clip, draw, restore.

**SVG meaning that the player copies:**
- `animateTransform` without `additive` **replaces** the group's `transform`
  (the balance's static `rotate(150)` is its first keyframe).
- `accumulate="sum"`: at repeat $n$, the value is $n \cdot v_\text{last} +
  v(t \bmod d)$.
- `calcMode` is linear between `keyTimes`; the drawing has no other.
- A clip path is in the user space of the element that uses it, after that
  element's `transform`.
- `stroke-miterlimit` is 4 in SVG and 10 in Canvas 2D: the player sets 4.
- A `<path>` with no `fill` fills black (the tick marks: open lines, so no
  area).
- Paths go to the browser's own parser, `new Path2D(d)`. The hairspring's
  morph interpolates each number and builds its `Path2D` with `moveTo` and
  `bezierCurveTo` (it uses only M and C).

**One known difference, on purpose.** SVG fades each tagged part as one layer
(group opacity). The player multiplies each shape's alpha instead. Where two
shapes of one part overlap (a wheel's outline on its fill), a half-faded frame
is a little darker than the SVG's. This affects only the 0.8 s fade. Group
opacity would need an off-screen layer per part per frame.

## The test page

A copy of the zoom task's `site/zoom.html` with one new option,
`renderer=svg|canvas`. The SVG renderer is unchanged, so its numbers stay
comparable with E13. In canvas mode:
- the page reads the camera numbers from the SVG's `<style>`, as before;
- one `requestAnimationFrame` loop moves the camera, the fade and the
  mechanism's clock, then draws;
- the canvas's backing store is its on-screen size times `devicePixelRatio`;
- `fadelater=1` is the only fade (the one decided in the zoom task);
- `smil=paused&t=…`, `only=hairspring` and `clips=off` work as before.

## Steps

1. Copy the harness (done: `spike/`).
2. Write the player and the canvas renderer of the test page.
3. **C1, pixel check:** the same view in both renderers, in Chromium and
   Firefox, at several mechanism times (including past 2 s and 60 s, for
   `accumulate` and the seconds loop) and at camera scales 1, 2.2 and 4.46.
   The control is SVG in Chromium against SVG in Firefox. Look at every diff
   image.
4. **C2, headless frame gaps** (`jank_check.py`), both renderers.
5. **C3, visible windows** (`headed_check.py`), Firefox and Chromium, host
   1, 1.5 and 2, running and stopped, and a fresh SVG baseline in the same
   session. Before each round, check that an idle page gets frames at 60 Hz.
6. **C4, Firefox's canvas acceleration:** the same with `gfx.canvas.accelerated`
   forced on and forced off, to learn which path Firefox takes by default.
7. If Canvas 2D passes: the canvas in the spike deck's global layer, measured
   the same way in Slidev.
8. If it fails in Firefox: diagnose, then try O3 (CanvasKit).
9. Write INVESTIGATION.md (methods and results before interpretation), the
   recommendation, and the URLs for Martin's eyes.

## Risks

- **Silent drawing errors.** The allowlist, the pixel check and looking at the
  diff images are the defence.
- **Playwright's Firefox is not Martin's Firefox** (155.0 against 156.0.1,
  other preferences, `devicePixelRatio` 1 against 2). The by-eye check in the
  morning is the final test.
- **Night-time throttling** of visible windows. Check 60 Hz first.

## As built

The player (`spike/site/watch_player.js`, 409 lines) follows the data model
above. The Slidev side needed one more module, `spike/site/watch_stage.js`
(160 lines):

| Class | Fixed data | Data each run changes | Links |
| --- | --- | --- | --- |
| `View` | `name` (the frontmatter's), `camera`, `kept: Part[]` or null (every part) | — | to the `Part`s it keeps |
| `Tween` | `from`, `to`, `start`, `duration`, `easing` | — (a new one for each change) | — |
| `WatchStage` | `canvas`, `drawing`, `views`, `timing` (frozen `TIMING`: move 1800 ms, fade 800 ms), `options`, `clockStart` | `view`, `move` (`from`, `to` cameras and a `Tween`), `fades: Map<Part, Tween>`, `running` | to its `Drawing` and `View`s |

- `show(view)` plans the three phases: fade in, move, fade out.
- `drawAt(now)` computes the camera and each part's opacity from the tweens,
  and fits the backing store to the canvas's size on screen, in device
  pixels.
- `viewsFrom(svgText, drawing)` reads the views from the SVG's CSS. It is a
  stand-in until the generator writes views as data.

## Changes from the plan

- **Numbering:** INVESTIGATION.md numbers the experiments C1–C22 in the order
  they ran. The C-numbers in "Steps" above are the planned ones.
- **Added on 2026-09-26, at Martin's request:** Firefox 156's stroke-bounds
  pref (C20), Firefox 157 (C21), and the SVG zoomed by a CSS transform on
  the `<svg>` element (C22), with a sharpness check read from screen
  captures (`screen_sharpness.py`).

- **Step 4 (headless frame gaps) was not run.** Visible windows at two pixel
  ratios (C2, C3), and the browsers installed on the laptop (C6, C10),
  measure the real paths. The headless copy of `jank_check.py` was deleted.
- **Added:** the installed Firefox 156 and Chrome 153, which Playwright
  cannot drive. The page and the deck measure themselves, and POST the frames
  (`real_browsers.py`).
- **Added and removed:** a clip limit per clipped group (C7). It kept the
  pixels but did not reduce Firefox's cost, so it was taken out again.
- **Added:** the deck's other views (C11), sharpness during the zoom (C12),
  10-minute runs (C13), the fade's difference from the SVG's (C14), and the
  offline check (C15).
- **Added:** erasing each clip's hole instead of clipping (C16, C17). It is
  a draw option, `clips: "erase"`, and the class `Clip` gained a field,
  `hole` (the `Path2D` of the hole, or null).
- **Added:** the presenter view open, so that two stages animate (C18), and
  CPU on the cover (C19).
- **Step 8 (O3, CanvasKit) was not needed:** Canvas 2D passed in Firefox.
- **Layout:** as the talk's `.gitignore` asks for task archives, the tools
  write to `out/` (not committed), and `spike/keep_evidence.py` copies what
  the documents cite to `evidence/` (committed).
