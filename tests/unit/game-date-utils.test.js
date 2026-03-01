import { describe, it, expect } from 'vitest';
import { gameDayToDate } from '../../src/game/utils/date-utils.js';

describe('gameDayToDate', () => {
  it('returns the start date on day 0', () => {
    expect(gameDayToDate(0)).toBe('2167-06-20');
  });

  it('advances one calendar day per game day', () => {
    expect(gameDayToDate(1)).toBe('2167-06-21');
    expect(gameDayToDate(10)).toBe('2167-06-30');
  });

  it('handles month boundaries', () => {
    // June has 30 days; day 11 = July 1
    expect(gameDayToDate(11)).toBe('2167-07-01');
  });

  it('handles year boundaries', () => {
    // 2167-06-20 + 195 days = 2168-01-01
    expect(gameDayToDate(195)).toBe('2168-01-01');
  });

  it('floors fractional days', () => {
    expect(gameDayToDate(1.9)).toBe('2167-06-21');
  });
});
