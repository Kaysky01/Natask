import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { api } from './client';

(window as Window & { Pusher?: typeof Pusher }).Pusher = Pusher;

const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const apiOrigin = new URL(apiUrl, window.location.origin).origin;
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
  authorizer: (channel: { name: string }) => {
    return {
      authorize: (socketId: string, callback: (error: any, data: any) => void) => {
        api
          .post(
            '/broadcasting/auth',
            {
              socket_id: socketId,
              channel_name: channel.name,
            },
            {
              baseURL: apiOrigin,
            }
          )
          .then((response) => {
            callback(null, response.data);
          })
          .catch((error) => {
            callback(error, null);
          });
      },
    };
  },
});
