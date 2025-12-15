import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import * as fc from 'fast-check';
import { useNotification } from '../../src/hooks/useNotification';

/**
 * React Migration Spec, Property 46: Notification queueing
 * Validates: Requirements 44.4
 *
 * For any multiple notifications triggered, they should be queued and displayed appropriately
 */
describe('Property 46: Notification queueing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should queue multiple notifications and display them sequentially', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 50 }),
            duration: fc.integer({ min: 100, max: 1000 }),
            type: fc.constantFrom('error', 'success', 'info'),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (notificationData) => {
          const { result } = renderHook(() => useNotification());

          // Trigger all notifications at once
          act(() => {
            notificationData.forEach((data) => {
              result.current.showNotification(
                data.message,
                data.duration,
                data.type
              );
            });
          });

          // Initially, only one notification should be visible
          expect(result.current.notifications.length).toBeLessThanOrEqual(1);

          // Process through all notifications
          // We'll verify that notifications are displayed sequentially by checking
          // that at no point are there more than one non-fading notification
          const maxDuration = Math.max(
            ...notificationData.map((d) => d.duration)
          );
          const totalTime = notificationData.reduce(
            (sum, d) => sum + d.duration + 350,
            0
          );

          // Sample at multiple points in time
          for (let time = 0; time < totalTime; time += 50) {
            act(() => {
              vi.advanceTimersByTime(50);
            });

            // Should never have more than one non-fading notification
            const nonFadingNotifications = result.current.notifications.filter(
              (n) => !n.fadeOut
            );
            expect(nonFadingNotifications.length).toBeLessThanOrEqual(1);
          }

          // Queue should be empty at the end
          expect(result.current.notifications.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should never display more than one notification at a time', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            message: fc.string({ minLength: 1, maxLength: 50 }),
            duration: fc.integer({ min: 100, max: 500 }),
          }),
          { minLength: 3, maxLength: 10 }
        ),
        (notificationData) => {
          const { result } = renderHook(() => useNotification());

          // Trigger all notifications rapidly
          act(() => {
            notificationData.forEach((data) => {
              result.current.showError(data.message, data.duration);
            });
          });

          // Check at multiple time points that only one notification is visible
          for (let i = 0; i < notificationData.length; i++) {
            const visibleCount = result.current.notifications.filter(
              (n) => !n.fadeOut
            ).length;
            expect(visibleCount).toBeLessThanOrEqual(1);

            // Advance time
            act(() => {
              vi.advanceTimersByTime(50);
            });
          }

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should preserve notification order in the queue', () => {
    fc.assert(
      fc.property(
        // Use unique messages to track order
        fc
          .array(fc.integer({ min: 0, max: 1000 }), {
            minLength: 3,
            maxLength: 5,
          })
          .map((nums) => nums.map((n) => `Message ${n}`)),
        (messages) => {
          const { result } = renderHook(() => useNotification());
          const displayedMessages = [];
          const seenIds = new Set();

          // Queue all messages
          act(() => {
            messages.forEach((message) => {
              result.current.showInfo(message, 200);
            });
          });

          // Process through all notifications and record order
          const totalTime = messages.length * 600; // 200ms duration + 300ms fade + buffer
          for (let time = 0; time < totalTime; time += 50) {
            act(() => {
              vi.advanceTimersByTime(50);
            });

            // Check for new non-fading notifications
            const nonFadingNotifications = result.current.notifications.filter(
              (n) => !n.fadeOut && !seenIds.has(n.id)
            );

            if (nonFadingNotifications.length > 0) {
              const notification = nonFadingNotifications[0];
              displayedMessages.push(notification.message);
              seenIds.add(notification.id);
            }
          }

          // Messages should be displayed in the same order they were queued
          expect(displayedMessages).toEqual(messages);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});

/**
 * React Migration Spec, Property 47: Notification expiration
 * Validates: Requirements 44.5
 *
 * For any notification expiring, it should be removed with fade animations matching existing CSS
 */
describe('Property 47: Notification expiration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should mark notifications as fading out after their duration', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 100, max: 2000 }),
        (message, duration) => {
          const { result } = renderHook(() => useNotification());

          // Show notification
          act(() => {
            result.current.showError(message, duration);
          });

          // Should be visible without fade-out initially
          expect(result.current.notifications.length).toBe(1);
          expect(result.current.notifications[0].fadeOut).toBe(false);

          // Advance time to just before duration expires
          act(() => {
            vi.advanceTimersByTime(duration - 50);
          });

          // Should still be visible without fade-out
          expect(result.current.notifications.length).toBe(1);
          expect(result.current.notifications[0].fadeOut).toBe(false);

          // Advance time past duration
          act(() => {
            vi.advanceTimersByTime(100);
          });

          // Should now be marked as fading out
          expect(result.current.notifications.length).toBe(1);
          expect(result.current.notifications[0].fadeOut).toBe(true);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should remove notifications after fade duration completes', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 100, max: 2000 }),
        (message, duration) => {
          const { result } = renderHook(() => useNotification());

          // Show notification
          act(() => {
            result.current.showSuccess(message, duration);
          });

          // Should be visible
          expect(result.current.notifications.length).toBe(1);

          // Advance time through duration and fade
          act(() => {
            vi.advanceTimersByTime(duration + 350); // duration + fade duration + buffer
          });

          // Should be removed
          expect(result.current.notifications.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should use correct fade duration from config', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.integer({ min: 100, max: 1000 }),
        (message, duration) => {
          const { result } = renderHook(() => useNotification());

          // Show notification
          act(() => {
            result.current.showInfo(message, duration);
          });

          // Advance to fade-out state
          act(() => {
            vi.advanceTimersByTime(duration + 10);
          });

          // Should be fading out
          expect(result.current.notifications[0].fadeOut).toBe(true);

          // Advance time less than fade duration
          act(() => {
            vi.advanceTimersByTime(250); // Less than 300ms fade duration
          });

          // Should still be in DOM (fading)
          expect(result.current.notifications.length).toBe(1);

          // Advance past fade duration
          act(() => {
            vi.advanceTimersByTime(100);
          });

          // Should be removed
          expect(result.current.notifications.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should clear all notifications immediately when clearNotifications is called', () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 30 }), {
          minLength: 2,
          maxLength: 5,
        }),
        (messages) => {
          const { result } = renderHook(() => useNotification());

          // Queue multiple notifications
          act(() => {
            messages.forEach((message) => {
              result.current.showError(message, 1000);
            });
          });

          // Should have at least one visible
          expect(result.current.notifications.length).toBeGreaterThan(0);

          // Clear all notifications
          act(() => {
            result.current.clearNotifications();
          });

          // Should be empty immediately
          expect(result.current.notifications.length).toBe(0);

          // Advancing time should not show any more notifications
          act(() => {
            vi.advanceTimersByTime(5000);
          });

          expect(result.current.notifications.length).toBe(0);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });
});
