import { calculateCrashMultiplier } from "../utils/multiplier";
import { SocketClient } from "../../network/socket/SocketClient";

export enum RoundStatus {
  WAITING = "WAITING",
  RUNNING = "RUNNING",
  CRASHED = "CRASHED",
}

type GameEvents = {
  hydrated: void;
  roundStarted: string | null;
  waiting: number | undefined;
  running: void;
  multiplier: number;
  playCrash: void;
  crashed: number;
  history: number[];
};

export class GameState {
  roundId: string | null = null;
  multiplier = 1;
  status: RoundStatus = RoundStatus.WAITING;
  crashRate: number | null = null;
  private history: number[] = [];

  private listeners: {
    [K in keyof GameEvents]?: ((payload: GameEvents[K]) => void)[];
  } = {};

  private isHydrated = false;
  public isCrashed = { value: false };

  private markHydrated() {
    if (!this.isHydrated) {
      this.isHydrated = true;
      this.emit("hydrated", undefined as void);
    }
  }

  public get hydrated() {
    return this.isHydrated;
  }

  bindSocket(socket: SocketClient) {
    socket.on("/crash-game/roundStarted", (data: unknown) => {
      const typedData = data as { roundId?: string };
      this.reset(typedData?.roundId ?? null);
      this.markHydrated();
    });

    socket.on("/crash-game/waitingTimer", (data: unknown) => {
      const typedData = data as { runningStatus?: boolean; seconds?: number };
      if (!typedData?.runningStatus) return;

      this.setWaiting(typedData.seconds);
      this.markHydrated();
    });

    socket.on("/crash-game/roundBettingOnHold", () => {
      this.startFlight();
      this.markHydrated();
    });

    socket.on("/crash-game/graphTimer", (data: unknown) => {
      const typedData = data as {
        runningStatus?: boolean;
        crashRate?: number;
        seconds?: number;
        secondTenths?: number;
      };
      if (!typedData?.runningStatus) {
        this.crash(typedData.crashRate ?? 0);
        this.markHydrated();
        return;
      }

      if (this.status !== RoundStatus.RUNNING) {
        this.status = RoundStatus.RUNNING;
        this.emit("running", undefined as void);
      }

      this.updateFlight(typedData.seconds ?? 0, typedData.secondTenths ?? 0);
      this.markHydrated();
    });

    socket.on("/crash-game/roundStopped", () => {
      this.markHydrated();
    });
  }

  on<K extends keyof GameEvents>(
    event: K,
    callback: (payload: GameEvents[K]) => void,
  ) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]!.push(callback);
  }

  private emit<K extends keyof GameEvents>(event: K, payload: GameEvents[K]) {
    this.listeners[event]?.forEach((cb) => cb(payload));
  }

  reset(roundId: string | null) {
    this.roundId = roundId;
    this.multiplier = 1;
    this.crashRate = null;
    this.status = RoundStatus.WAITING;
    this.isCrashed.value = false;

    this.emit("roundStarted", roundId);
  }

  setWaiting(seconds?: number) {
    this.status = RoundStatus.WAITING;
    this.emit("waiting", seconds);
  }

  startFlight() {
    this.status = RoundStatus.RUNNING;
    this.emit("running", undefined as void);
  }

  updateFlight(seconds: number, secondTenths: number) {
    if (this.status !== RoundStatus.RUNNING) return;
    seconds = seconds + 1 - 1;
    this.multiplier = calculateCrashMultiplier(secondTenths / 10);
    this.emit("multiplier", this.multiplier);
  }

  crash(crashRate: number) {
    this.crashRate = crashRate;
    this.multiplier = crashRate;
    this.status = RoundStatus.CRASHED;

    if (this.history.length > 20) {
      this.history.pop();
    }
    this.emit("playCrash", undefined as void);
    this.emit("crashed", crashRate);
  }

  setHistory(history: number[]) {
    this.history = history.slice(0, 20);
    this.emit("history", [...this.history].reverse());
  }
}
