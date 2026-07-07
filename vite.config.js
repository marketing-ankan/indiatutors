import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import laravel from 'laravel-vite-plugin';

export default defineConfig({
  plugins: [
    laravel({ input: ['resources/css/app.css', 'resources/js/main.jsx'], refresh: true }),
    react(),
  ],
  server: {
    host: '127.0.0.1',
    port: 5173,
    cors: true,
  },
});
