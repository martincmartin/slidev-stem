# Part 2's visual language: more words, still pictures

**Status: planning, 2026-10-30.** Nothing outside this directory changed. The
request is in [instructions.md](instructions.md). A mockup draws one story,
Anson's search for Juan Fernández, in four styles, with the same map and the
same facts ([mockup/](mockup/)). Round 1 compared the styles; its pictures
and measurements are in [evidence/round-1/](evidence/round-1/). Round 2
works on the labels, from your feedback (section 12); its pictures are in
[evidence/round-2/](evidence/round-2/). Section 11 gives the commands.

**The question.** Part 2 has more text than Part 1. Which visual language
carries it: a reading rail on the right (A), cards over the animation after
it stops (B), Lessig style (C), or another? The slides must show, not tell.
As far as practical, they must stand on their own, for a viewer whose mind
wanders or who cannot hear the speaker. The example is the Longitude Problem,
and the Anson slide must show why the westerlies made the trip back slow.

## Summary

- **Recommendation: D, labels on the picture.** The map tells the story, and
  short labels at the places name the dates and the turns. The takeaway goes
  on the paper beside the picture. Ranking: D, then A (rail), B (cards) and
  C (Lessig). Section 6 gives the reasons.
- **The data, from the Anson mockup** (section 4). The same 13 facts, in
  each style:

  | Measure                                | A rail | B cards | C Lessig       | D labels |
  | -------------------------------------- | -----: | ------: | -------------- | -------: |
  | clicks                                 |      4 |       4 | 10             |        4 |
  | words of story text                    |     70 |      60 | 20 (2–5 each)  |       41 |
  | eye travel, text to its place (median) | 460 px |   98 px | (other screen) |    42 px |
  | sea that text covers, last click       |    2 % |    24 % | 98 % (words)   |     14 % |
  | facts on the last screen, of 13        |     13 |      12 | 1              |       12 |

- **The westerlies, shown** (the mockup's pictures): gusts, lines that end
  in a curl, draw themselves from west to east over the sea, and a dot marks
  each day at sea. Going east, the 2 days are 2 long steps. Coming back, the
  9 days are 9 short steps, and the animation takes 4.5 times as long. Labels
  name the cause: "2 days east, wind behind" and "9 days back: headwinds and
  calms". Round 1 drew arrows; round 2 changed them (section 12).
- **What is new against the background report**
  ([`docs/text-display-deep-research-report.md`](../../../docs/text-display-deep-research-report.md)).
  The report ranks the reading rail first for text in general, and
  "situational / image-attached type" ninth. It also gives the rule that
  decides this case: "when the words refer to something visible, first try
  attaching them to that thing". Nearly every fact of the Longitude Problem
  has a place on a map or on a picture. Measured here, the rail needs 1.7
  times the words and 11 times the eye travel of the labels, for the same
  facts.
- **What the labels need beside them**: a quote is a document, with a
  drawing for each part (Newton), and a number is a picture (the prize's
  reach, drawn from the venue). A full-screen phrase can come at most once a
  part. Two still frames show these (section 7).
- **The outline has facts to fix** (section 9). Newton spoke in 1714, not
  1741, and his name is "Isaac". Anson's chaplain gives "between seventy and
  eighty" men lost to the detour, not hundreds. The delay was "calms and
  contrary winds". For Scilly, the Royal Museums Greenwich gives "over 1,300"
  dead. The outline's "disasters like this" fed the push for the Act; it
  does not say that this wreck did, which is the claim that the museum
  finds "no hard evidence" for.
- **Decisions for you** are in section 10: the wind's placement, and the
  colors of the new marks. You chose a filled sea, and the islands revealed
  when Anson finds them.

## 1. What the slides must do

From the request:

1. **Show, don't tell.** The picture carries the story.
2. **Be clear**, by text, picture or both.
3. **Stand on their own**, for a viewer whose mind wanders or who cannot
   hear.
4. **Carry more text than Part 1.**
5. **Show the westerlies**: why 2 days one way and 9 days the other.

From the house:

6. **Text fades in and out, dims, and stays while there is room**
   ([`AGENTS.md`](../../../AGENTS.md), "Writing a talk";
   [`docs/slide-patterns.md`](../../docs/slide-patterns.md), "Text fades" and
   "Text dims").
7. **The back row**: type at 17 px or more, marks at 3:1 or more
   ([`docs/legibility.md`](../../../docs/legibility.md)).
8. **Part 1's grammar**: the picture on the left and its sentences on the
   right, older ones dimmed (the Balance Wheel slide); callouts with 4 px
   leaders (the Escapement slide); one caption at the bottom (the Recap
   slide).
9. **The article**: a figure shows the picture and its labels, not the
   slide's text ([`docs/article.md`](../../docs/article.md), "What a figure
   shows").

## 2. The options

The mockup draws A to D. E and F are compared without a mockup.

- **A. A reading rail.** A column of sentences on the right, one paragraph a
  click. Older paragraphs dim. Part 1's right-hand sentences, with more
  words: 22 px, not 35 px.
- **B. Cards after the motion.** A panel with one or two sentences, placed
  over the picture near its place, after the motion stops. Older cards dim.
- **C. Lessig.** Many screens: a few words in very large type, or the
  picture alone, in time with the speaker's words. Each screen replaces the
  last.
- **D. Labels on the picture.** Short phrases at the places that they name,
  in ink with the paper's outline. A date leads each event. Older labels dim.
  The takeaway sits on the blank paper beside the picture. This is the
  report's "canvas labels", and Part 1's callouts without leaders.
- **E. A caption at the bottom**, as on the Recap slide.
- **F. A sentence title** (assertion–evidence). It can go with A, B or D, so
  it is not a style of its own.

The last click of each mocked style in round 1, with the sea filled
([evidence/round-1/sea-wash/last-steps.png](evidence/round-1/sea-wash/last-steps.png))
and with it unfilled
([evidence/round-1/sea-paper/last-steps.png](evidence/round-1/sea-paper/last-steps.png)).
Every click of every style:
[evidence/round-1/sea-wash/sheet.png](evidence/round-1/sea-wash/sheet.png).
Each frame is in `evidence/round-1/sea-*/frames/`.

## 3. The mockup, and how it measures

- **One story, four styles.** `mockup/story.ts` holds each style as data:
  its title, and the text of each click. `mockup/main.ts` draws any of them.
  The picture is the same in each: the map, the latitude line, the two legs,
  the day dots, the wind, a 100-mile scale, and the ship.
- **The map** is Natural Earth's 1:10m land (`tools/maps.ts`), at 75 slide
  px for a degree of latitude. The sea is the water's wash, the land is the
  paper, and the coast is the subject, as in the globe spike
  ([`../2026-10-28-globe-planning/PLAN.md`](../2026-10-28-globe-planning/PLAN.md),
  section 15). `?sea=paper` leaves the sea unfilled.
- **The house's type and rules.** Title in Fraunces 600, 37 px. Body in IBM
  Plex Sans: the rail and the cards at 22 px, labels at 24 px semibold (a
  name at 20 px), Lessig's screens at 76 px. Dims mix halfway to the paper;
  fades take 0.4 s. Text that reads the picture's change waits for it, as
  the deck's `after-watch` does.
- **Time.** A day at sea is 0.7 s of animation, so the east leg takes 1.4 s
  and the west leg 6.3 s.
- **The measurements** (`tools/shots.ts`, in Chromium). For each style and
  click, settled: the words of the story's text, the box of each text, the
  distance from each new text to the place that it names ("eye travel"),
  and the share of the sea that the text covers. A pixel is covered if it
  changes by more than 24 of 255 when the text shows.
- **Limits.** One story; Chromium only; no audience test. Eye travel stands
  in for split attention; it is not a measure of understanding. The cover
  measure counts a pale panel on an unfilled sea as almost nothing, so its
  numbers here are for the filled sea. The labels' word count includes the
  subtitle, which carries a fact; the title is the same in A, B and D, and is
  not counted.

## 4. Results

From [evidence/round-1/sea-wash/measurements.json](evidence/round-1/sea-wash/measurements.json).
Reading time is at 238 words a minute, the mean for silent reading in the
meta-analysis that the report cites; reading on a screen across a room is
probably slower.

| Measure                            | A rail         | B cards          | C Lessig                     | D labels        |
| ---------------------------------- | -------------- | ---------------- | ---------------------------- | --------------- |
| clicks for the story               | 4              | 4                | 10                           | 4               |
| words of story text, last click    | 70             | 60               | 2 (20 over all screens)      | 41              |
| new words at each click            | 23, 19, 13, 15 | 17, 15, 13, 15   | 3, 4, 0, 3, 0, 5, 0, 3, 0, 2 | 16, 13, 5, 7    |
| time to read a click's new words   | 3.3–5.8 s      | 3.3–4.3 s        | 0.5–1.3 s                    | 1.3–4.0 s       |
| time to read the whole last screen | 17.6 s         | 15.1 s           | 0.5 s                        | 10.3 s          |
| eye travel, median (max)           | 460 (488) px   | 98 (479) px      | none: other screen           | 42 (87) px      |
| sea that text covers, by click     | 2 % each       | 15, 14, 24, 24 % | 98–100 % or 0 %              | 8, 11, 13, 14 % |
| smallest type                      | 22 px          | 22 px            | 76 px                        | 20 px           |

The new words of D's first click include the subtitle's 7. A's 2 % is its
title over the sea: its text is on the land.

**Which facts each style gives.** ✓ in words; ◐ shown by the picture only;
· not given (at most implied).

| Fact                                     | A      | B      | C     | D      |
| ---------------------------------------- | ------ | ------ | ----- | ------ |
| 1. May 28, 1741                          | ✓      | ✓      | ✓     | ✓      |
| 2. Scurvy kills 4–6 men a day            | ✓      | ✓      | ✓     | ✓      |
| 3. He is at the island's latitude        | ✓      | ✓      | ◐     | ✓      |
| 4. He cannot measure longitude           | ✓      | ·      | ·     | ·      |
| 5. East or west?                         | ✓      | ✓      | ✓     | ✓      |
| 6. East: 2 days                          | ✓      | ✓      | ✓     | ✓      |
| 7. With the wind behind him              | ✓      | ✓      | ◐     | ✓      |
| 8. About 340 miles                       | ✓      | ✓      | ◐     | ◐      |
| 9. May 30: Chile, an enemy coast         | ✓      | ✓      | ✓     | ✓      |
| 10. 9 days back: headwinds and calms     | ✓      | ✓      | ✓     | ✓      |
| 11. June 9: the island                   | ✓      | ✓      | ◐     | ✓      |
| 12. It was hours west of where he turned | ✓      | ✓      | ◐     | ◐      |
| 13. The detour cost 70–80 men            | ✓      | ✓      | ✓     | ✓      |
| **in words / in the picture only**       | 13 / 0 | 12 / 0 | 7 / 5 | 10 / 2 |
| **on the last screen**                   | 13     | 12     | 1     | 12     |

Fact 4 is the point of the whole section, so its title or the slide before
can say it once for every slide.

## 5. Pros and cons

### A. Reading rail

- **Pro: it holds the most.** 70 words at 22 px in a 332 px column end at
  475 px of 552: room for about 80.
- **Pro: the best catch-up.** All 13 facts, in sentences, in reading order.
  A viewer who looked away reads down the column in about 18 s.
- **Pro: it covers none of the picture.** Here the rail is on the blank land.
- **Pro: Part 1's grammar,** and the cheapest to build: one column, and no
  place to choose for each sentence. In the article, the narration replaces
  it: a figure hides the slide's text.
- **Con: the longest eye travel**, 460 px at the median: across half the
  slide, 11 times the labels'. The viewer must find "May 30: Chile" on the map
  by themselves.
- **Con: it tells.** It needs 1.7 times the labels' words for the same facts,
  and the picture only illustrates them.
- **Con: reading competes with listening.** 13–23 new words at each click
  take 3–6 s to read, while the speaker says other words. The redundancy
  principle: words on the screen that repeat the narration harm learning,
  unless they are short, name the key action, and sit next to the part of
  the picture that they describe (Mayer and Johnson, 2008).
- **Con: it takes 35–40 % of the slide's width from the picture.** On this
  map the land is blank, but not every picture has a blank side.
- **Con: it invites prose.** With room for 80 words, slides fill up.

### B. Cards after the motion

- **Pro: the motion plays clear,** and then the card says what it meant.
- **Pro: a panel is legible on any picture.**
- **Pro: near its place** when there is room near it: 98 px at the median.
- **Con: it covers the picture**: 24 % of the sea at the last click. A card
  must move or leave when the next motion needs its room, and then a viewer
  who looks up late has lost it.
- **Con: boxes over a line drawing.** Part 1 puts no panels over pictures:
  its text over a picture has the paper's outline. A dimmed card keeps its
  bright panel.
- **Con: still 60 words**, with the rail's cost of reading against
  listening.
- **Con: each card is placed by hand,** like a label, but a larger box is
  harder to place.

### C. Lessig

- **Pro: the largest type**, 76 px: legible from any seat, in a bright room.
- **Pro: pace and humor.** The audience watches the speaker.
- **Pro: the picture is whole** when it shows.
- **Con: it does not stand on its own.** The last screen gives 1 fact of 13. "9 days back" means nothing without the screens before it. A viewer who
  looks away for 10 s misses about 3 screens, and none of them stays.
- **Con: 10 clicks, not 4,** each on cue with the speaker's words.
- **Con: the house's fades slow it.** Each change takes 0.8 s (0.4 s out,
  then 0.4 s in): about a quarter of a 3-second screen.
- **Con: it breaks the house rule** to keep old text while there is room, by
  design.
- **Con: the article.** A slide with no watch is its own figure, so each word
  screen becomes a figure of a few words, and each needs a `[nofigure]`
  marker.
- **Con: words and picture at different times.** The contiguity principle
  favors words with their picture, at the same time and place (Ginns, 2006,
  a meta-analysis of 50 studies).

### D. Labels on the picture

- **Pro: the picture tells the story.** 41 words give 10 facts, and the map
  shows 2 more: the distance against the 100-mile scale, and how near the
  island was.
- **Pro: the shortest eye travel**: 42 px at the median, 87 px at most.
- **Pro: research supports short text beside its picture.** Spatial
  contiguity (Ginns, 2006), and the revised redundancy principle (Mayer and
  Johnson, 2008), which allows short key phrases next to the part that they
  describe.
- **Pro: a glance, not a read.** 5–16 new words a click, 1–4 s, so reading
  does not compete with listening.
- **Pro: labels stay and dim.** A late viewer reads them in date order.
- **Pro: Part 1's grammar,** the Escapement slide's callouts. The article
  shows labels in its figures (`in-figure`).
- **Con: it covers more of the picture than the rail**: 14 % of the sea at
  the last click. The cards cover 24 %.
- **Con: over a filled sea, a label needs the paper's outline.** A dimmed
  label then reads as pale text in a light ring, still legible
  ([labels-3.png](evidence/round-1/sea-wash/frames/labels-3.png)). Over an
  unfilled sea it reads as text on paper
  ([sea-paper/frames/labels-3.png](evidence/round-1/sea-paper/frames/labels-3.png)),
  but the land and the sea are hard to tell apart, so the sea stays filled.
- **Con: phrases, not reasons.** "He cannot measure longitude" is implied.
  The section's title, or the slide before, must say it.
- **Con: the most layout work.** Each label is placed by hand at each click.
  On a camera that moves (the globe), a label must follow its place, as
  `WatchCallout.vue` follows a part of the watch.
- **Con: text with no place** (a quote, a rule) needs another form
  (section 7).

### E. A caption at the bottom

- **Pro:** one fixed place, and the habit of film subtitles.
- **Con:** one line, 12–15 words. It is replaced at each click (the Recap's
  captions leave when the picture no longer agrees), so nothing builds up.
  It is far from the place that it names. The bottom corners hold the
  history line and the time scale.

### F. A sentence title

A title that states the point, over visual evidence. In one study, 110
engineering students understood more, with fewer misconceptions, from
assertion–evidence slides than from topic-and-bullet slides (Garner and
Alley, 2013). It gives a late viewer the point in one line. On a story slide
it gives away the end at the start, so there the takeaway comes at the last
click instead. On an explanation slide ("15° of longitude is one hour"), use
it.

## 6. Ranking, and why

| Criterion (section 1)            |  A rail | B cards | C Lessig | D labels |
| -------------------------------- | ------: | ------: | -------: | -------: |
| 1. show, don't tell              |       3 |       2 |        2 |        1 |
| 2. clear: contiguity, glanceable |       3 |       2 |        4 |        1 |
| 3. stands on its own             |       1 |       2 |        4 |        2 |
| 4. carries more text             |       1 |       2 |        4 |        3 |
| 6. the house's text rules        |       1 |       2 |        4 |        1 |
| 8. Part 1's grammar              |       1 |       3 |        4 |        1 |
| 9. the article                   |       1 |       2 |        4 |        1 |
| **mean rank (lower is better)**  | **1.6** | **2.1** |  **3.7** |  **1.4** |

1. **D, labels**, with the takeaway on the paper beside the picture. It
   wins the two criteria that the request puts first (show; clear), and it
   is close to the best on standing alone: 12 facts of 13 on the last screen.
   Its weak point, capacity, is less of a problem than it looks: the labels
   carry the same facts in fewer words, because the picture carries the
   rest.
2. **A, the rail.** The best for a late viewer and for capacity, but it
   tells, and its text is far from its places. Keep it as the fallback for
   text that has neither a place nor a picture, in 50 words or fewer.
3. **B, cards.** In the middle on most criteria, and it covers the most
   picture of A, B and D. Its timing (after the motion) is already the house
   rule for every style.
4. **C, Lessig.** It fails the requirement to stand on its own. Keep one
   full-screen phrase a part, for a punchline that the picture has just
   shown (the report's "alternate between density and release").

The ranks are judgments from the measurements above, not measurements. A
different weight for criterion 4 (capacity) would put A first.

## 7. The language, as rules

A draft for `docs/slide-patterns.md`, when you agree:

1. **The picture tells the story.** For each fact, find its place first. A
   fact with a place is a label at that place.
2. **A label** has 8 words or fewer. An event's label starts with its date
   ("May 30: Chile, an enemy coast"). 24 px semibold ink; over a filled
   picture, with the paper's outline; a name at 20 px.
3. **Labels stay, and dim** when the next click adds one. Remove a label when
   its room is needed, or when the picture no longer agrees with it.
4. **The title names the story; the subtitle gives the stakes**, in one line.
5. **The takeaway** is one line on the paper beside the picture (blank land,
   or a margin), with its number in the accent.
6. **A fact with no place becomes a picture.** A number becomes a reach or a
   row of days. A quote becomes a document: the words are the picture, and
   each part of it gets a drawing.
7. **A rail only for text with no place and no picture**: 50 words or fewer,
   at 22 px.
8. **A full-screen phrase at most once a part**, after the picture has shown
   it.

The two still frames (mockup/prize.html, mockup/newton.html):

- [**The Longitude Act, 1714**](evidence/round-1/sea-wash/frames/prize.png): the
  prizes as reaches along the parallel of the venue. Within ½° (30 nautical
  miles, about 35 miles) of Somerville is from Worcester to the far side of
  Massachusetts Bay; within 1°, nearly to Springfield. The prize is no longer
  "£20,000 for ½°": the audience sees how close ½° is, from where they sit.
- [**Isaac Newton, 1714**](evidence/round-1/sea-wash/frames/newton.png): his words
  are the picture, and each of his four reasons has a drawing. The reasons
  set up the later slides, where a watchmaker answers each one.

## 8. The Longitude Problem in this language

One slide for each beat of the outline, with what the picture does and what
the labels say. Each is a proposal, to sketch before it is built.

1. **The Longitude Problem.** The globe (the globe task's model), over the
   Atlantic. Click 1: the parallels, and the label "Latitude: the Sun's
   height at noon". Click 2: the meridians, and "Longitude: no star tells
   it". Click 3: a ship from England sails south to the latitude of
   Barbados, then turns west along it; the shorter direct route is dashed.
   Labels: "Sail to the latitude, then turn" and "Extra days at sea: storms,
   scurvy". The section's point, "longitude is hard to measure", is the
   title, so the Anson slide need not say it.
2. **Anson's Search, 1741.** As mocked in round 2 (section 12): the ship
   sails in from the south, and the islands show only when Anson finds them.
   A detail for the speaker, from Walter: on the morning of May
   28, Anson thought that he saw the island, and his officers said that it
   was a cloud. And a number for the bar: 340 miles in 9 days is about 1.6
   miles an hour, half a walking pace.
3. **Scilly, 1707.** A map of the approach to the Channel. The fleet sails
   north from Gibraltar; at night, a dashed "where they thought they were"
   and a solid "where they were", on the rocks of Scilly. The takeaway on the
   land: "4 warships, over 1,300 men". Check the cause first (section 9):
   the error was not longitude alone. The outline's link to the Act is
   general ("disasters like this"), so the slide may keep it, but must not
   say that this wreck caused the Act.
4. **The Longitude Act, 1714.** As the still frame: the reaches of ½° and 1°
   from the venue, with the prizes.
5. **Time is longitude.** The globe turns: 15° of longitude is one hour, the
   globe task's own reason for meridians every 15°. Two clocks, the home
   port's noon and the ship's noon; their difference is the longitude.
   Labels: "1°: 4 minutes", "½°: 2 minutes". Then a row of 42 days (6 weeks
   at sea), each adding its seconds, up to 2 minutes:
   $\frac{120\ \text{s}}{42\ \text{days}} \approx 3\ \text{s}$ a day. A
   callback to Part 1: the Balance Wheel slide gives a good mechanical watch
   today ±9 s a day. In 1714, the ½° prize asked for 3 s a day at sea, three
   times better than that watch on a wrist.
6. **Isaac Newton, 1714.** As the still frame.

An idea for the narration, not the slide: the same westerlies are why a
flight from San Francisco to Boston is about an hour shorter than the flight
back. Check the times before you use it.

## 9. The facts

- **Anson, 1741**, from the chaplain's account (Richard Walter, _A Voyage
  Round the World_, 1748; Project Gutenberg #47130, Book I, the end of
  chapter X):
  - "our men dying four, five, and six in a day".
  - On May 28, "being nearly in the parallel upon which it is laid down", they
    feared that they had gone too far west, "and therefore, though the
    commodore himself was strongly persuaded that he saw it on the morning of
    the 28th, yet his officers believing it to be only a cloud", they stood
    east.
  - On May 30 they saw the coast of Chile, "distant about twelve or thirteen
    leagues": the snow on the Andes. A league is 3 nautical miles.
  - Back west, "we were so much delayed by calms and contrary winds, that it
    cost us nine days to regain the westing which, when we stood to the
    eastward, we ran down in two".
  - On June 9, at daybreak, "we first descried the island of Juan Fernandes,
    bearing N. by E.½E., at eleven or twelve leagues distance" (Book II,
    chapter I). So the ship was south-southwest of it, about 35 nautical
    miles off. The wind was northerly, and they "kept plying all that day,
    and the next night" to reach it.
  - "we lost between seventy and eighty of our men, whom we should doubtless
    have saved had we made the island that day, which, had we kept on our
    course for a few hours longer, we could not have failed to have done."
  - **Corrections to the outline:** 70–80 men, not "hundreds". Walter gives
    the wind as "calms and contrary winds", so "winds from the west" is half
    the cause; the labels say "headwinds and calms". Walter gives no
    distance. The outline's 300 nautical miles (6°) fits the map: from a few
    hours east of the island to 38 nautical miles off the coast is 5.95° of
    longitude, $5.95 \times 60 \cos 33.6° \approx 297$ nautical miles. The
    mockup says "340 miles" (statute), so that every distance in the talk is
    in one unit.
- **Newton, 1714.** The Royal Museums Greenwich holds a copy of his opinion
  from the committee meeting of 11 June 1714 (item BGN/1), with a later note
  dated 16 January 1741/2. That later date may be where "1741" came from. The
  words are as Dava Sobel's _Longitude_ quotes them; transcriptions differ a
  little ("not yet" or "never"). **Corrections:** 1714, and "Isaac".
- **The Longitude Act, 1714.** £10,000 for 1° "of a great circle" (60
  nautical miles, about 69 miles), £15,000 for ⅔°, £20,000 for ½°. A degree
  of a great circle is the same distance at every latitude, so "at the
  equator" is not needed. The dollar values are the outline's; their basis
  (prices or wages) is not checked.
- **Time.** 360° in 24 hours is 15° an hour, so 1° is 4 minutes and ½° is 2
  minutes. Over 6 weeks (42 days), $\frac{240\ \text{s}}{42} \approx 5.7$ s
  a day for 1°, and $\frac{120\ \text{s}}{42} \approx 2.9$ s a day for ½°.
  The outline's 6 and 3 are right.
- **Scilly, 1707.** The Royal Museums Greenwich's record of the wreck
  (object 140657): four ships, _Association_, _Eagle_, _Firebrand_ and
  _Romney_; "over 1,300 men died"; "the exact cause remains debated". The
  wreck "is often said to have encouraged the passing in 1714 of the first
  Longitude Act", but "there is no hard evidence for this assertion". Popular
  accounts give up to 2,000 dead. A summary of W. E. May's study (Journal of
  Navigation, 1960, from 44 surviving logbooks) says that he found errors of
  latitude and of the charts, not of longitude alone. I did not read May's
  paper. **So check before the slide says why the fleet was lost**:
  "unsure how far east it had come" is at most part of the cause. The
  outline's "disasters like this fed the push that led to the Longitude Act"
  is a claim about such disasters in general, not about this wreck, so it is
  not the claim that the museum calls unproven. The slide must keep it
  general: not "this wreck led to the Act".

Sources: Walter, [Project Gutenberg #47130](https://www.gutenberg.org/ebooks/47130);
Newton's opinion,
[RMG BGN/1](https://www.rmg.co.uk/collections/archive/rmgc-object-478813);
Scilly,
[RMG object 140657](https://www.rmg.co.uk/collections/objects/rmgc-object-140657);
Mayer and Johnson (2008), Journal of Educational Psychology 100(2), 380–386;
Ginns (2006), Learning and Instruction 16(6), 511–525; Garner and Alley
(2013), International Journal of Engineering Education 29(6), 1564–1579. I
read summaries of the three studies, not their full text.

## 10. Decisions for you

- **The style.** D, as recommended, or another.
- **The wind's placement**: in bands north and south of the voyage, with one
  gust by it where no label is ("near", recommended), in the bands only, or
  under the labels too (section 12).
- **Colors for the new marks**: the track (ink here), the day dots, the wind
  (the paper), the ship (the subject, its sails in the subject's wash, a
  pennant in the second) and the prize's reaches. Each needs a role by
  [`docs/theme.md`](../../../docs/theme.md) before it goes in the talk.
- **Units**: statute miles throughout, as the mockup does.

Decided: the sea is filled (round 1's unfilled sea made the land and the sea
hard to tell apart), and the islands show only when Anson finds them.

## 11. Commands

In `watches/`. The map needs the Natural Earth files of the globe task
(its `tools/fetch.sh`).

```bash
# the maps, from Natural Earth 1:10m
node tasks/2026-10-30-part-2-visual-language/tools/maps.ts NE_DIR
# the mockup, at http://localhost:5200/ (prize.html and newton.html beside it)
pnpm exec vite --config tasks/2026-10-30-part-2-visual-language/mockup/vite.config.ts --host
# round 2's pictures, with the server running: the labels, each wind
for wind in bands near all; do
  node tasks/2026-10-30-part-2-visual-language/tools/shots.ts http://localhost:5200/ \
    tasks/2026-10-30-part-2-visual-language/evidence/round-2/wind-$wind --wind $wind --style labels
done
```

Round 1's pictures came from the same commands before round 2 changed the
mockup: `shots.ts URL evidence/round-1/sea-wash` and `--sea paper`, every
style. The mockup now draws round 2's picture for every style.

In the mockup: `?style=rail|cards|lessig|labels`, `&wind=bands|near|all`,
`&sea=paper`; the bar under the slide has a dropdown for the style and one
for the wind. → or space steps forward with the motion, ← steps back at
once. Step 0 plays the ship's approach as the page loads.

## 12. Round 2: the labels, from your feedback

Your feedback is in [instructions.md](instructions.md), "Round 2". The
mockup changed for every style; round 2's pictures are of the labels only,
in [evidence/round-2/](evidence/round-2/), one directory for each placement
of the wind. Each has `sheet.png`: the five clicks, and three frames in
motion.

**The wind.** Each gust is a line that ends in a curl, the weather map's sign
for wind, not an arrow: an arrow can read as a current. A gust is 140 px
long with a curl of 14 px radius, in the paper, 3 px wide. It draws itself
from west to east, curls, and fades, every 3.6 s; the gusts take turns. A
settled frame shows them whole. Three placements, measured at the last
click:

| Placement | Gusts | Under text | By the voyage | Clicks 3 and 5                                                                                             |
| --------- | ----: | ---------: | ------------: | ---------------------------------------------------------------------------------------------------------- |
| bands     |     6 |          0 |             0 | [2](evidence/round-2/wind-bands/frames/labels-2.png), [4](evidence/round-2/wind-bands/frames/labels-4.png) |
| near      |     7 |          0 |             1 | [2](evidence/round-2/wind-near/frames/labels-2.png), [4](evidence/round-2/wind-near/frames/labels-4.png)   |
| all       |    10 |          4 |             2 | [2](evidence/round-2/wind-all/frames/labels-2.png), [4](evidence/round-2/wind-all/frames/labels-4.png)     |

"By the voyage" counts the gusts between y 240 and y 380, where the ship
sails. "Under text" counts the gusts whose glyphs touch a label's; the near
gust's box touches the May 28 label's box by 2 px, below its last line, and
no glyphs meet.

- **bands**: round 1's placement, with fewer and larger signs. As you said,
  the wind blows north and south of the ship, not at it.
- **near** (recommended): the bands, and one gust where the voyage starts, in
  the gap between "East or west?" and "2 days east, wind behind". The label
  then reads as the gust's caption, and the wind blows at the ship.
- **all**: the bands, and four gusts under the labels. The wind is
  everywhere, as it was, but each gust under a label is paper under the
  label's paper outline, so the label looks smudged ("headwinds and calms",
  "June 9: found").

**The ship.** A side view, loosely HMS Centurion, a 60-gun ship of 1732:
three masts, square sails on the fore and main masts, a sail aft of the
mizzen, a high stern, a pale stripe along the gun deck, and a pennant. It is
43 px long. The hull is in the subject, the sails in the subject's wash, the
pennant in the second color. It turns in 0.4 s to face its course. A side
view cannot face north, so on the approach it faces east as it sails up the
slide ([motion, click 2](evidence/round-2/wind-near/frames/labels-motion-0.png)).
The other choice is a hull seen from above, which can point any way, but it
would not look like the Centurion. As in round 1, a dot marks each day, and
stays when the ship moves on.

**The approach.** The slide opens with the ship at the bottom of the map
([click 1](evidence/round-2/wind-near/frames/labels-0.png)). At the next
click it sails north to the islands' latitude, in 2 s, with its track behind
it, and the first label waits until it arrives.

**The islands** show only at the last click, when Anson finds them. Their
name is "Juan Fernández Islands" in both labels. At this scale Robinson
Crusoe Island is 15 × 7 px, which reads as a smudge on the latitude line, so
both islands are drawn at twice their size, as a map draws a small island.

**Where the ship was on June 9.** Walter gives the island's bearing at the
sighting (section 9): the ship was south-southwest of it, 43 px away on this
map, not east of it, as round 1 drew. The west leg now ends there. It runs
due west, as the ship sailed, on the sighting's parallel: south of the east
leg, so that both show. At the turn the ship jumps south to it, with no
track: a drawn drop looked like a course sailed south. A ship
drawn there is 40 px tall, and its masts touch the island. So at the last
click the ship sails on past the island's west end, and is drawn north-west
of it, with sea between. It anchored on the island's north side; a ship drawn
there would hide the island. This is a drawing choice, and the track is
approximate.

**Labels moved**: "Wind from the west" beside the top gust; "9 days back:
headwinds and calms" below the west leg, off its dots; "Juan Fernández
Islands" and "June 9: found" west of the islands.

**Limits.** Chromium only. The motion is checked in three frames; open the
mockup to see it play. The ship and the gusts are not yet checked against
[`docs/legibility.md`](../../../docs/legibility.md). The marks' colors are
still the mockup's guesses (section 10).
