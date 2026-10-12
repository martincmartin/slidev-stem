// The Recap slide's stops: where the camera looks at each one, made from the
// design, so that a stop follows its touch if the design moves it. Each view
// puts its point at the middle of the slide, at the zoom that the user chose
// in the explorer; the slide's frontmatter gives the tilt and the turn
// (docs/watch.md, "The Recap slide"; tasks/2026-10-12-victory-lap/PLAN.md).

import type { Point2 } from "../webgl/mesh.ts";
import type { View } from "../webgl/scene.ts";
import type { Design, Wheel } from "./design.ts";
import { polar } from "./shapes.ts";

/** The lowest and highest heights of a part. */
export interface Layer {
  readonly bottom: number;
  readonly top: number;
}

/** The heights of the parts that the stops look at: each touch is at the
 *  middle of its wheel's body, where the wheel's teeth meet the pinion. */
export interface RecapLayers {
  /** A wheel of the train's body. */
  readonly wheel: (wheel: Wheel) => Layer;
  readonly hourWheel: Layer;
  readonly jewel: Layer;
}

/** Slide px a world unit, at each stop: the user's choices in the explorer
 *  and in the deck (2026-10-12). */
const RECAP_ZOOM = {
  motionWorks: 8,
  barrel: 3.5,
  barrelTouch: 15,
  centreTouch: 8.5,
  thirdTouch: 10,
  fourthTouch: 10,
  pallet: 10,
  jewel: 9,
} as const;

/** The point on `driver`'s pitch circle, toward `driven`'s arbor: where
 *  its teeth meet the other's leaves (or the pallet's stones). */
function touch(driver: Point2, radius: number, driven: Point2): Point2 {
  const across = [driven[0] - driver[0], driven[1] - driver[1]] as const;
  const length = Math.hypot(...across);
  return [
    driver[0] + (across[0] * radius) / length,
    driver[1] + (across[1] * radius) / length,
  ];
}

function middle(layer: Layer): number {
  return (layer.bottom + layer.top) / 2;
}

/** The Recap slide's views, in the order of its stops. */
export function recapViews(design: Design, layers: RecapLayers): View[] {
  const [barrel, centre, third, fourth, escape] = design.wheels as [
    Wheel,
    Wheel,
    Wheel,
    Wheel,
    Wheel,
  ];
  const { hour, minute } = design.motionWorks;
  const { balance, fork } = design;
  const wheelTouch = (driver: Wheel, driven: Wheel): [Point2, number] => [
    touch(driver.arbor, driver.pitchRadius, driven.arbor),
    middle(layers.wheel(driver)),
  ];
  // design points are from the watch's centre; a view's are on the slide
  const view = (
    name: string,
    [point, height]: [Point2, number],
    scale: number,
  ): View => {
    const x = design.watchCentre[0] + point[0];
    const y = design.watchCentre[1] + point[1];
    return {
      name,
      scale,
      shift: [
        design.canvas.width / 2 - scale * x,
        design.canvas.height / 2 - scale * y,
      ],
      pivot: [x, y, height],
    };
  };
  return [
    view(
      "recap motion works",
      [
        touch(hour.arbor, hour.pitchRadius, minute.arbor),
        middle(layers.hourWheel),
      ],
      RECAP_ZOOM.motionWorks,
    ),
    view(
      "recap barrel",
      [barrel.arbor, middle(layers.wheel(barrel))],
      RECAP_ZOOM.barrel,
    ),
    view(
      "recap barrel touch",
      wheelTouch(barrel, centre),
      RECAP_ZOOM.barrelTouch,
    ),
    view(
      "recap centre touch",
      wheelTouch(centre, third),
      RECAP_ZOOM.centreTouch,
    ),
    view("recap third touch", wheelTouch(third, fourth), RECAP_ZOOM.thirdTouch),
    view(
      "recap fourth touch",
      wheelTouch(fourth, escape),
      RECAP_ZOOM.fourthTouch,
    ),
    // the pallet's stones reach the escape wheel's teeth on the line from
    // its arbor to the fork's pivot
    view(
      "recap pallet",
      [
        touch(escape.arbor, escape.pitchRadius, fork.pivot),
        middle(layers.wheel(escape)),
      ],
      RECAP_ZOOM.pallet,
    ),
    // the jewel in the fork's notch, with the balance at rest
    view(
      "recap jewel",
      [
        polar(balance.impulsePinRadius, balance.pinDirection, balance.arbor),
        middle(layers.jewel),
      ],
      RECAP_ZOOM.jewel,
    ),
  ];
}
