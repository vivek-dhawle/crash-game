import { Spine } from "@esotericsoftware/spine-pixi-v8";
import { Container, Sprite, Texture, TilingSprite, BlurFilter } from "pixi.js";
import type { Thief } from "../entities/Thief";
import type { CopThief } from "../entities/CopTthief";
import { GameState } from "../state/GameState";

export class Background {
  public view: Container;

  private backgroundContainer!: Container;

  private sky!: Sprite;
  private moon!: Sprite;
  private city!: TilingSprite;
  private mainCity!: TilingSprite;
  private bridge!: TilingSprite;
  public Obstacle!: Sprite[];
  private ObstacleSprite!: Texture[];
  public added = false;

  public dust!: Spine;

  private speed = 0;

  constructor(width: number, height: number) {
    this.view = new Container();
    this.backgroundContainer = new Container();
    this.Obstacle = [];

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
    this.dust.x = width;
    this.dust.y = height;
    this.dust.zIndex = 101;
    this.dust.visible = false;

    // this.obs1.anchor.set(0.5);
    // this.obs1.scale.set(0.7);
    // this.obs2.anchor.set(0.5);
    // this.obs2.scale.set(0.7);

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

    // Add background layers into container
    this.backgroundContainer.addChild(
      this.sky,
      this.moon,
      this.city,
      this.mainCity,
    );

    // Apply blur ONLY to background container
    const blur = new BlurFilter();
    blur.blur = 4; // strength
    blur.quality = 2; // performance vs smoothness

    this.backgroundContainer.filters = [blur];

    // Final hierarchy
    this.view.addChild(this.backgroundContainer, this.bridge);
  }

  public update(delta: number) {
    const baseSpeed = this.speed * delta;

    this.city.tilePosition.x -= baseSpeed * 0.1;
    this.mainCity.tilePosition.x -= baseSpeed * 0.3;
    this.bridge.tilePosition.x -= baseSpeed * 1.0;

    this.moon.x -= baseSpeed * 0.02;
  }

  public setSpeed(value: number) {
    this.speed = value;
  }

  public addObstacles(width: number, collision: boolean) {
    const last = this.Obstacle[this.Obstacle.length - 1];
    const yLocation = [320, 380];

    if (last && last.y == 380 && last.x > width - 300) return;
    const index = Math.floor(Math.random() * this.ObstacleSprite.length);
    const obs = Sprite.from(this.ObstacleSprite[index]);
    if (index == 9) {
      obs.scale.set(0.3);
    } else {
      obs.scale.set(0.3);
    }
    obs.anchor.set(0, 1);
    obs.label = "obs";

    obs.y = yLocation[Math.floor(Math.random() * this.ObstacleSprite.length)];
    obs.x = width + 150;
    if (collision) obs.y = 380;

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
        obs.y >= 370 &&
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
    this.sky.width = width;
    this.sky.height = height;

    this.city.width = width;
    this.mainCity.width = width;
    this.bridge.width = width;

    this.city.y = height - this.city.height;
    this.mainCity.y = height - this.mainCity.height - 250;
    this.bridge.y = height - this.bridge.height;

    this.moon.position.set(width - 200, height * 0.15);
  }
}

// import { Container, Sprite, Texture, TilingSprite } from 'pixi.js';

// export class Background {
//   public view: Container;
//   public sky: Sprite;
//   public background: TilingSprite;
//   public midground: TilingSprite;
//   public platform: TilingSprite;
//   public floorHeight: number;
//   public scale: number;

//   constructor(width: number, height: number) {
//     this.view = new Container();

//     // SKY
//     this.sky = Sprite.from('sky');
//     this.sky.anchor.set(0, 1);
//     this.sky.width = width;
//     this.sky.height = height;

//     // TEXTURES
//     const backgroundTexture = Texture.from('background');
//     const midgroundTexture = Texture.from('midground');
//     const platformTexture = Texture.from('platform');

//     const maxPlatformHeight = platformTexture.height;
//     const platformHeight = Math.max(maxPlatformHeight, height * 0.4);

//     const scale = (this.scale = platformHeight / maxPlatformHeight);

//     const baseOptions = {
//       tileScale: { x: scale, y: scale },
//       anchor: { x: 0, y: 1 },
//       applyAnchorToTexture: true,
//     };

//     // BACKGROUND
//     this.background = new TilingSprite({
//       texture: backgroundTexture,
//       width,
//       height: backgroundTexture.height * scale,
//       ...baseOptions,
//     });

//     // MIDGROUND
//     this.midground = new TilingSprite({
//       texture: midgroundTexture,
//       width,
//       height: midgroundTexture.height * scale,
//       ...baseOptions,
//     });

//     // PLATFORM
//     this.platform = new TilingSprite({
//       texture: platformTexture,
//       width,
//       height: platformHeight,
//       ...baseOptions,
//     });

//     this.floorHeight = platformHeight * 0.43;

//     // Position the backdrop layers.
//     this.background.y = this.midground.y = -this.floorHeight;

//     this.view.addChild(this.sky, this.background, this.midground, this.platform);
//   }

//   scroll(speed: number) {
//     this.background.tilePosition.x -= speed * 0.1;
//     this.midground.tilePosition.x -= speed * 0.25;
//     this.platform.tilePosition.x -= speed;
//   }
// }
