---
# Ledger, the house theme for the STEM talks: ../themes/ledger/
theme: ledger
title: What Every Nerd Should Know About Watches
# art/favicon.py writes it; without this line Slidev links its own icon on a CDN
favicon: /favicon.ico
# Slidev takes the headmatter from the first slide's frontmatter. Its
# `transition` is the default of every slide and also that slide's own. The
# default is text-fade, but the cover's transition is watch-zoom, and one
# block cannot set both. So the headmatter is a first slide of its own, with
# no content, and hidden; the cover is the second block.
# text-fade: the old text fades out before the new text fades in (style.css).
transition: text-fade
hide: true
---

---
# The watch under this slide is live, in WebGL: see docs/webgl.md. The move from
# this slide to the next has the watch-zoom transition (global-bottom.vue); no
# other move does.
class: cover-watch
watch: cover
transition: watch-zoom
---

# What Every Nerd Should Know About Mechanical Watches

Martin C. Martin

<style>
/* The watch fills the canvas and leaves its left half empty for the title. */
.cover-watch {
  place-content: center start;
  text-align: left;
}
.slidev-layout.cover-watch h1,
.slidev-layout.cover-watch h1 + p {
  text-align: left; /* the one title that is not centred: the watch is beside it */
  max-width: 480px; /* three lines; the widest, "What Every Nerd", is 464 px */
}
</style>

<!--
Speaker notes here
-->

---
src: ./pages/hairspring.md
---

---
# Previews: slide 2 in other palettes (palette classes, ../docs/theme.md).
# Each imports the same page and changes only its class; palette-preview
# puts the palette's name, small, in the lower right corner. Remove them when
# the palette is chosen.
src: ./pages/hairspring.md
class: palette-campfire palette-preview
---

---
src: ./pages/hairspring.md
class: palette-marmalade palette-preview
---

---
src: ./pages/hairspring.md
class: palette-after-hours palette-preview
---

---
watch: hairspring
watchTilt: 20
watchOnly: balance wheel and hairspring
watchFlash: balance wheel
class: balance-wheel
---

# Balance Wheel

<div v-click.hide="2" class="bw-sentence bw-explanation">
  <div>Add mass,<br>it swings slowly</div>
  <div v-click="1">and steadily</div>
</div>

<div v-click="2" class="bw-sentence bw-accuracy">
  <div class="bw-calibrated font-serif">Well calibrated</div>
  <div class="bw-percent">99.99% <span>accurate</span></div>
  <div class="bw-unit">Seiko & Citizen</div>
  <div v-click="3" class="bw-daily">
    <div class="bw-unit">out of 86,400 sec a day</div>
    <div class="bw-error">±9 sec a day</div>
  </div>
</div>

<style>
/* The sentence is where slide 2's was, and looks the same: its left edge and
   its first line's top are those of the board's sentence (DivingBoard.vue,
   --label-x and --label-y), so the new words take the old words' place. */
.slidev-layout.balance-wheel .bw-sentence {
  position: absolute;
  left: 610px;
  top: 137px;
  font-size: 35px;
  font-weight: 600;
  line-height: 2.1;
  white-space: nowrap;
}
.slidev-layout.balance-wheel .bw-sentence.slidev-vclick-target {
  transition: opacity var(--text-fade);
}
/* In either direction, the incoming block waits for the outgoing block. */
.slidev-layout.balance-wheel .bw-sentence:not(.slidev-vclick-hidden) {
  transition-delay: var(--text-fade);
}
/* The accuracy uses the timekeeper card's type roles (TimekeeperCard.vue):
   name, stat in the accent, unit in muted, and the catch in second. Each is
   a little larger than on a card, because it has the column to itself. The
   numbers are in the sans, not the card's mono: mono gives the decimal point
   and each space a full digit's width, and "99 . 99%" reads as two numbers. */
.slidev-layout.balance-wheel .bw-accuracy {
  line-height: 1.2;
}
.slidev-layout.balance-wheel .bw-calibrated {
  font-size: 29px;
  font-weight: 600;
  color: var(--palette-ink);
}
.slidev-layout.balance-wheel .bw-percent {
  margin-top: 10px;
  font-size: 48px;
  font-weight: 600;
  line-height: 1;
  color: var(--palette-accent);
}
/* "accurate" shares the stat's line and baseline, in ink, so the accent
   stays on the number alone. */
.slidev-layout.balance-wheel .bw-percent span {
  font-size: 29px;
  font-weight: 500;
  color: var(--palette-ink);
}
.slidev-layout.balance-wheel .bw-unit {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 400;
  color: var(--palette-muted);
}
.slidev-layout.balance-wheel .bw-daily {
  margin-top: 30px;
}
.slidev-layout.balance-wheel .bw-daily.slidev-vclick-target {
  transition: opacity var(--text-fade);
}
.slidev-layout.balance-wheel .bw-error {
  margin-top: 4px;
  font-size: 26px;
  font-weight: 600;
  color: var(--palette-second);
}
</style>

<!--
The hairspring is only half of the oscillator. The other half is the balance wheel. The spring decides how hard it pushes back. The wheel decides how much there is to push.

The dashed rest shape fades out as the balance wheel fades in. When it is all in, the balance wheel flashes five times.

Put a child on the end of the diving board: boing-boing-boing, fast. Put a heavy adult there: one slow, deep bounce. Same board, more mass, slower swing. A hairspring alone would flutter far too fast to count. The wheel slows it to a pace the gears can count. On the screen it is slowed down again: a real one swings four times a second.

[click] Mass also makes it steady. Push an empty playground swing and it jerks around. Put a kid on it and your push just tops it up. A heavy wheel carries its own momentum. A bump to your wrist, or the small kick the watch gives it on each swing, barely changes its rhythm.

[click] A well-calibrated mechanical watch, even an everyday Seiko or Citizen, can be about 99.99% accurate. That sounds perfect. (Pause.)

[click] But there are 86,400 seconds in a day, so that is about nine seconds gained or lost each day. This is an achievable rate, not a guarantee for every watch. It is an average over the day.

IF ASKED: Why a wheel and not a disc? Mass at the rim counts most, like a figure skater who spins slower with her arms out. Old balances had screws on the rim. Watchmakers moved them in or out to make the watch run faster or slower. The swing also takes about the same time whether it is big or small. That comes from the spring and the mass together, and it is why a watch keeps time while its mainspring runs down.
-->

---
watch: escapement
watchTilt: 20
watchOnly: escapement
# click 2: the pallet and the balance fade, and the escape wheel spins freely;
# click 3: they fade back in, and the pallet stops the wheel (docs/watch.md)
watchSpin: 2
watchSpinEnd: 3
watchSpinSpeed: 135 # degrees a second
# click 6: the balance comes to rest, with the jewel under its leader;
# click 7: it swings again, and the leader fades out (docs/watch.md)
watchSettle: 6
watchResume: 7
# from click 7: "tick" and "tock" at each strike of the jewel (docs/watch.md);
# click 8 is a trial: the same words as comic bursts, to compare
watchTickTock: 7
watchTickTockBurst: 8
clicks: 8
---

# Escapement

From back-and-forth to turning in one direction

<script setup>
import { useSlideContext } from "@slidev/client";
import { escapementMarks } from "./watch/callouts.ts";
import { WATCH } from "./watch/instance.ts";
// where the leaders end: points of the watch, in this slide's view
const marks = escapementMarks(WATCH, useSlideContext().$frontmatter);
</script>

<!-- Clicks 4 and 5 are trials of where a leader ends, to compare by going back
and forward: at 4 the pallet's leader ends between corners A and B of the fork
(palletTrial in watch/callouts.ts); at 5 the two leaders end 10 px outside
their parts. Click 8 is a trial of the words at the strikes: comic bursts, to
compare with click 7's plain words.

The newest callout is the focus: while the pallet's (clicks 3 to 5) and then
the jewel's (click 6) is the newest, the callouts before it dim. At click 7
the balance swings again, the jewel's leader fades, and all three come back.
-->

<div class="esc-callouts" :class="{ 'esc-focus-pallet': $clicks >= 3 && $clicks < 6, 'esc-focus-jewel': $clicks === 6 }">

<WatchCallout keyword v-click="1" class="esc-wheel" bent :to="marks.escape" :stop="$clicks === 5 ? 10 : marks.escapeRadius / 2" :clear="$clicks === 5 ? [marks.escapeTips] : []" :arrow="marks.drive" :left="680" :top="136"><span class="callout-word">Wheel</span> driven by<br>hidden gear</WatchCallout>

<WatchCallout keyword v-click="3" class="after-watch-fade esc-pallet" :to="$clicks === 4 || $clicks === 5 ? marks.palletMiddle : marks.pallet" :stop="$clicks === 5 ? 10 : 0" :clear="$clicks === 5 ? marks.forkOutlines : []" :left="470" :top="470"><span class="callout-word">Pallet</span> blocks wheel</WatchCallout>

<WatchCallout keyword v-click="6" class="after-balance-rest" :to="marks.jewel" :show-leader="$clicks < 7" :left="330" :top="136"><span class="callout-word">Jewel</span> strikes pallet</WatchCallout>

</div>

<style>
/* The callouts before the focus dim, to --esc-dim: less than the "Before
   clocks" cards (0.35), so that a dimmed callout stays easy to read. The
   dim waits for the new callout: at click 3 for the watch's swap
   (after-watch-fade), at click 6 for the balance's rest
   (after-balance-rest). Going back, the callouts come back at once. The
   callout's own root carries its v-click classes, so the dim is on its
   parts. */
.esc-callouts {
  --esc-dim: 0.5;
}
.esc-callouts :deep(.callout-art),
.esc-callouts :deep(.callout-label) {
  transition: opacity var(--text-fade);
}
.esc-focus-pallet .esc-wheel :deep(.callout-art),
.esc-focus-pallet .esc-wheel :deep(.callout-label) {
  opacity: var(--esc-dim);
  transition-delay: var(--watch-fade, 0s);
}
.esc-focus-jewel .esc-wheel :deep(.callout-art),
.esc-focus-jewel .esc-wheel :deep(.callout-label),
.esc-focus-jewel .esc-pallet :deep(.callout-art),
.esc-focus-jewel .esc-pallet :deep(.callout-label) {
  opacity: var(--esc-dim);
  transition-delay: var(--watch-rest-delay, 0s);
}
</style>

<!--
"Force (unseen) trying to turn wheel"

"Pallet blocks wheel"

"Jewel strikes pallet"

"Pallet strikes Jewel"
-->

<!--
The camera zooms out, with only the balance wheel and the hairspring on the screen. Then the roller, its impulse jewel, the pallet fork and the escape wheel fade in.
-->

<!--
The escapement turns back-and-forth motion into rotation in one direction.  (It also gives a "boost" to the hairspring, should I mention that?  Does that explain a significant part of its design?  If I do, I think its a separate section at the end of the slide: first explain how the jewel kicks the fork which lets the escape wheel turn; once that's done, then you can talk about the counter-kick to the hairspring.)
- Need to say, and somehow indicate visually, that "something" is applyign force (torque) to the escape wheel.
- The escapment lets the escape wheel advance once each way.
- This is where the "tick tock" sound comes from!
- The teeth are trapped by the pallet stones.  The pallet allows the teeth to "escape", hence the name "escapement."

[click] First, the gears are trying to run forward because the mainspring is applying torque.

[click] The pallet and the balance fade away, and nothing holds the escape wheel back: it spins freely.

[click] Second, the escapement normally prevents them from doing so. The pallet stones lock the escape wheel.

[click] (Trial: the pallet's leader ends between corners A and B.)

[click] (Trial: both leaders end 10 px outside their parts.)

[click] Third, the jewel. (The balance comes to rest, with the jewel in the fork's notch, under its leader.)

[click] As the balance swings, it periodically gives permission for one tiny advance. (Each time the jewel strikes the fork, "tick" or "tock" appears beside it and drifts away.) During that event some energy also travels the other way, from the gear train through the escapement into the balance.

[click] (Trial: the same words as 1960s Batman bursts, to compare with click 7.)
-->

---
layout: full
class: tk-timekeepers
# hide: true
---

# Before clocks, time was a flow

<script setup>
// One card per click, in this order; the takeaway comes after the last card.
const cards = [
  {
    name: "Sundial", date: "c. 1500 BCE", img: "/timekeepers/sundial.svg",
    stat: "±16 min", unit: "the Sun vs. a steady clock", problem: "No sun, no time",
  },
  {
    name: "Water clock", date: "c. 1400 BCE", img: "/timekeepers/water-clock.svg",
    stat: "~15 min", unit: "per day, the best ones", problem: "Freezes in winter",
  },
  {
    name: "Candle", date: "9th c. CE", img: "/timekeepers/candle.svg",
    stat: "?", unknown: true, unit: "no good data found", problem: "Drafts speed it up",
  },
  {
    name: "Hourglass", date: "by 1338", img: "/timekeepers/hourglass.svg",
    stat: "?", unknown: true, unit: "no good data found", problem: "Someone must flip it",
  },
];
</script>

<div class="tk-grid">
  <TimekeeperCard v-for="(card, i) in cards" :key="card.name" v-bind="card" v-click="i + 1" />
</div>

<div v-click="cards.length + 1" class="tk-takeaway">
  Their rate is set by the outside world. <span>A clock sets its own.</span>
</div>

<style>
/* Colours and type come from the ledger theme. Layout stays here. */
.tk-timekeepers {
  padding: 52px 65px 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.tk-timekeepers h1 {
  margin: 0; /* the flex gap spaces it */
}
.tk-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 16px;
}
/* While a card is being discussed, dim the cards before it. v-click marks the
   current click's element slidev-vclick-current and earlier ones
   slidev-vclick-prior. The takeaway is outside the grid, so it un-dims them. */
.tk-grid:has(> .slidev-vclick-current) > .slidev-vclick-prior {
  opacity: 0.35;
}
.tk-grid > .slidev-vclick-prior {
  transition: opacity 0.35s ease; /* the reveal keeps Slidev's 0.1s */
}
@media (prefers-reduced-motion: reduce) {
  .tk-grid > .slidev-vclick-prior { transition: none; }
}
.tk-takeaway { font-size: 20px; font-weight: 500; }
.tk-takeaway span { color: var(--palette-accent); }

</style>

<!--
Before clocks, people told time by watching something flow.

[click] Sundials go back to about 1500 BCE, and a good one reads to within a few minutes. But no sun, no time. And even a perfect one can be off by up to 16 minutes from a steady clock, because the Sun itself doesn't keep steady time.

[click] Water clocks work at night, but they slow down as they drain, and they freeze in winter. The best managed about 15 minutes a day.

[click] Alfred the Great burned four-hour candles, until drafts made them burn out early. How accurate? I couldn't find anyone who measured it.

[click] Hourglass sand flows at a constant rate and doesn't mind a rolling ship. But someone has to flip a half-hour glass 48 times a day.

[click] Every one of these runs at a rate set by the outside world. A clock sets its own. Remember 15 minutes a day: the first mechanical clocks probably didn't beat it.

IF ASKED: Rome's first public sundial was war loot from Sicily; Pliny says Romans followed its wrong hours for 99 years (the latitude explanation is debated). Roman hours were 1/12 of daylight, about 45 min in winter to 75 in summer. Sailors shook the glass to end a watch early: "flogging the glass."
-->
