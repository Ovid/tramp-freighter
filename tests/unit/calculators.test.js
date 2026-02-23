import { describe, it, expect } from 'vitest';
import {
  calculateSystemPrices,
  calculateUpdatedEvents,
  determineThreatLevel,
  determineInspectionSeverity,
  partitionExpiredMissions,
} from '../../src/game/utils/calculators.js';
import {
  COMMODITY_TYPES,
  THREAT_LEVEL_CONFIG,
  INSPECTION_SEVERITY_CONFIG,
} from '../../src/game/constants.js';

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

describe('calculateUpdatedEvents', () => {
  it('returns array of active events', () => {
    const mockState = {
      player: { daysElapsed: 50 },
      world: { activeEvents: [], marketConditions: {} },
    };
    const mockStarData = [{ id: 1, x: 0, y: 0, z: 0 }];
    const result = calculateUpdatedEvents(mockState, mockStarData);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('determineThreatLevel', () => {
  const makeState = (overrides = {}) => ({
    ship: { cargo: [], hull: 100, ...overrides.ship },
    player: { factions: { outlaws: 0, ...overrides.factions } },
  });

  it('returns "dangerous" when cargo value exceeds high threshold', () => {
    const state = makeState({
      ship: {
        cargo: [{ qty: 100, buyPrice: THREAT_LEVEL_CONFIG.CARGO_VALUE_DANGEROUS + 1 }],
        hull: 100,
      },
    });
    expect(determineThreatLevel(state)).toBe('dangerous');
  });

  it('returns "strong" when cargo value exceeds medium threshold', () => {
    const state = makeState({
      ship: {
        cargo: [{ qty: 1, buyPrice: THREAT_LEVEL_CONFIG.CARGO_VALUE_STRONG + 1 }],
        hull: 100,
      },
    });
    expect(determineThreatLevel(state)).toBe('strong');
  });

  it('returns "strong" when hull is below critical threshold', () => {
    const state = makeState({
      ship: { cargo: [], hull: THREAT_LEVEL_CONFIG.HULL_CRITICAL - 1 },
    });
    expect(determineThreatLevel(state)).toBe('strong');
  });

  it('returns "moderate" when hull is below warning threshold', () => {
    const state = makeState({
      ship: { cargo: [], hull: THREAT_LEVEL_CONFIG.HULL_WARNING - 1 },
    });
    expect(determineThreatLevel(state)).toBe('moderate');
  });

  it('returns "strong" when outlaw reputation exceeds positive threshold', () => {
    const state = makeState({
      factions: { outlaws: THREAT_LEVEL_CONFIG.OUTLAW_REP_STRONG + 1 },
    });
    expect(determineThreatLevel(state)).toBe('strong');
  });

  it('returns "weak" when outlaw reputation below negative threshold', () => {
    const state = makeState({
      factions: { outlaws: -(THREAT_LEVEL_CONFIG.OUTLAW_REP_WEAK + 1) },
    });
    expect(determineThreatLevel(state)).toBe('weak');
  });

  it('defaults to "moderate" with neutral state', () => {
    const state = makeState();
    expect(determineThreatLevel(state)).toBe('moderate');
  });
});

describe('determineInspectionSeverity', () => {
  const makeState = (overrides = {}) => ({
    ship: {
      cargo: [],
      hiddenCargo: null,
      ...overrides.ship,
    },
    player: {
      factions: { authorities: 0, ...overrides.factions },
    },
  });

  it('returns "thorough" when cargo and hidden cargo both present', () => {
    const state = makeState({
      ship: { cargo: [{ id: 'g1' }], hiddenCargo: [{ id: 'h1' }] },
    });
    expect(determineInspectionSeverity(state)).toBe('thorough');
  });

  it('returns "thorough" when authority reputation below threshold', () => {
    const state = makeState({
      factions: {
        authorities: INSPECTION_SEVERITY_CONFIG.AUTHORITY_REP_THOROUGH - 1,
      },
    });
    expect(determineInspectionSeverity(state)).toBe('thorough');
  });

  it('defaults to "routine" with neutral state', () => {
    const state = makeState();
    expect(determineInspectionSeverity(state)).toBe('routine');
  });

  it('returns "routine" when cargo present but no hidden cargo', () => {
    const state = makeState({ ship: { cargo: [{ id: 'g1' }] } });
    expect(determineInspectionSeverity(state)).toBe('routine');
  });
});
