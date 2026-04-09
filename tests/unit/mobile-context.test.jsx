// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MobileProvider, useMobile } from '../../src/context/MobileContext';

describe('MobileContext', () => {
  it('should provide isMobile value to consumers', () => {
    const wrapper = ({ children }) => (
      <MobileProvider isMobile={true}>{children}</MobileProvider>
    );
    const { result } = renderHook(() => useMobile(), { wrapper });
    expect(result.current.isMobile).toBe(true);
  });

  it('should provide isMobile=false when set', () => {
    const wrapper = ({ children }) => (
      <MobileProvider isMobile={false}>{children}</MobileProvider>
    );
    const { result } = renderHook(() => useMobile(), { wrapper });
    expect(result.current.isMobile).toBe(false);
  });

  it('should throw when useMobile is called outside provider', () => {
    expect(() => {
      renderHook(() => useMobile());
    }).toThrow('useMobile must be used within MobileProvider');
  });
});
