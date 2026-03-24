export interface RoundStartedPayload {
  id: string;
  roundId: string;
  roundState: "1";
}

export interface WaitingTimerPayload {
  runningStatus: boolean;
  secondTenths: number;
  seconds: number;
  minutes: number;
  roundId: string;
}

export interface RoundBettingOnHoldPayload {
  id: string;
  roundId: string;
  roundState: "2";
  onHoldAt: string;
  roundSignature: string;
}

export interface GraphTimerPayload {
  runningStatus: boolean;
  secondTenths: number;
  seconds: number;
  onHoldAt: string;
  roundId: string;
}

export interface RoundStoppedPayload {
  id: string;
  roundId: string;
  crashRate: number;
  roundState: "0";
  roundHash: string;
  roundSignature: string;
  currentGameSettings: string;
}
