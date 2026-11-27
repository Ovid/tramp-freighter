import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'path';

// Major.minor come from package.json and are bumped by hand for releases.
// The patch is the git commit count, so it rises on every commit without
// anyone remembering to bump it. A shallow clone undercounts it.
function appVersion() {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  const [major, minor] = version.split('.');
  return `${major}.${minor}.${commitCount()}`;
}

// Without git (a ZIP export, a container without .git, a "dubious ownership"
// refusal) the build must still run; a cosmetic version is not worth failing
// it over.
function commitCount() {
  try {
    return execSync('git rev-list --count HEAD', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim();
  } catch {
    return '0';
  }
}

export const define = {
  __APP_VERSION__: JSON.stringify(appVersion()),
};

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
];
