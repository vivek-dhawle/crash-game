import { ApiClient } from "../../network/api/ApiClient";
import { GameState, RoundStatus } from "../../game/state/GameState";

enum BetState {
  IDLE,
  ACTIVE,
  CASHED_OUT,
  NEXT_ROUND_PENDING,
}

export class BetPanelController {
  private placeBtn!: HTMLButtonElement;
  private cancelBtn!: HTMLButtonElement;
  private placeNextBtn!: HTMLButtonElement;
  private cancelNextBtn!: HTMLButtonElement;
  private cashoutBtn!: HTMLButtonElement;

  private amountInput!: HTMLInputElement;
  private autoInput!: HTMLInputElement;

  private popup!: HTMLDivElement;
  private popupMultiplier!: HTMLElement;
  private popupAmount!: HTMLElement;

  private betState: BetState = BetState.IDLE;

  private isAutoCashingOut = false;
  private currentMultiplier = 1;

  constructor(
    private api: ApiClient,
    private state: GameState,
  ) {}

  init() {
    // buttons
    this.placeBtn = document.getElementById(
      "place-bet-btn",
    ) as HTMLButtonElement;
    this.cancelBtn = document.getElementById(
      "cancel-bet-btn",
    ) as HTMLButtonElement;
    this.placeNextBtn = document.getElementById(
      "place-next-btn",
    ) as HTMLButtonElement;
    this.cancelNextBtn = document.getElementById(
      "cancel-next-btn",
    ) as HTMLButtonElement;
    this.cashoutBtn = document.getElementById(
      "cashout-btn",
    ) as HTMLButtonElement;

    // inputs
    this.amountInput = document.getElementById(
      "bet-amount",
    ) as HTMLInputElement;
    this.autoInput = document.getElementById(
      "auto-cashout",
    ) as HTMLInputElement;

    // popup
    this.popup = document.getElementById("cashout-popup") as HTMLDivElement;
    this.popupMultiplier = document.getElementById("cashout-multiplier")!;
    this.popupAmount = document.getElementById("cashout-amount")!;

    this.attachEvents();
    this.attachStateListeners();
    this.render();
  }

  // ------------------------------------------------
  // EVENTS
  // ------------------------------------------------

  private attachEvents() {
    this.placeBtn.onclick = () => this.placeBet();
    this.cancelBtn.onclick = () => this.cancelBet();
    this.placeNextBtn.onclick = () => this.queueNext();
    this.cancelNextBtn.onclick = () => this.cancelNext();
    this.cashoutBtn.onclick = () => this.cashout();
  }

  private attachStateListeners() {
    // NEW ROUND
    this.state.on("waiting", async () => {
      this.isAutoCashingOut = false;
      this.currentMultiplier = 1;

      // reset cashout button
      this.cashoutBtn.disabled = false;

      if (this.betState === BetState.NEXT_ROUND_PENDING) {
        await this.placeBet();
      }

      this.render();
    });

    this.state.on("running", () => this.render());

    this.state.on("crashed", () => {
      if (
        this.betState === BetState.ACTIVE ||
        this.betState === BetState.CASHED_OUT
      ) {
        this.betState = BetState.IDLE;
      }
      this.render();
    });

    this.state.on("hydrated", () => this.render());

    // MULTIPLIER LISTENER
    this.state.on("multiplier", (multiplier: number) => {
      this.currentMultiplier = multiplier;

      const auto = Number(this.autoInput.value);

      if (
        this.betState === BetState.ACTIVE &&
        multiplier >= auto &&
        !this.isAutoCashingOut
      ) {
        this.isAutoCashingOut = true;
        this.handleAutoCashout();
      }
    });
  }

  // ------------------------------------------------
  // SAFETY
  // ------------------------------------------------

  private isBlocked() {
    return this.state.status === RoundStatus.CRASHED;
  }

  // ------------------------------------------------
  // ACTIONS
  // ------------------------------------------------

  private async placeBet() {
    if (this.isBlocked()) return;

    const amount = Number(this.amountInput.value);
    const auto = Number(this.autoInput.value);

    try {
      await this.api.placeBet(amount, auto);
      this.betState = BetState.ACTIVE;
    } catch {
      //do nothing
    }

    this.render();
  }

  private async cancelBet() {
    if (this.isBlocked()) return;

    try {
      await this.api.cancelBet();
      this.betState = BetState.IDLE;
    } catch {
      //do nothing
    }

    this.render();
  }

  private queueNext() {
    if (this.isBlocked()) return;
    this.betState = BetState.NEXT_ROUND_PENDING;
    this.render();
  }

  private cancelNext() {
    if (this.isBlocked()) return;
    this.betState = BetState.IDLE;
    this.render();
  }

  // MANUAL CASHOUT
  private async cashout() {
    if (this.isBlocked()) return;
    if (this.cashoutBtn.disabled) return;

    const multiplier = this.currentMultiplier;

    // instant UI feedback
    this.showCashout(multiplier);

    try {
      this.cashoutBtn.disabled = true;

      await this.api.cashOut();

      this.betState = BetState.CASHED_OUT;
    } catch {
      //do nothing
    }

    this.render();
  }

  // AUTO CASHOUT
  private async handleAutoCashout() {
    const multiplier = this.currentMultiplier;

    // instant UI feedback
    this.showCashout(multiplier);

    try {
      await this.api.cashOut();
      this.betState = BetState.CASHED_OUT;
    } catch {
      //do nothing
    }

    this.render();
  }

  // ------------------------------------------------
  // POPUP (TOP TOAST)
  // ------------------------------------------------

  private showCashout(multiplier: number) {
    const betAmount = Number(this.amountInput.value);
    const winAmount = betAmount * multiplier;

    this.popupMultiplier.textContent = `${multiplier.toFixed(2)}x`;
    this.popupAmount.textContent = `$${winAmount.toFixed(2)}`;

    // reset animation
    this.popup.classList.remove("hidden");
    this.popup.classList.remove("animate-slideUp", "animate-slideDown");

    void this.popup.offsetWidth;

    // show
    this.popup.classList.add("animate-slideDown");

    // 🔥 STAY LONGER (4s instead of 2s)
    setTimeout(() => {
      this.popup.classList.remove("animate-slideDown");
      this.popup.classList.add("animate-slideUp");

      setTimeout(() => {
        this.popup.classList.add("hidden");
      }, 350);
    }, 4000); // ⬅️ increased duration
  }

  // ------------------------------------------------
  // UI HELPERS
  // ------------------------------------------------

  private disableBtn(btn: HTMLButtonElement) {
    btn.disabled = true;
    btn.style.pointerEvents = "none";
    btn.style.opacity = "0.5";
  }

  private enableBtn(btn: HTMLButtonElement) {
    btn.disabled = false;
    btn.style.pointerEvents = "auto";
    btn.style.opacity = "1";
  }

  private hideAll() {
    const all = [
      this.placeBtn,
      this.cancelBtn,
      this.placeNextBtn,
      this.cancelNextBtn,
      this.cashoutBtn,
    ];

    for (const btn of all) {
      btn.classList.add("hidden");
      this.enableBtn(btn);
    }
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  private render() {
    const round = this.state.status;

    this.hideAll();

    if (!this.state.hydrated) {
      this.placeBtn.classList.remove("hidden");
      return;
    }

    // CRASHED
    if (round === RoundStatus.CRASHED) {
      if (this.betState === BetState.NEXT_ROUND_PENDING) {
        this.cancelNextBtn.classList.remove("hidden");
        this.disableBtn(this.cancelNextBtn);
      } else {
        this.placeNextBtn.classList.remove("hidden");
        this.disableBtn(this.placeNextBtn);
      }
      return;
    }

    // WAITING
    if (round === RoundStatus.WAITING) {
      if (this.betState === BetState.ACTIVE) {
        this.cancelBtn.classList.remove("hidden");
      } else {
        this.placeBtn.classList.remove("hidden");
      }
      return;
    }

    // RUNNING
    if (round === RoundStatus.RUNNING) {
      if (this.betState === BetState.ACTIVE) {
        this.cashoutBtn.classList.remove("hidden");
        return;
      }

      if (this.betState === BetState.CASHED_OUT) {
        this.placeNextBtn.classList.remove("hidden");
        return;
      }

      if (this.betState === BetState.NEXT_ROUND_PENDING) {
        this.cancelNextBtn.classList.remove("hidden");
        return;
      }

      if (this.betState === BetState.IDLE) {
        this.placeNextBtn.classList.remove("hidden");
        return;
      }
    }

    // fallback
    this.placeBtn.classList.remove("hidden");
  }
}
