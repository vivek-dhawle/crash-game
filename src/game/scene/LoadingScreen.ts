import { Container, Graphics, Text } from "pixi.js";

export class LoadingScreen extends Container {
  private bar: Graphics;
  private text: Text;
  private headtext: Text;

  constructor() {
    super();

    const bg = new Graphics()
      .rect(0, 0, window.innerWidth, window.innerHeight)
      .fill(0x000000);

    this.addChild(bg);

    this.bar = new Graphics();
    this.addChild(this.bar);

    this.text = new Text({
      text: "Loading 0%",
      style: { fill: 0xffffff, fontSize: 40 },
    });

    this.text.anchor.set(0.5);
    this.text.x = window.innerWidth / 2;
    this.text.y = window.innerHeight / 2 + 80;

    this.addChild(this.text);
    this.headtext = new Text({
      text: "TRUEIGTECH",
      style: { fill: 0xffffff, fontSize: 40 },
    });

    this.headtext.anchor.set(0.5);
    this.headtext.x = window.innerWidth / 2;
    this.headtext.y = window.innerHeight / 2.5;

    this.addChild(this.text, this.headtext);
  }

  setProgress(p: number) {
    const w = window.innerWidth * 0.6 * p;

    this.bar
      .clear()
      .rect(window.innerWidth * 0.2, window.innerHeight / 2, w, 20)
      .fill(0x00ffcc);

    this.text.text = `Loading ${Math.round(p * 100)}%`;
  }
}
