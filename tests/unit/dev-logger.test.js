import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// We need to control DEV_MODE for these tests
let devLog, devWarn;

describe('Dev Logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('when DEV_MODE is false', () => {
    beforeEach(async () => {
      vi.resetModules();
      vi.doMock('../../src/game/constants.js', () => ({
        DEV_MODE: false,
      }));
      const mod = await import('../../src/game/utils/dev-logger.js');
      devLog = mod.devLog;
      devWarn = mod.devWarn;
    });

    it('should suppress console.log when DEV_MODE is false', () => {
      devLog('should not appear');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should suppress console.warn when DEV_MODE is false', () => {
      devWarn('should not appear');

      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('when DEV_MODE is true', () => {
    beforeEach(async () => {
      vi.resetModules();
      vi.doMock('../../src/game/constants.js', () => ({
        DEV_MODE: true,
      }));
      const mod = await import('../../src/game/utils/dev-logger.js');
      devLog = mod.devLog;
      devWarn = mod.devWarn;
    });

    it('should pass through console.log when DEV_MODE is true', () => {
      devLog('visible message');

      expect(console.log).toHaveBeenCalledWith('visible message');
    });

    it('should pass through console.warn when DEV_MODE is true', () => {
      devWarn('visible warning');

      expect(console.warn).toHaveBeenCalledWith('visible warning');
    });

    it('should pass multiple arguments through', () => {
      devLog('message', 42, { key: 'value' });

      expect(console.log).toHaveBeenCalledWith('message', 42, {
        key: 'value',
      });
    });
  });
});
