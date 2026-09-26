# Which tool should draw the watch? Options, compared and ranked

2026-09-25. A step back from [PLAN.md](PLAN.md), after the measurements in
[INVESTIGATION.md](INVESTIGATION.md).

## The problem is the renderer, not Slidev

Slidev only arranges slides and handles key presses. The stutter comes from how
each browser paints an **animated SVG**:

- **Chrome** is smooth, but only after two workarounds found by experiment:
  - no pending opacity transition during the zoom;
  - no `non-scaling-stroke`.
- **Firefox** re-rasterizes the whole SVG on the CPU at each frame while
  anything in it animates. The cost grows with screen pixels: 3–5 slow frames
  per zoom at host scale 1, and 17 at host scale 2 (about a 1920 × 1080
  projector). See INVESTIGATION.md, E13.

The workload itself is small: about 50 paths, 1 spiral that changes shape, and
at most 60 frames a second. Any renderer that draws on the GPU does this with
room to spare. So the question is not "which presentation app" but "which
renderer draws the watch". Slidev can host most of the answers below.

## What the tool must do

| # | Requirement | Where it comes from |
| --- | --- | --- |
| R1 | Smooth in Chrome **and** Firefox, at projector size, on a recent Mac or Windows laptop | `~/Develop/slidev/AGENTS.md`; the investigation |
| R2 | The mechanism never jumps back in time, across key presses | instructions.md |
| R3 | Sharp at 4.46× and more; lines keep their width through the zoom | PLAN.md decisions |
| R4 | Runs offline | AGENTS.md |
| R5 | One source of truth for the geometry (the Python generator), and the house art checks still apply | house practice (`stem/docs`, `stem/tools`) |
| R6 | Scales to more zoom views, more parts (minute and hour wheels), and Stage 2 (a tilted, 3D-looking hairspring) | instructions.md |
| R7 | Live timing: the speaker can pause on any slide for any length of time | a talk, not a film |

## The options

### O1. Slidev + SVG, as now; present in Chrome

- **What:** keep the design that option B reached. Treat Firefox as "works,
  with a stutter".
- **Pros:** done and measured: 0 dropped frames in Chromium. It keeps every
  house tool.
- **Cons:**
  - It fails R1 in Firefox.
  - It rests on two browser quirks found by trial and error.
  - Every new view or part may meet another quirk, so it is fragile as the
    talk grows (R6).
- **Effort:** steps 2–5 of PLAN.md, about 1 day.

### O2. Slidev + Canvas 2D, fed by the generator

- **What:**
  - The Python generator also writes the drawing as data (JSON). The data holds
    each part's paths (the same SVG path strings), fill, stroke, clip, and
    keyframes.
  - A small JS renderer draws it into a `<canvas>` at each frame.
    `Path2D(svgPathString)` draws each path. `ctx.setTransform` is the camera,
    `ctx.clip` does the clips, and `globalAlpha` does the fades. Dividing
    `lineWidth` by the scale keeps line widths.
  - The generator still writes the SVG, for the art checks and for stills.
- **Pros:**
  - Canvas 2D draws on the GPU in Chrome. In Firefox, "accelerated Canvas2D"
    is on by default on macOS; **this is to be verified, not assumed**.
  - Every frame is one explicit draw, with no display lists and no
    invalidation heuristics. The browser has no quirk to trip over.
  - Line widths, clips, fades and the camera become plain arithmetic.
  - It keeps Slidev, the global layer, the marker and the views. Only the
    drawing inside the layer changes.
  - It keeps Python as the source of truth (R5), because the keyframes are
    exported, not rewritten.
- **Cons:**
  - We re-implement a small SMIL player: linear keyframes, stepped keyframes,
    `accumulate`, and the hairspring's path morph. That is about 100 of the
    renderer's roughly 300–400 lines of JS.
  - The live drawing is no longer an SVG, so a separate check must show the
    canvas matches the SVG.
  - If Firefox's accelerated canvas is off on some laptop, it falls back to the
    CPU. That is still cheaper than SVG, but by how much is unknown.
  - Stage 2's 3D look must be faked in 2D: a spiral squashed by $\cos\theta$,
    plus the ribbon's edge. That is possible, but it is hand work.
- **Effort:** a spike of about half a day, measured with the existing
  `headed_check.py` at host scales 1 and 2; then about 2–3 days.

### O3. Slidev + WebGL through Skia (CanvasKit)

- **What:** CanvasKit is Skia, the renderer inside Chrome and Android,
  compiled to WebAssembly and drawing with WebGL. It takes SVG path strings
  and has Skia's anti-aliasing. It can even render SVG documents (SkSVG).
  Otherwise the design is the same as O2.
- **Pros:**
  - The same renderer, with the same pixels, in every browser.
  - GPU drawing, independent of each browser's own canvas settings.
  - High quality.
- **Cons:**
  - About 7 MB of WASM to bundle (offline is fine).
  - A lower-level API than Canvas 2D.
  - WebGL context loss must be handled.
  - More code than O2.
- **Effort:** about 3–5 days.
- **When:** if O2's spike shows that Firefox's Canvas 2D is not accelerated.

### O4. Slidev + a WebGL scene library (PixiJS, Three.js, Two.js)

- **What:** convert the paths into GPU triangles once, then transform them
  every frame.
- **Pros:**
  - Very fast.
  - Three.js gives real 3D for Stage 2: the hairspring as an actual ribbon,
    tilted 30–45°.
- **Cons:**
  - The strokes are triangles. Keeping their width constant through a 4.46×
    zoom means rebuilding them at each scale, or writing a stroke shader.
  - Thin anti-aliased lines are the weak point of every such library, and this
    drawing is all thin lines.
  - The house stroke ladder and colour checks would apply only to the SVG
    export.
- **Effort:** about 1 week.
- **When:** consider Three.js for Stage 2 alone, not for the whole watch.

### O5. Pre-rendered video, from Manim or from our own generator

- **What:** render the zooms as videos: 1080p or 4K, 60 fps, H.264. Slidev (or
  `manim-slides`) plays them.
  - **Manim**, 3Blue1Brown's Python animation engine, has a moving camera and
    3D scenes built in.
  - The alternative is our generator plus a high-quality SVG rasterizer such
    as resvg or Skia, then `ffmpeg`.
- **Pros:**
  - Playback is perfectly smooth in every browser: it is hardware video
    decoding.
  - Any quality we want, frame by frame.
  - Manim makes Stage 2 (real 3D, easing the mechanism to a stop) easy.
  - Python-native.
- **Cons:**
  - **R2 against R7.** Between key presses the cover must loop. The loop's
    period is set by the slowest visible hand: 60 s for the seconds hand.
    When you press the key, the zoom video must start from the loop's current
    frame, or the mechanism jumps. That needs either one zoom video for each
    start phase (30 for the seconds hand, one per beat), or waiting up to 2 s
    for a beat boundary. Hiding the seconds hand from the cover would make the
    loop 2 s long, but that changes the drawing.
  - Fixed resolution: 4K is 4 times the file of 1080p.
  - Each change to the art means a new render.
  - The house art tools check only the stills.
- **Effort:** about 3–5 days, most of it on R2.

### O6. Split the SVG into layers that the GPU moves (CSS compositor animations)

- **What:** each moving part becomes its own small SVG or HTML layer. CSS
  keyframes rotate it, and the camera is a CSS transform. Browsers rasterize
  each layer once and move it on the GPU.
- **Pros:**
  - It stays close to today's pipeline.
  - Rotations and the zoom run on the compositor thread, which is smooth in
    both browsers when it works.
- **Cons:**
  - Rasterized layers scale their lines, so lines would **grow** during the
    zoom (it breaks R3), unless each layer is rendered at 4.46× in advance.
  - The hairspring changes shape, so it must be re-rasterized each frame
    anyway (it is small).
  - The clip holes must be redone per layer.
  - Paint order across layers needs care (INVESTIGATION.md, option D).
  - It still depends on each browser's layerization heuristics, as O1 does.
- **Effort:** about 2–3 days, with an uncertain result.

### O7. Make the SVG cheaper for Firefox to rasterize

- **What:** simplify the drawing's features: the large translucent fills, the
  gears' many arcs, and the fill and stroke drawn as separate paths.
- **Pros:** the smallest change.
- **Cons:**
  - Uncertain.
  - At host scale 2, Firefox dropped 4–6 frames per zoom **with nothing
    animating**. So even a cheaper drawing may not reach R1 at projector size.
  - It fights the drawing style.
- **Effort:** 1–2 days to find out.

### O8. Keynote (Magic Move) or PowerPoint (Morph)

- **What:** import the drawing as vector shapes. Magic Move or Morph zooms
  between two slides smoothly and natively.
- **Pros:**
  - Smooth, native zooms.
  - Presenter tools included.
  - Runs offline.
- **Cons:**
  - Animations stop at a slide transition, so the mechanism freezes during the
    zoom (it fails R2).
  - The mechanism itself cannot be expressed:
    - gears that step and hold;
    - a hairspring that breathes;
    - a fork that flips on the beat.
    It would have to be video, which then blurs when zoomed.
  - It leaves the Python generator, the house theme and the art checks.
  - Keynote is Mac-only.

### O9. Prezi

- **What:** a presentation that is one large canvas, with zooms between
  regions.
- **Pros:** zooming is the product's core idea.
- **Cons:**
  - Proprietary, and a subscription.
  - The desktop app is needed to present offline.
  - Animation only as video, which blurs when zoomed.
  - No programmatic drawing.
  - It fails R2, R3 and R5.

### O10. Canva

- **Cons:** static vector import, preset animations, online-first. It fails
  R2, R3, R4 and R5.

### O11. A native OpenGL or Metal app (for example Rust with Vello or Skia, or C++ with NanoVG)

- **What:** our own program draws the watch full-screen, and the talk switches
  to it.
- **Pros:** complete control, and the best possible performance.
- **Cons:**
  - Weeks of work.
  - Switching between Slidev and the app during the talk.
  - Presenter notes, the next-slide preview and PDF export all need a
    rebuild.
  - It must also be built and tested for Windows.

### O12. Lottie or Rive

- **What:** industry formats for vector animation.
  - Lottie JSON could be generated from Python and played by `lottie-web`
    (its canvas renderer) or by dotLottie (ThorVG in WASM, with WebGL or
    WebGPU).
  - Rive has its own GPU renderer, but it is authored in Rive's editor.
- **Pros:** mature players; GPU rendering in the newer runtimes.
- **Cons:**
  - Lottie's browser renderers are SVG (the same problem) or Canvas 2D (then
    O2 is simpler and has no format in between).
  - Rive's source is a GUI file, so it breaks R5.

## Comparison

✓ = meets, ~ = partly or unverified, ✗ = fails.

| Option | R1 smooth, both browsers | R2 no jumps | R3 sharp, fixed line width | R4 offline | R5 Python source, house checks | R6 more views, Stage 2 | R7 live timing | Effort | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| O1 SVG, Chrome | ~ (Chrome ✓, Firefox ✗) | ✓ | ✓ | ✓ | ✓ | ~ (each view may meet a quirk) | ✓ | 1 day | low now, grows |
| **O2 Canvas 2D** | ~ (likely; spike first) | ✓ | ✓ | ✓ | ✓ (export) | ✓ / ~ (3D faked) | ✓ | ½ day spike + 2–3 days | medium |
| O3 CanvasKit | ✓ (same renderer everywhere) | ✓ | ✓ | ✓ (7 MB) | ✓ (export) | ✓ / ~ | ✓ | 3–5 days | medium |
| O4 WebGL library | ✓ | ✓ | ~ (thin lines) | ✓ | ~ | ✓ (real 3D) | ✓ | 1 week | medium-high |
| O5 Video (Manim) | ✓ | ~ (beat-aligned starts) | ✓ at fixed resolution | ✓ | ~ (stills only) | ✓ (3D easy) | ~ (loops) | 3–5 days | medium |
| O6 GPU layers | ~ | ✓ | ✗ (lines grow) | ✓ | ~ | ~ | ✓ | 2–3 days | high |
| O7 Cheaper SVG | ~ (maybe not at 2×) | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | 1–2 days | high |
| O8 Keynote / PowerPoint | ✓ for the zoom | ✗ | ✗ (video blurs) | ✓ | ✗ | ✗ | ✓ | — | — |
| O9 Prezi | ✓ for the zoom | ✗ | ✗ | ~ | ✗ | ✗ | ✓ | — | — |
| O10 Canva | ~ | ✗ | ✗ | ✗ | ✗ | ✗ | ✓ | — | — |
| O11 Native app | ✓ | ✓ | ✓ | ✓ | ~ | ✓ | ~ | weeks | high |
| O12 Lottie / Rive | ~ | ✓ | ~ | ✓ | ~ / ✗ | ~ | ✓ | 3–5 days | medium |

## Ranking

1. **O2, Slidev + Canvas 2D fed by the generator, after a half-day spike.**
   - Why first:
     - It removes the cause (browser SVG invalidation) instead of working
       around it.
     - It keeps everything that works: Slidev, the persistent layer,
       continuity, Python as the source, and the SVG for the house checks.
     - It turns the two browser quirks into arithmetic we control.
   - What the spike must show: in visible Firefox at host scales 1 and 2,
     `headed_check.py` finds about 0 slow frames per zoom. This is the same
     test that failed for SVG. If it does, build it. If Firefox's canvas turns
     out to be CPU-drawn and slow, go to O3.
2. **O1, SVG in Chrome.** It is the fallback we already have. It is right if
   the talk only ever runs in Chrome. It is the only option with no new risk
   today. It ranks below O2 because it fails R1 and gets more fragile with
   each view.
3. **O3, CanvasKit.** The same design as O2, with one renderer on every
   browser. Use it if O2's spike fails in Firefox, or if pixel-identical output
   across browsers starts to matter.
4. **O5, video with Manim.** It is the best tool for Stage 2's 3D and for a
   film-like finish. But a talk's key presses come at unpredictable times, so
   continuity (R2) costs real design work (beat-aligned transitions, a 60 s
   loop). It ranks well as a **complement**: one Manim clip for the Stage 2 3D
   tilt, where stopping the mechanism first is pedagogically welcome anyway.
5. **O4, a WebGL scene library.** Thin constant-width lines are its weak
   point. Consider Three.js for Stage 2 only.
6. **O7, a cheaper SVG.** It is cheap to try, but the measurements suggest it
   cannot reach projector size in Firefox.
7. **O12, Lottie or Rive.** A format in between with no gain over O2.
8. **O6, GPU layers.** It breaks the line-width decision, or needs pre-scaled
   layers, and it keeps the browser-heuristics fragility.
9. **O11, a native app.** Excellent rendering, but weeks of work, and the
   presentation machinery must be rebuilt.
10. **O8 Keynote / PowerPoint, O9 Prezi, O10 Canva.** They zoom beautifully,
    but none can show the mechanism running through the zoom, and all of them
    leave the programmatic pipeline.

## What I would do next

1. **O2 spike, about half a day, in the task directory.**
   - Export today's drawing as JSON from a copy of the generator.
   - Write a minimal Canvas 2D player: paths, clips, keyframes, the camera and
     fades.
   - Measure it with `headed_check.py` in Firefox and Chromium, at host scales
     1 and 2.
   - Check by eye in your desktop browsers.
2. If it is smooth, rewrite PLAN.md's steps 2–5 around it. The data model
   stays. The SVG's CSS views become the same view data in the JSON.
3. If it is not, spike O3 the same way. Meanwhile, O1 in Chrome remains a
   working talk.
