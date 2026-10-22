# A Pattern Library for Text-First Screen Presentations

**Covers:** ways to show text on a screen, from film, TV, games, explainers
and presentations; the dimensions of the design space (layout, reveal, motion,
typography, persistence); and a ranked list of families to prototype. True for
any talk.
**Read before** you design how body text is placed, revealed, moved or styled
on slides, for one talk or for the house theme.
**Tasks:** none.

**Status: background, not rules.** This is a ChatGPT deep-research report from
October 2026. It addresses its reader as "you". The house rules for text are in
[legibility.md](legibility.md) and in each talk's `docs/`. If this report and a
rule disagree, the rule wins. Its citations are footnotes, made from the
conversation JSON that ChatGPT's page loads.

For a picture of _Disco Elysium_'s dialogue in a tall reading rail on the right
of the screen, see the screenshots in
[this LessWrong post](https://www.lesswrong.com/posts/JLMFFA67cGyqwBtFP/evrart-claire-a-case-study-in-anti-epistemology-2).
The repo holds only images that are generated, public domain or CC-licensed.

## Executive synthesis

The most useful way to think about this design problem is **not “how should a text box look?” but “what behavior does text have in this visual world?”** Once anything on the screen can be positioned, animated, transformed, layered, synchronized to speech, or made to react to other elements, text can function as a **caption, actor, interface, document, environment, conversation, stream, diagram, evidence object, or piece of scenery**.

That distinction matters because some of the richest precedents come from places that are not presentations at all. Film titles have treated typography as an expressive actor since Saul Bass; television news developed persistent lower-thirds, tickers, maps, and data inserts; _Sherlock_ made otherwise invisible messages float directly in dramatic space; _Disco Elysium_ moved sustained dialogue into a tall reading column; _Pentiment_ uses typography itself to characterize speakers; games use pacing and animation to lead the eye through substantial amounts of text; split-flap departure boards turn updates into spectacle; Isotype makes icons into repeated statistical units; modern explainers combine editorial typography, diagrams, archival material, maps, and animation.[^1][^2][^3][^4][^5][^6][^7]

There is also good empirical support for one of your core instincts: **revealing information in meaningful stages can be better than showing everything at once.** Multimedia-learning research finds that segmentation tends to improve retention and transfer, and an experiment specifically using slideshow lessons found better transfer when material appeared in smaller user-paced segments. Signaling—using cues such as color or other emphasis to direct attention—also shows a positive effect on comprehension.[^8][^9][^10][^11][^12]

The bigger opportunity, therefore, is to develop a **small vocabulary of recurring “text behaviors”** rather than hundreds of special-case animations. I would build around perhaps eight to twelve recognizable systems—editorial column, dialogue rail, evidence annotation, persistent status strip, card stack, conversational balloons, kinetic headline, document markup, situational overlay, terminal/feed, diagram-with-labels, and “hero phrase”—then permit controlled variants within each.

A useful distinction throughout this report is:

**Layout answers “where does text live?”  
Reveal answers “when does it exist?”  
Motion answers “how does it enter, change, and leave?”  
Typography answers “what does its appearance mean?”  
Persistence answers “what does the audience still get to see?”**

Those five dimensions can be recombined almost independently.

## The design space for text on a screen

Your initial ideas already cover fixed regions, overlays, cards, progressive lines, character-by-character reveals, scrolling overflow, and semantic styling of bold/italic text. The major missing dimensions are **persistence, spatial relationship, transformation, history, and semantic motion**.

### Think in terms of containers rather than slides

A presentation can have a stable “stage” with several recurring zones. The zones need not look like boxes.

| Container model             | What it feels like                   | Particularly good for                           |
| --------------------------- | ------------------------------------ | ----------------------------------------------- |
| **Reading rail**            | Magazine column, game dialogue panel | Sustained narrative text                        |
| **Lower strip**             | Broadcast lower-third                | Definitions, identities, commentary             |
| **Persistent corner bug**   | Sports score display                 | Current state, chapter, metric, progress        |
| **Card stack**              | Dashboard / index cards              | Independent ideas, quotes, evidence             |
| **Feed**                    | Chat, terminal, live log             | Chronology, discovery, accumulating argument    |
| **Caption layer**           | Film subtitles                       | Short commentary while imagery remains dominant |
| **Margin**                  | Annotated book                       | Caveats, citations, side notes                  |
| **Canvas labels**           | Map, schematic, HUD                  | Connecting language directly to objects         |
| **Speech/thought balloons** | Comics and games                     | Multiple voices                                 |
| **Document surface**        | Newspaper, manuscript, memo          | Source material and close reading               |
| **Full-screen poster**      | Advertising, Lessig/Takahashi        | A single decisive phrase                        |
| **Spatial type**            | Film titles integrated into scenery  | Dramatic transitions and place-setting          |

The right-side reading rail deserves particular attention. Inkle’s text-heavy games explicitly treat **focus and pacing** as the two central problems of text UX and use animation to lead the eye. _Disco Elysium_ similarly rejected the conventional wide bottom dialogue box in favor of a tall side column suitable for substantial reading.[^3][^13][^14]

That maps directly to your “left 40%” idea, but I would generalize it into a named component such as a **reading rail**. A rail can persist across slides while its relationship to the rest of the stage changes:

> image + rail → diagram + rail → empty field + rail → rail expands to full screen → rail collapses into a quotation card.

That continuity itself becomes a visual identity.

### Persistence is an underused design variable

Most presentation systems think in terms of “appears” and “disappears.” Other media exploit more possibilities:

**Persistent context.** Sports score graphics continually answer a few high-value questions without competing with the main action. News graphics similarly preserve identity or story context in a stable region.[^15][^16]

**Accumulating history.** Chat, terminals, logs, and some game dialogue systems leave previous material visible but progressively less salient.

**Decay.** Previous lines stay visible but fade, desaturate, shrink, blur slightly, or retreat upward.

**Compression.** A paragraph is read, then collapses into a one-line summary that remains while the next paragraph arrives.

**Replacement.** A sentence transforms into its corrected version, counterargument, translation, or simplification.

**Ghosting.** Old text becomes very faint contextual texture rather than disappearing entirely.

**Pinning.** One sentence is extracted from flowing text and “pinned” elsewhere on the screen as a permanent premise.

Those last four are especially promising because they solve your overflowing-box problem more intelligently than ordinary scrolling. Instead of merely moving the text upward, you can decide **what survives**.

### Text can participate in spatial relationships

Film provides some of the strongest precedents. _North by Northwest_ is an early example of “situational type,” aligning typography with the perspective of the surrounding environment; _Panic Room_ famously rendered large three-dimensional titles as if they occupied New York streets and architectural space.[^17][^18]

You can borrow the principle without using literal 3D:

- a label can anchor to a feature in an image and remain attached as the image pans;
- a quotation can appear behind an object and be partially occluded;
- words can follow a path in a diagram;
- a paragraph can occupy the negative space naturally created by an image;
- annotations can “live” alongside the thing they describe rather than in a detached text panel;
- words can collide with or be displaced by animated objects.

_Scott Pilgrim vs. the World_ took the last idea quite far: text-like graphics derived partly from comics appear to belong to the scene and sometimes interact with the action rather than behaving as a generic overlay.[^19]

This suggests a useful rule: **when the words refer to something visible, first try attaching them to that thing before putting them in a separate box.**

## A broad atlas of styles from other media

The table below is deliberately eclectic. The value is not in copying any one treatment wholesale, but in seeing how many fundamentally different jobs typography can perform.

| Source tradition                    | Characteristic treatment                                                                        | What to borrow                                                                                                                                                                                                                                                                                              |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Conventional keynote/TED visual** | One short statement or image at a time                                                          | Extremely high signal-to-noise. TED itself advises simple slides and notes that one or two lines will often suffice.[^20][^21]                                                                                                                                                                              |
| **Lessig / Takahashi style**        | One word, phrase, quotation, or image per screen; rapid synchronization to speech               | Treat individual screens almost as frames in a movie rather than pages in a document.[^22][^23][^24]                                                                                                                                                                                                        |
| **PechaKucha / Ignite**             | Strict automatic pacing                                                                         | Borrow the notion that a visual rhythm can be a compositional constraint; PechaKucha uses twenty 20-second images and Ignite twenty 15-second slides.[^25][^26]                                                                                                                                             |
| **Broadcast lower-third**           | Compact identifying text appears temporarily near the bottom                                    | Excellent for definitions, sources, quotations, speaker identities, and asides without replacing the main visual. Broadcast graphics evolved precisely to add textual information over live pictures.[^27][^28]                                                                                             |
| **News headline banner**            | Strong headline plus one subordinate context line                                               | Useful for “claim + qualifier” or “finding + implication.” CNN's graphics have repeatedly adjusted typography and line structure to balance amount of text with clarity.[^16][^29]                                                                                                                          |
| **Ticker / crawler**                | Continuous peripheral stream                                                                    | Secondary facts, citations, dates, running examples—though automatic scrolling should be pausable because moving text disadvantages slower readers.[^30][^31]                                                                                                                                               |
| **Scorebug**                        | Tiny persistent status panel                                                                    | Chapter progress, current assumption, version number, speaker, running total, experiment state.                                                                                                                                                                                                             |
| _**Sherlock**_                      | Plain text messages float in scene rather than cutting to phone screens                         | Perfect precedent for unobtrusive pop-up quotations, definitions, messages, search terms, or internal thoughts. The production explicitly developed the device to avoid repeatedly showing phone close-ups.[^2][^32]                                                                                        |
| _**Stranger Than Fiction**_         | Data-like graphics track and analyze a character's world                                        | Use quantitative callouts and mini-diagrams as an analytical layer over photographs or video.[^33]                                                                                                                                                                                                          |
| _**Panic Room**_ / situational type | Text occupies architectural space                                                               | Use perspective, depth and occlusion to make chapter titles or key phrases feel physically present.[^34][^17]                                                                                                                                                                                               |
| _**Se7en**_                         | Hand-scratched, jittering, imperfect typography                                                 | Typography can establish emotional tone; legibility can intentionally degrade for very short expressive passages.[^35]                                                                                                                                                                                      |
| _**Scott Pilgrim**_                 | Comic/game typography becomes part of live action                                               | Onomatopoeia, counters, labels, “achievement” banners, annotations, and textual effects tied directly to events.[^19]                                                                                                                                                                                       |
| _**Stranger Things**_               | Slow, close-up typographic reveal                                                               | Build anticipation by withholding the complete word or phrase and moving through fragments. Its title design drew heavily from period book-cover typography.[^36]                                                                                                                                           |
| **Game dialogue box**               | Text revealed at conversational pace in a consistent container                                  | Strong model for extended quotations, fictional dialogue, interview excerpts and narrated case studies.[^37][^38]                                                                                                                                                                                           |
| _**Disco Elysium**_                 | Tall vertical conversation rail with scrollable history and choices                             | One of the closest precedents to your partial-screen text region; excellent for sustained, accumulated prose.[^14][^39]                                                                                                                                                                                     |
| _**Pentiment**_                     | Typefaces become “voices”; typography varies according to character and context                 | Excellent precedent for turning font, weight, texture and writing style into semantic metadata rather than mere decoration.[^4]                                                                                                                                                                             |
| **Comic dialogue**                  | Balloons spatially connect text with speakers                                                   | Let quotations point toward image subjects; use balloon shape, border or typography to distinguish narration, dialogue, thought, interruption and whisper. Game designers explicitly cite comics as a rich source for dialogue-interface ideas.[^37]                                                        |
| **Terminal / teletype**             | Monospace characters accumulate in chronological order                                          | Great for technical explanations, chronology, investigative reveals and simulated thought processes.                                                                                                                                                                                                        |
| **Stock ticker**                    | Compact machine-generated updates                                                               | Useful visual metaphor for fast-changing quantities or a sequence of events; historical stock tickers literally printed continuously arriving information onto paper tape.[^40][^41]                                                                                                                        |
| **Split-flap departure board**      | Each character mechanically cycles until it reaches its new state                               | A powerful transition language for categories, dates, rankings or chapter labels. MoMA's Solari board demonstrates how the physical update itself becomes perceptible spectacle.[^5][^42]                                                                                                                   |
| **Teletext / Ceefax**               | Blocky type, hard color regions, information-dense pages                                        | Distinctive retro system for dashboards, indexes or intermission screens. Ceefax originated from work on transmitting textual information and subtitles through television signals.[^43]                                                                                                                    |
| **Newspaper clipping**              | Source document becomes visual object; highlight only relevant phrase                           | Ideal for arguments based on evidence: show enough surrounding article to communicate provenance, then highlight, crop or magnify the sentence that matters.                                                                                                                                                |
| **Redaction / declassification**    | Material revealed by removing black bars or masks                                               | Suspense, legal/history topics, “what was hidden?” arguments.                                                                                                                                                                                                                                               |
| **Highlighter / editorial markup**  | Underlines, circles, arrows and marker swipes appear while narration proceeds                   | Treat text as evidence being examined rather than prose being presented. Vox's explainer tradition explicitly combines reporting with motion design and data visualization.[^7][^44]                                                                                                                        |
| **Documentary explainer**           | Text, photos, maps, labels, diagrams and archival material constantly substitute for each other | Rather than one permanent text style, establish an editorial grammar. Vox describes its explainer work as combining research with motion design and data visualization; Kurzgesagt similarly develops visual metaphors, illustration and infographics around scripts.[^7][^45]                              |
| **Kinetic typography**              | Movement itself expresses stress, emotion, rhythm, volume or personality                        | Make type shrink when something diminishes, hesitate before an uncertain word, explode on a contradiction, or physically crowd the screen when the concept is overload. Carnegie Mellon research describes kinetic type as capable of carrying tone, emotional qualities and directing attention.[^46][^47] |
| **Lyric/karaoke display**           | The currently spoken word or phrase changes state                                               | Great for quotations, poetry, language, speech analysis or emphasizing exact wording; temporal highlighting makes a long sentence manageable without hiding its context. Kinetic typography is widely used in music and lyric-oriented treatments.[^48][^49]                                                |
| **Isotype / pictogram statistics**  | Repeated icons encode quantities or categories                                                  | Useful when magnitude matters more than precision, or for giving paragraphs memorable visual landmarks. Isotype was explicitly developed as a consistent pictorial language for communicating social and statistical facts.[^6][^50]                                                                        |
| **Small multiples**                 | Repeated tiny diagrams permit comparison                                                        | Replace a paragraph of “A does X while B does Y…” with several identically structured miniature diagrams. Pew uses the method to make large sets of comparisons easier to interpret.[^51][^52]                                                                                                              |

Several of these can be blended. A particularly strong combination is **document + annotation + dialogue rail**: an article, screenshot, photograph or diagram occupies most of the frame while a narrow textual rail narrates what to notice; annotations appear over the visual precisely when the corresponding sentence arrives.

## Motion, pacing, progressive reveal, and scrolling

### Four fundamentally different reveal modes

I would distinguish four modes instead of treating all animation as equivalent.

**Reader-controlled reveal.** A click advances one meaningful unit. This is the safest default when comprehension matters because the presenter can synchronize the visual state with the room. Research on segmentation consistently favors breaking complex multimedia into meaningful portions, and learner-paced segmentation is especially well established.[^8][^53][^10]

**Narration-synchronized reveal.** A phrase or element appears exactly when spoken. This is closer to kinetic typography, subtitling and documentary graphics. It works well when the text is reinforcement rather than an independent reading task. Kinetic-type research specifically frames time as an additional expressive dimension that can direct attention.[^47][^46]

**Event-chained reveal.** Text appears when another animation reaches a meaningful state: when a bar finishes growing, when an image settles into place, when a highlighted object reaches the center, or when a diagram completes a step. This is superior to arbitrary delays because the timing communicates a causal or rhetorical relationship. Research on progressive cues similarly finds benefits when cues are synchronized with relevant stages of an animation.[^54][^55]

**Ambient/autonomous reveal.** Text evolves independently of the presenter: ticker, terminal output, slowly rotating quotations, atmospheric fragments. This is visually interesting but should carry secondary material rather than information the audience must capture at a particular instant. WCAG guidance specifically cautions that automatically moving or updating text can disadvantage slower readers and recommends mechanisms to stop it or expose a static version.[^30]

### Progressive text need not mean “character by character”

There is a hierarchy of granularity you can experiment with:

**document → paragraph → sentence → clause → phrase → word → syllable → character → stroke.**

Moving down that hierarchy shifts the experience from **reading** toward **performance**.

Sentence and phrase reveals are usually the strongest general-purpose tools. Word reveals are excellent when synchronized to speech. Character reveals are stylistic—terminal, typewriter, computer boot screen, interrogation transcript, incoming message—and should generally be used because the metaphor means something.

Your proposed **120 characters per second** is worth calibrating carefully. Assuming roughly six to seven characters per English word including spaces, 120 characters/second corresponds to roughly **1,030–1,200 words per minute**. A large meta-analysis of 190 studies estimates typical adult silent reading of English nonfiction around **238 words per minute**, with most adults falling around 175–300 words/minute.[^56][^57]

That means 120 characters/second should be thought of as a **fast materialization effect**, not as a pace at which viewers actually read the characters as they arrive. At roughly six characters per word, 238 words/minute corresponds to only about **24 characters/second**. This does not imply “24 cps is correct”—reading projected material while listening to a speaker is a different task—but it gives you an order-of-magnitude reference.[^56]

I would therefore experiment with three distinct intentions:

| Intent                              | Starting behavior                                        | Why                                                 |
| ----------------------------------- | -------------------------------------------------------- | --------------------------------------------------- |
| **Read as it appears**              | Phrase/word chunks, or relatively slow typing            | Audience follows the formation                      |
| **Watch it materialize, then read** | Very fast character animation, perhaps including 120 cps | Motion supplies texture; reading happens afterward  |
| **Feel a machine operating**        | Irregular character timing, cursor, sound, pauses        | The metaphor matters more than literal reading rate |

Those speeds are design starting points rather than experimentally validated thresholds.

### Better alternatives to ordinary overflow scrolling

If a text region fills, scrolling everything upward is only one option.

**Terminal scroll.** New text arrives at bottom; all prior lines move upward equally.

**Conversation stack.** New block enters at bottom; previous blocks remain grouped as cards.

**Spotlight scroll.** Current paragraph stays in a fixed reading position; earlier paragraphs drift upward and dim.

**Depth stack.** Earlier paragraphs shrink and recede, producing visible history with little space.

**Compression scroll.** Once a paragraph is complete, it collapses into its bold first sentence or a one-line summary.

**Semantic pinning.** Most old prose scrolls away, but selected terms or premises detach and remain pinned as persistent chips.

**Erase-and-rewrite.** Instead of moving, old prose is progressively replaced—for example, verbose wording turns into a concise formulation.

**Palimpsest.** Old text fades almost completely but remains as faint background texture.

**Page turn.** The container behaves like a book rather than a continuous scroll.

**Column continuation.** When one region fills, a second column opens instead of scrolling.

**Archive drawer.** Previous paragraphs visibly collapse into a small “history” area that can expand later.

For long-running body text, keep the actual line measure reasonably narrow. The U.S. Web Design System recommends roughly **45–90 characters per line**, with about 66 as a useful target for longer text; other web typography guidance commonly places comfortable single-column reading around 45–75 characters.[^58][^59]

A 40%-width rail can therefore be an advantage, not a compromise, if the type size is appropriate.

### Animate attention, not merely objects

The strongest reason to animate text is to answer:

> **What should the audience look at now?**

Research on signaling finds that cues directing viewers toward relevant material produce a small-to-medium improvement in comprehension, and studies of progressive reveal in graphical problem solving suggest that animation is more useful when it controls the arrival of relevant objects rather than simply making an already-complete diagram move.[^12][^60]

That suggests experiments such as:

**Focus bleaching:** everything except the active sentence becomes low contrast.

**Reading spotlight:** a soft region follows the current phrase.

**Semantic underline:** a line draws itself only under the word the speaker is presently interpreting.

**Color inheritance:** a sentence and the object it refers to temporarily share an accent color.

**Attention handoff:** an emphasized word physically travels toward the diagram element it names.

**Morph-to-diagram:** a phrase such as “three paths” transforms into three visible lines.

**Zoom-through-language:** paragraph → sentence → phrase → one key word.

**Return-to-context:** after close reading a sentence, the interface zooms back to show where that sentence lives in the larger argument.

## Typography as a semantic and expressive system

Your idea that italics or bold could render differently is much more powerful if treated as a **semantic transformation language** rather than a replacement for conventional Markdown styling.

Instead of saying:

> italics = slanted letters

you can say:

> emphasis level A = accent color  
> emphasis level B = second accent + heavier weight  
> aside = smaller / dimmer  
> quotation = different family  
> technical term = monospace  
> uncertainty = lighter weight or slight jitter  
> contradiction = strike/rewrite  
> historical voice = period typeface  
> speaker A/B = persistent typographic identities.

That gives authors a semantic vocabulary and lets the visual style change globally later.

### Separate meaning from visual treatment

A good underlying model might conceptually contain roles such as:

`emphasis`  
`strong`  
`term`  
`quote`  
`aside`  
`source`  
`warning`  
`question`  
`speaker-a`  
`speaker-b`  
`new`  
`deleted`  
`uncertain`  
`numeric`  
`command`

A theme then decides what those roles look like.

For one presentation:

> `emphasis` → italic accent color

For another:

> `emphasis` → upright bold text with animated underline

For another:

> `emphasis` → word temporarily enlarges 15%, then settles

That architecture opens the door to whole families of distinctive typographic identities.

### _Pentiment_ points toward “typographic voice”

This is one of the most relevant examples I found. Its developers deliberately use different historically influenced writing styles as part of characterization, creating what director Josh Sawyer described as a kind of **typographic voice**; the typography changes according to character and context while remaining readable enough for a text-heavy game.[^4]

For a presentation, that could mean:

> **Research findings** always appear in one voice.  
> **Your interpretation** uses another.  
> **Critics** use a third.  
> **Historical quotations** have their own treatment.  
> **Hypotheses** look visibly provisional.

The audience would learn these conventions after only a few slides, at which point typography itself carries metadata.

### Motion can become semantic too

Carnegie Mellon’s kinetic-typography work argues that moving type can convey qualities normally associated with film or speech, including tone and emotion, as well as directing attention.[^46][^47]

That suggests a reusable mapping language:

| Meaning            | Possible behavior                                           |
| ------------------ | ----------------------------------------------------------- |
| uncertainty        | slight hesitation before appearing                          |
| growing importance | gradual increase in weight or scale                         |
| fading relevance   | weight and opacity decrease                                 |
| interruption       | incoming phrase physically displaces prior phrase           |
| contradiction      | old statement splits, flips or is overwritten               |
| convergence        | several phrases move together and become one                |
| divergence         | single phrase separates into alternatives                   |
| causality          | phrase moves toward resulting object                        |
| repetition         | previous instance remains as an echo                        |
| urgency            | abrupt appearance, little easing                            |
| reflection         | slow fade and increased spacing                             |
| overload           | text literally crowds available space                       |
| simplification     | dense block contracts into short summary                    |
| ambiguity          | two renderings briefly coexist                              |
| correction         | letters transform rather than replacing the entire sentence |

This is richer than a library of “fade / slide / zoom,” because the motion is now part of the argument.

### Variable typography offers another unexplored axis

Even without changing font families, typography can change continuously in:

**weight, width, slant, tracking, leading, size, case, opacity, outline/fill, blur, texture, alignment and line measure.**

You could, for example, let a phrase become progressively heavier as evidence accumulates, or compress a verbose sentence horizontally before replacing it with a concise one.

The particularly interesting territory is **continuous transformation** rather than binary styles.

### Deliberate illegibility has a place—but a narrow one

_Se7en_ is useful precisely because it demonstrates how typography can become expressive enough to violate ordinary legibility expectations: its titles were hand-etched and manipulated to smear and jitter, matching the psychological world of the film.[^35]

That is a reason to occasionally distort **one or two emotionally loaded words**, not a reason to make body prose difficult to read.

A useful hierarchy is:

> body text: nearly no expressive distortion  
> headings: moderate expression  
> quotations/key phrases: substantial expression  
> transitions/interstitials: almost anything goes.

## Icons, diagrams, and other visual scaffolding

The most important role of icons and diagrams in a predominantly textual presentation is **not decoration. It is to reduce the amount of text required to reconstruct structure.**

### Use icons for recurring categories

Icons work especially well when the audience repeatedly encounters the same semantic roles:

**claim · evidence · example · caveat · question · action · person · place · time · risk · opportunity · source.**

After the first few appearances, a small visual marker becomes a faster locator than repeatedly reading category names.

There is an important limit: usability research finds that outside a relatively small set of familiar symbols, icons are frequently ambiguous, and text labels are often still needed.[^61][^62]

So I would use icons primarily for **reinforcement and navigation**, not as cryptic replacements for uncommon terms.

### Use pictograms when quantity is part of the message

Isotype is the canonical precedent. Otto and Marie Neurath's work systematically used repeatable pictograms to communicate social and statistical facts, establishing a visual language whose influence extends into modern information graphics.[^6][^63][^50]

A paragraph such as:

> “Only one of every five attempts succeeds…”

can become:

`● ○ ○ ○ ○`

with the prose below it.

For approximate magnitude, memorable ratios, populations, categories and “one out of N” arguments, a repeated icon row can communicate before the sentence is even finished.

### Use micro-diagrams to replace relational prose

Any time prose contains words like:

> because  
> therefore  
> leads to  
> consists of  
> depends on  
> compared with  
> inside  
> outside  
> before  
> after  
> feedback  
> hierarchy  
> cycle

there is a reasonable chance that a **five-second diagram** can carry part of the burden.

The most useful small diagram families are:

| Relationship in prose      | Diagram                      |
| -------------------------- | ---------------------------- |
| A causes B                 | arrow                        |
| A and B combine into C     | converging arrows            |
| C breaks into A/B/C        | branching tree               |
| repeated cycle             | loop                         |
| before/after               | two-state comparison         |
| hierarchy                  | nested boxes / tree          |
| components                 | exploded view                |
| timeline                   | horizontal or vertical track |
| feedback                   | closed loop                  |
| alternatives               | fork                         |
| tradeoff                   | opposing scales / axes       |
| sequence                   | numbered nodes               |
| overlap                    | Venn-like regions            |
| same structure, many cases | small multiples              |

Small multiples are particularly useful for text-heavy presentations because they replace repetitive comparative prose while keeping each panel simple. Pew Research Center emphasizes their value in putting comparable information side by side without forcing the viewer to decode a crowded multi-series chart.[^51][^52]

### Use annotation instead of description

Suppose an image contains five relevant details. The pedestrian approach is:

> show image  
> put five bullets beside it.

A stronger screen-native approach is:

> show image  
> first annotation appears next to the relevant feature  
> image subtly reframes  
> second annotation arrives  
> existing annotation remains but dims  
> third feature gets outlined  
> conclusion appears as a compact card.

This is exactly where signaling is useful: attention cues improve comprehension when they make the relevant text-picture correspondence easier to identify.[^11][^12]

### Icons can act as visual punctuation

Tiny symbols need not encode complete concepts. They can simply establish rhythm:

> ✦ insight  
> ? unresolved issue  
> → consequence  
> ↺ recurrence  
> ⧉ example  
> ⓘ context

This can make a narrow reading rail substantially easier to navigate than undifferentiated paragraphs.

### Diagrams can themselves progressively “write”

Do not assume a diagram must arrive complete. A process can draw itself one relationship at a time while prose appears alongside it. Research on segmenting and progressive cueing supports the basic strategy of synchronizing meaningful visual components with corresponding explanatory stages.[^8][^54]

One particularly promising pattern is:

> **sentence → diagram fragment → sentence → diagram fragment → compact complete diagram**

The prose disappears at the end, leaving the diagram as the memory object.

That is almost the inverse of ordinary slides, where a complete diagram is shown first and then explained.

## A larger experimental vocabulary

The following are the techniques I think are most worth adding to your original brainstorming set.

### Transformations of the text itself

**Semantic morph.** One word transforms into another: “cost” → “investment,” “user” → “participant.”

**Live revision.** Show a sentence being edited in place. Delete weak words, move clauses, substitute terminology.

**Diff view.** Old wording and new wording appear like a software diff.

**Progressive condensation.** Paragraph → two sentences → phrase → one word.

**Progressive expansion.** Begin with one claim; unpack its hidden assumptions beneath it.

**Redaction reveal.** Hide pieces and progressively expose them.

**Cloze reveal.** Show a sentence with blanks, then fill them.

**Typographic equation.** Rearrange words physically as if they are algebraic terms.

**Word sorting.** Terms move into categories.

**Word cloud that resolves.** Chaotic concepts reorganize into a structured list or diagram.

**Literal metaphor.** “The margin is shrinking” while the text column itself narrows.

**Counterfactual overwrite.** Show “what people believe,” then overwrite portions with “what the evidence shows.”

### Treatments of history and memory

**Breadcrumb sentences.** Each completed section leaves a one-line breadcrumb.

**Pinned premises.** Critical claims accumulate along one edge.

**Running glossary.** Defined terms collect in a small region and reappear when referenced.

**Argument ledger.** Evidence cards visibly accumulate beneath a claim.

**Timeline memory.** Each new event leaves a marker; only the active event has full prose.

**Conversation memory.** Previous speaker turns remain faintly visible.

**Evidence wall.** Photos, quotations and notes accumulate like an investigator's board.

### Conversational systems

**Two-column debate.** Positions occupy stable left/right regions.

**Intercepting dialogue.** One side’s phrase physically interrupts the other.

**Chat bubbles.** Good for quoted exchanges, interviews, hypothetical objections.

**Comic balloons.** More spatial and expressive than phone-chat UI.

**Call-and-response.** Question appears large; answer arrives somewhere unexpected.

**Audience proxy.** A recurring “skeptical voice” card asks likely questions.

**Internal monologue.** Main prose is neutral while a smaller second voice comments in the margin.

### Document and evidence systems

**Archival dossier.** Photographs, dates and quotations appear as case-file objects.

**Margin notes.** Main source stays intact; interpretation happens around it.

**Magnifying glass.** Zoom into one sentence while preserving a miniature view of the whole source.

**Marker pass.** Relevant words are physically highlighted while discussed.

**Citation drawer.** Source details slide out temporarily without occupying the main composition.

**Footnote popover.** Superscript markers open little contextual cards.

**Parallel editions.** Original and translation, claim and paraphrase, raw data and interpretation.

### Information-interface metaphors

**Command line.** Each argument behaves like a command and result.

**System log.** Chronological events appear with timestamps and severity levels.

**Dashboard.** Persistent variables sit around changing main content.

**Status console.** One panel presents actions, another consequences.

**Search interface.** A question is typed; “results” become the subsequent argument.

**Database query.** Filtering visibly narrows a large set of statements.

**Version history.** Ideas appear as successive revisions.

**Notification stack.** Supporting facts arrive as small alerts.

**Progress meter.** Instead of a conventional slide number, show conceptual progress: “problem → mechanism → evidence → implication.”

### Physical and retro display metaphors

The history of information displays is fertile territory precisely because those systems had conspicuous constraints.

A Solari-style split-flap display can make a **category change** feel tangible. MoMA's example demonstrates how rows physically update and migrate.[^5][^42]

A stock ticker suggests **continuous incoming information**.[^40]

A teletype suggests **breaking information or machine transmission**.

Teletext suggests **dense indexed information** and a deliberately limited visual vocabulary.[^43]

Other worthwhile metaphors include:

> dot-matrix printer  
> mechanical counter  
> airport arrivals board  
> CRT terminal  
> LED matrix  
> typewriter page  
> fax / thermal receipt  
> newspaper press  
> index card catalog  
> microfiche  
> overhead projector transparency  
> blackboard/chalk  
> drafting blueprint.

The key is not retro styling for its own sake. Each metaphor implies a behavior: **printing, flipping, transmitting, stamping, filing, erasing, layering.**

### Motion-comic and cinematic techniques

**Parallax depth.** Text occupies a different depth layer from imagery.

**Occlusion.** Objects pass in front of words.

**Camera move across typography.** A paragraph is larger than the frame; camera movement determines what can be read.

**Rack focus.** Background prose becomes sharp only when relevant.

**Match cut through a word.** Same word survives while the entire visual context changes.

**Typographic wipe.** Giant text itself becomes the transition mask.

**Physical collision.** Image element knocks letters away.

**Tracking label.** Text follows an object.

**Spatial caption.** A statement appears exactly at the place it describes.

Film title practice provides precedents for all of this in spirit: the point of titles developed far beyond merely placing legible credits over an image. MoMA describes _Goldfinger_ as an example where title design became a significant film component rather than an afterthought, while the Academy describes Saul Bass's work as revolutionary to title-sequence design.[^64][^1]

### High-energy kinetic treatments

Reserve these for short passages:

**Scale punches.** Emphasized word hits large then settles.

**Elastic word.** Stretching communicates difficulty or tension.

**Shake/jitter.** Anxiety, instability, noise.

**Gravity.** Words fall, pile or collapse.

**Magnetic attraction.** Related concepts pull toward each other.

**Repulsion.** Conflicting ideas push apart.

**Orbit.** Secondary concepts revolve around a central term.

**Rhythmic pulse.** Words respond to narration cadence or music.

**Per-letter wave.** Suitable for texture, not prose.

**Fragment/reassemble.** Good for transitions involving reconstruction.

Kinetic typography is explicitly studied as a way of importing properties of film—emotion, character and control of attention—into textual communication.[^65][^47]

## Recommended experimental families and ranking

Rather than implement dozens of disconnected gimmicks, I would prototype **families**. The table below is my ranking based on four considerations: general usefulness across topics, reading quality, distinctiveness, and how much new expressive capability the family adds. The scores are design judgments, not experimental measurements.

|   Rank | Family                                   | Generality | Distinctiveness | Reading comfort | Why prototype it                                                                                                                                                                                     |
| -----: | ---------------------------------------- | ---------: | --------------: | --------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|  **1** | **Reading rail + progressive focus**     |        5/5 |             4/5 |             5/5 | Solves the fundamental long-text problem while leaving most of the screen available for imagery. Borrow from text-heavy games and progressive disclosure.                                            |
|  **2** | **Semantic typography system**           |        5/5 |             5/5 |             5/5 | A single markup vocabulary can power accent color, weight, voice, uncertainty, quotation and animated emphasis across an entire presentation. _Pentiment_ is the strongest conceptual precedent.[^4] |
|  **3** | **Document + live annotation**           |        5/5 |             4/5 |             5/5 | Ideal for research, evidence, quotations and screenshots; signaling research strongly supports directing attention to relevant text-picture relations.[^11][^12]                                     |
|  **4** | **Accumulating feed / dialogue history** |        4/5 |             4/5 |             5/5 | Direct answer to your scrolling-text idea. Preserve history while keeping the newest material spatially predictable.                                                                                 |
|  **5** | **Text-to-diagram transformation**       |        5/5 |             5/5 |             4/5 | Perhaps the most pedagogically interesting: prose gradually leaves behind a compact visual mental model. Progressive cueing and segmenting offer good theoretical support.[^54][^9]                  |
|  **6** | **Cards and pop-up evidence**            |        5/5 |             3/5 |             5/5 | Familiar enough to remain usable, but highly customizable. Excellent for quotations, definitions, objections and statistics.                                                                         |
|  **7** | **Conversation/comic grammar**           |        4/5 |             5/5 |             4/5 | Gives different voices spatial identity and allows arguments to become actual dialogue. Comics are explicitly cited as a useful source for game dialogue-interface design.[^37]                      |
|  **8** | **Kinetic hero typography**              |        4/5 |             5/5 |             3/5 | Very high expressive value for transitions, theses and emotional beats; poor choice for large quantities of prose.[^46][^47]                                                                         |
|  **9** | **Situational / image-attached type**    |        3/5 |             5/5 |             4/5 | Extremely memorable when labels relate to visible objects; precedents include _North by Northwest_, _Panic Room_ and _Sherlock_.[^17][^18][^2]                                                       |
| **10** | **Persistent context strip / scorebug**  |        5/5 |             3/5 |             5/5 | Quietly powerful: chapter, running premise, metrics, progress and source can remain visible without consuming the narrative area. Broadcast graphics are the natural model.[^15][^16]                |
| **11** | **Retro information machines**           |        3/5 |             5/5 |             4/5 | Split-flap, teletype and teletext treatments give presentations unusually strong identity when thematically justified.[^5][^40][^43]                                                                 |
| **12** | **Full-screen Lessig/Takahashi rhythm**  |        4/5 |             4/5 |             5/5 | Excellent counterpoint to dense regions: periodically explode one phrase into the entire screen to reset attention.[^22][^24]                                                                        |

My strongest overall recommendation is to make the system **alternate between density and release** rather than choosing one text density for an entire presentation.

A sequence might look like:

> narrow reading rail with prose  
> → paragraph compresses into three pinned concepts  
> → photograph takes over  
> → two annotations appear on the photograph  
> → one phrase expands full-screen  
> → phrase contracts into the heading of a card  
> → three evidence cards arrive  
> → cards collapse into a small causal diagram  
> → diagram remains while the next reading rail begins.

That is qualitatively different from “a deck with some text animations.” It becomes a **visual language in which information changes form as its rhetorical role changes**.

The research also suggests one final constraint worth keeping: motion should remain subordinate to comprehension. Progressive disclosure and cueing can genuinely help attention and learning, but animation by itself is not automatically superior to static information; recent work on animated visualization explicitly notes that animation can become confusing or overwhelming and often requires narrative guidance. Accessibility guidance likewise recommends allowing non-essential animation to be reduced or stopped.[^66][^67][^68]

The richest target, then, is not “maximum animation.” It is **maximum correspondence between meaning and behavior**: words appear because an idea has entered the argument, move because their relationship has changed, remain because they still matter, disappear because they no longer do, and sometimes become a diagram because the audience no longer needs the sentence that originally explained them.

## Sources

[^1]: [Saul Bass Collection | Oscars.org | Academy of Motion Picture Arts and Sciences](https://www.oscars.org/film-archive/collections/saul-bass-collection)

[^2]: [Sherlock Title Sequence - Peter Anderson Studio](https://www.peterandersonstudio.co.uk/projects/sherlock-title-sequence)

[^3]: [GDC Vault - Designing Text UX for Effortless Reading](https://www.gdcvault.com/play/1025104/Designing-Text-UX-for-Effortless)

[^4]: [Pentiment director explains how going all-in on fonts helped elevate the medieval Detective RPG.](https://www.gamedeveloper.com/design/pentiment-director-explains-how-going-all-in-on-fonts-helped-elevate-the-medieval-detective-rpg-)

[^5]: [Solari di Udine, Italy. Split Flap Board Flight Information Display System. 1996 | MoMA](https://www.moma.org/collection/works/91954?package_id=TIFE&page=1&sov_referrer=package)

[^6]: [Isotype representing social facts pictorially](https://benjamins.com/catalog/idj.17.3.06bur)

[^7]: [Quibi and Vox Media Studios Expand Partnership with New Daily Explainer Show – Vox Media](https://www.voxmedia.com/2020/4/20/21228082/quibi-and-vox-media-studios-expand-partnership-with-new-daily-explainer-show/)

[^8]: [Principles for Managing Essential Processing in Multimedia Learning: Segmenting, Pre-training, and Modality Principles (Chapter 13) - The Cambridge Handbook of Multimedia Learning](https://www.cambridge.org/core/books/abs/cambridge-handbook-of-multimedia-learning/principles-for-managing-essential-processing-in-multimedia-learning-segmenting-pretraining-and-modality-principles/DD24C2F48B9B1277CE59F78276110258)

[^9]: [A Meta-analysis of the Segmenting Effect | Educational Psychology Review | Springer Nature Link](https://doi.org/10.1007/S10648-018-9456-4)

[^10]: [Learner control of the pacing of an online slideshow lesson: Does segmenting help? - Mayer - 2019 - Applied Cognitive Psychology - Wiley Online Library](https://onlinelibrary.wiley.com/doi/10.1002/acp.3560)

[^11]: [The Signaling (or Cueing) Principle in Multimedia Learning (Chapter 17) - The Cambridge Handbook of Multimedia Learning](https://doi.org/10.1017/9781108894333.022)

[^12]: [Signaling text-picture relations in multimedia learning: A comprehensive meta-analysis - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S1747938X15000664)

[^13]: [Video: Designing text UX for effortless reading](https://www.gamedeveloper.com/design/video-designing-text-ux-for-effortless-reading)

[^14]: [Disco Elysium's Text Box Design Is Inspired By How We Use Computers And... Twitter](https://gamermatters.com/disco-elysiums-text-box-design-is-inspired-by-how-we-use-computers-and-twitter/)

[^15]: [TV News Doesn’t Look Like It Used To, and It’s Still Evolving – Eye on Design](https://eyeondesign.aiga.org/tv-news-doesnt-look-like-it-used-to-and-its-still-evolving/)

[^16]: [CNN rolls out new insert graphics in conjunction with its 43rd birthday - NCS | NewscastStudio](https://www.newscaststudio.com/2023/06/01/cnn-new-graphics-chryons-lower-thirds/)

[^17]: [North by Northwest (1959) — Art of the Title](https://cdn.artofthetitle.com/title/north-by-northwest/)

[^18]: [Panic Room (2002) — Art of the Title](https://www.artofthetitle.com/title/panic-room/)

[^19]: [Scott Pilgrim vs the World (2010) — Art of the Title](https://www.artofthetitle.com/2011/01/03/scott-pilgrim-vs-the-world/)

[^20]: [Prepare speakers and program](https://www.ted.com/tedx/organizer-guide/prepare-speakers-and-program)

[^21]: [10 tips for better slide decks | TED Blog](https://blog.ted.com/10-tips-for-better-slide-decks/)

[^22]: [Visuals - Presentation Zen](https://presentationzen.blogs.com/presentationzen/visuals/page/7/)

[^23]: [Lawrence Lessig's Supreme Showdown | WIRED](https://www.wired.com/2002/10/lessig-3/)

[^24]: [How to Escape the PowerPoint Prison - IEEE Spectrum](https://spectrum.ieee.org/how-to-escape-the-powerpoint-prison)

[^25]: [About PechaKucha](https://www.pechakucha.com/about)

[^26]: [About — Ignite Talks | Enlighten us, but make it quick!](https://www.ignitetalks.io/about)

[^27]: [BBC Six O'Clock News (1984) | Ravensbourne University London](https://www.ravensbourne.ac.uk/bbc-motion-graphics-archive/bbc-six-oclock-news-1984)

[^28]: [Tracing The Evolution of Television’s Electronic Graphics Systems in the U.S. | TV Tech](https://www.tvtechnology.com/features/tracing-the-evolution-of-televisions-electronic-graphics-systems-in-the-us)

[^29]: [CNN starts hitting the 'undo' key on font updates in graphics - NCS | NewscastStudio](https://www.newscaststudio.com/2023/06/27/cnn-reverting-graphics/)

[^30]: [SCR36: Providing a mechanism to allow users to display moving, scrolling, or auto-updating text in a static window or area | WAI | W3C](https://www.w3.org/WAI/WCAG21/Techniques/client-side-script/SCR36.html)

[^31]: [News ticker](https://en.wikipedia.org/wiki/News_ticker)

[^32]: [What Sherlock's Text Messages Tell Us About Ourselves | WIRED](https://www.wired.com/2014/02/sherlock-tech/)

[^33]: [Stranger Than Fiction | Motiongraphics.London](https://motiongraphics.london/stranger-than-fiction/)

[^34]: [Panic Room (2002) — Art of the Title](https://d.cdnv2.artofthetitle.com/title/panic-room/)

[^35]: [Se7en (1995) — Art of the Title](https://cdn2.artofthetitle.com/title/se7en/)

[^36]: [Stranger Things (2016) — Art of the Title](https://www.artofthetitle.com/title/stranger-things/)

[^37]: [Videogame Dialogues: Writing Tools And Design Ideas](https://www.gamedeveloper.com/design/videogame-dialogues-writing-tools-and-design-ideas)

[^38]: [Documentation/components/text-box.md at master · Monogatari/Documentation · GitHub](https://github.com/Monogatari/Documentation/blob/master/components/text-box.md)

[^39]: [Critical Play Project: Case Study (Dialogue UI) – Tom Martin's Development Log](https://tommartin.myblog.arts.ac.uk/2021/04/14/critical-play-project-case-study-dialogue-ui/)

[^40]: [Stock Ticker | National Museum of American History](https://americanhistory.si.edu/collections/object/nmah_703474)

[^41]: [Western Union Telegraph Stock Ticker | Smithsonian Institution](https://www.si.edu/object/western-union-telegraph-ticker-receiver%3Anmah_739453)

[^42]: [MoMA | Hacking the Solari](https://www.moma.org/explore/inside_out/2011/09/30/hacking-the-solari/)

[^43]: [BBC Archive: Ceefax and the birth of interactive TV | BBC Mirror](https://bbcinsight.pages.dev/articles/cvg360rr91zo)

[^44]: [Vox Creative expands its video offering for advertisers with The Explainer Studio – Vox Media](https://www.voxmedia.com/about-vox-media/2017/10/13/16459628/vox-creative-expands-its-video-offering-for-advertisers-with-the-explainer-studio/)

[^45]: [About our YouTube channel | kurzgesagt](https://kurzgesagt.ext.nextly.solutions/what-we-do?visit=videos)

[^46]: [Scott Hudson | Research](https://www.cs.cmu.edu/~hudson/research.html)

[^47]: [Kinetic Typography](https://www.cs.cmu.edu/~johnny/kt/)

[^48]: [The best kinetic typography | Creative Bloq](https://www.creativebloq.com/typography/examples-kinetic-typography-11121304)

[^49]: [12 inventive uses of typography in music videos | Creative Bloq](https://www.creativebloq.com/typography/typography-music-videos-11121409)

[^50]: [Isotype Revisited | Introduction](https://isotyperevisited.org/2012/08/introduction.php)

[^51]: [How Pew Research Center uses small multiple charts | Pew Research Center](https://www.pewresearch.org/decoded/2018/12/20/how-pew-research-center-uses-small-multiple-charts/)

[^52]: [Principles of Effective Data Visualization: Patterns](https://doi.org/10.1016/j.patter.2020.100141)

[^53]: [Segmenting Principle (Chapter 9) - Multimedia Learning](https://www.cambridge.org/core/books/abs/multimedia-learning/segmenting-principle/37240877DDA0362355ADB39936027982)

[^54]: [Effects of Visuospatial Cues on Instructional Static and Dynamic Visualizations on Learner Mental Model Constructions - ScienceDirect](https://www.sciencedirect.com/org/science/article/pii/S1548390822000314)

[^55]: [Cueing animations: Dynamic signaling aids information extraction and comprehension - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0959475212001004)

[^56]: [How many words do we read per minute? A review and meta-analysis of reading rate - ScienceDirect](https://www.sciencedirect.com/science/article/pii/S0749596X19300786)

[^57]: [How many words do we read per minute? A review and meta-analysis of reading rate](https://biblio.ugent.be/publication/8647789)

[^58]: [Typography | U.S. Web Design System (USWDS)](https://designsystem.digital.gov/components/typography/)

[^59]: [Typography  |  web.dev](https://web.dev/learn/design/typography/)

[^60]: [Exploring the Effect of Animation and Progressive Revealing on Diagrammatic Problem Solving | Springer Nature Link](https://doi.org/10.1007/11783183_31)

[^61]: [Icon Usability - NN/G](https://www.nngroup.com/articles/icon-usability/)

[^62]: [Icon Usability: When and How to Evaluate Digital Icons - NN/G](https://www.nngroup.com/articles/how-to-test-digital-icons/?lm=usability-data-in-analysis&pt=article)

[^63]: [Behind Isotype Charts: The Design of Number-Fact Pictures | Visible Language](https://journals.uc.edu/index.php/vl/article/view/5935)

[^64]: [Goldfinger: The Design of an Iconic Film Title | MoMA](https://www.moma.org/calendar/exhibitions/1304)

[^65]: [The Kinetic Typography Engine:](https://www.cs.cmu.edu/~johnny/academic/KT_Engine_UIST2002.pdf)

[^66]: [Design guidelines for animated data visualization based on perceptual capacity limits | Cognitive Research: Principles and Implications | Springer Nature Link](https://link.springer.com/article/10.1186/s41235-026-00724-y)

[^67]: [Understanding Success Criterion 2.3.3: Animation from Interactions | WAI | W3C](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions)

[^68]: [C39: Using the CSS prefers-reduced-motion query to prevent motion | WAI | W3C](https://www.w3.org/WAI/WCAG22/Techniques/css/C39)
