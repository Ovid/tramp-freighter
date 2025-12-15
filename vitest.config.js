import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { aliases } from './shared-config.js';
import path from 'path';

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
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'vendor/',
        '*.config.js',
        'dist/',
        'js/',
      ],
    },
    // Use default reporter for cleaner output
    reporters: ['default'],
  },
});
