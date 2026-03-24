import { Application } from "pixi.js";
import { Background } from "./scene/Background";
import { Thief } from "./entities/Thief";
import { GameLoop } from "./engine/GameLoop";
import { GameState, RoundStatus } from "./state/GameState";
import { WaitingTimerOverlay } from "./ui/WaitingTimerOverlay";
import { MultiplierDisplay } from "./ui/MultiplierDisplay";
import { Cop } from "./entities/Cop";
import { CopThief } from "./entities/CopTthief";

export class ThiefCrashGame {
  private background!: Background;
  private thief!: Thief;
  private cop!: Cop;
  private copTheif!: CopThief;
  private loop!: GameLoop;
  private waitingTimer!: WaitingTimerOverlay;
  private multiplierDisplay!: MultiplierDisplay;
  private speed!: number = 0.28;
  private isJumping: any;
  private isCrash: any;
  private play: boolean = true;
  constructor(
    private app: Application,
    private state: GameState,
  ) {
    this.isJumping = { value: false };
    this.isCrash = { value: false };
  }

  init() {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.background = new Background(width, height);
    this.thief = new Thief();
    this.thief.spine.scale.set(0.2);
    this.thief.view.x = width / 1.8;
    this.thief.view.y = height / 1.6;
    this.thief.view.zIndex = 100;

    this.cop = new Cop();
    this.cop.spine.scale.set(0.12);
    this.cop.view.x = width / 4;
    this.cop.view.y = height / 1.6;

    this.copTheif = new CopThief();
    this.copTheif.spine.scale.set(0.2);
    this.copTheif.view.x = width / 4;
    this.copTheif.view.y = height / 1.6;

    this.multiplierDisplay = new MultiplierDisplay(width, height);
    this.waitingTimer = new WaitingTimerOverlay(width, height);
    this.multiplierDisplay.view.zIndex = 110;
    this.waitingTimer.view.zIndex = 110;

    this.app.stage.addChild(
      this.background.view,
      this.thief.view,
      this.cop.view,
      this.multiplierDisplay.view,
      this.waitingTimer.view,
      this.background.dust,
      //this.copTheif.view,
    );

    this.loop = new GameLoop(this.app);
    this.loop.start(this.update.bind(this));

    this.registerStateListeners();

    this.app.renderer.on("resize", this.handleResize);
  }

  private registerStateListeners() {
    this.state.on("hydrated", () => {
      // Ensure visuals match state immediately
      if (this.state.status === RoundStatus.RUNNING) {
        this.multiplierDisplay.show();
      }

      if (this.state.status === RoundStatus.CRASHED) {
        this.multiplierDisplay.crash(this.state.crashRate!);
      }
    });

    this.state.on("roundStarted", () => {
      this.app.stage.removeChild(this.copTheif.view);
      this.app.stage.addChild(this.thief.view);
      this.app.stage.addChild(this.cop.view);
      this.play = true;
      this.background.added = false;
      this.background.dust.visible = false;
      this.isJumping.value = false;
      this.thief.idle();
      this.cop.idle();
      this.cop.view.x = this.app.screen.width / 4;
      this.cop.spine.state.timeScale = 1;
      this.thief.spine.state.timeScale = 1;
      this.background.setSpeed(0);
      this.background.Obstacle = [];
      this.isCrash.value = true;
      this.background.view.children
        .filter((child) => child.label === "obs")
        .forEach((child) => this.background.view.removeChild(child));
      this.multiplierDisplay.reset();
      this.multiplierDisplay.hide();
      this.background.setSpeed(0);
      this.thief.view.x -= 500;
      this.cop.view.x -= 500;
    });

    this.state.on("waiting", (seconds: number) => {
      this.waitingTimer.show();
      this.waitingTimer.update(seconds);
      if (seconds == 5) {
        this.thief.run();
        this.cop.run();
      }
    });

    this.state.on("running", () => {
      this.play = true;
      this.waitingTimer.hide();
      this.multiplierDisplay.show();
      this.thief.run();
      this.cop.run();
    });

    this.state.on("multiplier", (multiplier: number) => {
      this.play = true;
      if (this.thief.view.x != this.app.screen.width / 1.8) {
        this.thief.view.x = this.app.screen.width / 1.8;
        this.thief.run();
        this.cop.run();
      }
      this.multiplierDisplay.update(multiplier);
      const speed = Math.max(Math.pow(multiplier, 1.4), 4);
      this.speed = speed;
      this.background.setSpeed(Math.min(speed, 6));
      this.background.addObstacles(
        this.app.screen.width,
        this.thief.view.y,
        false,
      );
      this.cop.setSpeed(speed);
      this.thief.setSpeed(speed);
    });

    this.state.on("crashed", (rate: number) => {
      this.play = true;
      this.background.addObstacles(
        this.app.screen.width,
        this.thief.view.y,
        true,
      );
      this.multiplierDisplay.crash(rate);
      //this.isJumping.value = true;
      //this.thief.idle();
    });
  }

  private handleResize = (width: number, height: number) => {
    this.background.resize(width, height);
    this.thief.view.x = width / 1.8;
    this.thief.view.y = height / 1.6;
    this.cop.view.x = width / 4;
    this.cop.view.y = height / 1.6;
    this.waitingTimer.resize(width, height);
    this.multiplierDisplay.resize(width, height);
  };

  private update(delta: number) {
    if (
      this.state.status === RoundStatus.WAITING &&
      Number(this.waitingTimer.secondsText.text) <= 5
    ) {
      this.background.setSpeed(2);
      this.cop.setSpeed(2);
      this.thief.setSpeed(2);
      this.background.update(delta);
      if (this.thief.view.x <= this.app.screen.width / 1.8) {
        this.thief.view.x += 2 * delta;
      }
      if (this.cop.view.x <= this.app.screen.width / 4) {
        this.cop.view.x += 2 * delta;
      }
    }
    if (
      this.play &&
      (this.state.status === RoundStatus.RUNNING ||
        this.state.status === RoundStatus.CRASHED)
    ) {
      this.background.update(delta);
      if (this.state.status === RoundStatus.RUNNING)
        this.cop.view.x -= this.speed * delta;
      else if (this.state.status === RoundStatus.CRASHED) {
        this.app.stage.removeChild(this.cop.view);
      }
      this.background.moveObstacles(
        Math.min(this.speed, 6) * delta,
        this.thief,
        this.copTheif,
        this.isJumping,
        this.state,
        this.app.stage,
        () => {
          this.play = false;
        },
      );
    }
  }
}
