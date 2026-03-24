import { Container } from "pixi.js";
import { Spine } from "@esotericsoftware/spine-pixi-v8";

export class Cop {
  public view = new Container();
  public spine: Spine;

  constructor() {
    this.spine = Spine.from({
      skeleton: "copSkeleton",
      atlas: "copAtlas",
    });

    this.spine.state.data.defaultMix = 0.15;

    this.view.addChild(this.spine);
  }

  idle() {
    this.spine.state.setAnimation(0, "Cops-Idel", true);
  }

  run() {
    this.spine.state.setAnimation(0, "Run-Cycle", true);
  }

  stop() {
    this.spine.state.clearTracks();
  }

  setSpeed(multiplier: number) {
    // Dynamic tension effect
    this.spine.state.timeScale = Math.min(2, 0.9 + multiplier * 0.05);
  }
}
