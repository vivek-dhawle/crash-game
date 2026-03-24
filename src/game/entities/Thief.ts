import { Container } from "pixi.js";
import { Spine } from "@esotericsoftware/spine-pixi-v8";

export class Thief {
  public view = new Container();
  public spine: Spine;

  constructor() {
    this.spine = Spine.from({
      skeleton: "jokerSkeleton",
      atlas: "jokerAtlas",
    });

    this.spine.state.data.defaultMix = 0.2;

    this.view.addChild(this.spine);
  }

  spawn() {
    // Joker appears / jump animation
    this.spine.state.setAnimation(0, "Joker-Jump", false);

    // After jump finishes, go to idle
    this.spine.state.addAnimation(0, "Joker-Idel", true, 0);
  }

  run() {
    this.spine.state.setAnimation(0, "Joker-Run", true);
  }

  idle() {
    this.spine.state.setAnimation(0, "Joker-Idel", true);
  }

  blink() {
    this.spine.state.setAnimation(0, "Joker-Blink", false);
    this.spine.state.addAnimation(0, "Joker-Idel", true, 0);
  }

  setSpeed(multiplier: number) {
    // Dynamic tension effect
    this.spine.state.timeScale = Math.min(0.8 + multiplier * 0.05, 1.5);
  }
  jump(speed: number, isJumping: { value: boolean }) {
    const entry = this.spine.state.setAnimation(0, "Joker-Jump", false);

    // ⏩ skip beginning (first 20%)
   entry.animationStart = entry.animation.duration * 0.3;

    // ✂️ cut ending (last 30%)
    entry.animationEnd = entry.animation.duration * 0.7;

    // control speed
    this.spine.state.timeScale = Math.min(1.5, 0.8 + speed * 0.03);

    // ✅ attach listener to THIS animation only
    entry.listener = {
      complete: () => {
        console.log("Jump finished");

        isJumping.value = false;

        this.run();

        // reset speed for run
        this.spine.state.timeScale = Math.min(1.5, 0.8 + speed * 0.05);
      },
    };
  }
}
