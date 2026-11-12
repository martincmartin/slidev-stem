# Part 2's visual language

How Part 2's slides carry more text and still show, not tell. Four styles
tell one story, Anson's search for Juan Fernández in 1741, with the same map
and facts: a reading rail, cards after the motion, Lessig screens, and labels
on the picture. The recommendation is the labels. Round 2 works on the
labels: the wind, the ship, and when the islands show. Round 3 retired the
rail and the cards, and compares outlines, cards and paper-colored words for
the labels, and dimming against removing old labels. Round 4 adds the Cape
Noir slide before the Anson slide, and a globe on a canvas that the camera
zooms and turns, from the whole globe to Cape Noir and on to Juan Fernández.
Round 5 adds the Scilly slide after the Anson slide: a flight across the
Atlantic to the English Channel, and a zoom in to the Isles of Scilly. It
also checks the cause of the wreck of 1707. Round 6 cuts words, keeps some labels,
dimmed, to the end of their slide, and compares four backings for each
slide's punchline in big type. Round 7 sets the choices for the talk, which
the mockup now draws by default, and brings the wind in nearer the labels. Round 8 compares the camera and the Sun for
the Noon Comes Later slide, in stills. Round 9 compares layouts for that slide, now
Longitude From Time, in the deck. Round 10 compares script fonts for Newton's words,
and builds that slide and the Seconds a Day slide. Round 11 mocks up that slide's words on
one slide, in six layouts, with the Balance Wheel slide's 9 seconds a day. Round 12
compares ideas for the John Harrison slides, with pictures that the repo can hold.

- `instructions.md`: the request.
- `PLAN.md`: the criteria, the options, the measurements, the ranking, the
  language as rules, the Longitude Problem slide by slide, and the facts
  with their sources and corrections.
- `mockup/`: the mockup, served by `mockup/vite.config.ts`. `index.html`
  steps through either style of `story.ts`, with the choices of
  `choices.ts`; `prize.html` and `newton.html` are
  two still frames in the recommended style. `geo.ts` is the maps'
  projections and the camera, `globe.ts` draws the globe on a canvas at each
  frame, `maps/` holds the story maps and the globe's data (`globe.json`)
  that `tools/maps.ts` writes, and `ledger.css` is a copy of the house
  palette.
- `tools/maps.ts`: draws the story maps from Natural Earth 1:10m land, and
  writes the globe's data at 1:110m, 1:50m and 1:10m.
- `tools/shots.ts`: takes a picture of each style at each step, and of the
  labels in motion, measures the text, and makes the sheets.
- `mockup/noon.html`, `mockup/noon.ts`: round 8's still of the Noon Comes
  Later slide.
- `tools/noon.ts`: takes a picture of that still at each place for the Sun
  and each tilt, and makes the sheets.
- `tools/speed.ts`: times each camera flight in Chromium, Firefox and WebKit,
  in windows if asked.
- `tools/layouts.mjs`: takes a picture of the deck's slide in each layout of round 9.
- `tools/fonts.mjs`: draws Newton's words in each script font of round 10, and
  measures them.
- `mockup/seconds.html`, `seconds.css`, `seconds.ts`: round 11's layouts, each at each
  click.
- `tools/seconds.ts`: takes a picture of each layout at each click, measures them, and
  makes the sheets.
- `tools/seconds-deck.ts`: takes a picture of the chosen slide in the deck at each click,
  and prints its ink and type.
- `tsconfig.json`: type-checks the task's TypeScript with the talk's options.
- `evidence/round-1/sea-wash/` and `evidence/round-1/sea-paper/`: round 1's
  output of `shots.ts`, every style, with the sea filled and unfilled:
  `frames/`, `measurements.json`, `sheet.png` (every step) and
  `last-steps.png` (each style's last step).
- `evidence/round-2/wind-bands/`, `wind-near/` and `wind-all/`: round 2's
  output, the labels with each placement of the wind, as in round 1, and
  frames in motion (`frames/labels-motion-*.png`).
- `evidence/round-3/<label>-<old>/`: round 3's output, the labels with the
  wind `near`, for each way a label stands out (`outline`, `card`, `paper`)
  and each way with old labels (`dim`, `remove`). The mockup now always
  removes them.
- `evidence/round-4/`: round 4's output of `shots.ts`: `globe/` (both
  styles, from the whole globe), `america/` (the labels, from South America)
  and `paper/` (the labels in paper words); and of `speed.ts`, in windows:
  `speed-globe.json` and `speed-america.json`.
- `evidence/round-5/`: round 5's output of `shots.ts`, `globe/` (both
  styles, from the whole globe, with Scilly), and of `speed.ts`, in windows:
  `speed-globe.json`.
- `evidence/round-6/punch-card/`, `punch-veil/`, `punch-screen/` and
  `punch-card-paper/`: round 6's output of `shots.ts`, the labels with each
  backing for the punchlines; `remove/`, with the labels that stay removed; `lessig/`,
  the Lessig style.
- `evidence/round-7/talk/`: round 7's output of `shots.ts`, the labels
  with the talk's choices.
- `evidence/round-8/`: round 8's output of `noon.ts`: `frames/`,
  `sheet-0h.png`, `sheet-2h.png`, `marks-*.png`, `sweep-*.png`, `which-*.png`
  and `above-*.png`.
- `evidence/round-9/`: round 9's output of `layouts.mjs` (`option-*.png`,
  `layout-options.png`), its input (`noon-before.ts.txt`), and the chosen layout
  as built (`chosen-click-*.png`).
- `evidence/round-10/`: round 10's output of `fonts.mjs` (`fonts.json`, `fonts.png`),
  and the slides as built (`chosen-*.png`).
- `evidence/round-11/`: round 11's output of `seconds.ts`: `frames/`, `clicks-*.png`,
  `last-clicks.png` and `measurements.json`; and the chosen slide as built
  (`chosen-click-*.png`).

Run each tool from the talk's directory (`PLAN.md`, section 11).

## Later changes

- 2026-11-01: the Cape Noir slide's title is "Age of Sail: Longitude Was a
  Guess", not "At Sea in 1741, Longitude Was a Guess" (`PLAN.md`, section
  16). Longitude was a guess at sea for about three and a half of the age
  of sail's four centuries, not in 1741 alone; chronometers came only in
  its last decades.
- 2026-11-01: a flight's time is no longer 1 s a unit of its length,
  within 1–3.5 s (`PLAN.md`, sections 14 and 15). It is paced by what
  the eye sees: a ramp of 1 s at each end, and between them one speed of
  the ground at the slide's middle and the zoom at its edge
  (`watches/docs/globe.md`, "The flight"). The flight from Juan Fernández
  to the Channel still takes about 7 s.
- 2026-11-01: a step back through a voyage is the step forward reversed:
  the legs sail back, and the count ticks back with the dots
  (`watches/docs/globe.md`, "The marks"). It no longer shows the click
  before at once (`PLAN.md`, section 16), as the house's rule for a
  story animation asks (`docs/navigation.md`).
- 2026-11-01: the user removed the rule that a click's words or labels leave
  at the next click, and its exception (`PLAN.md`, sections 7 and 13), from
  `stem/AGENTS.md` and `watches/docs/slide-patterns.md`. No rule replaces it:
  labels stay as long as they are relevant.
- 2026-11-01: the Longitude Act slide is words on two cards, not the map of
  reaches (`PLAN.md`, sections 7 and 8). The audience does not need a picture
  of 35 miles. The user also checked the dollar values (`PLAN.md`, section 9,
  gives them as not checked).
- 2026-11-01: the Noon Comes Later slide's degree labels are on their meridians
  at 30° N, in a gap in each line, not at 70° N or at the equator (`PLAN.md`,
  section 18). Its text is the Balance Wheel slide's: in the right 40%, added
  paragraph by paragraph. Its meridians are solid ink, and stop at 80°, not ink at
  0.5 from pole to pole, which shows a dark dot at each join in WebGL
  (`watches/docs/globe.md`, "The Noon Comes Later slide").
- 2026-11-01: the Noon Comes Later slide's title is now "Longitude From Time":
  it says what the slide is for.
- 2026-11-01: the ship on the slide is the story maps' ship icon, smaller, not a
  dot and the word "Ship". The mockup's line from the ship to London is gone: such
  a line elsewhere in the talk is the path that a ship sailed.
- 2026-11-01: the slide's labels ride the globe as it turns, so they do not leave
  and come back (`PLAN.md`, section 18, "Limits", gave this as not tried). The
  turn is two clicks, an hour each, so that each click shows that one meridian is
  one hour.
- 2026-11-01: the slide has a clock on London's time, whose minute hand goes
  around twice as the Earth turns. The camera's turn sets its hands. It is a simple
  dial, not the watch. The renderer has one camera, so the watch beside the globe
  needs a second one, or its meshes copied to the globe's place; the room for it
  is only 128 px wide; and the model's clock sets its hands, not the Earth's turn.
- 2026-11-02: the slide's text is centred under the title by the house's
  `side-text` class (`stem/docs/slide-layout.md`), and the rule is no longer named
  for the Balance Wheel slide. The clock and the globe's label say Greenwich, not
  London: more people know the name from Greenwich Mean Time. The dot is at 0°.
- 2026-11-02: the ship is larger and south of Greenwich's parallel, and the degree
  labels are at 20° N, not 30° N (`PLAN.md`, section 18): the two latitudes need not
  match, because only the ship's longitude carries the story.
- 2026-11-03: the slide's globe is smaller, right of where it was, under the
  subtitle "Noon comes later" (`PLAN.md`, section 19), so that the clock has room
  and the last line fits. The narration and the speaker notes say Greenwich, not
  London.
- 2026-11-03: the Isaac Newton slide is his words alone, in a script, not the still
  with a drawing for each reason (`PLAN.md`, sections 7 and 8). The slide after the
  Longitude From Time slide is Lessig screens, not a row of 42 days (`PLAN.md`,
  section 8), and it now has "4 minutes a degree" (`PLAN.md`, section 20).
- 2026-11-03: the Seconds a Day slide is now the How Good a Watch slide: option E of
  round 11 (`PLAN.md`, section 21), not Lessig screens (`PLAN.md`, sections 8 and 20).
  A listener who looked away could not catch up, and "4 min for 1°" did not say that it
  was the watch's limit for the prize.
- 2026-11-03: round 12's option A is in the deck, with no mockup (`PLAN.md`, section 22).
  The deck borrows pictures again, so the Credits slide is back.
- 2026-11-03: the How Good a Watch slide's ±9 is "a watch today, on dry land", on one
  line, not "a good watch today, on a warm wrist, on dry land" (`PLAN.md`, section 21). A
  good mechanical watch, certified by COSC, does better than ±9.
- 2026-11-03: the Credits slide is now the Thank You slide, with lines from songs that
  change with no click (`watches/docs/slide-patterns.md`, "Words that run on their own").
- 2026-11-03: lines from songs in copyright are in a private file beside the worktrees,
  not in the repo, the article or a published build (`watches/docs/slide-patterns.md`,
  "Words that run on their own"). The article lists the songs by title and writer.
- 2026-11-03: the Thank You slide does not name its songs. They are an Easter egg for the
  room to recognize. The speaker notes name them for a question, and the article lists them.
- 2026-11-03: the Four Clocks slide says that H2 was abandoned for H3 and never sailed. Royal
  Museums Greenwich: a fault in its balances, so it was never tested at sea.
- 2026-11-03: with no private file, the Thank You slide cycles song titles, not the lines of
  "My Grandfather's Clock", which is too melancholy to be the only song. Those lines moved to
  the private file, so the repo holds no song lines. "Time" joined the titles and the article.
- 2026-11-03: "Time" also has lines in the private file, so it plays in the room too. Its tempo
  is an estimate: most listings I could search give about 120 bpm, and they disagree.
- 2026-11-03: "Clocks" joined the titles, the article and the private file, for one screen only.
  Its tempo and beats are an estimate from memory.
- 2026-11-03: "Does Anybody Really Know What Time It Is?" joined the titles, the article and the
  private file, for one screen. Its tempo is an estimate from online listings, about 117 bpm. Its
  beats are from memory.
- 2026-11-03: the Thank You slide's credits are at 14 px in the lower left, above the song lines,
  with no links: nobody clicks a projected screen, and the article keeps the links. The slide
  shows CC BY 2.0's address as text, because the licence asks for it with each copy.
- 2026-11-03: "Lose Yourself" joined the titles, the article and the private file, for one screen.
  Its tempo and beats are an estimate from memory.
- 2026-11-04: "The Windmills of Your Mind" lost its last screen in the private file, because that
  screen does not mention time. Its second screen stays, because it describes the Longitude From
  Time slide. The cycle of song lines is now about 85 s.
- 2026-11-04: the Thank You slide is now the Questions slide. Its title is "Questions?". The lines
  above that say "Thank You slide" keep the name it had then.
- 2026-11-04: H4's result is settled as 5 seconds slow after 81 days, on the trial to Jamaica
  (Wikipedia, "John Harrison", and the Linda Hall page). `docs/rough-slides.md` no longer says a
  second a month at sea.
- 2026-11-04: the private folder `stem/private/` is now the private repo `stem-private`, beside
  the checkout (`PLAN.md`, section 23). Earlier lines give the old path.
- 2026-11-04: the talk's name is now "What Everyone Should Know About Watches": it is for a lay
  audience. Earlier lines and tasks keep the old name.
- 2026-11-04: the Four Clocks slide has no weights and no payment ticks, and each clock has the
  user's short text. H4's result and how it ended are on a new slide, "Did H4 Win the Prize?". The
  payments are now only in that slide's narration and notes. `PaymentTicks` and `payments.ts` are
  in commit `76cc859`.
- 2026-11-04: the Four Clocks slide's words do not give the years. The bars show them.
- 2026-11-04: the Longitude Act slide is now the Longitude Prize slide, "The Longitude Prize, 1714".
  "Act" does not say that it is a contest that anyone can enter, with a prize from the government.
  The article still names the Longitude Act once, as the law. Earlier lines keep the old name.
- 2026-11-04: the Four Clocks slide has 3 clicks, one for each clock after H1. The accent is on the
  newest clock's bar, not always on H3's. Earlier clocks have grey bars and dimmed words.
- 2026-11-04: the Four Clocks slide's title has no years, and its axis ends at 1760, at 26 px a year,
  not 18: nothing on it now runs later. H3's words are on 3 lines to fit. "43 years" is on the Did
  H4 Win the Prize? slide, with the last payment.
- 2026-11-04: H3's words on the Four Clocks slide are on 2 lines, with "still used today". The break
  falls inside "caged roller bearing", so that "Invents" stays.
- 2026-11-04: the Did H4 Win the Prize? slide quotes King George III. The user confirmed the words
  in Sobel, Longitude, p. 147.
- 2026-11-04: the Four Clocks slide is now the Same Time, Every Tick slide, with the subtitle "On a
  rolling ship, hot or cold". It names the real struggle, a swing that always takes the same time,
  without its technical name. Earlier lines keep the old name.
- 2026-11-04: the Did H4 Win the Prize? slide says "±2 min over 42 days" and "5 sec slow over 81
  days". The user confirmed that H3 took 19 years and never sailed.
- 2026-11-04: the Questions slide's songs are now 12: "Time After Time", "TiK ToK", "Stay", "In the
  End" and "4 Minutes" joined the titles, the article, the notes and the private file. The user set
  the rule in `docs/slide-patterns.md`: lines about knowing or telling the time, or about a clock or
  a watch, not time in general. The Chicago song passes, because it asks what time it is. The cycle
  of song lines is now about 134 s. "4 Minutes" shows at 6 beats a line, for reading, not as sung.
- 2026-11-08: the Same Time, Every Tick slide's words drop the names H1 to H4, H1's "Sea trial",
  H2's "Realizes" and "Never sailed", and H3's inventions. The notes and the article say them. Each
  photo shows large first, then docks at the start of its bar: H1, then H2 and H3 together, then
  H4. The slide has 5 clicks.
- 2026-11-08: the Did H4 Win the Prize? slide is now titled "Did Harrison Win the Prize?"
  (the user's request in `tasks/2026-11-08-railroad/`).
- 2026-11-12: the Longitude From Time slide's words are shorter: "Noon at Greenwich, 0°", "Earth
  turns 15°/hour", "Noon at ship / 2 p.m. Greenwich" and "Hours × 15 = Longitude". Each fits on
  one line of the 375 px column but the ship's, which needs two. "Ship: not noon yet" is gone. "4
  min/°" is on no slide: the narration of the How Good a Watch Wins the Prize? slide says it.
- 2026-11-12: the How Good a Watch Wins the Prize? slide drops "±9 sec a day / a watch today, on
  dry land": the speaker notes and the narration still say it. Its words are one centred column,
  "Clock ±2 min for ½°", then "Over 6 weeks at sea" and ±3 with its caption at the one click, and
  nothing dims (`PLAN.md`, section 21, chose two columns that dim). The notes' IF ASKED gives 3
  seconds a day as 0.003%, which the user suggested and the slide leaves out.
- 2026-11-12: the Isaac Newton slide is no longer his exact words (`PLAN.md`, section 20). It
  leaves out "and the difference of Gravity in different Latitudes", which matters for a
  pendulum, not a balance, and marks the cut with "…". "wet and dry" is a line of its own.
  Beside each reason, a note: "jolts the balance", "±1 °F: ±6 sec/day" and "rust", in two columns.
  The article still quotes him in full, and an aside there tells Richer's pendulum clock in
  Cayenne. The heat figure is about 11 sec a day per °C for an uncompensated steel hairspring
  (Wikipedia, "Balance wheel"; Europa Star).
- 2026-11-12: the John Harrison slide's portrait now comes from a better scan on Commons, "John
  Harrison (Gemälde) 01.jpg", with its dark tones lifted, at the slide's full height, flush left
  (`tasks/2026-11-12-harrison-portrait/PLAN.md`). Section 22 listed the old scan, which is faded
  and red. H1 is no longer on that slide: the Same Time, Every Tick slide starts with it, and
  H1's paragraph in the narration moved there. The click adds "Wooden clock, 1722 / Still
  running today", his Brocklesby Park clock.
