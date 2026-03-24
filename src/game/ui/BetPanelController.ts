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

  private betState: BetState = BetState.IDLE;

  constructor(
    private api: ApiClient,
    private state: GameState,
  ) {}

  init() {
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

    this.amountInput = document.getElementById(
      "bet-amount",
    ) as HTMLInputElement;
    this.autoInput = document.getElementById(
      "auto-cashout",
    ) as HTMLInputElement;

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
    this.state.on("waiting", async () => {
      // auto place next round bet
      if (this.betState === BetState.NEXT_ROUND_PENDING) {
        await this.placeBet();
      }
      this.render();
    });

    this.state.on("running", () => this.render());

    this.state.on("crashed", () => {
      // reset after round ends
      if (
        this.betState === BetState.ACTIVE ||
        this.betState === BetState.CASHED_OUT
      ) {
        this.betState = BetState.IDLE;
      }
      this.render();
    });

    this.state.on("hydrated", () => this.render());
  }

  // ------------------------------------------------
  // SAFETY (block clicks when crashed)
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
    } catch {}

    this.render();
  }

  private async cancelBet() {
    if (this.isBlocked()) return;

    try {
      await this.api.cancelBet();
      this.betState = BetState.IDLE;
    } catch {}

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

  private async cashout() {
    if (this.isBlocked()) return;

    try {
      await this.api.cashOut();
      this.betState = BetState.CASHED_OUT;
    } catch {}

    this.render();
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

    // 🔴 CRASHED → everything disabled
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

    // 🟡 WAITING
    if (round === RoundStatus.WAITING) {
      if (this.betState === BetState.ACTIVE) {
        this.cancelBtn.classList.remove("hidden");
      } else {
        this.placeBtn.classList.remove("hidden");
      }
      return;
    }

    // 🟢 RUNNING
    if (round === RoundStatus.RUNNING) {
      // ✅ Active bet → cashout
      if (this.betState === BetState.ACTIVE) {
        this.cashoutBtn.classList.remove("hidden");
        return;
      }

      // ✅ Cashed out → next round actions
      if (this.betState === BetState.CASHED_OUT) {
        this.placeNextBtn.classList.remove("hidden");
        return;
      }

      // ✅ Already queued next round
      if (this.betState === BetState.NEXT_ROUND_PENDING) {
        this.cancelNextBtn.classList.remove("hidden");
        return;
      }

      // ✅ NEW: No bet placed → allow place next round
      if (this.betState === BetState.IDLE) {
        this.placeNextBtn.classList.remove("hidden");
        return;
      }
    }

    // fallback
    this.placeBtn.classList.remove("hidden");
  }
}
