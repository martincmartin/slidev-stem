# Theme colour system

The plan, the decisions and the result are in [PLAN.md](PLAN.md).

2026-10-07: Ledger's second is now `#B5601E`, a burnt orange (it was `#9A6238`). Its wash keeps the 20.8% recipe (`#ECD8C4`, 1.29:1 on the background). Slide 4's keyword leaders now hold 3.33 at the back row, Fmax 0.049 (they held 3.60, Fmax 0.081); see `watches/docs/measurements.md`.

2026-10-07: a slide class now reaches the watch and the diving board: the layers read the current slide's palette (`slidePalette()`), and the renderer has `setPalette`. See `tasks/2026-10-07-palette-preview/`.
