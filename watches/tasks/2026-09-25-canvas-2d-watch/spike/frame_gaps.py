"""Frame gaps: the JS that records them, and the one summary every script
prints. The laptop's screen runs at 120 Hz, so a normal gap is 8.3 ms. A gap
over 12.5 ms misses at least one 120 Hz frame; a gap over 25 ms misses at
least one frame even at 60 Hz (a projector)."""

import statistics
from dataclasses import dataclass

MISSED_120HZ_MS = 12.5
SLOW_MS = 25.0

# 240 frames of an idle page: is the window throttled?
IDLE = """async () => {
  const gaps = [];
  let last = performance.now();
  await new Promise(done => {
    function frame(now) {
      gaps.push(now - last);
      last = now;
      if (gaps.length < 240) requestAnimationFrame(frame); else done();
    }
    requestAnimationFrame(frame);
  });
  return gaps;
}"""


@dataclass(frozen=True)
class GapSummary:
    frames: int
    median_ms: float
    over_12ms: int  # gaps over MISSED_120HZ_MS (the key the first rounds used)
    over_25ms: int  # gaps over SLOW_MS
    largest_ms: float

    @classmethod
    def of(cls, gaps: list[float]) -> GapSummary:
        return cls(
            len(gaps),
            round(statistics.median(gaps), 2),
            sum(gap > MISSED_120HZ_MS for gap in gaps),
            sum(gap > SLOW_MS for gap in gaps),
            round(max(gaps), 1),
        )

    def __str__(self) -> str:
        return (
            f"frames {self.frames:4}  median {self.median_ms:5}"
            f"  >{MISSED_120HZ_MS}ms {self.over_12ms:3}"
            f"  >{SLOW_MS:g}ms {self.over_25ms:3}  max {self.largest_ms:6.1f}"
        )
