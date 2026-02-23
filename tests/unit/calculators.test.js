import { describe, it, expect } from 'vitest';
import {
  calculateSystemPrices,
  partitionExpiredMissions,
} from '../../src/game/utils/calculators.js';
import { COMMODITY_TYPES } from '../../src/game/constants.js';

describe('calculateSystemPrices', () => {
  const mockSystem = { id: 1, x: 0, y: 0, z: 0 };

  it('returns a price for every commodity type', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const type of COMMODITY_TYPES) {
      expect(prices).toHaveProperty(type);
    }
  });

  it('returns integer prices', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const price of Object.values(prices)) {
      expect(Number.isInteger(price)).toBe(true);
    }
  });

  it('returns positive prices', () => {
    const prices = calculateSystemPrices(mockSystem, 10, [], {});
    for (const price of Object.values(prices)) {
      expect(price).toBeGreaterThan(0);
    }
  });

  it('prices vary by day (temporal modifier)', () => {
    const pricesDay1 = calculateSystemPrices(mockSystem, 1, [], {});
    const pricesDay15 = calculateSystemPrices(mockSystem, 15, [], {});
    const anyDifferent = COMMODITY_TYPES.some(
      (type) => pricesDay1[type] !== pricesDay15[type]
    );
    expect(anyDifferent).toBe(true);
  });
});

describe('partitionExpiredMissions', () => {
  it('returns empty expired when no missions have deadlines', () => {
    const missions = [{ id: 'm1' }, { id: 'm2' }];
    const result = partitionExpiredMissions(missions, 100);
    expect(result.expired).toEqual([]);
    expect(result.remaining).toEqual(missions);
  });

  it('partitions missions by deadline', () => {
    const missions = [
      { id: 'm1', deadlineDay: 50 },
      { id: 'm2', deadlineDay: 150 },
      { id: 'm3' }, // no deadline
    ];
    const result = partitionExpiredMissions(missions, 100);
    expect(result.expired).toEqual([{ id: 'm1', deadlineDay: 50 }]);
    expect(result.remaining).toHaveLength(2);
    expect(result.remaining.map((m) => m.id)).toEqual(['m2', 'm3']);
  });

  it('does not expire missions on their exact deadline day', () => {
    const missions = [{ id: 'm1', deadlineDay: 100 }];
    const result = partitionExpiredMissions(missions, 100);
    expect(result.expired).toEqual([]);
    expect(result.remaining).toEqual(missions);
  });

  it('expires missions past their deadline day', () => {
    const missions = [{ id: 'm1', deadlineDay: 100 }];
    const result = partitionExpiredMissions(missions, 101);
    expect(result.expired).toEqual([{ id: 'm1', deadlineDay: 100 }]);
  });

  it('returns empty arrays for empty input', () => {
    const result = partitionExpiredMissions([], 100);
    expect(result.expired).toEqual([]);
    expect(result.remaining).toEqual([]);
  });
});
