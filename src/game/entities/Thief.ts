import { Container } from 'pixi.js';
import { Spine } from '@esotericsoftware/spine-pixi-v8';

export class Thief {
  public view = new Container();
  public spine: Spine;

  constructor() {
    this.spine = Spine.from({
      skeleton: 'jokerSkeleton',
      atlas: 'jokerAtlas',
    });

    this.spine.state.data.defaultMix = 0.2;

    this.view.addChild(this.spine);
  }

  spawn() {
    // Joker appears / jump animation
    this.spine.state.setAnimation(0, 'Joker-Jump', false);

    // After jump finishes, go to idle
    this.spine.state.addAnimation(0, 'Joker-Idel', true, 0);
  }

  run() {
    this.spine.state.setAnimation(0, 'Joker-Run', true);
  }

  idle() {
    this.spine.state.setAnimation(0, 'Joker-Idel', true);
  }

  blink() {
    this.spine.state.setAnimation(0, 'Joker-Blink', false);
    this.spine.state.addAnimation(0, 'Joker-Idel', true, 0);
  }
}
