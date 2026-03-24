import { Container } from "pixi.js";
import { Spine } from "@esotericsoftware/spine-pixi-v8";

export class CopThief {
  public view = new Container();
  public spine: Spine;

  constructor() {
    this.spine = Spine.from({
      skeleton: "jokerCopSkeleton",
      atlas: "jokerCopAtlas",
    });

    this.spine.state.data.defaultMix = 0.2;
    this.view.label = "copTheif";
    this.view.addChild(this.spine);
  }

  spawn() {
    // Joker appears / jump animation
    this.spine.state.setAnimation(0, "Joker-Jump", false);

    // After jump finishes, go to idle
    this.spine.state.addAnimation(0, "Joker-Idel", true, 0);
  }

  dive() {
    const enrty = this.spine.state.setAnimation(0, "Joker-Dive", false);
    return enrty;
  }

  catch() {
    this.spine.state.setAnimation(0, "Cops-Catch", true);
  }

  blink() {
    this.spine.state.setAnimation(0, "Joker-Blink", false);
    this.spine.state.addAnimation(0, "Joker-Idel", true, 0);
  }

  setSpeed(multiplier: number) {
    // Dynamic tension effect
    this.spine.state.timeScale = Math.min(0.8 + multiplier * 0.05, 1.5);
  }
}
