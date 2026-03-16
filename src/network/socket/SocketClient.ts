import { io, Socket } from 'socket.io-client';

type Listener = (data: any) => void;

export class SocketClient {
  private socket!: Socket;
  private listeners: Record<string, Listener[]> = {};

  constructor(private token: string | null) {}

  async connect() {
    const TIG_GAME_ENGINE_URL = 'http://194.37.82.191:8007';
    const LOCAL_ENGINE_URL = 'http://localhost:8080';

    this.socket = io(`${TIG_GAME_ENGINE_URL}/crash-game`, {
      path: '/api/socket',
      transports: ['websocket'],
      auth: { token: this.token },
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Socket error:', err);
    });

    this.socket.onAny((event, data) => {
      this.emit(event, data?.data ?? data);
    });
  }

  on(event: string, callback: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }

  private emit(event: string, data: any) {
    this.listeners[event]?.forEach((cb) => cb(data));
  }
}
