import { calculateCrashMultiplier } from '../utils/multiplier';
import { SocketClient } from '../../network/socket/SocketClient';

export enum RoundStatus {
  WAITING = 'WAITING',
  RUNNING = 'RUNNING',
  CRASHED = 'CRASHED',
}

type Listener = (payload?: any) => void;

export class GameState {
  roundId: string | null = null;
  multiplier = 1;
  status: RoundStatus = RoundStatus.WAITING;
  crashRate: number | null = null;

  private listeners: Record<string, Listener[]> = {};
  private isHydrated = false;

  // =====================================================
  // HYDRATION
  // =====================================================

  private markHydrated() {
    if (!this.isHydrated) {
      this.isHydrated = true;
      this.emit('hydrated');
    }
  }

  public get hydrated() {
    return this.isHydrated;
  }

  // =====================================================
  // SOCKET BINDING
  // =====================================================

  bindSocket(socket: SocketClient) {
    // Round created / new round initialized
    socket.on('/crash-game/roundStarted', (data) => {
      this.reset(data?.roundId ?? null);
      this.markHydrated();
    });

    // Waiting countdown
    socket.on('/crash-game/waitingTimer', (data) => {
      if (!data?.runningStatus) return;

      this.setWaiting(data.seconds);
      this.markHydrated();
    });

    // Betting closed → multiplier about to run
    socket.on('/crash-game/roundBettingOnHold', () => {
      this.startFlight();
      this.markHydrated();
    });

    // Multiplier ticking
    socket.on('/crash-game/graphTimer', (data) => {
      // If backend sends runningStatus false during graph
      if (!data?.runningStatus) {
        this.crash(this.multiplier);
        this.markHydrated();
        return;
      }

      // If user joined mid-flight, ensure status is correct
      if (this.status !== RoundStatus.RUNNING) {
        this.status = RoundStatus.RUNNING;
        this.emit('running');
      }

      this.updateFlight(data.seconds, data.secondTenths);
      this.markHydrated();
    });

    // Crash event
    socket.on('/crash-game/roundStopped', (data) => {
      this.crash(data.crashRate);
      this.markHydrated();
    });
  }

  // =====================================================
  // EVENT SYSTEM
  // =====================================================

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private emit(event: string, payload?: any) {
    this.listeners[event]?.forEach((cb) => cb(payload));
  }

  // =====================================================
  // STATE TRANSITIONS
  // =====================================================

  reset(roundId: string | null) {
    this.roundId = roundId;
    this.multiplier = 1;
    this.crashRate = null;
    this.status = RoundStatus.WAITING;

    this.emit('roundStarted', roundId);
  }

  setWaiting(seconds?: number) {
    this.status = RoundStatus.WAITING;
    this.emit('waiting', seconds);
  }

  startFlight() {
    this.status = RoundStatus.RUNNING;
    this.emit('running');
  }

  updateFlight(seconds: number, secondTenths: number) {
    if (this.status !== RoundStatus.RUNNING) return;

    this.multiplier = calculateCrashMultiplier(secondTenths / 10);

    this.emit('multiplier', this.multiplier);
  }

  crash(crashRate: number) {
    this.crashRate = crashRate;
    this.multiplier = crashRate;
    this.status = RoundStatus.CRASHED;

    this.emit('crashed', crashRate);
  }
}
