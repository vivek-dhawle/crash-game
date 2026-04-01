import { Container, Graphics, Text } from "pixi.js";

export class WaitingTimerOverlay {
  public view = new Container();

  private circle: Graphics;
  public secondsText: Text;
  private labelText: Text;

  private radius = 80;
  constructor(screenWidth: number, screenHeight: number) {
    this.circle = new Graphics();
    this.secondsText = new Text({
      text: "10",
      style: {
        fill: 0xffffff,
        fontSize: 60,
        fontWeight: "bold",
      },
    });

    this.labelText = new Text({
      text: "NEXT ROUND",
      style: {
        fill: 0x94a3b8,
        fontSize: 16,
      },
    });

    this.view.addChild(this.circle, this.secondsText, this.labelText);

    this.resize(screenWidth, screenHeight);
    this.hide();
  }

  // =============================
  // DRAW
  // =============================

  private drawCircle() {
    this.circle.clear();

    // Background circle
    this.circle.circle(0, 0, this.radius).fill({ color: 0x0f172a, alpha: 0.9 });

    // Border
    this.circle.circle(0, 0, this.radius).stroke({ width: 4, color: 0x38bdf8 });
  }

  // =============================
  // PUBLIC METHODS
  // =============================

  update(seconds: number) {
    this.secondsText.text = `${seconds}`;
  }

  show() {
    this.view.visible = true;
  }

  hide() {
    this.view.visible = false;
  }

  resize(width: number, height: number) {
    this.view.x = width / 2;
    this.view.y = height / 5;

    this.drawCircle();

    this.secondsText.anchor.set(0.5);
    this.secondsText.x = 0;
    this.secondsText.y = -10;

    this.labelText.anchor.set(0.5);
    this.labelText.x = 0;
    this.labelText.y = 40;
  }
}
