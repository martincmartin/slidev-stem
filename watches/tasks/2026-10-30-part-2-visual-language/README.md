# Part 2's visual language

How Part 2's slides carry more text and still show, not tell. Four styles
tell one story, Anson's search for Juan Fernández in 1741, with the same map
and facts: a reading rail, cards after the motion, Lessig screens, and labels
on the picture. The recommendation is the labels. Round 2 works on the
labels: the wind, the ship, and when the islands show. Round 3 retired the
rail and the cards, and compares outlines, cards and paper-colored words for
the labels, and dimming against removing old labels. Round 4 adds the Cape
Noir slide before the Anson slide, and a globe on a canvas that the camera
zooms and turns, from the whole globe to Cape Noir and on to Juan Fernández.
Round 5 adds the Scilly slide after the Anson slide: a flight across the
Atlantic to the English Channel, and a zoom in to the Isles of Scilly. It
also checks the cause of the wreck of 1707. Round 6 cuts words, keeps some labels,
dimmed, to the end of their slide, and compares three backings for each
slide's punchline in big type.

- `instructions.md`: the request.
- `PLAN.md`: the criteria, the options, the measurements, the ranking, the
  language as rules, the Longitude Problem slide by slide, and the facts
  with their sources and corrections.
- `mockup/`: the mockup, served by `mockup/vite.config.ts`. `index.html`
  steps through either style of `story.ts`, with the choices of
  `choices.ts`; `prize.html` and `newton.html` are
  two still frames in the recommended style. `geo.ts` is the maps'
  projections and the camera, `globe.ts` draws the globe on a canvas at each
  frame, `maps/` holds the story maps and the globe's data (`globe.json`)
  that `tools/maps.ts` writes, and `ledger.css` is a copy of the house
  palette.
- `tools/maps.ts`: draws the story maps from Natural Earth 1:10m land, and
  writes the globe's data at 1:110m, 1:50m and 1:10m.
- `tools/shots.ts`: takes a picture of each style at each step, and of the
  labels in motion, measures the text, and makes the sheets.
- `tools/speed.ts`: times each camera flight in Chromium, Firefox and WebKit,
  in windows if asked.
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
  and each way with old labels (`dim`, `remove`). The mockup now always
  removes them.
- `evidence/round-4/`: round 4's output of `shots.ts`: `globe/` (both
  styles, from the whole globe), `america/` (the labels, from South America)
  and `paper/` (the labels in paper words); and of `speed.ts`, in windows:
  `speed-globe.json` and `speed-america.json`.
- `evidence/round-5/`: round 5's output of `shots.ts`, `globe/` (both
  styles, from the whole globe, with Scilly), and of `speed.ts`, in windows:
  `speed-globe.json`.
- `evidence/round-6/punch-card/`, `punch-veil/` and `punch-screen/`: round
  6's output of `shots.ts`, the labels with each backing for the
  punchlines; `remove/`, with the labels that stay removed; `lessig/`,
  the Lessig style.

Run each tool from the talk's directory (`PLAN.md`, section 11).
