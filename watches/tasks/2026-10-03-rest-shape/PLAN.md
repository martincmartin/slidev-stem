# Slide 2: show the rest shape

## Scope and sources

Add a static rest outline and a `Rest Shape` callout to slide 2.
Keep the outline through the curl, the crossfade, and the resumed hairspring.
Hide it when the audience leaves the slide. Do not commit.

Read [watch.md](../../docs/watch.md), [slide-patterns.md](../../docs/slide-patterns.md),
and [measurements.md](../../docs/measurements.md) before this analysis.
Also read the house WebGL, illustration, theme, legibility, and talk rules.
The new work is a rest reference. The existing docs cover only the moving board.

The SVG generator already samples a curl into the projected hairspring at rest.
The component drives one paused SMIL clock. The theme already loads IBM Plex Sans 600.
Keep the current view, click count, and animation durations.

## Options and ranking

| Rank | Option                                            | Benefits                                                                                              | Costs                                                                                                   |
| ---- | ------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1    | Add a rest outline and leader to the existing SVG | One clock synchronizes both curls. The final outline already matches the spring. No renderer changes. | The component must keep the rest layer visible after the board fades. The SVG gains sampled curl paths. |
| 2    | Add a separate SVG overlay in Vue                 | Independent layer visibility. No WebGL changes.                                                       | Two clocks or explicit time transfer. More repeated geometry and lifecycle code.                        |
| 3    | Add a WebGL rest spring plus an SVG rest board    | Each ghost uses its subject's renderer.                                                               | Two render paths, a handoff, and changes to the shared scene contract for one slide.                    |

Choose option 1. Generate the ghost from the straight board at zero deflection.
Apply the existing segment-angle curl with the existing duration and start time.
Use no bend or swing animations on the ghost.
At the end of the curl, keep that same outline as the hairspring ghost.
No ghost crossfade is necessary because both rest shapes are identical.

Use unfilled, dashed outlines in the theme's muted role, with strokes on the house ladder.
Keep the label on the right. Move the leader endpoint with the ghost during the curl.
Use the loaded sans font at weight 600. Check the computed font in both browsers.

The first isolated screenshots used 3 px ghost strokes.
At the design venue, the board ghost held 3.08:1 and the spring ghost held 3.01:1.
These margins are below the measurement noise described in the house legibility doc.
Use 4 px ghost strokes for more margin. Keep the leader at 2 px.
Save both measurements for comparison.

## Implementation and verification

1. Save the relevant source and doc inputs in this task.
2. Add sampled ghost curl paths and a leader to the generator. Regenerate the SVG.
3. Keep the component mounted and visible for the rest reference through clicks 3 and 4.
4. Update the current watch docs and drawing measurements.
5. Format the project and run `uv run ../tools/validate.py`.
6. Check all four clicks, reverse clicks, and slide exit in Chromium and Firefox.
7. Verify that the board moves while its ghost stays fixed. Verify the same for the resumed hairspring.
8. Save screenshots, browser assertions, final source copies, and the result in this task.

## Result

Option 1 is implemented. Both browsers pass the saved-deck checks, with no outside requests.
All 21 canonical talk checks pass. No commit was made.
The selected ghost strokes hold 3.24:1 for the board and 3.38:1 for the spring at the design venue.
The SVG grows from 658,744 to 1,067,252 bytes because the ghost curl adds sampled paths.
With gzip, the corresponding sizes are 204,975 and 344,673 bytes.
The existing board and pool groups remain byte-identical.
The full results and saved tools are in [README.md](README.md).
