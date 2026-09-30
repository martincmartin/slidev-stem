# Plan: act on the second review of `webgl/` and `watch/`

Started 2026-09-29. The review is `inputs/review.md`. It reviewed commit
`a7444d9`. Before this task, the geometry fix (`48da864`,
`tasks/2026-09-29-geometry-problems/`) was merged to `main`. It changes
`design.ts`, `model.ts` and `generate.ts`, but every point of the review still
applies. It adds `timing.unlock`, which #1 must also check.

The rule from `tasks/2026-09-29-webgl-review-fixes/` still applies: `webgl/`
must be correct and must not leak, whatever program uses it.

## Evaluation of the review

| #   | Point                                  | Verdict                    | Why                                                                                                                                                                                                                                                     |
| --- | -------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Timing invariants                      | Agree; Medium, not High    | With `period` 0, `stepper` does not stop. But `design.json` is written by `art/watch_design.py`, not by a user. Check ranges in `readDesign`, and guard `stepper`.                                                                                        |
| 2   | Subject A to subject B swaps at once   | Agree: a real bug          | `show()` sets `keep` before any phase. From A at rest 0 to B at rest 0, no rest phase runs, so B replaces A on the next frame. The talk has one subject, so it is latent.                                                                                |
| 3   | Geometry helper inputs                 | Agree in part              | Finite, ordered heights for `extrude`/`ribbon`, and `checkAffine` in `transformMesh`: cheap. The Float32 overflow of a normal matrix: not for authored geometry.                                                                                        |
| 4   | A frame that throws stops the stage    | Agree to document; Low     | Fail-fast is correct: a partly drawn frame must not continue. The policy is not written down.                                                                                                                                                         |
| 5   | Duplicate names                        | Agree                      | `checkScene` checks groups and meshes for duplicates, not views and subjects. `readDesign` does not check wheel names.                                                                                                                                |
| 6   | `Number()` on frontmatter              | Agree                      | A bad `watchTilt` becomes `NaN`, which the renderer rejects in the animation frame: the stage stops during the talk.                                                                                                                                  |
| 7   | Partial GL allocation                  | Disagree in part           | `createShader` returns `null` when the context is lost (WebGL spec), so `ContextLost` is right. The review missed a real bug: `target()` stores the target before its completeness check, so a retry returns the incomplete target without a check.     |
| 8   | Read-only types                        | Agree for `Design`         | The scene types are read-only since the last task. `Design.wheels` and `WatchGroups.wheels` are not. Use `readonly`/`ReadonlyMap`; do not copy.                                                                                                     |
| 9   | Probe checks free only on success      | Agree                      | A failed check leaves its renderer and context live for the next checks.                                                                                                                                                                              |
| 10  | Split `renderer.ts` and `generate.ts`  | Not now                    | A large diff with no change in behaviour. The review also says not to split for line count alone.                                                                                                                                                    |

The review says that it did not run the browser checks and that `pnpm test`
does not include them. They run: `art/watch_stills.py` runs them, and
`validate.py` runs that.

## #2: from one subject to another

1. **Blend two compositions** (the review's first idea): draw A's fade and B's
   fade, and mix them. It needs a third picture in the renderer. The talk does
   not need it.
2. **Reject a change of subject** with `check`. Cheap, but a program that has
   two subjects cannot use the stage.
3. **Go through "no subject":** the rest fades in around A, then the stage
   goes towards B as usual (camera, fade, tilt). The subject that the fade
   keeps changes only at the start of a fade towards a subject, when all of
   the scene shows. Chosen: no new drawing, and each frame shows what is
   on the screen, as the stage's header says.

The kept subject becomes a value of the stage, next to the view, the tilt and
the rest. A rest phase towards 0 carries the subject that it keeps.

## Order of work

1. #2, with a browser check.
2. #6, #5, #1, the `target()` bug (#7), #9, #3 (the cheap part), #8, #4 (a
   comment).
3. `uv run ../tools/validate.py`.

## Log

### 2026-09-29

**#2.** `webgl/stage.ts`: the kept subject is a value of the stage
(`Values.subject`), not a field that `show()` sets at once. From subject A to
subject B, the rest first fades back to 1 while A is kept. The fade towards
B then carries B, and B is kept from its start. The fade to no subject keeps
A until the rest is back. New browser check in `webgl/probe/checks.ts`; the
test scene has a second subject. My first version of the check failed at its
last step: it began while the stage still faded away from A, so A was
correctly kept. The step now starts from a settled state.

**#6.** `watch/state.ts`: `watchState` checks each field and throws with its
name. `watchTilt` must be a finite number, `watchSettle` a whole click number
from 0, `watchOnly` and `watch` non-empty strings. Only an absent field takes
its default. `global-bottom.vue` calls `watchState` for every slide at load,
so a bad field shows at load, not in an animation frame. New test:
`watch/state.test.ts`.

**#5.** `checkScene` refuses two views or two subjects with one name.
`readDesign` refuses two wheels with one name. Tests: `webgl/scene.test.ts`,
`watch/design.test.ts` (new).

**#1.** `readDesign` checks the timing's ranges (`readTiming`): `period`,
`amplitude`, `bank`, `hourRatio` > 0; `0 < pinArc < amplitude` (the
arccosine in `tickWindows`); `unlock` in $[0, 1)$ (new in the geometry fix);
`fourthLoop` a whole number of periods. A point must be finite. `stepper`
checks that its duration is a whole number of periods, at least 1; its loop
now runs to `periods`, not `Math.round(periods)`, which could put key times
after 1.

**#7.** `Renderer.target()` keeps a picture only after its completeness
check, and frees its framebuffer and textures if it fails. No test: I know no
way to make a framebuffer incomplete on purpose in Chromium with these
formats.

**#9.** The probe's runner gives each check an `own()` function. What a check
owns is disposed when the check ends, even if it fails. `expected()` frees its
renderer in a `finally`.

**#3.** `extrude`, `ribbon` and `ribbonGeometry` check that the heights are
finite and that the bottom is below the top. A decal may be flat: the chapter
ring's decals have bottom = top. `transformMesh` calls `checkAffine`. Tests in
`webgl/mesh.test.ts`.

**#8.** Every field of `Design` and its parts, `WatchGroups` and `Watch` is
`readonly`, and their collections are `readonly` arrays and a `ReadonlyMap`.
`readDesign` makes each wheel as a `Draft<Wheel>`, because it sets `driven`
after it has made every wheel. `Point2` stays a mutable tuple: it is used
everywhere in `webgl/`.

**#4.** The stage's header says that a frame that throws stops the loop, and
that `start()` runs it again.

**Checks.** `tools/pixel_regression.py` (a copy from
`../2026-09-29-webgl-review-fixes/`) drew 10 frames with the code before this
task (the geometry fix, `48da864`) and after it. They are byte-identical:
`evidence/before/`, `evidence/after/`. `uv run ../tools/validate.py` in
`watches/`: all 18 checks pass. Unit tests: 37 (27 before).

**Docs.** `stem/docs/webgl.md`: a subject-to-subject change, the checked
frontmatter and `design.json`, and a frame that throws.
`watches/docs/slide-patterns.md`: a key of the wrong kind stops the deck at
load.

### Close

Closed 2026-09-29 by the user.
