export class ApiClient {
  // private BASE_URL = "http://14.96.243.218:8004/api/v1";
  //private BASE_URL1 = "https://api-dev.grailbet.com/api/v1";
  private env_url = import.meta.env.VITE_API_BASE_URL;
  constructor(private token: string | null) {}

  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const res = await fetch(`${this.env_url}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: this.token ? `Bearer ${this.token}` : "",
      },
    });

    if (!res.ok) {
      throw new Error("API request failed");
    }

    return res.json();
  }

  placeBet(betAmount: number, autoRate?: number) {
    const currencyCode = "USD";
    return this.request("/crash-game/place-bet-crash-game", {
      method: "POST",
      body: JSON.stringify({ betAmount, autoRate, currencyCode }),
    });
  }

  cashOut() {
    return this.request("/crash-game/player-escape-crashGame", {
      method: "POST",
    });
  }

  cancelBet() {
    return this.request("/crash-game/cancel-bet-crash-game", {
      method: "POST",
    });
  }

  getCrashHistory(limit = 20, offset = 0) {
    return this.request<{
      data: {
        rows: { roundId: string; crashRate: number }[];
        count: number;
      };
    }>(`/crash-game/get-crash-game-history?limit=${limit}&offset=${offset}`, {
      method: "GET",
    });
  }
}
