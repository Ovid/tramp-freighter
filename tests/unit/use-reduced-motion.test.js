// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useReducedMotion } from '../../src/hooks/useMediaQuery';

describe('useReducedMotion', () => {
  let listeners;

  beforeEach(() => {
    listeners = [];
    window.matchMedia = vi.fn((query) => ({
      matches: false,
      media: query,
      addEventListener: (event, handler) => listeners.push(handler),
      removeEventListener: () => {},
    }));
  });

  it('queries the OS reduced-motion setting', () => {
    renderHook(() => useReducedMotion());
    expect(window.matchMedia).toHaveBeenCalledWith(
      '(prefers-reduced-motion: reduce)'
    );
  });

  it('follows the OS setting when it changes mid-session', () => {
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => listeners.forEach((l) => l({ matches: true })));
    expect(result.current).toBe(true);
  });

  it('is false when matchMedia is unavailable', () => {
    window.matchMedia = () => {
      throw new Error('not available');
    };
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });
});
