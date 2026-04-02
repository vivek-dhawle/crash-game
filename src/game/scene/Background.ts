import { Spine } from "@esotericsoftware/spine-pixi-v8";
import { Container, Sprite, Texture, TilingSprite, BlurFilter } from "pixi.js";
import type { Thief } from "../entities/Thief";
import type { CopThief } from "../entities/CopTthief";
import { GameState } from "../state/GameState";

type ObstacleSprite = Sprite & {
  pos: "up" | "down";
};

export class Background {
  public view: Container;

  private backgroundContainer!: Container;

  private sky!: Sprite;
  private moon!: Sprite;
  private city!: TilingSprite;
  private mainCity!: TilingSprite;
  private bridge!: TilingSprite;

  public Obstacle!: ObstacleSprite[];
  private ObstacleSprite!: Texture[];

  public added = false;
  public landPosition = 0;

  public dust!: Spine;

  private speed = 0;

  // ✅ IMPORTANT
  private prevWidth: number;

  constructor(width: number, height: number) {
    this.view = new Container();
    this.backgroundContainer = new Container();
    this.Obstacle = [];

    this.prevWidth = width; // ✅ store width

    this.create(width, height);
  }

  private create(width: number, height: number) {
    // SKY
    this.sky = Sprite.from("sky");
    this.sky.width = width;
    this.sky.height = height;

    // MOON
    this.moon = Sprite.from("moon");
    this.moon.anchor.set(0.5);
    this.moon.scale.set(0.7);
    this.moon.position.set(width - 500, height * 0.15);

    // TEXTURES
    const cityTexture = Texture.from("cityShilout");
    const mainCityTexture = Texture.from("mainCity");
    const bridgeTexture = Texture.from("bridge");

    this.ObstacleSprite = [
      Texture.from("obs3"),
      Texture.from("obs5"),
      Texture.from("obs6"),
    ];

    this.dust = Spine.from({
      skeleton: "dustSkeleton",
      atlas: "dustAtlas",
    });

    this.dust.label = "dust";
    //this.dust.pivot.set(this.dust.width / 2, this.dust.height/2);
    this.dust.x = width / 2;
    this.dust.y = height;
    this.dust.width = width;
    this.dust.height = height;
    this.dust.zIndex = 101;
    //this.dust.state.setAnimation(0, "animation", true);
    this.dust.visible = false;

    // CITY LAYERS
    this.city = new TilingSprite({
      texture: cityTexture,
      width,
      height: cityTexture.height,
    });
    this.city.y = height - cityTexture.height;

    this.mainCity = new TilingSprite({
      texture: mainCityTexture,
      width,
      height: mainCityTexture.height,
    });
    this.mainCity.y = height - mainCityTexture.height - 250;

    this.bridge = new TilingSprite({
      texture: bridgeTexture,
      width,
      height: bridgeTexture.height,
    });
    this.bridge.y = height - bridgeTexture.height;

    this.landPosition = this.bridge.y + this.bridge.height * 0.63;

    // BACKGROUND CONTAINER
    this.backgroundContainer.addChild(
      this.sky,
      this.moon,
      this.city,
      this.mainCity,
    );

    const blur = new BlurFilter();
    blur.blur = 4;
    blur.quality = 2;

    this.backgroundContainer.filters = [blur];

    this.view.addChild(this.backgroundContainer, this.bridge);
  }

  public update(delta: number) {
    const baseSpeed = this.speed * delta;

    this.city.tilePosition.x -= baseSpeed * 0.1;
    this.mainCity.tilePosition.x -= baseSpeed * 0.3;
    this.bridge.tilePosition.x -= baseSpeed * 1.0;

    this.moon.x -= baseSpeed * 0.02;
    if (this.moon.x < -60) this.moon.x = this.prevWidth + 100;
  }

  public setSpeed(value: number) {
    this.speed = value;
  }

  public addObstacles(width: number, collision: boolean) {
    const last = this.Obstacle[this.Obstacle.length - 1];

    // ✅ FIXED
    const yLocation = [this.landPosition - 60, this.landPosition + 10];

    if (last && last.y >= this.landPosition && last.x > width * 0.75) return;

    const index = Math.floor(Math.random() * this.ObstacleSprite.length);
    const obs = Sprite.from(this.ObstacleSprite[index]) as ObstacleSprite;

    obs.scale.set(0.3);
    obs.anchor.set(0, 1);
    obs.label = "obs";

    // ✅ FIXED random
    const yIndex = Math.floor(Math.random() * yLocation.length);
    obs.y = yLocation[yIndex];

    obs.x = width * 1.5;

    if (collision) obs.y = this.landPosition;

    // ✅ FIXED pos logic
    obs.pos = yIndex === 0 ? "up" : "down";

    this.view.addChild(obs);
    this.Obstacle.push(obs);
  }

  public moveObstacles(
    speed: number,
    thief: Thief,
    copTheif: CopThief,
    isJumping: { value: boolean },
    state: GameState,
    container: Container,
    onComplete: () => void,
  ) {
    this.Obstacle.forEach((obs) => {
      obs.x -= speed;

      const dist = state.status === "RUNNING" ? 60 + speed * 10 : 20;

      if (
        obs.y >= this.landPosition - 20 &&
        !isJumping.value &&
        obs.x - thief.view.x < dist &&
        obs.x - thief.view.x > 0.1
      ) {
        if (state.status === "RUNNING") {
          thief.jump(speed, isJumping);
          isJumping.value = true;
        } else {
          if (!container.getChildByLabel("copTheif")) {
            container.removeChild(thief.view);
            container.addChild(copTheif.view);

            const entry = copTheif.dive();
            entry.listener = {
              complete: () => {
                if (!this.added && state.status === "CRASHED") {
                  this.dust.visible = true;
                  this.dust.state.setAnimation(0, "animation", false);
                  this.added = true;

                  onComplete();

                  setTimeout(() => {
                    copTheif.catch();
                  }, 300);
                }
              },
            };

            copTheif.view.x = thief.view.x;
          }
        }
      }
    });
  }

  public resize(width: number, height: number) {
    const scaleX = width / this.prevWidth;

    this.sky.width = width;

    this.city.width = width;
    this.mainCity.width = width;
    this.bridge.width = width;
    this.dust.x = width / 2;
    this.dust.y = height;
    this.dust.width = width;
    this.dust.height = height;

    this.city.y =
      height - this.city.height < 0
        ? height - this.city.height * -1
        : height - this.city.height;

    this.mainCity.y = height - this.mainCity.height - 250;
    this.bridge.y = height - this.bridge.height;

    this.landPosition = this.bridge.y + this.bridge.height * 0.63;

    this.moon.position.set(width - 200, height * 0.15);

    // ✅ SCALE + FIX Y
    this.Obstacle.forEach((obs) => {
      obs.x *= scaleX;

      if (obs.pos === "up") obs.y = this.landPosition - 60;
      else obs.y = this.landPosition;
    });

    this.prevWidth = width;
  }
}
