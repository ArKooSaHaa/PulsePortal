import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axios from 'axios';

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
            headers: {},
        },
        authorizer: (channel, options) => {
            return {
                authorize: (socketId, callback) => {
                    axios.post(options.authEndpoint, {
                        socket_id: socketId,
                        channel_name: channel.name
                    }, {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                            Accept: 'application/json'
                        }
                    })
                    .then(response => {
                        callback(false, response.data);
                    })
                    .catch(error => {
                        callback(true, error);
                    });
                }
            };
        },
    });
} else {
    console.warn('[PulsePortal] VITE_PUSHER_APP_KEY is not set – real-time notifications disabled.');
    // Provide a no-op echo so the rest of the app doesn't crash
    echo = { private: () => ({ listen: () => ({}), stopListening: () => ({}) }) };
}

export default echo;