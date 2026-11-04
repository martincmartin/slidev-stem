---
# The house theme for the STEM talks: ../themes/house/. The palette is an
# addon, and colorSchema must match its paper: light or dark
# (../docs/theme.md, "Palettes").
theme: house
colorSchema: light
title: What Everyone Should Know About Watches
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
art: all
artView: cover
# the slide's right edge cuts the watch: the article shows it whole
article:
  0:
    view: centred cover
---

# What Everyone Should Know About Mechanical Watches

Martin C. Martin

<!-- narration

Mechanical watches have kept time for 500 years.  Many of their core parts were
invented even earlier for giant cathedral tower clocks before being shrunk into
portable timepieces.  This page explains how a modern one works.  I personally
think it's fascinating that a purely mechanical device can keep time with 99.99%
accuracy for $100.  They also changed the world and look good on your wrist.

This presentation was partially inspired by Bartosz Ciechanowski's [Mechanical
Watch](https://ciechanow.ski/mechanical-watch/) page.  You can think of this
page as a simpler introduction or background.  When you're finished with this,
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
art: all
artView: cover
transition: watch-zoom
---

# Mechanical Marvels

---
art: [hairspring, collet, stud]
artView: hairspring
# the oscillator flashes; then the camera zooms in with the whole watch on the
# screen, and the rest fades out (docs/watch.md)
artFlash:
  [
    balance wheel,
    balance staff,
    hairspring,
    collet,
    stud,
    roller,
    impulse jewel,
  ]
artMoveWith: all
artTilt: 20
# click 2: the balance comes to rest while the diving board covers it;
# click 3: it swings again (docs/watch.md, "The diving board")
artClicks:
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

[figure: A hairspring, seen at an angle: a flat spiral of steel ribbon. Its
outer end is held in a small block, and its inner end is on a hub at the
center. The spiral winds and unwinds.]

Start with the part that keeps time.  In 1675 Christiaan Huygens, a Dutch
scientist, invented the _hairspring_. It is a flat spiral of steel ribbon, finer
than a hair. Its outer end is held still, and its inner end is free to
turn. Twist the inner end and let go, and the spiral winds and unwinds, back and
forth, at a steady rate. In this drawing it swings once every two seconds, and
the rest of the watch follows that beat.

[click]

[figure: A diving board over a pool. It bends, is let go, and swings up and
down past its straight shape, which a dashed line shows. The label reads:
"Bend it away from straight, it pushes back".]

Why does a spring swing? Think of a diving board. Bend it down, and
it pushes back: an _elastic restoring force_. Let go, and it does not stop at
straight. It overshoots, bends the other way, and comes back again: it
_oscillates_. With no friction, it would oscillate forever.

[click] A hairspring is a diving board rolled up. The board's rest shape is a
straight line; the hairspring's is a spiral. Take hold of the slider under
the next picture, and drag it to the right.

[figure 2: The diving board curls up into the hairspring, at rest.]

[click] "Bend" becomes "wind", and "straight" becomes "rest". Now give the
hairspring a twist: drag the slider to wind the spiral away from its rest
shape, and let go.

[figure 3: The hairspring at rest. Wound away from rest and let go, it swings
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
art: [balance wheel, balance staff, hairspring, collet, stud]
artView: hairspring
artTilt: 20
artFlash: [balance wheel, balance staff]
class: balance-wheel
clicks: 3
history: "c. 1364"
---

# Balance Wheel

<div class="bw-sentence side-text">
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
/* The house's text beside a picture (side-text). Its left edge is the Hairspring
   slide's sentence's (DivingBoard.vue, --label-x). */
.slidev-layout.balance-wheel .bw-sentence {
  left: 610px;
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
> arms out. Old balance wheels had screws around the rim, and watchmakers moved
> them in or out to make the watch run slower or faster. The swing also takes
> about the same time whether it swings through a big angle or small angle
> (_isochronism_). That comes from the spring and the mass together, and it is
> why a watch keeps time even while the watch winds down.

[click] Mass also makes the swing steady. Push an empty playground swing, and it
jerks about. Put a child on it and it swings much more gracefully. A heavy wheel
carries its own momentum, so a knock to your wrist, or turning it upside down,
barely changes its rhythm.

[click] How good is it? A well-calibrated mechanical watch, even an everyday
Seiko or Citizen, is about 99.99% accurate.  A day has 86,400 seconds, so that
watch gains or loses about nine seconds a day.

I'm not particularly handy with mechanical things. If I tried to build a table
it would wobble because things would be off by a few percent.  So it kind of
blows my mind that, for $100, I can get a simple, everyday, purely mechanical
system and tweak it to be 99.99% accurate!

 -->

<!--
[click] - wrist bump or upside down
-->

---
art:
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
artView: *escapement # the camera stays when click 2 shows less
artTilt: 20
artClicks:
  # the wheel's callout appears; the pallet and the balance fade, and then
  # the drive arrow fades in, and the escape wheel spins freely
  1:
    art: [escape wheel, escape arbor, escape wheel drive]
    watchSpin: 135 # degrees a second
  # they fade back in, and the pallet stops the wheel (docs/watch.md)
  2:
    art: [*escapement, escape wheel drive]
    watchSpin: false
  # the balance comes to rest, with the jewel under its leader
  3:
    watchAtRest: true
  # it swings again, and the leader fades out; "tick" and "tock" show each
  # time a tooth lands on a pallet stone (docs/watch.md)
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
import { ART } from "./watch/instance.ts";
// where the leaders end: points of the watch, in this slide's view
const marks = escapementMarks(ART, useSlideContext().$frontmatter);
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

A second hand that just moves back and forth isn't very useful.  We need it to
turn one way only.  The _escapement_ turns the swing into steps.

The _escape wheel_ is being turned by a mechanism we'll explain soon, so it's
hidden on this diagram.  Without something to stop it, it would just turn and
turn.

[nofigure]

[click]

[figure: The escape wheel alone, spinning freely. A curved arrow shows the
push on it.]

[click] The _pallet fork_ stops it.

[figure: The balance wheel on the left, the pallet fork in the middle, and
the escape wheel on the right. A stone at the end of the fork holds a tooth
of the wheel. Labels: "Wheel driven by hidden mechanism" and "Pallet blocks
wheel".]

Its two prongs (called _stones_) stick in the wheel's teeth: a tooth lands on a
stone, and the wheel stops. Each time the fork rocks, one stone lets a tooth go,
and the other stone catches the next tooth.  The tooth _escapes_, and that is
where the name comes from.

[click] What rocks the fork? The balance does. On its staff is a small _impulse
jewel_, which sits in the notch at the end of the fork.  It's actually a
synthetic ruby or sapphire, so it really is a jewel, a precious stone.

[figure: The escapement at rest, labeled: the escape wheel, the pallet
fork, and the impulse jewel in the fork's notch.]

As the balance swings through the middle, the jewel strikes the fork and
flips it one way. On the swing back, it flips it the other way.

[click]

[figure: The escapement at work. The balance swings, its jewel strikes the
fork, the fork rocks, and the escape wheel moves on one tooth. "Tick" and
"tock" show each time a tooth lands on a stone. Labels: "Jewel strikes
pallet", "Wheel driven by hidden mechanism" and "Pallet blocks wheel".]

So, at each swing, the balance lets the wheel take one small step.  The step
ends when the next tooth lands on a stone, hard enough to make a sound, this is
the tick and the tock of a watch.

-->

<!--
- second hand: turn one direction

[click]  turning force, explained soon

[click]  Stick in teeth.
- Each rock lets a tooth _escape_.

[click] Synthetic ruby or sapphire.  Really is a jewel!

[click] Tooth lands on stone: tick, tock.
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
art: [seconds hand, fourth arbor]
artView: [seconds hand]
artRight: 438
artTilt: 20
class: ticks-and-turns
clicks: 3
---

# Ticks and Turns

Named for what they count

<!-- Each click adds text, and none leaves. The text before the newest dims
(style.css, "TEXT DIMS"). The table comes whole at click 3: its first row is
what the audience has just worked out, and its other rows state the same
rule for the other two hands. -->

<div class="tt-sentence side-text">
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
/* The house's text beside a picture (side-text), further left than the
   Gears slide's: 44 px right of the hand's circle (the frontmatter's artRight). The
   circle's edge is where the tip reaches at 3 o'clock only. The widest
   line, "60 ticks a turn: once a minute", and the table (216 + 32 + 235 px)
   are each about 483 px: they end at 965 px, as the Gears slide's rule
   does. The cells are left-aligned, so the eye runs down each column. */
.slidev-layout.ticks-and-turns .tt-sentence {
  left: 482px;
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
long does the second hand take to go once around the dial?

[figure 3: The second hand alone, pinned on its arbor, ticking once a
second.]

Each tick is one second, and sixty ticks brings it all the way around. So the
second hand makes a complete circle once a minute. A hand is named for what it
counts, not for how long it takes to make a full 360° turn.

| Hand        | A full turn   |
| ----------- | ------------- |
| Second hand | Once a minute |
| Minute hand | Once an hour  |
| Hour hand   | Twice a day   |


> [!aside] Why is this second hand not in the middle?
>
> On most watches the second hand is in the middle, with the minute and hour
> hands.  But putting three hands all on the same shaft makes the diagram
> confusing, and many older watches had their second hand off center.
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
artView: &gears [fourth wheel, fourth arbor, escape pinion, escape arbor]
# the span, in the gears' own colours: it cannot be seen until click 1
# flashes it
art: [*gears, fourth wheel span plain, escape pinion span plain]
# the fourth wheel's teeth reach 70 px short of the text (.gears-sentence,
# left: 560px): this edge, plus half the outline, is 70 px left of the "A"
artRight: 489
artTilt: 20
# the audience has not seen these gears, so their place in the watch does
# not matter: the Ticks and Turns slide's picture fades out, the camera jumps,
# and this one fades in, both ways (docs/watch.md, "The Gears slide")
artMoveWith: none
# the gears turn freely, from the start: the pinion once in 4 s (360 / 4 = 90
# degrees a second), so the fourth wheel once in 8 s
watchSpin: 90
class: gears
artClicks:
  # a span: four teeth of the wheel, and the four leaves that they drive.
  # Four teeth are a quarter of the wheel and half the pinion. The gears
  # turn on. The span is in the flash's colours (second-wash faces, second
  # outline), and the text comes one line a click (clicks 2 to 4: two
  # callouts, then a sentence). The span comes in with a flash, not a fade:
  # its plain teeth flash, and when the flash ends, they go and the span
  # shows, at once. No flash for the text: each callout's leader shows which
  # gear it means
  1:
    art: [*gears, fourth wheel span, escape pinion span]
    artFlash: [fourth wheel span plain, escape pinion span plain]
    artCut:
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
    art:
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
    art: [*mechanism, seconds hand]
clicks: 6
history: "Second hand: c. 1670"
---

# Gears

Fast gear, meet slow gear

<script setup>
import { useSlideContext } from "@slidev/client";
import { gearsMarks, LEADER_GAP } from "./watch/callouts.ts";
import { ART } from "./watch/instance.ts";
// where the leaders end: outside the gears' tip circles, in this slide's view
const marks = gearsMarks(ART, useSlideContext().$frontmatter);
</script>

<!-- Each callout's leader points at the gear that the whole label names, so
the label is all one callout word, in ink: not a keyword callout, whose
second would merge with the span (docs/watch.md, "The Gears slide"). -->

<WatchCallout v-click="[2, 5]" class="gears-callout text-dims" from-end :to="marks.pinion" :stop="LEADER_GAP" :clear="[marks.pinionTips]" :left="380" :top="154"><span class="callout-word">Half of the small gear</span></WatchCallout>

<WatchCallout v-click="[3, 5]" class="gears-callout text-dims" from-end :to="marks.wheel" :stop="LEADER_GAP" :clear="[marks.wheelTips]" :left="500" :top="211"><span class="callout-word">A quarter of the big gear</span></WatchCallout>

<div v-click="4" class="gears-sentence gears-rule text-dims">Twice the circumference,<br>half the speed.  Exactly.</div>

<div v-click="6" class="gears-sentence gears-minute after-watch-fade text-dims">
  <div>Turns <span class="turn-time">once a minute</span>.</div>
  <div>The second hand!</div>
</div>

<style>
/* On the right of the gears, 70 px from the fourth wheel's teeth: the
   frontmatter's artRight follows this left. The callouts are in the
   callout type, next to their gears, above the rule: not in this column.
   The second hand's text is under the rule, 0.7em below it
   (290 + 2 * 43.75 + 24.5 = 402 px). Clicks replace the callouts, so no one
   click shows all of this text: the callouts, the rule and the second hand's
   text are one stack, centred under the subtitle (side-text does this for a
   column that one element holds; ../docs/slide-layout.md).
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
}
.slidev-layout.gears .gears-sentence.gears-rule {
  top: 290px;
}
.slidev-layout.gears .gears-sentence.gears-minute {
  top: 402px;
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
that meshes with a big one.

[nofigure]

[click]

[figure 4: Two gears, turning: a small gear with eight teeth drives a big
gear with sixteen. Four teeth on each gear are colored.]

> [!aside] Must the teeth be the same size?
> Strictly, the _pitch_ must match: a tooth and its gap on one wheel must be as
> long as a tooth and its gap on the other. One wheel can have wider teeth
> than the other, as long as it has narrower gaps.

The teeth on the two gears must have the same spacing, so they mesh neatly.
Each tooth fits in a gap of the other gear, so the teeth go past each other one
for one, and both rims move at the same speed.  Four teeth on each gear are
colored. Those four teeth are half of the small gear, but only a quarter of the
big one. So the small gear turns twice for each turn of the big one: twice the
circumference, half the speed.

[click:5]

[figure: The pinion, now under the escape wheel, meshes with the big gear,
and the pallet fork is beside the escape wheel. The second hand is on the big
gear's axle, and steps around clockwise, once a minute.]

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

In this watch, the big gear (called the _fourth wheel_) turns exactly once a
minute: just what the second hand needs! So the second hand goes on the big
gear's axle. It is the first part of the watch that we can read.

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
art:
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
artView: &frame [escape wheel, fourth wheel, third wheel, centre wheel]
artRight: 489
artTilt: 20
class: gear-train
artClicks:
  # one wheel that is sixty times slower, in one step: it drives the
  # fourth pinion, from the line from the escape arbor through the fourth
  # arbor (docs/watch.md, "The Gear Train slide"). The camera untilts and
  # zooms out until the case band fills the picture band, so the case shows
  # how large the wheel is. The drive arrow stays on the fourth wheel while
  # the camera moves, and then goes. The wheel and the pinion fade in, then
  # the case, and then they flash. The case's strap is the raised strap,
  # above the wheel
  1:
    art:
      [
        *seconds,
        fourth pinion,
        one-step wheel,
        &case [case band, lug, crown, raised strap, chapter ring],
      ]
    artView: [case band]
    artTilt: 0
    artLater: *case
    artGoLater: [fourth wheel drive]
    artFlash: [one-step wheel, fourth pinion]
  # the train slows the turn from once a minute to once an hour, in two
  # steps. Each fades in, and then flashes: the wheel, with its arbor, and
  # the pinion that it drives. The drive arrow moves to the new wheel: the
  # old one fades out first, and the new one fades in with its wheel
  2:
    art:
      [
        *seconds,
        &third [fourth pinion, third wheel, third arbor],
        third wheel drive,
      ]
    artView: *frame
    artTilt: 20
    artFlash: *third
  3:
    art:
      [
        &train [
          &trainContext [*seconds, *third, third pinion],
          centre wheel,
          centre arbor,
        ],
        centre wheel drive,
      ]
    artFlash: [third pinion, centre wheel, centre arbor]
  # the minute hand, on the centre wheel's arbor, and the case and the dial
  # (the chapter ring holds its marks); not the hour hand
  4:
    art:
      [
        *train,
        centre wheel drive,
        centre pivot,
        &face [minute hand, chapter ring, case band, lug, crown, strap],
      ]
  # keep the centre wheel, its arbor, pivot and drive arrow bright; the hidden
  # source of the push is the next slide's spring
  5:
    artDim: [*trainContext, *face]
clicks: 5
history: "Minute hand: c. 1656"
---

# Gear Train

From once a minute to once an hour

<script setup>
import { useSlideContext } from "@slidev/client";
import { gearTrainMarks, LEADER_GAP } from "./watch/callouts.ts";
import { ART } from "./watch/instance.ts";
const marks = gearTrainMarks(ART, useSlideContext().$frontmatter);
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
<div class="gt-sentence side-text" :class="{ 'gt-staged': $clicks >= 2, 'gt-recap': $clicks >= 4 }">
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
/* The house's text beside a picture (side-text), at the Gears slide's left:
   70 px right of the picture's right edge (the frontmatter's artRight). The fades are in
   longhands, which keep after-watch's delay. */
.slidev-layout.gear-train .gt-sentence {
  left: 560px;
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

[click]

[figure: The watch, with a gear sixty times the size of the second hand's
pinion drawn in place. The gear is far larger than the whole watch, and sticks
out of the case.]

But there's a limit to how small you can manufacture the small gear, so
the big gear would be huge.  And it would have a lot of teeth which adds to
the cost.  Plus, it would turn the wrong way, counterclockwise, because every gear
turns the opposite direction from the one it meshes with.

[click]

[figure 2-3: Two more pairs of gears, between the second hand's wheel and the
center wheel.]

So the watch slows in two stages. The _third wheel_ runs 7½ times slower, and
the _center wheel_ runs 8 times slower than that.

[click] 7½ times 8 is 60, so the center wheel turns once an hour.

[click]

[figure: The minute hand on the center wheel's arbor, in the middle of the
case.]

The minute hand goes on the center wheel's axle (_arbor_), in the middle of the dial.
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

[click:4] Next up, the mechanism that drives this wheel.
-->

---
# the bare mainspring and its arbor, as large as the picture band; the
# camera stays at every click. The story (watchMainspring) turns the key,
# winds and lets down the spring, and says when the watch runs
# (docs/watch.md, "The Mainspring slide")
art: &spring [mainspring, barrel arbor]
artView: *spring
artTilt: 20
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
artLinger:
  - pieces: [centre wheel, centre arbor, centre pivot]
    seconds: 1
  - pieces: [centre wheel drive]
    seconds: 1
artClicks:
  # the stud and the dashed rest shape fade in, and the stud flashes; then
  # the key winds it
  1:
    art: [*spring, mainspring stud, mainspring rest]
    artFlash: [mainspring stud]
    watchMainspring: wound
  # the stud flashes and is gone at once; the spring uncoils to its rest
  # shape as soon as nothing holds its end
  2:
    art: [*spring, mainspring rest]
    artFlash: [mainspring stud]
    artCut: [mainspring stud]
    watchMainspring: released
  # the rest shape fades out, the camera zooms out to the whole movement,
  # from the barrel to the balance, and the barrel and the watch (all but
  # the hour hand) fade in, still; the barrel and the centre pinion, which
  # it drives, flash; then the key winds it, and the watch starts. The view
  # fits the movement in the slide band: it runs behind the title. The
  # pallet fork is not in the list: it is inside the others, and its extent
  # is the whole circle about its pivot
  3:
    art:
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
    artFlash: [barrel, centre pinion]
    watchMainspring: barrel
    artView:
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
    artBand: slide
  # a time-lapse, until the barrel has turned once: then the watch stops
  4:
    watchMainspring: run down
clicks: 4
class: mainspring
history: "c. 1430"
---

# Mainspring

One spring to power them all

<div class="ms-sentence side-text">
  <div class="ms-paragraph text-dims">Not back-and-forth,<br>one slow unwind</div>
  <div v-click="1" class="ms-paragraph text-dims">Winding causes tension,<br>axle only turns one way</div>
  <div v-click="3" class="ms-paragraph text-dims">Unwinding drives barrel</div>
  <div v-click="4" class="ms-paragraph text-dims">6 hours in 6 seconds</div>
</div>

<style>
/* The house's text beside a picture (side-text), at the Gears and Gear Train
   slides' left. From click 3 the case runs behind it, so it is outlined in the
   paper's colour, as the Gear Train slide's text is; so are the title and
   the subtitle, which the movement runs behind at click 3. */
.slidev-layout.mainspring h1,
.slidev-layout.mainspring h1 + p,
.slidev-layout.mainspring .ms-sentence {
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
}
.slidev-layout.mainspring .ms-sentence {
  left: 560px;
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

[figure: The bare mainspring: a long ribbon of steel, coiled around its arbor,
at rest.]

This is a spiral spring, like the hairspring.  But instead of swinging back and
forth, it does one slow unwind over a day or two. In the illustration above,
it's at rest.

Below, the outer end is held in place.  Drag the slider to wind it up.  The
spring keeps its length, so its coils draw in toward the center.

[click]

[figure: The mainspring on its arbor. A stud holds its outer end, and a key
turns the arbor.]

When wound away from its rest shape, the dashed line, it pushes back, as the
hairspring does.  A tiny one-way ratchet locks the axle (_arbor_) so it can only
turn one way.  To unwind the mainspring, let go of the outer end by pressing the
button.

[click]

[figure: The wound mainspring, its outer end held by the stud.]

The block is gone, and the outer end swings around until the spring lies on its
rest shape again. That fling is the energy that the winding put in.

A watch harnesses that force by attaching the spring's outer end to a toothed
drum called the _barrel_, invented by Jean-Antoine Lépine around 1760.

[click]

[figure 3-4: The mainspring in its barrel, driving the whole movement. Then six
hours pass in six seconds.]

As the mainspring pushes the barrel, the barrel's teeth drive the gear train we
just built.  This is the "hidden mechanism" we mentioned earlier.

[click] Because the ratchet stops the arbor from turning backwards, the spring
has only one way to unwind: by its outer end turning the barrel. Step the figure
forward using the controls under it, and six hours pass in six seconds. The
barrel turns once, the minute hand six times, and the coils move back out to the
wall. When the spring is completely unwound, the watch stops.

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
art:
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
artView:
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
artBand: slide
artTilt: 20
class: hour-hand
artClicks:
  # one wheel, 12 times slower: a pinion on the centre arbor (the cannon
  # pinion) and a wheel with 12 times its leaves. They fade in and flash
  1:
    art: [*watch, &oneStep [cannon pinion, one-step hour wheel]]
    artFlash: *oneStep
  # the hour hand on that wheel's arbor: off centre
  2:
    art: [*watch, *oneStep, one-step hour hand]
  # the one-step wheel, its hand and its pinion go; the camera zooms in on
  # the centre wheel, in the picture band, and then all but the centre wheel
  # and the minute hand dims
  3:
    art: *watch
    artView: [centre wheel]
    artBand: picture
    artDim: *faint
  # the cannon pinion and the minute wheel fade in, and flash: out, 3:1
  4:
    art: [*watch, &out [cannon pinion, minute wheel, minute arbor]]
    artFlash: [cannon pinion, minute wheel]
  # the minute pinion and the hour wheel fade in, and flash: back, 4:1
  5:
    art: [*watch, *out, &back [minute pinion, hour wheel]]
    artFlash: *back
  # the camera zooms back out, the dim ends, and the hour hand fades in, on
  # the hour wheel, in the middle
  6:
    art: [*watch, *out, *back, hour hand]
    artView: *movement
    artBand: slide
    artDim: false
clicks: 6
history: "Hour hand: c. 1350"
---

# Hour Hand

From once an hour to twice a day

<!-- Click 0's text states the goal, and comes with the slide: nothing moves
or flashes at click 0. Each later text waits for the watch's change at its
click to end, with its flash (after-watch, style.css), as on the Gear Train
slide. Clicks 0 and 2's texts are about the one-step wheel, so they go with
it at click 3 (docs/watch.md, "The Hour Hand slide"). -->

<div v-click.hide="3" class="hh-sentence side-text">
  <div>12:1 gear ratio</div>
  <div v-click="2" class="after-watch">Hour hand off center!</div>
</div>

<!-- The stages stay at click 6, dimmed, above the hour hand's text: a
recap, as on the Gear Train slide. -->

<div class="hh-sentence side-text" :class="{ 'hh-recap': $clicks >= 6 }">
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
/* The house's text beside a picture (side-text), at the Gear Train slide's
   left: 70 px right of the picture's right edge (the frontmatter's artRight). The fades are in
   longhands, which keep after-watch's delay. */
.slidev-layout.hour-hand .hh-sentence {
  left: 560px;
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

The hour hand must turn twice a day.  That's once every twelve hours. Unlike the
60:1, a 12:1 gear is doable.

[nofigure]

[click] But the hour hand on that wheel's axle (_arbor_) is off center!  And it
would run backward (counterclockwise): a pair of meshing gears turn opposite
directions.

[figure 2: The movement, with a 12:1 gear beside the center wheel. The hour
hand is on that gear's axle, far from the center of the dial.]

[click:3] So we use the same two-step trick we used for the minute hand.  This
time, 3:1 going out and 4:1 coming back.  3:1 × 4:1 = 12:1.

[figure 5: The motion works, close up: the cannon pinion, the minute wheel
and its pinion, and the hour wheel. The rest of the watch is dimmed.]

[click] The hour hand goes on the hour wheel, in the middle, under the minute
hand, attached to a hollow tube (pipe) that slips _over_ the minute hand's axle.
It turns clockwise, twice a day.

[figure 6: The finished movement. The hour hand and the minute hand share the
center of the dial; the hour hand is the shorter one. The barrel is at the
bottom.]
-->

<!--
[click] 12:1 doable.

[click] Also runs backwards

[click:4] Runs clockwise.
-->

---
# A tour of the train with no text, from the motion works to the balance:
# the watch fills the slide. Each click is a stop. The camera moves, zooms,
# tilts and turns at the same time (artMove: together), and the mechanism
# runs at the stop's speed-up: the slower of the two parts that touch turns
# once in 30 s (watchLapse). The views put each touch at the middle of the
# slide (watch/recap.ts; docs/watch.md, "The Recap slide")
title: Recap
class: recap after-watch
art: [all, cannon pinion, minute wheel, minute pinion, minute arbor, hour wheel]
artView: recap motion works
artFlash: [hour wheel, minute wheel, minute pinion]
artFlashAfterMove: true
watchUnwind: true
watchWind: true
artTilt: 30
artMove: together
watchLapse: 1440
watchTimeScale: true
artClicks:
  # Wind before moving here, even after a long pause at the first stop.
  # The barrel turns once in 6 hours.
  1:
    artView: recap barrel
    artFlash: [barrel, mainspring, barrel arbor]
    watchLapse: 720
    watchWind: true
  # the barrel's teeth on the centre pinion, low, from about 3:40
  2:
    artView: recap barrel touch
    artFlash: [barrel, centre pinion]
    artTurn: 80
    artTilt: 80
  # back up over the movement: the centre wheel on the third pinion, with
  # the next touch behind it, as at each stop from here. From here the hour
  # hand moves too slowly to pass over a touch during a stop, so it goes
  # when the camera arrives; the minute hand, the centre wheel's own, stays
  # one stop more
  3:
    artView: recap centre touch
    artFlash: [centre wheel, third pinion]
    artTurn: -10
    artTilt: 45
    watchLapse: 120
    artHide: [hour hand]
    artGoLater: [hour hand]
  4:
    artView: recap third touch
    artFlash: [third wheel, fourth pinion]
    artTurn: 15
    watchLapse: 15
    artHide: [hour hand, minute hand]
    artGoLater: [minute hand]
  # the fourth wheel turns once in 30 s, the escape wheel once in 15 s
  5:
    artView: recap fourth touch
    artFlash: [fourth wheel, escape pinion]
    artTurn: 75
    watchLapse: 2
  # from here, the mechanism at its own speed
  6:
    artView: recap pallet
    artFlash: [escape wheel, pallet fork]
    artTurn: 90
    watchLapse: 1
  7:
    artView: recap jewel
    artFlash: [impulse jewel, pallet fork]
  # where the Hairspring slide shows it, on the left
  8:
    artView: hairspring
    artFlash:
      [
        balance wheel,
        balance staff,
        hairspring,
        collet,
        stud,
        roller,
        impulse jewel,
      ]
    artTurn: 0
    artTilt: 20
    watchTimeScale: false
clicks: 8
---

<script setup>
// One caption per stop, from the speaker notes, for those who read more
// easily than they listen (docs/watch.md, "The Recap slide"). Each is HTML:
// a part's name is in italics the first time it is on the screen.
const captions = [
  "Two gears run the hour hand.",
  "The mainspring drives the barrel.",
  "The barrel drives the <em>center wheel</em> and the minute hand.",
  "The center wheel drives the <em>third wheel</em>.",
  "The third wheel drives the <em>fourth wheel</em> and the second hand.",
  "The fourth wheel drives the <em>escape wheel</em>.",
  "The pallet stops the escape wheel, and each tooth lands with a tick.",
  "The <em>impulse jewel</em> hits the pallet and rocks it.",
  "The balance wheel and the hairspring set the rate.",
];
</script>

<!-- Each caption shows at its stop only: the next stop's picture no longer
agrees with it. It waits for the camera and the flash (after-watch; the
first, at click 0, waits by the slide's class). The first is apart, because
Slidev reads a range that starts at click 0 as one that starts at click 1. -->

<div v-click.hide="1" class="recap-caption after-watch" v-html="captions[0]" />
<div
  v-for="stop in captions.length - 1"
  :key="stop"
  v-click="[stop, stop + 1]"
  class="recap-caption after-watch"
  v-html="captions[stop]"
/>

<style>
/* At the bottom, between the left edge and the time scale in the lower
   right corner, in ink with the paper's outline, as the time scale. */
.slidev-layout.recap .recap-caption {
  position: absolute;
  left: 150px;
  right: 150px;
  bottom: 20px;
  text-align: center;
  font-size: 22px;
  line-height: 1.25;
  -webkit-text-stroke: 6px var(--palette-background);
  paint-order: stroke fill;
  transition-property: opacity;
  transition-duration: var(--text-fade);
}
</style>

<!-- narration

And that's how a mechanical watch works!

Here's a recap, retracing our steps in reverse, from the hour hand to the
hairspring. The tour plays by itself, like a short film. The time scale in the
corner says how much faster than real time each segment runs.

[figure 0-8 play: A tour of the watch's train, from the motion works to the
balance wheel, one touch at a time.]

The hour hand is driven by a pair of gears totaling 12:1.

[click] The wound mainspring drives the barrel.

[click] The barrel drives the _center wheel_ holding the minute hand.

[click] The center wheel drives the _third wheel_.

[click] The third wheel drives the _fourth wheel_, which holds the second hand.

[click] The fourth wheel drives the _escape wheel_.

[click] The escape wheel wants to turn, but the _pallet_ stops it.  Once a second, a tooth escapes, and the next one lands on the pallet, creating the ticking sound.

[click] The pallet moves when the _impulse jewel_ hits it.

[click] The balance wheel and the hairspring swing back and forth, setting the rate of the whole watch.
-->

<!--
That's how a mechanical watch works!

Two gears run the hour hand.

[click] Mainspring drives barrel.

[click] Barrel drives center wheel & minute hand.

[click] Center wheel drives third wheel.

[click] Third wheel drives fourth wheel & second hand.

[click] Fourth wheel drives escape wheel.

[click] Escape wheel wants to turn, pallet stops it.  Once/sec, a tooth escapes, next lands: tick.

[click] Impulse jewel hits pallet, rocks it.

[click] Set rate
-->

---
# the cover's picture, as on Mechanical Marvels. The step from the Recap
# slide's last click moves in order (the default artMove), the reverse of
# the step from Mechanical Marvels to the Hairspring slide: the motion works
# fade out, the hands that the Recap slide hid fade in, the camera tilts to
# 0, and then it zooms out
layout: section
side: left
eyebrow: PART 2
art: all
artView: cover
artMoveAlso: [hour hand, minute hand]
---

# Changed The World

<!--
And the whole watch.
-->

---
# Part 2's stories, on the globe and its story maps (docs/globe.md). The
# camera flies from South America to Cape Noir; a click names the story
# map's marks (globeLeg, globeMarks), and each step draws them after the
# camera has come. The labels are at the marks they name (MapLabel.vue);
# "Estimated position", which the next clicks measure from, stays, dimmed,
# until "Latitude: correct"
class: story-map
art: [globe]
artView: south america
artClicks:
  1: { artView: cape noir, artMove: fly, globeMarks: [estimated, scale] }
  2: { globeLeg: cliffs }
  3: { globeMarks: [estimated, scale, parallel] }
  4: { globeMarks: [estimated, scale, parallel, gap] }
clicks: 5
---

# Age of Sail: Longitude Was a Guess

1741: around Cape Horn, then heading north

<MapLabel v-click.hide="1" view="south america" :on="[-58, -12]" centred>South America</MapLabel>

<MapLabel v-click="[1, 3]" class="after-watch" view="cape noir" mark="estimated" :offset="[-105, -76]" :dimmed="$clicks >= 2">Estimated position</MapLabel>

<MapLabel v-click="[2, 3]" class="after-watch" view="cape noir" leg="cliffs" :offset="[-270, -104]"><div class="shout">Cliffs!</div>2 a.m., 2 miles ahead</MapLabel>

<MapLabel v-click="[3, 4]" class="after-watch" view="cape noir" mark="estimated" :offset="[60, -50]">Latitude: correct</MapLabel>

<BigWords v-click="5">Longitude:<br><em>400 miles</em> off</BigWords>

<!-- narration
[figure: The globe shows South America, with Cape Horn at its southern tip.]

In April 1741, George Anson's squadron rounded Cape Horn and turned north
into the Pacific.

[click]

Their estimated position put them well out to sea, west of the land.

[click]

At about 2 a.m., a lookout saw cliffs two miles ahead. The ships were
heading straight toward them.

[click]

Their _latitude_ told them how far north or south they were. They could
check it from the height of the Sun at noon.

[click]

But _longitude_ was their position east or west. Their estimate put the
land far beyond the horizon.

[click]

[figure: A map of Cape Noir shows a ship near the cliffs. A dashed ship marks
its estimated position to the west. A bracket measures the gap between them.]

Their longitude estimate was about 400 miles off. They had no reliable way
to measure it at sea.

-->

<!--
South America.

[click] Where they thought they were.

[click] Cliffs, two miles ahead, at 2 a.m.

[click] The latitude was right.

[click] The gap.

[click] Longitude: 400 miles off.
-->

---
# the ship at the bottom of the map as the slide opens; each click sails a
# leg, a day at sea to each dot (globe/stories.ts). The slide is told by
# its map, with a few words at each click, so its labels stay, dimmed, to
# its end (docs/slide-patterns.md, "Text dims"); the stakes and the
# question leave when the east leg answers them. The count of deaths ticks
# with the dots
class: story-map
art: [globe]
artView: juan fernandez
artMove: fly
globeLeg: south
globeMarks: [scale]
artClicks:
  1: { globeLeg: start, globeMarks: [scale, parallel] }
  2: { globeLeg: east, globeMarks: [scale, parallel, wind, count] }
  3: { globeLeg: west }
  4: { globeLeg: found, globeMarks: [scale, parallel, wind, count, islands] }
clicks: 5
---

# Hunt for Juan Fernández Island, 1741

<MapLabel v-click.hide="2" view="juan fernandez" leg="south" :offset="[44, -74]" :dimmed="$clicks >= 1">Scurvy kills<br>4–6 men a day</MapLabel>

<MapLabel v-click="[1, 2]" class="lingers after-watch" view="juan fernandez" :offset="[16, 152]" :dimmed="$clicks >= 2">Sail to latitude.<br>Then east or west?</MapLabel>

<MapLabel v-click="2" class="after-watch" view="juan fernandez" :offset="[420, 251]" :dimmed="$clicks >= 3">2 days east</MapLabel>

<MapLabel v-click="2" class="after-watch" view="juan fernandez" :offset="[696, 262]" :dimmed="$clicks >= 3">Chile:<br>an enemy coast</MapLabel>

<MapLabel v-click="3" class="after-watch" view="juan fernandez" :offset="[340, 360]" :dimmed="$clicks >= 4">9 days back</MapLabel>

<BigWords v-click="5">The detour cost<br><em>70–80 men</em></BigWords>

<!-- narration
Anson's men were dying of scurvy: four to six a day. They needed fresh
water and food from the island of Juan Fernández, off Chile.

[figure 0-4: A ship searches between Chile and Juan Fernández. Its route gains
a dot for each day at sea. A scurvy death count rises as the ship sails.]

[click]

On May 28, they reached the island's latitude. But had they sailed too far
east, or too far west?

[click]

They chose east. Two days later, they saw the coast of Chile. The island
was behind them, and the coast belonged to their enemy.

[click]

They turned west again. Headwinds and calms stretched the return journey
to nine days: the same distance that had taken two days eastward.

[click]

At dawn on June 9, they finally saw the island. They still needed another
day and night to reach its anchorage.

[click]

[figure: The final route runs east to Chile, west to Juan Fernández, then to
its anchorage. Day dots mark the track. The illustrative scurvy count reads 72.]

The detour had cost 70 to 80 men. They had been only a few hours from the
island when they turned the wrong way.

> [!aside] What the count means
> The figure uses six deaths a day to show the cost of time. Its final
> count is 72. These daily numbers are illustrative, not a recorded list
> of deaths. [Walter's account](https://www.gutenberg.org/cache/epub/47130/pg47130-images.html),
> Book I, chapter X, reports four to six deaths a day and a total of 70 to 80.

-->

<!--
Scurvy kills four to six men a day.

[click] Sail to the latitude. Then east or west?

[click] Two days east, to the enemy coast of Chile.

[click] Nine days back.

[click] Found.

[click] The detour cost 70–80 men.
-->

---
# the flight across the Atlantic, longer than the others: a flight's time
# is its length (webgl/flight.ts). The Channel's labels say where in the
# world; "Estimated position" stays, dimmed, until the bracket measures from
# it
class: story-map
art: [globe]
artView: channel
artMove: fly
artClicks:
  1: { artView: scilly, globeMarks: [estimated, scale] }
  2: { globeLeg: wreck }
  3: { globeMarks: [estimated, scale, gap] }
clicks: 4
---

# Admiral Shovell Sails Home, 1707

<MapLabel v-click.hide="1" view="channel" :on="[-4, 49.55]" centred>English Channel</MapLabel>

<MapLabel v-click.hide="1" view="channel" :on="[-1.6, 51.2]" centred>England</MapLabel>

<MapLabel v-click.hide="1" view="channel" :on="[0.4, 48.7]" centred>France</MapLabel>

<MapLabel v-click.hide="1" view="channel" :on="[-6.32, 49.93]" :offset="[-172, 80]" :points-to="[-6.32, 49.93]" :stop="17">Isles of Scilly</MapLabel>

<MapLabel v-click="[1, 2]" class="after-watch" view="scilly" mark="estimated" :offset="[-48, -76]">21 ships</MapLabel>

<MapLabel v-click="[1, 3]" class="after-watch" view="scilly" :dimmed="$clicks >= 2" mark="estimated" :offset="[-150, 52]">Estimated position</MapLabel>

<MapLabel v-click="[2, 3]" class="after-watch" view="scilly" :on="[-6.3972, 49.8656]" :offset="[60, 10]">In the dark: the rocks<br>of Scilly!</MapLabel>

<BigWords v-click="4">4 warships lost,<br>over <em>1,400 men</em></BigWords>

<!-- narration
[figure: The globe shows the English Channel between England and France.]

Thirty-four years earlier, Admiral Shovell's fleet was sailing home from
the Mediterranean. Twenty-one ships approached the English Channel in poor weather.

[click]

On October 22, 1707, the fleet's estimated position lay south and west of
the Isles of Scilly. The ships sailed on.

[click]

At about 8 p.m., in the dark, the flagship struck the rocks of Scilly.

[click]

The fleet was farther north and east than its navigators thought. The gap
between the ships' estimated and actual positions was now a line to the rocks.

[click]

[figure: A map of Scilly shows the ship at the rocks. A dashed ship marks
its estimated position to the southwest. A bracket joins the two positions.]

Four warships sank. More than 1,400 men died.

> [!aside] A disputed cause
> The [Royal Museums Greenwich account](https://www.rmg.co.uk/collections/objects/rmgc-object-140657)
> discusses errors in navigation, compasses, and weather. The cause remains
> disputed. This map shows the position error; it does not establish one
> cause for the wreck. The museum also finds no firm evidence that this
> disaster caused the Longitude Act.
> [Accounts of the disaster](https://en.wikipedia.org/wiki/Scilly_naval_disaster_of_1707)
> give death tolls from 1,400 to more than 2,000.

-->

<!--
The English Channel, and the Isles of Scilly.

[click] 21 ships, and where they thought they were.

[click] In the dark: the rocks of Scilly.

[click] The gap.

[click] 4 warships lost, over 1,400 men.
-->

---
# Words on two cards, with no picture: the audience knows what 35 miles is
# (docs/slide-patterns.md, "A slide of words")
layout: full
class: act-prizes
clicks: 2
---

# The Longitude Prize, 1714

<div class="act-cards">
  <BigWords v-click class="card">1°<br>70 miles<br>£10,000<br>~$2.3 M<small> today</small></BigWords>
  <BigWords v-click class="card">½°<br>35 miles<br><em>£20,000</em><br>~$4.6 M<small> today</small></BigWords>
</div>

<style>
.act-prizes {
  padding: 40px 34px 36px; /* "~$4.6 M today" needs the width, on one line */
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.act-prizes h1 {
  margin: 0; /* the flex gap spaces it */
}
.act-cards {
  margin: auto 0; /* centered in the room under the title */
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
</style>

<!-- narration
Seven years after Scilly, Parliament passed the Longitude Act. Disasters like
these fed the push for it. The Act offered a fortune to anyone who could find
a ship's longitude at sea.

[nofigure]

[click]

Within one degree, about 70 miles, the prize was £10,000: about 2.3 million
dollars today.

[click]

[figure: Two cards side by side. One degree, 70 miles, £10,000. Half a degree,
35 miles, £20,000.]

Within half a degree, about 35 miles, it was £20,000: about 4.6 million dollars
today. Half the error earned twice the money. At Cape Noir, Anson's squadron
had been 400 miles off.

> [!aside] Which degree?
> The Act measures the error in degrees of a great circle. One such degree is
> 60 nautical miles, about 69 miles, at any latitude. A degree of longitude is
> that long only at the equator. At Boston's latitude, it is about 51 miles.
> The Act also offered £15,000 for two-thirds of a degree.

-->

<!--
Seven years later, after disasters like these, Parliament puts up a prize, and anyone can enter.

[click] Within 1 degree, 70 miles: £10,000. About 2.3 million dollars today.

[click] Within half a degree, 35 miles: £20,000. Half the error, twice the money. Cape Noir missed by 400. And 35 miles is about from here to Worcester.

IF ASKED: The museum finds no hard evidence that Scilly itself caused the Act: say "disasters like these", not "this wreck". The Act's degree is one of a great circle, 69 miles at any latitude. A degree of longitude is that long only at the equator; at Boston's latitude it is about 51 miles. There was also £15,000 for two-thirds of a degree.
-->

---
# The camera stays with the Sun, so the Earth's turn is a move of the camera
# between views, one hour apart: each click turns it by one meridian (docs/globe.md,
# "The Longitude From Time slide")
class: noon-later
art: [globe, noon]
artView: noon in greenwich
artClicks:
  1: { artView: noon an hour later, artMove: together }
  2: { artView: noon at the ship, artMove: together }
clicks: 3
---

# Longitude From Time

Noon comes later

<NoonSky />

<div class="noon-sentence side-text">
  <div class="noon-paragraph text-dims">Noon in Greenwich<br>Ship: not noon yet</div>
  <div v-click="1" class="noon-paragraph text-dims after-watch">360°/24 hr = 15°/hr</div>
  <div v-click="2" class="noon-paragraph text-dims after-watch">2 p.m. in Greenwich<br>Noon at the ship</div>
  <div v-click="3" class="noon-paragraph text-dims">Hours × 15 = Longitude</div>
</div>

<style>
/* The house's text beside a picture (side-text). Each click adds a
   paragraph, and the ones before it dim (style.css, "TEXT DIMS"). */
.slidev-layout.noon-later .noon-sentence {
  left: 570px;
}
.slidev-layout.noon-later .noon-paragraph + .noon-paragraph {
  margin-top: 0.7em;
}
.slidev-layout.noon-later
  .noon-paragraph:has(~ .noon-paragraph:not(.slidev-vclick-hidden)) {
  --text-dim: var(--text-dimmed);
}
</style>

<!-- narration
[figure: A globe from above the Equator, with the Atlantic in the middle and a
meridian every 15 degrees. The Sun is under the globe, and a line runs from the
pole down the meridian through Greenwich. It is noon in Greenwich, and a clock beside
the globe says so. The ship is 30 degrees to the west.]

Why would a clock help? Because noon does not come to everyone at once. The
Earth turns toward the east, so the Sun's highest point sweeps west. When it is
noon in Greenwich, the part of London that gave Greenwich Mean Time its name, a
ship 30 degrees to the west has not reached noon yet.

[click]

[figure: The globe has turned by one meridian. The line now runs along the
meridian 15 degrees west of Greenwich. The clock says 1:00.]

In an hour, the Earth turns by 15 degrees, one line on this globe. Noon has moved
15 degrees west, and it has not reached the ship yet.

[click]

A navigator can measure noon at sea: it is when the Sun stands highest. After a
second hour, noon reaches the ship. Suppose that the ship carries a clock that
still keeps Greenwich's time. At the ship's noon, it reads 2:00. Two hours behind
Greenwich means 30 degrees west of it.

[click]

[figure: The line runs through the ship, and Greenwich is 30 degrees to the east of
it. The clock says 2:00.]

So the clock measures the ship's longitude. Take the hours behind Greenwich,
multiply by 15, and that is how many degrees west the ship is.

> [!aside] The Sun in the picture
> The real Sun is behind you as you look at this globe, and over the Equator. The
> picture puts it under the globe so that it fits, and leaves the night where
> the real Sun would put it. The real noon also runs up to about 16 minutes
> ahead of or behind a steady clock through the year. Navigators corrected for
> that with a table, the _equation of time_.

-->

<!--
So why would a clock help? Noon doesn't come to everyone at once. Noon in Greenwich, the G in GMT. The ship, 30 degrees west: not noon yet.

[click] The Earth turns. One hour, once around for the minute hand: one line, 15 degrees.

[click] Another hour, another line. Noon at the ship. A clock still on Greenwich time says 2:00. So: 30 degrees west.

[click] So the clock gives the longitude: hours behind Greenwich, times 15.

IF ASKED: The real Sun is behind the audience and over the Equator: the slide puts it under the globe to fit. Solar noon also runs up to about 16 minutes ahead of or behind a steady clock through the year: navigators corrected for it with a table, the equation of time.
-->

---
# The chain dims on the left, and the two numbers stay on the right
# (docs/slide-patterns.md, "A slide of words")
layout: full
class: seconds-a-day
clicks: 3
---

# How Good a Watch Wins the Prize?

<div class="seconds-story side-text">
  <div class="seconds-step text-dims">
    <div class="seconds-sum"><div class="seconds-fraction"><span>60 min</span><span>15°</span></div><span>=</span><span>4 min/°</span></div>
    <div>Clock ±4 min for 1°</div>
  </div>
  <div v-click="1" class="seconds-step text-dims">Clock ±2 min for ½°</div>
  <div v-click="2" class="seconds-step seconds-voyage text-dims">Over 6 weeks at sea</div>
</div>

<div class="seconds-numbers side-text">
  <div v-click="2">
    <div class="seconds-number seconds-prize">±3 sec a day</div>
    <div class="seconds-caption">to win £20,000 (±6 for £10,000)</div>
  </div>
  <div v-click="3" class="seconds-today">
    <div class="seconds-number">±9 sec a day</div>
    <div class="seconds-caption">a watch today, on dry land</div>
  </div>
</div>

<style>
/* The house's text (side-text), in two columns. Each click adds to the chain, and
   the steps before it dim. The numbers do not dim: ±3 is the punchline. */
.slidev-layout.seconds-a-day .seconds-story {
  left: 70px;
}
.slidev-layout.seconds-a-day .seconds-numbers {
  left: 440px;
  gap: 28px;
}
.slidev-layout.seconds-a-day
  .seconds-step:has(~ .seconds-step:not(.slidev-vclick-hidden)),
.slidev-layout.seconds-a-day:has(.seconds-today:not(.slidev-vclick-hidden))
  .seconds-voyage {
  --text-dim: var(--text-dimmed);
}
.slidev-layout.seconds-a-day .seconds-voyage {
  margin-top: 0.7em;
}
/* One over the other, as math is written, with the = on the line. */
.slidev-layout.seconds-a-day .seconds-sum {
  display: flex;
  align-items: center;
  gap: 0.3em;
}
.slidev-layout.seconds-a-day .seconds-fraction {
  display: grid;
  text-align: center;
}
.slidev-layout.seconds-a-day .seconds-fraction > :first-child {
  border-bottom: 3px solid currentColor;
}
/* A punchline's type (components/BigWords.vue), and the Balance Wheel slide's ±9. */
.slidev-layout.seconds-a-day .seconds-number {
  @apply font-serif;
  font-size: 76px;
  line-height: 1.05;
  color: var(--palette-second);
}
.slidev-layout.seconds-a-day .seconds-prize {
  color: var(--palette-accent);
}
.slidev-layout.seconds-a-day .seconds-caption {
  margin-top: 8px; /* clear of the y's descender */
  font-size: 28px;
  line-height: 1.2;
}
</style>

<!-- narration
How good must that clock be? Sixty minutes for 15 degrees is 4 minutes a degree. So
to find the longitude within 1 degree, the clock must be right within 4 minutes. To
find it within half a degree, the Act's top prize, the clock must be right within 2
minutes.

[nofigure]

[click:3]

[figure: Left, 60 minutes over 15 degrees is 4 minutes a degree; the clock within 4
minutes for 1 degree and within 2 for half a degree, over 6 weeks at sea. Right, in
big type, plus or minus 3 seconds a day to win £20,000, and plus or minus 9 for a
watch today.]

Now take a voyage of 6 weeks, or 42 days. To stay within 4 minutes, the clock can
gain or lose only about 6 seconds a day. To stay within 2 minutes, it can gain or
lose only about 3. An everyday mechanical watch today gains or loses about 9
seconds a day, on dry land. The prize asked for 3, on a rolling ship.

> [!aside] A steady error is not the problem
> A clock that gains exactly 6 seconds every day is as good as a perfect one, if
> the navigator knows it: subtract 6 seconds a day. What the prize really needs is
> a clock whose rate does not change.

-->

<!--
How good must that clock be? 60 minutes for 15 degrees: 4 minutes a degree. So 1 degree needs the clock right within 4 minutes.

[click] Half a degree, the top prize: 2 minutes.

[click] Now spread that over a voyage of 6 weeks, 42 days: plus or minus 3 seconds a day to win the £20,000. 6 for the £10,000.

[click] A watch today: 9. On dry land.

IF ASKED: 240 seconds over 42 days is 5.7 a day, and 120 is 2.9. A steady error can be corrected: what matters is a rate that does not change.
-->

---
# His words are the picture, in a script like the record's hand, but larger
# and thicker (docs/slide-patterns.md, "A quotation in handwriting")
class: newton-1714
clicks: 3
---

# Isaac Newton, 1714

of the laws of motion and gravity

<div class="newton-words side-text">
  <div class="newton-line text-dims">by reason of the motion of a Ship,</div>
  <div v-click="1" class="newton-line text-dims">the variation of heat &amp; cold, wet and dry,</div>
  <div v-click="2" class="newton-line text-dims">and the difference of Gravity in different Latitudes,</div>
  <div v-click="3" class="newton-line newton-verdict">such a Watch hath not yet been made.</div>
</div>

<style>
.slidev-layout.newton-1714 .newton-words {
  left: 0;
  right: 0;
  align-items: center;
  font-family: "Italianno", cursive;
  font-size: 65px;
  font-weight: 400;
  line-height: 1.3;
  /* The script's hairlines are under the stroke floor (docs/legibility.md): this
     thickens them, in the color of the text, so that they dim with it. */
  -webkit-text-stroke: 0.7px;
}
.slidev-layout.newton-1714
  .newton-line:has(~ .newton-line:not(.slidev-vclick-hidden)) {
  --text-dim: var(--text-dimmed);
}
.slidev-layout.newton-1714 .newton-verdict {
  color: var(--palette-accent);
}
</style>

<!-- narration
Could anyone build such a clock? In 1714, a committee on the question asked the
most famous scientist alive: Isaac Newton, of the laws of motion and gravity. A
watch that keeps time exactly, he said, was one way to find longitude. But, in the
words of the committee's record:

[nofigure]

[click]

[nofigure]

[click]

[nofigure]

[click]

[figure: Newton's words, in a flowing script: by reason of the motion of a Ship,
the variation of heat and cold, wet and dry, and the difference of Gravity in
different Latitudes, such a Watch hath not yet been made.]

A ship rolls and pitches. The weather swings from the tropics to the cold. Even
gravity is not the same everywhere, and a clock can feel it. Newton's verdict was
not that it was impossible, only that no one had done it.

> [!aside] Whose handwriting?
> The Royal Museums Greenwich holds the record of his words, in a copy from about
> 1741. The script on the slide is a modern font in the spirit of that copy's hand.
> It is not Newton's own hand. He also named two other ways to find longitude: the
> eclipses of Jupiter's moons, and the place of the Moon. Neither, he said, could
> be used at sea yet.

-->

<!--
Could anyone build it? They asked Isaac Newton. That Newton: laws of motion, gravity. A watch could do it, he said, but: by reason of the motion of a ship.

[click] Heat and cold, wet and dry.

[click] Gravity differs from place to place.

[click] Such a watch hath not yet been made. Not yet.

IF ASKED: These words are from the committee's record of June 1714, in a copy from about 1741: not his own hand, and the script is a modern font. His other two ways: the eclipses of Jupiter's moons, and the place of the Moon. Neither could be used at sea yet.
-->

---
# A picture on the left, and on the right the words and his first clock
# (../docs/slide-layout.md)
layout: full
class: john-harrison
clicks: 1
---

# John Harrison: A Carpenter's Side Project

<img class="harrison-portrait" src="/harrison/portrait.jpg" alt="John Harrison, seated, in a red coat and a white wig, in a painting of about 1767.">

<div class="harrison-words side-text">
  <div>Carpenter by trade<br>Self-taught in clocks</div>
  <div v-click="1" class="harrison-first">
    <img src="/harrison/h1.jpg" alt="H1: a large brass machine with four dials, on a brass base.">
    <div class="harrison-caption">H1, 1735: 5 years’ work</div>
  </div>
</div>

<style>
.slidev-layout.john-harrison .harrison-portrait {
  position: absolute;
  top: 92px;
  left: 44px;
  height: 430px;
  border-radius: 4px;
}
.slidev-layout.john-harrison .harrison-words {
  left: 450px;
}
.slidev-layout.john-harrison .harrison-first {
  margin-top: 0.5em;
}
.slidev-layout.john-harrison .harrison-first img {
  width: 372px;
  border-radius: 4px;
}
.slidev-layout.john-harrison .harrison-caption {
  margin-top: 6px;
  font-size: 28px;
  line-height: 1.2;
}
</style>

<!-- narration
Newton said that such a watch had not yet been made. That same year, John Harrison
turned 21, in the north of England. He was a carpenter by trade, and he taught himself
to make clocks.

[nofigure]

[click]

[figure: On the left, a painting of John Harrison. On the right, H1, a large brass
machine with four dials.]

His aim was a clock for the sea that kept time within 3 seconds a day. In 1730, at
about 37, he began one at home in Lincolnshire, probably with help from his
brother James. It took 5 years. H1 has two linked balances that
a ship's motion does not upset, and runs with no oil at all. To see it move, watch this
[30-second clip of H1 at Greenwich](https://www.youtube.com/watch?v=_mRTMZ3pTtM).

> [!aside] What is in the painting?
> Behind him is H3, in its traveling case. The watch in his hand is not H4: it is a
> watch of 1753, made to his design by John Jefferys. That watch showed him that a
> small timekeeper could work.

-->

<!--
Not yet, said Newton. That same year, Harrison turned 21. A carpenter, self-taught in clocks. This meetup is for side projects: here is the side project that changed the world.

[click] H1. Five years' work, starting at about 37, at home. Aim: 3 seconds a day.

IF ASKED: The portrait shows H3 behind him and a 1753 watch by John Jefferys in his hand, not H4. It began as a side project, but from 1737 the Board of Longitude paid him for the work. A 30-second clip of H1 moving is linked in the article.
-->

---
# One bar to a clock, all on one scale of years (components/ClockBar.vue)
layout: full
class: four-clocks
clicks: 3
---

# Same Time, Every Tick

On a rolling ship, hot or cold

<div class="clock-rows">
  <ClockBar picture="harrison/h1.jpg" alt="H1, a large brass machine." :from="1730" :to="1735">
    H1: Sea trial. Beat ship’s navigator by 60 miles.
  </ClockBar>
  <ClockBar v-click="1" picture="harrison/h2.jpg" alt="H2, a tall brass frame." :from="1737" :to="1739">
    H2: Realizes design flaw. Never sailed.
  </ClockBar>
  <ClockBar v-click="2" picture="harrison/h3.jpg" alt="H3, a brass machine with a large arc." :from="1740" :to="1759">
    H3: Invents bimetallic strip &amp; caged<br>roller bearing, still used today. Never sailed.
  </ClockBar>
  <ClockBar v-click="3" picture="harrison/h4.jpg" alt="H4's movement, round and engraved, like a large pocket watch." :from="1755" :to="1759">
    H4: Sea trial.
  </ClockBar>
  <div class="clock-axis">
    <span style="--year: 1730">1730</span>
    <span style="--year: 1740">1740</span>
    <span style="--year: 1750">1750</span>
    <span style="--year: 1760">1760</span>
  </div>
</div>

<style>
.slidev-layout.four-clocks .clock-rows {
  --first-year: 1730;
  --last-year: 1760;
  --px-a-year: 26px;
  --clock-photo-size: 76px;
  --clock-photo-gap: 16px;
  position: absolute;
  top: 124px;
  right: 0;
  left: 40px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.slidev-layout.four-clocks .clock-axis {
  position: relative;
  width: calc((var(--last-year) - var(--first-year)) * var(--px-a-year));
  height: 48px;
  margin-left: calc(var(--clock-photo-size) + var(--clock-photo-gap));
  border-top: 2px solid var(--palette-ink);
  font-size: 22px;
  font-weight: 600;
}
.slidev-layout.four-clocks .clock-axis > span {
  position: absolute;
  top: 14px;
  left: calc((var(--year) - var(--first-year)) * var(--px-a-year));
  transform: translateX(-50%);
}
</style>

<!-- narration
Four clocks, one problem. Each tick is one swing of the balance, and every swing must take
the same time, on a rolling ship, hot or cold. H1 sailed to Lisbon and back in 1736. It
did poorly on the way out. On the way home, the ship's master put the ship 60 miles east of
where it was, and H1 was right. That won him money for a better clock.

[nofigure]

[click]

[nofigure]

H2 took 2 years. He found a fault in its balances: a ship's turn changes the time of their
swing. So he abandoned it for H3. It never sailed.

[click]

[nofigure]

H3 took 19 years, and it never sailed. The swings of its two large, heavy balances still
varied.

But look at what he made on the way. To cancel the effect of heat, he joined brass and
steel in a _bimetallic strip_, which still works in thermostats. To cut friction, he kept
rollers apart in a _caged roller bearing_, which is now nearly everywhere in machinery.

[click]

[nofigure]

Then he gave up on big clocks. H4 took 4 years and weighs about 3 pounds: from the
outside, a large pocket watch. Its balance is small and fast, with five ticks a second. In
1761, it went on a sea trial.

[figure: A timeline from 1730 to 1760, with a photo and a bar for each clock. H1's bar
is 5 years long and H2's is 2. H3's is 19, the longest. H4's is 4, and ends the same year as H3's.]

-->

<!--
Same time, every tick. Each tick is one swing of the balance, and every swing must take the same time: on a rolling ship, hot or cold. Four clocks. H1: 5 years. On the way home from Lisbon, it beat the ship’s navigator by 60 miles.

[click] H2: 2 years in, he finds a design flaw: the ship's turning changes the swing. It never sails.

[click] H3: 19 years. Big, heavy balances, and the swings still vary. It never sails either. But it left two things we still use: the bimetallic strip, his fix for heat, now in thermostats, and the caged roller bearing, in nearly all machinery. The side effects of a failed project.

[click] H4: 4 years. It looks like a pocket watch, with a small, fast balance. And it goes to sea.

IF ASKED: H1 did poorly on the way to Lisbon, and I have no solid number for its seconds a day.
-->

---
# The two numbers in a punchline's type, and then how it ended
# (docs/slide-patterns.md, "A slide of words")
layout: full
class: h4-prize
clicks: 2
---

# Did H4 Win the Prize?

<div class="prize-words side-text">
  <div>
    <div class="prize-number">2 min over 42 days</div>
    <div class="prize-caption">required</div>
  </div>
  <div v-click="1">
    <div class="prize-number prize-result">5 sec over 81 days</div>
    <div class="prize-caption">H4 at sea</div>
  </div>
  <div v-click="2">King George III:<br>“By God, Harrison, I will see you righted!”<br>Last payment: 43 years after start. Age 80.</div>
</div>

<style>
.slidev-layout.h4-prize .prize-words {
  left: 70px;
  gap: 24px;
}
/* A punchline's type, as on the How Good a Watch slide. */
.slidev-layout.h4-prize .prize-number {
  @apply font-serif;
  font-size: 76px;
  line-height: 1.05;
}
.slidev-layout.h4-prize .prize-result {
  color: var(--palette-accent);
}
.slidev-layout.h4-prize .prize-caption {
  margin-top: 8px; /* clear of the y's descender */
  font-size: 28px;
  line-height: 1.2;
}
</style>

<!-- narration
Did it win? To win the top prize, the Act asked for a clock that was right within 2
minutes after 6 weeks at sea.

[nofigure]

[click]

[nofigure]

H4 sailed for Jamaica in November 1761. After 81 days, it was 5 seconds slow.

[click]

[figure: In big type, 2 minutes over 42 days, required, and 5 seconds over 81 days, H4 at
sea. Under them: King George III says, "By God, Harrison, I will see you righted!", and the last
payment comes 43 years after the start, when Harrison is 80.]

The Board was not convinced, and sent it on a second trial, to Barbados, where it kept time
within 39 seconds. In 1765, the Board agreed that it had kept time within the strictest
limit of the Act. But the money came slowly: 16 payments over 36 years, £23,065 in all, most
of it at the end. The last two payments are more than 70% of the total. The last, £8,750,
came in 1773, 43 years after he started. He had appealed to King George III. "By God, Harrison,
I will see you righted!" the King told his son William, and Parliament acted. He was 80. He died three years later. The Act's official prize was never given to anyone.

-->

<!--
Did it win? The prize asked for this: 2 minutes, over 6 weeks.

[click] H4, to Jamaica, 1761. 81 days. 5 seconds slow.

[click] The Board still won't pay in full. He has to go to King George III. By God, Harrison, I will see you righted! And the King leans on Parliament. The last payment comes 43 years after he started. He's 80. He dies three years later.

IF ASKED: The King's words are in Sobel, Longitude, p. 147. He said them to Harrison's son William, in about 1772, and they seem to go back to an account by William's son in 1835. Before sailing, H4 lost 24 seconds in 9 days, so the 5 seconds probably allows for that known rate. On the second trial, to Barbados, it kept within 39 seconds. The payments: 16 over 36 years, £23,065 in all, over 70% of it in the last two (Andrewes, The Quest for Longitude, p. 234). The last was £8,750 from Parliament in 1773. The Act's official prize was never given to anyone.
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

---
layout: full
class: questions
# The titles show only with no private file of song lines, as on the publish run
# (components/SongLines.vue; docs/slide-patterns.md, "Words that run on their own").
songTitles:
  - Rock Around the Clock
  - My Grandfather’s Clock
  - The Windmills of Your Mind
  - Time
  - Clocks
  - Does Anybody Really Know What Time It Is?
  - Lose Yourself
secondsATitle: 4
---

# Questions?

<div class="questions-credits">
  <h2>Credits</h2>
  <p>John Harrison, Thomas King, c. 1767. Public domain.</p>
  <p>H1, H2 and H4, Mike Prince. CC BY 2.0.</p>
  <p>H3, Tony Hisgett. CC BY 2.0.</p>
  <p>CC BY 2.0: creativecommons.org/licenses/by/2.0</p>
</div>

<SongLines class="questions-songs" :titles="$frontmatter.songTitles" :seconds-a-title="$frontmatter.secondsATitle" />

<style>
.slidev-layout.questions .questions-credits {
  position: absolute;
  bottom: 136px;
  left: 60px;
  font-size: 14px;
}
.slidev-layout.questions .questions-credits h2 {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.3;
}
.slidev-layout.questions .questions-credits p {
  margin: 0;
  line-height: 1.3;
}
.slidev-layout.questions .questions-songs {
  position: absolute;
  right: 0;
  bottom: 28px;
  left: 0;
}
</style>

<!-- narration
Thank you for reading. Here are some great songs about time:

- "Rock Around the Clock," by Max C. Freedman and James E. Myers
- "My Grandfather's Clock," by Henry Clay Work
- "The Windmills of Your Mind," by Michel Legrand, Alan Bergman and Marilyn Bergman
- "Time," by Pink Floyd
- "Clocks," by Coldplay
- "Does Anybody Really Know What Time It Is?" by Chicago
- "Lose Yourself," by Eminem

The painting of John Harrison is by Thomas King, about 1767, and is in the
[public domain](https://commons.wikimedia.org/wiki/File:John_Harrison_(Gem%C3%A4lde).jpg).
The photos of
[H1](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(32416544837).jpg),
[H2](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(46635402754).jpg)
and
[H4](https://commons.wikimedia.org/wiki/File:Clock_at_Royal_Observatory_Greenwich_(32416554787).jpg)
are by Mike Prince, and the photo of
[H3](https://commons.wikimedia.org/wiki/File:Harrison_H3_Clock_(35491292866).jpg) is by
Tony Hisgett, all under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/).

[nofigure]

-->

<!--
Thank you. Questions? The song lines run by themselves, so this slide can stay up for the rest of the evening.

IF ASKED: The lines are an Easter egg, so the slide does not name them: Rock Around the Clock (Freedman and Myers), My Grandfather's Clock (Henry Clay Work), The Windmills of Your Mind (Legrand and the Bergmans), Time (Pink Floyd), Clocks (Coldplay), Does Anybody Really Know What Time It Is? (Chicago), and Lose Yourself (Eminem).
-->
