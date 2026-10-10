# Full validation in a cloud session

Covers: why full watches validation took about 250 s in a Claude Code cloud
container (33 s on an Apple M3 Pro), what was measured, what changed, and what
was rejected. Measured on 2026-10-10. Read before changing the print check, the
Chromium launch arguments, or the cloud session hook.

## The machine

4 vCPUs, 15 GB of memory, no GPU (no `/dev/dri`). Chromium 153, Firefox 155 and
WebKit 26.6 from Playwright 1.63. Early probes, marked "Chromium 141", used the
image's older pre-installed Chromium before `cdn.playwright.dev` was allowed.

## Why it was slow

Without a GPU, Chromium draws WebGL in software (SwiftShader). The `CHROMIUM_GPU`
flags change nothing there: 1.7 to 1.9 frames a second with or without them.

- **The live watch drew 1.7 frames a second** at 1960 × 1104. The stage's JS
  took about 10 ms a frame (`watchStage.log.drawTimes`); the frames were about
  650 ms apart, so the time is in the GPU process. At a quarter of the pixels it
  drew 2.1 frames a second: the cost is not mostly fill. What SwiftShader spends
  it on, we do not know.
- **The machine was CPU-bound.** In the print check, the live walk kept 3.1 of
  4 cores busy, and the printed loads 3.7.
- **A printed page drew 8 stills and showed 1.** Slidev mounts every slide on a
  `/N?print=clicks` page and shows one; each watch slide drew its still. A load
  took 3.4 to 4.3 s.

Three full runs, each check run again (`--no-reuse`):
[`evidence/full1.json`](evidence/full1.json) to `full3.json`: 251.4, 248.7 and
260.7 s. The critical path was build (8.9 s), print (195.1 s), private browsing
(8.8 s), then smoke navigation alone (40.3 s). The source, SVG and still checks
ran beside print and did not set the total. Medians of the three:

| Check            | Time    | Check            | Time   |
| ---------------- | ------: | ---------------- | -----: |
| print            | 195.1 s | test             | 9.3 s  |
| navigation smoke | 40.3 s  | build            | 8.9 s  |
| lint             | 17.7 s  | private browsing | 8.8 s  |
| stills           | 13.6 s  | typecheck        | 8.2 s  |
| motion           | 12.5 s  | pyright          | 8.1 s  |

Alone, smoke took 35.6 s in Chromium, 19.9 s in WebKit and 11.9 s in Firefox.

## What changed

1. **The print check runs only when it can find something new**: with
   `--print`, or when the working tree changes a print input. See
   [`docs/talks.md`](../../docs/talks.md#the-print-check). This removes about
   three quarters of a cloud run when no print input changed, and weakens
   coverage: a change to shared code or `slides.md` that breaks only printed
   pages fails at `--print`, not at the commit.
2. **A printed page draws only its own slide's still** (`slide-bottom.vue`).
   A load took 1.4 to 2.0 s instead of 3.4 to 4.3 s, with 1 still instead of 8
   ([`tools/stillcount.py`](tools/stillcount.py)). The PDF export
   (`slidev export --with-clicks`) was made before and after: its 42 pages of
   watch slides are pixel-identical at 60 dpi. The other 5 pages, the
   timekeeper cards, differ in a few hundred pixels of their looping SVG
   animations, which an export catches at a different moment each time. Both
   exports timed out twice waiting for a still that the diving board covers:
   that predates this change.
3. **Without a GPU, Chromium gets `--use-angle=swiftshader`** (`CHROMIUM_NO_GPU`).
   It drew the watch at 8.2 frames a second, against 1.7. On the new deck, five
   runs each ([`evidence/lazy-stills-variants.txt`](evidence/lazy-stills-variants.txt)):

   | Variant                       | Print: median (runs)                  | Smoke, Chromium: median (runs) |
   | ----------------------------- | ------------------------------------- | ------------------------------ |
   | current flags                 | 117.4 s (122.8, 116.3, 117.4, 119.5, 112.3) | 31.6 s (33.4, 31.6, 30.1) |
   | `--use-angle=swiftshader`     | 94.3 s (118.1, 92.5, 94.3, 100.2, 93.6)     | 25.9 s (26.6, 23.3, 26.9, 25.9, 23.9) |

   All passed. With Chromium 141, the same flag failed the print check three
   times out of three, at the Hairspring slide's curl click (the live capture
   saw the board without its picture): see
   [`evidence/chromium141-print-variants.txt`](evidence/chromium141-print-variants.txt).
   The capture of that click depends on frame timing.
4. **Cloud setup**: `.claude/hooks/session-start.sh`, described in
   [`docs/talks.md`](../../docs/talks.md#cloud-sessions). It installs pnpm 12
   (the image's pnpm 10 cannot read the lockfiles), updates uv (the old one did
   not know Python 3.14.7), installs the projects, the three engines and
   WebKit's system libraries, and starts Xvfb. Headless Firefox on Linux without
   a GPU has no WebGL without a display: its smoke walk passed without drawing
   the watch, and the private-browsing check failed for Firefox in every run.
5. **`favicon.py --check` compares pixels, not bytes.** The same pixels encoded
   to 931 bytes on Linux and 865 on macOS, so `generated` failed in the cloud.

After these changes, a full run with `--print --no-reuse` passed all 23 checks
in 161.6 s: print 116.3 s, smoke 32.7 s.

## Rejected or not adopted

| Idea                                   | Result                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| One printed load for many slides       | Not valid: the other slides on a printed page do not show that click.                        |
| Four printed-page browsers             | Helped before lazy stills (79 against 91 s, Chromium 141); after, 122.2 s against 117.4 s.   |
| Half viewport (980 × 552)              | Print 156 s against 180 s; states identical; passed 3 of 3 with Chromium 141 and 2 of 2 with 153. Weakens coverage of the viewport's size. Not adopted. |
| Half viewport and swiftshader          | Failed 2 of 2 with Chromium 141.                                                             |
| Mesa (llvmpipe) for Chromium           | Headless Chromium fell back to SwiftShader, or hung, with every ANGLE GL backend tried.      |
| Skip printed positions with one state  | 38 of 47 states are distinct: at most 19% of loads.                                          |

These are single-machine measurements with few runs, not timing distributions.
The probes in [`tools/`](tools/) patch `print_check` and `smokecheck` settings
at run time and take the built deck as an argument.
