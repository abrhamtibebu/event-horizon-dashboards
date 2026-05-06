import Echo from 'laravel-echo'
import Pusher from 'pusher-js'
import { getApiBaseURL } from '@/config/env'

// Extend Window interface to include Pusher
declare global {
  interface Window {
    Pusher: typeof Pusher
    Echo: Echo
  }
}

const rawPusherKey = (import.meta.env.VITE_PUSHER_APP_KEY as string | undefined)?.trim() ?? ''

/** False when key is missing or still a placeholder — avoids noisy failed WebSocket attempts. */
export const isPusherConfigured =
  rawPusherKey.length > 0 && !/^your[-_]?pusher[-_]?key$/i.test(rawPusherKey)

function createEchoStub(): Echo {
  const noopChannel = {
    listen: () => noopChannel,
    stopListening: () => noopChannel,
    subscribed: () => noopChannel,
  }
  return {
    private: () => noopChannel as never,
    leave: () => {},
    disconnect: () => {},
  } as unknown as Echo
}

const echoInstance: Echo = isPusherConfigured
  ? (() => {
      window.Pusher = Pusher
      return new Echo({
        broadcaster: 'pusher',
        key: rawPusherKey,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1',
        forceTLS: true,
        authEndpoint: `${getApiBaseURL()}/broadcasting/auth`,
        auth: {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('jwt') || sessionStorage.getItem('jwt') || ''}`,
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
        enabledTransports: ['ws', 'wss'],
      })
    })()
  : createEchoStub()

export const echo = echoInstance

window.Echo = echo

export default echo
