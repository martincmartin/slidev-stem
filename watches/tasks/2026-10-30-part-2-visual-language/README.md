# Part 2's visual language

How Part 2's slides carry more text and still show, not tell. Four styles
tell one story, Anson's search for Juan Fernández in 1741, with the same map
and facts: a reading rail, cards after the motion, Lessig screens, and labels
on the picture. The recommendation is the labels. Round 2 works on the
labels: the wind, the ship, and when the islands show. Round 3 retired the
rail and the cards, and compares outlines, cards and paper-colored words for
the labels, and dimming against removing old labels.

- `instructions.md`: the request.
- `PLAN.md`: the criteria, the options, the measurements, the ranking, the
  language as rules, the Longitude Problem slide by slide, and the facts
  with their sources and corrections.
- `mockup/`: the mockup, served by `mockup/vite.config.ts`. `index.html`
  steps through either style of `story.ts`, with the choices of
  `choices.ts`; `prize.html` and `newton.html` are
  two still frames in the recommended style. `geo.ts` is the maps'
  projection, `maps/` the maps that `tools/maps.ts` draws, and `ledger.css`
  a copy of the house palette.
- `tools/maps.ts`: draws the maps from Natural Earth 1:10m land.
- `tools/shots.ts`: takes a picture of each style at each step, and of the
  labels in motion, measures the text, and makes the sheets.
- `tsconfig.json`: type-checks the task's TypeScript with the talk's options.
- `evidence/round-1/sea-wash/` and `evidence/round-1/sea-paper/`: round 1's
  output of `shots.ts`, every style, with the sea filled and unfilled:
  `frames/`, `measurements.json`, `sheet.png` (every step) and
  `last-steps.png` (each style's last step).
- `evidence/round-2/wind-bands/`, `wind-near/` and `wind-all/`: round 2's
  output, the labels with each placement of the wind, as in round 1, and
  frames in motion (`frames/labels-motion-*.png`).
- `evidence/round-3/<label>-<old>/`: round 3's output, the labels with the
  wind `near`, for each way a label stands out (`outline`, `card`, `paper`)
  and each way with old labels (`dim`, `remove`).

Run each tool from the talk's directory (`PLAN.md`, section 11).
