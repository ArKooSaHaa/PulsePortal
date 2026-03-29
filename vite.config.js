import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
    server: {
        host: '127.0.0.1',   // important
        port: 5174,
        strictPort: true,    // prevents fallback to 5173
        hmr: {
            host: '127.0.0.1',
            port: 5174,
        },
    },
    plugins: [
        laravel({
            input: ['resources/css/app.css', 'resources/js/app.js'],
            refresh: true,
        }),
    ],
});