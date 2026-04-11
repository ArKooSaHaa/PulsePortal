import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const pusherKey = import.meta.env.VITE_PUSHER_APP_KEY;

let echo;

if (pusherKey) {
    echo = new Echo({
        broadcaster: 'pusher',
        key: pusherKey,
        cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
        forceTLS: true,
        authEndpoint: (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace('/api', '') + '/broadcasting/auth',
        auth: {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,
                Accept: 'application/json',
            },
        },
    });
} else {
    console.warn('[PulsePortal] VITE_PUSHER_APP_KEY is not set – real-time notifications disabled.');
    // Provide a no-op echo so the rest of the app doesn't crash
    echo = { private: () => ({ listen: () => ({}), stopListening: () => ({}) }) };
}

export default echo;