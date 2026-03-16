import { ApiClient } from '../../network/api/ApiClient';
import { GameState, RoundStatus } from '../../game/state/GameState';

enum BetState {
  IDLE,
  NEXT_ROUND_PENDING,
  ACTIVE,
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
    this.placeBtn = document.getElementById('place-bet-btn') as HTMLButtonElement;
    this.cancelBtn = document.getElementById('cancel-bet-btn') as HTMLButtonElement;
    this.placeNextBtn = document.getElementById('place-next-btn') as HTMLButtonElement;
    this.cancelNextBtn = document.getElementById('cancel-next-btn') as HTMLButtonElement;
    this.cashoutBtn = document.getElementById('cashout-btn') as HTMLButtonElement;

    this.amountInput = document.getElementById('bet-amount') as HTMLInputElement;
    this.autoInput = document.getElementById('auto-cashout') as HTMLInputElement;

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
    this.state.on('waiting', async () => {
      if (this.betState === BetState.NEXT_ROUND_PENDING) {
        await this.placeBet();
      }
      this.render();
    });

    this.state.on('running', () => this.render());

    this.state.on('crashed', () => {
      // Only reset if bet was active
      if (this.betState === BetState.ACTIVE) {
        this.betState = BetState.IDLE;
      }
      this.render();
    });

    this.state.on('hydrated', () => this.render());
  }

  // ------------------------------------------------
  // BET ACTIONS
  // ------------------------------------------------

  private async placeBet() {
    const amount = Number(this.amountInput.value);
    const auto = Number(this.autoInput.value);

    try {
      await this.api.placeBet(amount, auto);
      this.betState = BetState.ACTIVE;
    } catch {}

    this.render();
  }

  private async cancelBet() {
    try {
      await this.api.cancelBet();
      this.betState = BetState.IDLE;
    } catch {}

    this.render();
  }

  private queueNext() {
    this.betState = BetState.NEXT_ROUND_PENDING;
    this.render();
  }

  private cancelNext() {
    this.betState = BetState.IDLE;
    this.render();
  }

  private async cashout() {
    try {
      await this.api.cashOut();
      this.betState = BetState.IDLE;
    } catch {}

    this.render();
  }

  // ------------------------------------------------
  // RENDER
  // ------------------------------------------------

  private hideAll() {
    this.placeBtn.classList.add('hidden');
    this.cancelBtn.classList.add('hidden');
    this.placeNextBtn.classList.add('hidden');
    this.cancelNextBtn.classList.add('hidden');
    this.cashoutBtn.classList.add('hidden');
  }

  private render() {
    const round = this.state.status;

    this.hideAll();

    // 🚨 Safety fallback if not hydrated yet
    if (!this.state.hydrated) {
      this.placeBtn.classList.remove('hidden');
      return;
    }

    // ----------------------------
    // CRASHED
    // ----------------------------
    if (round === RoundStatus.CRASHED) {
      if (this.betState === BetState.NEXT_ROUND_PENDING) {
        this.cancelNextBtn.classList.remove('hidden');
      } else {
        this.placeNextBtn.classList.remove('hidden');
      }
      return;
    }

    // ----------------------------
    // WAITING
    // ----------------------------
    if (round === RoundStatus.WAITING) {
      if (this.betState === BetState.ACTIVE) {
        this.cancelBtn.classList.remove('hidden');
      } else {
        this.placeBtn.classList.remove('hidden');
      }
      return;
    }

    // ----------------------------
    // RUNNING
    // ----------------------------
    if (round === RoundStatus.RUNNING) {
      if (this.betState === BetState.ACTIVE) {
        this.cashoutBtn.classList.remove('hidden');
      } else {
        // Betting closed but show disabled place button
        this.placeBtn.classList.remove('hidden');
        this.placeBtn.disabled = true;
      }
      return;
    }

    // 🚨 Final fallback (should never hit)
    this.placeBtn.classList.remove('hidden');
  }
}
