import { Application } from 'pixi.js';

export class GameLoop {
  constructor(private app: Application) {}

  start(update: (delta: number) => void) {
    this.app.ticker.add(() => {
      update(this.app.ticker.deltaTime);
    });
  }
}
