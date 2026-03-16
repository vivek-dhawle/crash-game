export class ApiClient {
  private BASE_URL = 'http://194.37.82.191:8004/api/v1';

  constructor(private token: string | null) {}

  private async request<T>(path: string, options: RequestInit): Promise<T> {
    const res = await fetch(`${this.BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: this.token ? `Bearer ${this.token}` : '',
      },
    });

    if (!res.ok) {
      throw new Error('API request failed');
    }

    return res.json();
  }

  placeBet(betAmount: number, autoRate?: number) {
    const currencyCode = 'USD';
    return this.request('/crash-game/place-bet-crash-game', {
      method: 'POST',
      body: JSON.stringify({ betAmount, autoRate, currencyCode }),
    });
  }

  cashOut() {
    return this.request('/crash-game/player-escape-crashGame', {
      method: 'POST',
    });
  }

  cancelBet() {
    return this.request('/crash-game/cancel-bet-crash-game', {
      method: 'POST',
    });
  }
}
