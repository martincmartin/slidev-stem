# Measurements: the drawings at the back row

**Covers:** what this talk's drawings measure at the design venue: the four
timekeepers, the cover watch and the diving board.
**Read before** you change a drawing, or claim that one is legible. How to
read the metrics is in [`stem/docs/legibility.md`](../../docs/legibility.md).
**Tasks:**
[`2026-10-04-balance-rim-marks`](../tasks/2026-10-04-balance-rim-marks/README.md)
(the selected radial screws and rim motion),
[`2026-09-20-animation-style`](../tasks/2026-09-20-animation-style/README.md)
(the timekeepers, §14),
[`2026-09-29-webgl-watch`](../tasks/2026-09-29-webgl-watch/PLAN.md) (the
watch), [`2026-09-30-flexing-ruler`](../tasks/2026-09-30-flexing-ruler/PLAN.md)
(the ruler that the diving board replaced), and
[`2026-10-01-raised-escapement`](../tasks/2026-10-01-raised-escapement/README.md)
(the lower oscillator and its measurements), and
[`2026-10-03-rest-shape`](../tasks/2026-10-03-rest-shape/README.md)
(the board and spring rest outlines), and
[`leader-correction`](../tasks/2026-10-03-rest-shape/leader-correction/README.md)
(the leader's contrast), and
[`2026-10-04-leader-path-comparison`](../tasks/2026-10-04-leader-path-comparison/README.md)
(whole-path routing, the single curl edge, and the original-path comparison), and
[`weight-tuning`](../tasks/2026-10-04-leader-path-comparison/weight-tuning/README.md)
(the weight trials), and
[`selection-and-layering`](../tasks/2026-10-04-leader-path-comparison/selection-and-layering/README.md)
(the selected leader and reference paint order).

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
stills of it (`pnpm art:stills DIR` writes them).
Measured 2026-10-04 at `TV 55in @7m`, with the selected rim screws.
The cover uses tilt $0^\circ$ and a $980 \times 552$ CSS px canvas.
Each CSS pixel uses two device pixels:

```
drawing   ink%    hold    p90    Fmax     dPeak   px2 >=3:1
cover      6.5    4.12   7.90   0.133     10.29      3879.0
```

It clears the gate. `dPeak` is the change between two frames one second apart:
the balance at each end of its swing, and the escapement one step on. One
second is half the balance's 2 s period. `motion.py`'s default (30 s) is a
whole number of periods, so the escapement would look still.

## Balance rim motion

Measured 2026-10-04 at `TV 55in @7m`, from 55 frame pairs separated by 100 ms:

| View          | Mean CSS px² changing by at least 3:1 | With ambient flare $F=0.05$ |
| ------------- | ------------------------------------: | --------------------------: |
| Cover         |                                   258 |                         221 |
| Balance Wheel |                                 2,626 |                       2,351 |

The score covers the projected rim band and excludes the arms and hairspring.
The cover score includes some nearby mechanism motion in that band.
These values measure visible change, not human recognition of a mark.
The [task](../tasks/2026-10-04-balance-rim-marks/README.md) holds the frame captures, exact values, method, and limits.
The installed model is checked against the selected proposal in both browsers.

## The diving board

Measured 2026-10-06 at `TV 55in @7m`, with the straight pool edge.
The SVG runs on its own clock; the page starts it on a click:

```
drawing          ink%    hold    p90    Fmax     dPeak   px2 >=3:1
diving-board     21.6    3.37    3.37   0.050      8.96        3216
```

It clears the gate. The hold is the water against the paper: the water is a
substance, the water colour at 0.6, the bottom of the water window in
[`illustrations.md`](../../docs/illustrations.md). At 0.5 the hold was 2.65, and at
0.3 it was 1.73: below the gate.

## Rest outlines and callout

Measured 2026-10-04 at `TV 55in @7m`, from isolated Chromium screenshots at the slide's size:

| Reference and callout          | hold | p90  | Fmax  |
| ------------------------------ | ---- | ---- | ----- |
| Hairspring, straight board     | 3.35 | 5.16 | 0.055 |
| Hairspring, single spring edge | 3.35 | 5.12 | 0.055 |

Both clear the 3:1 gate. These screenshots include the dashed ghost, leader, and label on the slide background.
The label was then "Rest Shape", in muted at 29 px. The callout's sentence that
replaced it (ink and accent, 35 px) has not been measured with `barroom`.
They exclude the moving subject, pool, and title.
The reference paints above the subject, so shared portions remain visible.
The task holds the source screenshots and machine-readable results.

## Rest-shape leader alone

Measured 2026-10-04 at `TV 55in @7m`, with each leader isolated on the slide background:

| Leader                        | hold | p90  | Fmax  |
| ----------------------------- | ---- | ---- | ----- |
| Hairspring, straight board    | 3.58 | 4.85 | 0.080 |
| Hairspring, curled hairspring | 3.70 | 4.85 | 0.092 |

The leader clears both the resolution floor and the 3:1 contrast gate.
Its stroke width is set by `LeaderDesign` in `art/diving_board.py`.
The [correction task](../tasks/2026-10-03-rest-shape/leader-correction/PLAN.md) compares the allowed widths.
The earlier 2 px leader cleared the width floor but failed the blurred contrast gate when measured alone.
The ghost, label, and live subject are absent from these isolated measurements.

## Escapement leaders alone

Measured 2026-10-07 at `TV 55in @7m`, from a Chromium screenshot of the Escapement slide at
the jewel's click (then click 6, now click 4; 1960 × 1104), with the balance at
rest and only the three leaders shown (the second, `#B5601E`, 4 px). The wheel's
and the pallet's leaders then ended inside their parts. They now end on the
paper and are shorter; they have not been measured again.

| Leaders           | hold | p90  | Fmax  |
| ----------------- | ---- | ---- | ----- |
| Escapement, three | 3.33 | 4.14 | 0.049 |

They clear the 3:1 gate, with less room-light headroom than the Hairspring slide's muted
leader (Fmax 0.080). In ink they held 6.90, with Fmax 0.277: the second costs
contrast and room-light headroom, for a leader that the audience can tell from
its label's other words and from the subject's lines
([`2026-10-07-theme-colour-system`](../../tasks/2026-10-07-theme-colour-system/PLAN.md),
§4.10). The labels, the drive arrow and the watch were hidden; they have not
been measured.
