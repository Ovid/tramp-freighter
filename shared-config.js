import path from 'path';

/**
 * Shared configuration for Vite and Vitest.
 * Centralizes path aliases to avoid duplication between build and test configs.
 */
export const aliases = {
  '@': path.resolve(process.cwd(), './src'),
  '@components': path.resolve(process.cwd(), './src/components'),
  '@features': path.resolve(process.cwd(), './src/features'),
  '@hooks': path.resolve(process.cwd(), './src/hooks'),
  '@context': path.resolve(process.cwd(), './src/context'),
  '@game': path.resolve(process.cwd(), './src/game'),
  '@assets': path.resolve(process.cwd(), './src/assets'),
};
