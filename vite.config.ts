import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
// Cross-origin isolation headers — required for SharedArrayBuffer, which the
// v86 emulator uses for its fast WASM path (real Linux engine).
const coiHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  server: { headers: coiHeaders },
  preview: { headers: coiHeaders },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (
            id.includes('node_modules/react') ||
            id.includes('node_modules/react-dom') ||
            id.includes('node_modules/react-router')
          ) {
            return 'react';
          }
          if (id.includes('node_modules/framer-motion')) {
            return 'motion';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'icons';
          }
          if (id.includes('node_modules/canvas-confetti')) {
            return 'confetti';
          }
          if (id.includes('node_modules/v86') || id.includes('node_modules/@xterm')) {
            return 'realEngine';
          }
          return undefined;
        },
      },
    },
  },
});
