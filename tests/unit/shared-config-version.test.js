import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';

// A ZIP export, a git-less machine or a "dubious ownership" refusal all make
// git fail; the build must still load its config.
vi.mock('node:child_process', () => ({
  execSync: () => {
    throw new Error('git: command not found');
  },
}));

const { define } = await import('../../shared-config.js');

describe('build version without git', () => {
  it('falls back to a patch of 0 when git cannot count commits', () => {
    const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
    const [major, minor] = version.split('.');
    expect(JSON.parse(define.__APP_VERSION__)).toBe(`${major}.${minor}.0`);
  });
});
