# Perpendicular velocity for the rest-shape leader

## Scope

The user requests squared velocity perpendicular to the leader's final segment.
The subsequent request requires a whole-path derivation before implementation.
Produce [the calculus-of-variations report](../optimal-leader-line-from-calculus-of-variations.md).
Do not change the generator, drawing, animation, or numerical spike.

Read [watch.md](../../../docs/watch.md), [measurements.md](../../../docs/measurements.md), and the house illustration and legibility rules before this analysis.
The current implementation scores candidates using displacement from the preceding frame.
The new analysis treats the entire contact path as the unknown.

## Options and ranking

| Rank | Option                                                                      | Benefit                                                     | Limitation                                                              |
| ---- | --------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1    | Derive the exact whole-path perpendicular-velocity objective                | Matches the latest request and accounts for future movement | Necessary conditions alone do not prove global optimality               |
| 2    | Derive a problem with an added total-speed constraint or penalty            | Controls motion along the leader as well                    | Adds a requirement or changes the requested objective                   |
| 3    | Replace the current per-frame displacement term with perpendicular velocity | Small local change                                          | Does not account for future costs; the user has deferred implementation |

Choose option 1. Discuss option 2 only as an extension for degenerate geometry.
Do not execute option 3.
The earlier plan to retain numerical weights for a local trial is superseded.
No replacement weights are selected.

## Procedure and checks

1. Define the moving outline, admissible contact paths, and fixed leader geometry.
2. Form the integrated cost with actual time and the requested velocity component.
3. Derive the first variation, Euler–Lagrange equation, and endpoint conditions.
4. Derive second-order tests and explain degenerate, nonsmooth, and constrained cases.
5. Check the result with an exact circular-arc example and primary mathematical references.
6. Format and check the Markdown links. Verify that production files have not changed during this analysis.

Preserve the previous source and evidence in `leader-correction/`.
The original curl remains available in the parent task's first snapshots.
The input snapshots here capture the code before this analysis.

## Result

The report derives a boundary-value problem for the full contact path.
It gives the perpendicular penalty as $r^2\dot\phi^2$ and identifies where it loses control of endpoint speed.
It distinguishes stationary paths, local minima, and global minima.
No velocity-cost implementation or numerical trial was made.
