# Part 2's opening slides: the plan for the talk

The plan to build the three story slides of Part 2 (Cape Noir, Juan
Fernández, Scilly) in the talk and its article, from the mockup of the
visual-language task. It chooses what each part of the picture is drawn
with (WebGL, a 2D canvas, SVG or HTML), lists what the spike taught, and
orders the work.

- `instructions.md`: the request.
- `PLAN.md`: the requirements, the options with their data, the ranking,
  the lessons of the spike, the work in phases, and the decisions for you.

2026-11-01: The simplicity cleanup removes the unused move-duration override.
Flights keep their own duration. Voyage steps, label measurement, projection
calculations, and pixel checks now use shared functions. Test dimensions stay explicit.

2026-11-01: Phase 7 adds the narration, a stepped voyage and its final static
map. Phase 8 adds the checks below and fixes the paused endpoint. The
physical Android Firefox check remains open because the phone could not
reach the preview. Work is in `work2`; no commit was made.

- `checks/check-article.ts`: the browser matrix and static article check.
- `checks/check-print.ts`: the printed voyage's counts in all three engines.
- `checks/measure-frames.ts`: Part 2 timing in visible browser windows.
- `evidence/phase-8/README.md`: results, limits, commands and frozen inputs.

2026-11-01: The user confirmed that the physical Android Firefox check works
and approved publication. Phases 7 and 8 are complete. The result is in
[evidence/phase-8-android-firefox/README.md](evidence/phase-8-android-firefox/README.md).
