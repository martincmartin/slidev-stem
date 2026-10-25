---
# The house theme for the STEM talks: ../themes/house/. The palette is an
# addon, and colorSchema must match its paper: light or dark
# (../docs/theme.md, "Palettes").
theme: house
colorSchema: light
title: What Every Nerd Should Know About Watches
author: Martin C. Martin
# The article, at /article: the talk for readers, with its narration and live
# figures (docs/article.md). "@/" is this talk's directory: a relative path
# would start at its parent.
addons:
  - palette-ledger
  - "@/addons/narration"
# The favicon is in index.html, under the deck's base. Without this line
# Slidev links its own icon, on a CDN.
favicon: false
# Keep deck metadata in a hidden block, separate from the visible cover.
# transition sets the default for all slides. Mechanical Marvels overrides it.
# text-fade: the old text fades out before the new text fades in (style.css).
transition: text-fade
hide: true
---

---
# The live watch stays in the same view on the cover and section.
layout: cover
side: left
watch: all
watchView: cover
# the slide's right edge cuts the watch: the article shows it whole
article:
  0:
    view: centred cover
---

# What Every Nerd Should Know About Mechanical Watches

Martin C. Martin

<!-- narration

Mechanical watches have kept time for 500 years.  This page explains how a
modern one works.  I personally think it's fascinating that a purely mechanical
device can keep time with 99.99% accuracy for $100.  They also changed the world
and look good on your wrist.

This presentation was partially inspired by Bartosz Ciechanowski's [Mechanical
Watch](https://ciechanow.ski/mechanical-watch/) page.  You can think of this
talk as a simpler introduction or background.  When you're finished with this,
that page gives more depth.

[figure: The whole watch, running: its wheels, its balance wheel and its
hands, inside the case.]
-->

<!--
- 500 years
- $20 • 99.9% accurate
- Changed the world
- Look good on wrist
-->

---
layout: section
side: left
eyebrow: PART 1
watch: all
watchView: cover
transition: watch-zoom
---

# Mechanical Marvels

---
watch: [hairspring, collet, stud]
watchView: hairspring
# the oscillator flashes; then the camera zooms in with the whole watch on the
# screen, and the rest fades out (docs/watch.md)
watchFlash:
  [
    balance wheel,
    balance staff,
    hairspring,
    collet,
    stud,
    roller,
    impulse jewel,
  ]
watchMoveWith: all
watchTilt: 20
# click 2: the balance comes to rest while the diving board covers it;
# click 3: it swings again (docs/watch.md, "The diving board")
watchClicks:
  2:
    watchAtRest: true
  3:
    watchAtRest: false
board: 1
boardCurl: 2
clicks: 3
# In the article, the figure at click 2 has a slider that curls the board
# into the hairspring at rest, and the figure at click 3 one that winds the
# hairspring and lets it go (docs/article.md)
article:
  2:
    slider: curl
  3:
    slider: twist
# the history line, in a corner of the slide and under the heading in the
# article; the speaker does not say it (docs/slide-patterns.md)
history: "c. 1675"
---

# Hairspring

<!-- narration

Start with the part that keeps time.  In 1675 Christiaan Huygens, a Dutch
scientist, invented the _hairspring_. It is a flat spiral of steel ribbon, finer
than a hair. Its outer end is held still, and its inner end is free to
turn. Twist the inner end and let go, and the spiral winds and unwinds, back and
forth, at a steady rate. In this drawing it swings once every two seconds, and
the rest of the watch follows that beat.

[click] Why does a spring swing? Think of a diving board. Bend it down, and
it pushes back: an _elastic restoring force_. Let go, and it does not stop at
straight. It overshoots, bends the other way, and comes back again: it
_oscillates_. With no friction, it would oscillate for ever.

[click] A hairspring is a diving board rolled up. The board's rest shape is a
straight line; the hairspring's is a spiral. Take hold of the slider under
the next picture, and drag it to the right.

[figure 2: The diving board curls up into the hairspring, at rest. A slider
curls it.]

[click] "Bend" becomes "wind", and "straight" becomes "rest". Now give the
hairspring a twist: drag the slider to wind the spiral away from its rest
shape, and let go.

[figure 3: The hairspring at rest. A slider winds it; let go, and it swings
back and forth.]

It pushes back. It overshoots and swings, just as the board did. This one
move is the whole idea of the hairspring.
-->

<!--
- In 1675 Christiaan Huygens, a Dutch scientist, invented

- Keeps time

- Why swing?
-->

---
watch: [balance wheel, balance staff, hairspring, collet, stud]
watchView: hairspring
watchTilt: 20
watchFlash: [balance wheel, balance staff]
class: balance-wheel
clicks: 3
history: "c. 1364"
---

# Balance Wheel

<div class="bw-sentence">
  <div class="bw-paragraph text-dims">Add mass, it swings<br>slowly <span v-click="1">and steadily</span></div>
  <div v-click="2" class="bw-paragraph text-dims">
    <div>Well calibrated</div>
    <div><span class="bw-percent">99.99%</span> accurate</div>
    <div>Seiko • Citizen</div>
  </div>
  <div v-click="3" class="bw-paragraph text-dims">
    <div>86,400 sec in a day</div>
    <div class="bw-error">±9 sec a day</div>
  </div>
</div>

<style>
/* Match the Gear Train title and subtitle outline over the watch. */
.slidev-layout.balance-wheel h1,
.slidev-layout.balance-wheel h1 + p {
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
}
/* The sentence is where the Hairspring slide's was, in the same type: its
   left edge is the board's sentence's (DivingBoard.vue, --label-x), and its
   first line's glyphs are where that sentence's first line was, so the new
   words take the old words' place. The board's sentence is double-spaced,
   to clear the board; this one is single-spaced, as on the later slides, so
   its top is lower by half the difference in line height:
   137 + 35 * (2.1 - 1.25) / 2 = 152 px. */
.slidev-layout.balance-wheel .bw-sentence {
  position: absolute;
  left: 610px;
  top: 152px;
  font-size: 35px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
}
/* Each click adds to the sentence, and nothing leaves, so all of the text
   is on the slide at the last click. "and steadily" has its place on the
   second line from the start: it fades in, and no word moves. The
   paragraphs' fades come with text-dims (style.css). */
.slidev-layout.balance-wheel .bw-sentence .slidev-vclick-target:not(.text-dims) {
  transition: opacity var(--text-fade);
}
.slidev-layout.balance-wheel .bw-paragraph + .bw-paragraph {
  margin-top: 0.7em;
}
/* When a paragraph shows, the paragraphs before it dim (style.css, "TEXT
   DIMS"), as the Escapement slide's earlier callouts do: the newest is the
   focus. */
.slidev-layout.balance-wheel
  .bw-paragraph:has(~ .bw-paragraph:not(.slidev-vclick-hidden)) {
  --text-dim: var(--text-dimmed);
}
/* The accuracy is in the sentence's type. Only the stat is larger, in the
   accent, and the catch is in second. Both dim with their paragraph. */
.slidev-layout.balance-wheel .bw-percent {
  font-size: 48px;
  line-height: 1;
  color: color-mix(
    in srgb,
    var(--palette-accent),
    var(--palette-background) var(--text-dim)
  );
}
.slidev-layout.balance-wheel .bw-error {
  color: color-mix(
    in srgb,
    var(--palette-second),
    var(--palette-background) var(--text-dim)
  );
}
</style>

<!-- narration

The hairspring is only half of the timekeeper. The other half is the _balance
wheel_.  While most of its mass is around the outside, it is actually fixed to
the spring's inner end. The spring provides the _restoring force_. The wheel
provides the _mass_ and _inertia_.

[figure 3: The balance wheel on the hairspring, swinging. The wheel is
marked.]

A hairspring alone would oscillate far too fast to count.  The wheel slows it to a
pace that the gears can count.

> [!aside] Why a wheel, and not a disc?
>
> Mass at the rim counts most, like a figure skater who spins slower with her
> arms out. Old balance wheels had screws round the rim, and watchmakers moved
> them in or out to make the watch run slower or faster. The swing also takes
> about the same time whether it swings through a big angle or small angle
> (_isochronism_). That comes from the spring and the mass together, and it is
> why a watch keeps time even while the watch winds down.

[click] Mass also makes the swing steady. Push an empty playground swing, and it
jerks about. Put a child on it and it swings much more gracefully. A heavy wheel
carries its own momentum, so a knock to your wrist, or turning it upside down,
barely changes its rhythm.

[click] How good is it? A well-calibrated mechanical watch, even an everyday
Seiko or Citizen, is about 99.99% accurate.  A day has 86,400 seconds, so a good
watch gains or loses about nine seconds a day.

I'm not particularly handy with mechanical things, if I tried to build a table
it would wobble because things would be off by a few percent.  So it kind of
blows my mind that, for $100, I can get a simple, everyday, purely mechanical
system and tweak it to be 99.99% accurate!

 -->

<!--
[click] - wrist bump or upside down
-->

---
watch:
  &escapement [
    balance wheel,
    balance staff,
    hairspring,
    collet,
    stud,
    roller,
    impulse jewel,
    pallet fork,
    escape wheel,
    escape arbor,
  ]
watchView: *escapement # the camera stays when click 2 shows less
watchTilt: 20
watchClicks:
  # the wheel's callout appears; the pallet and the balance fade, and then
  # the drive arrow fades in, and the escape wheel spins freely
  1:
    watch: [escape wheel, escape arbor, escape wheel drive]
    watchSpin: 135 # degrees a second
  # they fade back in, and the pallet stops the wheel (docs/watch.md)
  2:
    watch: [*escapement, escape wheel drive]
    watchSpin: false
  # the balance comes to rest, with the jewel under its leader
  3:
    watchAtRest: true
  # it swings again, and the leader fades out; "tick" and "tock" show at
  # each strike of the jewel (docs/watch.md)
  4:
    watchAtRest: false
    watchTickTock: true
clicks: 4
history: "c. 1275"
---

# Escapement

From back-and-forth to turning in one direction

<script setup>
import { useSlideContext } from "@slidev/client";
import { escapementMarks, LEADER_GAP } from "./watch/callouts.ts";
import { WATCH } from "./watch/instance.ts";
// where the leaders end: points of the watch, in this slide's view
const marks = escapementMarks(WATCH, useSlideContext().$frontmatter);
</script>

<!-- The newest callout is the focus: while the pallet's (click 2) and then the
jewel's (click 3) is the newest, the callouts before it dim. At click 4 the
balance swings again, the jewel's leader fades, and all three come back.

The wheel's and the pallet's leaders end LEADER_GAP px outside their parts
(docs/watch.md, "The callouts").
-->

<div class="esc-callouts" :class="{ 'esc-focus-pallet': $clicks === 2, 'esc-focus-jewel': $clicks === 3 }">

<WatchCallout keyword v-click="1" class="esc-wheel" bent :to="marks.escape" :stop="LEADER_GAP" :clear="[marks.escapeTips]" :left="680" :top="136"><span class="callout-word">Wheel</span> driven by<br>hidden mechanism</WatchCallout>

<WatchCallout keyword v-click="2" class="after-watch-fade esc-pallet" :to="marks.pallet" :stop="LEADER_GAP" :clear="marks.forkOutlines" :left="470" :top="470"><span class="callout-word">Pallet</span> blocks wheel</WatchCallout>

<WatchCallout keyword v-click="3" class="after-balance-rest" :to="marks.jewel" :show-leader="$clicks < 4" :left="330" :top="136"><span class="callout-word">Jewel</span> strikes pallet</WatchCallout>

</div>

<style>
/* The callouts before the focus dim (style.css, "TEXT DIMS"): less than
   the "Before clocks" cards (0.35), so that a dimmed callout stays easy to
   read. The dim waits for the new callout: at click 3 for the watch's fade
   (after-watch-fade), at click 4 for the balance's rest
   (after-balance-rest). Going back, the callouts come back at once. The
   callout's own root carries its v-click classes and their fade, so the
   dim is on its parts. */
.esc-callouts :deep(.callout-art),
.esc-callouts :deep(.callout-label) {
  transition: --text-dim var(--text-fade);
}
.esc-focus-pallet .esc-wheel :deep(.callout-art),
.esc-focus-pallet .esc-wheel :deep(.callout-label) {
  --text-dim: var(--text-dimmed);
  transition-delay: var(--watch-fade, 0s);
}
.esc-focus-jewel .esc-wheel :deep(.callout-art),
.esc-focus-jewel .esc-wheel :deep(.callout-label),
.esc-focus-jewel .esc-pallet :deep(.callout-art),
.esc-focus-jewel .esc-pallet :deep(.callout-label) {
  --text-dim: var(--text-dimmed);
  transition-delay: var(--watch-rest-delay, 0s);
}
</style>

<!-- narration

A second hand that just moves back and forth isn't very useful, we need it to
turn one way only.  The _escapement_ turns the swing into steps.

The _escape wheel_ is being turned by a mechanism we'll explain soon, so it's
hidden on this slide.  Without something to stop it, it would just turn and
turn.

[nofigure]

[click]

[figure: The escape wheel alone, spinning freely. A curved arrow shows the
push on it.]

[click] The _pallet fork_ stops it.

[figure]

Its two prongs (called _stones_) stick in the wheel's teeth: a tooth lands on a
stone, and the wheel stops. Each time the fork rocks, one stone lets a tooth go,
and the other stone catches the next tooth.  The tooth _escapes_, and that is
where the name comes from.

[click] What rocks the fork? The balance does. On its staff is a small _impulse
jewel_, which sits in the notch at the end of the fork.  It's actually a
synthetic ruby or sapphire, so it really is a jewel, a precious stone.

[figure: The escapement at rest, labelled: the escape wheel, the pallet
fork, and the impulse jewel in the fork's notch.]

As the balance swings through the middle, the jewel strikes the fork and
flips it one way. On the swing back, it flips it the other way.

[click] So, at each swing, the balance lets the wheel take one small step.  The
jewel hits the fork hard enough to make a sound: this is the tick and the tock
of a watch. The push goes both ways, too. At each strike, a little energy flows
from the wheel, through the fork, into the balance, and keeps it swinging.

-->

<!--
- second hand: turn one direction

[click]  turning force, explained soon

[click]  Stick in teeth.
- Each rock lets a tooth _escape_.

[click] Synthetic ruby or sapphire.  Really is a jewel!

[click]
-->

---
# the seconds hand alone, so that the eye has only its ticks to count, one
# a second (docs/watch.md, "The Ticks and Turns slide"). Its arbor shows as a
# post under its cap at tilt 20, as on the Gears slide: the hand is pinned
# there. The view fits the hand's whole turn; its circle is against the left
# edge (FIT_LEFT, 16 px, plus its width at this tilt, about 421.6 px), so
# that the table, 483 px wide, fits on the right. Neither the Escapement
# slide nor the Gears slide shows these pieces at the step, so both steps
# jump the camera
watch: [seconds hand, fourth arbor]
watchView: [seconds hand]
watchRight: 438
watchTilt: 20
class: ticks-and-turns
clicks: 3
---

# Ticks and Turns

Named for what they count, not how long they take to turn

<!-- Each click adds text, and none leaves. The text before the newest dims
(style.css, "TEXT DIMS"). The table comes whole at click 3: its first row is
what the audience has just worked out, and its other rows state the same
rule for the other two hands. -->

<div class="tt-sentence">
  <div v-click="1" class="tt-line text-dims">Second hand: a tick a second</div>
  <div v-click="2" class="tt-line text-dims">60 ticks a turn: <span class="turn-time">once a minute</span></div>
  <table v-click="3" class="tt-table">
    <thead><tr><th>Hand</th><th>A full turn</th></tr></thead>
    <tbody>
      <tr><td>Second Hand</td><td class="turn-time">Once a minute</td></tr>
      <tr><td>Minute Hand</td><td class="turn-time">Once an hour</td></tr>
      <tr><td>Hour Hand</td><td class="turn-time">Twice a day</td></tr>
    </tbody>
  </table>
</div>

<style>
/* Where the Gears slide's text is, and the same type, but further left:
   44 px right of the hand's circle (the frontmatter's watchRight). The
   circle's edge is where the tip reaches at 3 o'clock only. The widest
   line, "60 ticks a turn: once a minute", and the table (216 + 32 + 235 px)
   are each about 483 px: they end at 965 px, as the Gears slide's rule
   does. The cells are left-aligned, so the eye runs down each column. */
.slidev-layout.ticks-and-turns .tt-sentence {
  position: absolute;
  left: 482px;
  top: 165px;
  font-size: 35px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
}
.slidev-layout.ticks-and-turns .tt-line + .tt-line,
.slidev-layout.ticks-and-turns .tt-table {
  margin-top: 0.7em;
}
.slidev-layout.ticks-and-turns .tt-table {
  border-collapse: collapse;
  color: var(--palette-ink);
}
/* no rules between the rows: Slidev's tables have them */
.slidev-layout.ticks-and-turns .tt-table :is(thead, tbody, tr, th, td) {
  border: 0;
}
.slidev-layout.ticks-and-turns .tt-table :is(th, td) {
  padding: 0;
  text-align: left;
  font-weight: 600;
}
.slidev-layout.ticks-and-turns .tt-table :is(th, td) + :is(th, td) {
  padding-left: 32px;
}
/* The title row labels the columns: the subtitle's type (22 px, muted, the
   theme's `h1 + p`), so that it does not read as one more row. */
.slidev-layout.ticks-and-turns .tt-table th {
  font-size: 22px;
  font-weight: 400;
  line-height: 1.3;
  color: var(--palette-muted);
}
.slidev-layout.ticks-and-turns .tt-table.slidev-vclick-target {
  transition: opacity var(--text-fade);
}
/* When text shows, the lines before it dim, as on the Mainspring slide. */
.slidev-layout.ticks-and-turns
  .tt-line:has(~ :is(.tt-line, .tt-table):not(.slidev-vclick-hidden)) {
  --text-dim: var(--text-dimmed);
}
</style>

<!-- narration

Before we go on, something that trips people up until they think it through. How
long does the second hand take to go once round the dial?

[figure 3: The second hand alone, pinned on its arbor, ticking once a
second.]

Each tick is one second, and sixty ticks brings it all the way around. So the
second hand makes a complete circle once a minute. A hand is named for what it
counts, not for how long it takes make a full 360° turn.

| Hand        | A full turn   |
| ----------- | ------------- |
| Second hand | Once a minute |
| Minute hand | Once an hour  |
| Hour hand   | Twice a day   |


> [!aside] Why is this second hand not in the middle?
>
> On most watches the second hand is in the middle, with the minute and hour
> hands.  But putting three hands all on the same shaft makes the diagram
> confusing, and many older watches had their second hand off centre.
> Watchmakers call it _small seconds_.

-->

<!--
Trips people up until they think it through.  How long for a full circle?

[click] 

[click] Named for what it counts.

[click]
-->

---
# the camera stays when a click adds pieces
watchView: &gears [fourth wheel, fourth arbor, escape pinion, escape arbor]
# the span, in the gears' own colours: it cannot be seen until click 1
# flashes it
watch: [*gears, fourth wheel span plain, escape pinion span plain]
# the fourth wheel's teeth reach 70 px short of the text (.gears-sentence,
# left: 560px): this edge, plus half the outline, is 70 px left of the "A"
watchRight: 489
watchTilt: 20
# the audience has not seen these gears, so their place in the watch does
# not matter: the Ticks and Turns slide's picture fades out, the camera jumps,
# and this one fades in, both ways (docs/watch.md, "The Gears slide")
watchMoveWith: none
# the gears turn freely, from the start: the pinion once in 4 s (360 / 4 = 90
# degrees a second), so the fourth wheel once in 8 s
watchSpin: 90
class: gears
watchClicks:
  # a span: four teeth of the wheel, and the four leaves that they drive.
  # Four teeth are a quarter of the wheel and half the pinion. The gears
  # turn on. The span is in the flash's colours (second-wash faces, second
  # outline), and the text comes one line a click (clicks 2 to 4: two
  # callouts, then a sentence). The span comes in with a flash, not a fade:
  # its plain teeth flash, and when the flash ends, they go and the span
  # shows, at once. No flash for the text: each callout's leader shows which
  # gear it means
  1:
    watch: [*gears, fourth wheel span, escape pinion span]
    watchFlash: [fourth wheel span plain, escape pinion span plain]
    watchCut:
      [
        fourth wheel span plain,
        escape pinion span plain,
        fourth wheel span,
        escape pinion span,
      ]
  # the rest of the Escapement slide's mechanism fades in, in this view
  # (much of it off the slide on the left), with the drive arrow on the
  # fourth wheel, and the span goes. The pallet stops the spin: the gears
  # tick with the escape wheel
  5:
    watchSpin: false
    watch:
      &mechanism [
        fourth wheel drive,
        *gears,
        balance wheel,
        balance staff,
        hairspring,
        collet,
        stud,
        roller,
        impulse jewel,
        pallet fork,
        escape wheel,
      ]
  # the seconds hand, on the fourth wheel's arbor: it turns once a minute,
  # and the text says so after the hand has faded in
  6:
    watch: [*mechanism, seconds hand]
clicks: 6
history: "Second hand: c. 1670"
---

# Gears

Fast gear, meet slow gear

<script setup>
import { useSlideContext } from "@slidev/client";
import { gearsMarks, LEADER_GAP } from "./watch/callouts.ts";
import { WATCH } from "./watch/instance.ts";
// where the leaders end: outside the gears' tip circles, in this slide's view
const marks = gearsMarks(WATCH, useSlideContext().$frontmatter);
</script>

<!-- Each callout's leader points at the gear that the whole label names, so
the label is all one callout word, in ink: not a keyword callout, whose
second would merge with the span (docs/watch.md, "The Gears slide"). -->

<WatchCallout v-click="[2, 5]" class="gears-callout text-dims" from-end :to="marks.pinion" :stop="LEADER_GAP" :clear="[marks.pinionTips]" :left="380" :top="165"><span class="callout-word">Half of the small gear</span></WatchCallout>

<WatchCallout v-click="[3, 5]" class="gears-callout text-dims" from-end :to="marks.wheel" :stop="LEADER_GAP" :clear="[marks.wheelTips]" :left="500" :top="222"><span class="callout-word">A quarter of the big gear</span></WatchCallout>

<div v-click="4" class="gears-sentence gears-rule text-dims">Twice the circumference,<br>half the speed.  Exactly.</div>

<div v-click="6" class="gears-sentence gears-minute after-watch-fade text-dims">
  <div>Turns <span class="turn-time">once a minute</span>.</div>
  <div>The second hand!</div>
</div>

<style>
/* On the right of the gears, 70 px from the fourth wheel's teeth: the
   frontmatter's watchRight follows this left. The callouts are in the
   callout type, next to their gears, above the rule: not in this column.
   The second hand's text is under the rule, 0.7em below it
   (301 + 2 * 43.75 + 24.5 = 413 px).
   The second hand's text waits for the hand (after-watch-fade, style.css).
   The fades come with text-dims, in longhands that keep that delay. */
/* At click 6 the seconds hand turns under the text: the paper's outline
   keeps it legible over the hand, as on the Gear Train slide. */
.slidev-layout.gears .gears-sentence {
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
}
.slidev-layout.gears .gears-sentence {
  font-size: 35px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
}
.slidev-layout.gears .gears-sentence {
  position: absolute;
  left: 560px;
  top: 165px;
}
.slidev-layout.gears .gears-sentence.gears-rule {
  top: 301px;
}
.slidev-layout.gears .gears-sentence.gears-minute {
  top: 413px;
}
.slidev-layout.gears .gears-sentence > div + div {
  margin-top: 0.7em;
}
/* When a click adds text, the text before it dims (style.css, "TEXT
   DIMS"), as the Escapement slide's earlier callouts do. At click 6 the dim
   waits for the hand, as the new text does (after-watch-fade). Going back,
   the text comes back at once. */
.slidev-layout.gears
  :is(.gears-callout, .gears-sentence):has(
    ~ :is(.gears-callout, .gears-sentence):not(.slidev-vclick-hidden)
  ) {
  --text-dim: var(--text-dimmed);
}
.slidev-layout.gears
  :is(.gears-callout, .gears-sentence):has(
    ~ .gears-minute:not(.slidev-vclick-hidden)
  ) {
  transition-delay: var(--watch-fade, 0s);
}
</style>

<!-- narration

The escapement gets the escape wheel turning at a precise rate.  But the second
hand must turn once a minute, and the escape wheel turns faster than that. To
convert a faster rotation into a slower one, a watch uses gears: a small gear
that drives a big one.

[nofigure]

[click]

[figure 4: Two gears, turning: a small gear with eight teeth drives a big
gear with sixteen. Four teeth on each gear are coloured.]

> [!aside] Must the teeth really be the same size?
> Strictly, the _pitch_ must match: a tooth and its gap on one wheel must be as
> long as a tooth and its gap on the other. One wheel can have wider teeth
> than the other, as long as it has narrower gaps.

The teeth on the two gears must be the same size, or they would not mesh. Each
tooth fits in a gap of the other gear, so the teeth go past each other one for
one, and both rims move at the same speed.  Four teeth on each gear are
coloured. Those four teeth are half of the small gear, but only a quarter of the
big one. So the small gear turns twice for each turn of the big one: twice the
circumference, half the speed.

[click:5]

> [!aside] Why does this second hand jump, when mine sweeps?
>
> This watch ticks once a second, to make the hairspring slow enough to
> see. Most real mechanical watches tick five to eight times a second, so their
> second hands seem to sweep.

Now attach the smaller gear (called a _pinion_) to the escape wheel.
The gears do not spin freely any more: they move on one tick at a time, with the
escape wheel. The escapement controls the speed of the whole train of gears.

The big gear pushing the small gear (pinion) is the force turning the escape
wheel.  What turns the big wheel?  That's a mechanism we'll explain soon.

In this watch, the big gear turns exactly once a minute: just what the
second hand needs! So the second hand goes on the big gear's axle. It is the
first part of the watch that we can read.

-->

<!--
Have wheel turning one way, but too fast.

Teeth must move at same speed because they mesh.

[click] These 4 teeth move at same speed.

[click] 

[click] Same length of rim.

[click] 

[click] Attach the small gear to the escape wheel.

[click] IF ASKED: This watch ticks once a second. Most real mechanical watches tick 5 to 8 times a second, so their second hands seem to sweep.
-->

---
# the Gears slide's last picture, in a view that frames the train from the
# escape wheel to the centre wheel, which do not show yet. The pieces stay on
# the screen while the camera moves; the balance is partly off the slide
watch:
  [
    &seconds [
      fourth wheel,
      fourth arbor,
      escape pinion,
      escape arbor,
      balance wheel,
      balance staff,
      hairspring,
      collet,
      stud,
      roller,
      impulse jewel,
      pallet fork,
      escape wheel,
      seconds hand,
    ],
    fourth wheel drive,
  ]
watchView: &frame [escape wheel, fourth wheel, third wheel, centre wheel]
watchRight: 489
watchTilt: 20
class: gear-train
watchClicks:
  # one wheel that is sixty times slower, in one step: it drives the
  # fourth pinion, from the line from the escape arbor through the fourth
  # arbor (docs/watch.md, "The Gear Train slide"). The camera untilts and
  # zooms out until the case band fills the picture band, so the case shows
  # how large the wheel is. The drive arrow stays on the fourth wheel while
  # the camera moves, and then goes. The wheel and the pinion fade in, then
  # the case, and then they flash. The case's strap is the raised strap,
  # above the wheel
  1:
    watch:
      [
        *seconds,
        fourth pinion,
        one-step wheel,
        &case [case band, lug, crown, raised strap, chapter ring],
      ]
    watchView: [case band]
    watchTilt: 0
    watchLater: *case
    watchGoLater: [fourth wheel drive]
    watchFlash: [one-step wheel, fourth pinion]
  # the train slows the turn from once a minute to once an hour, in two
  # steps. Each fades in, and then flashes: the wheel, with its arbor, and
  # the pinion that it drives. The drive arrow moves to the new wheel: the
  # old one fades out first, and the new one fades in with its wheel
  2:
    watch:
      [
        *seconds,
        &third [fourth pinion, third wheel, third arbor],
        third wheel drive,
      ]
    watchView: *frame
    watchTilt: 20
    watchFlash: *third
  3:
    watch:
      [
        &train [
          &trainContext [*seconds, *third, third pinion],
          centre wheel,
          centre arbor,
        ],
        centre wheel drive,
      ]
    watchFlash: [third pinion, centre wheel, centre arbor]
  # the minute hand, on the centre wheel's arbor, and the case and the dial
  # (the chapter ring holds its marks); not the hour hand
  4:
    watch:
      [
        *train,
        centre wheel drive,
        centre pivot,
        &face [minute hand, chapter ring, case band, lug, crown, strap],
      ]
  # keep the centre wheel, its arbor, pivot and drive arrow bright; the hidden
  # source of the push is the next slide's spring
  5:
    watchDim: [*trainContext, *face]
clicks: 5
history: "Minute hand: c. 1656"
---

# Gear Train

From once a minute to once an hour

<script setup>
import { useSlideContext } from "@slidev/client";
import { gearTrainMarks, LEADER_GAP } from "./watch/callouts.ts";
import { WATCH } from "./watch/instance.ts";
const marks = gearTrainMarks(WATCH, useSlideContext().$frontmatter);
</script>

<!-- Click 1's text fades in at the click, as the camera starts to move: it
says why the camera untilts and zooms out. Each later text waits for the
watch's change at its click to end, with its flash (after-watch, style.css):
it reads what the picture has just shown.

Click 1's text stays, dimmed from click 2, above the stages. Click 3 adds its
stage after click 2's, on the same line, in the room kept for it: "7½:1" does
not move. The stages stay at click 4, dimmed, above the minute hand's text: a
recap for anyone who missed clicks 2 and 3. -->

<div v-click.hide="5" class="gt-reading">
<div class="gt-sentence" :class="{ 'gt-staged': $clicks >= 2, 'gt-recap': $clicks >= 4 }">
  <div v-click="1" class="gt-problem text-dims">minute:hour = 60:1</div>
  <div v-click="2" class="after-watch gt-stage text-dims">
    <div>Two stages:</div>
    <div>7½:1<span v-click="3" class="after-watch"> × 8:1 = 60:1</span></div>
  </div>
  <div v-click="4" class="after-watch">
    <div>Makes a full turn<br><span class="turn-time">once an hour</span>.</div>
    <div>The minute hand!</div>
  </div>
</div>
</div>

<WatchCallout keyword v-click="5" class="gt-power after-watch" bent :to="marks.wheel" :stop="LEADER_GAP" :clear="[marks.wheelTips]" :left="500" :top="340"><span class="callout-word">Wheel</span> driven by<br>hidden mechanism</WatchCallout>

<style>
/* At clicks 1 and 4 the chapter ring runs behind the title, the subtitle and
   the text, and at click 1 the one-step wheel does too. The paper's outline
   keeps them legible over the drawing, as on the Escapement slide's "tick"
   and "tock" (components/TickTock.vue, .tick-tock-word). */
.slidev-layout.gear-train h1,
.slidev-layout.gear-train h1 + p,
.slidev-layout.gear-train .gt-sentence {
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
}
/* Where the Gears slide's text is, and the same type: 70 px right of the
   picture's right edge (the frontmatter's watchRight). The fades are in
   longhands, which keep after-watch's delay. */
.slidev-layout.gear-train .gt-sentence {
  position: absolute;
  left: 560px;
  top: 165px;
  font-size: 35px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
}
.slidev-layout.gear-train .gt-sentence div + div {
  margin-top: 0.7em;
}
.slidev-layout.gear-train .gt-sentence > .slidev-vclick-target:not(.text-dims),
.slidev-layout.gear-train .gt-stage .slidev-vclick-target,
.slidev-layout.gear-train .gt-reading.slidev-vclick-target,
.slidev-layout.gear-train .gt-power.slidev-vclick-target {
  transition-property: opacity;
  transition-duration: var(--text-fade);
}
/* The old text must leave before the callout appears, even when the dim
   finishes sooner. This delay applies only while the callout is shown. */
.slidev-layout.gear-train .gt-power:not(.slidev-vclick-hidden),
.slidev-layout.gear-train .gt-reading:not(.slidev-vclick-hidden) {
  transition-delay: max(var(--text-fade), var(--watch-end-delay, 0s));
}
/* At click 4 the stages dim (style.css, "TEXT DIMS"), as the Escapement
   slide's earlier callouts do, when the minute hand's text fades in: after
   the watch's change (after-watch). Their fades come with text-dims. */
.slidev-layout.gear-train .gt-recap > .gt-stage {
  --text-dim: var(--text-dimmed);
  transition-delay: var(--watch-end-delay, 0s);
}
/* At click 2 click 1's text dims in the same way, when the stages fade in. */
.slidev-layout.gear-train .gt-staged > .gt-problem {
  --text-dim: var(--text-dimmed);
  transition-delay: var(--watch-end-delay, 0s);
}
</style>

<!-- narration

The second hand turns once a minute. The minute hand must turn once an hour:
sixty times slower. So we could try the same trick, and have a gear that's 60
times bigger than the small gear.

[nofigure]

[click] But there's a limit to how small you can manufacture the small gear, so
the big gear would be huge.  And it would have a lot of teeth which adds to
costs.  Plus, it would turn the wrong way, counterclockwise, because every gear
turns the opposite direction from the one it touches.

[click]

[figure 2-3: Two more pairs of gears, between the second hand's wheel and
the centre wheel. Step through them.]

So the watch slows in two stages. The _third wheel_ runs 7½ times slower, and
the _center wheel_ runs 8 times slower than that.

[click] 7½ times 8 is 60, so the centre wheel turns once an hour.

[click]

[figure: The minute hand on the centre wheel's arbor, in the middle of the
case.]

The minute hand goes on the centre wheel's axle (_arbor_), in the middle of the dial.
It makes a full turn once an hour.

[click] The center wheel pushes the third wheel which pushes the fourth wheel
which pushes the escape wheel.  Next up, the mechanism that pushes the center
wheel and powers the whole watch. [nofigure]

-->

<!--
Minute hand turns once an hour.

How much slower than the second hand?

Could use same trick, this time 60:1.

[click] Limit to how small you make pinion.

That many teeth is expensive.

Turns the wrong way, counterclockwise.

[click] 

[click] 7½ × 8 = 60

[click]

[click] Next up, the mechanism that drives this wheel.
-->

---
# the bare mainspring and its arbor, as large as the picture band; the
# camera stays at every click. The story (watchMainspring) turns the key,
# winds and lets down the spring, and says when the watch runs
# (docs/watch.md, "The Mainspring slide")
watch: &spring [mainspring, barrel arbor]
watchView: *spring
watchTilt: 20
watchMainspring: free
# In the article, the figure at click 1 has a slider that winds the spring,
# and the figure at click 2 a button that lets it go (docs/article.md)
article:
  1:
    slider: wind
  2:
    button: release
# The centre wheel, arbor, pivot and drive arrow remain for one second.
# Then the mechanism fades, leaving the arrow alone for one more second.
# The arrow fades before the camera changes to the spring's view.
watchLinger:
  - pieces: [centre wheel, centre arbor, centre pivot]
    seconds: 1
  - pieces: [centre wheel drive]
    seconds: 1
watchClicks:
  # the stud and the dashed rest shape fade in, and the stud flashes; then
  # the key winds it
  1:
    watch: [*spring, mainspring stud, mainspring rest]
    watchFlash: [mainspring stud]
    watchMainspring: wound
  # the stud flashes and is gone at once; the spring uncoils to its rest
  # shape as soon as nothing holds its end
  2:
    watch: [*spring, mainspring rest]
    watchFlash: [mainspring stud]
    watchCut: [mainspring stud]
    watchMainspring: released
  # the rest shape fades out, the camera zooms out to the whole movement,
  # from the barrel to the balance, and the barrel and the watch (all but
  # the hour hand) fade in, still; the barrel and the centre pinion, which
  # it drives, flash; then the key winds it, and the watch starts. The view
  # fits the movement in the slide band: it runs behind the title. The
  # pallet fork is not in the list: it is inside the others, and its extent
  # is the whole circle about its pivot
  3:
    watch:
      [
        *spring,
        barrel,
        escape wheel,
        escape pinion,
        escape arbor,
        fourth wheel,
        fourth pinion,
        fourth arbor,
        third wheel,
        third pinion,
        third arbor,
        centre wheel,
        centre pinion,
        centre arbor,
        balance wheel,
        balance staff,
        hairspring,
        collet,
        stud,
        roller,
        impulse jewel,
        pallet fork,
        seconds hand,
        minute hand,
        centre pivot,
        chapter ring,
        case band,
        lug,
        crown,
        strap,
      ]
    watchFlash: [barrel, centre pinion]
    watchMainspring: barrel
    watchView:
      &movement [
        barrel,
        centre wheel,
        third wheel,
        fourth wheel,
        escape wheel,
        balance wheel,
        hairspring,
        stud,
      ]
    watchBand: slide
  # a time-lapse, until the barrel has turned once: then the watch stops
  4:
    watchMainspring: run down
clicks: 4
class: mainspring
history: "c. 1430"
---

# Mainspring

One spring to power them all

<div class="ms-sentence">
  <div class="ms-paragraph text-dims">Not back-and-forth,<br>one slow unwind</div>
  <div v-click="1" class="ms-paragraph text-dims">Winding causes tension,<br>axle only turns one way</div>
  <div v-click="3" class="ms-paragraph text-dims">Unwinding drives barrel</div>
  <div v-click="4" class="ms-paragraph text-dims">6 hours in 6 seconds</div>
</div>

<style>
/* The text is where the Gears and Gear Train slides' text is, in the same
   type. From click 3 the case runs behind it, so it is outlined in the
   paper's colour, as the Gear Train slide's text is; so are the title and
   the subtitle, which the movement runs behind at click 3. */
.slidev-layout.mainspring h1,
.slidev-layout.mainspring h1 + p,
.slidev-layout.mainspring .ms-sentence {
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
}
.slidev-layout.mainspring .ms-sentence {
  position: absolute;
  left: 560px;
  top: 165px;
  font-size: 35px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
}
/* Each click adds a paragraph, and nothing leaves. When a paragraph shows,
   the paragraphs before it dim (style.css, "TEXT DIMS"), as on the Balance
   Wheel slide. */
.slidev-layout.mainspring .ms-paragraph + .ms-paragraph {
  margin-top: 0.7em;
}
.slidev-layout.mainspring
  .ms-paragraph:has(~ .ms-paragraph:not(.slidev-vclick-hidden)) {
  --text-dim: var(--text-dimmed);
}
</style>

<!-- narration

[figure: The bare mainspring: a long ribbon of steel, coiled round its arbor,
at rest.]

This is a spiral spring, like the hairspring.  But instead of swinging back and
forth, it does one slow unwind over a day or two. In the illustration above,
it's at rest.

Below, the outer end is held in place.  Drag the slider to wind it up.  The
spring keeps its length, so its coils draw in toward the center.

[click]

[figure: The mainspring on its arbor. A stud holds its outer end, and a
key turns the arbor. A slider winds it.]

When wound away from its rest shape, the dashed line, it pushes back, as the
hairspring does.  The axle (_arbor_) can only turn one way.  To unwid the
mainspring, let go of the outer end by pressing the button.

[click]

[figure: The wound mainspring, its outer end held by the stud. A button lets
go of the outer end.]

The block is gone, and the outer end swings round until the spring lies on its
rest shape again. That fling is the energy that the winding put in.

A watch uses that force by attaching the outer end to a wheel, the _barrel_.

[click]

[figure 3-4: The mainspring in its barrel, driving the whole movement. The
next step runs six hours in six seconds.]

The barrell's teeth drive the gear train that we built.  The wound mainspring,
pushing the barrel, whose teeth drive the gear train we built, is the "hidden
mechanism" we mentioned earlier.

[click] The arbor can only turn one way, so only winds the spring up.  So the
spring can unwind only by turning the barrel. Step the figure forward using the
controls under it, and six hours pass in six seconds. The barrel turns once, the
minute hand six times, and the coils move back out to the wall. When the spring
is completely unwound, the watch stops.

-->

<!--
- Like the Hairspring

[click] Hold the outside end.

Keeps its length.

Axle only turns one way.

[click] Only way to unwind: outside end.

[click] Attach to inside of barrel.

Barrel's teeth drive the gear train.

Currently too slow to see

[click] Time lapse.

Barrel turns once, the minute hand six times, and the mainspring moves out to the wall.
-->

---
# the whole watch as the Mainspring slide leaves it, but the hour hand, in
# its view (the movement in the slide band), so the step from it does not
# move the camera; tilt 20 at every click. While the camera is in on the
# motion works, all but the centre wheel and the minute hand is dimmed
# (docs/watch.md, "The Hour Hand slide")
watch:
  &watch [
    &faint [
      barrel arbor,
      mainspring,
      barrel,
      centre pinion,
      escape wheel,
      escape pinion,
      escape arbor,
      fourth wheel,
      fourth pinion,
      fourth arbor,
      third wheel,
      third pinion,
      third arbor,
      balance wheel,
      balance staff,
      hairspring,
      collet,
      stud,
      roller,
      impulse jewel,
      pallet fork,
      seconds hand,
      chapter ring,
      case band,
      lug,
      crown,
      strap,
    ],
    &lit [centre wheel, centre arbor, minute hand, centre pivot],
  ]
watchView:
  &movement [
    barrel,
    centre wheel,
    third wheel,
    fourth wheel,
    escape wheel,
    balance wheel,
    hairspring,
    stud,
  ]
watchBand: slide
watchTilt: 20
class: hour-hand
watchClicks:
  # one wheel, 12 times slower: a pinion on the centre arbor (the cannon
  # pinion) and a wheel with 12 times its leaves. They fade in and flash
  1:
    watch: [*watch, &oneStep [cannon pinion, one-step hour wheel]]
    watchFlash: *oneStep
  # the hour hand on that wheel's arbor: off centre
  2:
    watch: [*watch, *oneStep, one-step hour hand]
  # the one-step wheel, its hand and its pinion go; the camera zooms in on
  # the centre wheel, in the picture band, and then all but the centre wheel
  # and the minute hand dims
  3:
    watch: *watch
    watchView: [centre wheel]
    watchBand: picture
    watchDim: *faint
  # the cannon pinion and the minute wheel fade in, and flash: out, 3:1
  4:
    watch: [*watch, &out [cannon pinion, minute wheel, minute arbor]]
    watchFlash: [cannon pinion, minute wheel]
  # the minute pinion and the hour wheel fade in, and flash: back, 4:1
  5:
    watch: [*watch, *out, &back [minute pinion, hour wheel]]
    watchFlash: *back
  # the camera zooms back out, the dim ends, and the hour hand fades in, on
  # the hour wheel, in the middle
  6:
    watch: [*watch, *out, *back, hour hand]
    watchView: *movement
    watchBand: slide
    watchDim: false
clicks: 6
history: "Hour hand: c. 1350"
---

# Hour Hand

From once an hour to twice a day

<!-- Each text waits for the watch's change at its click to end, with its
flash (after-watch, style.css), as on the Gear Train slide. Clicks 1 and 2's
texts are about the one-step wheel, so they go with it at click 3
(docs/watch.md, "The Hour Hand slide"). -->

<div v-click.hide="3" class="hh-sentence">
  <div class="after-watch">12:1 gear ratio</div>
  <div v-click="2" class="after-watch">Hour hand off centre!</div>
</div>

<!-- The stages stay at click 6, dimmed, above the hour hand's text: a
recap, as on the Gear Train slide. -->

<div class="hh-sentence" :class="{ 'hh-recap': $clicks >= 6 }">
  <div v-click="4" class="after-watch hh-stage text-dims">Out: 3:1</div>
  <div v-click="5" class="after-watch hh-stage text-dims">
    <div>Back: 4:1</div>
    <div>3:1 × 4:1 = 12:1</div>
  </div>
  <div v-click="6" class="after-watch">
    <div><span class="turn-time">Twice a day</span>,<br>in the middle.</div>
    <div>The hour hand!</div>
  </div>
</div>

<style>
/* The ring and the one-step hour wheel run behind the title and the text:
   the paper's outline keeps them legible, as on the Gear Train slide. */
.slidev-layout.hour-hand h1,
.slidev-layout.hour-hand h1 + p,
.slidev-layout.hour-hand .hh-sentence {
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
}
/* Where the Gear Train slide's text is, and the same type: 70 px right of
   the picture's right edge (the frontmatter's watchRight). The fades are in
   longhands, which keep after-watch's delay. */
.slidev-layout.hour-hand .hh-sentence {
  position: absolute;
  left: 560px;
  top: 165px;
  font-size: 35px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
}
.slidev-layout.hour-hand .hh-sentence div + div {
  margin-top: 0.7em;
}
.slidev-layout.hour-hand .hh-sentence.slidev-vclick-target,
.slidev-layout.hour-hand .hh-sentence > .slidev-vclick-target:not(.text-dims) {
  transition-property: opacity;
  transition-duration: var(--text-fade);
}
/* At click 6 the stages dim (style.css, "TEXT DIMS"), as the Gear Train
   slide's do, when the hour hand's text fades in: after the watch's change
   (after-watch). Their fades come with text-dims. */
.slidev-layout.hour-hand .hh-recap > .hh-stage {
  --text-dim: var(--text-dimmed);
  transition-delay: var(--watch-end-delay, 0s);
}
</style>

<!-- narration

The hour hand must turn twice a day, that's once every twelve hours. Unlike the 60:1, a 12:1 gear is doable.

[nofigure]

[click] But the hour hand on that wheel's axle (_arbor_), and it is off centre!
And it would run backward (couterclockwise): a pair of meshing gears turn
opposite directions.

[click:3] So we use the same two-step trick we used for the minute hand.  This
time, 3:1 going out and 4:1 coming back.  3:1 × 4:1 = 12:1.

[figure 5: The motion works, close up: the cannon pinion, the minute wheel
and its pinion, and the hour wheel. The rest of the watch is dimmed.]

[click] The hour hand goes on the hour wheel, in the middle, under the minute
hand. It turns clockwise, twice a day.
-->

<!--


[click] 12:1 doable.

[click] Also runs backwards

[click:4] Runs clockwise.
-->

---
# A tour of the train with no text, from the motion works to the balance:
# the watch fills the slide. Each click is a stop. The camera moves, zooms,
# tilts and turns at the same time (watchMove: together), and the mechanism
# runs at the stop's speed-up: the slower of the two parts that touch turns
# once in 30 s (watchLapse). The views put each touch at the middle of the
# slide (watch/recap.ts; docs/watch.md, "The Recap slide")
title: Recap
watch:
  [all, cannon pinion, minute wheel, minute pinion, minute arbor, hour wheel]
watchView: recap motion works
watchFlash: [hour wheel, minute wheel, minute pinion]
watchFlashAfterMove: true
watchUnwind: true
watchWind: true
watchTilt: 30
watchMove: together
watchLapse: 1440
watchTimeScale: true
watchClicks:
  # Wind before moving here, even after a long pause at the first stop.
  # The barrel turns once in 6 hours.
  1:
    watchView: recap barrel
    watchFlash: [barrel, mainspring, barrel arbor]
    watchLapse: 720
    watchWind: true
  # the barrel's teeth on the centre pinion, low, from about 3:40
  2:
    watchView: recap barrel touch
    watchFlash: [barrel, centre pinion]
    watchTurn: 80
    watchTilt: 80
  # back up over the movement: the centre wheel on the third pinion, with
  # the next touch behind it, as at each stop from here. From here the hour
  # hand moves too slowly to pass over a touch during a stop, so it goes
  # when the camera arrives; the minute hand, the centre wheel's own, stays
  # one stop more
  3:
    watchView: recap centre touch
    watchFlash: [centre wheel, third pinion]
    watchTurn: -10
    watchTilt: 45
    watchLapse: 120
    watchHide: [hour hand]
    watchGoLater: [hour hand]
  4:
    watchView: recap third touch
    watchFlash: [third wheel, fourth pinion]
    watchTurn: 15
    watchLapse: 15
    watchHide: [hour hand, minute hand]
    watchGoLater: [minute hand]
  # the fourth wheel turns once in 30 s, the escape wheel once in 15 s
  5:
    watchView: recap fourth touch
    watchFlash: [fourth wheel, escape pinion]
    watchTurn: 75
    watchLapse: 2
  # from here, the mechanism at its own speed
  6:
    watchView: recap pallet
    watchFlash: [escape wheel, pallet fork]
    watchTurn: 90
    watchLapse: 1
  7:
    watchView: recap jewel
    watchFlash: [impulse jewel, pallet fork]
  # where the Hairspring slide shows it, on the left
  8:
    watchView: hairspring
    watchFlash:
      [
        balance wheel,
        balance staff,
        hairspring,
        collet,
        stud,
        roller,
        impulse jewel,
      ]
    watchTurn: 0
    watchTilt: 20
    watchTimeScale: false
clicks: 8
---

<!-- narration

And that's how a mechanical watch works!

Here's a recap, working backwards from the hour hand to the hairspring. The tour
plays by itself, like a short film. The time scale in the corner says how much
faster than real time each segment runs.

[figure 0-8 play: A tour of the watch's train, from the motion works to the
balance wheel, one touch at a time.]

The motion works, a day a minute: the minute pinion drives the hour wheel,
which turns once in thirty seconds.

[click] The barrel, with the mainspring inside. It turns once in six hours.

[click] Down low, from the side: the barrel's teeth drive the centre pinion.

[click] The centre wheel drives the third pinion. The next touch is behind
it.

[click] The third wheel drives the fourth pinion.

[click] The fourth wheel, the second hand's own, drives the escape pinion, at
twice its speed: once in fifteen seconds.

[click] Real time now. The escape wheel's teeth on the pallet's stones.

[click] The impulse jewel in the fork.

[click] The balance wheel and its hairspring, where we started.
-->

<!--
The whole train, one touch at a time. The motion works, a day a minute: the hour wheel turns once in 30 seconds, on the minute pinion.

[click] The barrel, and the spring inside it. Six hours a turn.

[click] Down low, from the side: the barrel's teeth on the centre pinion.

[click] Back up: the centre wheel on the third pinion. The next touch is behind it.

[click] The third wheel on the fourth pinion.

[click] The fourth wheel, the seconds hand's, on the escape pinion: twice its speed, once in 15 seconds.

[click] Real time now. The escape wheel on the pallet's stones.

[click] The impulse jewel in the fork.

[click] The balance wheel and its hairspring, where we started.
-->

---
# the cover's picture, as on Mechanical Marvels. The step from the Recap
# slide's last click moves in order (the default watchMove), the reverse of
# the step from Mechanical Marvels to the Hairspring slide: the motion works
# fade out, the hands that the Recap slide hid fade in, the camera tilts to
# 0, and then it zooms out
layout: section
side: left
eyebrow: PART 2
watch: all
watchView: cover
watchMoveAlso: [hour hand, minute hand]
---

# Changed The World

<!--
And the whole watch.
-->

---
layout: full
class: tk-timekeepers
# Hidden: not in the talk. It stays as the example of every slide pattern
# (docs/slide-patterns.md) and of 2D SVG animation, to compare palettes.
hide: true
---

# Before clocks, time was a flow

<script setup>
// One card per click, in this order; the takeaway comes after the last card.
const cards = [
  {
    name: "Sundial", date: "c. 1500 BCE", img: "timekeepers/sundial.svg",
    stat: "±16 min", unit: "the Sun vs. a steady clock", problem: "No sun, no time",
  },
  {
    name: "Water clock", date: "c. 1400 BCE", img: "timekeepers/water-clock.svg",
    stat: "~15 min", unit: "per day, the best ones", problem: "Freezes in winter",
  },
  {
    name: "Candle", date: "9th c. CE", img: "timekeepers/candle.svg",
    stat: "?", unknown: true, unit: "no good data found", problem: "Drafts speed it up",
  },
  {
    name: "Hourglass", date: "by 1338", img: "timekeepers/hourglass.svg",
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
/* Colours come from the palette, and type from the house theme. Layout stays here. */
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
