import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { studyPilotApiPlugin } from './server/apiPlugin.js';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    studyPilotApiPlugin(),
    react(),
    tailwindcss()
  ],
  server: {
    port: 3000,
    host: '0.0.0.0'
  }
});
