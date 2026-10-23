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


2026-10-07: [Smoke navigation](../../watches/tasks/2026-10-07-full-validation-profile/README.md) replaces exhaustive navigation in validation. Reuse now applies to print and smoke navigation. Exhaustive navigation is diagnostic only.

2026-10-23: the print and privacy checks are TypeScript (`watches/art/print-check.ts`, `privacy-check.ts`). The deck key covers every file in a talk's `art/`, except `__pycache__`, and the talk's `pnpm-lock.yaml`, which picks the engines of those checks.

2026-10-23: the smoke check is TypeScript (`tools/smokecheck.ts`). The deck key covers every file in the house's `tools/` (except `__pycache__`, as for `art/`), and the root's `package.json` and `pnpm-lock.yaml`, which pick the engines of the house's TypeScript checks.
