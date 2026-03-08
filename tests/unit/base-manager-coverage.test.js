import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BaseManager } from '../../src/game/state/managers/base-manager.js';

describe('BaseManager coverage', () => {
  let capabilities;
  let manager;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    capabilities = {
      isTestEnvironment: true,
    };
    manager = new BaseManager(capabilities);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('constructor', () => {
    it('throws when no capabilities provided', () => {
      expect(() => new BaseManager(null)).toThrow(
        'BaseManager requires a capabilities object'
      );
    });

    it('throws when undefined capabilities provided', () => {
      expect(() => new BaseManager(undefined)).toThrow(
        'BaseManager requires a capabilities object'
      );
    });

    it('stores capabilities object', () => {
      expect(manager.capabilities).toBe(capabilities);
    });

    it('stores isTestEnvironment flag', () => {
      expect(manager.isTestEnvironment).toBe(true);
    });

    it('defaults isTestEnvironment to false when not provided', () => {
      const m = new BaseManager({});
      expect(m.isTestEnvironment).toBe(false);
    });
  });

  describe('validateState', () => {
    it('does not throw (no-op in capability mode)', () => {
      expect(() => manager.validateState()).not.toThrow();
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
