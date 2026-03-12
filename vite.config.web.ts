/**
 * Vite Config for Web Build
 * Pure web version without Electron plugins
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const devPort = 5176; // Different port to avoid conflict with Electron dev
const katexVersion = process.env.npm_package_dependencies_katex?.replace(/^[~^]/, '') || '0.16.10';

// Read API base URL from environment or use default
const apiBase = process.env.VITE_API_BASE_URL || 'http://localhost:3001';

export default defineConfig({
  define: {
    __VERSION__: JSON.stringify(katexVersion),
    // Define build mode constants
    __WEB_BUILD__: 'true',
    __ELECTRON_BUILD__: 'false',
  },
  plugins: [
    react(),
    // Note: No electron plugins - this is a pure web build
  ],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src/web'),
    },
  },
  build: {
    outDir: 'server/public',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-redux', '@reduxjs/toolkit'],
          'markdown-vendor': ['react-markdown', 'remark-gfm', 'remark-math', 'rehype-katex', 'mermaid'],
        },
      },
    },
  },
  server: {
    port: devPort,
    strictPort: false,
    host: true,
    // HMR will use the same port as the server (no need to specify separately)
    watch: {
      usePolling: true,
    },
    open: true,
    // Proxy API requests to backend server during development
    proxy: {
      '/api': {
        target: apiBase,
        changeOrigin: true,
      },
      // Proxy WebSocket connections
      '/ws': {
        target: apiBase.replace('http://', 'ws://').replace('https://', 'wss://'),
        ws: true,
      },
    },
  },
  preview: {
    port: 4173,
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        __VERSION__: JSON.stringify(katexVersion),
      },
    },
  },
  clearScreen: false,
});
