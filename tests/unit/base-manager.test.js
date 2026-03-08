import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DEV_MODE - start with false, override per test as needed
const constants = vi.hoisted(() => ({ DEV_MODE: false }));
vi.mock('../../src/game/constants.js', () => constants);

// Import after mock setup
const { BaseManager } =
  await import('../../src/game/state/managers/base-manager.js');

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

describe('BaseManager', () => {
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
    spyLog.mockRestore();
    spyWarn.mockRestore();
    spyError.mockRestore();
  });

  describe('constructor', () => {
    it('throws when no gameStateManager is provided', () => {
      expect(() => new BaseManager()).toThrow(
        'BaseManager requires gameStateManager or capabilities'
      );
    });

    it('throws when gameStateManager is null', () => {
      expect(() => new BaseManager(null)).toThrow(
        'BaseManager requires gameStateManager or capabilities'
      );
    });

    it('sets gameStateManager reference', () => {
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      expect(manager.gameStateManager).toBe(gsm);
    });

    it('sets isTestEnvironment from gameStateManager', () => {
      const gsm = makeMockGSM({ isTestEnvironment: true });
      const manager = new BaseManager(gsm);
      expect(manager.isTestEnvironment).toBe(true);
    });

    it('sets isTestEnvironment to false when GSM has it false', () => {
      const gsm = makeMockGSM({ isTestEnvironment: false });
      const manager = new BaseManager(gsm);
      expect(manager.isTestEnvironment).toBe(false);
    });
  });

  describe('getState', () => {
    it('returns gameStateManager.state when state exists', () => {
      const state = { player: { credits: 500 }, ship: {} };
      const gsm = makeMockGSM({ state });
      const manager = new BaseManager(gsm);
      expect(manager.getState()).toBe(state);
    });

    it('throws when state is null', () => {
      const gsm = makeMockGSM({ state: null });
      const manager = new BaseManager(gsm);
      expect(() => manager.getState()).toThrow(
        'Invalid state: BaseManager called before game initialization'
      );
    });

    it('throws when state is undefined', () => {
      const gsm = makeMockGSM({ state: undefined });
      const manager = new BaseManager(gsm);
      expect(() => manager.getState()).toThrow('Invalid state');
    });
  });

  describe('emit', () => {
    it('delegates to gameStateManager.emit', () => {
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      const data = { credits: 100 };
      manager.emit('creditsChanged', data);
      expect(gsm.emit).toHaveBeenCalledWith('creditsChanged', data);
    });
  });

  describe('getStarData', () => {
    it('returns gameStateManager.starData', () => {
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      expect(manager.getStarData()).toBe(gsm.starData);
    });
  });

  describe('getWormholeData', () => {
    it('returns gameStateManager.wormholeData', () => {
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      expect(manager.getWormholeData()).toBe(gsm.wormholeData);
    });
  });

  describe('getNavigationSystem', () => {
    it('returns gameStateManager.navigationSystem', () => {
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      expect(manager.getNavigationSystem()).toBe(gsm.navigationSystem);
    });
  });

  describe('validateState', () => {
    it('does not throw when state exists', () => {
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      expect(() => manager.validateState()).not.toThrow();
    });

    it('throws when state is null', () => {
      const gsm = makeMockGSM({ state: null });
      const manager = new BaseManager(gsm);
      expect(() => manager.validateState()).toThrow(
        'Invalid state: BaseManager operation called before game initialization'
      );
    });
  });

  describe('logging methods', () => {
    it('error always logs to console.error', () => {
      constants.DEV_MODE = false;
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      manager.error('something broke');
      expect(spyError).toHaveBeenCalledWith('[BaseManager]', 'something broke');
    });

    it('error logs with the subclass name', () => {
      constants.DEV_MODE = false;
      const gsm = makeMockGSM();

      class TestManager extends BaseManager {}
      const manager = new TestManager(gsm);
      manager.error('test error');
      expect(spyError).toHaveBeenCalledWith('[TestManager]', 'test error');
    });

    it('log does not output when DEV_MODE is false', () => {
      constants.DEV_MODE = false;
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      manager.log('debug info');
      expect(spyLog).not.toHaveBeenCalled();
    });

    it('log outputs when DEV_MODE is true', () => {
      constants.DEV_MODE = true;
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      manager.log('debug info');
      expect(spyLog).toHaveBeenCalledWith('[BaseManager]', 'debug info');
    });

    it('warn does not output when DEV_MODE is false', () => {
      constants.DEV_MODE = false;
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      manager.warn('caution');
      expect(spyWarn).not.toHaveBeenCalled();
    });

    it('warn outputs when DEV_MODE is true', () => {
      constants.DEV_MODE = true;
      const gsm = makeMockGSM();
      const manager = new BaseManager(gsm);
      manager.warn('caution');
      expect(spyWarn).toHaveBeenCalledWith('[BaseManager]', 'caution');
    });
  });
});
