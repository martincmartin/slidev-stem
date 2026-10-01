# 2026-09-30 Flash the balance assembly

The request is in [instructions.md](instructions.md). The measurements are in
[flash_colours.txt](flash_colours.txt), from
[tools/flash_colours.py](tools/flash_colours.py).

**Status:** decided and built 2026-10-01 (sections 9 and 10). Not yet closed.

**To see the options:** [evidence/flash-options.gif](evidence/flash-options.gif)
and [evidence/flash-options.mp4](evidence/flash-options.mp4) show A, B, C1 and E
side by side, at the cover view, with the balance swinging: 0.5 s as it is,
the 2.5 s flash, 1 s as it is. A brown dot at the top right of each cell means
"flash on". The script writes each frame to `out/frames/` (git-ignored,
about 53 MB). To draw them again, in
`watches/`: `uv run tasks/2026-09-30-flash/tools/flash_video.py
tasks/2026-09-30-flash/evidence`. The page is `prototype/probe/`, over a copy
of `webgl/` and `watch/` with the two flash inks and the "balance and
hairspring" subject (marked `PROTOTYPE`). It draws each option with a renderer
of its own, not with R1.

The semantic roles of the art colours, and how they come from the theme, are
in [COLOUR-ROLES.md](COLOUR-ROLES.md).

## 1. The existing colour names

Each colour has three names: a theme variable, an ink in the WebGL scene, and a
class in an inlined SVG.

| Job                     | Theme variable           | Hex       | WebGL ink       | SVG class (flexing ruler)         |
| ----------------------- | ------------------------ | --------- | --------------- | --------------------------------- |
| line work               | `--palette-art-line`     | `#143C6B` | `INKS.line`     | `flexing-ruler-stroke-art-line`   |
| fill of a part          | `--palette-art-knockout` | `#D3DCE3` | `INKS.knockout` | `flexing-ruler-fill-art-knockout` |
| frame, case (and wash)  | `--palette-muted`        | `#736A60` | `INKS.frame`    | `flexing-ruler-stroke-muted`      |
| detail (ticks)          | `--palette-ink`          | `#2A2520` | `INKS.detail`   | `flexing-ruler-stroke-ink`        |
| the second accent       | `--palette-second`       | `#9A6238` | (none yet)      | (none yet)                        |

So the line colour is **art-line** and the fill colour is **art-knockout**.
In the balance assembly, every line is art-line and every fill is art-knockout,
with one exception: the impulse jewel is filled with art-line
(`watch/generate.ts`, `balanceSolids`).

## 2. Decision 1: which colours a flash uses

### Why `second`, not the accent

The flash must change the colour a lot. The accent is the hue that art-line
deepens, so it is too near:

| art-line to | dE76 | colour-blind dE | contrast |
| ----------- | ---: | --------------: | -------: |
| accent      |   20 |              21 |     1.73 |
| second      |   69 |              64 |     2.21 |

I also measured `second` deepened to art-line's contrast on the panel
(`#52341E`), as art-line deepens the accent. It changes only the hue (contrast
1.01 against art-line, dE 51). It is a weaker flash, so use `second` as it is.

### The options

The signal of a flash is how much the colour changes, times how much area
changes. At the cover view, the balance has about $3{,}600\ \text{px}^2$ of
fill and $2{,}500\ \text{px}^2$ of line (1.4×). I use

$$\text{signal} = \Delta E_\text{line} \cdot A_\text{line} + \Delta E_\text{fill} \cdot A_\text{fill}$$

in thousands. "Structure" is the flash line against the flash fill. It must
stay at or above the 3:1 floor, or the hairspring disappears where it crosses
the balance. The normal drawing is 8.00:1.

| Option                                         | Line     | Fill                     | Signal | Colour-blind | Structure |
| ---------------------------------------------- | -------- | ------------------------ | -----: | -----------: | --------: |
| A. Lines only                                  | second   | art-knockout (no change) |    176 |          161 |      3.62 |
| B. One colour for lines and fill               | second   | second                   |    388 |          360 |      1.00 |
| C1. Two colours: a pale second like knockout   | second   | `#E6D8CA` (second, 0.20) |    225 |          206 |      3.60 |
| C2. Two colours: the darkest fill at 3:1       | second   | `#D9C5B2` (second, 0.34) |    243 |          224 |      3.01 |
| D. Fill only                                   | art-line | second                   |    212 |          198 |      2.21 |
| E. Inverted: pale lines on a dark fill         | knockout | second                   |    384 |          369 |      3.62 |

C1's fill is `second` over the paper at the opacity that gives it the same
contrast against the paper as art-knockout (1.30:1). It is to `second` what
art-knockout is to art-line: a pale face that reads as lit.

**A. Lines only.**

- Pro: the simplest. One new ink (`second`), and no new theme variable.
- Pro: the structure holds (3.62:1).
- Con: the smallest signal. The fill is 59% of the area, and it does not
  change.

**B. One colour for lines and fill.**

- Pro: the largest signal (2.2× A).
- Pro: one colour, as "drawing in the second colour" says literally.
- Con: structure 1.00. The hairspring lies over the balance's arms and hub.
  During the flash, its coils merge into one brown shape. The next slide is
  about the hairspring.

**C1 and C2. Two colours: `second` for lines, a pale second for fills.**

- Pro: the flashed part is the same drawing in a warm pair of colours. Line on
  fill keeps the same relation as art-line on art-knockout.
- Pro: 28% (C1) or 38% (C2) more signal than A, with the structure at or above
  the floor.
- Con: one more theme variable, and a second new ink.
- C2 against C1: 8% more signal, but no margin on the floor (3.01).

**D. Fill only.**

- Pro: the lines stay blue, so no line changes.
- Con: structure 2.21, below the floor. It does not "draw in the second
  colour" either.

**E. Inverted.**

- Pro: nearly B's signal, with A's structure.
- Con: it inverts the house's line-on-fill relation, so the part looks like a
  negative.
- Con: the hairspring's lines become art-knockout. Where the spring crosses the
  balance's openings, they are on the paper at 1.30:1, and they disappear.

**Recommendation: C1.** Yes, have two flash colours, one for lines and one for
fills, as the normal drawing has. The line colour is `--palette-second`. The
fill colour is a new theme variable, `--palette-art-second-knockout: #E6D8CA`.

Ranking, best first:

1. **C1.** It keeps the drawing readable, and it is the only option that makes
   the flashed part look like the same drawing. The cost is one theme variable.
2. **C2.** A little more signal, but no margin on the floor.
3. **A.** The simplest, and good enough if we do not want a new theme variable.
   It is 22% weaker than C1.
4. **B.** The strongest signal, but it hides the hairspring in the balance.
5. **E.** Strong, but it loses the spring over the openings and looks like a
   negative.
6. **D.** Weak, and below the floor.

The signal is a proxy. It does not model the blur at the back row, which takes
thin lines before fills. That favours the options that change the fill (B, C,
E). Step 1 below renders the real frames to check the ranking.

**Eliminated after the video (2026-09-30):** B and E. The user looked at
`evidence/flash-options.*` and rejected both. The frames show what the
arithmetic said: B merges the hairspring's coils into the balance, and E loses
the spring's lines over the openings. D was not drawn; it is below the floor.
The choice is now between C1, C2 and A.

### A conflict with `docs/theme.md`

`theme.md` gives the two theme accents these jobs:

- the accent is "_the thing you want them to look at_";
- "`second` is for the turn, not for decoration": the catch, the warning.

A flash says "look at this part". That is the accent's job, not the second's.
But the accent cannot do it in the art: art-line is the accent deepened, and the
accent is only dE 20 from it (see "Why `second`, not the accent"). So a flash
in `second` needs a sentence in `theme.md`: in the art, `second` is also the
colour of a short "look here", because the accent's hue is already the
subject's. This is a change to a house doc, and it is your decision.

`theme.md` also says that the usual right answer is to reuse a role, not to add
a colour. C1 and C2 add one (the pale second); A does not. The same-hue rule of
`theme.md` (at least 1.4× lightness between same-hue marks that touch) holds
for C1: `second` on `#E6D8CA` is 3.60×.

### A hex, not a formula

The new fill colour is a hex in the theme, not `color-mix()` or "second at 0.20"
in the code:

- `readPalette` gets a custom property's value as text. It does not resolve
  `color-mix()`, and the renderer takes only `#rrggbb`.
- `tools/lib.py` reads hex values from `ledger.css`, and `palette.py` gates
  them.
- A formula in the TypeScript and another in the SVG CSS would be one fact in
  two places.

`palette.py` gets one more gate: `second` on `art-second-knockout` is at least
3:1.

## 3. Decision 2: how the renderer draws a flash

Now the renderer resolves each ink once, when it starts. It writes each line's
colour into the mesh's instance buffer, and each mesh's fill colour into a
field. A flash must change the colours of some meshes, ten times in 2.5 s.

**R1. The inks become a uniform.** Each line instance holds an ink index and an
opacity, not a colour. Each draw sets a `uniform vec3 inks[N]`. A frame can
give an ink map for a set of meshes:
`Frame.recolour?: { meshes: ReadonlySet<Mesh>; inks: ReadonlyMap<Ink, Ink> }`.

- Pro: general. The map works for any mesh and any ink. The jewel's art-line
  fill goes to `second`, and the knockout fills go to the pale second.
- Pro: the renderer still knows no watch and no theme.
- Pro: the instance is smaller (2 floats, not 4).
- Con: the largest change to `renderer.ts`: the line shader and the instance
  layout.

**R2. A second set of buffers per flashed mesh**, made at the start with the
flash colours.

- Con: the hairspring is dynamic. Each frame would upload its geometry twice.
- Con: twice the line memory for those meshes, and a renderer option that
  names the meshes.

**R3. One override colour per draw.** Keep the colours in the buffers. Add
`uniform vec4 lineOverride` and a flag, and compute the fill on the CPU.

- Pro: a small shader change.
- Con: all the lines of a mesh get one colour. It is true of the balance
  assembly now, but the renderer must check it for each flashed mesh.
- Con: less general than R1 for the same concept.

**R4. A new renderer for each state of the flash.** `docs/webgl.md` says to make
a new stage to change colours.

- Con: ten new renderers in 2.5 s: new GL objects, and a frame to upload each.

**Recommendation: R1**, then R3, R2, R4. R1 is the only one that is general at
no run-time cost. Without a `recolour`, the frames must be byte-identical
before and after: check with `art/pixel_regression.py`.

The map for a flash is a house constant in `webgl/scene.ts`:
line, frame and detail go to `second`, and knockout goes to `secondKnockout`.
The stage uses it. A future talk gets it with `webgl/`.

## 4. Decision 3: how the slide asks for a flash, and when it runs

**The frontmatter.** Slide 2 gets `watchFlash: balance and hairspring`, the
name of a new subject in the scene. `state.ts` checks it as it checks
`watchOnly`.

**The order.** The stage adds a `flash` phase before the others: flash
(2.5 s), move (1.8 s), fade (0.8 s), tilt (1.5 s). The transition from the
cover to slide 2 becomes 6.6 s, not 4.1 s.

- The old slide's text fades in 0.9 s, during the flash. So the flash plays on
  the cover watch with no title over it.
- The new slide's text comes in after the move. Now `global-bottom.vue` has
  `transition-delay: 1.8s`. It becomes 4.3 s. To keep that number in one place,
  `global-bottom.vue` sets a CSS variable from `FLASH_SECONDS + MOVE_SECONDS`.

**Only in a transition.** A slide reached with no animation (a direct jump, or
from a slide with no watch) shows its state at once, with no flash. The request
is "in the transition". The stills (export, overview, presenter "next") do not
flash.

**Timing.** $5 \times (0.25 + 0.25) = 2.5$ s. On for $[0, 0.25)$ s of each
cycle, off for $[0.25, 0.5)$ s. The last 0.25 s is off, so the zoom starts from
the normal colours. The timing constants go in `webgl/stage.ts` beside
`MOVE_SECONDS`.

**Safety.** Two flashes a second is below the WCAG 2.3.1 limit of three flashes
in any one second.

## 5. Which meshes flash

The new subject, "balance and hairspring", holds:

- the balance (rim, arms, hub): part `balance`;
- the hairspring: part `hairspring`, the dynamic mesh;
- the collet and the balance staff: both belong to part `hairspring`;
- the stud: `hairspring stud (added)`;
- the impulse jewel: part `impulse jewel`.

It does not hold the pallet fork. The impulse jewel is on the balance's roller
and turns with it. I include it as an "associated part". Please confirm.

## 6. Changes

| Where                                    | Change                                                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `themes/ledger/styles/ledger.css`        | `--palette-art-second-knockout: #e6d8ca`                                                                     |
| `tools/lib.py`, `tools/palette.py`       | read the new variable; the 3:1 gate for `second` on it                                                       |
| `watches/webgl/scene.ts`                 | `InkName` and `INKS` get `second` and `secondKnockout`; `FLASH_INKS`; `Frame.recolour`                       |
| `watches/webgl/renderer.ts`              | R1: ink index and opacity per instance; `inks` uniform; fill colour per draw                                 |
| `watches/webgl/stage.ts`                 | the `flash` phase and its constants; `StageState.flash`                                                      |
| `watches/watch/palette.ts`               | `INK_VARIABLES`: `second: --palette-second`, `secondKnockout: --palette-art-second-knockout`                  |
| `watches/watch/generate.ts`              | the subject "balance and hairspring"                                                                         |
| `watches/watch/state.ts`                 | `watchFlash`                                                                                                 |
| `watches/slides.md`, `global-bottom.vue` | `watchFlash` on slide 2; the text's delay from the constants                                                 |
| tests                                    | `state.test.ts` (the key), a stage test (on and off times), `scene.test.ts` (the map), the probe (recolour)  |
| `docs/illustrations.md`                  | "Flash": what it is, its two colours, its timing, when to use it, how in WebGL and in SVG                    |
| `docs/webgl.md`, `docs/theme.md`         | the six inks; `watchFlash`; the order of phases; the new variable                                            |

`tools/scenecheck.py` needs no change. It checks the inks that meshes use, and
no mesh uses a flash ink.

**SVG.** `illustrations.md` will say how an inlined SVG flashes: a CSS
animation, `steps`, five cycles of 0.5 s, that sets `stroke` to
`var(--palette-second)` and `fill` to `var(--palette-art-second-knockout)`.
An animation wins over the drawing's own class rules. No SVG needs a flash
now, so I will not build the SVG helper in this task.

## 7. Steps

1. Build R1 in the renderer. Check with `pixel_regression.py` that the frames
   do not change.
2. Add the inks, the theme variable and its gate. Render the cover view with
   A, B, C1 and C2 as stills. Run `barroom.py` on each. Put the stills and the
   results in `evidence/`, and confirm the ranking in section 2.
3. Add the subject, `watchFlash`, the stage phase and the text delay.
4. Write the docs.
5. `uv run ../tools/validate.py` in `watches/`, and `uv run tools/validate.py`
   at the root.

## 8. Questions for you

1. C1 (two colours, a new theme variable), C2, or A (lines only, no new
   variable)?
2. May `theme.md` say that, in the art, `second` also marks a short "look
   here"? (See "A conflict with `docs/theme.md`".)
3. Does the impulse jewel flash?
4. Flash only in a transition, not when you jump straight to slide 2. Is that
   right?
5. The transition to slide 2 becomes 6.6 s. Is that acceptable?

## 9. Decisions (2026-10-01)

The user's answers to section 8:

1. **C1.** Two flash colours: `second` for lines, and a new theme variable,
   `--palette-art-second-knockout`, for fills.
2. **Yes.** `theme.md` says that, in the art, `second` marks a short "look
   here".
3. **Yes,** the impulse jewel flashes.
4. **Yes,** a flash plays only in a transition.
5. **Yes,** a 6.6 s transition is acceptable.

The renderer uses **R1** (section 3).

## 10. Built (2026-10-01)

- **R1.** A line instance holds an ink index and an opacity; each draw sets
  the `inks` uniform. `Frame.recolour` maps inks for a set of meshes. The ten
  frames of `art/pixel_regression.py` are byte-identical before and after.
  It now draws an eleventh: the cover with the flash on.
- **C1.** `INKS.second` and `INKS.secondKnockout`; `FLASH_INKS` in
  `webgl/scene.ts`. The theme sets `--palette-art-second-knockout: #e6d8ca`.
  `tools/lib.py` has the gate `second` on it, at least 3:1 (3.60).
- **The flash.** `StageState.flash`, the constants and `flashIsOn` in
  `webgl/stage.ts`. A key press during a flash of the same subject does not
  start it again: a check found that slide 2's first click would have
  restarted it. `Stage.show` returns the seconds until the flash ends, and
  `global-bottom.vue` sets `--watch-text-delay` to that plus the move.
- **The slide.** `watchFlash: balance and hairspring` on slide 2. The subject
  holds every mesh of the parts balance, hairspring (with the collet and the
  balance staff) and impulse jewel, and the stud. Not the pallet fork.
- **Measured in the dev deck**, cover to slide 2: flash 2.6 s (from the key
  press), move 1.8 s, then the title fades in, then the fade and the tilt; the
  change ends 6.6 s after the key. During an "on" frame, the screenshot has
  2,705 px of `#9a6238` and 1,704 px of `#e6d8ca`; during an "off" frame,
  none.
- **Back row.** `evidence/c1-barroom.txt`: the flash-on frame holds 3.83 at
  the 55 in TV from 7 m (the plain frame 4.12; the gate is 3.0).
  `evidence/c1-side-by-side.png` shows the two frames.
- **Docs.** `illustrations.md` "Flash"; `theme.md` (the new role, `second` in
  the art, the gate); `webgl.md` (the inks, the recolour, the flash phase);
  `watches/docs/watch.md` (`watchFlash`, the subjects, the order).
- **Validation.** Root 7 of 7; `watches` 19 of 19. Not run: `deck_check.py`
  (frame times). The flash adds one 18-float uniform per line draw.

Still to do when the task closes: move the guidance of `COLOUR-ROLES.md` for
new themes into `theme.md`.
