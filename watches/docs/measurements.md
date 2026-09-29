# Measurements — the timekeepers at the back row

What the four timekeeper drawings measure at the design venue. The metrics, and
how to read them, are in [`stem/docs/legibility.md`](../../docs/legibility.md).

**Re-measure whenever the art changes**, and update this page. In `stem/`:

```bash
.venv/bin/python3 tools/barroom.py watches/public/timekeepers/
.venv/bin/python3 tools/motion.py watches/public/timekeepers/
```

At `TV 55in @7m`, measured 2026-09-23:

```
drawing        ink%    hold    p90    Fmax     dPeak   px2 >=3:1
candle          8.5    3.63   8.04   0.078     12.19        518
hourglass      20.2    4.42   6.74   0.145      6.45        643
sundial        17.0    4.18   8.74   0.127      8.47        196
water-clock    26.6    5.39   8.13   0.201      7.59        658
                       ----                 ---- motion, tools/motion.py
               mean    4.40   7.91   0.138
```

All four clear the gate. The weakest is the candle: `Fmax 0.078`, so it falls
through 3:1 at about 8% ambient flare. **If the room is bright, ask the venue to
turn off the lights over the screen.** That costs less than any change to the art.
Heavier or darker line work raises these numbers but stops being this drawing
style; it was tried and rejected (`tasks/2026-09-20-animation-style/README.md`
§14).

## The cover's skeleton watch

The cover's watch is drawn live in WebGL ([`stem/docs/webgl.md`](../../docs/webgl.md)),
so `barroom.py` and `motion.py` measure PNG stills of it (`pnpm art:stills DIR`
writes them; `validate.py` does the same and runs both tools). At
`TV 55in @7m`, measured 2026-09-29, on the cover at tilt 0 and 980 × 552 px
at 2 device px for each CSS px:

```
drawing   ink%    hold    p90    Fmax     dPeak   px2 >=3:1
cover      6.6    4.13   8.04   0.134     10.17        3346
```

It clears the gate, and it has more headroom than the SVG it replaced (hold
3.64, `Fmax` 0.080). `dPeak` is the change between two frames, one second
apart: the balance at each end of its swing, and the escapement one step on.
One second is half the balance's 2 s period. `motion.py`'s default (30 s) is
a whole number of periods, so the escapement would look still.

### Line widths when the view zooms

When the camera zooms into the watch (to the hairspring, $s = 250/56 \approx
4.46$), each line keeps its width on the screen: the width in the drawing is
divided by the scale. So parts must not meet only through their ink. Where two
parts touch, one is painted over the other (the pallet fork over the escape
wheel, each wheel's teeth over the pinion it drives), or their outlines meet
on their centre lines (tooth tips on the root circle). Keep it so when you
change `art/watch_design.py` or `watch/`.

Scaling the lines with the zoom instead is not an oversight. At 4.46× the
lines are 9–18 px, and no contact in the hairspring view needed it. To check
the art again, run the contact check in
[`tasks/2026-09-26-zoom-line-contacts/`](../tasks/2026-09-26-zoom-line-contacts/README.md).
