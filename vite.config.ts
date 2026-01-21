import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/pipe': {
        target: 'https://api.pipedrive.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pipe/, '/api'),
        secure: false,
      },
    },
  },
});