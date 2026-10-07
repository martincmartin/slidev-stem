# Show any slide in another palette

**Request (2026-10-07):** show slide 2 of `watches` (Hairspring) in three
dark themes, Campfire, Marmalade and After-Hours Observatory, as three more
slides after slide 2, so that the user can page between them in one deck. In
future, show any slide (also slides not written yet) in any theme, light or
dark. So the method must be general.

Docs read first: `docs/theme.md` (the roles, the gates, "One slide can change
a role"), `docs/webgl.md` ("The page gives the palette"),
`watches/docs/slide-patterns.md`, `watches/docs/watch.md`. Earlier work on the
same need: `tasks/2026-09-23-theme-aware-art/instructions.md` §1 names a
"palette comparison deck … real slides with a palette class such as
`.palette-beacon`" and imported slides with a `class:` override.

## 1. What is new: the layers for the whole talk

A slide's `class:` changes the roles on that slide's `.slidev-layout`.
Text and inlined drawings follow. Slide 2 has neither: its watch and its
diving board are in `global-bottom.vue`, outside the slide, and the stills
(print, overview, the presenter's "next" pane) are in `slide-bottom.vue`, a
sibling of the slide's layout. And the WebGL renderer reads its palette once,
in its constructor (`docs/webgl.md`). So today a palette class on slide 2
would change only the title.

## 2. Options

### 2.1 How a slide names its palette

| Option | How | For | Against |
| --- | --- | --- | --- |
| **A. A palette class** (chosen) | `class: palette-campfire`; the house theme has a `.slidev-layout.palette-campfire` rule that sets the roles | Slidev already puts `class:` on the slide's layout; the same mechanism as a slide's role override (`docs/theme.md`); the name the earlier task used | a palette class is one more class on a slide that may have a layout class too: `class: balance-wheel palette-campfire` |
| B. A frontmatter key, `palette: campfire` | a layer reads it | one key, separate from layout | Slidev does not put it on the slide's element, so text and inlined drawings would need JS to add a class: more code for the same result |
| C. A second deck per theme (`slides-campfire.md`) | the headmatter names another theme | no runtime work | cannot page between themes in one deck, which is the request |
| D. Slidev's dark mode (`colorSchema`, `html.dark`) | one toggle for the deck | built in | two palettes only (light, dark); cannot compare three dark themes side by side |

### 2.2 How the duplicates are made

| Option | For | Against |
| --- | --- | --- |
| Copy the slide three times | nothing new | four copies to keep in step; they drift |
| **Move the slide to `pages/hairspring.md`, and import it four times with `src:`** (chosen) | one source; each import overrides only `class:` (Slidev merges the importing block's frontmatter over the page's, the importing block wins) | slide 2's text is in another file; the notes are the same on each copy (as they should be) |

`.prettierrc` already sends `**/pages/*.md` to the Slidev parser.

### 2.3 How the layers for the whole talk get the slide's palette

| Option | For | Against |
| --- | --- | --- |
| a. The layers take the slide's classes whose names start with `palette-` | plain CSS cascade | a naming rule that code must parse; a role override class (`.slidev-layout.warm`) still would not reach the watch |
| **b. A hidden probe with the slide's whole `class:` reads the computed `--palette-*` values; the layers set them as inline variables, and the renderer takes the colours** (chosen) | any class that changes a role reaches the watch and the board, not only palette classes: this closes the gap that `docs/theme.md` describes; no naming rule; the same probe that `themePalette()` already uses | relies on the browser listing custom properties in `getComputedStyle`: measured below |
| c. A new stage for each palette | no renderer change | loses the motion's state, and costs a WebGL context; the renderer change (b) is about 10 lines |

**Measured (2026-10-07):** `getComputedStyle(element)` lists `--*`
properties, with each `var()` worked out, in Chromium, Firefox and WebKit
(Playwright 1.63; `tools/custom_properties.py`, `evidence/custom-properties.txt`:
`--palette-x=#ff0000`, `--palette-y=color-mix(in srgb, #ff0000 20%, white)`
in all three).

**The renderer change.** No colour is in a GPU buffer: a fill is mixed with
the paper at each draw (`fillColour`), the ink uniforms are cached in one map,
and the paper is each frame's clear colour. So `Renderer.setPalette` replaces
the paper and the inks and clears the uniform cache. The stills share one
renderer; each still sets the palette before it draws, and the palette is part
of its key.

### 2.4 Where the palettes are, and how they are checked

| Option | For | Against |
| --- | --- | --- |
| **In the house theme, `themes/ledger/styles/palettes.css`** (chosen) | every talk can use them; the theme may use recipes (`var()`), as `ledger.css` does | none found |
| In the talk's `style.css` | — | `palette.py --talk` fails a talk's palette class that fails a gate (Marmalade does), and allows only `#rrggbb` values |

`tools/palette.py` reports each palette class's gates. **They do not fail the
check:** a palette class is a palette to look at, not the talk's theme.
Marmalade fails four gates (below), and the user asked to see it.

## 3. The three palettes

The candidates set only the text roles. `tools/derive_palettes.py` derives
the art roles by the house method (`docs/theme.md`, "Making a theme"; the
same steps as `tasks/2026-10-07-theme-colour-system/tools/gate_data.py`) and
measures every house gate. Output: `evidence/palettes.txt`.

- **Water** is the subject in Ledger, but a dark theme's subject is a pale
  amber, which fails the water hue gate. So water is the second where the
  second is a blue (Campfire, After-Hours Observatory), and a blue of its own
  at the second's contrast where it is not (Marmalade's second is green).
- **Campfire** and **After-Hours Observatory** pass every required gate.
- **Marmalade** misses four: ink on panel 11.90 (≥ 12), subject vs muted
  ΔE 28.5 (≥ 30), subject vs ink ΔE 16.3 (≥ 30), second vs subject CVD ΔE 12.6
  (≥ 25). These agree with the colour-system task, §4.8.

## 4. Known limits

- At the move between two slides with different palettes, the watch's layer
  changes colour at once, while the old slide's text fades out over it. For a
  preview this is acceptable. A talk that uses a dark slide for real may want a
  fade.
- A misspelt palette class (`palette-campfir`) matches no rule, and the slide
  shows Ledger with no error.
- `art/print_check.py` compares the watch's state on each printed page with the
  live slide's; it does not compare the palette.

## 5. The palette's name in the title (the user's request, 2026-10-07)

"Put the name of the theme in the title, e.g. 'Hairspring [theme]'." The four
imports share one `# Hairspring`, so the name must come from the class. Each
palette class sets `--preview-name` (a CSS string), and the opt-in class
`palette-preview` adds `" [" var(--preview-name) "]"` after the slide's `h1`.
It is opt-in so that a slide that uses a palette for real (the full-bleed dark
slide that `docs/theme.md` recommends) has no label. The variable does not
start with `--palette-`, so the tools do not take it for a colour role. The
Ledger slide is slide 2 itself, so it has no label.

**Changed the same day (the user):** "instead of the title, put the name in
small letters in the lower right, so the average viewer might not notice it
but someone who looks for it can read it." `palette-preview` now puts
`--preview-name` in the slide's lower right corner, 12 px, in muted. That is
below the house's 17 px floor on purpose: the label is for the presenter, not
the audience. The rule also makes the slide's layout `position: relative`, as
a corner to place the name in; only preview slides get it.

## 6. Result

- `themes/ledger/styles/palettes.css`: the three classes and `palette-preview`.
- `watches/slides.md`: slide 2 is `pages/hairspring.md`, imported four times.
- The watch layer (`global-bottom.vue`) and the stills and posed board
  (`slide-bottom.vue`) take the slide's palette (`slidePalette()`); the
  renderer has `setPalette`; a still's key holds its palette.
- `tools/derive_palette.py`: this task's derivation as a house tool, so a
  future palette class needs no task tool. `tools/palette.py` reports each
  palette class's gates, without failing on them.
- Screenshots, stepping as a viewer does: `evidence/slide{2..5}-click{0,1}.png`
  (`tools/screenshots.py`).
