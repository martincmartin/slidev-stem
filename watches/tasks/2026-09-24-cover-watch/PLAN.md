# Plan: a skeleton watch as the cover slide's background

**Request (user, 2026-09-24).** "Create a background SVG for the cover slide,
using the same colors as sundial.svg, of a skeleton watch in our current
illustration style, 'line weighted'."

**Paths.** `stem/…` is the repo root. `./` is this task directory.

## What is fixed

- **Colours.** `sundial.svg` uses all four art colours: `#143C6B`, `#736A60`,
  `#2A2520` and `#D3DCE3`. The drawing uses these four and no others. Each
  colour keeps the job that `stem/docs/illustrations.md` gives it.
- **Style.** The stroke ladder (2, 2.5, 3 and 4 CSS px), the 3:1 floor for
  marks that carry the drawing, and "static values match frame 0".
- **Size.** A background fills the slide, so the file states the canvas:
  `width="980" height="552" viewBox="0 0 980 552"`. One unit is one CSS px.
- **The cover layout.** The theme has no cover layout of its own. Slidev's
  built-in `cover.vue` is only `<div class="slidev-layout cover"><slot/></div>`,
  so it ignores the `background:` frontmatter. The slide must place the drawing
  itself.

## Data: the space the title needs

Measured in the dev server (Fraunces 600, 56 px, the theme's cover `h1`):

| title text, one line                         | width    |
| -------------------------------------------- | -------- |
| What Every Nerd Should Know About Watches    | 1261 px  |
| What Every Nerd                              | 464 px   |
| Should Know                                  | 363 px   |
| About Watches                                | 410 px   |

Today the title is two centred lines, 871 px wide, from x = 53 to x = 924.
It uses almost all of the 980 px canvas. The layout padding is 56 px.

## Decision 1: composition

| option                                                           | title contrast | watch at the back row (7 m)       | whole movement visible | change to the slide                  |
| ---------------------------------------------------------------- | -------------- | --------------------------------- | ---------------------- | ------------------------------------ |
| **B.** Watch centred behind the centred title, faded (watermark) | drops where lines cross it | gone: it must stay near 1.2:1 to keep the title clean | yes | none |
| **C.** Watch on the right; title left-aligned in three lines     | unchanged (no overlap) | line work at full strength, 9.6:1 | yes (the case edge and crown are cropped) | left-align the cover; three-line title |
| **G.** Watch rises from the bottom edge; title centred above it  | unchanged (no overlap) | full strength                     | no: about 45 % of the dial | move the title to the top |

- **B** breaks the house rule for the art. `illustrations.md` says that a wash
  cannot hold 3:1 and that "the drawing must read with every wash removed". A
  watermark is a wash and nothing else. It also puts line work behind every
  letter of the title.
- **G** keeps the centred cover, but it hides the lower half of the movement.
  The balance wheel and escapement usually sit there, and they are the
  subject of the talk (the escapement and the hairspring).
- **C** keeps every mark at its house strength and puts nothing behind the
  title. Its cost is a left-aligned cover and a three-line title. The widest
  line is 464 px, so the title ends at x = 520 and the watch can start at
  x = 548.

**Ranking.** 1. C, 2. G, 3. B. **Chosen: C.** Only C shows the whole
movement at full strength with a clean title.

The SVG is still a background: it fills the canvas, and the title sits on top
of it. The drawing leaves the left half empty.

## Decision 2: what moves

The style has "one loop per subject". The subject of the talk is the
escapement: it turns a continuous force into ticks.

| option                                                  | shows the talk's idea | cost                                     |
| ------------------------------------------------------- | --------------------- | ---------------------------------------- |
| **M0.** Static                                          | no                    | none                                     |
| **M1.** The escapement: balance, hairspring, pallet fork, escape wheel, fourth wheel | yes | five animations; they must stay in sync |
| **M2.** M1 and the whole train, the hands and the barrel | yes                   | the centre wheel turns once an hour, so its motion is invisible |

**Chosen: M1.** It is slow motion of a real watch, at one beat per second:

- the balance swings ±150° with a period of 2 s (a real one: 0.3–0.4 s);
- the hairspring winds and unwinds with it;
- at each pass of the balance through centre, the fork flips and the escape
  wheel advances half a tooth;
- the fourth wheel turns 6° per tick, one turn a minute, as a real seconds
  wheel does, and carries a seconds hand (user, 2026-09-24);
- the third wheel turns at 1/7.5 of the fourth wheel's rate (0.8° per tick) and
  the centre wheel at 1/8 of the third wheel's rate (0.1° per tick), the ratios of a
  real watch (user, 2026-09-24). So the centre wheel and the minute hand on
  its arbor turn once an hour, and the hour hand (12:1) once in 12 hours;
- only the barrel stays still.

These slow parts use one period of keyframes with `accumulate="sum"`, so each
repeat starts where the last one ended. A full-turn keyframe list would need
3600 ticks for the centre wheel. `accumulate` was tested in Chromium and
Firefox, and both gave the same angles (108° at 20.9 s for 10° per 2 s).

The escape wheel turns anticlockwise (its teeth lead that way), so the fourth
wheel, which meshes with its pinion, turns clockwise, as a seconds hand must.

The loop lengths are 2 s, 6 s (the escape wheel: 72°, one symmetry of 15 teeth
and 5 spokes) and 60 s (the fourth wheel and its seconds hand: one turn).

**`tools/motion.py` needs `--sep 1` for this drawing.** By default it samples
half the longest loop apart: 30 s, which is 15 whole balance periods, so the
balance, the fork and the escape wheel land at the same phase and cancel. At
1 s (half a period) they are at opposite ends of their motion.

## Decision 3: which colour does which job

From the jobs in `illustrations.md`:

| colour                 | job in the sundial        | job in the watch                                                   |
| ---------------------- | ------------------------- | ------------------------------------------------------------------ |
| `#143C6B`              | the dial, the gnomon edge | the movement: wheels, balance, hairspring, mainspring, fork, hands |
| `#736A60`              | the plate's wall          | the case, lugs, strap and crown; the faces of the three hands      |
| `#2A2520` at 0.5       | the hour ticks            | the minute ticks                                                   |
| `#D3DCE3`              | the gnomon's lit face     | lit metal faces: the chapter ring, the wheels, the balance, the fork |
| `#736A60` wash, 0.18   | the plate wall            | the case band, the lugs and the strap                              |

**User changes (2026-09-24).**

- No pure supports: the plate rim, bridges, balance cock, pallet bridge,
  jewels and screws were drawn and then removed. The case and the chapter
  ring stay. Each arbor shows a small pivot circle instead of a jewel.
- The hands are daggers with a `#736A60` face and a `#143C6B` outline. The
  user first asked for `--palette-second` (`#9A6238`), then chose the
  sundial's frame colour. It keeps the drawing to the four art colours, so
  `artcheck.py` passes.

In a skeleton watch the wheels overlap in plan view: each wheel's teeth reach
the pinion at the centre of the next. `illustrations.md` warns that a
translucent mark does not hide what is behind it, and the openings in a wheel
hide nothing either. So each lower wheel is clipped by the root circle of the
wheel above it (the inside edge of its teeth; the user asked for the gaps
between teeth to stay open, 2026-09-24) (the `skeleton-watch-under-*` clip paths). Without the clip,
the fourth wheel's teeth showed through and around the escape wheel, and the
escapement read as a tangle.

## How the drawing is made

`./gen_watch.py` writes the SVG. Gear teeth, spirals and the animation
keyframes are computed, so the drawing is generated, not hand-written. The
script writes into `./out/`. The file is then copied to
`stem/watches/public/cover/skeleton-watch.svg`.

## Checks

In `stem/`: `tools/artcheck.py`, `tools/contact.py`, `tools/barroom.py` and
`tools/motion.py` on the new file. Then a screenshot of the cover in the dev
server, and `pnpm build`.

## Measurements (2026-09-24, the shipped drawing)

In `stem/`, at `TV 55in @7m`:

```
python3 tools/artcheck.py      ok (notes: the 0.18 washes and the 0.5 minute ticks)
tools/barroom.py               ink 6.4%  hold 3.72  p90 6.79  Fmax 0.088
tools/motion.py --sep 1        dPeak 9.45  px2 >=3:1  2701
```

The watch clears the gate. Its `Fmax` is about the candle's (0.078), the
weakest timekeeper.
