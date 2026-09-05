import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

(window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher;

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const apiOrigin = new URL(apiUrl).origin;
const reverbHost = import.meta.env.VITE_REVERB_HOST || new URL(apiOrigin).hostname;
const reverbPort = Number(import.meta.env.VITE_REVERB_PORT || 8080);
const useTls = import.meta.env.VITE_REVERB_SCHEME === 'https';

export const echo = new Echo({
  broadcaster: 'reverb',
  key: import.meta.env.VITE_REVERB_APP_KEY || 'local',
  wsHost: reverbHost,
  wsPort: reverbPort,
  wssPort: reverbPort,
  forceTLS: useTls,
  enabledTransports: useTls ? ['wss'] : ['ws'],
  authEndpoint: `${apiOrigin}/broadcasting/auth`,
  auth: {
    headers: {
      Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}`,
      Accept: 'application/json',
    },
  },
});
