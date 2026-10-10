import { io, Socket } from 'socket.io-client';

export const DEFAULT_RENDER_BACKEND = 'https://youtubewatchpartysystem.onrender.com';

export const getBackendUrl = (): string => {
  // 1. Check runtime localStorage override (allows connecting deployed frontend to custom backend easily)
  if (typeof window !== 'undefined' && window.localStorage) {
    const customUrl = window.localStorage.getItem('WATCHPARTY_BACKEND_URL');
    if (customUrl && customUrl.trim()) {
      return customUrl.trim().replace(/\/+$/, '');
    }
  }

  // 2. Build-time Vite environment variable
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL.trim().replace(/\/+$/, '');
  }

  const hostname = window.location.hostname;
  const protocol = window.location.protocol;

  // 3. Local development (localhost, 127.0.0.1)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return `${protocol}//${hostname}:5000`;
  }

  // 4. Direct Render hosting (frontend & backend hosted together on same origin)
  if (hostname.includes('onrender.com')) {
    return window.location.origin;
  }

  // 5. Vercel deployment or external client: automatically connect to Render backend
  return DEFAULT_RENDER_BACKEND;
};

export const setCustomBackendUrl = (url: string) => {
  if (url && url.trim()) {
    localStorage.setItem('WATCHPARTY_BACKEND_URL', url.trim().replace(/\/+$/, ''));
  } else {
    localStorage.removeItem('WATCHPARTY_BACKEND_URL');
  }
  window.location.reload();
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
