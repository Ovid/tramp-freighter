import { describe, it, expect } from 'vitest';
import {
  getKarmaLabel,
  getFactionLabel,
} from '../../src/features/achievements/StatsSection';

describe('getKarmaLabel', () => {
  it('returns Saint for karma >= 75', () => {
    expect(getKarmaLabel(75)).toBe('Saint');
    expect(getKarmaLabel(100)).toBe('Saint');
  });

  it('returns Virtuous for karma 50-74', () => {
    expect(getKarmaLabel(50)).toBe('Virtuous');
    expect(getKarmaLabel(74)).toBe('Virtuous');
  });

  it('returns Decent for karma 25-49', () => {
    expect(getKarmaLabel(25)).toBe('Decent');
    expect(getKarmaLabel(49)).toBe('Decent');
  });

  it('returns Neutral for karma -24 to 24', () => {
    expect(getKarmaLabel(0)).toBe('Neutral');
    expect(getKarmaLabel(24)).toBe('Neutral');
    expect(getKarmaLabel(-24)).toBe('Neutral');
  });

  it('returns Shady for karma -25 to -49', () => {
    expect(getKarmaLabel(-25)).toBe('Shady');
    expect(getKarmaLabel(-49)).toBe('Shady');
  });

  it('returns Ruthless for karma -50 to -74', () => {
    expect(getKarmaLabel(-50)).toBe('Ruthless');
    expect(getKarmaLabel(-74)).toBe('Ruthless');
  });

  it('returns Villain for karma <= -75', () => {
    expect(getKarmaLabel(-75)).toBe('Villain');
    expect(getKarmaLabel(-100)).toBe('Villain');
  });
});

describe('getFactionLabel', () => {
  it('returns Allied for rep >= 75', () => {
    expect(getFactionLabel(75)).toBe('Allied');
    expect(getFactionLabel(100)).toBe('Allied');
  });

  it('returns Respected for rep 50-74', () => {
    expect(getFactionLabel(50)).toBe('Respected');
    expect(getFactionLabel(74)).toBe('Respected');
  });

  it('returns Favorable for rep 25-49', () => {
    expect(getFactionLabel(25)).toBe('Favorable');
    expect(getFactionLabel(49)).toBe('Favorable');
  });

  it('returns Neutral for rep -24 to 24', () => {
    expect(getFactionLabel(0)).toBe('Neutral');
    expect(getFactionLabel(24)).toBe('Neutral');
    expect(getFactionLabel(-24)).toBe('Neutral');
  });

  it('returns Suspicious for rep -25 to -49', () => {
    expect(getFactionLabel(-25)).toBe('Suspicious');
    expect(getFactionLabel(-49)).toBe('Suspicious');
  });

  it('returns Hostile for rep -50 to -74', () => {
    expect(getFactionLabel(-50)).toBe('Hostile');
    expect(getFactionLabel(-74)).toBe('Hostile');
  });

  it('returns Enemy for rep <= -75', () => {
    expect(getFactionLabel(-75)).toBe('Enemy');
    expect(getFactionLabel(-100)).toBe('Enemy');
  });
});
