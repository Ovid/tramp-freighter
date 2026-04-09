// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMobileLayout } from '../../src/hooks/useMobileLayout';

describe('useMobileLayout hook', () => {
  let listeners;
  let currentMatches;

  beforeEach(() => {
    listeners = [];
    currentMatches = false;

    window.matchMedia = vi.fn((query) => ({
      matches: currentMatches,
      media: query,
      addEventListener: vi.fn((event, handler) => {
        listeners.push(handler);
      }),
      removeEventListener: vi.fn((event, handler) => {
        listeners = listeners.filter((l) => l !== handler);
      }),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return isMobile false on desktop widths', () => {
    currentMatches = false;
    const { result } = renderHook(() => useMobileLayout());
    expect(result.current.isMobile).toBe(false);
  });

  it('should return isMobile true on mobile widths', () => {
    currentMatches = true;
    const { result } = renderHook(() => useMobileLayout());
    expect(result.current.isMobile).toBe(true);
  });

  it('should update when media query changes', () => {
    currentMatches = false;
    const { result } = renderHook(() => useMobileLayout());
    expect(result.current.isMobile).toBe(false);

    act(() => {
      listeners.forEach((l) => l({ matches: true }));
    });
    expect(result.current.isMobile).toBe(true);
  });

  it('should query max-width: 600px', () => {
    renderHook(() => useMobileLayout());
    expect(window.matchMedia).toHaveBeenCalledWith('(max-width: 600px)');
  });

  it('should clean up listener on unmount', () => {
    const removeListenerSpy = vi.fn();
    window.matchMedia = vi.fn(() => ({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: removeListenerSpy,
    }));

    const { unmount } = renderHook(() => useMobileLayout());
    unmount();
    expect(removeListenerSpy).toHaveBeenCalledWith('change', expect.any(Function));
  });
});
