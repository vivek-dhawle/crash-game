import { Application } from "pixi.js";
import { GameState } from "../game/state/GameState";
import { ThiefCrashGame } from "../game/ThiefCrashGame";

export class GameApp {
  private app!: Application;

  constructor(private state: GameState) {}

  async init() {
    this.app = new Application();

    await this.app.init({
      background: "#0f172a",
      resizeTo: document.getElementById("pixi-container")!,
      antialias: true,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
    });

    document.getElementById("pixi-container")!.appendChild(this.app.canvas);

    const game = new ThiefCrashGame(this.app, this.state);
    game.init();
  }
}
