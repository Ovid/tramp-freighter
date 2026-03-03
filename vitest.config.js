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
    environment: 'jsdom',
    setupFiles: './tests/setup.js',
    exclude: [...configDefaults.exclude, '**/.worktrees/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**'],
      exclude: ['node_modules/', 'tests/', '*.config.js', 'dist/'],
    },
    // Use default reporter for cleaner output
    reporters: ['default'],
  },
});
