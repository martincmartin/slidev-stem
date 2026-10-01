---
name: docs-audit
description: Audit or restructure a whole project's docs, or set up docs or the doccheck tool for a new project. Not for updating docs as part of a change; the global AGENTS.md "Docs" rules and the project's validation cover that.
---

# Docs audit

This applies the global `AGENTS.md` rules ("Docs", "Tasks") to a whole
project at once. Do the work in a task directory.

1. **Check each concrete claim against its source.** Counts, commands, file
   names, keys, which tool runs which check, what a script writes. Read the
   code; do not trust the doc. Record where, what it says, and what is true.
2. **Find each fact that is in more than one place**, and each value copied
   from code. A copy is where stale facts come from.
3. **Find content in the wrong file:** a sub-project's facts in the parent's
   docs, history or rejected options in a doc, one topic split across files.
4. **Before you write a summary of a source, re-read the source.** Quote
   nothing from memory. The first audit of the STEM talks found two wrong
   facts this way, one of them in its own first draft.

To add the mechanical check to a project, see `doccheck/README.md`, "Use it
in a project".
