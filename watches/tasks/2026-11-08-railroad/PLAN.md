# The 1853 railroad crash: a slide after H4

**Status: built, 2026-11-08 (section 9); not committed.** The request is in
[instructions.md](instructions.md). You chose design A, text over the photo
(the fourth message). Where section 9 differs from sections 1 to 8, section
9 holds. The slide goes after the Did Harrison Win the
Prize? slide and before the Waltham Watch Company, 1870s slide.

## Summary

- **Your outline holds, with one detail** (section 1). The crash was just
  south of Valley Falls, at a blind curve near "Boston Switch". The excursion
  train's route starts in Uxbridge. The watch mandate was a company's rule,
  not a law: the Boston & Providence's rules of August 1853 (your
  correction, the second message).
- **The map can be a story map**, in the same look as Part 2's other maps
  (section 2). Boston, Worcester and Providence are on it to orient the
  audience, with today's state lines, dashed (the third message). It needs
  new land and state-line data for southern New England, and a small change
  so that a route can draw with no ship on it.
- **The daguerreotype is public domain, 3791 × 2878 px** (section 3). A crop
  inside the oval fills the slide, and the wreck fills the crop.
- **Recommendation for the last click: back to the map, not text over the
  photo** (section 4, design B). The map then shows where the new time came
  from: the Harvard College Observatory, in Cambridge.
- **The order crash → Waltham works well,** but the Waltham slide's first
  line ("H4 was one watch…") must change (section 5). A bridge: after the
  crash, a railroad paid $150 for a reliable English watch; Waltham's slide
  ends on "$150 → $25".

## 1. Your points, against the sources

The sources are in section 8.

| Your point                        | What the sources say                                                                                                                                                                                                                                       | Slide-safe wording                       |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| The southbound train's route      | Both trains were the Providence & Worcester's. The southbound train was an excursion: it left **Uxbridge**, Mass., at 6:30 a.m., with 8 cars and about 475 people, for Providence and the beaches of Narragansett Bay. The northbound train was a regular train, 2 cars and about 50 people, from Providence at 7:20 a.m. | The route from Uxbridge, labelled "Uxbridge" |
| Conductor's watch 2 min slow      | The inquest: conductor Frederick W. Putnam set his watch to company time the night before, and it ran 2 minutes slow. He left Valley Falls with 4 minutes to reach the double track at Pawtucket, when the rule needed 5.                                  | "Conductor's watch: 2 min slow"          |
| Head-on collision at Valley Falls | Head-on, at about 8 a.m., on the single track between Valley Falls station and Pawtucket, just past a blind curve near Boston Switch (today's Central Falls). The excursion ran at about 40 mph. The northbound train left Pawtucket 1 minute late.        | "Head-on collision"                      |
| 14 died, 17 seriously injured     | Wikipedia: 14 killed, 17 seriously injured. Harvard Gazette and Smithsonian: 14. Blackstone Valley Historical Society: 13 killed, about 40 wounded.                                                                                                        | "14 died, 17 seriously injured"          |
| Mandate reliable watches          | A company mandate, not a law. The Boston & Providence's rules of August 1853 (Bartky, _Selling the True Time_, 2000, p. 29, quoted by Rails West): conductors compare their watches with station time, and a clerk records it (arts. 5–6); conductors submit their watches to Bond & Sons, 17 Congress Street, Boston, for "a certificate of reliability" (art. 7); Bond cleans, repairs and regulates them "at the expense of the Corporation", and lends reliable watches meanwhile (art. 8). Smithsonian: "All over New England, railroads ordered more reliable watches for their conductors". The Vermont Central paid $150 a watch (Waltham PLAN, section 11). | "Mandate reliable watches"               |
| Coordinated railroad time         | Harvard Gazette: from 1849, railroads agreed to use Bond's Boston time; after the 1853 wreck, the voluntary agreement became mandatory. From 1851 the time came by telegraph from the Harvard College Observatory.                                        | "One railroad time"                      |
| The 1st U.S. time zone            | Harvard Gazette: "in effect" the first American time zone. Wikipedia's lead says the same, from the Gazette. It is a claim of one source, not a legal zone.                                                                                                 | "The first U.S. time zone", with "about" in speech if you prefer |

**One minute either way.** The inquest found that the northbound train left
Pawtucket a minute late. A minute earlier, it would have been past the curve,
in sight of Valley Falls station. This is the speech's best line, and it
needs no slide text.

**Not used: "two minutes" twice.** After the crash, the Boston & Providence
set its clocks 2 minutes later than Bond's clock. A second "two minutes" in
the same story would confuse the room.

## 2. The map

**The tool: a story map** (`docs/globe.md`, "The story maps"). The three
story maps of Part 2 are the model: land in the paper, sea in the water's
wash, the coast in the subject, and labels at places (`MapLabel.vue`). Not a
hand-drawn SVG: it would copy the projection and the land that `globe/maps.ts`
already makes.

**What it needs:**

- **Land data.** 1:10m land is in `globe/earth.json` only near the other
  stories (`FINE` in `art/earth-data.ts`). Add a box for southern New
  England, and make the file again (`art/fetch-earth.sh`, then
  `art/earth-data.ts`). The file grows by an estimated 30–60 kB.
- **State lines, dashed.** Natural Earth's
  `ne_10m_admin_1_states_provinces_lines`, at the same commit as the land,
  public domain. In the map's box it has the Massachusetts–Rhode Island,
  Massachusetts–Connecticut and Rhode Island–Connecticut lines (checked
  2026-11-08: 10 pieces, 2 to 19 points each). `art/fetch-earth.sh` fetches
  one more file (21 MB), and `art/earth-data.ts` keeps only the lines in the
  story boxes. The map draws them dashed, in a role that does not compete
  with the route (`stem/docs/theme.md`, "The roles"; chosen at the build),
  and with a dash unlike the dashed parallel of the other maps.
- **Not an oversight: today's state lines, not those of 1853.** The lines
  orient a modern audience. The Massachusetts–Rhode Island line moved near
  Pawtucket and Fall River in the early 1860s (from memory, not checked).
  Valley Falls, in Cumberland, was in Rhode Island in 1853.
- **A view and a story map** for the region (`globe/views.ts`,
  `globe/maps.ts`), and a story with its marks (`globe/stories.ts`).
- **A route with no ship.** A `Leg` draws its track with a ship on it. A
  train is not a ship, and two trains need two icons. The simplest change:
  a leg can have no vehicle, so the track draws itself. The collision is a
  new mark: a burst at the place.

**The extent.** Worcester (−71.80°) to Boston (−71.06°), and Narragansett Bay
(41.6°) to Boston (42.4°): about 66 km × 90 km. In a map of about 590 ×
470 px under the title, that is about 0.15–0.2 km a px. 1:10m keeps a point
each 0.5 km, so the coast is a line with a point each 3 px: smooth enough.
There are no rivers in the data.

**The places** (town centres, degrees). Boston, Worcester and Providence
are the three largest cities near the room: they are there to orient the
audience, not because a train ran to them. The route is a best estimate of
the excursion's planned route, along the Blackstone River, through the towns
that the line served:

| Place        | Longitude | Latitude | Role                       |
| ------------ | --------: | -------: | -------------------------- |
| Boston       |   −71.059 |   42.360 | label, to orient           |
| Cambridge    |   −71.128 |   42.382 | the observatory, design B  |
| Worcester    |   −71.802 |   42.263 | label, to orient           |
| Uxbridge     |   −71.630 |   42.077 | label, the route's start   |
| Woonsocket   |   −71.515 |   42.003 | route point                |
| Valley Falls |   −71.391 |   41.907 | label, the crash           |
| Pawtucket    |   −71.383 |   41.879 | route point (double track) |
| Providence   |   −71.413 |   41.824 | label, to orient; the route's end |

Valley Falls and Pawtucket are about 3 km apart, about 17 px on the map. So
the map shows where the crash was in the region, not the curve. The curve and
the minute are for the speech.

## 3. The photo

The daguerreotype, attributed to L. Wright of Pawtucket, 1853, on Wikimedia
Commons from the Google Art Project, public domain, 3791 × 2878 px. The
original is a half-plate at the George Eastman Museum. It is "believed to be
the first photograph of a train wreck" (Wikipedia; the Eastman Museum page
refused my request). Say "may be the first".

The plate is 4:3 and oval, and the slide is 16:9:

- **Inside the oval** ([evidence/photo-crop-inside-oval.jpg](evidence/photo-crop-inside-oval.jpg)):
  2400 × 1350 px from (700, 700). It fills the slide, and the wreck fills
  the crop. Recommended. The lower fifth is dark ground: room for
  "14 died, 17 seriously injured" in the paper, with an outline.
- **Full width** ([evidence/photo-crop-full-width.jpg](evidence/photo-crop-full-width.jpg)):
  the whole width of the plate. The mat and the oval's edge show in the
  corners. It looks like an object, not a scene.
- **The whole plate** ([evidence/photo-whole-plate.jpg](evidence/photo-whole-plate.jpg)),
  smaller, on the paper: honest about the object, but it does not fill the
  screen as you asked.

The credit goes on the Questions slide and in `public/railroad/README.md`
(`docs/slide-patterns.md`, "Borrowed assets"). Public domain needs no
licence line, but the house credits every borrowed file.

## 4. The designs

Each design has the same clicks 0 to 3:

- **Click 0:** the map, 60% on the left, with Boston, Worcester and
  Providence to orient, and the state lines, dashed. The excursion's route
  draws itself from Uxbridge toward Providence. The right side is empty: the
  speaker sets the scene.
- **Click 1:** "Conductor's watch 2 min slow".
- **Click 2:** a burst at Valley Falls, and "Head-on collision".
- **Click 3:** the photo covers the slide, and "14 died, 17 seriously
  injured" is over its dark ground, the slide's one accent.

They differ in click 4, "Many safety changes":

| Design                      | Click 4                                                                                     | Words over the photo | New art                 | Build (estimate) |
| --------------------------- | ------------------------------------------------------------------------------------------- | -------------------: | ----------------------- | ---------------- |
| A. Text over the photo      | The photo dims; "Mandate reliable watches" and "One railroad time: the 1st U.S. time zone" over it  |                   18 | none                    | 1.5 days         |
| **B. Back to the map**      | The photo fades out; the map adds a mark at the Harvard College Observatory; the right side lists the changes | **5** | **one mark**    | **1.5–2 days**   |
| C. A second slide           | The next slide, of words: the two changes, one a click                                      |                    5 | none                    | 1.5 days + 2 h   |

- **A. Text over the photo (your idea).** Pros: the photo stays to the end.
  Cons: 18 words over a busy picture need a dark scrim, which hides the
  picture; the crash and the reform share one screen, and the reform wins
  the eye.
- **B. Back to the map (recommended).** Pros: the photo is the peak, with
  only the toll on it. The map gives the new time a place: Harvard's
  observatory, a mile or two from the room. "The first U.S. time zone"
  becomes a thing the audience can see. Cons: one more move between
  pictures; one more mark to build.
- **C. A second slide.** Pros: the simplest. Cons: about 20 seconds for a
  slide of five words; the talk's next slide (Waltham) is already a word
  slide on its right.

**Ranking: B, A, C.** B is best because it puts the reform on the map that
explains it, and keeps the photo clean. A is second because it is your
design and costs no new art. C is last because a word slide between the
photo and Waltham adds a slide and no picture.

**Not an oversight: no trains on the map.** Two moving train icons need a
second vehicle in the voyage code (`globe/voyage.ts`), for one click. The
route that draws itself, and the burst, tell the same story.

## 5. The order with Waltham

The Waltham plan recommended Waltham first, then the crash (its section 11,
option a). You chose the crash first. That is the order of the dates (1853,
then the 1870s), and the crash becomes the problem that Waltham answers:
after the crash, railroads paid about $150 for a reliable watch; Waltham's
slide ends on "$150 → $25".

**What must change on the Waltham slide:** its speaker notes and narration
start "H4 was one watch, made by hand over four years". After the crash,
that line looks back two slides. A new first line: "Those reliable watches
were English, made by hand, at $150 each. In 1850, nearly every good watch
was still finished that way…". This is a change to a decision of the
Waltham task, so its README gets a dated line.

## 6. The speaker notes, draft

About 170 words, about 75 seconds at 140 words a minute:

> Friday, August 12, 1853. An excursion train leaves Uxbridge with about 475
> people, bound for Providence and the beaches. One track. A regular train is
> coming north out of Providence. The rule: the excursion must reach the
> double track at Pawtucket first.
>
> [click] At Valley Falls, the conductor looks at his watch. He thinks he has
> time. His watch is two minutes slow.
>
> [click] Just past a blind curve, the trains meet head-on. The other train
> had left a minute late. One minute either way, and they would have seen
> each other.
>
> [click] Fourteen people died. A photographer from Pawtucket took this. It
> may be the first photograph of a train wreck.
>
> [click] The public was outraged. Railroads made their conductors carry
> watches certified as reliable, and paid to keep them that way. And they
> agreed to one time, sent by
> telegraph from the Harvard College Observatory, right here in Cambridge.
> In effect, the first time zone in America.
>
> IF ASKED: Putnam was charged with manslaughter; I found no record of the
> verdict. The railroad paid $43,876 to victims and families, and built a
> second track. 13 or 14 dead, depending on the source.

## 7. The build

1. Add the box to `FINE`, fetch Natural Earth, and make `globe/earth.json`
   again; check its size.
2. Add the view, the story map, the story (route, burst, observatory mark),
   and their tests.
3. Let a leg have no vehicle; test it.
4. Crop and compress the photo into `public/railroad/`, with its README.
5. Write the slide, its narration and notes; credit the photo on the
   Questions slide.
6. Change the Waltham slide's first line, and its task's README.
7. `pnpm format`, quick validation, and a look in the browser; full
   validation before a commit.

## 8. Sources (read 2026-11-08)

- [Wikipedia, "Valley Falls train collision"](https://en.wikipedia.org/wiki/Valley_Falls_train_collision):
  the trains, the inquest, the toll, the daguerreotype. It cites the coroner's
  verdict (Boston Daily Evening Transcript, August 18, 1853) and Lewis, _The
  Blackstone Valley Line_ (1973).
- [Harvard Gazette, "America's first time zone"](https://news.harvard.edu/gazette/story/2011/11/americas-first-time-zone/)
  (2011): Bond's time from 1849, the telegraph from 1851, mandatory after
  the wreck, "in effect" the first time zone.
- [Rails West, "Accurate Railroad Watches allow Trains to move Safely"](http://www.railswest.com/time/watches.html):
  the Boston & Providence's rules of August 1853, arts. 5–8, quoted from
  Bartky, _Selling the True Time_ (Stanford, 2000), p. 29; its table of
  accidents, from Bartky, "Railroad Timekeepers", _NAWCC Bulletin_ 262
  (1989), gives the cause as "Conductor's watch 2 minutes slow". Your
  message also cites Aldrich (2006), which I have not read.
- [Smithsonian, _On Time_, "The Most Reliable Time"](https://americanhistory.si.edu/ontime/mechanizing/reliable.html)
  (read through the Wayback Machine): the slow watch, the blind curve, "railroads
  ordered more reliable watches", the time from Harvard.
- [Blackstone Valley Historical Society, "The Train Wreck that Changed Time"](https://www.bvhsri.org/2023/11/11/the-train-wreck-that-changed-time/)
  (2023): 13 killed, about 40 wounded.
- [Wikimedia Commons, the daguerreotype](https://commons.wikimedia.org/wiki/File:L._Wright_-_Train_wreck_on_the_Providence_Worcester_Railroad_near_Pawtucket,_Rhode_Island_-_Google_Art_Project.jpg):
  public domain, 3791 × 2878 px.

## 9. The slide as built

The request is in [instructions.md](instructions.md), the fourth to
thirteenth messages.

- **The map fills the slide, zoomed out** (the sixth and eighth messages):
  467 px a degree of latitude, from Worcester, 24 px from the left edge, to
  Cape Cod, and from Boston, at y = 95, where a subtitle would be, to the
  mouth of Narragansett Bay (41.38°, at the bottom edge). A map of 60% of the slide (section 4) was too close for the
  audience to know the coast. So there is no paper panel: the words are in
  the right 40%, on the Atlantic east of Cape Cod, with the paper's outline
  of the title.
  The words cross the tip of Cape Cod; their outline keeps them legible.
  The fit's gaps are 0.6 / 1.1 / 2.3 px (median / 95th percentile / most).
- **The data:** a fourth 1:10m box, southern New England (74° to 69° W, 40°
  to 44° N), and Natural Earth's 1:10m admin-1 lines, kept only on land
  (a name on each side) and only near New England. `globe/earth.json` grew
  from 1,256,047 to 1,317,778 bytes; the land of the other boxes is the same,
  polygon for polygon.
- **The marks:** dots for Boston, Worcester and Providence, with their
  names; the route, a best estimate through the towns of the Blackstone
  valley, with a dot at its start, Uxbridge; a burst at the crash, at click
  2; a scale of 20 miles. Uxbridge and Valley Falls have no label (the
  eighth message): neither name plays a role in the story. The state
  lines are muted, dashed and dotted. The route is a mark, not a voyage's
  leg: it shows at click 0 and does not move, so no train is drawn.
- **The words build up and stay** (the seventh, ninth and tenth messages):
  one paragraph a click, in the right 40%, and the ones before the newest
  dim. The photo comes alone at click 3, and the toll at click 4.
  "Conductor's watch / 2 min slow", "Head-on collision", "14 died / 17
  seriously injured" ("14 died" is the accent, at 48 px), and "Watch
  inspections / 1st US time zone". No bullets, and no colon as a header:
  the changes are short, so that all four paragraphs fit under the
  title.
- **The photo** is the widest crop of the slide's shape, centred on the
  oval, that stays clear of the dark rim of tarnish inside its edge: 2720 ×
  1530 px, 13% wider than the crop of section 3 (the thirteenth message).
  The crop that touches the oval, 2900 px wide, has the rim's smear and
  scratches in its corners. Both are in `evidence/`. It is 1470 px wide,
  223 kB. At click 3 it covers the slide under the title and the words. It
  does not dim at the later clicks: the words keep their outline over it.
- **The words are as high as they can be** (the twelfth message), not
  centred as the house's text beside a picture is: 100 px from the top, so
  that "Head-on collision" is in the photo's sky, above the trains.
- **The slide before it** is now "Did Harrison Win the Prize?" (the
  eleventh message).
- **The Waltham slide** now opens from the crash: "After the crash,
  railroads bought reliable watches from London, made by hand. The Vermont
  Central paid $150 each." (section 5). Its task's README has a dated line.
- **A fix on the way:** at its own view, the New England map's opacity was
  0.99999999986, not 1: `mapOnSlide` took the angle between two equal
  directions by `acos` of their dot product, which turns its rounding into
  a pan. It now uses `atan2`.

