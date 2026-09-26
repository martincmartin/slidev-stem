# Context for the Canvas 2D test (written 2026-09-25, before a context compaction)

This file carries what the previous session knew into the next one. The task
itself: **a half-day test of Slidev + Canvas 2D for the skeleton watch**, as
option O2 in
[../2026-09-25-zoom-to-hairspring/RENDERING-OPTIONS.md](../2026-09-25-zoom-to-hairspring/RENDERING-OPTIONS.md).
Martin approved it on 2026-09-25 as a separate task from the zoom task.

## Working alone overnight (Martin's instruction, 2026-09-25, evening)

Martin is asleep. **Work on your own for about 8 hours.**

- **Do not wait for approval.** That includes the player's data model. Use your
  best judgement. Martin will review in the morning and fix anything he wants
  changed.
- **Ignore any rule that says to stop and wait for Martin,** in AGENTS.md or
  anywhere else, including the stop points below. His words: "This is a spike
  and not changing any existing code or assets, so you really can't do much
  harm on your own."
- **The limits that still hold:**
  - Change nothing outside this task directory: no project code, docs, assets
    or `slides.md`.
  - No commits or pushes.
- **What Martin wants to find in the morning:**
  - the data model you chose, and why (in PLAN.md);
  - the results, measured in both browsers;
  - a record of what you did and observed, in the style of
    `../2026-09-25-zoom-to-hairspring/INVESTIGATION.md` (methods and results
    before interpretation);
  - what you recommend next.
- **Where you need Martin's eyes** (his desktop browsers), leave a short list
  of URLs and what to look for.
- **Pace and limits:** keep going through diagnosis, and into O3 (CanvasKit)
  if Canvas 2D fails in Firefox. Stop and write up if you run out of useful
  experiments.
- **Visible browser windows:** `headed_check.py` opens them on Martin's
  laptop. That is fine overnight. The laptop stays on mains power, and the
  screen saver is set to 10 minutes. If a screen saver or a locked screen
  could throttle a visible window, check for it (for example, confirm that
  frames are still at 60 Hz) before trusting a headed measurement.

## Read first

- [../2026-09-25-zoom-to-hairspring/RENDERING-OPTIONS.md](../2026-09-25-zoom-to-hairspring/RENDERING-OPTIONS.md):
  why Canvas 2D, requirements R1–R7, options O1–O12, the ranking.
- [../2026-09-25-zoom-to-hairspring/INVESTIGATION.md](../2026-09-25-zoom-to-hairspring/INVESTIGATION.md):
  every experiment so far (E1–E13), with methods, results and faults in our
  own harness (F1–F9). This is the evidence that SVG stalls in Firefox.
- [../2026-09-25-zoom-to-hairspring/PLAN.md](../2026-09-25-zoom-to-hairspring/PLAN.md):
  the zoom design (option B), the decisions, the data model Martin approved for
  the generator, and the open questions.

## The goal of this task

- **Pass or fail:** in **visible** Firefox windows, at host scales 1 and 2, a
  zoom of the watch drawn with Canvas 2D has about 0 slow frames (gaps over
  25 ms), measured the same way as E13 (`headed_check.py`).
- **Also:** the same in visible Chromium, and a look by eye in Martin's desktop
  Firefox and Chrome.
- **Before any speed measurement:** a pixel check that the canvas matches the
  SVG, at several mechanism times, with the camera at rest. Silent drawing
  errors are the main risk of the port.
- **If Firefox is not smooth:** diagnose (see "Thinking level" below). The next
  option is O3, CanvasKit.
- **Stop points:** none tonight (see "Working alone overnight"). Normally they
  would be the player's data model (over 150 lines, the rule in
  `~/.claude/AGENTS.md`) and the first measurement. Record the data model in
  PLAN.md for the morning review instead.

## Open design choice for the data model

- **(a)** The player reads the generated SVG itself (`DOMParser`), walks its
  elements into a draw list, and plays the SMIL itself. The generator stays the
  single source, and no new format is needed.
- **(b)** A copy of the generator exports JSON: the same path strings, styles,
  clips and keyframes.

We leaned towards (a) for the test. It is not decided.

## What the player must reproduce

It must reproduce everything the production SVG uses
(`public/cover/skeleton-watch.svg`, written by `art/skeleton_watch.py`):

- `<g>` with `transform="translate(x y)"` and `rotate(a)`; nesting;
  `clip-path="url(#…)"`.
- `<path d>` (M, L, A, Q, C, Z; arcs; even-odd fills), `<circle>`, `<rect rx>`.
- Fill, stroke, `stroke-width` (2, 2.5, 3, 4: the house ladder),
  `fill-opacity`, `stroke-opacity`, `fill-rule="evenodd"`,
  `stroke-linejoin="round"`, `stroke-linecap="round"`.
- `<clipPath>` with one even-odd path: a large square with a circular hole.
- `<animateTransform type="rotate">` with `values`, `keyTimes`, `dur`,
  `repeatCount="indefinite"`, and sometimes `accumulate="sum"`: the gear
  train and the hands step and hold.
- `<animate attributeName="d">`: the hairspring's morph. 25 frames with the
  same command structure, linear between `keyTimes`.
- Every animated attribute also has a static value equal to its first frame.

Mechanism facts:
- balance period 2 s, amplitude 150°, 24 linear keyframes per period;
- the gear train and hands accumulate over one 2 s period;
- the fourth wheel and the seconds hand loop over 60 s;
- the hands show 2:35.

## Decisions that carry over (from the zoom task)

- **Design:** option B.
  - A persistent `global-bottom.vue` layer holds one watch for the whole talk.
    Slidev mounts it once, so the clock never restarts.
  - Each slide names a view in frontmatter (`watch: hairspring`).
  - `slide-bottom.vue` renders a marker. The rule
    `.watch-marker ~ .slidev-layout { background: transparent }` makes watch
    slides see-through.
- **The hairspring view:**
  - the balance circle (radius 56, centre (845.1, 162.7) on the 980 × 552
    canvas) becomes radius 250 at (705, 276), a scale of 4.4643;
  - the camera is `translate(X, Y) scale(S)`;
  - only the hairspring stays after the fade (the balance and impulse jewel may
    come back later).
- **The zoom:**
  - one key press;
  - the camera is **linear in scale** (Martin prefers it to linear in log
    scale), eased like CSS `ease-in-out`, `cubic-bezier(0.42, 0, 0.58, 1)`, over
    1.8 s;
  - the translation grows with the scale, so one point stays still;
  - on zoom in, the camera moves first, then the fade (0.8 s) starts **when the
    camera stops** (from JS, not a pending CSS `transition-delay`);
  - on zoom out, the parts fade in first, then the camera moves.
- **Line widths** stay constant on screen during the zoom: divide each width by
  the scale. **Not** `vector-effect: non-scaling-stroke`, which makes Firefox
  drop frames.
- **Cover text:** it fades with `transition: fade-out` in the headmatter,
  which becomes the deck default. A slide can override it with its own
  `transition:`. Slidev uses slide N's `transition:` between N and N+1, in
  both directions.
- **One decimal per coordinate** is enough at 4.46×.
- **Browsers:** everything must work in Chrome and Firefox. A test in one is
  not complete until it runs in the other.

## Slidev facts found (Slidev 53.0.0)

- A global layer cannot use `useSlideContext()`. Use
  `inject(injectionSlidevContext)`, imported from
  `'@slidev/client/constants.ts'`: the subpath without `.ts` fails in dev.
- Vite cannot `?raw`-import a file under `public/`. Put the SVG elsewhere, and
  import it from there.
- The theme sets the palette variables and the opaque page colour only on
  `.slidev-layout`. A root element with the class `slidev-layout` gives the
  layer the page colour `#FAF7F0`. Slidev's own info dialog does the same.
- The class trick makes `stem/tools/offline_check.py` report the layer instead
  of the slide. **Martin approved a one-line fix:** look inside `#slideshow`.
  Not made yet.
- **Where each context renders:**
  - the presenter's current slide renders `global-bottom`;
  - the presenter's next-slide pane and the overviews do not; they need a
    still copy from `slide-bottom.vue`;
  - print renders `global-bottom` once per page, with that page's own `nav`
    context.
- **Harmless console noise from Slidev itself:** "Failed to patch FloatingVue";
  in headless Chromium, "Wake Lock permission request denied".

## Measurement harness to copy (from `../2026-09-25-zoom-to-hairspring/spike/`)

This task keeps its own copies. Do not import across task directories.

| File | Use |
| --- | --- |
| `spike_browser.py` | local server for `site/`, the two browsers, `open_page` (closes each page) |
| `spike_pixels.py` | `grab`, `sharpness`, `ink`, `crossings` (width and extent) |
| `headed_check.py` | frame gaps and scales in **visible** windows, in rounds (`headed_check.py <round>`) |
| `jank_check.py` | frame gaps headless, five zooms per variant |
| `check_compensated.py` | line width during the zoom |
| `site/zoom.html` | the SVG test page and its query options (`mode`, `ease`, `stroke`, `host`, `fadelater`, `smil`, `drop`, `clips`, `only`) |
| `mirror/` | a copy of the generator whose output is byte-identical to production |
| `make_svgs.py` | tags the SVG (`data-part`, the camera group, the view CSS) |
| `deck/` | the three-slide Slidev spike (global and slide layers) |

Run Python with `stem/.venv/bin/python3`. From a task's `spike/`, that is
`../../../../.venv/bin/python3`. Check it with
`stem/.venv/bin/python3 tools/check_python.py <files>`: ruff, `mypy --strict`
and pyright.

## The baseline to beat (INVESTIGATION.md, E13)

| Visible window, SVG page (`mode=js&ease=linear&fadelater=1&stroke=compensated`) | Slow frames per zoom | Worst gaps |
| --- | --- | --- |
| Firefox, host 1 | 3–5 | 33–43 ms, always at scale 2.15–2.55 |
| Firefox, host 1.5 | 10–12 | 50–58 ms |
| Firefox, host 2 (about a 1920 × 1080 projector) | 17 | up to 83 ms |
| Firefox, host 2, mechanism stopped | 4–6 | up to 50 ms |
| Chromium, hosts 1 and 2 | 0–1 | one 150 ms gap in about 30 zooms, when the fade starts |

By eye, in Martin's desktop browsers:
- Chrome is "buttery smooth".
- Firefox has a single 100–200 ms freeze about a third of the way in. Its
  `about:support` reports Compositing: WebRender (hardware).

## Gotchas learned the hard way

- **Close every Playwright page after use.** A hidden page gets its animation
  frames throttled (F3).
- **`SVGTransformList.consolidate()` on `animVal` throws.** Use
  `getItem(0).angle`. Always give a page evaluation a timeout, so an exception
  inside a frame loop cannot hang the run (F5).
- **Never set state on the live drawing just to read something:** it starts
  transitions (F1).
- **A computed transform can be `none`.**
- **Keep each measurement round's results in its own file** (F8).
- **When the test page changes, rerun what depends on it,** and keep the old
  results as superseded (F9).
- **Look at the captured images.** Most faults were found that way, not by the
  metric.
- **Playwright's visible windows** here have `devicePixelRatio` 1. Martin's
  desktop browsers have 2.
- **The machine:** MacBook Pro, M3 Pro, 36 GB, macOS 26.6.2, on mains power.
- **`sed` here is GNU `sed`,** so `sed -i ''` fails. Prefer the Edit tool or a
  Python rewrite.

## Thinking level

Martin asked about this before the compaction. The advice given:
- **High for the whole task.**
- The port is implementation, but its main risk is silent drawing errors,
  which need careful checking.
- Switch higher if the first Firefox measurement is ambiguous or stalls: the
  work then becomes diagnosis.

## Standing rules (from the AGENTS.md files)

- **Commits:** never commit without Martin's approval. Before pushing,
  `git pull --rebase`.
- **Formatting:** after editing project files, run `pnpm format` in `stem/`.
  It skips `tasks/`.
- **Code design:**
  - show the data model before writing a script over about 150 lines, and
    wait for approval (**suspended tonight:** record it in PLAN.md and go
    on);
  - descriptive names;
  - objects, not strings;
  - one place for each fact and each computation.
- **Task directory:** it holds options, evidence and its own copies of tools.
  The project's `docs/` get updated only when Martin says a task is complete.
- **Writing:** ASD-STE100 style; LaTeX in Markdown where it fits.

## State of the project (nothing outside `tasks/` has been changed by this work)

- `watches/slides.md` has Martin's uncommitted placeholder edits:
  - slide 2 is "Hairspring and Balance Wheel";
  - the escapement slide at the end was removed.

  Slide 1 is production. The last slide is hidden.
- **Not yet approved:** moving the SVG to `art/skeleton-watch.svg`.
- **Open in the zoom task:** question 4, what to do about Firefox. This test is
  the answer being tried.
- **Approved:** the generator's data model: part tags; `Hairspring`, `Hand`,
  `Frame` and `View` classes; `--stills`. It is described in the zoom task's
  PLAN.md, and not implemented yet.
