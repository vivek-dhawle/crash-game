import { Container, Graphics, Text } from "pixi.js";

export class BetPanel {
  public view = new Container();

  // visual elements
  private bg: Graphics;
  private countdownText: Text;
  private betLabel: Text;
  private betValueText: Text;

  // Interactive elements
  private btnMinus: Container;
  private btnPlus: Container;
  private btnPlace: Container;

  // Logic
  private betAmount = 10;
  private minBet = 10;
  private maxBet = 1000;
  private isBettingOpen = true;

  // Styles
  private readonly colorPrimary = 0xfacc15; // Gold
  private readonly colorSuccess = 0x22c55e; // Green
  private readonly colorDanger = 0xef4444; // Red/Orange
  private readonly colorPanel = 0x111827; // Dark Blue/Grey
  private readonly colorInput = 0x1f2937; // Input bg

  constructor(
    private onPlaceBet: (amount: number) => void,
    screenWidth: number,
    screenHeight: number,
  ) {
    this.bg = new Graphics();
    this.view.addChild(this.bg);

    // 1. Countdown / Status Text
    this.countdownText = new Text({
      text: "Waiting for round...",
      style: {
        fontFamily: "Arial",
        fontWeight: "bold",
        fill: 0xffffff,
        fontSize: 16,
        // FIX: In v8, dropShadow is an object
        dropShadow: {
          color: "#000000",
          blur: 2,
          distance: 1,
          angle: Math.PI / 6,
        },
      },
    });
    this.countdownText.anchor.set(0.5);

    // 2. Bet Control Section
    this.betLabel = new Text({
      text: "TOTAL BET",
      style: {
        fontFamily: "Arial",
        fill: 0x9ca3af,
        fontSize: 12,
        fontWeight: "600",
      },
    });

    this.betValueText = new Text({
      text: "$10",
      style: {
        fontFamily: "Arial",
        fill: 0xffffff,
        fontSize: 22,
        fontWeight: "bold",
      },
    });
    this.betValueText.anchor.set(0.5);

    // Buttons
    this.btnMinus = this.createCircleBtn("-", this.colorInput, 0xffffff, () =>
      this.updateAmount(-10),
    );
    this.btnPlus = this.createCircleBtn("+", this.colorInput, 0xffffff, () =>
      this.updateAmount(10),
    );

    // 3. Place Bet Button
    this.btnPlace = this.createRectBtn("PLACE BET", this.colorSuccess);

    this.btnPlace.eventMode = "static";
    this.btnPlace.cursor = "pointer";
    this.btnPlace.on("pointerdown", () => {
      if (!this.isBettingOpen) return;
      this.btnPlace.alpha = 0.8;
      this.onPlaceBet(this.betAmount);
    });
    this.btnPlace.on("pointerup", () => {
      this.btnPlace.alpha = 1;
    });
    this.btnPlace.on("pointerupoutside", () => {
      this.btnPlace.alpha = 1;
    });

    this.view.addChild(
      this.bg, // Ensure bg is bottom
      this.countdownText,
      this.betLabel,
      this.btnMinus,
      this.betValueText,
      this.btnPlus,
      this.btnPlace,
    );

    this.updateBetText();
    this.resize(screenWidth, screenHeight);
  }

  // Helper: Create Circular +/- Buttons
  private createCircleBtn(
    label: string,
    color: number,
    textColor: number,
    onClick: () => void,
  ): Container {
    const cont = new Container();
    const bg = new Graphics();

    // Draw circle
    bg.circle(0, 0, 20).fill(color).stroke({ width: 2, color: 0x374151 });

    const text = new Text({
      text: label,
      style: { fill: textColor, fontSize: 24, fontWeight: "bold" },
    });
    text.anchor.set(0.5);
    text.position.set(0, -2); // center adjustment

    cont.addChild(bg, text);

    cont.eventMode = "static";
    cont.cursor = "pointer";
    cont.on("pointerdown", () => {
      cont.alpha = 0.7;
      onClick();
    });
    cont.on("pointerup", () => (cont.alpha = 1));
    cont.on("pointerupoutside", () => (cont.alpha = 1));

    return cont;
  }

  // Helper: Create Rectangular Place Button
  private createRectBtn(label: string, color: number): Container {
    const cont = new Container();
    const w = 180;
    const h = 55;
    const r = 12;

    const bg = new Graphics();
    bg.roundRect(0, 0, w, h, r).fill(color);
    bg.roundRect(0, h - 5, w, 5, r).fill(0x15803d); // Shadow lip

    const text = new Text({
      text: label,
      style: {
        fill: 0xffffff,
        fontSize: 20,
        fontWeight: "900",
        // FIX: Nested dropShadow object for v8
        dropShadow: {
          color: "#000000",
          blur: 2,
          distance: 2,
          angle: Math.PI / 6,
        },
      },
    });
    text.anchor.set(0.5);
    text.x = w / 2;
    text.y = h / 2;

    cont.addChild(bg, text);
    return cont;
  }

  private updateAmount(delta: number) {
    if (!this.isBettingOpen) return;
    const newAmount = this.betAmount + delta;
    if (newAmount >= this.minBet && newAmount <= this.maxBet) {
      this.betAmount = newAmount;
      this.updateBetText();
    }
  }

  private updateBetText() {
    this.betValueText.text = `$${this.betAmount}`;
  }

  updateCountdown(seconds: number) {
    if (seconds <= 0) {
      this.countdownText.text = "Rien ne va plus";
      this.countdownText.style.fill = this.colorDanger;
    } else {
      this.countdownText.text = `Place your bets: ${seconds}s`;
      this.countdownText.style.fill = this.colorPrimary;
    }
  }

  setBettingState(isOpen: boolean) {
    this.isBettingOpen = isOpen;
    const alpha = isOpen ? 1 : 0.5;
    this.btnPlace.alpha = alpha;
    this.btnMinus.alpha = alpha;
    this.btnPlus.alpha = alpha;
    this.btnPlace.cursor = isOpen ? "pointer" : "not-allowed";

    const btnText = this.btnPlace.children[1] as Text;
    if (btnText) {
      btnText.text = isOpen ? "PLACE BET" : "CLOSED";
    }
  }

  resize(width: number, height: number) {
    const panelHeight = 130;
    const panelY = height - panelHeight;

    this.bg.clear();
    this.bg.rect(0, panelY, width, panelHeight).fill(this.colorPanel);
    this.bg.rect(0, panelY, width, 2).fill(0x374151);

    this.countdownText.x = width / 2;
    this.countdownText.y = panelY + 20;

    const centerY = panelY + 75;
    const inputCenterX = width / 2 - 120;

    // Amount controls
    this.btnMinus.position.set(inputCenterX - 60, centerY);
    this.betValueText.position.set(inputCenterX, centerY);

    // Draw input background (need to redraw on resize)
    this.bg
      .roundRect(inputCenterX - 35, centerY - 20, 70, 40, 8)
      .fill(this.colorInput);

    this.betLabel.position.set(inputCenterX - 30, centerY - 38);
    this.btnPlus.position.set(inputCenterX + 60, centerY);

    // Place Button
    const btnCenterX = width / 2 + 50;
    this.btnPlace.x = btnCenterX;
    this.btnPlace.y = centerY - this.btnPlace.height / 2;
  }
}
