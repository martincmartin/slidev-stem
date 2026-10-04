---
# Ledger, the house theme for the STEM talks: ../themes/ledger/
theme: ledger
title: What Every Nerd Should Know About Watches
# art/favicon.py writes it; without this line Slidev links its own icon on a CDN
favicon: /favicon.ico
# Slidev takes the headmatter from the first slide's frontmatter, and a
# `transition` in it becomes the default of every slide. The cover must have
# the only watch-zoom transition, so the headmatter is a first slide of its
# own, with no content, and hidden; the cover is the second block.
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

# What Every Nerd Should Know About Watches

Martin C. Martin

<style>
/* The watch fills the canvas and leaves its left half empty for the title. */
.cover-watch {
  place-content: center start;
  text-align: left;
}
.slidev-layout.cover-watch h1 {
  text-align: left; /* the one title that is not centred: the watch is beside it */
  max-width: 480px; /* three lines; the widest, "What Every Nerd", is 464 px */
}
</style>

<!--
Speaker notes here
-->

---
watch: hairspring
watchFlash: balance and hairspring
watchOnly: hairspring and stud
watchTilt: 20
watchHide: 1
watchSettle: 2
watchShow: 3
watchResume: 4
board: 1
boardCurl: 2
boardHide: 3
clicks: 4
---

# Hairspring

<!--
The _hairspring_ beats every 2 seconds, controlling the speed of the rest of the watch.

When bent, a diving board pushes back with _elastic restoring force_.

It overshoots, then overshoots again, _oscillating_ back and forth.

The diving board's rest shape is a straight line. The hairspring's is a curve.

If you wind it tighter, it unwinds back to its rest shape, then overshoots, then winds up back to its rest shape, oscillating back and forth. Just like the diving board.

The hairspring and the balance wheel: the part of a watch that keeps time.

[click] The hairspring fades. A diving board takes its place: it bends down, and when it lets go it bounces up and down, once a second. The dashed outline is its rest shape, and the words on the right say it: bend it away from straight, it pushes back. The restoring force brings it back toward that shape, but it overshoots. With no friction it would bounce at the same height for ever. This is why a hairspring swings: it is a springboard.

[click] The pool and the stand fade. The rest outline becomes a single dashed line. The board and that line curl into the hairspring, at rest in its middle position. Then the words are edited: "Bend" becomes "Wind", and "straight" becomes "rest". Wind it away from rest, it pushes back.

[click] The board fades out and the real hairspring fades in, at rest, with the same shape.

[click] The hairspring starts to swing again, as the board did. Its dashed rest shape stays still.
-->

---
watch: hairspring
watchTilt: 20
watchOnly: balance wheel and hairspring
watchFlash: balance wheel
class: balance-wheel
---

# Balance Wheel

<div class="bw-sentence">
  <div>Add mass,<br>it swings slowly</div>
  <div v-click>and steadily</div>
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
</style>

<!--
The hairspring is only half of the oscillator. The other half is the balance wheel. The spring decides how hard it pushes back. The wheel decides how much there is to push.

The dashed rest shape fades out as the balance wheel fades in. When it is all in, the balance wheel flashes five times.

Put a child on the end of the diving board: boing-boing-boing, fast. Put a heavy adult there: one slow, deep bounce. Same board, more mass, slower swing. A hairspring alone would flutter far too fast to count. The wheel slows it to a pace the gears can count. On the screen it is slowed down again: a real one swings four times a second.

[click] Mass also makes it steady. Push an empty playground swing and it jerks around. Put a kid on it and your push just tops it up. A heavy wheel carries its own momentum. A bump to your wrist, or the small kick the watch gives it on each swing, barely changes its rhythm.

IF ASKED: Why a wheel and not a disc? Mass at the rim counts most, like a figure skater who spins slower with her arms out. Old balances had screws on the rim. Watchmakers moved them in or out to make the watch run faster or slower. The swing also takes about the same time whether it is big or small. That comes from the spring and the mass together, and it is why a watch keeps time while its mainspring runs down.
-->

---
watch: escapement
watchTilt: 20
watchOnly: escapement
---

# Escapement

<!--
The camera zooms out, with only the balance wheel and the hairspring on the screen. Then the roller, its impulse jewel, the pallet fork and the escape wheel fade in.
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
