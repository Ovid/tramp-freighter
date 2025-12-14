import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { aliases } from './shared-config.js';

export default defineConfig({
  plugins: [react()],
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
      ],
    },
    // Ensure clean test output
    silent: false,
    reporters: ['verbose'],
  },
});
