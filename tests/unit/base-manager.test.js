import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock DEV_MODE - start with false, override per test as needed
const constants = vi.hoisted(() => ({ DEV_MODE: false }));
vi.mock('../../src/game/constants.js', () => constants);

// Import after mock setup
const { BaseManager } =
  await import('../../src/game/state/managers/base-manager.js');

function makeCapabilities(overrides = {}) {
  return {
    isTestEnvironment: true,
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
    it('throws when no capabilities provided', () => {
      expect(() => new BaseManager()).toThrow(
        'BaseManager requires a capabilities object'
      );
    });

    it('throws when capabilities is null', () => {
      expect(() => new BaseManager(null)).toThrow(
        'BaseManager requires a capabilities object'
      );
    });

    it('stores capabilities reference', () => {
      const caps = makeCapabilities();
      const manager = new BaseManager(caps);
      expect(manager.capabilities).toBe(caps);
    });

    it('sets isTestEnvironment from capabilities', () => {
      const caps = makeCapabilities({ isTestEnvironment: true });
      const manager = new BaseManager(caps);
      expect(manager.isTestEnvironment).toBe(true);
    });

    it('sets isTestEnvironment to false when capabilities has it false', () => {
      const caps = makeCapabilities({ isTestEnvironment: false });
      const manager = new BaseManager(caps);
      expect(manager.isTestEnvironment).toBe(false);
    });

    it('defaults isTestEnvironment to false when not provided', () => {
      const manager = new BaseManager({});
      expect(manager.isTestEnvironment).toBe(false);
    });
  });

  describe('validateState', () => {
    it('does not throw (no-op in capability mode)', () => {
      const manager = new BaseManager(makeCapabilities());
      expect(() => manager.validateState()).not.toThrow();
    });
  });

  describe('logging methods', () => {
    it('error always logs to console.error', () => {
      constants.DEV_MODE = false;
      const manager = new BaseManager(makeCapabilities());
      manager.error('something broke');
      expect(spyError).toHaveBeenCalledWith('[BaseManager]', 'something broke');
    });

    it('error logs with the subclass name', () => {
      constants.DEV_MODE = false;

      class TestManager extends BaseManager {}
      const manager = new TestManager(makeCapabilities());
      manager.error('test error');
      expect(spyError).toHaveBeenCalledWith('[TestManager]', 'test error');
    });

    it('log does not output when DEV_MODE is false', () => {
      constants.DEV_MODE = false;
      const manager = new BaseManager(makeCapabilities());
      manager.log('debug info');
      expect(spyLog).not.toHaveBeenCalled();
    });

    it('log outputs when DEV_MODE is true', () => {
      constants.DEV_MODE = true;
      const manager = new BaseManager(makeCapabilities());
      manager.log('debug info');
      expect(spyLog).toHaveBeenCalledWith('[BaseManager]', 'debug info');
    });

    it('warn does not output when DEV_MODE is false', () => {
      constants.DEV_MODE = false;
      const manager = new BaseManager(makeCapabilities());
      manager.warn('caution');
      expect(spyWarn).not.toHaveBeenCalled();
    });

    it('warn outputs when DEV_MODE is true', () => {
      constants.DEV_MODE = true;
      const manager = new BaseManager(makeCapabilities());
      manager.warn('caution');
      expect(spyWarn).toHaveBeenCalledWith('[BaseManager]', 'caution');
    });
  });
});
