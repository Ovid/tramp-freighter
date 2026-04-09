import { describe, it, expect } from 'vitest';
import { getPageTitle } from '../../src/game/utils/page-title.js';

describe('getPageTitle', () => {
  it('returns base title for TITLE view mode', () => {
    expect(getPageTitle('TITLE')).toBe('Tramp Freighter Blues');
  });

  it('returns descriptive title for ORBIT view mode', () => {
    expect(getPageTitle('ORBIT')).toBe('Starmap - Tramp Freighter Blues');
  });

  it('returns descriptive title for STATION view mode', () => {
    expect(getPageTitle('STATION')).toBe('Station - Tramp Freighter Blues');
  });

  it('returns descriptive title for ENCOUNTER view mode', () => {
    expect(getPageTitle('ENCOUNTER')).toBe('Encounter - Tramp Freighter Blues');
  });

  it('returns base title for unknown view mode', () => {
    expect(getPageTitle('UNKNOWN')).toBe('Tramp Freighter Blues');
  });
});
