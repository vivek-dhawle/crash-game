import { Application } from "pixi.js";
import { Background } from "./scene/Background";
import { Thief } from "./entities/Thief";
import { GameLoop } from "./engine/GameLoop";
import { GameState, RoundStatus } from "./state/GameState";
import { WaitingTimerOverlay } from "./ui/WaitingTimerOverlay";
import { MultiplierDisplay } from "./ui/MultiplierDisplay";
import { Cop } from "./entities/Cop";
import { CopThief } from "./entities/CopTthief";
import { BetHistory } from "./ui/BetHistory";
import { sound } from "@pixi/sound";
import { IMediaInstance } from "@pixi/sound";

export class ThiefCrashGame {
  private background!: Background;
  private thief!: Thief;
  private cop!: Cop;
  private copTheif!: CopThief;
  private loop!: GameLoop;
  private waitingTimer!: WaitingTimerOverlay;
  private multiplierDisplay!: MultiplierDisplay;
  private betHistory!: BetHistory;

  private speed: number = 0.28;
  private isJumping: { value: boolean };
  private isCrash: { value: boolean };
  private play: boolean = true;
  private isRunning: boolean = false;
  private bgSound: IMediaInstance | null = null;

  private prevWidth: number;

  constructor(
    private app: Application,
    private state: GameState,
  ) {
    this.isJumping = { value: false };
    this.isCrash = { value: false };
    this.prevWidth = app.screen.width;
  }

  init() {
    const width = this.app.screen.width;
    const height = this.app.screen.height;

    this.prevWidth = width; // ✅ store initial width

    this.background = new Background(width, height);

    this.thief = new Thief();
    this.thief.spine.scale.set(0.2);
    this.thief.view.x = width / 2;
    this.thief.view.y = this.background.landPosition;
    this.thief.view.zIndex = 100;

    this.cop = new Cop();
    this.cop.spine.scale.set(0.12);
    this.cop.view.x = width / 4;
    this.cop.view.y = this.background.landPosition;

    this.copTheif = new CopThief();
    this.copTheif.spine.scale.set(0.2);
    this.copTheif.view.x = width / 2;
    this.copTheif.view.y = this.background.landPosition;

    this.multiplierDisplay = new MultiplierDisplay(width, height);
    this.waitingTimer = new WaitingTimerOverlay(width, height);

    this.multiplierDisplay.view.zIndex = 110;
    this.waitingTimer.view.zIndex = 110;

    this.betHistory = new BetHistory(this.state);
    this.betHistory.resize(width, height / 32);
    this.betHistory.position.set(-10, 10);

    this.app.stage.addChild(
      this.background.view,
      this.thief.view,
      this.cop.view,
      this.multiplierDisplay.view,
      this.waitingTimer.view,
      this.background.dust,
      this.betHistory,
    );

    this.loop = new GameLoop(this.app);
    this.loop.start(this.update.bind(this));

    this.registerStateListeners();

    this.app.renderer.on("resize", this.handleResize);
  }

  private async playBgMusic() {
    // if already playing → do nothing
    if (this.bgSound && !this.bgSound.paused) return;

    const instance = await sound.play("bgMusic", {
      volume: 0.5,
      loop: true,
    });

    this.bgSound = instance;
  }

  private stopBgMusic() {
    if (this.bgSound) {
      this.bgSound.stop();
      this.bgSound = null;
    }
  }

  private registerStateListeners() {
    this.state.on("hydrated", () => {
      this.playBgMusic();
      if (this.state.status === RoundStatus.RUNNING) {
        this.multiplierDisplay.show();
      }

      if (this.state.status === RoundStatus.CRASHED) {
        this.multiplierDisplay.crash(this.state.crashRate!);
      }
    });

    this.state.on("roundStarted", () => {
      sound.stop("fallSound");
      this.stopBgMusic();
      this.app.stage.removeChild(this.copTheif.view);
      this.app.stage.addChild(this.thief.view);
      this.app.stage.addChild(this.cop.view);

      this.play = true;
      this.background.added = false;
      this.background.dust.visible = false;
      this.isJumping.value = false;

      this.thief.idle();
      this.cop.idle();

      this.thief.view.x = -60;
      this.cop.view.x = -200;

      this.background.setSpeed(0);
      this.background.Obstacle = [];
      this.isCrash.value = true;

      this.background.view.children
        .filter((child) => child.label === "obs")
        .forEach((child) => this.background.view.removeChild(child));

      this.multiplierDisplay.reset();
      this.multiplierDisplay.hide();
    });

    this.state.on("waiting", (seconds: number | undefined) => {
      sound.play("countSound");
      this.multiplierDisplay.hide();
      this.waitingTimer.show();

      if (seconds !== undefined) {
        this.waitingTimer.update(seconds);
        if (seconds == 5) {
          this.thief.run();
          this.cop.run();
          this.playBgMusic();
        }
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

      this.multiplierDisplay.update(multiplier);

      const speed = Math.max(Math.pow(multiplier, 1.4), 4.5);
      this.speed = speed;

      this.background.setSpeed(Math.min(speed, 6));
      this.background.addObstacles(this.app.screen.width, false);

      this.cop.setSpeed(speed);
      this.thief.setSpeed(speed);
    });

    this.state.on("crashed", (rate: number) => {
      this.play = true;
      this.background.addObstacles(this.app.screen.width, true);
      this.multiplierDisplay.crash(rate);
    });
  }

  private handleResize = (width: number, height: number) => {
    const scaleX = width / this.prevWidth;

    this.thief.view.x *= scaleX;
    this.cop.view.x *= scaleX;
    this.copTheif.view.x *= scaleX;

    this.background.resize(width, height);

    this.thief.view.y = this.background.landPosition;
    this.cop.view.y = this.background.landPosition;
    this.copTheif.view.y = this.background.landPosition;

    this.waitingTimer.resize(width, height);
    this.multiplierDisplay.resize(width, height);
    this.betHistory.resize(width, height / 32);

    this.prevWidth = width;
  };

  private update(delta: number) {
    if (
      this.state.status === RoundStatus.WAITING &&
      Number(this.waitingTimer.secondsText.text) <= 5
    ) {
      if (!this.isRunning) {
        this.isRunning = true;
        this.cop.run();
        this.thief.run();
      }

      this.background.setSpeed(2);
      this.cop.setSpeed(2);
      this.thief.setSpeed(2);
      this.background.update(delta);

      if (this.thief.view.x <= this.app.screen.width / 2) {
        this.thief.view.x += 3 * delta;
      }

      if (
        this.cop.view.x <= this.app.screen.width / 4 &&
        this.cop.view.x < this.thief.view.x - this.app.screen.width / 4
      ) {
        this.cop.view.x += 2 * delta;
      }
    }

    if (
      this.play &&
      (this.state.status === RoundStatus.RUNNING ||
        this.state.status === RoundStatus.CRASHED)
    ) {
      if (!this.isRunning) {
        this.isRunning = true;
        this.cop.run();
        this.thief.run();
      }

      this.background.update(delta);

      if (
        this.state.status === RoundStatus.RUNNING &&
        this.thief.view.x >= -20
      ) {
        this.cop.view.x -= this.speed * delta;
      } else if (this.state.status === RoundStatus.CRASHED) {
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
          this.isRunning = false;
        },
      );
    }
  }
}
