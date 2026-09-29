# Is a full 3D render in WebGL feasible?

The request, 2026-09-28, as the user gave it in the session.

In tasks/2026-09-27-canvas-2d-planning we designed a simple 3D animation
system, with significant limitations, including no animation of the
mechanism, and rotation about a single horizontal axis, and significant
complications if we want to add things like the keyless works which aren't
vertical extrusions.

An alternative would be a full 3D render in WebGL, which would get rid of all
of those problems. But is it feasible?

Our current illustration theme seems easy enough, no need for textures or
lighting. The lines on all the edges could be a cause for concern.

Consider the vertex shader techniques in this blog post:
https://mattdesl.svbtle.com/drawing-lines-is-hard

Specifically:

> This demo above expands the stroke in the vertex shader, where the thickness
> is a uniform. We submit two vertices for each point in our path, and pass
> the line normals and miter lengths as vertex attributes. Each pair has one
> normal (or miter) flipped, so that the two points are pushed away from the
> centre to form a thick line.
>
> ```glsl
> attribute vec2 position;
> attribute vec2 normal;
> attribute float miter;
> uniform mat4 projection;
>
> void main() {
>     //push the point along its normal by half thickness
>     vec2 p = position.xy + vec2(normal * thickness/2.0 * miter);
>     gl_Position = projection * vec4(p, 0.0, 1.0);
> }
> ```
>
> The inner stroke effect on the left (click the canvas to animate it) is
> created in the fragment shader using the signed distance from centre.

Could this, or some similar technique, be useful?

The bottom of that web page also lists "Other Approaches".

To create the WebGL model itself, you can take inspiration from the famous
Bartosz watch WebGL model here: https://ciechanow.ski/js/watch.js

Later in the same session:

- If you haven't already, you should create a separate task for this WebGL
  planning.
- Bartosz's lines aren't nearly thick enough for us.

On 2026-09-29:

- I agree that center of the line visible is the current best. Is there
  anything that could change that decision?
- All three hands are floating in space above the mechanism, they need to be
  lowered to touch their arbors, so the chapter ring also needs to be
  lowered. The pallet is also too high it doesn't touch the escape wheel, so
  the whole escapement needs to be lowered.
- In renderer.js I don't see where the geometry of the individual watch parts
  is defined, e.g. the arbor location and number of teeth of the center
  wheel. Where does that live?
- Please also render the case and strap, everything that's in the current 2D
  SVG cover image.

Later on 2026-09-29:

- Let's commit to center of the line visible, you can remove the other code
  paths.
- What do you think of committing to the WebGL version for the presentation
  as a whole? Don't generate the SVG at all.
- Please test the presenter view, export and a visible window.

Later on 2026-09-29 (after the canvas 2D task was closed):

- Should we check that fading of the non-hairspring parts works, or is it
  obvious that it will?
- Don't keep the balance, but let's try keeping the stud.
- Sure, run the fade check.
- The sequence for the first two slides of the talk is:
  - Start with the cover slide, including the text of the talk name (in the
    test, it's fine to use other text).
  - On click, the cover text fades as we zoom to the hairspring, then the rest
    of the model fades until we have just the hairspring and stud.
  - Then we tilt a little while animating, to show that this is a ribbon, not
    a line.
  - Then wait for a click. On click, the animation waits until the next
    extreme (maximum wound or maximum unwound) where it's momentarily still,
    then we transition to a non-physically-realistic animation where it moves
    to its center position, the position where a real hairspring would be
    when it was at rest. There were a few different methods proposed; pick
    whichever one you think works best.

Later on 2026-09-29 (after the opening was built):

- renderer.js assumes extrusions. That's an artifact of the fact we're doing
  watch parts, like wheels. In a Special Relativity talk, we might have train
  cars with windows and people running in them. The train cars can have
  rounded tops. The Apollo program LEMs are not formed of extruded parts.
  What's the best way to handle this? Can we simply relax the extrusion
  requirement, and have the caller provide arbitrary 3D surfaces? Does
  anything need to change with the lines or clips?
- Add it to the WebGL plan.
- Also, I think JavaScript should generate the surfaces/walls/lines. This
  would be custom JavaScript for the watches talk; each talk would get custom
  JavaScript to generate whatever's needed for the talk. Some offline thing
  still runs the optimiser to find the arbor locations, number of teeth, etc.
  But JavaScript can turn those Wheel classes into detailed geometry for the
  renderer. What are the pros and cons of generating the low level geometry
  that's passed to renderer.js on load in JS vs ahead of time in Python? What
  does Bartosz do in watch.js?
- Should we be using TypeScript instead of JavaScript?
- Yes, add it to the plan.

On 2026-09-29, to close the task:

- Ok, we're ready to close this planning task and move to a new
  implementation task. Before we do, please create a task to implement the
  WebGL and rip out the SVG stuff. Create a directory and write out
  instructions.md. Write out all steps that need to happen. Port renderer.js
  to TypeScript, and any other changes needed to it. Where does it get the
  geometry? Everything that a simple cheap AI model would need to implement it
  successfully. Also, update the main docs/ directory with the decision to use
  WebGL, and all the details to keep in mind when creating new slides in this
  talk, or even slides in completely different talks. Make sure we add
  linting, formatting and other static analysis tools that are best practices
  for TypeScript. Please ask me about anything you're unsure of or that I
  haven't answered already.
- Answers: the renderer lives in the talk for now; slide 2's title shows after
  the zoom; the timekeeper cards stay SVG; barroom.py and motion.py take PNG
  input; keep the clip discs.
