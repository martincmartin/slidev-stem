# Deck documentation

**Everything you need to make a new slide in the current style.** If you are
adding content, this directory is the whole story — you should never need to open
`tasks/`.

| read this                                | when                                                                      |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| [theme.md](theme.md)                     | choosing colours, or a slide needs one the palette does not have          |
| [illustrations.md](illustrations.md)     | drawing anything new                                                      |
| [legibility.md](legibility.md)           | deciding whether something is big, thick or dark enough                   |
| [slide-patterns.md](slide-patterns.md)   | building the slide itself: layout, components, CSS, speaker notes         |
| [../tools/README.md](../tools/README.md) | running the checks, which is how the above are settled rather than argued |

**If your slide has an animation**, `tools/motion.py` is the check that the thing
which moves is drawn in marks the back row can resolve. A drawing can pass every
other check and still animate invisibly — one shipped that way for a day.

**The one-paragraph version.** The deck is **Ledger** — warm cream `#FAF7F0`, deep
blue accent, warm brown second — and its illustrations are **"Line, weighted"**:
deep blue line work on the card panel, four stroke weights, drawn in a 240×190 box
and shown at 122 px. Every threshold in these docs comes from one question, _can
the back row of a bar read this_, and `tools/` answers it with arithmetic instead
of opinion. Run `python3 tools/artcheck.py` and `python3 tools/palette.py` before
you ship; they are stdlib-only and take a second.

---

## Why this is separate from `tasks/`

This split is deliberate, and the two directories answer different questions.

|               | `docs/` + `tools/`                         | `tasks/<date>-<topic>/`                                                   |
| ------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| **Question**  | "How do I make a new slide in this style?" | "Why is the style this and not something else?"                           |
| **Contains**  | the current framework, and only that       | every alternative, the measurements, the losing candidates, the reasoning |
| **Changes**   | whenever we learn something                | never — each archive is frozen the day its decision landed                |
| **Read when** | building                                   | re-opening a decision                                                     |

**Three reasons it is worth the duplication.**

**1. An archive has to reproduce its own numbers, forever.** `tasks/` exists so
that a claim like "set 2 holds 3.70:1 at the back row" can be re-derived years
later and come out the same. That only works if its tools and its art are frozen
together. The moment a shared tool gains a new check or a corrected threshold, the
archive's numbers stop reproducing and its argument becomes unverifiable — so the
archives keep their own copies and those copies do not change.

**2. The framework has to _evolve_, which is the opposite requirement.**
`tools/artcheck.py` here already does things no archive tool did: it enforces the
stroke ladder, and it reads `stroke-opacity` and `fill-opacity` through the SVG
inheritance chain to catch a mark that is wide enough to resolve and too faint to
see. That check exists because writing these docs turned it up. More will follow.
A tool that must stay still cannot also learn.

**3. Reading an archive to make a slide is a trap, not just a detour.** The
archives are mostly about roads not taken — fifteen rejected drawing sets,
twenty-two rejected palettes, dark themes, numerals that were drawn and then
removed on purpose. Someone skimming for "how do I draw a thing" will find
recipes that were measured, rejected and left in place as evidence. Worse, the
archives' own tools write into the archives' copies of the art, so following their
instructions edits files the live deck does not use. Hence: build from `docs/`,
and open `tasks/` only when you mean to revisit a decision.

**Keeping them honest.** When something here changes, say so in the archive too —
a dated line in the relevant `README.md` saying what moved and why. The archive
stays frozen; the line is a forwarding address, so a reader who lands there first
learns that the framework has moved on. `tasks/2026-09-20-animation-style/README.md`
§14 is the worked example.

---

## The decisions these docs encode

| what               | choice                      | when       | archive                                                                     |
| ------------------ | --------------------------- | ---------- | --------------------------------------------------------------------------- |
| Palette            | **Ledger**                  | 2026-09-19 | [`tasks/2026-09-18-theme-colors/`](../tasks/2026-09-18-theme-colors/)       |
| Illustration style | **Set 2, "Line, weighted"** | 2026-09-21 | [`tasks/2026-09-20-animation-style/`](../tasks/2026-09-20-animation-style/) |

## What is still unknown

Both decisions rest on a guess, and it is the same guess: **nobody has seen the
venue.** Everything in [legibility.md](legibility.md) is designed for the row you
cannot rule out — a 55-inch TV seen from 7 m, which is the hostile case and likelier
in a bar than a projector. The day the venue is known, edit `VENUES` in
`tools/lib.py` and re-run `tools/barroom.py`. That is the entire cost of
re-deciding.
