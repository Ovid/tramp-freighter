import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { aliases } from './shared-config.js';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Custom plugin to handle three/addons/* imports
    {
      name: 'three-addons-resolver',
      enforce: 'pre',
      resolveId(id) {
        if (id.startsWith('three/addons/')) {
          const subpath = id.replace('three/addons/', '');
          return path.resolve(
            process.cwd(),
            `vendor/three/examples/jsm/${subpath}`
          );
        }
        return null;
      },
    },
  ],
  resolve: {
    alias: aliases,
  },
  server: {
    port: 5173,
    open: false,
    fs: {
      // Allow serving .dev file without parsing it as JS
      allow: ['.'],
    },
  },
  // Exclude .dev from being processed as a module
  assetsInclude: ['**/.dev'],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          three: ['three'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/', 'vendor/', '*.config.js'],
    },
  },
});
