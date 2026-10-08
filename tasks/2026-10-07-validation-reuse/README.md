# Validation reuse

The options, the measurements and the decision are in [PLAN.md](PLAN.md).

## Result

- `tools/validate.py`: `deck_key`, `PassRecord` and `Reusable`. In full mode,
  print and navigation are reusable; `--no-reuse` runs them again. The record
  is `<talk>/.validate/passes.json`, ignored by git (the root's and the talk's
  `.gitignore`).
- `tools/test_validate.py`: the key changes with the deck and each checker
  input, and not with a doc; a moved file changes it; only passes are
  recorded; a new key forgets the old passes; an unreadable record is empty;
  no deck fails by name; print and navigation are reusable only with a record.
- The policy: `AGENTS.md` ("Validate before you commit"), `docs/talks.md`
  ("Check your work") and `tools/README.md`.
- Timings of a full run before and after reuse: `evidence/runs.txt`.
