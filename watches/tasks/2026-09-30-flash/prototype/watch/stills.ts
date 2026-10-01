// Stills of the watch, for the pages that must not animate: print and export,
// the overview, the presenter's "next" pane. One hidden renderer draws them
// all (webgl/stills.ts).

import { Stills } from "../webgl/stills.ts";
import type { Palette } from "../webgl/scene.ts";
import type { Watch } from "./generate.ts";
import { BalanceClock, Motion } from "./model.ts";
import { stageState } from "./state.ts";
import type { WatchState } from "./state.ts";

/** s: a pose with nothing at a keyframe. */
export const STILL_TIME = 0.37;

export class WatchStills {
  private readonly watch: Watch;
  private readonly motion: Motion;
  private readonly stills: Stills;

  constructor(watch: Watch, palette: Palette) {
    this.watch = watch;
    this.motion = new Motion(watch);
    this.stills = new Stills(watch.scene, palette);
  }

  /** Free the renderer and revoke the stills' URLs. */
  dispose(): void {
    this.stills.dispose();
  }

  /** A slide's state as a picture (an object URL), at the still time, or at
   *  rest. `size` is in device px. */
  of(state: WatchState, size: [number, number]): Promise<string> {
    const { scene, design } = this.watch;
    const key = JSON.stringify([
      state.view,
      state.tilt,
      state.only,
      state.settled,
      size,
    ]);
    return this.stills.of(key, (renderer) => {
      const clock = new BalanceClock(design.timing, 0);
      clock.place(state.settled, 0);
      const time = state.settled ? 0 : STILL_TIME;
      const swing = state.settled ? 0 : clock.swingAt(time);
      const stage = stageState(scene, state);
      renderer.updateMesh(this.watch.spring, this.motion.springGeometry(swing));
      renderer.render({
        view: stage.view,
        tilt: stage.tilt,
        groupMatrices: this.motion.matrices(time, swing),
        ...(stage.subject ? { keep: stage.subject.meshes, rest: 0 } : {}),
        size,
      });
    });
  }
}
