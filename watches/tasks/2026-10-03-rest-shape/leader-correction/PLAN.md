# Rest-shape leader correction

The user requests a short leader for the straight board and a trial of weighted routing during the curl.
The score must consider length, bend angle, and movement between frames.
Keep the original curl available if the user prefers it.
The user also asks whether the leader meets the house line-width requirements.

Read [watch.md](../../../docs/watch.md), [measurements.md](../../../docs/measurements.md),
and the house [legibility rules](../../../../docs/legibility.md) before this analysis.
The new checks isolate the leader. The previous checks grouped it with the ghost and label.

## Routing options and ranking

1. Use a weighted score on the ghost's generated curves.
   This balances the three requested properties and adds no work to the live frame loop.
2. Keep the original curl and shorten only the straight board's leader.
   The user already finds the original curl acceptable. Its saved paths remain available.
3. Use the absolute closest point for every frame.
   This gives short leaders but can change the attachment point quickly.

Choose option 1 for this trial. Use the existing horizontal first segment beside the label.
Search each outline curve, then refine the best interval. Include straight joins between curves.
Use the SVG writer's curve controls so the endpoint stays on the drawn outline.

For each sampled frame, score a candidate endpoint with

$$
J = L + 60\theta + 0.25M,
$$

where $L$ is leader length in px, $\theta$ is the bend angle in radians, and $M$ is endpoint movement in px.
The first segment is fixed, so its length does not affect the choice.
At the first frame, omit $M$. Use the preceding frame's endpoint for later frames.
This is a per-frame search. The weights were compared at the generator's existing frame rate.

| Rank | Candidate                      | Mean length (px) | Mean bend (degrees) | Total motion (px) | Largest step (px) |
| ---- | ------------------------------ | ---------------- | ------------------- | ----------------- | ----------------- |
| 1    | Selected: movement weight 0.25 | 244.1            | 9.89                | 549.7             | 28.44             |
| 2    | Movement weight 0.5            | 244.0            | 11.33               | 553.2             | 28.11             |
| 3    | Length alone                   | 242.7            | 13.64               | 587.9             | 33.35             |
| 4    | Movement weight 3              | 316.1            | 25.91               | 431.2             | 27.92             |

All candidates start with a leader about 79 px long at the straight board's right tip.
The selected weights reduce the largest step by 14.7% and mean bend by 27.5% against length alone.
Weight 0.5 gives a slightly smaller largest step but more bend and total motion.
Weight 3 reduces total motion, but leaves a long diagonal leader at the final spring.
The selected endpoint finishes on the spring's right side, with a horizontal leader.

## Width

The 2 px leader clears the 1.64 CSS px resolution floor.
Its isolated, blurred contrast fails the 3:1 gate.
Compare all four allowed widths on the slide background.
Select 4 px: it passes for both the board and spring and gives a stronger core than 3 px.
See `evidence/leader-widths.json` for the measurements.

## Checks and snapshots

Keep the original task's source, built deck, and evidence unchanged.
Add a dated line to its README and save this correction here.
Regenerate the SVG, update current docs, inspect both browsers, and run canonical validation.
The original curl remains in `inputs/public/diving-board.svg` and the parent task's `result/`.
