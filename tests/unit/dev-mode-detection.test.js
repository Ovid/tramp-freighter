import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { initDevMode } from '../../src/game/constants';

describe('Dev Mode Detection', () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should enable dev mode when .dev file exists', async () => {
    // Mock fetch to return success (file exists) with non-HTML content type
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name) => (name === 'content-type' ? 'text/plain' : null),
      },
    });

    const result = await initDevMode();

    expect(result).toBe(true);
    // Verify fetch was called with cache-busting query parameter
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\.dev\?t=\d+$/),
      { cache: 'no-store' }
    );
  });

  it('should disable dev mode when .dev file does not exist', async () => {
    // Mock fetch to return 404 (file not found)
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      headers: {
        get: () => null,
      },
    });

    const result = await initDevMode();

    expect(result).toBe(false);
    // Verify fetch was called with cache-busting query parameter
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\.dev\?t=\d+$/),
      { cache: 'no-store' }
    );
  });

  it('should disable dev mode when server returns HTML fallback (SPA 404)', async () => {
    // Mock fetch to return 200 but with HTML content (Vite SPA fallback)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      headers: {
        get: (name) => (name === 'content-type' ? 'text/html' : null),
      },
    });

    const result = await initDevMode();

    expect(result).toBe(false);
    // Verify fetch was called with cache-busting query parameter
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\.dev\?t=\d+$/),
      { cache: 'no-store' }
    );
  });

  it('should disable dev mode when fetch fails', async () => {
    // Mock fetch to throw error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const result = await initDevMode();

    expect(result).toBe(false);
    // Verify fetch was called with cache-busting query parameter
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/^\.dev\?t=\d+$/),
      { cache: 'no-store' }
    );
  });
});
