import { GameApp } from './GameApp';
import { ApiClient } from '../network/api/ApiClient';
import { SocketClient } from '../network/socket/SocketClient';
import { BetPanelController } from '../game/ui/BetPanelController';
import { GameState } from '../game/state/GameState';

export class GameBootstrap {
  async start() {
    const token = this.getTokenFromUrl();

    const api = new ApiClient(token);
    const socket = new SocketClient(token);
    const state = new GameState();

    await socket.connect();

    // 🔥 Bind socket to state (single source of truth)
    state.bindSocket(socket);

    // Start Pixi
    const app = new GameApp(state);
    await app.init();

    // Start HTML UI
    const betPanel = new BetPanelController(api, state);
    betPanel.init();
  }

  private getTokenFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get('token');
  }
}
