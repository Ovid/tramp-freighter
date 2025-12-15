import path from 'path';

/**
 * Shared configuration for Vite and Vitest.
 * Centralizes path aliases to avoid duplication between build and test configs.
 */
export const aliases = [
  { find: '@', replacement: path.resolve(process.cwd(), './src') },
  {
    find: '@components',
    replacement: path.resolve(process.cwd(), './src/components'),
  },
  {
    find: '@features',
    replacement: path.resolve(process.cwd(), './src/features'),
  },
  { find: '@hooks', replacement: path.resolve(process.cwd(), './src/hooks') },
  {
    find: '@context',
    replacement: path.resolve(process.cwd(), './src/context'),
  },
  { find: '@game', replacement: path.resolve(process.cwd(), './src/game') },
  {
    find: '@assets',
    replacement: path.resolve(process.cwd(), './src/assets'),
  },
  // Ensure all Three.js imports resolve to vendor directory
  {
    find: 'three',
    replacement: path.resolve(
      process.cwd(),
      './vendor/three/build/three.module.js'
    ),
  },
];
