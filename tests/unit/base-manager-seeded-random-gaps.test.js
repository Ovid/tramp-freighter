import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ── BaseManager: mock DEV_MODE so we can toggle it per test ──
const constants = vi.hoisted(() => ({ DEV_MODE: false }));
vi.mock('../../src/game/constants.js', () => constants);

const { BaseManager } = await import(
  '../../src/game/state/managers/base-manager.js'
);

// ── SeededRandom: direct import (no mocking needed) ──
import {
  SeededRandom,
  buildEncounterSeed,
  pickRandomFrom,
} from '../../src/game/utils/seeded-random.js';

// ── Helpers ──

function makeMockGSM(overrides = {}) {
  return {
    state: { player: {}, ship: {} },
    isTestEnvironment: true,
    emit: vi.fn(),
    starData: [{ name: 'Sol' }],
    wormholeData: [{ from: 0, to: 1 }],
    navigationSystem: { findPath: vi.fn() },
    ...overrides,
  };
}

// ────────────────────────────────────────────────────────
// BaseManager gap coverage
// ────────────────────────────────────────────────────────

describe('BaseManager log/warn gap coverage', () => {
  let spyLog;
  let spyWarn;
  let spyError;

  beforeEach(() => {
    constants.DEV_MODE = false;
    spyLog = vi.spyOn(console, 'log').mockImplementation(() => {});
    spyWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    spyError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── log() ──

  describe('log()', () => {
    it('calls console.log with class name prefix when DEV_MODE is true', () => {
      constants.DEV_MODE = true;
      const manager = new BaseManager(makeMockGSM());
      manager.log('hello', 123);
      expect(spyLog).toHaveBeenCalledWith('[BaseManager]', 'hello', 123);
    });

    it('calls console.log with subclass name when DEV_MODE is true', () => {
      constants.DEV_MODE = true;
      class ShipManager extends BaseManager {}
      const manager = new ShipManager(makeMockGSM());
      manager.log('fuel low');
      expect(spyLog).toHaveBeenCalledWith('[ShipManager]', 'fuel low');
    });

    it('does NOT call console.log when DEV_MODE is false', () => {
      constants.DEV_MODE = false;
      const manager = new BaseManager(makeMockGSM());
      manager.log('should be silent');
      expect(spyLog).not.toHaveBeenCalled();
    });
  });

  // ── warn() ──

  describe('warn()', () => {
    it('calls console.warn with class name prefix when DEV_MODE is true', () => {
      constants.DEV_MODE = true;
      const manager = new BaseManager(makeMockGSM());
      manager.warn('danger', { detail: 'low fuel' });
      expect(spyWarn).toHaveBeenCalledWith('[BaseManager]', 'danger', {
        detail: 'low fuel',
      });
    });

    it('calls console.warn with subclass name when DEV_MODE is true', () => {
      constants.DEV_MODE = true;
      class TradingManager extends BaseManager {}
      const manager = new TradingManager(makeMockGSM());
      manager.warn('price spike');
      expect(spyWarn).toHaveBeenCalledWith('[TradingManager]', 'price spike');
    });

    it('does NOT call console.warn when DEV_MODE is false', () => {
      constants.DEV_MODE = false;
      const manager = new BaseManager(makeMockGSM());
      manager.warn('should be silent');
      expect(spyWarn).not.toHaveBeenCalled();
    });
  });

  // ── getState() subclass error message ──

  describe('getState() subclass error', () => {
    it('includes the subclass name in the error when state is missing', () => {
      class NavigationManager extends BaseManager {}
      const manager = new NavigationManager(makeMockGSM({ state: null }));
      expect(() => manager.getState()).toThrow(
        'Invalid state: NavigationManager called before game initialization'
      );
    });
  });

  // ── validateState() subclass error message ──

  describe('validateState() subclass error', () => {
    it('includes the subclass name in the error when state is missing', () => {
      class DangerManager extends BaseManager {}
      const manager = new DangerManager(makeMockGSM({ state: null }));
      expect(() => manager.validateState()).toThrow(
        'Invalid state: DangerManager operation called before game initialization'
      );
    });
  });

  // ── Accessors exercised through subclass ──

  describe('accessor delegation through subclass', () => {
    class SubManager extends BaseManager {}

    it('getStarData returns starData', () => {
      const gsm = makeMockGSM();
      const manager = new SubManager(gsm);
      expect(manager.getStarData()).toBe(gsm.starData);
    });

    it('getWormholeData returns wormholeData', () => {
      const gsm = makeMockGSM();
      const manager = new SubManager(gsm);
      expect(manager.getWormholeData()).toBe(gsm.wormholeData);
    });

    it('getNavigationSystem returns navigationSystem', () => {
      const gsm = makeMockGSM();
      const manager = new SubManager(gsm);
      expect(manager.getNavigationSystem()).toBe(gsm.navigationSystem);
    });

    it('emit delegates to gameStateManager', () => {
      const gsm = makeMockGSM();
      const manager = new SubManager(gsm);
      manager.emit('stateChanged', { key: 'val' });
      expect(gsm.emit).toHaveBeenCalledWith('stateChanged', { key: 'val' });
    });
  });
});

// ────────────────────────────────────────────────────────
// SeededRandom gap coverage
// ────────────────────────────────────────────────────────

describe('SeededRandom gap coverage', () => {
  // These tests exercise nextInt, nextFloat, and pickRandom through fresh
  // SeededRandom instances to ensure V8 coverage marks the method bodies
  // as covered (lines 42-45, 52-55, 62-65).

  describe('nextInt method body (lines 42-45)', () => {
    it('returns deterministic integer for a given seed', () => {
      const rng = new SeededRandom('gap_nextInt');
      const val = rng.nextInt(0, 100);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(100);
    });

    it('produces same result for same seed', () => {
      const a = new SeededRandom('deterministic_int');
      const b = new SeededRandom('deterministic_int');
      expect(a.nextInt(1, 10)).toBe(b.nextInt(1, 10));
    });

    it('covers range boundary: min 0 max 0', () => {
      const rng = new SeededRandom('zero_range');
      expect(rng.nextInt(0, 0)).toBe(0);
    });

    it('handles large range', () => {
      const rng = new SeededRandom('large_range');
      const val = rng.nextInt(-1000, 1000);
      expect(val).toBeGreaterThanOrEqual(-1000);
      expect(val).toBeLessThanOrEqual(1000);
    });
  });

  describe('nextFloat method body (lines 52-55)', () => {
    it('returns deterministic float for a given seed', () => {
      const rng = new SeededRandom('gap_nextFloat');
      const val = rng.nextFloat(0, 1);
      expect(typeof val).toBe('number');
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThanOrEqual(1);
    });

    it('produces same result for same seed', () => {
      const a = new SeededRandom('deterministic_float');
      const b = new SeededRandom('deterministic_float');
      expect(a.nextFloat(0.5, 9.5)).toBe(b.nextFloat(0.5, 9.5));
    });

    it('works with negative range', () => {
      const rng = new SeededRandom('neg_float');
      const val = rng.nextFloat(-5.0, -1.0);
      expect(val).toBeGreaterThanOrEqual(-5.0);
      expect(val).toBeLessThanOrEqual(-1.0);
    });
  });

  describe('pickRandom method body (lines 62-65)', () => {
    it('picks a deterministic element for a given seed', () => {
      const rng = new SeededRandom('gap_pickRandom');
      const items = ['x', 'y', 'z'];
      const picked = rng.pickRandom(items);
      expect(items).toContain(picked);
    });

    it('produces same pick for same seed', () => {
      const a = new SeededRandom('deterministic_pick');
      const b = new SeededRandom('deterministic_pick');
      const items = [10, 20, 30, 40, 50];
      expect(a.pickRandom(items)).toBe(b.pickRandom(items));
    });

    it('handles two-element array', () => {
      const rng = new SeededRandom('two_elem');
      const items = ['heads', 'tails'];
      expect(items).toContain(rng.pickRandom(items));
    });
  });

  describe('buildEncounterSeed (lines 88-89)', () => {
    it('produces a deterministic seed string', () => {
      const seed = buildEncounterSeed(5, 12, 'combat');
      expect(seed).toBe('5_12_combat');
    });

    it('can be used to construct a SeededRandom with deterministic output', () => {
      const seed = buildEncounterSeed(7, 3, 'negotiation');
      const rng1 = new SeededRandom(seed);
      const rng2 = new SeededRandom(seed);
      expect(rng1.next()).toBe(rng2.next());
    });

    it('handles zero values', () => {
      expect(buildEncounterSeed(0, 0, 'test')).toBe('0_0_test');
    });
  });

  describe('pickRandomFrom (lines 88-89)', () => {
    it('selects element using injected rng function', () => {
      const items = ['alpha', 'beta', 'gamma'];
      const result = pickRandomFrom(items, () => 0.33);
      expect(items).toContain(result);
    });

    it('selects first element when rng returns 0', () => {
      const result = pickRandomFrom(['a', 'b', 'c'], () => 0);
      expect(result).toBe('a');
    });

    it('clamps to last element when rng returns exactly 1.0', () => {
      const items = ['a', 'b', 'c'];
      const result = pickRandomFrom(items, () => 1.0);
      expect(result).toBe('c');
    });

    it('works with single-element array', () => {
      const result = pickRandomFrom(['only'], () => 0.5);
      expect(result).toBe('only');
    });

    it('uses SeededRandom instance next as rng function', () => {
      const rng = new SeededRandom('pickRandomFrom_integration');
      const items = [100, 200, 300, 400];
      const result = pickRandomFrom(items, () => rng.next());
      expect(items).toContain(result);
    });
  });
});
