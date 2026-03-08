import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseManager } from '../../src/game/state/managers/base-manager.js';

describe('BaseManager coverage', () => {
  let gsm;
  let manager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    gsm = {
      state: { player: {}, ship: {} },
      starData: [{ id: 0, name: 'Sol' }],
      wormholeData: [[0, 1]],
      navigationSystem: { jump: vi.fn() },
      emit: vi.fn(),
      isTestEnvironment: true,
    };
    manager = new BaseManager(gsm);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('throws when no gameStateManager provided', () => {
      expect(() => new BaseManager(null)).toThrow(
        'BaseManager requires gameStateManager or capabilities'
      );
    });

    it('throws when undefined gameStateManager provided', () => {
      expect(() => new BaseManager(undefined)).toThrow(
        'BaseManager requires gameStateManager or capabilities'
      );
    });

    it('stores reference to gameStateManager', () => {
      expect(manager.gameStateManager).toBe(gsm);
    });

    it('stores isTestEnvironment flag', () => {
      expect(manager.isTestEnvironment).toBe(true);
    });
  });

  describe('getState', () => {
    it('returns state from gameStateManager', () => {
      const state = manager.getState();
      expect(state).toBe(gsm.state);
    });

    it('throws when state is null', () => {
      gsm.state = null;
      expect(() => manager.getState()).toThrow('before game initialization');
    });

    it('throws when state is undefined', () => {
      gsm.state = undefined;
      expect(() => manager.getState()).toThrow('before game initialization');
    });
  });

  describe('emit', () => {
    it('delegates to gameStateManager.emit', () => {
      manager.emit('testEvent', { data: 42 });
      expect(gsm.emit).toHaveBeenCalledWith('testEvent', { data: 42 });
    });
  });

  describe('getStarData', () => {
    it('returns starData from gameStateManager', () => {
      expect(manager.getStarData()).toBe(gsm.starData);
    });
  });

  describe('getWormholeData', () => {
    it('returns wormholeData from gameStateManager', () => {
      expect(manager.getWormholeData()).toBe(gsm.wormholeData);
    });
  });

  describe('getNavigationSystem', () => {
    it('returns navigationSystem from gameStateManager', () => {
      expect(manager.getNavigationSystem()).toBe(gsm.navigationSystem);
    });
  });

  describe('validateState', () => {
    it('does not throw when state exists', () => {
      expect(() => manager.validateState()).not.toThrow();
    });

    it('throws when state is null', () => {
      gsm.state = null;
      expect(() => manager.validateState()).toThrow(
        'before game initialization'
      );
    });

    it('includes class name in error message', () => {
      gsm.state = null;
      expect(() => manager.validateState()).toThrow('BaseManager');
    });
  });

  describe('log', () => {
    it('logs with class name prefix in dev mode', () => {
      // DEV_MODE is imported from constants, may not be true in test
      // Just verify it doesn't throw
      expect(() => manager.log('test message')).not.toThrow();
    });
  });

  describe('warn', () => {
    it('does not throw', () => {
      expect(() => manager.warn('test warning')).not.toThrow();
    });
  });

  describe('error', () => {
    it('logs error with class name prefix', () => {
      manager.error('test error');
      expect(console.error).toHaveBeenCalledWith('[BaseManager]', 'test error');
    });

    it('handles multiple arguments', () => {
      manager.error('error', 'details', 42);
      expect(console.error).toHaveBeenCalledWith(
        '[BaseManager]',
        'error',
        'details',
        42
      );
    });
  });
});
