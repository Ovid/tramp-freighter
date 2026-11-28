import { describe, it, expect, vi } from 'vitest';
import {
  applyMigrations,
  migrateFromV4_1ToV5,
} from '@game/state/state-validators.js';
import { STAR_DATA } from '@game/data/star-data.js';

// Simulates the next save-format bump before its migration step exists. Each
// step must stamp the version it produces, not the current one, or a later
// step keyed on that version would be skipped for every older save.
vi.mock('@game/constants.js', async (importOriginal) => ({
  ...(await importOriginal()),
  SAVE_FORMAT_VERSION: '6.0.0',
}));

describe('migration chain after a save-format bump', () => {
  it('the v4.1 step stamps 5.0.0, not the current version', () => {
    const result = migrateFromV4_1ToV5({ meta: { version: '4.1.0' } });

    expect(result.meta.version).toBe('5.0.0');
  });

  it('refuses a save the chain cannot bring to the current version', () => {
    expect(() =>
      applyMigrations({ meta: { version: '4.1.0' } }, STAR_DATA)
    ).toThrow('6.0.0');
  });
});
