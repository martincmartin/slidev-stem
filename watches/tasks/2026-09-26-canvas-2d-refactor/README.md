# Canvas 2D architecture assessment

The planning result is in [PLAN.md](PLAN.md).
It answers [instructions.md](instructions.md), ranks the options, and defines implementation checks.
No production implementation was changed.

| File or directory                                                          | Purpose                                                                        |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| [PLAN.md](PLAN.md)                                                         | Recommendations, alternatives, calculations, and future stages.                |
| [SOURCES.md](SOURCES.md)                                                   | Primary-source links and dated notes.                                          |
| [inputs/manifest.json](inputs/manifest.json)                               | Hashes and origins of the frozen inputs.                                       |
| [assess_design.py](assess_design.py)                                       | Drawing census, geometry counterexamples, timing calculations, and depth plot. |
| [browser_probe.py](browser_probe.py), [browser_probe.js](browser_probe.js) | SVG handoff, input-contract, composition, and worker capability checks.        |
| [evidence/](evidence/)                                                     | Saved machine-readable results and the plot.                                   |
| `out/`                                                                     | Ignored checker caches.                                                        |

The scripts read this task's input copies. They do not depend on future changes to the production drawing.
The browser probe needs the saved Playwright environment and installed browser binaries.
See PLAN.md for commands and test limits.

## Proposal revisions

2026-09-27: Revised [PLAN.md, section 4](PLAN.md#4-input-format-and-source-of-truth) after review of the required SVG output.
SVG input now ranks first; a separate complete JSON scene ranks second.
Option 3 compares supplemental numeric data inside SVG with a separate file.
The runtime architecture and implementation stages use the revised recommendation.

## Later decisions

- 2026-09-27: [`../2026-09-27-canvas-2d-planning/`](../2026-09-27-canvas-2d-planning/PLAN.md)
  replaced this proposal with a new Canvas 2D and SVG plan. That plan carries
  the settle and the ruler model.
- 2026-09-29: [`../2026-09-28-webgl-planning/`](../2026-09-28-webgl-planning/PLAN.md)
  recommends WebGL for the whole talk, with no SVG, and the user chose that
  route. The SVG reader and the Canvas 2D adapter of this plan will not be
  built. The findings of this plan that still apply to WebGL are in section
  13.1 of that plan.
- 2026-09-29: the task is closed. Both commands in PLAN.md, section 12, still
  reproduce `evidence/` byte for byte. `../.venv/bin/python` gives a warning
  about the path: `uv run --project .. python` in place of it gives none.
