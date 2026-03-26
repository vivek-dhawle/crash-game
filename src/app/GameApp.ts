import { Application, Assets } from "pixi.js";
import { GameState } from "../game/state/GameState";
import { ThiefCrashGame } from "../game/ThiefCrashGame";

export class GameApp {
  private app!: Application;

  constructor(private state: GameState) {}

  async init() {
    this.app = new Application();

    await this.app.init({
      background: "#0f172a",
      //resizeTo: document.getElementById('pixi-container')!,
      antialias: true,
    });

    document.getElementById("pixi-container")!.appendChild(this.app.canvas);

    await this.loadAssets();

    const game = new ThiefCrashGame(this.app, this.state);
    game.init();
  }

  private async loadAssets() {
    await Assets.load([
      {
        alias: "spineSkeleton",
        src: "https://raw.githubusercontent.com/pixijs/spine-v8/main/examples/assets/spineboy-pro.skel",
      },
      {
        alias: "spineAtlas",
        src: "https://raw.githubusercontent.com/pixijs/spine-v8/main/examples/assets/spineboy-pma.atlas",
      },
      {
        alias: "jokerSkeleton",
        src: `${import.meta.env.BASE_URL}/assets/spine/joker/Joker-Animation.json`,
      },
      {
        alias: "jokerAtlas",
        src: `${import.meta.env.BASE_URL}/assets/spine/joker/Joker-Animation.atlas`,
      },
      {
        alias: "jokerCopSkeleton",
        src: `${import.meta.env.BASE_URL}/assets/spine/cop&joker/Cops-And-Joker.json`,
      },
      {
        alias: "jokerCopAtlas",
        src: `${import.meta.env.BASE_URL}/assets/spine/cop&joker/Cops-And-Joker.atlas`,
      },
      {
        alias: "copSkeleton",
        src: `${import.meta.env.BASE_URL}/assets/spine/cop/Cops-Animation.json`,
      },
      {
        alias: "copAtlas",
        src: `${import.meta.env.BASE_URL}/assets/spine/cop/Cops-Animation.atlas`,
      },
      {
        alias: "dustSkeleton",
        src: `${import.meta.env.BASE_URL}/assets/spine/dust/Dust-Particles.json`,
      },
      {
        alias: "dustAtlas",
        src: `${import.meta.env.BASE_URL}/assets/spine/dust/Dust-Particles.atlas`,
      },

      {
        alias: "sky",
        src: `${import.meta.env.BASE_URL}/assets/background/1_Skys.png`,
      },
      {
        alias: "moon",
        src: `${import.meta.env.BASE_URL}/assets/background/2_Moon.png`,
      },
      {
        alias: "cityShilout",
        src: `${import.meta.env.BASE_URL}/assets/background/3_CityShilout.png`,
      },
      {
        alias: "mainCity",
        src: `${import.meta.env.BASE_URL}/assets/background/4_MainCity.png`,
      },
      {
        alias: "bridge",
        src: `${import.meta.env.BASE_URL}/assets/background/5_Bridge.png`,
      },
      {
        alias: "obs1",
        src: `${import.meta.env.BASE_URL}/assets/background/obstacles-01.png`,
      },
      {
        alias: "obs2",
        src: `${import.meta.env.BASE_URL}/assets/background/obstacles-02.png`,
      },
      {
        alias: "obs3",
        src: `${import.meta.env.BASE_URL}/assets/background/obs01.png`,
      },
      {
        alias: "obs4",
        src: `${import.meta.env.BASE_URL}/assets/background/obs2.png`,
      },
      {
        alias: "obs5",
        src: `${import.meta.env.BASE_URL}/assets/background/obs3.png`,
      },
      {
        alias: "obs6",
        src: `${import.meta.env.BASE_URL}/assets/background/obs4.png`,
      },
      {
        alias: "obs7",
        src: `${import.meta.env.BASE_URL}/assets/background/obs5.png`,
      },
    ]);
  }
}
