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

// Make Pusher available globally
window.Pusher = Pusher

// Create Echo instance
export const echo = new Echo({
  broadcaster: 'pusher',
  key: import.meta.env.VITE_PUSHER_APP_KEY || 'your-pusher-key',
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

// Make Echo available globally
window.Echo = echo

export default echo




