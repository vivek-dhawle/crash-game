import { Application } from 'pixi.js';
import { Background } from './scene/Background';
import { Thief } from './entities/Thief';
import { GameLoop } from './engine/GameLoop';
import { GameState, RoundStatus } from './state/GameState';
import { WaitingTimerOverlay } from './ui/WaitingTimerOverlay';
import { MultiplierDisplay } from './ui/MultiplierDisplay';
import { Cop } from './entities/Cop';

export class ThiefCrashGame {
  private background!: Background;
  private thief!: Thief;
  private cop!: Cop;
  private loop!: GameLoop;
  private waitingTimer!: WaitingTimerOverlay;
  private multiplierDisplay!: MultiplierDisplay;

  constructor(
    private app: Application,
    private state: GameState,
  ) {}

  init() {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.background = new Background(width, height);

    this.thief = new Thief();
    this.thief.spine.scale.set(0.25);
    this.thief.view.x = width / 1.8;
    this.thief.view.y = height / 1.3;

    this.cop = new Cop();
    this.cop.spine.scale.set(0.15);
    this.cop.view.x = width / 3;
    this.cop.view.y = height / 1.3;

    this.multiplierDisplay = new MultiplierDisplay(width, height);
    this.waitingTimer = new WaitingTimerOverlay(width, height);

    this.app.stage.addChild(
      this.background.view,
      this.thief.view,
      this.cop.view,
      this.multiplierDisplay.view,
      this.waitingTimer.view,
    );

    this.loop = new GameLoop(this.app);
    this.loop.start(this.update.bind(this));

    this.registerStateListeners();

    this.app.renderer.on('resize', this.handleResize);
  }

  private registerStateListeners() {
    this.state.on('hydrated', () => {
      // Ensure visuals match state immediately
      if (this.state.status === RoundStatus.RUNNING) {
        this.multiplierDisplay.show();
        this.thief.run();
      }

      if (this.state.status === RoundStatus.CRASHED) {
        this.multiplierDisplay.crash(this.state.crashRate!);
      }
    });

    this.state.on('roundStarted', () => {
      this.multiplierDisplay.reset();
      this.multiplierDisplay.hide();
      this.background.setSpeed(0);
    });

    this.state.on('waiting', (seconds: number) => {
      this.waitingTimer.show();
      this.waitingTimer.update(seconds);
    });

    this.state.on('running', () => {
      this.waitingTimer.hide();
      this.multiplierDisplay.show();
      this.thief.run();
      this.cop.run();
    });

    this.state.on('multiplier', (multiplier: number) => {
      this.multiplierDisplay.update(multiplier);
      const speed = Math.pow(multiplier, 1.4);
      this.background.setSpeed(speed);

      this.cop.setSpeed(multiplier);
      this.cop.view.x -= multiplier * 0.5;
    });

    this.state.on('crashed', (rate: number) => {
      this.multiplierDisplay.crash(rate);
      this.thief.idle();
      this.cop.stop();
      this.background.setSpeed(0);
    });
  }

  private handleResize = (width: number, height: number) => {
    this.background.resize(width, height);
    this.thief.view.x = width / 3;
    this.thief.view.y = height / 1.3;
    this.waitingTimer.resize(width, height);
    this.multiplierDisplay.resize(width, height);
  };

  private update(delta: number) {
    if (this.state.status === RoundStatus.RUNNING) {
      this.background.update(delta);
    }
  }
}
