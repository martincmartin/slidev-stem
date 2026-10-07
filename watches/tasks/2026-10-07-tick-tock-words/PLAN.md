# "tick" and "tock" at each strike, on slide 4

## The request

On slide 4 (Escapement), from click 7, when the jewel strikes the pallet
again, show the words "tick" and "tock" in turn. Each appears at once, as a
sound does, and fades out in about 0.8 s. The user asked for options for the
typography and ranked them with me in conversation (summary below). The user
chose **option 5 with option 2's typography**: lowercase, bold, no quotes,
next to the place where the jewel strikes. Each word also drifts away from
its strike as it fades, to show the sound going out: the upper word to the
NNW. The user asked whether the lower word should drift SSE or SSW.

If the result does not work, the next trial is the 1960s _Batman_ burst, in
the theme's colours.

Docs read: `docs/slide-patterns.md` (text fades; picture left, callouts
right), `docs/watch.md` (slide 4, the model's clock, the frontmatter keys),
`../docs/navigation.md` (rule 0, physical processes, `slideState`),
`../docs/theme.md` (roles), `../docs/legibility.md` (text sizes),
`../docs/text-display-deep-research-report.md` (spatial captions,
onomatopoeia, auto-updating text).

## Options for the style (ranked in conversation, 2026-10-07)

1. Option 5 + 2: spatial, bold lowercase at the strike (chosen).
2. Option 2: bold lowercase in one fixed place on the right.
3. Option 6: a restrained comic style, with the word and impact lines in
   `second`.
4. Option 3: ALL CAPS: legible, but too loud to repeat once a second.
5. Option 4: a _Batman_ burst. With the user's idea of one theme colour for
   the burst (`second` fill, paper letters with an ink outline), it costs no
   new colours. It still needs a heavier font (Fraunces 900 or Bangers) and
   it covers the mechanism. It is funny at beat 1 and noise at beat 20.
6. Option 8: closed captions, `[tick]`, muted, at the bottom.
7. Option 1: `“tick”` in quotes: a mention of the word, not the sound.
8. Option 7: the existing callout's label flashes the word.

## Measurements

From `strike_points.ts` (run it in `watches/`), in slide px:

| What                                                    | Where          |
| ------------------------------------------------------- | -------------- |
| balance arbor                                           | (222, 319)     |
| jewel at rest, in the fork's notch                      | (266, 318)     |
| jewel at +25° (enters the notch in window 0)            | (262, 336)     |
| jewel at −25° (enters the notch in window 1)            | (261, 301)     |
| fork pivot                                              | (458, 315)     |
| tick windows start at, within each 2 s period           | 0.447 s, 1.447 s |

The fork is horizontal on the slide. The two strikes are 35 px apart, one
above and one below its axis, nearly mirror images about it. There is one
strike a second, so with a 0.8 s fade one word is gone 0.2 s before the next
appears.

## Decisions

**Which way the lower word drifts: SSW.** The two strikes are mirror images
about the fork's axis, so the two drifts are too: NNW and SSW. The pair then
reads as one sound from one notch. SSE breaks the symmetry, and it drifts
over the fork's lever. The rule in code is geometric, not a compass bearing:
each word drifts away from the fork's axis, leaning `LEAN` (22.5°) away from
the fork. A change to the design or the view keeps the rule.

**Which word is which: "tick" is the upper strike.** Reading order: a viewer
who reads both reads "tick" first. Which strike comes first after the
resume depends on which extreme the balance settled at, so either word can
come first in the talk.

**Where a strike is: the horn ahead of the jewel, not where it enters.**
The first version put each word where the jewel enters the notch (its
point at the window's start). The user saw the upper word appear when the
jewel hit the lower horn. The jewel enters past one horn and strikes the
other, the one it moves towards, and pushes the fork that way. So the
strike of window 0 (the balance from +25° to −25°) is marked by the
jewel's point at −25°, and the strike of window 1 by its point at +25°.
`watch/callouts.test.ts` checks it against the model's direction of swing.

**The instant of a strike: the start of a tick window**, when the jewel
reaches the fork (`tickWindows` in `watch/model.ts`). The loudest part of a
real tick is the escape tooth's drop, at the window's end, 0.107 s later;
the user asked for the jewel's strike.

**The words follow the model's clock, not a timer.** A CSS loop or
`setInterval` would drift from the jewel. The words' component reads the
mechanism's time at each animation frame, finds the window starts it
crossed (`strikesBetween`), and starts a word at the moment of the crossing
(interpolated between the two frames). CSS then fades and drifts it, with a
negative `animation-delay` for the part of a frame that has already passed.

**They live in the watch's layer (`global-bottom.vue`), not on the slide.**
They need the model's clock, which is the layer's. The slide names a target
in its frontmatter, `watchTickTock: 7`, as for the other watch keys
(navigation rule 1). A word that has started finishes its fade when the click
goes back to 6 or the slide changes: the sound has been made. No new word
starts then.

**An exception to "text fades in", written next to it.** The words cut in:
they are a sound.

**Navigation check.** Whether the words are on is `settled` (it depends only
on the slide and the click). Each word's opacity is the phase of a physical
process, so it is not `continuous` (rule 0 allows the phase to differ, and a
word that cuts in would fail the cut check).

**Not done here:** a printed page (export) shows no words. A still of the
watch has no clock to strike; add posed words to `slide-bottom.vue` if the
reader's export needs them.

## Click 8: the _Batman_ trial

The user asked for a comparison: click 8 shows the same words as 1960s
_Batman_ bursts (`watchTickTockBurst: 8`). Only the style changes: the
strikes, the timing, the 0.8 s fade and the drift are click 7's.

- Colouring A from the conversation: a burst in `second`, outlined in ink;
  capitals in the paper's colour with an ink outline and an ink shadow;
  "TICK!" and "TOCK!". The user suggested a single-colour burst in a theme
  colour.
- Then, at the user's suggestion: the accent behind "TICK!", the second
  behind "TOCK!". Paper on the accent is about 6:1, on the second about
  4.1:1, and blue against orange is the pair that colour-blind viewers
  tell apart best. Seen in screenshots: at full opacity both bursts stand
  out, but as the blue burst fades it turns pale blue and merges with the
  watch's blue-grey faces; the orange one stays distinct as it fades.
- Tilted 7°, one way for each word; the burst is mirrored for "tock".
- The burst starts 72 px from the horn (the plain word 40 px), so it
  clears the notch.
- The type is IBM Plex Sans 600, which the theme already imports. Fraunces
  900 and Plex Sans 700 are installed but not imported; a heavier weight
  would change the shared theme, so it waits for the user's choice.

## Files

- `strike_points.ts`: the measurements above.
- `shoot.py`: screenshots of a running deck, for review.
