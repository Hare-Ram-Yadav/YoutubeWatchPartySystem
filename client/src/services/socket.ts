import { io, Socket } from 'socket.io-client';

export const getBackendUrl = () => {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // Local development (localhost, 127.0.0.1)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:5000`;
  }

  // Production / Vercel deployment / Tunnels: use same origin because Vercel rewrites route /api and /socket.io to server
  return window.location.origin;
};

export const SERVER_URL = getBackendUrl();

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  extraHeaders: {
    'ngrok-skip-browser-warning': 'true',
    'Bypass-Tunnel-Reminder': 'true',
  },
  transportOptions: {
    polling: {
      extraHeaders: {
        'ngrok-skip-browser-warning': 'true',
        'Bypass-Tunnel-Reminder': 'true',
      },
    },
  },
});

export const connectSocket = () => {
  if (!socket.connected) {
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    socket.disconnect();
  }
};
