import { GameApp } from "./GameApp";
import { ApiClient } from "../network/api/ApiClient";
import { SocketClient } from "../network/socket/SocketClient";
import { BetPanelController } from "../game/ui/BetPanelController";
import { GameState } from "../game/state/GameState";

export class GameBootstrap {
  async start() {
    const token = this.getTokenFromUrl();

    const api = new ApiClient(token);
    const socket = new SocketClient(token);
    const state = new GameState();

    await socket.connect();
    state.bindSocket(socket);

    const app = new GameApp(state);
    await app.init();

    let isFetchingHistory = false;

    const loadHistory = async () => {
      if (isFetchingHistory) return;

      isFetchingHistory = true;

      try {
        const res = await api.getCrashHistory(20, 0);
        const history = res.data.rows.map((r) => r.crashRate);

        state.setHistory(history.reverse());
      } catch (e) {
        console.error("Failed to load history", e);
      } finally {
        isFetchingHistory = false;
      }
    };

    await loadHistory();


    state.on("crashed", () => {
   
        loadHistory();
    });

    const betPanel = new BetPanelController(api, state);
    betPanel.init();
  }

  private getTokenFromUrl(): string | null {
    const params = new URLSearchParams(window.location.search);
    return params.get("token");
  }
}
