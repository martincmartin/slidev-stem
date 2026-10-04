# Rest-shape implementation quality review

TASK_DIR: `/Users/martin/Develop/slidev/stem2/watches/tasks/2026-10-04-rest-shape-final-review`

## Assessment

The selected implementation is readable and reasonably easy to modify. I found one validation gap to resolve before commit.

The current production source retains bend weight $15$. The experimental slide and its configuration branches are removed. The selected SVG matches the saved quarter-bend output byte for byte.

No functional defect was found in the reviewed rest-shape behavior. This assessment does not replace fresh browser checks after cleanup.

## Finding

### P2: The canonical validator does not execute the new mathematical tests

**Location:** `package.json:26`, `art/test_leader_path.py`, and `../tools/validate.py:120`.

The talk's `test` script executes only the TypeScript tests under `webgl/` and `watch/`. The canonical validator invokes that script. It does not run the Python mathematical tests.

The validator checks Python formatting, lint, and types. Its generated-art check also verifies the SVG against the generator. These checks cannot establish that the leader cost or dynamic programming remains mathematically correct.

For example, an incorrect movement formula could pass the generated-art check after someone regenerates the SVG. The independent mathematical tests would detect several such changes.

**Recommended correction:** Add `uv run art/test_leader_path.py` to the talk's existing `test` script. Retain the TypeScript tests. Update `docs/watch.md` to state that canonical validation includes these checks.

I ran the Python test file directly. All seven tests passed.

## Readability and maintenance

The implementation separates the main responsibilities into named functions:

- `curl_poses` creates the moving and zero-deflection geometry.
- `visible_rest_edge` selects the ribbon edge nearest the viewer.
- `leader_contacts` samples contact candidates.
- `leader_step_costs` evaluates the discrete objective.
- `minimum_leader_path` selects and reconstructs the complete path.
- `rest_markup` writes the reference and callout.

`LeaderDesign` holds the tunable geometry and coefficients in a frozen object. Changing a weight does not require editing the solver.

The extracted `bezier_segments` function supplies the same curves to SVG output and contact selection. This avoids a separate approximation of the rendered geometry.

The generator has grown substantially. However, its functions remain cohesive. A module split is not necessary for this change. It would add imports without simplifying the present maintenance task.

The numerical sampling uses fixed subdivision and refinement counts. These are appropriate for this smooth slide geometry. They do not establish a general solver for arbitrary deforming shapes. The docs correctly limit the optimality claim to the sampled contact graph.

## Correctness observations

The movement term uses the requested squared perpendicular endpoint velocity. It uses the physical step duration and the midpoint leader direction.

The dynamic program evaluates complete paths rather than choosing each frame independently. Its backtracking follows the stored parent indices.

The initial curl contact is fixed at the closest point on the retained edge. The short pre-curl leader remains independent of that path.

The rest reference paints after the moving board in the SVG. The top-level layer order is:

1. Pool and stand.
2. Moving board.
3. Rest reference.
4. Rest callout.

The component keeps the reference visible after the moving board fades. It stops its frame loop at the curl's end. Direct entry at the later clicks sets the completed curl pose.

I compared the generated SVG with the committed SVG. The moving board's initial geometry and all animation attributes remain unchanged for its front, top, and end faces.

## Validation coverage

The mathematical tests cover meaningful properties:

- Radial movement has zero movement cost.
- A rotated perpendicular movement has the expected cost.
- Reversing a step preserves its movement cost.
- Halving the duration changes integrated movement cost correctly.
- Full-path selection can reject the cheapest immediate step.
- Dynamic programming agrees with exhaustive enumeration on a small graph.
- Invalid durations, weights, contacts, and undefined segments fail.

The tests primarily cover movement and path selection. An independent static-cost test would be useful when changing the length or bend formula. It is not a commit blocker for the present weight change.

The frozen quarter-bend browser probes cover fixed references during oscillation, the edge switch, crossfade, resumed spring motion, exit, reentry, direct entry, and rapid click advance. Their saved evidence also includes foreground-reference pixel checks.

Those task probes are frozen evidence. They do not become recurring production checks automatically. Future lifecycle or stacking changes should rerun the relevant browser probe against a newly built deck.

## Documentation

The current docs describe the important maintenance contracts:

- The generator owns the SVG.
- The full outline gives a depth cue before curling.
- A single viewer-facing edge reduces clutter during and after curling.
- The reference stays above both subjects.
- Optimization covers the complete curl.
- Movement along the leader has no movement penalty.
- Stronger movement weighting can produce faster movement along the line.
- The reference belongs only to slide 2.
- `LeaderDesign` is the source for coefficients and sampling.
- The quarter-bend task records the selected coefficient.

The measurements match the saved quarter-bend leader results after rounding. The current slide-pattern documentation describes only the retained slide.

No additional memory entry is needed. These decisions belong in the project docs and task records, where they are already recorded.

Before closing this task, add the dated final-selection and cleanup pointers required by the task rules. Preserve the historical comparison snapshots.

## Review evidence and limits

I read the active task instructions and plan, applicable project instructions, relevant current docs, changed source, generated SVG, and saved quarter-bend evidence.

I performed these read-only checks:

- Ran `uv run art/test_leader_path.py`: seven tests passed.
- Ran `uv run art/diving_board.py --check`: passed.
- Compared the moving board geometry and animation attributes against `HEAD`: unchanged.
- Checked the generated reference paint order: reference follows the board.
- Compared the selected SVG with the quarter-bend snapshot: byte-identical.
- Searched production source and current docs for experimental configuration branches.

I did not run the full canonical validator or fresh browser sessions during this review. The saved quarter-bend validation reports all 21 checks passed. That report predates the final cleanup and does not resolve the Python test integration gap.

## Commit readiness

Resolve the test integration finding. Then run canonical validation and the planned Chromium and Firefox checks against the cleaned deck.

No broad refactor is required. No other actionable correctness finding was identified.
