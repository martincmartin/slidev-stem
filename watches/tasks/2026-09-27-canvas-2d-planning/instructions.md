# Design of Canvas Based Animated Illustrations

In tasks/2026-09-25-canvas-2d-watch we explored the idea of not using the built
in SVG renderer, and instead using a canvas for rendering, animating, zooming
and fading our animated illustrations.  The original motivation, that zoom
wasn't smooth in Firefox, is largely gone as Firefox 157 is smooth enough.

Still, the decision was made to go ahead with parallel development, being able
to use both SVG and canvas.  The idea is an insurance policy: if something is
exceedingly awkward to represent in SVG, or if SVG performance tanks or bugs
appear in SVG implementations, we can fall back on canvas.  And if some feature
would be too hard to add to canvas, but is already in SVG, we can go with that.

So let's think about the architecture and design of the canvas implementation
now, get it right as much as possible now.  Ideally we'd save effort in the
future by making the canvas similar to the SVG, e.g. support the subset of SVG
we actually intend to use.

# Features to Support

1. Simple 3D.  These should be mostly extrusions of existing parts.  A wheel
   without the pinion, for example, is the same at every cross section; the
   pinion has the same property; and the full wheel is just the two attached
   together.  In our slide deck the mainspring's barrel will probably be the
   same, as this is a skeleton watch for explaining how it works, so doesn't
   need a top or bottom cover.  Please think of and list all the parts of a
   watch we could want in our talk and see if any are more complicated than a
   few extrusions put together.  Include the minute wheel, hour wheel.  Optional
   parts, that we may not need but would like to be possible in the design,
   include:
   
   - Canon pinion, center wheel shaft, driving wheel
   - Axles and rubies
   - Click, click spring, crown wheel, ratchet wheel
   - Keyless works, including stem, winding pinion, sliding pinion, corrector lever and setting lever, setting wheel, yoke, setting lever jumper and anything else.
   
2. Pan/zoom

3. Fading unused elements out.  In general, separate visibililty/opacity of
   different sub assemblies or objects.

4. Hiding the whole watch model, and displaying a different model. e.g. when
   talking about the hairspring, I may want to switch to a model of a metal
   ruler over the edge of a desk, and show that when you press down the free
   end, it deforms, then when you let go, it oscillates up and down like a
   diving board.  This is to get people to understand the idea of an oscillating
   strip of metal, which is easier to understand with a straight piece before
   going into the coiled hairspring.  So I want to get rid of the hairspring
   model for a while, switch to a new model, then later get rid of that and
   bring back the hairspring/caliber model.

5. One thing that would be nice to support: a little logic around switching
   timing/automation between animations.  For example, when we zoom in to the
   hairspring, then fade away the rest of the caliber, we want the hairspring to
   come to a stop.  But rather than just stop it mid-swing, it might be nice if
   e.g. we wait until the next "maximum" extent of its animation, where is it
   most tightly wound and momentarily at rest, then switch to an animation that
   moves it from this extent to the mid point where it would be at rest, using a
   quadratic speed profile, which is physically unrealistic, but does nicely
   bring it to rest at the correct "half way" position.  The point is, you need
   to wait until a certain existing animation frame (e.g. "maximum extend/most
   tightly wound"), then switch it to a different animation path (quadratic
   velocity profile to rest at mid point).  Is this possible with SVG, e.g. to
   tell in JavaScript where a given SVG element (the hairspring) is in its
   animation, and switch it to another one?  If not, this could be a feather in
   Canvas' cap.

# Out of Scope

1. Click/hover individual parts


# Design Questions

1. Should the canvas code read the SVG and implement it, turning the canvas code
   into an alternate implementation of SVG display, animation, zoom, and fading,
   albeit only for the subset we're actually using?  Or should our Python code
   output two formats, an SVG plus something directly for canvas?  The Python
   could directly output Javascript code to do the drawing of each shape
   (codegen), or could output some intermediate representation (what format?
   JSON? A custom format?) that is then read & parsed by Javascript and used to
   direct drawing.  Note that I want to reuse this for other non-watch talks,
   e.g. render a train in a talk on Special Relativity, a Mach-Zehnder
   interferometer for a QM talk, an Apollo style LEM for a lunar lander video
   game talk, etc.

2. We want to be able to do orthographic 3D renders of watch parts.  The camera
   will rotate about a fixed axis, e.g. the x axis.  The 3D parts should be
   largely simple extrusions.  Should the canvas code itself handle the
   orthographic projection given the 3D model and the camera path, or should
   Python do that ahead of time, encoding it as an animation, as it already
   needs to do for SVG?  e.g. a hairspring is a curved line currently when seen
   edge on, but when you tilt the camera to 45 degrees about the x axis, you see
   it's a ribbon that's curved. Parts of that ribbon will occlude other parts.
   How should this be handled, in both the SVG and Canvas case?  Would Canvas
   have to do some kind of depth sorting of various stretches of the hairspring?
   How can SVG handle these?

3. Should we use OffscreenCanvas?  Can we build it so that we can render it
   either way?
   
4. If we go with SVg as the file/wire representation, what about using an
   existing SVG parser/renderer, like Canvg or SVG.js?  Or just use DOMParser?

5. What language?  Javascript?  Typescript?  Rust -> WebAssembly?

6. Use PixiJS?  Paper.js?  Konva.js?

7. Modern Canvas has Path2D that can understand SVG 'd' syntax.  Use that?

# 3D Rotation While Animating Is Probably Too Hard

Picture one of the wheels meshing with the pinion of the next wheel.  Turning
the existing line drawings into a 3D representation isn't that hard since
they're just extrusions, so each line segment becomes a quadrilateral.  We could
compute the depth of the center of each one, and depth-sort them, putting them
in the SVG back to front.  If there's no animation, and the scene only rotates
one direction from horizontal, e.g. only positive rotation about the x axis up
to 90 degrees, then this depth order shouldn't change.  Please check that
statement.  But if we allow animation, then at each animation timestep, the
order could change, or even which side (front or back) is facing us, e.g. as a
tooth rotates around from back to front, right at the left-most or right-most
extent it would swap from front to back.  Dealing with those changes, while the
camera is rotated, sounds computationally expensive per-frame, and would be hard
to do offline in Python, instead perhaps moving the computation to the browser
(JavaScript, TypeScript, Rust -> WebAssembly).  We're essentially developing an
online/realtime 3D graphics package, which seems like more complexity than we
want for this project.  I think we should only do 3D rotation while the
illustration is stationary.  Trying to do it while it's rotating would only be
practical with WebGL or some other 3D engine.  What do you think.

To do the hairspring, assuming the camera restricted to rotating around the x
axis between 0 (the current vertical) and +90 (camera looking edge-on from the
bottom), we could "cut" it into 180 degree segments, where ever the ribbon
reaches its rightmost or leftmost extent. Each segment is described by a top
curve which is just a scaling/compression/squeeze plus translation along y, a
bottom curve of the same size and shape (because orthographic), connected by two
vertical straight lines (vertical on the 2D screen, because orthographic).  You
could find the depth of the center of each piece, and sort things by that depth,
emiting them back-to-front.  This could work well as long as the hairspring (and
the rest of the geometry) were static.

# General

- If you're unsure about something, it's okay to admit it. Just say you don’t know.

- When asked to generate or evaluate options, think step by step, explicitly
  consider and discuss alternatives, and at the end rank them and explain why.
  Prefer data and quantitative over qualitative.

- This is a pure planning task, so don't modify any existing code or files.
  Record your results in PLAN.md in this same directory.  You're welcome to
  write scripts to assess different options, and those scripts can refer to
  other parts files outside this task directory.  But all artifacts generated
  should live in this specific task directory.
