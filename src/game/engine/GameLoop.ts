import { Application } from "pixi.js";

export class GameLoop {
  private play = true;
  constructor(private app: Application) {
    // window.addEventListener("keydown", (e) => {
    //   if (e.code == "Space") this.play = !this.play;
    // });
  }

  start(update: (delta: number) => void) {
    this.app.ticker.add(() => {
      if (this.play) {
        update(this.app.ticker.deltaTime);
      }
    });
  }
}
