# WebGL for the watch: planning

Closed on 2026-09-29. **The decision: draw the skeleton watch live in WebGL, for
the whole talk, with no SVG of the watch.** [PLAN.md](PLAN.md) has the options,
the measurements and the reasons. The requests are in
[instructions.md](instructions.md).

| Path | What it is |
| --- | --- |
| [PLAN.md](PLAN.md) | The plan: the spike, the line methods, the deck tests, the opening, the ranking, the stages, the risks |
| [tools/](tools/) | The spike (`webgl/`), the model and export (`cover_model.py`, `scene_export.py`), and the checks (`pixel_check.py`, `fade_check.py`, `settle_check.mjs`, `deck_check.py`) |
| [tools/method_comparison/](tools/method_comparison/) | The frozen comparison of the hidden-line methods (section 4) |
| [deck/](deck/) | The test decks: `slides.md` (11 slides) and `slides-opening.md` (the talk's opening) |
| [evidence/](evidence/) | The results, as JSON, and the figures |
| [inputs/](inputs/) | The frozen 2D drawing that the spike was compared with |
| `out/` | Scratch output, ignored by git: `scene.json`, the reference SVGs, screenshots |

PLAN.md, section 14, gives the commands that reproduce the evidence.

## Later decisions

- 2026-09-29: the implementation is
  [`watches/tasks/2026-09-29-webgl-watch/`](../2026-09-29-webgl-watch/instructions.md).
  It ports the spike to TypeScript, makes the geometry in TypeScript from a
  design file that Python writes, and removes the watch's SVG. It keeps frozen
  copies of the spike and 13 reference pictures that the spike drew.
- 2026-09-29: implemented. The TypeScript renderer, the generator and the
  live slides are built, and the watch's SVG is removed; the checks pass and
  the measurements are in the implementation task's `PLAN.md`
  (`../2026-09-29-webgl-watch/PLAN.md`).
- 2026-10-11: the camera that this plan took from the 2D plan (orthographic,
  a tilt about x) is now a choice of look, not a limit. A slide may turn the
  camera about another axis or use perspective. `stem/docs/webgl.md`, "The
  house style in 3D", says what each change needs.
