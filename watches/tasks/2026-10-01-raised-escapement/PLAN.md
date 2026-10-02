# Put the escapement above the oscillator

## Request and scope

Show geometry proposals at $90^\circ$ and $75^\circ$ from vertical.
Keep the balance wheel below the hairspring. Work in a frozen prototype.

Read the current [watch rules](../../docs/watch.md),
[measurements](../../docs/measurements.md), and house
[WebGL rules](../../../../docs/webgl.md),
[illustration rules](../../../../docs/illustrations.md),
[legibility rules](../../../../docs/legibility.md), and
[colour rules](../../../../docs/theme.md).

The new work compares reversed height orders and shows actual model renders.
The existing docs describe the current model. They do not decide this change.

## Options

1. Lower the oscillator. Keep the escape wheel and flat fork at their current heights.
   Lower the balance and spring together. Add a roller and extend the balance staff.
   This preserves train meshing. It needs more depth below the mechanism.
2. Raise the escape wheel and flat fork. Keep the oscillator near its current height.
   Keep the escape pinion at fourth-wheel height. Extend its arbor to the raised wheel.
   This preserves the oscillator position. It increases the upper mechanism height.
3. Step the fork. Keep its pallet arms and escape wheel low. Raise only its mouth and lever.
   Join the two levels beside the fork pivot. This preserves train heights.
   The added step is less simple to read and construct.

Each proposal gives the balance-to-spring gap and spring-to-roller gap 2 model units.
The existing spring ribbon is 8 units high. Retain its plan geometry and length solver.
The collet remains at spring height. The fixed stud remains at the spring's outer end.
The balance staff connects the balance hub, collet, and roller.

## Method

`inputs/` preserves the model, renderer, design, and build lockfiles used here.
`prototype/` copies the model and renderer. Only the copy changes.
Use the existing WebGL mesh helpers, motion sampler, and renderer for every image.
Show the oscillator and escapement alone, with the same camera and scale for all proposals.
Also keep full-mechanism renders as evidence.
Check both stopped escapement states and sample the full balance swing.
Record actual height ranges and browser errors in `evidence/`.

## Selection

The comparison and limits are in `README.md`. The user selected A after inspecting the models.

## Interactive viewer, 2026-10-01

The user requested controls to inspect each model.
Options: extend the live deck, create a separate Slidev deck, or add a standalone page.
A live-deck change couples experimental geometry to the talk.
A separate deck adds routing and presentation controls that this task does not need.
Use a standalone page in `prototype/viewer.html`. It reuses the frozen model and renderer.
Keep the original still-render page available for image reproduction.
Provide model selection, zoom, x-axis tilt, WASD and drag panning, and both stopped states.

## Accepted layout, 2026-10-01

The user selected A. Apply its height order to the live model.
Compute heights downward from the existing fork plane instead of keeping literal proposal heights.
Add the roller to the oscillator flash subject and exclude it from the spring-only subject.
Keep slide 2's target and zoom; put its 3D camera pivot at the lowered spring's midpoint.
Validate the live deck in both browsers, including the fade and target placement.
The proposal viewer and its frozen source remain unchanged.

## Closed, 2026-10-01

A is implemented in the live deck. The roller fades on slide 2.
The camera keeps the original zoom and screen target for the lowered spring.
All 21 canonical validation checks passed. Chromium and Firefox passed the transition check.
The user approved shipment and task closure. No implementation work remains.
