import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  determineThreatLevel,
  determineInspectionSeverity,
} from '../../src/game/utils/calculators.js';
import {
  THREAT_LEVEL_CONFIG,
  INSPECTION_SEVERITY_CONFIG,
} from '../../src/game/constants.js';

function makeGameState(overrides = {}) {
  return {
    ship: {
      cargo: overrides.cargo ?? [],
      hull: overrides.hull ?? 100,
      hiddenCargo: overrides.hiddenCargo ?? null,
    },
    player: {
      factions: {
        outlaws: overrides.outlawRep ?? 0,
        authorities: overrides.authorityRep ?? 0,
      },
    },
  };
}

describe('determineThreatLevel', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "dangerous" when cargo value exceeds CARGO_VALUE_DANGEROUS', () => {
    const state = makeGameState({
      cargo: [
        { qty: 1, buyPrice: THREAT_LEVEL_CONFIG.CARGO_VALUE_DANGEROUS + 1 },
      ],
    });
    expect(determineThreatLevel(state)).toBe('dangerous');
  });

  it('returns "strong" when cargo value exceeds CARGO_VALUE_STRONG but not DANGEROUS', () => {
    const state = makeGameState({
      cargo: [{ qty: 1, buyPrice: THREAT_LEVEL_CONFIG.CARGO_VALUE_STRONG + 1 }],
    });
    expect(determineThreatLevel(state)).toBe('strong');
  });

  it('returns "strong" when hull is below HULL_CRITICAL regardless of cargo', () => {
    const state = makeGameState({
      hull: THREAT_LEVEL_CONFIG.HULL_CRITICAL - 1,
    });
    expect(determineThreatLevel(state)).toBe('strong');
  });

  it('returns "moderate" when hull is below HULL_WARNING but at or above HULL_CRITICAL', () => {
    const state = makeGameState({
      hull: THREAT_LEVEL_CONFIG.HULL_WARNING - 1,
    });
    // Ensure hull is still >= HULL_CRITICAL for this path
    expect(THREAT_LEVEL_CONFIG.HULL_WARNING - 1).toBeGreaterThanOrEqual(
      THREAT_LEVEL_CONFIG.HULL_CRITICAL
    );
    expect(determineThreatLevel(state)).toBe('moderate');
  });

  it('returns "strong" when outlawRep exceeds OUTLAW_REP_STRONG', () => {
    const state = makeGameState({
      outlawRep: THREAT_LEVEL_CONFIG.OUTLAW_REP_STRONG + 1,
    });
    expect(determineThreatLevel(state)).toBe('strong');
  });

  it('returns "weak" when outlawRep is below negative OUTLAW_REP_WEAK', () => {
    const state = makeGameState({
      outlawRep: -(THREAT_LEVEL_CONFIG.OUTLAW_REP_WEAK + 1),
    });
    expect(determineThreatLevel(state)).toBe('weak');
  });

  it('returns "moderate" as default when no conditions trigger', () => {
    const state = makeGameState();
    expect(determineThreatLevel(state)).toBe('moderate');
  });

  it('prioritizes cargo value over hull — high cargo with good hull returns cargo-based level', () => {
    const state = makeGameState({
      cargo: [
        { qty: 1, buyPrice: THREAT_LEVEL_CONFIG.CARGO_VALUE_DANGEROUS + 1 },
      ],
      hull: 100,
    });
    expect(determineThreatLevel(state)).toBe('dangerous');
  });

  it('prioritizes hull over rep — moderate cargo + critical hull + weak rep returns "strong"', () => {
    // Cargo below CARGO_VALUE_STRONG so cargo checks pass through
    const state = makeGameState({
      cargo: [{ qty: 1, buyPrice: 100 }],
      hull: THREAT_LEVEL_CONFIG.HULL_CRITICAL - 1,
      outlawRep: -(THREAT_LEVEL_CONFIG.OUTLAW_REP_WEAK + 1),
    });
    // Hull critical check fires before rep check, so result is 'strong' not 'weak'
    expect(determineThreatLevel(state)).toBe('strong');
  });
});

describe('determineInspectionSeverity', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns "thorough" when ship has cargo AND hidden cargo', () => {
    const state = makeGameState({
      cargo: [{ qty: 5, buyPrice: 10 }],
      hiddenCargo: [{ id: 'contraband' }],
    });
    expect(determineInspectionSeverity(state)).toBe('thorough');
  });

  it('returns "thorough" when authority rep is below AUTHORITY_REP_THOROUGH', () => {
    const state = makeGameState({
      authorityRep: INSPECTION_SEVERITY_CONFIG.AUTHORITY_REP_THOROUGH - 1,
    });
    expect(determineInspectionSeverity(state)).toBe('thorough');
  });

  it('returns "thorough" when no cargo but authority rep is below threshold', () => {
    // The user might expect 'routine' because cargo.length is 0,
    // but the authority rep check is independent of cargo
    const state = makeGameState({
      cargo: [],
      authorityRep: INSPECTION_SEVERITY_CONFIG.AUTHORITY_REP_THOROUGH - 1,
    });
    expect(determineInspectionSeverity(state)).toBe('thorough');
  });

  it('returns "routine" when has cargo but no hidden cargo and good authority rep', () => {
    const state = makeGameState({
      cargo: [{ qty: 1, buyPrice: 10 }],
      authorityRep: 0,
    });
    expect(determineInspectionSeverity(state)).toBe('routine');
  });

  it('returns "routine" with empty hiddenCargo array', () => {
    const state = makeGameState({
      cargo: [{ qty: 1, buyPrice: 10 }],
      hiddenCargo: [],
      authorityRep: 0,
    });
    expect(determineInspectionSeverity(state)).toBe('routine');
  });

  it('returns "routine" with null hiddenCargo', () => {
    const state = makeGameState({
      cargo: [{ qty: 1, buyPrice: 10 }],
      hiddenCargo: null,
      authorityRep: 0,
    });
    expect(determineInspectionSeverity(state)).toBe('routine');
  });
});
