import { Application, Assets } from 'pixi.js';
import { GameState } from '../game/state/GameState';
import { ThiefCrashGame } from '../game/ThiefCrashGame';

export class GameApp {
  private app!: Application;

  constructor(private state: GameState) {}

  async init() {
    this.app = new Application();

    await this.app.init({
      background: '#0f172a',
      resizeTo: document.getElementById('pixi-container')!,
      antialias: true,
    });

    document.getElementById('pixi-container')!.appendChild(this.app.canvas);

    await this.loadAssets();

    const game = new ThiefCrashGame(this.app, this.state);
    game.init();
  }

  private async loadAssets() {
    await Assets.load([
      {
        alias: 'spineSkeleton',
        src: 'https://raw.githubusercontent.com/pixijs/spine-v8/main/examples/assets/spineboy-pro.skel',
      },
      {
        alias: 'spineAtlas',
        src: 'https://raw.githubusercontent.com/pixijs/spine-v8/main/examples/assets/spineboy-pma.atlas',
      },
      {
        alias: 'jokerSkeleton',
        src: '/assets/spine/joker/Joker-Animation.json',
      },
      {
        alias: 'jokerAtlas',
        src: '/assets/spine/joker/Joker-Animation.atlas',
      },
      {
        alias: 'copSkeleton',
        src: '/assets/spine/cop/Cops-Animation.json',
      },
      {
        alias: 'copAtlas',
        src: '/assets/spine/cop/Cops-Animation.atlas',
      },

      { alias: 'sky', src: '/assets/background/1_Skys.png' },
      { alias: 'moon', src: '/assets/background/2_Moon.png' },
      { alias: 'cityShilout', src: '/assets/background/3_CityShilout.png' },
      { alias: 'mainCity', src: '/assets/background/4_MainCity.png' },
      { alias: 'bridge', src: '/assets/background/5_Bridge.png' },
    ]);
  }
}
