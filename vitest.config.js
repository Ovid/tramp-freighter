import { configDefaults, defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { aliases } from './shared-config.js';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: aliases,
  },
  test: {
    globals: true,
    environment: 'node',
    environmentMatchGlobs: [
      ['**/*.test.jsx', 'jsdom'],
      ['tests/property/hud-condition-bar-*.property.test.js', 'jsdom'],
      ['tests/unit/modal-dialog.test.js', 'jsdom'],
    ],
    setupFiles: './tests/setup.js',
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['node_modules/', 'tests/', '*.config.js', 'dist/'],
    },
    reporters: ['default'],
  },
});
