# House docs

The rules for every STEM talk: what each doc holds. When to read each one is in
[`../AGENTS.md`](../AGENTS.md), "House docs: read before you act"; keep the two
lists in step. What is true of one talk only is in that talk's `docs/` (for
`watches`: [`../watches/docs/`](../watches/docs/README.md)).

| Doc                                      | What it holds                                                                                                        |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [theme.md](theme.md)                     | the colour roles every theme fills, their gates, a slide-class override, adding a colour; the current theme (Ledger) |
| [illustrations.md](illustrations.md)     | the drawing grammar (size, colour, stroke ladder, motion), theme colours in an SVG, washes, how to draw a new one    |
| [webgl.md](webgl.md)                     | live 3D art: when to use it, the renderer and its contract, the house style in 3D, how slides drive it               |
| [navigation.md](navigation.md)           | a slide names targets, not moves: going back with no extra code, the default for each kind of animation, the check   |
| [legibility.md](legibility.md)           | the venue, the resolution and contrast floors, room light, how to read the metrics, text sizes                       |
| [talks.md](talks.md)                     | each talk as its own project: set up a clone, why, validation, upgrading a talk's packages                           |
| [export.md](export.md)                   | the forms of a talk for readers (narrated mode, article, PDF, live figures): the plan, the traps; not built yet      |
| [../tools/README.md](../tools/README.md) | each check, its commands, and which tool is the authority                                                            |

**The one-paragraph version.** Each talk uses the house theme (now Ledger: a
light field, a deep blue accent, a warm brown second), and its illustrations
follow one grammar, "Line, weighted": four stroke weights, the theme's art
colours, and files that state the size a slide shows them at. Art that turns
in 3D or moves by rules is drawn live in WebGL, in the same grammar. Every
threshold comes from one question, _can the back row of a bar read this_, and
`tools/` answers it with arithmetic. Before you commit, run
`uv run ../tools/validate.py` in the talk's directory.

**Docs and tasks.** These docs give the current rules and a summary of why.
The options, the evidence and the rejected alternatives behind each rule are
in `tasks/` and `<talk>/tasks/`, and each doc links the tasks it comes from.
Build from here; open a task only to revisit a decision.
