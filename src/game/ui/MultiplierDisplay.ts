import { Container, Graphics, Text, BlurFilter } from "pixi.js";

export class MultiplierDisplay {
  public view = new Container();

  private bg: Graphics;
  private glow: Graphics;
  private multiplierText: Text;

  private boxWidth = 200;
  private boxHeight = 60;

  private isCrashed = false;

  constructor(screenWidth: number, screenHeight: number) {
    this.bg = new Graphics();
    this.glow = new Graphics();

    this.multiplierText = new Text({
      text: "1.00x",
      style: {
        fill: 0x22d3ee,
        fontSize: 38,
        fontWeight: "bold",
      },
    });

    this.multiplierText.anchor.set(0.5);

    this.view.addChild(this.glow, this.bg, this.multiplierText);

    this.draw(0x22d3ee);
    this.resize(screenWidth, screenHeight);
  }

  // =============================
  // DRAW BOX (Color Customizable)
  // =============================
  private draw(borderColor: number) {
    this.glow.clear();
    this.glow
      .roundRect(0, 0, this.boxWidth, this.boxHeight, 18)
      .stroke({ width: 4, color: borderColor });

    const blur = new BlurFilter();
    blur.blur = 6;
    this.glow.filters = [blur];

    this.bg.clear();
    this.bg
      .roundRect(0, 0, this.boxWidth, this.boxHeight, 18)
      .fill({ color: 0x0f172a, alpha: 0.95 });

    this.multiplierText.x = this.boxWidth / 2;
    this.multiplierText.y = this.boxHeight / 2;
  }

  // =============================
  // UPDATE MULTIPLIER
  // =============================
  update(multiplier: number) {
    if (this.isCrashed) return;

    this.multiplierText.text = `${multiplier.toFixed(2)}x`;

    if (multiplier > 5) {
      this.multiplierText.style.fill = 0xf97316;
    } else if (multiplier > 2) {
      this.multiplierText.style.fill = 0xfacc15;
    } else {
      this.multiplierText.style.fill = 0x22d3ee;
    }
  }

  // =============================
  // CRASH EFFECT
  // =============================
  crash(crashRate: number) {
    this.isCrashed = true;
    this.multiplierText.text = `${crashRate.toFixed(2)}x`;
    this.multiplierText.style.fill = 0xef4444; // red text

    this.draw(0xef4444); // red border

    // Optional: slight shake
    const originalX = this.view.x;

    let shakeCount = 0;
    const shakeInterval = setInterval(() => {
      this.view.x = originalX + (shakeCount % 2 === 0 ? -5 : 5);
      shakeCount++;

      if (shakeCount > 6) {
        clearInterval(shakeInterval);
        this.view.x = originalX;
      }
    }, 40);
  }

  // =============================
  // RESET FOR NEXT ROUND
  // =============================
  reset() {
    this.isCrashed = false;
    this.multiplierText.style.fill = 0x22d3ee;
    this.draw(0x22d3ee);
  }

  show() {
    this.view.visible = true;
  }

  hide() {
    this.view.visible = false;
  }

  resize(width: number, height: number) {
    this.view.x = width / 2 - this.boxWidth / 2;
    this.view.y = height / 5;
  }
}
