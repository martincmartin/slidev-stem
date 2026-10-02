# Measurements: the drawings at the back row

**Covers:** what this talk's drawings measure at the design venue: the four
timekeepers, the cover watch and the diving board.
**Read before** you change a drawing, or claim that one is legible. How to
read the metrics is in [`stem/docs/legibility.md`](../../docs/legibility.md).
**Tasks:**
[`2026-09-20-animation-style`](../tasks/2026-09-20-animation-style/README.md)
(the timekeepers, §14),
[`2026-09-29-webgl-watch`](../tasks/2026-09-29-webgl-watch/PLAN.md) (the
watch). The diving board replaced the ruler of
[`2026-09-30-flexing-ruler`](../tasks/2026-09-30-flexing-ruler/PLAN.md).

**Measure again whenever the art changes**, and update this page. In `stem/`:

```bash
uv run tools/barroom.py watches/public/
uv run tools/motion.py watches/public/
```

`uv run ../tools/validate.py` in `watches/` runs both, and also measures stills
of the watch; it fails only if a drawing is below the gate.

## The timekeepers

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
through 3:1 at about 8% ambient flare. **If the room is bright, ask the venue
to turn off the lights over the screen.** That costs less than any change to
the art. Not an oversight: heavier or darker line work raises these numbers,
but it stops being this drawing style (the animation-style task, §14).

## The cover watch

The watch is drawn live in WebGL, so `barroom.py` and `motion.py` measure PNG
stills of it (`pnpm art:stills DIR` writes them). At `TV 55in @7m`, measured
2026-09-29, on the cover at tilt 0, 980 × 552 px at 2 device px for each CSS
px:

```
drawing   ink%    hold    p90    Fmax     dPeak   px2 >=3:1
cover      6.6    4.12   7.89   0.133     10.33        3925
```

It clears the gate. `dPeak` is the change between two frames one second apart:
the balance at each end of its swing, and the escapement one step on. One
second is half the balance's 2 s period. `motion.py`'s default (30 s) is a
whole number of periods, so the escapement would look still.

## The diving board

At `TV 55in @7m`, measured 2026-10-01, the SVG on its own clock (the page
starts it on a click):

```
drawing          ink%    hold    p90    Fmax     dPeak   px2 >=3:1
diving-board     19.7    3.37    4.01   0.050      9.59        4552
```

It clears the gate. The hold is the water against the paper: the water is a
wash of the art line at 0.6, the bottom of the water window in
[`illustrations.md`](../../docs/illustrations.md). At 0.5 the hold was 2.65, and at
0.3 it was 1.73: below the gate.
