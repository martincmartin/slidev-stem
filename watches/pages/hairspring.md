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
---

# Hairspring

<!--
  Should I mention *why* the hairspring?  It's more accurate than previous methods, plus easier to transport and use at sea than a pendulum.
-->

<!--
The _hairspring_ beats every 2 seconds, controlling the speed of the rest of the watch.

When bent, a diving board pushes back with _elastic restoring force_.

It overshoots, then overshoots again, _oscillating_ back and forth.

The diving board's rest shape is a straight line. The hairspring's is a curve.

If you wind it tighter, it unwinds back to its rest shape, then overshoots, then winds up back to its rest shape, oscillating back and forth. Just like the diving board.

The hairspring and the balance wheel: the part of a watch that keeps time.

[click] The hairspring fades. A diving board takes its place: it bends down, and when it lets go it bounces up and down, once a second. The dashed outline is its rest shape, and the words on the right say it: bend it away from straight, it pushes back. The restoring force brings it back toward that shape, but it overshoots. With no friction it would bounce at the same height for ever. This is why a hairspring swings: it is a springboard.

[click] The pool and the stand fade. The rest outline becomes a single dashed line. The board and that line curl into the hairspring, at rest in its middle position. As soon as it is curled, the board fades out and the real hairspring fades in, at rest, with the same shape. Then the words are edited: "Bend" becomes "Wind", and "straight" becomes "rest". Wind it away from rest, it pushes back.

[click] The hairspring starts to swing again, as the board did. Its dashed rest shape stays still.
-->
