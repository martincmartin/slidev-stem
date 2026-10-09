// Stills of the watch, for the pages that must not animate: print and export,
// the overview, the presenter's "next" pane. One hidden renderer draws them
// all (webgl/stills.ts).

import { Stills } from "../webgl/stills.ts";
import type { Palette } from "../webgl/scene.ts";
import type { Watch } from "./generate.ts";
import { linePose, stagePose } from "./mainspring.ts";
import { Motion, stillPose } from "./model.ts";
import { stageState } from "./state.ts";
import type { WatchState } from "./state.ts";

/** s: a pose with nothing at a keyframe. */
export const STILL_TIME = 0.37;

export class WatchStills {
  private readonly watch: Watch;
  private readonly motion: Motion;
  private readonly stills: Stills;

  constructor(watch: Watch) {
    this.watch = watch;
    this.motion = new Motion(watch);
    this.stills = new Stills(watch.scene);
  }

  /** Free the renderer and revoke the stills' URLs. */
  dispose(): void {
    this.stills.dispose();
  }

  /** A slide's state as a picture (an object URL) in the slide's palette, at
   *  the still time, or at rest. `size` is in device px. */
  of(
    state: WatchState,
    size: [number, number],
    palette: Palette,
  ): Promise<string> {
    const { design } = this.watch;
    const key = JSON.stringify([
      state.view,
      state.tilt,
      state.show,
      state.fit,
      state.right,
      state.band,
      state.spin,
      state.settled,
      state.mainspring,
      size,
    ]);
    return this.stills.of(key, palette, (renderer) => {
      const { time, swing } = stillPose(
        design.timing,
        state.settled,
        STILL_TIME,
      );
      const stage = stageState(this.watch, state);
      // the story's stage once its moves end, or the spring at rest
      const spring =
        state.mainspring === null ? linePose(0) : stagePose(state.mainspring);
      renderer.updateMesh(this.watch.spring, this.motion.springGeometry(swing));
      renderer.updateMesh(
        this.watch.mainspring,
        this.motion.mainspringGeometry(spring),
      );
      renderer.render({
        view: stage.view,
        tilt: stage.tilt,
        groupMatrices: this.motion.matrices(
          time,
          swing,
          this.motion.beats(time),
          spring.arbor,
        ),
        keep: stage.shown,
        rest: 0,
        size,
      });
    });
  }
}
