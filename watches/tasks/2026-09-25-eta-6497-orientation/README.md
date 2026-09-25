# Orient the skeleton watch like an ETA 6497

The plan is in [PLAN.md](PLAN.md). The request named "ETA 6479". The caliber
with that layout is the ETA 6497 (Unitas), so this task uses 6497.

## Step 1: turn the movement by 150°

`LAYOUT` before and after:

| angle          | before |           after |
| -------------- | -----: | --------------: |
| `barrel_angle` |  −90.0 | 60.0 (5 o'clock) |
| `third_angle`  |   50.0 |           200.0 |
| `fourth_angle` |  102.5 |           252.5 |
| `escape_angle` |  147.5 |           297.5 |
| `lever_angle`  |  212.5 |   2.5 (= 362.5) |

The escape wheel's tooth phase changed from 6° to 156°, and the mainspring
spiral's start from 150° to 300°. The search's coarse grid and `BALANCE_SIDE`
turned by 150° too.

Check: each arbor is within $3 \times 10^{-14}$ px of the old arbor turned by
150°. Each clearance is the same within the 1 px sampling error (0.3 px at
most). At 0.25 px sampling, the worst clearance is 11.07 px, from the fork to
the fourth wheel.

The copies in `tools/` are the scripts at the end of step 1. The only change is
`TALK` in `skeleton_watch.py`, which points to `watches/` from this directory.

## Step 2: turn the third wheel toward the barrel

`tools/third_wheel_scan.py` scans two readings of "turn the third wheel":

| reading                                                                   | how far it turns | third-barrel gap | what stops it                               | output                                                         |
| ------------------------------------------------------------------------- | ---------------: | ---------------: | ------------------------------------------- | -------------------------------------------------------------- |
| only `third_angle`; the arbors after it follow the third arbor, unturned |             1.3° |         17.04 px | fourth-centre gap reaches 11.07 px          | [out/third_wheel_scan.txt](out/third_wheel_scan.txt)             |
| **`--carry`**: the third, fourth, escape, fork and balance turn together about the centre arbor |         **9.0°** |     **11.12 px** | third-barrel gap reaches the worst clearance | [out/third_wheel_scan_carry.txt](out/third_wheel_scan_carry.txt) |

**Chosen: `--carry`.** The first reading cannot get the third wheel near the
barrel: the fourth wheel reaches the centre wheel first. With `--carry`, every
gap to the centre wheel and to the chapter ring stays the same. Only the gaps
to the barrel change, so the third wheel stops where the request says: at the
worst clearance from the barrel. At 9.1° the third-barrel gap (11.04 px)
becomes the worst clearance.

Final `LAYOUT`: third 191.0, fourth 243.5, escape 288.5, lever 353.5. The
escape wheel's tooth phase is now 147° (156 − 9), so its teeth keep their
place against the pallets. The balance is at about 12:45 on the dial and the
escape wheel is at about 11 o'clock.

The validator (1 px sampling): tightest visible gap 11.2 px, third-barrel;
fork 11.1 px from the fourth wheel; balance 13.3 px from the chapter ring.
Barroom: hold 3.65 at TV 55in @ 7 m.

## The hands: 2:35, not 10:10

The user asked to turn the hands about 150° clockwise (2026-09-25). At 10:10
they crossed the balance and escapement in their new place. A turn of exactly
150° on both hands shows no real time, so the hands first showed 3:34. At 3:34
the hour hand hid part of the mainspring, so the user chose 2:35.

Barroom at 2:35: hold 3.64, p90 6.90, Fmax 0.080.

## Evidence

- `out/before.svg`, `out/step1.svg`, `out/after.svg` and their PNGs (frame 0,
  from `rsvg-convert`);
- `out/compare.png`: before and after, side by side.
