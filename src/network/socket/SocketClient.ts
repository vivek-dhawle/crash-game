import { io, Socket } from "socket.io-client";

type Listener = (data: unknown) => void;

export class SocketClient {
  private socket!: Socket;
  private listeners: Record<string, Listener[]> = {};

  constructor(private token: string | null) {}

  async connect() {
    const env_url = import.meta.env.VITE_SOCKET_URL;
    //const grail_url = "https://cron-dev.grailbet.com";

    this.socket = io(`${env_url}/crash-game`, {
      path: "/api/socket",
      transports: ["websocket"],
      auth: { token: this.token },
    });

    this.socket.on("connect", () => {
      console.log("Socket connected:", this.socket.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("Socket disconnected:", reason);
    });

    this.socket.on("connect_error", (err: Error) => {
      console.error("Socket error:", err.message);
    });

    this.socket.onAny((event, data) => {
      const payload = (data as { data?: unknown })?.data ?? data;
      this.emit(event, payload);
    });
  }

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private emit(event: string, data: unknown) {
    this.listeners[event]?.forEach((cb) => cb(data));
  }

  disconnect() {
    this.socket?.disconnect();
  }
}
